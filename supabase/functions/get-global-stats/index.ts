import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // 1. Handle CORS for the React frontend
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 2. Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // 3. Fetch all required tables in parallel for maximum speed
    const [
      { data: users, error: usersError },
      { data: profiles, error: profilesError },
      { data: lifestyles, error: lifestylesError },
      { data: logs, error: logsError },
    ] = await Promise.all([
      supabaseAdmin.from("users").select("created_at"),
      supabaseAdmin.from("user_profiles").select(
        "location, monthly_co2_target",
      ),
      supabaseAdmin.from("lifestyle_profiles").select(
        "diet_type, commute_type",
      ),
      supabaseAdmin.from("activity_logs").select(`
        total_co2e, 
        logged_at, 
        emission_factors ( category )
      `),
    ]);

    if (usersError) throw usersError;
    if (profilesError) throw profilesError;
    if (lifestylesError) throw lifestylesError;
    if (logsError) throw logsError;

    // --- 4. DATA AGGREGATION LOGIC ---

    const totalUsers = users?.length || 0;

    // Helper function to count frequencies (handles Typescript strictness)
    const countFreq = (arr: any[], key: string) => {
      return arr?.reduce<Record<string, number>>((acc, item) => {
        const val = item[key];
        if (val) acc[val] = (acc[val] || 0) + 1;
        return acc;
      }, {}) || {};
    };

    const diets = countFreq(lifestyles || [], "diet_type");
    const commutes = countFreq(lifestyles || [], "commute_type");
    const locations = countFreq(profiles || [], "location");

    // Average Target
    const validTargets = profiles?.filter((p: any) =>
      p.monthly_co2_target && p.monthly_co2_target > 0
    ) || [];
    const avgTarget = validTargets.length
      ? validTargets.reduce((sum: number, p: any) =>
        sum + Number(p.monthly_co2_target), 0) / validTargets.length
      : 0;

    // CO2 Totals and Categories
    let totalCO2 = 0;
    const catTotals: Record<string, number> = {};
    const emissionCountsByMonth: Record<string, number> = {};

    logs?.forEach((log: any) => {
      const co2 = Number(log.total_co2e) || 0;
      totalCO2 += co2;

      // Category breakdown
      // Supabase returns foreign key relations as nested objects or arrays of objects
      const categoryRaw = log.emission_factors;
      let cat = "Other";
      if (categoryRaw) {
        cat = Array.isArray(categoryRaw)
          ? categoryRaw[0]?.category
          : categoryRaw.category;
      }
      catTotals[cat] = (catTotals[cat] || 0) + co2;

      // Track emissions by month
      if (log.logged_at) {
        const date = new Date(log.logged_at);
        const month = date.toLocaleString("default", { month: "short" });
        emissionCountsByMonth[month] = (emissionCountsByMonth[month] || 0) +
          co2;
      }
    });

    const categoryData = Object.entries(catTotals).map(([name, value]) => ({
      name: name || "Other",
      value: Math.round(value),
    }));

    // Generate the last 6 months timeline dynamically
    const timeline: string[] = [];
    const d = new Date();
    for (let i = 5; i >= 0; i--) {
      const pastDate = new Date(d.getFullYear(), d.getMonth() - i, 1);
      timeline.push(pastDate.toLocaleString("default", { month: "short" }));
    }

    // Cumulative Users per month
    const userCountsByMonth: Record<string, number> = {};
    users?.forEach((u: any) => {
      if (u.created_at) {
        const month = new Date(u.created_at).toLocaleString("default", {
          month: "short",
        });
        userCountsByMonth[month] = (userCountsByMonth[month] || 0) + 1;
      }
    });

    let cumulative = 0;
    const monthlyUsers = timeline.map((month) => {
      cumulative += userCountsByMonth[month] || 0;
      return { month, users: cumulative };
    });

    const monthlyEmissions = timeline.map((month) => ({
      month,
      co2: Math.round(emissionCountsByMonth[month] || 0),
    }));

    // 5. Package the final secure payload
    const securePayload = {
      totalUsers,
      totalCO2: Math.round(totalCO2 * 10) / 10,
      avgTarget: Math.round(avgTarget),
      monthlyUsers,
      monthlyEmissions,
      categoryData,
      diets,
      commutes,
      locations,
    };

    return new Response(JSON.stringify(securePayload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : "An unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
