import { Router } from 'express';
import { supabaseAdmin, getUserIdFromRequest } from '../supabaseServer.js';
import {
  PLANS,
  OPERATION_COSTS,
  computeCreditState,
  isSkillAccessible,
  isAiModeAccessible,
  getNextPlan,
  type PlanId,
  type CreditPool,
} from '../creditConfig.js';

export const creditsRouter = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getUserPlanAndCredits(userId: string) {
  const [planRes, creditsRes] = await Promise.all([
    supabaseAdmin.from('user_plan').select('*').eq('user_id', userId).single(),
    supabaseAdmin.from('user_credits').select('*').eq('user_id', userId).single(),
  ]);

  // Auto-provision if rows don't exist yet (legacy users)
  let planData = planRes.data;
  let creditsData = creditsRes.data;

  if (!planData) {
    await supabaseAdmin.from('user_plan').insert({ user_id: userId, plan_id: 'free', billing_anchor_day: 0 });
    planData = { user_id: userId, plan_id: 'free', billing_anchor_day: 0 };
  }
  if (!creditsData) {
    await supabaseAdmin.from('user_credits').insert({ user_id: userId, ai_chat_daily_remaining: 5, skill_run_monthly_remaining: 10 });
    creditsData = { user_id: userId, ai_chat_daily_remaining: 5, skill_run_monthly_remaining: 10, ai_chat_daily_last_reset: new Date().toISOString(), skill_run_monthly_last_reset: new Date().toISOString() };
  }

  return { planData, creditsData };
}

/**
 * Check if daily AI chat credits need resetting (midnight UTC with 60s grace)
 * and perform the reset if needed.
 */
async function maybeResetDailyCredits(userId: string, planId: PlanId, creditsData: any) {
  const plan = PLANS[planId];
  const lastReset = new Date(creditsData.ai_chat_daily_last_reset);
  const now = new Date();
  const nextReset = new Date(lastReset);
  nextReset.setUTCHours(0, 0, 0, 0);
  nextReset.setUTCDate(nextReset.getUTCDate() + 1);

  // 60-second grace period for clock skew
  if (now.getTime() >= nextReset.getTime() - 60_000) {
    await supabaseAdmin.rpc('reset_daily_credits', {
      p_user_id: userId,
      p_new_limit: plan.aiChatDailyLimit,
      p_plan_id: planId,
    });
    return plan.aiChatDailyLimit;
  }
  return creditsData.ai_chat_daily_remaining as number;
}

/**
 * Check if monthly skill credits need resetting and perform if needed.
 */
async function maybeResetMonthlyCredits(userId: string, planId: PlanId, creditsData: any, billingAnchorDay: number) {
  const plan = PLANS[planId];
  if (plan.skillRunMonthlyLimit === -1) return -1; // unlimited

  const lastReset = new Date(creditsData.skill_run_monthly_last_reset);
  const now = new Date();

  // Determine next reset date based on billing anchor (0 = 1st of month)
  const anchorDay = billingAnchorDay || 1;
  let nextReset = new Date(Date.UTC(lastReset.getUTCFullYear(), lastReset.getUTCMonth(), anchorDay));
  if (nextReset <= lastReset) {
    nextReset = new Date(Date.UTC(lastReset.getUTCFullYear(), lastReset.getUTCMonth() + 1, anchorDay));
  }

  if (now >= nextReset) {
    await supabaseAdmin.rpc('reset_monthly_skill_credits', {
      p_user_id: userId,
      p_new_limit: plan.skillRunMonthlyLimit,
      p_plan_id: planId,
    });
    return plan.skillRunMonthlyLimit;
  }
  return creditsData.skill_run_monthly_remaining as number;
}

function secondsUntilMidnightUTC(): number {
  const now = new Date();
  const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
}

// ─── GET /balance ─────────────────────────────────────────────────────────────

