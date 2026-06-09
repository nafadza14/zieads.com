import "dotenv/config";
import express from "express";
import { scrapeUrl } from "./scraper.js";
import {
  runFullAudit,
  runQuickScan,
  runAgent,
  type BusinessContext,
} from "./agents.js";
import { synthesizeReport } from "./scorer.js";
import {
  getUserIdFromRequest,
  saveAudit,
  saveSkillResult,
  upsertProfile,
  getProfile,
  getUserAudits,
  getLatestAudit,
  getUserSkillResults,
  getBenchmarkAverages,
} from "./supabaseServer.js";
import { publicApiRouter } from "./routes/api-public.js";
import { adsLibraryRouter } from "./routes/api-ads-library.js";
import { agentRouter } from "./routes/api-agent.js";
import { creditsRouter } from "./routes/api-credits.js";
import { SKILL_ROUTE_TO_OPERATION, OPERATION_COSTS } from "./creditConfig.js";
import { supabaseAdmin } from "./supabaseServer.js";

const app = express();
app.use(express.json());

// ─── Enrich BusinessContext from saved profile ─────────────
async function enrichContextFromProfile(
  userId: string | null,
  partial: { businessName: string; businessType: string; primaryGoal: string; monthlyBudget: string; platforms: string[] }
) {
  if (!userId) return partial;
  const profile = await getProfile(userId);
  if (!profile) return partial;
  return {
    businessName: partial.businessName || profile.business_name || '',
    businessType: partial.businessType || profile.business_type || '',
    primaryGoal: partial.primaryGoal !== 'Generate leads' ? partial.primaryGoal : (profile.primary_goal || 'Generate leads'),
    monthlyBudget: partial.monthlyBudget !== 'Not specified' ? partial.monthlyBudget : (profile.monthly_budget || 'Not specified'),
    platforms: partial.platforms.length > 0 ? partial.platforms : (profile.platforms || []),
  };
}

// ─── CORS ─────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// ─── Public Webhook API ────────────────────────────────
app.use("/v1", publicApiRouter);

// ─── Credits API ───────────────────────────────────────
app.use("/api/v1/credits", creditsRouter);

// ─── Ads Library (Meta Ads Library proxy) ─────────────
app.use("/api/ads-library", adsLibraryRouter);

// ─── AI Agent Chat ─────────────────────────────────────
app.use("/api/agent", agentRouter);

