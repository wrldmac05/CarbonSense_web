import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// --- Rate limiting config -------------------------------------------------
const RATE_LIMIT_WINDOW_MINUTES = 15;
const RATE_LIMIT_MAX_FAILURES = 5;

// Approved origins for redirects to prevent open-redirect vulnerabilities
const ALLOWED_REDIRECT_ORIGINS = [
  "https://carbonsense-web.vercel.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return "unknown";
}

function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const aBytes = enc.encode(a);
  const bBytes = enc.encode(b);

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

function sanitizeRedirectUrl(rawUrl: unknown): string {
  const defaultUrl = "https://carbonsense-web.vercel.app/login";
  if (typeof rawUrl !== "string" || !rawUrl.trim()) return defaultUrl;

  try {
    const parsed = new URL(rawUrl);
    const matchesAllowed = ALLOWED_REDIRECT_ORIGINS.some((origin) =>
      parsed.origin === origin
    );
    return matchesAllowed ? rawUrl : defaultUrl;
  } catch {
    return defaultUrl;
  }
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
    // 0. Rate limit check
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

    const { email, password, fullName, securityCode, redirectTo } = await req
      .json();

    const recordAttempt = (success: boolean) =>
      supabaseAdmin
        .from("admin_provision_attempts")
        .insert({ ip, success })
        .then(({ error }) => {
          if (error) console.error("Failed to record attempt:", error.message);
        });

    // 1. Verify Passcode
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

    // 2. Input validation
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

    // 3. Resolve confirmed email redirect target
    const validatedRedirectUrl = sanitizeRedirectUrl(redirectTo);

    // 4. Create the user with email redirect configured
    const { data: authData, error: authError } = await supabaseAdmin.auth
      .signUp({
        email,
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: validatedRedirectUrl,
        },
      });

    if (authError) {
      await recordAttempt(false);
      console.error("Admin signUp error:", authError.message);
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

    // 5. Elevate to admin role
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
