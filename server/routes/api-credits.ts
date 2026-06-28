import { Router } from 'express';
import crypto from 'crypto';
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

// ─── Dodo Payments Checkout ───────────────────────────────────────────────────

creditsRouter.post('/checkout', async (req, res) => {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { planId, billingCycle } = req.body;
  if (!planId || !billingCycle) {
    return res.status(400).json({ error: 'planId and billingCycle are required' });
  }

  if (planId !== 'starter' && planId !== 'pro' && planId !== 'agency') {
    return res.status(400).json({ error: 'Invalid planId for checkout' });
  }
  if (billingCycle !== 'monthly' && billingCycle !== 'yearly') {
    return res.status(400).json({ error: 'Invalid billingCycle' });
  }

  const productKey = `DODO_PRODUCT_${planId.toUpperCase()}_${billingCycle.toUpperCase()}`;
  const productId = process.env[productKey];

  if (!productId) {
    return res.status(400).json({ error: `Product ID for ${planId} (${billingCycle}) is not configured on the server.` });
  }

  try {
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userError || !userData?.user) {
      return res.status(404).json({ error: 'User auth record not found' });
    }

    const email = userData.user.email;
    const name = userData.user.user_metadata?.full_name || userData.user.user_metadata?.name || '';

    const isLive = process.env.DODO_PAYMENTS_SECRET_KEY?.startsWith('sk_live_') || process.env.DODO_PAYMENTS_ENVIRONMENT === 'live';
    const baseUrl = isLive ? 'https://live.dodopayments.com' : 'https://test.dodopayments.com';

    const origin = req.headers.origin || process.env.APP_URL || 'http://localhost:5173';
    const returnUrl = `${origin}/clients`;

    const response = await fetch(`${baseUrl}/api/v1/checkout-sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DODO_PAYMENTS_SECRET_KEY}`,
      },
      body: JSON.stringify({
        product_cart: [
          {
            product_id: productId,
            quantity: 1,
          },
        ],
        customer: {
          email,
          name,
        },
        return_url: returnUrl,
        metadata: {
          user_id: userId,
          plan_id: planId,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `Dodo Payments error: ${errorText}` });
    }

    const session = await response.json();
    return res.json({ checkout_url: session.checkout_url });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── Dodo Payments Webhook ────────────────────────────────────────────────────

function verifyDodoSignature(
  rawBody: string,
  headers: Record<string, any>,
  secret: string
): boolean {
  const webhookId = headers['webhook-id'];
  const webhookTimestamp = headers['webhook-timestamp'];
  const webhookSignature = headers['webhook-signature'];

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    return false;
  }

  // Check timestamp age (within 5 minutes)
  const now = Math.floor(Date.now() / 1000);
  const timestamp = parseInt(webhookTimestamp, 10);
  if (isNaN(timestamp) || Math.abs(now - timestamp) > 300) {
    return false;
  }

  const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;
  const signatures = webhookSignature.split(' ');
  const secretPart = secret.startsWith('whsec_') ? secret.substring(6) : secret;
  const secretBytes = Buffer.from(secretPart, 'base64');

  for (const sig of signatures) {
    const parts = sig.split(',');
    if (parts.length !== 2 || parts[0] !== 'v1') continue;
    const signatureHash = parts[1];

    const expectedSignature = crypto
      .createHmac('sha256', secretBytes)
      .update(signedContent)
      .digest('base64');

    try {
      const sigBytes = Buffer.from(signatureHash, 'base64');
      const expBytes = Buffer.from(expectedSignature, 'base64');
      if (sigBytes.length === expBytes.length && crypto.timingSafeEqual(sigBytes, expBytes)) {
        return true;
      }
    } catch {
      // Ignore conversion/comparison errors for invalid formats
    }
  }

  return false;
}

creditsRouter.post('/webhook/dodo', async (req, res) => {
  const secret = process.env.DODO_PAYMENTS_WEBHOOK_SECRET;
  
  if (secret) {
    const rawBody = (req as any).rawBody;
    if (!rawBody) {
      console.error('[Webhook] Raw body is missing. Verify middleware configuration in app.ts.');
      return res.status(400).json({ error: 'Missing raw body' });
    }
    const verified = verifyDodoSignature(rawBody, req.headers, secret);
    if (!verified) {
      console.warn('[Webhook] Invalid signature received from Dodo Payments.');
      return res.status(400).json({ error: 'Invalid signature' });
    }
  } else {
    console.warn('[Webhook] DODO_PAYMENTS_WEBHOOK_SECRET is not set. Skipping signature verification.');
  }

  const event = req.body;
  const eventType = event.type;
  const eventData = event.data;

  if (!eventType || !eventData) {
    return res.status(400).json({ error: 'Invalid event payload' });
  }

  try {
    if (
      eventType === 'subscription.active' ||
      eventType === 'subscription.renewed' ||
      eventType === 'subscription.plan_changed'
    ) {
      const userId = eventData.metadata?.user_id;
      const planId = eventData.metadata?.plan_id;

      if (!userId || !planId) {
        console.warn(`[Webhook] Missing user_id (${userId}) or plan_id (${planId}) in metadata.`);
        return res.status(200).json({ received: true, warning: 'Missing metadata' });
      }

      const plan = PLANS[planId as PlanId];
      if (!plan) {
        console.error(`[Webhook] Unknown planId: ${planId}`);
        return res.status(400).json({ error: `Unknown planId: ${planId}` });
      }

      // Fetch credits before change
      const { data: beforeCreds } = await supabaseAdmin
        .from('user_credits')
        .select('ai_chat_daily_remaining, skill_run_monthly_remaining')
        .eq('user_id', userId)
        .single();

      const aiBefore = beforeCreds?.ai_chat_daily_remaining ?? 0;
      const skillBefore = beforeCreds?.skill_run_monthly_remaining ?? 0;

      // Update user plan details
      const { error: planErr } = await supabaseAdmin
        .from('user_plan')
        .update({
          plan_id: planId,
          stripe_subscription_id: eventData.subscription_id,
          billing_anchor_day: eventData.next_billing_date
            ? new Date(eventData.next_billing_date).getUTCDate()
            : new Date().getUTCDate(),
          plan_started_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (planErr) throw planErr;

      // Update user credits
      const { error: creditErr } = await supabaseAdmin
        .from('user_credits')
        .update({
          ai_chat_daily_remaining: plan.aiChatDailyLimit,
          skill_run_monthly_remaining: plan.skillRunMonthlyLimit,
        })
        .eq('user_id', userId);

      if (creditErr) throw creditErr;

      // Insert transaction logs for financial/usage tracking
      await Promise.all([
        supabaseAdmin.from('credit_transactions').insert({
          user_id: userId,
          transaction_type: 'upgrade_adjustment',
          credit_pool: 'ai_chat_daily',
          operation_id: 'plan_upgrade',
          credits_delta: plan.aiChatDailyLimit - aiBefore,
          credits_before: aiBefore,
          credits_after: plan.aiChatDailyLimit,
          plan_id_at_time: planId,
          metadata: { subscription_id: eventData.subscription_id, event_type: eventType },
        }),
        supabaseAdmin.from('credit_transactions').insert({
          user_id: userId,
          transaction_type: 'upgrade_adjustment',
          credit_pool: 'skill_run_monthly',
          operation_id: 'plan_upgrade',
          credits_delta: plan.skillRunMonthlyLimit === -1 ? 0 : plan.skillRunMonthlyLimit - skillBefore,
          credits_before: skillBefore,
          credits_after: plan.skillRunMonthlyLimit,
          plan_id_at_time: planId,
          metadata: { subscription_id: eventData.subscription_id, event_type: eventType },
        }),
      ]);

      console.log(`[Webhook] Successfully activated/updated subscription ${eventData.subscription_id} for user ${userId} to plan ${planId}.`);
    } else if (eventType === 'subscription.cancelled' || eventType === 'subscription.expired') {
      let userId = eventData.metadata?.user_id;
      if (!userId && eventData.subscription_id) {
        const { data: planData } = await supabaseAdmin
          .from('user_plan')
          .select('user_id')
          .eq('stripe_subscription_id', eventData.subscription_id)
          .single();
        userId = planData?.user_id;
      }

      if (!userId) {
        console.warn(`[Webhook] Could not determine user_id for subscription cancellation ${eventData.subscription_id}.`);
        return res.status(200).json({ received: true, warning: 'User not found' });
      }

      const freePlan = PLANS['free'];

      // Fetch credits before change
      const { data: beforeCreds } = await supabaseAdmin
        .from('user_credits')
        .select('ai_chat_daily_remaining, skill_run_monthly_remaining')
        .eq('user_id', userId)
        .single();

      const aiBefore = beforeCreds?.ai_chat_daily_remaining ?? 0;
      const skillBefore = beforeCreds?.skill_run_monthly_remaining ?? 0;

      // Reset plan back to free
      const { error: planErr } = await supabaseAdmin
        .from('user_plan')
        .update({
          plan_id: 'free',
          stripe_subscription_id: null,
          billing_anchor_day: 0,
        })
        .eq('user_id', userId);

      if (planErr) throw planErr;

      // Reset credits back to free
      const { error: creditErr } = await supabaseAdmin
        .from('user_credits')
        .update({
          ai_chat_daily_remaining: freePlan.aiChatDailyLimit,
          skill_run_monthly_remaining: freePlan.skillRunMonthlyLimit,
        })
        .eq('user_id', userId);

      if (creditErr) throw creditErr;

      // Insert transaction logs
      await Promise.all([
        supabaseAdmin.from('credit_transactions').insert({
          user_id: userId,
          transaction_type: 'upgrade_adjustment',
          credit_pool: 'ai_chat_daily',
          operation_id: 'plan_downgrade',
          credits_delta: freePlan.aiChatDailyLimit - aiBefore,
          credits_before: aiBefore,
          credits_after: freePlan.aiChatDailyLimit,
          plan_id_at_time: 'free',
          metadata: { subscription_id: eventData.subscription_id, event_type: eventType },
        }),
        supabaseAdmin.from('credit_transactions').insert({
          user_id: userId,
          transaction_type: 'upgrade_adjustment',
          credit_pool: 'skill_run_monthly',
          operation_id: 'plan_downgrade',
          credits_delta: freePlan.skillRunMonthlyLimit - skillBefore,
          credits_before: skillBefore,
          credits_after: freePlan.skillRunMonthlyLimit,
          plan_id_at_time: 'free',
          metadata: { subscription_id: eventData.subscription_id, event_type: eventType },
        }),
      ]);

      console.log(`[Webhook] Successfully cancelled subscription ${eventData.subscription_id} for user ${userId}. Downgraded to free.`);
    }

    return res.json({ received: true });
  } catch (err: any) {
    console.error('[Webhook] Failed to process webhook event:', err.message);
    return res.status(500).json({ error: err.message });
  }
});
