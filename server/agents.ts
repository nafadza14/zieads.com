import { GoogleGenAI } from "@google/genai";
import type { ScrapedData } from "./scraper.js";

export interface BusinessContext {
  url: string;
  businessName: string;
  businessType: string;
  primaryGoal: string;
  monthlyBudget: string;
  platforms: string[];
  scrapedData: ScrapedData;
}

export interface AgentFinding {
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  impact: string;
  recommendation: string;
}

export interface AgentResult {
  agentName: string;
  dimension: string;
  score: number;
  findings: AgentFinding[];
  deliverables: Record<string, any>;
}

function getAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  return new GoogleGenAI({ apiKey });
}

const AGENT_PROMPTS: Record<string, (ctx: BusinessContext) => string> = {
  "creative-intelligence": (ctx) => `You are the ZieAds Ad Creative Intelligence Agent. Analyze this business and produce a creative strategy.

BUSINESS CONTEXT:
- URL: ${ctx.url}
- Business Name: ${ctx.businessName || ctx.scrapedData.title}
- Type: ${ctx.businessType || ctx.scrapedData.inferredBusinessType}
- Goal: ${ctx.primaryGoal}
- Hero Offer: ${ctx.scrapedData.heroOffer}
- Primary CTA: ${ctx.scrapedData.primaryCTA}
- Headline (H1): ${ctx.scrapedData.h1}
- Description: ${ctx.scrapedData.metaDescription}
- OG Image: ${ctx.scrapedData.ogImage}
- Headings: ${ctx.scrapedData.headings.map(h => `${h.tag}: ${h.text}`).join("; ")}

ANALYZE:
1. Brand visual identity assessment (based on what can be inferred from page content)
2. Hero offer clarity and strength (is the offer specific, compelling, differentiated?)
3. Emotional triggers applicable to this product category
4. Creative format recommendations across platforms (static, carousel, video, UGC, Stories, Reels)
5. 3 creative concepts per platform (Meta, Google Display, TikTok) each with: hook line, visual direction, format, emotional angle, CTA

Score the Creative & Offer Strength dimension 0-100.

RESPOND WITH VALID JSON ONLY matching this exact schema:
{
  "score": number,
  "dimension": "Creative & Offer Strength",
  "findings": [{"severity": "critical"|"high"|"medium"|"low", "title": string, "impact": string, "recommendation": string}],
  "deliverables": {
    "brandIdentity": {"colors": string, "style": string, "tone": string},
    "heroOfferAssessment": string,
    "emotionalTriggers": [string],
    "creativeConceptsMeta": [{"hook": string, "visualDirection": string, "format": string, "emotionalAngle": string, "cta": string}],
    "creativeConceptsGoogle": [{"hook": string, "visualDirection": string, "format": string}],
    "creativeConceptsTikTok": [{"hook": string, "visualDirection": string, "format": string, "emotionalAngle": string}],
    "testingSequence": string
  }
}`,

  "audience-targeting": (ctx) => `You are the ZieAds Audience & Targeting Agent. Build a complete targeting strategy for this business.

BUSINESS CONTEXT:
- URL: ${ctx.url}
- Business: ${ctx.businessName || ctx.scrapedData.title}
- Type: ${ctx.businessType || ctx.scrapedData.inferredBusinessType}
- Goal: ${ctx.primaryGoal}
- Budget: ${ctx.monthlyBudget}
- Current Platforms: ${ctx.platforms?.join(", ") || "Not specified"}
- Hero Offer: ${ctx.scrapedData.heroOffer}
- Page Content Signals: E-commerce: ${ctx.scrapedData.businessSignals.hasEcommerce}, Pricing: ${ctx.scrapedData.businessSignals.hasPricing}, Lead Forms: ${ctx.scrapedData.businessSignals.hasLeadForm}

ANALYZE:
1. Define the Ideal Customer Profile (ICP): demographics, psychographics, job-to-be-done
2. Build audience tiers: Cold (interest-based), Warm (engagement/retargeting), Hot (cart/lead/customer)
3. Platform-specific targeting matrix for Meta, Google, TikTok, and LinkedIn (if B2B)
4. Lookalike/similar audience seed recommendations
5. Exclusion strategy (who NOT to target)

Score the Audience Clarity dimension 0-100.

RESPOND WITH VALID JSON ONLY:
{
  "score": number,
  "dimension": "Audience Clarity",
  "findings": [{"severity": "critical"|"high"|"medium"|"low", "title": string, "impact": string, "recommendation": string}],
  "deliverables": {
    "icp": {"demographics": string, "psychographics": string, "jobToBeDone": string},
    "metaAudiences": {"cold": [string], "warm": [string], "hot": [string]},
    "googleAudiences": {"searchIntent": [string], "inMarket": [string], "customerMatch": string},
    "tiktokAudiences": {"interests": [string], "behaviors": [string]},
    "linkedinAudiences": {"jobTitles": [string], "companySize": [string], "industries": [string]},
    "exclusions": [string],
    "lookalikeSeeds": [string]
  }
}`,

  "competitive-intelligence": (ctx) => `You are the ZieAds Competitive Intelligence Agent. Map the competitive landscape for this business.

BUSINESS CONTEXT:
- URL: ${ctx.url}
- Business: ${ctx.businessName || ctx.scrapedData.title}
- Type: ${ctx.businessType || ctx.scrapedData.inferredBusinessType}
- Hero Offer: ${ctx.scrapedData.heroOffer}
- Description: ${ctx.scrapedData.metaDescription}

ANALYZE:
1. Identify 3 tiers of competitors:
   - Tier 1: Direct competitors (same product, same market, similar price)
   - Tier 2: Indirect competitors (different product, same problem solved)
   - Tier 3: Aspirational competitors (category leaders to benchmark)
2. For each competitor estimate: ad spend tier (Low/Medium/High/Heavy), primary platforms, offer positioning, creative approach
3. Identify competitive gaps: platforms where competitors are weak, offers they're not making, audiences they're ignoring
4. Positioning recommendations for this business

Score the Competitive Positioning dimension 0-100.

RESPOND WITH VALID JSON ONLY:
{
  "score": number,
  "dimension": "Competitive Positioning",
  "findings": [{"severity": "critical"|"high"|"medium"|"low", "title": string, "impact": string, "recommendation": string}],
  "deliverables": {
    "directCompetitors": [{"name": string, "url": string, "adSpendTier": string, "platforms": [string], "offer": string, "creativeApproach": string}],
    "indirectCompetitors": [{"name": string, "url": string, "offer": string}],
    "aspirationalCompetitors": [{"name": string, "url": string, "whyAspirate": string}],
    "competitiveGaps": {"platformGaps": [string], "offerGaps": [string], "audienceGaps": [string], "creativeGaps": [string]},
    "positioningRecommendation": string
  }
}`,

  "platform-budget": (ctx) => `You are the ZieAds Platform & Budget Strategy Agent. Determine the optimal platform mix and budget allocation.

BUSINESS CONTEXT:
- URL: ${ctx.url}
- Business: ${ctx.businessName || ctx.scrapedData.title}
- Type: ${ctx.businessType || ctx.scrapedData.inferredBusinessType}
- Goal: ${ctx.primaryGoal}
- Monthly Budget: ${ctx.monthlyBudget}
- Current Platforms: ${ctx.platforms?.join(", ") || "Not specified"}
- Detected Pixels: ${ctx.scrapedData.detectedPixels.join(", ") || "None"}
- UTM Params: ${ctx.scrapedData.utmParameters.join(", ") || "None"}
- E-commerce: ${ctx.scrapedData.businessSignals.hasEcommerce}
- Has Pricing Page: ${ctx.scrapedData.businessSignals.hasPricing}

ANALYZE:
1. Platform fit score for each (Meta, Google Search, Google Display, TikTok, LinkedIn, YouTube) based on business type and goal
2. Recommended budget allocation % and dollar amount per platform
3. Funnel stage split (TOFU/MOFU/BOFU)
4. KPI benchmarks per platform (expected CPA, ROAS, CTR for this industry/type)
5. Bidding strategy recommendations per platform
6. Testing budget framework

Score the Platform Fit dimension 0-100.

RESPOND WITH VALID JSON ONLY:
{
  "score": number,
  "dimension": "Platform Fit",
  "findings": [{"severity": "critical"|"high"|"medium"|"low", "title": string, "impact": string, "recommendation": string}],
  "deliverables": {
    "platformRanking": [{"platform": string, "fitScore": number, "reason": string, "allocation": string, "primaryKPI": string}],
    "budgetAllocation": {"tofu": string, "mofu": string, "bofu": string},
    "benchmarks": {"expectedCPA": string, "expectedROAS": string, "expectedCTR": string},
    "biddingStrategy": [{"platform": string, "strategy": string, "rationale": string}],
    "testingBudget": string,
    "scalingThresholds": string
  }
}`,

  "funnel-conversion": (ctx) => `You are the ZieAds Funnel & Conversion Agent. Audit the landing page and map the full advertising funnel.

BUSINESS CONTEXT:
- URL: ${ctx.url}
- Business: ${ctx.businessName || ctx.scrapedData.title}
- Type: ${ctx.businessType || ctx.scrapedData.inferredBusinessType}
- Goal: ${ctx.primaryGoal}
- Headline (H1): ${ctx.scrapedData.h1}
- Meta Description: ${ctx.scrapedData.metaDescription}
- Primary CTA: ${ctx.scrapedData.primaryCTA}
- Page Load Time: ${ctx.scrapedData.pageLoadTime}ms
- Has Lead Form: ${ctx.scrapedData.businessSignals.hasLeadForm}
- Has Blog: ${ctx.scrapedData.businessSignals.hasBlog}
- Has E-commerce: ${ctx.scrapedData.businessSignals.hasEcommerce}
- Has Chat Widget: ${ctx.scrapedData.businessSignals.hasChatWidget}
- Detected Pixels: ${ctx.scrapedData.detectedPixels.join(", ") || "None"}
- Headings: ${ctx.scrapedData.headings.map(h => `${h.tag}: ${h.text}`).join("; ")}

ANALYZE:

LANDING PAGE AUDIT (score each 0-10):
1. Load speed — is page load time under 3 seconds?
2. Above-the-fold clarity — can visitor understand the offer in 5 seconds?
3. Headline strength — specific, benefit-driven, differentiated?
4. Social proof — testimonials, logos, numbers, reviews?
5. CTA clarity — one primary CTA, prominent, benefit-driven button text?
6. Form friction — minimum fields, logical placement?
7. Trust signals — guarantees, security badges, privacy policy?
8. Message match potential — would the landing page match typical ad copy?

FUNNEL MAPPING:
1. TOFU coverage — does the brand have awareness content?
2. MOFU coverage — is there a lead magnet, trial, or nurture mechanism?
3. BOFU coverage — is the conversion offer compelling? How many steps to convert?
4. Funnel gaps — what's missing at each stage?

Score the Landing Page Conversion dimension 0-100 AND the Funnel Coverage dimension 0-100.

RESPOND WITH VALID JSON ONLY:
{
  "landingPageScore": number,
  "funnelScore": number,
  "dimension": "Landing Page & Funnel",
  "findings": [{"severity": "critical"|"high"|"medium"|"low", "title": string, "impact": string, "recommendation": string}],
  "deliverables": {
    "landingPageScores": {"loadSpeed": number, "aboveFoldClarity": number, "headlineStrength": number, "socialProof": number, "ctaClarity": number, "formFriction": number, "trustSignals": number, "messageMatch": number},
    "headlineRewrites": [string],
    "ctaRewrites": [string],
    "funnelMap": {"tofu": {"status": string, "gaps": [string]}, "mofu": {"status": string, "gaps": [string]}, "bofu": {"status": string, "gaps": [string]}},
    "funnelBuildSequence": [string],
    "conversionBlockers": [string]
  }
}`,

  "ads-copy": (ctx) => `You are the ZieAds Expert Copywriter Agent. Generate platform-native ad copy ready to be pasted into Ads Manager.
  
BUSINESS CONTEXT:
- URL: ${ctx.url}
- Business: ${ctx.businessName || ctx.scrapedData.title}
- Goal: ${ctx.primaryGoal}
- Hero Offer: ${ctx.scrapedData.heroOffer}

RESPOND WITH VALID JSON ONLY:
{
  "dimension": "Creative & Offer",
  "score": 100,
  "analysis": {
    "strategy": "Overall copywriting strategy and psychological triggers used",
    "toneOfVoice": "Description of the brand voice used for this copy",
    "keySellingPoints": ["Benefit 1", "Benefit 2", "Benefit 3"]
  },
  "deliverables": {
    "googleAds": {
      "headlines": ["Headline 1", "Headline 2"],
      "descriptions": ["Description 1", "Description 2"],
      "sitelinks": [{"text": "Text", "description": "Desc"}]
    },
    "metaAds": {
      "shortBody": "Short version",
      "mediumBody": "Medium version",
      "longBody": "Long version",
      "headlines": ["Headline 1"],
      "primaryTexts": ["Primary text 1"]
    },
    "tiktokAds": {
      "scriptOutlines": [{"hook": "Hook", "body": "Body", "cta": "CTA"}],
      "captions": ["Caption 1"]
    },
    "linkedinAds": {
      "sponsoredContent": [{"intro": "Intro", "headline": "Headline"}],
      "messageAds": [{"subject": "Subject", "body": "Body"}]
    }
  }
}`,

  "ads-landing": (ctx) => `You are the ZieAds CRO Landing Page Agent. Perform a CRO audit specifically for paid traffic.
  
BUSINESS CONTEXT:
- URL: ${ctx.url}
- Page Title: ${ctx.scrapedData.title}
- Headline (H1): ${ctx.scrapedData.h1}
- Primary CTA: ${ctx.scrapedData.primaryCTA}
- Load Time: ${ctx.scrapedData.pageLoadTime}ms

RESPOND WITH VALID JSON ONLY:
{
  "dimension": "Landing Page Conversion",
  "score": number,
  "findings": [{"severity": "critical"|"high"|"medium"|"low", "title": string, "impact": string, "recommendation": string}],
  "deliverables": {
    "croScores": {
      "aboveFoldClarity": number,
      "headlineStrength": number,
      "frictionLevel": number
    },
    "headlineRewrites": [string],
    "ctaOptimizations": [string],
    "trustSignalGaps": [string]
  }
}`,

  "ads-google": (ctx) => `You are the ZieAds Google Ads Strategist Agent. Build a complete Google Ads strategy.

BUSINESS CONTEXT:
- URL: ${ctx.url}
- Goal: ${ctx.primaryGoal}
- Budget: ${ctx.monthlyBudget}
- Offer: ${ctx.scrapedData.heroOffer}

RESPOND WITH VALID JSON ONLY:
{
  "dimension": "Platform Fit",
  "score": number,
  "deliverables": {
    "campaignStructure": [{"campaignName": string, "type": string, "budgetAllocation": string}],
    "keywordBuckets": [{"category": string, "keywords": [string]}],
    "negativeKeywordsSeed": [string],
    "biddingStrategy": string
  }
}`,

  "ads-meta": (ctx) => `You are the ZieAds Meta Ads Strategist Agent. Build a complete Facebook & Instagram strategy.

BUSINESS CONTEXT:
- URL: ${ctx.url}
- Goal: ${ctx.primaryGoal}
- Budget: ${ctx.monthlyBudget}

RESPOND WITH VALID JSON ONLY:
{
  "dimension": "Platform Fit",
  "score": number,
  "deliverables": {
    "campaignStructure": [{"campaignName": string, "objective": string, "budgetSplit": string}],
    "audienceSets": [{"name": string, "targeting": string}],
    "lookalikeStrategy": string,
    "biddingStrategy": string
  }
}`,

  "ads-tiktok": (ctx) => `You are the ZieAds TikTok Ads Strategist. Build a complete TikTok strategy.

BUSINESS CONTEXT:
- URL: ${ctx.url}
- Goal: ${ctx.primaryGoal}
- Budget: ${ctx.monthlyBudget}

RESPOND WITH VALID JSON ONLY:
{
  "dimension": "Creative & Offer",
  "score": number,
  "deliverables": {
    "campaignStructure": [{"objective": string, "budgetSplit": string}],
    "targeting": {"interests": [string], "behaviors": [string]},
    "creativeDirection": {"ugcIdeas": [string], "trendingAudioVibes": [string]}
  }
}`,

  "ads-linkedin": (ctx) => `You are the ZieAds LinkedIn B2B Ad Strategist. Build a complete LinkedIn Ads plan.

BUSINESS CONTEXT:
- URL: ${ctx.url}
- Type: ${ctx.businessType}
- Goal: ${ctx.primaryGoal}

RESPOND WITH VALID JSON ONLY:
{
  "dimension": "Platform Fit",
  "score": number,
  "deliverables": {
    "campaignStructure": [{"objective": string, "format": string, "budgetSplit": string}],
    "targetingMatrix": {"jobTitles": [string], "seniority": [string], "industries": [string]},
    "contentOffers": [string]
  }
}`,

  // Aliases for the specific AI button calls from the dashboard
  "ads-audiences": (ctx) => AGENT_PROMPTS["audience-targeting"](ctx),
  "ads-competitors": (ctx) => AGENT_PROMPTS["competitive-intelligence"](ctx),
  "ads-funnel": (ctx) => AGENT_PROMPTS["funnel-conversion"](ctx),
  "ads-budget": (ctx) => AGENT_PROMPTS["platform-budget"](ctx),
  "ads-creatives": (ctx) => AGENT_PROMPTS["creative-intelligence"](ctx),

  // Short-name aliases (used by the dashboard frontend)
  "copy": (ctx) => AGENT_PROMPTS["ads-copy"](ctx),
  "creatives": (ctx) => AGENT_PROMPTS["creative-intelligence"](ctx),
  "competitors": (ctx) => AGENT_PROMPTS["competitive-intelligence"](ctx),
  "landing": (ctx) => AGENT_PROMPTS["ads-landing"](ctx),
  "budget": (ctx) => AGENT_PROMPTS["platform-budget"](ctx),
  "audiences": (ctx) => AGENT_PROMPTS["audience-targeting"](ctx),
  "funnel": (ctx) => AGENT_PROMPTS["funnel-conversion"](ctx),
  "google": (ctx) => AGENT_PROMPTS["ads-google"](ctx),
  "meta": (ctx) => AGENT_PROMPTS["ads-meta"](ctx),
  "tiktok": (ctx) => AGENT_PROMPTS["ads-tiktok"](ctx),
  "linkedin": (ctx) => AGENT_PROMPTS["ads-linkedin"](ctx),

  // PRD Skill #14: Markdown Strategy Report
  "ads-report": (ctx) => `You are the ZieAds Strategy Report Writer. Compile a complete markdown strategy report for this business.

BUSINESS CONTEXT:
- URL: ${ctx.url}
- Business: ${ctx.businessName || ctx.scrapedData.title}
- Type: ${ctx.businessType || ctx.scrapedData.inferredBusinessType}
- Goal: ${ctx.primaryGoal}
- Budget: ${ctx.monthlyBudget}

Generate a comprehensive paid ads strategy document covering: executive summary, target audience, platform recommendations, creative direction, budget allocation, funnel strategy, and 90-day action plan.

RESPOND WITH VALID JSON ONLY:
{
  "dimension": "Strategy Report",
  "score": 100,
  "findings": [],
  "deliverables": {
    "executiveSummary": string,
    "targetAudience": string,
    "platformStrategy": string,
    "creativeDirection": string,
    "budgetAllocation": string,
    "funnelStrategy": string,
    "ninetyDayPlan": [{"week": string, "action": string}]
  }
}`,
  "report": (ctx) => AGENT_PROMPTS["ads-report"](ctx),

  // PRD Skill #15: White-Label PDF Report
  "ads-report-pdf": (ctx) => `You are the ZieAds White-Label PDF Report Generator. Create structured report data for agency PDF export.

BUSINESS CONTEXT:
- URL: ${ctx.url}
- Business: ${ctx.businessName || ctx.scrapedData.title}
- Type: ${ctx.businessType || ctx.scrapedData.inferredBusinessType}
- Goal: ${ctx.primaryGoal}

Generate a professional agency-ready report structure with: cover page content, executive summary, score breakdown, top findings, recommendations, and next steps.

RESPOND WITH VALID JSON ONLY:
{
  "dimension": "PDF Report",
  "score": 100,
  "findings": [],
  "deliverables": {
    "coverPage": {"title": string, "subtitle": string, "preparedFor": string, "date": string},
    "executiveSummary": string,
    "scoreBreakdown": [{"dimension": string, "score": number, "summary": string}],
    "topFindings": [{"severity": string, "title": string, "description": string, "fix": string}],
    "recommendations": [{"priority": string, "action": string, "expectedImpact": string}],
    "nextSteps": [string]
  }
}`,
  "report-pdf": (ctx) => AGENT_PROMPTS["ads-report-pdf"](ctx),

  // Quick scan alias
  "ads-quick": (ctx) => AGENT_PROMPTS["creative-intelligence"](ctx),
  "quick": (ctx) => AGENT_PROMPTS["creative-intelligence"](ctx),
};

