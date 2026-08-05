import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin, deductCredits } from "./supabaseServer.js";
import { callSumopodAI } from "./utils/sumopodClient.js";

// Helper to resolve the correct AI API
async function callAI(systemPrompt: string, userPrompt: string, usePro = false): Promise<string> {
  const sumopodApiKey = process.env.SUMOPOD_API_KEY;
  if (sumopodApiKey) {
    try {
      return await callSumopodAI(systemPrompt, userPrompt);
    } catch (e: any) {
      console.warn("[V3 AI] Sumopod call failed, falling back:", e.message);
    }
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (anthropicKey) {
    try {
      const anthropic = new Anthropic({ apiKey: anthropicKey });
      const model = usePro ? "claude-3-5-opus-latest" : "claude-3-5-sonnet-latest";
      const response = await anthropic.messages.create({
        model,
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });
      const text = response.content[0].type === "text" ? response.content[0].text : "";
      if (text) return text;
    } catch (e: any) {
      console.warn("[V3 AI] Claude call failed, trying Gemini fallback:", e.message);
    }
  }

  if (geminiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const model = usePro ? "gemini-2.5-pro" : "gemini-2.5-flash";
      const response = await ai.models.generateContent({
        model,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
        }
      });
      if (response.text) return response.text;
    } catch (e: any) {
      console.error("[V3 AI] Gemini call failed:", e.message);
    }
  }

  throw new Error("No active AI provider (Anthropic or Gemini) is configured or functioning.");
}

// Log credit usage in v3_credit_events
async function logCreditUsage(params: {
  userId: string;
  eventType: string;
  credits: number;
  model: string;
  metadata?: any;
}) {
  const { error } = await supabaseAdmin.from("v3_credit_events").insert({
    user_id: params.userId,
    event_type: params.eventType,
    credits_consumed: params.credits,
    model_used: params.model,
    metadata: params.metadata || {},
  });
  if (error) {
    console.error("[V3 DB] Failed to log credit usage:", error.message);
  }
  // Deduct actual monthly skill credits to align v0.2 and v0.3 credit states
  await deductCredits(params.userId, 'skill_run_monthly', params.credits, params.eventType);
}

