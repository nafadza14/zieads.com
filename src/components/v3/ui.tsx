/*
  ZieAds dashboard UI kit (V0.3)
  Same visual language as the AI Agent page and the landing page:
  system font, clean white, glass cards, orange #F26522, soft motion.
  Styles live in ./dash.css (imported once by V3Layout).
*/
import React, { CSSProperties, ReactNode, useEffect, useRef, useState } from 'react';
import { ArrowRight, Bot } from 'lucide-react';
export { TextRollButton } from '../../pages/landing/ui';

const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/* ── Headline with word-by-word rise ── */
export function WordReveal({ text, className = '', as = 'h1' }: { text: string; className?: string; as?: 'h1' | 'h2' | 'h3' }) {
  const Tag = as;
  const words = text.split(' ');
  return (
    <Tag className={`zd-reveal-h ${className}`} aria-label={text}>
      {words.map((w, i) => (
        <React.Fragment key={i}>
          <span className="zd-word" aria-hidden="true">
            <span className="zd-word-inner" style={{ animationDelay: `${i * 40}ms` }}>
              {w}
            </span>
          </span>
          {i < words.length - 1 ? ' ' : null}
        </React.Fragment>
      ))}
    </Tag>
  );
}

/* ── Page header: numbered badge + headline + actions ── */
export function PageHeader({
  number,
  label,
  title,
  subtitle,
  actions,
  children,
}: {
  number?: string;
  label?: string;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="zd-header">
      <div className="zd-header-row">
        <div className="zd-header-text">
          {label && (
            <div className="zd-badge-row">
              {number && <span className="zd-badge-num">{number}</span>}
              <span className="zd-badge-label">{label}</span>
            </div>
          )}
          <WordReveal key={title} text={title} className="zd-title" />
          {subtitle && <p className="zd-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="zd-header-actions">{actions}</div>}
      </div>
      {children}
    </header>
  );
}

/* ── Scrollable page body with staggered entrance of direct children ── */
export function PageBody({ children, className = '', wide = false }: { children: ReactNode; className?: string; wide?: boolean }) {
  return (
    <div className="zd-body">
      <div className={`zd-body-inner zd-stagger ${wide ? 'is-wide' : ''} ${className}`}>{children}</div>
    </div>
  );
}

/* ── Card ── */
export function Card({
  children,
  className = '',
  hover = false,
  glass = false,
  onClick,
  delay,
  style,
  padding,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
  onClick?: () => void;
  delay?: number;
  style?: CSSProperties;
  padding?: number | string;
}) {
  return (
    <div
      className={`zd-card ${hover || onClick ? 'is-hover' : ''} ${glass ? 'is-glass' : ''} ${onClick ? 'is-click' : ''} ${className}`}
      onClick={onClick}
      style={{ ...(delay !== undefined ? { animationDelay: `${delay}ms` } : {}), ...(padding !== undefined ? { padding } : {}), ...style }}
    >
      {children}
    </div>
  );
}

export function CardTitle({ icon, children, action, sub }: { icon?: ReactNode; children: ReactNode; action?: ReactNode; sub?: ReactNode }) {
  return (
    <div className="zd-card-title">
      <div className="zd-card-title-main">
        {icon && <span className="zd-icon-dot">{icon}</span>}
        <div>
          <h3>{children}</h3>
          {sub && <p>{sub}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

/* ── Animated number ── */
export function CountUp({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  duration = 1200,
  format = true,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  format?: boolean;
}) {
  const [v, setV] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const target = Number.isFinite(value) ? value : 0;
    if (reduced()) {
      setV(target);
      return;
    }
    const start = performance.now();
    const origin = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const e = 1 - Math.pow(1 - t, 3);
      const cur = origin + (target - origin) * e;
      setV(cur);
      if (t < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  const shown = format
    ? v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : v.toFixed(decimals);
  return (
    <span className="zd-num">
      {prefix}
      {shown}
      {suffix}
    </span>
  );
}

/* ── KPI tile ── */
export function StatCard({
  label,
  value,
  icon,
  hint,
  hintTone = 'muted',
  decimals = 0,
  prefix,
  suffix,
  delay,
  raw,
}: {
  label: string;
  value?: number;
  icon?: ReactNode;
  hint?: ReactNode;
  hintTone?: 'muted' | 'good' | 'bad' | 'accent';
  decimals?: number;
  prefix?: string;
  suffix?: string;
  delay?: number;
  raw?: ReactNode;
}) {
  return (
    <Card className="zd-stat" hover delay={delay}>
      <div className="zd-stat-top">
        <span className="zd-eyebrow">{label}</span>
        {icon && <span className="zd-stat-icon">{icon}</span>}
      </div>
      <div className="zd-stat-value">{raw ?? <CountUp value={value || 0} decimals={decimals} prefix={prefix} suffix={suffix} />}</div>
      {hint && <div className={`zd-stat-hint tone-${hintTone}`}>{hint}</div>}
    </Card>
  );
}

/* ── Segmented tabs with sliding indicator ── */
export function SegTabs<T extends string>({
  tabs,
  value,
  onChange,
  size = 'md',
}: {
  tabs: { id: T; label: ReactNode; icon?: ReactNode }[];
  value: T;
  onChange: (id: T) => void;
  size?: 'sm' | 'md';
}) {
  const idx = Math.max(0, tabs.findIndex((t) => t.id === value));
  return (
    <div className={`zd-seg size-${size}`} role="tablist" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
      <span
        className="zd-seg-indicator"
        style={{ width: `calc((100% - 8px) / ${tabs.length})`, transform: `translateX(${idx * 100}%)` }}
      />
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          type="button"
          aria-selected={t.id === value}
          className={`zd-seg-btn ${t.id === value ? 'is-active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.icon}
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ── Small pieces ── */
export function Pill({ children, tone = 'neutral', className = '' }: { children: ReactNode; tone?: 'neutral' | 'accent' | 'good' | 'warn' | 'bad' | 'dark'; className?: string }) {
  return <span className={`zd-pill tone-${tone} ${className}`}>{children}</span>;
}

export function Orb({ size = 36, active = false }: { size?: number; active?: boolean }) {
  return (
    <span className={`zd-orb ${active ? 'is-active' : ''}`} style={{ width: size, height: size }}>
      <span className="zd-orb-core">
        <Bot size={Math.round(size * 0.45)} />
      </span>
    </span>
  );
}

export function GrowBar({ value, delay = 0, tone = 'accent' }: { value: number; delay?: number; tone?: 'accent' | 'dark' | 'good' }) {
  return (
    <div className="zd-bar">
      <div className={`zd-bar-fill tone-${tone}`} style={{ width: `${Math.max(0, Math.min(100, value))}%`, animationDelay: `${delay}ms` }} />
    </div>
  );
}

export function Skeleton({ height = 16, width = '100%', count = 1, radius = 10 }: { height?: number; width?: number | string; count?: number; radius?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="zd-skeleton" style={{ height, width, borderRadius: radius, animationDelay: `${i * 100}ms` }} />
      ))}
    </>
  );
}

/** Loading state: pulsing dots + shimmering text (same as the AI Agent typing indicator). */
export function LoadingState({ text = 'Loading', inline = false }: { text?: string; inline?: boolean }) {
  return (
    <div className={`zd-loading ${inline ? 'is-inline' : ''}`}>
      <span className="zd-dots">
        <i />
        <i />
        <i />
      </span>
      <span className="zd-shimmer">{text}</span>
    </div>
  );
}

/** Empty state with soft orange aura, orb and optional action. */
export function EmptyState({ icon, title, body, action }: { icon?: ReactNode; title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="zd-empty">
      <div className="zd-aura" aria-hidden="true">
        <span />
        <span />
      </div>
      <div className="zd-empty-inner">
        <span className="zd-empty-icon">{icon ?? <Bot size={22} />}</span>
        <h3>{title}</h3>
        {body && <p>{body}</p>}
        {action && <div className="zd-empty-action">{action}</div>}
      </div>
    </div>
  );
}

/** Quiet secondary button (pill outline). */
export function GhostButton({ children, onClick, disabled, type = 'button', className = '' }: { children: ReactNode; onClick?: () => void; disabled?: boolean; type?: 'button' | 'submit'; className?: string }) {
  return (
    <button type={type} className={`zd-btn-ghost ${className}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

/** Dark pill with rotating arrow (compact primary inside cards). */
export function DarkButton({ children, onClick, disabled, type = 'button', className = '', loading = false }: { children: ReactNode; onClick?: () => void; disabled?: boolean; type?: 'button' | 'submit'; className?: string; loading?: boolean }) {
  return (
    <button type={type} className={`zd-btn-dark ${loading ? 'is-loading' : ''} ${className}`} onClick={onClick} disabled={disabled || loading}>
      <span className="zd-btn-label">{loading ? <LoadingState text="Working" inline /> : children}</span>
      {!loading && (
        <span className="zd-btn-arrow">
          <ArrowRight size={13} />
        </span>
      )}
    </button>
  );
}
