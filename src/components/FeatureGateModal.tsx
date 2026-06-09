/**
 * FeatureGateModal — shown when a user clicks a locked skill or AI mode.
 * Displays what the feature does, which plan unlocks it, and upgrade CTA.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PLAN_COLORS: Record<string, string> = {
  starter: '#f59e0b',
  pro: '#7c3aed',
  agency: '#0ea5e9',
};

const PLAN_PRICES: Record<string, string> = {
  starter: '$29/mo',
  pro: '$79/mo',
  agency: '$199/mo',
};

export interface FeatureGateProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  featureDescription?: string;
  requiredPlan?: 'starter' | 'pro' | 'agency';
  featureType?: 'skill' | 'mode' | 'other';
}

export default function FeatureGateModal({
  isOpen,
  onClose,
  featureName,
  featureDescription,
  requiredPlan = 'starter',
  featureType = 'skill',
}: FeatureGateProps) {
  const navigate = useNavigate();
  const planColor = PLAN_COLORS[requiredPlan] || '#7c3aed';
  const planPrice = PLAN_PRICES[requiredPlan] || '$29/mo';
  const planName = requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const featureTypeLabel = featureType === 'mode' ? 'analysis mode' : 'skill';

  return (
    <>
      {/* Backdrop */}
      <div
        id="feature-gate-backdrop"
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
          zIndex: 9000,
          animation: 'fadeIn 0.15s ease',
        }}
      />

      {/* Modal */}
      <div
        id="feature-gate-modal"
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9001,
          width: 'min(480px, 92vw)',
          background: '#fff',
          borderRadius: 20,
          boxShadow: '0 25px 80px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          animation: 'slideUp 0.2s ease',
        }}
      >
        {/* Header accent bar */}
        <div style={{
          height: 4,
          background: `linear-gradient(90deg, ${planColor}, ${planColor}88)`,
        }} />

        <div style={{ padding: '32px 32px 28px' }}>
          {/* Lock icon */}
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: `${planColor}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 20,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={planColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          {/* Title */}
          <h2 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
            {featureName} is a {planName} feature
          </h2>
          <p style={{ margin: '0 0 20px', fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6 }}>
            {featureDescription || `Unlock ${featureName} and all ${featureTypeLabel}s on ${planName} and above.`}
          </p>

          {/* What you get */}
          <div style={{
            background: `${planColor}0d`,
            border: `1px solid ${planColor}22`,
            borderRadius: 12,
            padding: '14px 16px',
            marginBottom: 24,
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: planColor, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Upgrade to {planName} to unlock
            </div>
            {requiredPlan === 'starter' && (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {['All 15 AI skill commands', '20 chat credits/day', '50 skill run credits/month', '7-day report history'].map(f => (
                  <li key={f} style={{ display: 'flex', gap: 8, fontSize: '0.82rem', color: '#334155' }}>
                    <span style={{ color: planColor, fontWeight: 700 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
            )}
            {requiredPlan === 'pro' && (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {['All 6 AI analysis modes', '80 chat credits/day', '160 skill credits/month', 'White-label PDF reports', 'Priority queue & API access'].map(f => (
                  <li key={f} style={{ display: 'flex', gap: 8, fontSize: '0.82rem', color: '#334155' }}>
                    <span style={{ color: planColor, fontWeight: 700 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
            )}
            {requiredPlan === 'agency' && (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {['Unlimited skill runs', '300 chat credits/day', '5 team seats', 'Client management dashboard', 'Custom agency logo on PDFs'].map(f => (
                  <li key={f} style={{ display: 'flex', gap: 8, fontSize: '0.82rem', color: '#334155' }}>
                    <span style={{ color: planColor, fontWeight: 700 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              id="feature-gate-upgrade-btn"
              onClick={() => { navigate('/pricing'); onClose(); }}
              style={{
                width: '100%',
                padding: '13px 0',
                borderRadius: 10,
                border: 'none',
                background: `linear-gradient(135deg, ${planColor}, ${planColor}cc)`,
                color: '#fff',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'opacity 0.2s',
                boxShadow: `0 4px 16px ${planColor}44`,
              }}
              onMouseOver={e => (e.currentTarget.style.opacity = '0.88')}
              onMouseOut={e => (e.currentTarget.style.opacity = '1')}
            >
              Upgrade to {planName} — {planPrice}
            </button>
            <button
              id="feature-gate-close-btn"
              onClick={onClose}
              style={{
                width: '100%',
                padding: '11px 0',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                background: 'transparent',
                color: '#64748b',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'background 0.2s',
              }}
              onMouseOver={e => (e.currentTarget.style.background = '#f8fafc')}
              onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
            >
              Continue with my current plan
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, -46%); } to { opacity: 1; transform: translate(-50%, -50%); } }
      `}</style>
    </>
  );
}
