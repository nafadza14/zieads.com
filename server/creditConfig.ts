/**
 * ZieAds Credit System — Shared Configuration
 * Single source of truth for plan limits, operation costs, and feature flags.
 * Used by both backend API routes and (via import) the frontend credit store.
 */

// ─── Plan Definitions ─────────────────────────────────────────────────────────

export type PlanId = 'free' | 'starter' | 'pro' | 'agency';
export type CreditPool = 'ai_chat_daily' | 'skill_run_monthly';
export type CreditState = 'ACTIVE' | 'WARNING' | 'NEAR_DEPLETED' | 'DEPLETED' | 'RESET_IMMINENT';

export interface PlanConfig {
  planId: PlanId;
  displayName: string;
  priceMonthlyUsd: number;
  priceYearlyUsd: number;
  stripePriceIdMonthly: string | null;
  stripePriceIdYearly: string | null;
  isDefaultOnSignup: boolean;
  description: string;
  aiChatDailyLimit: number;
  skillRunMonthlyLimit: number; // -1 = unlimited
  featureFlags: FeatureFlags;
}

export interface FeatureFlags {
  skillsAccess: string[] | 'all_15';
  skillsLocked: string[];
  aiAgentModesAccess: string[] | 'all';
  aiAgentModesLocked: string[];
  pdfExport: boolean;
  pdfBranding: 'zieads_branded' | 'white_label' | 'white_label_agency';
  whiteLabelPdf: boolean;
  customAgencyLogo: boolean;
  reportHistoryDays: number; // -1 = unlimited
  teamSeats: number;
  clientDashboard: boolean;
  apiAccess: boolean;
  apiTokenLimitMonthly: number; // -1 = unlimited
  priorityQueue: boolean;
  auditHistoryInAi: boolean;
  businessProfile: boolean;
  monthlyAggregateReports: boolean;
}

export const ALL_SKILLS = [
  'ads_audit', 'ads_quick', 'ads_copy', 'ads_creatives',
  'ads_landing', 'ads_audiences', 'ads_competitors', 'ads_funnel',
  'ads_budget', 'ads_google', 'ads_meta', 'ads_tiktok',
  'ads_linkedin', 'ads_report', 'ads_report_pdf',
];

