/*
  One click Telegram connect through the ZieAds bot (TELEGRAM_BOT_TOKEN):
    1. POST /api/auth/telegram/start   makes a one time code and returns t.me/<bot>?start=<code>
    2. The user presses Start: the webhook links their Telegram account to the ZieAds user and the
       bot replies with "Add to channel" and "Add to group" buttons that pre-select the post rights
    3. When the bot is added, Telegram sends my_chat_member: ZieAds saves the connection on its own
    4. GET /api/auth/telegram/status?code=  is polled by the connect window until it says connected
  The webhook is registered automatically the first time someone starts a connect.
*/
import crypto from "crypto";
import { supabaseAdmin } from "../supabaseServer.js";
import { tg } from "./credentials.js";
import { saveConnection } from "./store.js";

const CODE_TTL_MS = 30 * 60000;

export const botToken = () => process.env.TELEGRAM_BOT_TOKEN || "";
/** Secret for the webhook path and Telegram's X-Telegram-Bot-Api-Secret-Token header, derived from the bot token */
export const webhookSecret = (token = botToken()) => crypto.createHash("sha256").update(`zieads-telegram:${token}`).digest("hex").slice(0, 48);

let botCache: { id: number; username: string } | null = null;
let webhookChecked = false;

export async function botInfo() {
  if (botCache) return botCache;
  const me = await tg(botToken(), "getMe", {});
  botCache = { id: me.id, username: me.username };
  return botCache;
}

/** Points the bot at /api/telegram/webhook/<secret> once per server start */
export async function ensureWebhook(origin: string) {
  if (webhookChecked) return;
  const token = botToken();
  const url = `${origin.replace(/\/$/, "")}/api/telegram/webhook/${webhookSecret(token)}`;
  const info = await tg(token, "getWebhookInfo", {});
  if (info.url !== url) {
    await tg(token, "setWebhook", { url, secret_token: webhookSecret(token), allowed_updates: ["message", "my_chat_member"], drop_pending_updates: false });
  }
  webhookChecked = true;
}

export async function startLink(userId: string, origin: string) {
  if (!botToken()) throw new Error("TELEGRAM_BOT_TOKEN is missing on the server.");
  const bot = await botInfo();
  await ensureWebhook(origin);
  const code = crypto.randomBytes(12).toString("base64url");
  const { error } = await supabaseAdmin.from("telegram_links").insert({ code, user_id: userId });
  if (error) throw new Error("Could not start the Telegram connect. Run the networks migration in Supabase.");
  return { code, bot_username: bot.username, url: `https://t.me/${bot.username}?start=${code}` };
}

export async function linkStatus(userId: string, code: string) {
  const { data } = await supabaseAdmin.from("telegram_links").select("status, chat_title, error, created_at").eq("code", code).eq("user_id", userId).maybeSingle();
  if (!data) return { status: "missing" };
  if (data.status !== "connected" && Date.now() - new Date(data.created_at).getTime() > CODE_TTL_MS) return { status: "expired" };
  return { status: data.status, chat_title: data.chat_title, error: data.error };
}

/** Deep links that open Telegram's chat picker with the post rights already ticked */
export function addButtons(botUsername: string) {
  const rights = "post_messages+edit_messages+delete_messages";
  return {
    inline_keyboard: [
      [{ text: "Add to channel", url: `https://t.me/${botUsername}?startchannel&admin=${rights}` }],
      [{ text: "Add to group", url: `https://t.me/${botUsername}?startgroup=zieads` }],
    ],
  };
}

async function send(chatId: number, text: string, extra: Record<string, unknown> = {}) {
  await tg(botToken(), "sendMessage", { chat_id: chatId, text, ...extra }).catch(() => undefined);
}

