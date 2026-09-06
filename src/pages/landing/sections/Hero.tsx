import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Clock, Link2, Send, Shield, Zap } from 'lucide-react';
import { rotatingPhrases, rotatingPlaceholders } from '../data';
import { usePrefersReducedMotion, useRotatingIndex, useRotatingPhrase } from '../hooks';
import OnboardingModal from './OnboardingModal';

export default function Hero() {
  const navigate = useNavigate();
  const [heroChatInput, setHeroChatInput] = useState('');
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState('');

  const placeholderIndex = useRotatingIndex(rotatingPlaceholders.length, 3200);

  const prefersReducedMotion = usePrefersReducedMotion();
  const { index: phraseIndex, phase: animationPhase } = useRotatingPhrase(
    rotatingPhrases.length,
    4500,
    400,
    !prefersReducedMotion,
  );
  const currentPhrase = rotatingPhrases[phraseIndex];
  const phraseWords = currentPhrase.split(' ');

  const handleHeroChatSend = (promptText?: string) => {
    const fallback = rotatingPlaceholders[placeholderIndex]
      .replace("Ask AI Agent: '", '')
      .replace("'", '');
    const textToSend = promptText || heroChatInput || fallback;
    setPendingPrompt(textToSend.trim());
    setShowOnboardingModal(true);
  };

  const handleModalConfirm = () => {
    setShowOnboardingModal(false);
    navigate('/sign-up', { state: { initialPrompt: pendingPrompt } });
  };

  return (
    <>
      <section className="hero-section">
        <div className="lp-hero-eyebrow">
          <span className="lp-rating-text">Your marketing, handled</span>
        </div>

        <h1 className="hero-title flex flex-col items-center">
          <span>The AI Marketing Agent that</span>
          <span className="lp-pill-highlight mt-2 rotating-container relative inline-block text-[#1A1A1A] whitespace-nowrap min-h-[50px] sm:min-h-[60px] md:min-h-[70px] align-middle">
            {prefersReducedMotion ? (
              <span>runs your social media.</span>
            ) : (
              <span
                className={`inline-flex flex-nowrap justify-center transition-all duration-300 ${
                  animationPhase === 'exit'
                    ? 'opacity-0 translate-y-[-10px] blur-sm'
                    : 'opacity-100 translate-y-0 blur-0'
                }`}
                style={{ columnGap: '0.28em' }}
              >
                {phraseWords.map((word, wIdx) => (
                  <span
                    key={`${phraseIndex}-${wIdx}`}
                    className="inline-block opacity-0 translate-y-[8px] animate-word-reveal"
                    style={{
                      animationDelay: `${wIdx * 0.15}s`,
                      animationFillMode: 'forwards',
                    }}
                  >
                    {word}
                  </span>
                ))}
              </span>
            )}
          </span>
        </h1>

        <p className="hero-subtitle">
          ZieAds connects to your social accounts and ad data, powered by an AI Marketing Agent that never clocks out.
          Every morning it tells you what worked, what is slipping, and exactly what to do next. Try asking your AI Agent:
        </p>

        {/* ── Redesigned Hero AI Agent Chat Box (Reference Match) ── */}
        <div className="hero-chat-wrapper w-full max-w-3xl mx-auto mt-8 text-left relative px-2 sm:px-0">
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              background: '#FFFFFF',
              border: '1.5px solid var(--lp-border-default)',
              borderRadius: '24px',
              boxShadow: '0 20px 40px -15px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.01)',
              padding: '24px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              transition: 'all 0.3s ease-in-out',
            }}
            className="hero-chat-card-outer"
          >
            {/* Input area */}
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', width: '100%' }}>
              <textarea
                rows={3}
                placeholder={rotatingPlaceholders[placeholderIndex]}
                value={heroChatInput}
                onChange={(e) => setHeroChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleHeroChatSend();
                  }
                }}
                onFocus={(e) => {
                  const card = e.currentTarget.closest('.hero-chat-card-outer') as HTMLDivElement | null;
                  if (card) {
                    card.style.borderColor = 'var(--lp-accent)';
                    card.style.boxShadow =
                      '0 20px 40px -15px rgba(30,123,255,0.12), 0 0 0 3px var(--lp-focus-ring)';
                  }
                }}
                onBlur={(e) => {
                  const card = e.currentTarget.closest('.hero-chat-card-outer') as HTMLDivElement | null;
                  if (card) {
                    card.style.borderColor = 'var(--lp-border-default)';
                    card.style.boxShadow =
                      '0 20px 40px -15px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.01)';
                  }
                }}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  fontSize: '17px',
                  lineHeight: '1.6',
                  color: 'var(--lp-text-primary)',
                  outline: 'none',
                  resize: 'none',
                  minHeight: '110px',
                }}
              />
            </div>

            {/* Bottom action bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <IconChip><Link2 size={18} /></IconChip>
                <IconChip><Zap size={18} /></IconChip>
              </div>

              <button
                onClick={() => handleHeroChatSend()}
                className="btn-lp-primary-gradient"
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: 'var(--lp-shadow-cta)',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>Ask AI Agent</span>
                <Send size={15} />
              </button>
            </div>
          </div>

          {/* Trust Strip */}
          <div
            className="final-cta-trust-strip mt-5 justify-center flex flex-wrap gap-4 sm:gap-6 text-[13px]"
            style={{ color: 'var(--lp-text-tertiary)' }}
          >
            <span>
              <Shield size={14} className="inline mr-1" style={{ color: 'var(--lp-accent)' }} /> Free plan, no card required
            </span>
            <span>
              <Check size={14} className="inline mr-1" style={{ color: '#10B981' }} /> Instant AI Response & Signup
            </span>
            <span>
              <Clock size={14} className="inline mr-1" style={{ color: 'var(--lp-accent)' }} /> First briefing tomorrow morning
            </span>
          </div>
        </div>
      </section>

      {showOnboardingModal && (
        <OnboardingModal
          pendingPrompt={pendingPrompt}
          onConfirm={handleModalConfirm}
          onClose={() => setShowOnboardingModal(false)}
        />
      )}
    </>
  );
}

function IconChip({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      style={{
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        border: '1px solid var(--lp-border-default)',
        background: '#F9FAFB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: '#6B7280',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#F3F4F6';
        e.currentTarget.style.borderColor = '#D1D5DB';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#F9FAFB';
        e.currentTarget.style.borderColor = 'var(--lp-border-default)';
      }}
    >
      {children}
    </button>
  );
}
