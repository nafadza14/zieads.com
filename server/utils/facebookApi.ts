/*
  Facebook Pages via the Graph API (spec P0-2, 9.1 batch A and B).
  Permissions used: pages_show_list, pages_read_engagement, pages_manage_posts,
  read_insights, pages_read_user_content, pages_manage_engagement, pages_manage_metadata.

  The Graph API version is pinned (spec 8.2). Change META_GRAPH_VERSION after
  checking the changelog, never leave it floating.
*/
export const GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v23.0";
export const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;

/** Scopes requested when no Facebook Login for Business config_id is set */
export const FACEBOOK_SCOPES = [
  "pages_show_list",
  "business_management",
  "pages_read_engagement",
  "pages_manage_posts",
  "read_insights",
  "pages_read_user_content",
  "pages_manage_engagement",
  "pages_manage_metadata",
];

export class GraphError extends Error {
  status: number;
  code?: number;
  subcode?: number;
  type?: string;
  constructor(message: string, status: number, code?: number, subcode?: number, type?: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.subcode = subcode;
    this.type = type;
  }
}

/**
 * Turn a Graph error into a sentence a user understands (spec 7.10: explain the
 * cause, not the technical error). Exported for tests.
 */
export function explainGraphError(e: { code?: number; subcode?: number; message?: string }): { reason: string; needsReconnect: boolean } {
  const code = e.code;
  const sub = e.subcode;
  if (code === 190) {
    if (sub === 460) return { reason: "The Facebook password changed, so the connection stopped. Reconnect Facebook to continue.", needsReconnect: true };
    if (sub === 463) return { reason: "The Facebook access expired. Reconnect Facebook to continue.", needsReconnect: true };
    if (sub === 492) return { reason: "Your Facebook account lost its role on this Page. Ask a Page admin to give you full control again, then reconnect.", needsReconnect: true };
    if (sub === 458) return { reason: "ZieAds was removed from your Facebook apps. Reconnect Facebook to continue.", needsReconnect: true };
    return { reason: "Facebook no longer accepts the saved access. Reconnect Facebook to continue.", needsReconnect: true };
  }
  if (code === 10 || code === 200 || (code !== undefined && code >= 200 && code < 300)) {
    return { reason: "ZieAds is missing a Facebook permission for this action. Reconnect Facebook and keep every permission switched on.", needsReconnect: true };
  }
  if (code === 4 || code === 17 || code === 32 || code === 613) {
    return { reason: "Facebook is rate limiting this Page for a while. ZieAds will retry automatically.", needsReconnect: false };
  }
  if (code === 368) return { reason: "Facebook blocked this action because it looks like spam or breaks Page rules. Edit the post and try again.", needsReconnect: false };
  if (code === 1 || code === 2) return { reason: "Facebook had a temporary problem. ZieAds will retry automatically.", needsReconnect: false };
  if (code === 100) return { reason: `Facebook rejected the request: ${e.message || "invalid parameter"}.`, needsReconnect: false };
  return { reason: e.message || "Facebook returned an unknown error.", needsReconnect: false };
}

type FetchLike = typeof fetch;
let fetchImpl: FetchLike = (input, init) => fetch(input, init);
/** Tests swap the network layer */
export function __setFetch(f: FetchLike) {
  fetchImpl = f;
}

export async function graph<T = any>(path: string, token: string, init: { method?: string; params?: Record<string, string | number | boolean | undefined> } = {}): Promise<T> {
  const method = init.method || "GET";
  const url = new URL(path.startsWith("http") ? path : `${GRAPH}/${path.replace(/^\//, "")}`);
  const params = { ...(init.params || {}), access_token: token };
  let body: URLSearchParams | undefined;
  if (method === "GET" || method === "DELETE") {
    for (const [k, v] of Object.entries(params)) if (v !== undefined) url.searchParams.set(k, String(v));
  } else {
    body = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v !== undefined) body.set(k, String(v));
  }
  const res = await fetchImpl(url.toString(), { method, body, headers: body ? { "Content-Type": "application/x-www-form-urlencoded" } : undefined });
  const j: any = await res.json().catch(() => ({}));
  if (!res.ok || j?.error) {
    const err = j?.error || {};
    throw new GraphError(err.message || `Graph API error ${res.status}`, res.status, err.code, err.error_subcode, err.type);
  }
  return j as T;
}

export interface FbPage {
  id: string;
  name: string;
  access_token: string;
  category?: string;
  picture?: string;
  tasks?: string[];
}

