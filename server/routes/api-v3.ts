import { Router } from "express";
import { getUserIdFromRequest, supabaseAdmin } from "../supabaseServer.js";
import {
  generateDailyBriefing,
  generateWeeklyRecommendations,
  analyzeBrandVoice,
  detectAnomalies,
} from "../v3-agents.js";
import { runFullAudit, type BusinessContext } from "../agents.js";
import { synthesizeReport } from "../scorer.js";
import { scrapeUrl } from "../scraper.js";

export const apiV3Router = Router();

// Middleware to enforce authentication
async function requireAuth(req: any, res: any, next: any) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
}

// ─── Connected Accounts ──────────────────────────────────────────────────────
apiV3Router.get("/connections", requireAuth, async (req: any, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("connected_accounts")
      .select("*")
      .eq("user_id", req.userId);
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiV3Router.post("/connections", requireAuth, async (req: any, res) => {
  const { platform, accountHandle, connectionMethod, metadata } = req.body;
  if (!platform || !accountHandle) {
    return res.status(400).json({ error: "platform and accountHandle are required" });
  }

  try {
    // Upsert to handle reconnection cleanly
    const { data, error } = await supabaseAdmin
      .from("connected_accounts")
      .upsert({
        user_id: req.userId,
        platform,
        platform_account_id: `mock_${platform}_${Date.now()}`,
        account_handle: accountHandle,
        connection_method: connectionMethod || "oauth",
        is_active: true,
        connected_at: new Date().toISOString(),
        metadata: metadata || {},
      }, { onConflict: "user_id,platform,platform_account_id" })
      .select();

    if (error) throw error;

    // Trigger initial brand voice & metrics sync mocks asynchronously
    setTimeout(async () => {
      try {
        // Insert some mock posts & metric snapshots to bootstrap the AI Analyst
        const mockPosts = [
          { content: `Absolutely thrilled to launch our new product today! 🚀 Let us know what you think in the comments. #launch #marketing`, likes: 45, comments: 12, reach: 450 },
          { content: `Why is customer acquisition getting so expensive? 📉 Here are 3 tips to reduce your CAC in 2026. Thread below:`, likes: 112, comments: 24, reach: 1200 },
          { content: `We just passed our first 1,000 customers! A huge thank you to everyone who supported us on this journey. ❤️`, likes: 250, comments: 45, reach: 3200 }
        ];

        for (const post of mockPosts) {
          const { data: insertedPost } = await supabaseAdmin.from("social_posts").insert({
            account_id: data[0].id,
            user_id: req.userId,
            platform,
            platform_post_id: `post_${platform}_${Math.random().toString(36).slice(2, 9)}`,
            content_text: post.content,
            media_type: "text_only",
            posted_at: new Date(Date.now() - Math.random() * 5 * 24 * 3600 * 1000).toISOString(),
            raw_metrics: { likes: post.likes, comments: post.comments },
          }).select().single();

          if (insertedPost) {
            // Insert metric snapshot
            await supabaseAdmin.from("metric_snapshots").insert({
              post_id: insertedPost.id,
              account_id: data[0].id,
              user_id: req.userId,
              likes: post.likes,
              comments: post.comments,
              reach: post.reach,
              engagement_rate: Number(((post.likes + post.comments) / post.reach).toFixed(4)),
              captured_at: new Date().toISOString()
            });
          }
        }

        // Trigger brand voice extraction
        await analyzeBrandVoice(req.userId);
      } catch (err) {
        console.error("[V3 Connections Async] Mock sync failed:", err);
      }
    }, 500);

    res.json({ success: true, data: data[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiV3Router.delete("/connections/:id", requireAuth, async (req: any, res) => {
  try {
    const { error } = await supabaseAdmin
      .from("connected_accounts")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.userId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Paid Ads CSV Upload ──────────────────────────────────────────────────────
apiV3Router.post("/ads/upload", requireAuth, async (req: any, res) => {
  const { platform, rows } = req.body;
  if (!platform || !rows || !Array.isArray(rows)) {
    return res.status(400).json({ error: "platform and rows (array) are required" });
  }

  try {
    const uploadedAt = new Date().toISOString();
    
    // Process and insert rows in batch
    const insertPayloads = rows.map((row: any) => {
      const spend = parseFloat(row.spend || row.cost || row.spend_usd || row["Amount Spent USD"] || row["Cost"] || "0");
      const revenue = parseFloat(row.revenue || row.revenue_usd || row.value || row["Conv value"] || row["Total Conversion Value"] || "0");
      const impressions = parseInt(row.impressions || row["Impressions"] || "0");
      const clicks = parseInt(row.clicks || row["Clicks"] || "0");
      const conversions = parseInt(row.conversions || row["Conversions"] || "0");
      
      const ctr = impressions > 0 ? clicks / impressions : 0;
      const cpc = clicks > 0 ? spend / clicks : 0;
      const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
      const roas = spend > 0 ? revenue / spend : 0;

      return {
        user_id: req.userId,
        platform,
        campaign_id: row.campaign_id || row.id || `csv_${Math.random().toString(36).substring(2, 9)}`,
        campaign_name: row.campaign_name || row.campaign || row["Campaign Name"] || row["Campaign"] || "Unnamed Campaign",
        ad_set_id: row.ad_set_id || row.ad_group_id || null,
        ad_set_name: row.ad_set_name || row.ad_group || row["Ad Set Name"] || row["Ad group"] || null,
        ad_id: row.ad_id || null,
        ad_name: row.ad_name || row["Ad Name"] || null,
        date_range_start: row.date_start || row.day || row.date || new Date().toISOString().slice(0, 10),
        date_range_end: row.date_end || row.day || row.date || new Date().toISOString().slice(0, 10),
        impressions,
        clicks,
        spend_usd: spend,
        conversions,
        revenue_usd: revenue,
        ctr,
        cpc,
        cpm,
        roas,
        data_source: "csv_upload",
        uploaded_at: uploadedAt,
        raw_row: row,
      };
    });

    const { error } = await supabaseAdmin.from("ad_data").insert(insertPayloads);
    if (error) throw error;

    res.json({ success: true, count: insertPayloads.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── AI Daily Briefing ────────────────────────────────────────────────────────
apiV3Router.get("/analyst/briefing", requireAuth, async (req: any, res) => {
  const briefingDate = new Date().toISOString().slice(0, 10);
  try {
    let { data: briefing, error } = await supabaseAdmin
      .from("daily_briefings")
      .select("*")
      .eq("user_id", req.userId)
      .eq("briefing_date", briefingDate)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    // If briefing doesn't exist yet, generate it on demand for the user
    if (!briefing) {
      console.log(`[V3 API] No briefing found for date ${briefingDate}. Generating now...`);
      briefing = await generateDailyBriefing(req.userId);
    }

    res.json({ success: true, data: briefing });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Content Studio ──────────────────────────────────────────────────────────
apiV3Router.get("/studio/recommendations", requireAuth, async (req: any, res) => {
  const weekStarting = new Date().toISOString().slice(0, 10);
  try {
    let { data: recs, error } = await supabaseAdmin
      .from("content_recommendations")
      .select("*")
      .eq("user_id", req.userId)
      .eq("week_starting", weekStarting);

    if (error) throw error;

    // If no recommendations found, generate them dynamically
    if (!recs || recs.length === 0) {
      console.log(`[V3 API] No content recommendations found for week starting ${weekStarting}. Generating now...`);
      const generated = await generateWeeklyRecommendations(req.userId);
      // Re-fetch database inserts to return accurate objects with IDs
      const { data: newRecs } = await supabaseAdmin
        .from("content_recommendations")
        .select("*")
        .eq("user_id", req.userId)
        .eq("week_starting", weekStarting);
      recs = newRecs || [];
    }

    res.json({ success: true, data: recs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiV3Router.post("/studio/action", requireAuth, async (req: any, res) => {
  const { id, action } = req.body;
  if (!id || !action) {
    return res.status(400).json({ error: "id and action are required" });
  }
  try {
    const { error } = await supabaseAdmin
      .from("content_recommendations")
      .update({ user_action: action })
      .eq("id", id)
      .eq("user_id", req.userId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Competitor Hunt ──────────────────────────────────────────────────────────
apiV3Router.get("/hunt/competitors", requireAuth, async (req: any, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("tracked_competitors")
      .select("*")
      .eq("user_id", req.userId)
      .order("added_at", { ascending: false });
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiV3Router.post("/hunt/competitors", requireAuth, async (req: any, res) => {
  const { competitorUrl, competitorName } = req.body;
  if (!competitorUrl || !competitorName) {
    return res.status(400).json({ error: "competitorUrl and competitorName are required" });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("tracked_competitors")
      .insert({
        user_id: req.userId,
        competitor_url: competitorUrl,
        competitor_name: competitorName,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Wraps existing v0.2 full audit logic for competitor tracking
apiV3Router.post("/hunt/audit", requireAuth, async (req: any, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "id of competitor is required" });

  try {
    // 1. Fetch competitor details
    const { data: competitor, error: fetchError } = await supabaseAdmin
      .from("tracked_competitors")
      .select("*")
      .eq("id", id)
      .eq("user_id", req.userId)
      .single();

    if (fetchError || !competitor) throw new Error("Competitor not found");

    // 2. Perform v0.2 URL Audit asynchronously
    const scrapedData = await scrapeUrl(competitor.competitor_url);
    const context: BusinessContext = {
      url: competitor.competitor_url,
      businessName: competitor.competitor_name,
      businessType: scrapedData.inferredBusinessType || "E-Commerce",
      primaryGoal: "Generate sales",
      monthlyBudget: "Not specified",
      platforms: [],
      scrapedData,
    };

    const agentResults = await runFullAudit(context);
    const report = synthesizeReport(agentResults);

    // 3. Save score & append report to competitor history
    const newHistory = [...(competitor.audit_history || []), {
      score: report.overall,
      grade: report.grade,
      audited_at: new Date().toISOString(),
      report: report,
    }];

    const { error: updateError } = await supabaseAdmin
      .from("tracked_competitors")
      .update({
        latest_audit_score: report.overall,
        last_audited_at: new Date().toISOString(),
        audit_history: newHistory,
      })
      .eq("id", id);

    if (updateError) throw updateError;

    res.json({ success: true, score: report.overall, grade: report.grade });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Alerts & Anomaly Management ──────────────────────────────────────────────
apiV3Router.get("/alerts", requireAuth, async (req: any, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("anomaly_alerts")
      .select("*")
      .eq("user_id", req.userId)
      .is("acknowledged_at", null)
      .order("triggered_at", { ascending: false });
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiV3Router.post("/alerts/acknowledge", requireAuth, async (req: any, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "id is required" });
  try {
    const { error } = await supabaseAdmin
      .from("anomaly_alerts")
      .update({ acknowledged_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", req.userId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Vercel Cron Trigger (Background Sync) ────────────────────────────────────
apiV3Router.post("/jobs/run", async (req, res) => {
  // Simple token guard to prevent unauthorized trigger invocations
  const cronSecret = process.env.V3_CRON_SECRET || "local_secret";
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: "Unauthorized cron trigger" });
  }

  console.log("[V3 Cron] Starting background sync jobs...");

  try {
    // 1. Fetch active subscription tiers
    const { data: users, error } = await supabaseAdmin
      .from("v3_subscription_tiers")
      .select("user_id")
      .neq("tier_name", "free"); // run briefs for active paid tier users daily

    if (error) throw error;

    let briefingCount = 0;
    let competitorAuditsCount = 0;

    for (const sub of (users || [])) {
      try {
        // Run daily briefing
        await generateDailyBriefing(sub.user_id);
        briefingCount++;

        // Run anomaly detection
        await detectAnomalies(sub.user_id);

        // Run scheduled competitor audits (once every 7 days)
        const { data: competitors } = await supabaseAdmin
          .from("tracked_competitors")
          .select("*")
          .eq("user_id", sub.user_id)
          .eq("is_active", true);

        for (const competitor of (competitors || [])) {
          const lastAudit = competitor.last_audited_at ? new Date(competitor.last_audited_at).getTime() : 0;
          const oneWeek = competitor.audit_frequency_days * 24 * 3600 * 1000;
          if (Date.now() - lastAudit >= oneWeek) {
            // Trigger audit
            const scrapedData = await scrapeUrl(competitor.competitor_url);
            const context: BusinessContext = {
              url: competitor.competitor_url,
              businessName: competitor.competitor_name,
              businessType: scrapedData.inferredBusinessType || "E-Commerce",
              primaryGoal: "Generate sales",
              monthlyBudget: "Not specified",
              platforms: [],
              scrapedData,
            };
            const agentResults = await runFullAudit(context);
            const report = synthesizeReport(agentResults);
            
            await supabaseAdmin.from("tracked_competitors").update({
              latest_audit_score: report.overall,
              last_audited_at: new Date().toISOString(),
              audit_history: [...(competitor.audit_history || []), {
                score: report.overall,
                grade: report.grade,
                audited_at: new Date().toISOString(),
                report: report,
              }]
            }).eq("id", competitor.id);
            competitorAuditsCount++;
          }
        }
      } catch (err) {
        console.error(`[V3 Cron] Failed processing user ${sub.user_id}:`, err);
      }
    }

    res.json({ success: true, briefingsGenerated: briefingCount, competitorAuditsRun: competitorAuditsCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
