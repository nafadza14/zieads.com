import { supabaseAdmin } from '../supabaseServer.js';
import { getDecryptedToken } from './tokenHelper.js';
import * as igApi from './instagramApi.js';
import { analyzeCommentSentiment } from '../v3-agents.js';

// Simple in-memory rate limit tracker (resets every hour)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MAX_CALLS_PER_HOUR = 180; // Stay under Instagram's 200/hour limit

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 0, resetAt: now + 3600 * 1000 });
    return true;
  }
  return entry.count < MAX_CALLS_PER_HOUR;
}

function incrementRateLimit(userId: string): void {
  const entry = rateLimitMap.get(userId);
  if (entry) entry.count++;
}

/**
 * Sync the user's Instagram profile data (followers, media count, etc.)
 * into connected_accounts metadata and a metric_snapshot.
 */
export async function syncAccountProfile(userId: string): Promise<void> {
  const conn = await getDecryptedToken(userId, 'instagram');
  if (!conn) return;

  if (!checkRateLimit(userId)) {
    console.warn(`[Sync] Rate limit approaching for user ${userId}, skipping profile sync`);
    return;
  }

  try {
    const profile = await igApi.getProfile(conn.token);
    incrementRateLimit(userId);

    // Update connected_accounts metadata with latest profile info
    await supabaseAdmin
      .from('connected_accounts')
      .update({
        metadata: {
          is_real_oauth: true,
          followers_count: profile.followers_count,
          follows_count: profile.follows_count,
          media_count: profile.media_count,
          biography: profile.biography,
          profile_picture_url: profile.profile_picture_url,
          account_type: profile.account_type,
          last_synced: new Date().toISOString(),
        },
      })
      .eq('user_id', userId)
      .eq('platform', 'instagram');

    // Also update the social_connections last_synced_at
    await supabaseAdmin
      .from('social_connections')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('platform', 'instagram');

    console.log(`[Sync] Profile synced for user ${userId}: ${profile.followers_count} followers, ${profile.media_count} posts`);
  } catch (err: any) {
    console.error(`[Sync] Profile sync failed for user ${userId}:`, err.message);
  }
}

/**
 * Sync the user's recent Instagram posts into social_posts table.
 * Uses upsert on platform_post_id to avoid duplicates.
 */
export async function syncRecentPosts(userId: string): Promise<void> {
  const conn = await getDecryptedToken(userId, 'instagram');
  if (!conn) return;

  if (!checkRateLimit(userId)) {
    console.warn(`[Sync] Rate limit approaching for user ${userId}, skipping post sync`);
    return;
  }

  try {
    // Get the user's connected_accounts row for the account_id FK
    const { data: account } = await supabaseAdmin
      .from('connected_accounts')
      .select('id')
      .eq('user_id', userId)
      .eq('platform', 'instagram')
      .maybeSingle();

    if (!account) {
      console.warn(`[Sync] No connected_accounts row found for instagram user ${userId}`);
      return;
    }

    const mediaResult = await igApi.getRecentMedia(conn.token, 25);
    incrementRateLimit(userId);

    const mediaPosts = mediaResult.data || [];
    console.log(`[Sync] Fetched ${mediaPosts.length} recent Instagram posts for user ${userId}`);

    for (const post of mediaPosts) {
      // Upsert into social_posts — unique on user_id + platform_post_id
      const { error } = await supabaseAdmin
        .from('social_posts')
        .upsert({
          account_id: account.id,
          user_id: userId,
          platform: 'instagram',
          platform_post_id: post.id,
          content_text: post.caption || '',
          media_type: post.media_type?.toLowerCase() || 'image',
          media_urls: post.media_url ? [post.media_url] : [],
          posted_at: post.timestamp,
          post_url: post.permalink || null,
          raw_metrics: { 
            permalink: post.permalink || '',
            likes: Number(post.like_count || 0),
            comments: Number(post.comments_count || 0)
          },
          fetched_at: new Date().toISOString(),
        }, { onConflict: 'account_id,platform_post_id' });

      if (error) {
        console.error(`[Sync] Failed to upsert post ${post.id}:`, error.message);
      }
    }
  } catch (err: any) {
    console.error(`[Sync] Post sync failed for user ${userId}:`, err.message);
  }
}

/**
 * Sync insights (likes, comments, reach, etc.) for the user's recent posts.
 * Only fetches insights for posts older than 24 hours.
 */
