/*
  Activity log and agent tasks (spec 7.2, 7.3, 8.3).
  - logActivity: append-only record of who did what (user, agent, mcp, guardian).
  - createAgentTask: any public or paid action the agent proposes becomes a task
    with status pending_approval. Nothing runs until the user approves it.
*/
import { supabaseAdmin } from "./supabaseServer.js";

export type Actor = "user" | "agent" | "mcp" | "guardian" | "system";
export type TaskSource = "briefing" | "chat" | "scheduled" | "mcp" | "guardian";

export async function logActivity(
  userId: string,
  actor: Actor,
  action: string,
  objectType?: string,
  objectId?: string,
  detail: Record<string, unknown> = {}
): Promise<void> {
  try {
    await supabaseAdmin.from("activity_log").insert({
      user_id: userId,
      actor,
      action,
      object_type: objectType || null,
      object_id: objectId || null,
      detail,
    });
  } catch (e: any) {
    // Logging must never break the action it records
    console.error("[activity] log failed:", e?.message);
  }
}

export interface NewTask {
  kind: string;
  title: string;
  detail?: string;
  payload?: Record<string, unknown>;
  evidence?: Array<{ label: string; url?: string; metric?: string; value?: string | number }>;
  createdBy?: TaskSource;
  /** Same key twice for one user is ignored, so a recurring check never piles up duplicates */
  dedupeKey?: string;
}

export async function createAgentTask(userId: string, t: NewTask) {
  const row = {
    user_id: userId,
    kind: t.kind,
    title: t.title.slice(0, 200),
    detail: t.detail?.slice(0, 2000) || null,
    payload: t.payload || {},
    evidence: t.evidence || [],
    created_by: t.createdBy || "briefing",
    dedupe_key: t.dedupeKey || null,
    status: "pending_approval",
  };
  if (t.dedupeKey) {
    const { data: existing } = await supabaseAdmin
      .from("agent_tasks")
      .select("id, status")
      .eq("user_id", userId)
      .eq("dedupe_key", t.dedupeKey)
      .maybeSingle();
    if (existing) return { task: existing, created: false };
  }
  const { data, error } = await supabaseAdmin.from("agent_tasks").insert(row).select().single();
  if (error) {
    // Unique index race: another run created it first
    if ((error as any).code === "23505") return { task: null, created: false };
    throw new Error(error.message);
  }
  await logActivity(userId, t.createdBy === "mcp" ? "mcp" : t.createdBy === "guardian" ? "guardian" : "agent", "task.proposed", "agent_task", data.id, { kind: t.kind, title: t.title });
  return { task: data, created: true };
}
