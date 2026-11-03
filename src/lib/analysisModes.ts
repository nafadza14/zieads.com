/*
  Analysis modes, two packs (spec 7.3):
  - Social Analyst (default, every plan; Free gets the first two)
  - Ads Analyst (Pro and Agency; Starter gets the basic report). Reads ads data from
    the read-only connection or the Manual import (CSV), never from pasted text.
  Shared by the AI Agent page and the server so labels, order and gating match.
*/

export type ModePack = 'social' | 'ads';

export interface AnalysisMode {
  id: string;
  pack: ModePack;
  label: string;
  short: string;
  /** What the user sees in the chat when the mode starts */
  prompt: string;
  /** Instruction for the agent: which tools to call and what to return */
  task: string;
}

export const SOCIAL_MODES: AnalysisMode[] = [
  {
    id: 'content',
    pack: 'social',
    label: 'Content Performance Diagnosis',
    short: 'What worked, what did not, and why',
    prompt: 'Diagnose my content performance for the last 30 days. What worked, what did not, and why?',
    task: 'Run CONTENT PERFORMANCE DIAGNOSIS. Call get_account_metrics and get_post_performance for every connected organic account in parallel. Rank posts by engagement rate and views against my own average, explain the pattern behind the top 3 and bottom 3 (format, topic, hook, time), and end with 3 concrete changes for next week.',
  },
  {
    id: 'triage',
    pack: 'social',
    label: 'Comment Triage and Reply Drafts',
    short: 'Buying signals first, drafts ready to approve',
    prompt: 'Triage my open comments and draft replies, buying signals first.',
    task: 'Run COMMENT TRIAGE. Call list_comments for open comments. Group them as buying signal, complaint, question, praise. Then call draft_comment_replies for the buying signals, complaints and questions in my brand voice. Replies are saved as drafts, never sent. Summarise what needs me today.',
  },
  {
    id: 'gap',
    pack: 'social',
    label: 'Competitor Content Gap',
    short: 'Topics and formats rivals win that you skip',
    prompt: 'Find the content gaps between me and my competitors.',
    task: 'Run COMPETITOR CONTENT GAP. Call get_competitors and get_competitor_content, plus get_post_performance for my own posts. Show topics and formats where competitors get strong engagement and I post little or nothing. Use only public signals (engagement on organic posts, days an ad has run). Never invent spend or ROAS. End with 3 posts I should make, drafted as calendar drafts only if I ask.',
  },
  {
    id: 'format',
    pack: 'social',
    label: 'Format Fatigue',
    short: 'Which formats are wearing out',
    prompt: 'Which of my organic post formats are wearing out?',
    task: 'Run FORMAT FATIGUE for organic content. Call get_post_performance. Group posts by format (Reel, carousel, single image, text, video) and compare the last 14 days with the 14 before. Flag formats whose engagement rate or views per post fell by more than 20 percent, and suggest a fresh angle for each, based on my own past winners.',
  },
  {
    id: 'weekly',
    pack: 'social',
    label: 'Weekly Client Report',
    short: 'A plain report you can send',
    prompt: 'Write my weekly report for the last 7 days.',
    task: 'Run WEEKLY CLIENT REPORT. Call get_monitoring_overview and get_account_metrics. Write a short report for a business owner: headline result, followers, reach or views, engagement rate, top post, inbox response, what we do next week. Plain sentences, numbers with their change versus the previous week, no jargon.',
  },
  {
    id: 'plan',
    pack: 'social',
    label: 'Posting Plan Next Week',
    short: 'A week of posts as drafts',
    prompt: 'Plan my posts for next week.',
    task: 'Run POSTING PLAN NEXT WEEK. Call get_post_performance and get_content_calendar first, then plan 5 to 7 posts across my connected platforms at my best times, using formats and topics that already work for me and my brand profile. Save them with create_draft_posts as drafts for my approval.',
  },
];

