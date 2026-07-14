import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import { MockAnthropic } from "../utils/sumopodClient.js";
import {
  getUserIdFromRequest,
  createConversation,
  getConversations,
  getConversationMessages,
  saveMessage,
  deleteConversation,
  getAgentMessageCount,
  incrementAgentUsage,
  getRecentAuditContext,
  getProfile,
  supabaseAdmin,
} from "../supabaseServer.js";

export const agentRouter = express.Router();

// ─── Rate limits by tier ──────────────────────────────────────────────────
const RATE_LIMITS: Record<string, number> = {
  free: 5,
  solo: 100,
  agency: Infinity,
};

function getRateLimit(plan: string | null | undefined): number {
  if (!plan) return RATE_LIMITS.free;
  return RATE_LIMITS[plan.toLowerCase()] ?? RATE_LIMITS.free;
}

function getAnthropicClient() {
  if (process.env.SUMOPOD_API_KEY) {
    return new MockAnthropic() as any;
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set");
  return new Anthropic({ apiKey: key });
}

// ─── Master system prompt (all 10 use cases) ─────────────────────────────
const SYSTEM_PROMPT = `You are ZieAds AI Agent — the most advanced paid ads strategist AI for freelancers, agencies, and in-house marketers. You outperform generic tools by providing specific, data-grounded, immediately actionable insights across every dimension of paid advertising.

You operate in two modes:
1. **Chat mode** — conversational Q&A about paid ads strategy
2. **Analysis mode** — structured deep-dive triggered by specific use-case commands

## Core expertise (all platforms):
- **Meta Ads**: Campaign Architecture (CBO/ABO), creative fatigue detection, audience overlap, ROAS optimization, retargeting sequences, Dynamic Product Ads, Advantage+ Shopping
- **Google Ads**: Search/Shopping/PMax/Display, Quality Score, keyword sculpting, negative keyword strategy, bidding (tROAS, tCPA, Maximize Conversions), Ad Rank factors
- **TikTok Ads**: Spark Ads, UGC creative direction, TopView, In-Feed Ads, Creative Center trends, hook-rate benchmarks
- **LinkedIn Ads**: B2B ABM targeting, Sponsored Content, Message Ads, Lead Gen Forms, company size + seniority layering
- **Cross-platform**: Attribution modeling, incrementality testing, budget allocation, funnel coverage analysis

## The 10 analysis modes you can run:

### MODE 1: DAILY DIAGNOSIS
Anomaly detection across all campaigns. Detects anything ≥2 sigma outside baseline.
Output format:
- 🔴 URGENT (fix today): [issue + root cause + fix]
- 🟡 WARNING (fix this week): [issue]
- 🟢 STABLE: [metric]
End with: "Top priority action: [one specific task]"

### MODE 2: CREATIVE FATIGUE ANALYSIS
Score each creative on 5 dimensions: CTR trend, frequency vs. engagement curve, CPM inflation, thumb-stop rate, conversion rate vs. launch week.
Output: Fatigue score 0-10 per creative, recommendation (scale / refresh / kill), estimated budget waste from fatigued creatives.

### MODE 3: ROAS DROP ROOT CAUSE
Analyze 4+ root causes ranked by probability. Check: audience saturation, creative fatigue, checkout friction, competitor price changes, landing page issues, pixel/tracking breaks, seasonal demand shifts, bid competition.
Output: Ranked cause list with probability % + evidence + fix + estimated recovery timeline.

### MODE 4: BUDGET OPTIMIZATION
Profit-first reallocation model. Analyze spend vs. return per campaign/ad set. Identify winners (high ROAS, scalable) vs. losers (below break-even).
Output: Current allocation vs. recommended allocation table, projected monthly profit change, specific moves (increase X by $Y, pause Z).

### MODE 5: COMPETITIVE INTELLIGENCE
Analyze up to 5 competitors. For each: estimated ad spend signals, platforms active on, creative angles, offer structure, pricing positioning, audience targeting signals.
Output: Competitor comparison table, identified market gaps, differentiation opportunities, recommended counter-strategy.

### MODE 6: CAMPAIGN HEALTH SCORECARD
Score all campaigns across 8 dimensions: targeting precision (0-100), creative quality (0-100), landing page match (0-100), funnel coverage (0-100), tracking completeness (0-100), budget efficiency (0-100), competitive positioning (0-100), audience quality (0-100).
Output: Scorecard table, top 3 campaigns needing attention, weekly action plan.

### MODE 7: A/B TEST DESIGN
Design a statistically valid testing plan. Calculate required sample size (for 80% power, 95% confidence). Prioritize test variables by expected impact.
Output: Test hypothesis, variable to test, control vs. variant description, required impressions/conversions, expected CPA improvement, monitoring cadence.

### MODE 8: EXECUTIVE SUMMARY
CEO/CMO-ready business performance summary. Frame everything in revenue impact, not ad metrics.
Output: One-paragraph executive summary, top 3 wins this period, top 3 risks + financial impact, recommended strategic moves with $ upside, 90-day forecast.

### MODE 9: AUDIENCE QUALITY AUDIT
Detect bot traffic, low-quality audiences, and audience overlap. Red flags: CTR >10% with <0.5% CVR, conversion times <30s, geographic anomalies, frequency >8 with flat engagement.
Output: Quality score per audience, estimated bot/fraud %, financial impact, blocking recommendations.

### MODE 10: LAUNCH READINESS
Pre-flight checklist before going live. Check: pixel firing, UTM structure, landing page speed, message match between ad and page, audience size adequacy, budget pacing setup, conversion event testing.
Output: Pass/Fail checklist, critical blockers (do not launch until fixed), warnings (fix soon), estimated risk if launched as-is.

## Response rules:
- **Always cite numbers**. Never say "your ROAS is low" — say "your ROAS of 1.8x is 40% below the 3.0x e-commerce benchmark."
- **Always give financial impact**. Every finding gets a $ or % business impact.
- **Use tables for comparisons**. When comparing campaigns, creatives, or platforms — use a markdown table.
- **Give ranked recommendations**. Always number them: "1. [highest impact] 2. [second] 3. [third]"
- **No filler phrases**. No "Great question!", no "I hope this helps." Start every response with the insight.
- **Ready-to-use outputs**. If asked for copy, write the actual ad copy. If asked for a campaign structure, write the actual structure with naming conventions.
- **Reference audit data first**. If the user's audit context is available, lead with what you know about their specific business before adding general advice.

## Tone:
Senior strategist at a top-5 performance agency. Honest, direct, technically precise, focused on ROI. You tell users hard truths when their setup is wrong.`;

// ─── Dynamic business context injected per user ───────────────────────────
function buildBusinessContext(profile: any): string {
  if (!profile) return '';
  const parts: string[] = [];
  if (profile.business_name)     parts.push(`Business: ${profile.business_name}`);
  if (profile.business_type)     parts.push(`Industry: ${profile.business_type}`);
  if (profile.primary_goal)      parts.push(`Primary goal: ${profile.primary_goal}`);
  if (profile.monthly_budget)    parts.push(`Monthly ads budget: ${profile.monthly_budget}`);
  if (profile.platforms?.length) parts.push(`Active platforms: ${profile.platforms.join(', ')}`);
  if (profile.primary_url)       parts.push(`Website: ${profile.primary_url}`);
  if (profile.challenge)         parts.push(`Stated challenge: ${profile.challenge}`);
  if (parts.length === 0) return '';
  return `\n\n## USER'S BUSINESS PROFILE (always reference this first):\n${parts.join('\n')}`;
}

function buildSystemPrompt(profile: any): string {
  return SYSTEM_PROMPT + buildBusinessContext(profile);
}

// ─── Helper: build structured analysis prompt ─────────────────────────────
function buildAnalysisPrompt(mode: string, data: string, auditContext: string): string {
  const modeMap: Record<string, string> = {
    daily: "Run MODE 1: DAILY DIAGNOSIS",
    fatigue: "Run MODE 2: CREATIVE FATIGUE ANALYSIS",
    roas: "Run MODE 3: ROAS DROP ROOT CAUSE ANALYSIS",
    budget: "Run MODE 4: BUDGET OPTIMIZATION",
    competitive: "Run MODE 5: COMPETITIVE INTELLIGENCE",
    health: "Run MODE 6: CAMPAIGN HEALTH SCORECARD",
    abtest: "Run MODE 7: A/B TEST DESIGN",
    executive: "Run MODE 8: EXECUTIVE SUMMARY",
    audience: "Run MODE 9: AUDIENCE QUALITY AUDIT",
    launch: "Run MODE 10: LAUNCH READINESS CHECK",
  };

  const modeInstruction = modeMap[mode] || "Analyze the following data";

  return `${modeInstruction} on the data below.

## User's recent audit context:
${auditContext}

## Data provided by user:
${data || "No additional data provided — use audit context above."}

Produce the full structured output for this mode. Include all tables, scores, financial impact figures, and prioritized recommendations.`;
}

async function getV3DataContext(userId: string): Promise<string> {
  let context = "";

  // 1. Connected Channels
  try {
    const { data } = await supabaseAdmin
      .from("social_connections")
      .select("platform, platform_username, is_active")
      .eq("user_id", userId)
      .eq("is_active", true);
    if (data && data.length > 0) {
      context += `### Connected Accounts:\n`;
      data.forEach(c => {
        context += `- Platform: ${c.platform.toUpperCase()}, Username: @${c.platform_username}\n`;
      });
    } else {
      context += `### Connected Accounts: None connected yet.\n`;
    }
  } catch (e: any) {
    context += `### Connected Accounts: Error loading connections.\n`;
  }

  // 2. Channel Performance Metrics
  try {
    const { data } = await supabaseAdmin
      .from("account_insights_daily")
      .select("platform, snapshot_date, followers_count, media_count")
      .eq("user_id", userId)
      .order("snapshot_date", { ascending: false })
      .limit(3);
    if (data && data.length > 0) {
      context += `\n### Recent Channel Insights:\n`;
      data.forEach(d => {
        context += `- [${d.platform.toUpperCase()} - ${d.snapshot_date}]: Followers: ${d.followers_count}, Total Posts: ${d.media_count}\n`;
      });
    }
  } catch (e: any) {}

  // 3. Top Posts
  try {
    const { data } = await supabaseAdmin
      .from("post_insights_cache")
      .select("platform, platform_media_id, impressions, reach, likes, comments_count")
      .eq("user_id", userId)
      .order("post_published_at", { ascending: false })
      .limit(5);
    if (data && data.length > 0) {
      context += `\n### Recent Post Performance:\n`;
      data.forEach(p => {
        context += `- [${p.platform.toUpperCase()} Post ID: ${p.platform_media_id}]: Impressions: ${p.impressions}, Reach: ${p.reach}, Likes: ${p.likes}, Comments: ${p.comments_count}\n`;
      });
    }
  } catch (e: any) {}

  // 4. Scheduled Posts
  try {
    const { data } = await supabaseAdmin
      .from("scheduled_posts")
      .select("platform, caption, media_type, scheduled_for, status")
      .eq("user_id", userId)
      .order("scheduled_for", { ascending: true })
      .limit(5);
    if (data && data.length > 0) {
      context += `\n### Scheduled Drafts/Posts:\n`;
      data.forEach(s => {
        context += `- [${s.platform.toUpperCase()} (${s.status})]: "${s.caption?.slice(0, 60) || ""}" - Scheduled for: ${s.scheduled_for ? new Date(s.scheduled_for).toDateString() : 'Draft'}\n`;
      });
    }
  } catch (e: any) {}

  // 5. Daily Briefing
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabaseAdmin
      .from("ai_briefings")
      .select("summary")
      .eq("user_id", userId)
      .eq("briefing_date", today)
      .maybeSingle();
    if (data && data.summary) {
      context += `\n### Today's AI Analyst Briefing:\nSummary: ${data.summary}\n`;
    }
  } catch (e: any) {}

  return context || "No active channel data available yet.";
}

