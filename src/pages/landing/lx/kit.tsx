/* Small building blocks for the v4 landing page. */
import { ReactNode, useEffect, useState } from 'react';
import { useInView } from '../ui';

export function LxButton({
  children,
  onClick,
  variant = 'dark',
  size,
  block,
  type = 'button',
  disabled,
  href,
  'aria-label': ariaLabel,
}: {
  children: string;
  onClick?: () => void;
  variant?: 'dark' | 'orange' | 'white' | 'ghost';
  size?: 'sm';
  block?: boolean;
  type?: 'button' | 'submit';
  disabled?: boolean;
  href?: string;
  'aria-label'?: string;
}) {
  const cls = `lx-btn is-${variant} ${size === 'sm' ? 'is-sm' : ''} ${block ? 'is-block' : ''}`;
  // The label is printed twice and slides up on hover: a small cue that the button is live
  const label = (
    <span className="lx-btn-roll">
      <span>
        <span>{children}</span>
        <span aria-hidden="true">{children}</span>
      </span>
    </span>
  );
  if (href) {
    return (
      <a className={cls} href={href} aria-label={ariaLabel}>
        {label}
      </a>
    );
  }
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled} aria-label={ariaLabel || children}>
      {label}
    </button>
  );
}

export function LxReveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>(0.12);
  return (
    <div ref={ref} className={`lx-reveal ${inView ? 'is-in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export function LxBadge({ n, children }: { n: string; children: ReactNode }) {
  return (
    <span className="lx-badge">
      <i aria-hidden="true">{n}</i>
      {children}
    </span>
  );
}

export const goToId = (id: string) => {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', `#${id}`);
  }
};

/** Counts up once when it scrolls into view, so the number lands with the section */
export function LxCount({ to, prefix = '', suffix = '', duration = 1200 }: { to: number; prefix?: string; suffix?: string; duration?: number }) {
  const { ref, inView } = useInView<HTMLSpanElement>(0.4);
  // The prerendered page shows the real number; the browser counts up from 0 when it scrolls into view
  const [v, setV] = useState(() => (typeof window === 'undefined' ? to : 0));
  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return setV(to);
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setV(Math.round(to * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);
  return (
    <span ref={ref} aria-label={`${prefix}${to}${suffix}`}>
      {prefix}
      {v}
      {suffix}
    </span>
  );
}
