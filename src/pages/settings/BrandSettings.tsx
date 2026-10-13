/*
  Brand profile settings: the user describes their brand once, in plain language,
  and Zie (the AI Agent) uses it as ground truth for every answer, draft and reply.
*/
import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Globe, Loader2, Plus, Trash2 } from 'lucide-react';
import ZIcon from '../../components/icons/ZIcon';
import { supabase } from '../../lib/supabaseClient';
import ZieAvatar from '../../components/ZieAvatar';
import SocialIcon from '../../components/v3/SocialIcon';
import { TextRollButton } from '../landing/ui';
import './brand-settings.css';

type Product = { name?: string; price?: string; note?: string };
export interface Brand {
  identity: { name?: string; website?: string; industry?: string; location?: string; markets?: string; languages?: string[]; description?: string };
  offer: { summary?: string; products?: Product[]; price_range?: string; usp?: string };
  audience: { description?: string; age_range?: string; gender?: string; interests?: string; pain_points?: string };
  voice: { tones?: string[]; emoji?: 'none' | 'some' | 'lots'; formality?: 'casual' | 'balanced' | 'formal'; words_use?: string; words_avoid?: string; sample_post?: string };
  goals: { primary_goal?: string; goals?: string[]; monthly_budget?: string; platforms?: string[]; posting_frequency?: string; role?: string; account_volume?: string };
  competitors: string[];
  rules?: string;
}

const EMPTY: Brand = { identity: {}, offer: { products: [] }, audience: {}, voice: {}, goals: {}, competitors: [] };

const INDUSTRIES = ['E-commerce', 'Beauty and skincare', 'Fashion', 'Food and beverage', 'Health and fitness', 'Education', 'SaaS', 'Local services', 'B2B services', 'Creator', 'Agency', 'Other'];
const LANGUAGES = ['Bahasa Indonesia', 'English', 'Malay', 'Mixed'];
const TONES = ['Friendly', 'Professional', 'Playful', 'Bold', 'Luxurious', 'Educational', 'Inspiring', 'Witty', 'Caring', 'Minimalist'];
const AGES = ['13-17', '18-24', '25-34', '35-44', '45-54', '55+'];
const GENDERS = ['Mostly women', 'Mostly men', 'Everyone'];
const GOALS = ['Grow followers', 'Get more sales', 'Get more leads', 'Build brand awareness', 'Engage the community', 'Launch a product', 'Improve ad results'];
const BUDGETS = ['No ads yet', 'Under $1K', '$1K to $5K', '$5K to $20K', 'Over $20K'];
const FREQ = ['A few times a month', '1-2 times a week', '3-5 times a week', 'Every day'];
const CHANNELS = [
  { k: 'instagram', l: 'Instagram' },
  { k: 'tiktok', l: 'TikTok' },
  { k: 'linkedin', l: 'LinkedIn' },
  { k: 'facebook', l: 'Facebook' },
  { k: 'x', l: 'X' },
  { k: 'meta_ads', l: 'Meta Ads' },
  { k: 'google_ads', l: 'Google Ads' },
];
const ROLES = ['Business owner', 'In-house marketer', 'Freelancer or consultant', 'Agency', 'Content creator'];

const SECTIONS = [
  { id: 'bs-basics', n: '01', t: 'The basics' },
  { id: 'bs-offer', n: '02', t: 'What you sell' },
  { id: 'bs-audience', n: '03', t: 'Your customers' },
  { id: 'bs-voice', n: '04', t: 'How you sound' },
  { id: 'bs-goals', n: '05', t: 'Goals and channels' },
  { id: 'bs-rules', n: '06', t: 'Rules and rivals' },
];

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

/** Merge a draft into the form without wiping what the user already typed */
function fillEmpty<T>(current: T, incoming: any): T {
  if (incoming === undefined || incoming === null) return current;
  if (Array.isArray(current)) return (current.length ? current : incoming) as T;
  if (typeof current === 'object' && current) {
    const out: any = { ...current };
    for (const k of Object.keys(incoming)) out[k] = fillEmpty((current as any)[k] ?? (Array.isArray(incoming[k]) ? [] : typeof incoming[k] === 'object' ? {} : ''), incoming[k]);
    return out;
  }
  return (current === '' || current === undefined ? incoming : current) as T;
}