export const ALL_AI_MODES = [
  'basic_chat', 'daily_diagnosis', 'roas_drop_analysis', 'creative_fatigue',
  'budget_optimization', 'competitive_intel', 'launch_readiness',
];

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    planId: 'free',
    displayName: 'Free',
    priceMonthlyUsd: 0,
    priceYearlyUsd: 0,
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    isDefaultOnSignup: true,
    description: 'Get started with basic ads readiness scanning.',
    aiChatDailyLimit: 5,
    skillRunMonthlyLimit: 10,
    featureFlags: {
      skillsAccess: ['ads_audit', 'ads_quick', 'ads_copy', 'ads_creatives'],
      skillsLocked: ['ads_landing', 'ads_audiences', 'ads_competitors', 'ads_funnel', 'ads_budget', 'ads_google', 'ads_meta', 'ads_tiktok'],
      aiAgentModesAccess: ['basic_chat'],
      aiAgentModesLocked: ['daily_diagnosis', 'roas_drop_analysis', 'creative_fatigue', 'budget_optimization', 'competitive_intel', 'launch_readiness'],
      pdfExport: true,
      pdfBranding: 'zieads_branded',
      whiteLabelPdf: false,
      customAgencyLogo: false,
      reportHistoryDays: 3,
      teamSeats: 1,
      clientDashboard: false,
      apiAccess: false,
      apiTokenLimitMonthly: 0,
      priorityQueue: false,
      auditHistoryInAi: false,
      businessProfile: true,
      monthlyAggregateReports: false,
    },
  },

  starter: {
    planId: 'starter',
    displayName: 'Starter',
    priceMonthlyUsd: 29,
    priceYearlyUsd: 278,
    stripePriceIdMonthly: 'price_starter_monthly',
    stripePriceIdYearly: 'price_starter_yearly',
    isDefaultOnSignup: false,
    description: 'Perfect for solo founders and small operators running their own ads.',
    aiChatDailyLimit: 20,
    skillRunMonthlyLimit: 50,
    featureFlags: {
      skillsAccess: 'all_15',
      skillsLocked: [],
      aiAgentModesAccess: ['basic_chat', 'daily_diagnosis', 'roas_drop_analysis', 'creative_fatigue', 'launch_readiness'],
      aiAgentModesLocked: ['budget_optimization', 'competitive_intel'],
      pdfExport: true,
      pdfBranding: 'zieads_branded',
      whiteLabelPdf: false,
      customAgencyLogo: false,
      reportHistoryDays: 7,
      teamSeats: 1,
      clientDashboard: false,
      apiAccess: false,
      apiTokenLimitMonthly: 0,
      priorityQueue: false,
      auditHistoryInAi: true,
      businessProfile: true,
      monthlyAggregateReports: false,
    },
  },

  pro: {
    planId: 'pro',
    displayName: 'Pro',
    priceMonthlyUsd: 79,
    priceYearlyUsd: 758,
    stripePriceIdMonthly: 'price_pro_monthly',
    stripePriceIdYearly: 'price_pro_yearly',
    isDefaultOnSignup: false,
    description: 'Built for in-house teams and freelancers scaling ad spend for multiple clients.',
    aiChatDailyLimit: 80,
    skillRunMonthlyLimit: 160,
    featureFlags: {
      skillsAccess: 'all_15',
      skillsLocked: [],
      aiAgentModesAccess: 'all',
      aiAgentModesLocked: [],
      pdfExport: true,
      pdfBranding: 'white_label',
      whiteLabelPdf: true,
      customAgencyLogo: false,
      reportHistoryDays: -1,
      teamSeats: 1,
      clientDashboard: false,
      apiAccess: true,
      apiTokenLimitMonthly: 10_000_000,
      priorityQueue: true,
      auditHistoryInAi: true,
      businessProfile: true,
      monthlyAggregateReports: false,
    },
  },

  agency: {
    planId: 'agency',
    displayName: 'Agency',
    priceMonthlyUsd: 199,
    priceYearlyUsd: 1910,
    stripePriceIdMonthly: 'price_agency_monthly',
    stripePriceIdYearly: 'price_agency_yearly',
    isDefaultOnSignup: false,
    description: 'For marketing agencies managing multiple ad accounts for clients.',
    aiChatDailyLimit: 300,
    skillRunMonthlyLimit: -1, // unlimited
    featureFlags: {
      skillsAccess: 'all_15',
      skillsLocked: [],
      aiAgentModesAccess: 'all',
      aiAgentModesLocked: [],
      pdfExport: true,
      pdfBranding: 'white_label_agency',
      whiteLabelPdf: true,
      customAgencyLogo: true,
      reportHistoryDays: -1,
      teamSeats: 5,
      clientDashboard: true,
      apiAccess: true,
      apiTokenLimitMonthly: -1,
      priorityQueue: true,
      auditHistoryInAi: true,
      businessProfile: true,
      monthlyAggregateReports: true,
    },
  },
};

// ─── Credit Costs ─────────────────────────────────────────────────────────────

export interface OperationCost {
  operationId: string;
  creditPool: CreditPool;
  cost: number;
  description: string;
}

