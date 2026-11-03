/*
  v4 landing page sections. Order: hero, works with, why, product, how it works,
  Guardian band, promises, integrations and MCP, comparison, pricing, free audit, FAQ, final CTA.
  Copy follows the November 2026 copywriting audit: lead with the outcome (know what to post, answer
  and fix today), plain words, no internal names above the fold, and only claims the product proves today.
  No invented customers, logos, reviews or usage numbers.
*/
import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Globe,
  Link2,
  Plus,
} from 'lucide-react';
import SocialIcon from '../../../components/v3/SocialIcon';
import ZieAdsLogo from '../../../components/ZieAdsLogo';
import ZieAvatar from '../../../components/ZieAvatar';
import { SHOTS } from '../images';
import { faqItems, pricingPlans } from '../data';
import { LANDING_COMPARE_COLUMNS as COMPARE_COLUMNS, LANDING_COMPARE_ROWS as COMPARE_ROWS } from '../compare';
import { LxBadge, LxButton, LxCount, LxReveal, goToId } from './kit';

const PLATFORMS = ['instagram', 'facebook', 'tiktok', 'linkedin'] as const;

/* ── Website scan form: the hero, the final CTA and old #audit links all use it ── */
function useWebsiteScan(onScanComplete?: (data: any) => void) {
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
      if (!resp.ok || !json.data) throw new Error(json.error || 'We could not read that site. Check the address and try again.');
      onScanComplete?.(json.data);
      navigate('/scan-result');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };
  return { url, setUrl, busy, err, submit };
}

function ScanForm({ onScanComplete, id, tone = 'light' }: { onScanComplete?: (data: any) => void; id: string; tone?: 'light' | 'dark' }) {
  const { url, setUrl, busy, err, submit } = useWebsiteScan(onScanComplete);
  return (
    <>
      <form className={`lx-scan is-${tone}`} onSubmit={submit}>
        <label className="lx-sr" htmlFor={id}>
          Your website
        </label>
        <input id={id} className="lx-input" inputMode="url" autoComplete="url" placeholder="yourbrand.com" value={url} onChange={(e) => setUrl(e.target.value)} />
        <LxButton type="submit" variant={tone === 'dark' ? 'dark' : 'orange'} disabled={busy}>
          {busy ? 'Reading your site...' : 'Show my first briefing'}
        </LxButton>
      </form>
      {err && (
        <p className="lx-err" role="alert">
          {err}
        </p>
      )}
    </>
  );
}

/* ── Hero ─────────────────────────────────────────────── */
export function LxHero({ onScanComplete }: { onScanComplete?: (data: any) => void }) {
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
            For founders and small teams on Instagram, Facebook, TikTok and LinkedIn
          </span>
          <h1 id="lx-hero-title">
            Know exactly what to <em>post, answer and fix</em> today.
          </h1>
          <p className="lx-hero-sub">Every morning ZieAds checks your accounts and sends 3 things to do today. Tap approve and it schedules the posts, drafts the replies and builds the report.</p>
          <div className="lx-hero-form" id="audit">
            <ScanForm onScanComplete={onScanComplete} id="lx-hero-url" />
            <p className="lx-hero-note">Free · no sign up · we only read your public website</p>
          </div>
          <button type="button" className="lx-hero-link" onClick={() => goToId('features')}>
            See an example plan
          </button>
          <ul className="lx-risk" aria-label="Our promises">
            <li>
              <Check size={13} /> Nothing posts without your yes
            </li>
            <li>
              <Check size={13} /> One flat price per brand, no credits
            </li>
            <li>
              <Check size={13} /> We check every post went live
            </li>
          </ul>
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
          <img src={SHOTS.home} alt="ZieAds morning plan with what needs you, wins, concerns and three actions to approve" width={1600} height={1000} fetchPriority="high" />
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
  ];
  const ads: Array<{ p: string; label: string }> = [
    { p: 'meta', label: 'Meta Ads' },
    { p: 'google_ads', label: 'Google Ads' },
    { p: 'tiktok', label: 'TikTok Ads' },
  ];
  return (
    <div className="lx-strip">
      <div className="lx-wrap lx-strip-in">
        <span className="lx-strip-label">Works with</span>
        <div className="lx-strip-logos">
          {items.map((i) => (
            <span key={i.p} className="lx-strip-logo">
              <SocialIcon platform={i.p} size={20} variant="mark" />
              {i.label}
            </span>
          ))}
        </div>
        <span className="lx-strip-label">Reads results from</span>
        <div className="lx-strip-logos">
          {ads.map((i) => (
            <span key={i.label} className="lx-strip-logo">
              <SocialIcon platform={i.p} size={20} variant="mark" />
              {i.label}
            </span>
          ))}
        </div>
      </div>
      <p className="lx-strip-next">Coming next: X, Bluesky, YouTube, Threads and Pinterest</p>
    </div>
  );
}

