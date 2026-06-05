import React from 'react';
import { 
  UilGoogle, UilFacebook, UilVideo, UilLinkedin 
} from '@iconscout/react-unicons';

// Selected clean Noun Project icon IDs mapping
const NOUN_ICONS: Record<string, string> = {
  audit: '7768955',        // Gear + charts for full audit
  quick: '8395255',        // Speedometer/gauge for quick scan
  copy: '8410532',         // Document/pencil for copywriting intel
  creatives: '8362702',    // Paint palette for creative studio
  landing: '8318926',      // Webbrowser landing page conversion rate
  audiences: '8029438',    // Dynamic target group/community for audiences
  competitors: '5854890',  // Binoculars spy glass for competitor landscape
  funnel: '8297654',       // Multi-tier funnel mapping
  budget: '8344490',       // Coins/bars for budget strategy
  report: '6418273',       // Document checklist for strategy report
  'report-pdf': '7768955', // White-label export
};

interface NounIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}

export default function NounIcon({ name, size = 20, color = 'currentColor', style }: NounIconProps) {
  const cleanName = name.startsWith('ads-') ? name.substring(4) : name;

  // Render official brand logos with dynamic styling
  if (cleanName === 'google') {
    return <UilGoogle size={size} style={{ color, flexShrink: 0, ...style }} />;
  }
  if (cleanName === 'meta') {
    return <UilFacebook size={size} style={{ color, flexShrink: 0, ...style }} />;
  }
  if (cleanName === 'tiktok') {
    return <UilVideo size={size} style={{ color, flexShrink: 0, ...style }} />;
  }
  if (cleanName === 'linkedin') {
    return <UilLinkedin size={size} style={{ color, flexShrink: 0, ...style }} />;
  }

  const iconId = NOUN_ICONS[cleanName] || cleanName;
  const isUrl = iconId.startsWith('http');
  const imageUrl = isUrl ? iconId : `https://static.thenounproject.com/png/${iconId}-200.png`;

  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        maskImage: `url(${imageUrl})`,
        WebkitMaskImage: `url(${imageUrl})`,
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

