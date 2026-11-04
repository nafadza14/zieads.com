/*
  Comments page. Mounted at /api/v3. Reads the same comments_inbox table as the Inbox,
  grouped by the post each comment belongs to (Buffer Community and Metricool style).
    GET  /comments/posts?platform=&view=unanswered|all|resolved   posts with comment counts and context
    GET  /comments?post=&platform=&view=&sort=newest|oldest|unanswered  the comments (one post or all)
    POST /comments/sync      pulls new comments from Threads, Bluesky, Mastodon and YouTube
    POST /comments/:id/resolve  { resolved: false } reopens
  Replies, drafts and suggestions reuse /inbox/comments/:id/reply, /draft and /suggest.
*/
import { Router } from "express";
import { getUserIdFromRequest, supabaseAdmin } from "../supabaseServer.js";
import { COMMENT_NETWORKS, NO_COMMENTS, syncNetworkComments } from "../social/comments.js";

export const commentsRouter = Router();

async function requireAuth(req: any, res: any, next: any) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
}

const OPEN = ["unread", "read"];
export const COMMENT_VIEWS: Record<string, (r: any) => boolean> = {
  unanswered: (r) => OPEN.includes(r.status) && r.intent !== "spam",
  all: (r) => r.status !== "hidden",
  resolved: (r) => r.status === "replied" || r.status === "archived",
};

const time = (r: any) => new Date(r.posted_at || r.created_at || 0).getTime();
const postKey = (r: any) => `${r.platform}|${r.platform_media_id}`;

export function sortCommentRows(rows: any[], sort: string) {
  const open = (r: any) => (OPEN.includes(r.status) ? 0 : 1);
  return [...rows].sort((a, b) => {
    if (sort === "oldest") return time(a) - time(b);
    if (sort === "newest") return time(b) - time(a);
    return open(a) - open(b) || (a.priority ?? 3) - (b.priority ?? 3) || time(b) - time(a);
  });
}

/** Groups comments by post. Post context comes from the comment meta, the insights cache or social_posts. */
export function groupByPost(rows: any[], context: Record<string, any> = {}) {
  const map = new Map<string, any>();
  for (const r of rows) {
    const k = postKey(r);
    let g = map.get(k);
    if (!g) {
      const m = r.meta || {};
      const ctx = context[k] || {};
      g = {
        key: k,
        platform: r.platform,
        post_id: r.platform_media_id,
        caption: ctx.caption || m.post_caption || "",
        thumb: ctx.thumb || m.post_thumb || null,
        permalink: ctx.permalink || m.post_permalink || null,
        total: 0,
        unanswered: 0,
        last_comment_at: null as string | null,
      };
      map.set(k, g);
    }
    g.total++;
    if (COMMENT_VIEWS.unanswered(r)) g.unanswered++;
    const at = r.posted_at || r.created_at;
    if (!g.last_comment_at || time(r) > new Date(g.last_comment_at).getTime()) g.last_comment_at = at;
    if (!g.caption && r.meta?.post_caption) g.caption = r.meta.post_caption;
  }
  return [...map.values()].sort((a, b) => b.unanswered - a.unanswered || new Date(b.last_comment_at).getTime() - new Date(a.last_comment_at).getTime());
}

