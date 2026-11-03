/*
  Pricing page in the v4 landing design (LxNav, LxFooter, lx.css).
  Plans and limits follow implementasi-update.md section 11 and server/creditConfig.ts PLAN_LIMITS.
  Checkout logic is unchanged: signed out visitors go to sign up with the plan, signed in users
  get a checkout session from /api/v1/credits/checkout, and ?plan=<id> resumes checkout after sign up.
*/
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, CheckCircle2, Minus } from 'lucide-react';
import './landing/lx/lx.css';
import LxNav from './landing/lx/LxNav';
import LxFooter from './landing/lx/LxFooter';
import { LxBadge, LxButton, LxReveal, goToId } from './landing/lx/kit';
import { LxFaq } from './landing/lx/Sections';
import { pricingPlans } from './landing/data';
import { useCreditStore } from '../lib/creditStore';
import { supabase } from '../lib/supabaseClient';

type PaidId = 'starter' | 'pro' | 'agency';

/* Monthly price, and the per month price when billed yearly (20% off) */
const PRICES: Record<string, { monthly: number; yearlyPerMonth: number; yearlyTotal: number }> = {
  free: { monthly: 0, yearlyPerMonth: 0, yearlyTotal: 0 },
  starter: { monthly: 29, yearlyPerMonth: 23, yearlyTotal: 278 },
  pro: { monthly: 79, yearlyPerMonth: 63, yearlyTotal: 758 },
  agency: { monthly: 199, yearlyPerMonth: 159, yearlyTotal: 1910 },
};

/* Full comparison, one row per limit in PLAN_LIMITS. true is a check, false is a dash. */
type Cell = string | boolean;
const GROUPS: { title: string; rows: { label: string; values: [Cell, Cell, Cell, Cell] }[] }[] = [
  {
    title: 'Workspace',
    rows: [
      { label: 'Brands', values: ['1', '1', '3', '10, then $15 each'] },
      { label: 'Team seats', values: ['1', '1', '3', '10 with roles'] },
      { label: 'Client portal', values: [false, false, true, true] },
    ],
  },
  {
    title: 'AI Analyst and AI Agent',
    rows: [
      { label: 'Morning briefing', values: ['Weekly', 'Daily', 'Daily', 'Daily'] },
      { label: 'Social Analyst modes', values: ['2 modes', 'All modes', 'All modes', 'All modes'] },
      { label: 'Ads Analyst (read only)', values: [false, 'Basic report', 'Every mode', 'Every mode'] },
      { label: 'Scheduled agents', values: [false, '3', '20', 'Unlimited'] },
      { label: 'Guardian checks', values: [true, true, true, true] },
    ],
  },
  {
    title: 'Publish and engage',
    rows: [
      { label: 'Scheduled posts', values: ['20 a month', 'Unlimited', 'Unlimited', 'Unlimited'] },
      { label: 'Inbox', values: ['Instagram and Facebook', 'All connected channels', 'All channels and DMs', 'All channels and DMs'] },
      { label: 'AI reply drafts', values: [true, true, true, true] },
      { label: 'Saved replies', values: [false, false, true, true] },
      { label: 'Assign conversations', values: [false, false, false, true] },
    ],
  },
  {
    title: 'Analyze and report',
    rows: [
      { label: 'Analytics history', values: ['30 days', '12 months', 'Unlimited', 'Unlimited'] },
      { label: 'Competitors per brand', values: ['3', '10', '50', '100'] },
      { label: 'Scheduled PDF reports', values: [false, 'ZieAds branded', 'White label', 'White label, agency brand'] },
      { label: 'MCP calls a day', values: ['50', '1,000', '5,000', '20,000'] },
    ],
  },
];

function CellView({ v }: { v: Cell }) {
  if (v === true) return <Check size={15} aria-label="Included" />;
  if (v === false) return <Minus size={15} className="pr-dash" aria-label="Not included" />;
  return <>{v}</>;
}

