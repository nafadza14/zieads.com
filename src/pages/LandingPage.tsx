import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ZieAdsLogo from '../components/ZieAdsLogo';

// SVG Icon Components (replacing emojis)
const IconLink = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="step-icon-svg">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);
const IconBot = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="step-icon-svg">
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <circle cx="9" cy="16" r="1" /><circle cx="15" cy="16" r="1" />
    <path d="M12 11V7" /><path d="M8 7h8" />
    <path d="M12 7V4" />
  </svg>
);
const IconChart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="step-icon-svg">
    <path d="M3 3v18h18" />
    <path d="M7 16l4-8 4 4 4-8" />
  </svg>
);
const IconPalette = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="agent-icon-svg">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="8" r="1.5" fill="currentColor" />
    <circle cx="8" cy="12" r="1.5" fill="currentColor" />
    <circle cx="15.5" cy="10" r="1.5" fill="currentColor" />
    <circle cx="15" cy="14.5" r="1.5" fill="currentColor" />
    <path d="M9 17c1-1 3-1.5 5-.5" />
  </svg>
);
const IconTarget = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="agent-icon-svg">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
);
const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="agent-icon-svg">
    <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
  </svg>
);
const IconDollar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="agent-icon-svg">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);
const IconFunnel = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="agent-icon-svg">
    <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
  </svg>
);


interface Props {
  onScanComplete: (data: any) => void;
}