// ─── Health Check ──────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ─── Benchmarks ────────────────────────────────────────
app.get("/api/benchmarks", async (req, res) => {
  try {
    const insights = await getBenchmarkAverages();
    res.json({ success: true, data: insights });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Public Embed Badge ────────────────────────────────
app.get("/api/badge/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const latestAudit = await getLatestAudit(userId);
    const score = latestAudit ? latestAudit.overall_score : 0;
    const P = '#7B2FBE';

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" rx="8" viewBox="0 0 200 60">
      <rect width="200" height="60" fill="#f8fafc" rx="8" stroke="#e2e8f0" stroke-width="2"/>
      <circle cx="30" cy="30" r="18" fill="none" stroke="${P}" stroke-width="4"/>
      <text x="30" y="35" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="${P}" text-anchor="middle">${score}</text>
      <text x="64" y="26" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#1e293b">Verified Score</text>
      <text x="64" y="42" font-family="Arial, sans-serif" font-size="10" fill="#64748b">by ZieAds</text>
    </svg>`;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  } catch (err: any) {
    res.status(500).send('<svg></svg>');
  }
});

// ─── Profile (upsert from onboarding) ──────────────────
app.post("/api/profile", async (req, res) => {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    await upsertProfile(userId, req.body);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/profile", async (req, res) => {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const profile = await getProfile(userId);
  res.json({ success: true, data: profile });
});

// ─── Quick Scan ─────────────────────────────────────────
app.post("/api/quick-scan", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  const userId = await getUserIdFromRequest(req);

  try {
    const scrapedData = await scrapeUrl(url);
    const context: BusinessContext = {
      url,
      businessName: scrapedData.title,
      businessType: scrapedData.inferredBusinessType,
      primaryGoal: "Not specified",
      monthlyBudget: "Not specified",
      platforms: [],
      scrapedData,
    };

    const result = await runQuickScan(context);
    const responseData = {
      url,
      businessName: scrapedData.title || new URL(url).hostname,
      businessType: scrapedData.inferredBusinessType,
      ...result,
    };

    if (userId) {
      await saveAudit({
        userId,
        url,
        businessName: responseData.businessName,
        auditType: "quick",
        overallScore: result.score,
        grade: result.score >= 80 ? "A" : result.score >= 65 ? "B" : result.score >= 50 ? "C" : result.score >= 35 ? "D" : "F",
        dimensions: {},
        findings: result.findings,
        agentResults: [],
        report: { signals: result.signals },
      });
    }

    res.json({ success: true, data: responseData });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Full Audit ──────────────────────────────────────────
app.post("/api/audit", async (req, res) => {
  const { url, businessName, businessType, primaryGoal, monthlyBudget, platforms } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  const userId = await getUserIdFromRequest(req);

  // Credit pre-flight check
  if (userId) {
    const [planRes, creditsRes] = await Promise.all([
      supabaseAdmin.from('user_plan').select('plan_id').eq('user_id', userId).single(),
      supabaseAdmin.from('user_credits').select('skill_run_monthly_remaining').eq('user_id', userId).single(),
    ]);
    const remaining = creditsRes.data?.skill_run_monthly_remaining ?? 0;
    if (remaining !== -1 && remaining < 3) {
      return res.status(402).json({ error: 'INSUFFICIENT_CREDITS', message: 'Not enough skill credits. Full audit costs 3 credits.', upgrade_url: '/pricing' });
    }
  }

  try {
    const scrapedData = await scrapeUrl(url);
    const enriched = await enrichContextFromProfile(userId, {
      businessName: businessName || scrapedData.title || new URL(url).hostname,
      businessType: businessType || scrapedData.inferredBusinessType,
      primaryGoal: primaryGoal || "Generate leads",
      monthlyBudget: monthlyBudget || "Not specified",
      platforms: platforms || [],
    });
    const context: BusinessContext = { url, ...enriched, scrapedData };

    const agentResults = await runFullAudit(context);
    const report = synthesizeReport(agentResults);

    if (userId) {
      await saveAudit({
        userId,
        url,
        businessName: context.businessName,
        auditType: "full",
        overallScore: report.overall,
        grade: report.grade,
        dimensions: report.dimensions || {},
        findings: report.findings || [],
        agentResults,
        report,
      });
    }

    res.json({ success: true, data: { url, businessName: context.businessName, businessType: context.businessType, report, agentResults, generatedAt: new Date().toISOString() } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Individual Skill ────────────────────────────────────
app.post("/api/skill/:name", async (req, res) => {
  const { name } = req.params;
  const { url, businessName, businessType, primaryGoal, monthlyBudget, platforms } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  const userId = await getUserIdFromRequest(req);

  // Credit pre-flight check
  if (userId) {
    const operationId = SKILL_ROUTE_TO_OPERATION[name] || `skill_ads_${name}`;
    const op = OPERATION_COSTS[operationId];
    const cost = op?.cost ?? 2;
    const [planRes, creditsRes] = await Promise.all([
      supabaseAdmin.from('user_plan').select('plan_id').eq('user_id', userId).single(),
      supabaseAdmin.from('user_credits').select('skill_run_monthly_remaining').eq('user_id', userId).single(),
    ]);
    const remaining = creditsRes.data?.skill_run_monthly_remaining ?? 0;
    if (remaining !== -1 && remaining < cost) {
      return res.status(402).json({ error: 'INSUFFICIENT_CREDITS', message: `Not enough skill credits. This skill costs ${cost} credits.`, upgrade_url: '/pricing' });
    }
  }

  try {
    const scrapedData = await scrapeUrl(url);
    const enriched = await enrichContextFromProfile(userId, {
      businessName: businessName || scrapedData.title || new URL(url).hostname,
      businessType: businessType || scrapedData.inferredBusinessType,
      primaryGoal: primaryGoal || "Generate leads",
      monthlyBudget: monthlyBudget || "Not specified",
      platforms: platforms || [],
    });
    const context: BusinessContext = { url, ...enriched, scrapedData };

    const result = await runAgent(name, context);

    if (userId) {
      await saveSkillResult({ userId, skillName: name, url, result });
      const score = result.score || 100;
      const grade = score >= 80 ? 'A' : score >= 60 ? 'B' : 'C';
      
      await saveAudit({
        userId,
        url,
        businessName: context.businessName,
        auditType: name,
        overallScore: score,
        grade: grade,
        dimensions: { [name]: result },
        findings: result.findings || [],
        agentResults: [result],
        report: { ...result, overall: score, grade },
      });
    }

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Data Access ─────────────────────────────────────────
app.get("/api/audits", async (req, res) => {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const audits = await getUserAudits(userId);
  res.json({ success: true, data: audits });
});

app.get("/api/audits/latest", async (req, res) => {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const audit = await getLatestAudit(userId);
  res.json({ success: true, data: audit });
});

app.get("/api/skill-results", async (req, res) => {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const results = await getUserSkillResults(userId);
  res.json({ success: true, data: results });
});

app.post("/api/scrape-context", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });
  try {
    const scrapedData = await scrapeUrl(url);
    res.json({ success: true, data: { title: scrapedData.title, businessType: scrapedData.inferredBusinessType, heroOffer: scrapedData.heroOffer, primaryCTA: scrapedData.primaryCTA, detectedPixels: scrapedData.detectedPixels, h1: scrapedData.h1 } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default app;
