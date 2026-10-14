/*
  Competitor content sources.

  Every adapter returns ContentItem[] in one shape, whatever the platform:
    - meta_ads      Meta Ad Library (Facebook, Instagram, Messenger, Audience Network placements)
    - linkedin_ads  LinkedIn Ad Library
    - tiktok_ads    TikTok Ad Library (only lists ads shown in Europe, see note on tiktokAds)
    - instagram     public posts and reels
    - facebook      public page posts
    - tiktok        public videos
    - linkedin      public company page posts

  Data provider: Scrape Creators (https://scrapecreators.com), one API key for every
  platform, env SCRAPECREATORS_API_KEY. If it is not set, Meta ads fall back to the
  official Meta Ad Library API (env FACEBOOK_ACCESS_TOKEN), which outside the EU mostly
  returns political and issue ads only.
*/

export type Source = 'meta_ads' | 'linkedin_ads' | 'tiktok_ads' | 'instagram' | 'facebook' | 'tiktok' | 'linkedin';

export type ContentItem = {
  platform: string; // instagram | facebook | tiktok | linkedin | meta
  kind: 'organic' | 'ad';
  source: Source;
  external_id: string;
  url: string | null;
  caption: string | null;
  headline?: string | null;
  cta?: string | null;
  link_url?: string | null;
  media_type: 'image' | 'video' | 'carousel' | 'text';
  thumbnail_url: string | null;
  media_url: string | null;
  carousel?: { thumbnail_url: string | null; media_url?: string | null }[];
  aspect?: string | null;
  placements?: string[];
  is_active?: boolean | null;
  started_at?: string | null;
  ended_at?: string | null;
  posted_at?: string | null;
  metrics?: Record<string, any>;
};

const SC_BASE = 'https://api.scrapecreators.com';

export const providerConfigured = () => Boolean(process.env.SCRAPECREATORS_API_KEY);