// ─── 1. Brand Voice Profiler ──────────────────────────────────────────────────
export async function analyzeBrandVoice(userId: string): Promise<any> {
  console.log(`[V3 Agent] Starting brand voice analysis for user ${userId}...`);

  // Fetch up to 100 recent posts
  const { data: posts, error } = await supabaseAdmin
    .from("social_posts")
    .select("content_text, platform, posted_at")
    .eq("user_id", userId)
    .order("posted_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(`Failed to fetch social posts: ${error.message}`);
  
  if (!posts || posts.length === 0) {
    return {
      voice_summary: "Default professional marketing tone. Connect your social channels to generate a custom voice profile.",
      tone_descriptors: ["professional", "marketing-focused", "informative"],
      common_phrases: [],
      vocabulary_level: "professional",
      emoji_usage_pattern: { frequency: "medium", common_emojis: [] },
      hashtag_patterns: [],
      avg_post_length: 150,
      top_performing_formats: [],
      last_refreshed_at: new Date().toISOString(),
      refresh_count: 0
    };
  }

  const postsContext = posts.map(p => `[Platform: ${p.platform}] Content:\n${p.content_text}`).join("\n\n---\n\n");

  const systemPrompt = `You are ZieAds Brand Voice Analyst. 
Analyze the user's social media content and define their writing voice. 
Identify: tone descriptors, common phrases, vocabulary level, emoji patterns, hashtag patterns, average post length, and top performing formats. 

RESPOND WITH VALID JSON ONLY matching this exact schema:
{
  "voice_summary": "string (2-3 sentences summarizing the voice)",
  "tone_descriptors": ["string"],
  "common_phrases": ["string"],
  "vocabulary_level": "casual" | "professional" | "technical" | "mixed",
  "emoji_usage_pattern": { "frequency": "low"|"medium"|"high", "common_emojis": ["string"] },
  "hashtag_patterns": ["string"],
  "avg_post_length": number,
  "top_performing_formats": [{"format": "string", "avg_engagement": number}]
}`;

  const userPrompt = `Here is the user's historical post content to analyze:\n\n${postsContext}`;

  const responseText = await callAI(systemPrompt, userPrompt);
  const result = JSON.parse(responseText);

  const { error: upsertError } = await supabaseAdmin.from("brand_voice_profiles").upsert({
    id: userId,
    voice_summary: result.voice_summary,
    tone_descriptors: result.tone_descriptors,
    common_phrases: result.common_phrases,
    vocabulary_level: result.vocabulary_level,
    emoji_usage_pattern: result.emoji_usage_pattern,
    hashtag_patterns: result.hashtag_patterns,
    avg_post_length: result.avg_post_length,
    top_performing_formats: result.top_performing_formats,
    last_refreshed_at: new Date().toISOString(),
    raw_analysis: result
  });

  if (upsertError) throw new Error(`Failed to upsert brand voice profile: ${upsertError.message}`);

  await logCreditUsage({
    userId,
    eventType: "brand_voice_refresh",
    credits: 2,
    model: "claude-3-5-sonnet-latest/gemini-2.5-flash",
  });

  return result;
}

// ─── 2. Daily Briefing Generator ──────────────────────────────────────────────
export async function generateDailyBriefing(userId: string): Promise<any> {
  console.log(`[V3 Agent] Generating daily briefing for user ${userId}...`);

  const briefingDate = new Date().toISOString().slice(0, 10);

  // 1. Gather all required context
  // Profile
  const { data: profile } = await supabaseAdmin.from("profiles").select("*").eq("id", userId).single();
  // Brand Voice (safe query)
  let voiceSummary = "Default professional marketing tone.";
  try {
    const { data: voice } = await supabaseAdmin.from("brand_voice_profiles").select("*").eq("id", userId).maybeSingle();
    if (voice) voiceSummary = voice.voice_summary;
  } catch (err) {
    // table removed
  }
  // Recent social posts (last 7 days)
  const { data: posts } = await supabaseAdmin
    .from("social_posts")
    .select("*, connected_accounts(account_handle)")
    .eq("user_id", userId)
    .order("posted_at", { ascending: false })
    .limit(10);
  // Recent ad spend / performance (last 7 days)
  const { data: ads } = await supabaseAdmin
    .from("ad_data")
    .select("*")
    .eq("user_id", userId)
    .order("date_range_start", { ascending: false })
    .limit(30);
  // Competitors
  const { data: competitors } = await supabaseAdmin
    .from("tracked_competitors")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true);

  // Compile context summaries
  const postsSummary = (posts || []).map(p => `- [Platform: ${p.platform}] Handle: ${p.connected_accounts?.account_handle || 'n/a'} | Date: ${p.posted_at.slice(0,10)} | Content: ${p.content_text?.slice(0,60)}... | Metrics: ${JSON.stringify(p.raw_metrics)}`).join("\n");
  const adsSummary = (ads || []).slice(0, 5).map(a => `- Campaign: ${a.campaign_name} | Spend: $${a.spend_usd} | Impressions: ${a.impressions} | Click: ${a.clicks} | Conv: ${a.conversions} | ROAS: ${a.roas}`).join("\n");
  const competitorSummary = (competitors || []).map(c => `- Competitor: ${c.competitor_name} (${c.competitor_url}) | Score: ${c.latest_audit_score || 'N/A'}`).join("\n");

  const systemPrompt = `You are ZieAds, the AI Marketing Analyst daily strategist.
Prepare a daily briefing summarizing wins, concerns, today's actions, and suggested deep dives.
Your goal is to surface specific, data-backed findings from the user's data rather than general tips.

RANK today's actions by estimated impact times effort.
Refer to specific v0.2 deep analysis modes for suggestions. The available modes are:
"Daily Diagnosis", "ROAS Drop Analysis", "Creative Fatigue", "Budget Optimization", "Competitive Intel", "Campaign Health", "A/B Test Design", "Audience Quality", "Launch Readiness", "Executive Summary".

RESPOND WITH VALID JSON ONLY matching this exact schema:
{
  "headline": "string (example: Strong Reels engagement yesterday, but check Google Ad CTR)",
  "wins": [{"title": "string", "metric": "string", "value": "string", "context": "string"}],
  "concerns": [{"title": "string", "metric": "string", "value": "string", "severity": "low"|"medium"|"high"}],
  "today_actions": [{"rank": number, "action": "string", "reasoning": "string", "estimated_impact": "High"|"Medium"|"Low", "effort": "Quick"|"Medium"|"High"}],
  "suggested_deep_dives": [{"v02_mode_name": "string", "reasoning_for_suggestion": "string"}]
}`;

  const userPrompt = `
USER CONTEXT:
- Business: ${profile?.business_name || 'My Brand'} (${profile?.primary_url || 'No URL'})
- Primary Goal: ${profile?.primary_goal || 'Generate leads'}
- Brand Voice: ${voiceSummary}

LAST 7 DAYS ACTIVITY:
Social Posts:
${postsSummary || "No social posts synced yet."}

Paid Ads Performance:
${adsSummary || "No paid ads data uploaded yet."}

Tracked Competitors:
${competitorSummary || "No competitors tracked yet."}
`;

  const responseText = await callAI(systemPrompt, userPrompt);
  const result = JSON.parse(responseText);

  const { error: insertError } = await supabaseAdmin.from("daily_briefings").upsert({
    user_id: userId,
    briefing_date: briefingDate,
    headline: result.headline,
    wins: result.wins,
    concerns: result.concerns,
    today_actions: result.today_actions,
    suggested_deep_dives: result.suggested_deep_dives,
    raw_ai_response: result,
    generated_at: new Date().toISOString()
  }, { onConflict: "user_id, briefing_date" });

  if (insertError) throw new Error(`Failed to save briefing: ${insertError.message}`);

  await logCreditUsage({
    userId,
    eventType: "daily_briefing",
    credits: 1,
    model: "claude-3-5-sonnet-latest/gemini-2.5-flash",
  });

  return result;
}