creditsRouter.get('/balance', async (req, res) => {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { planData, creditsData } = await getUserPlanAndCredits(userId);
    const planId = (planData.plan_id || 'free') as PlanId;
    const plan = PLANS[planId];

    // Auto-reset if needed
    const aiChatRemaining = await maybeResetDailyCredits(userId, planId, creditsData);
    const skillRunRemaining = await maybeResetMonthlyCredits(userId, planId, creditsData, planData.billing_anchor_day);

    const secsToReset = secondsUntilMidnightUTC();
    const resetAt = new Date(Date.now() + secsToReset * 1000).toISOString();

    const aiChatState = computeCreditState(aiChatRemaining, plan.aiChatDailyLimit, secsToReset);
    const skillState  = computeCreditState(
      skillRunRemaining === -1 ? 9999 : skillRunRemaining,
      plan.skillRunMonthlyLimit === -1 ? 9999 : plan.skillRunMonthlyLimit,
    );

    const nextPlan = getNextPlan(planId);

    return res.json({
      ai_chat: {
        remaining: aiChatRemaining,
        daily_limit: plan.aiChatDailyLimit,
        reset_at: resetAt,
        seconds_until_reset: secsToReset,
        state: aiChatState,
      },
      skill_run: {
        remaining: skillRunRemaining,
        monthly_limit: plan.skillRunMonthlyLimit,
        state: skillState,
      },
      plan_id: planId,
      plan_display_name: plan.displayName,
      feature_flags: plan.featureFlags,
      upgrade_available: nextPlan !== null,
      next_plan_id: nextPlan,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── POST /check ──────────────────────────────────────────────────────────────

creditsRouter.post('/check', async (req, res) => {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { operation_id, skill_id, mode_id } = req.body;

  try {
    const { planData, creditsData } = await getUserPlanAndCredits(userId);
    const planId = (planData.plan_id || 'free') as PlanId;
    const plan = PLANS[planId];

    // Feature access checks
    if (skill_id && !isSkillAccessible(planId, skill_id)) {
      const nextPlan = getNextPlan(planId);
      return res.json({
        allowed: false,
        reason: `${skill_id} is not available on the ${plan.displayName} plan.`,
        upgrade_suggestion: nextPlan,
        feature_locked: true,
        credits_required: 0,
        credits_remaining: 0,
        credit_pool: 'skill_run_monthly' as CreditPool,
      });
    }
    if (mode_id && !isAiModeAccessible(planId, mode_id)) {
      const nextPlan = getNextPlan(planId);
      return res.json({
        allowed: false,
        reason: `${mode_id} analysis mode is not available on the ${plan.displayName} plan.`,
        upgrade_suggestion: nextPlan,
        feature_locked: true,
        credits_required: 0,
        credits_remaining: 0,
        credit_pool: 'ai_chat_daily' as CreditPool,
      });
    }

    // Credit cost check
    if (!operation_id || !OPERATION_COSTS[operation_id]) {
      return res.status(400).json({ error: 'Unknown operation_id' });
    }

    const op = OPERATION_COSTS[operation_id];
    const aiChatRemaining = await maybeResetDailyCredits(userId, planId, creditsData);
    const skillRunRemaining = await maybeResetMonthlyCredits(userId, planId, creditsData, planData.billing_anchor_day);

    let creditsRemaining = op.creditPool === 'ai_chat_daily' ? aiChatRemaining : skillRunRemaining;
    if (creditsRemaining === -1) creditsRemaining = 9999; // unlimited

    const allowed = creditsRemaining >= op.cost;
    const nextPlan = allowed ? null : getNextPlan(planId);

    return res.json({
      allowed,
      credits_required: op.cost,
      credits_remaining: creditsRemaining,
      credit_pool: op.creditPool,
      reason: allowed ? null : `Insufficient ${op.creditPool === 'ai_chat_daily' ? 'daily chat' : 'monthly skill'} credits.`,
      upgrade_suggestion: nextPlan,
      feature_locked: false,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── POST /deduct ─────────────────────────────────────────────────────────────

creditsRouter.post('/deduct', async (req, res) => {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { operation_id, credit_pool, amount, metadata } = req.body;
  if (!operation_id || !credit_pool || !amount) {
    return res.status(400).json({ error: 'operation_id, credit_pool, amount are required' });
  }

  try {
    const { planData } = await getUserPlanAndCredits(userId);
    const planId = (planData.plan_id || 'free') as PlanId;

    const result = await supabaseAdmin.rpc('atomic_deduct_credits', {
      p_user_id: userId,
      p_pool: credit_pool,
      p_amount: amount,
      p_operation_id: operation_id,
      p_plan_id: planId,
      p_metadata: metadata || null,
    });

    if (result.error) return res.status(500).json({ error: result.error.message });

    const status = result.data as string;
    if (status === 'insufficient') {
      return res.status(402).json({
        error: 'INSUFFICIENT_CREDITS',
        message: 'Not enough credits to perform this operation.',
      });
    }

    // Fetch new balance
    const { data: newCredits } = await supabaseAdmin
      .from('user_credits')
      .select('ai_chat_daily_remaining, skill_run_monthly_remaining')
      .eq('user_id', userId)
      .single();

    return res.json({
      success: true,
      status,
      new_balance: credit_pool === 'ai_chat_daily'
        ? (newCredits?.ai_chat_daily_remaining ?? 0)
        : (newCredits?.skill_run_monthly_remaining ?? 0),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── POST /refund ─────────────────────────────────────────────────────────────

creditsRouter.post('/refund', async (req, res) => {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { operation_id, credit_pool, amount, metadata } = req.body;
  if (!operation_id || !credit_pool || !amount) {
    return res.status(400).json({ error: 'operation_id, credit_pool, amount are required' });
  }

  try {
    const { planData, creditsData } = await getUserPlanAndCredits(userId);
    const planId = (planData.plan_id || 'free') as PlanId;
    const plan = PLANS[planId];

    // Cap refund at plan limit
    const field = credit_pool === 'ai_chat_daily' ? 'ai_chat_daily_remaining' : 'skill_run_monthly_remaining';
    const before = creditsData[field] as number;
    const cap = credit_pool === 'ai_chat_daily' ? plan.aiChatDailyLimit : plan.skillRunMonthlyLimit;
    const after = cap === -1 ? before : Math.min(before + amount, cap);

    await supabaseAdmin.from('user_credits').update({ [field]: after }).eq('user_id', userId);

    await supabaseAdmin.from('credit_transactions').insert({
      user_id: userId,
      transaction_type: 'refund',
      credit_pool,
      operation_id,
      credits_delta: after - before,
      credits_before: before,
      credits_after: after,
      plan_id_at_time: planId,
      metadata: metadata || null,
    });

    return res.json({ success: true, new_balance: after });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
