import { ArrowRight, Bot } from 'lucide-react';
import ZieAdsLogo from '../../../components/ZieAdsLogo';

interface Props {
  pendingPrompt: string;
  onConfirm: () => void;
  onClose: () => void;
}

const onboardingSteps = [
  { num: '01', label: 'Create your free account in 30 seconds' },
  { num: '02', label: 'Connect your Instagram, TikTok, or LinkedIn' },
  { num: '03', label: 'AI Agent executes your marketing strategy' },
];

export default function OnboardingModal({ pendingPrompt, onConfirm, onClose }: Props) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(11, 27, 43, 0.55)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: 'var(--font-primary, "General Sans", ui-sans-serif, system-ui, sans-serif)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--lp-bg-canvas, #F7F5F0)',
          border: '1px solid var(--lp-border-default, #DDD6C8)',
          borderRadius: '28px',
          padding: '0',
          maxWidth: '460px',
          width: '100%',
          boxShadow: 'var(--lp-shadow-showcase, 0 24px 64px rgba(11,27,43,0.12))',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Top band - brand accent */}
        <div
          style={{
            background: 'var(--lp-accent-gradient, linear-gradient(135deg, #1E7BFF 0%, #0EA5E9 100%))',
            padding: '32px 36px 28px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '20px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle noise texture overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.04\'/%3E%3C/svg%3E")',
              opacity: 0.4,
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'rgba(255,255,255,0.18)',
              border: '1px solid rgba(255,255,255,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)',
              flexShrink: 0,
            }}
          >
            <ZieAdsLogo size={30} />
          </div>

          <div>
            <h2
              style={{
                fontFamily: 'var(--font-display, "Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif)',
                fontSize: '22px',
                fontWeight: 700,
                color: '#FFFFFF',
                lineHeight: 1.25,
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              One step away from your
              <br />
              AI Marketing Agent
            </h2>
          </div>
        </div>

        <div style={{ padding: '28px 36px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--lp-border-subtle, #EBE6DC)',
              borderRadius: '16px',
              padding: '16px 18px',
              fontSize: '14px',
              color: 'var(--lp-text-primary, #0B1B2B)',
              lineHeight: 1.5,
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
            }}
          >
            <Bot size={18} style={{ color: 'var(--lp-accent, #1E7BFF)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--lp-text-tertiary, #6B7A89)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Your Request
              </span>
              <span style={{ fontStyle: 'italic', color: 'var(--lp-text-secondary, #3D4F62)' }}>
                "{pendingPrompt || 'Ready to analyze your marketing channels'}"
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {onboardingSteps.map((step) => (
              <div
                key={step.num}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: '#FFFFFF',
                  border: '1px solid var(--lp-border-subtle, #EBE6DC)',
                  borderRadius: '12px',
                  padding: '13px 16px',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--lp-accent, #1E7BFF)',
                    letterSpacing: '0.04em',
                    minWidth: '22px',
                  }}
                >
                  {step.num}
                </span>
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'var(--lp-text-primary, #0B1B2B)',
                    lineHeight: 1.4,
                  }}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={onConfirm}
            className="btn-lp-primary-gradient"
            style={{
              width: '100%',
              padding: '15px 24px',
              borderRadius: 'var(--lp-radius-button, 10px)',
              border: 'none',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: 'var(--lp-shadow-cta)',
              transition: 'all 0.2s ease',
              letterSpacing: '-0.01em',
            }}
          >
            <span>Create Free Account</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
