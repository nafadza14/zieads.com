/*
  One publisher for every platform (spec 7.4, 7.10, 8.2).
  - Claim first: a post moves scheduled -> publishing with a conditional update,
    so two cron runs can never publish the same post twice (double-post check).
  - Idempotency: a post that already has a platform id is never sent again.
  - Retries: up to 3 attempts with backoff (2, 4, 8 minutes), then status failed
    and a Guardian task that tells the user what happened and what to do.
  - TikTok before the Direct Post audit uses the push
    reminder path: status needs_action and a task, never a fake "published".
  - LinkedIn (text, images, video) lives in ./linkedin.ts.
  - Threads, Pinterest, YouTube, Bluesky, Mastodon, Telegram and Discord live in server/social/publishers.ts.
*/
import crypto from "crypto";
import { supabaseAdmin } from "../supabaseServer.js";
import { getDecryptedToken } from "../utils/tokenHelper.js";
import { publishPost as igPublishSingle } from "../utils/instagramApi.js";
import { publishToPage, commentOnPost, explainGraphError, GraphError } from "../utils/facebookApi.js";
import { getFacebookPage } from "../facebook/connect.js";
import { validatePost, hasErrors, ValidatePlatform } from "../../src/lib/postValidation.js";
import { createAgentTask, logActivity } from "../activity.js";
import { PublishError, NeedsAction } from "./errors.js";
import { NETWORK_PUBLISHERS } from "../social/publishers.js";
import { publishLinkedIn } from "./linkedin.js";

export const MAX_ATTEMPTS = 3;

/** Minutes to wait before retry n (1-based). Exported for tests. */
export function retryDelayMinutes(attempt: number): number {
  return Math.min(60, 2 ** attempt);
}

export function idempotencyKeyFor(post: { id: string; platform: string; scheduled_for?: string | null }): string {
  return crypto.createHash("sha256").update(`${post.id}:${post.platform}:${post.scheduled_for || ""}`).digest("hex").slice(0, 40);
}

export interface PublishResult {
  status: "published" | "needs_action" | "retrying" | "failed" | "skipped";
  postId: string;
  externalId?: string;
  permalink?: string;
  reason?: string;
}

const isVideoUrl = (u: string) => /\.(mp4|mov|m4v|webm)(\?|$)/i.test(u);

async function igGraph(token: string, path: string, params: Record<string, string>, method = "POST") {
  const url = new URL(`https://graph.instagram.com/v21.0/${path}`);
  const body = new URLSearchParams({ ...params, access_token: token });
  const res = await fetch(method === "GET" ? `${url}?${body}` : url, method === "GET" ? undefined : { method, body });
  const j: any = await res.json().catch(() => ({}));
  if (!res.ok || j.error) {
    const e = j.error || {};
    const explained = explainGraphError({ code: e.code, subcode: e.error_subcode, message: e.message });
    throw new PublishError(explained.reason.replace(/Facebook/g, "Instagram"), !explained.needsReconnect, explained.needsReconnect);
  }
  return j;
}

async function waitForContainer(token: string, id: string) {
  for (let i = 0; i < 30; i++) {
    const s = await igGraph(token, id, { fields: "status_code,status" }, "GET");
    if (s.status_code === "FINISHED") return;
    if (s.status_code === "ERROR") throw new PublishError(`Instagram could not process the media: ${s.status || "unknown error"}`, false);
    await new Promise((r) => setTimeout(r, 4000));
  }
  throw new PublishError("Instagram is still processing the video. ZieAds will retry.", true);
}

async function publishInstagram(post: any) {
  const conn = await getDecryptedToken(post.user_id, "instagram");
  if (!conn) throw new PublishError("Instagram is not connected. Reconnect it in Connections.", false, true);
  const urls: string[] = (post.media_urls || []).filter(Boolean);
  if (!urls.length) throw new PublishError("Instagram needs a photo or video.", false);
  const caption = post.caption || "";
  let mediaId: string;
  if (urls.length === 1) {
    const video = post.media_type === "video" || isVideoUrl(urls[0]);
    const r = await igPublishSingle(conn.token, conn.platformUserId, video ? { video_url: urls[0], media_type: "REELS", caption } : { image_url: urls[0], caption });
    mediaId = r.mediaId;
  } else {
    const children: string[] = [];
    for (const u of urls.slice(0, 10)) {
      const video = isVideoUrl(u);
      const c = await igGraph(conn.token, `${conn.platformUserId}/media`, video ? { media_type: "VIDEO", video_url: u, is_carousel_item: "true" } : { image_url: u, is_carousel_item: "true" });
      if (video) await waitForContainer(conn.token, c.id);
      children.push(c.id);
    }
    const parent = await igGraph(conn.token, `${conn.platformUserId}/media`, { media_type: "CAROUSEL", children: children.join(","), caption });
    await waitForContainer(conn.token, parent.id);
    const pub = await igGraph(conn.token, `${conn.platformUserId}/media_publish`, { creation_id: parent.id });
    mediaId = pub.id;
  }
  let permalink = `https://www.instagram.com/`;
  try {
    const p = await igGraph(conn.token, mediaId, { fields: "permalink" }, "GET");
    permalink = p.permalink || permalink;
  } catch {
    /* permalink is nice to have */
  }
  if (post.first_comment?.trim()) {
    try {
      await igGraph(conn.token, `${mediaId}/comments`, { message: post.first_comment.trim() });
    } catch (e: any) {
      console.warn("[publisher] IG first comment failed:", e.message);
    }
  }
  return { externalId: mediaId, permalink };
}

