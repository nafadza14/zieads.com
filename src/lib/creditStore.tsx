/**
 * ZieAds Frontend Credit Store
 * React Context + Hook for managing credit state across the app.
 * Polls /api/v1/credits/balance every 30s; invalidates on user actions.
 */
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from './supabaseClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreditState = 'ACTIVE' | 'WARNING' | 'NEAR_DEPLETED' | 'DEPLETED' | 'RESET_IMMINENT';
export type PlanId = 'free' | 'starter' | 'pro' | 'agency';

export interface CreditPoolState {
  remaining: number;
  limit: number;
  state: CreditState;
  resetAt?: string;
  secondsUntilReset?: number;
}

export interface CreditBalance {
  ai_chat: CreditPoolState;
  skill_run: CreditPoolState;
  plan_id: PlanId;
  plan_display_name: string;
  feature_flags: any;
  upgrade_available: boolean;
  next_plan_id: PlanId | null;
  loading: boolean;
  error: string | null;
}

export interface CheckResult {
  allowed: boolean;
  credits_required: number;
  credits_remaining: number;
  credit_pool: string;
  reason: string | null;
  upgrade_suggestion: PlanId | null;
  feature_locked: boolean;
}

interface CreditContextValue extends CreditBalance {
  refresh: () => Promise<void>;
  checkOperation: (operationId: string, skillId?: string, modeId?: string) => Promise<CheckResult>;
  deduct: (operationId: string, creditPool: string, amount: number, metadata?: any) => Promise<boolean>;
  refund: (operationId: string, creditPool: string, amount: number, metadata?: any) => Promise<void>;
  isSkillLocked: (skillId: string) => boolean;
  isModeLocked: (modeId: string) => boolean;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_BALANCE: CreditBalance = {
  ai_chat: { remaining: 0, limit: 5, state: 'ACTIVE' },
  skill_run: { remaining: 0, limit: 10, state: 'ACTIVE' },
  plan_id: 'free',
  plan_display_name: 'Free',
  feature_flags: {},
  upgrade_available: true,
  next_plan_id: 'starter',
  loading: true,
  error: null,
};

const CreditContext = createContext<CreditContextValue>({
  ...DEFAULT_BALANCE,
  refresh: async () => {},
  checkOperation: async () => ({ allowed: false, credits_required: 0, credits_remaining: 0, credit_pool: 'ai_chat_daily', reason: null, upgrade_suggestion: null, feature_locked: false }),
  deduct: async () => false,
  refund: async () => {},
  isSkillLocked: () => false,
  isModeLocked: () => false,
});

// ─── Provider ─────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const CACHE_TTL_MS = 30_000;

export function CreditProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState<CreditBalance>(DEFAULT_BALANCE);
  const [lastFetch, setLastFetch] = useState<number>(0);

  const getAuthHeader = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  }, []);

  const fetchBalance = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastFetch < CACHE_TTL_MS) return;

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      setBalance({ ...DEFAULT_BALANCE, loading: false });
      return;
    }

    try {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_BASE}/api/v1/credits/balance`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      setBalance({
        ai_chat: {
          remaining: json.ai_chat.remaining,
          limit: json.ai_chat.daily_limit,
          state: json.ai_chat.state,
          resetAt: json.ai_chat.reset_at,
          secondsUntilReset: json.ai_chat.seconds_until_reset,
        },
        skill_run: {
          remaining: json.skill_run.remaining,
          limit: json.skill_run.monthly_limit,
          state: json.skill_run.state,
        },
        plan_id: json.plan_id,
        plan_display_name: json.plan_display_name,
        feature_flags: json.feature_flags,
        upgrade_available: json.upgrade_available,
        next_plan_id: json.next_plan_id,
        loading: false,
        error: null,
      });
      setLastFetch(now);
    } catch (err: any) {
      setBalance(prev => ({ ...prev, loading: false, error: err.message }));
    }
  }, [lastFetch, getAuthHeader]);

  // Initial fetch + 30s polling
  useEffect(() => {
    fetchBalance(true);
    const interval = setInterval(() => fetchBalance(true), CACHE_TTL_MS);
    return () => clearInterval(interval);
  }, []);

  const refresh = useCallback(() => fetchBalance(true), [fetchBalance]);

  const checkOperation = useCallback(async (operationId: string, skillId?: string, modeId?: string): Promise<CheckResult> => {
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_BASE}/api/v1/credits/check`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ operation_id: operationId, skill_id: skillId, mode_id: modeId }),
      });
      return await res.json();
    } catch {
      return { allowed: false, credits_required: 0, credits_remaining: 0, credit_pool: 'ai_chat_daily', reason: 'Network error', upgrade_suggestion: null, feature_locked: false };
    }
  }, [getAuthHeader]);

  const deduct = useCallback(async (operationId: string, creditPool: string, amount: number, metadata?: any): Promise<boolean> => {
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_BASE}/api/v1/credits/deduct`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ operation_id: operationId, credit_pool: creditPool, amount, metadata }),
      });
      if (!res.ok) return false;
      // Invalidate cache immediately
      setLastFetch(0);
      await fetchBalance(true);
      return true;
    } catch {
      return false;
    }
  }, [getAuthHeader, fetchBalance]);

  const refund = useCallback(async (operationId: string, creditPool: string, amount: number, metadata?: any) => {
    try {
      const headers = await getAuthHeader();
      await fetch(`${API_BASE}/api/v1/credits/refund`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ operation_id: operationId, credit_pool: creditPool, amount, metadata }),
      });
      setLastFetch(0);
      await fetchBalance(true);
    } catch {}
  }, [getAuthHeader, fetchBalance]);

  const isSkillLocked = useCallback((skillId: string): boolean => {
    const flags = balance.feature_flags;
    if (!flags) return false;
    if (flags.skills_access === 'all_15') return false;
    if (Array.isArray(flags.skills_locked) && flags.skills_locked.includes(skillId)) return true;
    return false;
  }, [balance.feature_flags]);

  const isModeLocked = useCallback((modeId: string): boolean => {
    const flags = balance.feature_flags;
    if (!flags) return false;
    if (flags.ai_agent_modes_access === 'all') return false;
    if (Array.isArray(flags.ai_agent_modes_locked) && flags.ai_agent_modes_locked.includes(modeId)) return true;
    return false;
  }, [balance.feature_flags]);

  return (
    <CreditContext.Provider value={{ ...balance, refresh, checkOperation, deduct, refund, isSkillLocked, isModeLocked }}>
      {children}
    </CreditContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCreditStore() {
  return useContext(CreditContext);
}

// ─── Utility: Format time ─────────────────────────────────────────────────────

export function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function getStateColor(state: CreditState): string {
  switch (state) {
    case 'ACTIVE':       return '#10b981';
    case 'WARNING':      return '#f59e0b';
    case 'NEAR_DEPLETED': return '#f97316';
    case 'DEPLETED':
    case 'RESET_IMMINENT': return '#ef4444';
    default:             return '#6b7280';
  }
}
