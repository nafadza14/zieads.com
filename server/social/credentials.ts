/*
  Networks connected with a credential instead of an OAuth screen:
    Bluesky   handle + app password (Settings, Privacy and security, App passwords). Never the main password.
    Telegram  a channel or group where the ZieAds bot (TELEGRAM_BOT_TOKEN) or the user's own bot is an admin
    Discord   a channel webhook URL (Channel settings, Integrations, Webhooks)
  Each check talks to the network first, so a wrong value is rejected before anything is saved.
*/
import type { SaveInput } from "./store.js";

export type CredentialPlatform = "bluesky" | "telegram" | "discord";
// Manual fallbacks: the one click flows are Sign in with Bluesky, the Telegram bot link and Discord OAuth
export const CREDENTIAL_PLATFORMS: CredentialPlatform[] = ["bluesky", "telegram", "discord"];

export class CredentialError extends Error {}

const BSKY_DEFAULT = "https://bsky.social";
const APP_PASSWORD = /^[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/i;
export const DISCORD_WEBHOOK = /^https:\/\/(?:(?:canary|ptb)\.)?discord(?:app)?\.com\/api\/webhooks\/(\d{15,25})\/([\w-]{30,100})\/?$/;

export const normalizeBskyHandle = (h: string) => String(h || "").trim().replace(/^@/, "").toLowerCase();
export const normalizeTelegramChat = (c: string) => {
  const v = String(c || "").trim().replace(/^https?:\/\/t\.me\//i, "");
  if (/^-?\d{5,20}$/.test(v)) return v;
  const name = v.replace(/^@/, "");
  return /^[a-z][a-z0-9_]{3,31}$/i.test(name) ? `@${name}` : null;
};

/** Bluesky session: also used by the publisher, which signs in fresh for each post */
export async function bskySession(service: string, identifier: string, password: string) {
  const res = await fetch(`${service}/xrpc/com.atproto.server.createSession`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identifier, password }) });
  const j: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new CredentialError(j.error === "AuthenticationRequired" || res.status === 401 ? "Bluesky did not accept that handle and app password." : `Bluesky sign in failed: ${j.message || res.status}`);
  return j as { accessJwt: string; refreshJwt: string; handle: string; did: string };
}

export async function tg(token: string, method: string, body: Record<string, unknown>) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j: any = await res.json().catch(() => ({}));
  if (!j.ok) {
    const err: any = new Error(j.description || `Telegram ${method} failed (${res.status})`);
    err.code = j.error_code || res.status;
    err.retryAfter = j.parameters?.retry_after;
    throw err;
  }
  return j.result;
}

export async function verifyCredentials(p: CredentialPlatform, f: Record<string, string>): Promise<SaveInput> {
  if (p === "bluesky") {
    const handle = normalizeBskyHandle(f.handle);
    const password = String(f.app_password || "").trim();
    if (!handle) throw new CredentialError("Enter your Bluesky handle, for example you.bsky.social.");
    if (!APP_PASSWORD.test(password)) throw new CredentialError("Use an app password (xxxx-xxxx-xxxx-xxxx) from Bluesky Settings, Privacy and security, App passwords. Never your main password.");
    const service = /^https:\/\/[a-z0-9.-]+$/i.test(String(f.service || "")) ? String(f.service).replace(/\/$/, "") : BSKY_DEFAULT;
    const s = await bskySession(service, handle, password);
    let avatar = "";
    let name = s.handle;
    try {
      const pr: any = await (await fetch(`https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(s.did)}`)).json();
      avatar = pr.avatar || "";
      name = pr.displayName || s.handle;
    } catch {
      /* the profile is decoration */
    }
    return { platformUserId: s.did, username: s.handle, displayName: name, avatarUrl: avatar, accessToken: password, scopes: "app_password", metadata: { service, did: s.did, handle: s.handle } };
  }

  if (p === "telegram") {
    const chat = normalizeTelegramChat(f.chat);
    if (!chat) throw new CredentialError("Enter the channel as @channelname, a t.me link, or the chat id (for example -1001234567890).");
    const own = String(f.bot_token || "").trim();
    const token = own || process.env.TELEGRAM_BOT_TOKEN || "";
    if (!token) throw new CredentialError("Add your own bot token from @BotFather. The shared ZieAds bot is not set up on this server.");
    if (own && !/^\d{6,12}:[\w-]{30,60}$/.test(own)) throw new CredentialError("That does not look like a bot token from @BotFather.");
    let bot: any;
    let info: any;
    try {
      bot = await tg(token, "getMe", {});
      info = await tg(token, "getChat", { chat_id: chat });
    } catch (e: any) {
      throw new CredentialError(e.code === 401 ? "Telegram did not accept the bot token." : `Telegram cannot see ${chat}. Add @${bot?.username || "the bot"} to it as an admin first. (${e.message})`);
    }
    const member = await tg(token, "getChatMember", { chat_id: info.id, user_id: bot.id }).catch(() => null);
    const isAdmin = member && (member.status === "administrator" || member.status === "creator");
    if (info.type === "channel" && (!isAdmin || member.can_post_messages === false)) throw new CredentialError(`Make @${bot.username} an admin of ${info.title || chat} with permission to post messages, then try again.`);
    if (info.type !== "channel" && !(isAdmin || member?.status === "member")) throw new CredentialError(`Add @${bot.username} to ${info.title || chat} first.`);
    return {
      platformUserId: String(info.id),
      username: info.username ? `@${info.username}` : info.title,
      displayName: info.title || info.username || chat,
      accountType: info.type,
      accessToken: own ? own : "shared",
      scopes: "post_messages",
      metadata: { chat_id: info.id, chat_username: info.username || null, bot_username: bot.username, shared_bot: !own },
    };
  }

  // Discord
  const url = String(f.webhook_url || "").trim();
  const m = url.match(DISCORD_WEBHOOK);
  if (!m) throw new CredentialError("Paste the full webhook URL from Discord: Channel settings, Integrations, Webhooks, Copy Webhook URL.");
  const res = await fetch(url.replace(/\/$/, ""));
  const j: any = await res.json().catch(() => ({}));
  if (!res.ok || !j.id) throw new CredentialError(res.status === 401 || res.status === 404 ? "Discord says this webhook does not exist. Copy it again from the channel settings." : `Discord check failed (${res.status}).`);
  return {
    platformUserId: String(j.id),
    username: j.name || "Webhook",
    displayName: j.name ? `${j.name} (channel ${j.channel_id})` : `Channel ${j.channel_id}`,
    avatarUrl: j.avatar ? `https://cdn.discordapp.com/avatars/${j.id}/${j.avatar}.png` : "",
    accountType: "webhook",
    accessToken: url.replace(/\/$/, ""),
    scopes: "webhook",
    metadata: { guild_id: j.guild_id || null, channel_id: j.channel_id || null, webhook_name: j.name || null },
  };
}

/** The bot token a Telegram connection posts with */
export const telegramToken = (stored: string) => (stored === "shared" ? process.env.TELEGRAM_BOT_TOKEN || "" : stored);
