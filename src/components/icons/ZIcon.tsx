/*
  <ZIcon name="insight" size={16} />
  Renders the Noun Project icon for a semantic name (key `ui-<name>` in NOUN_ICONS,
  fetched by scripts/fetch-noun-icons.mjs) tinted with currentColor. Falls back to the
  lucide-react icon from the registry when no Noun icon exists or it fails to load.

  The Noun icon is drawn as an inline <svg> filled with currentColor and masked by the
  PNG, so existing CSS that sizes `svg` inside a container keeps working.
*/
import { CSSProperties, useEffect, useState } from 'react';
import { NOUN_ICONS } from '../../pages/landing/noun-icons';
import { ICONS, IconName } from './iconRegistry';

type NounEntry = { id: string; url: string; attribution?: string };
const MAP: Record<string, NounEntry> = NOUN_ICONS;

export type ZIconProps = {
  name: IconName;
  size?: number | string;
  className?: string;
  style?: CSSProperties;
  strokeWidth?: number | string;
  'aria-label'?: string;
};

export default function ZIcon({ name, size, className, style, strokeWidth, 'aria-label': ariaLabel }: ZIconProps) {
  const entry = MAP['ui-' + name];
  const [ok, setOk] = useState<boolean | null>(entry ? null : false);

  useEffect(() => {
    if (!entry) return;
    let alive = true;
    const img = new Image();
    img.onload = () => alive && setOk(true);
    img.onerror = () => alive && setOk(false);
    img.src = entry.url;
    return () => {
      alive = false;
    };
  }, [entry]);

  if (!entry || ok !== true) {
    const Fallback = ICONS[name].lucide;
    return (
      <Fallback
        size={size}
        className={className}
        style={style}
        strokeWidth={strokeWidth}
        aria-label={ariaLabel}
        aria-hidden={ariaLabel ? undefined : true}
      />
    );
  }

  const dim = size ?? 24;
  const mask = `url(${entry.url})`;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={dim}
      height={dim}
      className={`zicon zicon-${name}${className ? ' ' + className : ''}`}
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      style={{
        display: 'inline-block',
        flexShrink: 0,
        WebkitMaskImage: mask,
        maskImage: mask,
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        ...style,
      }}
    >
      {entry.attribution ? <title>{entry.attribution}</title> : null}
      <rect width="24" height="24" style={{ fill: 'currentColor', stroke: 'none' }} />
    </svg>
  );
}