/** Exchange an OAuth code for a user token, then for a long-lived user token */
export async function exchangeCode(code: string, redirectUri: string): Promise<{ token: string; expiresIn?: number }> {
  const appId = process.env.FACEBOOK_APP_ID || "";
  const secret = process.env.FACEBOOK_APP_SECRET || "";
  const short = await graph<{ access_token: string }>("oauth/access_token", "", {
    params: { client_id: appId, client_secret: secret, redirect_uri: redirectUri, code },
  });
  const long = await graph<{ access_token: string; expires_in?: number }>("oauth/access_token", "", {
    params: { grant_type: "fb_exchange_token", client_id: appId, client_secret: secret, fb_exchange_token: short.access_token },
  });
  return { token: long.access_token, expiresIn: long.expires_in };
}

export async function getMe(userToken: string): Promise<{ id: string; name: string }> {
  return graph("me", userToken, { params: { fields: "id,name" } });
}

/** Permissions the person actually granted (spec 8.2: log declined permissions) */
export async function getPermissions(userToken: string): Promise<{ granted: string[]; declined: string[] }> {
  const j = await graph<{ data: Array<{ permission: string; status: string }> }>("me/permissions", userToken);
  const granted = j.data.filter((p) => p.status === "granted").map((p) => p.permission);
  const declined = j.data.filter((p) => p.status !== "granted").map((p) => p.permission);
  return { granted, declined };
}

/** Pages the person manages. Page tokens from a long-lived user token do not expire. */
export async function listPages(userToken: string): Promise<FbPage[]> {
  const out: FbPage[] = [];
  let next: string | undefined = "me/accounts";
  let guard = 0;
  while (next && guard++ < 10) {
    const j: any = await graph(next, userToken, next.startsWith("http") ? {} : { params: { fields: "id,name,access_token,category,tasks,picture{url}", limit: 100 } });
    for (const p of j.data || []) out.push({ id: p.id, name: p.name, access_token: p.access_token, category: p.category, tasks: p.tasks, picture: p.picture?.data?.url });
    next = j.paging?.next;
  }
  return out;
}

/** Receive comment webhooks for this Page */
export async function subscribePage(pageId: string, pageToken: string): Promise<boolean> {
  try {
    await graph(`${pageId}/subscribed_apps`, pageToken, { method: "POST", params: { subscribed_fields: "feed" } });
    return true;
  } catch (e: any) {
    console.error(`[facebook] webhook subscribe failed for page ${pageId}:`, e.message);
    return false;
  }
}

export interface FbPublishInput {
  message: string;
  link?: string;
  imageUrls?: string[];
  videoUrl?: string;
}

/**
 * Publish to a Page: text, link, one or more photos, or a video.
 * Returns the post id and permalink.
 */
export async function publishToPage(pageId: string, pageToken: string, input: FbPublishInput): Promise<{ id: string; permalink?: string }> {
  const message = input.message || "";
  let id: string;
  if (input.videoUrl) {
    const v = await graph<{ id: string }>(`${pageId}/videos`, pageToken, { method: "POST", params: { file_url: input.videoUrl, description: message } });
    id = v.id;
  } else if (input.imageUrls && input.imageUrls.length === 1) {
    const p = await graph<{ id: string; post_id?: string }>(`${pageId}/photos`, pageToken, { method: "POST", params: { url: input.imageUrls[0], caption: message } });
    id = p.post_id || p.id;
  } else if (input.imageUrls && input.imageUrls.length > 1) {
    // Multi photo post: upload each photo unpublished, then attach them to one feed post
    const media: string[] = [];
    for (const url of input.imageUrls.slice(0, 10)) {
      const p = await graph<{ id: string }>(`${pageId}/photos`, pageToken, { method: "POST", params: { url, published: false } });
      media.push(p.id);
    }
    const params: Record<string, string> = { message };
    media.forEach((m, i) => (params[`attached_media[${i}]`] = JSON.stringify({ media_fbid: m })));
    const f = await graph<{ id: string }>(`${pageId}/feed`, pageToken, { method: "POST", params });
    id = f.id;
  } else {
    if (!message && !input.link) throw new GraphError("A Facebook post needs text, a link, a photo or a video.", 400, 100);
    const f = await graph<{ id: string }>(`${pageId}/feed`, pageToken, { method: "POST", params: { message, link: input.link } });
    id = f.id;
  }
  let permalink: string | undefined;
  try {
    const p = await graph<{ permalink_url?: string }>(id, pageToken, { params: { fields: "permalink_url" } });
    permalink = p.permalink_url;
  } catch {
    permalink = `https://www.facebook.com/${id}`;
  }
  return { id, permalink };
}

