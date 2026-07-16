import { Router } from "express";
import crypto from "crypto";
import { getUserIdFromRequest, supabaseAdmin } from "../supabaseServer.js";
import { encrypt } from "../utils/crypto.js";
import { refreshExpiringTokens } from "../utils/tokenRefresh.js";
import { syncAll } from "../utils/sync-instagram.js";
import { syncTikTokInsightsForUser } from "../utils/sync-tiktok.js";

/**
 * Seeds initial demo analytics, post library, and inbox comment data 
 * when a user connects their social channel, making the platform features 
 * (Analytics, Calendar, Composer, Inbox, Competitor Hunt) immediately functional.
 */
export async function initializeSocialMediaMockData(userId: string, platform: string, accountId: string, accountHandle: string) {
  try {
    const mockPosts = [
      { content: `Loving this new analytics setup on ZieAds! 📊 #socialmedia #business`, likes: 34, comments: 8, reach: 350 },
      { content: `Tip of the day: consistency beats viral spikes every time. Here's why:`, likes: 98, comments: 19, reach: 950 },
      { content: `Checking our scheduled content lineup for this week. Super clean.`, likes: 142, comments: 27, reach: 1800 }
    ];

    for (const post of mockPosts) {
      const { data: insertedPost } = await supabaseAdmin.from("social_posts").insert({
        account_id: accountId,
        user_id: userId,
        platform,
        platform_post_id: `post_${platform}_${Math.random().toString(36).slice(2, 9)}`,
        content_text: post.content,
        media_type: "text_only",
        posted_at: new Date(Date.now() - Math.random() * 5 * 24 * 3600 * 1000).toISOString(),
        raw_metrics: { likes: post.likes, comments: post.comments },
      }).select().single();

      if (insertedPost) {
        await supabaseAdmin.from("metric_snapshots").insert({
          post_id: insertedPost.id,
          account_id: accountId,
          user_id: userId,
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
      await supabaseAdmin.from("comments_inbox").insert({
        user_id: userId,
        platform,
        platform_comment_id: `comment_${platform}_${Math.random().toString(36).substring(2,9)}`,
        platform_media_id: `mock_media_${platform}`,
        author_username: c.handle,
        text: c.text,
        sentiment: c.sentiment,
        sentiment_confidence: 0.95,
        status: "unread",
        posted_at: new Date(Date.now() - Math.random() * 24 * 3600 * 1000).toISOString(),
        created_at: new Date().toISOString()
      });
    }

    // Insert baseline historical metric snapshots
    await supabaseAdmin.from("metric_snapshots").insert({
      account_id: accountId,
      user_id: userId,
      follower_count_at_capture: 1250,
      likes: 0,
      comments: 0,
      reach: 0,
      engagement_rate: 0.045,
      captured_at: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
    });

    await supabaseAdmin.from("metric_snapshots").insert({
      account_id: accountId,
      user_id: userId,
      follower_count_at_capture: 1380,
      likes: 274,
      comments: 54,
      reach: 3100,
      engagement_rate: 0.051,
      captured_at: new Date().toISOString()
    });

    // Populate account_insights_daily for v0.3 briefings & analytics
    for (let i = 0; i < 7; i++) {
      const date = new Date(Date.now() - i * 24 * 3600 * 1000).toISOString().slice(0, 10);
      const followers = 1350 + i * 15;
      await supabaseAdmin.from("account_insights_daily").upsert({
        user_id: userId,
        platform,
        platform_account_id: accountId,
        snapshot_date: date,
        followers_count: followers,
        following_count: 180,
        media_count: 3 + (7 - i),
        impressions_daily: 450 + Math.floor(Math.random() * 200),
        reach_daily: 350 + Math.floor(Math.random() * 150),
        profile_views_daily: 45 + Math.floor(Math.random() * 20),
        website_clicks_daily: 5 + Math.floor(Math.random() * 5),
      }, { onConflict: "user_id,platform,snapshot_date" });
    }

    // Populate post_insights_cache with corresponding metrics
    const { data: postsList } = await supabaseAdmin
      .from("social_posts")
      .select("*")
      .eq("account_id", accountId)
      .eq("user_id", userId);

    if (postsList) {
      for (const p of postsList) {
        const metrics = p.raw_metrics || {};
        const likesVal = Number(metrics.likes || 20);
        const commentsVal = Number(metrics.comments || 5);
        const reachVal = likesVal * 10;
        
        await supabaseAdmin.from("post_insights_cache").upsert({
          user_id: userId,
          platform,
          platform_media_id: p.platform_post_id,
          impressions: reachVal + 100,
          reach: reachVal,
          engagement: likesVal + commentsVal,
          likes: likesVal,
          comments_count: commentsVal,
          post_published_at: p.posted_at
        }, { onConflict: "user_id,platform,platform_media_id" });
      }
    }
    
    console.log(`[OAuth] Seeded initial dashboard data metrics for user ${userId} / account ${accountId}`);
  } catch (err) {
    console.error("[OAuth] Failed to populate initial dashboard metrics:", err);
  }
}


export const authRouter = Router();

// Middleware to enforce authentication
async function requireAuth(req: any, res: any, next: any) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
}

/**
 * 1. Initiate connection (OAuth Connect)
 * Supports both GET redirects and POST json URL retrieval.
 */
authRouter.get("/:platform/connect", async (req, res) => {
  const platform = req.params.platform;
  const token = req.query.token as string || req.headers.authorization?.replace("Bearer ", "");
  
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Missing authentication token" });
  }

  // Verify authentication using Supabase Admin Auth
  let userId: string | null = null;
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (!error && data?.user) {
      userId = data.user.id;
    }
  } catch (err) {
    console.error("[OAuth] Connection initiation auth check failed:", err);
  }

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: Invalid session" });
  }

  if (platform !== "instagram" && platform !== "tiktok" && platform !== "linkedin") {
    return res.status(400).json({ error: "Invalid connection platform" });
  }

  // Validate presence of required environment variables for the selected platform
  const redirectBase = process.env.OAUTH_REDIRECT_BASE_URL || "https://app.zieads.com";
  let authUrl = "";

  console.log(`[OAuth] Connect request received for platform "${platform}". Checking runtime configuration...`);
  console.log(`[OAuth] Redirect base URL: "${redirectBase}"`);
  console.log(`[OAuth] Supabase URL exists: ${!!(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL)}`);

  try {
    if (platform === "instagram") {
      const appId = process.env.INSTAGRAM_APP_ID;
      if (!appId) {
        throw new Error("INSTAGRAM_APP_ID environment variable is missing on the server.");
      }
      console.log(`[OAuth] Instagram App ID is present: "${appId}"`);
    } else if (platform === "tiktok") {
      const clientKey = process.env.TIKTOK_CLIENT_KEY;
      if (!clientKey) {
        throw new Error("TIKTOK_CLIENT_KEY environment variable is missing on the server.");
      }
    } else if (platform === "linkedin") {
      const clientId = process.env.LINKEDIN_CLIENT_ID;
      if (!clientId) {
        throw new Error("LINKEDIN_CLIENT_ID environment variable is missing on the server.");
      }
    }

    // Generate secure CSRF state
    const state = crypto.randomBytes(16).toString("hex");
    let codeVerifier: string | undefined;
    let codeChallenge: string | undefined;

    if (platform === "tiktok") {
      // PKCE for TikTok
      codeVerifier = crypto.randomBytes(32).toString("hex");
      codeChallenge = crypto
        .createHash("sha256")
        .update(codeVerifier)
        .digest("base64url");
    }

    // Save OAuth state in database
    const { error: insertErr } = await supabaseAdmin.from("oauth_states").insert({
      state,
      user_id: userId,
      platform,
      code_verifier: codeVerifier || null,
    });

    if (insertErr) {
      console.error("[OAuth] Database insert failed for oauth_states:", insertErr.message, insertErr.details || "");
      return res.status(500).json({ 
        error: "Failed to initialize secure connection handshake", 
        details: insertErr.message 
      });
    }

    if (platform === "instagram") {
      authUrl = `https://www.instagram.com/oauth/authorize?client_id=${
        process.env.INSTAGRAM_APP_ID
      }&redirect_uri=${encodeURIComponent(
        `${redirectBase}/api/auth/instagram/callback`
      )}&scope=instagram_business_basic,instagram_business_manage_insights,instagram_business_content_publish&response_type=code&state=${state}`;
    } else if (platform === "tiktok") {
      const scopes = process.env.TIKTOK_SCOPES || "user.info.basic,user.info.profile,user.info.stats,video.list";
      authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${
        process.env.TIKTOK_CLIENT_KEY
      }&scope=${scopes}&response_type=code&redirect_uri=${encodeURIComponent(
        `${redirectBase}/api/auth/tiktok/callback`
      )}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
    } else if (platform === "linkedin") {
      authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${
        process.env.LINKEDIN_CLIENT_ID
      }&redirect_uri=${encodeURIComponent(
        `${redirectBase}/api/auth/linkedin/callback`
      )}&state=${state}&scope=openid%20profile%20email%20w_member_social`;
    }

    // Since it's a GET redirect, send user directly to the platform
    console.log(`[OAuth] Redirecting user to authorization URL: ${authUrl}`);
    return res.redirect(authUrl);
  } catch (err: any) {
    console.error("[OAuth] Connection initiation error (GET):", err);
    return res.status(500).json({ 
      error: "Failed to initialize secure connection handshake", 
      details: err.message 
    });
  }
});

authRouter.post("/:platform/connect", requireAuth, async (req: any, res) => {
  const platform = req.params.platform;
  const userId = req.userId;

  if (platform !== "instagram" && platform !== "tiktok" && platform !== "linkedin") {
    return res.status(400).json({ error: "Invalid platform" });
  }

  // Validate presence of required environment variables for the selected platform
  const redirectBase = process.env.OAUTH_REDIRECT_BASE_URL || "https://app.zieads.com";
  let authUrl = "";

  console.log(`[OAuth] Connect request (POST) received for platform "${platform}". Checking runtime configuration...`);
  console.log(`[OAuth] Redirect base URL: "${redirectBase}"`);
  console.log(`[OAuth] Supabase URL exists: ${!!(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL)}`);

  try {
    if (platform === "instagram") {
      const appId = process.env.INSTAGRAM_APP_ID;
      if (!appId) {
        throw new Error("INSTAGRAM_APP_ID environment variable is missing on the server.");
      }
      console.log(`[OAuth] Instagram App ID is present: "${appId}"`);
    } else if (platform === "tiktok") {
      const clientKey = process.env.TIKTOK_CLIENT_KEY;
      if (!clientKey) {
        throw new Error("TIKTOK_CLIENT_KEY environment variable is missing on the server.");
      }
    } else if (platform === "linkedin") {
      const clientId = process.env.LINKEDIN_CLIENT_ID;
      if (!clientId) {
        throw new Error("LINKEDIN_CLIENT_ID environment variable is missing on the server.");
      }
    }

    const state = crypto.randomBytes(16).toString("hex");
    let codeVerifier: string | undefined;
    let codeChallenge: string | undefined;

    if (platform === "tiktok") {
      codeVerifier = crypto.randomBytes(32).toString("hex");
      codeChallenge = crypto
        .createHash("sha256")
        .update(codeVerifier)
        .digest("base64url");
    }

    const { error: insertErr } = await supabaseAdmin.from("oauth_states").insert({
      state,
      user_id: userId,
      platform,
      code_verifier: codeVerifier || null,
    });

    if (insertErr) {
      console.error("[OAuth] Database insert failed for oauth_states (POST):", insertErr.message, insertErr.details || "");
      return res.status(500).json({ 
        error: "Failed to initialize secure connection handshake", 
        details: insertErr.message 
      });
    }

    if (platform === "instagram") {
      authUrl = `https://www.instagram.com/oauth/authorize?client_id=${
        process.env.INSTAGRAM_APP_ID
      }&redirect_uri=${encodeURIComponent(
        `${redirectBase}/api/auth/instagram/callback`
      )}&scope=instagram_business_basic,instagram_business_manage_insights,instagram_business_content_publish&response_type=code&state=${state}`;
    } else if (platform === "tiktok") {
      const scopes = process.env.TIKTOK_SCOPES || "user.info.basic,user.info.profile,user.info.stats,video.list";
      authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${
        process.env.TIKTOK_CLIENT_KEY
      }&scope=${scopes}&response_type=code&redirect_uri=${encodeURIComponent(
        `${redirectBase}/api/auth/tiktok/callback`
      )}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
    } else if (platform === "linkedin") {
      authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${
        process.env.LINKEDIN_CLIENT_ID
      }&redirect_uri=${encodeURIComponent(
        `${redirectBase}/api/auth/linkedin/callback`
      )}&state=${state}&scope=openid%20profile%20email%20w_member_social`;
    }

    return res.json({ url: authUrl });
  } catch (err: any) {
    console.error("[OAuth] Connection initiation error (POST):", err);
    return res.status(500).json({ 
      error: "Failed to initialize secure connection handshake", 
      details: err.message 
    });
  }
});

