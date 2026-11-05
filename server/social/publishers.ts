/*
  Publishers for Threads, Pinterest, YouTube, Bluesky, Mastodon, Telegram and Discord.
  Same contract as the original four in publish/publisher.ts: return { externalId, permalink },
  throw PublishError (retryable or not, maybe needs reconnect) or NeedsAction (finish by hand).
  The pure helpers at the top are exported for tests.
*/
import { PublishError, NeedsAction } from "../publish/errors.js";
import { loadConnection, expiringSoon, LoadedConnection, updateMetadata } from "./store.js";
import { refresh, pinterestApi, pinterestSandbox } from "./oauth.js";
import { bskySession, tg, telegramToken, CredentialError } from "./credentials.js";
import { blueskySession } from "./bluesky-oauth.js";

const isVideo = (u: string, type?: string) => type === "video" || /\.(mp4|mov|m4v|webm)(\?|$)/i.test(u);
const mediaOf = (post: any): string[] => (post.media_urls || []).filter(Boolean);

/* ── Pure helpers ───────────────────────────────────────── */

/** Bluesky counts graphemes, not UTF-16 units */
export function graphemes(s: string): number {
  const Seg = (Intl as any).Segmenter;
  return Seg ? [...new Seg(undefined, { granularity: "grapheme" }).segment(s)].length : [...s].length;
}

