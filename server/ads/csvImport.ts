/*
  Manual ads import (spec P0-4): the fallback path while read-only API access to
  Meta, Google and TikTok Ads is in review. One clear template, exports from each
  Ads Manager are accepted through header aliases. Pure, tested in tests/adsCsv.test.ts.
*/
import { parseCsv } from "../publish/bulkCsv.js";

export type AdsPlatform = "meta_ads" | "google_ads" | "tiktok_ads";
export const ADS_PLATFORMS: AdsPlatform[] = ["meta_ads", "google_ads", "tiktok_ads"];

export const ADS_TEMPLATE_HEADER = ["date", "campaign", "ad_set", "ad", "spend", "impressions", "clicks", "conversions", "revenue", "currency"];
export const ADS_TEMPLATE =
  ADS_TEMPLATE_HEADER.join(",") +
  "\n2026-11-01,Serum launch,Women 18-34,Video A,152.40,48210,912,37,1480.00,USD\n2026-11-02,Serum launch,Women 18-34,Video A,149.10,46990,860,33,1312.50,USD\n";

/** Column names used by Meta Ads Manager, Google Ads and TikTok Ads Manager exports */
const ALIASES: Record<string, string[]> = {
  date: ["date", "day", "reporting starts", "reporting_starts", "date_start", "stat time day", "stat_time_day"],
  campaign: ["campaign", "campaign name", "campaign_name"],
  ad_set: ["ad_set", "ad set", "ad set name", "ad_set_name", "ad group", "ad group name", "ad_group"],
  ad: ["ad", "ad name", "ad_name"],
  spend: ["spend", "amount spent", "amount spent (usd)", "amount spent usd", "cost", "total cost"],
  impressions: ["impressions", "impr.", "impr"],
  clicks: ["clicks", "link clicks", "clicks (all)", "clicks (destination)"],
  conversions: ["conversions", "results", "purchases", "conv.", "total conversions"],
  revenue: ["revenue", "conv. value", "conversion value", "purchase conversion value", "total purchase value", "total conversion value", "value"],
  currency: ["currency"],
};

export interface AdsRow {
  line: number;
  date: string;
  campaign: string;
  ad_set?: string;
  ad?: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  currency?: string;
}

const norm = (h: string) => h.trim().toLowerCase().replace(/\s+/g, " ");

export function num(v: string | undefined): number | null {
  if (v === undefined) return 0;
  let s = String(v).trim().replace(/[^\d.,-]/g, "");
  if (!s) return 0;
  // 1.234,56 (Indonesian or European) vs 1,234.56
  if (/,\d{1,2}$/.test(s) && s.includes(".")) s = s.replace(/\./g, "").replace(",", ".");
  else if (/,\d{1,2}$/.test(s)) s = s.replace(",", ".");
  else s = s.replace(/,/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function toIsoDate(v: string): string | null {
  const s = v.trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s); // DD/MM/YYYY
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return null;
}

export function parseAdsCsv(text: string): { rows: AdsRow[]; errors: Array<{ line: number; message: string }>; mapped: Record<string, string> } {
  const table = parseCsv(text);
  const errors: Array<{ line: number; message: string }> = [];
  if (!table.length) return { rows: [], errors: [{ line: 1, message: "The file is empty" }], mapped: {} };
  const header = table[0].map(norm);
  const col: Record<string, number> = {};
  const mapped: Record<string, string> = {};
  for (const [key, names] of Object.entries(ALIASES)) {
    const i = header.findIndex((h) => names.includes(h));
    if (i >= 0) {
      col[key] = i;
      mapped[key] = table[0][i].trim();
    }
  }
  for (const k of ["date", "campaign", "spend"]) if (col[k] === undefined) errors.push({ line: 1, message: `Missing a ${k} column. Download the template to see the format.` });
  if (errors.length) return { rows: [], errors, mapped };
  const rows: AdsRow[] = [];
  table.slice(1, 10001).forEach((r, i) => {
    const line = i + 2;
    const get = (k: string) => (col[k] === undefined ? undefined : (r[col[k]] ?? "").trim());
    const date = toIsoDate(get("date") || "");
    if (!date) return errors.push({ line, message: "Date must be YYYY-MM-DD" });
    const campaign = get("campaign");
    if (!campaign) return errors.push({ line, message: "Campaign name is empty" });
    if (/^total/i.test(campaign)) return; // summary rows in exports
    const values: Record<string, number | null> = {};
    for (const k of ["spend", "impressions", "clicks", "conversions", "revenue"]) values[k] = num(get(k));
    const bad = Object.entries(values).find(([, v]) => v === null || (v as number) < 0);
    if (bad) return errors.push({ line, message: `${bad[0]} is not a valid number` });
    rows.push({
      line,
      date,
      campaign,
      ad_set: get("ad_set") || undefined,
      ad: get("ad") || undefined,
      spend: values.spend!,
      impressions: Math.round(values.impressions!),
      clicks: Math.round(values.clicks!),
      conversions: values.conversions!,
      revenue: values.revenue!,
      currency: get("currency") || undefined,
    });
  });
  return { rows, errors, mapped };
}

export interface AdsSummary {
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number;
  cpc: number;
  cpa: number;
  roas: number;
}

export function summarize(rows: Array<{ spend_usd?: number; spend?: number; impressions: number; clicks: number; conversions: number; revenue_usd?: number; revenue?: number }>): AdsSummary {
  type T = { spend: number; impressions: number; clicks: number; conversions: number; revenue: number };
  const t = rows.reduce<T>(
    (a: T, r) => ({
      spend: a.spend + Number(r.spend_usd ?? r.spend ?? 0),
      impressions: a.impressions + Number(r.impressions || 0),
      clicks: a.clicks + Number(r.clicks || 0),
      conversions: a.conversions + Number(r.conversions || 0),
      revenue: a.revenue + Number(r.revenue_usd ?? r.revenue ?? 0),
    }),
    { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 }
  );
  const div = (a: number, b: number) => (b > 0 ? a / b : 0);
  return { ...t, ctr: div(t.clicks, t.impressions), cpc: div(t.spend, t.clicks), cpa: div(t.spend, t.conversions), roas: div(t.revenue, t.spend) };
}
