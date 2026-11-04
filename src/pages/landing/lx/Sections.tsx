/*
  Landing page sections, laid out like the reference template: hero with the product in a browser frame,
  logo strip, a big statement with three numbers, features (three columns plus two product cards),
  how it works (three step cards), the orange numbers band, a quote carousel, integrations,
  pricing, FAQ, the orange closing band with the product, footer.
  Copy follows the November 2026 research on competitor landing pages and paid user reviews: speak to
  everyone who runs social (brands, creators, marketing teams, freelancers, agencies), lead with the pains
  paid users name most (no time, posts that fail quietly, proving results, replies that wait, pricing that
  grows per seat), plain words, only claims the product proves today. Stats are quoted with their source.
  No invented customers, logos, reviews or usage numbers.
*/
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Globe,
  Link2,
  MessagesSquare,
  Plus,
} from 'lucide-react';
import SocialIcon from '../../../components/v3/SocialIcon';
import ZieAdsLogo from '../../../components/ZieAdsLogo';
import ZieAvatar from '../../../components/ZieAvatar';
import { SHOTS } from '../images';
import { faqItems, pricingPlans } from '../data';
import { LxBadge, LxButton, LxCount, LxReveal, goToId } from './kit';

const PLATFORMS = ['instagram', 'facebook', 'tiktok', 'linkedin'] as const;

