/*
  OAuth for Threads, Pinterest, YouTube and Mastodon. Each provider builds its consent URL,
  turns the returned code into tokens plus a profile, and (where tokens expire) refreshes them.
  Callback address for every one: {OAUTH_REDIRECT_BASE_URL}/api/auth/{platform}/callback
  Server env:
    Threads    THREADS_APP_ID, THREADS_APP_SECRET           (Meta app with the Threads use case)
    Pinterest  PINTEREST_APP_ID, PINTEREST_APP_SECRET
    YouTube    GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET       (YouTube Data API v3 enabled)
    Mastodon   none: ZieAds registers itself on each server the first time (mastodon_apps)
    Discord    DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET     (webhook.incoming: Discord asks which server
               and channel, then creates the webhook for ZieAds; no bot and no review)
*/
import { supabaseAdmin } from "../supabaseServer.js";
import type { SaveInput, LoadedConnection } from "./store.js";
import { updateTokens } from "./store.js";

export type OAuthPlatform = "threads" | "pinterest" | "youtube" | "mastodon" | "discord";
export const OAUTH_PLATFORMS: OAuthPlatform[] = ["threads", "pinterest", "youtube", "mastodon", "discord"];

export const ENV_NEEDED: Record<OAuthPlatform, string[]> = {
  threads: ["THREADS_APP_ID", "THREADS_APP_SECRET"],
  pinterest: ["PINTEREST_APP_ID", "PINTEREST_APP_SECRET"],
  youtube: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  mastodon: [],
  discord: ["DISCORD_CLIENT_ID", "DISCORD_CLIENT_SECRET"],
};

export const THREADS_SCOPES = ["threads_basic", "threads_content_publish", "threads_manage_replies", "threads_read_replies", "threads_manage_insights"];
export const PINTEREST_SCOPES = ["boards:read", "boards:write", "pins:read", "pins:write", "user_accounts:read"];
/** Trial access apps may only write to Pinterest's sandbox (Pins visible to the creator only). Set PINTEREST_SANDBOX=1 until Standard access is approved. */
export const pinterestSandbox = () => /^(1|true|yes)$/i.test(process.env.PINTEREST_SANDBOX || "");
export const pinterestApi = () => (pinterestSandbox() ? "https://api-sandbox.pinterest.com/v5" : "https://api.pinterest.com/v5");
export const YOUTUBE_SCOPES = ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube.readonly", "https://www.googleapis.com/auth/youtube.force-ssl"];
export const MASTODON_SCOPES = "read:accounts read:notifications read:statuses write:statuses write:media";

export const callbackUrl = (base: string, p: string) => `${base.replace(/\/$/, "")}/api/auth/${p}/callback`;

async function asJson(res: Response, what: string) {
  const t = await res.text();
  let j: any = {};
  try {
    j = t ? JSON.parse(t) : {};
  } catch {
    j = { raw: t };
  }
  if (!res.ok || j.error) {
    const msg = j.error?.message || j.error_description || j.message || (typeof j.error === "string" ? j.error : "") || t.slice(0, 160);
    throw new Error(`${what} failed (${res.status}): ${msg}`);
  }
  return j;
}

/** Normalizes what a user types as their Mastodon server: "https://Mastodon.Social/" -> "mastodon.social" */
export function normalizeInstance(input: string): string | null {
  const host = String(input || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^@?[^@\s/]+@/, "")
    .replace(/\/.*$/, "");
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host) ? host : null;
}

/** One ZieAds app per Mastodon server, created on first use */
export async function mastodonApp(instance: string, redirectUri: string) {
  const { data } = await supabaseAdmin.from("mastodon_apps").select("*").eq("instance", instance).maybeSingle();
  if (data && data.redirect_uri === redirectUri) return data as { client_id: string; client_secret: string; redirect_uri: string };
  const res = await fetch(`https://${instance}/api/v1/apps`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_name: "ZieAds", redirect_uris: redirectUri, scopes: MASTODON_SCOPES, website: "https://www.zieads.com" }),
  });
  const j = await asJson(res, `Registering ZieAds on ${instance}`);
  const row = { instance, client_id: j.client_id, client_secret: j.client_secret, redirect_uri: redirectUri };
  await supabaseAdmin.from("mastodon_apps").upsert(row, { onConflict: "instance" });
  return row;
}

