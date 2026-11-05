/*
  Post lifecycle API (spec 7.4, 7.5). Mounted at /api/v3 before the older router.
  POST /posts/submit              Composer: one post per selected account
  POST /posts/schedule            older Composer call, same pipeline
  POST /posts/publish-now         older Composer call, same pipeline
  POST /posts/:id/request-review  draft -> in_review
  POST /posts/:id/approve         in_review or draft -> scheduled
  POST /posts/:id/retry           failed -> scheduled now
  POST /posts/:id/mark-posted     needs_action -> published (user posted by hand)
  POST /posts/:id/duplicate       copy as a new draft
  POST /posts/:id/reschedule      drag and drop on the calendar
  POST /posts/bulk                CSV bulk upload (date, time, platform, caption, media_url, first_comment)
  GET  /posts/calendar?from&to    calendar range, unscheduled drafts and best times
  GET  /posts/best-times          best time slots from the account's own posts
*/
import { Router } from "express";
import { getUserIdFromRequest, supabaseAdmin } from "../supabaseServer.js";
import { submitPosts, SubmitInput } from "../publish/submit.js";
import { publishScheduledPost } from "../publish/publisher.js";
import { logActivity } from "../activity.js";
import { parseBulkCsv } from "../publish/bulkCsv.js";
import { getDecryptedToken } from "../utils/tokenHelper.js";
import { bestTimes } from "../publish/bestTimes.js";

export const postsRouter = Router();

async function requireAuth(req: any, res: any, next: any) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
}

async function ownPost(userId: string, id: string) {
  const { data } = await supabaseAdmin.from("scheduled_posts").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
  return data;
}

const shapePost = (p: any) => ({
  id: p.id,
  platform: p.platform,
  platform_account_id: p.platform_account_id,
  caption: p.caption,
  media_urls: p.media_urls || [],
  media_type: p.media_type,
  first_comment: p.first_comment || null,
  platform_options: p.platform_options || {},
  scheduled_for: p.scheduled_for,
  status: p.status,
  published_at: p.published_at,
  platform_permalink: p.platform_permalink,
  error_message: p.error_message,
  retry_count: p.retry_count || 0,
  verified_at: p.verified_at || null,
  created_at: p.created_at,
});

async function userTimeZone(userId: string) {
  const { data } = await supabaseAdmin.from("user_settings").select("timezone").eq("user_id", userId).maybeSingle();
  return data?.timezone || "Asia/Jakarta";
}

async function bestTimesFor(userId: string, timeZone: string, platform?: string) {
  let q = supabaseAdmin.from("social_posts").select("posted_at, raw_metrics, platform").eq("user_id", userId).order("posted_at", { ascending: false }).limit(120);
  if (platform) q = q.eq("platform", platform);
  const { data } = await q;
  return bestTimes(data || [], timeZone);
}

postsRouter.get("/posts/calendar", requireAuth, async (req: any, res) => {
  const from = new Date(String(req.query.from || ""));
  const to = new Date(String(req.query.to || ""));
  if (isNaN(from.getTime()) || isNaN(to.getTime()) || to <= from) return res.status(400).json({ error: "from and to must be valid dates" });
  if (to.getTime() - from.getTime() > 62 * 86400000) return res.status(400).json({ error: "Pick a range of 62 days or less" });
  const u = req.userId;
  const [scheduled, published, unscheduled, tz] = await Promise.all([
    supabaseAdmin.from("scheduled_posts").select("*").eq("user_id", u).gte("scheduled_for", from.toISOString()).lte("scheduled_for", to.toISOString()).neq("status", "deleted"),
    supabaseAdmin.from("scheduled_posts").select("*").eq("user_id", u).is("scheduled_for", null).gte("published_at", from.toISOString()).lte("published_at", to.toISOString()).neq("status", "deleted"),
    supabaseAdmin.from("scheduled_posts").select("*").eq("user_id", u).is("scheduled_for", null).in("status", ["draft", "in_review", "approved"]).order("created_at", { ascending: false }).limit(30),
    userTimeZone(u),
  ]);
  if (scheduled.error) return res.status(500).json({ error: scheduled.error.message });
  const seen = new Set<string>();
  const posts = [...(scheduled.data || []), ...(published.data || [])].filter((p: any) => !seen.has(p.id) && seen.add(p.id)).map(shapePost);
  res.json({ success: true, timezone: tz, data: posts, unscheduled: (unscheduled.data || []).map(shapePost), best_times: await bestTimesFor(u, tz) });
});

postsRouter.get("/posts/best-times", requireAuth, async (req: any, res) => {
  const tz = await userTimeZone(req.userId);
  res.json({ success: true, timezone: tz, ...(await bestTimesFor(req.userId, tz, req.query.platform ? String(req.query.platform) : undefined)) });
});

postsRouter.post("/posts/submit", requireAuth, async (req: any, res) => {
  const out = await submitPosts(req.userId, req.body as SubmitInput);
  if (!out.ok) return res.status(out.status).json({ error: out.error, issues: out.issues });
  res.json({ success: true, posts: out.posts, issues: out.issues });
});

