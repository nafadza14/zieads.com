import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Clock, Shield } from 'lucide-react';
import { rotatingPhrases, rotatingPlaceholders } from '../data';
import { usePrefersReducedMotion, useRotatingIndex, useRotatingPhrase } from '../hooks';
import OnboardingModal from './OnboardingModal';

/* ── SVG Icon Components ── */
const StarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

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

const AISparkleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
  </svg>
);

/* ── Video Background Component ── */
function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fadeFrameRef = useRef<number>(0);
  const fadingOutRef = useRef(false);

  const cancelFade = useCallback(() => {
    if (fadeFrameRef.current) {
      cancelAnimationFrame(fadeFrameRef.current);
      fadeFrameRef.current = 0;
    }
  }, []);

  const fadeIn = useCallback((startOpacity: number) => {
    cancelFade();
    const video = videoRef.current;
    if (!video) return;

    const duration = 250;
    const startTime = performance.now();
    const from = startOpacity;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      video.style.opacity = String(from + (1 - from) * progress);
      if (progress < 1) {
        fadeFrameRef.current = requestAnimationFrame(step);
      } else {
        fadeFrameRef.current = 0;
      }
    };
    fadeFrameRef.current = requestAnimationFrame(step);
  }, [cancelFade]);

  const fadeOut = useCallback((startOpacity: number) => {
    cancelFade();
    const video = videoRef.current;
    if (!video) return;

    const duration = 250;
    const startTime = performance.now();
    const from = startOpacity;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      video.style.opacity = String(from * (1 - progress));
      if (progress < 1) {
        fadeFrameRef.current = requestAnimationFrame(step);
      } else {
        fadeFrameRef.current = 0;
      }
    };
    fadeFrameRef.current = requestAnimationFrame(step);
  }, [cancelFade]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration) return;

    const remaining = video.duration - video.currentTime;
    if (remaining <= 0.55 && !fadingOutRef.current) {
      fadingOutRef.current = true;
      const currentOpacity = parseFloat(video.style.opacity || '1');
      fadeOut(currentOpacity);
    }
  }, [fadeOut]);

  const handleEnded = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.style.opacity = '0';
    fadingOutRef.current = false;

    setTimeout(() => {
      video.currentTime = 0;
      video.play().then(() => {
        fadeIn(0);
      }).catch(() => {});
    }, 100);
  }, [fadeIn]);

  const handleCanPlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    fadingOutRef.current = false;
    const currentOpacity = parseFloat(video.style.opacity || '0');
    fadeIn(currentOpacity);
  }, [fadeIn]);

  useEffect(() => {
    return () => cancelFade();
  }, [cancelFade]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        zIndex: 0,
      }}
    >
      <video
        ref={videoRef}
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260329_050842_be71947f-f16e-4a14-810c-06e83d23ddb5.mp4"
        muted
        playsInline
        autoPlay
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onCanPlay={handleCanPlay}
        style={{
          width: '115%',
          height: '115%',
          objectFit: 'cover',
          objectPosition: 'center top',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: 0,
        }}
      />
      {/* Overlay for text readability */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(248,248,248,0.7) 60%, rgba(248,248,248,0.92) 100%)',
          zIndex: 1,
        }}
      />
    </div>
  );
}

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
        <VideoBackground />

        <div className="hero-content" style={{ position: 'relative', zIndex: 2 }}>
          {/* Badge */}
          <div className="hero-badge-new">
            <span className="hero-badge-dark">
              <StarIcon /> <span>New</span>
            </span>
            <span className="hero-badge-light">Your marketing, handled</span>
          </div>

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

          {/* Subtitle */}
          <p className="hero-subtitle">
            ZieAds connects to your social accounts and ad data, powered by an AI Marketing Agent that never clocks out.
            Every morning it tells you what worked, what is slipping, and exactly what to do next.
          </p>

          {/* Search / Chat Input Box */}
          <div className="hero-search-box">
            {/* Top credit row */}
            <div className="hero-search-topbar">
              <div className="hero-search-credits">
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>60/450 credits</span>
                <button className="hero-upgrade-btn">Upgrade</button>
              </div>
              <div className="hero-search-powered">
                <AISparkleIcon />
                <span>Powered by AI Agent</span>
              </div>
            </div>

            {/* Main input */}
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

            {/* Bottom action row */}
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
          <div className="hero-trust-strip">
            <span><Shield size={14} /> Free plan, no card required</span>
            <span><Check size={14} style={{ color: '#10B981' }} /> Instant AI Response & Signup</span>
            <span><Clock size={14} /> First briefing tomorrow morning</span>
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
