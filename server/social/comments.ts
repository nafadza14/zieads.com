/*
  Comments from Threads, Bluesky, Mastodon, YouTube and Telegram, next to the Instagram and Facebook
  comments the Meta sync already brings in. Everything lands in comments_inbox (one row per comment),
  so the Comments page, the Inbox, reply drafts, intent sorting and the morning plan read one table.
    syncNetworkComments(userId)   pulls recent comments for every connected network (polling)
    ingestTelegramMessage(...)    Telegram comments arrive through the bot webhook instead
    replyOnNetwork(...)           sends a reply on the comment's own network
  Not available: Discord (webhooks only send), LinkedIn (needs Community Management API approval),
  TikTok (no comment API for this app type).
*/
import { supabaseAdmin } from "../supabaseServer.js";
import { classifyIntent } from "../inbox/intent.js";
import { loadConnection, expiringSoon, LoadedConnection } from "./store.js";
import { refresh } from "./oauth.js";
import { bskySession, tg, telegramToken } from "./credentials.js";
import { blueskySession } from "./bluesky-oauth.js";

export const COMMENT_NETWORKS = ["instagram", "facebook", "threads", "bluesky", "mastodon", "youtube", "telegram"];
export const NO_COMMENTS: Record<string, string> = {
  discord: "Discord webhooks can only send, so comments stay in Discord.",
  linkedin: "LinkedIn comments arrive once LinkedIn approves the Community Management API.",
  tiktok: "TikTok does not offer comments to this kind of app yet. Reply in the TikTok app.",
  pinterest: "Pinterest does not share Pin comments through its API.",
};

export interface IncomingComment {
  platform: string;
  id: string;
  postId: string;
  parentId?: string | null;
  author: string;
  authorId?: string | null;
  avatar?: string | null;
  text: string;
  postedAt: string;
  meta?: Record<string, unknown>;
}