/** Consent screen address. Exported for tests. */
export function authUrl(p: OAuthPlatform, state: string, base: string, extra: { instance?: string; clientId?: string } = {}): string {
  const cb = encodeURIComponent(callbackUrl(base, p));
  if (p === "threads") return `https://threads.net/oauth/authorize?client_id=${process.env.THREADS_APP_ID}&redirect_uri=${cb}&scope=${THREADS_SCOPES.join(",")}&response_type=code&state=${state}`;
  if (p === "pinterest") return `https://www.pinterest.com/oauth/?client_id=${process.env.PINTEREST_APP_ID}&redirect_uri=${cb}&response_type=code&scope=${PINTEREST_SCOPES.join(",")}&state=${state}`;
  if (p === "youtube") {
    const scope = encodeURIComponent(YOUTUBE_SCOPES.join(" "));
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${cb}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&include_granted_scopes=true&state=${state}`;
  }
  if (p === "discord") return `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${cb}&response_type=code&scope=webhook.incoming&state=${state}`;
  return `https://${extra.instance}/oauth/authorize?client_id=${encodeURIComponent(extra.clientId || "")}&redirect_uri=${cb}&response_type=code&scope=${encodeURIComponent(MASTODON_SCOPES)}&state=${state}`;
}

/** Code -> tokens and profile, ready for saveConnection */
export async function exchange(p: OAuthPlatform, code: string, base: string, meta: Record<string, any> = {}): Promise<SaveInput> {
  const redirect = callbackUrl(base, p);

  if (p === "threads") {
    const short = await asJson(
      await fetch("https://graph.threads.net/oauth/access_token", {
        method: "POST",
        body: new URLSearchParams({ client_id: process.env.THREADS_APP_ID || "", client_secret: process.env.THREADS_APP_SECRET || "", grant_type: "authorization_code", redirect_uri: redirect, code }),
      }),
      "Threads token exchange"
    );
    // Short tokens last an hour; the long one lasts 60 days and is refreshed before it ends
    const long = await asJson(
      await fetch(`https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=${encodeURIComponent(process.env.THREADS_APP_SECRET || "")}&access_token=${encodeURIComponent(short.access_token)}`),
      "Threads long lived token"
    );
    const me = await asJson(await fetch(`https://graph.threads.net/v1.0/me?fields=id,username,name,threads_profile_picture_url&access_token=${encodeURIComponent(long.access_token)}`), "Threads profile");
    return { platformUserId: me.id || short.user_id, username: me.username, displayName: me.name || me.username, avatarUrl: me.threads_profile_picture_url, accessToken: long.access_token, expiresInSec: long.expires_in || 5184000, scopes: THREADS_SCOPES.join(",") };
  }

  if (p === "pinterest") {
    const basic = Buffer.from(`${process.env.PINTEREST_APP_ID}:${process.env.PINTEREST_APP_SECRET}`).toString("base64");
    const t = await asJson(
      await fetch("https://api.pinterest.com/v5/oauth/token", {
        method: "POST",
        headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirect }),
      }),
      "Pinterest token exchange"
    );
    const H = { Authorization: `Bearer ${t.access_token}` };
    const me = await asJson(await fetch("https://api.pinterest.com/v5/user_account", { headers: H }), "Pinterest profile");
    const boards = await asJson(await fetch(`${pinterestApi()}/boards?page_size=100`, { headers: H }), "Pinterest boards").catch(() => ({ items: [] }));
    const list = (boards.items || []).map((b: any) => ({ id: b.id, name: b.name }));
    // The sandbox starts empty and has no app to make boards in, so ZieAds makes one
    if (!list.length && pinterestSandbox()) {
      const made = await asJson(await fetch(`${pinterestApi()}/boards`, { method: "POST", headers: { ...H, "Content-Type": "application/json" }, body: JSON.stringify({ name: "ZieAds", privacy: "PUBLIC" }) }), "Pinterest sandbox board").catch(() => null);
      if (made?.id) list.push({ id: made.id, name: made.name || "ZieAds" });
    }
    return {
      platformUserId: me.id || me.username,
      username: me.username,
      displayName: me.business_name || me.username,
      avatarUrl: me.profile_image,
      accountType: me.account_type,
      accessToken: t.access_token,
      refreshToken: t.refresh_token,
      expiresInSec: t.expires_in,
      scopes: t.scope || PINTEREST_SCOPES.join(","),
      metadata: { boards: list, default_board_id: list[0]?.id || null, sandbox: pinterestSandbox() },
    };
  }

  if (p === "youtube") {
    const t = await asJson(
      await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID || "", client_secret: process.env.GOOGLE_CLIENT_SECRET || "", redirect_uri: redirect, grant_type: "authorization_code" }),
      }),
      "Google token exchange"
    );
    const ch = await asJson(await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true", { headers: { Authorization: `Bearer ${t.access_token}` } }), "YouTube channel");
    const c = ch.items?.[0];
    if (!c) throw new Error("This Google account has no YouTube channel. Create one on YouTube, then connect again.");
    return {
      platformUserId: c.id,
      username: (c.snippet?.customUrl || "").replace(/^@/, "") || c.snippet?.title,
      displayName: c.snippet?.title,
      avatarUrl: c.snippet?.thumbnails?.default?.url,
      accountType: "channel",
      accessToken: t.access_token,
      refreshToken: t.refresh_token,
      expiresInSec: t.expires_in,
      scopes: t.scope || YOUTUBE_SCOPES.join(" "),
      metadata: { subscribers: Number(c.statistics?.subscriberCount) || null },
    };
  }

  if (p === "discord") {
    const t = await asJson(
      await fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ client_id: process.env.DISCORD_CLIENT_ID || "", client_secret: process.env.DISCORD_CLIENT_SECRET || "", grant_type: "authorization_code", code, redirect_uri: redirect }),
      }),
      "Discord token exchange"
    );
    const w = t.webhook;
    if (!w?.id || !w?.token) throw new Error("Discord did not create the webhook. Pick a channel and try again.");
    const url = w.url || `https://discord.com/api/webhooks/${w.id}/${w.token}`;
    return {
      platformUserId: String(w.id),
      username: w.name || "ZieAds",
      displayName: w.name ? `${w.name} (channel ${w.channel_id})` : `Channel ${w.channel_id}`,
      avatarUrl: w.avatar ? `https://cdn.discordapp.com/avatars/${w.id}/${w.avatar}.png` : "",
      accountType: "webhook",
      accessToken: url,
      scopes: "webhook.incoming",
      metadata: { guild_id: w.guild_id || null, channel_id: w.channel_id || null, webhook_name: w.name || null, connected_via: "oauth" },
    };
  }

  // Mastodon
  const instance = String(meta.instance || "");
  const app = await mastodonApp(instance, redirect);
  const t = await asJson(
    await fetch(`https://${instance}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grant_type: "authorization_code", code, client_id: app.client_id, client_secret: app.client_secret, redirect_uri: redirect, scope: MASTODON_SCOPES }),
    }),
    "Mastodon token exchange"
  );
  const me = await asJson(await fetch(`https://${instance}/api/v1/accounts/verify_credentials`, { headers: { Authorization: `Bearer ${t.access_token}` } }), "Mastodon profile");
  return {
    platformUserId: `${me.id}@${instance}`,
    username: `${me.username}@${instance}`,
    displayName: me.display_name || me.username,
    avatarUrl: me.avatar,
    accessToken: t.access_token,
    scopes: t.scope || MASTODON_SCOPES,
    metadata: { instance, account_id: me.id, url: me.url, max_characters: null },
  };
}

/** Refreshes an access token that is about to end. Mastodon tokens do not expire. */
export async function refresh(c: LoadedConnection): Promise<void> {
  if (c.platform === "youtube") {
    if (!c.refreshToken) throw new Error("YouTube access ended. Reconnect YouTube.");
    const t = await asJson(
      await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        body: new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID || "", client_secret: process.env.GOOGLE_CLIENT_SECRET || "", refresh_token: c.refreshToken, grant_type: "refresh_token" }),
      }),
      "YouTube token refresh"
    );
    return updateTokens(c, t.access_token, t.expires_in, t.refresh_token || null);
  }
  if (c.platform === "pinterest") {
    if (!c.refreshToken) throw new Error("Pinterest access ended. Reconnect Pinterest.");
    const basic = Buffer.from(`${process.env.PINTEREST_APP_ID}:${process.env.PINTEREST_APP_SECRET}`).toString("base64");
    const t = await asJson(
      await fetch("https://api.pinterest.com/v5/oauth/token", {
        method: "POST",
        headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: c.refreshToken }),
      }),
      "Pinterest token refresh"
    );
    return updateTokens(c, t.access_token, t.expires_in, t.refresh_token || null);
  }
  if (c.platform === "threads") {
    const t = await asJson(await fetch(`https://graph.threads.net/refresh_access_token?grant_type=th_refresh_token&access_token=${encodeURIComponent(c.token)}`), "Threads token refresh");
    return updateTokens(c, t.access_token, t.expires_in);
  }
}