export async function syncPostInsights(userId: string): Promise<void> {
  const conn = await getDecryptedToken(userId, 'instagram');
  if (!conn) return;

  try {
    const { data: account } = await supabaseAdmin
      .from('connected_accounts')
      .select('id')
      .eq('user_id', userId)
      .eq('platform', 'instagram')
      .maybeSingle();

    if (!account) return;

    // Get posts older than 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { data: posts } = await supabaseAdmin
      .from('social_posts')
      .select('id, platform_post_id, media_type, posted_at')
      .eq('user_id', userId)
      .eq('platform', 'instagram')
      .lt('posted_at', twentyFourHoursAgo)
      .order('posted_at', { ascending: false })
      .limit(20);

    if (!posts || posts.length === 0) return;

    for (const post of posts) {
      if (!checkRateLimit(userId)) {
        console.warn(`[Sync] Rate limit reached during insights sync for user ${userId}`);
        break;
      }

      try {
        const insights = await igApi.getMediaInsights(conn.token, post.platform_post_id, post.media_type?.toUpperCase() || 'IMAGE');
        incrementRateLimit(userId);

        if (insights.length === 0) continue;

        // Parse insights into a flat object
        const metricsObj: Record<string, number> = {};
        for (const insight of insights) {
          metricsObj[insight.name] = insight.values?.[0]?.value || 0;
        }

        const likes = metricsObj.likes || 0;
        const comments = metricsObj.comments || 0;
        const reach = metricsObj.reach || 0;
        const impressions = metricsObj.impressions || 0;
        const saves = metricsObj.saved || 0;
        const shares = metricsObj.shares || 0;

        // Update raw_metrics on the social_posts row
        await supabaseAdmin
          .from('social_posts')
          .update({ raw_metrics: metricsObj })
          .eq('id', post.id);

        // Delete old snapshot and insert fresh one
        await supabaseAdmin
          .from('metric_snapshots')
          .delete()
          .eq('post_id', post.id);

        await supabaseAdmin
          .from('metric_snapshots')
          .insert({
            post_id: post.id,
            account_id: account.id,
            user_id: userId,
            likes,
            comments,
            reach,
            impressions,
            saves,
            shares,
            engagement_rate: reach > 0 ? Number(((likes + comments + saves + shares) / reach).toFixed(4)) : 0,
            captured_at: new Date().toISOString(),
          });

      } catch (err: any) {
        console.error(`[Sync] Insights fetch failed for post ${post.platform_post_id}:`, err.message);
      }
    }

    console.log(`[Sync] Insights synced for ${posts.length} posts for user ${userId}`);
  } catch (err: any) {
    console.error(`[Sync] Post insights sync failed for user ${userId}:`, err.message);
  }
}

/**
 * Sync comments from recent Instagram posts into comment_inbox table.
 * Runs sentiment analysis on new comments.
 */
export async function syncComments(userId: string): Promise<void> {
  const conn = await getDecryptedToken(userId, 'instagram');
  if (!conn) return;

  try {
    const { data: account } = await supabaseAdmin
      .from('connected_accounts')
      .select('id')
      .eq('user_id', userId)
      .eq('platform', 'instagram')
      .maybeSingle();

    if (!account) return;

    // Get recent posts to fetch comments for
    const { data: posts } = await supabaseAdmin
      .from('social_posts')
      .select('id, platform_post_id')
      .eq('user_id', userId)
      .eq('platform', 'instagram')
      .order('posted_at', { ascending: false })
      .limit(10);

    if (!posts || posts.length === 0) return;

    let newCommentsCount = 0;

    for (const post of posts) {
      if (!checkRateLimit(userId)) {
        console.warn(`[Sync] Rate limit reached during comment sync for user ${userId}`);
        break;
      }

      try {
        const comments = await igApi.getMediaComments(conn.token, post.platform_post_id);
        incrementRateLimit(userId);

        for (const comment of comments) {
          // Upsert main comment into comments_inbox (new schema)
          const { data: upserted, error } = await supabaseAdmin
            .from('comments_inbox')
            .upsert({
              user_id: userId,
              platform: 'instagram',
              platform_comment_id: comment.id,
              platform_media_id: post.platform_post_id,
              author_username: comment.username,
              author_platform_id: comment.id,
              text: comment.text,
              posted_at: comment.timestamp,
              status: 'unread',
            }, { onConflict: 'user_id,platform,platform_comment_id', ignoreDuplicates: false })
            .select('id, sentiment')
            .single();

          if (!error && upserted && !upserted.sentiment) {
            // New comment — run sentiment analysis asynchronously
            newCommentsCount++;
            analyzeCommentSentiment(comment.text).then(sentiment => {
              supabaseAdmin
                .from('comments_inbox')
                .update({ sentiment })
                .eq('id', upserted.id)
                .then(() => {});
            }).catch(() => {});
          }

          // Also upsert any replies
          if (comment.replies?.data) {
            for (const reply of comment.replies.data) {
              await supabaseAdmin
                .from('comments_inbox')
                .upsert({
                  user_id: userId,
                  platform: 'instagram',
                  platform_comment_id: reply.id,
                  platform_media_id: post.platform_post_id,
                  parent_comment_id: comment.id,
                  author_username: reply.username,
                  author_platform_id: reply.id,
                  text: reply.text,
                  posted_at: reply.timestamp,
                  status: 'unread',
                }, { onConflict: 'user_id,platform,platform_comment_id', ignoreDuplicates: true });
            }
          }
        }
      } catch (err: any) {
        console.error(`[Sync] Comment fetch failed for post ${post.platform_post_id}:`, err.message);
      }
    }

    console.log(`[Sync] Comments synced for user ${userId}. ${newCommentsCount} new comments with sentiment analysis queued.`);
  } catch (err: any) {
    console.error(`[Sync] Comment sync failed for user ${userId}:`, err.message);
  }
}

/**
 * Master sync function — runs all syncs in order.
 * Called after OAuth connection and by nightly cron.
 */
export async function syncAll(userId: string): Promise<void> {
  console.log(`[Sync] Starting full Instagram sync for user ${userId}...`);
  try {
    await syncAccountProfile(userId);
    await syncRecentPosts(userId);
    await syncPostInsights(userId);
    await syncComments(userId);
    console.log(`[Sync] Full sync completed for user ${userId}`);
  } catch (err: any) {
    console.error(`[Sync] Full sync failed for user ${userId}:`, err.message);
  }
}
