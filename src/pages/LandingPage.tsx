import { useState } from 'react';
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
  Check 
} from 'lucide-react';

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
      {/* GRID LINES BACKGROUND */}
      <div className="lp-grid-line lp-line-left"></div>
      <div className="lp-grid-line lp-line-right"></div>
      <div className="lp-line-top"></div>

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="nav-inner">
          <div className="nav-brand" onClick={() => navigate('/')}>
            <ZieAdsLogo size={32} />
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
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero-section">
        <div className="lp-hero-eyebrow">
          <div className="lp-stars">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="lp-star" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            ))}
          </div>
          <span className="lp-rating-text">4.9 on Product Hunt · AI Strategy in Under 3 Minutes</span>
        </div>
        
        <h1 className="hero-title">
          Get a Complete Paid Ads <br />
          <span className="lp-pill-highlight">Strategy in Minutes</span>
        </h1>
        
        <p className="hero-subtitle">
          Enter any URL. ZieAds deploys 5 AI agents in parallel to audit your ads setup,
          score your readiness, and deliver an execution ready strategy across Meta, Google, TikTok & more.
        </p>

        <div className="hero-input-wrapper">
          <div className="hero-input-container">
            <Search className="input-icon" size={20} />
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
                "Run Free Quick Scan"
              )}
            </button>
          </div>
          {error && <p className="hero-error">{error}</p>}
          <p className="hero-note">No sign up required · Results in 30 seconds · 100% free</p>
        </div>

        {/* SHOWCASE CARD WITH RAINBOW GLOW */}
        <div className="lp-showcase-container">
          <div className="lp-rainbow-glow"></div>
          <div className="lp-showcase-card">
            <div className="lp-showcase-header">
              <div className="lp-chrome-dots">
                <span className="lp-dot-red"></span>
                <span className="lp-dot-yellow"></span>
                <span className="lp-dot-green"></span>
              </div>
              <div className="lp-chrome-title">app.zieads.com/dashboard</div>
            </div>
            <div className="lp-showcase-body">
              <div className="lp-showcase-sidebar">
                <div className="lp-sidebar-logo">
                  <ZieAdsLogo size={20} />
                  <span>zieads</span>
                </div>
                <div className="lp-sidebar-links">
                  <div className="lp-sidebar-link active">Dashboard</div>
                  <div className="lp-sidebar-link">AI Audit</div>
                  <div className="lp-sidebar-link">Creative Studio</div>
                  <div className="lp-sidebar-link">Audience Builder</div>
                </div>
              </div>
              <div className="lp-showcase-content">
                <div className="lp-content-header">
                  <h3>Strategy Report</h3>
                  <span className="lp-badge-success">Ready</span>
                </div>
                <div className="lp-showcase-metrics">
                  <div className="lp-metric-card">
                    <span className="lp-metric-label">Readiness Score</span>
                    <span className="lp-metric-value">87/100</span>
                  </div>
                  <div className="lp-metric-card">
                    <span className="lp-metric-label">Est. ROAS Increase</span>
                    <span className="lp-metric-value">+42%</span>
                  </div>
                  <div className="lp-metric-card">
                    <span className="lp-metric-label">AI Agent Audit</span>
                    <span className="lp-metric-value">5/5 Done</span>
                  </div>
                </div>
                <div className="lp-chat-mock">
                  <div className="lp-chat-bubble lp-ai">
                    <span className="lp-ai-avatar">AI</span>
                    <p>I've detected Meta pixel gaps on your cart page. Here is the recommended targeting strategy...</p>
                  </div>
                  <div className="lp-chat-bubble lp-user">
                    <p>Generate 3 image ad hooks for our SaaS launch.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="social-proof">
        <div className="proof-stats">
          <div className="stat">
            <span className="stat-number mono-num">2,847</span>
            <span className="stat-label">Reports Generated</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <span className="stat-number mono-num">4.8/5</span>
            <span className="stat-label">Average Rating</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <span className="stat-number mono-num">&lt; 3 min</span>
            <span className="stat-label">Avg Report Time</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <span className="stat-number mono-num">15</span>
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
            <div className="step-number mono-num">1</div>
            <div className="step-icon-wrap"><Link2 size={24} /></div>
            <h3>Enter Your URL</h3>
            <p>Paste any business URL. ZieAds scrapes the page, detects pixels, identifies your offer, and builds context.</p>
          </div>
          <div className="step-card">
            <div className="step-number mono-num">2</div>
            <div className="step-icon-wrap"><Bot size={24} /></div>
            <h3>5 AI Agents Analyze</h3>
            <p>Five specialized agents run in parallel: Creative, Audience, Competitive, Platform/Budget, and Funnel/Conversion.</p>
          </div>
          <div className="step-card">
            <div className="step-number mono-num">3</div>
            <div className="step-icon-wrap"><TrendingUp size={24} /></div>
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
            { Icon: Palette, name: 'Creative Intelligence', desc: 'Analyzes brand identity, generates 3 creative concepts per platform with hooks, visuals, and emotional angles.' },
            { Icon: Target, name: 'Audience & Targeting', desc: 'Builds your ICP, audience tiers (cold/warm/hot), and platform specific targeting matrices.' },
            { Icon: Search, name: 'Competitive Intelligence', desc: 'Maps 3 tiers of competitors, analyzes their ad spend, platforms, and positioning gaps.' },
            { Icon: DollarSign, name: 'Platform & Budget', desc: 'Determines optimal platform mix, budget allocation, KPI benchmarks, and bidding strategies.' },
            { Icon: Filter, name: 'Funnel & Conversion', desc: 'Audits landing pages across 8 dimensions and maps your TOFU/MOFU/BOFU coverage.' },
          ].map((agent, i) => (
            <div key={i} className="agent-card">
              <div className="agent-icon-wrap"><agent.Icon size={24} className="agent-icon-svg" /></div>
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
            { name: 'Creative & Offer', weight: '25%', color: 'var(--lp-accent)' },
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
              <button className="plan-cta">{plan.cta}</button>
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

      {/* FINAL CTA */}
      <section className="final-cta-section">
        <div className="lp-grid-line lp-line-left"></div>
        <div className="lp-grid-line lp-line-right"></div>
        <div className="final-cta-content">
          <h2 className="final-cta-title">
            Ready to Scale Your Ads <span className="lp-pill-highlight">Without the Agency Cost?</span>
          </h2>
          <p className="final-cta-subtitle">
            Join thousands of businesses using AI-powered strategies to optimize campaigns in minutes.
          </p>
          <button className="btn-lp-primary-gradient final-cta-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            Run Your Free Scan Now
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
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

