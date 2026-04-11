# ZieAds.com — Product Requirements Document
## AI Paid Ads Strategy Agent for Marketers
**Version:** 2.0 — Full Workflow Edition
**Date:** April 2026
**Status:** Draft for Review
**Author:** Product Team

---

## Table of Contents

1. Executive Summary
2. Problem Statement & Opportunity
3. Product Vision & Goals
4. Target Users & Personas
5. Core Features & Skill Architecture
6. Full User Journey & Workflow
   - 6.1 Phase 1: Discovery & First Touch
   - 6.2 Phase 2: Sign-Up & Onboarding
   - 6.3 Phase 3: First Full Audit
   - 6.4 Phase 4: Reading & Acting on the Report
   - 6.5 Phase 5: Daily Use — The Ads Maintenance Loop
   - 6.6 Phase 6: Weekly Rhythm
   - 6.7 Phase 7: Monthly Strategic Review
   - 6.8 Phase 8: Growth & Upgrade Loop
7. Persona-Specific Daily Workflows
   - 7.1 In-House Performance Marketer
   - 7.2 Freelancer / Agency Builder
   - 7.3 Business Owner / Founder
8. Agent Architecture & Technical Workflow
   - 8.1 Full Audit Agent Pipeline (`/ads audit`)
   - 8.2 Individual Skill Workflows
   - 8.3 Score Improvement Loop
9. Skill Modules (Detailed)
10. Technical Architecture
11. User Interface & Experience
12. Monetization & Pricing
13. Success Metrics
14. Roadmap & Milestones
15. Risks & Mitigations
16. Appendix A: Skill File Template
17. Appendix B: Competitive Landscape
18. Appendix C: Daily Workflow Quick Reference Card

---

## 1. Executive Summary

**ZieAds.com** is a SaaS AI Ads Agent that helps marketers, freelancers, and agency owners build complete, data-backed paid advertising strategies in minutes — not days.

Inspired by the open-source `ai-marketing-claude` architecture (15 parallel skill agents for marketing analysis), ZieAds focuses exclusively on **paid ads**: Meta Ads, Google Ads, TikTok Ads, LinkedIn Ads, and YouTube Ads. Given a business URL, product, or brief, ZieAds deploys multiple AI agents in parallel to produce a ready-to-execute ads strategy including audience targeting, creatives, copy, budget allocation, funnel mapping, and competitor intelligence — all delivered as a polished, client-ready PDF report.

**Core value proposition:** What a paid ads agency charges $3,000–$10,000/month to strategize, ZieAds does in under 3 minutes for a fraction of the cost.

**How users use it every day:** ZieAds is not a one-time audit tool. It is a daily operating system for paid advertising. The product is designed around three recurring rhythms — a 20-minute daily check-in, a 15-minute weekly full re-audit, and a 1-hour monthly strategic review — that together ensure a user's ads setup continuously improves. The central measure of progress is the **Paid Ads Readiness Score** (0–100), which rises each week as users fix findings and implement recommendations. Every skill command in ZieAds is designed to fix one specific dimension of that score.

---

## 2. Problem Statement & Opportunity

### The Pain

**For in-house marketers:**
- Building a paid ads strategy from scratch takes 8–20 hours per campaign
- Competitor research, audience sizing, creative briefs, and copy are each separate, specialized tasks with no unified tool to handle them
- Most marketers lack simultaneous expertise across Meta, Google, TikTok, and LinkedIn
- When a campaign underperforms, diagnosing the cause (bad creative? wrong audience? weak landing page?) takes days of manual analysis

**For freelancers & agency owners:**
- Client onboarding strategy decks take 2–3 full days to produce manually
- Winning pitches require deep research that is impossible to scale across many clients simultaneously
- Delivering consistent quality across 10+ clients without a large team is a structural problem
- Client reporting takes 3–4 hours per client per month that could be spent on execution

**For small business owners:**
- Cannot afford agencies ($3K–$10K/month retainer)
- Do not know where to start with paid ads — which platform, what budget, what to say
- No visibility into what competitors are doing or spending
- No way to know if their landing pages are actually ready to receive paid traffic

### The Opportunity

The global digital advertising market exceeds $600B and grows 12–15% annually. Yet the tooling for *strategy* — the most valuable and time-intensive part of running ads — is fragmented, manual, or locked inside expensive agency retainers. Tools like Semrush and AdEspresso focus on management and reporting, not strategy generation. ZieAds bridges this gap with an AI-native, agent-based workflow that mirrors what the best ad agencies actually do, delivered at a price point accessible to any business.

The adjacent proof point is the `ai-marketing-claude` open-source project, which generated 697 GitHub stars and 286 forks within weeks of launch — validating enormous demand for AI-powered marketing strategy tools that any user can run themselves.

---

## 3. Product Vision & Goals

**Vision:** Be the AI co-pilot that makes any marketer perform like a world-class paid ads agency.

**Product Goals (Year 1):**
- Reduce time to produce a complete paid ads strategy from 20 hours to under 5 minutes
- Enable any user (marketer, founder, freelancer) to produce agency-quality deliverables without specialized knowledge
- Generate 25,000 strategy reports in the first 12 months
- Achieve $500K ARR within 18 months of launch

**Design Principles:**
- One URL or brief in → a complete, execution-ready strategy out
- No login-to-value friction — users see real output before encountering a paywall
- Every output is immediately usable, not just analysis but paste-ready copy, brief-ready creative directions, and plug-in budget models
- Parallel agent architecture for speed — full audit results in under 3 minutes
- Score-driven habit loop — the Paid Ads Readiness Score creates a measurable reason to return every week

---

## 4. Target Users & Personas

### Persona 1: The In-House Performance Marketer
- **Who:** Marketing manager or growth lead at a Series A–C startup or mid-market company. Responsible for all paid channels with a $5K–$50K/month budget. May manage one or two junior team members.
- **Current reality:** Spends Monday to Friday juggling campaign management in Ads Manager, writing copy in a Google Doc, briefing designers over Slack, and doing competitive research on Friday afternoons when they can. Strategy happens reactively, not proactively.
- **Pain:** Has limited time, no agency budget, needs to launch campaigns fast and defend results to the CMO every week.
- **Job to be done:** Get a full strategy for a new product launch across 2–3 platforms in an afternoon, not a week.
- **ZieAds value:** Opens ZieAds each morning, runs a quick scan on any new landing page before sending traffic to it, uses the daily digest to catch performance issues before they become expensive, and generates platform-ready copy and creative briefs in minutes instead of hours.
- **Daily ZieAds usage:** 20–35 minutes per day across morning check, midday skill commands, and end-of-day landing page or competitor checks.

### Persona 2: The Freelance Ads Strategist
- **Who:** Freelancer or small agency owner running paid ads for 3–10 clients simultaneously. Monthly revenue $5K–$25K. Works alone or with 1–2 contractors.
- **Current reality:** Onboarding a new client takes 2–3 days of strategy work: audit their existing ads, research competitors, define audiences, write the first batch of copy, build the funnel map, create a media plan. This is the work that limits how many clients they can take on.
- **Pain:** Every hour spent on strategy creation is an hour not spent on execution or new business. Quality is inconsistent because deep research gets compressed when juggling multiple clients.
- **Job to be done:** Produce a professional, client-ready strategy package for a new client in under 2 hours, not 2 days.
- **ZieAds value:** Runs a full audit and generates a white-label PDF before every new client call. Uses the free audit cold-outreach flywheel to land new clients: run a free audit on a prospect, send the PDF as a gift, book a call. Produces 10+ client deliverables per day that previously took days each.
- **Daily ZieAds usage:** 1–2 hours per day on client deliverables, plus 30 minutes on prospecting.

### Persona 3: The AI Agency Builder
- **Who:** Building an AI-powered marketing agency from scratch. May come from a marketing background or be a tech-savvy entrepreneur who identified the opportunity. Monthly revenue goal: $20K–$100K within 12 months.
- **Current reality:** Has the hustle and the AI tool knowledge but lacks the productized delivery system. Each client engagement is still somewhat bespoke and time-consuming to set up.
- **Pain:** Cannot scale revenue without productizing deliverables. Needs a systematic, repeatable process that produces consistent quality across every client without building infrastructure from scratch.
- **Job to be done:** White-label-ready strategy reports and deliverables to sell as a premium agency service, priced at $2K–$5K/month per client.
- **ZieAds value:** Agency tier with team seats, white-label PDFs, client management dashboard, and API access. Can run 10+ full client audits per day, each producing a professional deliverable. The economics: $199/month for unlimited audits, sold to clients at $500–$2,000 per audit or wrapped into a $3K/month retainer.
- **Daily ZieAds usage:** 2–4 hours per day across client deliverables, new business prospecting, and client reporting.

