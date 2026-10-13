import React, { useId } from 'react';
import { BRAND_MARKS } from './brandMarks';
import { NOUN_ICONS } from '../../pages/landing/noun-icons';

/*
  Platform icons built from the official brand marks (see ./brandMarks.ts).

  variant
    'tile'  (default) app-icon style: brand-colored rounded square with the white mark
    'mark'  the mark alone in its brand color
    'mono'  the mark alone in currentColor (for monochrome logo rows)

  If scripts/fetch-noun-icons.mjs has stored a Noun Project icon under the key
  `social-<platform>`, that icon is used instead.
*/

interface SocialIconProps {
  platform: string;
  size?: number;
  style?: React.CSSProperties;
  variant?: 'tile' | 'mark' | 'mono';
}

const KEY: Record<string, string> = {
  instagram: 'instagram',
  tiktok: 'tiktok',
  tiktok_ads: 'tiktok',
  linkedin: 'linkedin',
  facebook: 'facebook',
  meta: 'meta',
  meta_ads: 'meta',
  google: 'google',
  google_ads: 'googleads',
  twitter: 'x',
  x: 'x',
};

export default function SocialIcon({ platform, size = 20, style, variant = 'tile' }: SocialIconProps) {
  const gid = useId().replace(/:/g, '');
  const key = KEY[platform.toLowerCase()];
  const mark = key ? BRAND_MARKS[key] : undefined;
  const base: React.CSSProperties = { flexShrink: 0, display: 'inline-block', verticalAlign: 'middle', ...style };

  const noun = key ? NOUN_ICONS[`social-${key}`] : undefined;
  if (noun) {
    return <img src={noun.url} alt={platform} title={noun.attribution} width={size} height={size} style={{ ...base, objectFit: 'contain' }} />;
  }

  if (!mark) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={base} aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    );
  }

  if (variant === 'mono' || variant === 'mark') {
    return (
      <svg width={size} height={size} viewBox={mark.viewBox} style={base} role="img" aria-label={platform}>
        <path d={mark.path} fill={variant === 'mono' ? 'currentColor' : mark.hex} />
      </svg>
    );
  }

  // Tile variant: brand background + white mark, scaled into the tile
  const vb = mark.viewBox.split(' ').map(Number);
  const s = vb[2];
  const pad = s * 0.22;
  const inner = `${-pad} ${-pad} ${s + pad * 2} ${s + pad * 2}`;
  const r = (s + pad * 2) * 0.24;

  let bg: React.ReactNode = <rect x={-pad} y={-pad} width={s + pad * 2} height={s + pad * 2} rx={r} fill={mark.hex} />;
  let glyph: React.ReactNode = <path d={mark.path} fill="#fff" />;

  if (key === 'instagram') {
    bg = (
      <>
        <defs>
          <radialGradient id={`ig${gid}`} cx="30%" cy="107%" r="150%">
            <stop offset="0" stopColor="#fdf497" />
            <stop offset="0.05" stopColor="#fdf497" />
            <stop offset="0.45" stopColor="#fd5949" />
            <stop offset="0.6" stopColor="#d6249f" />
            <stop offset="0.9" stopColor="#285AEB" />
          </radialGradient>
        </defs>
        <rect x={-pad} y={-pad} width={s + pad * 2} height={s + pad * 2} rx={r} fill={`url(#ig${gid})`} />
      </>
    );
  }
  if (key === 'tiktok') {
    bg = <rect x={-pad} y={-pad} width={s + pad * 2} height={s + pad * 2} rx={r} fill="#000" />;
    glyph = (
      <>
        <path d={mark.path} fill="#25F4EE" transform={`translate(${-s * 0.035} ${-s * 0.03})`} />
        <path d={mark.path} fill="#FE2C55" transform={`translate(${s * 0.035} ${s * 0.03})`} />
        <path d={mark.path} fill="#fff" />
      </>
    );
  }
  if (key === 'linkedin' || key === 'facebook' || key === 'meta' || key === 'google' || key === 'googleads') {
    // These marks already read as logos on white; use a white tile with the colored mark
    bg = <rect x={-pad} y={-pad} width={s + pad * 2} height={s + pad * 2} rx={r} fill="#fff" stroke="rgba(0,0,0,0.08)" strokeWidth={s * 0.03} />;
    glyph = <path d={mark.path} fill={mark.hex} />;
  }

  return (
    <svg width={size} height={size} viewBox={inner} style={base} role="img" aria-label={platform}>
      {bg}
      {glyph}
    </svg>
  );
}