async function sc(path: string, params: Record<string, string | undefined>, timeoutMs = 25000): Promise<any> {
  const key = process.env.SCRAPECREATORS_API_KEY;
  if (!key) throw new Error('SCRAPECREATORS_API_KEY is not set');
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') qs.set(k, v);
  const res = await fetch(`${SC_BASE}${path}?${qs.toString()}`, {
    headers: { 'x-api-key': key, accept: 'application/json' },
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Provider returned ${res.status}`);
  }
  if (!res.ok || json?.success === false) throw new Error(json?.message || json?.error || `Provider returned ${res.status}`);
  return json;
}

// ─── helpers ───────────────────────────────────────────────────────────────
const unix = (v: any): string | null => {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return new Date((v > 1e12 ? v : v * 1000)).toISOString();
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
};
const num = (v: any): number | null => (typeof v === 'number' && isFinite(v) ? v : typeof v === 'string' && v.trim() && !isNaN(Number(v)) ? Number(v) : null);
const clean = (s: any): string | null => {
  if (typeof s !== 'string') return null;
  const t = s.trim();
  if (!t || /\{\{[^}]+\}\}/.test(t)) return t.replace(/\{\{[^}]+\}\}/g, '').replace(/[ \t]{2,}/g, ' ').trim() || null; // catalog ad templates
  return t;
};
const ratio = (w?: number, h?: number): string | null => {
  if (!w || !h) return null;
  const r = w / h;
  if (r < 0.62) return '9:16';
  if (r < 0.9) return '4:5';
  if (r < 1.15) return '1:1';
  if (r < 1.6) return '4:3';
  return '1.91:1';
};
export const normName = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

// ─── Meta Ad Library ───────────────────────────────────────────────────────
export async function findMetaPage(name: string, igHandle?: string | null) {
  const j = await sc('/v1/facebook/adLibrary/search/companies', { query: name });
  const list: any[] = j.searchResults || j.results || [];
  if (!list.length) return null;
  const ig = igHandle ? igHandle.toLowerCase() : null;
  const want = normName(name);
  const pick =
    (ig && list.find((p) => (p.ig_username || '').toLowerCase() === ig)) ||
    list.find((p) => normName(p.name || '') === want) ||
    list.find((p) => normName(p.name || '').includes(want) || want.includes(normName(p.name || ''))) ||
    [...list].sort((a, b) => (b.likes || 0) + (b.ig_followers || 0) - ((a.likes || 0) + (a.ig_followers || 0)))[0];
  return pick
    ? { page_id: String(pick.page_id), name: pick.name as string, ig_username: (pick.ig_username as string) || null, image: (pick.image_uri as string) || null, page_alias: pick.page_alias || null }
    : null;
}

export function mapMetaAd(ad: any): ContentItem | null {
  const s = ad.snapshot || {};
  const id = String(ad.ad_archive_id || ad.ad_id || '');
  if (!id) return null;
  const cards: any[] = Array.isArray(s.cards) ? s.cards : [];
  const videos: any[] = Array.isArray(s.videos) ? s.videos : [];
  const images: any[] = Array.isArray(s.images) ? s.images : [];
  const fmt = String(s.display_format || '').toUpperCase();
  let media_type: ContentItem['media_type'] = 'text';
  let thumb: string | null = null;
  let media: string | null = null;
  if (videos.length) {
    media_type = 'video';
    thumb = videos[0].video_preview_image_url || null;
    media = videos[0].video_hd_url || videos[0].video_sd_url || null;
  } else if (cards.length > 1 || fmt === 'CAROUSEL' || fmt === 'DCO') {
    media_type = cards.length ? 'carousel' : 'image';
    thumb = cards[0]?.resized_image_url || cards[0]?.original_image_url || cards[0]?.video_preview_image_url || images[0]?.resized_image_url || null;
    media = cards[0]?.video_hd_url || cards[0]?.video_sd_url || null;
  } else if (images.length) {
    media_type = 'image';
    thumb = images[0].resized_image_url || images[0].original_image_url || null;
  } else if (cards.length) {
    media_type = cards[0].video_hd_url || cards[0].video_sd_url ? 'video' : 'image';
    thumb = cards[0].resized_image_url || cards[0].original_image_url || cards[0].video_preview_image_url || null;
    media = cards[0].video_hd_url || cards[0].video_sd_url || null;
  }
  const placements: string[] = (ad.publisher_platform || ad.publisher_platforms || []).map((p: string) => String(p).toLowerCase());
  const started = unix(ad.start_date);
  const ended = ad.is_active ? null : unix(ad.end_date);
  const runDays = started ? Math.max(1, Math.round(((ended ? new Date(ended).getTime() : Date.now()) - new Date(started).getTime()) / 86400000)) : null;
  return {
    platform: 'meta',
    kind: 'ad',
    source: 'meta_ads',
    external_id: id,
    url: `https://www.facebook.com/ads/library/?id=${id}`,
    caption: clean(s.body?.text) || clean(cards[0]?.body) || null,
    headline: clean(s.title) || clean(cards[0]?.title) || clean(s.link_description) || null,
    cta: s.cta_text || cards[0]?.cta_text || null,
    link_url: s.link_url || cards[0]?.link_url || null,
    media_type,
    thumbnail_url: thumb,
    media_url: media,
    carousel: cards.slice(0, 10).map((c) => ({ thumbnail_url: c.resized_image_url || c.original_image_url || c.video_preview_image_url || null, media_url: c.video_hd_url || c.video_sd_url || null })),
    aspect: null,
    placements,
    is_active: Boolean(ad.is_active),
    started_at: started,
    ended_at: ended,
    posted_at: started,
    metrics: {
      run_days: runDays,
      variants: num(ad.collation_count),
      impressions_text: ad.impressions_with_index?.impressions_text || null,
      page_name: s.page_name || ad.page_name || null,
    },
  };
}

export async function metaAds(pageId: string, maxPages = 2): Promise<ContentItem[]> {
  const out: ContentItem[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < maxPages; i++) {
    const j = await sc('/v1/facebook/adLibrary/company/ads', { pageId, status: 'ALL', sort_by: 'relevancy_monthly_grouped', cursor });
    for (const ad of j.results || []) {
      const m = mapMetaAd(ad);
      if (m) out.push(m);
    }
    cursor = j.cursor;
    if (!cursor || !(j.results || []).length) break;
  }
  return out;
}

/** Fallback without a provider key: official Meta Ad Library API. Outside the EU it mostly returns political or issue ads. */
export async function metaAdsOfficial(searchTerm: string): Promise<ContentItem[]> {
  const token = process.env.FACEBOOK_ACCESS_TOKEN;
  if (!token) throw new Error('No ads provider configured');
  const params = new URLSearchParams({
    search_terms: searchTerm,
    ad_type: 'ALL',
    ad_active_status: 'ALL',
    ad_reached_countries: "['ALL']",
    limit: '30',
    fields: 'id,ad_creative_bodies,ad_creative_link_titles,page_name,ad_delivery_start_time,ad_delivery_stop_time,publisher_platforms',
    access_token: token,
  });
  const res = await fetch(`https://graph.facebook.com/v21.0/ads_archive?${params}`, { signal: AbortSignal.timeout(15000) });
  const j = await res.json();
  if (j.error) throw new Error(j.error.message);
  return (j.data || []).map((ad: any) => ({
    platform: 'meta',
    kind: 'ad',
    source: 'meta_ads',
    external_id: String(ad.id),
    url: `https://www.facebook.com/ads/library/?id=${ad.id}`,
    caption: ad.ad_creative_bodies?.[0] || null,
    headline: ad.ad_creative_link_titles?.[0] || null,
    media_type: 'text',
    thumbnail_url: null,
    media_url: null,
    placements: (ad.publisher_platforms || []).map((p: string) => p.toLowerCase()),
    is_active: !ad.ad_delivery_stop_time,
    started_at: unix(ad.ad_delivery_start_time),
    ended_at: unix(ad.ad_delivery_stop_time),
    posted_at: unix(ad.ad_delivery_start_time),
    metrics: { page_name: ad.page_name || null },
  }));
}

// ─── Instagram ─────────────────────────────────────────────────────────────
export async function instagramPosts(handle: string): Promise<ContentItem[]> {
  const j = await sc('/v2/instagram/user/posts', { handle });
  return (j.items || []).map(mapInstagramItem);
}

/** Instagram web/private API media item (the shape instagram.com itself loads) */
export function mapInstagramItem(p: any): ContentItem {
  const cand = p.image_versions2?.candidates?.[0];
  const isReel = p.product_type === 'clips' || p.media_type === 2;
  const isCarousel = p.media_type === 8 || Array.isArray(p.carousel_media);
  return {
    platform: 'instagram',
    kind: 'organic',
    source: 'instagram',
    external_id: String(p.code || p.id || p.pk),
    url: p.url || (p.code ? `https://www.instagram.com/p/${p.code}/` : null),
    caption: clean(p.caption?.text),
    media_type: isReel ? 'video' : isCarousel ? 'carousel' : 'image',
    thumbnail_url: cand?.url || p.display_uri || p.carousel_media?.[0]?.image_versions2?.candidates?.[0]?.url || null,
    media_url: p.video_versions?.[0]?.url || null,
    carousel: Array.isArray(p.carousel_media) ? p.carousel_media.slice(0, 10).map((c: any) => ({ thumbnail_url: c.image_versions2?.candidates?.[0]?.url || null, media_url: c.video_versions?.[0]?.url || null })) : [],
    aspect: isReel ? '9:16' : ratio(p.original_width || cand?.width, p.original_height || cand?.height) || '4:5',
    posted_at: unix(p.taken_at) || unix(p.created_at),
    metrics: {
      likes: num(p.like_count),
      comments: num(p.comment_count),
      views: num(p.play_count) ?? num(p.ig_play_count) ?? num(p.view_count),
      format: isReel ? 'reel' : isCarousel ? 'carousel' : 'image',
    },
  };
}

// Official and free: Instagram Graph API Business Discovery. Reads any public Business or
// Creator account through the ZieAds owner's own Instagram Business account.
// env META_DISCOVERY_TOKEN (Facebook user or system user token with instagram_basic,
// instagram_manage_insights, pages_read_engagement) and META_DISCOVERY_IG_ID.
export const discoveryConfigured = () => Boolean(process.env.META_DISCOVERY_TOKEN && process.env.META_DISCOVERY_IG_ID);

export async function instagramDiscovery(handle: string): Promise<{ items: ContentItem[]; profile: any }> {
  const fields = `business_discovery.username(${handle.replace(/[^A-Za-z0-9_.]/g, '')}){username,name,profile_picture_url,followers_count,media_count,media.limit(30){id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,view_count,children{media_type,media_url,thumbnail_url}}}`;
  const url = `https://graph.facebook.com/v21.0/${process.env.META_DISCOVERY_IG_ID}?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(process.env.META_DISCOVERY_TOKEN || '')}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  const j = await res.json();
  if (j.error) throw new Error(j.error.error_user_msg || j.error.message || 'Business Discovery failed');
  const bd = j.business_discovery || {};
  const items = (bd.media?.data || []).map((m: any): ContentItem => {
    const isReel = m.media_product_type === 'REELS' || m.media_type === 'VIDEO';
    const isCarousel = m.media_type === 'CAROUSEL_ALBUM';
    const kids: any[] = m.children?.data || [];
    return {
      platform: 'instagram',
      kind: 'organic',
      source: 'instagram',
      external_id: String(m.permalink?.match(/\/(p|reel)\/([^/]+)/)?.[2] || m.id),
      url: m.permalink || null,
      caption: clean(m.caption),
      media_type: isReel ? 'video' : isCarousel ? 'carousel' : 'image',
      thumbnail_url: m.thumbnail_url || (isReel ? null : m.media_url) || kids[0]?.thumbnail_url || kids[0]?.media_url || null,
      media_url: isReel ? m.media_url || null : null,
      carousel: kids.slice(0, 10).map((k) => ({ thumbnail_url: k.thumbnail_url || (k.media_type === 'VIDEO' ? null : k.media_url) || null, media_url: k.media_type === 'VIDEO' ? k.media_url : null })),
      aspect: isReel ? '9:16' : '4:5',
      posted_at: unix(m.timestamp),
      metrics: { likes: num(m.like_count), comments: num(m.comments_count), views: num(m.view_count), format: isReel ? 'reel' : isCarousel ? 'carousel' : 'image' },
    };
  });
  return { items, profile: { name: bd.name, picture: bd.profile_picture_url, followers: bd.followers_count, posts: bd.media_count } };
}

// ─── Facebook page posts ───────────────────────────────────────────────────
export async function facebookPosts(pageUrlOrId: string): Promise<ContentItem[]> {
  const isId = /^\d+$/.test(pageUrlOrId);
  const j = await sc('/v1/facebook/profile/posts', isId ? { pageId: pageUrlOrId } : { url: pageUrlOrId });
  return (j.posts || []).map((p: any): ContentItem => {
    const video = p.videoDetails || null;
    const image = p.image?.uri || p.image?.url || p.images?.[0]?.uri || p.images?.[0] || p.media?.[0]?.image?.uri || null;
    return {
      platform: 'facebook',
      kind: 'organic',
      source: 'facebook',
      external_id: String(p.id || p.post_id || p.url),
      url: p.permalink || p.url || null,
      caption: clean(p.text),
      media_type: video ? 'video' : image ? 'image' : 'text',
      thumbnail_url: video?.thumbnailUrl || (typeof image === 'string' ? image : null),
      media_url: video?.hdUrl || video?.sdUrl || null,
      aspect: video ? null : '1.91:1',
      posted_at: unix(p.publishTime),
      metrics: { likes: num(p.reactionCount), comments: num(p.commentCount), views: num(p.videoViewCount), shares: num(p.shareCount) },
    };
  });
}

// ─── TikTok ────────────────────────────────────────────────────────────────
export async function tiktokVideos(handle: string): Promise<ContentItem[]> {
  const j = await sc('/v3/tiktok/profile/videos', { handle, sort_by: 'latest' });
  const h = handle.replace(/^@/, '');
  return (j.aweme_list || []).map((v: any) => mapTikTokAweme(v, h));
}

/** TikTok app API item (aweme) */
export function mapTikTokAweme(v: any, h: string): ContentItem {
  const st = v.statistics || {};
  const cover = v.video?.cover?.url_list?.[0] || v.video?.origin_cover?.url_list?.[0] || v.video?.dynamic_cover?.url_list?.[0] || null;
  const isPhoto = Boolean(v.image_post_info);
  return {
    platform: 'tiktok',
    kind: 'organic',
    source: 'tiktok',
    external_id: String(v.aweme_id),
    url: v.share_url?.split('?')[0] || `https://www.tiktok.com/@${h}/video/${v.aweme_id}`,
    caption: clean(v.desc),
    media_type: isPhoto ? 'carousel' : 'video',
    thumbnail_url: isPhoto ? v.image_post_info?.images?.[0]?.display_image?.url_list?.[0] || cover : cover,
    media_url: v.video?.play_addr?.url_list?.[0] || null,
    aspect: '9:16',
    posted_at: unix(v.create_time),
    metrics: {
      views: num(st.play_count),
      likes: num(st.digg_count),
      comments: num(st.comment_count),
      shares: num(st.share_count),
      saves: num(st.collect_count),
      promoted: Boolean(v.is_ads || v.commerce_info?.ad_source),
    },
  };
}

