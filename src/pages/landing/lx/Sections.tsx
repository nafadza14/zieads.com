/*
  v4 landing page sections. Order: hero, works with, why, product, how it works,
  Guardian band, promises, integrations and MCP, comparison, pricing, free audit, FAQ, final CTA.
  Copy follows implementasi-update.md section 12: an AI social media manager that briefs
  every morning and executes after approval. No invented customers, logos, reviews or usage numbers.
*/
import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  BotMessageSquare,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Link2,
  MessageSquareText,
  Newspaper,
  Plus,
  Radar,
} from 'lucide-react';
import SocialIcon from '../../../components/v3/SocialIcon';
import ZieAdsLogo from '../../../components/ZieAdsLogo';
import ZieAvatar from '../../../components/ZieAvatar';
import { SHOTS } from '../images';
import { faqItems, pricingPlans } from '../data';
import { COMPARE_COLUMNS, COMPARE_ROWS } from '../compare';
import { LxBadge, LxButton, LxCount, LxReveal, goToId } from './kit';

const PLATFORMS = ['instagram', 'facebook', 'tiktok', 'linkedin'] as const;

/* ── Hero ─────────────────────────────────────────────── */
export function LxHero() {
  const navigate = useNavigate();
  return (
    <section className="lx-hero" aria-labelledby="lx-hero-title">
      <div className="lx-wrap">
        <LxReveal>
          <span className="lx-hero-pill">
            <span className="lx-hero-stack" aria-hidden="true">
              {PLATFORMS.map((p) => (
                <span key={p}>
                  <SocialIcon platform={p} size={20} />
                </span>
              ))}
            </span>
            AI social media manager for Instagram, Facebook, TikTok and LinkedIn
          </span>
          <h1 id="lx-hero-title">
            Your AI social media manager that <em>briefs you every morning</em>
          </h1>
          <p className="lx-hero-sub">
            Scheduling, inbox, analytics and competitors in one place. Zie tells you what to do next, prepares the work, and executes when you approve.
          </p>
          <div className="lx-hero-ctas">
            <LxButton variant="dark" onClick={() => navigate('/sign-up')}>
              Start for free
            </LxButton>
            <LxButton variant="white" onClick={() => goToId('how')}>
              See how it works
            </LxButton>
          </div>
          <p className="lx-hero-note">Free plan for one brand. No credit card.</p>
        </LxReveal>
      </div>
      <div className="lx-hero-shot">
        <div className="lx-frame">
          <div className="lx-frame-bar" aria-hidden="true">
            <i />
            <i />
            <i />
            <span>app.zieads.com/analyst</span>
          </div>
          <img src={SHOTS.home} alt="ZieAds AI Analyst with today's briefing, what needs you, wins, concerns and three actions to approve" width={1600} height={1000} fetchPriority="high" />
        </div>
      </div>
    </section>
  );
}