// Older single-target calls from earlier Composer builds
postsRouter.post("/posts/schedule", requireAuth, async (req: any, res) => {
  const b = req.body || {};
  const out = await submitPosts(req.userId, { targets: [{ platform: b.platform, account_id: b.account_id, first_comment: b.first_comment }], caption: b.caption, media_ids: b.media_ids, media_attachments: b.media_attachments, mode: "schedule", scheduled_for: b.scheduled_for });
  if (!out.ok) return res.status(out.status).json({ error: out.error, issues: out.issues });
  const p = out.posts![0];
  res.json({ success: true, id: p.id, status: p.status });
});

postsRouter.post("/posts/publish-now", requireAuth, async (req: any, res) => {
  const b = req.body || {};
  const out = await submitPosts(req.userId, { targets: [{ platform: b.platform, account_id: b.account_id, first_comment: b.first_comment }], caption: b.caption, media_ids: b.media_ids, media_attachments: b.media_attachments, mode: "now" });
  if (!out.ok) return res.status(out.status).json({ error: out.error, issues: out.issues });
  const p = out.posts![0];
  if (p.result?.status === "failed") return res.status(502).json({ error: p.result.reason, post_id: p.id });
  res.json({ success: true, post_id: p.id, status: p.status, permalink: p.result?.permalink, message: p.result?.status === "needs_action" ? p.result.reason : undefined });
});

postsRouter.post("/posts/:id/request-review", requireAuth, async (req: any, res) => {
  const post = await ownPost(req.userId, req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });
  if (post.status !== "draft") return res.status(400).json({ error: "Only drafts can be sent for review" });
  await supabaseAdmin.from("scheduled_posts").update({ status: "in_review", updated_at: new Date().toISOString() }).eq("id", post.id);
  await logActivity(req.userId, "user", "post.in_review", "scheduled_post", post.id);
  res.json({ success: true, status: "in_review" });
});

postsRouter.post("/posts/:id/approve", requireAuth, async (req: any, res) => {
  const post = await ownPost(req.userId, req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });
  if (!["draft", "in_review", "approved"].includes(post.status)) return res.status(400).json({ error: `A ${post.status} post cannot be approved` });
  const when = req.body?.scheduled_for ? new Date(req.body.scheduled_for) : post.scheduled_for ? new Date(post.scheduled_for) : null;
  // Approved without a time waits as approved; with a future time it is scheduled
  const status = when && when.getTime() > Date.now() + 60000 ? "scheduled" : "approved";
  await supabaseAdmin
    .from("scheduled_posts")
    .update({ status, scheduled_for: when ? when.toISOString() : null, updated_at: new Date().toISOString() })
    .eq("id", post.id);
  await logActivity(req.userId, "user", "post.approved", "scheduled_post", post.id, { status });
  res.json({ success: true, status });
});

postsRouter.post("/posts/:id/retry", requireAuth, async (req: any, res) => {
  const post = await ownPost(req.userId, req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });
  const retrying = post.status === "scheduled" && !!post.error_message;
  if (!["failed", "approved"].includes(post.status) && !retrying) return res.status(400).json({ error: "Only failed, retrying or approved posts can be sent now" });
  await supabaseAdmin.from("scheduled_posts").update({ status: "scheduled", retry_count: 0, scheduled_for: new Date().toISOString(), error_message: null }).eq("id", post.id);
  const result = await publishScheduledPost(post.id);
  res.json({ success: result.status === "published" || result.status === "needs_action" || result.status === "retrying", result });
});

postsRouter.post("/posts/:id/mark-posted", requireAuth, async (req: any, res) => {
  const post = await ownPost(req.userId, req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });
  if (post.status !== "needs_action") return res.status(400).json({ error: "This post is not waiting for a manual post" });
  const url = typeof req.body?.permalink === "string" && /^https:\/\//.test(req.body.permalink) ? req.body.permalink : null;
  await supabaseAdmin.from("scheduled_posts").update({ status: "published", published_at: new Date().toISOString(), platform_permalink: url, error_message: null }).eq("id", post.id);
  await supabaseAdmin.from("agent_tasks").update({ status: "executed", executed_at: new Date().toISOString() }).eq("user_id", req.userId).eq("dedupe_key", `manual_publish:${post.id}`);
  await logActivity(req.userId, "user", "post.marked_posted", "scheduled_post", post.id);
  res.json({ success: true });
});

postsRouter.post("/posts/:id/duplicate", requireAuth, async (req: any, res) => {
  const post = await ownPost(req.userId, req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });
  const copy: any = {
    user_id: req.userId,
    platform: post.platform,
    platform_account_id: post.platform_account_id,
    caption: post.caption,
    media_urls: post.media_urls,
    media_type: post.media_type,
    hashtags: post.hashtags,
    first_comment: post.first_comment,
    platform_options: post.platform_options || {},
    status: "draft",
    scheduled_for: null,
  };
  const { data, error } = await supabaseAdmin.from("scheduled_posts").insert(copy).select().single();
  if (error) return res.status(500).json({ error: error.message });
  await logActivity(req.userId, "user", "post.duplicated", "scheduled_post", data.id, { from: post.id });
  res.json({ success: true, post: data });
});

