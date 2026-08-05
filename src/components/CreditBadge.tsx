/**
 * CreditBadge — compact pill shown in sidebar/navbar
 * Displays remaining credits with colour-coded state and countdown on hover.
 */
import { useState, useEffect } from 'react';
import { useCreditStore, formatCountdown, getStateColor, CreditState } from '../lib/creditStore';
import { useNavigate } from 'react-router-dom';

const STATE_LABELS: Record<CreditState, string> = {
  ACTIVE:        'Credits',
  WARNING:       'Low credits',
  NEAR_DEPLETED: 'Almost out',
  DEPLETED:      'Credits used',
  RESET_IMMINENT:'Resetting soon',
};

interface Props {
  pool?: 'ai_chat' | 'skill_run';
  compact?: boolean;
}

export default function CreditBadge({ pool = 'ai_chat', compact = false }: Props) {
  const store = useCreditStore();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const [countdown, setCountdown] = useState('');

  const poolData = pool === 'ai_chat' ? store.ai_chat : store.skill_run;
  const color = getStateColor(poolData.state);

  // Live countdown ticker
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

  if (store.loading) return null;

  const isLow = poolData.state === 'WARNING' || poolData.state === 'NEAR_DEPLETED';
  const isDepleted = poolData.state === 'DEPLETED' || poolData.state === 'RESET_IMMINENT';
  const remaining = poolData.remaining === -1 ? '∞' : poolData.remaining;

  return (
    <div
      id={`credit-badge-${pool}`}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Badge Pill */}
      <button
        onClick={() => navigate('/pricing')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: compact ? '3px 8px' : '4px 10px',
          borderRadius: 9999,
          border: `1px solid ${color}33`,
          background: isDepleted ? `${color}18` : `${color}10`,
          color,
          fontSize: compact ? '0.7rem' : '0.75rem',
          fontWeight: 600,
          fontFamily: 'inherit',
          cursor: 'pointer',
          transition: 'all 0.2s',
          userSelect: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        {/* Dot indicator */}
        <span style={{
          width: 6, height: 6, borderRadius: '50%', background: color,
          animation: isDepleted ? 'pulse 1.5s infinite' : isLow ? 'pulse 3s infinite' : 'none',
          flexShrink: 0,
        }} />
        {compact ? remaining : (
          <>
            {remaining}
            <span style={{ opacity: 0.7, fontWeight: 400 }}>
              {pool === 'ai_chat' ? ' / day' : ' / mo'}
            </span>
          </>
        )}
      </button>

      {/* Tooltip */}
      {hovered && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#1a1a2e',
          color: '#fff',
          borderRadius: 8,
          padding: '10px 14px',
          fontSize: '0.78rem',
          whiteSpace: 'nowrap',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          zIndex: 9999,
          pointerEvents: 'none',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 4, color }}>
            {STATE_LABELS[poolData.state]}
          </div>
          <div style={{ color: '#d1d5db' }}>
            {pool === 'ai_chat'
              ? `${remaining} AI chat credits left today`
              : `${remaining} skill credits left this month`}
          </div>
          {pool === 'ai_chat' && countdown && (
            <div style={{ color: '#9ca3af', marginTop: 4 }}>
              Resets in {countdown}
            </div>
          )}
          {store.upgrade_available && (isDepleted || isLow) && (
            <div style={{
              marginTop: 8,
              padding: '4px 8px',
              background: 'var(--primary, #7c3aed)',
              borderRadius: 5,
              textAlign: 'center',
              fontWeight: 600,
              color: '#fff',
              fontSize: '0.72rem',
            }}>
              Upgrade to {store.plan_display_name === 'Free' ? 'Starter' : store.plan_display_name === 'Starter' ? 'Pro' : 'Agency'}
            </div>
          )}
          {/* Tooltip arrow */}
          <div style={{
            position: 'absolute',
            top: '100%', left: '50%', transform: 'translateX(-50%)',
            border: '5px solid transparent',
            borderTopColor: '#1a1a2e',
          }} />
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