function completeness(b: Brand) {
  const checks: Array<[boolean, string, string]> = [
    [!!b.identity.name, 'Business name', 'bs-basics'],
    [!!b.identity.website, 'Website', 'bs-basics'],
    [!!b.identity.industry, 'Industry', 'bs-basics'],
    [!!(b.identity.description || b.offer.summary), 'What you sell', 'bs-offer'],
    [!!b.offer.products?.some((p) => p.name), 'Products or services', 'bs-offer'],
    [!!b.offer.usp, 'What makes you different', 'bs-offer'],
    [!!b.audience.description, 'Ideal customer', 'bs-audience'],
    [!!b.audience.pain_points, 'Customer problems', 'bs-audience'],
    [!!b.voice.tones?.length, 'Brand tone', 'bs-voice'],
    [!!b.voice.sample_post, 'Example post', 'bs-voice'],
    [!!b.goals.primary_goal, 'Main goal', 'bs-goals'],
    [!!b.goals.platforms?.length, 'Channels', 'bs-goals'],
  ];
  const done = checks.filter((c) => c[0]).length;
  return { score: Math.round((done / checks.length) * 100), missing: checks.filter((c) => !c[0]) };
}

function Chips({ options, value, onChange, multi = true }: { options: string[]; value?: string[] | string; onChange: (v: any) => void; multi?: boolean }) {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  return (
    <div className="bs-chips">
      {options.map((o) => {
        const on = list.includes(o);
        return (
          <button
            key={o}
            type="button"
            className={`bs-chip ${on ? 'is-on' : ''}`}
            aria-pressed={on}
            onClick={() => (multi ? onChange(on ? list.filter((x) => x !== o) : [...list, o]) : onChange(on ? '' : o))}
          >
            {on && <Check size={12} />}
            {o}
          </button>
        );
      })}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="bs-field">
      <label className="bs-label">{label}</label>
      {hint && <p className="bs-hint">{hint}</p>}
      {children}
    </div>
  );
}