postsRouter.post("/posts/:id/reschedule", requireAuth, async (req: any, res) => {
  const post = await ownPost(req.userId, req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });
  if (["published", "publishing"].includes(post.status)) return res.status(400).json({ error: "Published posts cannot be moved" });
  const when = new Date(req.body?.scheduled_for);
  if (isNaN(when.getTime())) return res.status(400).json({ error: "That date is not valid" });
  if (post.status === "scheduled" && when.getTime() < Date.now() + 60000) return res.status(400).json({ error: "Pick a time in the future" });
  if (post.status === "failed" && when.getTime() < Date.now() + 60000) return res.status(400).json({ error: "Pick a time in the future, or use Retry now" });
  // Moving a failed post to a new time schedules it again with a fresh retry budget
  const patch: any = { scheduled_for: when.toISOString(), updated_at: new Date().toISOString() };
  if (post.status === "failed") Object.assign(patch, { status: "scheduled", retry_count: 0, error_message: null });
  await supabaseAdmin.from("scheduled_posts").update(patch).eq("id", post.id);
  await logActivity(req.userId, "user", "post.rescheduled", "scheduled_post", post.id, { to: when.toISOString() });
  res.json({ success: true, scheduled_for: when.toISOString(), status: patch.status || post.status });
});

postsRouter.post("/posts/bulk", requireAuth, async (req: any, res) => {
  const csv = String(req.body?.csv || "");
  const tz = String(req.body?.timezone || "UTC");
  const dryRun = !!req.body?.dry_run;
  const parsed = parseBulkCsv(csv, tz);
  if (parsed.errors.length && !parsed.rows.length) return res.status(400).json({ error: "No valid rows", errors: parsed.errors });
  if (dryRun) return res.json({ success: true, rows: parsed.rows, errors: parsed.errors });
  const { data: accounts } = await supabaseAdmin.from("connected_accounts").select("id, platform").eq("user_id", req.userId).eq("is_active", true);
  const created: any[] = [];
  const errors = [...parsed.errors];
  for (const r of parsed.rows) {
    const acct = (accounts || []).find((a: any) => a.platform === r.platform);
    if (!acct) {
      errors.push({ line: r.line, message: `${r.platform} is not connected` });
      continue;
    }
    // Bulk rows land as drafts so the user approves them on the calendar
    const out = await submitPosts(req.userId, {
      targets: [{ platform: r.platform, account_id: acct.id, first_comment: r.first_comment }],
      caption: r.caption,
      media_attachments: r.media_url ? [{ id: `temp_${r.line}`, file_url: r.media_url, mime_type: /\.(mp4|mov|m4v|webm)(\?|$)/i.test(r.media_url) ? "video/mp4" : "image/jpeg" }] : [],
      media_ids: r.media_url ? [`temp_${r.line}`] : [],
      mode: "draft",
    });
    if (!out.ok) {
      errors.push({ line: r.line, message: out.error || "Could not create the post" });
      continue;
    }
    const id = out.posts![0].id;
    await supabaseAdmin.from("scheduled_posts").update({ scheduled_for: r.scheduled_for }).eq("id", id);
    created.push({ id, line: r.line, platform: r.platform, scheduled_for: r.scheduled_for });
  }
  res.json({ success: true, created, errors });
});

/* TikTok creator info for the posting screen (spec 9.2). With video.publish granted
   this comes from TikTok; otherwise only the nickname we stored is returned. */
postsRouter.get("/tiktok/creator-info", requireAuth, async (req: any, res) => {
  const conn = await getDecryptedToken(req.userId, "tiktok");
  if (!conn) return res.json({ success: true, creator: null });
  const base = { nickname: conn.displayName || conn.username, source: "profile" };
  if (!conn.scopes.split(/[ ,]+/).includes("video.publish")) return res.json({ success: true, creator: base });
  try {
    const r = await fetch("https://open.tiktokapis.com/v2/post/publish/creator_info/query/", {
      method: "POST",
      headers: { Authorization: `Bearer ${conn.token}`, "Content-Type": "application/json; charset=UTF-8" },
    });
    const j: any = await r.json();
    const d = j.data || {};
    res.json({
      success: true,
      creator: {
        nickname: d.creator_nickname || base.nickname,
        privacy_options: d.privacy_level_options || [],
        comment_disabled: !!d.comment_disabled,
        duet_disabled: !!d.duet_disabled,
        stitch_disabled: !!d.stitch_disabled,
        max_video_post_duration_sec: d.max_video_post_duration_sec,
        source: "tiktok",
      },
    });
  } catch {
    res.json({ success: true, creator: base });
  }
});
