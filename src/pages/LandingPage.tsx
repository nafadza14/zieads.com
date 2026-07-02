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
          <span className="lp-rating-text">Your AI marketing agent, working daily</span>
        </div>
        
        <h1 className="hero-title">
          The AI Marketing Agent that <br />
          <span className="lp-pill-highlight">runs your social media.</span>
        </h1>
        
        <p className="hero-subtitle">
          ZieAds connects to your social accounts and ad data, then works like a marketing analyst that never sleeps. Every morning it tells you what worked, what is slipping, and exactly what to do today. You approve. It handles the rest.
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
                "Start Free"
              )}
            </button>
          </div>
          {error && <p className="hero-error">{error}</p>}
          <p className="hero-note">Connects in 2 minutes. Free plan, no card required. Your first briefing tomorrow morning.</p>
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
              <div className="lp-chrome-title">app.zieads.com — your daily briefing</div>
            </div>
            <div className="lp-showcase-body" style={{ height: 'auto' }}>
              <img 
                src="/zieads-dashboard.png" 
                alt="app.zieads.com — your daily briefing" 
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
            <span className="stat-number mono-num">2 minutes</span>
            <span className="stat-label">To connect your social channels</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <span className="stat-number mono-num">Every morning</span>
            <span className="stat-label">A marketing briefing waiting for you</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <span className="stat-number mono-num">15</span>
            <span className="stat-label">AI skills covering your marketing stack</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <span className="stat-number mono-num">Free</span>
            <span className="stat-label">To start with no card required</span>
          </div>
        </div>
      </section>
 
      {/* ══════════════════════════════════ S3: PAIN SECTION (NEW) ══════════════════════════════════ */}
      <section className="pain-section">
        <h2 className="section-title">You are not bad at marketing. You are doing five jobs at once.</h2>
        <div className="pain-body">
          <p>You run the ads. You write the posts. You schedule them across three platforms. You check the numbers on Monday, forget by Wednesday, and try to remember what actually worked last month.</p>
          <p>Every morning there is a decision waiting. Which post to boost. Whether that campaign is still working. What to post today when you already posted the obvious things. You make these calls between meetings, on your phone, with half the information.</p>
          <p>The tools you have do not help with this. A scheduler tells you when a post goes out, not whether it should. An analytics dashboard shows you charts, then leaves you to figure out what they mean. Your ad manager reports numbers after the money is already spent.</p>
          <p>What you actually need is not another dashboard. It is someone who watches everything, understands your specific setup, and tells you what to do next. A marketing analyst. Except you cannot afford one, and you do not have time to brief one every morning.</p>
        </div>
        <p className="pain-transition">That is what the agent is for.</p>
        <div className="pain-grid">
          <div className="pain-card">
            <div className="pain-icon-wrap"><Clock size={24} /></div>
            <h3>Hiring a marketing analyst</h3>
            <p>A good one costs $4,000 a month and needs two weeks to understand your accounts. By then the campaign you were worried about has already spent its budget.</p>
          </div>
          <div className="pain-card">
            <div className="pain-icon-wrap"><Shuffle size={24} /></div>
            <h3>Figuring it out yourself</h3>
            <p>You test one thing at a time and wait a week per test. Every wrong guess is real money and real time you do not get back.</p>
          </div>
          <div className="pain-card">
            <div className="pain-icon-wrap"><HelpCircle size={24} /></div>
            <h3>Asking a generic AI</h3>
            <p>ChatGPT gives you advice that sounds right but has never seen your accounts, your numbers, or what you posted last week. It starts from zero every time you open it.</p>
          </div>
        </div>
      </section>
 
      {/* ══════════════════════════════════ S4: HOW IT WORKS ══════════════════════════════════ */}
      <section id="how-it-works" className="how-section">
        <h2 className="section-title">Connect once. Get briefed every morning.</h2>
        <p className="section-subtitle">Two minutes to set up. Then the agent works whether you are watching or not.</p>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number mono-num">01</div>
            <div className="step-icon-wrap"><Link2 size={24} /></div>
            <h3>Start with a free audit</h3>
            <p>Paste any URL and the agent reads your setup like a strategist would. Your offer, your funnel, your tracking, your creative angles, scored across six dimensions in under three minutes. This is how the agent learns your business, and it is free with no signup.</p>
            <span className="step-time-estimate">Your entry point. No card required.</span>
          </div>
          <div className="step-card">
            <div className="step-number mono-num">02</div>
            <div className="step-icon-wrap"><Bot size={24} /></div>
            <h3>Connect your accounts</h3>
            <p>Link Instagram, TikTok, and LinkedIn, and upload your ad performance from Meta, Google, or TikTok. The agent now sees your organic and paid marketing in one place, the way your customers actually experience your brand.</p>
            <span className="step-time-estimate">Connects in about two minutes</span>
          </div>
          <div className="step-card">
            <div className="step-number mono-num">03</div>
            <div className="step-icon-wrap"><TrendingUp size={24} /></div>
            <h3>Get your daily briefing</h3>
            <p>Every morning the agent delivers a briefing: what worked yesterday, what is slipping, and the three to five things worth doing today, ranked by impact. You approve what matters. Schedule the posts, run the deep dives, act on the alerts.</p>
            <span className="step-time-estimate">Your first briefing lands tomorrow</span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════ S5: SAMPLE REPORT PREVIEW ══════════════════════════════════ */}
      <section id="sample-report" className="report-preview-section">
        <span className="report-preview-eyebrow" style={{ textTransform: 'uppercase', fontSize: '12px', fontWeight: 600, color: 'var(--lp-accent)', letterSpacing: '0.05em' }}>What you actually get</span>
        <h2 className="section-title" style={{ marginTop: 8 }}>This is a real ZieAds audit.</h2>
        <p className="section-subtitle">Not a mock-up. Every field below comes from a live scan. Your agent uses this audit as its baseline memory to track your setup's improvement over time.</p>
        
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
        <span className="section-eyebrow" style={{ textTransform: 'uppercase', fontSize: '12px', fontWeight: 600, color: 'var(--lp-accent)', letterSpacing: '0.05em' }}>What the agent does</span>
        <h2 className="section-title" style={{ marginTop: 8, marginBottom: 16 }}>It already knows your setup. That is the whole point.</h2>
        <p className="section-subtitle" style={{ maxWidth: '640px', margin: '0 auto 40px' }}>Most AI tools answer questions. Your agent answers your questions, about your accounts, with everything it already knows about you.</p>
        
        <div className="ai-strategist-explanation" style={{ maxWidth: '780px', margin: '0 auto 48px', textAlign: 'left', fontSize: '16px', lineHeight: '1.7', color: 'var(--lp-text-secondary)', background: 'var(--lp-bg-card)', border: '1px solid var(--lp-border-subtle)', borderRadius: '16px', padding: '32px', boxShadow: 'var(--lp-shadow-card)' }}>
          <p style={{ margin: 0 }}>
            When you ask why last week was slow, the agent already knows your pixel was misfiring on checkout, that your best-performing angle has been problem-first, and that you have been running cold audiences only. The answer reflects all of that. It does not start from zero. It picks up where yesterday left off.
          </p>
        </div>

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

        <div className="ai-context-callout" style={{ maxWidth: '780px', margin: '0 auto', textAlign: 'left', background: 'var(--lp-bg-inset)', borderLeft: '4px solid var(--lp-accent)', padding: '24px', borderRadius: '0 12px 12px 0' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 700, color: 'var(--lp-text-primary)' }}>What makes this different from generic AI assistants</h4>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6', color: 'var(--lp-text-secondary)' }}>
            Your agent reads your briefing history and connected account statistics before generating responses. It knows what you have posted, what you scheduled, and what ad creatives are fatiguing. ChatGPT starts from zero every time.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════ S7: 15 SKILLS SECTION ══════════════════════════════════ */}
      <section className="skills-section" style={{ padding: '120px 24px', background: 'var(--lp-bg-canvas-alt)', textAlign: 'center' }}>
        <span className="section-eyebrow" style={{ textTransform: 'uppercase', fontSize: '12px', fontWeight: 600, color: 'var(--lp-accent)', letterSpacing: '0.05em' }}>One agent. Fifteen skills.</span>
        <h2 className="section-title" style={{ marginTop: 8, marginBottom: 16 }}>Every play your marketing needs, on command.</h2>
        <p className="section-subtitle" style={{ maxWidth: '640px', margin: '0 auto 40px' }}>
          Run any of them yourself, or let the agent trigger them when the data calls for it. Each one draws from your accounts and history, so the output is about your setup, not generic to your industry.
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

      {/* ══════════════════════════════════ S9: READINESS SCORE EXPLAINED ══════════════════════════════════ */}
      <section className="scoring-section">
        <span className="section-eyebrow" style={{ textTransform: 'uppercase', fontSize: '12px', fontWeight: 600, color: 'var(--lp-accent)', letterSpacing: '0.05em', display: 'block', textAlign: 'center', marginBottom: 8 }}>The score behind the audit</span>
        <h2 className="section-title">Your score tells you where to start, not just how you rank.</h2>
        <p className="section-subtitle">Six dimensions, each weighted by how much it actually moves performance. The agent tracks this over time, so you see your setup improve as you act on what it finds.</p>
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
          <button className="btn-lp-primary-gradient" onClick={() => { const el = document.getElementById('sample-report'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }} style={{ cursor: 'pointer' }}>
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
            Meet the agent. <br /><span className="lp-pill-highlight">Get your first briefing tomorrow.</span>
          </h2>
          <p className="final-cta-subtitle">
            Start with a free audit, no signup and no card. Connect your accounts when you are ready, and wake up to your first briefing tomorrow.
          </p>
          <button className="btn-lp-primary-gradient final-cta-btn" onClick={scrollToHero} style={{ cursor: 'pointer' }}>
            Start Free
          </button>
          <div className="final-cta-trust-strip">
            <span><Shield size={14} /> Connects in 2 minutes</span>
            <span><Check size={14} /> Free plan, no card required</span>
            <span><Clock size={14} /> First briefing tomorrow</span>
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