/** TikTok web item (the shape tiktok.com loads from /api/post/item_list) */
export function mapTikTokWebItem(v: any, h: string): ContentItem {
  const st = v.stats || v.statsV2 || {};
  const photo = v.imagePost?.images || [];
  return {
    platform: 'tiktok',
    kind: 'organic',
    source: 'tiktok',
    external_id: String(v.id),
    url: `https://www.tiktok.com/@${h}/video/${v.id}`,
    caption: clean(v.desc),
    media_type: photo.length ? 'carousel' : 'video',
    thumbnail_url: v.video?.cover || v.video?.originCover || v.video?.dynamicCover || photo[0]?.imageURL?.urlList?.[0] || null,
    media_url: v.video?.playAddr || v.video?.downloadAddr || null,
    carousel: photo.slice(0, 10).map((p: any) => ({ thumbnail_url: p.imageURL?.urlList?.[0] || null })),
    aspect: '9:16',
    posted_at: unix(Number(v.createTime)),
    metrics: { views: num(st.playCount), likes: num(st.diggCount), comments: num(st.commentCount), shares: num(st.shareCount), saves: num(st.collectCount), promoted: Boolean(v.isAd) },
  };
}

/*
  TikTok ads. TikTok's public Ad Library (library.tiktok.com) and its official Commercial
  Content API only list ads shown in the EU, EEA, UK and Switzerland, and API access is
  limited to approved researchers. So this adapter reads the public library for a few
  European regions (env TIKTOK_ADLIB_REGIONS, default GB,DE,FR) and returns nothing for
  brands that only advertise in Asia. The UI says so and links to TikTok Creative Center.
*/
export async function tiktokAds(advertiser: string): Promise<ContentItem[]> {
  if (process.env.TIKTOK_ADLIB_ENABLED === 'false') return [];
  const regions = (process.env.TIKTOK_ADLIB_REGIONS || 'GB,DE,FR').split(',').map((r) => r.trim()).filter(Boolean).slice(0, 4);
  const end = Math.floor(Date.now() / 1000);
  const start = end - 365 * 86400;
  const seen = new Map<string, ContentItem>();
  const want = normName(advertiser);
  for (const region of regions) {
    const res = await fetch(`https://library.tiktok.com/api/v1/search?region=${region}&type=1&start_time=${start}&end_time=${end}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ query: advertiser, query_type: '2', order: 'last_shown_date,desc', offset: 0, limit: 12 }),
      signal: AbortSignal.timeout(12000),
    });
    const text = await res.text();
    let j: any;
    try {
      j = JSON.parse(text);
    } catch {
      throw new Error('TikTok Ad Library is rate limiting, try again later');
    }
    for (const ad of j.data || []) {
      const id = String(ad.id || ad.ad_id || '');
      if (!id || seen.has(id)) continue;
      const advName = ad.name || ad.advertiser_name || ad.advertiser?.business_name || '';
      if (advName && want && !normName(advName).includes(want) && !want.includes(normName(advName))) continue;
      const vid = (ad.videos || ad.video_list || [])[0] || {};
      const img = (ad.image_urls || ad.images || [])[0];
      const first = unix(ad.first_shown_date ?? ad.first_shown_time);
      const last = unix(ad.last_shown_date ?? ad.last_shown_time);
      seen.set(id, {
        platform: 'tiktok',
        kind: 'ad',
        source: 'tiktok_ads',
        external_id: id,
        url: `https://library.tiktok.com/ads/detail/?ad_id=${id}`,
        caption: clean(ad.ad_text || ad.title || ad.caption) || null,
        media_type: vid.video_url || vid.url ? 'video' : img ? 'image' : 'text',
        thumbnail_url: vid.cover_img || vid.cover_image_url || vid.cover || (typeof img === 'string' ? img : img?.url) || null,
        media_url: vid.video_url || vid.url || null,
        aspect: '9:16',
        is_active: last ? Date.now() - new Date(last).getTime() < 3 * 86400000 : null,
        started_at: first,
        ended_at: last,
        posted_at: first,
        metrics: { reach_text: ad.estimated_audience || ad.impression || ad.reach || null, region },
      });
    }
  }
  return [...seen.values()];
}

