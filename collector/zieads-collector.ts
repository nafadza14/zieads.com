/*
  ZieAds Collector: the free, self-hosted way to pull competitor content.

  Why it runs on your own computer: Meta, Instagram and TikTok block requests from
  cloud servers (Vercel runs on AWS) but serve normal pages to home and office
  internet connections. This script opens the public pages in a real Chrome window,
  logged out, reads the same data the page loads for any visitor, and saves it to
  Supabase. ZieAds then shows it in Competitor Hunt.

  Sources: Meta Ad Library (Facebook + Instagram ads), Instagram profile posts,
  TikTok profile videos, LinkedIn Ad Library.

  Run:   npm run collector            one pass over every competitor that is due
         npm run collector -- --loop  keep running, one pass every COLLECTOR_HOURS
  Needs: Google Chrome installed, and SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env
  Docs:  docs/competitor-hunt-live-content.md
*/
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { chromium, type BrowserContext, type Page } from 'playwright-core';
import { supabaseAdmin } from '../server/supabaseServer.js';
import { type ContentItem, mapInstagramItem, mapMetaAd, mapTikTokAweme, mapTikTokWebItem, normName } from '../server/competitors/sources.js';
import { mergeStatus, resolveAccounts, saveContent, type SourceStatus } from '../server/competitors/sync.js';

const HOURS = Number(process.env.COLLECTOR_HOURS) || 6;
const COUNTRY = (process.env.COLLECTOR_COUNTRY || 'ID').toUpperCase();
const HEADLESS = process.env.COLLECTOR_HEADLESS !== 'false';
const LOOP = process.argv.includes('--loop');
const ONLY = process.argv.find((a) => a.startsWith('--only='))?.split('=')[1];
const PROFILE_DIR = path.resolve(process.env.COLLECTOR_PROFILE_DIR || '.collector-profile');

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const jitter = (min: number, max: number) => sleep(min + Math.random() * (max - min));
const log = (...a: any[]) => console.log(new Date().toLocaleTimeString(), ...a);

// ─── helpers ───────────────────────────────────────────────────────────────
/** Walk any JSON and collect objects that match. Robust to Meta and TikTok reshuffling their payloads. */
function collect(root: any, match: (o: any) => boolean, out: any[] = [], seen = new Set<any>(), depth = 0): any[] {
  if (!root || typeof root !== 'object' || seen.has(root) || depth > 60) return out;
  seen.add(root);
  if (!Array.isArray(root) && match(root)) out.push(root);
  for (const v of Array.isArray(root) ? root : Object.values(root)) if (v && typeof v === 'object') collect(v, match, out, seen, depth + 1);
  return out;
}

/** Parse a response body that may hold several JSON documents (Meta streams them line by line, sometimes behind "for (;;);") */
function parseMany(text: string): any[] {
  const docs: any[] = [];
  const body = text.replace(/^for \(;;\);/, '');
  try {
    docs.push(JSON.parse(body));
    return docs;
  } catch {
    // fall through to line by line
  }
  for (const line of body.split('\n')) {
    const t = line.trim();
    if (!t.startsWith('{')) continue;
    try {
      docs.push(JSON.parse(t));
    } catch {
      // ignore partial chunk
    }
  }
  return docs;
}

/** Listen to every JSON response while a page loads and scrolls */
function sniff(page: Page, urlMatch: RegExp) {
  const docs: any[] = [];
  page.on('response', async (res) => {
    if (!urlMatch.test(res.url())) return;
    try {
      docs.push(...parseMany(await res.text()));
    } catch {
      // body not available (redirect or aborted)
    }
  });
  return docs;
}

async function inlineJson(page: Page): Promise<any[]> {
  const texts: string[] = await page.$$eval('script[type="application/json"]', (els) => els.map((e) => e.textContent || '')).catch(() => []);
  const rehydrate = await page.$eval('#__UNIVERSAL_DATA_FOR_REHYDRATION__', (e) => e.textContent || '').catch(() => '');
  if (rehydrate) texts.push(rehydrate);
  return texts.flatMap((t) => parseMany(t));
}

async function scroll(page: Page, times: number) {
  for (let i = 0; i < times; i++) {
    await page.mouse.wheel(0, 2400);
    await jitter(1800, 3200);
  }
}

