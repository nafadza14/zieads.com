/*
  Analytics (spec 7.7): Organic, Paid and Combined for a window of days.
  Organic comes from account_insights_daily (followers, reach) and social_posts
  (per post engagement). Paid comes from ad_data. Nothing here is estimated:
  a metric a platform does not give us is null, and the UI says so.
*/
import { supabaseAdmin } from "../supabaseServer.js";
import { adsSummary } from "../ads/summary.js";

const DAY = 86400000;
const num = (v: any) => (v === null || v === undefined || v === "" ? 0 : Number(v) || 0);
const pct = (cur: number, prev: number) => (prev > 0 ? Math.round(((cur - prev) / prev) * 1000) / 10 : null);

export interface ShapedPost {
  id: string;
  platform: string;
  caption: string;
  format: string;
  posted_at: string;
  url: string | null;
  thumb: string | null;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number | null;
  views: number | null;
  interactions: number;
  engagement_rate: number | null;
}

export function shapePost(p: any): ShapedPost {
  const m = p.raw_metrics || {};
  const likes = num(m.likes ?? m.like_count);
  const comments = num(m.comments ?? m.comments_count);
  const shares = num(m.shares);
  const saves = num(m.saved ?? m.saves);
  const reach = m.reach !== undefined && m.reach !== null ? num(m.reach) : null;
  const viewsRaw = m.views ?? m.plays ?? m.video_views ?? m.impressions;
  const interactions = likes + comments + shares + saves;
  return {
    id: p.id,
    platform: p.platform,
    caption: String(p.content_text || "").slice(0, 220),
    format: String(m.media_product_type || p.media_type || "post").toLowerCase(),
    posted_at: p.posted_at,
    url: p.post_url || m.permalink || null,
    thumb: Array.isArray(p.media_urls) ? p.media_urls[0] || null : null,
    likes,
    comments,
    shares,
    saves,
    reach,
    views: viewsRaw !== undefined && viewsRaw !== null ? num(viewsRaw) : null,
    interactions,
    engagement_rate: reach ? Math.round((interactions / reach) * 10000) / 100 : null,
  };
}

export function dayList(days: number, now = Date.now()): string[] {
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i--) out.push(new Date(now - i * DAY).toISOString().slice(0, 10));
  return out;
}

/** Pure: build the organic report from rows, so it can be tested without a database */
export function buildOrganic(input: { days: number; now?: number; connections: any[]; insights: any[]; posts: any[] }) {
  const now = input.now ?? Date.now();
  const from = now - input.days * DAY;
  const prevFrom = from - input.days * DAY;
  const fromDay = new Date(from).toISOString().slice(0, 10);
  const shaped = input.posts.map(shapePost);
  const cur = shaped.filter((p) => new Date(p.posted_at).getTime() >= from);
  const prev = shaped.filter((p) => {
    const t = new Date(p.posted_at).getTime();
    return t >= prevFrom && t < from;
  });

  const platforms = [...new Set([...input.connections.map((c) => c.platform), ...cur.map((p) => p.platform)])].filter((p) => ["instagram", "facebook", "tiktok", "linkedin"].includes(p));
  const per_network = platforms.map((platform) => {
    const conn = input.connections.find((c) => c.platform === platform);
    const rows = input.insights.filter((r) => r.platform === platform).sort((a, b) => (a.snapshot_date < b.snapshot_date ? -1 : 1));
    const last = rows[rows.length - 1];
    const atFrom = [...rows].reverse().find((r) => r.snapshot_date <= fromDay) || rows[0];
    const inWindow = rows.filter((r) => r.snapshot_date > fromDay);
    const reachRows = inWindow.filter((r) => r.reach_daily !== null && r.reach_daily !== undefined);
    const posts = cur.filter((p) => p.platform === platform);
    const prevPosts = prev.filter((p) => p.platform === platform);
    const interactions = posts.reduce((s, p) => s + p.interactions, 0);
    const prevInteractions = prevPosts.reduce((s, p) => s + p.interactions, 0);
    const postReach = posts.filter((p) => p.reach !== null);
    const reach = reachRows.length ? reachRows.reduce((s, r) => s + num(r.reach_daily), 0) : postReach.length ? postReach.reduce((s, p) => s + (p.reach || 0), 0) : null;
    return {
      platform,
      handle: conn?.platform_username || null,
      status: conn?.status || (conn ? "live" : "not_connected"),
      last_synced_at: conn?.last_synced_at || null,
      followers: last ? num(last.followers_count) : null,
      followers_net: last && atFrom ? num(last.followers_count) - num(atFrom.followers_count) : null,
      reach,
      posts: posts.length,
      interactions,
      interactions_change_pct: pct(interactions, prevInteractions),
      engagement_rate: reach ? Math.round((interactions / reach) * 10000) / 100 : null,
    };
  });

  const known = (k: "followers" | "followers_net" | "reach") => {
    const vals = per_network.map((n) => n[k]).filter((v): v is number => v !== null);
    return vals.length ? vals.reduce((s, v) => s + v, 0) : null;
  };
  const totalInteractions = cur.reduce((s, p) => s + p.interactions, 0);
  const reach = known("reach");

  const days = dayList(input.days, now);
  const series = days.map((date) => {
    const followers = input.insights.filter((r) => r.snapshot_date === date && r.followers_count !== null);
    const dayPosts = cur.filter((p) => String(p.posted_at).slice(0, 10) === date);
    const reachRows = input.insights.filter((r) => r.snapshot_date === date && r.reach_daily !== null && r.reach_daily !== undefined);
    return {
      date,
      followers: followers.length ? followers.reduce((s, r) => s + num(r.followers_count), 0) : null,
      reach: reachRows.length ? reachRows.reduce((s, r) => s + num(r.reach_daily), 0) : null,
      interactions: dayPosts.reduce((s, p) => s + p.interactions, 0),
      posts: dayPosts.length,
    };
  });

  return {
    totals: {
      followers: known("followers"),
      followers_net: known("followers_net"),
      reach,
      interactions: totalInteractions,
      interactions_change_pct: pct(totalInteractions, prev.reduce((s, p) => s + p.interactions, 0)),
      posts: cur.length,
      posts_previous: prev.length,
      engagement_rate: reach ? Math.round((totalInteractions / reach) * 10000) / 100 : null,
    },
    per_network,
    series,
    posts: [...cur].sort((a, b) => b.interactions - a.interactions),
  };
}