async function recentRows(userId: string, platform: string) {
  let q = supabaseAdmin.from("comments_inbox").select("*").eq("user_id", userId).order("posted_at", { ascending: false }).limit(800);
  if (platform) q = q.eq("platform", platform);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

/** Caption, thumbnail and link for Instagram and Facebook posts, which the Meta sync stores elsewhere */
async function postContext(userId: string, rows: any[]) {
  const ids = [...new Set(rows.filter((r) => r.platform === "instagram" || r.platform === "facebook").map((r) => r.platform_media_id))].slice(0, 200);
  const out: Record<string, any> = {};
  if (!ids.length) return out;
  const [cache, posts] = await Promise.all([
    supabaseAdmin.from("post_insights_cache").select("platform, platform_media_id, raw_response").eq("user_id", userId).in("platform_media_id", ids),
    supabaseAdmin.from("social_posts").select("platform, platform_post_id, content_text, media_urls, post_url").eq("user_id", userId).in("platform_post_id", ids),
  ]);
  for (const p of posts.data || []) out[`${p.platform}|${p.platform_post_id}`] = { caption: p.content_text, thumb: p.media_urls?.[0] || null, permalink: p.post_url };
  for (const c of cache.data || []) {
    const r = c.raw_response || {};
    out[`${c.platform}|${c.platform_media_id}`] = { caption: r.caption || out[`${c.platform}|${c.platform_media_id}`]?.caption, thumb: r.media_url || null, permalink: r.permalink || null };
  }
  return out;
}

async function networks(userId: string) {
  const { data } = await supabaseAdmin.from("social_connections").select("platform, platform_username, last_synced_at").eq("user_id", userId).eq("is_active", true);
  const conns = data || [];
  return {
    supported: conns.filter((c: any) => COMMENT_NETWORKS.includes(c.platform)).map((c: any) => ({ platform: c.platform, username: c.platform_username, last_synced_at: c.last_synced_at })),
    unsupported: conns.filter((c: any) => NO_COMMENTS[c.platform]).map((c: any) => ({ platform: c.platform, reason: NO_COMMENTS[c.platform] })),
  };
}

commentsRouter.get("/comments/posts", requireAuth, async (req: any, res) => {
  const view = String(req.query.view || "unanswered");
  if (!COMMENT_VIEWS[view]) return res.status(400).json({ error: "Unknown view" });
  try {
    const all = await recentRows(req.userId, String(req.query.platform || ""));
    const rows = all.filter(COMMENT_VIEWS[view]);
    const [ctx, net] = await Promise.all([postContext(req.userId, rows), networks(req.userId)]);
    res.json({
      success: true,
      posts: groupByPost(rows, ctx).slice(0, 100),
      counts: Object.fromEntries(Object.entries(COMMENT_VIEWS).map(([k, f]) => [k, all.filter(f).length])),
      networks: net,
    });
  } catch (e: any) {
    console.error("[comments] posts failed:", e);
    res.status(500).json({ error: e.message });
  }
});

commentsRouter.get("/comments", requireAuth, async (req: any, res) => {
  const view = String(req.query.view || "unanswered");
  if (!COMMENT_VIEWS[view]) return res.status(400).json({ error: "Unknown view" });
  const post = String(req.query.post || "");
  try {
    const all = await recentRows(req.userId, String(req.query.platform || ""));
    const rows = all.filter((r) => (!post || postKey(r) === post) && COMMENT_VIEWS[view](r));
    const list = sortCommentRows(rows, String(req.query.sort || "unanswered")).slice(0, 200);
    const ctx = await postContext(req.userId, list);
    res.json({ success: true, comments: list.map((r) => ({ ...r, post: groupByPost([r], ctx)[0] })) });
  } catch (e: any) {
    console.error("[comments] list failed:", e);
    res.status(500).json({ error: e.message });
  }
});

const lastSync = new Map<string, number>();
commentsRouter.post("/comments/sync", requireAuth, async (req: any, res) => {
  // One sync a minute per user keeps network rate limits safe
  const prev = lastSync.get(req.userId) || 0;
  if (Date.now() - prev < 60000) return res.json({ success: true, throttled: true, results: {} });
  lastSync.set(req.userId, Date.now());
  try {
    res.json({ success: true, results: await syncNetworkComments(req.userId) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

commentsRouter.post("/comments/:id/resolve", requireAuth, async (req: any, res) => {
  const { data: c } = await supabaseAdmin.from("comments_inbox").select("id, status, reply_platform_id").eq("id", req.params.id).eq("user_id", req.userId).maybeSingle();
  if (!c) return res.status(404).json({ error: "Comment not found." });
  const status = req.body?.resolved === false ? (c.reply_platform_id ? "replied" : "read") : c.status === "replied" ? "replied" : "archived";
  const { error } = await supabaseAdmin.from("comments_inbox").update({ status }).eq("id", c.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, status });
});
