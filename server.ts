import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { scrapeUrl } from "./server/scraper.js";
import {
  runFullAudit,
  runQuickScan,
  runAgent,
  type BusinessContext,
} from "./server/agents.js";
import { synthesizeReport } from "./server/scorer.js";
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
  getUserUsageCount,
} from "./server/supabaseServer.js";
import { publicApiRouter } from "./server/routes/api-public.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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

  // ─── Health Check ──────────────────────────────────────
  app.get("/api/health", (_req: any, res: any) => {
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

  // ─── Quick Scan (30 seconds, homepage only) ────────────
  app.post("/api/quick-scan", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    const userId = await getUserIdFromRequest(req);

    try {
      console.log(`[Quick Scan] Starting scan for: ${url}`);
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
      console.log(`[Quick Scan] Complete. Score: ${result.score}/100`);

      const responseData = {
        url,
        businessName: scrapedData.title || new URL(url).hostname,
        businessType: scrapedData.inferredBusinessType,
        ...result,
      };

      // Save to DB if authenticated
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
        console.log(`[Quick Scan] Saved to DB for user ${userId}`);
      }

      res.json({ success: true, data: responseData });
    } catch (err: any) {
      console.error("[Quick Scan] Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ─── Full Audit (5 parallel agents, ~2-3 min) ──────────
  app.post("/api/audit", async (req, res) => {
    const {
      url,
      businessName,
      businessType,
      primaryGoal,
      monthlyBudget,
      platforms,
    } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    const userId = await getUserIdFromRequest(req);
    
    // Paywall Validation Middleware
    if (userId) {
      const usageCount = await getUserUsageCount(userId);
      if (usageCount >= 5) {
        return res.status(403).json({ error: "PAYWALL_LIMIT", message: "You have used all 5 free credits. Please upgrade to continue." });
      }
    }

    try {
      console.log(`[Full Audit] Starting for: ${url}`);
      console.log(
        `[Full Audit] Business: ${businessName || "Auto-detect"}, Type: ${businessType || "Auto-detect"}`
      );

      // Phase 1: Scrape and build context
      console.log(`[Full Audit] Phase 1: Scraping ${url}...`);
      const scrapedData = await scrapeUrl(url);

      const context: BusinessContext = {
        url,
        businessName:
          businessName || scrapedData.title || new URL(url).hostname,
        businessType: businessType || scrapedData.inferredBusinessType,
        primaryGoal: primaryGoal || "Generate leads",
        monthlyBudget: monthlyBudget || "Not specified",
        platforms: platforms || [],
        scrapedData,
      };

      // Phase 2: Run 5 agents in parallel
      console.log(`[Full Audit] Phase 2: Launching 5 agents in parallel...`);
      const agentResults = await runFullAudit(context);

      // Phase 3: Synthesize report
      console.log(`[Full Audit] Phase 3: Synthesizing report...`);
      const report = synthesizeReport(agentResults);

      console.log(
        `[Full Audit] Complete. Score: ${report.overall}/100 (Grade ${report.grade})`
      );

      const responseData = {
        url,
        businessName: context.businessName,
        businessType: context.businessType,
        report,
        agentResults,
        generatedAt: new Date().toISOString(),
      };

      // Save to DB if authenticated
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
        console.log(`[Full Audit] Saved to DB for user ${userId}`);
      }

      res.json({ success: true, data: responseData });
    } catch (err: any) {
      console.error("[Full Audit] Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ─── Individual Skill ────────────────────────────────────
  app.post("/api/skill/:name", async (req, res) => {
    const { name } = req.params;
    const {
      url,
      businessName,
      businessType,
      primaryGoal,
      monthlyBudget,
      platforms,
    } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    const userId = await getUserIdFromRequest(req);
    
    // Paywall Validation Middleware
    if (userId) {
      const usageCount = await getUserUsageCount(userId);
      if (usageCount >= 5) {
        return res.status(403).json({ error: "PAYWALL_LIMIT", message: "You have used all 5 free credits. Please upgrade to continue." });
      }
    }

    try {
      console.log(`[Skill: ${name}] Starting for: ${url}`);
      const scrapedData = await scrapeUrl(url);

      const context: BusinessContext = {
        url,
        businessName:
          businessName || scrapedData.title || new URL(url).hostname,
        businessType: businessType || scrapedData.inferredBusinessType,
        primaryGoal: primaryGoal || "Generate leads",
        monthlyBudget: monthlyBudget || "Not specified",
        platforms: platforms || [],
        scrapedData,
      };

      const result = await runAgent(name, context);

      // Save to DB if authenticated
      if (userId) {
        await saveSkillResult({
          userId,
          skillName: name,
          url,
          result,
        });

        // Also save as an audit report for history visibility
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
          report: { 
            ...result,
            overall: score,
            grade: grade
          },
        });
        
        console.log(`[Skill: ${name}] Saved to DB (Results + Audit Report) for user ${userId}`);
      }

      res.json({ success: true, data: result });
    } catch (err: any) {
      console.error(`[Skill: ${name}] Error:`, err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ─── Get User's Audits ──────────────────────────────────
  app.get("/api/audits", async (req, res) => {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const audits = await getUserAudits(userId);
    res.json({ success: true, data: audits });
  });

  // ─── Get Latest Audit ───────────────────────────────────
  app.get("/api/audits/latest", async (req, res) => {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const audit = await getLatestAudit(userId);
    res.json({ success: true, data: audit });
  });

  // ─── Get User's Skill Results ───────────────────────────
  app.get("/api/skill-results", async (req, res) => {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const results = await getUserSkillResults(userId);
    res.json({ success: true, data: results });
  });

  // ─── Scrape Only (for pre-filling onboarding) ──────────
  app.post("/api/scrape-context", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
      const scrapedData = await scrapeUrl(url);
      res.json({
        success: true,
        data: {
          title: scrapedData.title,
          businessType: scrapedData.inferredBusinessType,
          heroOffer: scrapedData.heroOffer,
          primaryCTA: scrapedData.primaryCTA,
          detectedPixels: scrapedData.detectedPixels,
          h1: scrapedData.h1,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─── Vite middleware for development ────────────────────
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