export async function computeAnalytics(userId: string, days: number, platform?: string) {
  const now = Date.now();
  const since = new Date(now - 2 * days * DAY).toISOString();
  let postsQ = supabaseAdmin.from("social_posts").select("id, platform, content_text, media_type, posted_at, post_url, raw_metrics, media_urls").eq("user_id", userId).gte("posted_at", since).order("posted_at", { ascending: false }).limit(1000);
  let insQ = supabaseAdmin.from("account_insights_daily").select("platform, snapshot_date, followers_count, reach_daily").eq("user_id", userId).gte("snapshot_date", since.slice(0, 10)).order("snapshot_date", { ascending: true }).limit(5000);
  if (platform) {
    postsQ = postsQ.eq("platform", platform);
    insQ = insQ.eq("platform", platform);
  }
  const [conns, ins, posts, paid] = await Promise.all([
    supabaseAdmin.from("social_connections").select("platform, platform_username, status, last_synced_at").eq("user_id", userId).eq("is_active", true),
    insQ,
    postsQ,
    adsSummary(userId, days),
  ]);
  const connections = (conns.data || []).filter((c: any) => !platform || c.platform === platform);
  const organic = buildOrganic({ days, now, connections, insights: ins.data || [], posts: posts.data || [] });
  const t = paid.totals;
  return {
    days,
    window: { from: new Date(now - days * DAY).toISOString(), to: new Date(now).toISOString() },
    organic,
    paid,
    combined: {
      // Organic reach and paid impressions are different units; both are shown, never added together
      organic_reach: organic.totals.reach,
      paid_impressions: paid.has_data ? t.impressions : null,
      organic_interactions: organic.totals.interactions,
      paid_clicks: paid.has_data ? t.clicks : null,
      posts: organic.totals.posts,
      spend: paid.has_data ? t.spend : null,
      conversions: paid.has_data ? t.conversions : null,
      revenue: paid.has_data ? t.revenue : null,
      roas: paid.has_data && t.spend ? Math.round(t.roas * 100) / 100 : null,
    },
  };
}

const csvCell = (v: any) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function postsCsv(posts: ShapedPost[]): string {
  const head = ["posted_at", "platform", "format", "caption", "likes", "comments", "shares", "saves", "reach", "views", "interactions", "engagement_rate_pct", "url"];
  const lines = posts.map((p) => [p.posted_at, p.platform, p.format, p.caption, p.likes, p.comments, p.shares, p.saves, p.reach, p.views, p.interactions, p.engagement_rate, p.url].map(csvCell).join(","));
  return [head.join(","), ...lines].join("\n") + "\n";
}

export function dailyCsv(series: Array<Record<string, any>>, paidDaily: Array<Record<string, any>>): string {
  const paid = new Map(paidDaily.map((d) => [d.date, d]));
  const head = ["date", "followers", "reach", "interactions", "posts", "ad_spend", "ad_impressions", "ad_clicks", "ad_conversions", "ad_revenue"];
  const lines = series.map((d) => {
    const p: any = paid.get(d.date) || {};
    return [d.date, d.followers, d.reach, d.interactions, d.posts, p.spend, p.impressions, p.clicks, p.conversions, p.revenue].map(csvCell).join(",");
  });
  return [head.join(","), ...lines].join("\n") + "\n";
}