export async function runAgent(
  agentName: string,
  context: BusinessContext
): Promise<AgentResult> {
  const promptFn = AGENT_PROMPTS[agentName];
  if (!promptFn) {
    throw new Error(`Unknown agent: ${agentName}`);
  }

  const ai = getAI();
  const prompt = promptFn(context);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
        maxOutputTokens: 8192,
      },
    });

    const text = response.text;
    if (!text) throw new Error(`No response from agent ${agentName}`);

    const parsed = JSON.parse(text);

    // Normalize any agent that uses the funnel-conversion prompt (two scores)
    const FUNNEL_AGENTS = new Set(["funnel-conversion", "ads-funnel", "funnel"]);
    if (FUNNEL_AGENTS.has(agentName) && (parsed.landingPageScore !== undefined || parsed.funnelScore !== undefined)) {
      return {
        agentName,
        dimension: "Landing Page & Funnel",
        score: parsed.landingPageScore ?? parsed.score ?? 50,
        findings: parsed.findings || [],
        deliverables: {
          ...parsed.deliverables,
          funnelScore: parsed.funnelScore ?? 50,
          landingPageScore: parsed.landingPageScore ?? 50,
        },
      };
    }

    return {
      agentName,
      dimension: parsed.dimension || agentName,
      score: parsed.score ?? 50,
      findings: parsed.findings || [],
      deliverables: parsed.deliverables || {},
    };
  } catch (err: any) {
    console.error(`[Agent ${agentName}] Error:`, err.message);
    return {
      agentName,
      dimension: agentName,
      score: 50,
      findings: [
        {
          severity: "medium",
          title: `${agentName} analysis incomplete`,
          impact: "Some analysis data could not be generated.",
          recommendation: "Try running the audit again.",
        },
      ],
      deliverables: {},
    };
  }
}

