// deno-lint-ignore-file
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight explicitly with a 200 OK
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) throw new Error("Missing GEMINI_API_KEY");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    const payload = await req.json().catch(() => ({}));
    const period_type = payload.period_type || "weekly";

    // Telemetry gathering
    const [
      { data: profiles },
      { data: lifestyles },
      { data: logs },
    ] = await Promise.all([
      supabaseAdmin.from("user_profiles").select(
        "user_id, location, role, monthly_co2_target",
      ),
      supabaseAdmin.from("lifestyle_profiles").select(
        "user_id, diet_type, commute_type",
      ),
      supabaseAdmin.from("activity_logs").select(
        "user_id, total_co2e, logged_at, emission_factors ( category )",
      ),
    ]);

    const standardUsers = profiles?.filter((p: any) => p.role !== "admin") ||
      [];
    const activeUsers = standardUsers.length;

    const validTargets = standardUsers.filter((p: any) =>
      p.monthly_co2_target > 0
    );
    const avgTarget = validTargets.length
      ? Math.round(
        validTargets.reduce(
          (sum: number, p: any) => sum + Number(p.monthly_co2_target),
          0,
        ) / validTargets.length,
      )
      : 0;

    let totalCo2 = 0;
    let trailing7DaysCo2 = 0;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const categoryMap: Record<string, number> = {};
    const locationMap: Record<string, number> = {};

    logs?.forEach((log: any) => {
      const co2 = parseFloat(log.total_co2e) || 0;
      totalCo2 += co2;

      if (new Date(log.logged_at) >= sevenDaysAgo) {
        trailing7DaysCo2 += co2;
      }

      const cat = log.emission_factors?.category || "Other";
      categoryMap[cat] = (categoryMap[cat] || 0) + co2;

      const owner = standardUsers.find((p: any) => p.user_id === log.user_id);
      const loc = owner?.location || "Unspecified";
      locationMap[loc] = (locationMap[loc] || 0) + co2;
    });

    const countFreq = (arr: any[], key: string) =>
      arr?.reduce((acc: Record<string, number>, item: any) => {
        if (item && item[key]) {
          acc[item[key]] = (acc[item[key]] || 0) + 1;
        }
        return acc;
      }, {}) || {};

    const dietCounts = countFreq(lifestyles || [], "diet_type");
    const commuteCounts = countFreq(lifestyles || [], "commute_type");

    const formatTopEntries = (mapObj: Record<string, number>, unit: string) =>
      Object.entries(mapObj)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 3)
        .map(([k, v]) =>
          `${k} (${typeof v === "number" ? v.toFixed(1) : v} ${unit})`
        )
        .join(", ") || "None recorded";

    const topSectorsText = formatTopEntries(categoryMap, "kg CO2e");
    const topLocationsText = formatTopEntries(locationMap, "kg CO2e");
    const topCommutesText = formatTopEntries(commuteCounts, "users");
    const topDietsText = formatTopEntries(dietCounts, "users");

    const prompt = `
You are the Chief Sustainability & Systems Architect for CarbonSense deployed in Cavite (2026).
Analyze this live telemetry and deliver an executive console briefing.

Telemetry:
- Monitored Accounts: ${activeUsers} (Average Target: ${avgTarget} kg CO2e/user/month)
- Gross Footprint: ${totalCo2.toFixed(1)} kg CO2e | Trailing 7-Day Velocity: ${
      trailing7DaysCo2.toFixed(1)
    } kg CO2e
- Sector Breakdown: ${topSectorsText}
- Geographic Hotspots: ${topLocationsText}
- Lifestyle Profiles: Commute (${topCommutesText}), Diet (${topDietsText})

Output Rules:
- STRICTLY NO intros, headers like "To/From", memos, sign-offs, or self-correction commentary.
- Do not ramble. Be sharp, diagnostic, and direct.
- Return EXACTLY 3 clean sections formatted in standard markdown:

### 1. Diagnostic Summary
Provide 2-3 concise bullet points explaining what the numbers actually mean (e.g., severe under-logging vs authentic reduction, sector disconnects like driving habits vs recorded transport).

### 2. Priority Bottlenecks
Provide 2 concise bullet points identifying the #1 structural friction point (e.g., commute logging drop-off in Imus/Dasmariñas) and uncharacterized demographic groups.

### 3. Prescribed Interventions
- **Task to Inject 1:** [Tier: Gold/Silver/Bronze | Tag: Commute/Diet/Energy] "Task description" (AI Vision criteria: "exact prompt")
- **Task to Inject 2:** [Tier: Gold/Silver/Bronze | Tag: Commute/Diet/Energy] "Task description" (AI Vision criteria: "exact prompt")
- **Factor Audit:** One specific multiplier or measurement unit in the matrix that needs recalibration.
- **Community Policy:** One concrete gamification rule or nudge to activate this week.
`;

    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
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

    const { error: dbError } = await supabaseAdmin
      .from("system_prescriptions")
      .insert([{
        period_type: "weekly",
        prescription_text: generatedText.trim(),
      }]);

    if (dbError) throw dbError;

    return new Response(
      JSON.stringify({
        success: true,
        advisory: generatedText.trim(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