export default function BrandSettings() {
  const [brand, setBrand] = useState<Brand>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<'' | 'database' | 'account'>('');
  const [error, setError] = useState('');
  const [autoUrl, setAutoUrl] = useState('');
  const [autoBusy, setAutoBusy] = useState(false);
  const [autoNote, setAutoNote] = useState('');
  const [competitorInput, setCompetitorInput] = useState('');
  const dirtyRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/profile/brand', { headers: await authHeaders() });
        const j = await res.json();
        const d = j.data || {};
        const legacy = j.legacy || {};
        const merged: Brand = fillEmpty(
          {
            ...EMPTY,
            ...d,
            identity: { ...(d.identity || {}) },
            offer: { products: [], ...(d.offer || {}) },
            audience: { ...(d.audience || {}) },
            voice: { ...(d.voice || {}) },
            goals: { ...(d.goals || {}) },
            competitors: d.competitors || [],
          },
          {
            identity: { name: legacy.business_name, website: legacy.primary_url, industry: legacy.business_type },
            audience: { pain_points: legacy.challenge },
            goals: { monthly_budget: legacy.monthly_budget, primary_goal: legacy.primary_goal, goals: legacy.goals, role: legacy.role },
          },
        );
        setBrand(merged);
        setAutoUrl(merged.identity.website || '');
      } catch {
        setError('Could not load your brand profile.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const set = <K extends keyof Brand>(section: K, patch: Partial<Brand[K]> | Brand[K]) => {
    dirtyRef.current = true;
    setSaved('');
    setBrand((b) => ({ ...b, [section]: Array.isArray(patch) || typeof patch !== 'object' || patch === null ? patch : { ...(b[section] as any), ...(patch as any) } }));
  };

  const comp = useMemo(() => completeness(brand), [brand]);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/profile/brand', { method: 'POST', headers: await authHeaders(), body: JSON.stringify({ brand }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Save failed');
      dirtyRef.current = false;
      setSaved(j.storage || 'database');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const autofill = async () => {
    if (!autoUrl.trim()) return;
    setAutoBusy(true);
    setAutoNote('');
    setError('');
    try {
      const res = await fetch('/api/profile/brand/autofill', { method: 'POST', headers: await authHeaders(), body: JSON.stringify({ url: autoUrl }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Could not read that website');
      setBrand((b) => fillEmpty(b, j.data));
      dirtyRef.current = true;
      setSaved('');
      setAutoNote('Zie filled the empty fields from your website. Check them, adjust anything, then save.');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAutoBusy(false);
    }
  };

  const products = brand.offer.products || [];
  const setProduct = (i: number, patch: Product) => set('offer', { products: products.map((p, k) => (k === i ? { ...p, ...patch } : p)) });

  // What Zie will do with this, in one readable paragraph
  const summary = useMemo(() => {
    const parts: string[] = [];
    const name = brand.identity.name || 'your brand';
    if (brand.identity.industry || brand.offer.summary) parts.push(`${name} ${brand.offer.summary ? `sells ${brand.offer.summary.replace(/\.$/, '').toLowerCase()}` : `is in ${brand.identity.industry?.toLowerCase()}`}.`);
    if (brand.audience.description) parts.push(`Zie writes for ${brand.audience.description.replace(/\.$/, '').toLowerCase()}.`);
    if (brand.voice.tones?.length) parts.push(`Tone: ${brand.voice.tones.join(', ').toLowerCase()}${brand.voice.emoji ? `, ${brand.voice.emoji === 'none' ? 'no' : brand.voice.emoji} emoji` : ''}.`);
    if (brand.goals.primary_goal) parts.push(`Every plan aims to ${brand.goals.primary_goal.toLowerCase()}.`);
    if (brand.identity.languages?.length) parts.push(`Content in ${brand.identity.languages.join(' and ')}.`);
    return parts.join(' ');
  }, [brand]);

  if (loading) {
    return (
      <div className="bs-loading">
        <Loader2 size={18} className="bs-spin" /> Loading your brand profile
      </div>
    );
  }

  return (
    <div className="bs">
      {/* Autofill hero */}
      <section className="bs-hero">
        <ZieAvatar size={52} active={autoBusy} />
        <div className="bs-hero-copy">
          <h2>Teach Zie your brand once.</h2>
          <p>Everything here becomes Zie's knowledge: it shapes every answer, caption, reply and plan. Start from your website and Zie drafts it for you.</p>
          <div className="bs-auto">
            <Globe size={16} />
            <input value={autoUrl} onChange={(e) => setAutoUrl(e.target.value)} placeholder="yourbrand.com" aria-label="Website" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), autofill())} />
            <button type="button" onClick={autofill} disabled={autoBusy || !autoUrl.trim()}>
              {autoBusy ? <Loader2 size={14} className="bs-spin" /> : <ZIcon name="auto-fill" size={14} />}
              {autoBusy ? 'Reading your site' : 'Fill from my website'}
            </button>
          </div>
          {autoNote && <p className="bs-note">{autoNote}</p>}
        </div>
      </section>

      <div className="bs-grid">
        <div className="bs-main">
          {/* 01 Basics */}
          <section id="bs-basics" className="bs-card">
            <header className="bs-card-head">
              <span className="bs-num">01</span>
              <div>
                <h3>The basics</h3>
                <p>Who you are and where you sell.</p>
              </div>
            </header>
            <div className="bs-row">
              <Field label="Business name">
                <input className="bs-input" value={brand.identity.name || ''} onChange={(e) => set('identity', { name: e.target.value })} placeholder="Glow Skin Co" />
              </Field>
              <Field label="Website">
                <input className="bs-input" value={brand.identity.website || ''} onChange={(e) => set('identity', { website: e.target.value })} placeholder="https://glowskin.co" />
              </Field>
            </div>
            <Field label="Industry">
              <Chips options={INDUSTRIES} value={brand.identity.industry} multi={false} onChange={(v) => set('identity', { industry: v })} />
            </Field>
            <Field label="Describe your business in one or two sentences" hint="Plain words, the way you would explain it to a new customer.">
              <textarea className="bs-input" rows={3} value={brand.identity.description || ''} onChange={(e) => set('identity', { description: e.target.value })} placeholder="We make gentle, halal skincare for oily and acne-prone skin, made in Bandung." />
            </Field>
            <div className="bs-row">
              <Field label="Based in">
                <input className="bs-input" value={brand.identity.location || ''} onChange={(e) => set('identity', { location: e.target.value })} placeholder="Jakarta, Indonesia" />
              </Field>
              <Field label="Where your customers are">
                <input className="bs-input" value={brand.identity.markets || ''} onChange={(e) => set('identity', { markets: e.target.value })} placeholder="All of Indonesia, ships to Malaysia" />
              </Field>
            </div>
            <Field label="Content language">
              <Chips options={LANGUAGES} value={brand.identity.languages} onChange={(v) => set('identity', { languages: v })} />
            </Field>
          </section>

          {/* 02 Offer */}
          <section id="bs-offer" className="bs-card">
            <header className="bs-card-head">
              <span className="bs-num">02</span>
              <div>
                <h3>What you sell</h3>
                <p>Zie uses this for captions, ads and answers to customer questions.</p>
              </div>
            </header>
            <Field label="In one line, what do you sell?">
              <input className="bs-input" value={brand.offer.summary || ''} onChange={(e) => set('offer', { summary: e.target.value })} placeholder="Skincare serums and moisturisers for acne-prone skin" />
            </Field>
            <Field label="Products or services" hint="Add your best sellers. Prices help Zie answer comments like 'berapa harga?'.">
              <div className="bs-products">
                {products.map((p, i) => (
                  <div key={i} className="bs-product">
                    <input className="bs-input" value={p.name || ''} onChange={(e) => setProduct(i, { name: e.target.value })} placeholder="Product name" />
                    <input className="bs-input bs-price" value={p.price || ''} onChange={(e) => setProduct(i, { price: e.target.value })} placeholder="Rp189.000" />
                    <input className="bs-input" value={p.note || ''} onChange={(e) => setProduct(i, { note: e.target.value })} placeholder="Short note, for example best seller" />
                    <button type="button" className="bs-icon" onClick={() => set('offer', { products: products.filter((_, k) => k !== i) })} aria-label="Remove product">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {products.length < 15 && (
                  <button type="button" className="bs-add" onClick={() => set('offer', { products: [...products, {}] })}>
                    <Plus size={14} /> Add a product or service
                  </button>
                )}
              </div>
            </Field>
            <div className="bs-row">
              <Field label="Price range">
                <input className="bs-input" value={brand.offer.price_range || ''} onChange={(e) => set('offer', { price_range: e.target.value })} placeholder="Rp89.000 to Rp350.000" />
              </Field>
              <Field label="What makes you different?">
                <input className="bs-input" value={brand.offer.usp || ''} onChange={(e) => set('offer', { usp: e.target.value })} placeholder="Dermatologist tested, BPOM certified, results in 14 days" />
              </Field>
            </div>
          </section>

          {/* 03 Audience */}
          <section id="bs-audience" className="bs-card">
            <header className="bs-card-head">
              <span className="bs-num">03</span>
              <div>
                <h3>Your customers</h3>
                <p>Who Zie is talking to in every post and reply.</p>
              </div>
            </header>
            <Field label="Describe your ideal customer">
              <textarea className="bs-input" rows={2} value={brand.audience.description || ''} onChange={(e) => set('audience', { description: e.target.value })} placeholder="Students and young professionals with oily skin who want affordable, halal skincare" />
            </Field>
            <div className="bs-row">
              <Field label="Age">
                <Chips options={AGES} value={brand.audience.age_range ? brand.audience.age_range.split(', ') : []} onChange={(v: string[]) => set('audience', { age_range: v.join(', ') })} />
              </Field>
              <Field label="Gender">
                <Chips options={GENDERS} value={brand.audience.gender} multi={false} onChange={(v) => set('audience', { gender: v })} />
              </Field>
            </div>
            <Field label="Their biggest problems or questions">
              <textarea className="bs-input" rows={2} value={brand.audience.pain_points || ''} onChange={(e) => set('audience', { pain_points: e.target.value })} placeholder="Breakouts that keep coming back, worried products are not halal, small budget" />
            </Field>
            <Field label="Interests">
              <input className="bs-input" value={brand.audience.interests || ''} onChange={(e) => set('audience', { interests: e.target.value })} placeholder="K-beauty, self care, campus life, modest fashion" />
            </Field>
          </section>

          {/* 04 Voice */}
          <section id="bs-voice" className="bs-card">
            <header className="bs-card-head">
              <span className="bs-num">04</span>
              <div>
                <h3>How you sound</h3>
                <p>So drafts sound like you, not like a robot.</p>
              </div>
            </header>
            <Field label="Brand tone" hint="Pick up to three.">
              <Chips options={TONES} value={brand.voice.tones} onChange={(v: string[]) => set('voice', { tones: v.slice(-3) })} />
            </Field>
            <div className="bs-row">
              <Field label="Formality">
                <div className="bs-seg">
                  {(['casual', 'balanced', 'formal'] as const).map((f) => (
                    <button key={f} type="button" className={brand.voice.formality === f ? 'is-on' : ''} onClick={() => set('voice', { formality: f })}>
                      {f === 'casual' ? 'Casual' : f === 'balanced' ? 'Balanced' : 'Formal'}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Emoji">
                <div className="bs-seg">
                  {(['none', 'some', 'lots'] as const).map((f) => (
                    <button key={f} type="button" className={brand.voice.emoji === f ? 'is-on' : ''} onClick={() => set('voice', { emoji: f })}>
                      {f === 'none' ? 'None' : f === 'some' ? 'A few' : 'Lots'}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
            <div className="bs-row">
              <Field label="Words and phrases you use">
                <input className="bs-input" value={brand.voice.words_use || ''} onChange={(e) => set('voice', { words_use: e.target.value })} placeholder="kak, glowing, #GlowSquad" />
              </Field>
              <Field label="Words to avoid">
                <input className="bs-input" value={brand.voice.words_avoid || ''} onChange={(e) => set('voice', { words_avoid: e.target.value })} placeholder="cheap, miracle, guaranteed" />
              </Field>
            </div>
            <Field label="Paste one of your best posts" hint="The fastest way for Zie to learn your voice.">
              <textarea className="bs-input" rows={4} value={brand.voice.sample_post || ''} onChange={(e) => set('voice', { sample_post: e.target.value })} placeholder="Paste a caption that performed well and sounds like you" />
            </Field>
          </section>

          {/* 05 Goals */}
          <section id="bs-goals" className="bs-card">
            <header className="bs-card-head">
              <span className="bs-num">05</span>
              <div>
                <h3>Goals and channels</h3>
                <p>What success looks like, so Zie prioritises the right work.</p>
              </div>
            </header>
            <Field label="Main goal right now">
              <Chips options={GOALS} value={brand.goals.primary_goal} multi={false} onChange={(v) => set('goals', { primary_goal: v })} />
            </Field>
            <Field label="Channels you focus on">
              <div className="bs-chips">
                {CHANNELS.map((c) => {
                  const on = brand.goals.platforms?.includes(c.l);
                  return (
                    <button
                      key={c.k}
                      type="button"
                      className={`bs-chip has-icon ${on ? 'is-on' : ''}`}
                      aria-pressed={on}
                      onClick={() => set('goals', { platforms: on ? (brand.goals.platforms || []).filter((x) => x !== c.l) : [...(brand.goals.platforms || []), c.l] })}
                    >
                      <SocialIcon platform={c.k} size={16} /> {c.l}
                    </button>
                  );
                })}
              </div>
            </Field>
            <div className="bs-row">
              <Field label="How often you want to post">
                <Chips options={FREQ} value={brand.goals.posting_frequency} multi={false} onChange={(v) => set('goals', { posting_frequency: v })} />
              </Field>
              <Field label="Monthly ads budget">
                <Chips options={BUDGETS} value={brand.goals.monthly_budget} multi={false} onChange={(v) => set('goals', { monthly_budget: v })} />
              </Field>
            </div>
            <Field label="Your role">
              <Chips options={ROLES} value={brand.goals.role} multi={false} onChange={(v) => set('goals', { role: v })} />
            </Field>
          </section>

          {/* 06 Rules */}
          <section id="bs-rules" className="bs-card">
            <header className="bs-card-head">
              <span className="bs-num">06</span>
              <div>
                <h3>Rules and rivals</h3>
                <p>Lines Zie must never cross, and who you compete with.</p>
              </div>
            </header>
            <Field label="Brand rules" hint="For example claims you cannot make, topics to avoid, how to handle complaints.">
              <textarea className="bs-input" rows={3} value={brand.rules || ''} onChange={(e) => set('rules', e.target.value as any)} placeholder="Never promise medical results. Move complaints to DM. Always mention BPOM when asked about safety." />
            </Field>
            <Field label="Competitors" hint="Names or websites. Press Enter to add.">
              <div className="bs-tags">
                {brand.competitors.map((c) => (
                  <span key={c} className="bs-tag">
                    {c}
                    <button type="button" onClick={() => set('competitors', brand.competitors.filter((x) => x !== c))} aria-label={`Remove ${c}`}>
                      ×
                    </button>
                  </span>
                ))}
                <input
                  className="bs-tag-input"
                  value={competitorInput}
                  onChange={(e) => setCompetitorInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && competitorInput.trim()) {
                      e.preventDefault();
                      if (!brand.competitors.includes(competitorInput.trim())) set('competitors', [...brand.competitors, competitorInput.trim()].slice(0, 10));
                      setCompetitorInput('');
                    }
                  }}
                  placeholder={brand.competitors.length ? 'Add another' : 'somethincare.id'}
                />
              </div>
            </Field>
          </section>
        </div>

        {/* What Zie knows */}
        <aside className="bs-side">
          <div className="bs-knows">
            <div className="bs-knows-head">
              <div className="bs-ring" style={{ ['--p' as any]: comp.score }}>
                <span>{comp.score}%</span>
              </div>
              <div>
                <strong>What Zie knows</strong>
                <small>{comp.score >= 80 ? 'Zie knows your brand well.' : comp.score >= 40 ? 'Getting there. A few more answers help a lot.' : 'Fill the basics so Zie stops guessing.'}</small>
              </div>
            </div>
            <p className="bs-knows-summary">{summary || 'Tell Zie about your business and a live summary of what it knows appears here.'}</p>
            {comp.missing.length > 0 && (
              <div className="bs-missing">
                <span>Still missing</span>
                {comp.missing.slice(0, 6).map(([, label, id]) => (
                  <button key={label} type="button" onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                    {label}
                  </button>
                ))}
              </div>
            )}
            <nav className="bs-nav">
              {SECTIONS.map((s) => (
                <button key={s.id} type="button" onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                  <span>{s.n}</span> {s.t}
                </button>
              ))}
            </nav>
            <TextRollButton text={saving ? 'Saving...' : 'Save brand profile'} onClick={save} disabled={saving} className="bs-save" />
            {saved && (
              <p className="bs-saved">
                <Check size={13} /> Saved. Zie uses it from your next message.
              </p>
            )}
            {error && <p className="bs-error">{error}</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}
