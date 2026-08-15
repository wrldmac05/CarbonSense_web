// supabase/functions/generate-insight/index.ts
// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  try {
    console.log("1. Waking up AI Edge Function...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const geminiKey = Deno.env.get("GEMINI_API_KEY");

    if (!supabaseUrl || !supabaseKey || !geminiKey) {
      throw new Error("Missing API Keys! Check your Supabase Secrets.");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("2. Fetching Community stats & categories...");

    // Get User Count
    const { data: profiles, error: userErr } = await supabase.from(
      "user_profiles",
    ).select("user_id");
    if (userErr) throw new Error("DB Error (Profiles): " + userErr.message);
    const userCount = profiles?.length || 0;

    // Get Logs WITH Categories
    const { data: logs, error: logErr } = await supabase.from("activity_logs")
      .select(`
      total_co2e,
      emission_factors ( category )
    `);
    if (logErr) throw new Error("DB Error (Logs): " + logErr.message);

    // Calculate Total CO2 and Category Breakdown
    let totalCO2 = 0;
    const categoryTotals: Record<string, number> = {};

    logs?.forEach((log: any) => {
      const co2 = Number(log.total_co2e) || 0;
      totalCO2 += co2;

      const category = log.emission_factors?.category || "Uncategorized";
      categoryTotals[category] = (categoryTotals[category] || 0) + co2;
    });

    const categoryText = Object.entries(categoryTotals)
      .map(([cat, val]) => `${cat} (${Math.round(val)} kg)`)
      .join(", ");

    // 🟢 NEW: Fetch Completed Tasks & Calculate Total CO2 Saved
    console.log("Fetching completed tasks...");
    const { data: completedTasks, error: taskErr } = await supabase
      .from("user_tasks")
      .select(`
        tasks_dictionary ( co2_saved_estimate )
      `)
      .eq("is_completed", true);

    if (taskErr) throw new Error("DB Error (Tasks): " + taskErr.message);

    let totalCO2Saved = 0;
    completedTasks?.forEach((task: any) => {
      // Safely extract the estimate, defaulting to 0 if missing
      const saved = Number(task.tasks_dictionary?.co2_saved_estimate) || 0;
      totalCO2Saved += saved;
    });

    console.log(
      `Stats gathered: ${userCount} users, ${totalCO2} kg CO2 emitted, ${totalCO2Saved} kg CO2 saved.`,
    );

    // 🟢 THE V2 UPGRADED PROMPT
    const prompt = `
      You are an expert Data Analyst providing a daily dashboard summary for the CarbonSense community in Cavite.
      
      Today's Data:
      - Total Eco-Warriors (Users): ${userCount}
      - Total CO2 Emitted: ${Math.round(totalCO2)} kg
      - Total CO2 Prevented (via Completed Tasks): ${totalCO2Saved} kg
      - Emissions by Category Breakdown: ${categoryText}
      
      Task: Write a highly engaging, professional 3-to-4 sentence executive summary based on this data.
      
      Strict Rules:
      - DO NOT introduce yourself.
      - DO NOT start with "CarbonSense, based in Cavite..." or anything similar. 
      - Jump straight into the insights. Start immediately with an observation about the relationship between the emissions and the prevented CO2.
      - Acknowledge the highest emission category and offer a quick, realistic 1-sentence tip on how the community can reduce it tomorrow.
      - Celebrate the community's effort in completing tasks if the "Total CO2 Prevented" is greater than 0.
      - Keep the tone inspiring, analytical, and modern. Do not use hashtags or emojis.
    `;

    console.log("3. Sending prompt to Google Gemini 2.5 Flash...");
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
      throw new Error(`Google API Rejected Request: ${rawAiText}`);
    }

    const aiData = JSON.parse(rawAiText);
    const generatedText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error("Google API succeeded, but returned no text!");
    }

    console.log("4. Saving to database...");
    const { error: insertErr } = await supabase.from("global_insights").insert([
      { insight_text: generatedText },
    ]);
    if (insertErr) throw new Error("DB Error (Insert): " + insertErr.message);

    console.log("5. Success! New Summary Generated.");
    return new Response(
      JSON.stringify({ success: true, text: generatedText }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("CRITICAL ERROR: ", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
