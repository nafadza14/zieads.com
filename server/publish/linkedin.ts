/*
  LinkedIn member posts (w_member_social) with text, one image, 2 to 20 images, or one video.
    Images: POST /rest/images?action=initializeUpload, PUT the bytes, then content.media or content.multiImage
    Video:  POST /rest/videos?action=initializeUpload, PUT each part (collect ETags), finalizeUpload, then content.media
  LinkedIn takes JPG, PNG and GIF; WebP uploads are converted to JPG first.
*/
import sharp from "sharp";
import { getDecryptedToken } from "../utils/tokenHelper.js";
import { PublishError } from "./errors.js";
import { download } from "../social/publishers.js";

const API = "https://api.linkedin.com/rest";
const IMAGE_MAX = 20 * 1024 * 1024;
const VIDEO_MAX = 200 * 1024 * 1024;

const headers = (token: string, json = true) => ({
  Authorization: `Bearer ${token}`,
  "LinkedIn-Version": process.env.LINKEDIN_API_VERSION || "202609",
  "X-Restli-Protocol-Version": "2.0.0",
  ...(json ? { "Content-Type": "application/json" } : {}),
});

async function liFail(res: Response, what: string): Promise<never> {
  const t = await res.text().catch(() => "");
  let msg = t.slice(0, 200);
  try {
    msg = JSON.parse(t).message || msg;
  } catch {
    /* keep text */
  }
  throw new PublishError(`LinkedIn refused the ${what} (${res.status}). ${msg}`.trim(), res.status >= 500 || res.status === 429, res.status === 401);
}

const isVideoUrl = (url: string, type = "") => /^video\//.test(type) || /\.(mp4|mov|m4v|webm)(\?|$)/i.test(url);

export async function uploadImage(token: string, owner: string, url: string): Promise<string> {
  const { buf, type } = await download(url, IMAGE_MAX, "LinkedIn");
  let body: Buffer = Buffer.from(buf);
  // LinkedIn does not accept WebP or HEIC: send a JPG instead
  if (!/jpe?g|png|gif/i.test(type)) body = await sharp(body).jpeg({ quality: 90 }).toBuffer();
  const init = await fetch(`${API}/images?action=initializeUpload`, { method: "POST", headers: headers(token), body: JSON.stringify({ initializeUploadRequest: { owner } }) });
  if (!init.ok) await liFail(init, "image upload");
  const v: any = (await init.json()).value || {};
  if (!v.uploadUrl || !v.image) throw new PublishError("LinkedIn did not return an upload address for the image.", true);
  const put = await fetch(v.uploadUrl, { method: "PUT", headers: { Authorization: `Bearer ${token}` }, body });
  if (!put.ok) await liFail(put, "image bytes");
  return v.image as string;
}

export async function uploadVideo(token: string, owner: string, url: string): Promise<string> {
  const { buf } = await download(url, VIDEO_MAX, "LinkedIn");
  const bytes = Buffer.from(buf);
  const init = await fetch(`${API}/videos?action=initializeUpload`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ initializeUploadRequest: { owner, fileSizeBytes: bytes.length, uploadCaptions: false, uploadThumbnail: false } }),
  });
  if (!init.ok) await liFail(init, "video upload");
  const v: any = (await init.json()).value || {};
  const parts: Array<{ uploadUrl: string; firstByte: number; lastByte: number }> = v.uploadInstructions || [];
  if (!v.video || !parts.length) throw new PublishError("LinkedIn did not return upload instructions for the video.", true);
  const etags: string[] = [];
  for (const p of parts) {
    const put = await fetch(p.uploadUrl, { method: "PUT", headers: { "Content-Type": "application/octet-stream" }, body: bytes.subarray(p.firstByte, p.lastByte + 1) });
    if (!put.ok) await liFail(put, "video part");
    etags.push((put.headers.get("etag") || "").replace(/"/g, ""));
  }
  const fin = await fetch(`${API}/videos?action=finalizeUpload`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ finalizeUploadRequest: { video: v.video, uploadToken: v.uploadToken || "", uploadedPartIds: etags } }),
  });
  if (!fin.ok) await liFail(fin, "video");
  return v.video as string;
}

/** The content block for the post, or undefined for a text post */
export async function linkedInContent(token: string, owner: string, urls: string[], mediaType = ""): Promise<any | undefined> {
  if (!urls.length) return undefined;
  const video = urls.find((u) => isVideoUrl(u, mediaType === "video" ? "video/" : ""));
  if (video) return { media: { id: await uploadVideo(token, owner, video) } };
  const ids: string[] = [];
  for (const u of urls.slice(0, 20)) ids.push(await uploadImage(token, owner, u));
  return ids.length === 1 ? { media: { id: ids[0] } } : { multiImage: { images: ids.map((id) => ({ id })) } };
}

export async function publishLinkedIn(post: any) {
  const conn = await getDecryptedToken(post.user_id, "linkedin");
  if (!conn) throw new PublishError("LinkedIn is not connected. Reconnect it in Connections.", false, true);
  const owner = `urn:li:person:${conn.platformUserId}`;
  const content = await linkedInContent(conn.token, owner, post.media_urls || [], post.media_type || "");
  const res = await fetch(`${API}/posts`, {
    method: "POST",
    headers: headers(conn.token),
    body: JSON.stringify({
      author: owner,
      commentary: post.caption || "",
      visibility: "PUBLIC",
      distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
      ...(content ? { content } : {}),
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    }),
  });
  if (!res.ok) await liFail(res, "post");
  const id = res.headers.get("x-restli-id") || res.headers.get("x-linkedin-id") || "";
  return { externalId: id, permalink: id ? `https://www.linkedin.com/feed/update/${id}/` : undefined };
}
