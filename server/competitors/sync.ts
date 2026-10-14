/*
  Pulls live ads and posts for one competitor from every platform in parallel and
  stores them in competitor_content. Called when a competitor is added, when the user
  presses Refresh, when the Hunt page opens with stale data, and by the monitor tick.
*/
import crypto from 'crypto';
import { supabaseAdmin } from '../supabaseServer.js';
import {
  type ContentItem,
  type Source,
  discoveryConfigured,
  facebookPosts,
  findMetaPage,
  instagramDiscovery,
  instagramPosts,
  linkedinAds,
  linkedinPosts,
  metaAds,
  metaAdsOfficial,
  providerConfigured,
  socialsFromWebsite,
  tiktokAds,
  tiktokVideos,
} from './sources.js';

export type SourceStatus = { ok: boolean; count: number; error?: string; skipped?: string; at: string; via?: 'server' | 'collector' };

/** The local collector (residential IP) owns a source while it has reported on it in the last 48 hours */
const collectorOwns = (st?: SourceStatus) => Boolean(st?.via === 'collector' && st.at && Date.now() - new Date(st.at).getTime() < 48 * 3600000);

const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T> =>
  Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error('Timed out')), ms))]);

const cleanHandle = (h?: string | null) => (h ? h.trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?(instagram|tiktok)\.com\/@?/i, '').replace(/[/?#].*$/, '') : null);

/** Fill in missing social accounts from the website and the Meta Ad Library. Saves what it finds. */
export async function resolveAccounts(comp: any) {
  const patch: Record<string, any> = {};
  const needSocial = !comp.instagram_username || !comp.tiktok_username || !comp.facebook_url || !comp.linkedin_url;
  if (needSocial && comp.website_url) {
    const s = await socialsFromWebsite(comp.website_url);
    if (!comp.instagram_username && s.instagram) patch.instagram_username = s.instagram;
    if (!comp.tiktok_username && s.tiktok) patch.tiktok_username = s.tiktok;
    if (!comp.facebook_url && s.facebook) patch.facebook_url = s.facebook;
    if (!comp.linkedin_url && s.linkedin) patch.linkedin_url = s.linkedin;
  }
  if (!comp.meta_page_id && providerConfigured()) {
    try {
      const page = await findMetaPage(comp.name, patch.instagram_username || comp.instagram_username);
      if (page) {
        patch.meta_page_id = page.page_id;
        if (!comp.instagram_username && !patch.instagram_username && page.ig_username) patch.instagram_username = page.ig_username;
        if (!comp.facebook_url && !patch.facebook_url) patch.facebook_url = page.page_alias ? `https://www.facebook.com/${page.page_alias}` : `https://www.facebook.com/${page.page_id}`;
        if (!comp.logo_url && page.image) patch.logo_url = page.image;
      }
    } catch (e: any) {
      console.warn('[Hunt] Meta page lookup failed:', e.message);
    }
  }
  if (Object.keys(patch).length) {
    await supabaseAdmin.from('competitors').update(patch).eq('id', comp.id);
    Object.assign(comp, patch);
  }
  return comp;
}

export async function syncCompetitorContent(userId: string, competitorId: string, budgetMs = 45000) {
  const { data: comp } = await supabaseAdmin.from('competitors').select('*').eq('id', competitorId).eq('user_id', userId).maybeSingle();
  if (!comp) throw new Error('Competitor not found');
  await resolveAccounts(comp);

  const now = new Date().toISOString();
  const provider = providerConfigured();
  const per = Math.max(10000, budgetMs - 8000);
  const jobs: { source: Source; run: () => Promise<ContentItem[]>; skip?: string }[] = [
    {
      source: 'meta_ads',
      run: () => (provider && comp.meta_page_id ? metaAds(comp.meta_page_id) : metaAdsOfficial(comp.name)),
      skip: !provider && !process.env.FACEBOOK_ACCESS_TOKEN ? 'No ads data provider configured' : undefined,
    },
    {
      source: 'instagram',
      run: async () => {
        if (provider) return instagramPosts(comp.instagram_username);
        const r = await instagramDiscovery(comp.instagram_username);
        if (r.profile?.picture && !comp.logo_url) await supabaseAdmin.from('competitors').update({ logo_url: r.profile.picture }).eq('id', comp.id);
        return r.items;
      },
      skip: !comp.instagram_username ? 'Add the Instagram handle' : !provider && !discoveryConfigured() ? 'No data source configured' : undefined,
    },
    { source: 'facebook', run: () => facebookPosts(comp.facebook_url), skip: !comp.facebook_url ? 'Add the Facebook page' : !provider ? 'No data provider configured' : undefined },
    { source: 'tiktok', run: () => tiktokVideos(comp.tiktok_username), skip: !comp.tiktok_username ? 'Add the TikTok handle' : !provider ? 'No data provider configured' : undefined },
    { source: 'tiktok_ads', run: () => tiktokAds(comp.name) },
    { source: 'linkedin_ads', run: () => linkedinAds(comp.name), skip: !provider ? 'No data provider configured' : undefined },
    {
      source: 'linkedin',
      run: async () => {
        const r = await linkedinPosts(comp.linkedin_url);
        if (r.logo && !comp.logo_url) await supabaseAdmin.from('competitors').update({ logo_url: r.logo }).eq('id', comp.id);
        return r.items;
      },
      skip: !comp.linkedin_url ? 'Add the LinkedIn company page' : !provider ? 'No data provider configured' : undefined,
    },
  ];

  const status: Record<string, SourceStatus> = { ...(comp.content_sync_status || {}) };
  const results = await Promise.all(
    jobs.map(async (j) => {
      // Leave sources the local collector is handling alone, unless a paid provider is set
      if (j.skip && collectorOwns(status[j.source])) return [] as ContentItem[];
      if (!provider && collectorOwns(status[j.source]) && j.source !== 'instagram') return [] as ContentItem[];
      if (j.skip) {
        status[j.source] = { ok: false, count: 0, skipped: j.skip, at: now };
        return [] as ContentItem[];
      }
      try {
        const items = await withTimeout(j.run(), per);
        status[j.source] = { ok: true, count: items.length, at: now, via: 'server' };
        return items;
      } catch (e: any) {
        status[j.source] = { ok: false, count: 0, error: String(e?.message || e).slice(0, 160), at: now };
        return [] as ContentItem[];
      }
    }),
  );

  const added = await saveContent(comp.id, userId, results.flat(), now);
  await supabaseAdmin.from('competitors').update({ content_synced_at: now, content_sync_status: status }).eq('id', comp.id);
  return { synced_at: now, status, added };
}

/** Upsert normalized items for one competitor. Shared by the server sync and the local collector. */
export async function saveContent(competitorId: string, userId: string, items: ContentItem[], now = new Date().toISOString()) {
  const rows = items.map((it) => ({
    competitor_id: competitorId,
    user_id: userId,
    platform: it.platform,
    kind: it.kind,
    source: it.source,
    external_id: it.external_id.slice(0, 300),
    url: it.url,
    caption: it.caption ? it.caption.slice(0, 4000) : null,
    headline: it.headline || null,
    cta: it.cta || null,
    link_url: it.link_url || null,
    media_type: it.media_type,
    thumbnail_url: it.thumbnail_url,
    media_url: it.media_url,
    carousel: it.carousel || [],
    aspect: it.aspect || null,
    placements: it.placements || [],
    is_active: it.is_active ?? null,
    started_at: it.started_at || null,
    ended_at: it.ended_at || null,
    posted_at: it.posted_at || null,
    metrics: it.metrics || {},
    fetched_at: now,
  }));

  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await supabaseAdmin.from('competitor_content').upsert(rows.slice(i, i + 200), { onConflict: 'competitor_id,source,external_id' });
    if (error) console.error('[Hunt] content upsert failed:', error.message);
  }
  return rows.length;
}

/** Merge per-source statuses without wiping what another worker reported */
export async function mergeStatus(competitorId: string, patch: Record<string, SourceStatus>) {
  const { data } = await supabaseAdmin.from('competitors').select('content_sync_status').eq('id', competitorId).maybeSingle();
  const next = { ...(data?.content_sync_status || {}), ...patch };
  await supabaseAdmin.from('competitors').update({ content_sync_status: next, content_synced_at: new Date().toISOString() }).eq('id', competitorId);
  return next;
}

// ─── Media proxy signing ───────────────────────────────────────────────────
// Instagram and Facebook images refuse to load on other sites, so thumbnails go
// through /api/v3/hunt/media. Only URLs this server signed can be proxied.
const MEDIA_HOSTS = /(^|\.)(fbcdn\.net|cdninstagram\.com|tiktokcdn\.com|tiktokcdn-us\.com|tiktokcdn-eu\.com|tiktokv\.com|ibyteimg\.com|byteimg\.com|ttwstatic\.com|licdn\.com|muscdn\.com)$/i;
const secret = () => process.env.ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'zieads-media';
export const signMedia = (u: string) => crypto.createHmac('sha256', secret()).update(u).digest('hex').slice(0, 32);
export const proxied = (u?: string | null) => {
  if (!u) return null;
  try {
    const host = new URL(u).hostname;
    if (!MEDIA_HOSTS.test(host)) return u;
  } catch {
    return null;
  }
  return `/api/v3/hunt/media?u=${encodeURIComponent(u)}&s=${signMedia(u)}`;
};
export const mediaAllowed = (u: string, s: string) => {
  try {
    const url = new URL(u);
    if (url.protocol !== 'https:' || !MEDIA_HOSTS.test(url.hostname)) return false;
  } catch {
    return false;
  }
  const want = signMedia(u);
  return s.length === want.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(want));
};