/** Rich text facets so links and hashtags are clickable on Bluesky. Offsets are UTF-8 bytes. */
export function bskyFacets(text: string) {
  const enc = new TextEncoder();
  const facets: any[] = [];
  const at = (i: number) => enc.encode(text.slice(0, i)).length;
  for (const m of text.matchAll(/https?:\/\/[^\s<>"')\]]+[^\s<>"')\].,;:!?]/g)) {
    const i = m.index!;
    facets.push({ index: { byteStart: at(i), byteEnd: at(i + m[0].length) }, features: [{ $type: "app.bsky.richtext.facet#link", uri: m[0] }] });
  }
  for (const m of text.matchAll(/(^|\s)#([\p{L}\p{N}_]{1,64})/gu)) {
    const i = m.index! + m[1].length;
    facets.push({ index: { byteStart: at(i), byteEnd: at(i + 1 + m[2].length) }, features: [{ $type: "app.bsky.richtext.facet#tag", tag: m[2] }] });
  }
  return facets;
}

/** YouTube title: first line of the caption, at most 100 characters, no angle brackets */
export function youtubeTitle(caption: string, fallback = "New video"): string {
  const first = (caption || "").split(/\r?\n/).map((l) => l.trim()).find(Boolean) || fallback;
  const clean = first.replace(/[<>]/g, "");
  return [...clean].length > 100 ? [...clean].slice(0, 97).join("") + "..." : clean;
}

/** Pin title: first line, 100 characters */
export const pinTitle = (caption: string) => [...((caption || "").split(/\r?\n/)[0] || "").trim()].slice(0, 100).join("");

export function telegramPermalink(meta: { chat_username?: string | null; chat_id?: number | string }, messageId: number | string): string | undefined {
  if (meta.chat_username) return `https://t.me/${meta.chat_username}/${messageId}`;
  const id = String(meta.chat_id || "");
  return id.startsWith("-100") ? `https://t.me/c/${id.slice(4)}/${messageId}` : undefined;
}

export function discordPayload(caption: string, media: string[], username?: string) {
  const images = media.filter((u) => !isVideo(u)).slice(0, 10);
  const videos = media.filter((u) => isVideo(u));
  const content = [caption || "", ...videos].filter(Boolean).join("\n").slice(0, 2000);
  return { content, ...(username ? { username: username.slice(0, 80) } : {}), embeds: images.map((url) => ({ image: { url } })), allowed_mentions: { parse: [] as string[] } };
}

/* ── Shared ─────────────────────────────────────────────── */

async function conn(post: any, platform: string, name: string): Promise<LoadedConnection> {
  const c = await loadConnection(post.user_id, platform);
  if (!c) throw new PublishError(`${name} is not connected. Reconnect it in Connections.`, false, true);
  return c;
}

/** Turns an HTTP failure into the right PublishError */
async function fail(res: Response, name: string): Promise<never> {
  const t = await res.text().catch(() => "");
  let msg = t.slice(0, 200);
  try {
    const j = JSON.parse(t);
    msg = j.error?.message || j.error_description || j.message || j.error || msg;
  } catch {
    /* keep the text */
  }
  const reconnect = res.status === 401 || res.status === 403;
  throw new PublishError(`${name} refused the post (${res.status}). ${typeof msg === "string" ? msg : JSON.stringify(msg)}`.trim(), res.status >= 500 || res.status === 429, reconnect);
}

/** fetch that names the step and the real cause when the network fails, instead of a bare "fetch failed" */
export async function net(step: string, url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (e: any) {
    const c = e?.cause;
    const why = [c?.code, c?.message].filter(Boolean).join(" ") || e?.message || "network error";
    let host = "";
    try {
      host = new URL(url).host;
    } catch {
      host = String(url).slice(0, 60);
    }
    throw new PublishError(`Network error while ${step} (${host}: ${why}). ZieAds will retry.`, true);
  }
}

export async function download(url: string, maxBytes: number, name: string): Promise<{ buf: ArrayBuffer; type: string }> {
  if (!/^https?:\/\//.test(String(url))) throw new PublishError(`The media link for ${name} is not a web address. Attach the file again.`, false);
  const res = await net(`reading the media file for ${name}`, url);
  if (!res.ok) throw new PublishError(`Could not read the media file for ${name} (${res.status}).`, res.status >= 500);
  const len = Number(res.headers.get("content-length") || 0);
  if (len && len > maxBytes) throw new PublishError(`The file is ${Math.round(len / 1e6)} MB. ${name} takes up to ${Math.round(maxBytes / 1e6)} MB from ZieAds.`, false);
  const buf = await res.arrayBuffer();
  if (buf.byteLength > maxBytes) throw new PublishError(`The file is ${Math.round(buf.byteLength / 1e6)} MB. ${name} takes up to ${Math.round(maxBytes / 1e6)} MB from ZieAds.`, false);
  return { buf, type: res.headers.get("content-type") || "application/octet-stream" };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ── Threads ────────────────────────────────────────────── */

async function threadsApi(token: string, path: string, params: Record<string, string>, method = "POST") {
  const qs = new URLSearchParams({ ...params, access_token: token });
  const res = await fetch(`https://graph.threads.net/v1.0/${path}${method === "GET" ? `?${qs}` : ""}`, method === "GET" ? undefined : { method, body: qs });
  const j: any = await res.json().catch(() => ({}));
  if (!res.ok || j.error) {
    const code = j.error?.code;
    const reconnect = code === 190 || res.status === 401;
    throw new PublishError(`Threads refused the post. ${j.error?.message || res.status}`, !reconnect && code !== 100, reconnect);
  }
  return j;
}

async function threadsReady(token: string, id: string) {
  for (let i = 0; i < 20; i++) {
    const s = await threadsApi(token, id, { fields: "status,error_message" }, "GET");
    if (s.status === "FINISHED" || s.status === "PUBLISHED") return;
    if (s.status === "ERROR" || s.status === "EXPIRED") throw new PublishError(`Threads could not process the media: ${s.error_message || s.status}`, false);
    await sleep(3000);
  }
  throw new PublishError("Threads is still processing the media. ZieAds will retry.", true);
}

export async function publishThreads(post: any) {
  const c = await conn(post, "threads", "Threads");
  // Long lived tokens last 60 days; refresh in the last week
  if (c.expiresAt && new Date(c.expiresAt).getTime() - Date.now() < 7 * 86400000) await refresh(c).catch(() => undefined);
  const urls = mediaOf(post);
  const text = post.caption || "";
  const uid = c.platformUserId;
  let creation: string;
  if (urls.length <= 1) {
    const u = urls[0];
    const params: Record<string, string> = !u ? { media_type: "TEXT", text } : isVideo(u, post.media_type) ? { media_type: "VIDEO", video_url: u, text } : { media_type: "IMAGE", image_url: u, text };
    const r = await threadsApi(c.token, `${uid}/threads`, params);
    creation = r.id;
    if (u) await threadsReady(c.token, creation);
  } else {
    const children: string[] = [];
    for (const u of urls.slice(0, 20)) {
      const r = await threadsApi(c.token, `${uid}/threads`, isVideo(u) ? { media_type: "VIDEO", video_url: u, is_carousel_item: "true" } : { media_type: "IMAGE", image_url: u, is_carousel_item: "true" });
      children.push(r.id);
    }
    for (const id of children) await threadsReady(c.token, id);
    const r = await threadsApi(c.token, `${uid}/threads`, { media_type: "CAROUSEL", children: children.join(","), text });
    creation = r.id;
    await threadsReady(c.token, creation);
  }
  const pub = await threadsApi(c.token, `${uid}/threads_publish`, { creation_id: creation });
  let permalink: string | undefined;
  try {
    permalink = (await threadsApi(c.token, pub.id, { fields: "permalink" }, "GET")).permalink;
  } catch {
    /* nice to have */
  }
  return { externalId: pub.id, permalink };
}

/* ── Pinterest ──────────────────────────────────────────── */

export async function publishPinterest(post: any) {
  const c = await conn(post, "pinterest", "Pinterest");
  if (expiringSoon(c)) await refresh(c).catch((e) => {
    throw new PublishError(e.message, false, true);
  });
  const urls = mediaOf(post);
  if (!urls.length) throw new PublishError("Pinterest needs an image.", false);
  if (urls.some((u) => isVideo(u, post.media_type))) throw new NeedsAction("Video Pins are not automated yet. Upload this video from Pinterest: the description is ready to copy.");
  const board = String(post.platform_options?.board_id || c.metadata.default_board_id || "");
  if (!board) throw new PublishError("Pick a Pinterest board first: create one on Pinterest, then reconnect so ZieAds can see it.", false);
  const caption = post.caption || "";
  const body: any = {
    board_id: board,
    title: pinTitle(caption) || undefined,
    description: [...caption].slice(0, 500).join(""),
    link: post.platform_options?.link || undefined,
    media_source: urls.length === 1 ? { source_type: "image_url", url: urls[0] } : { source_type: "multiple_image_urls", items: urls.slice(0, 5).map((url) => ({ url })) },
  };
  const res = await fetch(`${pinterestApi()}/pins`, { method: "POST", headers: { Authorization: `Bearer ${c.token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) return fail(res, "Pinterest");
  const j: any = await res.json();
  // Sandbox Pins have no public page
  return { externalId: j.id, permalink: pinterestSandbox() ? null : `https://www.pinterest.com/pin/${j.id}/` };
}

/* ── YouTube ────────────────────────────────────────────── */

const YT_MAX_BYTES = 256 * 1024 * 1024;

export async function publishYouTube(post: any) {
  const c = await conn(post, "youtube", "YouTube");
  if (expiringSoon(c) || !c.expiresAt) {
    try {
      await refresh(c);
    } catch (e: any) {
      throw new PublishError(e.message, false, true);
    }
  }
  const urls = mediaOf(post);
  if (urls.length !== 1) throw new PublishError("YouTube needs one video.", false);
  const caption = post.caption || "";
  const o = post.platform_options || {};
  const privacy = ["public", "unlisted", "private"].includes(o.privacy) ? o.privacy : "public";
  const { buf, type } = await download(urls[0], YT_MAX_BYTES, "YouTube");
  const meta = {
    snippet: { title: o.title ? youtubeTitle(String(o.title)) : youtubeTitle(caption), description: [...caption].slice(0, 5000).join(""), categoryId: String(o.category_id || "22"), tags: Array.isArray(o.tags) ? o.tags.slice(0, 30) : undefined },
    status: { privacyStatus: privacy, selfDeclaredMadeForKids: !!o.made_for_kids },
  };
  const init = await net("starting the YouTube upload", "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status", {
    method: "POST",
    headers: { Authorization: `Bearer ${c.token}`, "Content-Type": "application/json; charset=UTF-8", "X-Upload-Content-Type": type.startsWith("video/") ? type : "video/*", "X-Upload-Content-Length": String(buf.byteLength) },
    body: JSON.stringify(meta),
  });
  if (!init.ok) return fail(init, "YouTube");
  const location = init.headers.get("location");
  if (!location) throw new PublishError("YouTube did not start the upload. ZieAds will retry.", true);
  const up = await net("sending the video to YouTube", location, { method: "PUT", headers: { "Content-Type": type.startsWith("video/") ? type : "video/*" }, body: new Uint8Array(buf) });
  if (!up.ok) return fail(up, "YouTube");
  const j: any = await up.json();
  return { externalId: j.id, permalink: `https://www.youtube.com/watch?v=${j.id}` };
}

/* ── Bluesky ────────────────────────────────────────────── */

const BSKY_IMAGE_MAX = 1_000_000;

export async function publishBluesky(post: any) {
  const c = await conn(post, "bluesky", "Bluesky");
  // Two ways in: Sign in with Bluesky (OAuth with DPoP, the default) or an app password (fallback)
  let did: string;
  let handle: string;
  let call: (path: string, init?: RequestInit) => Promise<Response>;
  if (c.metadata.auth === "oauth") {
    try {
      const session = await blueskySession(c.metadata.did || c.platformUserId);
      did = session.did;
      handle = c.metadata.handle || c.username;
      call = (path, init) => session.fetchHandler(path, init);
    } catch (e: any) {
      throw new PublishError(`Bluesky sign in ended (${e.message}). Reconnect Bluesky.`, false, true);
    }
  } else {
    const service = c.metadata.service || "https://bsky.social";
    let s;
    try {
      s = await bskySession(service, c.metadata.did || c.username, c.token);
    } catch (e: any) {
      throw new PublishError(e.message, !(e instanceof CredentialError), e instanceof CredentialError);
    }
    did = s.did;
    handle = s.handle;
    call = (path, init = {}) => fetch(`${service}${path}`, { ...init, headers: { ...(init.headers as any), Authorization: `Bearer ${s.accessJwt}` } });
  }
  const text = post.caption || "";
  if (graphemes(text) > 300) throw new PublishError(`Bluesky allows 300 characters; this post has ${graphemes(text)}.`, false);
  const urls = mediaOf(post);
  if (urls.some((u) => isVideo(u, post.media_type))) throw new NeedsAction("Bluesky videos are not automated yet. Post it from the Bluesky app: the text is ready to copy.");
  const images: any[] = [];
  for (const u of urls.slice(0, 4)) {
    const { buf, type } = await download(u, BSKY_IMAGE_MAX, "Bluesky");
    const res = await call("/xrpc/com.atproto.repo.uploadBlob", { method: "POST", headers: { "Content-Type": type }, body: buf });
    if (!res.ok) return fail(res, "Bluesky");
    images.push({ alt: "", image: (await res.json()).blob });
  }
  const record: any = { $type: "app.bsky.feed.post", text, createdAt: new Date().toISOString() };
  const facets = bskyFacets(text);
  if (facets.length) record.facets = facets;
  if (images.length) record.embed = { $type: "app.bsky.embed.images", images };
  const res = await call("/xrpc/com.atproto.repo.createRecord", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ repo: did, collection: "app.bsky.feed.post", record }) });
  if (!res.ok) return fail(res, "Bluesky");
  const j: any = await res.json();
  const rkey = String(j.uri || "").split("/").pop();
  return { externalId: j.uri, permalink: `https://bsky.app/profile/${handle}/post/${rkey}` };
}

/* ── Mastodon ───────────────────────────────────────────── */

export async function publishMastodon(post: any) {
  const c = await conn(post, "mastodon", "Mastodon");
  const base = `https://${c.metadata.instance}`;
  const H = { Authorization: `Bearer ${c.token}` };
  const urls = mediaOf(post);
  const ids: string[] = [];
  for (const u of urls.slice(0, 4)) {
    const { buf, type } = await download(u, 40 * 1024 * 1024, "Mastodon");
    const form = new FormData();
    form.append("file", new Blob([buf], { type }), u.split("/").pop()?.split("?")[0] || "media");
    const res = await fetch(`${base}/api/v2/media`, { method: "POST", headers: H, body: form });
    if (!res.ok) return fail(res, "Mastodon");
    const m: any = await res.json();
    // Video is processed in the background (202): wait until it has a URL
    if (res.status === 202 || !m.url) {
      let ready = false;
      for (let i = 0; i < 15 && !ready; i++) {
        await sleep(2000);
        const r = await fetch(`${base}/api/v1/media/${m.id}`, { headers: H });
        ready = r.status === 200 && !!(await r.json()).url;
      }
      if (!ready) throw new PublishError("Mastodon is still processing the video. ZieAds will retry.", true);
    }
    ids.push(m.id);
  }
  const res = await fetch(`${base}/api/v1/statuses`, {
    method: "POST",
    headers: { ...H, "Content-Type": "application/json", "Idempotency-Key": post.idempotency_key || post.id },
    body: JSON.stringify({ status: post.caption || "", media_ids: ids, visibility: ["public", "unlisted", "private"].includes(post.platform_options?.visibility) ? post.platform_options.visibility : "public" }),
  });
  if (!res.ok) return fail(res, "Mastodon");
  const j: any = await res.json();
  return { externalId: String(j.id), permalink: j.url || undefined };
}

/* ── Telegram ───────────────────────────────────────────── */

export async function publishTelegram(post: any) {
  const c = await conn(post, "telegram", "Telegram");
  const token = telegramToken(c.token);
  if (!token) throw new PublishError("The ZieAds Telegram bot is not set up on this server. Reconnect Telegram with your own bot token.", false, true);
  const chat = c.metadata.chat_id || c.platformUserId;
  const text = post.caption || "";
  const urls = mediaOf(post);
  const call = async (method: string, body: Record<string, unknown>) => {
    try {
      return await tg(token, method, { chat_id: chat, ...body });
    } catch (e: any) {
      const reconnect = e.code === 401 || e.code === 403 || /not enough rights|bot was kicked|chat not found/i.test(e.message);
      throw new PublishError(`Telegram refused the post. ${e.message}`, !reconnect && (e.code === 429 || e.code >= 500), reconnect);
    }
  };
  const fits = [...text].length <= 1024;
  let first: any;
  if (!urls.length) {
    first = await call("sendMessage", { text });
  } else if (urls.length === 1) {
    const video = isVideo(urls[0], post.media_type);
    first = await call(video ? "sendVideo" : "sendPhoto", { [video ? "video" : "photo"]: urls[0], ...(fits && text ? { caption: text } : {}) });
  } else {
    const media = urls.slice(0, 10).map((u, i) => ({ type: isVideo(u) ? "video" : "photo", media: u, ...(i === 0 && fits && text ? { caption: text } : {}) }));
    const list = await call("sendMediaGroup", { media });
    first = Array.isArray(list) ? list[0] : list;
  }
  // A caption longer than Telegram's 1,024 media limit goes out as a second message
  if (urls.length && !fits && text) await call("sendMessage", { text, reply_parameters: { message_id: first.message_id } });
  return { externalId: String(first.message_id), permalink: telegramPermalink(c.metadata, first.message_id) };
}

/* ── Discord ────────────────────────────────────────────── */

export async function publishDiscord(post: any) {
  const c = await conn(post, "discord", "Discord");
  const urls = mediaOf(post);
  const body = discordPayload(post.caption || "", urls, post.platform_options?.username);
  if (!body.content && !body.embeds.length) throw new PublishError("Add text or media for Discord.", false);
  const res = await fetch(`${c.token}?wait=true`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (res.status === 404 || res.status === 401) throw new PublishError("This Discord webhook was deleted. Create a new one and reconnect Discord.", false, true);
  if (!res.ok) return fail(res, "Discord");
  const j: any = await res.json();
  if (!c.metadata.guild_id && j.guild_id) await updateMetadata(c, { guild_id: j.guild_id });
  const guild = c.metadata.guild_id || j.guild_id;
  return { externalId: String(j.id), permalink: guild ? `https://discord.com/channels/${guild}/${j.channel_id}/${j.id}` : undefined };
}

export const NETWORK_PUBLISHERS: Record<string, (post: any) => Promise<{ externalId: string; permalink?: string }>> = {
  threads: publishThreads,
  pinterest: publishPinterest,
  youtube: publishYouTube,
  bluesky: publishBluesky,
  mastodon: publishMastodon,
  telegram: publishTelegram,
  discord: publishDiscord,
};
