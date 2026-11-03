/*
  Briefing and activation (spec 7.1, 7.2). Mounted at /api/v3 before the older router.
  GET  /analyst/briefing     today's briefing (v2, answer first) with its action tasks
  POST /analyst/briefing     compile now (also used for the instant first briefing after connecting)
  POST /briefing/compile     same
  GET  /onboarding/checklist activation checklist, computed from real data
  POST /onboarding/checklist { dismiss: true } hides it
*/
import { Router } from "express";
import { getUserIdFromRequest, supabaseAdmin } from "../supabaseServer.js";
import { compileBriefing } from "../briefing/briefing.js";

export const briefingRouter = Router();

async function requireAuth(req: any, res: any, next: any) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
}

async function withTaskState(userId: string, b: any) {
  const ids = (b.actions || []).map((a: any) => a.task_id).filter(Boolean);
  if (!ids.length) return b;
  const { data } = await supabaseAdmin.from("agent_tasks").select("id, status").in("id", ids).eq("user_id", userId);
  const st = Object.fromEntries((data || []).map((t: any) => [t.id, t.status]));
  return { ...b, actions: b.actions.map((a: any) => ({ ...a, task_status: st[a.task_id] || "pending_approval" })) };
}

/** Older shape kept for screens that still read headline / summary / today_actions */
const legacy = (b: any) => ({
  ...b,
  briefing_date: b.date,
  summary_text: b.summary.join(" "),
  today_actions: b.actions.map((a: any) => ({ action: a.title, reasoning: a.why, rank: a.rank })),
});

briefingRouter.get("/analyst/briefing", requireAuth, async (req: any, res) => {
  const { data } = await supabaseAdmin.from("ai_briefings").select("briefing_date, raw_data_snapshot").eq("user_id", req.userId).order("briefing_date", { ascending: false }).limit(1).maybeSingle();
  const b = data?.raw_data_snapshot?.briefing;
  if (!b || b.version !== 2) return res.json({ success: true, data: null });
  res.json({ success: true, data: legacy(await withTaskState(req.userId, b)) });
});

const compile = async (req: any, res: any) => {
  try {
    const b = await compileBriefing(req.userId, { force: req.query.force === "true" || req.body?.force === true });
    if (!b) return res.json({ success: false, status: "no_accounts_connected", error: "Connect at least one account to get a briefing." });
    res.json({ success: true, data: legacy(await withTaskState(req.userId, b)) });
  } catch (e: any) {
    console.error("[briefing] compile failed:", e);
    res.status(500).json({ success: false, error: "The briefing could not be compiled right now. Zie retries on the next check." });
  }
};
briefingRouter.post("/analyst/briefing", requireAuth, compile);
briefingRouter.post("/briefing/compile", requireAuth, compile);

export const CHECKLIST = [
  { key: "connect_account", label: "Connect an account", link: "/connections" },
  { key: "add_competitors", label: "Add 2 competitors", link: "/hunt" },
  { key: "schedule_post", label: "Schedule your first post", link: "/composer" },
  { key: "reply_comment", label: "Reply to a comment from the Inbox", link: "/inbox" },
  { key: "set_briefing_time", label: "Set your briefing time", link: "/settings/notifications" },
] as const;

briefingRouter.get("/onboarding/checklist", requireAuth, async (req: any, res) => {
  const u = req.userId;
  const [conns, comps, posts, replies, settings] = await Promise.all([
    supabaseAdmin.from("social_connections").select("id", { count: "exact", head: true }).eq("user_id", u).eq("is_active", true),
    supabaseAdmin.from("competitors").select("id", { count: "exact", head: true }).eq("user_id", u),
    supabaseAdmin.from("scheduled_posts").select("id", { count: "exact", head: true }).eq("user_id", u).in("status", ["scheduled", "publishing", "published", "needs_action"]),
    supabaseAdmin.from("comments_inbox").select("id", { count: "exact", head: true }).eq("user_id", u).eq("status", "replied"),
    supabaseAdmin.from("user_settings").select("checklist, updated_at").eq("user_id", u).maybeSingle(),
  ]);
  const saved: any = settings.data?.checklist || {};
  const done: Record<string, boolean> = {
    connect_account: (conns.count || 0) > 0,
    add_competitors: (comps.count || 0) >= 2,
    schedule_post: (posts.count || 0) > 0,
    reply_comment: (replies.count || 0) > 0,
    set_briefing_time: !!saved.set_briefing_time,
  };
  const items = CHECKLIST.map((c) => ({ ...c, done: done[c.key] }));
  const complete = items.every((i) => i.done);
  res.json({ success: true, items, complete, dismissed: saved.dismissed === true, visible: !complete && saved.dismissed !== true });
});

briefingRouter.post("/onboarding/checklist", requireAuth, async (req: any, res) => {
  const { data } = await supabaseAdmin.from("user_settings").select("checklist").eq("user_id", req.userId).maybeSingle();
  const checklist = { ...((data?.checklist as any) || {}), ...(req.body?.dismiss ? { dismissed: true } : {}) };
  const { error } = await supabaseAdmin.from("user_settings").upsert({ user_id: req.userId, checklist, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});
