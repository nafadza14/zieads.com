/*
  Scheduled agents (spec 7.3): recurring prompts the user sets up, for example
  "Every Monday at 08:00, review last week and draft 3 posts". Each run uses the
  same agent and tools as the chat, so anything it creates is a draft. The answer
  is stored as an agent task (created_by 'scheduled') the user reads and closes.
*/
import { supabaseAdmin, getProfile, getEffectivePlan } from "../supabaseServer.js";
import { PLAN_LIMITS } from "../creditConfig.js";
import { createAgentTask, logActivity } from "../activity.js";
import { zonedToUtc } from "../publish/bulkCsv.js";
import { localNow } from "../briefing/briefing.js";

export type Cadence = "hourly" | "daily" | "weekly";

/** Next run strictly after `from`, in the user's time zone. Pure, exported for tests. */
export function nextRun(cadence: Cadence, runAt: string, weekday: number | null, timeZone: string, from = new Date()): Date {
  if (cadence === "hourly") {
    const minute = Number(runAt.split(":")[1] || 0);
    const d = new Date(from);
    d.setUTCSeconds(0, 0);
    // Most zones have whole-hour offsets, so the minute of the hour is the same in UTC
    d.setUTCMinutes(minute);
    if (d <= from) d.setUTCHours(d.getUTCHours() + 1);
    return d;
  }
  const today = localNow(timeZone, from);
  for (let i = 0; i <= 8; i++) {
    const probe = new Date(Date.parse(`${today.date}T12:00:00Z`) + i * 86400000);
    const date = probe.toISOString().slice(0, 10);
    const wd = probe.getUTCDay();
    if (cadence === "weekly" && weekday !== null && weekday !== undefined && wd !== weekday) continue;
    const iso = zonedToUtc(date, runAt, timeZone);
    if (iso && new Date(iso) > from) return new Date(iso);
  }
  return new Date(from.getTime() + 86400000);
}

async function timeZoneOf(userId: string) {
  const { data } = await supabaseAdmin.from("user_settings").select("timezone").eq("user_id", userId).maybeSingle();
  return data?.timezone || "Asia/Jakarta";
}

export async function scheduleNext(row: any, from = new Date()) {
  const tz = await timeZoneOf(row.user_id);
  return nextRun(row.cadence, row.run_at, row.weekday ?? null, tz, from).toISOString();
}

/** Runs one scheduled agent now. Returns the stored task id. */
export async function runScheduledAgent(row: any, budgetMs = 30000, manual = false): Promise<{ ok: boolean; task_id?: string; error?: string }> {
  const plan = await getEffectivePlan(row.user_id);
  const limit = PLAN_LIMITS[plan].scheduledAgents;
  if (limit === 0) {
    await supabaseAdmin.from("scheduled_agents").update({ is_active: false }).eq("id", row.id);
    return { ok: false, error: "This plan does not include scheduled agents." };
  }
  const started = new Date();
  // Claim the run first, so two heartbeats never run the same agent twice. Moving next_run_at into the
  // future inside the same UPDATE means a second claimer no longer matches the due filter.
  const next = await scheduleNext(row, started);
  let claim = supabaseAdmin
    .from("scheduled_agents")
    .update({ last_run_at: started.toISOString(), next_run_at: next })
    .eq("id", row.id)
    .eq("is_active", true);
  claim = manual
    ? claim.or(`last_run_at.is.null,last_run_at.lt.${new Date(started.getTime() - 60000).toISOString()}`)
    : claim.lte("next_run_at", started.toISOString());
  const { data: claimed } = await claim.select("id").maybeSingle();
  if (!claimed) return { ok: false, error: "Already running" };

  try {
    const [{ runAgent, AGENT_INSTRUCTIONS }, { buildSystemPrompt }, { getBrandProfile, brandProfileToPrompt }] = await Promise.all([
      import("../agent/runtime.js"),
      import("../routes/api-agent.js"),
      import("../brandProfile.js"),
    ]);
    const [profile, brand, tz] = await Promise.all([getProfile(row.user_id), getBrandProfile(row.user_id), timeZoneOf(row.user_id)]);
    const l = localNow(tz, started);
    const system = `${buildSystemPrompt(profile)}${brandProfileToPrompt(brand)}\n${AGENT_INSTRUCTIONS}\n\nThis is a scheduled run named "${row.name}". The user is not watching: finish the work, keep everything you create as drafts, and end with a short summary of what you did and what needs their approval. User's local time now: ${l.date} ${l.time} (${tz}).`;
    const { text, artifacts } = await runAgent({ userId: row.user_id, system, history: [], userContent: row.prompt, emit: () => {}, budgetMs, maxRounds: 6 });
    const r = await createAgentTask(row.user_id, {
      kind: "scheduled_report",
      title: `${row.name}: results`,
      detail: text.slice(0, 2000),
      payload: { scheduled_agent_id: row.id, text: text.slice(0, 12000), artifacts, next: "/agent" },
      createdBy: "scheduled",
      dedupeKey: `scheduled:${row.id}:${started.toISOString().slice(0, 16)}`,
    });
    await logActivity(row.user_id, "agent", "scheduled_agent.ran", "scheduled_agent", row.id, { name: row.name, task_id: (r.task as any)?.id });
    return { ok: true, task_id: (r.task as any)?.id };
  } catch (e: any) {
    await logActivity(row.user_id, "agent", "scheduled_agent.failed", "scheduled_agent", row.id, { name: row.name, error: String(e?.message || e).slice(0, 300) });
    return { ok: false, error: e?.message };
  }
}

/** Heartbeat step: run what is due, within the time budget */
export async function runDueScheduledAgents(budgetMs = 30000) {
  const start = Date.now();
  const { data } = await supabaseAdmin.from("scheduled_agents").select("*").eq("is_active", true).lte("next_run_at", new Date().toISOString()).order("next_run_at", { ascending: true }).limit(3);
  let ran = 0;
  for (const row of data || []) {
    const left = budgetMs - (Date.now() - start);
    if (left < 12000) break;
    const r = await runScheduledAgent(row, left - 2000);
    if (r.ok) ran++;
  }
  return { due: (data || []).length, ran };
}
