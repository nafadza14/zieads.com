import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ZieAdsLogo from '../components/ZieAdsLogo';
import { MessageSquare, Zap } from 'lucide-react';

// ─── Plan Data ────────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Find out what is actually wrong.',
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlyPerMonth: 0,
    color: '#6b7280',
    gradient: 'linear-gradient(135deg, #f9fafb, #f3f4f6)',
    aiChat: { daily: 5, label: '5 AI messages / day' },
    skillRun: { monthly: 10, label: '10 skill runs / month' },
    recommended: false,
    ctaText: 'Start Free',
    ctaRoute: '/sign-up',
    features: [
      { label: '4 AI skill commands (Audit, Quick, Copy, Creatives)', included: true },
      { label: 'Basic AI Chat', included: true },
      { label: 'PDF export (ZieAds branded)', included: true },
      { label: '3-day report history', included: true },
      { label: 'Business profile', included: true },
      { label: 'All 15 skills', included: false },
      { label: 'AI analysis modes', included: false },
      { label: 'White-label PDFs', included: false },
      { label: 'Audit history in AI context', included: false },
      { label: 'API access', included: false },
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'For one brand running its own ads.',
    monthlyPrice: 29,
    yearlyPrice: 278,
    yearlyPerMonth: 23,
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
    aiChat: { daily: 20, label: '20 AI messages / day' },
    skillRun: { monthly: 50, label: '50 skill runs / month' },
    recommended: false,
    ctaText: 'Get Starter',
    ctaRoute: '/sign-up',
    features: [
      { label: 'All 15 AI skill commands', included: true },
      { label: '5 AI analysis modes (incl. Daily Diagnosis, ROAS Drop)', included: true },
      { label: 'PDF export (ZieAds branded)', included: true },
      { label: '7-day report history', included: true },
      { label: 'Audit history in AI context', included: true },
      { label: 'Business profile', included: true },
      { label: 'Budget Optimization & Competitive Intel modes', included: false },
      { label: 'White-label PDFs', included: false },
      { label: 'Priority queue', included: false },
      { label: 'API access', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For freelancers and practitioners working on client accounts.',
    monthlyPrice: 79,
    yearlyPrice: 758,
    yearlyPerMonth: 63,
    color: '#7c3aed',
    gradient: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
    aiChat: { daily: 80, label: '80 AI messages / day' },
    skillRun: { monthly: 160, label: '160 skill runs / month' },
    recommended: true,
    ctaText: 'Go Pro',
    ctaRoute: '/sign-up',
    features: [
      { label: 'All 15 AI skill commands', included: true },
      { label: 'All 6 AI analysis modes', included: true },
      { label: 'White-label PDF reports', included: true },
      { label: 'Unlimited report history', included: true },
      { label: 'Audit history in AI context', included: true },
      { label: 'Priority queue', included: true },
      { label: 'API access (10M tokens/month)', included: true },
      { label: 'Business profile', included: true },
      { label: 'Team seats', included: false },
      { label: 'Client management dashboard', included: false },
    ],
  },
  {
    id: 'agency',
    name: 'Agency',
    tagline: 'For agencies managing paid media across multiple accounts.',
    monthlyPrice: 199,
    yearlyPrice: 1910,
    yearlyPerMonth: 159,
    color: '#0ea5e9',
    gradient: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
    aiChat: { daily: 300, label: '300 AI messages / day' },
    skillRun: { monthly: -1, label: 'Unlimited skill runs' },
    recommended: false,
    ctaText: 'Start Agency',
    ctaRoute: '/sign-up',
    features: [
      { label: 'Everything in Pro', included: true },
      { label: 'Unlimited skill runs (fair use)', included: true },
      { label: 'Custom agency logo on PDFs', included: true },
      { label: '5 team seats included', included: true },
      { label: 'Client management dashboard', included: true },
      { label: 'Monthly aggregate client reports', included: true },
      { label: 'Unlimited API tokens', included: true },
      { label: 'Priority queue', included: true },
      { label: 'All AI modes + all 15 skills', included: true },
      { label: 'Dedicated support', included: true },
    ],
  },
];

// ─── Comparison Table Data ────────────────────────────────────────────────────

const COMPARISON_ROWS = [
  { label: 'AI Chat Credits', values: ['5 / day', '20 / day', '80 / day', '300 / day'] },
  { label: 'Skill Run Credits', values: ['10 / month', '50 / month', '160 / month', 'Unlimited'] },
  { label: 'AI Skills Available', values: ['4 skills', 'All 15', 'All 15', 'All 15'] },
  { label: 'AI Analysis Modes', values: ['Basic chat only', '5 modes', 'All 6 modes', 'All 6 modes'] },
  { label: 'PDF Export', values: ['ZieAds branded', 'ZieAds branded', 'White-label', 'White-label + Custom logo'] },
  { label: 'Report History', values: ['3 days', '7 days', 'Unlimited', 'Unlimited'] },
  { label: 'Audit History in AI', values: ['-', '✓', '✓', '✓'] },
  { label: 'Priority Queue', values: ['-', '-', '✓', '✓'] },
  { label: 'API Access', values: ['-', '-', '10M tokens/mo', 'Unlimited'] },
  { label: 'Team Seats', values: ['1', '1', '1', '5'] },
  { label: 'Client Dashboard', values: ['-', '-', '-', '✓'] },
  { label: 'Monthly Aggregate Reports', values: ['-', '-', '-', '✓'] },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function CheckIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PricingPage() {
  const navigate = useNavigate();
  const [yearly, setYearly] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="landing-page" style={{ minHeight: '100vh', background: 'var(--lp-bg-canvas)', color: 'var(--lp-text-primary)', fontFamily: 'var(--font-primary, sans-serif)', position: 'relative', overflow: 'hidden' }}>
      
      {/* GRID LINES BACKGROUND */}
      <div className="lp-grid-line lp-line-left"></div>
      <div className="lp-grid-line lp-line-right"></div>
      <div className="lp-line-top"></div>

      {/* ══════════════════════════════════ NAVBAR ══════════════════════════════════ */}
      <nav className="navbar">
        <div className="nav-inner relative w-full h-full flex items-center justify-between">
          <div className="nav-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <ZieAdsLogo size={32} />
            <span className="brand-name">zieads</span>
          </div>
          <div className="nav-links hidden md:flex">
            <a href="#how-it-works" onClick={(e) => { e.preventDefault(); navigate('/#how-it-works'); }}>How It Works</a>
            <a href="/pricing" onClick={(e) => { e.preventDefault(); navigate('/pricing'); }}>Pricing</a>
            <a href="#faq" onClick={(e) => { e.preventDefault(); navigate('/#faq'); }}>FAQ</a>
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
                <a href="#how-it-works" onClick={() => { setIsMobileMenuOpen(false); navigate('/#how-it-works'); }}>How It Works</a>
                <a href="/pricing" onClick={() => { setIsMobileMenuOpen(false); navigate('/pricing'); }}>Pricing</a>
                <a href="#faq" onClick={() => { setIsMobileMenuOpen(false); navigate('/#faq'); }}>FAQ</a>
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
                  Get Started Free
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="hero-section">
        <div className="lp-hero-eyebrow">
          <span className="lp-rating-text">Start free · No credit card required</span>
        </div>
        <h1 className="hero-title">
          Predictable growth,{' '}
          <span style={{ background: 'var(--lp-accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            simple pricing.
          </span>
        </h1>
        <p className="hero-subtitle">
          Run audits, fix funnels, and scale ROAS without hiring an agency. Pick the plan that fits your growth stage.
        </p>

        {/* Monthly / Yearly Toggle */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 12,
          background: 'var(--lp-bg-canvas-alt)', padding: 4, borderRadius: 12,
          border: '1px solid var(--lp-border-subtle)',
          boxShadow: 'var(--lp-shadow-subtle)',
        }}>
          <button
            id="toggle-monthly"
            onClick={() => setYearly(false)}
            style={{
              padding: '8px 22px', borderRadius: 9,
              background: !yearly ? 'var(--lp-bg-card)' : 'transparent',
              color: !yearly ? 'var(--lp-text-primary)' : 'var(--lp-text-tertiary)',
              fontWeight: !yearly ? 750 : 500,
              fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: !yearly ? 'var(--lp-shadow-card)' : 'none',
              border: !yearly ? '1px solid var(--lp-border-subtle)' : '1px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            Monthly
          </button>
          <button
            id="toggle-yearly"
            onClick={() => setYearly(true)}
            style={{
              padding: '8px 22px', borderRadius: 9,
              background: yearly ? 'var(--lp-bg-card)' : 'transparent',
              color: yearly ? 'var(--lp-text-primary)' : 'var(--lp-text-tertiary)',
              fontWeight: yearly ? 750 : 500,
              fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: yearly ? 'var(--lp-shadow-card)' : 'none',
              border: yearly ? '1px solid var(--lp-border-subtle)' : '1px solid transparent',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 7,
            }}
          >
            Yearly
            <span style={{
              background: 'var(--lp-accent)',
              color: 'var(--lp-text-on-accent)', fontSize: '0.65rem', fontWeight: 800,
              padding: '2px 7px', borderRadius: 6, letterSpacing: '0.04em',
            }}>
              SAVE 20%
            </span>
          </button>
        </div>
      </section>

      {/* ── Plan Cards ─────────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px', position: 'relative', zIndex: 5 }}>
        <div className="pricing-grid">
          {PLANS.map(plan => {
            const price = yearly ? plan.yearlyPerMonth : plan.monthlyPrice;
            const priceLabel = yearly && plan.yearlyPrice > 0 ? `$${plan.yearlyPrice} billed yearly` : '';

            return (
              <div
                key={plan.id}
                id={`plan-card-${plan.id}`}
                className={`pricing-card ${plan.recommended ? 'pricing-highlight' : ''}`}
                style={{
                  position: 'relative',
                  display: 'flex', flexDirection: 'column',
                }}
              >
                {/* Most popular badge */}
                {plan.recommended && (
                  <div className="popular-badge">
                    Most Popular
                  </div>
                )}

                {/* Plan header */}
                <div style={{
                  padding: '12px 14px', borderRadius: 12,
                  background: 'var(--lp-bg-inset)', border: '1px solid var(--lp-border-subtle)', marginBottom: 20,
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: plan.recommended ? 'var(--lp-accent)' : 'var(--lp-text-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                    {plan.name}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--lp-text-secondary)', lineHeight: 1.4 }}>
                    {plan.tagline}
                  </div>
                </div>

                {/* Price */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 650, color: 'var(--lp-text-tertiary)' }}>$</span>
                    <span className="price-amount mono-num" style={{ lineHeight: 1 }}>
                      {price}
                    </span>
                    {plan.monthlyPrice > 0 ? (
                      <span className="price-period">/mo</span>
                    ) : (
                      <span className="price-period">forever</span>
                    )}
                  </div>
                  {priceLabel && (
                    <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600, marginTop: 4 }}>
                      {priceLabel}
                    </div>
                  )}
                </div>

                {/* Credit pills */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '4px 10px', borderRadius: 6,
                    background: plan.recommended ? 'rgba(30, 123, 255, 0.12)' : 'var(--lp-pill-bg)',
                    color: plan.recommended ? 'var(--lp-accent)' : 'var(--lp-text-primary)',
                    fontSize: '11px', fontWeight: 700,
                    border: plan.recommended ? '1px solid rgba(30, 123, 255, 0.2)' : '1px solid var(--lp-border-subtle)',
                    display: 'inline-flex', alignItems: 'center', gap: 6
                  }}>
                    <MessageSquare size={12} style={{ opacity: 0.8 }} />
                    <span>{plan.aiChat.label}</span>
                  </span>
                  <span style={{
                    padding: '4px 10px', borderRadius: 6,
                    background: plan.recommended ? 'rgba(30, 123, 255, 0.12)' : 'var(--lp-pill-bg)',
                    color: plan.recommended ? 'var(--lp-accent)' : 'var(--lp-text-primary)',
                    fontSize: '11px', fontWeight: 700,
                    border: plan.recommended ? '1px solid rgba(30, 123, 255, 0.2)' : '1px solid var(--lp-border-subtle)',
                    display: 'inline-flex', alignItems: 'center', gap: 6
                  }}>
                    <Zap size={12} style={{ opacity: 0.8 }} />
                    <span>{plan.skillRun.label}</span>
                  </span>
                </div>

                {/* CTA Button */}
                <button
                  id={`plan-cta-${plan.id}`}
                  onClick={() => navigate(plan.ctaRoute)}
                  className={plan.recommended ? "btn-lp-primary-gradient" : "plan-cta"}
                  style={{
                    width: '100%',
                    padding: '12px 0',
                    borderRadius: 'var(--lp-radius-button)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginBottom: 24,
                    border: plan.recommended ? 'none' : '1px solid var(--lp-border-default)',
                    transition: 'all 0.2s',
                  }}
                >
                  {plan.ctaText} →
                </button>

                {/* Divider */}
                <div style={{ height: 1, background: 'var(--lp-border-subtle)', marginBottom: 20 }} />

                {/* Feature list */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--lp-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
                    What's included
                  </div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {plan.features.map((f, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '13.5px', color: f.included ? 'var(--lp-text-secondary)' : 'var(--lp-text-muted)' }}>
                        {f.included ? <CheckIcon color={plan.recommended ? 'var(--lp-accent)' : 'var(--lp-text-primary)'} /> : <XIcon />}
                        <span>{f.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Feature Comparison Table ────────────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto 100px', padding: '0 24px', position: 'relative', zIndex: 5 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <button
            id="toggle-comparison-table"
            onClick={() => setShowTable(!showTable)}
            style={{
              background: 'var(--lp-bg-card)', border: '1px solid var(--lp-border-default)',
              color: 'var(--lp-text-secondary)', fontSize: '14px', fontWeight: 600,
              padding: '10px 24px', borderRadius: 'var(--lp-radius-button)', cursor: 'pointer',
              fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 8,
              boxShadow: 'var(--lp-shadow-subtle)',
              transition: 'all 0.2s',
            }}
            onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--lp-text-primary)'; e.currentTarget.style.color = 'var(--lp-text-primary)'; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--lp-border-default)'; e.currentTarget.style.color = 'var(--lp-text-secondary)'; }}
          >
            {showTable ? '↑ Hide' : '↓ View'} full feature comparison
          </button>
        </div>

        {showTable && (
          <div className="comparison-table-wrap" style={{ border: '1px solid var(--lp-border-subtle)', background: 'var(--lp-bg-card)', boxShadow: 'var(--lp-shadow-card)', borderRadius: 'var(--lp-radius-card)' }}>
            {/* Table header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
              background: 'var(--lp-bg-inset)', borderBottom: '1.5px solid var(--lp-border-subtle)',
              padding: '16px 24px',
            }}>
              <div style={{ fontSize: '12px', fontWeight: 750, color: 'var(--lp-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Feature</div>
              {PLANS.map(p => (
                <div key={p.id} style={{ textAlign: 'center', fontSize: '13px', fontWeight: 700, color: p.color === '#6b7280' ? 'var(--lp-text-secondary)' : p.color }}>
                  {p.name}
                </div>
              ))}
            </div>

            {/* Table rows */}
            {COMPARISON_ROWS.map((row, i) => (
              <div
                key={i}
                style={{
                  display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                  padding: '14px 24px',
                  background: i % 2 === 0 ? 'var(--lp-bg-card)' : 'var(--lp-bg-inset)',
                  borderBottom: i < COMPARISON_ROWS.length - 1 ? '1px solid var(--lp-border-subtle)' : 'none',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontSize: '13.5px', color: 'var(--lp-text-primary)', fontWeight: 600 }}>{row.label}</div>
                {row.values.map((val, j) => (
                  <div key={j} style={{
                    textAlign: 'center', fontSize: '13px',
                    color: val === '-' ? 'var(--lp-text-muted)' : val === '✓' ? PLANS[j].color === '#6b7280' ? 'var(--lp-accent)' : PLANS[j].color : 'var(--lp-text-secondary)',
                    fontWeight: (val === '✓' || val.includes('Unlimited') || val.includes('All')) ? 700 : 400,
                  }}>
                    {val}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── FAQ / Bottom CTA ─────────────────────────── */}
      <section style={{ maxWidth: 640, margin: '0 auto 120px', padding: '0 24px', textAlign: 'center', position: 'relative', zIndex: 5 }}>
        <h2 style={{ fontSize: '28px', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--lp-text-primary)', marginBottom: 12, letterSpacing: '-0.03em' }}>
          Still have questions?
        </h2>
        <p style={{ fontSize: '15px', color: 'var(--lp-text-secondary)', marginBottom: 28, lineHeight: 1.6 }}>
          Email us at <a href="mailto:founder@zieads.com" style={{ color: 'var(--lp-accent)', fontWeight: 600, textDecoration: 'none' }}>founder@zieads.com</a> and we'll reply within a few hours.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/sign-up')} className="btn-lp-primary-gradient" style={{
            padding: '13px 32px', borderRadius: 'var(--lp-radius-button)', border: 'none',
            color: '#fff', fontSize: '15px', fontWeight: 700,
            cursor: 'pointer',
            boxShadow: 'var(--lp-shadow-cta)',
            transition: 'all 0.2s',
          }}>
            Start for free
          </button>
          <button onClick={() => navigate('/')} style={{
            padding: '13px 32px', borderRadius: 'var(--lp-radius-button)',
            border: '1px solid var(--lp-border-default)', background: 'var(--lp-bg-card)',
            color: 'var(--lp-text-secondary)', fontSize: '15px', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: 'var(--lp-shadow-subtle)',
            transition: 'all 0.2s',
          }}
            onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--lp-text-primary)'; e.currentTarget.style.color = 'var(--lp-text-primary)'; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--lp-border-default)'; e.currentTarget.style.color = 'var(--lp-text-secondary)'; }}
          >
            See how it works
          </button>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid var(--lp-border-subtle)', padding: '24px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: '13px', color: 'var(--lp-text-tertiary)', flexWrap: 'wrap', gap: 12,
        background: 'var(--lp-bg-canvas-alt)',
        position: 'relative', zIndex: 5,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ZieAdsLogo size={16} />
          <span style={{ fontWeight: 700, color: 'var(--lp-text-primary)', fontFamily: 'var(--font-display)' }}>zieads</span>
          <span>© 2026 ZieAds. All rights reserved.</span>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <span onClick={() => navigate('/privacy-policy')} style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={e => (e.currentTarget.style.color = 'var(--lp-text-primary)')} onMouseOut={e => (e.currentTarget.style.color = 'var(--lp-text-tertiary)')}>Privacy</span>
          <span onClick={() => navigate('/terms')} style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={e => (e.currentTarget.style.color = 'var(--lp-text-primary)')} onMouseOut={e => (e.currentTarget.style.color = 'var(--lp-text-tertiary)')}>Terms</span>
        </div>
      </footer>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 640px) {
          footer { padding: 20px 16px !important; flex-direction: column; align-items: flex-start; }
        }
        @media (max-width: 900px) {
          div[style*="gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr'"] {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