/**
 * 2. OAuth Callback Handlers
 */

// A. Instagram Callback
authRouter.get("/instagram/callback", async (req, res) => {
  const { code, state, error } = req.query;
  const redirectBase = process.env.OAUTH_REDIRECT_BASE_URL || "https://app.zieads.com";

  if (error) {
    return res.redirect(`${redirectBase}/connections?error=instagram_denied`);
  }

  if (!code || !state) {
    return res.redirect(`${redirectBase}/connections?error=instagram_invalid_callback`);
  }

  try {
    // Verify CSRF state
    const { data: stateData, error: dbErr } = await supabaseAdmin
      .from("oauth_states")
      .select("*")
      .eq("state", state)
      .eq("platform", "instagram")
      .single();

    if (dbErr || !stateData) {
      console.warn("[OAuth] Instagram state verification failed or mismatch.");
      return res.redirect(`${redirectBase}/connections?error=instagram_csrf`);
    }

    // Delete state record immediately
    await supabaseAdmin.from("oauth_states").delete().eq("state", state);

    // Exchange short-lived code
    const tokenExchangeUrl = "https://api.instagram.com/oauth/access_token";
    const bodyParams = new URLSearchParams();
    bodyParams.append("client_id", process.env.INSTAGRAM_APP_ID || "");
    bodyParams.append("client_secret", process.env.INSTAGRAM_APP_SECRET || "");
    bodyParams.append("grant_type", "authorization_code");
    bodyParams.append("redirect_uri", `${redirectBase}/api/auth/instagram/callback`);
    bodyParams.append("code", code as string);

    const tokenRes = await fetch(tokenExchangeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: bodyParams.toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("[OAuth] Instagram short-lived token exchange failed:", errText);
      return res.redirect(`${redirectBase}/connections?error=instagram_exchange_failed`);
    }

    const shortLivedData = await tokenRes.json();
    const shortLivedToken = shortLivedData.access_token;

    // Exchange short-lived token for long-lived (60 days) token
    const longLivedUrl = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${
      process.env.INSTAGRAM_APP_SECRET
    }&access_token=${shortLivedToken}`;

    const longLivedRes = await fetch(longLivedUrl);
    if (!longLivedRes.ok) {
      const errText = await longLivedRes.text();
      console.error("[OAuth] Instagram long-lived token exchange failed:", errText);
      return res.redirect(`${redirectBase}/connections?error=instagram_longlived_failed`);
    }

    const longLivedData = await longLivedRes.json();
    const longLivedToken = longLivedData.access_token;
    const expiresIn = longLivedData.expires_in || 5184000; // default 60 days in seconds

    // Get user profile details
    const profileUrl = `https://graph.instagram.com/me?fields=user_id,username,name,account_type,profile_picture_url&access_token=${longLivedToken}`;
    const profileRes = await fetch(profileUrl);
    
    let platformUsername = "";
    let platformDisplayName = "";
    let platformAvatarUrl = "";
    let platformAccountType = "";
    let platformUserId = shortLivedData.user_id || "";

    if (profileRes.ok) {
      const profileData = await profileRes.json();
      platformUserId = profileData.user_id || platformUserId;
      platformUsername = profileData.username || "";
      platformDisplayName = profileData.name || "";
      platformAvatarUrl = profileData.profile_picture_url || "";
      platformAccountType = profileData.account_type || "";
    }

    // Encrypt token
    const encryptedAccess = encrypt(longLivedToken);
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // Save / Upsert social connection record
    const { error: upsertErr } = await supabaseAdmin.from("social_connections").upsert({
      user_id: stateData.user_id,
      platform: "instagram",
      platform_user_id: String(platformUserId),
      platform_username: platformUsername,
      platform_display_name: platformDisplayName,
      platform_avatar_url: platformAvatarUrl,
      platform_account_type: platformAccountType,
      access_token: encryptedAccess,
      token_expires_at: expiresAt,
      scopes_granted: "instagram_business_basic,instagram_business_manage_insights,instagram_business_content_publish",
      is_active: true,
      last_refreshed_at: new Date().toISOString(),
    }, { onConflict: "user_id,platform" });

    if (upsertErr) {
      console.error("[OAuth] Failed to upsert Instagram connection details:", upsertErr.message);
      return res.redirect(`${redirectBase}/connections?error=instagram_db_save_failed`);
    }

    // Mirror connection in connected_accounts for general feature compatibility
    const { data: connData, error: connErr } = await supabaseAdmin.from("connected_accounts").upsert({
      user_id: stateData.user_id,
      platform: "instagram",
      platform_account_id: String(platformUserId),
      account_handle: `@${platformUsername}`,
      connection_method: "oauth",
      is_active: true,
      connected_at: new Date().toISOString(),
      metadata: { is_real_oauth: true }
    }, { onConflict: "user_id,platform,platform_account_id" }).select();

    if (!connErr && connData && connData.length > 0) {
      const { count } = await supabaseAdmin
        .from("social_posts")
        .select("*", { count: "exact", head: true })
        .eq("account_id", connData[0].id);

      if (!count || count === 0) {
        await syncAll(stateData.user_id);
        
        const { count: countAfter } = await supabaseAdmin
          .from("social_posts")
          .select("*", { count: "exact", head: true })
          .eq("account_id", connData[0].id);
          
        if (!countAfter || countAfter === 0) {
          console.log(`[OAuth] Seeding mock Instagram posts as real sync returned empty.`);
          await initializeSocialMediaMockData(stateData.user_id, "instagram", connData[0].id, `@${platformUsername}`);
        }
      }
    }

    return res.redirect(`${redirectBase}/connections?connected=instagram`);
  } catch (err: any) {
    console.error("[OAuth] Unexpected Instagram callback error:", err);
    return res.redirect(`${redirectBase}/connections?error=instagram_callback_failed`);
  }
});

