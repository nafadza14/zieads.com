/*
  Layered visuals: lifestyle photo + real product screenshot + animated UI chips.
  Each layer drifts at its own speed while scrolling, so the composition feels alive
  instead of a rigid grid of boxes.
*/
import { CSSProperties, ReactNode, useEffect, useRef, useState } from 'react';
import { useInView } from './ui';

const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Sets --zc-p on the element: about -1 (below the fold) to 1 (scrolled past). */
export function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced()) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      if (r.bottom < -300 || r.top > vh + 300) return;
      const p = Math.max(-1, Math.min(1, (vh / 2 - (r.top + r.height / 2)) / vh));
      el.style.setProperty('--zc-p', p.toFixed(3));
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
  }, []);
  return ref;
}

/** Photo with a graceful fallback: if it fails, the frame keeps a soft brand gradient. */
export function Photo({ src, alt, className = '', style }: { src: string; alt: string; className?: string; style?: CSSProperties }) {
  const [state, setState] = useState<'loading' | 'ok' | 'err'>('loading');
  return (
    <div className={`zc-photo is-${state} ${className}`} style={style}>
      {state !== 'err' && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setState('ok')}
          onError={() => setState('err')}
        />
      )}
    </div>
  );
}

/** Real dashboard screenshot inside a browser frame, zoomed onto a focus point. */
export function Shot({
  src,
  alt,
  url = 'app.zieads.com',
  focus = [50, 50],
  zoom = 1,
  ratio = '16 / 10',
  className = '',
  chrome = true,
  eager = false,
}: {
  src: string;
  alt: string;
  url?: string;
  focus?: [number, number];
  zoom?: number;
  ratio?: string;
  className?: string;
  chrome?: boolean;
  eager?: boolean;
}) {
  // Screenshots are 16:10. Make sure the zoomed image always covers the frame, then clamp the focus.
  const [rw, rh] = ratio.split('/').map((n) => parseFloat(n));
  const r = rw && rh ? rw / rh : 1.6;
  const z = Math.max(zoom, 1, 1.6 / r);
  const hz = (z * r) / 1.6;
  const fx = Math.min(1 - 0.5 / z, Math.max(0.5 / z, focus[0] / 100));
  const fy = Math.min(1 - 0.5 / hz, Math.max(0.5 / hz, focus[1] / 100));
  return (
    <div className={`zc-shot ${chrome ? 'has-chrome' : ''} ${className}`}>
      {chrome && (
        <div className="zc-shot-bar">
          <span />
          <span />
          <span />
          <em>{url}</em>
        </div>
      )}
      <div className="zc-shot-view" style={{ aspectRatio: ratio }}>
        <img
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          style={{ width: `${z * 100}%`, transform: `translate(-${fx * 100}%, -${fy * 100}%)` }}
        />
      </div>
    </div>
  );
}

/**
 * Three-layer composition.
 *  photo  sits at the back (slight tilt, slow drift)
 *  shot   product screenshot in the middle (medium drift)
 *  front  animated UI chip on top (fast drift, gentle bob)
 * `layout` mirrors the arrangement so neighbouring sections do not look identical.
 */
export function Collage({
  photo,
  photoAlt = '',
  shot,
  front,
  layout = 'right',
  ratio = '5 / 4',
  className = '',
  tone = 'warm',
}: {
  photo?: string;
  photoAlt?: string;
  shot?: ReactNode;
  front?: ReactNode;
  layout?: 'right' | 'left' | 'center';
  ratio?: string;
  className?: string;
  tone?: 'warm' | 'gray' | 'dark';
}) {
  const ref = useScrollProgress<HTMLDivElement>();
  const { ref: viewRef, inView } = useInView<HTMLDivElement>(0.12);
  return (
    <div
      ref={(el) => {
        ref.current = el;
        (viewRef as any).current = el;
      }}
      className={`zc-collage zc-${layout} zc-tone-${tone} ${inView ? 'is-in' : ''} ${shot ? 'has-shot' : ''} ${front ? 'has-front' : ''} ${className}`}
      style={{ aspectRatio: ratio }}
    >
      {photo && (
        <div className="zc-layer zc-layer-photo">
          <Photo src={photo} alt={photoAlt} />
        </div>
      )}
      {shot && <div className="zc-layer zc-layer-shot">{shot}</div>}
      {front && <div className="zc-layer zc-layer-front">{front}</div>}
    </div>
  );
}

/** Small floating UI chip (glass pill) for use inside collages. */
export function Chip({ children, className = '', style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={`zc-chip ${className}`} style={style}>
      {children}
    </div>
  );
}