/** Handles one update from Telegram. Exported for tests. */
/** Links a chat the bot is in to the ZieAds user who started from ZieAds. Shared by the add and /connect paths. */
async function connectChat(fromId: number, chat: any, member: { status: string; can_post_messages?: boolean }) {
  const bot = await botInfo();
  const { data: link } = await supabaseAdmin.from("telegram_links").select("*").eq("tg_user_id", fromId).in("status", ["started", "connected"]).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!link) return false; // someone used the bot without starting from ZieAds
  const canPost = chat.type !== "channel" || (member.status === "administrator" && member.can_post_messages !== false);
  if (!canPost) {
    await supabaseAdmin.from("telegram_links").update({ status: "started", error: `The bot can not post in ${chat.title}. Allow Post messages for it in the channel admin settings.` }).eq("code", link.code);
    await send(fromId, `I am in ${chat.title}, but without permission to post. Make me an admin with Post messages turned on.`);
    return true;
  }
  try {
    await saveConnection(link.user_id, "telegram", {
      platformUserId: String(chat.id),
      username: chat.username ? `@${chat.username}` : chat.title,
      displayName: chat.title || chat.username || String(chat.id),
      accountType: chat.type,
      accessToken: "shared",
      scopes: "post_messages",
      metadata: { chat_id: chat.id, chat_username: chat.username || null, bot_username: bot.username, shared_bot: true, connected_via: "bot_link" },
    });
  } catch (e: any) {
    // Show the reason in the connect window instead of leaving it waiting
    console.error("[telegram] save failed:", e.message);
    await supabaseAdmin.from("telegram_links").update({ status: "started", error: `ZieAds could not save the connection: ${String(e.message).slice(0, 160)}` }).eq("code", link.code);
    return true;
  }
  await supabaseAdmin.from("telegram_links").update({ status: "connected", chat_title: chat.title || chat.username, error: null }).eq("code", link.code);
  await send(fromId, `Done. ${chat.title || "The chat"} is connected to ZieAds. Posts you approve in ZieAds will go out there.`);
  return true;
}

/** Handles one update from Telegram. Exported for tests. */
export async function handleUpdate(u: any) {
  const bot = await botInfo();

  // 2. /start <code> in the private chat links the Telegram account to the ZieAds user
  const msg = u.message;
  if (msg?.chat?.type === "private" && typeof msg.text === "string" && msg.text.startsWith("/start")) {
    const code = msg.text.split(/\s+/)[1] || "";
    const { data: link } = code ? await supabaseAdmin.from("telegram_links").select("*").eq("code", code).maybeSingle() : { data: null };
    if (!link || Date.now() - new Date(link.created_at).getTime() > CODE_TTL_MS) {
      await send(msg.chat.id, "This link expired or is not from ZieAds. Open Connections in ZieAds and press Connect Telegram again.");
      return;
    }
    await supabaseAdmin.from("telegram_links").update({ tg_user_id: msg.from.id, status: "started", error: null }).eq("code", code);
    await send(msg.chat.id, `Your Telegram is linked to ZieAds. Now add me to the channel or group you want to post to. You need to be an admin there.\n\nAlready added me to a group? Send /connect@${bot.username} in that group. For a channel, remove me and add me again.`, { reply_markup: addButtons(bot.username) });
    return;
  }

  // 3a. In a group the bot is already in: "/connect" (or the /start that Add to group sends) links that group
  if (msg && (msg.chat?.type === "group" || msg.chat?.type === "supergroup") && typeof msg.text === "string" && msg.from) {
    const cmd = msg.text.trim().split(/\s+/)[0].toLowerCase();
    const mine = (c: string) => cmd === c || cmd === `${c}@${String(bot.username).toLowerCase()}`;
    if (mine("/connect") || mine("/start")) {
      const member = await tg(botToken(), "getChatMember", { chat_id: msg.chat.id, user_id: bot.id }).catch(() => ({ status: "member" }));
      const linked = await connectChat(msg.from.id, msg.chat, member);
      if (!linked) await send(msg.chat.id, "Open ZieAds, go to Connections, press Connect Telegram and press Start in my chat first. Then send /connect here again.");
    }
    return;
  }

  // 3b. The bot was added to (or removed from) a chat
  const m = u.my_chat_member;
  if (m && m.new_chat_member?.user?.id === bot.id) {
    const status = m.new_chat_member.status;
    if (status === "left" || status === "kicked") {
      await supabaseAdmin.from("social_connections").update({ status: "needs_reconnect", last_error_message: "The ZieAds bot was removed from this Telegram chat." }).eq("platform", "telegram").eq("platform_user_id", String(m.chat.id));
      return;
    }
    await connectChat(m.from.id, m.chat, m.new_chat_member);
  }
}