/** Strips Mastodon's HTML to plain text */
export function htmlToText(html: string): string {
  return String(html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

export async function saveComments(userId: string, list: IncomingComment[], source = "zieads_sync") {
  if (!list.length) return 0;
  const rows = list.map((c) => {
    const { intent, priority } = classifyIntent(c.text);
    return {
      user_id: userId,
      platform: c.platform,
      platform_comment_id: c.id,
      platform_media_id: c.postId,
      parent_comment_id: c.parentId || null,
      author_username: c.author,
      author_platform_id: c.authorId || null,
      author_avatar: c.avatar || null,
      text: c.text,
      status: "unread",
      posted_at: c.postedAt,
      ingestion_source: source,
      intent,
      priority,
      meta: c.meta || {},
    };
  });
  const { error } = await supabaseAdmin.from("comments_inbox").upsert(rows, { onConflict: "user_id,platform,platform_comment_id", ignoreDuplicates: true });
  if (error) console.warn("[comments] save failed:", error.message);
  return rows.length;
}

async function getJson(url: string, init: RequestInit = {}) {
  const res = await fetch(url, init);
  const j: any = await res.json().catch(() => ({}));
  if (!res.ok || j.error) throw new Error(j.error?.message || j.error_description || j.message || (typeof j.error === "string" ? j.error : `HTTP ${res.status}`));
  return j;
}

/* ── Threads: replies to the account's recent posts ── */
async function threadsComments(c: LoadedConnection): Promise<IncomingComment[]> {
  const t = encodeURIComponent(c.token);
  const posts = await getJson(`https://graph.threads.net/v1.0/me/threads?fields=id,text,permalink,timestamp,media_url,thumbnail_url&limit=15&access_token=${t}`);
  const out: IncomingComment[] = [];
  for (const p of posts.data || []) {
    const r = await getJson(`https://graph.threads.net/v1.0/${p.id}/replies?fields=id,text,username,timestamp,permalink&access_token=${t}`).catch(() => ({ data: [] }));
    for (const x of r.data || []) {
      if (!x.text || x.username === c.username) continue;
      out.push({ platform: "threads", id: x.id, postId: p.id, author: x.username || "Threads user", text: x.text, postedAt: x.timestamp, meta: { post_caption: p.text || "", post_permalink: p.permalink, post_thumb: p.thumbnail_url || p.media_url || null, comment_permalink: x.permalink } });
    }
  }
  return out;
}

/** A Bluesky caller for either sign in method */
export async function bskyCaller(c: LoadedConnection) {
  if (c.metadata.auth === "oauth") {
    const s = await blueskySession(c.metadata.did || c.platformUserId);
    return { did: s.did, call: (path: string, init?: RequestInit) => s.fetchHandler(path, init) };
  }
  const service = c.metadata.service || "https://bsky.social";
  const s = await bskySession(service, c.metadata.did || c.username, c.token);
  return { did: s.did, call: (path: string, init: RequestInit = {}) => fetch(`${service}${path}`, { ...init, headers: { ...(init.headers as any), Authorization: `Bearer ${s.accessJwt}` } }) };
}

/* ── Bluesky: replies and mentions from notifications ── */
async function blueskyComments(c: LoadedConnection): Promise<IncomingComment[]> {
  const b = await bskyCaller(c);
  const res = await b.call("/xrpc/app.bsky.notification.listNotifications?limit=50");
  if (!res.ok) throw new Error(`Bluesky notifications failed (${res.status})`);
  const j: any = await res.json();
  return (j.notifications || [])
    .filter((n: any) => ["reply", "mention", "quote"].includes(n.reason) && n.record?.text)
    .map((n: any) => {
      const root = n.record?.reply?.root;
      return {
        platform: "bluesky",
        id: n.uri,
        postId: root?.uri || n.reasonSubject || n.uri,
        parentId: n.record?.reply?.parent?.uri || null,
        author: n.author?.handle || "Bluesky user",
        authorId: n.author?.did,
        avatar: n.author?.avatar,
        text: n.record.text,
        postedAt: n.record.createdAt || n.indexedAt,
        meta: { cid: n.cid, root: root || { uri: n.uri, cid: n.cid }, reason: n.reason, comment_permalink: `https://bsky.app/profile/${n.author?.handle}/post/${String(n.uri).split("/").pop()}` },
      };
    });
}

/* ── Mastodon: mentions (replies to you are mentions) ── */
async function mastodonComments(c: LoadedConnection): Promise<IncomingComment[]> {
  const base = `https://${c.metadata.instance}`;
  const list = await getJson(`${base}/api/v1/notifications?types[]=mention&limit=40`, { headers: { Authorization: `Bearer ${c.token}` } });
  return (list || [])
    .filter((n: any) => n.status)
    .map((n: any) => ({
      platform: "mastodon",
      id: String(n.status.id),
      postId: String(n.status.in_reply_to_id || n.status.id),
      parentId: n.status.in_reply_to_id ? String(n.status.in_reply_to_id) : null,
      author: n.account?.acct || "Mastodon user",
      authorId: String(n.account?.id || ""),
      avatar: n.account?.avatar,
      text: htmlToText(n.status.content),
      postedAt: n.status.created_at,
      meta: { acct: n.account?.acct, comment_permalink: n.status.url, visibility: n.status.visibility },
    }));
}

/* ── YouTube: comment threads on the channel's videos ── */
async function youtubeComments(c: LoadedConnection): Promise<IncomingComment[]> {
  if (expiringSoon(c) || !c.expiresAt) await refresh(c);
  const H = { headers: { Authorization: `Bearer ${c.token}` } };
  const threads = await getJson(`https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&allThreadsRelatedToChannelId=${encodeURIComponent(c.platformUserId)}&maxResults=50&order=time`, H);
  const items = threads.items || [];
  const ids = [...new Set(items.map((t: any) => t.snippet?.videoId).filter(Boolean))].slice(0, 50) as string[];
  const videos: Record<string, any> = {};
  if (ids.length) {
    const v = await getJson(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${ids.join(",")}`, H).catch(() => ({ items: [] }));
    for (const x of v.items || []) videos[x.id] = x.snippet;
  }
  return items
    .map((t: any) => {
      const s = t.snippet?.topLevelComment?.snippet || {};
      if (s.authorChannelId?.value === c.platformUserId) return null;
      const vid = t.snippet?.videoId;
      return {
        platform: "youtube",
        id: t.id,
        postId: vid,
        author: s.authorDisplayName || "YouTube user",
        authorId: s.authorChannelId?.value || null,
        avatar: s.authorProfileImageUrl,
        text: s.textOriginal || htmlToText(s.textDisplay || ""),
        postedAt: s.publishedAt,
        meta: { post_caption: videos[vid]?.title || "", post_thumb: videos[vid]?.thumbnails?.medium?.url || null, post_permalink: `https://www.youtube.com/watch?v=${vid}`, comment_permalink: `https://www.youtube.com/watch?v=${vid}&lc=${t.id}`, reply_count: t.snippet?.totalReplyCount || 0 },
      };
    })
    .filter(Boolean) as IncomingComment[];
}

const FETCHERS: Record<string, (c: LoadedConnection) => Promise<IncomingComment[]>> = {
  threads: threadsComments,
  bluesky: blueskyComments,
  mastodon: mastodonComments,
  youtube: youtubeComments,
};

/** Pulls recent comments for every connected network with a comment API. Errors are per network. */
export async function syncNetworkComments(userId: string) {
  const out: Record<string, { ok: boolean; count?: number; error?: string }> = {};
  for (const [platform, fn] of Object.entries(FETCHERS)) {
    const c = await loadConnection(userId, platform);
    if (!c) continue;
    try {
      const list = await fn(c);
      out[platform] = { ok: true, count: await saveComments(userId, list) };
      await supabaseAdmin.from("social_connections").update({ last_synced_at: new Date().toISOString() }).eq("id", c.id);
    } catch (e: any) {
      out[platform] = { ok: false, error: String(e.message).slice(0, 200) };
    }
  }
  return out;
}

/** Telegram: a message in a connected group, or in a connected channel's discussion group, that replies to a post */
export async function ingestTelegramMessage(msg: any, botId: number) {
  const chatId = String(msg.chat?.id || "");
  if (!msg.text && !msg.caption) return false;
  if (msg.from?.is_bot || msg.from?.id === botId) return false;
  const reply = msg.reply_to_message;
  if (!reply) return false;
  // The channel post a discussion group comment belongs to arrives as an automatic forward
  const fromChannel = reply.is_automatic_forward ? String(reply.forward_origin?.chat?.id || reply.sender_chat?.id || reply.forward_from_chat?.id || "") : "";
  const repliesToBot = reply.from?.id === botId;
  if (!fromChannel && !repliesToBot) return false;
  const lookupId = fromChannel || chatId;
  const { data: conns } = await supabaseAdmin.from("social_connections").select("user_id, platform_user_id").eq("platform", "telegram").eq("is_active", true).eq("platform_user_id", lookupId);
  if (!conns?.length) return false;
  const author = msg.from?.username ? `@${msg.from.username}` : [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(" ") || "Telegram user";
  for (const c of conns) {
    await saveComments(
      c.user_id,
      [
        {
          platform: "telegram",
          id: `${chatId}:${msg.message_id}`,
          postId: `${lookupId}:${fromChannel ? reply.forward_origin?.message_id || reply.forward_from_message_id || reply.message_id : reply.message_id}`,
          author,
          authorId: String(msg.from?.id || ""),
          text: msg.text || msg.caption,
          postedAt: new Date((msg.date || Date.now() / 1000) * 1000).toISOString(),
          meta: { chat_id: msg.chat.id, message_id: msg.message_id, post_caption: (reply.text || reply.caption || "").slice(0, 300), discussion: !!fromChannel },
        },
      ],
      "webhook"
    );
  }
  return true;
}

/** Sends a reply on Threads, Bluesky, Mastodon, YouTube or Telegram. Returns the new reply's id. */
export async function replyOnNetwork(userId: string, comment: any, text: string): Promise<{ id: string }> {
  const c = await loadConnection(userId, comment.platform);
  if (!c) throw Object.assign(new Error(`${comment.platform} is not connected. Reconnect it in Connections.`), { reconnect: true });
  const meta = comment.meta || {};

  if (comment.platform === "threads") {
    const t = c.token;
    const create = await getJson(`https://graph.threads.net/v1.0/${c.platformUserId}/threads`, { method: "POST", body: new URLSearchParams({ media_type: "TEXT", text, reply_to_id: comment.platform_comment_id, access_token: t }) });
    const pub = await getJson(`https://graph.threads.net/v1.0/${c.platformUserId}/threads_publish`, { method: "POST", body: new URLSearchParams({ creation_id: create.id, access_token: t }) });
    return { id: pub.id };
  }

  if (comment.platform === "bluesky") {
    const b = await bskyCaller(c);
    const record = {
      $type: "app.bsky.feed.post",
      text,
      createdAt: new Date().toISOString(),
      reply: { root: meta.root || { uri: comment.platform_comment_id, cid: meta.cid }, parent: { uri: comment.platform_comment_id, cid: meta.cid } },
    };
    const res = await b.call("/xrpc/com.atproto.repo.createRecord", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ repo: b.did, collection: "app.bsky.feed.post", record }) });
    const j: any = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Bluesky refused the reply: ${j.message || res.status}`);
    return { id: j.uri };
  }

  if (comment.platform === "mastodon") {
    const acct = meta.acct || comment.author_username;
    const status = text.includes(`@${acct}`) ? text : `@${acct} ${text}`;
    const j = await getJson(`https://${c.metadata.instance}/api/v1/statuses`, {
      method: "POST",
      headers: { Authorization: `Bearer ${c.token}`, "Content-Type": "application/json", "Idempotency-Key": `reply-${comment.id}` },
      body: JSON.stringify({ status, in_reply_to_id: comment.platform_comment_id, visibility: meta.visibility === "direct" ? "direct" : "public" }),
    });
    return { id: String(j.id) };
  }

  if (comment.platform === "youtube") {
    if (expiringSoon(c) || !c.expiresAt) await refresh(c);
    if (!/youtube\.force-ssl/.test(c.scopes)) throw Object.assign(new Error("Replying on YouTube needs one more permission. Reconnect YouTube in Connections."), { reconnect: true });
    const j = await getJson("https://www.googleapis.com/youtube/v3/comments?part=snippet", {
      method: "POST",
      headers: { Authorization: `Bearer ${c.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ snippet: { parentId: comment.platform_comment_id, textOriginal: text } }),
    });
    return { id: j.id };
  }

  if (comment.platform === "telegram") {
    const r = await tg(telegramToken(c.token), "sendMessage", { chat_id: meta.chat_id, text, reply_parameters: { message_id: meta.message_id } });
    return { id: String(r.message_id) };
  }

  throw new Error(NO_COMMENTS[comment.platform] || `Replying to ${comment.platform} comments is not available.`);
}
