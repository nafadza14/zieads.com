import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    "[Supabase Server] Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. DB writes will fail."
  );
}

// Service role client bypasses RLS — only use on the server
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Extract user ID from the Authorization header JWT
export async function getUserIdFromRequest(
  req: any
): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.replace("Bearer ", "");
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

// ─── Helpers ─────────────────────────────────────────────

export async function saveAudit(params: {
  userId: string;
  url: string;
  businessName: string;
  auditType: string;
  overallScore: number;
  grade: string;
  dimensions: any;
  findings: any;
  agentResults: any;
  report: any;
}) {
  const { error } = await supabaseAdmin.from("audits").insert({
    user_id: params.userId,
    url: params.url,
    business_name: params.businessName,
    audit_type: params.auditType,
    overall_score: params.overallScore,
    grade: params.grade,
    dimensions: params.dimensions,
    findings: params.findings,
    agent_results: params.agentResults,
    report: params.report,
  });
  if (error) console.error("[DB] Failed to save audit:", error.message);
  return !error;
}

export async function saveSkillResult(params: {
  userId: string;
  skillName: string;
  url: string;
  result: any;
}) {
  const { error } = await supabaseAdmin.from("skill_results").insert({
    user_id: params.userId,
    skill_name: params.skillName,
    url: params.url,
    result: params.result,
  });
  if (error) console.error("[DB] Failed to save skill result:", error.message);
  return !error;
}

export async function getUserAudits(userId: string, limit = 20) {
  const { data, error } = await supabaseAdmin
    .from("audits")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[DB] Failed to fetch audits:", error.message);
    return [];
  }
  return data || [];
}

export async function getLatestAudit(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("audits")
    .select("*")
    .eq("user_id", userId)
    .eq("audit_type", "full")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  if (error) return null;
  return data;
}

export async function upsertProfile(userId: string, profile: any) {
  const { error } = await supabaseAdmin.from("profiles").upsert(
    {
      id: userId,
      business_name: profile.businessName,
      business_type: profile.businessType,
      primary_goal: profile.primaryGoal,
      monthly_budget: profile.monthlyBudget,
      platforms: profile.platforms || [],
      primary_url: profile.primaryUrl,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
  if (error) console.error("[DB] Failed to upsert profile:", error.message);
  return !error;
}

export async function getProfile(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) return null;
  return data;
}

export async function getUserSkillResults(userId: string, limit = 20) {
  const { data, error } = await supabaseAdmin
    .from("skill_results")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return data || [];
}

export async function getBenchmarkAverages() {
  // Pull all full audits to calculate the global average
  // In a real application, we would use a Supabase RPC or materialized view for scale.
  const { data, error } = await supabaseAdmin
    .from("audits")
    .select("overall_score")
    .eq("audit_type", "full");

  if (error || !data || data.length === 0) return { globalAverage: 65, totalScanned: 0 };

  const sum = data.reduce((acc, curr) => acc + (curr.overall_score || 0), 0);
  const globalAverage = Math.round(sum / data.length);
  
  return {
    globalAverage,
    totalScanned: data.length
  };
}

export async function getUserUsageCount(userId: string): Promise<number> {
  const { count: auditCount } = await supabaseAdmin
    .from("audits")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
    
  const { count: skillCount } = await supabaseAdmin
    .from("skill_results")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
    
  return (auditCount || 0) + (skillCount || 0);
}