// ─── LinkedIn ──────────────────────────────────────────────────────────────
export async function linkedinAds(company: string): Promise<ContentItem[]> {
  const j = await sc('/v1/linkedin/ads/search', { company });
  const want = normName(company);
  const all: any[] = j.ads || [];
  const mine = all.filter((a) => {
    const n = normName(a.advertiser || a.poster || '');
    return n && (n.includes(want) || want.includes(n));
  });
  return (mine.length ? mine : all).map((a: any): ContentItem => ({
    platform: 'linkedin',
    kind: 'ad',
    source: 'linkedin_ads',
    external_id: String(a.id),
    url: `https://www.linkedin.com/ad-library/detail/${a.id}`,
    caption: clean(a.description),
    headline: clean(a.headline),
    cta: a.cta || null,
    link_url: a.destinationUrl || null,
    media_type: a.video ? 'video' : (a.carouselImages || []).length > 1 ? 'carousel' : a.image ? 'image' : 'text',
    thumbnail_url: a.image || a.carouselImages?.[0] || null,
    media_url: a.video && !String(a.video).includes('playlist') ? a.video : null,
    carousel: (a.carouselImages || []).slice(0, 10).map((u: string) => ({ thumbnail_url: u })),
    aspect: '1:1',
    is_active: a.endDate ? false : null,
    started_at: unix(a.startDate),
    ended_at: unix(a.endDate),
    posted_at: unix(a.startDate),
    metrics: { impressions_text: a.totalImpressions || null, ad_type: a.adType || null, advertiser: a.advertiser || null },
  }));
}

