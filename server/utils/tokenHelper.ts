import { supabaseAdmin } from '../supabaseServer.js';
import { decrypt } from './crypto.js';

export interface DecryptedConnection {
  token: string;
  platformUserId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  scopes: string;
}

/**
 * Retrieve and decrypt a user's access token for a given platform.
 * Returns null if no active connection exists.
 */
export async function getDecryptedToken(
  userId: string,
  platform: string
): Promise<DecryptedConnection | null> {
  const { data, error } = await supabaseAdmin
    .from('social_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('platform', platform)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) {
    console.log(`[TokenHelper] No active ${platform} connection for user ${userId}`);
    return null;
  }

  try {
    const token = decrypt(data.access_token);
    return {
      token,
      platformUserId: data.platform_user_id,
      username: data.platform_username || '',
      displayName: data.platform_display_name || '',
      avatarUrl: data.platform_avatar_url || '',
      scopes: data.scopes_granted || '',
    };
  } catch (err: any) {
    console.error(`[TokenHelper] Failed to decrypt ${platform} token for user ${userId}:`, err.message);
    return null;
  }
}

/**
 * Get all active connections for a user with decrypted tokens.
 */
export async function getAllDecryptedConnections(
  userId: string
): Promise<Array<DecryptedConnection & { platform: string }>> {
  const { data, error } = await supabaseAdmin
    .from('social_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error || !data) return [];

  const connections: Array<DecryptedConnection & { platform: string }> = [];
  for (const conn of data) {
    try {
      const token = decrypt(conn.access_token);
      connections.push({
        platform: conn.platform,
        token,
        platformUserId: conn.platform_user_id,
        username: conn.platform_username || '',
        displayName: conn.platform_display_name || '',
        avatarUrl: conn.platform_avatar_url || '',
        scopes: conn.scopes_granted || '',
      });
    } catch (err: any) {
      console.error(`[TokenHelper] Failed to decrypt ${conn.platform} token:`, err.message);
    }
  }
  return connections;
}