// ─── 3. Content Studio Recommendations ────────────────────────────────────────
export async function generateWeeklyRecommendations(userId: string): Promise<any> {
  console.log(`[V3 Agent] Generating weekly recommendations for user ${userId}...`);

  const weekStarting = new Date().toISOString().slice(0, 10);

  // Fetch brand voice
  const { data: voice } = await supabaseAdmin.from("brand_voice_profiles").select("*").eq("id", userId).single();
  // Fetch up to 50 posts for historical reference
  const { data: posts } = await supabaseAdmin.from("social_posts").select("*").eq("user_id", userId).limit(50);

  const voiceSummary = voice ? voice.voice_summary : "No brand voice profile loaded yet.";
  const topPosts = (posts || [])
    .sort((a,b) => ((b.raw_metrics?.likes || 0) + (b.raw_metrics?.comments || 0)) - ((a.raw_metrics?.likes || 0) + (a.raw_metrics?.comments || 0)))
    .slice(0, 5)
    .map(p => `- Platform: ${p.platform} | Engagement: ${JSON.stringify(p.raw_metrics)} | Content: ${p.content_text}`)
    .join("\n\n");

  const systemPrompt = `You are ZieAds Content Studio.
Based on the user's writing brand voice and best-performing historical posts, generate 7 custom social media content drafts for the upcoming week.
Ensure the drafts represent the tone, formatting style, emoji frequency, and vocabulary of the user brand voice.

RESPOND WITH VALID JSON ONLY matching this exact schema:
{
  "week_overview": "string (general strategic content theme for the week)",
  "recommendations": [
    {
      "day": "string (e.g. Monday, Tuesday, etc.)",
      "platform": "string (e.g. Instagram, TikTok, LinkedIn, or X)",
      "topic": "string",
      "format_recommendation": "string (e.g. Video Script, Image post, Text thread)",
      "optimal_post_time": "string (formatted as HH:MM, e.g. 09:00)",
      "caption_draft": "string (ready-to-use copy following user brand voice)",
      "visual_brief": "string (brief visual concept description)",
      "reasoning": "string"
    }
  ]
}`;

  const userPrompt = `
BRAND VOICE GUIDE:
${voiceSummary}

HISTORICAL TOP PERFORMING CONTENT:
${topPosts || "No top posts found."}
`;

  const responseText = await callAI(systemPrompt, userPrompt);
  const result = JSON.parse(responseText);

  // Insert all 7 recommendations
  for (const rec of result.recommendations) {
    const timeMatch = rec.optimal_post_time.split(":");
    const optimalTime = new Date();
    optimalTime.setHours(parseInt(timeMatch[0] || "9"), parseInt(timeMatch[1] || "0"), 0, 0);

    await supabaseAdmin.from("content_recommendations").insert({
      user_id: userId,
      week_starting: weekStarting,
      platform: rec.platform,
      topic: rec.topic,
      format_recommendation: rec.format_recommendation,
      caption_draft: rec.caption_draft,
      optimal_post_time: optimalTime.toISOString(),
      visual_brief: rec.visual_brief,
      reasoning: rec.reasoning,
      user_action: "pending"
    });
  }

  await logCreditUsage({
    userId,
    eventType: "content_recommendation",
    credits: 5,
    model: "claude-3-5-sonnet-latest/gemini-2.5-flash",
  });

  return result;
}