export async function linkedinPosts(companyUrl: string): Promise<{ items: ContentItem[]; logo: string | null }> {
  const j = await sc('/v1/linkedin/company', { url: companyUrl });
  const items = (j.posts || []).slice(0, 20).map((p: any, i: number): ContentItem => ({
    platform: 'linkedin',
    kind: 'organic',
    source: 'linkedin',
    external_id: String(p.id || p.url || `${companyUrl}#${i}`),
    url: p.url || null,
    caption: clean(p.text),
    media_type: p.image ? 'image' : 'text',
    thumbnail_url: p.image || null,
    media_url: null,
    aspect: '1.91:1',
    posted_at: unix(p.datePublished),
    metrics: { likes: num(p.likes ?? p.reactions), comments: num(p.comments) },
  }));
  return { items, logo: j.logo || j.image || null };
}

// ─── Find a brand's social accounts from its website ───────────────────────
export async function socialsFromWebsite(url: string) {
  const out: { instagram?: string; tiktok?: string; facebook?: string; linkedin?: string } = {};
  try {
    const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; ZieAdsBot/1.0)' }, signal: AbortSignal.timeout(8000), redirect: 'follow' });
    const html = (await res.text()).slice(0, 600000);
    const bad = /^(p|reel|reels|explore|stories|share|sharer|tr|plugins|dialog|watch|hashtag|intent|tag|music|video|legal|privacy|about)$/i;
    const ig = [...html.matchAll(/instagram\.com\/([A-Za-z0-9_.]{2,30})/g)].map((m) => m[1]).find((h) => !bad.test(h));
    if (ig) out.instagram = ig.replace(/\.$/, '');
    const tt = html.match(/tiktok\.com\/@([A-Za-z0-9_.]{2,30})/);
    if (tt) out.tiktok = tt[1];
    const fb = [...html.matchAll(/facebook\.com\/([A-Za-z0-9.\-]{2,60})/g)].map((m) => m[1]).find((h) => !bad.test(h) && !/\.php$/.test(h));
    if (fb) out.facebook = `https://www.facebook.com/${fb}`;
    const li = html.match(/linkedin\.com\/company\/([A-Za-z0-9_\-%.]{2,80})/);
    if (li) out.linkedin = `https://www.linkedin.com/company/${li[1].replace(/\/$/, '')}`;
  } catch {
    // website unreachable, user can add accounts by hand
  }
  return out;
}