### Persona 4: The Growth-Stage Business Owner
- **Who:** SMB owner spending $1K–$10K/month on ads but unsure if the strategy is right. Has a business running, is not a marketing expert, and relies on contractors or trial-and-error for paid ads.
- **Current reality:** Pays an agency or freelancer for ads but does not fully understand what they are doing or whether it is working. Alternatively, runs ads themselves but feels like they are guessing. Score improvements are invisible because there is no consistent measurement framework.
- **Pain:** Does not know what competitors are doing, whether the landing pages are actually ready for paid traffic, or where the budget should go across platforms.
- **Job to be done:** Understand the current state of their ads setup, see what is wrong, and get a clear prioritized list of what to fix — without needing to become a marketing expert.
- **ZieAds value:** Runs a full audit once, gets a score (e.g. 54/100), reads the Critical findings, and works through the prioritized action plan week by week. Every Monday, re-runs the audit and watches the score rise. The score is the one number that tells them if their ads are getting healthier or weaker.
- **Weekly ZieAds usage:** 20–30 minutes per week, primarily the Monday full re-audit and action checklist review.

---

## 5. Core Features & Skill Architecture

ZieAds is built on a **skill-based agent architecture** directly inspired by the `ai-marketing-claude` open-source repo. Each skill is a focused AI agent that carries deep expertise in one domain of paid advertising. Skills are stored as `SKILL.md` markdown files that give Claude precise instructions on what to analyze, how to score it, and what to output.

### Command Overview

| Command | What It Does | Time | Fixes Score Dimension |
|---------|-------------|------|----------------------|
| `/ads audit <url>` | Full paid ads strategy audit — 5 parallel agents | ~3 min | All 6 dimensions |
| `/ads quick <url>` | 60-second ads readiness snapshot | ~30 sec | Overview only |
| `/ads creatives <url>` | Generate ad creative briefs for all platforms | ~2 min | Creative & Offer |
| `/ads copy <url>` | Platform-specific ad copy (headlines, body, CTA) | ~2 min | Creative & Offer |
| `/ads audiences <url>` | Audience targeting strategy across all platforms | ~2 min | Audience Clarity |
| `/ads competitors <url>` | Competitive ad intelligence report | ~3 min | Competitive Positioning |
| `/ads funnel <url>` | Map TOFU / MOFU / BOFU with channel strategy | ~2 min | Funnel Coverage |
| `/ads budget <url>` | Budget allocation model by platform and funnel stage | ~2 min | Platform Fit |
| `/ads landing <url>` | Landing page CRO audit for paid traffic | ~2 min | Landing Page Conversion |
| `/ads google <url>` | Google Ads-specific full strategy | ~2 min | Platform Fit |
| `/ads meta <url>` | Meta Ads-specific full strategy | ~2 min | Platform Fit |
| `/ads tiktok <url>` | TikTok Ads strategy + creative direction | ~2 min | Creative & Offer |
| `/ads linkedin <url>` | LinkedIn Ads strategy (B2B) | ~2 min | Platform Fit |
| `/ads report <url>` | Full strategy report (Markdown) | ~3 min | — |
| `/ads report-pdf <url>` | Professional strategy report (PDF) | ~4 min | — |

---

## 6. Full User Journey & Workflow

This section describes the complete lifecycle of a ZieAds user from first touch through long-term daily use. Each phase maps to specific product screens, user actions, and ZieAds skill commands.

---

### 6.1 Phase 1: Discovery & First Touch

**User state:** Has never heard of ZieAds. Encounters it through one of several acquisition channels.

**Acquisition channels:**
- Organic search: "AI paid ads strategy tool", "how to audit my ads for free"
- Social content: Founder or affiliate posts a demo video showing the Quick Scan working on a real website
- Referral: A colleague or client mentions receiving a ZieAds PDF audit as a free gift from a freelancer
- Direct: Finds the open-source inspiration project and discovers ZieAds is the productized version
- Cold outreach: A freelancer sends them a free ZieAds PDF audit of their own website (the outreach flywheel)

**User action:** Lands on ZieAds homepage. Sees the hero section: a URL input field and the headline "Get a complete paid ads strategy in under 3 minutes." No sign-up required to start.

