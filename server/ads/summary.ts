/* Paid totals for a window, from ad_data (CSV imports today, read-only APIs later). Used by Analytics and the Ads Analyst. */
import { supabaseAdmin } from "../supabaseServer.js";
import { ADS_PLATFORMS, summarize } from "./csvImport.js";

export async function adsSummary(userId: string, days: number) {
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const prevSince = new Date(Date.now() - 2 * days * 86400000).toISOString().slice(0, 10);
  const { data } = await supabaseAdmin.from("ad_data").select("*").eq("user_id", userId).gte("date_range_start", prevSince).limit(20000);
  const rows = data || [];
  const cur = rows.filter((r: any) => r.date_range_start >= since);
  const prev = rows.filter((r: any) => r.date_range_start < since);
  const byPlatform: Record<string, any> = {};
  for (const p of ADS_PLATFORMS) {
    const pr = cur.filter((r: any) => r.platform === p);
    if (pr.length) byPlatform[p] = summarize(pr);
  }
  const campaigns: Record<string, any[]> = {};
  for (const r of cur) (campaigns[`${r.platform}:${r.campaign_name}`] ||= []).push(r);
  const topCampaigns = Object.entries(campaigns)
    .map(([k, list]) => ({ platform: k.split(":")[0], campaign: k.split(":").slice(1).join(":"), ...summarize(list as any) }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 10);
  const daily: Record<string, any> = {};
  for (const r of cur) {
    const d = (daily[r.date_range_start] ||= { date: r.date_range_start, spend: 0, revenue: 0, clicks: 0, impressions: 0, conversions: 0 });
    d.spend += Number(r.spend_usd || 0);
    d.revenue += Number(r.revenue_usd || 0);
    d.clicks += Number(r.clicks || 0);
    d.impressions += Number(r.impressions || 0);
    d.conversions += Number(r.conversions || 0);
  }
  return {
    days,
    has_data: cur.length > 0,
    source: cur.some((r: any) => r.data_source === "api") ? "api" : cur.length ? "csv_import" : null,
    totals: summarize(cur),
    previous: summarize(prev),
    by_platform: byPlatform,
    top_campaigns: topCampaigns,
    daily: Object.values(daily).sort((a: any, b: any) => (a.date < b.date ? -1 : 1)),
  };
}