async function publishFacebook(post: any) {
  const page = await getFacebookPage(post.user_id);
  if (!page) throw new PublishError("Facebook is not connected. Reconnect it in Connections.", false, true);
  const urls: string[] = (post.media_urls || []).filter(Boolean);
  const video = urls.find((u) => post.media_type === "video" || isVideoUrl(u));
  try {
    const r = await publishToPage(page.pageId, page.pageToken, {
      message: post.caption || "",
      link: post.platform_options?.link || undefined,
      videoUrl: video,
      imageUrls: video ? undefined : urls,
    });
    if (post.first_comment?.trim()) {
      try {
        await commentOnPost(r.id, page.pageToken, post.first_comment.trim());
      } catch (e: any) {
        console.warn("[publisher] FB first comment failed:", e.message);
      }
    }
    return { externalId: r.id, permalink: r.permalink };
  } catch (e: any) {
    if (e instanceof GraphError) {
      const x = explainGraphError({ code: e.code, subcode: e.subcode, message: e.message });
      throw new PublishError(x.reason, !x.needsReconnect && e.code !== 100 && e.code !== 368, x.needsReconnect);
    }
    throw new PublishError(e.message, true);
  }
}

/**
 * TikTok: with video.upload granted, the video goes to the creator's TikTok inbox
 * as a draft (spec 9.2: production path until the Direct Post audit passes).
 * The creator finishes the post in the TikTok app, so the status is needs_action.
 */