// ─── POST /api/agent/message ─────────────────────────────────────────────
agentRouter.post("/message", async (req, res) => {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { message, conversationId, contextUrl } = req.body as {
    message: string;
    conversationId?: string;
    contextUrl?: string;
  };

  if (!message?.trim()) return res.status(400).json({ error: "message is required" });

  const profile = await getProfile(userId);
  const plan = profile?.plan || "free";
  const limit = getRateLimit(plan);
  const used = await getAgentMessageCount(userId);
  if (used >= limit) {
    return res.status(429).json({
      error: "RATE_LIMIT",
      message: `You have used all ${limit} messages this month. Upgrade your plan to continue.`,
      used,
      limit,
    });
  }

  let convId = conversationId;
  if (!convId) {
    const title = message.slice(0, 60) + (message.length > 60 ? "…" : "");
    const conv = await createConversation(userId, title, contextUrl);
    if (!conv) return res.status(500).json({ error: "Failed to create conversation" });
    convId = conv.id;
  }

  await saveMessage({ conversationId: convId, userId, role: "user", content: message });

  const history = await getConversationMessages(convId, userId);
  const recentHistory = history.slice(-20);
  const auditContext = await getRecentAuditContext(userId);
  const v3Context = await getV3DataContext(userId);

  const messages: Array<{ role: "user" | "assistant"; content: string }> = [];

  if (recentHistory.length <= 1) {
    const contextIntro = auditContext !== "No audit history available yet."
      ? `My recent audit context:\n\n${auditContext}\n\nQuestion: ${message}`
      : message;
    messages.push({ role: "user", content: contextIntro });
  } else {
    for (const m of recentHistory.slice(0, -1)) {
      messages.push({ role: m.role as "user" | "assistant", content: m.content });
    }
    messages.push({ role: "user", content: message });
  }

  try {
    const anthropic = getAnthropicClient();
    const response = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 2048,
      system: `${buildSystemPrompt(profile)}

## User's Connected Social Media Channels & v0.3 Context:
${v3Context}

## User's Audit Context:
${auditContext}`,
      messages,
    });

    const assistantContent = response.content[0].type === "text" ? response.content[0].text : "";

    await saveMessage({ conversationId: convId, userId, role: "assistant", content: assistantContent });
    await incrementAgentUsage(userId);

    res.json({
      success: true,
      conversationId: convId,
      reply: assistantContent,
      usage: { used: used + 1, limit },
    });
  } catch (err: any) {
    if (err.message?.includes("ANTHROPIC_API_KEY not set")) {
      const fallback = "⚠️ ZieAds AI Agent requires an ANTHROPIC_API_KEY to be configured. Please add it to your .env file: `ANTHROPIC_API_KEY=sk-ant-...`";
      await saveMessage({ conversationId: convId, userId, role: "assistant", content: fallback });
      return res.json({ success: true, conversationId: convId, reply: fallback, usage: { used, limit } });
    }
    console.error("[Agent] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/agent/analyze ─────────────────────────────────────────────
// Structured deep-analysis: one of the 10 use-case modes
agentRouter.post("/analyze", async (req, res) => {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { mode, data, conversationId } = req.body as {
    mode: string;
    data?: string;
    conversationId?: string;
  };

  if (!mode) return res.status(400).json({ error: "mode is required" });

  const profile = await getProfile(userId);
  const plan = profile?.plan || "free";
  const limit = getRateLimit(plan);
  const used = await getAgentMessageCount(userId);
  if (used >= limit) {
    return res.status(429).json({
      error: "RATE_LIMIT",
      message: `You have used all ${limit} messages this month. Upgrade your plan to continue.`,
      used,
      limit,
    });
  }

  const auditContext = await getRecentAuditContext(userId);
  const v3Context = await getV3DataContext(userId);
  const prompt = buildAnalysisPrompt(mode, data || "", auditContext);

  // Resolve or create a conversation for this analysis
  let convId = conversationId;
  if (!convId) {
    const modeLabels: Record<string, string> = {
      daily: "Daily Diagnosis",
      fatigue: "Creative Fatigue Analysis",
      roas: "ROAS Drop Analysis",
      budget: "Budget Optimization",
      competitive: "Competitive Intelligence",
      health: "Campaign Health Check",
      abtest: "A/B Test Design",
      executive: "Executive Summary",
      audience: "Audience Quality Audit",
      launch: "Launch Readiness Check",
    };
    const conv = await createConversation(userId, modeLabels[mode] || "Analysis", undefined);
    if (!conv) return res.status(500).json({ error: "Failed to create conversation" });
    convId = conv.id;
  }

  await saveMessage({ conversationId: convId, userId, role: "user", content: `[Running ${mode} analysis]` });

  try {
    const anthropic = getAnthropicClient();
    const response = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 4096,
      system: `${buildSystemPrompt(profile)}

## User's Connected Social Media Channels & v0.3 Context:
${v3Context}`,
      messages: [{ role: "user", content: prompt }],
    });

    const result = response.content[0].type === "text" ? response.content[0].text : "";

    await saveMessage({ conversationId: convId, userId, role: "assistant", content: result });
    await incrementAgentUsage(userId);

    res.json({
      success: true,
      conversationId: convId,
      result,
      mode,
      usage: { used: used + 1, limit },
    });
  } catch (err: any) {
    if (err.message?.includes("ANTHROPIC_API_KEY not set")) {
      return res.json({
        success: true,
        conversationId: convId,
        result: "⚠️ ZieAds AI Agent requires an ANTHROPIC_API_KEY. Please configure it in your .env file.",
        mode,
        usage: { used, limit },
      });
    }
    console.error("[Agent/analyze] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/agent/conversations ────────────────────────────────────────
agentRouter.get("/conversations", async (req, res) => {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const conversations = await getConversations(userId);
  res.json({ success: true, data: conversations });
});

// ─── GET /api/agent/conversations/:id ────────────────────────────────────
agentRouter.get("/conversations/:id", async (req, res) => {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const messages = await getConversationMessages(req.params.id, userId);
  res.json({ success: true, data: messages });
});

// ─── DELETE /api/agent/conversations/:id ─────────────────────────────────
agentRouter.delete("/conversations/:id", async (req, res) => {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const ok = await deleteConversation(req.params.id, userId);
  res.json({ success: ok });
});

// ─── GET /api/agent/usage ────────────────────────────────────────────────
agentRouter.get("/usage", async (req, res) => {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const profile = await getProfile(userId);
  const plan = profile?.plan || "free";
  const limit = getRateLimit(plan);
  const used = await getAgentMessageCount(userId);
  res.json({ success: true, data: { used, limit, plan } });
});
