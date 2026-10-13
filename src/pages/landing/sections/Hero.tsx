import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextRollButton } from '../ui';
import { Shader, Swirl, ChromaFlow, FlutedGlass, FilmGrain } from 'shaders/react';
import { rotatingPhrases, rotatingPlaceholders } from '../data';
import { usePrefersReducedMotion, useRotatingIndex, useRotatingPhrase } from '../hooks';
import OnboardingModal from './OnboardingModal';
import ZieAvatar from '../../../components/ZieAvatar';
import SocialIcon from '../../../components/v3/SocialIcon';
import { PlatformStrip } from '../visuals';

/* ── SVG Icon Components ── */

const ArrowUpIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
);

const AttachIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
  </svg>
);

const VoiceIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
    <path d="M19 10v2a7 7 0 01-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const PromptsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

/* ── Partner Badge SVG ── */

/* ── Shader Background ── */
function ShaderBackground() {
  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      <Shader style={{ width: '100%', height: '100%' }}>
        <Swirl colorA="#ffffff" colorB="#f0f0f0" detail={1.7} />
        <ChromaFlow
          baseColor="#ffffff"
          downColor="#ff5f03"
          leftColor="#ff5f03"
          rightColor="#ff5f03"
          upColor="#ff5f03"
          momentum={13}
          radius={3.5}
        />
        <FlutedGlass
          aberration={0.61}
          angle={31}
          frequency={8}
          highlight={0.12}
          highlightSoftness={0}
          lightAngle={-90}
          refraction={4}
          shape="rounded"
          softness={1}
          speed={0.15}
        />
        <FilmGrain strength={0.05} />
      </Shader>
    </div>
  );
}

/* TextRollButton now lives in ../ui and is re-exported for older imports */
export { TextRollButton };

/* ── Main Hero ── */
export default function Hero() {
  const navigate = useNavigate();
  const [heroChatInput, setHeroChatInput] = useState('');
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState('');

  const placeholderIndex = useRotatingIndex(rotatingPlaceholders.length, 3200);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { index: phraseIndex, phase: animationPhase } = useRotatingPhrase(
    rotatingPhrases.length, 4500, 400, !prefersReducedMotion,
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
        <ShaderBackground />

        <div className="hero-content" style={{ position: 'relative', zIndex: 20 }}>
          {/* Small label */}
          <p className="text-[13px] sm:text-[14px] text-gray-900 tracking-wide mb-4 sm:mb-6 text-center" style={{ fontFamily: 'inherit' }}>
            ZieAds AI Agent
          </p>

          {/* Headline */}
          <h1 className="hero-title">
            <span>The AI Marketing Agent that</span>
            <span className="hero-highlight-pill rotating-container">
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

          {/* CTA Row */}
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5">
            <TextRollButton
              text="Get started free"
              onClick={() => navigate('/sign-up')}
              variant="orange"
            />

            {/* Partner Badge */}
            <div className="inline-flex items-center gap-2 bg-white rounded-[4px] px-3 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-shadow duration-300 cursor-default">
              <ZieAvatar size={26} ring={false} />
              <span className="text-[13px] sm:text-[14px] font-medium text-gray-900" style={{ fontFamily: 'inherit' }}>AI Marketing Agent</span>
              <span className="text-[10px] sm:text-[11px] bg-gray-900 text-white px-1.5 sm:px-2 py-0.5 rounded font-medium">Featured</span>
            </div>
          </div>

          {/* Search / Chat Input Box */}
          <div className="hero-search-box">
            <div className="hero-search-topbar">
              <div className="hero-search-credits">
                <span style={{ color: 'rgba(0,0,0,0.4)' }}>60/450 credits</span>
                <button className="hero-upgrade-btn">Upgrade</button>
              </div>
              <div className="hero-search-powered">
                <ZieAvatar size={20} ring={false} />
                <span>Powered by Zie AI Agent</span>
              </div>
            </div>

            <div className="hero-search-input-wrap">
              <textarea
                rows={2}
                placeholder={rotatingPlaceholders[placeholderIndex]}
                value={heroChatInput}
                onChange={(e) => setHeroChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleHeroChatSend();
                  }
                }}
                className="hero-search-textarea"
              />
              <button
                onClick={() => handleHeroChatSend()}
                className="hero-search-submit"
                aria-label="Send"
              >
                <ArrowUpIcon />
              </button>
            </div>

            <div className="hero-search-bottombar">
              <div className="hero-search-actions">
                <button className="hero-action-chip"><AttachIcon /> <span>Attach</span></button>
                <button className="hero-action-chip"><VoiceIcon /> <span>Voice</span></button>
                <button className="hero-action-chip"><PromptsIcon /> <span>Prompts</span></button>
              </div>
              <span className="hero-char-count">0/3,000</span>
            </div>
          </div>

          {/* Trust Strip */}
          <div className="hero-one-dash">
            <span className="hero-one-dash-stack" aria-hidden="true">
              {(['instagram', 'tiktok', 'linkedin', 'facebook', 'x'] as const).map((k, i) => (
                <span key={k} style={{ zIndex: 5 - i, animationDelay: `${0.6 + i * 0.08}s` }}>
                  <SocialIcon platform={k} size={22} />
                </span>
              ))}
            </span>
            <span className="hero-one-dash-text">
              <strong>All your social accounts, one dashboard.</strong> Post, reply and track every channel from ZieAds.
            </span>
          </div>

          {/* Platforms ZieAds works with */}
          <PlatformStrip />
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