/* ── Hero ─────────────────────────────────────────────── */
export function LxHero() {
  const navigate = useNavigate();
  return (
    <section className="lx-hero" id="top" aria-labelledby="lx-hero-title">
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
            For brands, creators, marketing teams and agencies
          </span>
          <h1 id="lx-hero-title">
            The social media tool that <em>tells you what to do next</em>
          </h1>
          <p className="lx-hero-sub">Schedule, reply and report across Instagram, Facebook, TikTok and LinkedIn. Every morning ZieAds turns your numbers into 3 actions, does them when you approve, and checks every post went live.</p>
          <div className="lx-hero-ctas">
            <LxButton variant="orange" onClick={() => navigate('/sign-up')}>
              Start free
            </LxButton>
            <LxButton variant="white" onClick={() => goToId('features')}>
              Take the tour
            </LxButton>
          </div>
          <p className="lx-hero-note">Free for one brand · No credit card · Nothing posts without your yes</p>
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
  const items = ['instagram', 'facebook', 'tiktok', 'linkedin', 'threads', 'youtube', 'pinterest', 'bluesky', 'mastodon', 'telegram', 'discord'];
  const names: Record<string, string> = { instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', linkedin: 'LinkedIn', threads: 'Threads', youtube: 'YouTube', pinterest: 'Pinterest', bluesky: 'Bluesky', mastodon: 'Mastodon', telegram: 'Telegram', discord: 'Discord' };
  return (
    <div className="lx-strip" aria-label="Works with">
      <div className="lx-wrap">
        <div className="lx-strip-logos">
          {items.map((p) => (
            <span key={p} className="lx-strip-logo">
              <SocialIcon platform={p} size={20} variant="mark" />
              {names[p]}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── The problem, in the words paid users use in reviews, with research behind it ── */
const PAINS = [
  { stat: '45%', text: 'of marketers say producing quality content consistently is their top challenge', src: 'HubSpot, 2026' },
  { stat: '69%', text: 'of social teams feel more pressure to prove ROI, and only 37% find it easy', src: 'HubSpot, 2026' },
  { stat: '24h', text: 'is the longest most people want to wait for a brand to reply', src: 'Sprout Social Index' },
];

export function LxWhy() {
  return (
    <section className="lx-section lx-why lx-center" aria-labelledby="lx-why">
      <div className="lx-wrap">
        <LxReveal>
          <LxBadge n="01">The problem</LxBadge>
          <h2 className="lx-why-text" id="lx-why">
            Social media takes more time than it gives back. Ten tabs to post one campaign. A report every Friday. Comments that wait until Monday.{' '}
            <span className="is-muted">And a scheduler that says a post went out when it did not.</span>
          </h2>
        </LxReveal>
        <LxReveal delay={120}>
          <div className="lx-stats">
            {PAINS.map((p) => (
              <div key={p.stat} className="lx-stat">
                <strong>{p.stat}</strong>
                <span>{p.text}</span>
                <small className="lx-stat-src">{p.src}</small>
              </div>
            ))}
          </div>
        </LxReveal>
      </div>
    </section>
  );
}

/* ── Product: three outcomes as columns, then the screens that prove them ── */
const OUTCOMES = [
  {
    icon: <CalendarCheck size={17} />,
    title: 'Post consistently without living in the calendar',
    body: 'Write once and ZieAds tailors it for each network, suggests the times your audience is online, and keeps the week planned. Your morning plan tells you what to post next and why.',
  },
  {
    icon: <MessagesSquare size={17} />,
    title: 'Reply to what matters first',
    body: 'Instagram and Facebook comments in one inbox. Buying questions and complaints rise to the top with a reply drafted in your brand voice. Review, edit, send.',
  },
  {
    icon: <BarChart3 size={17} />,
    title: 'Show results without building reports',
    body: 'Organic and paid side by side, per network and per post. Every morning: what grew, what dropped and what to do about it, in plain words with the number behind it.',
  },
];

const PROOFS = [
  { title: 'Every post checked', body: 'Every post is checked after it goes out. A failed one is retried up to 3 times, then flagged, so it never disappears quietly.', img: SHOTS.calendar, alt: 'Calendar week view with scheduled, published and drafted posts' },
  { title: 'Sorted by intent', body: 'Every comment is labeled by intent, so the ones that turn into sales or crises are never buried under emojis.', img: SHOTS.inbox, alt: 'Inbox with buying questions sorted first and a reply draft' },
];

export function LxFeatures() {
  return (
    <section className="lx-section is-soft" id="features" aria-labelledby="lx-feat">
      <div className="lx-wrap">
        <LxReveal>
          <LxBadge n="02">What you get</LxBadge>
          <h2 className="lx-h2" id="lx-feat">
            Less time in tools.
            <span>More time on the work that grows the account.</span>
          </h2>
        </LxReveal>
        <LxReveal delay={80}>
          <div className="lx-feat-cols">
            {OUTCOMES.map((o) => (
              <div key={o.title} className="lx-feat">
                <span className="lx-feat-ic" aria-hidden="true">
                  {o.icon}
                </span>
                <div>
                  <h3>{o.title}</h3>
                  <p>{o.body}</p>
                </div>
              </div>
            ))}
          </div>
        </LxReveal>
        <LxReveal delay={140}>
          <div className="lx-feat-cards">
            {PROOFS.map((p) => (
              <div key={p.title} className="lx-card lx-shot-card">
                <h4>{p.title}</h4>
                <p>{p.body}</p>
                <div className="lx-shot">
                  <img src={p.img} alt={p.alt} loading="lazy" width={1600} height={1000} />
                </div>
              </div>
            ))}
          </div>
        </LxReveal>
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
    { icon: <Link2 size={18} />, title: 'Connect your accounts', body: 'Instagram and Facebook in one click through Meta, then TikTok and LinkedIn. Official APIs only.' },
    { icon: <Globe size={18} />, title: 'Get your first plan', body: 'ZieAds reads your recent posts, comments and results, and writes your first morning plan.' },
    { icon: <CheckCircle2 size={18} />, title: 'Approve and move on', body: 'Approve a post, a reply or a plan. ZieAds does it, confirms it went live and logs every step.' },
  ];
  return (
    <section className="lx-section lx-center" id="how" aria-labelledby="lx-how">
      <div className="lx-wrap">
        <LxReveal>
          <LxBadge n="03">How it works</LxBadge>
          <h2 className="lx-h2" id="lx-how">
            Set up in five minutes.
            <span>Then a few minutes a morning.</span>
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
              <ZieAdsLogo size={44} tone="white" />
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

/* ── Pricing ──────────────────────────────────────────── */
export function LxPricing() {
  const navigate = useNavigate();
  return (
    <section className="lx-section is-soft lx-center" id="pricing" aria-labelledby="lx-price">
      <div className="lx-wrap">
        <LxReveal>
          <LxBadge n="06">Pricing</LxBadge>
          <h2 className="lx-h2" id="lx-price">
            Priced per brand,
            <span>not per seat.</span>
          </h2>
          <p className="lx-lead">No credits to run out and no add-ons to unlock the basics. Free for one brand, cancel anytime.</p>
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
          Running several brands? Pro gives you 3 workspaces and Agency 10, one per brand. <a href="/pricing" style={{ textDecoration: 'underline' }}>Compare every plan</a>
        </p>
      </div>
    </section>
  );
}

export function LxFaq({ n = '07' }: { n?: string }) {
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
export function LxCta() {
  const navigate = useNavigate();
  return (
    <section className="lx-section" style={{ paddingTop: 0 }} aria-labelledby="lx-cta">
      <div className="lx-wrap">
        <LxReveal>
          <div className="lx-cta">
            <div className="lx-cta-copy">
              <LxBadge n="08">Get started</LxBadge>
              <h2 id="lx-cta">
                Wake up to a plan.
                <br />
                <span>Approve it before your coffee.</span>
              </h2>
              <p>Connect Instagram or Facebook and get your first morning plan today. Free for one brand, no credit card.</p>
              <div className="lx-cta-btns">
                <LxButton variant="dark" onClick={() => navigate('/sign-up')}>
                  Start free
                </LxButton>
                <LxButton variant="white" onClick={() => navigate('/pricing')}>
                  See pricing
                </LxButton>
              </div>
            </div>
            <div className="lx-cta-shot">
              <img src={SHOTS.home} alt="ZieAds morning plan with three actions to approve" loading="lazy" width={1600} height={1000} />
            </div>
          </div>
        </LxReveal>
      </div>
    </section>
  );
}
