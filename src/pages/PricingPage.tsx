import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ZieAdsLogo from '../components/ZieAdsLogo';

// ─── Plan Data ────────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Start scanning, no card needed.',
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
    tagline: 'For solo founders running their own ads.',
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
    tagline: 'For teams and freelancers scaling spend.',
    monthlyPrice: 79,
    yearlyPrice: 758,
    yearlyPerMonth: 63,
    color: '#7c3aed',
    gradient: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
    aiChat: { daily: 80, label: '80 AI messages / day' },
    skillRun: { monthly: 160, label: '160 skill runs / month' },
    recommended: true,
    ctaText: 'Get Pro',
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
    tagline: 'For agencies managing multiple clients.',
    monthlyPrice: 199,
    yearlyPrice: 1910,
    yearlyPerMonth: 159,
    color: '#0ea5e9',
    gradient: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
    aiChat: { daily: 300, label: '300 AI messages / day' },
    skillRun: { monthly: -1, label: 'Unlimited skill runs' },
    recommended: false,
    ctaText: 'Get Agency',
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
  { label: 'Audit History in AI', values: ['—', '✓', '✓', '✓'] },
  { label: 'Priority Queue', values: ['—', '—', '✓', '✓'] },
  { label: 'API Access', values: ['—', '—', '10M tokens/mo', 'Unlimited'] },
  { label: 'Team Seats', values: ['1', '1', '1', '5'] },
  { label: 'Client Dashboard', values: ['—', '—', '—', '✓'] },
  { label: 'Monthly Aggregate Reports', values: ['—', '—', '—', '✓'] },
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

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', color: '#0f172a', fontFamily: 'var(--font-sans, "Inter", sans-serif)' }}>

      {/* ── Navbar ───────────────────────────────────── */}
      <header style={{
        padding: '0 40px',
        height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#fff',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <ZieAdsLogo size={24} />
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em' }}>zieads</span>
        </div>
        <nav style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => navigate('/sign-in')} style={{ background: 'transparent', color: '#64748b', border: 'none', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', padding: '8px 14px', borderRadius: 8, fontFamily: 'inherit' }}>
            Sign in
          </button>
          <button onClick={() => navigate('/sign-up')} style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 8, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit' }}>
            Start Free
          </button>
        </nav>
      </header>

      {/* ── Hero ─────────────────────────────────────── */}
      <section style={{ textAlign: 'center', padding: '72px 24px 52px', maxWidth: 700, margin: '0 auto' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 14px', borderRadius: 9999,
          background: '#f0fdf4', border: '1px solid #bbf7d0',
          color: '#15803d', fontSize: '0.78rem', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.06em',
          marginBottom: 24,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          Start free · No credit card required
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, color: '#0f172a', lineHeight: 1.1, margin: '0 0 18px', letterSpacing: '-0.04em' }}>
          Predictable growth,{' '}
          <span style={{ background: 'linear-gradient(135deg, #7c3aed, #0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            simple pricing.
          </span>
        </h1>
        <p style={{ fontSize: '1.05rem', color: '#64748b', maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.65 }}>
          Run audits, fix funnels, and scale ROAS without hiring an agency. Pick the plan that fits your growth stage.
        </p>

        {/* Monthly / Yearly Toggle */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 12,
          background: '#f1f5f9', padding: 4, borderRadius: 12,
        }}>
          <button
            id="toggle-monthly"
            onClick={() => setYearly(false)}
            style={{
              padding: '8px 22px', borderRadius: 9, border: 'none',
              background: !yearly ? '#fff' : 'transparent',
              color: !yearly ? '#0f172a' : '#64748b',
              fontWeight: !yearly ? 700 : 500,
              fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: !yearly ? '0 1px 6px rgba(0,0,0,0.12)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            Monthly
          </button>
          <button
            id="toggle-yearly"
            onClick={() => setYearly(true)}
            style={{
              padding: '8px 22px', borderRadius: 9, border: 'none',
              background: yearly ? '#fff' : 'transparent',
              color: yearly ? '#0f172a' : '#64748b',
              fontWeight: yearly ? 700 : 500,
              fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: yearly ? '0 1px 6px rgba(0,0,0,0.12)' : 'none',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 7,
            }}
          >
            Yearly
            <span style={{
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: '#fff', fontSize: '0.65rem', fontWeight: 800,
              padding: '2px 7px', borderRadius: 6, letterSpacing: '0.04em',
            }}>
              SAVE 20%
            </span>
          </button>
        </div>
      </section>

      {/* ── Plan Cards ─────────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 20,
          alignItems: 'stretch',
        }}>
          {PLANS.map(plan => {
            const price = yearly ? plan.yearlyPerMonth : plan.monthlyPrice;
            const priceLabel = yearly && plan.yearlyPrice > 0 ? `$${plan.yearlyPrice} billed yearly` : '';

            return (
              <div
                key={plan.id}
                id={`plan-card-${plan.id}`}
                style={{
                  position: 'relative',
                  background: '#fff',
                  border: plan.recommended ? `2px solid ${plan.color}` : '1.5px solid #e2e8f0',
                  borderRadius: 20,
                  padding: 28,
                  display: 'flex', flexDirection: 'column',
                  boxShadow: plan.recommended ? `0 8px 40px ${plan.color}25` : '0 2px 12px rgba(0,0,0,0.06)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseOver={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = plan.recommended ? `0 16px 56px ${plan.color}35` : '0 8px 32px rgba(0,0,0,0.12)';
                }}
                onMouseOut={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'none';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = plan.recommended ? `0 8px 40px ${plan.color}25` : '0 2px 12px rgba(0,0,0,0.06)';
                }}
              >
                {/* Most popular badge */}
                {plan.recommended && (
                  <div style={{
                    position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
                    background: `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`,
                    color: '#fff', padding: '4px 18px',
                    borderRadius: 9999, fontSize: '0.7rem', fontWeight: 800,
                    letterSpacing: '0.07em', textTransform: 'uppercase',
                    boxShadow: `0 4px 12px ${plan.color}44`,
                    whiteSpace: 'nowrap',
                  }}>
                    ⭐ Most Popular
                  </div>
                )}

                {/* Plan header */}
                <div style={{
                  padding: '12px 14px', borderRadius: 12,
                  background: plan.gradient, marginBottom: 20,
                }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: plan.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                    {plan.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>
                    {plan.tagline}
                  </div>
                </div>

                {/* Price */}
                <div style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b' }}>$</span>
                    <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 1 }}>
                      {price}
                    </span>
                    {plan.monthlyPrice > 0 && (
                      <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 400 }}>/mo</span>
                    )}
                    {plan.monthlyPrice === 0 && (
                      <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 400 }}>forever</span>
                    )}
                  </div>
                  {priceLabel && (
                    <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600, marginTop: 2 }}>
                      {priceLabel}
                    </div>
                  )}
                </div>

                {/* Credit pills */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '4px 10px', borderRadius: 6,
                    background: `${plan.color}12`, color: plan.color,
                    fontSize: '0.72rem', fontWeight: 700,
                    border: `1px solid ${plan.color}22`,
                  }}>
                    💬 {plan.aiChat.label}
                  </span>
                  <span style={{
                    padding: '4px 10px', borderRadius: 6,
                    background: `${plan.color}12`, color: plan.color,
                    fontSize: '0.72rem', fontWeight: 700,
                    border: `1px solid ${plan.color}22`,
                  }}>
                    ⚡ {plan.skillRun.label}
                  </span>
                </div>

                {/* CTA Button */}
                <button
                  id={`plan-cta-${plan.id}`}
                  onClick={() => navigate(plan.ctaRoute)}
                  style={{
                    width: '100%',
                    padding: '12px 0',
                    borderRadius: 10, border: 'none',
                    background: plan.recommended
                      ? `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`
                      : plan.monthlyPrice === 0 ? '#f1f5f9' : '#0f172a',
                    color: plan.recommended ? '#fff' : plan.monthlyPrice === 0 ? '#475569' : '#fff',
                    fontSize: '0.875rem', fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit',
                    marginBottom: 24,
                    boxShadow: plan.recommended ? `0 4px 14px ${plan.color}44` : 'none',
                    transition: 'opacity 0.2s',
                  }}
                  onMouseOver={e => (e.currentTarget.style.opacity = '0.88')}
                  onMouseOut={e => (e.currentTarget.style.opacity = '1')}
                >
                  {plan.ctaText} →
                </button>

                {/* Divider */}
                <div style={{ height: 1, background: '#f1f5f9', marginBottom: 20 }} />

                {/* Feature list */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
                    What's included
                  </div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {plan.features.map((f, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.82rem', color: f.included ? '#334155' : '#cbd5e1' }}>
                        {f.included ? <CheckIcon color={plan.color} /> : <XIcon />}
                        {f.label}
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
      <section style={{ maxWidth: 1100, margin: '0 auto 100px', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <button
            id="toggle-comparison-table"
            onClick={() => setShowTable(!showTable)}
            style={{
              background: 'transparent', border: '1.5px solid #e2e8f0',
              color: '#475569', fontSize: '0.875rem', fontWeight: 600,
              padding: '10px 24px', borderRadius: 10, cursor: 'pointer',
              fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 8,
              transition: 'all 0.2s',
            }}
            onMouseOver={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.color = '#7c3aed'; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569'; }}
          >
            {showTable ? '↑ Hide' : '↓ View'} full feature comparison
          </button>
        </div>

        {showTable && (
          <div style={{
            background: '#fff', borderRadius: 20, border: '1.5px solid #e2e8f0',
            overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
          }}>
            {/* Table header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
              background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0',
              padding: '16px 24px',
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Feature</div>
              {PLANS.map(p => (
                <div key={p.id} style={{ textAlign: 'center', fontSize: '0.82rem', fontWeight: 800, color: p.color }}>
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
                  background: i % 2 === 0 ? '#fff' : '#fafafa',
                  borderBottom: i < COMPARISON_ROWS.length - 1 ? '1px solid #f1f5f9' : 'none',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 500 }}>{row.label}</div>
                {row.values.map((val, j) => (
                  <div key={j} style={{
                    textAlign: 'center', fontSize: '0.82rem',
                    color: val === '—' ? '#cbd5e1' : val === '✓' ? PLANS[j].color : '#334155',
                    fontWeight: val === '✓' ? 700 : 400,
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
      <section style={{ maxWidth: 640, margin: '0 auto 100px', padding: '0 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: 12, letterSpacing: '-0.03em' }}>
          Still have questions?
        </h2>
        <p style={{ fontSize: '0.95rem', color: '#64748b', marginBottom: 28, lineHeight: 1.6 }}>
          Email us at <a href="mailto:founder@zieads.com" style={{ color: '#7c3aed', fontWeight: 600, textDecoration: 'none' }}>founder@zieads.com</a> and we'll reply within a few hours.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/sign-up')} style={{
            padding: '13px 32px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
            color: '#fff', fontSize: '0.9rem', fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
          }}>
            Start for free
          </button>
          <button onClick={() => navigate('/')} style={{
            padding: '13px 32px', borderRadius: 10,
            border: '1.5px solid #e2e8f0', background: 'transparent',
            color: '#475569', fontSize: '0.9rem', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            See how it works
          </button>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid #e2e8f0', padding: '24px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: '0.8rem', color: '#94a3b8', flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ZieAdsLogo size={16} />
          <span style={{ fontWeight: 700, color: '#64748b' }}>zieads</span>
          <span>© 2026 ZieAds. All rights reserved.</span>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <span onClick={() => navigate('/privacy-policy')} style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={e => (e.currentTarget.style.color = '#0f172a')} onMouseOut={e => (e.currentTarget.style.color = '#94a3b8')}>Privacy</span>
          <span onClick={() => navigate('/terms')} style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={e => (e.currentTarget.style.color = '#0f172a')} onMouseOut={e => (e.currentTarget.style.color = '#94a3b8')}>Terms</span>
        </div>
      </footer>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 640px) {
          header { padding: 0 16px !important; }
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
