import { CSSProperties, Fragment, ReactNode, useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';

/* ── Motion helpers ─────────────────────────────────────── */

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function useInView<T extends Element>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined' || prefersReduced()) {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, inView };
}

type RevealVariant = 'up' | 'fade' | 'left' | 'right' | 'scale';

/** Fades/slides its children in when scrolled into view. */
export function Reveal({
  children,
  delay = 0,
  variant = 'up',
  className = '',
  style,
}: {
  children: ReactNode;
  delay?: number;
  variant?: RevealVariant;
  className?: string;
  style?: CSSProperties;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`zx-reveal zx-reveal-${variant} ${inView ? 'is-in' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms`, ...style }}
    >
      {children}
    </div>
  );
}

/** Headline whose words rise into place one after another. */
export function AnimatedHeading({
  text,
  as = 'h2',
  className = '',
}: {
  text: string;
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLHeadingElement>(0.3);
  const Tag = as;
  const words = text.split(' ');
  return (
    <Tag ref={ref as any} className={`zx-heading ${inView ? 'is-in' : ''} ${className}`} aria-label={text}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="zx-word" aria-hidden="true">
            <span className="zx-word-inner" style={{ transitionDelay: `${i * 45}ms` }}>
              {w}
            </span>
          </span>
          {i < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </Tag>
  );
}

/** Rounded image card with clip reveal, hover zoom and gentle scroll parallax. */
export function ImageCard({
  src,
  alt,
  ratio = '4 / 3',
  className = '',
  children,
  parallax = true,
  delay = 0,
}: {
  src: string;
  alt: string;
  ratio?: string;
  className?: string;
  children?: ReactNode;
  parallax?: boolean;
  delay?: number;
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0.1);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!parallax || prefersReduced()) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = ref.current;
      const img = imgRef.current;
      if (!el || !img) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      if (r.bottom < -200 || r.top > vh + 200) return;
      const progress = (r.top + r.height / 2 - vh / 2) / vh; // about -1..1
      img.style.setProperty('--zx-parallax', `${(progress * -28).toFixed(1)}px`);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [parallax, ref]);

  return (
    <div
      ref={ref}
      className={`zx-image-card ${inView ? 'is-in' : ''} ${className}`}
      style={{ aspectRatio: ratio, transitionDelay: `${delay}ms` }}
    >
      <img ref={imgRef} src={src} alt={alt} loading="lazy" decoding="async" style={{ transitionDelay: `${delay}ms` }} />
      {children && <div className="zx-image-overlay">{children}</div>}
    </div>
  );
}

/** Number that counts up when visible. */
export function CountUp({
  to,
  decimals = 0,
  prefix = '',
  suffix = '',
  duration = 1400,
}: {
  to: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const { ref, inView } = useInView<HTMLSpanElement>(0.4);
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (prefersReduced()) {
      setVal(to);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(to * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);

  return (
    <span ref={ref} className="mono-num">
      {prefix}
      {val.toFixed(decimals)}
      {suffix}
    </span>
  );
}

/** Animated progress bar that fills on reveal. */
export function GrowBar({ value, delay = 0 }: { value: number; delay?: number }) {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);
  return (
    <div ref={ref} className="zx-bar-track">
      <div
        className="zx-bar-fill"
        style={{ width: inView ? `${value}%` : '0%', transitionDelay: `${delay}ms` }}
      />
    </div>
  );
}

/* ── Layout ─────────────────────────────────────────────── */

export function Section({
  id,
  number,
  label,
  tone = 'white',
  children,
  className = '',
}: {
  id?: string;
  number?: string;
  label?: string;
  tone?: 'white' | 'gray';
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`zx-section zx-tone-${tone} ${className}`}>
      <div className="zx-container">
        {number && label && (
          <Reveal className="zx-badge-row" variant="fade">
            <span className="zx-badge-num">{number}</span>
            <span className="zx-badge-label">{label}</span>
          </Reveal>
        )}
        {children}
      </div>
    </section>
  );
}

/* ── Buttons ────────────────────────────────────────────── */

/** Pill CTA with text-roll hover and rotating arrow (Axion pattern). */
export function TextRollButton({
  text,
  onClick,
  variant = 'orange',
  className: extraClass = '',
  type = 'button',
  disabled = false,
}: {
  text: string;
  onClick?: () => void;
  variant?: 'orange' | 'white' | 'dark';
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
}) {
  const bgClass =
    variant === 'orange'
      ? 'bg-[#F26522] hover:bg-[#e05a1a]'
      : variant === 'white'
        ? 'bg-white hover:bg-gray-50'
        : 'bg-gray-900 hover:bg-black';
  const textColor = variant === 'white' ? 'text-gray-900' : 'text-white';
  const arrowBg = variant === 'white' ? 'bg-gray-900' : 'bg-white';
  const arrowColor =
    variant === 'orange' ? 'text-[#F26522]' : variant === 'white' ? 'text-white' : 'text-gray-900';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`group zx-roll-btn inline-flex items-center gap-2 ${bgClass} ${textColor} text-[13px] sm:text-[14px] font-medium rounded-full pl-5 sm:pl-6 pr-2 py-2 transition-colors duration-300 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap ${extraClass}`}
    >
      <span className="overflow-hidden h-[20px]">
        <span className="flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-translate-y-1/2">
          <span className="h-[20px] flex items-center">{text}</span>
          <span className="h-[20px] flex items-center" aria-hidden="true">
            {text}
          </span>
        </span>
      </span>
      <span
        className={`w-7 h-7 sm:w-8 sm:h-8 ${arrowBg} rounded-full flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:rotate-0 -rotate-45`}
      >
        <ArrowRight size={14} className={arrowColor} />
      </span>
    </button>
  );
}

/** Quiet text link with sliding underline and arrow. */
export function LinkArrow({ text, onClick }: { text: string; onClick?: () => void }) {
  return (
    <button type="button" className="zx-link-arrow" onClick={onClick}>
      <span>{text}</span>
      <ArrowRight size={14} />
    </button>
  );
}

export const scrollToId = (id: string) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};
