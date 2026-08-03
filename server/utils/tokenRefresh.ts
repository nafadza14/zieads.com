import { supabaseAdmin } from "../supabaseServer.js";
import { encrypt, decrypt } from "./crypto.js";

/**
 * Proactively refreshes any active Instagram or TikTok access tokens 
 * that are scheduled to expire within the next 7 days.
 */
export async function refreshExpiringTokens(): Promise<void> {
  console.log("[Token Refresh] Starting check for expiring social connection tokens...");
  
  // Calculate cutoff timestamp for tokens expiring within 7 days
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  try {
    // Query active connections expiring in the next 7 days
    const { data: expiringConnections, error } = await supabaseAdmin
      .from("social_connections")
      .select("*")
      .eq("is_active", true)
      .lte("token_expires_at", sevenDaysFromNow);

    if (error) {
      console.error("[Token Refresh] Failed to fetch expiring connections:", error.message);
      return;
    }

    if (!expiringConnections || expiringConnections.length === 0) {
      console.log("[Token Refresh] No connections require token refresh at this time.");
      return;
    }

    console.log(`[Token Refresh] Found ${expiringConnections.length} connection(s) to refresh.`);

    for (const connection of expiringConnections) {
      const platform = connection.platform;
      const connectionId = connection.id;

      try {
        let decryptedAccess = "";
        try {
          decryptedAccess = decrypt(connection.access_token);
        } catch (e) {
          console.error(`[Token Refresh] Failed to decrypt access token for connection ${connectionId}:`, e);
          continue;
        }

        if (platform === "instagram") {
          console.log(`[Token Refresh] Refreshing Instagram token for connection ${connectionId}...`);
          
          const refreshUrl = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${decryptedAccess}`;
          const res = await fetch(refreshUrl);

          if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Instagram API error: ${errText}`);
          }

          const data = await res.json();
          const newAccessToken = data.access_token;
          const expiresIn = data.expires_in || 5184000; // default 60 days

          const encryptedNewAccess = encrypt(newAccessToken);
          const newExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

          await supabaseAdmin
            .from("social_connections")
            .update({
              access_token: encryptedNewAccess,
              token_expires_at: newExpiresAt,
              last_refreshed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", connectionId);

          console.log(`[Token Refresh] Instagram token refreshed successfully for connection ${connectionId}.`);

        } else if (platform === "tiktok" && connection.refresh_token) {
          console.log(`[Token Refresh] Refreshing TikTok token for connection ${connectionId}...`);
          
          let decryptedRefresh = "";
          try {
            decryptedRefresh = decrypt(connection.refresh_token);
          } catch (e) {
            console.error(`[Token Refresh] Failed to decrypt refresh token for TikTok connection ${connectionId}:`, e);
            continue;
          }

          const refreshUrl = "https://open.tiktokapis.com/v2/oauth/token/";
          const bodyParams = new URLSearchParams();
          bodyParams.append("client_key", process.env.TIKTOK_CLIENT_KEY || "");
          bodyParams.append("client_secret", process.env.TIKTOK_CLIENT_SECRET || "");
          bodyParams.append("grant_type", "refresh_token");
          bodyParams.append("refresh_token", decryptedRefresh);

          const res = await fetch(refreshUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: bodyParams.toString(),
          });

          if (!res.ok) {
            const errText = await res.text();
            throw new Error(`TikTok API error: ${errText}`);
          }

          const data = await res.json();
          const newAccessToken = data.access_token;
          const newRefreshToken = data.refresh_token;
          const expiresIn = data.expires_in || 86400; // default 24 hours

          const encryptedNewAccess = encrypt(newAccessToken);
          const encryptedNewRefresh = newRefreshToken ? encrypt(newRefreshToken) : null;
          const newExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

          await supabaseAdmin
            .from("social_connections")
            .update({
              access_token: encryptedNewAccess,
              refresh_token: encryptedNewRefresh,
              token_expires_at: newExpiresAt,
              last_refreshed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", connectionId);

          console.log(`[Token Refresh] TikTok token refreshed successfully for connection ${connectionId}.`);

        } else if (platform === "linkedin") {
          // LinkedIn Consumer Tier typically does not support programmatic refresh tokens.
          // Fall back to marking active, but logging that direct user intervention might be needed soon.
          console.warn(`[Token Refresh] LinkedIn connection ${connectionId} is expiring soon. Platform requires manual reconnect.`);
        }
      } catch (err: any) {
        console.error(`[Token Refresh] Failed to refresh token for connection ${connectionId} (${platform}):`, err.message);
        
        // Deactivate connection upon hard failures to prevent automated API blockages
        await supabaseAdmin
          .from("social_connections")
          .update({
            is_active: false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", connectionId);
      }
    }
  } catch (err: any) {
    console.error("[Token Refresh] General error during token refresh execution:", err.message);
  }
}
