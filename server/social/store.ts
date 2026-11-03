/*
  Saving and loading connections for the networks in server/social/. Same tables as the original four:
  social_connections (one row per user and platform, tokens encrypted) mirrored into connected_accounts,
  which the Composer, Calendar and Analytics read.
*/
import { supabaseAdmin } from "../supabaseServer.js";
import { encrypt, decrypt } from "../utils/crypto.js";
import { logActivity } from "../activity.js";

export interface SaveInput {
  platformUserId: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  accountType?: string;
  accessToken: string;
  refreshToken?: string | null;
  expiresInSec?: number | null;
  scopes?: string;
  metadata?: Record<string, unknown>;
}

export async function saveConnection(userId: string, platform: string, s: SaveInput) {
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin.from("social_connections").upsert(
    {
      user_id: userId,
      platform,
      platform_user_id: String(s.platformUserId),
      platform_username: s.username || "",
      platform_display_name: s.displayName || s.username || "",
      platform_avatar_url: s.avatarUrl || "",
      platform_account_type: s.accountType || null,
      access_token: encrypt(s.accessToken),
      refresh_token: s.refreshToken ? encrypt(s.refreshToken) : null,
      token_expires_at: s.expiresInSec ? new Date(Date.now() + s.expiresInSec * 1000).toISOString() : null,
      scopes_granted: s.scopes || "",
      status: "live",
      last_error_message: null,
      is_active: true,
      connected_at: now,
      last_refreshed_at: now,
      metadata: s.metadata || {},
      updated_at: now,
    },
    { onConflict: "user_id,platform" }
  );
  if (error) throw new Error(`Could not save the ${platform} connection: ${error.message}`);
  const handle = s.username ? (s.username.startsWith("@") || platform === "discord" || platform === "telegram" ? s.username : `@${s.username}`) : s.displayName || platform;
  await supabaseAdmin.from("connected_accounts").upsert(
    {
      user_id: userId,
      platform,
      platform_account_id: String(s.platformUserId),
      account_handle: handle,
      connection_method: "oauth",
      is_active: true,
      connected_at: now,
      metadata: { is_real_oauth: true },
    },
    { onConflict: "user_id,platform,platform_account_id" }
  );
  await logActivity(userId, "user", "connection.connected", "platform", platform, { handle });
}

export interface LoadedConnection {
  id: string;
  userId: string;
  platform: string;
  platformUserId: string;
  username: string;
  displayName: string;
  token: string;
  refreshToken: string | null;
  expiresAt: string | null;
  scopes: string;
  metadata: Record<string, any>;
}

export async function loadConnection(userId: string, platform: string): Promise<LoadedConnection | null> {
  const { data } = await supabaseAdmin.from("social_connections").select("*").eq("user_id", userId).eq("platform", platform).eq("is_active", true).maybeSingle();
  if (!data) return null;
  try {
    return {
      id: data.id,
      userId,
      platform,
      platformUserId: data.platform_user_id,
      username: data.platform_username || "",
      displayName: data.platform_display_name || "",
      token: decrypt(data.access_token),
      refreshToken: data.refresh_token ? decrypt(data.refresh_token) : null,
      expiresAt: data.token_expires_at || null,
      scopes: data.scopes_granted || "",
      metadata: data.metadata || {},
    };
  } catch {
    return null;
  }
}

/** Store a refreshed token pair (refresh tokens rotate on some networks) */
export async function updateTokens(c: LoadedConnection, accessToken: string, expiresInSec?: number | null, refreshToken?: string | null) {
  c.token = accessToken;
  if (refreshToken) c.refreshToken = refreshToken;
  const patch: Record<string, unknown> = { access_token: encrypt(accessToken), last_refreshed_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  if (expiresInSec) patch.token_expires_at = new Date(Date.now() + expiresInSec * 1000).toISOString();
  if (refreshToken) patch.refresh_token = encrypt(refreshToken);
  await supabaseAdmin.from("social_connections").update(patch).eq("id", c.id);
}

export async function updateMetadata(c: LoadedConnection, patch: Record<string, unknown>) {
  c.metadata = { ...c.metadata, ...patch };
  await supabaseAdmin.from("social_connections").update({ metadata: c.metadata, updated_at: new Date().toISOString() }).eq("id", c.id);
}

/** True when the access token has under 5 minutes left */
export const expiringSoon = (c: LoadedConnection) => !!c.expiresAt && new Date(c.expiresAt).getTime() - Date.now() < 5 * 60000;
