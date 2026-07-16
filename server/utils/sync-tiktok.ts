import { supabaseAdmin } from "../supabaseServer.js";
import { getDecryptedToken } from "./tokenHelper.js";

export async function syncTikTokInsightsForUser(userId: string) {
  console.log(`[V3 TikTok Sync] Syncing TikTok insights for user ${userId}...`);
  const conn = await getDecryptedToken(userId, "tiktok");
  if (!conn) {
    console.log(`[V3 TikTok Sync] TikTok connection not found for user ${userId}.`);
    return;
  }

  // 1. Fetch user profile stats
  let userInfo: any = {};
  try {
    const profileUrl = `https://open.tiktokapis.com/v2/user/info/?fields=follower_count,following_count,likes_count,video_count`;
    const profileRes = await fetch(profileUrl, {
      method: "GET",
      headers: { Authorization: `Bearer ${conn.token}` },
    });

    if (profileRes.ok) {
      const resJson = await profileRes.json();
      userInfo = resJson.data?.user || {};
      console.log(`[V3 TikTok Sync] Fetched profile info successfully:`, userInfo);
      
      const today = new Date().toISOString().slice(0, 10);
      await supabaseAdmin.from("account_insights_daily").upsert({
        user_id: userId,
        platform: "tiktok",
        platform_account_id: conn.platformUserId,
        snapshot_date: today,
        followers_count: Number(userInfo.follower_count || 0),
        following_count: Number(userInfo.following_count || 0),
        media_count: Number(userInfo.video_count || 0),
        impressions_daily: 0,
        reach_daily: 0,
        profile_views_daily: 0,
        website_clicks_daily: 0,
        raw_response: userInfo
      }, { onConflict: "user_id,platform,snapshot_date" });
    } else {
      console.error(`[V3 TikTok Sync] TikTok profile API returned non-OK status:`, profileRes.status);
    }
  } catch (err: any) {
    console.error(`[V3 TikTok Sync] Failed to fetch TikTok profile info:`, err.message);
  }

  // 2. Fetch videos
  try {
    const videoListUrl = `https://open.tiktokapis.com/v2/video/list/?fields=id,create_time,cover_image_url,share_url,video_description,duration,title,view_count,like_count,comment_count,share_count`;
    const videoRes = await fetch(videoListUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${conn.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ max_pagesize: 20 })
    });

    if (videoRes.ok) {
      const resJson = await videoRes.json();
      const videos = resJson.data?.videos || [];
      console.log(`[V3 TikTok Sync] Fetched ${videos.length} videos from TikTok.`);

      const { data: account } = await supabaseAdmin
        .from('connected_accounts')
        .select('id')
        .eq('user_id', userId)
        .eq('platform', 'tiktok')
        .maybeSingle();

      for (const video of videos) {
        const engagement = Number(video.like_count || 0) + Number(video.comment_count || 0) + Number(video.share_count || 0);
        
        await supabaseAdmin.from("post_insights_cache").upsert({
          user_id: userId,
          platform: "tiktok",
          platform_media_id: video.id,
          impressions: Number(video.view_count || 0),
          reach: Number(video.view_count || 0),
          engagement,
          likes: Number(video.like_count || 0),
          comments_count: Number(video.comment_count || 0),
          shares: Number(video.share_count || 0),
          video_views: Number(video.view_count || 0),
          raw_response: video,
          post_published_at: new Date(video.create_time * 1000).toISOString(),
          fetched_at: new Date().toISOString()
        }, { onConflict: "user_id,platform,platform_media_id" });

        if (account) {
          await supabaseAdmin.from("social_posts").upsert({
            account_id: account.id,
            user_id: userId,
            platform: "tiktok",
            platform_post_id: video.id,
            content_text: video.video_description || video.title || "",
            media_type: "video",
            media_urls: video.cover_image_url ? [video.cover_image_url] : [],
            posted_at: new Date(video.create_time * 1000).toISOString(),
            post_url: video.share_url || null,
            raw_metrics: { 
              permalink: video.share_url || "",
              likes: Number(video.like_count || 0),
              comments: Number(video.comment_count || 0)
            },
            fetched_at: new Date().toISOString()
          }, { onConflict: 'account_id,platform_post_id' });
        }
      }

      // Update social_connection last_synced_at to now
      await supabaseAdmin
        .from("social_connections")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("platform", "tiktok");

    } else {
      console.error(`[V3 TikTok Sync] TikTok video API returned non-OK status:`, videoRes.status, await videoRes.text());
    }
  } catch (err: any) {
    console.error(`[V3 TikTok Sync] Failed to fetch TikTok videos:`, err.message);
  }
}
