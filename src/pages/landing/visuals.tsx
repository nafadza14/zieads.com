/*
  Animated product visuals for the landing page.
  Every visual is coded UI (no stock photos), built from the same pieces as the
  real ZieAds dashboard, and animates only while it is on screen.
*/
import { CSSProperties, ReactNode, useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Bell,
  Bot,
  Calendar,
  Check,
  Clock,
  Eye,
  FileSpreadsheet,
  Inbox,

  MessageCircle,
  MousePointer2,
  PenLine,
  Radar,
  Rocket,
  Search,
  Send,
  ShieldCheck,
  
  TrendingDown,
  TrendingUp,
  Users,
  Briefcase,
  BatteryLow,
} from 'lucide-react';
import ZIcon from '../../components/icons/ZIcon';
import ZieAvatar from '../../components/ZieAvatar';
import SocialIcon from '../../components/v3/SocialIcon';
import ZieAdsLogo from '../../components/ZieAdsLogo';
import NounGlyph from './NounGlyph';
import { CountUp, useInView } from './ui';

/* ── helpers ─────────────────────────────────────────────── */

const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Cycles through phases (durations in ms) while `active`; returns the current phase index. */
function usePhases(active: boolean, durations: number[]) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (reduced()) {
      setPhase(durations.length - 1);
      return;
    }
    const t = setTimeout(() => setPhase((p) => (p + 1) % durations.length), durations[phase]);
    return () => clearTimeout(t);
  }, [active, phase, durations]);
  return phase;
}

/** Types `text` out while active; restarts when `runKey` changes. */
function useTypewriter(text: string, active: boolean, speed = 28, runKey: unknown = 0) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
  }, [text, runKey]);
  useEffect(() => {
    if (!active) return;
    if (reduced()) {
      setN(text.length);
      return;
    }
    if (n >= text.length) return;
    const t = setTimeout(() => setN((x) => x + 1), speed);
    return () => clearTimeout(t);
  }, [active, n, text, speed]);
  return text.slice(0, n);
}

/** Rotates through `items` every `ms` while active. */
function useRotate(len: number, active: boolean, ms: number) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!active || reduced() || len < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % len), ms);
    return () => clearInterval(t);
  }, [active, len, ms]);
  return i;
}

/* ── frame ───────────────────────────────────────────────── */

/** Card frame for all visuals: same reveal as the old image cards, soft branded backdrop. */
export function VisualCard({
  tone = 'warm',
  ratio = '4 / 3',
  className = '',
  children,
  style,
}: {
  tone?: 'warm' | 'gray' | 'dark' | 'white';
  ratio?: string;
  className?: string;
  children: (inView: boolean) => ReactNode;
  style?: CSSProperties;
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0.15);
  return (
    <div
      ref={ref}
      className={`zv-card zv-${tone} ${inView ? 'is-in' : ''} ${className}`}
      style={{ aspectRatio: ratio, ...style }}
    >
      <div className="zv-grid-bg" aria-hidden="true" />
      <div className="zv-glow" aria-hidden="true" />
      <div className="zv-stage">{children(inView)}</div>
    </div>
  );
}

function Window({ title, children, className = '' }: { title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`zv-window ${className}`}>
      <div className="zv-window-bar">
        <span />
        <span />
        <span />
        {title && <div className="zv-window-title">{title}</div>}
      </div>
      <div className="zv-window-body">{children}</div>
    </div>
  );
}

function AgentDot({ size = 28, active = false }: { size?: number; active?: boolean }) {
  return (
    <span className={`zv-orb ${active ? 'is-active' : ''}`} style={{ width: size, height: size }}>
      <span>
        <ZieAvatar size={size - 4} ring={false} />
      </span>
    </span>
  );
}

/* ── 01 Free audit ───────────────────────────────────────── */

const AUDIT_DIMS = [
  { name: 'Creative & Offer', v: 55 },
  { name: 'Audience Clarity', v: 70 },
  { name: 'Landing Page', v: 48 },
  { name: 'Platform Fit', v: 65 },
  { name: 'Funnel Coverage', v: 60 },
  { name: 'Competitive', v: 55 },
];

