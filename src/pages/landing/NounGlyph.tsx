import { ReactNode, useEffect, useState } from 'react';
import { NOUN_ICONS } from './noun-icons';
import { NOUN_APPROVED } from '../../components/icons/nounApproved';

type NounEntry = { id: string; url: string; attribution?: string };
const MAP: Record<string, NounEntry> = NOUN_ICONS;

/**
 * Renders a Noun Project icon (fetched by scripts/fetch-noun-icons.mjs) tinted with
 * currentColor. If the key has no icon yet, or the image fails to load, it renders
 * the fallback line icon instead, so the page never shows a broken glyph.
 */
export default function NounGlyph({ name, fallback, size = 24 }: { name: string; fallback: ReactNode; size?: number }) {
  const entry = NOUN_APPROVED.has(name) ? MAP[name] : undefined;
  const [ok, setOk] = useState<boolean | null>(entry ? null : false);

  useEffect(() => {
    if (!entry) return;
    const img = new Image();
    img.onload = () => setOk(true);
    img.onerror = () => setOk(false);
    img.src = entry.url;
  }, [entry]);

  if (!entry || ok === false || ok === null) return <>{fallback}</>;

  return (
    <span
      role="img"
      aria-label={name}
      title={entry.attribution || undefined}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        backgroundColor: 'currentColor',
        WebkitMaskImage: `url(${entry.url})`,
        maskImage: `url(${entry.url})`,
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        flexShrink: 0,
      }}
    />
  );
}