export async function runFullAudit(
  context: BusinessContext
): Promise<AgentResult[]> {
  const agentNames = [
    "creative-intelligence",
    "audience-targeting",
    "competitive-intelligence",
    "platform-budget",
    "funnel-conversion",
  ];

  const results = await Promise.all(
    agentNames.map((name) => runAgent(name, context))
  );

  return results;
}

export async function runQuickScan(
  context: BusinessContext
): Promise<{
  score: number;
  findings: AgentFinding[];
  signals: Record<string, { status: string; score: number }>;
}> {
  const sd = context.scrapedData;

  // 5 quick signals
  const signals: Record<string, { status: string; score: number }> = {};

  // 1. Pixel presence
  const hasPixel = sd.detectedPixels.length > 0;
  signals["Tracking Pixel"] = {
    status: hasPixel
      ? `Detected: ${sd.detectedPixels.join(", ")}`
      : "No tracking pixel detected",
    score: hasPixel ? 10 : 0,
  };

  // 2. CTA clarity
  const hasCTA = sd.primaryCTA !== "Not detected";
  signals["CTA Clarity"] = {
    status: hasCTA ? `Found CTA: "${sd.primaryCTA}"` : "No clear CTA found above the fold",
    score: hasCTA ? 10 : 2,
  };

  // 3. Offer visibility
  const hasOffer = sd.heroOffer.length > 20 && sd.heroOffer !== "Could not determine primary offer";
  signals["Offer Visibility"] = {
    status: hasOffer ? "Main offer is visible" : "Offer is unclear or missing",
    score: hasOffer ? 10 : 3,
  };

  // 4. Mobile speed (estimated from load time)
  const speedOk = sd.pageLoadTime < 3000;
  signals["Page Speed"] = {
    status: `${(sd.pageLoadTime / 1000).toFixed(1)}s load time ${speedOk ? "(Good)" : "(Slow — above 3s threshold)"}`,
    score: speedOk ? 10 : 4,
  };

  // 5. Headline specificity
  const hasSpecificHeadline = sd.h1.length > 10 && !/welcome|home|untitled/i.test(sd.h1);
  signals["Headline Specificity"] = {
    status: hasSpecificHeadline ? `"${sd.h1.slice(0, 80)}"` : "Headline is generic or missing",
    score: hasSpecificHeadline ? 10 : 2,
  };

  const totalScore = Object.values(signals).reduce((sum, s) => sum + s.score, 0);
  const normalizedScore = Math.round(totalScore * 2); // Scale 0-50 to 0-100

  // Generate findings
  const findings: AgentFinding[] = [];
  if (!hasPixel) {
    findings.push({
      severity: "critical",
      title: "No tracking pixel detected",
      impact: "You cannot run retargeting campaigns or track conversions without a pixel.",
      recommendation: "Install Meta Pixel and/or Google Tag Manager immediately.",
    });
  }
  if (!hasCTA) {
    findings.push({
      severity: "high",
      title: "No clear CTA found above the fold",
      impact: "Visitors from paid ads need a clear next step within 5 seconds.",
      recommendation: "Add a prominent, benefit-driven CTA button above the fold.",
    });
  }
  if (!hasOffer) {
    findings.push({
      severity: "high",
      title: "Main offer is unclear or missing",
      impact: "Paid traffic needs to understand your offer immediately. Vague messaging wastes ad spend.",
      recommendation: "Make your primary offer specific and visible within the first viewport.",
    });
  }
  if (!speedOk) {
    findings.push({
      severity: "medium",
      title: `Page loads in ${(sd.pageLoadTime / 1000).toFixed(1)}s — above the 3s threshold`,
      impact: "Slow pages increase bounce rate by 32% and waste paid ad clicks.",
      recommendation: "Optimize images, minimize scripts, and consider a CDN.",
    });
  }
  if (!hasSpecificHeadline) {
    findings.push({
      severity: "medium",
      title: "Headline is generic or missing",
      impact: "Generic headlines fail to capture attention from paid traffic.",
      recommendation: "Write a specific, benefit-driven headline that matches your ad copy.",
    });
  }

  return { score: normalizedScore, findings, signals };
}