export const OPERATION_COSTS: Record<string, OperationCost> = {
  // AI Chat
  chat_message:            { operationId: 'chat_message',            creditPool: 'ai_chat_daily',       cost: 1, description: 'Standard text message' },
  chat_message_search:     { operationId: 'chat_message_search',     creditPool: 'ai_chat_daily',       cost: 2, description: 'Message with web search' },
  chat_message_attachment: { operationId: 'chat_message_attachment', creditPool: 'ai_chat_daily',       cost: 3, description: 'Message with file/image attachment' },
  analysis_mode:           { operationId: 'analysis_mode',           creditPool: 'ai_chat_daily',       cost: 5, description: 'Activating a named analysis mode (first message)' },
  deep_analysis:           { operationId: 'deep_analysis',           creditPool: 'ai_chat_daily',       cost: 5, description: 'Deep Analysis run from AI Agent' },

  // Skills
  skill_ads_quick:         { operationId: 'skill_ads_quick',         creditPool: 'skill_run_monthly',   cost: 1, description: '60-second ads readiness snapshot' },
  skill_ads_copy:          { operationId: 'skill_ads_copy',          creditPool: 'skill_run_monthly',   cost: 2, description: 'Ad copy generation' },
  skill_ads_creatives:     { operationId: 'skill_ads_creatives',     creditPool: 'skill_run_monthly',   cost: 2, description: 'Creative brief with 3 concepts' },
  skill_ads_landing:       { operationId: 'skill_ads_landing',       creditPool: 'skill_run_monthly',   cost: 2, description: 'Landing page CRO audit' },
  skill_ads_audiences:     { operationId: 'skill_ads_audiences',     creditPool: 'skill_run_monthly',   cost: 2, description: 'Audience targeting matrices' },
  skill_ads_competitors:   { operationId: 'skill_ads_competitors',   creditPool: 'skill_run_monthly',   cost: 3, description: 'Competitor intelligence (includes web search)' },
  skill_ads_funnel:        { operationId: 'skill_ads_funnel',        creditPool: 'skill_run_monthly',   cost: 2, description: 'TOFU/MOFU/BOFU funnel routing' },
  skill_ads_budget:        { operationId: 'skill_ads_budget',        creditPool: 'skill_run_monthly',   cost: 2, description: 'Budget allocation model' },
  skill_ads_google:        { operationId: 'skill_ads_google',        creditPool: 'skill_run_monthly',   cost: 2, description: 'Google Ads strategy' },
  skill_ads_meta:          { operationId: 'skill_ads_meta',          creditPool: 'skill_run_monthly',   cost: 2, description: 'Meta Ads strategy' },
  skill_ads_tiktok:        { operationId: 'skill_ads_tiktok',        creditPool: 'skill_run_monthly',   cost: 2, description: 'TikTok Ads strategy' },
  skill_ads_audit:         { operationId: 'skill_ads_audit',         creditPool: 'skill_run_monthly',   cost: 3, description: 'Full audit (5 agents, all 6 dimensions)' },
  export_pdf:              { operationId: 'export_pdf',              creditPool: 'skill_run_monthly',   cost: 1, description: 'Export any report to PDF' },
};

// Mapping from skill route name (e.g. "audit") to operation_id
export const SKILL_ROUTE_TO_OPERATION: Record<string, string> = {
  audit:       'skill_ads_audit',
  quick:       'skill_ads_quick',
  copy:        'skill_ads_copy',
  creatives:   'skill_ads_creatives',
  landing:     'skill_ads_landing',
  audiences:   'skill_ads_audiences',
  competitors: 'skill_ads_competitors',
  funnel:      'skill_ads_funnel',
  budget:      'skill_ads_budget',
  google:      'skill_ads_google',
  meta:        'skill_ads_meta',
  tiktok:      'skill_ads_tiktok',
};

// ─── Credit State Machine ─────────────────────────────────────────────────────

export function computeCreditState(remaining: number, dailyLimit: number, secondsUntilReset?: number): CreditState {
  if (remaining <= 0 && secondsUntilReset !== undefined && secondsUntilReset <= 900) return 'RESET_IMMINENT';
  if (remaining <= 0) return 'DEPLETED';
  if (remaining <= 2) return 'NEAR_DEPLETED';
  if (remaining <= dailyLimit * 0.25) return 'WARNING';
  return 'ACTIVE';
}

// ─── Plan Feature Access Checks ───────────────────────────────────────────────

export function isSkillAccessible(planId: PlanId, skillId: string): boolean {
  const flags = PLANS[planId].featureFlags;
  if (flags.skillsAccess === 'all_15') return true;
  return (flags.skillsAccess as string[]).includes(skillId);
}

export function isAiModeAccessible(planId: PlanId, modeId: string): boolean {
  const flags = PLANS[planId].featureFlags;
  if (flags.aiAgentModesAccess === 'all') return true;
  return (flags.aiAgentModesAccess as string[]).includes(modeId);
}

// ─── Upgrade Path ─────────────────────────────────────────────────────────────

export const UPGRADE_PATH: PlanId[] = ['free', 'starter', 'pro', 'agency'];

export function getNextPlan(currentPlanId: PlanId): PlanId | null {
  const idx = UPGRADE_PATH.indexOf(currentPlanId);
  if (idx === -1 || idx === UPGRADE_PATH.length - 1) return null;
  return UPGRADE_PATH[idx + 1];
}
