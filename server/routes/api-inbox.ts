/*
  Inbox (spec 7.6). Mounted at /api/v3 before the older router, so this
  GET /inbox/comments replaces the old one.
  GET  /inbox/comments?view=needs_reply|buying|complaints|questions|all|hidden|archived&platform=&sentiment=&sort=priority|recent
  POST /inbox/comments/:id/suggest   AI reply draft in the brand voice (saved, not sent)
  POST /inbox/comments/:id/hide      hide on the platform  { hidden: false } unhides
  POST /inbox/comments/:id/delete    delete on the platform and here
*/
import { Router } from "express";
import { getUserIdFromRequest, supabaseAdmin } from "../supabaseServer.js";
import { backfillIntent, draftReply, hideOrDeleteComment } from "../inbox/actions.js";
import { ReplyError } from "../inbox/reply.js";

export const inboxRouter = Router();

async function requireAuth(req: any, res: any, next: any) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
}

const OPEN = ["unread", "read"];

export const VIEWS: Record<string, (r: any) => boolean> = {
  needs_reply: (r) => OPEN.includes(r.status) && r.intent !== "spam",
  buying: (r) => r.intent === "buying_signal" && r.status !== "archived" && r.status !== "hidden",
  complaints: (r) => r.intent === "complaint" && r.status !== "archived" && r.status !== "hidden",
  questions: (r) => r.intent === "question" && r.status !== "archived" && r.status !== "hidden",
  all: (r) => r.status !== "archived" && r.status !== "hidden",
  hidden: (r) => r.status === "hidden",
  archived: (r) => r.status === "archived",
};

/** Buying signals and complaints first, then newest */
export function sortComments(rows: any[], sort: string) {
  const t = (r: any) => new Date(r.posted_at || r.created_at || 0).getTime();
  return [...rows].sort((a, b) => (sort === "recent" ? 0 : (a.priority ?? 3) - (b.priority ?? 3)) || t(b) - t(a));
}

inboxRouter.get("/inbox/comments", requireAuth, async (req: any, res) => {
  const u = req.userId;
  // Older clients send status=archived
  const view = String(req.query.view || (req.query.status === "archived" ? "archived" : "needs_reply"));
  const platform = String(req.query.platform || "");
  const sentiment = String(req.query.sentiment || "");
  const sort = String(req.query.sort || "priority");
  if (!VIEWS[view]) return res.status(400).json({ error: "Unknown view" });
  try {
    // One read of the recent window gives the list and every count
    const { data, error } = await supabaseAdmin.from("comments_inbox").select("*").eq("user_id", u).order("posted_at", { ascending: false }).limit(500);
    if (error) throw error;
    const rows = data || [];
    await backfillIntent(rows);

    const scoped = rows.filter((r) => (!platform || r.platform === platform) && (!sentiment || r.sentiment === sentiment));
    const counts = Object.fromEntries(Object.entries(VIEWS).map(([k, f]) => [k, scoped.filter(f).length]));
    const list = sortComments(scoped.filter(VIEWS[view]), sort).slice(0, 100);

    const [conns, lastSync] = await Promise.all([
      supabaseAdmin.from("social_connections").select("platform, platform_username, platform_account_type, status, last_synced_at").eq("user_id", u).eq("is_active", true).in("platform", ["instagram", "facebook"]),
      supabaseAdmin.from("inbox_sync_log").select("sync_completed_at, sync_started_at, error_message").eq("user_id", u).order("sync_started_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    const connected = (conns.data || []).map((c: any) => c.platform);
    const ig = (conns.data || []).find((c: any) => c.platform === "instagram");
    const fb = (conns.data || []).find((c: any) => c.platform === "facebook");
    const ls: any = lastSync.data;
    const syncInProgress = !!ls && !ls.sync_completed_at && Date.now() - new Date(ls.sync_started_at).getTime() < 5 * 60 * 1000;
    const lastSynced = [ls?.sync_completed_at, fb?.last_synced_at].filter(Boolean).sort().pop() || null;

    const open = rows.filter(VIEWS.all);
    res.json({
      success: true,
      data: list,
      view,
      counts,
      summary: {
        total_unread: open.filter((r) => r.status === "unread").length,
        total_positive: open.filter((r) => r.sentiment === "positive").length,
        total_negative: open.filter((r) => r.sentiment === "negative").length,
        total_neutral: open.filter((r) => r.sentiment === "neutral").length,
      },
      platforms: connected,
      last_synced_at: lastSynced,
      last_sync_error: ls?.error_message || null,
      sync_in_progress: syncInProgress,
      has_instagram_connection: !!ig,
      has_facebook_connection: !!fb,
      instagram_account_type: ig?.platform_account_type || null,
      instagram_username: ig?.platform_username || null,
    });
  } catch (e: any) {
    console.error("[inbox] list failed:", e);
    res.status(500).json({ error: e.message });
  }
});

const fail = (res: any, e: any) => {
  if (e instanceof ReplyError) return res.status(e.status).json({ error: e.code, message: e.message });
  console.error("[inbox] action failed:", e);
  res.status(500).json({ error: "failed", message: e.message });
};

inboxRouter.post("/inbox/comments/:id/suggest", requireAuth, async (req: any, res) => {
  try {
    res.json({ success: true, ...(await draftReply(req.userId, req.params.id)) });
  } catch (e) {
    fail(res, e);
  }
});

inboxRouter.post("/inbox/comments/:id/hide", requireAuth, async (req: any, res) => {
  try {
    await hideOrDeleteComment(req.userId, req.params.id, req.body?.hidden === false ? "unhide" : "hide");
    res.json({ success: true });
  } catch (e) {
    fail(res, e);
  }
});

inboxRouter.post("/inbox/comments/:id/delete", requireAuth, async (req: any, res) => {
  try {
    await hideOrDeleteComment(req.userId, req.params.id, "delete");
    res.json({ success: true });
  } catch (e) {
    fail(res, e);
  }
});
