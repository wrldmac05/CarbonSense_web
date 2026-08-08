import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, password, fullName, securityCode } = await req.json();

    // 1. Check Passcode on the SERVER side
    const MASTER_PASSCODE = Deno.env.get("ADMIN_MASTER_PASSCODE");
    if (!securityCode || securityCode !== MASTER_PASSCODE) {
      return new Response(
        JSON.stringify({
          error: "Invalid Master Passcode. Authorization denied.",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 2. Initialize Supabase Admin Client (Service Role Key)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 3. Create the user
    const { data: authData, error: authError } = await supabaseAdmin.auth
      .signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

    if (authError) throw authError;
    if (!authData.user) throw new Error("User creation failed.");

    // 4. Execute elevate_to_admin safely via Service Role
    const { error: rpcError } = await supabaseAdmin.rpc("elevate_to_admin", {
      target_user_id: authData.user.id,
    });

    if (rpcError) throw rpcError;

    return new Response(
      JSON.stringify({ message: "Admin provisioned successfully!" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "An unknown error occurred." }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
