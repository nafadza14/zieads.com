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
      q: 'What does ZieAds actually look at?',
      a: 'ZieAds crawls your public URL and checks five things: your landing page structure and conversion setup, your offer clarity and what creative angles might work, your likely audience profile based on what your page communicates, what your competitors appear to be doing in paid media, and whether your tracking and platform setup is ready for campaigns. It does all of this without connecting to your ad account.',
    },
    {
      q: 'Does this work if I have never run ads before?',
      a: 'Yes. A lot of people use ZieAds before their first campaign specifically to find out what they need to fix before spending. The audit will tell you what is missing, and the AI Strategist can walk you through what each finding means and what to do next.',
    },
    {
      q: 'How accurate are the scores?',
      a: 'The scores are based on what is publicly visible on your page: the HTML structure, your content and offer language, whether tracking pixels are present, your page load time, and your funnel layout. They are accurate for what we can see. They cannot check things that live inside your ad accounts, like your historical conversion data or your campaign structure. Think of it as a structural readiness check, not a performance prediction.',
    },
    {
      q: 'Can I use this for client work?',
      a: 'Yes. The Starter plan exports ZieAds-branded PDFs. Pro gives you white-label reports with your name on them. Agency gives you your logo on every PDF plus a client dashboard. A number of freelancers use the audit as the starting point for their initial client strategy calls.',
    },
    {
      q: 'How is this different from Semrush or AdEspresso?',
      a: 'Semrush is built for SEO and keyword research. It does not produce paid ads strategy briefs from a URL scan. AdEspresso is a campaign management tool for Facebook ads and it requires ad account access. ZieAds does not connect to your ad accounts and does not manage running campaigns. It is for strategy before campaigns launch, or diagnosis when they are not performing.',
    },
    {
      q: 'What happens after I get my score?',
      a: 'The free scan gives you your overall readiness score and your top three gaps. A full audit on paid plans gives you the complete dimension breakdown, creative briefs per platform, audience tier strategy, budget allocation guide, funnel gap diagnosis, and a downloadable PDF. You can re-run audits after making changes to track improvement over time.',
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
          <span className="lp-rating-text">Paid ads strategy in under 3 minutes</span>
        </div>
        
        <h1 className="hero-title">
          Most paid ads campaigns fail in the <br />
          <span className="lp-pill-highlight">setup, not the spend.</span>
        </h1>
        
        <p className="hero-subtitle">
          ZieAds reads your website like a paid media strategist would. Paste any URL and get a scored audit of your offer, funnel, tracking setup, creative angles, and audience fit across Meta, Google, and TikTok. No ad account access. No agency required.
        </p>

        <div className="hero-input-wrapper">
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
          <p className="hero-note">No ad account access. No signup required. Your score in under 3 minutes.</p>
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
            <div className="lp-showcase-body" style={{ height: 'auto' }}>
              <img 
                src="/zieads-dashboard.png" 
                alt="ZieAds Real Dashboard Screenshot" 
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
      </section>

      {/* ══════════════════════════════════ S2: STATS BAR ══════════════════════════════════ */}
      <section className="social-proof">
        <div className="proof-stats">
          <div className="stat">
            <span className="stat-number mono-num">Under 3 min</span>
            <span className="stat-label">From URL to your first score</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <span className="stat-number mono-num">6</span>
            <span className="stat-label">Dimensions audited in every scan</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <span className="stat-number mono-num">15</span>
            <span className="stat-label">AI skills covering your full paid media stack</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <span className="stat-number mono-num">Free</span>
            <span className="stat-label">To find where your setup is losing money</span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════ S3: PAIN SECTION (NEW) ══════════════════════════════════ */}
      <section className="pain-section">
        <h2 className="section-title">You are not bad at ads. You are running them on a setup that was never ready.</h2>
        <div className="pain-body">
          <p>You have a real product. You have budget. You have watched enough YouTube tutorials to know the difference between a lookalike audience and a retargeting campaign. But the results are still inconsistent and you are not totally sure why.</p>
          <p>Maybe the creative is the problem. Maybe it is the audience. Maybe it is the landing page. Maybe it is the pixel that your developer installed six months ago and you have never verified. You do not know which one to fix first so you test one thing at a time and wait two weeks per test.</p>
          <p>Meanwhile the agency quote came back at $3,000 a month. The freelancer needs two weeks to prepare a strategy. And ChatGPT gave you a framework that was technically correct but had no idea what your website actually looked like.</p>
          <p>The gap is not between you and people who are good at ads. The gap is information. Specifically, you do not have a fast, honest read on what is actually wrong with your setup right now.</p>
        </div>
        <p className="pain-transition">That is the only thing ZieAds does.</p>
        <div className="pain-grid">
          <div className="pain-card">
            <div className="pain-icon-wrap"><Clock size={24} /></div>
            <h3>Getting an audit done</h3>
            <p>A proper agency audit costs $1,500 to $3,000 and takes 10 days. By then you could have spent another month on the wrong setup.</p>
          </div>
          <div className="pain-card">
            <div className="pain-icon-wrap"><Shuffle size={24} /></div>
            <h3>Testing your way to clarity</h3>
            <p>Running more campaigns to figure out what is wrong is the most expensive way to learn. You are paying tuition every time.</p>
          </div>
          <div className="pain-card">
            <div className="pain-icon-wrap"><HelpCircle size={24} /></div>
            <h3>Asking an AI assistant</h3>
            <p>ChatGPT does not know what your landing page looks like, whether your pixel is firing, or what your competitors are spending on ads. It gives frameworks. Not answers.</p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════ S4: HOW IT WORKS ══════════════════════════════════ */}
      <section id="how-it-works" className="how-section">
        <h2 className="section-title">From URL to strategy brief in 3 steps</h2>
        <p className="section-subtitle">No ad account access. No setup. Just paste your URL.</p>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number mono-num">01</div>
            <div className="step-icon-wrap"><Link2 size={24} /></div>
            <h3>Paste your URL</h3>
            <p>Any public business URL works. Your homepage, a product page, a landing page you are about to run traffic to. ZieAds crawls the page, reads your offer, checks your tracking setup, and maps the structure of your funnel.</p>
            <span className="step-time-estimate">5 seconds on your end</span>
          </div>
          <div className="step-card">
            <div className="step-number mono-num">02</div>
            <div className="step-icon-wrap"><Bot size={24} /></div>
            <h3>Five specialists analyze your setup</h3>
            <p>One checks your creative angles and offer clarity. One maps your audience and ICP. One looks at what your competitors are doing. One audits your landing page across 8 conversion dimensions. One scores your platform fit and budget readiness. They run at the same time so the whole thing takes under 3 minutes.</p>
            <span className="step-time-estimate">60 to 90 seconds of actual analysis</span>
          </div>
          <div className="step-card">
            <div className="step-number mono-num">03</div>
            <div className="step-icon-wrap"><TrendingUp size={24} /></div>
            <h3>Get a report you can act on today</h3>
            <p>Your readiness score, your top gaps ranked by impact, creative briefs per platform, audience tier recommendations, and a budget split guide. Not a list of observations. A plan with a clear starting point.</p>
            <span className="step-time-estimate">Ready in under 3 minutes total</span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════ S5: SAMPLE REPORT PREVIEW ══════════════════════════════════ */}
      <section id="sample-report" className="report-preview-section">
        <span className="report-preview-eyebrow" style={{ textTransform: 'uppercase', fontSize: '12px', fontWeight: 600, color: 'var(--lp-accent)', letterSpacing: '0.05em' }}>What you actually get</span>
        <h2 className="section-title" style={{ marginTop: 8 }}>This is a real ZieAds audit.</h2>
        <p className="section-subtitle">Not a mock-up. Every field below comes from a live scan. The free scan gives you your score and top 3 gaps. The full report is what the paid plans unlock.</p>
        
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

        <div className="report-preview-cta">
          <button className="btn-lp-primary-gradient" onClick={scrollToHero} style={{ cursor: 'pointer', padding: '14px 28px', fontSize: '15px', fontWeight: 600, border: 'none', borderRadius: '12px', color: 'white', transition: 'all 0.2s' }}>
            See yours
          </button>
          <p className="report-preview-microcopy" style={{ marginTop: 12, fontSize: '13px', color: 'var(--lp-text-muted)' }}>Free scan takes 3 minutes. No signup.</p>
        </div>
      </section>

      {/* ══════════════════════════════════ S6: AI STRATEGIST SECTION ══════════════════════════════════ */}
      <section className="ai-strategist-section" style={{ padding: '120px 24px', background: 'var(--lp-bg-canvas)', textAlign: 'center' }}>
        <span className="section-eyebrow" style={{ textTransform: 'uppercase', fontSize: '12px', fontWeight: 600, color: 'var(--lp-accent)', letterSpacing: '0.05em' }}>After the audit</span>
        <h2 className="section-title" style={{ marginTop: 8, marginBottom: 16 }}>Your AI strategist. It already knows your setup.</h2>
        <p className="section-subtitle" style={{ maxWidth: '640px', margin: '0 auto 40px' }}>Most AI tools answer questions. ZieAds AI answers your questions. There is a difference.</p>
        
        <div className="ai-strategist-explanation" style={{ maxWidth: '780px', margin: '0 auto 48px', textAlign: 'left', fontSize: '16px', lineHeight: '1.7', color: 'var(--lp-text-secondary)', background: 'var(--lp-bg-card)', border: '1px solid var(--lp-border-subtle)', borderRadius: '16px', padding: '32px', boxShadow: 'var(--lp-shadow-card)' }}>
          <p style={{ margin: 0 }}>
            When you ask "My ROAS dropped this week, what could it be?", ZieAds AI already knows that your pixel was not firing on checkout when we last checked, that your main creative angle was problem-first, and that you were running cold audiences only. The answer it gives you reflects all of that. A generic AI assistant starts from zero every time.
          </p>
        </div>

        <div className="pain-grid" style={{ marginBottom: 48 }}>
          {[
            {
              Icon: Activity,
              name: 'Daily Diagnosis',
              desc: 'What changed in your ad performance today and what it likely means. Not a data dump. A diagnosis.',
            },
            {
              Icon: TrendingDown,
              name: 'ROAS Drop Analysis',
              desc: 'When your returns fall, there is usually one specific cause. This mode works through the likely culprits in order of probability.',
            },
            {
              Icon: EyeOff,
              name: 'Creative Fatigue',
              desc: 'Your audience has seen your ad. Now what? New formats, new hooks based on what you have already been running.',
            },
            {
              Icon: Sliders,
              name: 'Budget Optimization',
              desc: 'How to reallocate your spend across platforms and audience tiers based on current performance and your business stage.',
            },
            {
              Icon: Radar,
              name: 'Competitive Intel',
              desc: 'What your competitors are doing in paid media right now. Where they are spending. What angles they are running. Where the gaps are.',
            },
            {
              Icon: Rocket,
              name: 'Launch Readiness',
              desc: 'Pre-launch check before a new campaign, product, or platform. Run this before you spend, not after.',
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

        <div className="ai-context-callout" style={{ maxWidth: '780px', margin: '0 auto', textAlign: 'left', background: 'var(--lp-bg-inset)', borderLeft: '4px solid var(--lp-accent)', padding: '24px', borderRadius: '0 12px 12px 0' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 700, color: 'var(--lp-text-primary)' }}>What makes this different from ChatGPT</h4>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6', color: 'var(--lp-text-secondary)' }}>
            ZieAds AI reads your audit history before every answer. It knows what your scan found, what you have already fixed, and what platform you are running on. ChatGPT does not know any of that. You would have to explain your entire setup every time.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════ S7: 15 SKILLS SECTION ══════════════════════════════════ */}
      <section className="skills-section" style={{ padding: '120px 24px', background: 'var(--lp-bg-canvas-alt)', textAlign: 'center' }}>
        <span className="section-eyebrow" style={{ textTransform: 'uppercase', fontSize: '12px', fontWeight: 600, color: 'var(--lp-accent)', letterSpacing: '0.05em' }}>One platform. 15 skills.</span>
        <h2 className="section-title" style={{ marginTop: 8, marginBottom: 16 }}>Every skill your paid media strategy needs.</h2>
        <p className="section-subtitle" style={{ maxWidth: '640px', margin: '0 auto 40px' }}>
          Run any of them on demand. Each one draws from your Business Profile and audit history so the output is specific to your setup, not generic to your industry.
        </p>

        <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--lp-text-primary)', marginBottom: 32 }}>
          Tap any command. Get a structured output in under 3 minutes.
        </p>

        <div className="pain-grid" style={{ marginBottom: 32 }}>
          {[
            {
              command: '/ads audit',
              name: 'Full Audit',
              description: '5 specialists. All 6 dimensions. Your most complete readiness picture.',
            },
            {
              command: '/ads quick',
              name: 'Quick Scan',
              description: '60-second readiness snapshot when you need a fast check before a decision.',
            },
            {
              command: '/ads copy',
              name: 'Ad Copy',
              description: 'Platform-specific headlines and body copy for Google, Meta, TikTok, and LinkedIn.',
            },
            {
              command: '/ads creatives',
              name: 'Creative Brief',
              description: 'Three creative directions per platform with angles, hooks, and visual frameworks.',
            },
            {
              command: '/ads landing',
              name: 'Landing Page CRO',
              description: '8-dimension audit of your landing page conversion setup.',
            },
            {
              command: '/ads audiences',
              name: 'Audience Targeting',
              description: 'ICP definition, cold/warm/hot tiers, and platform-specific targeting matrices.',
            },
            {
              command: '/ads competitors',
              name: 'Competitor Intel',
              description: 'Three-tier competitor map: who they are, what they are spending, where they are leaving gaps.',
            },
            {
              command: '/ads funnel',
              name: 'Funnel Architecture',
              description: 'TOFU, MOFU, BOFU mapping with gap diagnosis and routing logic.',
            },
            {
              command: '/ads budget',
              name: 'Budget Model',
              description: 'Platform allocation, KPI benchmarks, and spend recommendations by funnel stage.',
            },
            {
              command: '/ads google',
              name: 'Google Ads Strategy',
              description: 'Search, Shopping, and Display campaign structures with match type recommendations.',
            },
            {
              command: '/ads meta',
              name: 'Meta Ads Strategy',
              description: 'Facebook and Instagram campaign structure, creative format, and objective selection.',
            },
            {
              command: '/ads tiktok',
              name: 'TikTok Ads Strategy',
              description: 'UGC angles, Spark Ads setup, and creative hooks that perform on short-form.',
            },
          ].map((skill, i) => (
            <div key={i} className="pain-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span className="mono-num" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: 'var(--lp-accent)', background: 'var(--lp-pill-bg)', padding: '4px 10px', borderRadius: '6px', display: 'inline-block', marginBottom: '16px' }}>
                  {skill.command}
                </span>
                <h3 style={{ fontSize: '17px', fontWeight: 600, marginBottom: '8px', color: 'var(--lp-text-primary)' }}>{skill.name}</h3>
                <p style={{ fontSize: '13.5px', color: 'var(--lp-text-secondary)', lineHeight: '1.5', margin: 0 }}>{skill.description}</p>
              </div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: '14px', fontStyle: 'italic', color: 'var(--lp-text-muted)' }}>
          Plus 3 additional skills available inside the platform.
        </p>
      </section>

      {/* ══════════════════════════════════ S8: COMPARISON TABLE (NEW) ══════════════════════════════════ */}
      <section className="comparison-section">
        <h2 className="section-title">Why not just use ChatGPT?</h2>
        <p className="section-subtitle">Fair question. Honest answer.</p>
        
        <div style={{ maxWidth: '780px', margin: '0 auto 40px', textAlign: 'left', fontSize: '15px', lineHeight: '1.6', color: 'var(--lp-text-secondary)' }}>
          <p>
            ChatGPT is a good thinking partner. It helps you brainstorm. It helps you structure. But it starts from zero every time you open a new chat, it cannot read your actual website, and it has no idea what your readiness score is or what your competitors are spending. ZieAds does all three of those things and nothing else.
          </p>
        </div>

        <div className="comparison-table-wrap">
          <table className="comparison-table">
            <thead>
              <tr>
                <th></th>
                <th className="comp-highlight">ZieAds</th>
                <th>ChatGPT</th>
                <th>Hiring an Agency</th>
                <th>Doing It Manually</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  criteria: 'Reads your actual URL',
                  zieads: 'Yes, every scan crawls your page',
                  chatgpt: 'No. Knows only what you describe',
                  agency: 'Yes, but 10 to 14 days later',
                  manual: 'Yes, if you know what to look for',
                },
                {
                  criteria: 'Remembers your audit history',
                  zieads: 'Yes. Every answer draws from past scans',
                  chatgpt: 'No. Fresh start every session',
                  agency: 'Partially. Notes in a shared doc',
                  manual: 'Only if you keep records',
                },
                {
                  criteria: 'Time to first insight',
                  zieads: 'Under 3 minutes',
                  chatgpt: 'Instant, but generic',
                  agency: '1 to 2 weeks',
                  manual: 'Days if you know the frameworks',
                },
                {
                  criteria: 'Monthly cost',
                  zieads: 'Free to start, from $29',
                  chatgpt: '$20, plus all your prompting time',
                  agency: '$1,500 to $5,000 minimum',
                  manual: 'Your time, which has a cost',
                },
                {
                  criteria: 'Platform-specific output',
                  zieads: 'Separate briefs for Meta, Google, TikTok',
                  chatgpt: 'Generic unless you prompt it perfectly',
                  agency: 'Yes, but weeks away',
                  manual: 'Depends on your expertise',
                },
                {
                  criteria: 'No ad account access needed',
                  zieads: 'Correct. URL only.',
                  chatgpt: 'Correct',
                  agency: 'No. They need full account access',
                  manual: 'Not always',
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
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 700, color: 'var(--lp-text-primary)' }}>What ZieAds does not do</h4>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6', color: 'var(--lp-text-secondary)' }}>
            ZieAds does not manage your active campaigns, adjust your bids, or replace a media buyer working inside your ad accounts. If your campaigns are already running and you need execution help, tools like GoMarble or Madgicx are built for that. ZieAds is for strategy: what to run, how to structure it, and whether your setup is ready before you spend.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════ S9: READINESS SCORE EXPLAINED ══════════════════════════════════ */}
      <section className="scoring-section">
        <h2 className="section-title">Your score tells you where to start, not just how you rank.</h2>
        <p className="section-subtitle">Six dimensions. Each one weighted by how much it actually moves paid performance.</p>
        <div className="score-dimensions">
          {[
            { name: 'Creative and Offer', weight: '25%', color: 'var(--lp-accent)', tooltip: 'The heaviest weight because if your offer is unclear or your creative hook is weak, nothing else can save the campaign. This is where most problems start.' },
            { name: 'Audience Clarity', weight: '20%', color: 'var(--lp-accent-hover)', tooltip: 'You cannot target the right people if you have not defined who they are. A fuzzy ICP leads to wasted spend from the first impression.' },
            { name: 'Landing Page', weight: '20%', color: 'var(--lp-text-secondary)', tooltip: 'Your ad brings traffic. Your page either earns it or loses it. Tracking gaps and weak above-fold content are the two most common killers here.' },
            { name: 'Platform Fit', weight: '15%', color: 'var(--lp-text-tertiary)', tooltip: 'Not every business belongs on every platform at the start. This dimension checks whether your product, budget, and format match the platform you are planning to use.' },
            { name: 'Funnel Coverage', weight: '10%', color: 'var(--lp-text-muted)', tooltip: 'Most small businesses run top-of-funnel only and then wonder why ROAS is low. This checks whether you have warm and hot audience strategies in place.' },
            { name: 'Competitive', weight: '10%', color: 'var(--lp-border-strong)', tooltip: 'Understanding where your competitors are positioned changes how you write your ads. This surfaces the positioning gaps worth owning.' },
          ].map((dim, i) => (
            <div key={i} className="dimension-bar" title={dim.tooltip}>
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

        {/* Score Interpretation Block */}
        <div className="score-interpretation">
          <h3 className="score-interp-title">What your score means in practice</h3>
          <div className="score-grade-grid">
            {[
              { range: '80 to 100', grade: 'A', meaning: 'Your setup is solid. Focus on creative testing and scaling what works.', color: '#15803D' },
              { range: '60 to 79', grade: 'B or C', meaning: 'Specific gaps are capping your performance. Fix the highest-weight issues before increasing spend.', color: '#1E7BFF' },
              { range: '40 to 59', grade: 'D', meaning: 'Running campaigns at this score will burn budget. Structural fixes come before spend increases.', color: '#A16207' },
              { range: '0 to 39', grade: 'F', meaning: 'Several foundational issues need attention. Start with tracking and offer clarity.', color: '#B91C1C' },
            ].map((g, i) => (
              <div key={i} className="score-grade-row">
                <div className="score-grade-badge" style={{ backgroundColor: g.color }}>{g.grade}</div>
                <div className="score-grade-info">
                  <span className="score-grade-range mono-num">{g.range}</span>
                  <p className="score-grade-meaning">{g.meaning}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════ S11: TESTIMONIALS (NEW) ══════════════════════════════════ */}
      <section className="testimonials-section">
        <span className="section-eyebrow" style={{ textTransform: 'uppercase', fontSize: '12px', fontWeight: 600, color: 'var(--lp-accent)', letterSpacing: '0.05em' }}>From people using it</span>
        <h2 className="section-title" style={{ marginTop: 8 }}>What they found in their first audit.</h2>
        <div className="testimonials-grid">
          {[
            {
              quote: "I had been running Meta ads for three months and assumed the pixel was fine. The audit flagged it immediately. No pixel on the checkout page. I had been optimizing for click traffic the whole time with zero purchase data going back to Meta. That one finding alone was worth more than the cost of the plan.",
              name: "Alex M.",
              role: "E-commerce founder, 2-person team",
              avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
            },
            {
              quote: "I run paid media for six clients. Before ZieAds I was spending 4 to 5 hours per client putting together a first strategy session. Now I run the audit, use the brief as my starting point, and spend that time on strategy calls instead. The PDF comes out clean enough to share directly.",
              name: "Sarah K.",
              role: "Freelance paid media strategist",
              avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
            },
            {
              quote: "The readiness score gave me something concrete to show my manager when I asked for more budget. Instead of saying 'I think we need to fix the landing page', I had a score that said landing page is at 48 out of 100 and here is why. That conversation went differently.",
              name: "David L.",
              role: "In-house marketing manager",
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
        <span className="section-eyebrow" style={{ textTransform: 'uppercase', fontSize: '12px', fontWeight: 600, color: 'var(--lp-accent)', letterSpacing: '0.05em' }}>Built for people who run paid ads seriously</span>
        <h2 className="section-title" style={{ marginTop: 8 }}>Whether that is your own brand or someone else's.</h2>
        <div className="who-grid">
          {[
            {
              Icon: Briefcase,
              title: "You run your own ads.",
              headline: "You are doing this yourself and you want to know if you are doing it right.",
              body: "You do not need someone to manage your campaigns. You need a fast, honest assessment of whether your setup is ready before you commit budget. ZieAds gives you your readiness score, your top gaps, and exactly what to fix first. In under 3 minutes.",
              features: ["Free scan with no signup", "Readiness score across 6 dimensions", "Specific fix recommendations per gap"],
              plan_suggestion: "Start free. Upgrade to Starter if you run more than one campaign per month."
            },
            {
              Icon: UserCheck,
              title: "You do this for clients.",
              headline: "Your clients pay for fast, credible strategy. They do not want to wait a week for a document.",
              body: "Run a ZieAds audit on any client URL before your first strategy call. Walk in with a readiness score, a gap breakdown, and platform recommendations already prepared. The PDF comes out clean enough to share directly or use as a foundation for your own deck.",
              features: ["Audit any URL in under 3 minutes", "PDF report ready to share", "Creative briefs and audience strategy per platform"],
              plan_suggestion: "Starter works for 2 to 3 clients a month. Pro is for 10 or more."
            },
            {
              Icon: Users,
              title: "You run paid media for multiple clients.",
              headline: "You need a repeatable audit process that does not cost you 4 hours per client.",
              body: "Unlimited audits. White-label PDFs with your agency name. A client dashboard that tracks every account you manage. Five team seats. ZieAds becomes your pre-campaign process, not a one-off tool you pull out occasionally.",
              features: ["Unlimited audits", "White-label PDF with your agency logo", "Client management dashboard", "Up to 5 team seats"],
              plan_suggestion: "Agency plan. One client retainer covers the monthly cost."
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
        <p className="section-subtitle">Run audits, fix funnels, and get to a strategy you can actually execute. Without an agency.</p>
        <div className="pricing-grid">
          {[
            {
              id: 'free',
              tier: 'Free',
              tagline: 'Find out what is actually wrong.',
              price: '$0',
              period: 'forever',
              features: [
                "3 quick scans per month",
                "Readiness score across 6 dimensions",
                "Top 3 critical findings",
                "No ad account access required"
              ],
              cta: 'Start for free',
              highlight: false,
            },
            {
              id: 'starter',
              tier: 'Starter',
              tagline: 'For one brand running its own ads.',
              price: '$29',
              period: '/month',
              features: [
                "10 full audits per month",
                "All 15 AI skill commands",
                "PDF reports",
                "7-day report history",
                "AI Strategist with audit history context",
                "Email support"
              ],
              cta: 'Start Starter',
              highlight: false,
            },
            {
              id: 'pro',
              tier: 'Pro',
              tagline: 'For freelancers and practitioners working on client accounts.',
              price: '$79',
              period: '/month',
              features: [
                "40 full audits per month",
                "White-label PDFs, your name on reports",
                "All analysis modes in AI Strategist",
                "Priority processing",
                "API access",
                "Unlimited report history"
              ],
              cta: 'Go Pro',
              highlight: true,
            },
            {
              id: 'agency',
              tier: 'Agency',
              tagline: 'For agencies managing paid media across multiple client accounts.',
              price: '$199',
              period: '/month',
              features: [
                "Unlimited full audits",
                "White-label PDFs with agency logo",
                "5 team seats",
                "Client management dashboard",
                "Monthly aggregate client reports",
                "Premium support"
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
          <h3>A strategy session with a freelance consultant typically costs $500 to $1,000.</h3>
          <p>Starter is $29. If you use it once a month to prep for a campaign and it saves you one bad spend decision, it has already paid for itself.</p>
          <button className="btn-lp-primary-gradient" onClick={() => { const el = document.getElementById('sample-report'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }} style={{ cursor: 'pointer' }}>
            See what a full report looks like
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
            Run the audit. Know what to fix. <br /><span className="lp-pill-highlight">Stop guessing.</span>
          </h2>
          <p className="final-cta-subtitle">
            Paste your URL. Get your readiness score and top gaps in under 3 minutes. No ad account access, no signup required for the free scan.
          </p>
          <button className="btn-lp-primary-gradient final-cta-btn" onClick={scrollToHero} style={{ cursor: 'pointer' }}>
            Get My Free Audit
          </button>
          <div className="final-cta-trust-strip">
            <span><Shield size={14} /> No ad account access</span>
            <span><Check size={14} /> No signup for free scan</span>
            <span><Clock size={14} /> Results in under 3 minutes</span>
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
            <p className="footer-tagline">AI-powered paid ads strategy for marketers and agencies.</p>
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
            <a href="#sample-report">All 15 Skills</a>
            <a href="#sample-report">Sample Report</a>
            <a href="#pricing">Pricing</a>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/clients'); }}>Agency Plan</a>
          </div>
          <div className="footer-col">
            <h4 className="footer-col-title">Resources</h4>
            <a href="#pricing">Paid Ads Readiness Guide</a>
            <a href="#sample-report">Platform Comparison</a>
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
