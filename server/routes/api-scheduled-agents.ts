/*
  Scheduled agents (spec 7.3). Mounted at /api/v3.
  GET  /scheduled-agents            list with the latest result of each
  POST /scheduled-agents            create { name, prompt, cadence, run_at, weekday }
  POST /scheduled-agents/:id        update fields or { is_active }
  POST /scheduled-agents/:id/delete delete
  POST /scheduled-agents/:id/run    run now (counts as a normal run)
*/
import { Router } from "express";
import { getUserIdFromRequest, supabaseAdmin, getEffectivePlan } from "../supabaseServer.js";
import { PLAN_LIMITS } from "../creditConfig.js";
import { logActivity } from "../activity.js";
import { runScheduledAgent, scheduleNext } from "../agents/scheduled.js";

export const scheduledAgentsRouter = Router();

async function requireAuth(req: any, res: any, next: any) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Validates a create or update body. Exported for tests. */
export function cleanAgentInput(b: any, partial = false): { patch: Record<string, any>; error?: string } {
  const p: Record<string, any> = {};
  if (b.name !== undefined || !partial) {
    const n = String(b.name || "").trim();
    if (!n) return { patch: p, error: "Give the agent a name" };
    p.name = n.slice(0, 80);
  }
  if (b.prompt !== undefined || !partial) {
    const t = String(b.prompt || "").trim();
    if (t.length < 10) return { patch: p, error: "Describe the task in a sentence or more" };
    p.prompt = t.slice(0, 2000);
  }
  if (b.cadence !== undefined || !partial) {
    if (!["hourly", "daily", "weekly"].includes(b.cadence)) return { patch: p, error: "Cadence must be hourly, daily or weekly" };
    p.cadence = b.cadence;
  }
  if (b.run_at !== undefined || !partial) {
    const t = String(b.run_at || "08:00");
    if (!TIME.test(t)) return { patch: p, error: "Time must look like 08:00" };
    p.run_at = t;
  }
  if (b.weekday !== undefined) {
    const w = b.weekday === null ? null : Number(b.weekday);
    if (w !== null && !(Number.isInteger(w) && w >= 0 && w <= 6)) return { patch: p, error: "Pick a day of the week" };
    p.weekday = w;
  }
  if ((p.cadence || b.cadence) === "weekly" && (p.weekday ?? b.weekday) === undefined && !partial) p.weekday = 1;
  if (b.is_active !== undefined) p.is_active = !!b.is_active;
  return { patch: p };
}

async function limitFor(userId: string) {
  const plan = await getEffectivePlan(userId);
  return { plan, limit: PLAN_LIMITS[plan].scheduledAgents };
}

scheduledAgentsRouter.get("/scheduled-agents", requireAuth, async (req: any, res) => {
  const [{ data, error }, lim, tasks] = await Promise.all([
    supabaseAdmin.from("scheduled_agents").select("*").eq("user_id", req.userId).order("created_at", { ascending: true }),
    limitFor(req.userId),
    supabaseAdmin.from("agent_tasks").select("id, title, detail, payload, status, created_at").eq("user_id", req.userId).eq("created_by", "scheduled").order("created_at", { ascending: false }).limit(50),
  ]);
  if (error) return res.status(500).json({ error: error.message });
  const latest = new Map<string, any>();
  for (const t of tasks.data || []) {
    const id = (t.payload as any)?.scheduled_agent_id;
    if (id && !latest.has(id)) latest.set(id, { id: t.id, text: (t.payload as any)?.text || t.detail, status: t.status, created_at: t.created_at });
  }
  res.json({ success: true, plan: lim.plan, limit: lim.limit, agents: (data || []).map((a: any) => ({ ...a, last_result: latest.get(a.id) || null })) });
});

scheduledAgentsRouter.post("/scheduled-agents", requireAuth, async (req: any, res) => {
  const { patch, error } = cleanAgentInput(req.body || {});
  if (error) return res.status(400).json({ error });
  const lim = await limitFor(req.userId);
  const { count } = await supabaseAdmin.from("scheduled_agents").select("id", { count: "exact", head: true }).eq("user_id", req.userId);
  if (lim.limit !== -1 && (count || 0) >= lim.limit) {
    return res.status(403).json({ error: "PLAN_LIMIT", message: lim.limit === 0 ? "Scheduled agents start on the Starter plan." : `Your ${lim.plan} plan includes ${lim.limit} scheduled agents.` });
  }
  const row: any = { user_id: req.userId, ...patch, is_active: true };
  row.next_run_at = await scheduleNext(row);
  const { data, error: e } = await supabaseAdmin.from("scheduled_agents").insert(row).select().single();
  if (e) return res.status(500).json({ error: e.message });
  await logActivity(req.userId, "user", "scheduled_agent.created", "scheduled_agent", data.id, { name: data.name, cadence: data.cadence });
  res.json({ success: true, agent: data });
});

scheduledAgentsRouter.post("/scheduled-agents/:id", requireAuth, async (req: any, res) => {
  const { patch, error } = cleanAgentInput(req.body || {}, true);
  if (error) return res.status(400).json({ error });
  const { data: cur } = await supabaseAdmin.from("scheduled_agents").select("*").eq("id", req.params.id).eq("user_id", req.userId).maybeSingle();
  if (!cur) return res.status(404).json({ error: "Not found" });
  const merged = { ...cur, ...patch };
  if (patch.cadence || patch.run_at || patch.weekday !== undefined || patch.is_active === true) patch.next_run_at = await scheduleNext(merged);
  const { data, error: e } = await supabaseAdmin.from("scheduled_agents").update(patch).eq("id", cur.id).select().single();
  if (e) return res.status(500).json({ error: e.message });
  await logActivity(req.userId, "user", "scheduled_agent.updated", "scheduled_agent", cur.id, patch);
  res.json({ success: true, agent: data });
});

scheduledAgentsRouter.post("/scheduled-agents/:id/delete", requireAuth, async (req: any, res) => {
  const { data } = await supabaseAdmin.from("scheduled_agents").delete().eq("id", req.params.id).eq("user_id", req.userId).select("id, name").maybeSingle();
  if (!data) return res.status(404).json({ error: "Not found" });
  await logActivity(req.userId, "user", "scheduled_agent.deleted", "scheduled_agent", data.id, { name: data.name });
  res.json({ success: true });
});

scheduledAgentsRouter.post("/scheduled-agents/:id/run", requireAuth, async (req: any, res) => {
  const { data: row } = await supabaseAdmin.from("scheduled_agents").select("*").eq("id", req.params.id).eq("user_id", req.userId).maybeSingle();
  if (!row) return res.status(404).json({ error: "Not found" });
  if (!row.is_active) return res.status(400).json({ error: "Turn the agent on first" });
  const r = await runScheduledAgent(row, 45000, true);
  if (r.error === "Already running") return res.status(409).json({ success: false, error: "This agent ran less than a minute ago." });
  res.status(r.ok ? 200 : 502).json({ success: r.ok, ...r });
});
