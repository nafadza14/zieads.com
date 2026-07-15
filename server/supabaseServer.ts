import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    "[Supabase Server] Missing VITE_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. DB writes will fail."
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
  const existing = await getProfile(userId);
  const dataToUpsert = {
    id: userId,
    business_name: profile.businessName !== undefined ? profile.businessName : (existing?.business_name || null),
    business_type: profile.businessType !== undefined ? profile.businessType : (existing?.business_type || null),
    primary_goal: profile.primaryGoal !== undefined ? profile.primaryGoal : (existing?.primary_goal || null),
    monthly_budget: profile.monthlyBudget !== undefined ? profile.monthlyBudget : (existing?.monthly_budget || null),
    platforms: profile.platforms !== undefined ? (profile.platforms || []) : (existing?.platforms || []),
    primary_url: profile.primaryUrl !== undefined ? profile.primaryUrl : (profile.primary_url !== undefined ? profile.primary_url : (existing?.primary_url || null)),
    challenge: profile.challenge !== undefined ? profile.challenge : (existing?.challenge || null),
    
    // New 0.3 Onboarding fields
    role: profile.role !== undefined ? profile.role : (existing?.role || null),
    goals: profile.goals !== undefined ? (profile.goals || []) : (existing?.goals || []),
    current_tools: profile.currentTools !== undefined ? (profile.currentTools || []) : (profile.current_tools !== undefined ? (profile.current_tools || []) : (existing?.current_tools || [])),
    account_volume: profile.accountVolume !== undefined ? profile.accountVolume : (profile.account_volume !== undefined ? profile.account_volume : (existing?.account_volume || null)),
    platforms_in_focus: profile.platformsInFocus !== undefined ? (profile.platformsInFocus || []) : (profile.platforms_in_focus !== undefined ? (profile.platforms_in_focus || []) : (existing?.platforms_in_focus || [])),
    onboarding_completed_at: profile.onboardingCompletedAt !== undefined ? profile.onboardingCompletedAt : (profile.onboarding_completed_at !== undefined ? profile.onboarding_completed_at : (existing?.onboarding_completed_at || null)),
    onboarding_step: profile.onboardingStep !== undefined ? profile.onboardingStep : (profile.onboarding_step !== undefined ? profile.onboarding_step : (existing?.onboarding_step || 1)),
    has_completed_onboarding: profile.hasCompletedOnboarding !== undefined ? profile.hasCompletedOnboarding : (profile.has_completed_onboarding !== undefined ? profile.has_completed_onboarding : (existing?.has_completed_onboarding || false)),
    
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin.from("profiles").upsert(dataToUpsert, { onConflict: "id" });
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

// ─── AI Agent Chat ────────────────────────────────────────────────────────────

export async function createConversation(userId: string, title: string, contextUrl?: string) {
  const { data, error } = await supabaseAdmin
    .from("agent_conversations")
    .insert({ user_id: userId, title, context_url: contextUrl || null })
    .select()
    .single();
  if (error) { console.error("[DB] Failed to create conversation:", error.message); return null; }
  return data;
}

export async function getConversations(userId: string, limit = 20) {
  const { data, error } = await supabaseAdmin
    .from("agent_conversations")
    .select("id, title, context_url, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) { console.error("[DB] Failed to fetch conversations:", error.message); return []; }
  return data || [];
}

export async function getConversationMessages(conversationId: string, userId: string) {
  const { data, error } = await supabaseAdmin
    .from("agent_messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) { console.error("[DB] Failed to fetch messages:", error.message); return []; }
  return data || [];
}

export async function saveMessage(params: {
  conversationId: string;
  userId: string;
  role: "user" | "assistant";
  content: string;
}) {
  const { error } = await supabaseAdmin.from("agent_messages").insert({
    conversation_id: params.conversationId,
    user_id: params.userId,
    role: params.role,
    content: params.content,
  });
  if (error) console.error("[DB] Failed to save message:", error.message);

  // Update conversation updated_at
  await supabaseAdmin
    .from("agent_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", params.conversationId);

  return !error;
}

export async function deleteConversation(conversationId: string, userId: string) {
  const { error } = await supabaseAdmin
    .from("agent_conversations")
    .delete()
    .eq("id", conversationId)
    .eq("user_id", userId);
  if (error) console.error("[DB] Failed to delete conversation:", error.message);
  return !error;
}

export async function getAgentMessageCount(userId: string): Promise<number> {
  const month = new Date().toISOString().slice(0, 7); // "2026-04"
  const { data } = await supabaseAdmin
    .from("agent_usage")
    .select("count")
    .eq("user_id", userId)
    .eq("month", month)
    .single();
  return data?.count || 0;
}

export async function incrementAgentUsage(userId: string): Promise<void> {
  const month = new Date().toISOString().slice(0, 7);
  const { error } = await supabaseAdmin.rpc("increment_agent_usage", { p_user_id: userId, p_month: month });
  if (error) {
    // Fallback: upsert manually if RPC doesn't exist yet
    const current = await getAgentMessageCount(userId);
    await supabaseAdmin
      .from("agent_usage")
      .upsert({ user_id: userId, month, count: current + 1 }, { onConflict: "user_id,month" });
  }
}

export async function getRecentAuditContext(userId: string): Promise<string> {
  const { data } = await supabaseAdmin
    .from("audits")
    .select("url, business_name, overall_score, grade, findings, report, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(3);

  if (!data || data.length === 0) return "No audit history available yet.";

  return data.map((a, i) => {
    const findings = (a.findings || []).slice(0, 5).map((f: any) => `  - [${f.severity || 'INFO'}] ${f.title || f}`).join("\n");
    return `Audit ${i + 1}: ${a.business_name || a.url} (${new Date(a.created_at).toDateString()})
  Score: ${a.overall_score}/100 (Grade ${a.grade})
  Top findings:\n${findings || "  None"}`;
  }).join("\n\n");
}

export async function isTestUser(userId: string): Promise<boolean> {
  try {
    const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
    return data?.user?.email === "ceo@zieads.com";
  } catch {
    return false;
  }
}

export async function deductCredits(
  userId: string,
  pool: "ai_chat_daily" | "skill_run_monthly",
  amount: number,
  operationId: string
) {
  try {
    const { data: planRes } = await supabaseAdmin
      .from("user_plan")
      .select("plan_id")
      .eq("user_id", userId)
      .maybeSingle();
    const planId = planRes?.plan_id || "free";

    const { data, error } = await supabaseAdmin.rpc("atomic_deduct_credits", {
      p_user_id: userId,
      p_pool: pool,
      p_amount: amount,
      p_operation_id: operationId,
      p_plan_id: planId,
    });
    if (error) throw error;
    return data;
  } catch (e: any) {
    console.error(`[Credits] Failed to deduct ${amount} credits from pool ${pool}:`, e.message);
    return null;
  }
}