export function AuditScanVisual() {
  return (
    <VisualCard tone="warm" ratio="4 / 5" className="zv-audit">
      {(inView) => <AuditScanInner active={inView} />}
    </VisualCard>
  );
}
function AuditScanInner({ active }: { active: boolean }) {
  // 0 typing · 1 scanning · 2 scoring · 3 hold
  const phase = usePhases(active, [1700, 2200, 2600, 3200]);
  const typed = useTypewriter('yourbrand.com', active && phase === 0, 75, phase === 0);
  const url = phase === 0 ? typed : 'yourbrand.com';
  return (
    <div className="zv-audit-wrap">
      <Window
        title={
          <span className="zv-url">
            <Search size={11} /> {url}
            {phase === 0 && <i className="zv-caret" />}
          </span>
        }
      >
        <div className={`zv-site ${phase >= 1 ? 'is-scanning' : ''}`}>
          <div className="zv-site-nav" />
          <div className="zv-site-hero">
            <div className="zv-site-line w70" />
            <div className="zv-site-line w50" />
            <div className="zv-site-btn" />
          </div>
          <div className="zv-site-cols">
            <div />
            <div />
            <div />
          </div>
          {phase === 1 && <div className="zv-scanline" />}
          {phase >= 1 && (
            <>
              <span className="zv-flag" style={{ top: '18%', left: '58%' }}>
                <AlertTriangle size={10} /> No pixel
              </span>
              <span className="zv-flag" style={{ top: '58%', left: '8%', animationDelay: '0.5s' }}>
                <AlertTriangle size={10} /> CTA below fold
              </span>
            </>
          )}
        </div>
      </Window>

      <div className={`zv-score-panel ${phase >= 2 ? 'is-on' : ''}`}>
        <div className="zv-score-head">
          <div className="zv-ring" style={{ ['--p' as string]: phase >= 2 ? 61 : 0 }}>
            <span>{phase >= 2 ? <CountUp to={61} duration={1400} /> : 0}</span>
          </div>
          <div>
            <strong>Readiness score</strong>
            <small>C · Structural gaps present</small>
          </div>
        </div>
        <div className="zv-dims">
          {AUDIT_DIMS.map((d, i) => (
            <div key={d.name} className="zv-dim">
              <span>{d.name}</span>
              <div className="zv-track">
                <div style={{ width: phase >= 2 ? `${d.v}%` : '0%', transitionDelay: `${i * 120}ms` }} />
              </div>
              <em className="mono-num">{phase >= 2 ? d.v : ''}</em>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AuditFindingsVisual() {
  const items = [
    { sev: 'Critical', t: 'No Meta Pixel on checkout', tone: 'bad' },
    { sev: 'High', t: 'Offer hidden on mobile', tone: 'warn' },
    { sev: 'High', t: 'No retargeting audience', tone: 'warn' },
  ];
  return (
    <VisualCard tone="gray" ratio="16 / 10" className="zv-findings">
      {(inView) => (
        <div className="zv-stack">
          <div className="zv-eyebrow">Top gaps found</div>
          {items.map((it, i) => (
            <div key={it.t} className={`zv-row zv-pop ${inView ? 'is-on' : ''}`} style={{ transitionDelay: `${300 + i * 180}ms` }}>
              <em className={`zv-tag zv-tag-${it.tone}`}>{it.sev}</em>
              <span>{it.t}</span>
            </div>
          ))}
        </div>
      )}
    </VisualCard>
  );
}

/* ── 02 AI Analyst briefing ──────────────────────────────── */

const BRIEF_ROWS = [
  { icon: <TrendingUp size={13} />, tone: 'good', t: 'Tuesday Reel reach', v: '+18%' },
  { icon: <TrendingDown size={13} />, tone: 'bad', t: 'Meta CPC on ad set 3', v: '+22%' },
  { icon: <ZIcon name="action" size={13} />, tone: 'accent', t: 'Boost the Reel, pause ad set 3', v: 'Action' },
];

export function BriefingVisual() {
  return (
    <VisualCard tone="warm" ratio="16 / 11" className="zv-briefing">
      {(inView) => <BriefingInner active={inView} />}
    </VisualCard>
  );
}
function BriefingInner({ active }: { active: boolean }) {
  const phase = usePhases(active, [600, 2600, 2400, 4200]);
  const headline = useTypewriter('Your Reels are winning. Meta costs are creeping up.', active && phase >= 1, 26, phase === 0);
  return (
    <div className="zv-brief">
      <div className="zv-brief-top">
        <AgentDot size={34} active={phase === 1} />
        <div>
          <div className="zv-eyebrow zv-accent">Morning briefing · 07:00</div>
          <div className="zv-brief-brand">Acme Coffee Co</div>
        </div>
        <span className="zv-live-pill">
          <i /> Live
        </span>
      </div>
      <div className="zv-brief-h">
        {phase === 0 ? '' : headline}
        {phase === 1 && <i className="zv-caret" />}
      </div>
      <div className="zv-brief-rows">
        {BRIEF_ROWS.map((r, i) => (
          <div
            key={r.t}
            className={`zv-row zv-pop ${phase >= 2 ? 'is-on' : ''}`}
            style={{ transitionDelay: `${i * 220}ms` }}
          >
            <span className={`zv-ico zv-ico-${r.tone}`}>{r.icon}</span>
            <span className="zv-row-t">{r.t}</span>
            <em className={`zv-tag zv-tag-${r.tone}`}>{r.v}</em>
          </div>
        ))}
      </div>
    </div>
  );
}

export function NotifyVisual() {
  return (
    <VisualCard tone="dark" ratio="4 / 3" className="zv-notify">
      {(inView) => (
        <div className="zv-notify-wrap">
          <div className="zv-clock">07:00</div>
          <div className="zv-clock-sub">Tuesday</div>
          <div className={`zv-toast ${inView ? 'is-on' : ''}`}>
            <span className="zv-bell">
              <Bell size={14} />
            </span>
            <div>
              <strong>ZieAds</strong>
              <span>Your daily briefing is ready</span>
            </div>
          </div>
        </div>
      )}
    </VisualCard>
  );
}

/* Feature tiles for the six briefing cards */
const TILE_ICONS: Record<string, { noun: string; icon: ReactNode }> = {
  'Daily Diagnosis': { noun: 'diagnosis', icon: <Activity size={26} /> },
  'ROAS Drop Analysis': { noun: 'roas', icon: <TrendingDown size={26} /> },
  'Creative Fatigue Alerts': { noun: 'fatigue', icon: <BatteryLow size={26} /> },
  'Smart Scheduling': { noun: 'scheduling', icon: <Clock size={26} /> },
  'Competitor Hunt': { noun: 'competitor', icon: <Radar size={26} /> },
  'Unified Inbox': { noun: 'unified', icon: <MessageCircle size={26} /> },
};

export function FeatureTile({ name }: { name: string }) {
  const t = TILE_ICONS[name] || { noun: name, icon: <ZIcon name="feature" size={26} /> };
  return (
    <VisualCard tone="gray" ratio="16 / 10" className="zv-tile">
      {(inView) => (
        <div className={`zv-tile-inner zv-tile-${t.noun} ${inView ? 'is-on' : ''}`}>
          <TileMotion kind={t.noun} />
          <span className="zv-tile-icon">
            <NounGlyph name={t.noun} fallback={t.icon} size={28} />
          </span>
        </div>
      )}
    </VisualCard>
  );
}

function TileMotion({ kind }: { kind: string }) {
  switch (kind) {
    case 'diagnosis':
      return (
        <svg className="zv-tm zv-pulse-line" viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 30 H60 L72 10 L86 52 L100 18 L110 30 H200" />
        </svg>
      );
    case 'roas':
      return (
        <svg className="zv-tm zv-drop-line" viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 12 C40 10 60 14 90 20 S150 46 200 50" />
        </svg>
      );
    case 'fatigue':
      return (
        <div className="zv-tm zv-meter" aria-hidden="true">
          <div />
        </div>
      );
    case 'scheduling':
      return (
        <div className="zv-tm zv-week" aria-hidden="true">
          {['M', 'T', 'W', 'T', 'F'].map((d, i) => (
            <span key={i} style={{ animationDelay: `${i * 0.25}s` }}>
              {d}
            </span>
          ))}
        </div>
      );
    case 'competitor':
      return <div className="zv-tm zv-mini-radar" aria-hidden="true" />;
    case 'unified':
      return (
        <div className="zv-tm zv-bubbles" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
      );
    default:
      return null;
  }
}

/* ── 03 Composer & calendar ──────────────────────────────── */

const PLATFORM_COPY = [
  { p: 'instagram', name: 'Instagram', cap: 'New cold brew just dropped. Smooth, bold, made for slow mornings. #coldbrew', time: 'Tue 5:45 PM' },
  { p: 'tiktok', name: 'TikTok', cap: 'POV: your first sip of the new cold brew', time: 'Wed 7:10 PM' },
  { p: 'linkedin', name: 'LinkedIn', cap: 'How we cut brew time by 30% without losing flavor. A short breakdown.', time: 'Thu 8:30 AM' },
  { p: 'facebook', name: 'Facebook', cap: 'Which flavor should we launch next? Vote in the comments.', time: 'Fri 12:15 PM' },
];

export function ComposerVisual() {
  return (
    <VisualCard tone="warm" ratio="5 / 4" className="zv-composer">
      {(inView) => <ComposerInner active={inView} />}
    </VisualCard>
  );
}
function ComposerInner({ active }: { active: boolean }) {
  const idx = useRotate(PLATFORM_COPY.length, active, 3600);
  const cur = PLATFORM_COPY[idx];
  const cap = useTypewriter(cur.cap, active, 22, idx);
  return (
    <div className="zv-compose">
      <div className="zv-week-strip">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => {
          const filled = PLATFORM_COPY.findIndex((p) => p.time.startsWith(d.slice(0, 3))) ;
          const show = filled > -1 && filled <= idx;
          return (
            <div key={d} className={`zv-day ${filled === idx ? 'is-now' : ''}`}>
              <span>{d}</span>
              {show && (
                <em className="zv-day-chip" key={`${d}-${idx >= filled}`}>
                  <SocialIcon platform={PLATFORM_COPY[filled].p} size={12} />
                </em>
              )}
              {i === 5 && <em className="zv-day-chip is-ghost" />}
            </div>
          );
        })}
      </div>

      <div className="zv-compose-card">
        <div className="zv-compose-tabs">
          {PLATFORM_COPY.map((p, i) => (
            <span key={p.p} className={`zv-ptab ${i === idx ? 'is-active' : ''}`}>
              <SocialIcon platform={p.p} size={13} /> {p.name}
            </span>
          ))}
        </div>
        <div className="zv-compose-body">
          <div className="zv-media" />
          <p>
            {cap}
            <i className="zv-caret" />
          </p>
        </div>
        <div className="zv-compose-foot">
          <span>
            <Clock size={12} /> Best time for your audience: <strong>{cur.time}</strong>
          </span>
          <span className="zv-approve" key={idx}>
            <Check size={12} /> Approve
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── 04 Analytics ────────────────────────────────────────── */

export function ChartVisual() {
  return (
    <VisualCard tone="white" ratio="4 / 3" className="zv-chart">
      {(inView) => (
        <div className={`zv-chart-wrap ${inView ? 'is-on' : ''}`}>
          <div className="zv-kpis">
            <div className="zv-kpi">
              <small>Engagement</small>
              <strong>{inView ? <CountUp to={18.4} decimals={1} prefix="+" suffix="%" /> : '+0%'}</strong>
            </div>
            <div className="zv-kpi">
              <small>Reach</small>
              <strong>{inView ? <CountUp to={3.2} decimals={1} suffix="x" /> : '0x'}</strong>
            </div>
            <div className="zv-kpi is-accent">
              <small>Best window</small>
              <strong>Tue 17:45</strong>
            </div>
          </div>
          <svg className="zv-line-chart" viewBox="0 0 400 180" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="zvArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#F26522" stopOpacity="0.28" />
                <stop offset="1" stopColor="#F26522" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[40, 80, 120, 160].map((y) => (
              <line key={y} x1="0" x2="400" y1={y} y2={y} className="zv-gridline" />
            ))}
            <path className="zv-area" d="M0 150 C40 140 60 120 100 118 S160 130 200 96 S270 70 300 60 S360 30 400 22 V180 H0 Z" />
            <path className="zv-paid" d="M0 120 C50 118 80 126 120 122 S200 112 240 116 S330 108 400 104" />
            <path className="zv-organic" d="M0 150 C40 140 60 120 100 118 S160 130 200 96 S270 70 300 60 S360 30 400 22" />
            <circle className="zv-dot" cx="400" cy="22" r="5" />
          </svg>
          <div className="zv-legend">
            <span>
              <i className="is-accent" /> Organic
            </span>
            <span>
              <i /> Paid
            </span>
          </div>
        </div>
      )}
    </VisualCard>
  );
}

export function ScoreVisual({ dims }: { dims: { name: string; value: number }[] }) {
  return (
    <VisualCard tone="dark" ratio="4 / 3" className="zv-score">
      {(inView) => (
        <div className="zv-score-wrap">
          <div className="zv-eyebrow zv-on-dark">Readiness by dimension</div>
          {dims.map((d, i) => (
            <div key={d.name} className="zv-dim zv-dim-dark">
              <span>{d.name}</span>
              <div className="zv-track">
                <div style={{ width: inView ? `${d.value}%` : '0%', transitionDelay: `${200 + i * 110}ms` }} />
              </div>
              <em className="mono-num">{d.value}</em>
            </div>
          ))}
          <div className={`zv-insight ${inView ? 'is-on' : ''}`}>
            <ZIcon name="insight" size={13} /> Fix the landing page first. It is costing you the most.
          </div>
        </div>
      )}
    </VisualCard>
  );
}

/* ── 05 Inbox & competitor hunt ──────────────────────────── */

const COMMENTS = [
  { who: 'maya.studio', p: 'instagram', text: 'Do you ship to Jakarta?', tag: 'Buying signal', tone: 'accent' },
  { who: 'ryan_k', p: 'tiktok', text: 'Ordering the new drop today!', tag: 'Positive', tone: 'good' },
  { who: 'dina.w', p: 'facebook', text: 'Still waiting on my refund', tag: 'Needs reply', tone: 'warn' },
  { who: 'joel.b', p: 'linkedin', text: 'Would love a wholesale price list', tag: 'Buying signal', tone: 'accent' },
  { who: 'sari.k', p: 'instagram', text: 'Best cold brew in town', tag: 'Positive', tone: 'good' },
];

export function InboxVisual() {
  return (
    <VisualCard tone="warm" ratio="4 / 3" className="zv-inbox">
      {(inView) => <InboxInner active={inView} />}
    </VisualCard>
  );
}
function InboxInner({ active }: { active: boolean }) {
  const tick = useRotate(COMMENTS.length, active, 2200);
  const list = [0, 1, 2, 3].map((k) => COMMENTS[(tick - k + COMMENTS.length * 4) % COMMENTS.length]);
  return (
    <Window title="Unified inbox" className="zv-inbox-win">
      <div className="zv-inbox-list">
        {list.map((c, i) => (
          <div key={`${c.who}-${tick - i}`} className={`zv-msg ${i === 0 ? 'is-new' : ''}`}>
            <span className="zv-avatar">
              {c.who[0].toUpperCase()}
              <span className="zv-avatar-badge">
                <SocialIcon platform={c.p} size={10} />
              </span>
            </span>
            <div className="zv-msg-text">
              <strong>@{c.who}</strong>
              <span>{c.text}</span>
            </div>
            <em className={`zv-tag zv-tag-${c.tone}`}>{c.tag}</em>
          </div>
        ))}
      </div>
    </Window>
  );
}

const RIVALS = [
  { n: 'B', top: '26%', left: '64%', label: 'Brewline posted 3 Reels', d: '0s' },
  { n: 'K', top: '62%', left: '30%', label: 'Kopi Co started a giveaway', d: '1.1s' },
  { n: 'R', top: '40%', left: '22%', label: 'Roastery cut prices 10%', d: '2.2s' },
];

export function RadarVisual() {
  return (
    <VisualCard tone="dark" ratio="4 / 3" className="zv-radar">
      {(inView) => <RadarInner active={inView} />}
    </VisualCard>
  );
}
function RadarInner({ active }: { active: boolean }) {
  const i = useRotate(RIVALS.length, active, 2600);
  return (
    <div className="zv-radar-wrap">
      <div className="zv-radar-disc">
        <span className="zv-sweep" />
        <span className="zv-ring r1" />
        <span className="zv-ring r2" />
        <span className="zv-ring r3" />
        {RIVALS.map((r, k) => (
          <span key={r.n} className={`zv-blip ${k === i ? 'is-hot' : ''}`} style={{ top: r.top, left: r.left, animationDelay: r.d }}>
            {r.n}
          </span>
        ))}
      </div>
      <div className="zv-radar-feed" key={i}>
        <Eye size={13} /> {RIVALS[i].label}
      </div>
    </div>
  );
}

/* ── 06 Consolidation ────────────────────────────────────── */

const TOOLS = [
  { k: 'scheduler', icon: <Calendar size={18} />, label: 'Scheduler' },
  { k: 'dashboard', icon: <BarChart3 size={18} />, label: 'Analytics' },
  { k: 'spreadsheet', icon: <FileSpreadsheet size={18} />, label: 'Spreadsheet' },
  { k: 'chatbot', icon: <Bot size={18} />, label: 'Chatbot' },
  { k: 'tracker', icon: <Radar size={18} />, label: 'Tracker' },
  { k: 'inbox', icon: <Inbox size={18} />, label: 'Inbox' },
];

export function ConsolidateVisual() {
  return (
    <VisualCard tone="warm" ratio="1 / 1" className="zv-consolidate">
      {(inView) => <ConsolidateInner active={inView} />}
    </VisualCard>
  );
}
function ConsolidateInner({ active }: { active: boolean }) {
  // 0 tools scattered · 1 pulled into the agent · 2 agent holds
  const phase = usePhases(active, [2200, 1400, 2800]);
  return (
    <div className={`zv-orbit phase-${phase}`}>
      <div className="zv-orbit-ring" />
      {TOOLS.map((t, i) => {
        const a = (i / TOOLS.length) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(a) * 38;
        const y = Math.sin(a) * 38;
        return (
          <span
            key={t.k}
            className="zv-tool"
            style={{ ['--x' as string]: `${x}%`, ['--y' as string]: `${y}%`, transitionDelay: `${i * 70}ms` }}
          >
            <NounGlyph name={t.k} fallback={t.icon} size={18} />
            <small>{t.label}</small>
          </span>
        );
      })}
      <div className="zv-core">
        <ZieAdsLogo size={44} />
      </div>
      <div className="zv-core-label">{phase === 0 ? '6 separate tools' : '1 AI marketing agent'}</div>
    </div>
  );
}

/* ── 07 Approval flow ────────────────────────────────────── */

export function ApprovalVisual() {
  return (
    <VisualCard tone="warm" ratio="16 / 10" className="zv-approval">
      {(inView) => <ApprovalInner active={inView} />}
    </VisualCard>
  );
}
function ApprovalInner({ active }: { active: boolean }) {
  // 0 drafting · 1 cursor approves · 2 published · 3 hold
  const phase = usePhases(active, [1800, 1500, 1800, 1600]);
  const steps = [
    { k: 'draft', icon: <PenLine size={16} />, t: 'Agent drafts', s: 'Post + boost plan' },
    { k: 'approve', icon: <ShieldCheck size={16} />, t: 'You approve', s: 'Nothing runs without you' },
    { k: 'publish', icon: <Send size={16} />, t: 'Agent executes', s: 'Published on schedule' },
  ];
  return (
    <div className="zv-flow">
      <div className="zv-flow-track">
        <div className="zv-flow-fill" style={{ width: `${Math.min(phase, 2) * 50}%` }} />
      </div>
      <div className="zv-flow-steps">
        {steps.map((s, i) => (
          <div key={s.k} className={`zv-step ${phase >= i ? 'is-done' : ''} ${phase === i ? 'is-now' : ''}`}>
            <span className="zv-step-ico">{phase > i ? <Check size={16} /> : <NounGlyph name={s.k} fallback={s.icon} size={16} />}</span>
            <strong>{s.t}</strong>
            <small>{s.s}</small>
          </div>
        ))}
      </div>
      <div className={`zv-approve-card ${phase >= 1 ? 'is-approved' : ''}`}>
        <div>
          <span className="zv-eyebrow">Proposed by your agent</span>
          <p>Boost the Tuesday Reel with $40 for 3 days</p>
        </div>
        <span className="zv-approve-btn">
          {phase >= 1 ? (
            <>
              <Check size={13} /> Approved
            </>
          ) : (
            'Approve'
          )}
        </span>
        {phase === 1 && (
          <span className="zv-cursor">
            <MousePointer2 size={18} />
          </span>
        )}
      </div>
    </div>
  );
}

/* ── 08 Testimonials result visuals ──────────────────────── */

export function ResultVisual({ kind, result }: { kind: 'hours' | 'posts' | 'reporting'; result: string }) {
  return (
    <VisualCard tone={kind === 'posts' ? 'warm' : 'gray'} ratio="4 / 3" className={`zv-result zv-result-${kind}`}>
      {(inView) => (
        <div className={`zv-result-wrap ${inView ? 'is-on' : ''}`}>
          {kind === 'hours' && (
            <div className="zv-bars-cmp">
              <div>
                <div className="zv-bar-v is-before" style={{ height: inView ? '86%' : '0%' }} />
                <small>Before</small>
              </div>
              <div>
                <div className="zv-bar-v is-after" style={{ height: inView ? '22%' : '0%' }} />
                <small>With ZieAds</small>
              </div>
            </div>
          )}
          {kind === 'posts' && (
            <div className="zv-post-grid">
              {[0, 1, 2].map((i) => (
                <div key={i} className={`zv-post ${i < 2 ? 'is-win' : ''}`} style={{ transitionDelay: `${300 + i * 200}ms` }}>
                  {i < 2 && (
                    <em>
                      <ArrowUpRight size={11} /> Top
                    </em>
                  )}
                </div>
              ))}
            </div>
          )}
          {kind === 'reporting' && (
            <div className="zv-clients">
              {['Brand A', 'Brand B', 'Brand C', 'Brand D', 'Brand E', 'Brand F'].map((c, i) => (
                <div key={c} className="zv-client" style={{ transitionDelay: `${200 + i * 90}ms` }}>
                  <i className={i === 2 ? 'is-warn' : ''} />
                  {c}
                </div>
              ))}
            </div>
          )}
          <div className="zv-result-chip">{result}</div>
        </div>
      )}
    </VisualCard>
  );
}

/* ── 09 Personas ─────────────────────────────────────────── */

export function PersonaVisual({ kind }: { kind: 'founder' | 'freelancer' | 'agency' }) {
  return (
    <VisualCard tone={kind === 'freelancer' ? 'warm' : 'gray'} ratio="4 / 3" className={`zv-persona zv-persona-${kind}`}>
      {(inView) => <PersonaInner kind={kind} active={inView} />}
    </VisualCard>
  );
}
function PersonaInner({ kind, active }: { kind: 'founder' | 'freelancer' | 'agency'; active: boolean }) {
  const i = useRotate(3, active && kind === 'freelancer', 2000);
  if (kind === 'founder') {
    return (
      <div className="zv-persona-stage">
        <span className="zv-big-ico">
          <NounGlyph name="founder" fallback={<Rocket size={30} />} size={30} />
        </span>
        <div className={`zv-mini-toast ${active ? 'is-on' : ''}`}>
          <AgentDot size={22} /> 3 actions for today
        </div>
      </div>
    );
  }
  if (kind === 'freelancer') {
    const clients = ['Kopi Co', 'Glow Lab', 'FitBox'];
    return (
      <div className="zv-persona-stage">
        <span className="zv-big-ico">
          <NounGlyph name="freelancer" fallback={<Briefcase size={30} />} size={30} />
        </span>
        <div className="zv-switcher">
          {clients.map((c, k) => (
            <span key={c} className={k === i ? 'is-active' : ''}>
              {c}
            </span>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="zv-persona-stage">
      <span className="zv-big-ico">
        <NounGlyph name="agency" fallback={<Users size={30} />} size={30} />
      </span>
      <div className={`zv-brand-grid ${active ? 'is-on' : ''}`}>
        {Array.from({ length: 8 }).map((_, k) => (
          <span key={k} style={{ transitionDelay: `${k * 70}ms` }}>
            <i className={k === 3 ? 'is-warn' : k === 6 ? 'is-bad' : ''} />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── 10 Pricing ROI ──────────────────────────────────────── */

export function CostVisual() {
  return (
    <VisualCard tone="white" ratio="16 / 10" className="zv-cost">
      {(inView) => (
        <div className={`zv-cost-wrap ${inView ? 'is-on' : ''}`}>
          <div className="zv-cost-row">
            <span>Marketing analyst</span>
            <div className="zv-cost-bar is-gray" style={{ width: inView ? '100%' : '0%' }}>
              <em>$4,000/mo</em>
            </div>
          </div>
          <div className="zv-cost-row">
            <span>ZieAds Starter</span>
            <div className="zv-cost-bar is-accent" style={{ width: inView ? '8%' : '0%' }} />
            <em className="zv-cost-out">$29/mo</em>
          </div>
          <div className="zv-cost-save">
            <small>You keep per year</small>
            <strong>{inView ? <CountUp to={47652} prefix="$" duration={1800} /> : '$0'}</strong>
          </div>
        </div>
      )}
    </VisualCard>
  );
}

/* ── 11 FAQ: ask the agent ───────────────────────────────── */

const QA = [
  { q: 'Will it post without me?', a: 'Never. You approve everything that goes live.' },
  { q: 'Do I need ad account access?', a: 'No. The free audit only needs your URL.' },
  { q: 'Which platforms?', a: 'Instagram, TikTok, LinkedIn and Facebook.' },
];

export function AskVisual() {
  return (
    <VisualCard tone="warm" ratio="4 / 3" className="zv-ask">
      {(inView) => <AskInner active={inView} />}
    </VisualCard>
  );
}
function AskInner({ active }: { active: boolean }) {
  const i = useRotate(QA.length, active, 4200);
  const answer = useTypewriter(QA[i].a, active, 30, i);
  return (
    <div className="zv-chat" key={i}>
      <div className="zv-bubble is-user">{QA[i].q}</div>
      <div className="zv-bubble-row">
        <AgentDot size={26} active={answer.length < QA[i].a.length} />
        <div className="zv-bubble">
          {answer || (
            <span className="zv-dots">
              <i />
              <i />
              <i />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Platform strip (under the hero) ─────────────────────── */

export function PlatformStrip() {
  const items = [
    { p: 'instagram', l: 'Instagram' },
    { p: 'tiktok', l: 'TikTok' },
    { p: 'linkedin', l: 'LinkedIn' },
    { p: 'facebook', l: 'Facebook' },
    { p: 'meta_ads', l: 'Meta Ads' },
    { p: 'google_ads', l: 'Google Ads' },
    { p: 'tiktok_ads', l: 'TikTok Ads' },
  ];
  return (
    <div className="zv-platforms" aria-label="Works with">
      <span className="zv-platforms-label">Works with</span>
      <div className="zv-platforms-mask">
        <div className="zv-platforms-track">
          {[...items, ...items].map((it, i) => (
            <span key={i} className="zv-platform">
              <SocialIcon platform={it.p} size={18} /> {it.l}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

