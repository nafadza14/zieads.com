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
  Shield
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
          <div className="report-score-header">
            <div className="report-overall-score">
              <span className="report-score-number mono-num">61</span>
              <span className="report-score-max mono-num">/100</span>
            </div>
            <div className="report-grade-badge report-grade-c">C: Needs Improvement Before Launch</div>
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
      label: 'Top 3 Gaps',
      content: (
        <div className="report-tab-panel">
          <div className="report-findings-list">
            {[
              {
                severity: 'Critical',
                finding: 'No Meta Pixel detected on key conversion pages',
                impact: 'Without conversion data, Meta can\'t optimize delivery. You\'re running blind.',
                fix: 'Install Pixel on checkout, thank-you page, and lead capture. Verify with Meta Pixel Helper.',
              },
              {
                severity: 'High',
                finding: 'Primary offer is below-fold on mobile',
                impact: '60%+ of your traffic likely sees no value proposition before scrolling. High bounce = higher CPM over time.',
                fix: 'Move product name, key benefit, and CTA above 600px on mobile viewport.',
              },
              {
                severity: 'High',
                finding: 'No retargeting or MOFU audience strategy',
                impact: 'You\'re paying to acquire traffic but not recapturing people who already showed intent.',
                fix: 'Build a 30-day website visitor audience and run a separate warm campaign with a different offer angle.',
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
          <div className="report-brief-platform">
            <span className="report-platform-badge">Meta Ads</span>
          </div>
          <div className="report-creative-angles">
            {[
              {
                angle: 'Problem-first video hook',
                hook: 'Still getting clicks that don\'t convert?',
                visual: 'Screen recording of a cart abandonment moment. No voiceover. Subtitles only.',
                framework: 'Pain → Root cause → Product as fix → Social proof → CTA',
                format: 'Video, 15–30 seconds, vertical',
              },
              {
                angle: 'Specificity trust-builder',
                hook: 'Our ROAS went from 1.8x to 4.2x after one audit.',
                visual: 'Side-by-side before/after of dashboard numbers. Static image.',
                framework: 'Result first → How → What changed → CTA',
                format: 'Static, 1:1, feed placement',
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
          <div className="report-audience-tiers">
            {[
              {
                tier: 'Cold (Top of Funnel)',
                budget: '50%',
                meta: 'Advantage+ Audience with creative signals. Seed with interest layers: digital marketing, e-commerce, small business owners. Exclude existing customers.',
                google: 'Broad match keywords with smart bidding. Target In-Market: Software > Business Tools.',
              },
              {
                tier: 'Warm (Middle of Funnel)',
                budget: '35%',
                meta: 'Website visitors last 30 days. Video viewers 75%+. Lookalike 1% from customer list.',
                google: 'Remarketing list for search ads (RLSA) on branded and competitor terms.',
              },
              {
                tier: 'Hot (Bottom of Funnel)',
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
      label: 'Budget Allocation',
      content: (
        <div className="report-tab-panel">
          <p className="report-budget-context">E-commerce, $3,000/month ad budget, no prior retargeting</p>
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
          <div className="report-funnel-split">
            <h4>Budget by funnel stage</h4>
            <div className="report-funnel-items">
              <div className="report-funnel-item"><span className="report-funnel-label">TOFU</span><span className="mono-num">$1,500 (50%)</span></div>
              <div className="report-funnel-item"><span className="report-funnel-label">MOFU</span><span className="mono-num">$1,050 (35%)</span></div>
              <div className="report-funnel-item"><span className="report-funnel-label">BOFU</span><span className="mono-num">$450 (15%)</span></div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  /* ── FAQ Data ── */
  const faqItems = [
    {
      q: 'What does ZieAds actually analyze?',
      a: 'ZieAds crawls your public URL and analyzes five areas: (1) your landing page structure and conversion setup, (2) your offer clarity and creative angles, (3) your likely audience profile and targeting options, (4) your competitive positioning, and (5) your platform fit and budget readiness. We detect tracking pixels, above-fold CTA presence, mobile layout, trust signals, and funnel coverage, all without needing access to your ad account.',
    },
    {
      q: 'Will this work for my business type?',
      a: 'ZieAds works well for e-commerce, service businesses, SaaS, and lead generation companies with a public-facing website or landing page. It works less well for businesses with complex or login-gated sales flows, very niche B2B products with no public content, or businesses that only sell via phone or referral. If your website doesn\'t describe your offer clearly, the audit output will reflect that gap.',
    },
    {
      q: 'How accurate are the scores?',
      a: 'The scores are based on what\'s publicly visible on your page: HTML structure, content, detected pixels, page speed, and layout signals. They\'re accurate for surface-layer readiness. They can\'t detect things like your backend attribution setup, CRM integrations, or conversion data that lives inside your ad accounts. Think of the score as a structural readiness check, not a performance prediction.',
    },
    {
      q: 'Can I use this for client work?',
      a: 'Yes. The Starter plan gives you ZieAds-branded PDF reports. Pro gives you white-label PDFs with custom branding. Agency gives you your logo on every report plus a client management dashboard. A number of freelancers and small agencies use ZieAds audit reports as part of their initial strategy proposals.',
    },
    {
      q: 'How is this different from Semrush or AdEspresso?',
      a: 'Semrush is an SEO and keyword research platform. It does not produce paid ads strategy briefs from a URL scan. AdEspresso is a campaign management tool for Facebook ads, it requires ad account access and manages running campaigns. ZieAds is a pre-campaign strategy tool. You don\'t connect ad accounts. You paste a URL. You get a strategy brief for campaigns you haven\'t run yet, or a diagnostic for campaigns that aren\'t performing.',
    },
    {
      q: 'What happens after I get my score?',
      a: 'The free scan gives you your overall readiness score and your top 3 critical gaps. A full audit (available on paid plans) gives you the complete dimension breakdown, creative briefs per platform, audience tier strategy, budget allocation recommendation, funnel gap diagnosis, and a downloadable PDF. You can re-run audits after making changes to track improvement.',
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
        <div className="nav-inner">
          <div className="nav-brand" onClick={() => navigate('/')}>
            <ZieAdsLogo size={32} />
            <span className="brand-name">zieads</span>
          </div>
          <div className="nav-links">
            <a href="#how-it-works">How It Works</a>
            <a href="#sample-report">Sample Report</a>
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

      {/* ══════════════════════════════════ S1: HERO ══════════════════════════════════ */}
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
          Paste your URL. In 3 minutes, you'll know your ads readiness score, where your funnel is leaking,
          and exactly what to fix first, across Meta, Google, and TikTok. No ad account access needed.
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
                "Get My Free Ads Audit"
              )}
            </button>
          </div>
          {error && <p className="hero-error">{error}</p>}
          <p className="hero-note">No ad account access. No signup. Your score in under 3 minutes.</p>
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

      {/* ══════════════════════════════════ S2: STATS BAR ══════════════════════════════════ */}
      <section className="social-proof">
        <div className="proof-stats">
          <div className="stat">
            <span className="stat-number mono-num">&lt; 3 min</span>
            <span className="stat-label">Average time to your first score</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <span className="stat-number mono-num">6</span>
            <span className="stat-label">Dimensions audited per scan</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <span className="stat-number mono-num">5</span>
            <span className="stat-label">Specialist AI agents per audit</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <span className="stat-number mono-num">Free</span>
            <span className="stat-label">To find your biggest gaps</span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════ S3: PAIN SECTION (NEW) ══════════════════════════════════ */}
      <section className="pain-section">
        <h2 className="section-title">Most ad budgets have a leak.<br />You just don't know where it is.</h2>
        <div className="pain-body">
          <p>You've run some campaigns. Maybe they worked okay. Maybe they didn't. Either way, you're not totally sure which part of your setup is the problem: the creative, the audience, the landing page, or the offer itself.</p>
          <p>Hiring an agency to figure it out costs $2,000 before they even touch your account. Asking a freelancer takes a week and a proposal. Running more tests costs more budget you might be wasting.</p>
          <p>What you actually need is a fast, honest read on your current setup, before you spend another dollar testing.</p>
        </div>
        <p className="pain-transition">That's what ZieAds does.</p>
        <div className="pain-grid">
          <div className="pain-card">
            <div className="pain-icon-wrap"><Clock size={24} /></div>
            <h3>Agency audit</h3>
            <p>$1,500–$3,000 and 1–2 weeks before you see a recommendation</p>
          </div>
          <div className="pain-card">
            <div className="pain-icon-wrap"><Shuffle size={24} /></div>
            <h3>Guessing what to test</h3>
            <p>Running more campaigns hoping something sticks is expensive and slow</p>
          </div>
          <div className="pain-card">
            <div className="pain-icon-wrap"><HelpCircle size={24} /></div>
            <h3>ChatGPT doesn't know your site</h3>
            <p>A generic AI can't read your landing page, detect your tracking gaps, or audit your offer</p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════ S4: HOW IT WORKS ══════════════════════════════════ */}
      <section id="how-it-works" className="how-section">
        <h2 className="section-title">From URL to strategy brief in 3 steps</h2>
        <p className="section-subtitle">No integrations. No account access. Just your website URL.</p>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number mono-num">01</div>
            <div className="step-icon-wrap"><Link2 size={24} /></div>
            <h3>Paste your URL</h3>
            <p>Any business URL works, your homepage, product page, or landing page. ZieAds crawls the page, reads your offer, detects your tracking setup, and maps your funnel structure.</p>
            <span className="step-time-estimate">Takes 5 seconds on your end</span>
          </div>
          <div className="step-card">
            <div className="step-number mono-num">02</div>
            <div className="step-icon-wrap"><Bot size={24} /></div>
            <h3>5 specialist agents analyze your setup</h3>
            <p>One checks your creative angles. One maps your audience. One looks at competitive positioning. One audits your landing page across 8 conversion dimensions. One scores your platform fit and budget readiness. They run in parallel, that's why it's fast.</p>
            <span className="step-time-estimate">60–90 seconds of actual analysis</span>
          </div>
          <div className="step-card">
            <div className="step-number mono-num">03</div>
            <div className="step-icon-wrap"><TrendingUp size={24} /></div>
            <h3>Get a scored report you can act on today</h3>
            <p>You get a readiness score, a breakdown of your top 3 gaps, creative brief suggestions per platform, audience tier recommendations, and a budget allocation guide. Not a list of observations, a plan.</p>
            <span className="step-time-estimate">Ready in under 3 minutes total</span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════ S5: SAMPLE REPORT PREVIEW (NEW) ══════════════════════════════════ */}
      <section id="sample-report" className="report-preview-section">
        <h2 className="section-title">Here's what you get after a full audit</h2>
        <p className="section-subtitle">This is a real output from a ZieAds scan. Every section is included in the free quick scan or the full audit depending on your plan.</p>
        
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
          <button className="btn-lp-primary-gradient" onClick={scrollToHero}>
            Run a free audit and see yours
          </button>
          <p className="report-preview-microcopy">Free scan gives you your score and top 3 gaps. Full report requires a plan.</p>
        </div>
      </section>

      {/* ══════════════════════════════════ S6: AI AGENTS ══════════════════════════════════ */}
      <section className="agents-section">
        <h2 className="section-title">5 specialists. One audit.</h2>
        <p className="section-subtitle">Each agent was built for a specific part of the paid media stack. They don't overlap. They don't repeat each other's work.</p>
        <div className="agents-grid">
          {[
            {
              Icon: Palette,
              name: 'Creative Intelligence',
              desc: 'Reads your offer, brand tone, and product category. Identifies what creative angle is likely to work and what three hooks to test first, per platform.',
              catches: 'Weak headline hooks, missing emotional angle, offer that sounds like every competitor',
            },
            {
              Icon: Target,
              name: 'Audience & Targeting',
              desc: 'Builds your ICP based on your landing page content. Maps cold, warm, and hot audience tiers with platform-specific targeting logic for Meta, Google, and TikTok.',
              catches: 'Undefined ICP, no retargeting layer, audience structure that wastes budget on low-intent traffic',
            },
            {
              Icon: Search,
              name: 'Competitive Intelligence',
              desc: 'Identifies 3 tiers of competitors based on your market. Surfaces their likely ad angles, platform presence, and positioning gaps you can exploit.',
              catches: 'Positioning that doesn\'t differentiate, copy that mirrors competitors without standing out',
            },
            {
              Icon: DollarSign,
              name: 'Platform & Budget',
              desc: 'Recommends how to split budget across platforms based on your business model and funnel gaps, not generic percentages, but logic tied to where your customers actually look.',
              catches: 'Platform mismatch, budget allocated to channels that don\'t fit the product, no bidding strategy direction',
            },
            {
              Icon: Filter,
              name: 'Funnel & Conversion',
              desc: 'Audits your landing page across 8 dimensions: above-fold clarity, CTA presence, trust signals, mobile UX, tracking setup, offer-ad alignment, social proof, and load speed.',
              catches: 'No pixel, no CTA above fold, missing trust signals, offer that doesn\'t match what the ad promises',
            },
          ].map((agent, i) => (
            <div key={i} className="agent-card">
              <div className="agent-icon-wrap"><agent.Icon size={24} className="agent-icon-svg" /></div>
              <h3>{agent.name}</h3>
              <p>{agent.desc}</p>
              <div className="agent-catches">
                <span className="agent-catches-label">What it catches:</span>
                <span className="agent-catches-text">{agent.catches}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════ S7: COMPARISON TABLE (NEW) ══════════════════════════════════ */}
      <section className="comparison-section">
        <h2 className="section-title">Why not just use ChatGPT<br />or hire an agency?</h2>
        <p className="section-subtitle">Honest answer: it depends on what you need. Here's how ZieAds fits relative to your other options.</p>
        
        <div className="comparison-table-wrap">
          <table className="comparison-table">
            <thead>
              <tr>
                <th></th>
                <th className="comp-highlight">ZieAds</th>
                <th>Ask ChatGPT</th>
                <th>Hire an Agency</th>
                <th>Do It Manually</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  criteria: 'Reads your actual URL',
                  zieads: 'Yes, crawls and analyzes your page',
                  chatgpt: 'No, works from what you describe',
                  agency: 'Yes, but takes 1–2 weeks',
                  manual: 'Yes, if you know what to look for',
                },
                {
                  criteria: 'Setup time',
                  zieads: 'Under 3 minutes',
                  chatgpt: 'Instant, but shallow',
                  agency: '2–4 weeks for onboarding',
                  manual: 'Days if you have the frameworks',
                },
                {
                  criteria: 'Cost',
                  zieads: 'Free to start, from $29/month',
                  chatgpt: '$20/month, but you write all the prompts',
                  agency: '$1,500–$5,000/month minimum',
                  manual: 'Your time, which has a cost too',
                },
                {
                  criteria: 'Platform-specific output',
                  zieads: 'Meta, Google, TikTok, separate briefs',
                  chatgpt: 'Generic unless you prompt perfectly',
                  agency: 'Yes, but weeks away',
                  manual: 'Depends on your expertise',
                },
                {
                  criteria: 'Repeatable for multiple clients',
                  zieads: 'Yes, Pro and Agency plans',
                  chatgpt: 'Possible but inconsistent',
                  agency: 'No, billed per client',
                  manual: 'Possible with templates',
                },
                {
                  criteria: 'Ad account access required',
                  zieads: 'No',
                  chatgpt: 'No',
                  agency: 'Yes',
                  manual: 'Depends on audit type',
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

        <div className="comparison-disclaimer">
          <Shield size={18} />
          <p><strong>Honest note:</strong> ZieAds is a pre-campaign strategy tool. It does not manage your active campaigns, adjust bids, or replace a media buyer who works inside your ad accounts. If you need that, look at tools like GoMarble or Madgicx.</p>
        </div>
        <p className="comparison-wins">ZieAds wins when you need fast, structured strategic input before you spend, not an execution partner for campaigns already running.</p>
      </section>

      {/* ══════════════════════════════════ S8: SCORING ══════════════════════════════════ */}
      <section className="scoring-section">
        <h2 className="section-title">Your Paid Ads Readiness Score</h2>
        <p className="section-subtitle">A score that tells you whether you're ready to run paid ads profitably, not whether your page looks good.</p>
        <div className="score-dimensions">
          {[
            { name: 'Creative & Offer', weight: '25%', color: 'var(--lp-accent)', tooltip: '25% weight because nothing else matters if your offer is wrong or your hook misses.' },
            { name: 'Audience Clarity', weight: '20%', color: 'var(--lp-accent-hover)', tooltip: '20% weight: unclear audience = wasted spend from day one.' },
            { name: 'Landing Page', weight: '20%', color: 'var(--lp-text-secondary)', tooltip: '20% weight: your ad brings traffic; your page either converts it or loses it.' },
            { name: 'Platform Fit', weight: '15%', color: 'var(--lp-text-tertiary)', tooltip: '15%: not every business belongs on every platform at launch.' },
            { name: 'Funnel Coverage', weight: '10%', color: 'var(--lp-text-muted)', tooltip: '10%: most small businesses only run TOFU and wonder why ROAS is low.' },
            { name: 'Competitive', weight: '10%', color: 'var(--lp-border-strong)', tooltip: '10%: knowing where you fit changes how you position your ads.' },
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
          <h3 className="score-interp-title">What does your score mean?</h3>
          <div className="score-grade-grid">
            {[
              { range: '80–100', grade: 'A', meaning: 'Strong setup. Your main job is testing creative variations and scaling what works.', color: '#15803D' },
              { range: '60–79', grade: 'B or C', meaning: 'You can run ads, but specific gaps will limit your results. Fix before scaling.', color: '#1E7BFF' },
              { range: '40–59', grade: 'D', meaning: 'Running campaigns now will likely burn budget. Structural fixes needed first.', color: '#A16207' },
              { range: '0–39', grade: 'F', meaning: 'Several foundational gaps. Start with tracking and offer clarity before spending anything.', color: '#B91C1C' },
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

      {/* ══════════════════════════════════ S9: TESTIMONIALS (NEW) ══════════════════════════════════ */}
      <section className="testimonials-section">
        <h2 className="section-title">What paid media teams say<br />after their first audit</h2>
        <div className="testimonials-grid">
          {[
            {
              quote: "ZieAds cut our client onboarding from 3 days to 20 minutes. Every agency needs this.",
              name: "Rafi S.",
              role: "Performance Marketing Lead",
              avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
            },
            {
              quote: "The AI audit caught targeting gaps our team missed for months. ROI improved within the first week.",
              name: "Dewi A.",
              role: "Head of Growth, e-Commerce",
              avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
            },
            {
              quote: "We run ZieAds on every new client before a single rupiah is spent. It changed how we work.",
              name: "Bima P.",
              role: "Founder, Digital Agency",
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
        <h2 className="section-title">Built for people who run<br />paid ads seriously</h2>
        <p className="section-subtitle">Whether that's your own brand or someone else's.</p>
        <div className="who-grid">
          {[
            {
              Icon: Briefcase,
              title: 'Business owners running their own ads',
              headline: 'You run the ads, the ops, and the product. You don\'t have time for a 40-page audit.',
              body: 'ZieAds gives you a clear score and the top 3 things to fix first. In 3 minutes, you know whether your setup is ready to spend on, or not.',
              features: ['Free quick scan', 'Score + critical findings', 'No ad account access needed'],
            },
            {
              Icon: UserCheck,
              title: 'Freelance paid media strategists',
              headline: 'Your clients pay you for fast, credible strategy, not to wait two weeks.',
              body: 'Run an audit on any client URL before the first strategy call. Walk in with a readiness score, a gap list, and a platform recommendation. Close more engagements, faster.',
              features: ['10 audits/month on Starter', 'PDF reports to share with clients', 'Audience and creative briefs per platform'],
            },
            {
              Icon: Users,
              title: 'Small agencies with multiple clients',
              headline: 'You can\'t hire a strategist for every client. You can build a repeatable audit process.',
              body: 'White-label PDF reports with your agency logo. Unlimited audits. A client management dashboard to track who\'s been audited and when. Turn your strategy process into a product.',
              features: ['Unlimited audits on Agency plan', 'White label + agency logo', 'Client management dashboard'],
            },
          ].map((persona, i) => (
            <div key={i} className="persona-card">
              <div className="persona-icon-wrap"><persona.Icon size={24} /></div>
              <span className="persona-type">{persona.title}</span>
              <h3>{persona.headline}</h3>
              <p className="persona-body">{persona.body}</p>
              <ul className="persona-features">
                {persona.features.map((f, j) => (
                  <li key={j}><Check size={14} /> {f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════ S11: PRICING ══════════════════════════════════ */}
      <section id="pricing" className="pricing-section">
        <h2 className="section-title">Simple, Transparent Pricing</h2>
        <p className="section-subtitle">Start free. The paid plans are for when you need more audits, white-label reports, or client workflows.</p>
        <div className="pricing-grid">
          {[
            {
              tier: 'Free',
              tagline: 'Find out if your setup is ready',
              price: '$0',
              period: 'forever',
              features: ['3 Quick Scans / month', 'Score + 3 critical findings', 'No full audit'],
              cta: 'Get Started Free',
              highlight: false,
            },
            {
              tier: 'Starter',
              tagline: 'For solo founders and in-house marketers',
              price: '$29',
              period: '/month',
              features: ['10 full audits / month', 'All 15 skill commands', 'PDF reports (ZieAds branded)', '7 day report history'],
              cta: 'Start Starter',
              highlight: false,
            },
            {
              tier: 'Pro',
              tagline: 'For serious paid media practitioners',
              price: '$79',
              period: '/month',
              features: ['40 full audits / month', 'White label PDFs', 'Custom branding on reports', 'API access', 'Priority processing'],
              cta: 'Go Pro',
              highlight: true,
            },
            {
              tier: 'Agency',
              tagline: 'For teams running paid media at scale',
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
              <button className="plan-cta">{plan.cta}</button>
            </div>
          ))}
        </div>

        {/* ROI Framing */}
        <div className="pricing-roi-block">
          <h3>A freelance strategy audit typically costs $500–$1,500.</h3>
          <p>The Starter plan is $29. The Pro plan is $79. If you use it to audit one client website per month and charge for the strategic output, the math works.</p>
          <button className="btn-lp-primary-gradient" onClick={() => { const el = document.getElementById('sample-report'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}>
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
            Run the audit. Know what to fix.<br /><span className="lp-pill-highlight">Stop guessing.</span>
          </h2>
          <p className="final-cta-subtitle">
            Paste your URL. Get your readiness score and top gaps in under 3 minutes. No ad account access, no signup required for the free scan.
          </p>
          <button className="btn-lp-primary-gradient final-cta-btn" onClick={scrollToHero}>
            Get My Free Ads Audit
          </button>
          <div className="final-cta-trust-strip">
            <span><Shield size={14} /> No ad account access required</span>
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
            <a href="#sample-report">Sample Report</a>
            <a href="#pricing">Pricing</a>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/clients'); }}>Agency Plan</a>
          </div>
          <div className="footer-col">
            <h4 className="footer-col-title">Resources</h4>
            <a href="#faq">FAQ</a>
            <a href="#sample-report">Platform Comparison</a>
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
