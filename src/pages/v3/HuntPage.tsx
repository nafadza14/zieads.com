/*
  Competitor Hunt: see what rivals post and pay to promote, live.
  Pick a competitor and get its real ads (Meta, TikTok, LinkedIn ad libraries) and
  organic posts (Instagram, Facebook, TikTok, LinkedIn) in their original format.
*/
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import V3Layout from '../../components/v3/V3Layout';
import { supabase } from '../../lib/supabaseClient';
import { useDemoMode } from '../../lib/demoStore';
import { sampleHuntCompetitors, sampleHuntContent } from '../../data/sample-competitor-content';
import { Button, Card, CardTitle, EmptyState, PageBody, PageHeader, Pill, SegTabs, Skeleton } from '../../components/v3/ui';
import SocialIcon from '../../components/v3/SocialIcon';
import ZieAvatar from '../../components/ZieAvatar';
import ZIcon from '../../components/icons/ZIcon';
import {
  ArrowUpRight,
  Building2,
  ChevronDown,
  Eye,
  Globe,
  Heart,
  Images,
  Info,
  MessageCircle,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Repeat2,
  Target,
  Trash2,
  X,
} from 'lucide-react';
import './hunt.css';

type Kind = 'all' | 'ad' | 'organic';
type Sort = 'newest' | 'running' | 'engagement';

const SOURCES: { id: string; label: string; icon: string; kind: 'ad' | 'organic' }[] = [
  { id: 'meta_ads', label: 'Meta ads', icon: 'meta', kind: 'ad' },
  { id: 'tiktok_ads', label: 'TikTok ads', icon: 'tiktok', kind: 'ad' },
  { id: 'linkedin_ads', label: 'LinkedIn ads', icon: 'linkedin', kind: 'ad' },
  { id: 'instagram', label: 'Instagram', icon: 'instagram', kind: 'organic' },
  { id: 'facebook', label: 'Facebook', icon: 'facebook', kind: 'organic' },
  { id: 'tiktok', label: 'TikTok', icon: 'tiktok', kind: 'organic' },
  { id: 'linkedin', label: 'LinkedIn', icon: 'linkedin', kind: 'organic' },
];
const CREATIVE_CENTER = 'https://ads.tiktok.com/business/creativecenter/inspiration/topads/pc/en';

const ago = (iso?: string | null) => {
  if (!iso) return 'never';
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 48 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
};
const shortDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: new Date(iso).getFullYear() === new Date().getFullYear() ? undefined : 'numeric' }) : '');
const compact = (n?: number | null) => (n === null || n === undefined ? null : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e4 ? `${Math.round(n / 1000)}k` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));
const aspectCss = (a?: string | null) => (a === '9:16' ? '9 / 16' : a === '4:5' ? '4 / 5' : a === '1.91:1' ? '1.91 / 1' : a === '4:3' ? '4 / 3' : '1 / 1');
const runDays = (i: any) => i.metrics?.run_days ?? (i.started_at ? Math.max(1, Math.round(((i.ended_at ? new Date(i.ended_at).getTime() : Date.now()) - new Date(i.started_at).getTime()) / 86400000)) : null);
const engagement = (i: any) => (i.metrics?.likes || 0) + (i.metrics?.comments || 0) + (i.metrics?.shares || 0);

function Media({ item, large = false }: { item: any; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const vid = useRef<HTMLVideoElement>(null);
  const canPlay = item.media_type === 'video' && item.media_url;
  const ratio = item.kind === 'ad' && !item.aspect ? '1 / 1' : aspectCss(item.aspect);

  if (item.media_type === 'text' || (!item.thumbnail_url && !canPlay)) {
    return (
      <div className="zhu-media is-text" style={{ aspectRatio: large ? undefined : '1.91 / 1' }}>
        <p>{item.headline || item.caption || 'Text post'}</p>
      </div>
    );
  }
  return (
    <div
      className={`zhu-media ${large ? 'is-large' : ''}`}
      style={{ aspectRatio: ratio }}
      onMouseEnter={() => {
        const v = vid.current;
        if (canPlay && !large && v) {
          if (!v.getAttribute('src')) v.src = item.media_url;
          v.play().then(() => setPlaying(true)).catch(() => null);
        }
      }}
      onMouseLeave={() => {
        if (vid.current && !large) {
          vid.current.pause();
          setPlaying(false);
        }
      }}
    >
      {item.thumbnail_url && !failed && <img src={item.thumbnail_url} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} />}
      {failed && <div className="zhu-media-fallback">Preview expired. Open the original to view it.</div>}
      {canPlay && (
        <video
          ref={vid}
          src={large ? item.media_url : undefined}
          muted={!large}
          controls={large}
          playsInline
          loop={!large}
          preload="none"
          poster={item.thumbnail_url || undefined}
          className={playing || large ? 'is-on' : ''}
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
      )}
      {item.media_type === 'video' && !playing && !large && (
        <span className="zhu-media-badge">
          <Play size={11} fill="currentColor" /> Video
        </span>
      )}
      {item.media_type === 'carousel' && (
        <span className="zhu-media-badge">
          <Images size={11} /> {Math.max(2, item.carousel?.length || 2)}
        </span>
      )}
    </div>
  );
}

