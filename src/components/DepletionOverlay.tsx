/**
 * DepletionOverlay — shown when credits reach DEPLETED state.
 * Blocks input area and shows plan-appropriate message + countdown + upgrade CTA.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreditStore, formatCountdown } from '../lib/creditStore';

const PLAN_MESSAGES: Record<string, Record<string, { headline: string; body: string; cta: string }>> = {
  ai_chat: {
    free: {
      headline: "You've used today's free credits.",
      body: "You get 5 AI messages per day on the Free plan. Come back tomorrow, or upgrade to Starter for 20 credits a day.",
      cta: "Upgrade to Starter — $29/mo",
    },
    starter: {
      headline: "Daily chat limit reached.",
      body: "You've used all 20 of today's AI credits. Pro gives you 80 credits a day.",
      cta: "Upgrade to Pro — $79/mo",
    },
    pro: {
      headline: "You've used all 80 daily credits.",
      body: "Heavy day of analysis! Agency plan gives you 300 daily credits.",
      cta: "Upgrade to Agency — $199/mo",
    },
    agency: {
      headline: "Daily credit limit reached.",
      body: "Your account has reached 300 daily credits. Your credits reset at midnight UTC.",
      cta: "Wait for reset",
    },
  },
  skill_run: {
    free: {
      headline: "Monthly scan limit reached.",
      body: "You've used all 10 free scan credits this month. Starter gives you 50 credits per month.",
      cta: "Upgrade to Starter — $29/mo",
    },
    starter: {
      headline: "Monthly skill credits used.",
      body: "You've run through all 50 credits this month. Pro gives you 160 credits — 3× more.",
      cta: "Upgrade to Pro — $79/mo",
    },
    pro: {
      headline: "Monthly skill credits used.",
      body: "You've used 160 skill credits this month. Agency gives you unlimited skill runs.",
      cta: "Upgrade to Agency — $199/mo",
    },
    agency: {
      headline: "Soft cap reached.",
      body: "You've hit the fair-use soft cap. Our team will reach out to discuss a custom plan.",
      cta: "Contact us",
    },
  },
};

interface Props {
  pool?: 'ai_chat' | 'skill_run';
  inline?: boolean; // if true, render inline (not full-screen)
}

export default function DepletionOverlay({ pool = 'ai_chat', inline = false }: Props) {
  const store = useCreditStore();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState('');

  const poolData = pool === 'ai_chat' ? store.ai_chat : store.skill_run;
  const isDepleted = poolData.state === 'DEPLETED' || poolData.state === 'RESET_IMMINENT';

  // Live countdown for ai_chat
  useEffect(() => {
    if (pool !== 'ai_chat' || !poolData.secondsUntilReset) return;
    let secs = poolData.secondsUntilReset;
    setCountdown(formatCountdown(secs));
    const iv = setInterval(() => {
      secs = Math.max(0, secs - 1);
      setCountdown(formatCountdown(secs));
    }, 1000);
    return () => clearInterval(iv);
  }, [poolData.secondsUntilReset, pool]);

  if (!isDepleted) return null;

  const planId = store.plan_id || 'free';
  const messages = PLAN_MESSAGES[pool]?.[planId] || PLAN_MESSAGES[pool]?.free;
  const isAgency = planId === 'agency';

  const handleCTA = () => {
    if (isAgency) {
      window.location.href = 'mailto:founder@zieads.com';
    } else {
      navigate('/pricing');
    }
  };

  if (inline) {
    return (
      <div
        id={`depletion-overlay-${pool}`}
        style={{
          padding: '20px 24px',
          borderRadius: 14,
          background: 'linear-gradient(135deg, #fff5f5, #fef2f2)',
          border: '1px solid #fecaca',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>🔋</div>
        <div style={{ fontWeight: 700, color: '#991b1b', fontSize: '0.95rem', marginBottom: 6 }}>
          {messages.headline}
        </div>
        <p style={{ fontSize: '0.82rem', color: '#7f1d1d', margin: '0 0 16px', lineHeight: 1.6 }}>
          {messages.body}
        </p>
        {countdown && (
          <div style={{
            fontFamily: '"Geist Mono", "Courier New", monospace',
            fontSize: '1.1rem', fontWeight: 700, color: '#ef4444',
            marginBottom: 14,
          }}>
            ⏱ Resets in {countdown}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {!isAgency && (
            <button
              id={`depletion-upgrade-btn-${pool}`}
              onClick={handleCTA}
              style={{
                padding: '9px 20px', borderRadius: 8,
                background: 'var(--primary, #7c3aed)',
                color: '#fff', border: 'none',
                fontSize: '0.82rem', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {messages.cta}
            </button>
          )}
          <button
            onClick={() => store.refresh()}
            style={{
              padding: '9px 20px', borderRadius: 8,
              background: 'transparent',
              color: '#7f1d1d', border: '1px solid #fecaca',
              fontSize: '0.82rem', fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {countdown ? `Resets in ${countdown}` : 'Refresh'}
          </button>
        </div>
      </div>
    );
  }

  // Full-screen overlay variant
  return (
    <div
      id={`depletion-fullscreen-${pool}`}
      style={{
        position: 'absolute', inset: 0,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100,
        borderRadius: 'inherit',
      }}
    >
      <div style={{
        maxWidth: 380, textAlign: 'center', padding: '0 24px',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: '#fef2f2',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          fontSize: '1.75rem',
        }}>🔋</div>
        <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
          {messages.headline}
        </h3>
        <p style={{ margin: '0 0 20px', fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6 }}>
          {messages.body}
        </p>
        {countdown && (
          <div style={{
            fontFamily: '"Geist Mono", "Courier New", monospace',
            fontSize: '1.25rem', fontWeight: 700, color: '#ef4444',
            marginBottom: 20, letterSpacing: '-0.02em',
          }}>
            {countdown}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {!isAgency && (
            <button
              id={`depletion-fs-upgrade-btn-${pool}`}
              onClick={handleCTA}
              style={{
                padding: '12px 0', borderRadius: 10, border: 'none',
                background: 'var(--primary, #7c3aed)',
                color: '#fff', fontSize: '0.875rem', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 4px 14px rgba(124,58,237,0.35)',
              }}
            >
              {messages.cta}
            </button>
          )}
          <button
            onClick={() => store.refresh()}
            style={{
              padding: '11px 0', borderRadius: 10,
              border: '1px solid #e2e8f0', background: 'transparent',
              color: '#64748b', fontSize: '0.875rem', fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Check if credits have reset
          </button>
        </div>
      </div>
    </div>
  );
}