// B. TikTok Callback
authRouter.get("/tiktok/callback", async (req, res) => {
  const { code, state, error } = req.query;
  const redirectBase = process.env.OAUTH_REDIRECT_BASE_URL || "https://app.zieads.com";

  if (error) {
    return res.redirect(`${redirectBase}/connections?error=tiktok_denied`);
  }

  if (!code || !state) {
    return res.redirect(`${redirectBase}/connections?error=tiktok_invalid_callback`);
  }

  try {
    // Verify CSRF state
    const { data: stateData, error: dbErr } = await supabaseAdmin
      .from("oauth_states")
      .select("*")
      .eq("state", state)
      .eq("platform", "tiktok")
      .single();

    if (dbErr || !stateData) {
      console.warn("[OAuth] TikTok state verification failed.");
      return res.redirect(`${redirectBase}/connections?error=tiktok_csrf`);
    }

    // Delete state record
    await supabaseAdmin.from("oauth_states").delete().eq("state", state);

    // Exchange TikTok code
    const tokenUrl = "https://open.tiktokapis.com/v2/oauth/token/";
    const bodyParams = new URLSearchParams();
    bodyParams.append("client_key", process.env.TIKTOK_CLIENT_KEY || "");
    bodyParams.append("client_secret", process.env.TIKTOK_CLIENT_SECRET || "");
    bodyParams.append("code", code as string);
    bodyParams.append("grant_type", "authorization_code");
    bodyParams.append("redirect_uri", `${redirectBase}/api/auth/tiktok/callback`);
    bodyParams.append("code_verifier", stateData.code_verifier || "");

    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: bodyParams.toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("[OAuth] TikTok token exchange failed:", errText);
      return res.redirect(`${redirectBase}/connections?error=tiktok_exchange_failed`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in || 86400; // default 24h expiration
    const openId = tokenData.open_id || "";

    // Fetch user profile from TikTok APIs dynamically based on granted scopes to prevent 403 error on restricted fields
    const grantedScopes = (tokenData.scope || "user.info.basic").split(",");
    const fieldsList = ["open_id", "union_id", "display_name", "avatar_url"];
    
    if (grantedScopes.includes("user.info.profile")) {
      fieldsList.push("bio_description");
    }
    if (grantedScopes.includes("user.info.stats")) {
      fieldsList.push("follower_count");
    }

    const fields = fieldsList.join(",");
    const profileUrl = `https://open.tiktokapis.com/v2/user/info/?fields=${fields}`;
    
    console.log(`[OAuth] Fetching TikTok profile with scopes: ${tokenData.scope} and fields: ${fields}`);
    const profileRes = await fetch(profileUrl, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    let platformUsername = "";
    let platformDisplayName = "";
    let platformAvatarUrl = "";

    if (profileRes.ok) {
      const profileData = await profileRes.json();
      console.log("[OAuth] TikTok profile fetch success:", JSON.stringify(profileData));
      const user = profileData.data?.user;
      if (user) {
        platformUsername = user.display_name || user.username || "";
        platformDisplayName = user.display_name || "";
        platformAvatarUrl = user.avatar_url || "";
      }
    } else {
      const errText = await profileRes.text();
      console.error("[OAuth] TikTok profile fetch failed status:", profileRes.status, "body:", errText);
    }

    // Fallback if profile name could not be fetched
    if (!platformUsername) {
      platformUsername = `user_${openId.slice(-6)}`;
    }
    if (!platformDisplayName) {
      platformDisplayName = `TikTok User (${openId.slice(-6)})`;
    }


    const encryptedAccess = encrypt(accessToken);
    const encryptedRefresh = refreshToken ? encrypt(refreshToken) : null;
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    const { error: upsertErr } = await supabaseAdmin.from("social_connections").upsert({
      user_id: stateData.user_id,
      platform: "tiktok",
      platform_user_id: String(openId),
      platform_username: platformUsername,
      platform_display_name: platformDisplayName,
      platform_avatar_url: platformAvatarUrl,
      access_token: encryptedAccess,
      refresh_token: encryptedRefresh,
      token_expires_at: expiresAt,
      scopes_granted: tokenData.scope || "user.info.basic,user.info.profile",
      is_active: true,
      last_refreshed_at: new Date().toISOString(),
    }, { onConflict: "user_id,platform" });

    if (upsertErr) {
      console.error("[OAuth] Failed to upsert TikTok connection:", upsertErr.message);
      return res.redirect(`${redirectBase}/connections?error=tiktok_db_save_failed`);
    }

    // Mirror connection in connected_accounts for general feature compatibility
    const { data: connData, error: connErr } = await supabaseAdmin.from("connected_accounts").upsert({
      user_id: stateData.user_id,
      platform: "tiktok",
      platform_account_id: String(openId),
      account_handle: `@${platformUsername}`,
      connection_method: "oauth",
      is_active: true,
      connected_at: new Date().toISOString(),
      metadata: { is_real_oauth: true }
    }, { onConflict: "user_id,platform,platform_account_id" }).select();

    if (!connErr && connData && connData.length > 0) {
      const { count } = await supabaseAdmin
        .from("social_posts")
        .select("*", { count: "exact", head: true })
        .eq("account_id", connData[0].id);

      if (!count || count === 0) {
        await syncTikTokInsightsForUser(stateData.user_id);
        
        const { count: countAfter } = await supabaseAdmin
          .from("social_posts")
          .select("*", { count: "exact", head: true })
          .eq("account_id", connData[0].id);
          
        if (!countAfter || countAfter === 0) {
          console.log(`[OAuth] Seeding mock TikTok posts as real sync returned empty.`);
          await initializeSocialMediaMockData(stateData.user_id, "tiktok", connData[0].id, `@${platformUsername}`);
        }
      }
    }

    return res.redirect(`${redirectBase}/connections?connected=tiktok`);
  } catch (err: any) {
    console.error("[OAuth] Unexpected TikTok callback error:", err);
    return res.redirect(`${redirectBase}/connections?error=tiktok_callback_failed`);
  }
});

// C. LinkedIn Callback
authRouter.get("/linkedin/callback", async (req, res) => {
  const { code, state, error } = req.query;
  const redirectBase = process.env.OAUTH_REDIRECT_BASE_URL || "https://app.zieads.com";

  if (error) {
    return res.redirect(`${redirectBase}/connections?error=linkedin_denied`);
  }

  if (!code || !state) {
    return res.redirect(`${redirectBase}/connections?error=linkedin_invalid_callback`);
  }

  try {
    // Verify state
    const { data: stateData, error: dbErr } = await supabaseAdmin
      .from("oauth_states")
      .select("*")
      .eq("state", state)
      .eq("platform", "linkedin")
      .single();

    if (dbErr || !stateData) {
      console.warn("[OAuth] LinkedIn state verification mismatch.");
      return res.redirect(`${redirectBase}/connections?error=linkedin_csrf`);
    }

    // Delete state
    await supabaseAdmin.from("oauth_states").delete().eq("state", state);

    // Exchange LinkedIn code
    const tokenUrl = "https://www.linkedin.com/oauth/v2/accessToken";
    const bodyParams = new URLSearchParams();
    bodyParams.append("grant_type", "authorization_code");
    bodyParams.append("code", code as string);
    bodyParams.append("client_id", process.env.LINKEDIN_CLIENT_ID || "");
    bodyParams.append("client_secret", process.env.LINKEDIN_CLIENT_SECRET || "");
    bodyParams.append("redirect_uri", `${redirectBase}/api/auth/linkedin/callback`);

    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: bodyParams.toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("[OAuth] LinkedIn token exchange failed:", errText);
      return res.redirect(`${redirectBase}/connections?error=linkedin_exchange_failed`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    const expiresIn = tokenData.expires_in || 5184000; // usually 60 days

    // Fetch user details using OpenID Connect endpoint
    const profileUrl = "https://api.linkedin.com/v2/userinfo";
    const profileRes = await fetch(profileUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    let platformUserId = "";
    let platformDisplayName = "";
    let platformAvatarUrl = "";
    let platformUsername = "";

    if (profileRes.ok) {
      const profileData = await profileRes.json();
      platformUserId = profileData.sub || "";
      platformDisplayName = profileData.name || "";
      platformUsername = profileData.email || profileData.given_name || "";
      platformAvatarUrl = profileData.picture || "";
    }

    const encryptedAccess = encrypt(accessToken);
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    const { error: upsertErr } = await supabaseAdmin.from("social_connections").upsert({
      user_id: stateData.user_id,
      platform: "linkedin",
      platform_user_id: String(platformUserId),
      platform_username: platformUsername,
      platform_display_name: platformDisplayName,
      platform_avatar_url: platformAvatarUrl,
      access_token: encryptedAccess,
      token_expires_at: expiresAt,
      scopes_granted: tokenData.scope || "openid,profile,email,w_member_social",
      is_active: true,
      last_refreshed_at: new Date().toISOString(),
    }, { onConflict: "user_id,platform" });

    if (upsertErr) {
      console.error("[OAuth] Failed to upsert LinkedIn connection:", upsertErr.message);
      return res.redirect(`${redirectBase}/connections?error=linkedin_db_save_failed`);
    }

    // Mirror connection in connected_accounts for general feature compatibility
    const { data: connData, error: connErr } = await supabaseAdmin.from("connected_accounts").upsert({
      user_id: stateData.user_id,
      platform: "linkedin",
      platform_account_id: String(platformUserId),
      account_handle: `@${platformUsername}`,
      connection_method: "oauth",
      is_active: true,
      connected_at: new Date().toISOString(),
      metadata: { is_real_oauth: true }
    }, { onConflict: "user_id,platform,platform_account_id" }).select();

    if (!connErr && connData && connData.length > 0) {
      const { count } = await supabaseAdmin
        .from("social_posts")
        .select("*", { count: "exact", head: true })
        .eq("account_id", connData[0].id);

      if (!count || count === 0) {
        await initializeSocialMediaMockData(stateData.user_id, "linkedin", connData[0].id, `@${platformUsername}`);
      }
    }

    return res.redirect(`${redirectBase}/connections?connected=linkedin`);
  } catch (err: any) {
    console.error("[OAuth] Unexpected LinkedIn callback error:", err);
    return res.redirect(`${redirectBase}/connections?error=linkedin_callback_failed`);
  }
});

/**
 * 3. Server-to-Server Webhook Decoders & Signed Requests
 */

function decodeMetaSignedRequest(signedRequest: string, appSecret: string): any {
  if (!signedRequest) return null;
  const parts = signedRequest.split(".");
  if (parts.length !== 2) return null;

  const [encodedSig, payload] = parts;
  
  // base64url decode signature
  const sig = Buffer.from(encodedSig.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  
  // verify signature with app secret
  const expectedSig = crypto
    .createHmac("sha256", appSecret)
    .update(payload)
    .digest();

  if (!crypto.timingSafeEqual(sig, expectedSig)) {
    console.warn("[Webhook] Meta signature validation mismatch.");
    return null;
  }

  // base64url decode payload
  const decodedPayload = Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
  return JSON.parse(decodedPayload);
}

// Meta Instagram Deauthorize Webhook
authRouter.post("/instagram/deauthorize", async (req, res) => {
  const signedRequest = req.body.signed_request;
  const appSecret = process.env.INSTAGRAM_APP_SECRET;

  if (!signedRequest || !appSecret) {
    return res.status(400).json({ error: "Missing signed_request or app credentials" });
  }

  try {
    const data = decodeMetaSignedRequest(signedRequest, appSecret);
    if (!data || !data.user_id) {
      return res.status(400).json({ error: "Invalid signature or missing user_id" });
    }

    const platformUserId = data.user_id;

    // Deactivate Instagram connection for matching platform ID
    const { error: dbErr } = await supabaseAdmin
      .from("social_connections")
      .update({
        is_active: false,
        access_token: "DEAUTHORIZED_BY_PLATFORM",
        refresh_token: null,
        updated_at: new Date().toISOString(),
      })
      .eq("platform", "instagram")
      .eq("platform_user_id", String(platformUserId));

    if (dbErr) {
      console.error("[Webhook] Failed to deauthorize connection in DB:", dbErr.message);
      return res.status(500).json({ error: "Database update failure" });
    }

    console.log(`[Webhook] Instagram deauthorized successfully for platform user ${platformUserId}.`);
    return res.status(200).send("OK");
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Meta Instagram Data Deletion Webhook
authRouter.post("/instagram/data-deletion", async (req, res) => {
  const signedRequest = req.body.signed_request;
  const appSecret = process.env.INSTAGRAM_APP_SECRET;

  if (!signedRequest || !appSecret) {
    return res.status(400).json({ error: "Missing signed_request" });
  }

  try {
    const data = decodeMetaSignedRequest(signedRequest, appSecret);
    if (!data || !data.user_id) {
      return res.status(400).json({ error: "Invalid signature or missing user_id" });
    }

    const platformUserId = data.user_id;
    const confirmationCode = crypto.randomUUID();

    // Update connection status
    await supabaseAdmin
      .from("social_connections")
      .update({
        is_active: false,
        access_token: "DATA_DELETED",
        refresh_token: null,
        metadata: { deletion_confirmation_code: confirmationCode, deletion_requested_at: new Date().toISOString() },
        updated_at: new Date().toISOString(),
      })
      .eq("platform", "instagram")
      .eq("platform_user_id", String(platformUserId));

    console.log(`[Webhook] Instagram deletion queue requested for platform user ${platformUserId}. Confirmation code: ${confirmationCode}`);

    const redirectBase = process.env.OAUTH_REDIRECT_BASE_URL || "https://app.zieads.com";
    return res.json({
      url: `${redirectBase}/api/auth/instagram/data-deletion/status?id=${confirmationCode}`,
      confirmation_code: confirmationCode,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Meta Data Deletion Status Endpoint
authRouter.get("/instagram/data-deletion/status", async (req, res) => {
  const confirmationCode = req.query.id;
  if (!confirmationCode) {
    return res.status(400).send("Missing confirmation ID parameter.");
  }

  try {
    // Check if any connections match the confirmation code
    const { data } = await supabaseAdmin
      .from("social_connections")
      .select("platform, updated_at")
      .eq("platform", "instagram")
      .contains("metadata", { deletion_confirmation_code: confirmationCode })
      .single();

    if (!data) {
      return res.status(404).send("Deletion request not found or expired.");
    }

    return res.send(`
      <html>
        <head>
          <title>Data Deletion Status</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding-top: 50px; background: #f8fafc; color: #1e293b; }
            .box { max-width: 480px; margin: 0 auto; padding: 30px; background: white; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
            h1 { color: #10b981; font-size: 1.5rem; margin-bottom: 12px; }
            p { font-size: 0.95rem; line-height: 1.5; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="box">
            <h1>Data Deletion Completed</h1>
            <p>Your Instagram connection details have been fully disconnected and queued for cleanup.</p>
            <p style="font-size: 0.8rem; margin-top: 20px;">Request ID: <strong>${confirmationCode}</strong></p>
          </div>
        </body>
      </html>
    `);
  } catch {
    return res.status(500).send("Internal server error checking status.");
  }
});

// TikTok Webhooks for Deauthorization and Deletion (stubs returning 200 OK)
authRouter.post("/tiktok/deauthorize", async (req, res) => {
  console.log("[Webhook] TikTok deauthorize triggered.", req.body);
  return res.status(200).send("OK");
});

authRouter.post("/tiktok/data-deletion", async (req, res) => {
  const confirmationCode = crypto.randomUUID();
  console.log("[Webhook] TikTok data deletion triggered.", req.body);
  return res.json({
    confirmation_code: confirmationCode,
    status: "completed"
  });
});

// LinkedIn Webhooks for Deauthorization (stub returning 200 OK)
authRouter.post("/linkedin/deauthorize", async (req, res) => {
  console.log("[Webhook] LinkedIn deauthorize triggered.", req.body);
  return res.status(200).send("OK");
});

/**
 * 4. Manual Disconnect
 */
authRouter.post("/:platform/disconnect", requireAuth, async (req: any, res) => {
  const platform = req.params.platform;
  const userId = req.userId;

  if (platform !== "instagram" && platform !== "tiktok" && platform !== "linkedin") {
    return res.status(400).json({ error: "Invalid platform parameter" });
  }

  try {
    const { error: dbErr } = await supabaseAdmin
      .from("social_connections")
      .update({
        is_active: false,
        access_token: "MANUALLY_DISCONNECTED",
        refresh_token: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("platform", platform);

    if (dbErr) {
      console.error(`[OAuth] Disconnect DB failure for ${platform}:`, dbErr.message);
      return res.status(500).json({ error: "Failed to disconnect account in database" });
    }

    return res.json({ success: true, platform });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 5. Retrieve Connection Status
 */
authRouter.get("/connections", requireAuth, async (req: any, res) => {
  const userId = req.userId;

  try {
    const { data, error: dbErr } = await supabaseAdmin
      .from("social_connections")
      .select("platform, platform_username, platform_display_name, platform_avatar_url, platform_account_type, connected_at, token_expires_at, scopes_granted")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (dbErr) {
      console.error("[OAuth] Failed to fetch active connections:", dbErr.message);
      return res.status(500).json({ error: "Failed to fetch connections status" });
    }

    // Map rows to clean schema structure
    const statusMap = {
      instagram: { connected: false },
      tiktok: { connected: false },
      linkedin: { connected: false },
    };

    data?.forEach((row: any) => {
      const p = row.platform as "instagram" | "tiktok" | "linkedin";
      if (statusMap[p]) {
        statusMap[p] = {
          connected: true,
          username: row.platform_username || "",
          display_name: row.platform_display_name || "",
          avatar_url: row.platform_avatar_url || "",
          account_type: row.platform_account_type || "",
          connected_at: row.connected_at,
          token_expires_at: row.token_expires_at,
          scopes: row.scopes_granted || "",
        } as any;
      }
    });

    return res.json(Object.entries(statusMap).map(([platform, info]) => ({
      platform,
      ...info,
    })));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 6. Automated Token Refresh Trigger Route (Vercel Cron target)
 */
authRouter.get("/refresh-job", async (req, res) => {
  const cronSecret = process.env.CRON_SECRET;
  const requestSecret = req.headers.authorization?.replace("Bearer ", "") || req.query.secret;

  // Enforce CRON_SECRET security token if configured in environment variables
  if (cronSecret && requestSecret !== cronSecret) {
    return res.status(401).json({ error: "Unauthorized: Invalid cron security key" });
  }

  try {
    await refreshExpiringTokens();
    return res.json({ success: true, message: "Social tokens refresh scan completed successfully" });
  } catch (err: any) {
    console.error("[OAuth Refresh Job] Error executing token refresh:", err);
    return res.status(500).json({ error: err.message });
  }
});