// ─── Meta Ad Library ───────────────────────────────────────────────────────
async function metaAds(ctx: BrowserContext, comp: any): Promise<{ items: ContentItem[]; pageId?: string }> {
  const page = await ctx.newPage();
  const docs = sniff(page, /\/api\/graphql/);
  const base = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=${COUNTRY}&is_targeted_country=false&media_type=all`;
  const url = comp.meta_page_id ? `${base}&search_type=page&view_all_page_id=${comp.meta_page_id}` : `${base}&q=${encodeURIComponent(comp.name)}&search_type=keyword_unordered`;
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await jitter(4000, 6000);
    if (/login|checkpoint/.test(page.url())) throw new Error('Facebook asked for a login or check');
    await scroll(page, 4);
    const all = [...docs, ...(await inlineJson(page))];
    const raw = collect(all, (o) => typeof o.ad_archive_id !== 'undefined' && o.snapshot && typeof o.snapshot === 'object');
    const byId = new Map<string, any>();
    for (const ad of raw) byId.set(String(ad.ad_archive_id), ad);
    let ads = [...byId.values()];
    let pageId: string | undefined;
    if (!comp.meta_page_id) {
      // Keyword search returns other advertisers too: keep the brand's own page
      const want = normName(comp.name);
      const mine = ads.filter((a) => {
        const n = normName(a.snapshot?.page_name || a.page_name || '');
        return n && (n === want || n.includes(want) || want.includes(n));
      });
      const counts = new Map<string, number>();
      for (const a of mine) counts.set(String(a.page_id || a.snapshot?.page_id), (counts.get(String(a.page_id || a.snapshot?.page_id)) || 0) + 1);
      pageId = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
      ads = pageId ? mine.filter((a) => String(a.page_id || a.snapshot?.page_id) === pageId) : mine;
    }
    return { items: ads.map(mapMetaAd).filter(Boolean) as ContentItem[], pageId };
  } finally {
    await page.close();
  }
}

// ─── Instagram ─────────────────────────────────────────────────────────────
async function instagram(ctx: BrowserContext, handle: string): Promise<ContentItem[]> {
  const page = await ctx.newPage();
  const docs = sniff(page, /\/graphql\/query|\/api\/v1\//);
  try {
    await page.goto(`https://www.instagram.com/${handle}/`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await jitter(4000, 6000);
    if (/accounts\/login|challenge/.test(page.url())) throw new Error('Instagram asked for a login, try again later');
    await scroll(page, 2);
    const all = [...docs, ...(await inlineJson(page))];
    const raw = collect(all, (o) => typeof o.code === 'string' && (typeof o.taken_at === 'number' || typeof o.taken_at === 'string') && (o.image_versions2 || o.carousel_media || o.video_versions));
    const owner = handle.toLowerCase();
    const byCode = new Map<string, any>();
    for (const m of raw) {
      const u = (m.user?.username || m.owner?.username || owner).toLowerCase();
      if (u === owner) byCode.set(m.code, m);
    }
    return [...byCode.values()].map((m) => mapInstagramItem({ ...m, url: `https://www.instagram.com/p/${m.code}/` }));
  } finally {
    await page.close();
  }
}

// ─── TikTok ────────────────────────────────────────────────────────────────
async function tiktok(ctx: BrowserContext, handle: string): Promise<ContentItem[]> {
  const page = await ctx.newPage();
  const docs = sniff(page, /\/api\/post\/item_list|\/api\/creator\/item_list|\/api\/user\/detail/);
  try {
    await page.goto(`https://www.tiktok.com/@${handle}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await jitter(5000, 7000);
    await scroll(page, 2);
    const all = [...docs, ...(await inlineJson(page))];
    const web = collect(all, (o) => typeof o.id === 'string' && o.createTime && o.video && typeof o.video === 'object');
    const app = collect(all, (o) => typeof o.aweme_id === 'string' && o.video);
    const byId = new Map<string, ContentItem>();
    for (const v of web) byId.set(v.id, mapTikTokWebItem(v, handle));
    for (const v of app) if (!byId.has(v.aweme_id)) byId.set(v.aweme_id, mapTikTokAweme(v, handle));
    if (!byId.size && /captcha|verify/i.test(await page.content())) throw new Error('TikTok showed a captcha, try again later');
    return [...byId.values()];
  } finally {
    await page.close();
  }
}

// ─── LinkedIn Ad Library ───────────────────────────────────────────────────
async function linkedinAds(ctx: BrowserContext, name: string): Promise<ContentItem[]> {
  const page = await ctx.newPage();
  try {
    await page.goto(`https://www.linkedin.com/ad-library/search?accountOwner=${encodeURIComponent(name)}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await jitter(3000, 5000);
    await scroll(page, 2);
    // Read cards by their link to the ad detail page, so class name changes do not break it
    const cards = await page.$$eval('a[href*="/ad-library/detail/"]', (links) => {
      const out: Record<string, any> = {};
      for (const a of links as HTMLAnchorElement[]) {
        const id = a.href.match(/detail\/(\d+)/)?.[1];
        if (!id || out[id]) continue;
        let card: HTMLElement | null = a;
        for (let i = 0; i < 8 && card; i++) {
          if (card.querySelector('img') && (card.innerText || '').trim().length > 30) break;
          card = card.parentElement;
        }
        if (!card) continue;
        const imgs = [...card.querySelectorAll('img')] as HTMLImageElement[];
        const big = imgs.sort((x, y) => y.naturalWidth * y.naturalHeight - x.naturalWidth * x.naturalHeight)[0];
        const video = card.querySelector('video') as HTMLVideoElement | null;
        const lines = (card.innerText || '').split('\n').map((l) => l.trim()).filter(Boolean);
        out[id] = { id, lines, image: big && big.naturalWidth > 120 ? big.src : null, poster: video?.poster || null, video: video?.src || null };
      }
      return Object.values(out);
    });
    const want = normName(name);
    return (cards as any[])
      .filter((c) => c.lines.some((l: string) => normName(l).includes(want)))
      .map((c): ContentItem => {
        const text = c.lines.filter((l: string) => !/^(promoted|view details|ad details|sponsored)$/i.test(l) && !normName(l).startsWith(want));
        return {
          platform: 'linkedin',
          kind: 'ad',
          source: 'linkedin_ads',
          external_id: c.id,
          url: `https://www.linkedin.com/ad-library/detail/${c.id}`,
          caption: text.slice(0, 3).join('\n') || null,
          headline: text[3] || null,
          media_type: c.video ? 'video' : c.image || c.poster ? 'image' : 'text',
          thumbnail_url: c.image || c.poster || null,
          media_url: null,
          aspect: '1:1',
          metrics: {},
        };
      });
  } finally {
    await page.close();
  }
}

// ─── main ──────────────────────────────────────────────────────────────────
function findChrome(): string | undefined {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    `${process.env.LOCALAPPDATA || ''}\\Google\\Chrome\\Application\\chrome.exe`,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ];
  return candidates.find((p) => p && fs.existsSync(p));
}