/* ── Why ──────────────────────────────────────────────── */
export function LxWhy() {
  return (
    <section className="lx-section lx-why lx-center" aria-labelledby="lx-why">
      <div className="lx-wrap">
        <LxReveal>
          <LxBadge n="01">The problem</LxBadge>
          <h2 className="lx-h2" id="lx-why">
            You know you should post every week.
            <span>Then the week happens.</span>
          </h2>
          <p className="lx-why-text is-small">
            Posting slips. Comments asking "how much?" sit for a day. You guess what to post next.{' '}
            <span className="is-muted">ZieAds fixes the three things that cost you customers: showing up, answering fast, and knowing what works.</span>
          </p>
        </LxReveal>
        <LxReveal delay={120}>
          <div className="lx-stats">
            <div className="lx-stat">
              <strong>
                <LxCount to={5} prefix="Under " suffix=" min" />
              </strong>
              <span>from sign up to your first briefing</span>
            </div>
            <div className="lx-stat">
              <strong>
                <LxCount to={3} suffix=" actions" />
              </strong>
              <span>every morning, each linked to the post or number behind it</span>
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

/* ── Product: three outcomes, each with the screen that proves it ── */
const OUTCOMES = [
  {
    title: 'Show up every week, even when you are busy',
    body: 'Write once, ZieAds tailors it for each network and posts at the times your audience is online. Your week of posts is planned before Monday starts.',
    proof: 'Every scheduled post is checked after it goes out, and a failed one is retried up to 3 times.',
    img: SHOTS.calendar,
    alt: 'Calendar week view with scheduled, published and drafted posts',
  },
  {
    title: 'Answer buyers before they go elsewhere',
    body: 'Comments asking about price, stock or delivery go to the top with a reply drafted in your voice. You read, tap send, done.',
    proof: 'Buying questions and complaints are labeled, so nothing that can turn into a sale waits until tomorrow.',
    img: SHOTS.inbox,
    alt: 'Inbox with buying questions sorted first and a reply draft',
  },
  {
    title: 'Know what is working without reading charts',
    body: 'Every morning: what grew, what dropped, what competitors posted, and how your ads compare. In plain words, with the post or number behind it.',
    proof: 'Wins, concerns and 3 actions, each one linked to the evidence so you can check it.',
    img: SHOTS.analyst,
    alt: 'Morning plan with wins, concerns and three actions',
  },
];

export function LxFeatures() {
  return (
    <section className="lx-section is-soft" id="features" aria-labelledby="lx-feat">
      <div className="lx-wrap">
        <LxReveal>
          <LxBadge n="02">What you get</LxBadge>
          <h2 className="lx-h2" id="lx-feat">
            Three things that win customers.
            <span>Done for you every morning.</span>
          </h2>
        </LxReveal>
        <div className="lx-outcomes">
          {OUTCOMES.map((o, i) => (
            <LxReveal key={o.title} delay={80}>
              <div className={`lx-outcome ${i % 2 ? 'is-flip' : ''}`}>
                <div className="lx-outcome-copy">
                  <span className="lx-outcome-n">0{i + 1}</span>
                  <h3>{o.title}</h3>
                  <p>{o.body}</p>
                  <p className="lx-outcome-proof">
                    <CheckCircle2 size={15} /> {o.proof}
                  </p>
                </div>
                <div className="lx-card lx-outcome-shot">
                  <img src={o.img} alt={o.alt} loading="lazy" width={1600} height={1000} />
                </div>
              </div>
            </LxReveal>
          ))}
        </div>
        <p className="lx-more">
          <a href="/features">See every feature</a>
        </p>
      </div>
    </section>
  );
}

/* ── How it works ─────────────────────────────────────── */
export function LxHow() {
  const steps = [
    { icon: <Globe size={18} />, title: 'Add your website', body: 'ZieAds learns what you sell and how you sound.' },
    { icon: <Link2 size={18} />, title: 'Connect Instagram and Facebook', body: 'One click through Meta. TikTok and LinkedIn when you are ready.' },
    { icon: <CheckCircle2 size={18} />, title: 'Approve your 3 actions', body: 'ZieAds posts, replies and confirms each one went live.' },
  ];
  return (
    <section className="lx-section lx-center" id="how" aria-labelledby="lx-how">
      <div className="lx-wrap">
        <LxReveal>
          <LxBadge n="03">How it works</LxBadge>
          <h2 className="lx-h2" id="lx-how">
            Five minutes to set up.
            <span>Five minutes a morning after that.</span>
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

/* ── Every post checked (the Guardian band, named by what it does) ── */
export function LxImpact() {
  return (
    <section className="lx-section" style={{ paddingTop: 0 }} aria-labelledby="lx-impact">
      <div className="lx-wrap" style={{ maxWidth: 1240 }}>
        <div className="lx-impact">
          <LxReveal>
            <LxBadge n="04">Every post checked</LxBadge>
            <h2 id="lx-impact">
              Never find out a post failed
              <span>the next day.</span>
            </h2>
            <p className="lx-impact-lead">ZieAds checks that every post went live, warns you before an account disconnects, and flags comments waiting too long.</p>
          </LxReveal>
          <div className="lx-impact-nums">
            <div className="lx-impact-num">
              <strong>
                <LxCount to={3} suffix="x" />
              </strong>
              <span>retries for a failed post, then it waits for you at the top of your morning plan</span>
            </div>
            <div className="lx-impact-num">
              <strong>
                <LxCount to={24} suffix="/7" />
              </strong>
              <span>checks on your posts, your connections and the comments still waiting</span>
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
  { lead: 'Your ad budget stays yours.', rest: 'I read Meta, Google and TikTok Ads results, read only, and never touch a campaign.' },
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
            <span>The assistant inside ZieAds</span>
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
            Works with what
            <span>you already use.</span>
          </h2>
          <p className="lx-lead">Official connections only. No passwords shared, nothing scraped from your accounts.</p>
          <ul className="lx-int-list">
            <li>
              <Check size={15} /> Instagram and Facebook in one click through Meta, plus TikTok and LinkedIn
            </li>
            <li>
              <Check size={15} /> Ads, read only: ZieAds never changes your campaigns. Import a CSV today, direct connection comes as each platform approves it
            </li>
            <li>
              <Check size={15} /> Use ZieAds inside Claude or ChatGPT. Ask "what should I post this week?" and anything it prepares waits for your approval <small className="lx-tag">MCP</small>
            </li>
          </ul>
          <p className="lx-int-links">
            <a href="/mcp">ZieAds in Claude and ChatGPT</a>
            <a href="/api">REST API</a>
            <a href="/docs">Docs</a>
          </p>
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
          <p className="lx-cmp-note">
            Agency cost is a conservative starting point for a small retainer. Comparing tools? See <a href="/vs/metricool">ZieAds vs Metricool</a> and <a href="/vs/vista-social">ZieAds vs Vista Social</a>.
          </p>
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
            One flat price per brand.
            <span>No credits to run out.</span>
          </h2>
          <p className="lx-lead">Free for one brand. Cancel anytime. Every plan checks every post went live and works inside Claude and ChatGPT.</p>
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
          Running several brands? Multi brand workspaces are coming soon. <a href="/pricing" style={{ textDecoration: 'underline' }}>Compare every plan</a>
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
export function LxFaq({ n = '08' }: { n?: string }) {
  const [open, setOpen] = useState(0);
  return (
    <section className="lx-section lx-center" id="faq" aria-labelledby="lx-faq">
      <div className="lx-wrap">
        <LxReveal>
          <LxBadge n={n}>FAQ</LxBadge>
          <h2 className="lx-h2" id="lx-faq">
            Frequently asked questions
          </h2>
          <p className="lx-lead">What ZieAds does, what it never does without you, and how your data stays safe.</p>
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
export function LxCta({ onScanComplete }: { onScanComplete?: (data: any) => void }) {
  const navigate = useNavigate();
  return (
    <section className="lx-section" style={{ paddingTop: 0 }} aria-labelledby="lx-cta">
      <div className="lx-wrap">
        <LxReveal>
          <div className="lx-cta">
            <div className="lx-cta-copy">
              <LxBadge n="09">Get started</LxBadge>
              <h2 id="lx-cta">
                Wake up to a plan.
                <br />
                <span>Approve it before your coffee.</span>
              </h2>
              <p>Start with your website and see your first plan. Free for one brand.</p>
              <div className="lx-cta-form">
                <ScanForm onScanComplete={onScanComplete} id="lx-cta-url" tone="dark" />
              </div>
              <button type="button" className="lx-cta-link" onClick={() => navigate('/pricing')}>
                See pricing
              </button>
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