/** Check that a post really exists after publishing (Guardian, spec 7.10) */
export async function verifyPost(postId: string, pageToken: string): Promise<boolean> {
  try {
    const p = await graph<{ id: string }>(postId, pageToken, { params: { fields: "id" } });
    return !!p.id;
  } catch {
    return false;
  }
}

export async function commentOnPost(objectId: string, pageToken: string, message: string): Promise<{ id: string }> {
  return graph(`${objectId}/comments`, pageToken, { method: "POST", params: { message } });
}

export async function hideComment(commentId: string, pageToken: string, hidden = true): Promise<void> {
  await graph(commentId, pageToken, { method: "POST", params: { is_hidden: hidden } });
}

export async function deleteComment(commentId: string, pageToken: string): Promise<void> {
  await graph(commentId, pageToken, { method: "DELETE" });
}

export interface FbComment {
  id: string;
  message: string;
  created_time: string;
  from?: { id: string; name: string };
  parent?: { id: string };
  post_id: string;
  permalink_url?: string;
}

/** Recent comments on recent Page posts (polling fallback when webhooks are late) */
export async function listRecentComments(pageId: string, pageToken: string, postLimit = 15): Promise<FbComment[]> {
  const j: any = await graph(`${pageId}/feed`, pageToken, {
    params: { fields: "id,created_time,permalink_url,comments.limit(50).order(reverse_chronological){id,message,created_time,from,parent}", limit: postLimit },
  });
  const out: FbComment[] = [];
  for (const post of j.data || []) {
    for (const c of post.comments?.data || []) {
      // Skip the Page's own replies
      if (c.from?.id === pageId) continue;
      out.push({ id: c.id, message: c.message || "", created_time: c.created_time, from: c.from, parent: c.parent, post_id: post.id, permalink_url: post.permalink_url });
    }
  }
  return out;
}

export interface FbPagePost {
  id: string;
  message?: string;
  created_time: string;
  permalink_url?: string;
  full_picture?: string;
  reactions: number;
  comments: number;
  shares: number;
}

export async function listPagePosts(pageId: string, pageToken: string, limit = 25): Promise<FbPagePost[]> {
  const j: any = await graph(`${pageId}/published_posts`, pageToken, {
    params: { fields: "id,message,created_time,permalink_url,full_picture,shares,reactions.summary(total_count).limit(0),comments.summary(total_count).limit(0)", limit },
  });
  return (j.data || []).map((p: any) => ({
    id: p.id,
    message: p.message,
    created_time: p.created_time,
    permalink_url: p.permalink_url,
    full_picture: p.full_picture,
    reactions: p.reactions?.summary?.total_count || 0,
    comments: p.comments?.summary?.total_count || 0,
    shares: p.shares?.count || 0,
  }));
}

/**
 * Page insights with the metrics Meta introduced in 2025 (spec 7.6):
 * page_media_view replaces page_impressions, page_follows replaces page_fans.
 * Metrics Meta has not enabled for a Page are skipped, not fatal.
 */
export const PAGE_METRICS = ["page_media_view", "page_follows", "page_post_engagements", "page_daily_follows_unique"];
export async function getPageInsights(pageId: string, pageToken: string, sinceIso: string, untilIso: string): Promise<Record<string, Array<{ date: string; value: number }>>> {
  const out: Record<string, Array<{ date: string; value: number }>> = {};
  for (const metric of PAGE_METRICS) {
    try {
      const j: any = await graph(`${pageId}/insights`, pageToken, {
        params: { metric, period: "day", since: Math.floor(new Date(sinceIso).getTime() / 1000), until: Math.floor(new Date(untilIso).getTime() / 1000) },
      });
      const series = j.data?.[0]?.values || [];
      out[metric] = series.map((v: any) => ({ date: String(v.end_time).slice(0, 10), value: typeof v.value === "number" ? v.value : Number(Object.values(v.value || {}).reduce((a: any, b: any) => a + b, 0)) }));
    } catch (e: any) {
      console.warn(`[facebook] insight ${metric} unavailable:`, e.message);
    }
  }
  return out;
}

export async function getPostInsights(postId: string, pageToken: string): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const metric of ["post_media_view", "post_engagements", "post_clicks"]) {
    try {
      const j: any = await graph(`${postId}/insights`, pageToken, { params: { metric } });
      out[metric] = Number(j.data?.[0]?.values?.[0]?.value || 0);
    } catch {
      /* metric not available for this post type */
    }
  }
  return out;
}

export async function getPageProfile(pageId: string, pageToken: string): Promise<{ followers: number; name: string; link?: string }> {
  const j: any = await graph(pageId, pageToken, { params: { fields: "name,followers_count,link" } });
  return { followers: Number(j.followers_count || 0), name: j.name, link: j.link };
}
