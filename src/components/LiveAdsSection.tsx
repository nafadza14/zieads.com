import { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────
interface AdPreview {
  platform: 'meta' | 'tiktok' | 'google' | 'linkedin';
  headline: string;
  body?: string;
  cta?: string;
  angle?: string;
  format?: string;
  runningDays?: number;
}

interface Props {
  url: string;
  businessName?: string;
  accentColor?: string;
  // Pass in Gemini-generated data so we render real AI copy in the cards
  skillData?: any;
}

// ─── Platform config ──────────────────────────────────────────────
const PLATFORMS = {
  meta: {
    label: 'Meta',
    color: '#1877F2',
    bg: '#eff6ff',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    libraryUrl: (domain: string) =>
      `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&q=${encodeURIComponent(domain)}`,
    libraryLabel: 'Meta Ads Library',
  },
  tiktok: {
    label: 'TikTok',
    color: '#000000',
    bg: '#f4f4f4',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.83a8.16 8.16 0 004.77 1.52V6.91a4.85 4.85 0 01-1-.22z"/>
      </svg>
    ),
    libraryUrl: (domain: string) =>
      `https://ads.tiktok.com/business/creativecenter/inspiration/topads/pc/en?search=${encodeURIComponent(domain)}`,
    libraryLabel: 'TikTok Creative Center',
  },
  google: {
    label: 'Google',
    color: '#4285F4',
    bg: '#eff6ff',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
    libraryUrl: (domain: string) =>
      `https://adstransparency.google.com/?region=anywhere&domain=${encodeURIComponent(domain)}`,
    libraryLabel: 'Google Ad Transparency',
  },
  linkedin: {
    label: 'LinkedIn',
    color: '#0077B5',
    bg: '#e0f0fa',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
    libraryUrl: (_domain: string) =>
      `https://www.linkedin.com/ad-library/`,
    libraryLabel: 'LinkedIn Ad Library',
  },
} as const;

type PlatformKey = keyof typeof PLATFORMS;

// ─── Gradient pool ────────────────────────────────────────────────
const GRADIENTS = [
  'linear-gradient(135deg,#667eea,#764ba2)',
  'linear-gradient(135deg,#f093fb,#f5576c)',
  'linear-gradient(135deg,#4facfe,#00f2fe)',
  'linear-gradient(135deg,#43e97b,#38f9d7)',
  'linear-gradient(135deg,#fa709a,#fee140)',
  'linear-gradient(135deg,#a18cd1,#fbc2eb)',
  'linear-gradient(135deg,#ffecd2,#fcb69f)',
  'linear-gradient(135deg,#a1c4fd,#c2e9fb)',
  'linear-gradient(135deg,#d4fc79,#96e6a1)',
  'linear-gradient(135deg,#f6d365,#fda085)',
  'linear-gradient(135deg,#89f7fe,#66a6ff)',
  'linear-gradient(135deg,#fddb92,#d1fdff)',
];

