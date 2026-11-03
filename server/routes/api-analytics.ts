/*
  Analytics (spec 7.7). Mounted at /api/v3.
  GET /analytics/report?days=7|30|90|365&platform=     Organic, Paid and Combined
  GET /analytics/export.csv?days&platform&kind=posts|daily
  History beyond the plan's analyticsHistoryDays answers 403 PLAN_LIMIT.
*/
import { Router } from "express";
import { getUserIdFromRequest, getEffectivePlan } from "../supabaseServer.js";
import { PLAN_LIMITS } from "../creditConfig.js";
import { computeAnalytics, dailyCsv, postsCsv } from "../analytics/report.js";

export const analyticsRouter = Router();

async function requireAuth(req: any, res: any, next: any) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
}

export const RANGES = [7, 30, 90, 365];

async function window(req: any, res: any): Promise<{ days: number; platform?: string; maxDays: number } | null> {
  const days = Number(req.query.days || 30);
  if (!RANGES.includes(days)) {
    res.status(400).json({ error: "days must be 7, 30, 90 or 365" });
    return null;
  }
  const plan = await getEffectivePlan(req.userId);
  const maxDays = PLAN_LIMITS[plan].analyticsHistoryDays;
  if (maxDays !== -1 && days > maxDays) {
    res.status(403).json({ error: "PLAN_LIMIT", message: `Your plan shows the last ${maxDays} days. Upgrade to see longer history.`, max_days: maxDays });
    return null;
  }
  const platform = req.query.platform ? String(req.query.platform) : undefined;
  if (platform && !["instagram", "facebook", "tiktok", "linkedin"].includes(platform)) {
    res.status(400).json({ error: "Unknown platform" });
    return null;
  }
  return { days, platform, maxDays };
}

analyticsRouter.get("/analytics/report", requireAuth, async (req: any, res) => {
  const w = await window(req, res);
  if (!w) return;
  try {
    res.json({ success: true, max_days: w.maxDays, ...(await computeAnalytics(req.userId, w.days, w.platform)) });
  } catch (e: any) {
    console.error("[analytics] report failed:", e);
    res.status(500).json({ error: "The report could not be built right now." });
  }
});

analyticsRouter.get("/analytics/export.csv", requireAuth, async (req: any, res) => {
  const w = await window(req, res);
  if (!w) return;
  const r = await computeAnalytics(req.userId, w.days, w.platform);
  const kind = req.query.kind === "daily" ? "daily" : "posts";
  const body = kind === "daily" ? dailyCsv(r.organic.series, r.paid.daily as any[]) : postsCsv(r.organic.posts);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="zieads-${kind}-${w.platform || "all"}-${w.days}d.csv"`);
  res.send(body);
});
