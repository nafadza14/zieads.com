/*
  Ads data, one path (spec P0-4). Mounted at /api/v3 before the older router.
  GET  /ads/status           per platform: API connection state and imported data range
  GET  /ads/template         the CSV template (Manual import)
  POST /ads/import           { platform, csv, dry_run? } -> rows in ad_data (data_source csv_import)
  GET  /ads/summary          totals for the last N days, used by Analytics (Paid) and the Ads Analyst
  POST /ads/imports/:id/delete  remove one import
*/
import { Router } from "express";
import crypto from "crypto";
import { getUserIdFromRequest, supabaseAdmin } from "../supabaseServer.js";
import { ADS_PLATFORMS, ADS_TEMPLATE, parseAdsCsv, summarize, AdsPlatform } from "../ads/csvImport.js";
import { logActivity } from "../activity.js";
import { adsSummary } from "../ads/summary.js";

export const adsRouter = Router();

async function requireAuth(req: any, res: any, next: any) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
}

adsRouter.get("/ads/template", (_req, res) => {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="zieads-ads-import-template.csv"');
  res.send(ADS_TEMPLATE);
});

adsRouter.get("/ads/status", requireAuth, async (req: any, res) => {
  const { data } = await supabaseAdmin.from("ad_data").select("platform, date_range_start, import_id, uploaded_at").eq("user_id", req.userId).order("date_range_start", { ascending: true }).limit(20000);
  const out: Record<string, any> = {};
  for (const p of ADS_PLATFORMS) {
    const rows = (data || []).filter((r: any) => r.platform === p);
    out[p] = {
      // Read-only API access is in review with each platform (spec 9.1 batch D, 9.4, 9.2)
      api: "awaiting_approval",
      imported_rows: rows.length,
      first_date: rows[0]?.date_range_start || null,
      last_date: rows[rows.length - 1]?.date_range_start || null,
      last_import_at: rows.reduce((m: string | null, r: any) => (!m || r.uploaded_at > m ? r.uploaded_at : m), null),
      imports: [...new Set(rows.map((r: any) => r.import_id).filter(Boolean))].length,
    };
  }
  res.json({ success: true, platforms: out });
});

adsRouter.post("/ads/import", requireAuth, async (req: any, res) => {
  const platform = String(req.body?.platform || "") as AdsPlatform;
  if (!ADS_PLATFORMS.includes(platform)) return res.status(400).json({ error: "Pick Meta Ads, Google Ads or TikTok Ads" });
  const csv = String(req.body?.csv || "");
  if (csv.length > 4_000_000) return res.status(413).json({ error: "The file is larger than 4 MB. Export a shorter date range." });
  const parsed = parseAdsCsv(csv);
  if (!parsed.rows.length) return res.status(400).json({ error: parsed.errors[0]?.message || "No valid rows", errors: parsed.errors.slice(0, 50), mapped: parsed.mapped });
  if (req.body?.dry_run) return res.json({ success: true, preview: parsed.rows.slice(0, 5), count: parsed.rows.length, errors: parsed.errors.slice(0, 50), mapped: parsed.mapped, totals: summarize(parsed.rows) });

  const importId = crypto.randomUUID();
  const uploadedAt = new Date().toISOString();
  // Re-importing the same days replaces them, so nothing is counted twice
  const dates = [...new Set(parsed.rows.map((r) => r.date))];
  await supabaseAdmin.from("ad_data").delete().eq("user_id", req.userId).eq("platform", platform).eq("data_source", "csv_import").in("date_range_start", dates);
  const payload = parsed.rows.map((r) => ({
    user_id: req.userId,
    platform,
    campaign_id: crypto.createHash("md5").update(`${platform}:${r.campaign}`).digest("hex").slice(0, 16),
    campaign_name: r.campaign,
    ad_set_name: r.ad_set || null,
    ad_name: r.ad || null,
    date_range_start: r.date,
    date_range_end: r.date,
    impressions: r.impressions,
    clicks: r.clicks,
    spend_usd: r.spend,
    conversions: Math.round(r.conversions),
    revenue_usd: r.revenue,
    ctr: r.impressions ? r.clicks / r.impressions : 0,
    cpc: r.clicks ? r.spend / r.clicks : 0,
    cpm: r.impressions ? (r.spend / r.impressions) * 1000 : 0,
    roas: r.spend ? r.revenue / r.spend : 0,
    currency: r.currency || null,
    data_source: "csv_import",
    import_id: importId,
    uploaded_at: uploadedAt,
  }));
  for (let i = 0; i < payload.length; i += 500) {
    const { error } = await supabaseAdmin.from("ad_data").insert(payload.slice(i, i + 500));
    if (error) return res.status(500).json({ error: error.message });
  }
  await logActivity(req.userId, "user", "ads.imported", "ad_import", importId, { platform, rows: payload.length });
  res.json({ success: true, import_id: importId, count: payload.length, errors: parsed.errors.slice(0, 50), totals: summarize(parsed.rows) });
});

adsRouter.get("/ads/summary", requireAuth, async (req: any, res) => {
  const days = Math.min(365, Math.max(1, Number(req.query.days) || 30));
  res.json({ success: true, ...(await adsSummary(req.userId, days)) });
});

adsRouter.post("/ads/imports/:id/delete", requireAuth, async (req: any, res) => {
  const { error, count } = await supabaseAdmin.from("ad_data").delete({ count: "exact" }).eq("user_id", req.userId).eq("import_id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  await logActivity(req.userId, "user", "ads.import_deleted", "ad_import", req.params.id, { rows: count });
  res.json({ success: true, deleted: count });
});