export const ADS_MODES: AnalysisMode[] = [
  { id: 'daily', pack: 'ads', label: 'Daily Diagnosis', short: 'Urgent issues only', prompt: 'Run a daily diagnosis on my ads.', task: 'Run ADS DAILY DIAGNOSIS. Call get_ads_metrics for the last 14 days. Flag anything far outside the daily baseline as urgent, warning or stable, and end with my one priority action today.' },
  { id: 'fatigue', pack: 'ads', label: 'Creative Fatigue', short: 'Score each ad', prompt: 'Analyze my ads for creative fatigue.', task: 'Run CREATIVE FATIGUE ANALYSIS. Call get_ads_metrics grouped by ad. Compare CTR and CPA over time per ad, score fatigue 0 to 10, and say refresh, keep or pause for each.' },
  { id: 'roas', pack: 'ads', label: 'ROAS Drop Analysis', short: 'Root causes ranked', prompt: 'My ROAS dropped. Why?', task: 'Run ROAS DROP ROOT CAUSE. Call get_ads_metrics for 30 days and compare with the previous 30. Rank the likely causes with the evidence from the numbers (CTR, CPC, conversion rate, revenue per conversion), then the fix.' },
  { id: 'budget', pack: 'ads', label: 'Budget Optimization', short: 'Profit first reallocation', prompt: 'How should I move my ads budget?', task: 'Run BUDGET OPTIMIZATION. Call get_ads_metrics by campaign. Show current spend share against return, which campaigns to scale or cut, and the expected change. Recommend only: ZieAds never changes campaigns.' },
  { id: 'competitive', pack: 'ads', label: 'Competitive Intel', short: 'Rival ads in the Meta Ad Library', prompt: 'What are my competitors running in ads?', task: 'Run COMPETITIVE INTELLIGENCE. Call get_competitors and get_competitor_content for ads from the Meta Ad Library. Use only public signals: days running, active or ended, number of versions. Never estimate their spend.' },
  { id: 'health', pack: 'ads', label: 'Campaign Health', short: 'Scorecard per campaign', prompt: 'Run a campaign health check.', task: 'Run CAMPAIGN HEALTH SCORECARD. Call get_ads_metrics by campaign and score each on efficiency, trend and conversion quality. List the 3 campaigns that need attention first.' },
  { id: 'abtest', pack: 'ads', label: 'A/B Test Design', short: 'A valid test plan', prompt: 'Design my next A/B test.', task: 'Run A/B TEST DESIGN. Call get_ads_metrics to get my real conversion rate, then design one test with hypothesis, variable, required sample size at 80 percent power and 95 percent confidence, and how long it takes at my current traffic.' },
  { id: 'executive', pack: 'ads', label: 'Executive Summary', short: 'Revenue first summary', prompt: 'Give me an executive summary of my ads.', task: 'Run EXECUTIVE SUMMARY. Call get_ads_metrics for 30 days and get_account_metrics for organic. One paragraph in revenue terms, top 3 wins, top 3 risks, next moves.' },
  { id: 'audience', pack: 'ads', label: 'Audience Quality', short: 'Spot weak traffic', prompt: 'Audit the quality of my ad audiences.', task: 'Run AUDIENCE QUALITY AUDIT. Call get_ads_metrics by ad set. Flag high CTR with very low conversion rate, and ad sets whose cost per conversion is far above the rest.' },
  { id: 'launch', pack: 'ads', label: 'Launch Readiness', short: 'Pre-flight checklist', prompt: 'Is my website ready for a new campaign?', task: 'Run LAUNCH READINESS. Call scan_website on my site for pixels, offer clarity and landing page basics, and get_content_calendar. Return pass or fail per item and the blockers.' },
];

export const ALL_MODES = [...SOCIAL_MODES, ...ADS_MODES];

export type PlanName = 'free' | 'starter' | 'pro' | 'agency';

/** Gating per spec section 11 */
export function modeAccess(plan: PlanName, id: string): { allowed: boolean; needs?: PlanName } {
  const social = SOCIAL_MODES.findIndex((m) => m.id === id);
  if (social >= 0) return plan === 'free' && social >= 2 ? { allowed: false, needs: 'starter' } : { allowed: true };
  if (ADS_MODES.some((m) => m.id === id)) {
    if (plan === 'pro' || plan === 'agency') return { allowed: true };
    if (plan === 'starter' && id === 'executive') return { allowed: true };
    return { allowed: false, needs: plan === 'starter' ? 'pro' : 'starter' };
  }
  return { allowed: false };
}