export default function LandingPage({ onScanComplete }: Props) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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

  return (
    <div className="landing-page">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="nav-inner">
          <div className="nav-brand">
            <ZieAdsLogo size={36} />
            <span className="brand-name">zieads</span>
          </div>
          <div className="nav-links">
            <a href="#how-it-works">How It Works</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/clients'); }}>Agency Login</a>
          </div>
          <div className="nav-actions">
            <button className="btn-login" onClick={() => navigate('/sign-in')}>Login</button>
            <button className="btn-get-started" onClick={() => navigate('/sign-up')}>
              Get Started
              <span className="btn-arrow-circle">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero-section">
        <div className="hero-badge">
          <span className="badge-dot"></span>
          AI Powered Ads Strategy in Under 3 Minutes
        </div>
        <h1 className="hero-title">
          Get a Complete Paid Ads <br />
          <span className="gradient-text">Strategy in Minutes</span>
        </h1>
        <p className="hero-subtitle">
          Enter any URL. ZieAds deploys 5 AI agents in parallel to audit your ads setup,
          score your readiness, and deliver an execution ready strategy across Meta, Google, TikTok & more.
        </p>

        <div className="hero-input-wrapper">
          <div className="hero-input-container">
            <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              className="hero-input"
              placeholder="Enter your website URL (e.g. example.com)"
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
                <>
                  Run Free Quick Scan
                  <span className="btn-arrow-circle">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
                  </span>
                </>
              )}
            </button>
          </div>
          {error && <p className="hero-error">{error}</p>}
          <p className="hero-note">No sign up required · Results in 30 seconds · 100% free</p>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="social-proof">
        <div className="proof-stats">
          <div className="stat">
            <span className="stat-number">2,847</span>
            <span className="stat-label">Reports Generated</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <span className="stat-number">4.8/5</span>
            <span className="stat-label">Average Rating</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <span className="stat-number">&lt; 3 min</span>
            <span className="stat-label">Avg Report Time</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <span className="stat-number">15</span>
            <span className="stat-label">AI Skill Agents</span>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="how-section">
        <h2 className="section-title">How ZieAds Works</h2>
        <p className="section-subtitle">From URL to execution ready strategy in 3 steps</p>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <div className="step-icon-wrap"><IconLink /></div>
            <h3>Enter Your URL</h3>
            <p>Paste any business URL. ZieAds scrapes the page, detects pixels, identifies your offer, and builds context.</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <div className="step-icon-wrap"><IconBot /></div>
            <h3>5 AI Agents Analyze</h3>
            <p>Five specialized agents run in parallel: Creative, Audience, Competitive, Platform/Budget, and Funnel/Conversion.</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <div className="step-icon-wrap"><IconChart /></div>
            <h3>Get Your Report</h3>
            <p>Receive a scored audit with actionable findings, creative briefs, audience strategies, and a downloadable PDF.</p>
          </div>
        </div>
      </section>

      {/* AGENTS SECTION */}
      <section className="agents-section">
        <h2 className="section-title">Your AI Ads Team</h2>
        <p className="section-subtitle">5 specialist agents working together to build your strategy</p>
        <div className="agents-grid">
          {[
            { Icon: IconPalette, name: 'Creative Intelligence', desc: 'Analyzes brand identity, generates 3 creative concepts per platform with hooks, visuals, and emotional angles.' },
            { Icon: IconTarget, name: 'Audience & Targeting', desc: 'Builds your ICP, audience tiers (cold/warm/hot), and platform specific targeting matrices.' },
            { Icon: IconSearch, name: 'Competitive Intelligence', desc: 'Maps 3 tiers of competitors, analyzes their ad spend, platforms, and positioning gaps.' },
            { Icon: IconDollar, name: 'Platform & Budget', desc: 'Determines optimal platform mix, budget allocation, KPI benchmarks, and bidding strategies.' },
            { Icon: IconFunnel, name: 'Funnel & Conversion', desc: 'Audits landing pages across 8 dimensions and maps your TOFU/MOFU/BOFU coverage.' },
          ].map((agent, i) => (
            <div key={i} className="agent-card">
              <div className="agent-icon-wrap"><agent.Icon /></div>
              <h3>{agent.name}</h3>
              <p>{agent.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SCORING */}
      <section className="scoring-section">
        <h2 className="section-title">Paid Ads Readiness Score</h2>
        <p className="section-subtitle">Track your progress with a 0 to 100 score across 6 dimensions</p>
        <div className="score-dimensions">
          {[
            { name: 'Creative & Offer', weight: '25%', color: '#7B2FBE' },
            { name: 'Audience Clarity', weight: '20%', color: '#5c8aff' },
            { name: 'Landing Page', weight: '20%', color: '#00c9a7' },
            { name: 'Platform Fit', weight: '15%', color: '#e8457a' },
            { name: 'Funnel Coverage', weight: '10%', color: '#f59e0b' },
            { name: 'Competitive', weight: '10%', color: '#8b5cf6' },
          ].map((dim, i) => (
            <div key={i} className="dimension-bar">
              <div className="dim-info">
                <span className="dim-name">{dim.name}</span>
                <span className="dim-weight">{dim.weight}</span>
              </div>
              <div className="dim-track">
                <div className="dim-fill" style={{ width: `${60 + i * 5}%`, backgroundColor: dim.color }}></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="pricing-section">
        <h2 className="section-title">Simple, Transparent Pricing</h2>
        <p className="section-subtitle">Start free. Upgrade when you're ready.</p>
        <div className="pricing-grid">
          {[
            {
              tier: 'Free',
              price: '$0',
              period: 'forever',
              features: ['3 Quick Scans / month', 'Score + 3 critical findings', 'No full audit'],
              cta: 'Get Started Free',
              highlight: false,
            },
            {
              tier: 'Starter',
              price: '$29',
              period: '/month',
              features: ['10 full audits / month', 'All 15 skill commands', 'PDF reports (ZieAds branded)', '7 day report history'],
              cta: 'Start Starter',
              highlight: false,
            },
            {
              tier: 'Pro',
              price: '$79',
              period: '/month',
              features: ['40 full audits / month', 'White label PDFs', 'Custom branding on reports', 'API access', 'Priority processing'],
              cta: 'Go Pro',
              highlight: true,
            },
            {
              tier: 'Agency',
              price: '$199',
              period: '/month',
              features: ['Unlimited audits', 'White label + agency logo', 'Team seats (up to 5)', 'Full API access', 'Client management dashboard'],
              cta: 'Start Agency',
              highlight: false,
            },
          ].map((plan, i) => (
            <div key={i} className={`pricing-card ${plan.highlight ? 'pricing-highlight' : ''}`}>
              {plan.highlight && <div className="popular-badge">Most Popular</div>}
              <h3 className="plan-name">{plan.tier}</h3>
              <div className="plan-price">
                <span className="price-amount">{plan.price}</span>
                <span className="price-period">{plan.period}</span>
              </div>
              <ul className="plan-features">
                {plan.features.map((f, j) => (
                  <li key={j}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="check-icon">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <button className={`plan-cta ${plan.highlight ? 'plan-cta-primary' : ''}`}>{plan.cta}</button>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="faq-section">
        <h2 className="section-title">Frequently Asked Questions</h2>
        <div className="faq-grid">
          {[
            { q: 'What does ZieAds actually analyze?', a: 'ZieAds scrapes your website, detects tracking pixels, identifies your offer, analyzes competitors, evaluates landing page conversion readiness, and generates platform specific creative and audience strategies, all using 5 specialized AI agents.' },
            { q: 'Will this work for my business type?', a: 'Yes! ZieAds adapts its analysis based on your business type: E-commerce, SaaS, B2B Lead Gen, Local Business, or Creator. Each agent adjusts its recommendations to your specific model and goals.' },
            { q: 'How accurate are the scores?', a: 'Scores are based on established paid advertising best practices and signal detection. They identify real, specific issues with your setup, like missing pixels, weak headlines, or conversion blockers, not generic advice.' },
            { q: 'Can I use this for client work?', a: 'Absolutely. Pro and Agency tiers include white label PDF reports with your own branding. Many freelancers and agencies use ZieAds to produce client deliverables in minutes instead of days.' },
            { q: 'How is this different from Semrush or AdEspresso?', a: 'Those tools focus on ads management and reporting. ZieAds focuses on strategy generation: from URL to complete, execution ready paid ads strategy with creative briefs, audience targeting, and budget allocation.' },
          ].map((item, i) => (
            <details key={i} className="faq-item">
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <ZieAdsLogo size={32} />
            <span className="brand-name">zieads</span>
          </div>
          <p className="footer-text">AI Paid Ads Strategy Agent for Marketers</p>
          <p className="footer-copy">© 2026 ZieAds. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