**What happens:**
1. User types their business URL (or a competitor's URL they want to analyze) into the input field
2. Clicks "Run Free Quick Scan"
3. ZieAds scrapes the page, checks for pixel presence, scores 5 key readiness signals
4. In 30 seconds, a one-page result appears showing: overall score, 3 critical findings, and a blurred teaser of the full audit ("5 more critical findings found — unlock to see")
5. An email capture prompt appears: "Enter your email to save your results and run your first full audit free"

**User decision point:** The Quick Scan result is real, specific, and useful. If it found a missing Meta Pixel or a broken CTA button, the user sees this immediately. This is the primary conversion moment: from anonymous visitor to registered user.

**Conversion path:** User enters email → receives verification link → account created → routed to Onboarding Wizard.

---

### 6.2 Phase 2: Sign-Up & Onboarding

**User state:** Just created an account. Has seen their Quick Scan result. Wants to run a full audit.

**Onboarding wizard (3 steps, under 2 minutes):**

**Step 1 — Business context**
- Input: Business name, website URL (pre-filled from Quick Scan if applicable)
- Input: Business type selector: E-commerce / SaaS / Local Business / B2B Lead Gen / Creator / Other
- Input: Primary advertising goal: Drive sales / Generate leads / App installs / Brand awareness / Event registrations

**Step 2 — Budget & platform context**
- Input: Monthly ads budget range: Under $1K / $1K–$5K / $5K–$20K / $20K–$100K / Over $100K
- Input: Platforms currently using (multi-select): Meta / Google / TikTok / LinkedIn / YouTube / None yet
- Input: Biggest current challenge (optional free text): "What's your #1 frustration with your ads right now?"

**Step 3 — What ZieAds will do**
- A brief explanation of how the full audit works: 5 agents, 6 dimensions scored, ~3 minutes
- A preview of the PDF report format
- CTA: "Run My First Full Audit →"

**What the onboarding wizard produces:** A `businessContext` object that is passed to all future skill commands, personalizing results. A SaaS company gets B2B-weighted analysis. An e-commerce brand gets shopping feed and ROAS-focused analysis. A local business gets location-targeting and Google Business Profile integration analysis.

---

### 6.3 Phase 3: First Full Audit

**User state:** Has completed onboarding. Clicks "Run My First Full Audit." This is the first full deployment of the 5-agent parallel pipeline.

**What the user sees (live progress screen):**

The screen shows 5 agent status cards, each with a name, description, and live status indicator:

```
Agent 1: Ad Creative Intelligence    [■■■■■■░░░░] Running...
Agent 2: Audience & Targeting        [■■■░░░░░░░] Running...
Agent 3: Competitive Intelligence    [■■■■■■■░░░] Running...
Agent 4: Platform & Budget Strategy  [■■░░░░░░░░] Running...
Agent 5: Funnel & Conversion         [■■■■░░░░░░] Running...

Overall progress: 47%  ·  Estimated time remaining: 1m 32s
```

Micro-copy beneath each agent gives a real-time status update:
- "Agent 1 is analyzing your brand visual identity and identifying your hero offer..."
- "Agent 3 is scanning competitor ad presence signals across Meta, Google, and TikTok..."

When all 5 agents complete, a synthesis step runs (15–20 seconds), calculating the weighted score and ranking findings by severity.

**Total time: 2–3 minutes for a typical website.**

---

### 6.4 Phase 4: Reading & Acting on the Audit Report

**User state:** Full audit complete. Lands on the Report Dashboard.

**Report Dashboard layout:**

The dashboard has three zones:

**Zone A — Score Header (always visible)**
A large score badge at the top showing the Paid Ads Readiness Score (e.g. "64/100 — Grade C") with a color-coded grade indicator (red below 50, amber 50–69, green 70+). Below the score, six dimension scores are displayed as a horizontal row of smaller badges, one per dimension. Any dimension below 60 is shown in amber; below 40 in red.

**Zone B — Critical Findings Panel (pinned below score)**
A collapsible panel showing all findings ranked by severity. Each finding shows:
- Severity badge: CRITICAL / HIGH / MEDIUM / LOW
- Finding title (e.g. "Meta Pixel not detected on checkout page")
- One-line impact explanation (e.g. "You cannot run retargeting campaigns without this. Estimated lost revenue: high.")
- One-line fix recommendation (e.g. "Install Meta Pixel via Google Tag Manager. See our guide →")
- A checkbox: "Mark as fixed"

Users work through this checklist over time. When they fix an item and re-run the audit, the finding disappears and the score rises.

**Zone C — Strategy Tabs (full detail)**
Seven tabs, each representing a skill output:
- Overview (executive summary and action plan)
- Creatives (creative briefs and concepts per platform)
- Audiences (targeting matrix by platform)
- Platforms (platform-by-platform strategy and campaign structure)
- Funnel (TOFU/MOFU/BOFU map and gap analysis)
- Competitors (competitive landscape map)
- Budget (allocation model and benchmark KPIs)

**PDF Export:**
A prominent "Download PDF Report" button above the fold. Clicking it generates a professionally formatted PDF using the `ads-report-pdf` skill, rendering the full report with cover page, score cards, tables, and action plan. Free tier: ZieAds watermark. Pro/Agency tier: white-label with no branding.

---

### 6.5 Phase 5: Daily Use — The Ads Maintenance Loop

**Core insight:** Most paid ads problems are not strategic errors — they are operational drift. A landing page slows down. A competitor launches a new offer. An ad set gets fatigued. A pixel fires incorrectly after a site update. ZieAds catches these problems through daily use before they become expensive.

**The daily habit loop has three moments:**

**Morning (8:00–8:20am) — Check-in and prioritize**

1. User opens ZieAds or reads the weekly digest email (sent every Monday)
2. Digest shows: score change vs. last week, top 3 alerts since the last audit, competitor activity flags, and today's top-priority action from the checklist
3. If any new landing pages are scheduled to receive traffic today, the user runs `/ads quick [URL]` — a 30-second readiness check that catches broken pixels, missing CTAs, or slow load times before spend begins
4. User reviews the action checklist and selects 1–2 items to complete today

**Midday (12:00–12:30pm) — Build and execute**

Depending on what is being worked on, the user runs one or two targeted skill commands:

- Writing new ads? Run `/ads copy [URL]` → get platform-ready copy to paste directly into Ads Manager
- Briefing a designer? Run `/ads creatives [URL]` → get 3 creative concepts per platform with visual direction, hook, format, and emotional angle
- Launching on a new platform? Run `/ads meta [URL]` or `/ads google [URL]` → get a complete platform-specific campaign structure and audience strategy
- Building a media plan? Run `/ads budget [URL]` → get a platform allocation table with benchmark CPA/ROAS by industry

**End of day (4:30–5:00pm) — Diagnose and log**

- If a campaign underperformed today: run `/ads landing [URL]` on the destination page → ZieAds scores it across 8 dimensions and identifies the exact conversion blocker
- If a competitor appears to have launched something new: run `/ads competitors [URL]` → ZieAds maps their offer, positioning, and likely ad strategy
- Mark completed checklist items as done
- Note: the score does not update in real time — it updates on the next full audit run (recommended weekly)

---

### 6.6 Phase 6: Weekly Rhythm

**The weekly rhythm is the backbone of ZieAds usage.** It ensures the Paid Ads Readiness Score moves upward week over week, creating a measurable feedback loop that motivates continued use.

**Monday — Full re-audit (15 minutes)**

Run `/ads audit [URL]` at the start of every week. The new score is compared automatically to last week's score. A delta indicator shows which dimensions improved and by how much (e.g. "Landing Page Conversion: +8 points — great improvement!"). Any new findings since last week appear at the top of the Critical Findings panel marked "New." This is the user's weekly scorecard.

**Wednesday — Content and copy planning (20 minutes)**

Mid-week is when users plan next week's ad creative and copy to stay ahead of creative fatigue. Run `/ads copy [URL]` to generate a fresh batch of ad copy variants. For businesses managing social alongside paid ads, run `/ads social [URL]` to generate a 7-day organic content calendar that aligns with the paid campaign themes.

**Friday — Client report or team review (30 minutes)**

For freelancers and agency builders: run `/ads report-pdf [URL]` for each active client. The white-label PDF goes to clients as a weekly deliverable — demonstrating ongoing value and justifying the monthly retainer. For in-house marketers: generate the PDF to present to the CMO or team lead as a weekly paid ads health report.

---

### 6.7 Phase 7: Monthly Strategic Review

**Once per month, users zoom out from daily execution and evaluate the big picture.** This review takes approximately 1 hour and involves three skill commands:

**Competitor re-scan**

Run `/ads competitors [URL]`. Competitor landscapes change monthly — new offers, new platforms, new creative angles. This scan maps all three tiers of competition (direct, indirect, aspirational), their estimated ad spend signals, platforms, and positioning. The output is compared to the previous month's scan to identify shifts. A competitor moving budget from Meta to TikTok is a strategic signal that ZieAds surfaces before the user feels it in their own CPCs.

**Budget reallocation**

Run `/ads budget [URL]`. As a business grows, the optimal budget split across platforms shifts. What works at $2K/month does not work at $20K/month. The budget skill recalculates the recommended allocation based on current platform fit, funnel coverage, and industry benchmarks. Users update their actual spend allocation in their ad accounts to match the recommendation.

**Funnel architecture review**

Run `/ads funnel [URL]`. Every month, the user's content, offers, and site evolve. The funnel skill re-maps TOFU/MOFU/BOFU coverage and identifies any new gaps. A business that launched a case study page last month now has better MOFU content — the funnel score reflects this improvement.

**Output of monthly review:** An updated PDF report that shows score trend over the last 3 months, the competitive landscape, the updated budget model, and the next 90-day strategic roadmap. This report serves as the monthly strategic planning document.

---

### 6.8 Phase 8: Growth & Upgrade Loop

**As users extract more value from ZieAds, usage patterns naturally drive them toward higher tiers.**

**Upgrade triggers:**
- Free user hits the 3 Quick Scan/month limit → prompted to upgrade to Starter ($29/month)
- Starter user hits the 10 full audit/month limit → prompted to upgrade to Pro ($79/month)
- Pro user managing multiple clients wants white-label PDFs and team seats → prompted to upgrade to Agency ($199/month)
- Agency user wants to build ZieAds into their own client portal via API → offered custom Enterprise pricing

**The freelancer cold-outreach flywheel (key growth mechanic):**

This is the most powerful acquisition loop in the product. A freelancer or agency builder uses ZieAds to land new clients by sending free audit PDFs as cold outreach gifts:

1. Identify a target business (local or online) that looks like it has budget for ads but weak ads setup
2. Run `/ads quick [prospect URL]` — if score is below 65, it is a warm lead
3. Run `/ads audit [prospect URL]` + `/ads report-pdf` — generate the full PDF (takes 4 minutes total)
4. Send the PDF cold with a message like: "I noticed a few things about your ads setup and put this together for you — no strings attached"
5. Prospect opens PDF, sees specific, valuable findings about their own business
6. Prospects books a call. Freelancer presents the full findings and proposes a $2K–$5K/month retainer
7. Client signed → freelancer runs ZieAds for them monthly as part of the retainer
8. Freelancer's ZieAds subscription cost: $79–$199/month. Revenue from each client: $24K–$60K/year.

This flywheel is a core part of ZieAds' go-to-market strategy. Every Agency-tier user is simultaneously an acquisition channel.

---

## 7. Persona-Specific Daily Workflows

### 7.1 In-House Performance Marketer — Daily Workflow

This persona uses ZieAds defensively: to prevent problems from wasting budget, to move faster on creative and copy production, and to stay ahead of the competitive landscape without spending hours on research.

**A typical Tuesday:**

8:05am — Opens ZieAds dashboard. Sees the weekly digest from Monday's audit: score is 71/100, up 4 points from last week. Two new findings since last week: "Ad copy on Meta campaigns uses generic benefit language — no specific numbers or social proof" and "Competitor X launched a new free trial offer last week." Marks both as items to address today.

8:15am — A new landing page for the Q2 product launch campaign is going live today. Runs `/ads quick [new landing page URL]`. Result in 30 seconds: score 82/100, one medium finding — "Page load time 3.4 seconds on mobile — above the 3-second threshold for paid traffic." Sends the finding to the dev team immediately. Traffic will not go to the page until load time is fixed.

12:10pm — Ready to write the next batch of Meta ads for the Q2 campaign. Runs `/ads copy [product URL]`. ZieAds generates: 3 Meta primary text variants (short, medium, long), 5 headline options, 3 link descriptions. Copies the medium variant and the top headline into the Meta Ads Manager draft. Writes a slight brand-voice edit on top. Total time: 12 minutes vs. 90 minutes of blank-page writing.

12:25pm — Needs a creative brief for the designer producing the new video ads. Runs `/ads creatives [product URL]`. Gets 3 video concept briefs for Meta, each with: hook line, visual direction, format (Reels-style UGC), emotional angle (aspiration + social proof), and CTA. Pastes into a Notion brief and shares with the designer. Total time: 8 minutes.

4:45pm — Checks Ads Manager. The Google Search campaign CTR dropped 18% vs. last week on the main product keyword. Runs `/ads landing [destination URL]`. ZieAds flags: "Headline above the fold does not match the search ad copy — low message match causing high bounce rate." Writes a new headline that mirrors the ad copy. Schedules the change for tomorrow. Total time: 6 minutes to diagnose and resolve vs. 45 minutes of manual analysis.

**Total ZieAds usage on this Tuesday: 26 minutes across 4 skill commands. Prevented one misfired campaign, produced two deliverables (copy + brief), and diagnosed one performance issue.**

---

### 7.2 Freelancer / Agency Builder — Daily Workflow

This persona uses ZieAds offensively: to produce client deliverables at scale, to prospect for new business using free audits, and to look like an expert in every client call through preparation.

**A typical Thursday:**

8:00am — Has a prospecting target list of 5 local med spas identified yesterday (this niche has high ad budgets and often poor digital marketing). Runs `/ads quick` on each. Three score below 65 — warm leads. Picks the best prospect (score 54/100, multiple critical findings visible in the teaser). Runs the full `/ads audit` + `/ads report-pdf` on that prospect. Takes 7 minutes total. Downloads the white-label PDF with the agency's branding.

8:45am — Writes a 3-sentence cold email: "Hi [Owner], I ran a quick analysis of your ads setup and found a few things worth flagging — attaching it. Happy to hop on a 15-minute call if it's useful. No pitch, just sharing what I found." Sends the PDF as an attachment. Does this for the two other warm leads. Total time per outreach: 12 minutes each.

10:30am — Client A has a strategy call at 11am for a new product they are launching. Runs `/ads audit [client A URL]` focused on the new product landing page. Gets the updated report. Runs `/ads competitors [client A URL]` for fresh competitive intelligence. Arrives at the call with a scored PDF, a competitor map, and a prioritized recommendation list. Client says "wow, how did you do this so fast?" — the standard response to this workflow.

11:00am — Client A call. Walks through the audit findings. Proposes a 3-month campaign plan using the ZieAds action plan as the roadmap. Client approves. Scope is defined in the audit.

1:30pm — Client B monthly deliverable. Runs `/ads audit [client B URL]` + `/ads report-pdf`. Score is 79/100, up from 71/100 last month — 8-point improvement from the work done this month. The PDF shows a score trend chart. Emails the PDF to the client with a 3-sentence summary of this month's wins and next month's focus. Client management time: 15 minutes.

3:00pm — Client C needs a new round of Google Search ads copy. Runs `/ads google [client C URL]` + `/ads copy [client C URL]`. Gets: 15 ad headlines, 4 descriptions, 3 sitelink extensions. Sends to client as a Google Doc. Copywriting deliverable produced in 4 minutes.

**Total ZieAds usage on this Thursday: 55 minutes. Produced: 3 cold outreach PDFs (new business), 1 strategy briefing for a client call, 1 monthly client report PDF, 1 Google Ads copy document. A full day of agency deliverables from under an hour of ZieAds time.**

---

### 7.3 Business Owner / Founder — Weekly Workflow

This persona uses ZieAds weekly, not daily. They are not marketing experts and do not want to become one. They want one number to track, one list of things to fix, and confidence that their ads are not being wasted.

**Week 1 — Baseline audit (1 hour)**

Runs `/ads audit [business URL]` for the first time. Score: 52/100 — Grade D. Initial reaction: "That's bad. But now I know." Reads the Critical Findings panel. There are 4 Critical findings:
1. No Meta Pixel installed — cannot run retargeting
2. Checkout page headline does not match the Facebook ad that drives traffic to it (low message match)
3. No Google Search ads running — competitor owns all branded keywords
4. Zero metadata descriptions on product pages — Google generates generic snippets hurting CTR

Reads the action plan: Quick Wins this week, Medium-term items for next month, Strategic items for the quarter. Assigns Quick Wins to the web developer: install Meta Pixel, fix checkout headline. Does the Meta Pixel one himself in 20 minutes following ZieAds' embedded guide link.

**Week 2 — First re-audit (20 minutes)**

Monday morning. Re-runs `/ads audit`. Score: 59/100 — up 7 points. The Meta Pixel Critical finding is gone. The checkout headline finding is still there (developer has not done it yet). New score breakdown shows "Landing Page Conversion" improved from 38/100 to 51/100. Follows up with the developer on the headline fix.

**Week 3 — Adds a new platform (30 minutes)**

Decides to start Google Search ads to capture branded traffic. Runs `/ads google [business URL]`. Gets: campaign structure recommendation, 15 headline options, keyword category strategy, bidding strategy recommendation, negative keyword starter list. Shares the output with a freelancer hired to set up the campaigns. Total brief preparation time: 5 minutes.

**Week 4 — Monthly check (45 minutes)**

Runs the full monthly review: `/ads competitors`, `/ads budget`, `/ads funnel`. Score is now 68/100. 16 points gained in one month. The competitor scan reveals a competitor lowered their price by $10 — a finding that would have taken weeks to notice manually. Updates pricing strategy based on this. Downloads the monthly PDF report.

**Pattern going forward:** Every Monday, 20-minute re-audit. Every month, 45-minute strategic review. Score target: reach 80/100 by end of Quarter 2. This is the only paid ads KPI this founder tracks — and it is sufficient.

---

## 8. Agent Architecture & Technical Workflow

### 8.1 Full Audit Agent Pipeline (`/ads audit`)

The audit command is the flagship product. It deploys 5 specialized agents in parallel, each receiving the same business context object but analyzing a completely different dimension of paid advertising readiness.

```
USER INPUT: /ads audit https://example.com
            + businessContext {type, goal, budget, platforms}
                    │
                    ▼
┌───────────────────────────────────────────────────────────────┐
│  PHASE 1: DISCOVERY & PRE-ANALYSIS  (sequential · 15–30 sec) │
│                                                               │
│  Step 1.1 — Fetch & crawl                                    │
│    · Homepage, /pricing, /product, /about, /contact          │
│    · Detect CMS: Shopify / WordPress / Webflow / custom      │
│    · Record all page titles, H1s, meta descriptions          │
│                                                               │
│  Step 1.2 — Pixel & tracking detection                       │
│    · Scan <script> tags for Meta Pixel, GTM, TikTok Pixel    │
│    · LinkedIn Insight Tag, Pinterest Tag, Hotjar, etc.        │
│    · Flag any missing tracking on key conversion pages       │
│                                                               │
│  Step 1.3 — Ad signal detection                              │
│    · Scan all links for UTM parameters in use                │
│    · Identify retargeting catalog signals (Shopify feed etc) │
│    · Detect any Google Shopping / Merchant Center signals    │
│                                                               │
│  Step 1.4 — Business context construction                    │
│    · Determine: SaaS / Ecommerce / Local / B2B / Creator     │
│    · Identify hero offer, pricing model, primary CTA         │
│    · List key pages: homepage, product, pricing, checkout    │
│    · Build businessContext object for agent consumption      │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────────────┐
│  PHASE 2: PARALLEL AGENT EXECUTION  (simultaneous · ~90 sec)  │
│                                                               │
│  ┌─────────────────────┐  ┌─────────────────────┐           │
│  │ AGENT 1             │  │ AGENT 2             │           │
│  │ Ad Creative         │  │ Audience &          │           │
│  │ Intelligence        │  │ Targeting           │           │
│  │                     │  │                     │           │
│  │ · Brand identity    │  │ · ICP definition    │           │
│  │ · Hero offer scan   │  │ · Audience tiers    │           │
│  │ · Format matrix     │  │ · Platform matrix   │           │
│  │ · 3 concepts/plat.  │  │ · Lookalike seeds   │           │
│  └─────────────────────┘  └─────────────────────┘           │
│                                                               │
│  ┌─────────────────────┐  ┌─────────────────────┐           │
│  │ AGENT 3             │  │ AGENT 4             │           │
│  │ Competitive         │  │ Platform & Budget   │           │
│  │ Intelligence        │  │ Strategy            │           │
│  │                     │  │                     │           │
│  │ · 3-tier comp map   │  │ · Platform fit score│           │
│  │ · Ad spend signals  │  │ · Budget allocation │           │
│  │ · Offer analysis    │  │ · KPI benchmarks    │           │
│  │ · Positioning gaps  │  │ · Bidding strategy  │           │
│  └─────────────────────┘  └─────────────────────┘           │
│                                                               │
│           ┌─────────────────────┐                           │
│           │ AGENT 5             │                           │
│           │ Funnel & Conversion │                           │
│           │                     │                           │
│           │ · Landing pg. audit │                           │
│           │ · TOFU/MOFU/BOFU    │                           │
│           │ · Conversion blocks │                           │
│           │ · Funnel gaps       │                           │
│           └─────────────────────┘                           │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────────────┐
│  PHASE 3: SYNTHESIS & SCORING  (sequential · 15–20 sec)      │
│                                                               │
│  · Aggregate outputs from all 5 agents                       │
│  · Apply weighted scoring formula across 6 dimensions        │
│  · Rank all findings: Critical / High / Medium / Low         │
│  · Generate Quick Wins / Medium-term / Strategic action plan │
│  · Produce platform priority ranking (1st, 2nd, 3rd choice)  │
│  · Calculate estimated CPA/ROAS benchmarks per platform      │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────────────┐
│  PHASE 4: OUTPUT  (parallel)                                  │
│                                                               │
│  · Report Dashboard (live in browser — all 7 tabs populated) │
│  · Markdown report (saved to account, shareable link)        │
│  · PDF report (on-demand via /ads report-pdf)                │
│  · Action checklist (persistent, updates on each re-audit)   │
│  · Score history (updated on each re-audit run)              │
└───────────────────────────────────────────────────────────────┘
```

### 8.2 Scoring Methodology

The **Paid Ads Readiness Score** is calculated across 6 weighted dimensions. Each dimension is scored 0–100 by its specialist agent and weighted into the overall score.

| Dimension | Weight | What It Measures | Fixed By |
|-----------|--------|-----------------|----------|
| Creative & Offer Strength | 25% | Hero offer clarity, USP specificity, creative potential, hook quality | `/ads creatives`, `/ads copy` |
| Audience Clarity | 20% | ICP definition, targeting specificity, lookalike seed quality, exclusion strategy | `/ads audiences` |
| Landing Page Conversion | 20% | Page speed, headline clarity, CTA strength, social proof, message match | `/ads landing` |
| Platform Fit | 15% | Match between business model and each platform's strengths | `/ads google`, `/ads meta`, `/ads tiktok`, `/ads linkedin` |
| Funnel Coverage | 10% | TOFU / MOFU / BOFU content and offer depth | `/ads funnel` |
| Competitive Positioning | 10% | Differentiation clarity, competitor landscape awareness | `/ads competitors` |

**Score tier definitions:**
- 80–100 (A): Ready to scale. Ads setup is strong. Focus on creative testing and scaling winning campaigns.
- 65–79 (B): Minor gaps. A few specific fixes will unlock significantly better performance.
- 50–64 (C): Moderate gaps. Several issues are actively limiting results. Fix Critical and High findings before scaling spend.
- 35–49 (D): Significant gaps. Foundational work required. Do not increase ad spend until Critical findings are resolved.
- 0–34 (F): Not ready. Scaling ads now will burn budget. Stop spending and fix fundamentals first.

### 8.3 Score Improvement Loop

The score is the central engagement mechanic of ZieAds. Every skill command directly improves one or more score dimensions. The progression from a first audit (typically 45–65/100 for most small businesses) to an optimized setup (75–85/100) follows this loop:

```
Week 1: Run /ads audit → Get baseline score → Read Critical findings
   ↓
Week 1–2: Fix Critical findings (pixel install, landing page basics,
          message match) → Score gains: +8 to +15 points
   ↓
Week 2–3: Run /ads copy + /ads creatives → Improve ad creative quality
          Run /ads audiences → Sharpen targeting
          → Score gains: +5 to +10 points
   ↓
Week 3–4: Run /ads landing → Fix CRO gaps on key pages
          Run /ads funnel → Fill TOFU/MOFU/BOFU holes
          → Score gains: +5 to +8 points
   ↓
Month 2: Run /ads competitors → Identify positioning gaps
         Run /ads budget → Optimize platform allocation
         → Score gains: +3 to +6 points
   ↓
Ongoing: Weekly re-audit → catch new issues as they appear
         Monthly strategic review → stay ahead of competitive shifts
```

**Target trajectory for a typical small business:**
- Week 1: 52/100
- Week 4: 67/100
- Month 3: 76/100
- Month 6: 82/100

---

## 9. Skill Modules (Detailed)

Each skill is a structured `SKILL.md` file that gives the AI agent precise instructions on what to analyze, how to score it, and what to output. Below is the full specification for each of ZieAds' 15 skills.

---

### SKILL 1: `ads-audit` (Main Orchestrator)

**Purpose:** Orchestrate all 5 parallel agents and synthesize the final audit report.

**Input:** Business URL + businessContext object

**Phase 1 — Discovery:**
1. Fetch URL, detect CMS/platform (Shopify, WordPress, Webflow, custom)
2. Check for tracking pixels: Meta Pixel, Google Tag Manager, TikTok Pixel, LinkedIn Insight Tag, Pinterest Tag
3. Identify current ad UTM parameters in any visible links
4. Detect lead gen vs. e-commerce vs. SaaS vs. local business model
5. Identify hero products, primary offer, pricing model
6. Note any existing retargeting signals (dynamic product ads catalog, etc.)

**Phase 2 — Launch 5 Subagents in parallel:**
Each subagent receives: `{businessType, heroOffer, pricing, detectedPixels, url, keyPages[]}`

**Phase 3 — Synthesis:**
- Weighted score calculation
- Severity-ranked findings (Critical / High / Medium / Low)
- Platform-by-platform priority ranking
- Quick wins (this week), medium-term (1–3 months), strategic (3–6 months)

**Output format:**
```
ZIEADS AUDIT REPORT
Business: [Name] · URL: [URL] · Date: [Date]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAID ADS READINESS SCORE: XX/100  [Grade: X]

SCORE BREAKDOWN:
Creative & Offer Strength:    XX/100  (weight: 25%)
Audience Clarity:             XX/100  (weight: 20%)
Landing Page Conversion:      XX/100  (weight: 20%)
Platform Fit:                 XX/100  (weight: 15%)
Funnel Coverage:              XX/100  (weight: 10%)
Competitive Positioning:      XX/100  (weight: 10%)

KEY FINDINGS:
🔴 CRITICAL: [Finding] — [Impact] — [Fix]
🟠 HIGH:     [Finding] — [Impact] — [Fix]
🟡 MEDIUM:   [Finding] — [Impact] — [Fix]
🟢 LOW:      [Finding] — [Impact] — [Fix]

RECOMMENDED PLATFORM PRIORITY:
1. [Platform] — [Reason] — Est. CPA: $XX
2. [Platform] — [Reason]
3. [Platform] — [Reason]

ACTION PLAN:
Quick Wins (This Week): ...
Medium-Term (1–3 months): ...
Strategic (3–6 months): ...
```

---

### SKILL 2: `ads-creatives`

**Purpose:** Generate complete creative briefs and concept ideas for all recommended platforms.

**Analysis framework:**
1. Visual identity scan (colors, fonts, imagery style from website)
2. Offer hero identification (what is the single most compelling thing to advertise?)
3. Emotional triggers mapped to product category (fear, desire, social proof, curiosity, urgency)
4. Creative format matrix: static image, carousel, video (UGC vs produced), Story, Reel

**Output per platform:**
- 3 creative concepts each with: hook, visual direction, format, emotional angle
- Swipe file inspiration (describe reference ad styles, not specific copyrighted ads)
- Do's and don'ts for this brand/product
- Recommended creative testing sequence (which concept to test first and why)

---

### SKILL 3: `ads-copy`

**Purpose:** Generate complete, platform-native ad copy ready to paste into Ads Manager.

**Copy generated per platform:**

**Google Search Ads:**
- 15 headlines (30 characters max each), covering: feature, benefit, social proof, urgency, brand
- 4 descriptions (90 characters max each)
- 5 sitelink extensions with descriptions
- 3 callout extensions
- 2 structured snippets

**Meta Ads:**
- Primary text in 3 lengths: short (under 40 words), medium (under 100 words), long (under 250 words)
- 5 headline variants
- 3 link descriptions
- 3 complete matched ad sets (primary text + headline + description, coherent together)

**TikTok Ads:**
- Script outlines for 3 UGC-style video concepts (hook, body, CTA, overlay text)
- 5 caption variants
- Trending audio mood recommendations by video concept

**LinkedIn Ads (B2B only):**
- Sponsored Content copy: intro text + headline + description
- Message Ad copy: InMail subject + body
- 3 audience-specific role-based variants

**Scoring:** Each piece of copy is rated on: clarity, specificity, benefit-focus, urgency, platform-nativeness.

---

### SKILL 4: `ads-audiences`

**Purpose:** Build a complete targeting strategy covering all funnel stages across all major platforms.

**Output structure:**

**ICP Definition:** Primary demographic (age, gender, geo, income bracket), psychographic profile (values, goals, frustrations, media habits), job-to-be-done statement

**Meta Audiences:**
- Cold Layer 1 (Interest stacking): 3 audience sets with specific interest + behavior combinations, estimated size
- Cold Layer 2 (Broad + algorithmic): Recommended broad setups with exclusions
- Warm: Website visitors segmented by page, video viewers by completion rate, Instagram/Facebook engagers by recency
- Hot: Customer list + lookalike seeds, cart abandoners, checkout starters, lead form openers

**Google Audiences:** Search intent keyword categories, in-market audience overlaps, customer match strategy

**TikTok Audiences:** Interest categories, hashtag community overlaps, behavioral signals (video completion-rate audiences)

**LinkedIn Audiences (B2B):** Job title targeting matrix, company size + industry filters, skills + groups targeting

---

### SKILL 5: `ads-competitors`

**Purpose:** Map the competitive paid ads landscape across 3 tiers with actionable positioning insights.

**Discovery methodology:**
- Tier 1: Direct competitors (same product, same market, similar price)
- Tier 2: Indirect competitors (different product, same problem solved)
- Tier 3: Aspirational competitors (category leaders to benchmark and learn from)

**Analysis per competitor:**
- Ad library presence signals (Meta Ad Library, Google Ads Transparency indicators)
- Estimated ad spend tier based on signals: Low / Medium / High / Heavy
- Primary platforms used and estimated channel split
- Offer and positioning (what they lead with, how they frame the value)
- Creative approach (UGC / produced / testimonial / product demo / comparison)
- Landing page strategy (direct sale vs. lead capture vs. trial)
- Pricing and offer structure (visible pricing, trial offers, guarantees)

**Competitive opportunity matrix:**
- Platforms where competitors are weak → your priority platforms
- Offers they are not making → your gap to fill
- Audiences they are ignoring → your targeting opportunity
- Creative angles they have not tried → your differentiation play

---

### SKILL 6: `ads-funnel`

**Purpose:** Map the complete paid advertising funnel and identify gaps at each stage that are limiting ad performance.

**TOFU (Top of Funnel — Awareness):**
- Best platforms for this business type at TOFU stage
- Content types and ad formats appropriate for cold audiences
- Recommended TOFU ad objective and optimization event
- Current TOFU asset gap: does the brand have content to run awareness campaigns?

**MOFU (Middle of Funnel — Consideration):**
- Best platforms for warm audience retargeting
- Lead magnet or trial offer assessment: is there something valuable to offer warm audiences?
- Email sequence integration: is there a nurture sequence to capture and warm MOFU leads?
- MOFU gap: what content or offer is missing to bridge awareness to purchase intent?

**BOFU (Bottom of Funnel — Conversion):**
- Conversion offer strength: is the offer compelling enough to close cold traffic?
- Retargeting structure: are the audience lists in place to recapture BOFU visitors?
- Purchase friction assessment: how many steps from ad click to conversion?
- BOFU gap: what is the #1 thing preventing conversion on bottom-funnel campaigns?

**Output:**
- Funnel gap map with severity rating per stage
- Recommended ad type and objective per stage
- Budget split recommendation across funnel stages
- 90-day funnel build sequence (what to build first, second, third)

---

### SKILL 7: `ads-budget`

**Purpose:** Generate a data-driven budget allocation model optimized for the business type, platform fit, and growth stage.

**Inputs used:**
- Business type and primary KPI (ROAS, CAC, CPL, bookings)
- Monthly ad budget range (from onboarding wizard)
- Current stage: Testing / Scaling / Maintaining
- Platform fit scores from the audit

**Output:**
- Platform allocation % and dollar amount
- Funnel stage split (TOFU / MOFU / BOFU)
- Minimum viable test budget per platform
- Industry benchmark CPA / ROAS expectations
- Budget scaling thresholds (when to increase spend based on ROAS performance)
- Testing budget framework (what percentage to reserve for creative testing)

**Sample budget model output (for a $5,000/month e-commerce business):**
```
Platform        Allocation   Amount    Primary KPI
Meta Ads           50%       $2,500    ROAS 3.5x+
Google Search      30%       $1,500    ROAS 4x+
TikTok Ads         20%       $1,000    CPM < $12

Funnel Split:
TOFU (awareness):   20%   $1,000
MOFU (retargeting): 30%   $1,500
BOFU (conversion):  50%   $2,500

Expected CPA range:    $18–$35    Industry avg: $24
Expected ROAS range:   2.8x–4.5x  Industry avg: 3.6x
```

---

### SKILL 8: `ads-landing`

**Purpose:** Audit all landing pages intended to receive paid traffic and identify conversion blockers.

**Scoring across 8 dimensions (each 0–10):**
1. Load speed — under 3 seconds on mobile (measured via Lighthouse API)
2. Above-the-fold clarity — can the visitor understand the offer within 5 seconds?
3. Headline strength — is the headline specific, benefit-driven, and differentiated?
4. Social proof — testimonials, logos, numbers, reviews above the fold?
5. CTA clarity — one primary CTA, prominent placement, benefit-driven button text?
6. Form friction — minimum fields, logical placement, mobile-optimized UX?
7. Trust signals — money-back guarantee, security badges, privacy policy visible?
8. Message match — does the landing page match the promise of the ad that drives traffic to it?

**Output:**
- Score per dimension (0–10)
- Critical conversion blockers (anything scoring below 6)
- Specific A/B test recommendations ranked by expected impact
- Suggested headline rewrites (3 variants)
- Suggested CTA copy rewrites (3 variants)
- Mobile experience assessment

---

### SKILL 9: `ads-google`

**Purpose:** Google Ads-specific full strategy covering Search, Display, Shopping, YouTube, and Performance Max.

**Campaign type guidance:**
- Search: when to use, recommended match type strategy, negative keyword philosophy
- Performance Max: suitability assessment for this business, asset group structure, audience signal strategy
- Display / Retargeting: audience list recommendations, banner creative specifications
- Shopping (e-commerce): product feed optimization priorities, smart bidding recommendation
- YouTube: if video content exists, ad format recommendations and targeting approach

**Output:**
- Campaign structure blueprint (account → campaign → ad group → ad hierarchy)
- 15 recommended search ad headlines with rationale
- Keyword research categories with intent mapping
- Negative keyword starter list (50+ terms relevant to business type)
- Bidding strategy recommendation with rationale (tCPA vs. tROAS vs. manual)
- Quality Score improvement checklist

---

### SKILL 10: `ads-meta`

**Purpose:** Meta Ads full strategy for Facebook and Instagram.

**Output:**
- Campaign objective recommendation with rationale
- Full account structure map (3-tier: Cold / Warm / Hot)
- Audience testing framework (how many audiences per ad set, rotation cadence)
- Creative format priority and testing sequence
- iOS 14+ attribution strategy (click attribution window recommendation)
- Budget pacing settings and ad scheduling recommendations
- Frequency cap guidance for retargeting campaigns

---

### SKILL 11: `ads-tiktok`

**Purpose:** TikTok Ads strategy with a native, creative-first approach.

**Key TikTok-specific principles:**
- The algorithm treats creative as targeting — the right hook reaches the right people
- Native content dramatically outperforms polished produced ads on this platform
- UGC creator collaboration is the highest-leverage activity for TikTok performance

**Output:**
- Creative direction brief (what type of content to produce, tone, style)
- 3 video script outlines (15–30 seconds each, hook-first structure)
- Audience strategy (Interest + Behavioral + Custom Audiences)
- Spark Ads vs. In-Feed Ads vs. TopView recommendation
- UGC creator brief template
- TikTok Shop integration assessment (if e-commerce)

---

### SKILL 12: `ads-linkedin`

**Purpose:** LinkedIn Ads strategy for B2B businesses (with applicability gate).

**Applicability check:** LinkedIn is only recommended when the business type is B2B with an average contract value above $1,000. LinkedIn CPCs are $6–$15, making it uneconomical for low-ticket B2C.

**Output:**
- Campaign objective selection rationale
- Audience targeting matrix (Job Titles + Seniority + Company Size + Industry combinations)
- Ad format recommendations (Sponsored Content, Lead Gen Forms, Document Ads, Message Ads)
- Lead magnet recommendation for LinkedIn audience (what to offer that earns B2B clicks)
- Retargeting strategy (company page visitors, lead gen form openers, website visitors)
- Expected CPL range and benchmark

---

### SKILL 13: `ads-report` (Markdown)

**Purpose:** Compile all agent outputs into a single comprehensive Markdown strategy report for internal use or sharing.

**Report sections:**
1. Executive Summary (3 sentences: score, biggest opportunity, top priority action)
2. Paid Ads Readiness Score with breakdown table
3. Business and Market Context
4. Recommended Platform Strategy and priority ranking
5. Audience Strategy by platform
6. Creative Strategy with concept briefs
7. Funnel Architecture map
8. Budget Allocation model
9. Competitive Landscape
10. Priority Action Plan (Quick Wins / 1–3 months / 3–6 months)
11. 90-Day Launch Roadmap (week-by-week)
12. Appendix: Platform-Specific Deep Dives

---

### SKILL 14: `ads-report-pdf`

**Purpose:** Render the Markdown report as a professional, client-ready PDF.

**PDF design specification:**
- Cover page: Business name, date, ZieAds branding (or agency logo in white-label mode), score badge
- Page 2: Executive Summary — designed for a decision-maker who reads only one page
- Color-coded score cards (green above 75, amber 50–74, red below 50)
- Formatted data tables (budget allocation, competitor matrix, audience matrix)
- Callout boxes for Critical findings (red left border, bold heading)
- Section dividers with platform icons
- Competitive landscape comparison table
- Action plan timeline visual (Quick Wins / Medium / Strategic)
- Methodology appendix at end (so clients understand how the score was calculated)

**Generation:** Python (WeasyPrint or ReportLab) triggered by skill command. Stored in R2/S3, returned as a signed 7-day download link.

---

### SKILL 15: `ads-quick`

**Purpose:** 60-second ads readiness snapshot — the free-tier lead-generation feature.

**What it analyzes (homepage only, no deep crawl):**
1. Pixel presence: Is at least one major tracking pixel (Meta, Google, TikTok) detected?
2. CTA clarity: Is the primary CTA above the fold and specific?
3. Offer visibility: Can the main offer or product be understood within 5 seconds?
4. Mobile speed: Is the page under 3 seconds on mobile (Lighthouse estimate)?
5. Headline specificity: Is the main headline specific with a clear benefit?

**Output:**
- 1-page result: overall score out of 50, 3 most critical findings, blurred teaser showing "5+ more issues found"
- Email capture: "Save your results and unlock the full audit"

**Design intent:** This is the hook that converts anonymous visitors into registered users. The result must be specific enough to feel real and valuable, but incomplete enough to motivate the upgrade.

---

## 10. Technical Architecture

### 10.1 Stack Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Web App)                      │
│   Next.js 14 + Tailwind CSS + shadcn/ui                    │
│   - Input form with URL and context fields                  │
│   - Real-time progress UI (agent status cards)             │
│   - Interactive Report Dashboard (7 tabs)                   │
│   - PDF download modal                                      │
│   - Account dashboard + score history chart                 │
└─────────────────┬───────────────────────────────────────────┘
                  │ HTTP / WebSocket
┌─────────────────▼───────────────────────────────────────────┐
│                   BACKEND (API Layer)                        │
│   Next.js API Routes or Node.js (Fastify)                   │
│   - Auth: Supabase (sign-in, team management)                  │
│   - Job queue: Redis + BullMQ (audit jobs)                  │
│   - Agent orchestration: Promise.all() for parallel calls   │
│   - PDF generation service (Python sidecar)                 │
│   - Stripe billing (subscriptions + pay-per-report)         │
│   - Report storage: Cloudflare R2 + signed URLs             │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                  AI AGENT LAYER                              │
│   Anthropic Claude API (claude-sonnet-4-6)                 │
│   - 5 parallel API calls per full audit                     │
│   - Structured JSON output schema per agent                 │
│   - SKILL.md system prompts loaded per agent type          │
│   - Web scraping: Playwright (headless Chromium)            │
│   - Jina.ai Reader API as fallback for blocked sites        │
│   - Lighthouse API for performance scoring                  │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                  DATA LAYER                                  │
│   PostgreSQL (users, reports, usage, checklist state)       │
│   Redis (job queues, result caching, rate limiting)         │
│   Cloudflare R2 (PDF storage, report attachments)           │
│   Upstash (serverless Redis for edge functions)             │
└─────────────────────────────────────────────────────────────┘
```

### 10.2 Agent Parallelism Implementation

Each `/ads audit` call triggers 5 parallel Claude API calls using `Promise.all()`:

```javascript
const businessContext = await scrapeAndBuildContext(url, userContext);

const [creative, audience, competitor, platform, funnel] = await Promise.all([
  runAgent('ads-creative-intelligence', businessContext),
  runAgent('ads-audience-targeting', businessContext),
  runAgent('ads-competitive-intelligence', businessContext),
  runAgent('ads-platform-budget', businessContext),
  runAgent('ads-funnel-conversion', businessContext),
]);

const report = await synthesizeReport({
  creative, audience, competitor, platform, funnel,
  businessContext
});
```

Each agent call uses:
- A specialized SKILL.md loaded as the system prompt
- The `businessContext` object as the user message
- A structured JSON output schema enforced via Claude's structured output capability
- `max_tokens: 2000` to bound output length and API cost

### 10.3 Web Scraping Layer

Before agents run, a Playwright scraper fetches and parses:
- Homepage HTML and key sub-pages
- Meta tags, Open Graph data, page titles, H1s
- All script tags (pixel / tag manager detection)
- All link hrefs (UTM parameter detection)
- Lighthouse performance score via the Lighthouse Node API
- Structured data / JSON-LD schema if present

Fallback strategy:
1. Playwright headless browser (primary)
2. Jina.ai Reader API (for JavaScript-heavy SPAs that Playwright cannot fully render)
3. Basic HTTP fetch + HTML parsing (fallback for blocked or rate-limited requests)
4. Graceful degradation: if scraping fails, agents analyze based on available data and flag limited coverage in the report

### 10.4 PDF Generation

The PDF generation service is a Python microservice running alongside the Node.js backend:

```python
# Triggered by /ads report-pdf command
# Input: structured report JSON from synthesis step
# Output: PDF binary → uploaded to R2 → signed URL returned

from weasyprint import HTML, CSS
import boto3

def generate_report_pdf(report_data: dict, brand_config: dict) -> str:
    html_content = render_template('report_template.html', report_data, brand_config)
    pdf_binary = HTML(string=html_content).write_pdf(
        stylesheets=[CSS('report_styles.css')]
    )
    url = upload_to_r2(pdf_binary, report_data['report_id'])
    return url  # 7-day signed URL
```

Charts (budget allocation donut, score radar) are generated via `matplotlib` and embedded as base64 images in the HTML template before PDF rendering.

---

## 11. User Interface & Experience

### 11.1 Key Screens

**Landing Page:**
- Hero: URL input + "Run Free Quick Scan" CTA (above the fold)
- Social proof strip: number of reports generated, recent testimonials
- Demo section: animated preview of a real audit result (scrollable)
- Pricing table: Free / Starter / Pro / Agency
- FAQ: "What does ZieAds actually analyze?" and "Will this work for my business type?"

**Quick Scan Result Page:**
- Score badge (large, centered): e.g. "54/100 — Your ads setup has significant gaps"
- 3 critical findings (specific to the URL entered, not generic)
- Blurred section: "5 more critical findings found — unlock the full audit"
- Email capture form: "Save your results and run a full audit free"
- Urgency note: "Quick Scan results expire in 24 hours"

**Onboarding Wizard (3 steps):**
- Step 1: Business context (name, URL, type, goal)
- Step 2: Budget and platforms (monthly budget range, platforms currently using)
- Step 3: Preview of what the full audit will produce (visual mock of the report)
- CTA: "Run My First Full Audit — Free"

**Live Audit Progress Screen:**
- 5 agent status cards with real-time progress bars
- Micro-copy showing what each agent is currently doing
- Overall progress percentage and time remaining estimate
- A rotating "Did you know?" tip about paid ads best practices while waiting

**Report Dashboard:**
- Score header (sticky at top): overall score, 6 dimension scores, grade
- Critical Findings panel (pinned): ranked findings with checkboxes
- Tab navigation: Overview / Creatives / Audiences / Platforms / Funnel / Competitors / Budget
- Download PDF button (prominent, top right of every tab)
- Score history sparkline (small, in header — shows trend if re-audited)
- Action checklist sidebar (collapsible on mobile)

**Account Dashboard:**
- Report history (all past audits, date, score, URL)
- Score trend chart (line chart across all audits)
- Usage meter (audits used / audits remaining this month)
- Team management (Pro and Agency tiers)
- Billing and plan management

### 11.2 Score Progress Gamification

The Paid Ads Readiness Score is designed to feel like a health score — something the user wants to see go up, and that visibly responds to their actions. The following UX elements reinforce this:

- **Score delta indicator:** After each re-audit, a "+7 points since last week" badge appears next to the score in bright green
- **Dimension improvement callouts:** "Landing Page Conversion improved +12 points — great work fixing the headline!"
- **Streak tracking:** "You've run 4 consecutive Monday audits — your score is on a 4-week improvement streak"
- **Milestone celebrations:** Small in-app celebration when reaching a new grade tier (D → C → B → A)

### 11.3 Mobile Experience

ZieAds is fully responsive. Key mobile design decisions:
- Quick Scan input is the full above-the-fold experience on mobile
- Progress screen collapses 5 agent cards into a single progress bar on small screens
- Report Dashboard tabs become a bottom navigation on mobile
- PDF download works via native mobile share sheet
- Critical Findings checklist is the default mobile view (not the tab navigation)

---

## 12. Monetization & Pricing

### Tier Structure

**Free — "Quick Scan"**
- 3 quick scans per month
- 1-page score + 3 critical findings
- No PDF download, no full audit
- Goal: acquisition and first demonstration of value. This is the top of the ZieAds funnel.

**Starter — $29/month**
- 10 full audits per month
- All 15 skill commands
- PDF report with ZieAds branding
- 7-day report history
- Target: Freelancers, solopreneurs, small business owners running their own ads

**Pro — $79/month**
- 40 full audits per month
- White-label PDF reports (no ZieAds branding)
- Custom business name on reports
- API access (10K tokens/month)
- Priority processing (queue priority in peak hours)
- Target: Agency owners, in-house marketing teams, serious freelancers

**Agency — $199/month**
- Unlimited full audits
- White-label + custom branding with agency logo on PDF
- Team seats (up to 5 users)
- Full API access with higher rate limits
- Client management dashboard (organize reports by client)
- Monthly aggregate report (across all clients — for agency performance reviews)
- Target: Agencies managing 5+ clients simultaneously

**Pay-per-report — $9/report**
- No subscription required
- One full audit + one PDF
- Best for users who need one high-quality audit without a monthly commitment
- Leads to subscription conversion when users recognize recurring need

### Economics

**Agency tier economics example:**
- ZieAds Agency cost: $199/month
- Clients under management: 8
- Monthly retainer per client: $2,500
- Monthly revenue: $20,000
- ZieAds as a % of revenue: 1%
- Value delivered per client: 4+ hours of strategy work per month reduced to 30 minutes

### Revenue Projections (Year 1)

| Month | Free Users | Paid Users | MRR | ARR Run Rate |
|-------|-----------|-----------|-----|-------------|
| Month 1 | 500 | 50 | $2,000 | $24K |
| Month 3 | 2,000 | 150 | $7,500 | $90K |
| Month 6 | 8,000 | 500 | $25,000 | $300K |
| Month 9 | 18,000 | 1,200 | $60,000 | $720K |
| Month 12 | 35,000 | 2,500 | $125,000 | $1.5M |

---

## 13. Success Metrics

### Primary KPIs

| Metric | Target Month 3 | Target Month 6 | Target Month 12 |
|--------|---------------|----------------|-----------------|
| Reports generated (cumulative) | 1,500 | 5,000 | 25,000 |
| Paying users | 150 | 500 | 2,500 |
| MRR | $7,500 | $25,000 | $125,000 |
| Quick Scan → Full Audit conversion | 10% | 12% | 15% |
| Free → Paid conversion | 6% | 8% | 10% |
| Avg report generation time | < 3 min | < 2.5 min | < 2 min |
| PDF download rate (of completed reports) | 50% | 60% | 70% |

### Engagement & Retention KPIs

- Monthly active users / paid users ratio: target > 80% (users open ZieAds at least once per month)
- Weekly active users / paid users ratio: target > 50% (daily habit adoption)
- Month 2 retention: target > 70%
- Month 6 retention: target > 55%
- NPS score: target > 45 by Month 6
- Average audits per paid user per month: target > 5 (indicates habit formation)

### Quality Metrics

- Actionability score: > 80% of users survey response "Yes, this gave me something specific to act on"
- Finding accuracy: > 90% of competitive and technical findings verified accurate in spot checks
- Score correlation with ad performance: users with ZieAds score > 75 should show measurably better ROAS vs. users below 50 (tracked via optional performance data sharing)

---

## 14. Roadmap & Milestones

### Phase 1 — Foundation (Months 1–2)
Core infrastructure: scraping, agent orchestration, basic UI, auth, billing

- [ ] Playwright-based web scraper with pixel detection and UTM analysis
- [ ] 5-agent parallel orchestration system with Promise.all() and structured outputs
- [ ] 6 core skill files: audit, creatives, copy, audiences, competitors, funnel
- [ ] Report Dashboard with Overview tab and Critical Findings panel
- [ ] Basic PDF generation (WeasyPrint, simple template)
- [ ] Supabase auth + Stripe billing (Free, Starter, Pro tiers)
- [ ] Free quick-scan feature (no sign-up required)
- [ ] One-click onboarding wizard
- [ ] Beta launch to waitlist

### Phase 2 — Full Launch (Months 3–4)
Complete feature set, all 15 skills, full report experience

- [ ] All 15 skill commands implemented and tested
- [ ] Full 7-tab Report Dashboard
- [ ] White-label PDF (Pro tier) with custom branding upload
- [ ] Budget allocation model with industry benchmark database
- [ ] Platform-specific deep dives (Google, Meta, TikTok, LinkedIn skills)
- [ ] Score history chart and delta indicators
- [ ] Weekly digest email (automated Monday score report)
- [ ] Agency tier with team seats and client management dashboard
- [ ] SEO landing pages targeting paid ads strategy keywords

### Phase 3 — Scale (Months 5–8)
Distribution, integrations, retention mechanics

- [ ] Full API access (for developers building on ZieAds)
- [ ] Zapier and Make.com native integrations
- [ ] Chrome extension (run Quick Scan from any tab)
- [ ] Before/after audit comparison view (side-by-side two audit dates)
- [ ] Automated re-audit alerts (weekly score drop notifications)
- [ ] Referral program (give 1 month free, get 1 month free)
- [ ] Affiliate program (30% recurring commission for content creators)

### Phase 4 — Moat (Months 9–12)
Data network effects and defensibility

- [ ] ZieAds Ads Benchmark Database (anonymized aggregate data from all reports)
- [ ] Industry-specific scoring benchmarks (e.g. "Your score is top 20% for e-commerce brands")
- [ ] Collaborative reports (client annotation and commenting on PDF findings)
- [ ] Ads Manager integration (connect Meta Ads Manager, Google Ads to track actual ROAS vs. ZieAds score predictions)
- [ ] ROAS prediction model (ML-based, trained on connected account data)
- [ ] ZieAds score public badge (shareable, linkable — "Verified 82/100 by ZieAds")

---

## 15. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation Strategy |
|------|-----------|--------|-------------------|
| Anthropic API rate limits under audit load | Medium | High | Pre-approved rate limit increase, BullMQ job queue, result caching for repeat domain analysis |
| Playwright scraping blocked by Cloudflare or similar | High | Medium | Rotating residential proxies, Jina.ai Reader API fallback, graceful degradation with partial data |
| Report quality inconsistency across business types | Medium | High | Structured JSON output schemas, output validation layer, human review queue for flagged reports |
| Direct competitor copies the product | High | Medium | First-mover speed, benchmark database as network effect moat, white-label distribution via agencies |
| GDPR / privacy concerns with URL scanning | Low | High | Clear privacy policy, public-facing pages only, no PII stored from scraped sites, EU data residency option |
| PDF generation timeouts or failures | Medium | Medium | Async PDF generation with background job, fallback to Markdown download, retry queue |
| High API costs compressing margins | Medium | Medium | Output token budgets, caching for repeat audits (TTL: 24 hours), claude-haiku-4-5 for quick-scan tier |
| Users not returning after first audit | High | Medium | Monday digest email, score gamification, checklist as retention mechanic, re-audit reminder at 7 days |

---

## 16. Appendix A: Skill File Template

Each skill in ZieAds follows this `SKILL.md` template structure:

```markdown
# ZIEADS SKILL: [skill-name]

## Purpose
[One sentence: what this agent does and what score dimension it improves]

## Trigger
Command: `/ads [command] <url>`

## Input
- url: Target website URL
- businessContext: {type, offer, pricing, detectedPixels, keyPages, goal, budget}

## Applicability Gate
[Conditions under which this skill should not run, e.g. "LinkedIn only for B2B"]

## Phase 1: Discovery
[What to fetch/analyze before the main analysis]

## Phase 2: Analysis Framework
[Specific questions to answer, data to extract, dimensions to score]

## Scoring Rubric
[0–100 scale with criteria for each 20-point band]

## Output Schema (JSON)
{
  "score": number,          // 0–100
  "dimension": string,      // which of the 6 dimensions this affects
  "findings": [{
    "severity": "critical|high|medium|low",
    "title": string,
    "impact": string,        // one sentence
    "recommendation": string // one sentence, actionable
  }],
  "deliverables": {         // skill-specific outputs
    // e.g. for ads-copy: { googleHeadlines: [], metaCopy: [], tiktokScripts: [] }
  }
}

## Example Output
[Concrete example with realistic data for a sample business]

## Common Pitfalls
[What mistakes to avoid in the analysis]
```

---

## 17. Appendix B: Competitive Landscape

| Tool | Focus | Price | ZieAds Advantage |
|------|-------|-------|-----------------|
| AdEspresso | Meta Ads management | $49/mo | ZieAds: strategy + cross-platform, not execution management |
| Semrush Ads | SEO + PPC research | $130/mo | ZieAds: more actionable, creative-focused, faster, cheaper |
| Madgicx | Meta Ads automation | $49/mo | ZieAds: strategy layer, not management layer |
| Foreplay.co | Ad creative inspiration | $49/mo | ZieAds: generates strategy, not just inspiration |
| Triple Whale | E-commerce attribution | $129/mo | ZieAds: pre-launch strategy, not post-launch analytics |
| Northbeam | Multi-touch attribution | $200+/mo | ZieAds: different stage of the workflow (strategy vs. measurement) |
| Manual agency | Full service | $3K–$10K/mo | ZieAds: 95% cheaper, delivered in 3 minutes |

**ZieAds' defensible position:** The only tool that goes from "business URL in" to "complete, multi-platform, execution-ready paid ads strategy out" in under 3 minutes. Not a management tool. Not an inspiration library. Not an attribution platform. Pure AI-powered strategy and creative generation with a proprietary scoring system that creates a measurable improvement loop.

---

## 18. Appendix C: Daily Workflow Quick Reference Card

This quick reference card is designed to be printed or bookmarked by active ZieAds users as a daily operating guide.

### Every morning (10 minutes)
- Open ZieAds, read the weekly digest (if Monday)
- Run `/ads quick` on any new landing pages receiving traffic today
- Check action checklist — pick today's top 1–2 priorities

### When writing ads (5–15 minutes per platform)
- Run `/ads copy [URL]` → paste platform-ready copy directly into Ads Manager
- Run `/ads creatives [URL]` → forward brief to designer or Canva template

### When performance drops
- Run `/ads landing [underperforming page URL]` → get exact conversion blocker diagnosis
- Run `/ads competitors [URL]` → check if a competitor change is affecting your market

### When launching on a new platform
- Run `/ads meta [URL]` or `/ads google [URL]` or `/ads tiktok [URL]` → get full platform strategy

### Every Monday (15 minutes)
- Run `/ads audit [URL]` → get updated score and new findings
- Check score delta vs. last week
- Download updated PDF if sharing with team or clients

### Every month (60 minutes)
- Run `/ads competitors [URL]` → check competitive landscape shifts
- Run `/ads budget [URL]` → recalibrate platform allocation
- Run `/ads funnel [URL]` → review funnel coverage
- Run `/ads report-pdf [URL]` → generate monthly strategy report

### For prospecting (freelancers and agencies)
- Run `/ads quick [prospect URL]` → check if score is below 65 (warm lead)
- Run `/ads audit + /ads report-pdf [prospect URL]` → generate free gift PDF
- Send PDF cold → book the call → propose retainer

---

*Document Owner: Product Lead, ZieAds*
*Version: 2.0 — Full Workflow Edition*
*Last Updated: April 2026*
*Next Review: May 2026*
*Changelog: v2.0 — Added Section 6 (Full User Journey), Section 7 (Persona Workflows), expanded Section 8 (Agent Architecture), added Appendix C (Daily Quick Reference)*
