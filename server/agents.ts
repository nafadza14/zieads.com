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

  "audience-targeting": (ctx) => `You are the ZieAds Audience & ICP Targeting Agent. Build a deep, actionable audience strategy with full ICP definition and platform-specific targeting matrices.

BUSINESS CONTEXT:
- URL: ${ctx.url}
- Business: ${ctx.businessName || ctx.scrapedData.title}
- Type: ${ctx.businessType || ctx.scrapedData.inferredBusinessType}
- Goal: ${ctx.primaryGoal}
- Monthly Budget: ${ctx.monthlyBudget}
- Current Platforms: ${ctx.platforms?.join(", ") || "Not specified"}
- Hero Offer: ${ctx.scrapedData.heroOffer}
- Primary CTA: ${ctx.scrapedData.primaryCTA}
- Key Headings: ${ctx.scrapedData.headings.slice(0, 6).map(h => h.text).join('; ')}
- E-commerce: ${ctx.scrapedData.businessSignals.hasEcommerce}, Lead Forms: ${ctx.scrapedData.businessSignals.hasLeadForm}, Pricing Page: ${ctx.scrapedData.businessSignals.hasPricing}

DELIVERABLES REQUIRED:

1. ICP (Ideal Customer Profile) — be specific, not generic:
   - primaryICP: name, age range, income, job title or life stage, key pain points (3), trigger events that make them search for this
   - secondaryICP: the secondary buyer persona
   - jobToBeDone: the functional + emotional job this product fulfills

2. Audience Tiers (3-layer funnel):
   - COLD (Top of funnel): interest-based cold audiences to test
   - WARM (Mid funnel): engagement/lookalike/in-market audiences
   - HOT (Bottom funnel): retargeting pools, customer lists, abandoned visitors

3. Platform Matrices — give specific targeting parameters for each:
   - Meta: cold interest stacks, warm lookalike seeds, hot retargeting windows
   - Google: search intent keywords, in-market segments, customer match strategy
   - TikTok: interest categories, behavioral signals, creator audience types
   - LinkedIn (only if B2B signals present): job titles, seniority, company size, industries

4. Audience Sizing Estimates: for each tier estimate reach (e.g. "500K–2M on Meta")

5. Exclusion Strategy: exactly who to exclude and why (budget protection)

6. Lookalike Seeds: rank the top 3 seed audiences by conversion probability

Score the Audience Clarity dimension 0-100. Penalize if ICP is vague, if exclusions are missing, or if platform matrices are generic.

RESPOND WITH VALID JSON ONLY:
{
  "score": number,
  "dimension": "Audience Clarity",
  "findings": [{"severity": "critical"|"high"|"medium"|"low", "title": string, "impact": string, "recommendation": string}],
  "deliverables": {
    "primaryICP": {
      "name": string,
      "ageRange": string,
      "income": string,
      "jobOrLifeStage": string,
      "painPoints": [string, string, string],
      "triggerEvents": [string, string],
      "preferredPlatforms": [string]
    },
    "secondaryICP": {
      "name": string,
      "description": string,
      "difference": string
    },
    "jobToBeDone": {
      "functional": string,
      "emotional": string,
      "social": string
    },
    "audienceTiers": {
      "cold": [{"label": string, "rationale": string, "estimatedReach": string}],
      "warm": [{"label": string, "rationale": string, "estimatedReach": string}],
      "hot": [{"label": string, "rationale": string, "estimatedReach": string}]
    },
    "platformMatrix": {
      "meta": {
        "coldInterests": [string],
        "warmLookalikes": [string],
        "hotRetargetingWindows": [string],
        "recommendedBudgetSplit": string
      },
      "google": {
        "searchIntentKeywords": [string],
        "inMarketSegments": [string],
        "customerMatchStrategy": string,
        "audienceLayering": string
      },
      "tiktok": {
        "interestCategories": [string],
        "behavioralSignals": [string],
        "creatorAudienceTypes": [string]
      },
      "linkedin": {
        "jobTitles": [string],
        "seniority": [string],
        "companySize": [string],
        "industries": [string],
        "applicableIfB2B": boolean
      }
    },
    "exclusionStrategy": [{"segment": string, "reason": string, "estimatedWasteSaved": string}],
    "lookalikeSeeds": [{"seed": string, "platform": string, "conversionProbability": string, "reason": string}]
  }
}`,

  "competitive-intelligence": (ctx) => `You are the ZieAds Competitive Intelligence Agent. Build a 3-tier competitive intelligence map with specific ad intelligence, gap analysis, and positioning playbook.

BUSINESS CONTEXT:
- URL: ${ctx.url}
- Business: ${ctx.businessName || ctx.scrapedData.title}
- Type: ${ctx.businessType || ctx.scrapedData.inferredBusinessType}
- Hero Offer: ${ctx.scrapedData.heroOffer}
- Primary CTA: ${ctx.scrapedData.primaryCTA}
- Meta Description: ${ctx.scrapedData.metaDescription}
- Key Headings: ${ctx.scrapedData.headings.slice(0, 5).map(h => h.text).join('; ')}

DELIVERABLES REQUIRED:

1. THREE-TIER COMPETITOR MAP:
   - Tier 1 — Direct competitors (same product, same ICP, similar price point): 3–4 companies
     * For each: name, estimated URL, ad spend tier (Low/Medium/High/Heavy), active platforms, hero offer, creative approach, key messaging angle, estimated monthly ad spend range
   - Tier 2 — Indirect competitors (different product, same problem): 2–3 companies
     * For each: name, what they offer, why customers might choose them instead
   - Tier 3 — Aspirational benchmarks (category leaders): 2 companies
     * For each: name, what to study in their strategy, specific tactics to borrow

2. AD INTELLIGENCE ASSESSMENT (based on industry knowledge):
   - Which platforms are competitors most active on?
   - What creative formats dominate in this niche (UGC, static, video, carousel)?
   - What messaging angles are saturated vs. underused?
   - Average CPM/CPA benchmarks for this industry/category

3. COMPETITIVE GAP ANALYSIS (opportunities this business can exploit):
   - Platform gaps: where competitors are underinvesting
   - Offer gaps: promises competitors aren't making
   - Audience gaps: segments competitors are ignoring
   - Creative gaps: formats or angles not being used
   - Messaging gaps: emotional angles or positioning unclaimed

4. POSITIONING PLAYBOOK:
   - Current positioning of this business (based on page content)
   - Recommended positioning to differentiate from direct competitors
   - 3 specific messaging angles to own exclusively
   - Blue ocean opportunity (underserved niche with low competition)

5. COMPETITIVE SCORE: rate this business 0-100 on competitive positioning strength

RESPOND WITH VALID JSON ONLY:
{
  "score": number,
  "dimension": "Competitive Positioning",
  "findings": [{"severity": "critical"|"high"|"medium"|"low", "title": string, "impact": string, "recommendation": string}],
  "deliverables": {
    "tier1DirectCompetitors": [
      {
        "name": string,
        "url": string,
        "adSpendTier": "Low"|"Medium"|"High"|"Heavy",
        "estimatedMonthlySpend": string,
        "activePlatforms": [string],
        "heroOffer": string,
        "creativeApproach": string,
        "messagingAngle": string,
        "weakness": string
      }
    ],
    "tier2IndirectCompetitors": [
      {
        "name": string,
        "url": string,
        "alternativeOffer": string,
        "whyCustomersChooseThem": string,
        "howToCounterPosition": string
      }
    ],
    "tier3Aspirational": [
      {
        "name": string,
        "url": string,
        "tacticToBorrow": string,
        "reasonToStudy": string
      }
    ],
    "adIntelligence": {
      "dominantPlatforms": [string],
      "dominantCreativeFormats": [string],
      "saturatedAngles": [string],
      "underusedAngles": [string],
      "industryCPMRange": string,
      "industryCPARange": string,
      "averageROASBenchmark": string
    },
    "competitiveGaps": {
      "platformGaps": [{"platform": string, "opportunity": string}],
      "offerGaps": [string],
      "audienceGaps": [string],
      "creativeGaps": [string],
      "messagingGaps": [string]
    },
    "positioningPlaybook": {
      "currentPositioning": string,
      "recommendedPositioning": string,
      "messagingAnglesToOwn": [string],
      "blueOceanOpportunity": string,
      "taglineOptions": [string]
    }
  }
}`,

  "platform-budget": (ctx) => `You are the ZieAds Platform & Budget Allocation Agent. Build a data-driven budget model with platform fit scoring, dollar allocation, KPI benchmarks, and scaling thresholds.

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
- Hero Offer: ${ctx.scrapedData.heroOffer}

DELIVERABLES REQUIRED:

1. PLATFORM FIT SCORING — rate each platform 0-100 for this specific business:
   Platforms: Meta Ads, Google Search, Google Shopping (if e-comm), Google Display, TikTok Ads, LinkedIn Ads, YouTube Ads
   For each: fit score, why it fits or doesn't, recommended or skip

2. BUDGET ALLOCATION MODEL — based on the monthly budget given:
   - Exact dollar amount AND % per platform
   - Funnel stage split: TOFU / MOFU / BOFU ratios with dollar amounts
   - Testing budget (new creatives, new audiences) vs. scaling budget
   - Month 1 vs Month 3 allocation (how to shift as data comes in)

3. KPI BENCHMARKS — industry-specific targets per platform:
   - Meta: Expected CPM, CPC, CTR, CPA, ROAS
   - Google Search: Expected CPC, CTR, conversion rate, CPA
   - TikTok: Expected CPM, CPC, CTR
   - LinkedIn (if applicable): Expected CPL, CTR
   - Include "green/yellow/red" thresholds so they know when to scale vs. pause

4. BIDDING STRATEGY per platform:
   - Recommended bidding type (manual, automated, target CPA, target ROAS)
   - Starting bid approach and how to graduate to automated
   - Budget pacing recommendation (standard vs. accelerated)

5. SCALING FRAMEWORK:
   - What metrics signal it's safe to increase budget
   - What metrics signal to pause and diagnose
   - 30/60/90-day budget scaling milestones

Score Platform Fit overall 0-100.

RESPOND WITH VALID JSON ONLY:
{
  "score": number,
  "dimension": "Platform Fit",
  "findings": [{"severity": "critical"|"high"|"medium"|"low", "title": string, "impact": string, "recommendation": string}],
  "deliverables": {
    "platformRanking": [
      {
        "platform": string,
        "fitScore": number,
        "recommendation": "Prioritize"|"Test"|"Skip",
        "reason": string,
        "allocation": string,
        "allocationDollars": string,
        "primaryKPI": string
      }
    ],
    "budgetAllocation": {
      "tofu": {"percentage": string, "dollars": string, "purpose": string},
      "mofu": {"percentage": string, "dollars": string, "purpose": string},
      "bofu": {"percentage": string, "dollars": string, "purpose": string},
      "testing": {"percentage": string, "dollars": string, "purpose": string}
    },
    "monthlyPlan": {
      "month1": string,
      "month3": string,
      "month6": string
    },
    "kpiBenchmarks": {
      "meta": {"cpm": string, "cpc": string, "ctr": string, "cpa": string, "roas": string, "greenThreshold": string, "redThreshold": string},
      "googleSearch": {"cpc": string, "ctr": string, "conversionRate": string, "cpa": string, "greenThreshold": string, "redThreshold": string},
      "tiktok": {"cpm": string, "cpc": string, "ctr": string, "cpa": string},
      "linkedin": {"cpl": string, "ctr": string, "applicableIfB2B": boolean}
    },
    "biddingStrategies": [
      {"platform": string, "startingBid": string, "graduateTo": string, "pacing": string, "rationale": string}
    ],
    "scalingFramework": {
      "scaleSignals": [string],
      "pauseSignals": [string],
      "milestones": [{"period": string, "target": string, "budgetAction": string}]
    }
  }
}`,

  "funnel-conversion": (ctx) => `You are the ZieAds Funnel Architecture Agent. Map the full TOFU/MOFU/BOFU funnel, audit the landing page, identify routing gaps, and prescribe the exact funnel build sequence.

BUSINESS CONTEXT:
- URL: ${ctx.url}
- Business: ${ctx.businessName || ctx.scrapedData.title}
- Type: ${ctx.businessType || ctx.scrapedData.inferredBusinessType}
- Goal: ${ctx.primaryGoal}
- Headline (H1): ${ctx.scrapedData.h1}
- Meta Description: ${ctx.scrapedData.metaDescription}
- Hero Offer: ${ctx.scrapedData.heroOffer}
- Primary CTA: ${ctx.scrapedData.primaryCTA}
- Page Load Time: ${ctx.scrapedData.pageLoadTime}ms
- Has Lead Form: ${ctx.scrapedData.businessSignals.hasLeadForm}
- Has Blog: ${ctx.scrapedData.businessSignals.hasBlog}
- Has E-commerce: ${ctx.scrapedData.businessSignals.hasEcommerce}
- Has Chat Widget: ${ctx.scrapedData.businessSignals.hasChatWidget}
- Detected Pixels: ${ctx.scrapedData.detectedPixels.join(", ") || "None"}
- Key Headings: ${ctx.scrapedData.headings.slice(0, 8).map(h => `${h.tag}: ${h.text}`).join("; ")}

DELIVERABLES REQUIRED:

1. LANDING PAGE AUDIT — score each 0-100:
   - loadSpeed: based on ${ctx.scrapedData.pageLoadTime}ms (under 2s=95, 2-3s=70, 3-4s=45, over 4s=20)
   - aboveFoldClarity: does the H1 immediately communicate value to a cold visitor?
   - headlineStrength: specificity, benefit orientation, urgency, differentiation
   - socialProof: visible testimonials, logos, numbers, reviews
   - ctaClarity: single clear CTA, prominent placement, benefit-driven button text
   - formFriction: minimum fields, low steps to convert (100 = frictionless)
   - trustSignals: guarantees, security, privacy policy, credentials
   - messageMatch: would this page match paid ad copy promises?
   Overall landing page score = weighted average

2. FUNNEL ARCHITECTURE — map current state and prescribe missing stages:
   - TOFU (Top of Funnel — Awareness):
     * What awareness content/channels exist?
     * Recommended TOFU ad types and content formats
     * Recommended TOFU audience (cold targeting approach)
     * Gap: what's missing?
   - MOFU (Middle of Funnel — Consideration):
     * Is there a lead magnet, trial, free demo, or nurture mechanism?
     * Recommended MOFU offer (what to create if missing)
     * Retargeting window and trigger
     * Gap: what's missing?
   - BOFU (Bottom of Funnel — Conversion):
     * Is the conversion offer clear and compelling?
     * Steps to convert — how many clicks from ad to confirmation?
     * Friction points in the conversion path
     * Gap: what's missing?

3. AUDIENCE ROUTING LOGIC:
   - For each funnel stage: what ad objective to use, what audience to target, what creative to show
   - How to route new visitors vs. warm visitors vs. hot visitors differently
   - Recommended pixel event triggers at each stage

4. FUNNEL BUILD SEQUENCE — prioritized 8-step roadmap:
   - Order them by revenue impact (fix highest-ROI gaps first)

5. CONVERSION BLOCKERS — top 5 things killing conversions right now

Score the overall funnel 0-100 (penalize heavily for missing MOFU and poor message match).

RESPOND WITH VALID JSON ONLY:
{
  "landingPageScore": number,
  "funnelScore": number,
  "dimension": "Landing Page & Funnel",
  "findings": [{"severity": "critical"|"high"|"medium"|"low", "title": string, "impact": string, "recommendation": string}],
  "deliverables": {
    "landingPageScores": {
      "loadSpeed": number,
      "aboveFoldClarity": number,
      "headlineStrength": number,
      "socialProof": number,
      "ctaClarity": number,
      "formFriction": number,
      "trustSignals": number,
      "messageMatch": number
    },
    "headlineRewrites": [string, string, string],
    "ctaRewrites": [string, string, string],
    "funnelMap": {
      "tofu": {
        "status": "Present"|"Partial"|"Missing",
        "currentState": string,
        "recommendedAdType": string,
        "recommendedContent": [string],
        "audienceApproach": string,
        "gaps": [string]
      },
      "mofu": {
        "status": "Present"|"Partial"|"Missing",
        "currentState": string,
        "recommendedOffer": string,
        "retargetingWindow": string,
        "pixelTrigger": string,
        "gaps": [string]
      },
      "bofu": {
        "status": "Present"|"Partial"|"Missing",
        "currentState": string,
        "stepsToConvert": number,
        "frictionPoints": [string],
        "recommendedOffer": string,
        "gaps": [string]
      }
    },
    "audienceRouting": [
      {"audienceType": string, "adObjective": string, "creative": string, "pixelEvent": string}
    ],
    "funnelBuildSequence": [{"step": number, "action": string, "impact": string, "effort": "Low"|"Medium"|"High"}],
    "conversionBlockers": [{"blocker": string, "impact": string, "fix": string}]
  }
}`,

  "ads-copy": (ctx) => `You are the ZieAds Expert Copywriter Agent. Generate platform-native ad copy that is ready to be pasted directly into Ads Manager — no templates, no placeholders, real finished copy.

BUSINESS CONTEXT:
- URL: ${ctx.url}
- Business: ${ctx.businessName || ctx.scrapedData.title}
- Type: ${ctx.businessType || ctx.scrapedData.inferredBusinessType}
- Goal: ${ctx.primaryGoal}
- Hero Offer: ${ctx.scrapedData.heroOffer}
- Primary CTA: ${ctx.scrapedData.primaryCTA}
- H1 Headline: ${ctx.scrapedData.h1}
- Meta Description: ${ctx.scrapedData.metaDescription}
- Key Headings: ${ctx.scrapedData.headings.slice(0, 6).map(h => h.text).join('; ')}

INSTRUCTIONS:
- Write copy that is specific to THIS business — no generic filler
- Use psychological triggers: urgency, social proof, specificity, loss aversion, aspiration
- Each platform must feel native to that platform's audience and format
- Google headlines must be ≤30 chars, descriptions ≤90 chars
- Meta primary texts: write 3 variants (short ~50 words, medium ~100 words, long ~150 words)
- TikTok: write 3 full video script outlines with a strong first-3-second hook

RESPOND WITH VALID JSON ONLY:
{
  "dimension": "Creative & Offer",
  "score": 100,
  "findings": [],
  "analysis": {
    "strategy": "Full copywriting strategy for this business including psychological angle and positioning",
    "toneOfVoice": "Specific tone description with examples of voice choices",
    "keySellingPoints": ["Specific benefit 1 from the page", "Specific benefit 2", "Specific benefit 3", "Specific benefit 4"],
    "hooks": ["Hook angle 1", "Hook angle 2", "Hook angle 3"]
  },
  "deliverables": {
    "googleAds": {
      "headlines": ["Headline ≤30 chars #1", "Headline ≤30 chars #2", "Headline ≤30 chars #3", "Headline ≤30 chars #4", "Headline ≤30 chars #5"],
      "descriptions": ["Description ≤90 chars #1", "Description ≤90 chars #2", "Description ≤90 chars #3"],
      "sitelinks": [{"text": "Sitelink text", "description": "One-line sitelink description"}]
    },
    "metaAds": {
      "shortBody": "~50-word primary text variant for mobile feed",
      "mediumBody": "~100-word primary text variant with more context",
      "longBody": "~150-word primary text variant for high-intent audiences",
      "headlines": ["Feed headline 1", "Feed headline 2", "Feed headline 3"],
      "primaryTexts": ["Primary text variant 1 (full text)", "Primary text variant 2 (full text)", "Primary text variant 3 (full text)"]
    },
    "tiktokAds": {
      "scriptOutlines": [
        {"hook": "First 3 seconds: specific hook line spoken to camera", "body": "15-second body content description", "cta": "Closing CTA line"},
        {"hook": "Alternative hook angle", "body": "Alternative body content", "cta": "Alternative CTA"},
        {"hook": "Third hook variant", "body": "Third body content", "cta": "Third CTA"}
      ],
      "captions": ["TikTok caption with hashtags for variant 1", "TikTok caption with hashtags for variant 2"]
    },
    "linkedinAds": {
      "sponsoredContent": [
        {"intro": "150-char intro text", "headline": "LinkedIn headline", "description": "LinkedIn description"},
        {"intro": "Alternative intro", "headline": "Alternative headline", "description": "Alternative description"}
      ],
      "messageAds": [{"subject": "InMail subject line", "body": "Full InMail body copy (200 words)"}]
    }
  }
}`,

  "ads-landing": (ctx) => `You are the ZieAds Landing Page CRO Agent. Audit this landing page across 8 conversion dimensions specifically for paid traffic performance.

BUSINESS CONTEXT:
- URL: ${ctx.url}
- Page Title: ${ctx.scrapedData.title}
- Headline (H1): ${ctx.scrapedData.h1}
- Meta Description: ${ctx.scrapedData.metaDescription}
- Primary CTA: ${ctx.scrapedData.primaryCTA}
- Hero Offer: ${ctx.scrapedData.heroOffer}
- Load Time: ${ctx.scrapedData.pageLoadTime}ms
- Detected Pixels: ${JSON.stringify(ctx.scrapedData.detectedPixels)}
- Key Headings: ${ctx.scrapedData.headings.slice(0, 8).map(h => `${h.tag}: ${h.text}`).join('; ')}

AUDIT THESE 8 DIMENSIONS (score each 0-100):
1. Above-the-fold clarity — does the headline immediately communicate the offer to a cold visitor?
2. Headline strength — specificity, benefit orientation, curiosity or urgency
3. CTA effectiveness — button copy, placement, contrast, number of CTAs
4. Message match — does the page match what paid ad copy would promise? (score lower if generic)
5. Social proof — testimonials, reviews, logos, numbers visible on page
6. Friction level — form fields, steps, unnecessary friction before conversion (100 = zero friction)
7. Page speed — based on load time (under 2000ms = 100, 2000-3000ms = 70, over 3000ms = 40)
8. Mobile readiness — infer from layout signals and CTA placement

Overall score = weighted average (clarity 20%, headline 15%, CTA 15%, message match 20%, social proof 10%, friction 10%, speed 5%, mobile 5%).

RESPOND WITH VALID JSON ONLY:
{
  "dimension": "Landing Page Conversion",
  "score": number,
  "findings": [{"severity": "critical"|"high"|"medium"|"low", "title": string, "impact": string, "recommendation": string}],
  "deliverables": {
    "croScores": {
      "aboveFoldClarity": number,
      "headlineStrength": number,
      "ctaEffectiveness": number,
      "messageMatch": number,
      "socialProof": number,
      "frictionLevel": number,
      "pageSpeed": number,
      "mobileReadiness": number
    },
    "headlineRewrites": ["Rewritten headline option 1 — specific and benefit-driven", "Rewritten headline option 2 — urgency angle", "Rewritten headline option 3 — social proof angle"],
    "ctaOptimizations": ["Specific CTA copy suggestion 1 with placement note", "CTA suggestion 2", "CTA suggestion 3"],
    "trustSignalGaps": ["Missing trust element 1 (e.g. no testimonials visible)", "Missing trust element 2", "Missing trust element 3"],
    "quickWins": ["30-minute fix #1", "30-minute fix #2", "30-minute fix #3"],
    "messagingRecommendations": "Detailed paragraph on how to align the page messaging with paid ad copy for better message match"
  }
}`,

  "ads-google": (ctx) => `You are the ZieAds Google Ads Strategist Agent. Build a full Google Ads strategy across Search, Shopping (if applicable), and Display — with campaign structure, keywords, ad copy, bidding, and audience layers.

BUSINESS CONTEXT:
- URL: ${ctx.url}
- Business: ${ctx.businessName || ctx.scrapedData.title}
- Type: ${ctx.businessType || ctx.scrapedData.inferredBusinessType}
- Goal: ${ctx.primaryGoal}
- Monthly Budget: ${ctx.monthlyBudget}
- Hero Offer: ${ctx.scrapedData.heroOffer}
- Primary CTA: ${ctx.scrapedData.primaryCTA}
- H1: ${ctx.scrapedData.h1}
- Meta Description: ${ctx.scrapedData.metaDescription}
- Key Headings: ${ctx.scrapedData.headings.slice(0, 6).map(h => h.text).join('; ')}
- E-commerce: ${ctx.scrapedData.businessSignals.hasEcommerce}
- Detected Pixels: ${ctx.scrapedData.detectedPixels.join(", ") || "None"}

DELIVERABLES REQUIRED:

1. SEARCH CAMPAIGN STRATEGY:
   - Campaign structure (3–4 campaigns with ad groups)
   - For each campaign: name, match type approach, budget allocation, key ad groups
   - Keyword strategy: 3–4 intent buckets (branded, competitor, category, problem-aware)
   - 5–8 keywords per bucket with estimated search volumes where possible
   - Negative keyword list (20+ terms to prevent wasted spend)
   - RSA (Responsive Search Ad) copy: 5 headlines + 3 descriptions per campaign
   - Bidding strategy recommendation: when to use manual CPC vs. Target CPA vs. Max Conversions

2. SHOPPING CAMPAIGN (only if e-commerce detected):
   - Shopping campaign structure (Standard Shopping + Performance Max)
   - Feed optimization recommendations (title, description, image priority)
   - Bidding: Target ROAS starting point for this industry
   - Audience layers for Smart Shopping

3. DISPLAY / REMARKETING CAMPAIGN:
   - Audience targeting for display (in-market, affinity, custom intent, remarketing)
   - Creative sizing recommendations (300x250, 728x90, 300x600, responsive)
   - Ad copy angles for each audience type
   - Frequency cap recommendations
   - Placement exclusions (mobile apps, low-quality placements)

4. GOOGLE AUDIENCE LAYERS:
   - Customer match segments
   - In-market audiences to layer on Search
   - Similar audiences and observation vs. targeting mode

5. PERFORMANCE MAX CAMPAIGN (if budget > $3000/mo):
   - Asset group structure
   - Signal audiences to provide
   - Headline and description assets (10 headlines, 4 descriptions)

Score Google Ads readiness 0-100.

RESPOND WITH VALID JSON ONLY:
{
  "dimension": "Google Ads Strategy",
  "score": number,
  "findings": [{"severity": "critical"|"high"|"medium"|"low", "title": string, "impact": string, "recommendation": string}],
  "deliverables": {
    "searchCampaigns": [
      {
        "campaignName": string,
        "type": "Search",
        "budgetAllocation": string,
        "budgetDollars": string,
        "matchTypeApproach": string,
        "biddingStrategy": string,
        "adGroups": [{"name": string, "theme": string, "sampleKeywords": [string]}]
      }
    ],
    "keywordBuckets": [
      {
        "category": "Branded"|"Competitor"|"Category"|"Problem-Aware"|"Solution-Aware",
        "intent": string,
        "keywords": [string],
        "matchTypes": string,
        "bidModifier": string
      }
    ],
    "negativeKeywords": [string],
    "rsaCopyBankSearch": {
      "headlines": [string],
      "descriptions": [string],
      "pinnedHeadline1": string
    },
    "shoppingCampaign": {
      "applicable": boolean,
      "structure": string,
      "feedOptimizationTips": [string],
      "targetROAS": string,
      "audienceLayers": [string]
    },
    "displayRemarketing": {
      "audienceSegments": [{"segment": string, "adAngle": string, "frequencyCap": string}],
      "creativeSizes": [string],
      "placementExclusions": [string],
      "remarketing30Day": string,
      "remarketing7Day": string
    },
    "audienceLayers": {
      "customerMatch": string,
      "inMarketSegments": [string],
      "customIntent": [string],
      "observationVsTargeting": string
    },
    "performanceMax": {
      "applicable": boolean,
      "assetGroups": [string],
      "signalAudiences": [string],
      "headlines": [string],
      "descriptions": [string]
    },
    "budgetBreakdown": {
      "search": string,
      "shopping": string,
      "display": string,
      "performanceMax": string
    }
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

  // Quick Scan — fast 60-second readiness check, not the full creative-intelligence agent
  "ads-quick": (ctx) => `You are the ZieAds Quick Scan Agent. Run a fast 60-second paid ads readiness check on this business. Flag the 3 most critical issues stopping them from running profitable ads RIGHT NOW.