export default function PricingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { plan_id: currentPlanId } = useCreditStore();
  const [session, setSession] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [yearly, setYearly] = useState(false);
  const [checkoutLoadingPlan, setCheckoutLoadingPlan] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const focusPlan = new URLSearchParams(location.search).get('plan');

  useEffect(() => {
    document.title = 'Pricing | ZieAds';
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSessionLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  const handleCheckout = async (planId: string, isYearly: boolean) => {
    if (!session) {
      navigate(`/sign-up?plan=${planId}&yearly=${isYearly}`);
      return;
    }
    setCheckoutLoadingPlan(planId);
    setErrorMessage(null);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_BASE}/api/v1/credits/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ planId, billingCycle: isYearly ? 'yearly' : 'monthly' }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Could not start checkout');
      }
      const { checkout_url } = await res.json();
      if (!checkout_url) throw new Error('No checkout link came back from the server.');
      window.location.href = checkout_url;
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
      setCheckoutLoadingPlan(null);
    }
  };

  // Resume checkout after sign up (?plan=pro&yearly=true)
  useEffect(() => {
    if (sessionLoading) return;
    const q = new URLSearchParams(location.search);
    const target = q.get('plan');
    const targetYearly = q.get('yearly') === 'true';
    if (session && (target === 'starter' || target === 'pro' || target === 'agency')) {
      if (currentPlanId === target) {
        navigate('/pricing', { replace: true });
        return;
      }
      setYearly(targetYearly);
      handleCheckout(target, targetYearly);
    }
  }, [session, sessionLoading, currentPlanId]);

  const cta = (id: string, fallback: string) => {
    if (session && currentPlanId === id) return { label: 'Current plan', disabled: true };
    if (id === 'free') return { label: session ? 'Open dashboard' : fallback, disabled: false };
    if (checkoutLoadingPlan === id) return { label: 'Opening checkout...', disabled: true };
    return { label: fallback, disabled: !!checkoutLoadingPlan };
  };

  return (
    <div className="lx">
      <LxNav />

      <main>
        <section className="pr-hero lx-center" aria-labelledby="pr-title">
          <div className="lx-wrap">
            <LxReveal>
              <LxBadge n="01">Pricing</LxBadge>
              <h1 className="lx-h2" id="pr-title">
                Start free.
                <span>Scale when you're ready.</span>
              </h1>
              <p className="lx-lead">Priced per brand, cancel anytime. Every plan includes the AI Agent, Guardian and the MCP server.</p>
              <div className="pr-cycle" role="radiogroup" aria-label="Billing cycle">
                <button type="button" role="radio" aria-checked={!yearly} className={!yearly ? 'is-on' : ''} onClick={() => setYearly(false)}>
                  Monthly
                </button>
                <button type="button" role="radio" aria-checked={yearly} className={yearly ? 'is-on' : ''} onClick={() => setYearly(true)}>
                  Yearly <em>Save 20%</em>
                </button>
              </div>
            </LxReveal>

            {errorMessage && (
              <div className="pr-error" role="alert">
                {errorMessage}
              </div>
            )}

            <div className="lx-prices">
              {pricingPlans.map((p, i) => {
                const price = PRICES[p.id];
                const amount = yearly ? price.yearlyPerMonth : price.monthly;
                const b = cta(p.id, p.cta);
                const focused = focusPlan === p.id;
                return (
                  <LxReveal key={p.id} delay={i * 70} className={`lx-price ${p.highlight ? 'is-hl' : ''} ${focused ? 'is-focus' : ''}`}>
                    <div className="lx-price-top">
                      <div className="lx-price-name">
                        {p.tier}
                        {p.highlight && <span className="lx-price-tag">Most popular</span>}
                      </div>
                      <p className="lx-price-desc">{p.tagline}</p>
                      <div className="lx-price-amt">
                        <strong>${amount}</strong>
                        <span>{p.id === 'free' ? 'forever' : 'per month'}</span>
                      </div>
                      <p className="pr-billed">{p.id === 'free' ? 'No credit card' : yearly ? `$${price.yearlyTotal} billed yearly` : 'Billed monthly'}</p>
                      <LxButton
                        variant={p.highlight ? 'orange' : 'white'}
                        block
                        disabled={b.disabled}
                        onClick={() => (p.id === 'free' ? navigate(session ? '/analyst' : '/sign-up') : handleCheckout(p.id as PaidId, yearly))}
                      >
                        {b.label}
                      </LxButton>
                    </div>
                    <div className="lx-price-feats">
                      <small>What you get</small>
                      <ul>
                        {p.features.map((f) => (
                          <li key={f}>
                            <CheckCircle2 size={14} /> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </LxReveal>
                );
              })}
            </div>
            <p className="lx-price-foot">
              Need more than 10 brands? Agency adds brands at $15 each.{' '}
              <button type="button" className="pr-link" onClick={() => goToId('compare-plans')}>
                Compare every plan
              </button>
            </p>
          </div>
        </section>

        <section className="lx-section is-soft" id="compare-plans" aria-labelledby="pr-cmp">
          <div className="lx-wrap">
            <LxReveal>
              <div className="lx-center">
                <LxBadge n="02">Compare plans</LxBadge>
                <h2 className="lx-h2" id="pr-cmp">
                  Every limit,
                  <span>side by side.</span>
                </h2>
              </div>
            </LxReveal>
            <LxReveal delay={100}>
              <div className="lx-cmp-wrap">
                <table className="lx-cmp pr-cmp">
                  <thead>
                    <tr>
                      <th scope="col">
                        <span className="lx-sr">Feature</span>
                      </th>
                      {pricingPlans.map((p) => (
                        <th key={p.id} scope="col" className={p.highlight ? 'is-us' : ''}>
                          {p.tier}
                          <small>${yearly ? PRICES[p.id].yearlyPerMonth : PRICES[p.id].monthly} / month</small>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  {GROUPS.map((g) => (
                    <tbody key={g.title}>
                      <tr className="pr-group">
                        <th scope="colgroup" colSpan={5}>
                          {g.title}
                        </th>
                      </tr>
                      {g.rows.map((r) => (
                        <tr key={r.label}>
                          <th scope="row">{r.label}</th>
                          {r.values.map((v, i) => (
                            <td key={i} className={pricingPlans[i]?.highlight ? 'is-us' : ''}>
                              <CellView v={v} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  ))}
                </table>
              </div>
              <p className="lx-cmp-note">Ads data is read only. Anything Zie drafts waits for your approval on every plan.</p>
            </LxReveal>
          </div>
        </section>

        <LxFaq n="03" />

        <section className="lx-section" style={{ paddingTop: 0 }} aria-labelledby="pr-cta">
          <div className="lx-wrap">
            <LxReveal>
              <div className="pr-cta lx-center">
                <h2 id="pr-cta">Still have questions?</h2>
                <p>
                  Email <a href="mailto:founder@zieads.com">founder@zieads.com</a> and we reply within a few hours.
                </p>
                <div className="lx-cta-btns" style={{ justifyContent: 'center' }}>
                  <LxButton variant="dark" onClick={() => navigate(session ? '/analyst' : '/sign-up')}>
                    {session ? 'Open dashboard' : 'Start for free'}
                  </LxButton>
                  <LxButton variant="white" onClick={() => navigate('/#how')}>
                    See how it works
                  </LxButton>
                </div>
              </div>
            </LxReveal>
          </div>
        </section>
      </main>

      <LxFooter />

      <style>{`
        .pr-hero { padding: 132px 0 96px; background: linear-gradient(180deg, #fff 0%, #fff 40%, #fff6f0 100%); }
        .pr-hero .lx-h2 { margin-top: 18px; }
        .pr-cycle { display: inline-flex; gap: 4px; margin-top: 26px; padding: 4px; border-radius: 10px; background: var(--lx-soft); border: 1px solid var(--lx-line); }
        .pr-cycle button { border: none; background: transparent; padding: 7px 14px; border-radius: 7px; font-size: 13px; color: var(--lx-muted); cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: background 0.2s, color 0.2s; }
        .pr-cycle button.is-on { background: #fff; color: var(--lx-ink); font-weight: 600; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06); }
        .pr-cycle em { font-style: normal; font-size: 11px; font-weight: 600; color: var(--lx-orange); }
        .pr-error { max-width: 560px; margin: 24px auto 0; padding: 10px 14px; border: 1px solid var(--lx-line); border-radius: 10px; background: #fff; font-size: 13px; color: var(--lx-ink); }
        .pr-billed { margin: -8px 0 14px; font-size: 12px; color: var(--lx-faint); }
        .lx-price.is-focus .lx-price-top { border-color: var(--lx-ink); }
        .pr-link { border: none; background: none; padding: 0; font: inherit; color: inherit; text-decoration: underline; cursor: pointer; }
        .pr-cmp thead th small { display: block; margin-top: 2px; font-size: 11.5px; font-weight: 500; color: var(--lx-faint); }
        .pr-cmp td svg { color: var(--lx-ink); vertical-align: -2px; }
        .pr-cmp td .pr-dash { color: #c8c8c8; }
        .pr-cmp .pr-group th { padding-top: 18px; font-size: 11.5px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--lx-faint); background: #fff; }
        .pr-cta { padding: 56px 24px; border: 1px solid var(--lx-line); border-radius: var(--lx-radius); background: #fff; }
        .pr-cta h2 { margin: 0; font-size: clamp(24px, 3vw, 32px); letter-spacing: -0.03em; font-weight: 640; }
        .pr-cta p { margin: 10px 0 22px; font-size: 15px; color: var(--lx-muted); }
        .pr-cta a { color: var(--lx-ink); text-decoration: underline; }
        @media (max-width: 760px) { .pr-hero { padding: 108px 0 64px; } }
      `}</style>
    </div>
  );
}