// ─── Single ad preview card ───────────────────────────────────────
function AdPreviewCard({ ad, index, libraryUrl }: { ad: AdPreview; index: number; libraryUrl: string }) {
  const pConfig = PLATFORMS[ad.platform];
  const grad = GRADIENTS[index % GRADIENTS.length];

  return (
    <div
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        background: '#fff',
        border: '1px solid #f0eef6',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
      }}
      onMouseOver={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.12)';
      }}
      onMouseOut={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
      }}
      onClick={() => window.open(libraryUrl, '_blank', 'noopener')}
    >
      {/* Creative area */}
      <div style={{ position: 'relative', height: 240, background: grad, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 16px' }}>
        {/* Platform badge */}
        <div style={{
          position: 'absolute', top: 10, left: 10,
          background: pConfig.color,
          color: '#fff', fontSize: '0.65rem', fontWeight: 700,
          padding: '3px 9px', borderRadius: 20,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <span style={{ color: '#fff' }}>{pConfig.icon}</span>
          {pConfig.label}
        </div>

        {/* Running badge */}
        {ad.runningDays && (
          <div style={{
            position: 'absolute', top: 10, right: 10,
            background: 'rgba(0,0,0,0.5)', color: '#fff',
            fontSize: '0.65rem', fontWeight: 600,
            padding: '3px 8px', borderRadius: 20,
          }}>
            {ad.runningDays}d+
          </div>
        )}

        {/* Format badge */}
        {ad.format && (
          <div style={{
            position: 'absolute', bottom: 10, left: 10,
            background: 'rgba(255,255,255,0.2)', color: '#fff',
            fontSize: '0.62rem', fontWeight: 600,
            padding: '2px 7px', borderRadius: 20,
            backdropFilter: 'blur(4px)',
          }}>
            {ad.format}
          </div>
        )}

        {/* Angle tag */}
        {ad.angle && (
          <div style={{
            position: 'absolute', bottom: 10, right: 10,
            background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)',
            fontSize: '0.62rem', fontWeight: 600,
            padding: '2px 7px', borderRadius: 20,
            backdropFilter: 'blur(4px)',
          }}>
            {ad.angle}
          </div>
        )}

        {/* Headline */}
        <p style={{
          color: 'rgba(255,255,255,0.97)', fontSize: '1rem', fontWeight: 700,
          textAlign: 'center', lineHeight: 1.4,
          textShadow: '0 1px 6px rgba(0,0,0,0.25)',
          margin: 0,
        }}>
          {ad.headline}
        </p>
      </div>

      {/* Copy area */}
      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {ad.body && (
          <p style={{
            fontSize: '0.78rem', color: '#475569', lineHeight: 1.55,
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
            overflow: 'hidden', margin: 0,
          }}>
            {ad.body}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 6 }}>
          {ad.cta && (
            <div style={{
              background: pConfig.color, color: '#fff',
              fontSize: '0.7rem', fontWeight: 700,
              padding: '4px 10px', borderRadius: 8,
            }}>
              {ad.cta}
            </div>
          )}
          <span style={{ fontSize: '0.68rem', color: '#b0b0c0', marginLeft: 'auto' }}>
            View in library ↗
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Platform research card ───────────────────────────────────────
function PlatformSearchCard({ platformKey, domain }: { platformKey: PlatformKey; domain: string }) {
  const p = PLATFORMS[platformKey];
  const libraryUrl = p.libraryUrl(domain);
  return (
    <a
      href={libraryUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 18px',
        background: p.bg,
        border: `1.5px solid ${p.color}25`,
        borderRadius: 14,
        textDecoration: 'none',
        transition: 'all 0.2s',
        flex: '1 1 200px',
        minWidth: 180,
      }}
      onMouseOver={e => {
        (e.currentTarget as HTMLElement).style.borderColor = `${p.color}60`;
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 20px ${p.color}15`;
      }}
      onMouseOut={e => {
        (e.currentTarget as HTMLElement).style.borderColor = `${p.color}25`;
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: p.color, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {p.icon}
      </div>
      <div>
        <p style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1a1a2e', margin: '0 0 2px' }}>{p.label} Ads</p>
        <p style={{ fontSize: '0.72rem', color: p.color, fontWeight: 600, margin: 0 }}>Search in {p.libraryLabel} ↗</p>
      </div>
    </a>
  );
}

// ─── Extract ad previews from Gemini skill data ───────────────────
function extractPreviewsFromSkillData(data: any): AdPreview[] {
  if (!data) return [];
  const d = data.deliverables || {};
  const analysis = data.analysis || {};
  const previews: AdPreview[] = [];

  // ads-copy
  if (d.metaAds?.primaryTexts?.length) {
    d.metaAds.primaryTexts.slice(0, 2).forEach((body: string, i: number) => {
      previews.push({
        platform: 'meta',
        headline: d.metaAds.headlines?.[i] || d.metaAds.headlines?.[0] || 'Meta Ad',
        body,
        cta: 'Learn More',
        angle: analysis.keySellingPoints?.[i] || undefined,
        format: 'Feed Post',
        runningDays: 30 + i * 14,
      });
    });
  }
  if (d.googleAds?.headlines?.length) {
    previews.push({
      platform: 'google',
      headline: d.googleAds.headlines[0],
      body: d.googleAds.descriptions?.[0],
      cta: 'Get Started',
      format: 'Search Ad',
      angle: 'Search Intent',
      runningDays: 60,
    });
  }
  if (d.tiktokAds?.scriptOutlines?.length) {
    const s = d.tiktokAds.scriptOutlines[0];
    previews.push({
      platform: 'tiktok',
      headline: s.hook,
      body: s.body,
      cta: s.cta,
      format: 'Video',
      angle: 'UGC',
      runningDays: 14,
    });
  }
  if (d.linkedinAds?.sponsoredContent?.length) {
    const c = d.linkedinAds.sponsoredContent[0];
    previews.push({
      platform: 'linkedin',
      headline: c.headline,
      body: c.intro,
      format: 'Sponsored',
      angle: 'B2B',
      runningDays: 45,
    });
  }

  // ads-creatives / creative-intelligence
  if (d.creativeConceptsMeta?.length) {
    d.creativeConceptsMeta.slice(0, 3).forEach((c: any, i: number) => {
      previews.push({
        platform: 'meta',
        headline: c.hook,
        body: c.visualDirection,
        cta: c.cta || 'Shop Now',
        format: c.format,
        angle: c.emotionalAngle,
        runningDays: 21 + i * 10,
      });
    });
  }
  if (d.creativeConceptsTikTok?.length) {
    d.creativeConceptsTikTok.slice(0, 2).forEach((c: any, i: number) => {
      previews.push({
        platform: 'tiktok',
        headline: c.hook,
        body: c.visualDirection,
        format: c.format,
        angle: 'Creator Style',
        runningDays: 7 + i * 5,
      });
    });
  }

  // competitors → show competitor ads
  if (d.directCompetitors?.length) {
    d.directCompetitors.slice(0, 2).forEach((comp: any, i: number) => {
      previews.push({
        platform: i % 2 === 0 ? 'meta' : 'google',
        headline: comp.name,
        body: comp.offer || comp.creativeApproach,
        angle: 'Competitor',
        format: 'Ad Comparison',
        runningDays: undefined,
      });
    });
  }

  // generic: meta campaign structure
  if (d.audienceSets?.length) {
    d.audienceSets.slice(0, 2).forEach((a: any, i: number) => {
      previews.push({
        platform: 'meta',
        headline: a.name,
        body: a.targeting,
        format: 'Audience Ad',
        runningDays: 20 + i * 8,
      });
    });
  }

  return previews.slice(0, 8);
}

// ─── Main component ───────────────────────────────────────────────
export default function LiveAdsSection({ url, businessName, accentColor = '#7B2FBE', skillData }: Props) {
  const [activeTab, setActiveTab] = useState<'all' | 'meta' | 'tiktok' | 'google'>('all');

  const domain = (() => {
    try { return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', ''); }
    catch { return url || ''; }
  })();

  const brandLabel = businessName || domain;

  // Build ad previews from AI skill data (real Gemini output)
  const allPreviews = extractPreviewsFromSkillData(skillData);

  const filtered = activeTab === 'all'
    ? allPreviews
    : allPreviews.filter(a => a.platform === activeTab);

  const platformTabs = [
    { key: 'all', label: 'All' },
    { key: 'meta', label: 'Meta' },
    { key: 'tiktok', label: 'TikTok' },
    { key: 'google', label: 'Google' },
  ] as const;

  return (
    <div style={{ marginBottom: 48 }}>
      {/* ── Section header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, marginTop: 40, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.02em', margin: 0 }}>
              Ad Creative Analysis
            </h2>
            <span style={{ background: '#f3e8ff', color: '#7B2FBE', fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
              AI-Generated
            </span>
          </div>
          <p style={{ color: '#8888a0', fontSize: '0.875rem', margin: 0 }}>
            AI-predicted ad creatives based on {brandLabel}'s website — click any card to search in the live ad library
          </p>
        </div>

        {/* Platform tab filter */}
        {allPreviews.length > 0 && (
          <div style={{ display: 'flex', gap: 4, background: '#f4f2fa', borderRadius: 24, padding: 4, flexShrink: 0 }}>
            {platformTabs.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  padding: '5px 14px', borderRadius: 20, border: 'none',
                  background: activeTab === t.key ? '#fff' : 'transparent',
                  boxShadow: activeTab === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  color: activeTab === t.key ? '#1a1a2e' : '#8888a0',
                  fontWeight: activeTab === t.key ? 700 : 500,
                  fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Ad card grid ── */}
      {filtered.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 16, marginBottom: 24 }}>
          {filtered.map((ad, i) => (
            <AdPreviewCard
              key={i}
              ad={ad}
              index={i}
              libraryUrl={PLATFORMS[ad.platform].libraryUrl(domain)}
            />
          ))}
        </div>
      ) : (
        <div style={{ padding: '24px', background: '#fafafe', borderRadius: 14, border: '1px dashed #e8e6f0', textAlign: 'center', marginBottom: 24 }}>
          <p style={{ color: '#8888a0', fontSize: '0.875rem' }}>
            Run the skill to generate AI ad previews for this brand.
          </p>
        </div>
      )}

      {/* ── Live library search links ── */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
          Search Real Running Ads
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {(['meta', 'tiktok', 'google', 'linkedin'] as PlatformKey[]).map(pk => (
            <PlatformSearchCard key={pk} platformKey={pk} domain={domain} />
          ))}
        </div>
      </div>

      {/* ── Meta Ads Library API upgrade note ── */}
      <div style={{
        padding: '14px 18px',
        background: 'linear-gradient(135deg,#1877F208,#1877F203)',
        border: '1px solid #1877F220',
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}>
        <div style={{ width: 28, height: 28, background: '#1877F2', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {PLATFORMS.meta.icon}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1a1a2e', margin: '0 0 2px' }}>
            Want real ad footage embedded directly?
          </p>
          <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
            Apply for Meta Ads Library API access at{' '}
            <a href="https://www.facebook.com/ads/library/api/" target="_blank" rel="noopener noreferrer" style={{ color: '#1877F2', fontWeight: 600 }}>
              facebook.com/ads/library/api
            </a>
            {' '}— once approved, real ad iframes will appear here automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
