import { ZIE_SYMBOL, ZIE_SYMBOL_SMALL, ZIE_WORDMARK, ZIE_ORANGE } from './zieadsLogoPaths';

/*
  The ZieAds symbol: the orange tile with Zie's ears and a cut-out smile (masters in public/brand).
  tone 'brand' is orange, 'white' for dark or orange backgrounds, 'ink' for one-colour print,
  'current' follows the text colour. At 28 px and below the thicker small-size cut is used.
*/
type Tone = 'brand' | 'white' | 'ink' | 'current';
const FILL: Record<Tone, string> = { brand: ZIE_ORANGE, white: '#ffffff', ink: '#111111', current: 'currentColor' };

export default function ZieAdsLogo({ size = 36, className, tone = 'brand', title }: { size?: number; className?: string; tone?: Tone; title?: string }) {
  const g = size <= 28 ? ZIE_SYMBOL_SMALL : ZIE_SYMBOL;
  return (
    <svg width={size} height={size} viewBox={g.viewBox} className={className} xmlns="http://www.w3.org/2000/svg" role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true} style={{ flexShrink: 0, display: 'block' }}>
      <path d={g.d} fill={FILL[tone]} fillRule={g.fillRule} />
    </svg>
  );
}

/** The custom "zieads" wordmark. Sized by its height (default 0.9em) and drawn in currentColor. */
export function ZieAdsWordmark({ height = '0.9em', className, title = 'ZieAds' }: { height?: number | string; className?: string; title?: string }) {
  return (
    <svg viewBox={ZIE_WORDMARK.viewBox} className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label={title} style={{ height, width: 'auto', aspectRatio: `${ZIE_WORDMARK.width} / ${ZIE_WORDMARK.height}`, display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
      <path d={ZIE_WORDMARK.d} fill="currentColor" fillRule={ZIE_WORDMARK.fillRule} />
    </svg>
  );
}