BUSINESS CONTEXT:
- URL: ${ctx.url}
- Business: ${ctx.businessName || ctx.scrapedData.title}
- Type: ${ctx.businessType || ctx.scrapedData.inferredBusinessType}
- H1: ${ctx.scrapedData.h1}
- Primary CTA: ${ctx.scrapedData.primaryCTA}
- Hero Offer: ${ctx.scrapedData.heroOffer}
- Meta Description: ${ctx.scrapedData.metaDescription}
- Load Time: ${ctx.scrapedData.pageLoadTime}ms
- Detected Pixels: ${JSON.stringify(ctx.scrapedData.detectedPixels)}
- Key Headings: ${ctx.scrapedData.headings.slice(0, 4).map(h => h.text).join('; ')}

CHECK THESE 5 READINESS SIGNALS:
1. Tracking & Pixels — Meta Pixel, Google Tag, TikTok Pixel present?
2. Offer Clarity — is the hero offer specific, compelling, and immediately visible?
3. Landing Page Speed — is the page fast enough for paid traffic (goal: under 2.5 seconds)?
4. CTA Strength — is there a clear, prominent call-to-action?
5. Ad Readiness — does the page have enough content to run quality ads?

Give an overall readiness score and 3 prioritised findings. Be direct and specific — name the exact problem, not generic advice.

RESPOND WITH VALID JSON ONLY:
{
  "dimension": "Ads Readiness",
  "score": number,
  "findings": [{"severity": "critical"|"high"|"medium"|"low", "title": string, "impact": string, "recommendation": string}],
  "deliverables": {
    "signals": {
      "trackingPixels": {"status": "pass"|"warn"|"fail", "score": number, "detail": string},
      "offerClarity": {"status": "pass"|"warn"|"fail", "score": number, "detail": string},
      "pageSpeed": {"status": "pass"|"warn"|"fail", "score": number, "detail": string},
      "ctaStrength": {"status": "pass"|"warn"|"fail", "score": number, "detail": string},
      "adReadiness": {"status": "pass"|"warn"|"fail", "score": number, "detail": string}
    },
    "topPriority": "Single most important thing to fix before spending any ad budget",
    "estimatedReadinessGrade": "A"|"B"|"C"|"D"|"F",
    "readyToRun": boolean,
    "platformRecommendation": "Which ad platform to start with and why (1 sentence)"
  }
}`,
  "quick": (ctx) => AGENT_PROMPTS["ads-quick"](ctx),
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