async function publishTikTok(post: any): Promise<{ externalId: string; permalink?: string }> {
  const conn = await getDecryptedToken(post.user_id, "tiktok");
  if (!conn) throw new PublishError("TikTok is not connected. Reconnect it in Connections.", false, true);
  const urls: string[] = (post.media_urls || []).filter(Boolean);
  if (!urls.length) throw new PublishError("TikTok needs a video.", false);
  const scopes = conn.scopes.split(/[ ,]+/);
  if (!scopes.includes("video.upload")) {
    throw new NeedsAction("TikTok publishing is waiting for TikTok's approval. Post this video from the TikTok app: the caption is ready to copy.");
  }
  const res = await fetch("https://open.tiktokapis.com/v2/post/publish/inbox/video/init/", {
    method: "POST",
    headers: { Authorization: `Bearer ${conn.token}`, "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify({ source_info: { source: "PULL_FROM_URL", video_url: urls[0] } }),
  });
  const j: any = await res.json().catch(() => ({}));
  if (!res.ok || (j.error && j.error.code && j.error.code !== "ok")) {
    const code = j.error?.code || res.status;
    const reconnect = code === "access_token_invalid" || code === "scope_not_authorized";
    throw new PublishError(`TikTok refused the upload (${code}). ${j.error?.message || ""}`.trim(), !reconnect, reconnect);
  }
  throw new NeedsAction(`The video is in your TikTok inbox as a draft (id ${j.data?.publish_id || "pending"}). Open TikTok, check the notification and post it.`);
}

const DISPATCH: Record<string, (post: any) => Promise<{ externalId: string; permalink?: string; warning?: string }>> = {
  instagram: publishInstagram,
  facebook: publishFacebook,
  tiktok: publishTikTok,
  linkedin: publishLinkedIn,
  ...NETWORK_PUBLISHERS,
};

async function markConnection(userId: string, platform: string, reason: string) {
  await supabaseAdmin
    .from("social_connections")
    .update({ status: "needs_reconnect", last_error_message: reason, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("platform", platform);
}

/** Claim and publish one post. Safe to call from several places at once. */
export async function publishScheduledPost(postId: string, opts: { allowStatuses?: string[] } = {}): Promise<PublishResult> {
  const allow = opts.allowStatuses || ["scheduled"];
  const { data: claimed } = await supabaseAdmin
    .from("scheduled_posts")
    .update({ status: "publishing", updated_at: new Date().toISOString() })
    .eq("id", postId)
    .in("status", allow)
    .select()
    .maybeSingle();
  if (!claimed) return { status: "skipped", postId, reason: "Already handled by another run" };
  const post: any = claimed;

  // Already on the platform: never send twice
  if (post.platform_media_id) {
    await supabaseAdmin.from("scheduled_posts").update({ status: "published" }).eq("id", post.id);
    return { status: "skipped", postId, externalId: post.platform_media_id, reason: "Already published" };
  }
  if (!post.idempotency_key) {
    await supabaseAdmin.from("scheduled_posts").update({ idempotency_key: idempotencyKeyFor(post) }).eq("id", post.id);
  }

  try {
    // "Remind me to post it myself": the reminder path, never an API call
    if (post.platform_options?.manual) {
      throw new NeedsAction(`Time to post on ${post.platform}. The caption and media are ready in ZieAds; mark it posted when you are done.`);
    }
    const fn = DISPATCH[post.platform];
    if (!fn) throw new PublishError(`${post.platform} publishing is not supported yet.`, false);
    const issues = validatePost(post.platform as ValidatePlatform, {
      caption: post.caption || "",
      media: (post.media_urls || []).map((u: string) => ({ url: u })),
      firstComment: post.first_comment || undefined,
    });
    if (hasErrors(issues)) throw new PublishError(issues.filter((i) => i.level === "error").map((i) => i.message).join(" "), false);

    const r = await fn(post);
    const now = new Date().toISOString();
    await supabaseAdmin
      .from("scheduled_posts")
      .update({ status: "published", published_at: now, platform_media_id: r.externalId, platform_permalink: r.permalink || null, error_message: r.warning || null, updated_at: now })
      .eq("id", post.id);
    await logActivity(post.user_id, "agent", "post.published", "scheduled_post", post.id, { platform: post.platform, external_id: r.externalId, permalink: r.permalink });
    return { status: "published", postId, externalId: r.externalId, permalink: r.permalink, reason: r.warning };
  } catch (e: any) {
    const now = new Date();
    if (e instanceof NeedsAction) {
      await supabaseAdmin.from("scheduled_posts").update({ status: "needs_action", error_message: e.message, updated_at: now.toISOString() }).eq("id", post.id);
      await createAgentTask(post.user_id, {
        kind: "manual_publish",
        title: `Post to ${post.platform} by hand`,
        detail: e.message,
        payload: { post_id: post.id, caption: post.caption, media_urls: post.media_urls },
        createdBy: "guardian",
        dedupeKey: `manual_publish:${post.id}`,
      });
      return { status: "needs_action", postId, reason: e.message };
    }
    const pe: PublishError = e instanceof PublishError ? e : new PublishError(e?.message || "Unknown error", true);
    const attempt = (post.retry_count || 0) + 1;
    if (pe.needsReconnect) await markConnection(post.user_id, post.platform, pe.message);
    if (pe.retryable && attempt < MAX_ATTEMPTS) {
      const next = new Date(now.getTime() + retryDelayMinutes(attempt) * 60000).toISOString();
      await supabaseAdmin.from("scheduled_posts").update({ status: "scheduled", retry_count: attempt, scheduled_for: next, error_message: pe.message, updated_at: now.toISOString() }).eq("id", post.id);
      return { status: "retrying", postId, reason: pe.message };
    }
    await supabaseAdmin.from("scheduled_posts").update({ status: "failed", retry_count: attempt, error_message: pe.message, updated_at: now.toISOString() }).eq("id", post.id);
    await logActivity(post.user_id, "guardian", "post.failed", "scheduled_post", post.id, { platform: post.platform, reason: pe.message });
    await createAgentTask(post.user_id, {
      kind: pe.needsReconnect ? "reconnect" : "review_failed_post",
      title: pe.needsReconnect ? `Reconnect ${post.platform}: a post could not go out` : `A ${post.platform} post failed`,
      detail: pe.message,
      payload: { post_id: post.id, platform: post.platform },
      evidence: [{ label: "Post", value: (post.caption || "").slice(0, 80) }],
      createdBy: "guardian",
      dedupeKey: `failed_post:${post.id}`,
    });
    return { status: "failed", postId, reason: pe.message };
  }
}

/** Publish everything that is due. Keeps inside a serverless time budget. */
export async function runDuePosts(budgetMs = 45000): Promise<{ checked: number; results: PublishResult[] }> {
  const started = Date.now();
  const { data } = await supabaseAdmin
    .from("scheduled_posts")
    .select("id")
    .eq("status", "scheduled")
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(25);
  const results: PublishResult[] = [];
  for (const row of data || []) {
    if (Date.now() - started > budgetMs) break;
    results.push(await publishScheduledPost(row.id));
  }
  return { checked: (data || []).length, results };
}
