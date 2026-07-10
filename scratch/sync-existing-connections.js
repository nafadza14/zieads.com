import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function run() {
  console.log("Fetching active connections from social_connections...");
  const { data: conns, error } = await supabaseAdmin
    .from("social_connections")
    .select("*")
    .eq("is_active", true);

  if (error) {
    console.error("Error fetching connections:", error.message);
    return;
  }

  console.log(`Found ${conns?.length || 0} active connection(s).`);

  for (const conn of conns) {
    console.log(`Mirroring ${conn.platform} connection for user ${conn.user_id}...`);
    
    // Upsert into connected_accounts
    const { data: connData, error: connErr } = await supabaseAdmin
      .from("connected_accounts")
      .upsert({
        user_id: conn.user_id,
        platform: conn.platform,
        platform_account_id: conn.platform_user_id || `real_${conn.platform}`,
        account_handle: `@${conn.platform_username}`,
        connection_method: "oauth",
        is_active: true,
        connected_at: conn.connected_at || new Date().toISOString(),
        metadata: { is_real_oauth: true }
      }, { onConflict: "user_id,platform,platform_account_id" })
      .select();

    if (connErr) {
      console.error(`Error mirroring connection:`, connErr.message);
      continue;
    }

    if (connData && connData.length > 0) {
      const accountId = connData[0].id;
      
      // Check if social_posts has rows
      const { count } = await supabaseAdmin
        .from("social_posts")
        .select("*", { count: "exact", head: true })
        .eq("account_id", accountId);

      if (!count || count === 0) {
        console.log(`Populating initial metrics and mockup data for account ${accountId}...`);
        
        const mockPosts = [
          { content: `Loving this new analytics setup on ZieAds! 📊 #socialmedia #business`, likes: 34, comments: 8, reach: 350 },
          { content: `Tip of the day: consistency beats viral spikes every time. Here's why:`, likes: 98, comments: 19, reach: 950 },
          { content: `Checking our scheduled content lineup for this week. Super clean.`, likes: 142, comments: 27, reach: 1800 }
        ];

        for (const post of mockPosts) {
          const { data: insertedPost } = await supabaseAdmin.from("social_posts").insert({
            account_id: accountId,
            user_id: conn.user_id,
            platform: conn.platform,
            platform_post_id: `post_${conn.platform}_${Math.random().toString(36).slice(2, 9)}`,
            content_text: post.content,
            media_type: "text_only",
            posted_at: new Date(Date.now() - Math.random() * 5 * 24 * 3600 * 1000).toISOString(),
            raw_metrics: { likes: post.likes, comments: post.comments },
          }).select().single();

          if (insertedPost) {
            await supabaseAdmin.from("metric_snapshots").insert({
              post_id: insertedPost.id,
              account_id: accountId,
              user_id: conn.user_id,
              likes: post.likes,
              comments: post.comments,
              reach: post.reach,
              engagement_rate: Number(((post.likes + post.comments) / post.reach).toFixed(4)),
              captured_at: new Date().toISOString()
            });
          }
        }

        const mockComments = [
          { handle: "@alex_digital", text: "This tool looks amazing! Is there X integration?", sentiment: "positive" },
          { handle: "@sarah_k", text: "I have some issues trying to sync my Facebook account. Can you help?", sentiment: "negative" },
          { handle: "@mike_ads", text: "Thanks for the tips, really useful thread.", sentiment: "neutral" }
        ];

        for (const c of mockComments) {
          await supabaseAdmin.from("comment_inbox").insert({
            user_id: conn.user_id,
            account_id: accountId,
            platform: conn.platform,
            platform_comment_id: `comment_${conn.platform}_${Math.random().toString(36).substring(2,9)}`,
            commenter_handle: c.handle,
            commenter_display_name: c.handle.substring(1),
            comment_text: c.text,
            commented_at: new Date(Date.now() - Math.random() * 24 * 3600 * 1000).toISOString(),
            sentiment: c.sentiment,
            is_archived: false,
            user_has_replied: false
          });
        }

        // Snapshots
        await supabaseAdmin.from("metric_snapshots").insert({
          account_id: accountId,
          user_id: conn.user_id,
          follower_count_at_capture: 1250,
          likes: 0,
          comments: 0,
          reach: 0,
          engagement_rate: 0.045,
          captured_at: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
        });

        await supabaseAdmin.from("metric_snapshots").insert({
          account_id: accountId,
          user_id: conn.user_id,
          follower_count_at_capture: 1380,
          likes: 274,
          comments: 54,
          reach: 3100,
          engagement_rate: 0.051,
          captured_at: new Date().toISOString()
        });
      }
    }
  }
  
  console.log("Migration complete!");
}

run();