// ─── 4. Anomaly Detection ─────────────────────────────────────────────────────
export async function detectAnomalies(userId: string): Promise<any[]> {
  console.log(`[V3 Agent] Running anomaly detection for user ${userId}...`);

  // Fetch recent metric snapshots
  const { data: snapshots } = await supabaseAdmin
    .from("metric_snapshots")
    .select("*")
    .eq("user_id", userId)
    .order("captured_at", { ascending: false })
    .limit(10);

  if (!snapshots || snapshots.length < 2) {
    return []; // Not enough data for baseline delta checks
  }

  const latest = snapshots[0];
  const baseline = snapshots.slice(1).reduce((acc, curr) => ({
    likes: acc.likes + (curr.likes || 0),
    comments: acc.comments + (curr.comments || 0),
    reach: acc.reach + (curr.reach || 0),
    count: acc.count + 1
  }), { likes: 0, comments: 0, reach: 0, count: 0 });

  const avgLikes = baseline.likes / baseline.count;
  const avgReach = baseline.reach / baseline.count;

  const anomalies: any[] = [];

  // Likes check (drop > 40%)
  if (latest.likes < avgLikes * 0.6 && avgLikes > 5) {
    anomalies.push({
      alert_type: "engagement_drop",
      severity: "medium",
      metric_name: "Likes",
      current_value: latest.likes,
      baseline_value: Math.round(avgLikes),
      pct_change: Math.round(((latest.likes - avgLikes) / avgLikes) * 100),
      message: `Your latest post received significantly fewer likes than usual (${latest.likes} vs avg ${Math.round(avgLikes)}).`,
      suggested_action: "Analyze formatting, CTA placement, or review caption hook.",
      suggested_deep_dive: "Creative Fatigue"
    });
  }

  // Reach check (drop > 50%)
  if (latest.reach < avgReach * 0.5 && avgReach > 20) {
    anomalies.push({
      alert_type: "engagement_drop",
      severity: "high",
      metric_name: "Reach",
      current_value: latest.reach,
      baseline_value: Math.round(avgReach),
      pct_change: Math.round(((latest.reach - avgReach) / avgReach) * 100),
      message: `Organic post reach dropped by more than 50% on your latest content.`,
      suggested_action: "Check platform hashtag placement or check if format matches top-performing reels/shorts.",
      suggested_deep_dive: "Audience Quality"
    });
  }

  // Save detected anomalies to database
  for (const anomaly of anomalies) {
    await supabaseAdmin.from("anomaly_alerts").insert({
      user_id: userId,
      alert_type: anomaly.alert_type,
      severity: anomaly.severity,
      metric_name: anomaly.metric_name,
      current_value: anomaly.current_value,
      baseline_value: anomaly.baseline_value,
      pct_change: anomaly.pct_change,
      message: anomaly.message,
      suggested_action: anomaly.suggested_action,
      suggested_deep_dive: anomaly.suggested_deep_dive,
      triggered_at: new Date().toISOString()
    });
  }

  return anomalies;
}

export async function analyzeCommentSentiment(commentText: string): Promise<"positive" | "neutral" | "negative"> {
  try {
    const systemPrompt = `You are a sentiment analyzer. Classify the user comment as exactly "positive", "neutral", or "negative". Respond with one word only.`;
    const response = await callAI(systemPrompt, commentText);
    const word = response.trim().toLowerCase();
    if (word.includes("positive")) return "positive";
    if (word.includes("negative")) return "negative";
    return "neutral";
  } catch {
    return "neutral";
  }
}