/* ── Works with ───────────────────────────────────────── */
export function LxStrip() {
  const items: Array<{ p: string; label: string }> = [
    { p: 'instagram', label: 'Instagram' },
    { p: 'facebook', label: 'Facebook' },
    { p: 'tiktok', label: 'TikTok' },
    { p: 'linkedin', label: 'LinkedIn' },
    { p: 'meta', label: 'Meta Ads' },
    { p: 'google_ads', label: 'Google Ads' },
  ];
  return (
    <div className="lx-strip">
      <div className="lx-wrap lx-strip-in">
        <span className="lx-strip-label">Works with the platforms you already use</span>
        <div className="lx-strip-logos">
          {items.map((i) => (
            <span key={i.p} className="lx-strip-logo">
              <SocialIcon platform={i.p} size={20} variant="mark" />
              {i.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Why ──────────────────────────────────────────────── */
export function LxWhy() {
  return (
    <section className="lx-section lx-why lx-center" aria-labelledby="lx-why">
      <div className="lx-wrap">
        <LxReveal>
          <LxBadge n="01">Why ZieAds</LxBadge>
          <p className="lx-why-text" id="lx-why">
            ZieAds
            <span className="lx-why-logo" aria-hidden="true">
              <ZieAdsLogo size={30} />
            </span>
            watches your Instagram, Facebook, TikTok and LinkedIn around the clock,{' '}
            <span className="is-muted">sorts every comment, plans your posts, and tells you each morning the three things worth doing today.</span>
          </p>
        </LxReveal>
        <LxReveal delay={120}>
          <div className="lx-stats">
            <div className="lx-stat">
              <strong>
                <LxCount to={60} suffix=" sec" />
              </strong>
              <span>to your first briefing after you connect</span>
            </div>
            <div className="lx-stat">
              <strong>
                <LxCount to={3} suffix=" actions" />
              </strong>
              <span>in every briefing, each with its evidence</span>
            </div>
            <div className="lx-stat">
              <strong>0</strong>
              <span>posts or replies sent without your approval</span>
            </div>
          </div>
        </LxReveal>
      </div>
    </section>
  );
}

/* ── Product ──────────────────────────────────────────── */
const FEATURES = [
  { icon: <Newspaper size={17} />, title: 'Answer first briefing', body: 'Every morning: what changed, what needs you, and three actions you can approve in one tap.' },
  { icon: <MessageSquareText size={17} />, title: 'An inbox that sells', body: 'Instagram and Facebook comments in one queue. Buying questions and complaints go to the top, with reply drafts in your voice.' },
  { icon: <CalendarCheck size={17} />, title: 'Publishing that checks itself', body: 'Write once, tailor per network, schedule or queue. Guardian retries failures and confirms every post went live.' },
  { icon: <BarChart3 size={17} />, title: 'Organic and paid, side by side', body: 'Followers, reach and post results per network, with your Meta, Google and TikTok ads results next to them.' },
  { icon: <Radar size={17} />, title: 'Competitor Hunt', body: 'Public ads from the Meta, TikTok and LinkedIn ad libraries and public Instagram and Facebook posts, in their real format.' },
  { icon: <BotMessageSquare size={17} />, title: 'AI Agent with analyst modes', body: 'Ask in plain words. Social and Ads Analyst modes turn your data into a plan, and drafts land on your calendar.' },
];

export function LxFeatures() {
  return (
    <section className="lx-section is-soft" id="features" aria-labelledby="lx-feat">
      <div className="lx-wrap">
        <LxReveal>
          <LxBadge n="02">Product</LxBadge>
          <h2 className="lx-h2" id="lx-feat">
            Built for founders who post.
            <span>Ready for agencies who manage many brands.</span>
          </h2>
        </LxReveal>
        <div className="lx-feat-cols">
          {FEATURES.map((f, i) => (
            <LxReveal key={f.title} delay={(i % 3) * 80}>
              <div className="lx-feat">
                <span className="lx-feat-ic" aria-hidden="true">
                  {f.icon}
                </span>
                <div>
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                </div>
              </div>
            </LxReveal>
          ))}
        </div>
        <LxReveal delay={80}>
          <div className="lx-feat-cards">
            <div className="lx-card lx-shot-card">
              <h4>AI Analyst</h4>
              <p>One read of your morning: wins, concerns, what needs you and the actions behind the numbers.</p>
              <div className="lx-shot">
                <img src={SHOTS.analyst} alt="AI Analyst screen with the morning briefing" loading="lazy" width={1600} height={1000} />
              </div>
            </div>
            <div className="lx-card lx-shot-card">
              <h4>Inbox</h4>
              <p>Needs reply, buying signals, complaints. Draft, hide or delete without leaving ZieAds.</p>
              <div className="lx-shot">
                <img src={SHOTS.inbox} alt="Inbox with buying signals sorted first and an AI reply draft" loading="lazy" width={1600} height={1000} />
              </div>
            </div>
          </div>
          <div className="lx-feat-cards is-flip">
            <div className="lx-card lx-shot-card">
              <h4>Calendar</h4>
              <p>Month and week views, drag to reschedule, and your best times from your own posts.</p>
              <div className="lx-shot">
                <img src={SHOTS.calendar} alt="Calendar week view with scheduled, published and drafted posts" loading="lazy" width={1600} height={1000} />
              </div>
            </div>
            <div className="lx-card lx-shot-card">
              <h4>Analytics</h4>
              <p>Organic, Paid and Combined tabs, per network and per post, with CSV export.</p>
              <div className="lx-shot">
                <img src={SHOTS.analytics} alt="Analytics with organic results per network and daily charts" loading="lazy" width={1600} height={1000} />
              </div>
            </div>
          </div>
        </LxReveal>
      </div>
    </section>
  );
}

/* ── How it works ─────────────────────────────────────── */
export function LxHow() {
  const steps = [
    { icon: <Link2 size={18} />, title: 'Connect your accounts', body: 'Instagram and Facebook in one click through Meta, then TikTok and LinkedIn. Official APIs only.' },
    { icon: <Newspaper size={18} />, title: 'Read your first briefing', body: 'Zie reads your recent posts and comments and writes your first briefing in about a minute.' },
    { icon: <CheckCircle2 size={18} />, title: 'Approve, Zie executes', body: 'Approve a post, a reply or a plan. Zie publishes, checks it went live, and logs every step.' },
  ];
  return (
    <section className="lx-section lx-center" id="how" aria-labelledby="lx-how">
      <div className="lx-wrap">
        <LxReveal>
          <LxBadge n="03">How it works</LxBadge>
          <h2 className="lx-h2" id="lx-how">
            Set up in five minutes.
            <span>Then Zie does the legwork.</span>
          </h2>
        </LxReveal>
        <div className="lx-steps">
          {steps.map((s, i) => (
            <LxReveal key={s.title} delay={i * 100}>
              <div className="lx-step">
                <span className="lx-step-n">0{i + 1}</span>
                <span className="lx-step-ic" aria-hidden="true">
                  {s.icon}
                </span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            </LxReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Guardian band ────────────────────────────────────── */
export function LxImpact() {
  return (
    <section className="lx-section" style={{ paddingTop: 0 }} aria-labelledby="lx-impact">
      <div className="lx-wrap" style={{ maxWidth: 1240 }}>
        <div className="lx-impact">
          <LxReveal>
            <LxBadge n="04">Guardian</LxBadge>
            <h2 id="lx-impact">
              Zie watches your accounts.
              <span>So you can stop refreshing them.</span>
            </h2>
          </LxReveal>
          <div className="lx-impact-nums">
            <div className="lx-impact-num">
              <strong>
                <LxCount to={24} suffix="/7" />
              </strong>
              <span>Tokens, failed posts and unanswered comments, checked around the clock</span>
            </div>
            <div className="lx-impact-num">
              <strong>
                <LxCount to={4} suffix=" in 1" />
              </strong>
              <span>Instagram, Facebook, TikTok and LinkedIn in one calendar and one dashboard</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Promises (in the testimonial slot until real customer stories exist) ── */
const PROMISES = [
  { lead: 'Nothing goes live until you say yes.', rest: 'Every post, reply and plan waits for your approval, and every action is written to your activity log.' },
  { lead: 'I read your numbers, not the internet.', rest: 'Each action in your briefing links to the post or metric behind it, so you can check my work.' },
  { lead: 'Official APIs only.', rest: 'No password sharing and no scraping of your accounts. Disconnect a platform or delete your data whenever you like.' },
  { lead: 'Your ad budget stays yours.', rest: 'I read Meta, Google and TikTok results with read-only access or your CSV import, and never touch a campaign.' },
];

export function LxPromises() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = PROMISES.length;
  // Advances slowly on its own, stops while the visitor hovers or focuses the carousel
  useEffect(() => {
    if (paused || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const t = window.setInterval(() => setI((x) => (x + 1) % n), 7000);
    return () => window.clearInterval(t);
  }, [paused, n]);
  const p = PROMISES[i];
  return (
    <section className="lx-section lx-center" aria-roledescription="carousel" aria-label="What Zie promises" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div className="lx-wrap">
        <div className="lx-quote">
          <ZieAvatar size={48} ring={false} />
          <div className="lx-quote-row">
            <button type="button" className="lx-round" aria-label="Previous promise" onClick={() => setI((x) => (x - 1 + n) % n)}>
              <ChevronLeft size={16} />
            </button>
            <div className="lx-quote-text" aria-live="polite">
              <blockquote key={i}>
                "{p.lead} <span className="is-muted">{p.rest}</span>"
              </blockquote>
            </div>
            <button type="button" className="lx-round" aria-label="Next promise" onClick={() => setI((x) => (x + 1) % n)}>
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="lx-quote-who">
            <strong>Zie</strong>
            <span>Your AI analyst inside ZieAds</span>
          </div>
          <div className="lx-dots" role="tablist" aria-label="Choose a promise">
            {PROMISES.map((_, k) => (
              <button key={k} type="button" role="tab" aria-selected={k === i} aria-label={`Promise ${k + 1}`} className={k === i ? 'is-on' : ''} onClick={() => setI(k)} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Integrations and MCP ─────────────────────────────── */
const TILES: Array<{ key: string; x: string; y: string; d: number; text?: string }> = [
  { key: 'instagram', x: '22%', y: '20%', d: 0 },
  { key: 'facebook', x: '66%', y: '14%', d: 0.8 },
  { key: 'tiktok', x: '80%', y: '48%', d: 1.6 },
  { key: 'linkedin', x: '12%', y: '58%', d: 2.4 },
  { key: 'meta', x: '34%', y: '78%', d: 1.2 },
  { key: 'google_ads', x: '64%', y: '76%', d: 2 },
  { key: 'mcp', x: '44%', y: '10%', d: 2.8, text: 'MCP' },
  { key: 'csv', x: '88%', y: '20%', d: 0.4, text: 'CSV' },
];

export function LxIntegrations() {
  return (
    <section className="lx-section is-soft" id="integrations" aria-labelledby="lx-int">
      <div className="lx-wrap lx-int">
        <LxReveal>
          <LxBadge n="05">Integrations</LxBadge>
          <h2 className="lx-h2" id="lx-int">
            Keep your tools.
            <span>Connect the workflow.</span>
          </h2>
          <p className="lx-lead">Official connections to the networks you post on, your ads results, and an MCP server so your AI assistant can work with ZieAds too.</p>
          <ul className="lx-int-list">
            <li>
              <Check size={15} /> Instagram and Facebook Pages through Meta login, TikTok and LinkedIn publishing
            </li>
            <li>
              <Check size={15} /> Meta, Google and TikTok Ads results by CSV import while read-only API access is reviewed
            </li>
            <li>
              <Check size={15} /> MCP server for Claude, ChatGPT and Cursor. Writes become approvals in ZieAds
            </li>
          </ul>
        </LxReveal>
        <LxReveal delay={120}>
          <div className="lx-grid" role="img" aria-label="ZieAds in the middle of Instagram, Facebook, TikTok, LinkedIn, Meta Ads, Google Ads, MCP and CSV import">
            <span className="lx-tile is-zie" style={{ left: 'calc(50% - 36px)', top: 'calc(50% - 36px)' }}>
              <ZieAdsLogo size={44} />
            </span>
            {TILES.map((t) => (
              <span key={t.key} className={`lx-tile ${t.text ? 'is-text' : ''}`} style={{ left: `calc(${t.x} - 28px)`, top: `calc(${t.y} - 28px)`, animationDelay: `${t.d}s` }}>
                {t.text ? t.text : <SocialIcon platform={t.key} size={30} />}
              </span>
            ))}
          </div>
        </LxReveal>
      </div>
    </section>
  );
}

/* ── Comparison ───────────────────────────────────────── */
export function LxCompare() {
  return (
    <section className="lx-section" id="compare" aria-labelledby="lx-cmp">
      <div className="lx-wrap">
        <LxReveal>
          <div className="lx-center">
            <LxBadge n="06">Compare</LxBadge>
            <h2 className="lx-h2" id="lx-cmp">
              More than a scheduler.
              <span>Less than an agency bill.</span>
            </h2>
          </div>
        </LxReveal>
        <LxReveal delay={100}>
          <div className="lx-cmp-wrap">
            <table className="lx-cmp">
              <thead>
                <tr>
                  <th scope="col">
                    <span className="lx-sr">What you get</span>
                  </th>
                  {COMPARE_COLUMNS.map((c) => (
                    <th key={c.key} scope="col" className={c.key === 'zieads' ? 'is-us' : ''}>
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((r) => (
                  <tr key={r.criteria}>
                    <th scope="row">{r.criteria}</th>
                    {COMPARE_COLUMNS.map((c) => (
                      <td key={c.key} className={c.key === 'zieads' ? 'is-us' : ''}>
                        {r.values[c.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="lx-cmp-note">From each product's public pages, checked November 2026. Prices change, so check before you buy.</p>
        </LxReveal>
      </div>
    </section>
  );
}

/* ── Pricing ──────────────────────────────────────────── */
export function LxPricing() {
  const navigate = useNavigate();
  return (
    <section className="lx-section is-soft lx-center" id="pricing" aria-labelledby="lx-price">
      <div className="lx-wrap">
        <LxReveal>
          <LxBadge n="07">Pricing</LxBadge>
          <h2 className="lx-h2" id="lx-price">
            Start free.
            <span>Scale when you're ready.</span>
          </h2>
          <p className="lx-lead">Priced per brand, billed monthly, cancel anytime. Every plan includes the AI Agent, Guardian and the MCP server.</p>
        </LxReveal>
        <div className="lx-prices">
          {pricingPlans.map((p, i) => (
            <LxReveal key={p.id} delay={i * 70} className={`lx-price ${p.highlight ? 'is-hl' : ''}`}>
              <div className="lx-price-top">
                <div className="lx-price-name">
                  {p.tier}
                  {p.highlight && <span className="lx-price-tag">Most popular</span>}
                </div>
                <p className="lx-price-desc">{p.tagline}</p>
                <div className="lx-price-amt">
                  <strong>{p.price}</strong>
                  <span>{p.period === 'forever' ? 'forever' : 'per month'}</span>
                </div>
                <LxButton variant={p.highlight ? 'orange' : 'white'} block onClick={() => navigate(p.id === 'free' ? '/sign-up' : `/pricing?plan=${p.id}`)}>
                  {p.cta}
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
          ))}
        </div>
        <p className="lx-price-foot">
          Need more than 10 brands? Agency adds brands at $15 each. <a href="/pricing" style={{ textDecoration: 'underline' }}>Compare every plan</a>
        </p>
      </div>
    </section>
  );
}

/* ── Free website audit (secondary lead magnet, spec 7.12) ── */
export function LxAudit({ onScanComplete }: { onScanComplete: (data: any) => void }) {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    const target = /^https?:\/\//.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
    setBusy(true);
    setErr('');
    try {
      const resp = await fetch('/api/quick-scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: target }) });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok || !json.data) throw new Error(json.error || 'The scan did not finish. Check the address and try again.');
      onScanComplete(json.data);
      navigate('/scan-result');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="lx-section" id="audit" aria-labelledby="lx-audit">
      <div className="lx-wrap">
        <LxReveal>
          <div className="lx-audit">
            <div>
              <LxBadge n="08">Free website audit</LxBadge>
              <h2 className="lx-h2" id="lx-audit">
                Not ready to connect?
                <span>Audit your website first.</span>
              </h2>
              <p className="lx-lead">Zie reads your site and scores how ready it is for ads and social traffic, with the gaps to fix first.</p>
            </div>
            <div>
              <form onSubmit={submit}>
                <label className="lx-sr" htmlFor="lx-audit-url">
                  Website address
                </label>
                <input id="lx-audit-url" className="lx-input" inputMode="url" placeholder="yourbrand.com" value={url} onChange={(e) => setUrl(e.target.value)} />
                <LxButton type="submit" variant="dark" disabled={busy}>
                  {busy ? 'Scanning...' : 'Run free audit'}
                </LxButton>
              </form>
              {err && (
                <p className="lx-err" role="alert">
                  {err}
                </p>
              )}
              <ul className="lx-audit-points">
                <li>
                  <Check size={13} /> About 3 minutes
                </li>
                <li>
                  <Check size={13} /> No sign up needed
                </li>
                <li>
                  <Check size={13} /> Score, gaps and fixes
                </li>
              </ul>
            </div>
          </div>
        </LxReveal>
      </div>
    </section>
  );
}

/* ── FAQ ──────────────────────────────────────────────── */
export function LxFaq() {
  const [open, setOpen] = useState(0);
  return (
    <section className="lx-section lx-center" id="faq" aria-labelledby="lx-faq">
      <div className="lx-wrap">
        <LxReveal>
          <LxBadge n="09">FAQ</LxBadge>
          <h2 className="lx-h2" id="lx-faq">
            Frequently asked questions
          </h2>
          <p className="lx-lead">What ZieAds does, what it never does without you, and how your data is kept safe.</p>
        </LxReveal>
        <div className="lx-faq">
          {faqItems.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className={`lx-faq-item ${isOpen ? 'is-open' : ''}`}>
                <button type="button" className="lx-faq-q" aria-expanded={isOpen} aria-controls={`lx-faq-${i}`} id={`lx-faq-q-${i}`} onClick={() => setOpen(isOpen ? -1 : i)}>
                  {f.q}
                  <Plus size={18} aria-hidden="true" />
                </button>
                <div className="lx-faq-a" id={`lx-faq-${i}`} role="region" aria-labelledby={`lx-faq-q-${i}`}>
                  <div>
                    <p>{f.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── Final CTA ────────────────────────────────────────── */
export function LxCta() {
  const navigate = useNavigate();
  return (
    <section className="lx-section" style={{ paddingTop: 0 }} aria-labelledby="lx-cta">
      <div className="lx-wrap">
        <LxReveal>
          <div className="lx-cta">
            <div className="lx-cta-copy">
              <LxBadge n="10">Get started</LxBadge>
              <h2 id="lx-cta">
                Wake up to a plan.
                <br />
                <span>Approve it before your coffee.</span>
              </h2>
              <p>Connect Instagram or Facebook and get your first briefing in about a minute. Free for one brand, no credit card.</p>
              <div className="lx-cta-btns">
                <LxButton variant="dark" onClick={() => navigate('/sign-up')}>
                  Start for free
                </LxButton>
                <LxButton variant="white" onClick={() => goToId('pricing')}>
                  See pricing
                </LxButton>
              </div>
            </div>
            <div className="lx-cta-shot">
              <img src={SHOTS.calendar} alt="ZieAds calendar with the week planned" loading="lazy" width={1600} height={1000} />
            </div>
          </div>
        </LxReveal>
      </div>
    </section>
  );
}
