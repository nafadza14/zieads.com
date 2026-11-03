/*
  Guardian Agent (spec 7.10): background checks that catch problems before the user does.
  - A published post really exists on the platform (checked 5 minutes after publishing)
  - Access that expires in 7 days or 1 day, or was revoked, gets a reconnect task
  - Comments waiting longer than the user's limit go to Needs you
  - Instagram publishing quota close to the 100 posts per 24 hours limit
  - Weekly reliability numbers for the briefing
  Every finding becomes an agent task with a dedupe key, so checks can run often without spam.
*/
import { supabaseAdmin } from "../supabaseServer.js";
import { createAgentTask, logActivity } from "../activity.js";
import { getFacebookPage } from "../facebook/connect.js";
import { verifyPost } from "../utils/facebookApi.js";
import { getDecryptedToken } from "../utils/tokenHelper.js";
import { refreshExpiringTokens } from "../utils/tokenRefresh.js";

const PLATFORM_NAME: Record<string, string> = { instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok", linkedin: "LinkedIn" };
const nameOf = (p: string) => PLATFORM_NAME[p] || p;

/** Days until a timestamp, negative when past. Exported for tests. */
export function daysUntil(iso: string | null | undefined, now = Date.now()): number | null {
  if (!iso) return null;
  return Math.floor((new Date(iso).getTime() - now) / 86400000);
}

/** Which expiry warning applies, if any. Exported for tests. */
export function expiryBucket(days: number | null): "expired" | "1d" | "7d" | null {
  if (days === null) return null;
  if (days < 0) return "expired";
  if (days <= 1) return "1d";
  if (days <= 7) return "7d";
  return null;
}

async function verifyPublished(budgetEnd: number) {
  const since = new Date(Date.now() - 2 * 86400000).toISOString();
  const before = new Date(Date.now() - 5 * 60000).toISOString();
  const { data } = await supabaseAdmin
    .from("scheduled_posts")
    .select("id, user_id, platform, platform_media_id, caption, published_at")
    .eq("status", "published")
    .is("verified_at", null)
    .gte("published_at", since)
    .lte("published_at", before)
    .limit(40);
  let checked = 0;
  let missing = 0;
  for (const p of data || []) {
    if (Date.now() > budgetEnd) break;
    let exists: boolean | null = null;
    try {
      if (!p.platform_media_id) exists = true; // marked posted by hand
      else if (p.platform === "facebook") {
        const page = await getFacebookPage(p.user_id);
        exists = page ? await verifyPost(p.platform_media_id, page.pageToken) : null;
      } else if (p.platform === "instagram") {
        const conn = await getDecryptedToken(p.user_id, "instagram");
        if (conn) {
          const r = await fetch(`https://graph.instagram.com/v21.0/${p.platform_media_id}?fields=id&access_token=${encodeURIComponent(conn.token)}`);
          exists = r.ok;
        }
      } else exists = true; // platforms without a cheap lookup
    } catch {
      exists = null;
    }
    checked++;
    if (exists === true) {
      await supabaseAdmin.from("scheduled_posts").update({ verified_at: new Date().toISOString() }).eq("id", p.id);
    } else if (exists === false) {
      missing++;
      await supabaseAdmin.from("scheduled_posts").update({ status: "failed", error_message: `ZieAds published this post but ${nameOf(p.platform)} no longer shows it. It may have been removed by the platform or deleted.` }).eq("id", p.id);
      await createAgentTask(p.user_id, {
        kind: "review_failed_post",
        title: `A ${nameOf(p.platform)} post is missing after publishing`,
        detail: "Check the post on the platform. You can publish it again from the calendar.",
        payload: { post_id: p.id, platform: p.platform },
        evidence: [{ label: "Post", value: String(p.caption || "").slice(0, 80) }],
        createdBy: "guardian",
        dedupeKey: `missing_post:${p.id}`,
      });
      await logActivity(p.user_id, "guardian", "post.missing", "scheduled_post", p.id);
    }
  }
  return { checked, missing };
}

async function checkConnections() {
  // Try to renew first; only what cannot be renewed becomes a task
  try {
    await refreshExpiringTokens();
  } catch (e: any) {
    console.warn("[guardian] token refresh failed:", e.message);
  }
  const { data } = await supabaseAdmin.from("social_connections").select("user_id, platform, token_expires_at, status, last_error_message, is_active").eq("is_active", true);
  let warned = 0;
  for (const c of data || []) {
    const bucket = expiryBucket(daysUntil(c.token_expires_at));
    const broken = c.status === "needs_reconnect" || c.status === "revoked";
    if (!bucket && !broken) continue;
    const reason = broken
      ? c.last_error_message || `${nameOf(c.platform)} needs to be reconnected.`
      : bucket === "expired"
        ? `${nameOf(c.platform)} access expired. Posts and syncing are paused until you reconnect.`
        : `${nameOf(c.platform)} access ends in ${bucket === "1d" ? "1 day" : "7 days or less"}. Reconnect now so nothing stops.`;
    const r = await createAgentTask(c.user_id, {
      kind: "reconnect",
      title: `Reconnect ${nameOf(c.platform)}`,
      detail: reason,
      payload: { platform: c.platform },
      createdBy: "guardian",
      dedupeKey: `reconnect:${c.platform}:${broken ? "broken" : bucket}:${String(c.token_expires_at || "").slice(0, 10)}`,
    });
    if (r.created) {
      warned++;
      await supabaseAdmin.from("social_connections").update({ expiry_notified_at: new Date().toISOString() }).eq("user_id", c.user_id).eq("platform", c.platform);
    }
  }
  return { warned };
}

async function checkUnanswered() {
  const { data: users } = await supabaseAdmin.from("comments_inbox").select("user_id").in("status", ["unread", "read"]).limit(5000);
  const ids = [...new Set((users || []).map((u: any) => u.user_id))];
  let flagged = 0;
  const today = new Date().toISOString().slice(0, 10);
  for (const userId of ids) {
    const { data: st } = await supabaseAdmin.from("user_settings").select("unanswered_hours").eq("user_id", userId).maybeSingle();
    const hours = st?.unanswered_hours || 2;
    const cutoff = new Date(Date.now() - hours * 3600000).toISOString();
    const { data: waiting } = await supabaseAdmin
      .from("comments_inbox")
      .select("id, intent, priority")
      .eq("user_id", userId)
      .in("status", ["unread", "read"])
      .lte("posted_at", cutoff)
      .or("intent.is.null,intent.neq.spam")
      .limit(500);
    const list = waiting || [];
    if (!list.length) continue;
    const buying = list.filter((c: any) => c.intent === "buying_signal").length;
    const r = await createAgentTask(userId, {
      kind: "reply_comments",
      title: buying ? `${buying} buying question${buying > 1 ? "s" : ""} waiting for a reply` : `${list.length} comment${list.length > 1 ? "s" : ""} waiting more than ${hours} hours`,
      detail: `${list.length} comment${list.length > 1 ? "s have" : " has"} waited longer than ${hours} hours. Zie can draft the replies for you to send.`,
      payload: { comment_ids: list.slice(0, 50).map((c: any) => c.id), count: list.length, buying },
      createdBy: "guardian",
      dedupeKey: `unanswered:${today}`,
    });
    if (r.created) flagged++;
  }
  return { users: ids.length, flagged };
}

async function checkPublishingQuota() {
  const { data } = await supabaseAdmin.from("social_connections").select("user_id").eq("platform", "instagram").eq("is_active", true).limit(200);
  let near = 0;
  for (const c of data || []) {
    const conn = await getDecryptedToken(c.user_id, "instagram");
    if (!conn) continue;
    try {
      const r = await fetch(`https://graph.instagram.com/v21.0/${conn.platformUserId}/content_publishing_limit?fields=quota_usage,config&access_token=${encodeURIComponent(conn.token)}`);
      const j: any = await r.json();
      const usage = Number(j.data?.[0]?.quota_usage || 0);
      const total = Number(j.data?.[0]?.config?.quota_total || 100);
      if (usage >= total * 0.9) {
        near++;
        await createAgentTask(c.user_id, {
          kind: "quota_warning",
          title: "Instagram publishing limit almost reached",
          detail: `${usage} of ${total} API posts used in the last 24 hours. ZieAds holds further Instagram posts until the window resets.`,
          payload: { platform: "instagram", usage, total },
          createdBy: "guardian",
          dedupeKey: `quota:instagram:${new Date().toISOString().slice(0, 10)}`,
        });
      }
    } catch {
      /* quota check is best effort */
    }
  }
  return { near };
}

export async function runGuardian(budgetMs = 25000) {
  const end = Date.now() + budgetMs;
  const out: Record<string, unknown> = {};
  out.verify = await verifyPublished(end);
  if (Date.now() < end) out.connections = await checkConnections();
  if (Date.now() < end) out.unanswered = await checkUnanswered();
  if (Date.now() < end) out.quota = await checkPublishingQuota();
  return out;
}

/** Reliability numbers for one user over the last N days (weekly in the briefing) */
export async function reliabilityReport(userId: string, days = 7) {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data } = await supabaseAdmin
    .from("scheduled_posts")
    .select("status, scheduled_for, published_at, retry_count")
    .eq("user_id", userId)
    .gte("scheduled_for", since)
    .lte("scheduled_for", new Date().toISOString());
  const rows = data || [];
  const published = rows.filter((r: any) => r.status === "published");
  const onTime = published.filter((r: any) => r.published_at && r.scheduled_for && Math.abs(new Date(r.published_at).getTime() - new Date(r.scheduled_for).getTime()) <= 5 * 60000);
  return {
    days,
    due: rows.length,
    published: published.length,
    on_time: onTime.length,
    retried: rows.filter((r: any) => (r.retry_count || 0) > 0).length,
    failed: rows.filter((r: any) => r.status === "failed").length,
    needs_action: rows.filter((r: any) => r.status === "needs_action").length,
    on_time_rate: rows.length ? onTime.length / rows.length : null,
  };
}
