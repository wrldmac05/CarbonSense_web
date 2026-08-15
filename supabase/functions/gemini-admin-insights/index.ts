// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("1. Automated Admin AI Engine invoked...");

    // 🟢 1. Check for API Keys
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) throw new Error("Missing GEMINI_API_KEY");

    // Initialize Supabase Admin Client (Bypasses RLS)
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // 🟢 2. Parse the requested period (defaults to daily if not provided)
    const payload = await req.json().catch(() => ({}));
    const period_type = payload.period_type || "daily";
    console.log(`-> Generating ${period_type.toUpperCase()} prescription...`);

    // 🟢 3. AUTONOMOUS TELEMETRY GATHERING
    console.log("-> Fetching raw data from database...");
    const { data: profiles } = await supabaseAdmin.from("user_profiles").select(
      "user_id, location, role",
    );
    const { data: logs } = await supabaseAdmin.from("activity_logs").select(
      "user_id, total_co2e, emission_factors ( category )",
    );

    // Data Crunching
    const standardUsers = profiles?.filter((p: any) => p.role !== "admin") ||
      [];
    const activeUsers = standardUsers.length;
    let totalCo2 = 0;

    const categoryMap: Record<string, number> = {};
    const locationMap: Record<string, number> = {};

    logs?.forEach((log: any) => {
      const co2 = parseFloat(log.total_co2e) || 0;
      totalCo2 += co2;

      // Map Categories
      const cat = log.emission_factors?.category || "Unknown";
      categoryMap[cat] = (categoryMap[cat] || 0) + co2;

      // Map Locations
      const owner = standardUsers.find((p: any) => p.user_id === log.user_id);
      const loc = owner?.location || "Unspecified";
      locationMap[loc] = (locationMap[loc] || 0) + co2;
    });

    const topCategory = Object.keys(categoryMap).sort((a, b) =>
      categoryMap[b] - categoryMap[a]
    )[0] || "None";
    const topLocation = Object.keys(locationMap).sort((a, b) =>
      locationMap[b] - locationMap[a]
    )[0] || "None";

    const regionText = Object.entries(locationMap)
      .sort(([, a], [, b]) =>
        (b as number) - (a as number)
      )
      .slice(0, 3)
      .map(([name, co2], idx) =>
        `#${idx + 1} ${name}: ${Number(co2).toFixed(1)} kg CO2`
      )
      .join(", ") || "No regional data.";

    // 🟢 4. INJECT VARIABLES INTO YOUR PROMPT
    const prompt = `
      You are the Master AI Systems Director for CarbonSense, an enterprise-grade carbon mitigation platform deployed in Cavite for the year 2026.
      You are writing an internal ${period_type.toUpperCase()} Predictive Briefing for the System Administrator console. Do not write for the general public.

      Live Telemetry Inputs:
      - Cumulative Platform CO2: ${totalCo2.toFixed(1)} kg
      - Monitored Accounts: ${activeUsers}
      - Core Emission Accelerator Category: ${topCategory}
      - Highest Intensity Geographic Hub: ${topLocation}
      - Regional Leaderboard Matrix: ${regionText}

      Task: Generate a 4-to-5 sentence highly technical diagnostic report for the administrator's dashboard control window.
      
      Structural Requirements:
      1. [TREND ASSESSMENT]: Start with an immediate, data-driven diagnostic statement regarding total platform carbon velocity relative to the number of monitored accounts.
      2. [FORECASTING]: State a realistic mathematical prediction for next month's carbon numbers in the "${topCategory}" sector if no administrative changes occur.
      3. [HOTSPOT BREAKDOWN]: Analyze why the regional hub "${topLocation}" is leading the leaderboard matrix and what that indicates about local commuter or resource usage.
      4. [PRESCRIPTIVE ACTION]: Prescribe a concrete, actionable task intervention that the administrator should prioritize adding to the "Task Dictionary" to counter this specific surge.

      Rules:
      - Start directly with the text. Do not include titles, labels, or greetings.
      - Use professional, authoritative, system-operator phrasing.
      - Do not use markdown bullet points, bold markers, emojis, or hashtags. Keep it clean for console rendering.
    `;

    console.log("-> Dispatching telemetry bundle to Google Gemini Engine...");
    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      },
    );

    const rawAiText = await aiResponse.text();
    if (!aiResponse.ok) {
      throw new Error(`Google Gemini rejected request: ${rawAiText}`);
    }

    const aiData = JSON.parse(rawAiText);
    const generatedText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error("Gemini returned a 200 OK but body content was empty.");
    }

    // 🟢 5. AUTONOMOUSLY SAVE TO DATABASE
    console.log("-> Saving Prescription to system_prescriptions table...");
    const { error: dbError } = await supabaseAdmin
      .from("system_prescriptions")
      .insert([{ period_type, prescription_text: generatedText.trim() }]);

    if (dbError) throw dbError;

    console.log("✅ Success! Process complete.");
    return new Response(
      JSON.stringify({
        success: true,
        message: `Saved ${period_type} prescription to database.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("ADMIN AI CRITICAL ERROR: ", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
