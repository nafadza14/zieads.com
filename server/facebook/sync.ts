/*
  Facebook Page sync (spec P0-2): profile and insights for Analytics,
  published posts for Calendar and Analytics, comments for the Inbox.
  Webhooks deliver comments in under 2 minutes; this sync is the polling
  fallback (spec 7.7: under 15 minutes when run from the scheduler).
*/
import { supabaseAdmin } from "../supabaseServer.js";
import { getFacebookPage } from "./connect.js";
import { getPageProfile, getPageInsights, listPagePosts, listRecentComments, getPostInsights, GraphError, explainGraphError, FbComment } from "../utils/facebookApi.js";
import { classifyIntent } from "../inbox/intent.js";

async function accountRowId(userId: string, pageId: string): Promise<string | null> {
  const { data } = await supabaseAdmin.from("connected_accounts").select("id").eq("user_id", userId).eq("platform", "facebook").eq("platform_account_id", pageId).maybeSingle();
  return data?.id || null;
}

export async function ingestFacebookComment(userId: string, c: FbComment, source: "webhook" | "cron_polling") {
  const { intent, priority } = classifyIntent(c.message);
  const row = {
    user_id: userId,
    platform: "facebook",
    platform_comment_id: c.id,
    platform_media_id: c.post_id,
    parent_comment_id: c.parent?.id || null,
    author_username: c.from?.name || "Facebook user",
    author_platform_id: c.from?.id || null,
    text: c.message,
    status: "unread",
    posted_at: c.created_time,
    ingestion_source: source,
    intent,
    priority,
  };
  const { error } = await supabaseAdmin.from("comments_inbox").upsert(row, { onConflict: "user_id,platform,platform_comment_id", ignoreDuplicates: true });
  if (error) console.warn("[facebook] comment insert failed:", error.message);
}

export async function syncFacebookForUser(userId: string): Promise<{ ok: boolean; posts?: number; comments?: number; error?: string }> {
  const page = await getFacebookPage(userId);
  if (!page) return { ok: false, error: "not connected" };
  try {
    const accountId = await accountRowId(userId, page.pageId);
    const today = new Date().toISOString().slice(0, 10);
    const profile = await getPageProfile(page.pageId, page.pageToken);

    // Daily insights for the last 30 days
    const since = new Date(Date.now() - 30 * 86400000).toISOString();
    const insights = await getPageInsights(page.pageId, page.pageToken, since, new Date().toISOString());
    const byDate: Record<string, any> = {};
    for (const [metric, series] of Object.entries(insights)) for (const p of series) (byDate[p.date] ||= {})[metric] = p.value;
    for (const [date, m] of Object.entries(byDate)) {
      await supabaseAdmin.from("account_insights_daily").upsert(
        {
          user_id: userId,
          platform: "facebook",
          platform_account_id: page.pageId,
          snapshot_date: date,
          followers_count: date === today ? profile.followers : null,
          impressions_daily: m.page_media_view ?? null, // views, Meta's replacement for impressions
          reach_daily: null,
          raw_response: m,
        },
        { onConflict: "user_id,platform,snapshot_date" }
      );
    }
    await supabaseAdmin.from("account_insights_daily").upsert(
      { user_id: userId, platform: "facebook", platform_account_id: page.pageId, snapshot_date: today, followers_count: profile.followers, raw_response: byDate[today] || {} },
      { onConflict: "user_id,platform,snapshot_date" }
    );

    // Posts and per post insights
    const posts = await listPagePosts(page.pageId, page.pageToken, 25);
    for (const p of posts) {
      if (accountId) {
        await supabaseAdmin.from("social_posts").upsert(
          {
            account_id: accountId,
            user_id: userId,
            platform: "facebook",
            platform_post_id: p.id,
            post_url: p.permalink_url,
            content_text: p.message || "",
            media_type: p.full_picture ? "image" : "text_only",
            media_urls: p.full_picture ? [p.full_picture] : [],
            posted_at: p.created_time,
            raw_metrics: { likes: p.reactions, comments: p.comments, shares: p.shares, permalink: p.permalink_url },
            fetched_at: new Date().toISOString(),
          },
          { onConflict: "account_id,platform_post_id" }
        );
      }
      const pi = await getPostInsights(p.id, page.pageToken);
      await supabaseAdmin.from("post_insights_cache").upsert(
        {
          user_id: userId,
          platform: "facebook",
          platform_media_id: p.id,
          impressions: pi.post_media_view ?? null,
          engagement: pi.post_engagements ?? p.reactions + p.comments + p.shares,
          likes: p.reactions,
          comments_count: p.comments,
          shares: p.shares,
          raw_response: pi,
          post_published_at: p.created_time,
          fetched_at: new Date().toISOString(),
        },
        { onConflict: "user_id,platform,platform_media_id" }
      );
    }

    // Comments (polling fallback)
    const comments = await listRecentComments(page.pageId, page.pageToken, 15);
    for (const c of comments) await ingestFacebookComment(userId, c, "cron_polling");

    await supabaseAdmin
      .from("social_connections")
      .update({ last_synced_at: new Date().toISOString(), status: "live", last_error_message: null, last_error_code: null })
      .eq("user_id", userId)
      .eq("platform", "facebook");
    if (accountId) await supabaseAdmin.from("connected_accounts").update({ last_synced_at: new Date().toISOString(), sync_status: "ok", sync_error_message: null }).eq("id", accountId);
    return { ok: true, posts: posts.length, comments: comments.length };
  } catch (e: any) {
    const x = e instanceof GraphError ? explainGraphError({ code: e.code, subcode: e.subcode, message: e.message }) : { reason: e.message, needsReconnect: false };
    await supabaseAdmin
      .from("social_connections")
      .update({ status: x.needsReconnect ? "needs_reconnect" : "error", last_error_message: x.reason, last_error_code: e.code ? String(e.code) : null })
      .eq("user_id", userId)
      .eq("platform", "facebook");
    return { ok: false, error: x.reason };
  }
}

export async function syncAllFacebook(budgetMs = 40000) {
  const started = Date.now();
  const { data } = await supabaseAdmin.from("social_connections").select("user_id").eq("platform", "facebook").eq("is_active", true);
  let done = 0;
  for (const r of data || []) {
    if (Date.now() - started > budgetMs) break;
    await syncFacebookForUser(r.user_id);
    done++;
  }
  return { users: (data || []).length, synced: done };
}