function SourceMark({ item, size = 18 }: { item: any; size?: number }) {
  if (item.source === 'meta_ads') {
    const pl: string[] = item.placements || [];
    const shown = ['facebook', 'instagram'].filter((p) => pl.includes(p));
    return (
      <span className="zhu-marks" title={pl.length ? `Runs on ${pl.join(', ')}` : 'Meta ad'}>
        {(shown.length ? shown : ['meta']).map((p) => (
          <SocialIcon key={p} platform={p} size={size} />
        ))}
      </span>
    );
  }
  return <SocialIcon platform={item.platform} size={size} />;
}

function ContentCard({ item, onOpen, index, highlight }: { item: any; onOpen: () => void; index: number; highlight?: string }) {
  const days = runDays(item);
  const m = item.metrics || {};
  return (
    <article className="zhu-item" style={{ animationDelay: `${Math.min(index, 12) * 35}ms` }}>
      <button type="button" className="zhu-item-hit" onClick={onOpen} aria-label="Open details" />
      <Media item={item} />
      <div className="zhu-item-body">
        <div className="zhu-item-top">
          <SourceMark item={item} />
          {item.kind === 'ad' ? (
            item.is_active === false ? (
              <Pill tone="neutral">Ended</Pill>
            ) : item.is_active ? (
              <Pill tone="good">Active</Pill>
            ) : (
              <Pill tone="neutral">Ad</Pill>
            )
          ) : (
            <span className="zhu-item-date">{shortDate(item.posted_at)}</span>
          )}
          {highlight && <span className="zhu-flag">{highlight}</span>}
        </div>
        {item.headline && <strong className="zhu-item-head">{item.headline}</strong>}
        {item.caption && !((item.media_type === 'text' || !item.thumbnail_url) && !item.headline) && <p className="zhu-item-cap">{item.caption}</p>}
        <div className="zhu-item-foot">
          {item.kind === 'ad' ? (
            <>
              {days && <span>{item.is_active === false ? `Ran ${days} days` : `Running ${days} ${days === 1 ? 'day' : 'days'}`}</span>}
              {m.variants > 1 && (
                <span title="Versions of this ad running together">
                  <Repeat2 size={12} /> {m.variants} versions
                </span>
              )}
              {m.impressions_text && <span>{m.impressions_text} views</span>}
              {item.cta && <span className="zhu-cta">{item.cta}</span>}
            </>
          ) : (
            <>
              {m.views != null && (
                <span>
                  <Eye size={12} /> {compact(m.views)}
                </span>
              )}
              {m.likes != null && (
                <span>
                  <Heart size={12} /> {compact(m.likes)}
                </span>
              )}
              {m.comments != null && (
                <span>
                  <MessageCircle size={12} /> {compact(m.comments)}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </article>
  );
}

function ContentModal({ item, onClose, onAsk }: { item: any; onClose: () => void; onAsk: (prompt: string) => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  const days = runDays(item);
  const src = SOURCES.find((s) => s.id === item.source);
  const m = item.metrics || {};
  return createPortal(
    <div className="zd-shell zhu-modal" role="dialog" aria-modal="true" aria-label="Content details" onClick={onClose}>
      <div className="zhu-modal-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="zd-icon-btn zhu-modal-x" onClick={onClose} aria-label="Close">
          <X />
        </button>
        <div className="zhu-modal-media">
          <Media item={item} large />
          {item.carousel?.length > 1 && (
            <div className="zhu-modal-strip">
              {item.carousel.slice(1, 6).map((c: any, i: number) => (c.thumbnail_url ? <img key={i} src={c.thumbnail_url} alt="" referrerPolicy="no-referrer" /> : null))}
            </div>
          )}
        </div>
        <div className="zhu-modal-info">
          <div className="zhu-modal-src">
            <SourceMark item={item} size={20} />
            <span>{src?.label}</span>
            {item.kind === 'ad' && (item.is_active ? <Pill tone="good">Active</Pill> : item.is_active === false ? <Pill tone="neutral">Ended</Pill> : null)}
          </div>
          {item.headline && <h3>{item.headline}</h3>}
          {item.caption && <p className="zhu-modal-cap">{item.caption}</p>}
          <dl className="zhu-modal-facts">
            {item.kind === 'ad' && item.started_at && (
              <>
                <dt>Started</dt>
                <dd>{shortDate(item.started_at)}</dd>
              </>
            )}
            {item.kind === 'ad' && days && (
              <>
                <dt>{item.is_active === false ? 'Ran for' : 'Running for'}</dt>
                <dd>{days} days</dd>
              </>
            )}
            {item.kind === 'organic' && item.posted_at && (
              <>
                <dt>Posted</dt>
                <dd>{shortDate(item.posted_at)}</dd>
              </>
            )}
            {item.placements?.length > 0 && (
              <>
                <dt>Placements</dt>
                <dd className="zhu-cap">{item.placements.join(', ').replace(/_/g, ' ')}</dd>
              </>
            )}
            {m.variants > 1 && (
              <>
                <dt>Versions</dt>
                <dd>{m.variants} running together</dd>
              </>
            )}
            {item.cta && (
              <>
                <dt>Call to action</dt>
                <dd>{item.cta}</dd>
              </>
            )}
            {m.views != null && (
              <>
                <dt>Views</dt>
                <dd>{m.views.toLocaleString()}</dd>
              </>
            )}
            {m.likes != null && (
              <>
                <dt>Likes</dt>
                <dd>{m.likes.toLocaleString()}</dd>
              </>
            )}
            {m.comments != null && (
              <>
                <dt>Comments</dt>
                <dd>{m.comments.toLocaleString()}</dd>
              </>
            )}
            {m.shares != null && (
              <>
                <dt>Shares</dt>
                <dd>{m.shares.toLocaleString()}</dd>
              </>
            )}
            {item.link_url && (
              <>
                <dt>Sends people to</dt>
                <dd className="zhu-ellipsis">{item.link_url.replace(/^https?:\/\/(www\.)?/, '').split(/[?#]/)[0]}</dd>
              </>
            )}
          </dl>
          <div className="zhu-modal-actions">
            {item.url && (
              <a className="zd-btn is-secondary is-md" href={item.url} target="_blank" rel="noreferrer">
                Open original <ArrowUpRight size={14} />
              </a>
            )}
            <Button
              variant="soft"
              icon={<ZIcon name="analyze" />}
              onClick={() =>
                onAsk(
                  `Break down this competitor ${item.kind === 'ad' ? 'ad' : 'post'} from ${src?.label}: the hook, the angle, the offer and why it might work. Then write 2 versions I could test for my brand.\n\n${item.headline ? `Headline: ${item.headline}\n` : ''}Text: ${item.caption || '(no text)'}\n${item.cta ? `CTA: ${item.cta}\n` : ''}${days && item.kind === 'ad' ? `Running ${days} days\n` : ''}Link: ${item.url || ''}`,
                )
              }
            >
              Break it down with Zie
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** TikTok creator embed and Facebook Page Plugin: official, free, always live */
function LiveEmbeds({ tiktok, facebook }: { tiktok?: string | null; facebook?: string | null }) {
  const ttRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!tiktok || !ttRef.current) return;
    const h = tiktok.replace(/[^A-Za-z0-9_.]/g, '');
    ttRef.current.innerHTML = `<blockquote class="tiktok-embed" cite="https://www.tiktok.com/@${h}" data-unique-id="${h}" data-embed-type="creator" style="max-width:100%;min-width:288px;margin:0"><section><a target="_blank" rel="noreferrer" href="https://www.tiktok.com/@${h}">@${h}</a></section></blockquote>`;
    document.getElementById('zd-tiktok-embed')?.remove();
    const sc = document.createElement('script');
    sc.id = 'zd-tiktok-embed';
    sc.src = 'https://www.tiktok.com/embed.js';
    sc.async = true;
    document.body.appendChild(sc);
  }, [tiktok]);
  if (!tiktok && !facebook) return null;
  return (
    <section className="zhu-embeds" aria-label="Live profiles">
      {tiktok && (
        <Card className="zhu-embed">
          <CardTitle icon={<SocialIcon platform="tiktok" size={18} variant="mark" />} sub="Latest videos, straight from TikTok">
            Live on TikTok
          </CardTitle>
          <div ref={ttRef} className="zhu-embed-body" />
        </Card>
      )}
      {facebook && (
        <Card className="zhu-embed">
          <CardTitle icon={<SocialIcon platform="facebook" size={18} variant="mark" />} sub="Latest page posts, straight from Facebook">
            Live on Facebook
          </CardTitle>
          <div className="zhu-embed-body">
            <iframe
              title="Facebook page posts"
              src={`https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(facebook)}&tabs=timeline&width=500&height=640&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false`}
              width="100%"
              height="640"
              style={{ border: 0, overflow: 'hidden', maxWidth: 500 }}
              scrolling="no"
              allow="encrypted-media"
              loading="lazy"
            />
          </div>
        </Card>
      )}
    </section>
  );
}

function AccountFields({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  const f = (k: string, label: string, platform: string, placeholder: string) => (
    <label className="zhu-acc">
      <SocialIcon platform={platform} size={18} />
      <input value={value[k] || ''} onChange={(e) => onChange({ ...value, [k]: e.target.value })} placeholder={placeholder} aria-label={label} />
    </label>
  );
  return (
    <div className="zhu-accs">
      {f('instagram_username', 'Instagram handle', 'instagram', '@instagram_handle')}
      {f('tiktok_username', 'TikTok handle', 'tiktok', '@tiktok_handle')}
      {f('facebook_url', 'Facebook page', 'facebook', 'facebook.com/page')}
      {f('linkedin_url', 'LinkedIn company page', 'linkedin', 'linkedin.com/company/name')}
    </div>
  );
}

export default function HuntPage() {
  const demo = useDemoMode();
  const navigate = useNavigate();
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feed, setFeed] = useState<any>(null);
  const [feedLoading, setFeedLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [note, setNote] = useState('');

  const [kind, setKind] = useState<Kind>('all');
  const [source, setSource] = useState<string>('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [sort, setSort] = useState<Sort>('newest');
  const [open, setOpen] = useState<any>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>({ name: '', website_url: '' });
  const [showAccounts, setShowAccounts] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editAccounts, setEditAccounts] = useState<any>(null);
  const [auditing, setAuditing] = useState(false);
  const autoSynced = useRef<Set<string>>(new Set());

  const headers = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  };

  const loadCompetitors = useCallback(async () => {
    if (demo.isActive) {
      setCompetitors(sampleHuntCompetitors);
      setSelectedId((id) => id || sampleHuntCompetitors[0].id);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/v3/competitors', { headers: await headers() });
      const j = await res.json();
      if (j.success) {
        setCompetitors(j.data || []);
        setSelectedId((id) => (id && j.data.some((c: any) => c.id === id) ? id : j.data[0]?.id || null));
        if (!j.data?.length) setShowForm(true);
      }
    } catch (e) {
      console.error('[Hunt] list failed', e);
    } finally {
      setLoading(false);
    }
  }, [demo.isActive]);

  const loadFeed = useCallback(
    async (id: string) => {
      if (demo.isActive) {
        setFeed(sampleHuntContent(id));
        return;
      }
      setFeedLoading(true);
      try {
        const res = await fetch(`/api/v3/competitors/${id}/content`, { headers: await headers() });
        const j = await res.json();
        if (j.success) setFeed(j);
      } finally {
        setFeedLoading(false);
      }
    },
    [demo.isActive],
  );

  const sync = useCallback(
    async (id: string, force: boolean) => {
      if (demo.isActive) {
        setNote('Demo mode uses sample content.');
        return;
      }
      setSyncing(true);
      try {
        const res = await fetch(`/api/v3/competitors/${id}/sync`, { method: 'POST', headers: await headers(), body: JSON.stringify({ force }) });
        const j = await res.json();
        if (!res.ok) setNote(j.error || 'Could not refresh right now.');
        else if (force) setNote(j.skipped === 'fresh' ? 'Already up to date.' : `Updated. ${j.added ?? 0} ads and posts checked.`);
        await Promise.all([loadFeed(id), loadCompetitors()]);
      } catch {
        setNote('Could not refresh right now.');
      } finally {
        setSyncing(false);
      }
    },
    [demo.isActive, loadFeed, loadCompetitors],
  );

  useEffect(() => {
    setLoading(true);
    loadCompetitors();
  }, [demo.isActive]);

  useEffect(() => {
    if (!selectedId) {
      setFeed(null);
      return;
    }
    setFeed(null);
    setSource('');
    loadFeed(selectedId);
  }, [selectedId, loadFeed]);

  // Open a competitor with content older than 6 hours: refresh it in the background
  useEffect(() => {
    if (!feed || demo.isActive || !selectedId || autoSynced.current.has(selectedId)) return;
    const last = feed.competitor?.content_synced_at;
    if (!last || Date.now() - new Date(last).getTime() > 6 * 3600000) {
      autoSynced.current.add(selectedId);
      sync(selectedId, false);
    }
  }, [feed, demo.isActive, selectedId, sync]);

  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => setNote(''), 4000);
    return () => clearTimeout(t);
  }, [note]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (demo.isActive) {
      setNote('Exit demo mode to track your own competitors.');
      return;
    }
    if (!form.name?.trim()) return;
    setAdding(true);
    try {
      const res = await fetch('/api/v3/competitors', { method: 'POST', headers: await headers(), body: JSON.stringify(form) });
      const j = await res.json();
      if (!res.ok || !j.success) {
        setNote(j.message || j.error || 'Could not add this competitor.');
        return;
      }
      setForm({ name: '', website_url: '' });
      setShowForm(false);
      setShowAccounts(false);
      await loadCompetitors();
      setSelectedId(j.data.id);
      autoSynced.current.add(j.data.id);
      sync(j.data.id, true);
    } finally {
      setAdding(false);
    }
  };

  const saveAccounts = async () => {
    if (!selectedId || !editAccounts) return;
    if (demo.isActive) {
      setEditAccounts(null);
      return;
    }
    const res = await fetch(`/api/v3/competitors/${selectedId}`, { method: 'PATCH', headers: await headers(), body: JSON.stringify(editAccounts) });
    if (res.ok) {
      setEditAccounts(null);
      sync(selectedId, true);
    } else setNote('Could not save the accounts.');
  };

  const remove = async () => {
    const comp = competitors.find((c) => c.id === selectedId);
    if (!comp || demo.isActive) return;
    if (!confirm(`Stop tracking ${comp.name}? Its saved ads and posts will be removed.`)) return;
    await fetch(`/api/v3/competitors/${comp.id}`, { method: 'DELETE', headers: await headers() });
    setSelectedId(null);
    loadCompetitors();
  };

  const audit = async () => {
    if (!selectedId || demo.isActive) return;
    setAuditing(true);
    try {
      const res = await fetch(`/api/v3/competitors/${selectedId}/audit`, { method: 'POST', headers: await headers() });
      if (!res.ok) setNote('The website audit failed. Try again later.');
      await loadCompetitors();
    } finally {
      setAuditing(false);
    }
  };

  const askZie = (prompt: string) => navigate('/agent', { state: { prompt } });

  const comp = competitors.find((c) => c.id === selectedId) || null;
  const fc = feed?.competitor || comp;
  const status: Record<string, any> = fc?.content_sync_status || {};
  const items: any[] = feed?.items || [];

  const visible = useMemo(() => {
    let list = items.filter((i) => (kind === 'all' || i.kind === kind) && (!source || i.source === source));
    if (activeOnly) list = list.filter((i) => i.kind !== 'ad' || i.is_active);
    const t = (i: any) => new Date(i.started_at || i.posted_at || 0).getTime();
    if (sort === 'newest') list = [...list].sort((a, b) => t(b) - t(a));
    if (sort === 'running') list = [...list].sort((a, b) => (b.kind === 'ad' ? (b.is_active ? 1e6 : 0) + (runDays(b) || 0) : -1) - (a.kind === 'ad' ? (a.is_active ? 1e6 : 0) + (runDays(a) || 0) : -1));
    if (sort === 'engagement') list = [...list].sort((a, b) => engagement(b) + (b.metrics?.views || 0) / 100 - (engagement(a) + (a.metrics?.views || 0) / 100));
    return list;
  }, [items, kind, source, activeOnly, sort]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const i of items) if (kind === 'all' || i.kind === kind) c[i.source] = (c[i.source] || 0) + 1;
    return c;
  }, [items, kind]);

  const s = feed?.summary;
  const topFormat = s?.ad_formats ? Object.entries(s.ad_formats as Record<string, number>).sort((a, b) => b[1] - a[1])[0]?.[0] : null;
  const accountLinks = fc
    ? [
        fc.website_url && { p: 'web', href: fc.website_url, label: fc.website_url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') },
        fc.instagram_username && { p: 'instagram', href: `https://www.instagram.com/${fc.instagram_username}`, label: `@${fc.instagram_username}` },
        fc.tiktok_username && { p: 'tiktok', href: `https://www.tiktok.com/@${fc.tiktok_username}`, label: `@${fc.tiktok_username}` },
        fc.facebook_url && { p: 'facebook', href: fc.facebook_url, label: 'Facebook' },
        fc.linkedin_url && { p: 'linkedin', href: fc.linkedin_url, label: 'LinkedIn' },
      ].filter(Boolean)
    : [];

  return (
    <V3Layout>
      <PageHeader
        number="07"
        label="Competitor Hunt"
        title="See what your rivals post and promote."
        subtitle="Live ads from the Meta, TikTok and LinkedIn ad libraries plus organic posts from Instagram, Facebook, TikTok and LinkedIn, in their original format."
        actions={
          <Button variant={showForm ? 'secondary' : 'primary'} icon={showForm ? <X /> : <Plus />} onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Close' : 'Track competitor'}
          </Button>
        }
      />

      <PageBody>
        {showForm && (
          <Card className="zhu-add">
            <form onSubmit={add}>
              <div className="zhu-add-row">
                <label className="zhu-field">
                  <Building2 />
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Competitor brand name" aria-label="Competitor name" required />
                </label>
                <label className="zhu-field">
                  <Globe />
                  <input value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} placeholder="competitor.com" aria-label="Website" />
                </label>
                <Button type="submit" loading={adding} icon={<Target />}>
                  Start tracking
                </Button>
              </div>
              <button type="button" className="zhu-more" onClick={() => setShowAccounts((v) => !v)} aria-expanded={showAccounts}>
                <ChevronDown size={14} className={showAccounts ? 'is-open' : ''} /> Social accounts (optional, Zie finds them from the website and the Meta Ad Library)
              </button>
              {showAccounts && <AccountFields value={form} onChange={setForm} />}
            </form>
          </Card>
        )}

        {loading ? (
          <div className="zhu-picker">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={64} width={220} radius={12} />
            ))}
          </div>
        ) : !competitors.length ? (
          <Card>
            <EmptyState
              icon={<Target size={20} />}
              title="No competitors on the radar yet"
              body="Add a brand name and website. Zie finds its social accounts and pulls every live ad and recent post into one feed."
            />
          </Card>
        ) : (
          <>
            {/* Competitor picker */}
            <div className="zhu-picker" role="tablist" aria-label="Tracked competitors">
              {competitors.map((c) => {
                const st = c.content_stats || {};
                return (
                  <button key={c.id} type="button" role="tab" aria-selected={c.id === selectedId} className={`zhu-pick ${c.id === selectedId ? 'is-active' : ''}`} onClick={() => setSelectedId(c.id)}>
                    <span className="zhu-logo">{c.logo_url ? <img src={c.logo_url} alt="" referrerPolicy="no-referrer" /> : (c.name || '?').charAt(0).toUpperCase()}</span>
                    <span className="zhu-pick-text">
                      <strong>{c.name}</strong>
                      <small>
                        {st.active_ads ?? 0} active ads · {st.posts_30d ?? 0} posts in 30d
                      </small>
                    </span>
                    {st.new_7d > 0 && <span className="zhu-pick-new">{st.new_7d} new</span>}
                  </button>
                );
              })}
            </div>

            {fc && (
              <>
                {/* Competitor header */}
                <section className="zhu-head">
                  <span className="zhu-logo is-lg">{fc.logo_url ? <img src={fc.logo_url} alt="" referrerPolicy="no-referrer" /> : (fc.name || '?').charAt(0).toUpperCase()}</span>
                  <div className="zhu-head-text">
                    <h2>{fc.name}</h2>
                    <div className="zhu-links">
                      {accountLinks.map((l: any) => (
                        <a key={l.p} href={l.href} target="_blank" rel="noreferrer">
                          {l.p === 'web' ? <Globe size={14} /> : <SocialIcon platform={l.p} size={16} />}
                          {l.label}
                        </a>
                      ))}
                      <button type="button" className="zhu-link-edit" onClick={() => setEditAccounts({ instagram_username: fc.instagram_username || '', tiktok_username: fc.tiktok_username || '', facebook_url: fc.facebook_url || '', linkedin_url: fc.linkedin_url || '' })}>
                        <Pencil size={12} /> Edit accounts
                      </button>
                    </div>
                  </div>
                  <div className="zhu-head-actions">
                    <span className="zhu-updated">{syncing ? 'Collecting live content' : `Updated ${ago(fc.content_synced_at)}`}</span>
                    <Button variant="secondary" size="sm" icon={<RefreshCw />} loading={syncing} onClick={() => selectedId && sync(selectedId, true)}>
                      Refresh
                    </Button>
                    <Button
                      variant="soft"
                      size="sm"
                      icon={<ZIcon name="analyze" />}
                      onClick={() => askZie(`Analyze ${fc.name}'s live ads and recent posts: which angles, offers, hooks and formats do they repeat, which ads have run the longest, how often do they post, and what should I test to compete? Give me 3 concrete content ideas.`)}
                    >
                      Analyze with Zie
                    </Button>
                    <button type="button" className="zd-icon-btn" onClick={remove} aria-label={`Stop tracking ${fc.name}`} title="Stop tracking">
                      <Trash2 />
                    </button>
                  </div>
                  {note && <p className="zhu-note">{note}</p>}
                </section>

                {editAccounts && (
                  <Card className="zhu-edit">
                    <CardTitle sub="Zie uses these to pull organic posts. Ads are matched by brand name.">Social accounts</CardTitle>
                    <AccountFields value={editAccounts} onChange={setEditAccounts} />
                    <div className="zhu-edit-actions">
                      <Button variant="ghost" size="sm" onClick={() => setEditAccounts(null)}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={saveAccounts}>
                        Save and refresh
                      </Button>
                    </div>
                  </Card>
                )}

                {!demo.isActive && feed?.setup && !feed.setup.provider && !feed.setup.discovery && !feed.setup.official_ads && !feed.setup.collector_at && !items.length && (
                  <div className="zhu-banner">
                    <Info size={16} />
                    <span>Ads and posts show up here after the next collection run. Meanwhile the live profiles below come straight from TikTok and Facebook.</span>
                  </div>
                )}

                {/* Summary */}
                {s && (
                  <section className="zhu-stats" aria-label="Summary">
                    <div>
                      <small>Active ads</small>
                      <strong>{s.active_ads}</strong>
                      <span>{s.ads_total} ads found in total</span>
                    </div>
                    <div>
                      <small>New ads, last 7 days</small>
                      <strong>{s.new_ads_7d}</strong>
                      <span>{s.new_ads_7d ? 'They are testing new creative' : 'No new creative this week'}</span>
                    </div>
                    <div>
                      <small>Longest running ad</small>
                      <strong>{s.longest_running ? `${s.longest_running.run_days} days` : 'None yet'}</strong>
                      <span>Long runners are usually winners</span>
                    </div>
                    <div>
                      <small>Organic posts</small>
                      <strong>{s.posts_per_week}/wk</strong>
                      <span>{s.posts_30d} posts in the last 30 days</span>
                    </div>
                    <div>
                      <small>Main ad format</small>
                      <strong className="zhu-cap">{topFormat || 'None yet'}</strong>
                      <span>Among active ads</span>
                    </div>
                  </section>
                )}

                {/* Filters */}
                <div className="zhu-filters">
                  <div className="zhu-filter-row">
                  <SegTabs
                    size="sm"
                    tabs={[
                      { id: 'all', label: `All ${items.length ? items.length : ''}`.trim() },
                      { id: 'ad', label: 'Ads' },
                      { id: 'organic', label: 'Organic posts' },
                    ]}
                    value={kind}
                    onChange={(v) => {
                      setKind(v as Kind);
                      setSource('');
                    }}
                  />
                  <div className="zhu-filter-right">
                    {kind !== 'organic' && (
                      <label className="zhu-toggle">
                        <input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} /> Active ads only
                      </label>
                    )}
                    <select className="zhu-sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort">
                      <option value="newest">Newest first</option>
                      <option value="running">Longest running ads</option>
                      <option value="engagement">Most engagement</option>
                    </select>
                  </div>
                  </div>
                  <div className="zhu-src-chips">
                    {SOURCES.filter((x) => kind === 'all' || x.kind === kind).map((x) => {
                      const st = status[x.id];
                      const n = counts[x.id] || 0;
                      const dot = st?.ok ? 'is-ok' : st?.error ? 'is-err' : 'is-off';
                      return (
                        <button
                          key={x.id}
                          type="button"
                          className={`zhu-src ${source === x.id ? 'is-active' : ''}`}
                          onClick={() => setSource(source === x.id ? '' : x.id)}
                          title={st?.error ? `Could not load: ${st.error}` : st?.skipped || (st?.at ? `Checked ${ago(st.at)}` : 'Not checked yet')}
                        >
                          <SocialIcon platform={x.icon} size={14} variant="mark" />
                          {x.label}
                          <b>{n}</b>
                          <i className={dot} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Missing account hints */}
                {(() => {
                  const missing = SOURCES.filter((x) => (kind === 'all' || x.kind === kind) && (!source || x.id === source) && status[x.id]?.skipped);
                  const tiktokAdsEmpty = (kind !== 'organic' && (!source || source === 'tiktok_ads')) && status.tiktok_ads?.ok && !counts.tiktok_ads;
                  if (!missing.length && !tiktokAdsEmpty) return null;
                  return (
                    <div className="zhu-hints">
                      {missing.map((x) => (
                        <span key={x.id}>
                          <SocialIcon platform={x.icon} size={14} variant="mark" /> {x.label}: {status[x.id].skipped}
                        </span>
                      ))}
                      {tiktokAdsEmpty && (
                        <span>
                          <SocialIcon platform="tiktok" size={14} variant="mark" /> TikTok only publishes ads shown in Europe.{' '}
                          <a href={CREATIVE_CENTER} target="_blank" rel="noreferrer">
                            See top ads in your region on TikTok Creative Center
                          </a>
                        </span>
                      )}
                    </div>
                  );
                })()}

                {/* Feed */}
                {feedLoading && !feed ? (
                  <div className="zhu-feed">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="zhu-item">
                        <Skeleton height={i % 3 === 0 ? 300 : 220} radius={0} />
                        <div className="zhu-item-body">
                          <Skeleton height={12} width="70%" />
                          <Skeleton height={10} width="90%" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : visible.length ? (
                  <div className="zhu-feed">
                    {visible.map((it, i) => (
                      <ContentCard
                        key={it.id}
                        item={it}
                        index={i}
                        onOpen={() => setOpen(it)}
                        highlight={s?.longest_running?.id === it.id ? 'Longest running' : s?.top_post === it.id ? 'Top post' : undefined}
                      />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <div className="zhu-empty">
                      <ZieAvatar size={48} active={syncing} />
                      <div>
                        <strong>{syncing ? 'Zie is collecting live ads and posts' : 'Nothing here yet'}</strong>
                        <p>
                          {syncing
                            ? 'Checking the Meta, TikTok and LinkedIn ad libraries and the brand accounts. This takes up to a minute.'
                            : source || kind !== 'all'
                              ? 'No content for this filter. Try another platform or show all.'
                              : 'Saved ads and posts appear after the next collection run. Add the brand accounts with Edit accounts so Zie knows where to look.'}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Official live embeds: always current, loaded by the viewer's browser */}
                {kind !== 'ad' && (!source || source === 'tiktok' || source === 'facebook') && (
                  <LiveEmbeds tiktok={!counts.tiktok && (!source || source === 'tiktok') ? fc.tiktok_username : null} facebook={!counts.facebook && (!source || source === 'facebook') ? fc.facebook_url : null} />
                )}

                {/* Website audit (secondary) */}
                <Card className="zhu-audit">
                  <CardTitle
                    icon={<ZIcon name="audit" />}
                    sub={fc.website_url ? (fc.last_audited_at ? `Last audited ${ago(fc.last_audited_at)}` : 'Checks the landing page ads send people to') : 'Add a website to audit it'}
                    action={
                      fc.website_url ? (
                        <Button size="sm" variant="secondary" loading={auditing} onClick={audit}>
                          {fc.audit_score != null ? 'Audit again' : 'Audit website'}
                        </Button>
                      ) : undefined
                    }
                  >
                    Website readiness {fc.audit_score != null && <span className="zhu-score">{fc.audit_score}/100</span>}
                  </CardTitle>
                  {fc.audit_report?.findings?.length > 0 && (
                    <ul className="zhu-findings">
                      {fc.audit_report.findings.slice(0, 3).map((f: any, i: number) => (
                        <li key={i}>{typeof f === 'string' ? f : f.title || f.recommendation}</li>
                      ))}
                    </ul>
                  )}
                </Card>
              </>
            )}
          </>
        )}
      </PageBody>

      {open && <ContentModal item={open} onClose={() => setOpen(null)} onAsk={askZie} />}
    </V3Layout>
  );
}
