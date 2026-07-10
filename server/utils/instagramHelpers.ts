import { getDecryptedToken } from './tokenHelper.js';
import Anthropic from '@anthropic-ai/sdk';

export interface ConnectedInstagram {
  accessToken: string;
  platformUserId: string;
  platformUsername: string;
}

/**
 * Query social_connections for the active Instagram connection of a user
 * and return the decrypted token and profile details.
 */
export async function getConnectedInstagram(userId: string): Promise<ConnectedInstagram | null> {
  const conn = await getDecryptedToken(userId, 'instagram');
  if (!conn) return null;
  return {
    accessToken: conn.token,
    platformUserId: conn.platformUserId,
    platformUsername: conn.username,
  };
}

/**
 * Reusable wrapper for making requests to the Instagram Graph API v21.0.
 */
export async function callInstagramAPI<T = any>(
  accessToken: string,
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const IG_API_BASE = 'https://graph.instagram.com/v21.0';
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${IG_API_BASE}/${endpoint}${separator}access_token=${encodeURIComponent(accessToken)}`;
  
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });

  const body = await res.json();

  if (!res.ok) {
    const errMsg = body?.error?.message || JSON.stringify(body);
    console.error(`[InstagramAPI Helper] ${res.status} Error:`, errMsg);
    throw new Error(`Instagram API Error (${res.status}): ${errMsg}`);
  }

  return body as T;
}

/**
 * Returns an initialized Anthropic SDK client.
 */
export function getClaudeClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not configured.");
  }
  return new Anthropic({ apiKey });
}

/**
 * Validates the request's Authorization header against the CRON_SECRET.
 */
export function verifyCronSecret(req: any): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    // If not configured, default to true or warning
    console.warn("CRON_SECRET environment variable is not configured. Allowing cron execution.");
    return true;
  }
  const authHeader = req.headers.authorization;
  return authHeader === `Bearer ${cronSecret}`;
}
