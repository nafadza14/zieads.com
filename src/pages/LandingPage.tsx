import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ZieAdsLogo from '../components/ZieAdsLogo';
import { 
  Link2, 
  Bot, 
  TrendingUp, 
  Palette, 
  Target, 
  Search, 
  DollarSign, 
  Filter, 
  Check,
  Clock,
  Shuffle,
  HelpCircle,
  Briefcase,
  UserCheck,
  Users,
  ChevronDown,
  ExternalLink,
  AlertTriangle,
  Shield,
  Activity,
  TrendingDown,
  EyeOff,
  Sliders,
  Radar,
  Rocket
} from 'lucide-react';

interface Props {
  onScanComplete: (data: any) => void;
}

export default function LandingPage({ onScanComplete }: Props) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeReportTab, setActiveReportTab] = useState(0);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
 
  /* ── Hero Rotating Headline Animation State ── */
  const rotatingPhrases = [
    "runs your social media.",
    "never misses what's working.",
    "briefs you every morning.",
    "turns your data into decisions.",
    "watches while you sleep."
  ];
 
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [animationPhase, setAnimationPhase] = useState<'enter' | 'exit'>('enter');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
 
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
 
    const listener = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);
 
  useEffect(() => {
    if (prefersReducedMotion) return;
 
    const interval = setInterval(() => {
      setAnimationPhase('exit');
      setTimeout(() => {
        setPhraseIndex((prev) => (prev + 1) % rotatingPhrases.length);
        setAnimationPhase('enter');
      }, 400); // Wait for exit transition (400ms)
    }, 4500); // 4.5 seconds per cycle
 
    return () => clearInterval(interval);
  }, [prefersReducedMotion]);
 
  const currentPhrase = rotatingPhrases[phraseIndex];
  const phraseWords = currentPhrase.split(' ');

  const handleQuickScan = async () => {
    if (!url.trim()) return;

    let scanUrl = url.trim();
    if (!scanUrl.startsWith('http')) scanUrl = 'https://' + scanUrl;

    setLoading(true);
    setError('');

    try {
      const resp = await fetch('/api/quick-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scanUrl }),
      });
      
      const contentType = resp.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server returned an invalid response (${resp.status}). Make sure the backend server is running.`);
      }

      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || 'Scan failed');
      onScanComplete(json.data);
      navigate('/scan-result');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const scrollToHero = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  /* ── Report Preview Tab Data ── */
  const reportTabs = [
    {
      label: 'Readiness Score',
      content: (
        <div className="report-tab-panel">
          <p className="report-tab-intro" style={{ marginBottom: 16, fontSize: '14px', lineHeight: '1.6', color: 'var(--lp-text-secondary)' }}>
            Your score breaks down across six dimensions, each weighted by how much it actually affects paid performance. A weak score on 'Creative and Offer' matters more than a weak score on 'Competitive' because it kills your campaign before the first impression.
          </p>
          <div className="report-score-header">
            <div className="report-overall-score">
              <span className="report-score-number mono-num">61</span>
              <span className="report-score-max mono-num">/100</span>
            </div>
            <div className="report-grade-badge report-grade-c">C - Structural gaps present</div>
          </div>
          <div className="report-dimensions-list">
            {[
              { name: 'Creative & Offer', score: 55, weight: '25%', flag: 'Offer clarity below threshold' },
              { name: 'Audience Clarity', score: 70, weight: '20%', flag: 'ICP partially defined' },
              { name: 'Landing Page', score: 48, weight: '20%', flag: 'No above-fold CTA detected' },
              { name: 'Platform Fit', score: 65, weight: '15%', flag: '' },
              { name: 'Funnel Coverage', score: 60, weight: '10%', flag: 'No retargeting layer detected' },
              { name: 'Competitive', score: 55, weight: '10%', flag: '' },
            ].map((d, i) => (
              <div key={i} className="report-dim-row">
                <div className="report-dim-info">
                  <span className="report-dim-name">{d.name}</span>
                  <span className="report-dim-weight mono-num">{d.weight}</span>
                </div>
                <div className="report-dim-bar-track">
                  <div className="report-dim-bar-fill" style={{ width: `${d.score}%` }}></div>
                </div>
                <div className="report-dim-meta">
                  <span className="report-dim-score mono-num">{d.score}</span>
                  {d.flag && <span className="report-dim-flag"><AlertTriangle size={12} /> {d.flag}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      label: 'Top Gaps',
      content: (
        <div className="report-tab-panel">
          <div className="report-findings-list">
            {[
              {
                severity: 'Critical',
                finding: 'No Meta Pixel detected on your checkout page',
                impact: 'Meta cannot optimize ad delivery without conversion data. You are spending money to train their algorithm but giving it nothing to learn from.',
                fix: 'Install Pixel on checkout and thank-you pages. Verify with Meta Pixel Helper before spending.',
              },
              {
                severity: 'High',
                finding: 'Primary offer is not visible above the fold on mobile',
                impact: 'More than half your paid traffic is on mobile. If they cannot see what you are selling in the first screen, they leave. Higher bounce rate means worse ad delivery over time.',
                fix: 'Move your product name, key benefit, and CTA above 600px on mobile viewport.',
              },
              {
                severity: 'High',
                finding: 'No retargeting or warm audience strategy detected',
                impact: 'You are paying to bring people to your site and then not following up when they leave without buying. That warm traffic is your cheapest possible conversion.',
                fix: 'Build a 30-day website visitor audience. Run a separate campaign with a different angle for them.',
              },
            ].map((f, i) => (
              <div key={i} className={`report-finding-card report-severity-${f.severity.toLowerCase()}`}>
                <div className="report-finding-header">
                  <span className={`report-severity-badge severity-${f.severity.toLowerCase()}`}>{f.severity}</span>
                </div>
                <h4 className="report-finding-title">{f.finding}</h4>
                <div className="report-finding-detail">
                  <div className="report-detail-block">
                    <span className="report-detail-label">Impact</span>
                    <p>{f.impact}</p>
                  </div>
                  <div className="report-detail-block">
                    <span className="report-detail-label">How to fix</span>
                    <p>{f.fix}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      label: 'Creative Brief',
      content: (
        <div className="report-tab-panel">
          <p style={{ marginBottom: 20, fontSize: '14px', lineHeight: '1.6', color: 'var(--lp-text-secondary)' }}>
            Three creative directions per platform, each with a hook angle, visual direction, and copy framework.
          </p>
          <div className="report-brief-platform">
            <span className="report-platform-badge">Meta Ads</span>
          </div>
          <div className="report-creative-angles">
            {[
              {
                angle: 'Problem-first',
                hook: 'Still getting clicks that do not convert?',
                visual: 'Screen recording of cart abandonment. No voiceover. Subtitles only. Under 20 seconds.',
                framework: 'Name the problem. Identify the root cause. Show the fix. One proof point. CTA.',
                format: 'Vertical video, 15 to 30 seconds',
              },
            ].map((c, i) => (
              <div key={i} className="report-angle-card">
                <h4>{c.angle}</h4>
                <div className="report-angle-details">
                  <div className="report-angle-field">
                    <span className="report-field-label">Hook copy</span>
                    <p className="report-hook-text">"{c.hook}"</p>
                  </div>
                  <div className="report-angle-field">
                    <span className="report-field-label">Visual direction</span>
                    <p>{c.visual}</p>
                  </div>
                  <div className="report-angle-field">
                    <span className="report-field-label">Copy framework</span>
                    <p>{c.framework}</p>
                  </div>
                  <div className="report-angle-field">
                    <span className="report-field-label">Ad format</span>
                    <p>{c.format}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      label: 'Audience Strategy',
      content: (
        <div className="report-tab-panel">
          <p style={{ marginBottom: 20, fontSize: '14px', lineHeight: '1.6', color: 'var(--lp-text-secondary)' }}>
            Cold, warm, and hot audience tiers with platform-specific targeting logic. Not generic advice. Built from what ZieAds read on your actual page.
          </p>
          <div className="report-audience-tiers">
            {[
              {
                tier: 'Cold audience',
                budget: '50%',
                meta: 'Advantage+ with interest signals from your product category. Exclude existing customers.',
                google: 'Broad match keywords with smart bidding. Target In-Market matching your category.',
              },
              {
                tier: 'Warm audience',
                budget: '35%',
                meta: 'Website visitors last 30 days. Video viewers 75%+. Lookalike 1% from customer list.',
                google: 'Remarketing list for search ads (RLSA) on branded and competitor terms.',
              },
              {
                tier: 'Hot audience',
                budget: '15%',
                meta: 'Cart abandoners, checkout starters, and lead form openers last 7 days. Dynamic product ads if applicable.',
                google: 'Branded search + exact match competitor terms.',
              },
            ].map((a, i) => (
              <div key={i} className="report-tier-card">
                <div className="report-tier-header">
                  <h4>{a.tier}</h4>
                  <span className="report-budget-tag mono-num">{a.budget} of budget</span>
                </div>
                <div className="report-tier-platforms">
                  <div className="report-platform-row">
                    <span className="report-plat-label">Meta</span>
                    <p>{a.meta}</p>
                  </div>
                  <div className="report-platform-row">
                    <span className="report-plat-label">Google</span>
                    <p>{a.google}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      label: 'Budget Plan',
      content: (
        <div className="report-tab-panel">
          <p style={{ marginBottom: 20, fontSize: '14px', lineHeight: '1.6', color: 'var(--lp-text-secondary)' }}>
            Where to put your budget and why, based on your business type and the gaps found in your audit.
          </p>
          <div className="report-budget-split">
            {[
              { platform: 'Meta Ads', pct: 55, amount: '$1,650', rationale: 'Strongest visual platform for your product category. Start with awareness and conversion campaigns.' },
              { platform: 'Google Search', pct: 30, amount: '$900', rationale: 'High-intent buyers searching for your product type. Protect branded terms first.' },
              { platform: 'TikTok', pct: 15, amount: '$450', rationale: 'Test budget only. Your product skews older, validate before scaling.' },
            ].map((b, i) => (
              <div key={i} className="report-budget-row">
                <div className="report-budget-bar-header">
                  <span className="report-budget-platform">{b.platform}</span>
                  <span className="report-budget-amount mono-num">{b.amount} ({b.pct}%)</span>
                </div>
                <div className="report-budget-bar-track">
                  <div className="report-budget-bar-fill" style={{ width: `${b.pct}%` }}></div>
                </div>
                <p className="report-budget-rationale">{b.rationale}</p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 24, fontSize: '12px', fontStyle: 'italic', color: 'var(--lp-text-muted)' }}>
            This is a starting allocation, not a final answer. Adjust based on your first two weeks of data.
          </p>
        </div>
      ),
    },
  ];

  /* ── FAQ Data ── */
  const faqItems = [
    {
      q: 'What does the ZieAds agent actually do?',
      a: 'The agent connects to your social accounts and ad data, then works like a marketing analyst. It audits your setup, tracks your accounts daily, and delivers a morning briefing on what worked, what is slipping, and what to do today. You can also run any of its fifteen skills on demand, from a full audit to a creative brief. It watches and recommends. You approve what goes live.',
    },
    {
      q: 'Does it post and spend on its own?',
      a: 'No. The agent drafts, schedules, and recommends, but you approve what publishes and what gets boosted. You stay in control of anything that costs money or goes public. Once you approve, it handles the execution. We built it this way on purpose, because marketing you care about should not run without you.',
    },
    {
      q: 'Do I need to connect my ad accounts?',
      a: 'Not to start. The free audit works with just a URL, no account access. To get the full agent experience with daily briefings, you connect your social accounts and upload your ad performance data. We never need write access to your ad spend.',
    },
    {
      q: 'What platforms does it work with?',
      a: 'For scheduling and organic tracking: Instagram, TikTok, and LinkedIn. For paid performance: upload your data from Meta, Google, and TikTok Ads. More platforms are on the way as the agent grows.',
    },
    {
      q: 'Does this work if I have never run ads before?',
      a: 'Yes. The audit tells you whether your setup is ready before you spend a rupiah or a dollar. Many people use ZieAds specifically to find out what to fix before their first campaign, so the first one is not a waste.',
    },
    {
      q: 'How is this different from a scheduler or an analytics dashboard?',
      a: 'A scheduler tells you when a post goes out. A dashboard shows you charts. Neither tells you what any of it means or what to do next. The agent does. It reads your numbers in the context of your specific setup and gives you a decision, not just data.',
    },
  ];

  return (
    <div className="landing-page">
      {/* GRID LINES BACKGROUND */}
      <div className="lp-grid-line lp-line-left"></div>
      <div className="lp-grid-line lp-line-right"></div>
      <div className="lp-line-top"></div>

      {/* ══════════════════════════════════ NAVBAR ══════════════════════════════════ */}
      <nav className="navbar">
        <div className="nav-inner relative w-full h-full flex items-center justify-between">
          <div className="nav-brand" onClick={() => navigate('/')}>
            <ZieAdsLogo size={32} />
            <span className="brand-name">zieads</span>
          </div>
          <div className="nav-links hidden md:flex">
            <a href="#how-it-works">How It Works</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="nav-actions hidden md:flex">
            <button className="btn-login" onClick={() => navigate('/sign-in')}>Log in</button>
            <button className="btn-get-started" onClick={() => navigate('/sign-up')}>
              Get Started Free
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            className="flex md:hidden p-2 text-gray-700 hover:text-gray-950 focus:outline-none transition-colors ml-auto"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Menu"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          {/* Mobile Dropdown Panel */}
          {isMobileMenuOpen && (
            <div className="absolute top-[60px] left-0 right-0 w-full bg-white/95 border border-gray-100 rounded-3xl shadow-xl p-6 flex flex-col gap-4 text-left z-50 backdrop-blur-xl md:hidden">
              <div className="flex flex-col gap-3 font-semibold text-gray-750 text-[15px] pl-2">
                <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)}>How It Works</a>
                <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)}>Pricing</a>
                <a href="#faq" onClick={() => setIsMobileMenuOpen(false)}>FAQ</a>
              </div>
              <hr className="border-gray-100 my-1" />
              <div className="flex flex-col gap-3">
                <button
                  className="w-full py-3.5 border border-gray-200 hover:border-gray-300 rounded-xl font-bold text-[14px] text-gray-750 text-center bg-white hover:bg-gray-50 active:scale-[0.98] transition-all"
                  onClick={() => { setIsMobileMenuOpen(false); navigate('/sign-in'); }}
                  style={{ cursor: 'pointer' }}
                >
                  Log in
                </button>
                <button
                  className="w-full py-3.5 btn-lp-primary-gradient text-white rounded-xl font-bold text-[14px] text-center active:scale-[0.98] transition-all"
                  onClick={() => { setIsMobileMenuOpen(false); navigate('/sign-up'); }}
                  style={{ cursor: 'pointer' }}
                >
                  Start Free
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ══════════════════════════════════ S1: HERO ══════════════════════════════════ */}
      <section className="hero-section">
        <div className="lp-hero-eyebrow">
          <span className="lp-rating-text">Your marketing, handled</span>
        </div>
        
        <h1 className="hero-title flex flex-col items-center">
          <span>The AI Marketing Agent that</span>
          <span className="lp-pill-highlight mt-2 rotating-container relative inline-block text-[#1A1A1A] min-h-[50px] sm:min-h-[60px] md:min-h-[70px] align-middle">
            {prefersReducedMotion ? (
              <span>runs your social media.</span>
            ) : (
              <span 
                className={`inline-flex flex-wrap transition-all duration-300 ${
                  animationPhase === 'exit' 
                    ? 'opacity-0 translate-y-[-10px] blur-sm' 
                    : 'opacity-100 translate-y-0 blur-0'
                }`}
              >
                {phraseWords.map((word, wIdx) => (
                  <span
                    key={wIdx}
                    className="inline-block opacity-0 translate-y-[8px] animate-word-reveal"
                    style={{
                      animationDelay: `${wIdx * 0.25}s`,
                      animationFillMode: 'forwards'
                    }}
                  >
                    {word}{' '}
                  </span>
                ))}
              </span>
            )}
          </span>
        </h1>
        
        <p className="hero-subtitle">
          ZieAds connects to your social accounts and ad data, then works like a marketing analyst who never clocks out. Every morning it tells you what worked, what is slipping, and exactly what to do next. You approve. It takes it from there.
        </p>

        <div className="hero-input-wrapper">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              className="btn-lp-primary-gradient"
              onClick={() => { const el = document.getElementById('free-audit-try'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}
              style={{ cursor: 'pointer', padding: '14px 28px', fontSize: '15px', fontWeight: 600, border: 'none', borderRadius: '12px', color: 'white', transition: 'all 0.2s' }}
            >
              Start Free
            </button>
            <button
              className="btn-lp-secondary"
              onClick={() => { const el = document.getElementById('dashboard-preview'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}
              style={{ cursor: 'pointer', padding: '14px 28px', fontSize: '15px', fontWeight: 600, border: '1px solid var(--lp-border-strong)', borderRadius: '12px', background: 'transparent', transition: 'all 0.2s' }}
            >
              Watch a 90-second tour
            </button>
          </div>
          <div className="final-cta-trust-strip mt-6 justify-center flex gap-6 text-[13px] text-zinc-500">
            <span><Shield size={14} className="inline mr-1" /> Free plan, no card</span>
            <span><Check size={14} className="inline mr-1" /> Connects in 2 minutes</span>
            <span><Clock size={14} className="inline mr-1" /> First briefing tomorrow morning</span>
          </div>
        </div>
      </section>

      {/* Dynamic Style for Word Reveal Animation */}
      <style>{`
        @keyframes wordReveal {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-word-reveal {
          animation: wordReveal 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .rotating-container {
          display: inline-block;
          min-height: 50px;
          vertical-align: middle;
        }
        @media (min-width: 640px) {
          .rotating-container {
            min-height: 60px;
          }
        }
        @media (min-width: 768px) {
          .rotating-container {
            min-height: 70px;
          }
        }
      `}</style>

      {/* ══════════════════════════════════ S2: DASHBOARD PREVIEW ══════════════════════════════════ */}
      <section id="dashboard-preview" className="ai-strategist-section" style={{ padding: '100px 24px', background: 'var(--lp-bg-canvas)', textAlign: 'center' }}>
        <span className="section-eyebrow" style={{ textTransform: 'uppercase', fontSize: '12px', fontWeight: 600, color: 'var(--lp-accent)', letterSpacing: '0.05em' }}>See it work</span>
        <h2 className="section-title" style={{ marginTop: 8, marginBottom: 16 }}>This is what waits for you every morning.</h2>
        <p className="section-subtitle" style={{ maxWidth: '640px', margin: '0 auto 40px' }}>No dashboards to decode. No charts to interpret. The agent has already done the reading and tells you where to spend your attention today.</p>

        {/* SHOWCASE CARD */}
        <div className="lp-showcase-container" style={{ marginTop: 0, marginBottom: 48 }}>
          <div className="lp-rainbow-glow"></div>
          <div className="lp-showcase-card">
            <div className="lp-showcase-header">
              <div className="lp-chrome-dots">
                <span className="lp-dot-red"></span>
                <span className="lp-dot-yellow"></span>
                <span className="lp-dot-green"></span>
              </div>
              <div className="lp-chrome-title">app.zieads.com — your morning briefing</div>
            </div>
            <div className="lp-showcase-body" style={{ height: 'auto' }}>
              <img 
                src="/zieads-dashboard.png" 
                alt="app.zieads.com — your morning briefing" 
                style={{ 
                  width: '100%', 
                  height: 'auto', 
                  display: 'block',
                  borderBottomLeftRadius: 'inherit',
                  borderBottomRightRadius: 'inherit'
                }} 
              />
            </div>
          </div>
        </div>

        <div className="ai-strategist-explanation" style={{ maxWidth: '780px', margin: '0 auto 48px', textAlign: 'left', fontSize: '16px', lineHeight: '1.7', color: 'var(--lp-text-secondary)', background: 'var(--lp-bg-card)', border: '1px solid var(--lp-border-subtle)', borderRadius: '16px', padding: '32px', boxShadow: 'var(--lp-shadow-card)' }}>
          <p style={{ margin: 0 }}>
            The briefing opens with a headline read on your accounts, the three to five moves worth making today ranked by impact, the wins worth repeating, and the problems worth fixing before they cost you. Tap any item to act on it, or ask the agent why.
          </p>
        </div>

        {/* Supporting stat row */}
        <div className="proof-stats animate-fade-in" style={{ borderTop: '1px solid var(--lp-border-subtle)', paddingTop: '40px', marginTop: '40px' }}>
          <div className="stat">
            <span className="stat-number mono-num">Under 3 min</span>
            <span className="stat-label">From connect to first insight</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <span className="stat-number mono-num">Every morning</span>
            <span className="stat-label">A fresh briefing, before your coffee</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <span className="stat-number mono-num">One place</span>
            <span className="stat-label">Organic and paid, together</span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════ S3: FREE AUDIT TRY ══════════════════════════════════ */}
      <section id="free-audit-try" className="scoring-section" style={{ borderTop: '1px solid var(--lp-border-subtle)', paddingTop: '100px' }}>
        <span className="section-eyebrow" style={{ textTransform: 'uppercase', fontSize: '12px', fontWeight: 600, color: 'var(--lp-accent)', letterSpacing: '0.05em', display: 'block', textAlign: 'center', marginBottom: 8 }}>Try it free, no signup</span>
        <h2 className="section-title">Curious what the agent sees? Paste a URL.</h2>
        <p className="section-subtitle" style={{ maxWidth: '640px', margin: '0 auto 40px', textAlign: 'center' }}>
          Before you connect anything, drop in any website and the agent reads it like a strategist would. Your offer, your funnel, your tracking setup, your creative angles, and how you stack up, scored across six dimensions in under three minutes. It is free, it needs no account, and it is the fastest way to understand what having an agent actually feels like.
        </p>

        {/* Inline URL Input */}
        <div className="hero-input-wrapper" style={{ maxWidth: '640px', margin: '0 auto 48px' }}>
          <div className="hero-input-container">
            <Search className="input-icon" size={20} />
            <input
              type="text"
              className="hero-input"
              placeholder="Paste any website URL here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuickScan()}
              disabled={loading}
            />
            <button
              className="hero-cta"
              onClick={handleQuickScan}
              disabled={loading || !url.trim()}
            >
              {loading ? (
                <span className="spinner-inline"></span>
              ) : (
                "Get My Free Audit"
              )}
            </button>
          </div>
          {error && <p className="hero-error">{error}</p>}
          <p className="hero-note" style={{ textAlign: 'center', marginTop: 12 }}>No signup. No ad account access. Your score in under 3 minutes.</p>
        </div>

        {/* Tabbed Report Preview Visual */}
        <div className="report-preview-section" style={{ padding: '0', background: 'transparent' }}>
          <div className="report-preview-container">
            <div className="report-tabs">
              {reportTabs.map((tab, i) => (
                <button
                  key={i}
                  className={`report-tab ${activeReportTab === i ? 'active' : ''}`}
                  onClick={() => setActiveReportTab(i)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="report-tab-content">
              {reportTabs[activeReportTab].content}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════ S4: PILLAR: DAILY BRIEFING ══════════════════════════════════ */}
      <section className="ai-strategist-section" style={{ padding: '120px 24px', background: 'var(--lp-bg-canvas)', borderTop: '1px solid var(--lp-border-subtle)' }}>
        <span className="section-eyebrow" style={{ textTransform: 'uppercase', fontSize: '12px', fontWeight: 600, color: 'var(--lp-accent)', letterSpacing: '0.05em', display: 'block', textAlign: 'center' }}>The daily briefing</span>
        <h2 className="section-title" style={{ marginTop: 8, marginBottom: 16, textAlign: 'center' }}>A marketing analyst's report. Every single morning.</h2>
        <p className="section-subtitle" style={{ maxWidth: '640px', margin: '0 auto 40px', textAlign: 'center' }}>
          Most tools hand you data and walk away. The agent reads that data in the context of your specific setup and hands you decisions.
        </p>

        <div className="ai-strategist-explanation" style={{ maxWidth: '780px', margin: '0 auto 48px', textAlign: 'left', fontSize: '15.5px', lineHeight: '1.75', color: 'var(--lp-text-secondary)', background: 'var(--lp-bg-card)', border: '1px solid var(--lp-border-subtle)', borderRadius: '16px', padding: '32px', boxShadow: 'var(--lp-shadow-card)' }}>
          <p style={{ margin: 0 }}>
            It knows your pixel was misfiring last week. It knows your best angle has been problem-first. It knows you have been running cold audiences only. So when it says boost the Tuesday Reel and pause ad set three, it is not guessing. It is reasoning from everything it already knows about you.
          </p>
        </div>

        {/* 6 Grid Cards */}
        <div className="pain-grid" style={{ marginBottom: 48 }}>
          {[
            {
              Icon: Activity,
              name: 'Daily Diagnosis',
              desc: 'What changed across your accounts today and what it likely means. Not a data dump. A read on what actually matters this morning.',
            },
            {
              Icon: TrendingDown,
              name: 'ROAS Drop Analysis',
              desc: 'When returns fall, there is usually one specific cause. The agent works through the likely culprits in order of probability, using what it knows about your setup.',
            },
            {
              Icon: EyeOff,
              name: 'Creative Fatigue',
              desc: 'Your audience has seen the ad. The agent flags it before performance craters and suggests new angles based on what has worked for you before.',
            },
            {
              Icon: Sliders,
              name: 'Content Scheduling',
              desc: 'Draft once, customize per platform, and queue across Instagram, TikTok, and LinkedIn. The agent suggests the times your audience actually shows up.',
            },
            {
              Icon: Radar,
              name: 'Competitor Watch',
              desc: 'What the accounts you track are doing right now. What they are posting, where they are gaining, and where the gaps are for you.',
            },
            {
              Icon: Rocket,
              name: 'Unified Inbox',
              desc: 'Every comment across every connected account in one place, sorted by sentiment, so you reply to what matters and skip the noise.',
            },
          ].map((mode, i) => (
            <div key={i} className="pain-card">
              <div className="pain-icon-wrap" style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', background: 'var(--lp-pill-bg)', color: 'var(--lp-accent)', marginBottom: '20px' }}>
                <mode.Icon size={24} />
              </div>
              <h3>{mode.name}</h3>
              <p>{mode.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════ S5: PILLAR: SCHEDULING ══════════════════════════════════ */}
      <section className="pain-section" style={{ borderTop: '1px solid var(--lp-border-subtle)', background: 'white' }}>
        <span className="section-eyebrow" style={{ textTransform: 'uppercase', fontSize: '12px', fontWeight: 600, color: 'var(--lp-accent)', letterSpacing: '0.05em', display: 'block', textAlign: 'center', marginBottom: 8 }}>Publishing and scheduling</span>
        <h2 className="section-title">Draft once. The agent handles every platform.</h2>
        <div className="pain-body" style={{ marginBottom: 40 }}>
          <p>Write your post once and the agent adapts it for Instagram, TikTok, and LinkedIn, respecting what each platform rewards. It suggests the times your audience actually shows up, based on your own history rather than a generic best-time chart.</p>
          <p>Queue a week in one sitting, or let the agent propose a schedule and approve it with one tap. Nothing goes live without your say-so.</p>
        </div>

        {/* Mock Composer UI Visual */}
        <div style={{ maxWidth: '640px', margin: '0 auto', background: 'var(--lp-bg-card)', border: '1px solid var(--lp-border-subtle)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--lp-shadow-card)', textAlign: 'left' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <span style={{ background: '#3B7FF5', color: 'white', fontSize: '12px', fontWeight: 600, padding: '4px 8px', borderRadius: '6px' }}>Instagram</span>
            <span style={{ background: '#E4E4E7', color: '#3F3F46', fontSize: '12px', fontWeight: 600, padding: '4px 8px', borderRadius: '6px' }}>TikTok</span>
            <span style={{ background: '#E4E4E7', color: '#3F3F46', fontSize: '12px', fontWeight: 600, padding: '4px 8px', borderRadius: '6px' }}>LinkedIn</span>
          </div>
          <div style={{ background: 'var(--lp-bg-inset)', padding: '16px', borderRadius: '12px', minHeight: '80px', fontSize: '14px', color: 'var(--lp-text-primary)', border: '1px solid var(--lp-border-subtle)' }}>
            We've analyzed your engagement profiles. Recommended post adjustments: Add vertical captions for TikTok viewport safety, and move the call-to-action link to client bio.
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
            <span style={{ fontSize: '12px', color: 'var(--lp-accent)', fontWeight: 600 }}>Suggested Time: Tuesday, 5:45 PM (Local)</span>
            <button className="btn-lp-primary-gradient" style={{ border: 'none', borderRadius: '8px', color: 'white', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Approve & Schedule</button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════ S6: PILLAR: ANALYTICS ══════════════════════════════════ */}
      <section className="scoring-section" style={{ borderTop: '1px solid var(--lp-border-subtle)' }}>
        <span className="section-eyebrow" style={{ textTransform: 'uppercase', fontSize: '12px', fontWeight: 600, color: 'var(--lp-accent)', letterSpacing: '0.05em', display: 'block', textAlign: 'center', marginBottom: 8 }}>Analytics that decide, not just display</span>
        <h2 className="section-title">Your numbers, already interpreted.</h2>
        <p className="section-subtitle" style={{ maxWidth: '640px', margin: '0 auto 40px', textAlign: 'center' }}>
          Follower growth, engagement, reach, top and worst performers, best posting windows, all in one view across every connected account.
        </p>
        <div className="pain-body" style={{ maxWidth: '780px', margin: '0 auto 48px', fontSize: '15.5px', lineHeight: '1.75', color: 'var(--lp-text-secondary)' }}>
          <p>
            But the agent does not stop at showing you the chart. It tells you the Tuesday Reel format is fatiguing, the LinkedIn carousels are your quiet winners, and the paid campaign you are about to scale is built on a creative angle your organic audience already ignored. Organic and paid, read together, because your customers never saw them as separate.
          </p>
        </div>

        {/* 6 Dimension Bars */}
        <div className="score-dimensions" style={{ maxWidth: '640px', margin: '0 auto' }}>
          {[
            { name: 'Creative and Offer', weight: '25%', color: 'var(--lp-accent)' },
            { name: 'Audience Clarity', weight: '20%', color: 'var(--lp-accent-hover)' },
            { name: 'Landing Page', weight: '20%', color: 'var(--lp-text-secondary)' },
            { name: 'Platform Fit', weight: '15%', color: 'var(--lp-text-tertiary)' },
            { name: 'Funnel Coverage', weight: '10%', color: 'var(--lp-text-muted)' },
            { name: 'Competitive', weight: '10%', color: 'var(--lp-border-strong)' },
          ].map((dim, i) => (
            <div key={i} className="dimension-bar">
              <div className="dim-info">
                <span className="dim-name">{dim.name}</span>
                <span className="dim-weight mono-num">{dim.weight}</span>
              </div>
              <div className="dim-track">
                <div className="dim-fill" style={{ width: `${70 + i * 4}%`, backgroundColor: dim.color }}></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════ S7: PILLAR: INBOX & WATCH ══════════════════════════════════ */}
      <section className="pain-section" style={{ borderTop: '1px solid var(--lp-border-subtle)', background: 'var(--lp-bg-canvas)' }}>
        <span className="section-eyebrow" style={{ textTransform: 'uppercase', fontSize: '12px', fontWeight: 600, color: 'var(--lp-accent)', letterSpacing: '0.05em', display: 'block', textAlign: 'center', marginBottom: 8 }}>Nothing slips past it</span>
        <h2 className="section-title">It watches the conversations and the competition.</h2>
        <div className="pain-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', maxWidth: '960px', margin: '0 auto' }}>
          <div className="pain-card">
            <div className="pain-icon-wrap" style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', background: 'var(--lp-pill-bg)', color: 'var(--lp-accent)', marginBottom: '20px' }}><Users size={24} /></div>
            <h3>Unified inbox</h3>
            <p>Every comment across every connected account in one place, sorted by sentiment. Reply to what matters, skip the noise, and never lose a warm lead in a notification pile again.</p>
          </div>
          <div className="pain-card">
            <div className="pain-icon-wrap" style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', background: 'var(--lp-pill-bg)', color: 'var(--lp-accent)', marginBottom: '20px' }}><Radar size={24} /></div>
            <h3>Competitor watch</h3>
            <p>Point the agent at the accounts you care about and it tracks what they post, where they are gaining, and where the gaps are for you. You find out what is working in your market before it becomes obvious to everyone.</p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════ S8: CONSOLIDATION ══════════════════════════════════ */}
      <section className="pain-section" style={{ borderTop: '1px solid var(--lp-border-subtle)', background: 'white', textAlign: 'center' }}>
        <span className="section-eyebrow" style={{ textTransform: 'uppercase', fontSize: '12px', fontWeight: 600, color: 'var(--lp-accent)', letterSpacing: '0.05em', display: 'block', textAlign: 'center', marginBottom: 8 }}>One agent, not five tools</span>
        <h2 className="section-title">Stop paying for five tools that don't talk to each other.</h2>
        <div className="pain-body" style={{ maxWidth: '780px', margin: '0 auto 40px' }}>
          <p>A scheduler here. An analytics dashboard there. An ad reporting tool. A spreadsheet you update on Mondays. A generic AI you re-explain your business to every morning. Five subscriptions, five tabs, and still no one telling you what to actually do.</p>
          <p>The agent replaces the whole stack with one thing that sees everything and gives you the answer.</p>
        </div>

        {/* Five generic tool tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px', marginTop: '32px' }}>
          {['Scheduler', 'Analytics', 'Ad Reporting', 'Spreadsheets', 'Generic AI'].map((tool, i) => (
            <span key={i} style={{ border: '1px solid var(--lp-border-subtle)', padding: '10px 20px', borderRadius: '9999px', fontSize: '14px', fontWeight: 600, color: 'var(--lp-text-secondary)', background: 'var(--lp-bg-canvas)' }}>{tool}</span>
          ))}
        </div>
      </section>



      {/* ══════════════════════════════════ S8: COMPARISON TABLE (NEW) ══════════════════════════════════ */}
      <section className="comparison-section">
        <h2 className="section-title">Why not just use ChatGPT?</h2>
        <p className="section-subtitle">Fair question. Honest answer.</p>
        
        <div style={{ maxWidth: '780px', margin: '0 auto 40px', textAlign: 'left', fontSize: '15px', lineHeight: '1.6', color: 'var(--lp-text-secondary)' }}>
          <p>
            ChatGPT is a good thinking partner. It helps you brainstorm and structure ideas. But it starts from zero every time you open a new chat, it cannot see your accounts, and it has no memory of what you posted last week or what your numbers did. Your agent does all of that, every day, without being asked.
          </p>
        </div>

        <div className="comparison-table-wrap">
          <table className="comparison-table">
            <thead>
              <tr>
                <th></th>
                <th className="comp-highlight">ZieAds Agent</th>
                <th>ChatGPT</th>
                <th>Hiring an analyst</th>
                <th>Doing it yourself</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  criteria: 'Knows your actual accounts',
                  zieads: 'Yes. Connected and synced daily',
                  chatgpt: 'No. Only what you describe',
                  agency: 'Yes, after two weeks of onboarding',
                  manual: 'Yes, if you remember to check',
                },
                {
                  criteria: 'Remembers your history',
                  zieads: 'Yes. Every briefing builds on the last',
                  chatgpt: 'No. Fresh start every chat',
                  agency: 'Partially. Notes in a doc',
                  manual: 'Only if you keep records',
                },
                {
                  criteria: 'Works every morning',
                  zieads: 'Yes. Briefing before your coffee',
                  chatgpt: 'Only when you prompt it',
                  agency: 'During business hours',
                  manual: 'When you find the time',
                },
                {
                  criteria: 'Monthly cost',
                  zieads: 'Free to start, from $29',
                  chatgpt: '$20, plus all your prompting time',
                  agency: '$3,000 to $5,000',
                  manual: 'Your time, which has a cost',
                },
                {
                  criteria: 'Acts across organic and paid',
                  zieads: 'Yes. Both in one view',
                  chatgpt: 'No',
                  agency: 'Yes, if you brief them',
                  manual: 'Depends on your bandwidth',
                },
              ].map((row, i) => (
                <tr key={i}>
                  <td className="comp-criteria">{row.criteria}</td>
                  <td className="comp-highlight">{row.zieads}</td>
                  <td>{row.chatgpt}</td>
                  <td>{row.agency}</td>
                  <td>{row.manual}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="comparison-disclaimer" style={{ background: 'var(--lp-bg-inset)', borderLeft: '4px solid var(--lp-accent)', padding: '24px', borderRadius: '0 12px 12px 0', marginTop: '32px', textAlign: 'left', maxWidth: '780px', margin: '32px auto 0' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 700, color: 'var(--lp-text-primary)' }}>What the agent does not do</h4>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6', color: 'var(--lp-text-secondary)' }}>
            The agent does not autonomously spend your money or publish without your approval. You stay in control of what goes live and what gets boosted. It watches, analyzes, drafts, and recommends. You make the call, and it handles the execution once you do. We think that is the right balance for marketing you actually care about.
          </p>
        </div>
      </section>



      {/* ══════════════════════════════════ S11: TESTIMONIALS (NEW) ══════════════════════════════════ */}
      <section className="testimonials-section">
        <span className="section-eyebrow" style={{ textTransform: 'uppercase', fontSize: '12px', fontWeight: 600, color: 'var(--lp-accent)', letterSpacing: '0.05em' }}>From people using it</span>
        <h2 className="section-title" style={{ marginTop: 8 }}>What changed when the agent took over.</h2>
        <div className="testimonials-grid">
          {[
            /* PLACEHOLDER TESTIMONIALS - To be replaced with real user quotes post-launch */
            {
              quote: "I used to spend Sunday nights planning the week's posts and guessing what to boost. Now the briefing is waiting when I wake up. I read it in five minutes and I know exactly what to do. I got my Sundays back.",
              name: "Sarah K.",
              role: "Founder, DTC skincare brand",
              avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
            },
            {
              quote: "The agent flagged that my best-performing Reel format had gone stale two weeks before I would have noticed. It suggested three new angles based on what had worked for me before. Two of them are now my top posts this month.",
              name: "Alex M.",
              role: "Solo founder, 2-person team",
              avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
            },
            {
              quote: "I run marketing for six clients. The agent gives each one its own briefing and tracks their accounts separately. What used to take me a full day of dashboard-hopping every Monday now takes an hour.",
              name: "David L.",
              role: "Freelance marketing consultant",
              avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80",
            },
          ].map((t, i) => (
            <div key={i} className="testimonial-card">
              <div className="testimonial-stars">
                {[...Array(5)].map((_, si) => (
                  <svg key={si} className="lp-star" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
              </div>
              <p className="testimonial-quote">"{t.quote}"</p>
              <div className="testimonial-author">
                <img src={t.avatar} alt={t.name} className="testimonial-avatar" />
                <div>
                  <div className="testimonial-name">{t.name}</div>
                  <div className="testimonial-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════ S10: WHO IS IT FOR (NEW) ══════════════════════════════════ */}
      <section className="who-section">
        <span className="section-eyebrow" style={{ textTransform: 'uppercase', fontSize: '12px', fontWeight: 600, color: 'var(--lp-accent)', letterSpacing: '0.05em' }}>Built for people who take marketing seriously</span>
        <h2 className="section-title" style={{ marginTop: 8 }}>Whether it is your brand or your clients'.</h2>
        <div className="who-grid">
          {[
            {
              Icon: Briefcase,
              title: "You run your own marketing.",
              headline: "You want a marketing analyst without hiring one.",
              body: "The agent watches your accounts, briefs you every morning, and tells you what to do next. You get analyst-level insight without the analyst-level salary or the two-week onboarding.",
              features: ["Free audit with no signup", "Daily briefing across all channels", "Scheduling and analytics in one place"],
              plan_suggestion: "Start free. Upgrade when the agent proves its worth."
            },
            {
              Icon: UserCheck,
              title: "You do this for clients.",
              headline: "You want to walk in already knowing what is wrong.",
              body: "Run an audit on any client URL before your first call. Show up with a readiness score, a gap breakdown, and a plan already prepared. Then let the agent track their accounts so you are never caught off guard.",
              features: ["Audit any URL in minutes", "White-label reports you can share", "Per-client briefings and tracking"],
              plan_suggestion: "Pro is built for client work."
            },
            {
              Icon: Users,
              title: "You run marketing for a team.",
              headline: "You want one place the whole operation runs from.",
              body: "Every account, every client, every channel, tracked by an agent that never takes a day off. Aggregate reporting, team seats, and a briefing for each brand you manage.",
              features: ["Unlimited audits", "White-label with your logo", "Team seats and client dashboard"],
              plan_suggestion: "The Agency plan scales with you."
            },
          ].map((persona, i) => (
            <div key={i} className="persona-card">
              <div className="persona-icon-wrap"><persona.Icon size={24} /></div>
              <span className="persona-type">{persona.title}</span>
              <h3>{persona.headline}</h3>
              <p className="persona-body">{persona.body}</p>
              <ul className="persona-features" style={{ marginBottom: '16px' }}>
                {persona.features.map((f, j) => (
                  <li key={j}><Check size={14} /> {f}</li>
                ))}
              </ul>
              <div className="persona-suggestion" style={{ fontSize: '13px', fontStyle: 'italic', color: 'var(--lp-accent)', borderTop: '1px solid var(--lp-border-subtle)', paddingTop: '12px' }}>
                {persona.plan_suggestion}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════ S12: PRICING ══════════════════════════════════ */}
      <section id="pricing" className="pricing-section">
        <h2 className="section-title">Predictable cost. No surprises.</h2>
        <p className="section-subtitle">Start free. Upgrade when the agent has earned it.</p>
        <div className="pricing-grid">
          {[
            /* 
              FOUNDER FLAG: PRICING DISCREPANCY
              - Landing Page 0.2: Free / Starter $29 / Pro $79 / Agency $199
              - Spec 0.3: Free / Solo $29 / Pro $89 / Studio $229
              Using 0.2 prices as currently canonical, pending Stripe config review.
            */
            {
              id: 'free',
              tier: 'Free',
              tagline: 'Start with the Day-1 agent audit.',
              price: '$0',
              period: 'forever',
              features: [
                "Free URL audit on any domain",
                "Readiness score across 6 dimensions",
                "Top 3 critical gap findings",
                "No card required to start"
              ],
              cta: 'Start for free',
              highlight: false,
            },
            {
              id: 'starter',
              tier: 'Starter',
              tagline: 'Your daily marketing agent briefing.',
              price: '$29',
              period: '/month',
              features: [
                "Daily agent briefing (1 account)",
                "10 deep-dive audits per month",
                "All 15 AI skill commands",
                "Organic post scheduling",
                "Unified notifications inbox"
              ],
              cta: 'Start Starter',
              highlight: false,
            },
            {
              id: 'pro',
              tier: 'Pro',
              tagline: 'For active builders and multiple brands.',
              price: '$79',
              period: '/month',
              features: [
                "Daily agent briefings (3 accounts)",
                "40 deep-dive audits per month",
                "White-label client PDF reports",
                "Unified inbox with sentiment checks",
                "Competitor watch lists"
              ],
              cta: 'Go Pro',
              highlight: true,
            },
            {
              id: 'agency',
              tier: 'Agency',
              tagline: 'For professional marketing operations.',
              price: '$199',
              period: '/month',
              features: [
                "Unlimited agent briefings",
                "Unlimited deep-dive audits",
                "Agency-branded white-label PDFs",
                "10 team seats & client portals",
                "Client aggregate performance briefs"
              ],
              cta: 'Start Agency',
              highlight: false,
            },
          ].map((plan, i) => (
            <div key={i} className={`pricing-card ${plan.highlight ? 'pricing-highlight' : ''}`}>
              {plan.highlight && <div className="popular-badge">Most Used</div>}
              <h3 className="plan-name">{plan.tier}</h3>
              <p className="plan-tagline">{plan.tagline}</p>
              <div className="plan-price">
                <span className="price-amount mono-num">{plan.price}</span>
                <span className="price-period">{plan.period}</span>
              </div>
              <ul className="plan-features">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 py-2">
                    <Check size={16} className="check-icon" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button 
                className="plan-cta" 
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(plan.id === 'free' ? '/sign-up' : `/pricing?plan=${plan.id}`)}
              >
                {plan.cta}
              </button>
            </div>
          ))}

        </div>

        {/* ROI Framing */}
        <div className="pricing-roi-block">
          <h3>A marketing analyst costs $4,000 a month.</h3>
          <p>The agent starts free and runs from $29. If it catches one bad spend decision, flags one fatiguing campaign, or saves you one Sunday of planning, it has already paid for itself for the year.</p>
          <button className="btn-lp-primary-gradient" onClick={() => { const el = document.getElementById('free-audit-try'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }} style={{ cursor: 'pointer' }}>
            See what the agent finds
          </button>
        </div>
      </section>

      {/* ══════════════════════════════════ S12: FAQ ══════════════════════════════════ */}
      <section id="faq" className="faq-section">
        <h2 className="section-title">Frequently Asked Questions</h2>
        <div className="faq-grid">
          {faqItems.map((item, i) => (
            <div key={i} className={`faq-item ${openFaqIndex === i ? 'faq-open' : ''}`}>
              <button
                className="faq-summary"
                onClick={() => setOpenFaqIndex(openFaqIndex === i ? -1 : i)}
                aria-expanded={openFaqIndex === i}
              >
                {item.q}
                <ChevronDown size={18} className="faq-chevron" />
              </button>
              {openFaqIndex === i && (
                <div className="faq-answer">
                  <p>{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════ S13: FINAL CTA ══════════════════════════════════ */}
      <section className="final-cta-section">
        <div className="lp-grid-line lp-line-left"></div>
        <div className="lp-grid-line lp-line-right"></div>
        <div className="final-cta-content">
          <h2 className="final-cta-title">
            Meet your agent. <br /><span className="lp-pill-highlight">First briefing tomorrow.</span>
          </h2>
          <p className="final-cta-subtitle">
            Start with a free audit, no signup and no card. Connect when you're ready and wake up to your first briefing.
          </p>
          <button className="btn-lp-primary-gradient final-cta-btn" onClick={scrollToHero} style={{ cursor: 'pointer' }}>
            Start Free
          </button>
          <div className="final-cta-trust-strip">
            <span><Shield size={14} /> No ad account access to start</span>
            <span><Check size={14} /> No card for the free audit</span>
            <span><Clock size={14} /> First briefing in 24 hours</span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════ S14: FOOTER ══════════════════════════════════ */}
      <footer className="footer">
        <div className="footer-inner footer-grid-layout">
          <div className="footer-col footer-brand-col">
            <div className="footer-brand" onClick={scrollToHero}>
              <ZieAdsLogo size={32} />
              <span className="brand-name">zieads</span>
            </div>
            <p className="footer-tagline">The AI marketing agent that runs your social media.</p>
            <div className="footer-social-links">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter/X">
                <ExternalLink size={16} /> Twitter/X
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <ExternalLink size={16} /> LinkedIn
              </a>
              <a href="https://producthunt.com" target="_blank" rel="noopener noreferrer" aria-label="Product Hunt">
                <ExternalLink size={16} /> Product Hunt
              </a>
            </div>
          </div>
          <div className="footer-col">
            <h4 className="footer-col-title">Product</h4>
            <a href="#how-it-works">How It Works</a>
            <a href="#free-audit-try">Try Free Scan</a>
            <a href="#pricing">Pricing</a>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/clients'); }}>Agency Plan</a>
          </div>
          <div className="footer-col">
            <h4 className="footer-col-title">Resources</h4>
            <a href="#pricing">Paid Ads Readiness Guide</a>
            <a href="#free-audit-try">Platform Comparison</a>
            <a href="#faq">FAQ</a>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/terms'); }}>Blog</a>
          </div>
          <div className="footer-col">
            <h4 className="footer-col-title">Legal</h4>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/privacy-policy'); }}>Privacy Policy</a>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/terms'); }}>Terms of Service</a>
          </div>
        </div>
        <div className="footer-bottom-bar">
          <p className="footer-copy">© 2026 ZieAds. All rights reserved.</p>
          <p className="footer-trust-note">ZieAds does not access, store, or transmit your ad account credentials. Audits are based on publicly visible page data only.</p>
        </div>
      </footer>
    </div>
  );
}
