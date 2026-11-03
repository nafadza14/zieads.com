/*
  Pre-publish checks per platform (spec 7.4). Pure functions, used by the
  Composer before scheduling and by the server publisher before calling an API.
  Limits follow each platform's published rules (checked November 2026).
*/

export type ValidatePlatform = 'instagram' | 'facebook' | 'tiktok' | 'linkedin' | 'threads';

export interface MediaInfo {
  url?: string;
  mime?: string;
  width?: number;
  height?: number;
  durationSec?: number;
}

export interface PostDraft {
  caption: string;
  media: MediaInfo[];
  firstComment?: string;
  link?: string;
}

export interface Issue {
  level: 'error' | 'warning';
  code: string;
  message: string;
}

export interface PlatformRules {
  captionMax: number;
  hashtagMax?: number;
  mediaRequired: boolean;
  mediaMax: number;
  videoMaxSec?: number;
  videoMinSec?: number;
  ratioMin?: number; // width / height
  ratioMax?: number;
  linksClickable: boolean;
  firstComment: boolean;
}

export const RULES: Record<ValidatePlatform, PlatformRules> = {
  instagram: { captionMax: 2200, hashtagMax: 30, mediaRequired: true, mediaMax: 10, videoMaxSec: 900, videoMinSec: 3, ratioMin: 0.5625, ratioMax: 1.91, linksClickable: false, firstComment: true },
  facebook: { captionMax: 63206, mediaRequired: false, mediaMax: 10, videoMaxSec: 14400, linksClickable: true, firstComment: true },
  tiktok: { captionMax: 2200, mediaRequired: true, mediaMax: 1, videoMaxSec: 600, videoMinSec: 3, linksClickable: false, firstComment: false },
  linkedin: { captionMax: 3000, mediaRequired: false, mediaMax: 9, videoMaxSec: 900, linksClickable: true, firstComment: true },
  threads: { captionMax: 500, mediaRequired: false, mediaMax: 10, videoMaxSec: 300, linksClickable: true, firstComment: false },
};

const isVideo = (m: MediaInfo) => (m.mime ? m.mime.startsWith('video/') : /\.(mp4|mov|m4v|webm)(\?|$)/i.test(m.url || ''));
export const countHashtags = (s: string) => (s.match(/(^|\s)#[\p{L}\p{N}_]+/gu) || []).length;
const hasUrl = (s: string) => /https?:\/\/\S+/i.test(s);

export function validatePost(platform: ValidatePlatform, d: PostDraft, opts: { creatorMaxVideoSec?: number } = {}): Issue[] {
  const r = RULES[platform];
  const out: Issue[] = [];
  const caption = d.caption || '';
  const len = [...caption].length;
  if (len > r.captionMax) out.push({ level: 'error', code: 'caption_too_long', message: `Caption is ${len} characters. ${label(platform)} allows ${r.captionMax}.` });
  if (r.hashtagMax !== undefined) {
    const n = countHashtags(caption);
    if (n > r.hashtagMax) out.push({ level: 'error', code: 'too_many_hashtags', message: `${n} hashtags. ${label(platform)} allows ${r.hashtagMax}.` });
  }
  if (r.mediaRequired && d.media.length === 0) out.push({ level: 'error', code: 'media_required', message: platform === 'tiktok' ? 'TikTok needs a video.' : `${label(platform)} needs a photo or video.` });
  if (!r.mediaRequired && d.media.length === 0 && !caption.trim() && !d.link) out.push({ level: 'error', code: 'empty', message: 'Add text, a link or media.' });
  if (d.media.length > r.mediaMax) out.push({ level: 'error', code: 'too_much_media', message: `${label(platform)} takes up to ${r.mediaMax} item${r.mediaMax === 1 ? '' : 's'} in one post.` });
  if (platform === 'tiktok' && d.media.length && !d.media.every(isVideo)) out.push({ level: 'error', code: 'video_required', message: 'TikTok posts from ZieAds must be a video.' });
  const maxSec = opts.creatorMaxVideoSec ?? r.videoMaxSec;
  for (const m of d.media) {
    if (isVideo(m) && m.durationSec !== undefined) {
      if (maxSec && m.durationSec > maxSec) out.push({ level: 'error', code: 'video_too_long', message: `Video is ${Math.round(m.durationSec)}s. The limit here is ${maxSec}s.` });
      if (r.videoMinSec && m.durationSec < r.videoMinSec) out.push({ level: 'error', code: 'video_too_short', message: `Video must be at least ${r.videoMinSec}s.` });
    }
    if (m.width && m.height && r.ratioMin && r.ratioMax) {
      const ratio = m.width / m.height;
      if (ratio < r.ratioMin - 0.01 || ratio > r.ratioMax + 0.01) out.push({ level: 'error', code: 'bad_ratio', message: `Media ratio ${ratio.toFixed(2)} is outside what ${label(platform)} accepts (${r.ratioMin.toFixed(2)} to ${r.ratioMax.toFixed(2)}).` });
    }
  }
  if (!r.linksClickable && hasUrl(caption)) out.push({ level: 'warning', code: 'link_not_clickable', message: `Links in ${label(platform)} captions are not clickable. Put the link in your bio.` });
  if (d.firstComment && !r.firstComment) out.push({ level: 'warning', code: 'first_comment_unsupported', message: `${label(platform)} does not support a first comment from ZieAds, it will be skipped.` });
  if (d.firstComment && [...d.firstComment].length > Math.min(r.captionMax, 2200)) out.push({ level: 'error', code: 'first_comment_too_long', message: 'First comment is too long.' });
  return out;
}

export const hasErrors = (issues: Issue[]) => issues.some((i) => i.level === 'error');

function label(p: ValidatePlatform) {
  return { instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', linkedin: 'LinkedIn', threads: 'Threads' }[p];
}
