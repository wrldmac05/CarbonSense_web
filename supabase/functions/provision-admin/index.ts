import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// --- Rate limiting config -------------------------------------------------
// Requires a table (see migration note below):
//
//   create table if not exists admin_provision_attempts (
//     id bigint generated always as identity primary key,
//     ip text not null,
//     success boolean not null default false,
//     created_at timestamptz not null default now()
//   );
//   create index if not exists admin_provision_attempts_ip_created_idx
//     on admin_provision_attempts (ip, created_at);
//
// Without this table, the function will fail closed (deny the request)
// rather than silently skip rate limiting.
const RATE_LIMIT_WINDOW_MINUTES = 15;
const RATE_LIMIT_MAX_FAILURES = 5;

function getClientIp(req: Request): string {
  // Deno Deploy / most edge proxies set this. Fall back to a constant so
  // rate limiting still groups "unknown" requests together rather than
  // being bypassable by omitting the header.
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return "unknown";
}

// Constant-time string comparison to avoid leaking passcode length/prefix
// via response-timing side channels.
function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const aBytes = enc.encode(a);
  const bBytes = enc.encode(b);

  // Compare against a fixed-length buffer so length differences don't
  // short-circuit early.
  const maxLen = Math.max(aBytes.length, bBytes.length, 32);
  let diff = aBytes.length ^ bBytes.length;
  for (let i = 0; i < maxLen; i++) {
    const x = i < aBytes.length ? aBytes[i] : 0;
    const y = i < bBytes.length ? bBytes[i] : 0;
    diff |= x ^ y;
  }
  return diff === 0;
}

function isValidEmail(email: unknown): email is string {
  return typeof email === "string" && /^\S+@\S+\.\S+$/.test(email);
}

function isValidPassword(password: unknown): password is string {
  if (typeof password !== "string") return false;
  return (
    password.length >= 12 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const ip = getClientIp(req);

  try {
    // 0. Rate limit BEFORE touching the passcode at all, so brute-forcing
    // the passcode is actually throttled rather than just logged.
    const windowStart = new Date(
      Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
    ).toISOString();

    const { count: recentFailures, error: rateLimitError } = await supabaseAdmin
      .from("admin_provision_attempts")
      .select("id", { count: "exact", head: true })
      .eq("ip", ip)
      .eq("success", false)
      .gte("created_at", windowStart);

    if (rateLimitError) {
      // Fail CLOSED: if we can't verify the attempt history, don't allow
      // the request through unrate-limited.
      console.error("Rate limit check failed:", rateLimitError.message);
      return jsonResponse(
        { error: "Service temporarily unavailable. Please try again shortly." },
        503,
      );
    }

    if ((recentFailures ?? 0) >= RATE_LIMIT_MAX_FAILURES) {
      return jsonResponse(
        {
          error: "Too many attempts. Please wait before trying again.",
        },
        429,
      );
    }

    const { email, password, fullName, securityCode } = await req.json();

    const recordAttempt = (success: boolean) =>
      supabaseAdmin
        .from("admin_provision_attempts")
        .insert({ ip, success })
        .then(({ error }) => {
          if (error) console.error("Failed to record attempt:", error.message);
        });

    // 1. Check Passcode on the SERVER side (timing-safe, and only after
    // confirming a passcode was actually configured).
    const MASTER_PASSCODE = Deno.env.get("ADMIN_MASTER_PASSCODE");
    if (
      !MASTER_PASSCODE ||
      typeof securityCode !== "string" ||
      !timingSafeEqual(securityCode, MASTER_PASSCODE)
    ) {
      await recordAttempt(false);
      return jsonResponse(
        { error: "Invalid Master Passcode. Authorization denied." },
        401,
      );
    }

    // 2. Server-side input validation — never trust the client to have
    // enforced this (it can be bypassed entirely by calling this endpoint
    // directly).
    if (!isValidEmail(email)) {
      await recordAttempt(false);
      return jsonResponse({ error: "A valid email address is required." }, 400);
    }
    if (!isValidPassword(password)) {
      await recordAttempt(false);
      return jsonResponse(
        {
          error:
            "Password must be at least 12 characters and include an uppercase letter, a lowercase letter, and a number.",
        },
        400,
      );
    }
    if (typeof fullName !== "string" || !fullName.trim()) {
      await recordAttempt(false);
      return jsonResponse({ error: "Full name is required." }, 400);
    }

    // 3. Create the user
    const { data: authData, error: authError } = await supabaseAdmin.auth
      .signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

    if (authError) {
      await recordAttempt(false);
      console.error("Admin signUp error:", authError.message);
      // Don't leak raw Supabase/Postgres error text to the client.
      const msg = authError.message?.toLowerCase() || "";
      if (
        msg.includes("already registered") || msg.includes("already exists")
      ) {
        return jsonResponse(
          { error: "An account with this email already exists." },
          400,
        );
      }
      return jsonResponse(
        { error: "Could not create the account. Please try again." },
        400,
      );
    }
    if (!authData.user) {
      await recordAttempt(false);
      return jsonResponse(
        { error: "Could not create the account. Please try again." },
        400,
      );
    }

    // 4. Execute elevate_to_admin safely via Service Role
    const { error: rpcError } = await supabaseAdmin.rpc("elevate_to_admin", {
      target_user_id: authData.user.id,
    });

    if (rpcError) {
      await recordAttempt(false);
      console.error("elevate_to_admin error:", rpcError.message);
      return jsonResponse(
        {
          error:
            "Account was created but could not be elevated to admin. Please contact support.",
        },
        500,
      );
    }

    await recordAttempt(true);

    return jsonResponse({ message: "Admin provisioned successfully!" }, 200);
  } catch (err) {
    console.error("Unhandled error in provision-admin:", err);
    return jsonResponse(
      { error: "An unexpected error occurred. Please try again." },
      400,
    );
  }
});