const fresh = (st?: SourceStatus) => Boolean(st?.via === 'collector' && st.ok && Date.now() - new Date(st.at).getTime() < HOURS * 3600000);

async function runOnce() {
  let q = supabaseAdmin.from('competitors').select('*').order('content_synced_at', { ascending: true, nullsFirst: true });
  if (ONLY) q = q.eq('id', ONLY);
  const { data: comps, error } = await q;
  if (error) throw new Error(`Supabase: ${error.message}`);
  const due = (comps || []).filter((c) => ONLY || !['meta_ads', 'instagram', 'tiktok', 'linkedin_ads'].every((s) => fresh(c.content_sync_status?.[s])));
  log(`${due.length} of ${comps?.length || 0} competitors due`);
  if (!due.length) return;

  const executablePath = findChrome();
  if (!executablePath) throw new Error('Google Chrome not found. Install Chrome or set CHROME_PATH in .env');
  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, {
    executablePath,
    headless: HEADLESS,
    viewport: { width: 1366, height: 900 },
    locale: 'en-US',
    args: ['--disable-blink-features=AutomationControlled', '--disable-dev-shm-usage'],
  });
  try {
    for (const comp of due) {
      log(`> ${comp.name}`);
      await resolveAccounts(comp).catch(() => null);
      const status: Record<string, SourceStatus> = {};
      const run = async (source: string, fn: () => Promise<ContentItem[]>) => {
        const at = new Date().toISOString();
        try {
          const items = await fn();
          const saved = await saveContent(comp.id, comp.user_id, items, at);
          status[source] = { ok: true, count: saved, at, via: 'collector' };
          log(`  ${source}: ${saved}`);
        } catch (e: any) {
          status[source] = { ok: false, count: 0, error: String(e?.message || e).slice(0, 160), at, via: 'collector' };
          log(`  ${source}: failed, ${status[source].error}`);
        }
        await jitter(3000, 7000);
      };

      await run('meta_ads', async () => {
        const r = await metaAds(ctx, comp);
        if (r.pageId && !comp.meta_page_id) {
          comp.meta_page_id = r.pageId;
          await supabaseAdmin.from('competitors').update({ meta_page_id: r.pageId }).eq('id', comp.id);
        }
        return r.items;
      });
      if (comp.instagram_username) await run('instagram', () => instagram(ctx, comp.instagram_username));
      if (comp.tiktok_username) await run('tiktok', () => tiktok(ctx, comp.tiktok_username));
      await run('linkedin_ads', () => linkedinAds(ctx, comp.name));
      await mergeStatus(comp.id, status);
      await jitter(5000, 10000);
    }
  } finally {
    await ctx.close();
  }
}

async function main() {
  log(`ZieAds Collector, country ${COUNTRY}, every ${HOURS}h${LOOP ? ', loop mode' : ''}`);
  do {
    try {
      await runOnce();
    } catch (e: any) {
      log('Run failed:', e.message);
    }
    if (LOOP) {
      log(`Sleeping ${HOURS}h`);
      await sleep(HOURS * 3600000);
    }
  } while (LOOP);
}

export { collect, parseMany, metaAds, instagram, tiktok, linkedinAds };

// Run only when started directly (npm run collector), not when imported by tests
if (/zieads-collector\.(ts|js)$/.test(process.argv[1] || '')) main().then(() => process.exit(0));
