import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Bot, Lightbulb, AlertTriangle, Download } from 'lucide-react';
import { 
  UilPen, UilPalette, UilSearchAlt, UilGoogle, UilFacebook, UilVideo, UilLinkedin, 
  UilChartPie, UilFileAlt, UilHome, UilFilter, UilCrosshairs, UilMoneyBill
} from '@iconscout/react-unicons';
import ZieAdsLogo from '../components/ZieAdsLogo';
import LiveAdsSection from '../components/LiveAdsSection';
import { supabase } from '../lib/supabaseClient';

// Skills that should show the live ads section from Meta Ads Library
const SHOW_LIVE_ADS_FOR = new Set([
  'ads-copy', 'ads-creatives', 'ads-competitors', 'ads-meta',
  'ads-tiktok', 'ads-report', 'ads-report-pdf',
]);

// ─── Platform config ──────────────────────────────────────────────
const PLATFORM_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  meta: { bg: '#1877F2', text: '#fff', label: 'Meta' },
  facebook: { bg: '#1877F2', text: '#fff', label: 'Facebook' },
  instagram: { bg: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', text: '#fff', label: 'Instagram' },
  google: { bg: '#4285F4', text: '#fff', label: 'Google' },
  tiktok: { bg: '#000', text: '#fff', label: 'TikTok' },
  linkedin: { bg: '#0077B5', text: '#fff', label: 'LinkedIn' },
  youtube: { bg: '#FF0000', text: '#fff', label: 'YouTube' },
};

const SKILL_META: Record<string, { title: string; icon: React.ReactNode; platform: string; color: string }> = {
  'ads-copy':       { title: 'Ad Copy Intelligence',      icon: <UilPen size={28} />,       platform: 'All Platforms',          color: '#7B2FBE' },
  'ads-creatives':  { title: 'Creative Brief',            icon: <UilPalette size={28} />,   platform: 'Creative Studio',        color: '#e8457a' },
  'ads-competitors':{ title: 'Competitor Intelligence',   icon: <UilSearchAlt size={28} />, platform: 'Competitive Landscape',  color: '#f59e0b' },
  'ads-google':     { title: 'Google Ads Strategy',       icon: <UilGoogle size={28} />,    platform: 'Google Ads',             color: '#4285F4' },
  'ads-meta':       { title: 'Meta Ads Strategy',         icon: <UilFacebook size={28} />,  platform: 'Facebook & Instagram',   color: '#1877F2' },
  'ads-tiktok':     { title: 'TikTok Ads Strategy',       icon: <UilVideo size={28} />,     platform: 'TikTok',                 color: '#000' },
  'ads-linkedin':   { title: 'LinkedIn B2B Strategy',     icon: <UilLinkedin size={28} />,  platform: 'LinkedIn',               color: '#0077B5' },
  'ads-report':     { title: 'Strategy Report',           icon: <UilChartPie size={28} />,  platform: 'Full Analysis',          color: '#00c9a7' },
  'ads-report-pdf': { title: 'White-Label PDF Report',    icon: <UilFileAlt size={28} />,   platform: 'Agency Export',          color: '#64748b' },
  'ads-landing':    { title: 'Landing Page CRO Audit',    icon: <UilHome size={28} />,      platform: 'Conversion Rate',        color: '#f59e0b' },
  'ads-funnel':     { title: 'Funnel Architecture',       icon: <UilFilter size={28} />,    platform: 'Full Funnel',            color: '#5c8aff' },
  'ads-audiences':  { title: 'Audience Intelligence',     icon: <UilCrosshairs size={28} />,platform: 'Targeting',              color: '#8b5cf6' },
  'ads-budget':     { title: 'Budget Strategy',           icon: <UilMoneyBill size={28} />, platform: 'Budget Allocation',      color: '#00c9a7' },
  'ads-quick':      { title: 'Quick Scan',                icon: '⚡',                       platform: 'Ads Readiness',          color: '#f59e0b' },
  // short-name aliases
  'copy':           { title: 'Ad Copy Intelligence',      icon: <UilPen size={28} />,       platform: 'All Platforms',          color: '#7B2FBE' },
  'creatives':      { title: 'Creative Brief',            icon: <UilPalette size={28} />,   platform: 'Creative Studio',        color: '#e8457a' },
  'landing':        { title: 'Landing Page CRO Audit',    icon: <UilHome size={28} />,      platform: 'Conversion Rate',        color: '#f59e0b' },
  'quick':          { title: 'Quick Scan',                icon: '⚡',                       platform: 'Ads Readiness',          color: '#f59e0b' },
  'competitors':    { title: 'Competitor Intelligence',   icon: <UilSearchAlt size={28} />, platform: 'Competitive Landscape',  color: '#f59e0b' },
  'google':         { title: 'Google Ads Strategy',       icon: <UilGoogle size={28} />,    platform: 'Google Ads',             color: '#4285F4' },
  'meta':           { title: 'Meta Ads Strategy',         icon: <UilFacebook size={28} />,  platform: 'Facebook & Instagram',   color: '#1877F2' },
  'tiktok':         { title: 'TikTok Ads Strategy',       icon: <UilVideo size={28} />,     platform: 'TikTok',                 color: '#000' },
  'linkedin':       { title: 'LinkedIn B2B Strategy',     icon: <UilLinkedin size={28} />,  platform: 'LinkedIn',               color: '#0077B5' },
  'funnel':         { title: 'Funnel Architecture',       icon: <UilFilter size={28} />,    platform: 'Full Funnel',            color: '#5c8aff' },
  'audiences':      { title: 'Audience Intelligence',     icon: <UilCrosshairs size={28} />,platform: 'Targeting',              color: '#8b5cf6' },
  'budget':         { title: 'Budget Strategy',           icon: <UilMoneyBill size={28} />, platform: 'Budget Allocation',      color: '#00c9a7' },
  'report':         { title: 'Strategy Report',           icon: <UilChartPie size={28} />,  platform: 'Full Analysis',          color: '#00c9a7' },
  'report-pdf':     { title: 'White-Label PDF Report',    icon: <UilFileAlt size={28} />,   platform: 'Agency Export',          color: '#64748b' },
};

// ─── Simulated Ad Card ────────────────────────────────────────────
function AdCreativeCard({ platform, headline, body, cta, angle, runningDays, index }: any) {
  const pc = PLATFORM_COLORS[platform?.toLowerCase()] || PLATFORM_COLORS.meta;
  const gradients = [
    'linear-gradient(135deg,#667eea,#764ba2)',
    'linear-gradient(135deg,#f093fb,#f5576c)',
    'linear-gradient(135deg,#4facfe,#00f2fe)',
    'linear-gradient(135deg,#43e97b,#38f9d7)',
    'linear-gradient(135deg,#fa709a,#fee140)',
    'linear-gradient(135deg,#a18cd1,#fbc2eb)',
    'linear-gradient(135deg,#ffecd2,#fcb69f)',
    'linear-gradient(135deg,#a1c4fd,#c2e9fb)',
  ];
  const grad = gradients[index % gradients.length];

  return (
    <div style={{
      borderRadius: 16,
      overflow: 'hidden',
      background: '#fff',
      border: '1px solid #f0eef6',
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
    onMouseOver={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(0,0,0,0.12)'; }}
    onMouseOut={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)'; }}
    >
      {/* Simulated Ad Image */}
      <div style={{ height: 160, background: grad, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        {/* Platform badge */}
        <div style={{
          position: 'absolute',
          top: 10, left: 10,
          background: typeof pc.bg === 'string' && pc.bg.startsWith('linear') ? 'rgba(0,0,0,0.8)' : pc.bg,
          color: '#fff',
          fontSize: '0.7rem',
          fontWeight: 700,
          padding: '3px 10px',
          borderRadius: 20,
          letterSpacing: '0.03em',
        }}>
          {pc.label}
        </div>
        {runningDays && (
          <div style={{
            position: 'absolute',
            top: 10, right: 10,
            background: 'rgba(0,0,0,0.55)',
            color: '#fff',
            fontSize: '0.7rem',
            padding: '3px 8px',
            borderRadius: 20,
          }}>
            Running {runningDays}d+
          </div>
        )}
        <p style={{ color: 'rgba(255,255,255,0.95)', fontSize: '1rem', fontWeight: 700, textAlign: 'center', lineHeight: 1.4, textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
          {headline || 'Ad Creative'}
        </p>
      </div>
      {/* Ad Copy */}
      <div style={{ padding: '12px 14px' }}>
        {angle && (
          <span style={{ display: 'inline-block', background: '#f3e8ff', color: '#7B2FBE', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, marginBottom: 8, letterSpacing: '0.02em' }}>
            {angle}
          </span>
        )}
        {body && (
          <p style={{ fontSize: '0.8rem', color: '#4a4a6a', lineHeight: 1.5, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {body}
          </p>
        )}
        {cta && (
          <div style={{ display: 'inline-block', background: '#7B2FBE', color: '#fff', fontSize: '0.75rem', fontWeight: 600, padding: '5px 12px', borderRadius: 8 }}>
            {cta}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section Heading ──────────────────────────────────────────────
function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div style={{ marginBottom: 20, marginTop: 40 }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.02em' }}>{children}</h2>
      {sub && <p style={{ color: '#8888a0', fontSize: '0.875rem', marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

// ─── Score Badge ──────────────────────────────────────────────────
function ScoreBadge({ score, label }: { score: number; label?: string }) {
  const color = score >= 70 ? '#00c9a7' : score >= 50 ? '#f59e0b' : '#e8457a';
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        border: `4px solid ${color}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 8px',
        background: `${color}15`,
      }}>
        <span style={{ fontSize: '1.4rem', fontWeight: 800, color }}>{score}</span>
      </div>
      {label && <p style={{ fontSize: '0.78rem', color: '#8888a0', fontWeight: 600 }}>{label}</p>}
    </div>
  );
}

// ─── Pill Tag ─────────────────────────────────────────────────────
function Tag({ children, color = '#7B2FBE', bg = '#f3e8ff' }: { children: React.ReactNode; color?: string; bg?: string }) {
  return (
    <span style={{ display: 'inline-block', background: bg, color, fontSize: '0.78rem', fontWeight: 600, padding: '4px 12px', borderRadius: 20, margin: '3px' }}>
      {children}
    </span>
  );
}

// ─── Finding row ──────────────────────────────────────────────────
function FindingRow({ severity, title, impact, recommendation }: any) {
  const colors: Record<string, { bg: string; text: string }> = {
    critical: { bg: '#fee2e2', text: '#dc2626' },
    high: { bg: '#fef3c7', text: '#d97706' },
    medium: { bg: '#e0f2fe', text: '#0284c7' },
    low: { bg: '#f0fdf4', text: '#16a34a' },
  };
  const c = colors[severity] || colors.medium;
  return (
    <div style={{ padding: '16px 18px', borderRadius: 12, border: '1px solid #f0eef6', marginBottom: 10, background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ background: c.bg, color: c.text, fontSize: '0.7rem', fontWeight: 700, padding: '2px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {severity}
        </span>
        <strong style={{ color: '#1a1a2e', fontSize: '0.9rem' }}>{title}</strong>
      </div>
      {impact && <p style={{ fontSize: '0.83rem', color: '#64748b', marginBottom: 6 }}>Impact: {impact}</p>}
      {recommendation && <p style={{ fontSize: '0.83rem', color: '#475569', background: '#fafafe', padding: '8px 12px', borderRadius: 8 }}>→ {recommendation}</p>}
    </div>
  );
}

// ─── Render by skill type ─────────────────────────────────────────
function renderSkillContent(skillName: string, data: any, businessName: string, url: string) {
  const d = data.deliverables || {};

  // ── ads-copy ────────────────────────────────────────────────────
  if (skillName === 'ads-copy') {
    const meta = d.metaAds || {};
    const google = d.googleAds || {};
    const tiktok = d.tiktokAds || {};
    const linkedin = d.linkedinAds || {};
    const analysis = data.analysis || {};

    // Build ad cards from the copy
    const adCards: any[] = [];
    const hooks = [
      ...(meta.primaryTexts || []).map((t: string, i: number) => ({
        platform: 'meta', headline: meta.headlines?.[i] || meta.headlines?.[0] || 'Meta Ad', body: t, cta: 'Learn More', angle: analysis.keySellingPoints?.[i % 3] || 'Value'
      })),
      ...(google.headlines || []).slice(0, 2).map((h: string, i: number) => ({
        platform: 'google', headline: h, body: google.descriptions?.[i] || '', cta: 'Get Started', angle: 'Search Intent'
      })),
      ...(tiktok.scriptOutlines || []).map((s: any, i: number) => ({
        platform: 'tiktok', headline: s.hook, body: s.body, cta: s.cta, angle: 'UGC Style'
      })),
    ];
    adCards.push(...hooks.slice(0, 6));

    return (
      <>
        {/* Strategy Brief */}
        {(analysis.strategy || analysis.toneOfVoice) && (
          <>
            <SectionTitle sub="How the AI crafted your copy">Copy Strategy</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16, marginBottom: 24 }}>
              {analysis.strategy && (
                <div style={{ padding: 20, background: '#fafafe', borderRadius: 14, border: '1px solid #f0eef6' }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7B2FBE', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Strategy</p>
                  <p style={{ fontSize: '0.9rem', color: '#1a1a2e', lineHeight: 1.6 }}>{analysis.strategy}</p>
                </div>
              )}
              {analysis.toneOfVoice && (
                <div style={{ padding: 20, background: '#fafafe', borderRadius: 14, border: '1px solid #f0eef6' }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#e8457a', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tone of Voice</p>
                  <p style={{ fontSize: '0.9rem', color: '#1a1a2e', lineHeight: 1.6 }}>{analysis.toneOfVoice}</p>
                </div>
              )}
            </div>
            {analysis.keySellingPoints?.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Key Selling Points</p>
                <div>{analysis.keySellingPoints.map((p: string, i: number) => <Tag key={i}>{p}</Tag>)}</div>
              </div>
            )}
          </>
        )}

        {/* SwipeFile */}
        {adCards.length > 0 && (
          <>
            <SectionTitle sub="Platform-native ad copy in card format">Ad SwipeFile</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16, marginBottom: 32 }}>
              {adCards.map((c, i) => (
                <AdCreativeCard key={i} index={i} {...c} runningDays={Math.floor(30 + Math.random() * 90)} />
              ))}
            </div>
          </>
        )}

        {/* Google Ads */}
        {google.headlines?.length > 0 && (
          <>
            <SectionTitle sub="Ready to paste into Google Ads Manager">Google Ads Copy</SectionTitle>
            <div style={{ background: '#fff', border: '1px solid #f0eef6', borderRadius: 14, padding: 24, marginBottom: 24 }}>
              <div style={{ borderBottom: '1px solid #f0eef6', paddingBottom: 16, marginBottom: 16 }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4285F4', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Headlines</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {google.headlines.map((h: string, i: number) => (
                    <div key={i} style={{ background: '#f8faff', border: '1px solid #e0eaff', borderRadius: 8, padding: '6px 12px', fontSize: '0.85rem', color: '#1a1a2e' }}>
                      {h}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4285F4', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Descriptions</p>
                {google.descriptions?.map((desc: string, i: number) => (
                  <p key={i} style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6, marginBottom: 6, padding: '8px 12px', background: '#fafafe', borderRadius: 8 }}>{desc}</p>
                ))}
              </div>
              {google.sitelinks?.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4285F4', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sitelinks</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 8 }}>
                    {google.sitelinks.map((s: any, i: number) => (
                      <div key={i} style={{ padding: '8px 12px', background: '#f0f7ff', borderRadius: 8, border: '1px solid #dbeafe' }}>
                        <p style={{ fontWeight: 700, fontSize: '0.83rem', color: '#1d4ed8' }}>{s.text}</p>
                        <p style={{ fontSize: '0.78rem', color: '#64748b' }}>{s.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Meta Ads */}
        {(meta.shortBody || meta.mediumBody || meta.longBody) && (
          <>
            <SectionTitle sub="Primary text variations for Meta Ads Manager">Meta Ad Copy</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16, marginBottom: 24 }}>
              {[['Short', meta.shortBody], ['Medium', meta.mediumBody], ['Long', meta.longBody]].filter(([, v]) => v).map(([label, body]) => (
                <div key={label as string} style={{ background: '#fff', border: '1px solid #f0eef6', borderRadius: 14, padding: 20 }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1877F2', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label as string} Version</p>
                  <p style={{ fontSize: '0.875rem', color: '#1a1a2e', lineHeight: 1.65 }}>{body as string}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* TikTok Scripts */}
        {tiktok.scriptOutlines?.length > 0 && (
          <>
            <SectionTitle sub="Native video script outlines for TikTok creators">TikTok Scripts</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16, marginBottom: 24 }}>
              {tiktok.scriptOutlines.map((s: any, i: number) => (
                <div key={i} style={{ background: '#fff', border: '1px solid #f0eef6', borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ background: '#000', padding: '10px 16px' }}>
                    <p style={{ color: '#fff', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Script {i + 1}</p>
                  </div>
                  <div style={{ padding: 16 }}>
                    <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>HOOK</p>
                    <p style={{ fontSize: '0.875rem', color: '#1a1a2e', marginBottom: 12, fontStyle: 'italic' }}>"{s.hook}"</p>
                    <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>BODY</p>
                    <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: 12 }}>{s.body}</p>
                    <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>CTA</p>
                    <p style={{ fontSize: '0.875rem', color: '#7B2FBE', fontWeight: 600 }}>{s.cta}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* LinkedIn */}
        {linkedin.sponsoredContent?.length > 0 && (
          <>
            <SectionTitle sub="B2B sponsored content and InMail messages">LinkedIn Ad Copy</SectionTitle>
            {linkedin.sponsoredContent.map((c: any, i: number) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #f0eef6', borderRadius: 14, padding: 20, marginBottom: 12 }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0077B5', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sponsored Content {i + 1}</p>
                <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: 8 }}>{c.intro}</p>
                <p style={{ fontWeight: 700, color: '#1a1a2e' }}>{c.headline}</p>
              </div>
            ))}
          </>
        )}
      </>
    );
  }

  // ── ads-creatives / creative-intelligence ────────────────────────
  if (skillName === 'ads-creatives' || skillName === 'creative-intelligence') {
    const cards = [
      ...(d.creativeConceptsMeta || []).map((c: any) => ({ platform: 'meta', headline: c.hook, body: c.visualDirection, cta: c.cta || 'Shop Now', angle: c.emotionalAngle, format: c.format })),
      ...(d.creativeConceptsTikTok || []).map((c: any) => ({ platform: 'tiktok', headline: c.hook, body: c.visualDirection, cta: 'Follow for more', angle: 'UGC/Native' })),
      ...(d.creativeConceptsGoogle || []).map((c: any) => ({ platform: 'google', headline: c.hook, body: c.visualDirection, cta: 'Learn More', angle: 'Display' })),
    ];

    return (
      <>
        {d.brandIdentity && (
          <>
            <SectionTitle sub="Brand signals extracted from your website">Brand Identity</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 32 }}>
              {[['Colors', d.brandIdentity.colors], ['Style', d.brandIdentity.style], ['Tone', d.brandIdentity.tone]].map(([k, v]) => (
                <div key={k as string} style={{ padding: 20, background: '#fafafe', borderRadius: 14, border: '1px solid #f0eef6' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7B2FBE', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{k as string}</p>
                  <p style={{ fontSize: '0.9rem', color: '#1a1a2e' }}>{v as string}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {d.heroOfferAssessment && (
          <>
            <SectionTitle sub="Offer clarity and competitive differentiation">Hero Offer Assessment</SectionTitle>
            <div style={{ padding: 20, background: '#f0fdf4', borderRadius: 14, border: '1px solid #bbf7d0', marginBottom: 32 }}>
              <p style={{ fontSize: '0.95rem', color: '#1a1a2e', lineHeight: 1.65 }}>{d.heroOfferAssessment}</p>
            </div>
          </>
        )}

        {d.emotionalTriggers?.length > 0 && (
          <>
            <SectionTitle sub="Psychological levers that resonate with your audience">Emotional Triggers</SectionTitle>
            <div style={{ marginBottom: 32 }}>
              {d.emotionalTriggers.map((t: string, i: number) => <Tag key={i}>{t}</Tag>)}
            </div>
          </>
        )}

        {cards.length > 0 && (
          <>
            <SectionTitle sub="Multi-platform creative concepts ready for production">Creative Concepts</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16, marginBottom: 32 }}>
              {cards.map((c, i) => <AdCreativeCard key={i} index={i} {...c} runningDays={Math.floor(14 + i * 12)} />)}
            </div>
          </>
        )}

        {d.testingSequence && (
          <>
            <SectionTitle sub="Recommended order for launching and testing creatives">Testing Sequence</SectionTitle>
            <div style={{ padding: 20, background: '#f8f7fc', borderRadius: 14, border: '1px solid #e8e6f0', marginBottom: 32 }}>
              <p style={{ fontSize: '0.95rem', color: '#1a1a2e', lineHeight: 1.7 }}>{d.testingSequence}</p>
            </div>
          </>
        )}
      </>
    );
  }

  // ── ads-competitors ──────────────────────────────────────────────
  if (skillName === 'ads-competitors') {
    return (
      <>
        <SectionTitle sub="Direct competitors spending on ads in your space">Competitor Landscape</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16, marginBottom: 32 }}>
          {d.directCompetitors?.map((c: any, i: number) => {
            const spendColor = { low: '#16a34a', medium: '#f59e0b', high: '#dc2626', heavy: '#7B2FBE' }[c.adSpendTier?.toLowerCase()] || '#64748b';
            return (
              <div key={i} style={{ background: '#fff', border: '1px solid #f0eef6', borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                <div style={{ background: `${spendColor}12`, padding: '14px 18px', borderBottom: '1px solid #f0eef6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <strong style={{ color: '#1a1a2e', fontSize: '1rem' }}>{c.name}</strong>
                  <span style={{ background: spendColor, color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
                    {c.adSpendTier} Spend
                  </span>
                </div>
                <div style={{ padding: 18 }}>
                  {c.url && <p style={{ fontSize: '0.78rem', color: '#8888a0', marginBottom: 8 }}>{c.url}</p>}
                  <div style={{ marginBottom: 10 }}>
                    {c.platforms?.map((p: string) => (
                      <Tag key={p} color='#1877F2' bg='#eff6ff'>{p}</Tag>
                    ))}
                  </div>
                  {c.offer && (
                    <p style={{ fontSize: '0.83rem', color: '#475569', marginBottom: 8 }}>
                      <strong style={{ color: '#1a1a2e' }}>Offer: </strong>{c.offer}
                    </p>
                  )}
                  {c.creativeApproach && (
                    <p style={{ fontSize: '0.83rem', color: '#475569' }}>
                      <strong style={{ color: '#1a1a2e' }}>Creative: </strong>{c.creativeApproach}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {d.competitiveGaps && (
          <>
            <SectionTitle sub="Untapped opportunities in your competitive landscape">Gap Analysis</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16, marginBottom: 32 }}>
              {[
                { label: 'Platform Gaps', items: d.competitiveGaps.platformGaps, color: '#4285F4', bg: '#eff6ff' },
                { label: 'Offer Gaps', items: d.competitiveGaps.offerGaps, color: '#e8457a', bg: '#fff0f3' },
                { label: 'Audience Gaps', items: d.competitiveGaps.audienceGaps, color: '#7B2FBE', bg: '#f3e8ff' },
                { label: 'Creative Gaps', items: d.competitiveGaps.creativeGaps, color: '#00c9a7', bg: '#f0fdf9' },
              ].map(({ label, items, color, bg }) => items?.length ? (
                <div key={label} style={{ padding: 20, background: bg, borderRadius: 14, border: `1px solid ${color}30` }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>{label}</p>
                  <ul style={{ paddingLeft: 16 }}>
                    {items.map((item: string, i: number) => (
                      <li key={i} style={{ fontSize: '0.875rem', color: '#1a1a2e', lineHeight: 1.6, marginBottom: 4 }}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null)}
            </div>
          </>
        )}

        {d.positioningRecommendation && (
          <>
            <SectionTitle sub="How to position your brand to win">Positioning Strategy</SectionTitle>
            <div style={{ padding: 24, background: 'linear-gradient(135deg,#7B2FBE10,#5c8aff10)', border: '1px solid #7B2FBE20', borderRadius: 14, marginBottom: 32 }}>
              <p style={{ fontSize: '1rem', color: '#1a1a2e', lineHeight: 1.7 }}>{d.positioningRecommendation}</p>
            </div>
          </>
        )}

        {d.indirectCompetitors?.length > 0 && (
          <>
            <SectionTitle sub="Alternative solutions your audience might choose">Indirect Competitors</SectionTitle>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 32 }}>
              {d.indirectCompetitors.map((c: any, i: number) => (
                <div key={i} style={{ padding: '10px 16px', background: '#fafafe', borderRadius: 12, border: '1px solid #f0eef6' }}>
                  <strong style={{ color: '#1a1a2e' }}>{c.name}</strong>
                  {c.offer && <span style={{ color: '#8888a0', fontSize: '0.83rem', marginLeft: 8 }}>— {c.offer}</span>}
                </div>
              ))}
            </div>
          </>
        )}
      </>
    );
  }

  // ── ads-meta ─────────────────────────────────────────────────────
  if (skillName === 'ads-meta') {
    const cards = d.audienceSets?.map((a: any, i: number) => ({
      platform: i % 2 === 0 ? 'facebook' : 'instagram',
      headline: a.name,
      body: a.targeting,
      cta: 'Learn More',
      angle: 'Targeting',
    })) || [];

    return (
      <>
        <SectionTitle sub="Full campaign architecture for Facebook & Instagram">Campaign Structure</SectionTitle>
        <div style={{ marginBottom: 32 }}>
          {d.campaignStructure?.map((c: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', background: '#fff', border: '1px solid #f0eef6', borderRadius: 12, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1877F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{ color: '#1a1a2e', fontSize: '0.9rem' }}>{c.campaignName}</strong>
                <p style={{ fontSize: '0.83rem', color: '#8888a0', marginTop: 2 }}>Objective: {c.objective} · Budget: {c.budgetSplit}</p>
              </div>
            </div>
          ))}
        </div>

        {cards.length > 0 && (
          <>
            <SectionTitle sub="Audience sets targeting real users on Meta">Audience Sets</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16, marginBottom: 32 }}>
              {cards.map((c: any, i: number) => <AdCreativeCard key={i} index={i} {...c} />)}
            </div>
          </>
        )}

        {d.lookalikeStrategy && (
          <>
            <SectionTitle sub="Expanding your best audiences with Meta's Lookalike tool">Lookalike Strategy</SectionTitle>
            <div style={{ padding: 20, background: '#fafafe', borderRadius: 14, border: '1px solid #f0eef6', marginBottom: 32 }}>
              <p style={{ fontSize: '0.95rem', color: '#1a1a2e', lineHeight: 1.65 }}>{d.lookalikeStrategy}</p>
            </div>
          </>
        )}

        {d.biddingStrategy && (
          <>
            <SectionTitle sub="Recommended bid strategy to maximize ROAS">Bidding Strategy</SectionTitle>
            <div style={{ padding: 20, background: '#f3e8ff', borderRadius: 14, border: '1px solid #7B2FBE30', marginBottom: 32 }}>
              <p style={{ fontSize: '0.95rem', color: '#1a1a2e', lineHeight: 1.65 }}>{d.biddingStrategy}</p>
            </div>
          </>
        )}
      </>
    );
  }

  // ── ads-google ───────────────────────────────────────────────────
  if (skillName === 'ads-google') {
    return (
      <>
        <SectionTitle sub="Full Google Ads campaign architecture">Campaign Structure</SectionTitle>
        <div style={{ marginBottom: 32 }}>
          {d.campaignStructure?.map((c: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', background: '#fff', border: '1px solid #f0eef6', borderRadius: 12, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#4285F4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{ color: '#1a1a2e', fontSize: '0.9rem' }}>{c.campaignName}</strong>
                <p style={{ fontSize: '0.83rem', color: '#8888a0', marginTop: 2 }}>Type: {c.type} · Budget: {c.budgetAllocation}</p>
              </div>
            </div>
          ))}
        </div>

        {d.keywordBuckets?.length > 0 && (
          <>
            <SectionTitle sub="Organized by intent and search behavior">Keyword Strategy</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16, marginBottom: 32 }}>
              {d.keywordBuckets.map((b: any, i: number) => (
                <div key={i} style={{ padding: 18, background: '#fff', borderRadius: 14, border: '1px solid #f0eef6' }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4285F4', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>{b.category}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {b.keywords?.map((k: string, j: number) => <Tag key={j} color='#1d4ed8' bg='#eff6ff'>{k}</Tag>)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {d.negativeKeywordsSeed?.length > 0 && (
          <>
            <SectionTitle sub="Prevent wasted spend from irrelevant searches">Negative Keywords</SectionTitle>
            <div style={{ marginBottom: 32 }}>
              {d.negativeKeywordsSeed.map((k: string, i: number) => <Tag key={i} color='#dc2626' bg='#fee2e2'>-{k}</Tag>)}
            </div>
          </>
        )}

        {d.biddingStrategy && (
          <>
            <SectionTitle sub="Smart bidding setup for Google Ads">Bidding Strategy</SectionTitle>
            <div style={{ padding: 20, background: '#f0f7ff', borderRadius: 14, border: '1px solid #bfdbfe', marginBottom: 32 }}>
              <p style={{ fontSize: '0.95rem', color: '#1a1a2e', lineHeight: 1.65 }}>{d.biddingStrategy}</p>
            </div>
          </>
        )}
      </>
    );
  }

  // ── ads-tiktok ───────────────────────────────────────────────────
  if (skillName === 'ads-tiktok') {
    const ugcCards = d.creativeDirection?.ugcIdeas?.map((idea: string, i: number) => ({
      platform: 'tiktok',
      headline: idea,
      body: `Native UGC concept for TikTok For Business`,
      cta: 'Follow Now',
      angle: d.creativeDirection?.trendingAudioVibes?.[i % (d.creativeDirection.trendingAudioVibes.length || 1)] || 'Trending',
    })) || [];

    return (
      <>
        <SectionTitle sub="TikTok For Business campaign architecture">Campaign Objectives</SectionTitle>
        <div style={{ marginBottom: 32 }}>
          {d.campaignStructure?.map((c: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', background: '#fff', border: '1px solid #f0eef6', borderRadius: 12, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{ color: '#1a1a2e', fontSize: '0.9rem' }}>Objective: {c.objective}</strong>
                <p style={{ fontSize: '0.83rem', color: '#8888a0', marginTop: 2 }}>Budget: {c.budgetSplit}</p>
              </div>
            </div>
          ))}
        </div>

        {ugcCards.length > 0 && (
          <>
            <SectionTitle sub="Native UGC video concepts for TikTok's algorithm">UGC Creative Concepts</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16, marginBottom: 32 }}>
              {ugcCards.map((c: any, i: number) => <AdCreativeCard key={i} index={i} {...c} runningDays={7 + i * 5} />)}
            </div>
          </>
        )}

        {d.targeting && (
          <>
            <SectionTitle sub="TikTok interest and behavior targeting">Targeting Matrix</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16, marginBottom: 32 }}>
              <div style={{ padding: 20, background: '#fff', borderRadius: 14, border: '1px solid #f0eef6' }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#000', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Interests</p>
                {d.targeting.interests?.map((t: string, i: number) => <Tag key={i} color='#1a1a2e' bg='#f4f4f4'>{t}</Tag>)}
              </div>
              <div style={{ padding: 20, background: '#fff', borderRadius: 14, border: '1px solid #f0eef6' }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#000', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Behaviors</p>
                {d.targeting.behaviors?.map((b: string, i: number) => <Tag key={i} color='#1a1a2e' bg='#f4f4f4'>{b}</Tag>)}
              </div>
            </div>
          </>
        )}
      </>
    );
  }

  // ── ads-linkedin ─────────────────────────────────────────────────
  if (skillName === 'ads-linkedin') {
    return (
      <>
        <SectionTitle sub="LinkedIn B2B ad campaign architecture">Campaign Formats</SectionTitle>
        <div style={{ marginBottom: 32 }}>
          {d.campaignStructure?.map((c: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', background: '#fff', border: '1px solid #f0eef6', borderRadius: 12, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#0077B5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{ color: '#1a1a2e', fontSize: '0.9rem' }}>{c.format}</strong>
                <p style={{ fontSize: '0.83rem', color: '#8888a0', marginTop: 2 }}>Objective: {c.objective} · Budget: {c.budgetSplit}</p>
              </div>
            </div>
          ))}
        </div>

        {d.targetingMatrix && (
          <>
            <SectionTitle sub="Seniority, job function, and company targeting for B2B">Targeting Matrix</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 32 }}>
              {[
                { label: 'Job Titles', items: d.targetingMatrix.jobTitles },
                { label: 'Seniority', items: d.targetingMatrix.seniority },
                { label: 'Industries', items: d.targetingMatrix.industries },
              ].map(({ label, items }) => (
                <div key={label} style={{ padding: 18, background: '#fff', borderRadius: 14, border: '1px solid #f0eef6' }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0077B5', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>{label}</p>
                  {items?.map((item: string, i: number) => <Tag key={i} color='#0077B5' bg='#e0f0fa'>{item}</Tag>)}
                </div>
              ))}
            </div>
          </>
        )}

        {d.contentOffers?.length > 0 && (
          <>
            <SectionTitle sub="Lead magnet and content offers for LinkedIn audiences">Content Offers</SectionTitle>
            <div style={{ marginBottom: 32 }}>
              {d.contentOffers.map((offer: string, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#f0f7ff', borderRadius: 10, marginBottom: 8, border: '1px solid #bfdbfe' }}>
                  <span style={{ color: '#0077B5', fontWeight: 700, fontSize: '1rem' }}>→</span>
                  <p style={{ fontSize: '0.9rem', color: '#1a1a2e' }}>{offer}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </>
    );
  }

  // ── ads-report ───────────────────────────────────────────────────
  if (skillName === 'ads-report' || skillName === 'ads-report-pdf') {
    if (skillName === 'ads-report-pdf') {
      return (
        <>
          {d.executiveSummary && (
            <>
              <SectionTitle sub="Agency-ready executive briefing">Executive Summary</SectionTitle>
              <div style={{ padding: 24, background: '#fafafe', borderRadius: 14, border: '1px solid #f0eef6', marginBottom: 32 }}>
                <p style={{ fontSize: '1rem', color: '#1a1a2e', lineHeight: 1.75 }}>{d.executiveSummary}</p>
              </div>
            </>
          )}
          {d.scoreBreakdown?.length > 0 && (
            <>
              <SectionTitle sub="Dimension scores from the full audit">Score Breakdown</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16, marginBottom: 32 }}>
                {d.scoreBreakdown.map((s: any, i: number) => (
                  <div key={i} style={{ padding: 20, background: '#fff', borderRadius: 14, border: '1px solid #f0eef6', textAlign: 'center' }}>
                    <ScoreBadge score={s.score} label={s.dimension} />
                    <p style={{ fontSize: '0.83rem', color: '#64748b', marginTop: 12, lineHeight: 1.5 }}>{s.summary}</p>
                  </div>
                ))}
              </div>
            </>
          )}
          {d.topFindings?.length > 0 && (
            <>
              <SectionTitle sub="Highest priority items from the analysis">Top Findings</SectionTitle>
              {d.topFindings.map((f: any, i: number) => (
                <FindingRow key={i} severity={f.severity} title={f.title} impact={f.description} recommendation={f.fix} />
              ))}
            </>
          )}
          {d.recommendations?.length > 0 && (
            <>
              <SectionTitle sub="Ordered by impact and priority">Recommendations</SectionTitle>
              <div style={{ marginBottom: 32 }}>
                {d.recommendations.map((r: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 16, padding: 16, background: '#fff', borderRadius: 12, border: '1px solid #f0eef6', marginBottom: 8 }}>
                    <span style={{ background: r.priority === 'High' ? '#fee2e2' : r.priority === 'Medium' ? '#fef3c7' : '#f0fdf4', color: r.priority === 'High' ? '#dc2626' : r.priority === 'Medium' ? '#d97706' : '#16a34a', fontSize: '0.7rem', fontWeight: 700, padding: '4px 10px', borderRadius: 20, height: 'fit-content', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{r.priority}</span>
                    <div>
                      <p style={{ fontWeight: 600, color: '#1a1a2e', fontSize: '0.9rem', marginBottom: 4 }}>{r.action}</p>
                      <p style={{ fontSize: '0.83rem', color: '#64748b' }}>Expected: {r.expectedImpact}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {d.nextSteps?.length > 0 && (
            <>
              <SectionTitle sub="Immediate next actions for your team">Next Steps</SectionTitle>
              <ol style={{ paddingLeft: 20, marginBottom: 32 }}>
                {d.nextSteps.map((s: string, i: number) => (
                  <li key={i} style={{ fontSize: '0.9rem', color: '#1a1a2e', lineHeight: 1.7, marginBottom: 6 }}>{s}</li>
                ))}
              </ol>
            </>
          )}
        </>
      );
    }

    // ads-report (markdown strategy)
    return (
      <>
        {d.executiveSummary && (
          <>
            <SectionTitle>Executive Summary</SectionTitle>
            <div style={{ padding: 24, background: '#fafafe', borderRadius: 14, border: '1px solid #f0eef6', marginBottom: 32 }}>
              <p style={{ fontSize: '1rem', color: '#1a1a2e', lineHeight: 1.75 }}>{d.executiveSummary}</p>
            </div>
          </>
        )}
        {[
          { key: 'targetAudience', label: 'Target Audience' },
          { key: 'platformStrategy', label: 'Platform Strategy' },
          { key: 'creativeDirection', label: 'Creative Direction' },
          { key: 'budgetAllocation', label: 'Budget Allocation' },
          { key: 'funnelStrategy', label: 'Funnel Strategy' },
        ].map(({ key, label }) => d[key] && (
          <div key={key} style={{ marginBottom: 32 }}>
            <SectionTitle>{label}</SectionTitle>
            <div style={{ padding: 20, background: '#fafafe', borderRadius: 14, border: '1px solid #f0eef6' }}>
              <p style={{ fontSize: '0.95rem', color: '#1a1a2e', lineHeight: 1.7 }}>{d[key]}</p>
            </div>
          </div>
        ))}
        {d.ninetyDayPlan?.length > 0 && (
          <>
            <SectionTitle sub="Week-by-week implementation roadmap">90-Day Action Plan</SectionTitle>
            <div style={{ marginBottom: 32 }}>
              {d.ninetyDayPlan.map((step: any, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 16, padding: '12px 16px', borderRadius: 10, background: i % 2 === 0 ? '#fafafe' : '#fff', border: '1px solid #f0eef6', marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, color: '#7B2FBE', minWidth: 80, fontSize: '0.85rem' }}>{step.week}</span>
                  <p style={{ fontSize: '0.875rem', color: '#1a1a2e' }}>{step.action}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </>
    );
  }

  // ── ads-quick / quick ───────────────────────────────────────────
  if (skillName === 'ads-quick' || skillName === 'quick') {
    const signals = d.signals || {};
    const statusColor = (s: string) => s === 'pass' ? '#16a34a' : s === 'warn' ? '#d97706' : '#dc2626';
    const statusBg = (s: string) => s === 'pass' ? '#f0fdf4' : s === 'warn' ? '#fffbeb' : '#fef2f2';
    const statusBorder = (s: string) => s === 'pass' ? '#a7f3d0' : s === 'warn' ? '#fde68a' : '#fecaca';
    const statusIcon = (s: string) => s === 'pass' ? '✓' : s === 'warn' ? '!' : '✕';

    const signalLabels: Record<string, string> = {
      trackingPixels: 'Tracking & Pixels',
      offerClarity: 'Offer Clarity',
      pageSpeed: 'Page Speed',
      ctaStrength: 'CTA Strength',
      adReadiness: 'Ad Readiness',
    };

    return (
      <>
        {/* Overall verdict */}
        {(d.readyToRun !== undefined || d.estimatedReadinessGrade) && (
          <div style={{ marginBottom: 32, padding: 24, borderRadius: 16, background: d.readyToRun ? '#f0fdf4' : '#fef2f2', border: `1px solid ${d.readyToRun ? '#a7f3d0' : '#fecaca'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: '2rem' }}>{d.readyToRun ? '🟢' : '🔴'}</span>
              <div>
                <p style={{ fontWeight: 800, fontSize: '1.1rem', color: d.readyToRun ? '#15803d' : '#dc2626', marginBottom: 2 }}>
                  {d.readyToRun ? 'Ready to Run Ads' : 'Not Ready — Fix Issues First'}
                </p>
                <p style={{ fontSize: '0.83rem', color: '#64748b' }}>Grade: {d.estimatedReadinessGrade} · {d.platformRecommendation}</p>
              </div>
            </div>
            {d.topPriority && (
              <div style={{ background: 'rgba(0,0,0,0.04)', borderRadius: 10, padding: '12px 16px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Top Priority → </span>
                <span style={{ fontSize: '0.92rem', color: '#1a1a2e', fontWeight: 600 }}>{d.topPriority}</span>
              </div>
            )}
          </div>
        )}

        {/* 5 signal cards */}
        {Object.keys(signals).length > 0 && (
          <>
            <SectionTitle sub="5 key readiness signals checked">Readiness Signals</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 12, marginBottom: 32 }}>
              {Object.entries(signals).map(([key, val]: [string, any]) => (
                <div key={key} style={{ padding: '16px 18px', background: statusBg(val.status), border: `1px solid ${statusBorder(val.status)}`, borderRadius: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <p style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1a1a2e' }}>{signalLabels[key] || key}</p>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: statusColor(val.status), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>
                      {statusIcon(val.status)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5, flex: 1, marginRight: 8 }}>{val.detail}</p>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: statusColor(val.status) }}>{val.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Findings */}
        {data.findings?.length > 0 && (
          <>
            <SectionTitle sub="Prioritised issues to fix before spending">Findings</SectionTitle>
            <div style={{ marginBottom: 32 }}>
              {data.findings.map((f: any, i: number) => <FindingRow key={i} {...f} />)}
            </div>
          </>
        )}
      </>
    );
  }

  // ── ads-landing / landing ────────────────────────────────────────
  if (skillName === 'ads-landing' || skillName === 'landing') {
    const scores = d.croScores || {};
    const scoreLabels: Record<string, string> = {
      aboveFoldClarity: 'Above-Fold Clarity',
      headlineStrength: 'Headline Strength',
      ctaEffectiveness: 'CTA Effectiveness',
      messageMatch: 'Message Match',
      socialProof: 'Social Proof',
      frictionLevel: 'Low Friction',
      pageSpeed: 'Page Speed',
      mobileReadiness: 'Mobile Readiness',
    };
    const scoreColor = (s: number) => s >= 70 ? '#16a34a' : s >= 45 ? '#d97706' : '#dc2626';

    return (
      <>
        {/* 8-dimension CRO scorecard */}
        {Object.keys(scores).length > 0 && (
          <>
            <SectionTitle sub="8 dimensions scored for paid traffic performance">CRO Scorecard</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12, marginBottom: 32 }}>
              {Object.entries(scores).map(([key, val]: [string, any]) => {
                const score = Number(val) || 0;
                return (
                  <div key={key} style={{ padding: '16px 18px', background: '#fff', border: '1px solid #f0eef6', borderRadius: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: scoreColor(score), marginBottom: 4 }}>{score}</div>
                    <div style={{ width: '100%', height: 4, background: '#f0eef6', borderRadius: 2, marginBottom: 8 }}>
                      <div style={{ width: `${score}%`, height: '100%', background: scoreColor(score), borderRadius: 2 }} />
                    </div>
                    <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>{scoreLabels[key] || key}</p>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Findings */}
        {data.findings?.length > 0 && (
          <>
            <SectionTitle sub="Issues blocking conversion from paid traffic">Findings</SectionTitle>
            <div style={{ marginBottom: 32 }}>
              {data.findings.map((f: any, i: number) => <FindingRow key={i} {...f} />)}
            </div>
          </>
        )}

        {/* Quick wins */}
        {d.quickWins?.length > 0 && (
          <>
            <SectionTitle sub="Fix these in under 30 minutes each">Quick Wins</SectionTitle>
            <div style={{ marginBottom: 32 }}>
              {d.quickWins.map((win: string, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px', background: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: 10, marginBottom: 8 }}>
                  <span style={{ color: '#16a34a', fontWeight: 800, fontSize: '1rem' }}>{i + 1}.</span>
                  <p style={{ fontSize: '0.9rem', color: '#1a1a2e' }}>{win}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Headline rewrites */}
        {d.headlineRewrites?.length > 0 && (
          <>
            <SectionTitle sub="Drop-in replacements for your current headline">Headline Rewrites</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
              {d.headlineRewrites.map((h: string, i: number) => (
                <div key={i} style={{ padding: '14px 18px', background: '#fafafe', border: '1px solid #f0eef6', borderRadius: 12, fontSize: '1rem', fontWeight: 600, color: '#1a1a2e' }}>
                  "{h}"
                </div>
              ))}
            </div>
          </>
        )}

        {/* CTA optimizations */}
        {d.ctaOptimizations?.length > 0 && (
          <>
            <SectionTitle sub="Better CTA copy and placement suggestions">CTA Improvements</SectionTitle>
            <div style={{ marginBottom: 32 }}>
              {d.ctaOptimizations.map((cta: string, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, marginBottom: 8 }}>
                  <span style={{ color: '#d97706', fontWeight: 700 }}>→</span>
                  <p style={{ fontSize: '0.9rem', color: '#1a1a2e' }}>{cta}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Trust signal gaps */}
        {d.trustSignalGaps?.length > 0 && (
          <>
            <SectionTitle sub="Missing trust elements that reduce conversion">Trust Signal Gaps</SectionTitle>
            <div style={{ marginBottom: 32 }}>
              {d.trustSignalGaps.map((gap: string, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, marginBottom: 8 }}>
                  <span style={{ color: '#dc2626', fontWeight: 700 }}>✕</span>
                  <p style={{ fontSize: '0.9rem', color: '#1a1a2e' }}>{gap}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Messaging recommendations */}
        {d.messagingRecommendations && (
          <>
            <SectionTitle sub="Align page copy with your paid ad messaging">Messaging Recommendations</SectionTitle>
            <div style={{ padding: 20, background: '#fafafe', borderRadius: 14, border: '1px solid #f0eef6', marginBottom: 32 }}>
              <p style={{ fontSize: '0.95rem', color: '#1a1a2e', lineHeight: 1.75 }}>{d.messagingRecommendations}</p>
            </div>
          </>
        )}
      </>
    );
  }

  // ── ads-audiences ────────────────────────────────────────────────
  if (skillName === 'ads-audiences' || skillName === 'audience-targeting' || skillName === 'audiences') {
    const icp = d.primaryICP || {};
    const sec = d.secondaryICP || {};
    const jtbd = d.jobToBeDone || {};
    const tiers = d.audienceTiers || {};
    const pm = d.platformMatrix || {};
    const excl = d.exclusionStrategy || [];
    const seeds = d.lookalikeSeeds || [];

    const tierConfig = [
      { key: 'cold', label: 'COLD — Top of Funnel', color: '#4285F4', bg: '#eff6ff', border: '#bfdbfe', desc: 'Cold interest-based audiences' },
      { key: 'warm', label: 'WARM — Mid Funnel', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', desc: 'Engagement & lookalike audiences' },
      { key: 'hot', label: 'HOT — Bottom Funnel', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', desc: 'Retargeting & customer lists' },
    ];

    return (
      <>
        {/* ICP Hero */}
        {icp.name && (
          <>
            <SectionTitle sub="Your primary buyer persona — be specific, not assumed">Ideal Customer Profile (ICP)</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16, marginBottom: 24 }}>
              <div style={{ padding: 24, background: 'linear-gradient(135deg,#8b5cf610,#7B2FBE10)', border: '1px solid #8b5cf640', borderRadius: 16 }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Primary ICP</p>
                <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1a1a2e', marginBottom: 16 }}>{icp.name}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  {[['Age Range', icp.ageRange], ['Income', icp.income], ['Role/Stage', icp.jobOrLifeStage]].map(([k, v]) => v ? (
                    <div key={k as string} style={{ padding: '8px 12px', background: '#fff', borderRadius: 10, border: '1px solid #f0eef6' }}>
                      <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#8888a0', marginBottom: 2 }}>{k as string}</p>
                      <p style={{ fontSize: '0.85rem', color: '#1a1a2e', fontWeight: 600 }}>{v as string}</p>
                    </div>
                  ) : null)}
                </div>
                {icp.painPoints?.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8888a0', marginBottom: 8, textTransform: 'uppercase' }}>Pain Points</p>
                    {icp.painPoints.map((p: string, i: number) => (
                      <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 10px', background: '#fef2f2', borderRadius: 8, marginBottom: 4 }}>
                        <span style={{ color: '#dc2626', fontWeight: 800, fontSize: '0.85rem' }}>✕</span>
                        <p style={{ fontSize: '0.83rem', color: '#1a1a2e' }}>{p}</p>
                      </div>
                    ))}
                  </div>
                )}
                {icp.triggerEvents?.length > 0 && (
                  <div>
                    <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8888a0', marginBottom: 8, textTransform: 'uppercase' }}>Trigger Events</p>
                    {icp.triggerEvents.map((e: string, i: number) => (
                      <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 10px', background: '#f0fdf4', borderRadius: 8, marginBottom: 4 }}>
                        <span style={{ color: '#16a34a', fontWeight: 800 }}>→</span>
                        <p style={{ fontSize: '0.83rem', color: '#1a1a2e' }}>{e}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Job to Be Done + Secondary ICP */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(jtbd.functional || jtbd.emotional) && (
                  <div style={{ padding: 20, background: '#fff', border: '1px solid #f0eef6', borderRadius: 14, flex: 1 }}>
                    <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7B2FBE', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Job To Be Done</p>
                    {[['Functional', jtbd.functional, '#4285F4'], ['Emotional', jtbd.emotional, '#e8457a'], ['Social', jtbd.social, '#8b5cf6']].filter(([, v]) => v).map(([k, v, c]) => (
                      <div key={k as string} style={{ marginBottom: 10 }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: c as string, textTransform: 'uppercase' }}>{k as string}: </span>
                        <span style={{ fontSize: '0.85rem', color: '#1a1a2e' }}>{v as string}</span>
                      </div>
                    ))}
                  </div>
                )}
                {sec.name && (
                  <div style={{ padding: 18, background: '#fafafe', border: '1px solid #f0eef6', borderRadius: 14 }}>
                    <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Secondary ICP</p>
                    <p style={{ fontWeight: 700, color: '#1a1a2e', marginBottom: 4 }}>{sec.name}</p>
                    <p style={{ fontSize: '0.83rem', color: '#64748b' }}>{sec.description}</p>
                    {sec.difference && <p style={{ fontSize: '0.8rem', color: '#8888a0', marginTop: 6, fontStyle: 'italic' }}>vs Primary: {sec.difference}</p>}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* 3-Tier Audience Funnel */}
        {(tiers.cold || tiers.warm || tiers.hot) && (
          <>
            <SectionTitle sub="Cold → Warm → Hot audience ladder for full-funnel coverage">Audience Tier Strategy</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16, marginBottom: 32 }}>
              {tierConfig.map(({ key, label, color, bg, border }) => {
                const audiences: any[] = tiers[key] || [];
                if (!audiences.length) return null;
                return (
                  <div key={key} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 14, overflow: 'hidden' }}>
                    <div style={{ padding: '12px 18px', borderBottom: `1px solid ${border}` }}>
                      <p style={{ fontWeight: 800, fontSize: '0.88rem', color }}>{label}</p>
                    </div>
                    <div style={{ padding: 16 }}>
                      {audiences.map((a: any, i: number) => (
                        <div key={i} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: i < audiences.length - 1 ? `1px solid ${border}` : 'none' }}>
                          <p style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1a1a2e', marginBottom: 2 }}>{a.label || a}</p>
                          {a.rationale && <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 2 }}>{a.rationale}</p>}
                          {a.estimatedReach && <span style={{ fontSize: '0.72rem', fontWeight: 600, color, background: `${color}15`, padding: '2px 8px', borderRadius: 12 }}>~{a.estimatedReach}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Platform Matrix */}
        {pm.meta && (
          <>
            <SectionTitle sub="Platform-specific targeting parameters ready to set up">Platform Targeting Matrix</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16, marginBottom: 32 }}>

              {/* Meta */}
              {pm.meta && (
                <div style={{ background: '#fff', border: '1px solid #f0eef6', borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ background: '#1877F2', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.88rem' }}>Meta Ads</span>
                    {pm.meta.recommendedBudgetSplit && <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>{pm.meta.recommendedBudgetSplit}</span>}
                  </div>
                  <div style={{ padding: 16 }}>
                    {pm.meta.coldInterests?.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8888a0', textTransform: 'uppercase', marginBottom: 6 }}>Cold Interests</p>
                        <div>{pm.meta.coldInterests.map((i: string, idx: number) => <Tag key={idx} color='#1877F2' bg='#eff6ff'>{i}</Tag>)}</div>
                      </div>
                    )}
                    {pm.meta.warmLookalikes?.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8888a0', textTransform: 'uppercase', marginBottom: 6 }}>Warm Lookalikes</p>
                        <div>{pm.meta.warmLookalikes.map((l: string, idx: number) => <Tag key={idx} color='#f59e0b' bg='#fffbeb'>{l}</Tag>)}</div>
                      </div>
                    )}
                    {pm.meta.hotRetargetingWindows?.length > 0 && (
                      <div>
                        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8888a0', textTransform: 'uppercase', marginBottom: 6 }}>Hot Retargeting</p>
                        <div>{pm.meta.hotRetargetingWindows.map((w: string, idx: number) => <Tag key={idx} color='#dc2626' bg='#fef2f2'>{w}</Tag>)}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Google */}
              {pm.google && (
                <div style={{ background: '#fff', border: '1px solid #f0eef6', borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ background: '#4285F4', padding: '10px 16px' }}>
                    <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.88rem' }}>Google Ads</span>
                  </div>
                  <div style={{ padding: 16 }}>
                    {pm.google.searchIntentKeywords?.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8888a0', textTransform: 'uppercase', marginBottom: 6 }}>Search Intent</p>
                        <div>{pm.google.searchIntentKeywords.map((k: string, idx: number) => <Tag key={idx} color='#4285F4' bg='#eff6ff'>{k}</Tag>)}</div>
                      </div>
                    )}
                    {pm.google.inMarketSegments?.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8888a0', textTransform: 'uppercase', marginBottom: 6 }}>In-Market</p>
                        <div>{pm.google.inMarketSegments.map((s: string, idx: number) => <Tag key={idx} color='#0f9d58' bg='#f0fdf4'>{s}</Tag>)}</div>
                      </div>
                    )}
                    {pm.google.customerMatchStrategy && (
                      <div>
                        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8888a0', textTransform: 'uppercase', marginBottom: 4 }}>Customer Match</p>
                        <p style={{ fontSize: '0.83rem', color: '#1a1a2e' }}>{pm.google.customerMatchStrategy}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TikTok */}
              {pm.tiktok && (
                <div style={{ background: '#fff', border: '1px solid #f0eef6', borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ background: '#000', padding: '10px 16px' }}>
                    <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.88rem' }}>TikTok Ads</span>
                  </div>
                  <div style={{ padding: 16 }}>
                    {pm.tiktok.interestCategories?.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8888a0', textTransform: 'uppercase', marginBottom: 6 }}>Interests</p>
                        <div>{pm.tiktok.interestCategories.map((c: string, idx: number) => <Tag key={idx} color='#1a1a2e' bg='#f4f4f4'>{c}</Tag>)}</div>
                      </div>
                    )}
                    {pm.tiktok.behavioralSignals?.length > 0 && (
                      <div>
                        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8888a0', textTransform: 'uppercase', marginBottom: 6 }}>Behavioral</p>
                        <div>{pm.tiktok.behavioralSignals.map((b: string, idx: number) => <Tag key={idx} color='#1a1a2e' bg='#f4f4f4'>{b}</Tag>)}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* LinkedIn — only if B2B */}
              {pm.linkedin?.applicableIfB2B && (
                <div style={{ background: '#fff', border: '1px solid #f0eef6', borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ background: '#0077B5', padding: '10px 16px' }}>
                    <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.88rem' }}>LinkedIn Ads</span>
                  </div>
                  <div style={{ padding: 16 }}>
                    {[['Job Titles', pm.linkedin.jobTitles, '#0077B5', '#e0f0fa'], ['Seniority', pm.linkedin.seniority, '#0077B5', '#e0f0fa'], ['Industries', pm.linkedin.industries, '#0077B5', '#e0f0fa']].map(([label, items, c, bg]) => (items as string[])?.length ? (
                      <div key={label as string} style={{ marginBottom: 12 }}>
                        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8888a0', textTransform: 'uppercase', marginBottom: 6 }}>{label as string}</p>
                        <div>{(items as string[]).map((item, idx) => <Tag key={idx} color={c as string} bg={bg as string}>{item}</Tag>)}</div>
                      </div>
                    ) : null)}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Lookalike Seeds */}
        {seeds.length > 0 && (
          <>
            <SectionTitle sub="Ranked by conversion probability — use these as Lookalike seeds">Lookalike Seed Audiences</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
              {seeds.map((s: any, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 16, padding: '14px 18px', background: '#fff', border: '1px solid #f0eef6', borderRadius: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: i === 0 ? '#16a34a' : i === 1 ? '#f59e0b' : '#8888a0', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.88rem', flexShrink: 0 }}>
                    #{i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <strong style={{ color: '#1a1a2e', fontSize: '0.92rem' }}>{s.seed}</strong>
                      {s.platform && <Tag color='#7B2FBE' bg='#f3e8ff'>{s.platform}</Tag>}
                    </div>
                    {s.reason && <p style={{ fontSize: '0.83rem', color: '#64748b' }}>{s.reason}</p>}
                    {s.conversionProbability && <p style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600, marginTop: 4 }}>Conv. Probability: {s.conversionProbability}</p>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Exclusion Strategy */}
        {excl.length > 0 && (
          <>
            <SectionTitle sub="Segments to exclude — protect budget from irrelevant audiences">Exclusion Strategy</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12, marginBottom: 32 }}>
              {excl.map((e: any, i: number) => (
                <div key={i} style={{ padding: '14px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ color: '#dc2626', fontWeight: 800 }}>✕</span>
                    <strong style={{ color: '#1a1a2e', fontSize: '0.9rem' }}>{typeof e === 'string' ? e : e.segment}</strong>
                  </div>
                  {e.reason && <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 4 }}>{e.reason}</p>}
                  {e.estimatedWasteSaved && <p style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 600 }}>Saves: {e.estimatedWasteSaved}</p>}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Findings */}
        {data.findings?.length > 0 && (
          <>
            <SectionTitle sub="Key audience strategy issues to address">Findings</SectionTitle>
            <div style={{ marginBottom: 32 }}>
              {data.findings.map((f: any, i: number) => <FindingRow key={i} {...f} />)}
            </div>
          </>
        )}
      </>
    );
  }

  // ── ads-competitors (upgraded 3-tier) ────────────────────────────
  if (skillName === 'ads-competitors' || skillName === 'competitive-intelligence' || skillName === 'competitors') {
    const t1 = d.tier1DirectCompetitors || d.directCompetitors || [];
    const t2 = d.tier2IndirectCompetitors || d.indirectCompetitors || [];
    const t3 = d.tier3Aspirational || d.aspirationalCompetitors || [];
    const intel = d.adIntelligence || {};
    const gaps = d.competitiveGaps || {};
    const playbook = d.positioningPlaybook || {};
    const posRec = d.positioningRecommendation || playbook.recommendedPositioning || '';

    return (
      <>
        {/* Tier 1 — Direct */}
        {t1.length > 0 && (
          <>
            <SectionTitle sub="Same product, same ICP — your direct ad competitors">Tier 1: Direct Competitors</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16, marginBottom: 32 }}>
              {t1.map((c: any, i: number) => {
                const spendColor: Record<string, string> = { low: '#16a34a', medium: '#f59e0b', high: '#dc2626', heavy: '#7B2FBE' };
                const sc = spendColor[(c.adSpendTier || '').toLowerCase()] || '#64748b';
                return (
                  <div key={i} style={{ background: '#fff', border: '1px solid #f0eef6', borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                    <div style={{ background: `${sc}12`, padding: '14px 18px', borderBottom: '1px solid #f0eef6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <strong style={{ color: '#1a1a2e', fontSize: '1rem' }}>{c.name}</strong>
                      <span style={{ background: sc, color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{c.adSpendTier} Spend</span>
                    </div>
                    <div style={{ padding: 18 }}>
                      {c.estimatedMonthlySpend && <p style={{ fontSize: '0.78rem', color: sc, fontWeight: 700, marginBottom: 8 }}>Est. {c.estimatedMonthlySpend}/mo</p>}
                      {c.url && <p style={{ fontSize: '0.75rem', color: '#8888a0', marginBottom: 8 }}>{c.url}</p>}
                      <div style={{ marginBottom: 10 }}>
                        {(c.activePlatforms || c.platforms || []).map((p: string) => <Tag key={p} color='#1877F2' bg='#eff6ff'>{p}</Tag>)}
                      </div>
                      {(c.heroOffer || c.offer) && <p style={{ fontSize: '0.83rem', color: '#475569', marginBottom: 6 }}><strong style={{ color: '#1a1a2e' }}>Offer: </strong>{c.heroOffer || c.offer}</p>}
                      {(c.messagingAngle || c.creativeApproach) && <p style={{ fontSize: '0.83rem', color: '#475569', marginBottom: 6 }}><strong style={{ color: '#1a1a2e' }}>Angle: </strong>{c.messagingAngle || c.creativeApproach}</p>}
                      {c.weakness && (
                        <div style={{ marginTop: 10, padding: '8px 12px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #a7f3d0' }}>
                          <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#16a34a', marginBottom: 2 }}>Their Weakness →</p>
                          <p style={{ fontSize: '0.82rem', color: '#1a1a2e' }}>{c.weakness}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Tier 2 — Indirect */}
        {t2.length > 0 && (
          <>
            <SectionTitle sub="Different product, same problem — alternative solutions your ICP might choose">Tier 2: Indirect Competitors</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12, marginBottom: 32 }}>
              {t2.map((c: any, i: number) => (
                <div key={i} style={{ padding: '16px 18px', background: '#fafafe', border: '1px solid #f0eef6', borderRadius: 12 }}>
                  <strong style={{ color: '#1a1a2e', display: 'block', marginBottom: 6 }}>{c.name}</strong>
                  <p style={{ fontSize: '0.83rem', color: '#64748b', marginBottom: 6 }}>{c.alternativeOffer || c.offer}</p>
                  {c.whyCustomersChooseThem && <p style={{ fontSize: '0.8rem', color: '#8888a0', fontStyle: 'italic', marginBottom: 6 }}>Why chosen: {c.whyCustomersChooseThem}</p>}
                  {c.howToCounterPosition && (
                    <div style={{ padding: '6px 10px', background: '#f3e8ff', borderRadius: 8, marginTop: 8 }}>
                      <p style={{ fontSize: '0.78rem', color: '#7B2FBE' }}>Counter: {c.howToCounterPosition}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Tier 3 — Aspirational */}
        {t3.length > 0 && (
          <>
            <SectionTitle sub="Category leaders to benchmark and borrow tactics from">Tier 3: Aspirational Benchmarks</SectionTitle>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 32 }}>
              {t3.map((c: any, i: number) => (
                <div key={i} style={{ padding: '14px 18px', background: 'linear-gradient(135deg,#7B2FBE08,#5c8aff08)', border: '1px solid #7B2FBE20', borderRadius: 12, flex: '1 1 240px' }}>
                  <strong style={{ color: '#7B2FBE', display: 'block', marginBottom: 4 }}>{c.name}</strong>
                  {c.reasonToStudy && <p style={{ fontSize: '0.83rem', color: '#64748b', marginBottom: 6 }}>{c.reasonToStudy}</p>}
                  {(c.tacticToBorrow || c.whyAspirate) && <p style={{ fontSize: '0.82rem', color: '#1a1a2e', fontWeight: 600 }}>Steal: {c.tacticToBorrow || c.whyAspirate}</p>}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Ad Intelligence */}
        {(intel.dominantPlatforms || intel.saturatedAngles) && (
          <>
            <SectionTitle sub="What the competitive ad landscape looks like in your niche">Ad Intelligence</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16, marginBottom: 32 }}>
              {intel.dominantPlatforms?.length > 0 && (
                <div style={{ padding: 18, background: '#fff', borderRadius: 14, border: '1px solid #f0eef6' }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1877F2', textTransform: 'uppercase', marginBottom: 10 }}>Dominant Platforms</p>
                  {intel.dominantPlatforms.map((p: string, i: number) => <Tag key={i} color='#1877F2' bg='#eff6ff'>{p}</Tag>)}
                </div>
              )}
              {intel.saturatedAngles?.length > 0 && (
                <div style={{ padding: 18, background: '#fef2f2', borderRadius: 14, border: '1px solid #fecaca' }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', marginBottom: 10 }}>Saturated Angles</p>
                  {intel.saturatedAngles.map((a: string, i: number) => <Tag key={i} color='#dc2626' bg='#fee2e2'>{a}</Tag>)}
                </div>
              )}
              {intel.underusedAngles?.length > 0 && (
                <div style={{ padding: 18, background: '#f0fdf4', borderRadius: 14, border: '1px solid #a7f3d0' }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', marginBottom: 10 }}>Underused Angles (Opportunities)</p>
                  {intel.underusedAngles.map((a: string, i: number) => <Tag key={i} color='#16a34a' bg='#dcfce7'>{a}</Tag>)}
                </div>
              )}
              {(intel.industryCPMRange || intel.industryCPARange) && (
                <div style={{ padding: 18, background: '#fff', borderRadius: 14, border: '1px solid #f0eef6' }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 10 }}>Industry Benchmarks</p>
                  {intel.industryCPMRange && <p style={{ fontSize: '0.85rem', color: '#1a1a2e', marginBottom: 4 }}>CPM: {intel.industryCPMRange}</p>}
                  {intel.industryCPARange && <p style={{ fontSize: '0.85rem', color: '#1a1a2e', marginBottom: 4 }}>CPA: {intel.industryCPARange}</p>}
                  {intel.averageROASBenchmark && <p style={{ fontSize: '0.85rem', color: '#1a1a2e' }}>ROAS: {intel.averageROASBenchmark}</p>}
                </div>
              )}
            </div>
          </>
        )}

        {/* Gap Analysis */}
        {(gaps.platformGaps || gaps.offerGaps || gaps.audienceGaps || gaps.creativeGaps || gaps.messagingGaps) && (
          <>
            <SectionTitle sub="Untapped opportunities your competitors are leaving open">Gap Analysis</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16, marginBottom: 32 }}>
              {[
                { label: 'Platform Gaps', items: gaps.platformGaps, color: '#4285F4', bg: '#eff6ff' },
                { label: 'Offer Gaps', items: gaps.offerGaps, color: '#e8457a', bg: '#fff0f3' },
                { label: 'Audience Gaps', items: gaps.audienceGaps, color: '#7B2FBE', bg: '#f3e8ff' },
                { label: 'Creative Gaps', items: gaps.creativeGaps, color: '#00c9a7', bg: '#f0fdf9' },
                { label: 'Messaging Gaps', items: gaps.messagingGaps, color: '#f59e0b', bg: '#fffbeb' },
              ].map(({ label, items, color, bg }) => {
                const normalizedItems = Array.isArray(items) ? items.map((item: any) => typeof item === 'string' ? item : `${item.platform || ''}: ${item.opportunity || ''}`) : [];
                return normalizedItems.length ? (
                  <div key={label} style={{ padding: 18, background: bg, borderRadius: 14, border: `1px solid ${color}30` }}>
                    <p style={{ fontSize: '0.78rem', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>{label}</p>
                    <ul style={{ paddingLeft: 16 }}>
                      {normalizedItems.map((item: string, i: number) => (
                        <li key={i} style={{ fontSize: '0.875rem', color: '#1a1a2e', lineHeight: 1.6, marginBottom: 4 }}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null;
              })}
            </div>
          </>
        )}

        {/* Positioning Playbook */}
        {(posRec || playbook.messagingAnglesToOwn?.length > 0) && (
          <>
            <SectionTitle sub="Your differentiation playbook based on competitive landscape">Positioning Playbook</SectionTitle>
            {(playbook.currentPositioning || playbook.recommendedPositioning) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                {playbook.currentPositioning && (
                  <div style={{ padding: 18, background: '#fafafe', borderRadius: 14, border: '1px solid #f0eef6' }}>
                    <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#8888a0', textTransform: 'uppercase', marginBottom: 8 }}>Current Positioning</p>
                    <p style={{ fontSize: '0.9rem', color: '#1a1a2e', lineHeight: 1.6 }}>{playbook.currentPositioning}</p>
                  </div>
                )}
                {playbook.recommendedPositioning && (
                  <div style={{ padding: 18, background: 'linear-gradient(135deg,#7B2FBE10,#5c8aff10)', borderRadius: 14, border: '1px solid #7B2FBE20' }}>
                    <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7B2FBE', textTransform: 'uppercase', marginBottom: 8 }}>Recommended Positioning</p>
                    <p style={{ fontSize: '0.9rem', color: '#1a1a2e', lineHeight: 1.6 }}>{playbook.recommendedPositioning}</p>
                  </div>
                )}
              </div>
            )}
            {posRec && !playbook.recommendedPositioning && (
              <div style={{ padding: 24, background: 'linear-gradient(135deg,#7B2FBE10,#5c8aff10)', border: '1px solid #7B2FBE20', borderRadius: 14, marginBottom: 20 }}>
                <p style={{ fontSize: '1rem', color: '#1a1a2e', lineHeight: 1.7 }}>{posRec}</p>
              </div>
            )}
            {playbook.messagingAnglesToOwn?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7B2FBE', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Messaging Angles to Own</p>
                {playbook.messagingAnglesToOwn.map((a: string, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 14px', background: '#f3e8ff', borderRadius: 10, marginBottom: 6, border: '1px solid #d8b4fe' }}>
                    <span style={{ color: '#7B2FBE', fontWeight: 700 }}>→</span>
                    <p style={{ fontSize: '0.9rem', color: '#1a1a2e' }}>{a}</p>
                  </div>
                ))}
              </div>
            )}
            {playbook.blueOceanOpportunity && (
              <div style={{ padding: 20, background: '#f0fdf4', borderRadius: 14, border: '1px solid #a7f3d0', marginBottom: 32 }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', marginBottom: 8 }}>Blue Ocean Opportunity</p>
                <p style={{ fontSize: '0.95rem', color: '#1a1a2e', lineHeight: 1.65 }}>{playbook.blueOceanOpportunity}</p>
              </div>
            )}
            {playbook.taglineOptions?.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 10 }}>Tagline Options</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {playbook.taglineOptions.map((t: string, i: number) => (
                    <div key={i} style={{ padding: '8px 16px', background: '#fafafe', border: '1px solid #f0eef6', borderRadius: 20, fontSize: '0.9rem', fontWeight: 600, color: '#1a1a2e', fontStyle: 'italic' }}>
                      "{t}"
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Findings */}
        {data.findings?.length > 0 && (
          <>
            <SectionTitle sub="Key competitive positioning issues">Findings</SectionTitle>
            <div style={{ marginBottom: 32 }}>
              {data.findings.map((f: any, i: number) => <FindingRow key={i} {...f} />)}
            </div>
          </>
        )}
      </>
    );
  }

  // ── ads-funnel / funnel ───────────────────────────────────────────
  if (skillName === 'ads-funnel' || skillName === 'funnel-conversion' || skillName === 'funnel') {
    const lp = d.landingPageScores || {};
    const fm = d.funnelMap || {};
    const routing = d.audienceRouting || [];
    const buildSeq = d.funnelBuildSequence || [];
    const blockers = d.conversionBlockers || [];
    const lScore = data.landingPageScore ?? data.score ?? 0;
    const fScore = data.deliverables?.funnelScore ?? data.funnelScore ?? 0;

    const lpLabels: Record<string, string> = {
      loadSpeed: 'Load Speed', aboveFoldClarity: 'Above Fold', headlineStrength: 'Headline',
      socialProof: 'Social Proof', ctaClarity: 'CTA Clarity', formFriction: 'Low Friction',
      trustSignals: 'Trust Signals', messageMatch: 'Message Match',
    };
    const scoreColor = (s: number) => s >= 70 ? '#16a34a' : s >= 45 ? '#d97706' : '#dc2626';

    const stageConfig = [
      { key: 'tofu', label: 'TOFU — Top of Funnel', sublabel: 'Awareness & Discovery', color: '#4285F4', bg: '#eff6ff', border: '#bfdbfe' },
      { key: 'mofu', label: 'MOFU — Middle of Funnel', sublabel: 'Consideration & Nurture', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
      { key: 'bofu', label: 'BOFU — Bottom of Funnel', sublabel: 'Conversion & Close', color: '#16a34a', bg: '#f0fdf4', border: '#a7f3d0' },
    ];

    const statusBadge = (s: string) => ({
      bg: s === 'Present' ? '#f0fdf4' : s === 'Partial' ? '#fffbeb' : '#fef2f2',
      text: s === 'Present' ? '#16a34a' : s === 'Partial' ? '#d97706' : '#dc2626',
    });

    return (
      <>
        {/* Dual Score Banner */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Landing Page Score', score: lScore, sub: 'Conversion readiness' },
            { label: 'Funnel Coverage Score', score: fScore, sub: 'TOFU/MOFU/BOFU completeness' },
          ].map(({ label, score, sub }) => {
            const c = scoreColor(score);
            return (
              <div key={label} style={{ padding: 24, background: `${c}08`, border: `1px solid ${c}30`, borderRadius: 14, textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: c, marginBottom: 4 }}>{score}</div>
                <p style={{ fontWeight: 700, color: '#1a1a2e', marginBottom: 2 }}>{label}</p>
                <p style={{ fontSize: '0.8rem', color: '#8888a0' }}>{sub}</p>
              </div>
            );
          })}
        </div>

        {/* Landing Page Scorecard */}
        {Object.keys(lp).length > 0 && (
          <>
            <SectionTitle sub="8 conversion dimensions scored for paid traffic">Landing Page Scorecard</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10, marginBottom: 32 }}>
              {Object.entries(lp).map(([key, val]: [string, any]) => {
                const s = Number(val) || 0;
                return (
                  <div key={key} style={{ padding: '14px 16px', background: '#fff', border: '1px solid #f0eef6', borderRadius: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: scoreColor(s), marginBottom: 4 }}>{s}</div>
                    <div style={{ width: '100%', height: 4, background: '#f0eef6', borderRadius: 2, marginBottom: 8 }}>
                      <div style={{ width: `${s}%`, height: '100%', background: scoreColor(s), borderRadius: 2 }} />
                    </div>
                    <p style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b' }}>{lpLabels[key] || key}</p>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Funnel Map — 3 stages */}
        {(fm.tofu || fm.mofu || fm.bofu) && (
          <>
            <SectionTitle sub="Current funnel state — green = present, yellow = partial, red = missing">Funnel Architecture Map</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16, marginBottom: 32 }}>
              {stageConfig.map(({ key, label, sublabel, color, bg, border }) => {
                const stage: any = fm[key];
                if (!stage) return null;
                const sb = statusBadge(stage.status);
                return (
                  <div key={key} style={{ background: '#fff', border: `1px solid ${border}`, borderRadius: 14, overflow: 'hidden' }}>
                    <div style={{ background: bg, padding: '12px 18px', borderBottom: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontWeight: 800, fontSize: '0.9rem', color }}>{label}</p>
                        <p style={{ fontSize: '0.75rem', color: '#8888a0' }}>{sublabel}</p>
                      </div>
                      <span style={{ background: sb.bg, color: sb.text, fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{stage.status}</span>
                    </div>
                    <div style={{ padding: 16 }}>
                      {stage.currentState && <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: 12 }}>{stage.currentState}</p>}
                      {(stage.recommendedAdType || stage.recommendedOffer) && (
                        <div style={{ padding: '8px 12px', background: `${color}10`, borderRadius: 8, marginBottom: 10 }}>
                          <p style={{ fontSize: '0.78rem', fontWeight: 700, color, marginBottom: 2 }}>Recommended</p>
                          <p style={{ fontSize: '0.83rem', color: '#1a1a2e' }}>{stage.recommendedAdType || stage.recommendedOffer}</p>
                        </div>
                      )}
                      {stage.retargetingWindow && <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 6 }}>Retargeting Window: {stage.retargetingWindow}</p>}
                      {stage.stepsToConvert !== undefined && <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 6 }}>Steps to convert: <strong>{stage.stepsToConvert}</strong></p>}
                      {stage.gaps?.length > 0 && (
                        <div>
                          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', marginBottom: 6 }}>Gaps</p>
                          {stage.gaps.map((g: string, i: number) => (
                            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                              <span style={{ color: '#dc2626', fontSize: '0.8rem' }}>✕</span>
                              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>{g}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {stage.recommendedContent?.length > 0 && (
                        <div style={{ marginTop: 8 }}>
                          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Content Ideas</p>
                          {stage.recommendedContent.map((c: string, i: number) => <Tag key={i} color={color} bg={`${color}15`}>{c}</Tag>)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Audience Routing */}
        {routing.length > 0 && (
          <>
            <SectionTitle sub="How to route different audiences through the funnel">Audience Routing Logic</SectionTitle>
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, marginBottom: 6, padding: '8px 14px', background: '#f8f7fc', borderRadius: '10px 10px 0 0', border: '1px solid #f0eef6' }}>
                {['Audience Type', 'Ad Objective', 'Creative Direction', 'Pixel Event'].map(h => (
                  <p key={h} style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8888a0', textTransform: 'uppercase' }}>{h}</p>
                ))}
              </div>
              {routing.map((row: any, i: number) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, padding: '12px 14px', background: i % 2 === 0 ? '#fff' : '#fafafe', border: '1px solid #f0eef6', borderTop: 'none' }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1a1a2e' }}>{row.audienceType}</p>
                  <p style={{ fontSize: '0.83rem', color: '#7B2FBE' }}>{row.adObjective}</p>
                  <p style={{ fontSize: '0.83rem', color: '#475569' }}>{row.creative}</p>
                  <p style={{ fontSize: '0.83rem', color: '#16a34a' }}>{row.pixelEvent}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Build Sequence */}
        {buildSeq.length > 0 && (
          <>
            <SectionTitle sub="Prioritised by revenue impact — build in this order">Funnel Build Sequence</SectionTitle>
            <div style={{ marginBottom: 32 }}>
              {buildSeq.map((step: any, i: number) => {
                const effortColor = { Low: '#16a34a', Medium: '#d97706', High: '#dc2626' }[(step.effort || 'Medium') as string] || '#64748b';
                return (
                  <div key={i} style={{ display: 'flex', gap: 16, padding: '14px 18px', background: '#fff', border: '1px solid #f0eef6', borderRadius: 12, marginBottom: 8, alignItems: 'flex-start' }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#7B2FBE', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>
                      {step.step || i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <p style={{ fontWeight: 700, color: '#1a1a2e', fontSize: '0.9rem' }}>{step.action}</p>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: effortColor, background: `${effortColor}15`, padding: '2px 8px', borderRadius: 12 }}>{step.effort} Effort</span>
                      </div>
                      {step.impact && <p style={{ fontSize: '0.82rem', color: '#64748b' }}>Impact: {step.impact}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Conversion Blockers */}
        {blockers.length > 0 && (
          <>
            <SectionTitle sub="Top issues killing conversions right now">Conversion Blockers</SectionTitle>
            <div style={{ marginBottom: 32 }}>
              {blockers.map((b: any, i: number) => (
                <div key={i} style={{ padding: '14px 18px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, marginBottom: 8 }}>
                  <p style={{ fontWeight: 700, color: '#dc2626', marginBottom: 4, fontSize: '0.9rem' }}>{typeof b === 'string' ? b : b.blocker}</p>
                  {b.impact && <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: 4 }}>Impact: {b.impact}</p>}
                  {b.fix && (
                    <div style={{ padding: '6px 10px', background: '#fff', borderRadius: 8, marginTop: 6 }}>
                      <p style={{ fontSize: '0.82rem', color: '#1a1a2e' }}>Fix: {b.fix}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Headline + CTA rewrites */}
        {(d.headlineRewrites?.length > 0 || d.ctaRewrites?.length > 0) && (
          <>
            <SectionTitle sub="Drop-in replacements for your current copy">Copy Improvements</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
              {d.headlineRewrites?.length > 0 && (
                <div>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 10 }}>Headline Rewrites</p>
                  {d.headlineRewrites.map((h: string, i: number) => (
                    <div key={i} style={{ padding: '12px 16px', background: '#fafafe', border: '1px solid #f0eef6', borderRadius: 10, marginBottom: 6, fontSize: '0.9rem', fontWeight: 600, color: '#1a1a2e' }}>"{h}"</div>
                  ))}
                </div>
              )}
              {d.ctaRewrites?.length > 0 && (
                <div>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 10 }}>CTA Rewrites</p>
                  {d.ctaRewrites.map((c: string, i: number) => (
                    <div key={i} style={{ padding: '12px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, marginBottom: 6, fontSize: '0.9rem', fontWeight: 600, color: '#1a1a2e' }}>→ {c}</div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Findings */}
        {data.findings?.length > 0 && (
          <>
            <SectionTitle sub="Key funnel issues to address">Findings</SectionTitle>
            <div style={{ marginBottom: 32 }}>
              {data.findings.map((f: any, i: number) => <FindingRow key={i} {...f} />)}
            </div>
          </>
        )}
      </>
    );
  }

  // ── ads-budget / platform-budget ──────────────────────────────────
  if (skillName === 'ads-budget' || skillName === 'platform-budget' || skillName === 'budget') {
    const platforms = d.platformRanking || [];
    const budgetAlloc = d.budgetAllocation || {};
    const kpi = d.kpiBenchmarks || {};
    const bidding = d.biddingStrategies || [];
    const scaling = d.scalingFramework || {};
    const monthly = d.monthlyPlan || {};

    const recColor = (r: string) => r === 'Prioritize' ? '#16a34a' : r === 'Test' ? '#f59e0b' : '#dc2626';
    const recBg = (r: string) => r === 'Prioritize' ? '#f0fdf4' : r === 'Test' ? '#fffbeb' : '#fef2f2';

    const funnelStages = [
      { key: 'tofu', label: 'TOFU', color: '#4285F4' },
      { key: 'mofu', label: 'MOFU', color: '#f59e0b' },
      { key: 'bofu', label: 'BOFU', color: '#16a34a' },
      { key: 'testing', label: 'Testing', color: '#8b5cf6' },
    ];

    return (
      <>
        {/* Platform Ranking */}
        {platforms.length > 0 && (
          <>
            <SectionTitle sub="Platform fit scored and ranked for your business type">Platform Fit Ranking</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
              {platforms.map((p: any, i: number) => {
                const rc = recColor(p.recommendation);
                const rb = recBg(p.recommendation);
                return (
                  <div key={i} style={{ background: '#fff', border: '1px solid #f0eef6', borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f0eef6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#7B2FBE', fontSize: '0.85rem', flexShrink: 0 }}>
                        #{i + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                          <strong style={{ color: '#1a1a2e', fontSize: '0.95rem' }}>{p.platform}</strong>
                          <span style={{ background: rb, color: rc, fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 12 }}>{p.recommendation}</span>
                          <span style={{ marginLeft: 'auto', fontWeight: 800, color: p.fitScore >= 70 ? '#16a34a' : p.fitScore >= 45 ? '#d97706' : '#dc2626', fontSize: '1rem' }}>
                            {p.fitScore}/100
                          </span>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: '#64748b' }}>{p.reason}</p>
                      </div>
                    </div>
                    {/* Fit bar */}
                    <div style={{ height: 4, background: '#f0eef6' }}>
                      <div style={{ width: `${p.fitScore}%`, height: '100%', background: p.fitScore >= 70 ? '#16a34a' : p.fitScore >= 45 ? '#f59e0b' : '#dc2626' }} />
                    </div>
                    {/* Budget row */}
                    {(p.allocation || p.allocationDollars) && (
                      <div style={{ padding: '8px 18px 12px', display: 'flex', gap: 20, alignItems: 'center' }}>
                        {p.allocationDollars && <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1a1a2e' }}>{p.allocationDollars}/mo</span>}
                        {p.allocation && <span style={{ fontSize: '0.83rem', color: '#8888a0' }}>({p.allocation})</span>}
                        {p.primaryKPI && <span style={{ fontSize: '0.8rem', color: '#7B2FBE', marginLeft: 'auto' }}>KPI: {p.primaryKPI}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Budget Funnel Allocation */}
        {Object.keys(budgetAlloc).length > 0 && (
          <>
            <SectionTitle sub="How to split budget across the funnel for optimal ROI">Budget Funnel Split</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 32 }}>
              {funnelStages.map(({ key, label, color }) => {
                const stage = budgetAlloc[key];
                if (!stage) return null;
                return (
                  <div key={key} style={{ padding: 18, background: '#fff', border: `1px solid ${color}30`, borderRadius: 14, textAlign: 'center' }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 700, color, textTransform: 'uppercase', marginBottom: 8 }}>{label}</p>
                    {stage.dollars && <p style={{ fontSize: '1.3rem', fontWeight: 900, color: '#1a1a2e', marginBottom: 2 }}>{stage.dollars}</p>}
                    {stage.percentage && <p style={{ fontSize: '0.88rem', color: '#8888a0', marginBottom: 8 }}>{stage.percentage}</p>}
                    {stage.purpose && <p style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>{stage.purpose}</p>}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Monthly Ramp Plan */}
        {(monthly.month1 || monthly.month3 || monthly.month6) && (
          <>
            <SectionTitle sub="How to evolve your budget as performance data comes in">Budget Ramp Plan</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 32 }}>
              {[['Month 1', monthly.month1, '#4285F4'], ['Month 3', monthly.month3, '#7B2FBE'], ['Month 6', monthly.month6, '#16a34a']].filter(([, v]) => v).map(([label, val, c]) => (
                <div key={label as string} style={{ padding: 18, background: '#fafafe', border: `1px solid ${c as string}30`, borderRadius: 14 }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: c as string, textTransform: 'uppercase', marginBottom: 8 }}>{label as string}</p>
                  <p style={{ fontSize: '0.88rem', color: '#1a1a2e', lineHeight: 1.6 }}>{val as string}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* KPI Benchmarks */}
        {(kpi.meta || kpi.googleSearch) && (
          <>
            <SectionTitle sub="Industry benchmarks — these are your green/yellow/red targets">KPI Benchmarks</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16, marginBottom: 32 }}>
              {[
                { key: 'meta', label: 'Meta Ads', color: '#1877F2', fields: ['cpm', 'cpc', 'ctr', 'cpa', 'roas'] },
                { key: 'googleSearch', label: 'Google Search', color: '#4285F4', fields: ['cpc', 'ctr', 'conversionRate', 'cpa'] },
                { key: 'tiktok', label: 'TikTok', color: '#000', fields: ['cpm', 'cpc', 'ctr', 'cpa'] },
                { key: 'linkedin', label: 'LinkedIn', color: '#0077B5', fields: ['cpl', 'ctr'] },
              ].map(({ key, label, color, fields }) => {
                const bench = kpi[key];
                if (!bench) return null;
                return (
                  <div key={key} style={{ background: '#fff', border: '1px solid #f0eef6', borderRadius: 14, overflow: 'hidden' }}>
                    <div style={{ background: color, padding: '10px 16px' }}>
                      <p style={{ color: '#fff', fontWeight: 700, fontSize: '0.88rem' }}>{label}</p>
                    </div>
                    <div style={{ padding: 16 }}>
                      {fields.filter(f => bench[f]).map(f => (
                        <div key={f} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0eef6' }}>
                          <p style={{ fontSize: '0.82rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>{f.toUpperCase()}</p>
                          <p style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1a1a2e' }}>{bench[f]}</p>
                        </div>
                      ))}
                      {bench.greenThreshold && (
                        <div style={{ marginTop: 10, padding: '8px 10px', background: '#f0fdf4', borderRadius: 8 }}>
                          <p style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>✓ Scale when: {bench.greenThreshold}</p>
                        </div>
                      )}
                      {bench.redThreshold && (
                        <div style={{ marginTop: 6, padding: '8px 10px', background: '#fef2f2', borderRadius: 8 }}>
                          <p style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600 }}>✕ Pause if: {bench.redThreshold}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Bidding Strategies */}
        {bidding.length > 0 && (
          <>
            <SectionTitle sub="Platform-specific bid strategy recommendations">Bidding Strategies</SectionTitle>
            <div style={{ marginBottom: 32 }}>
              {bidding.map((b: any, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 16, padding: '14px 18px', background: '#fff', border: '1px solid #f0eef6', borderRadius: 12, marginBottom: 8 }}>
                  <div style={{ flexShrink: 0, minWidth: 80 }}>
                    <p style={{ fontWeight: 700, color: '#7B2FBE', fontSize: '0.88rem' }}>{b.platform}</p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      {b.startingBid && <Tag color='#4285F4' bg='#eff6ff'>Start: {b.startingBid}</Tag>}
                      {b.graduateTo && <Tag color='#16a34a' bg='#f0fdf4'>→ {b.graduateTo}</Tag>}
                    </div>
                    {b.rationale && <p style={{ fontSize: '0.82rem', color: '#64748b' }}>{b.rationale}</p>}
                  </div>
                  {b.pacing && <p style={{ fontSize: '0.8rem', color: '#8888a0', flexShrink: 0 }}>{b.pacing}</p>}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Scaling Framework */}
        {(scaling.scaleSignals || scaling.pauseSignals || scaling.milestones) && (
          <>
            <SectionTitle sub="When to scale, when to pause, and your budget milestones">Scaling Framework</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              {scaling.scaleSignals?.length > 0 && (
                <div style={{ padding: 18, background: '#f0fdf4', borderRadius: 14, border: '1px solid #a7f3d0' }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', marginBottom: 10 }}>Scale When →</p>
                  {scaling.scaleSignals.map((s: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                      <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
                      <p style={{ fontSize: '0.83rem', color: '#1a1a2e' }}>{s}</p>
                    </div>
                  ))}
                </div>
              )}
              {scaling.pauseSignals?.length > 0 && (
                <div style={{ padding: 18, background: '#fef2f2', borderRadius: 14, border: '1px solid #fecaca' }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', marginBottom: 10 }}>Pause If →</p>
                  {scaling.pauseSignals.map((s: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                      <span style={{ color: '#dc2626', fontWeight: 700 }}>✕</span>
                      <p style={{ fontSize: '0.83rem', color: '#1a1a2e' }}>{s}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {scaling.milestones?.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                {scaling.milestones.map((m: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 16, padding: '12px 16px', background: i % 2 === 0 ? '#fafafe' : '#fff', border: '1px solid #f0eef6', borderRadius: 10, marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, color: '#7B2FBE', minWidth: 70 }}>{m.period}</span>
                    <p style={{ fontSize: '0.85rem', color: '#475569', flex: 1 }}>Target: {m.target}</p>
                    <p style={{ fontSize: '0.83rem', color: '#16a34a', fontWeight: 600, flexShrink: 0 }}>{m.budgetAction}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Findings */}
        {data.findings?.length > 0 && (
          <>
            <SectionTitle sub="Key budget strategy issues">Findings</SectionTitle>
            <div style={{ marginBottom: 32 }}>
              {data.findings.map((f: any, i: number) => <FindingRow key={i} {...f} />)}
            </div>
          </>
        )}
      </>
    );
  }

  // ── ads-google (enhanced) ────────────────────────────────────────
  if (skillName === 'ads-google' || skillName === 'google') {
    const search = d.searchCampaigns || [];
    const kw = d.keywordBuckets || [];
    const negKw = d.negativeKeywords || d.negativeKeywordsSeed || [];
    const rsa = d.rsaCopyBankSearch || {};
    const shopping = d.shoppingCampaign || {};
    const display = d.displayRemarketing || {};
    const audLayers = d.audienceLayers || {};
    const pmax = d.performanceMax || {};
    const budget = d.budgetBreakdown || {};

    const intentColor: Record<string, string> = {
      'Branded': '#7B2FBE', 'Competitor': '#e8457a', 'Category': '#4285F4',
      'Problem-Aware': '#f59e0b', 'Solution-Aware': '#16a34a',
    };

    return (
      <>
        {/* Budget Breakdown Bar */}
        {Object.keys(budget).length > 0 && (
          <>
            <SectionTitle sub="How to split your Google Ads budget across campaign types">Budget Breakdown</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 32 }}>
              {[['Search', budget.search, '#4285F4'], ['Shopping', budget.shopping, '#0f9d58'], ['Display', budget.display, '#f4b400'], ['Perf Max', budget.performanceMax, '#db4437']].filter(([, v]) => v).map(([k, v, c]) => (
                <div key={k as string} style={{ padding: 16, background: '#fff', border: `1px solid ${c as string}30`, borderRadius: 14, textAlign: 'center' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: c as string, textTransform: 'uppercase', marginBottom: 6 }}>{k as string}</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1a1a2e' }}>{v as string}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Search Campaigns */}
        {search.length > 0 && (
          <>
            <SectionTitle sub="Full campaign architecture for Google Search">Search Campaign Structure</SectionTitle>
            <div style={{ marginBottom: 32 }}>
              {search.map((c: any, i: number) => (
                <div key={i} style={{ background: '#fff', border: '1px solid #f0eef6', borderRadius: 14, marginBottom: 12, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', borderBottom: '1px solid #f0eef6' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#4285F4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <strong style={{ color: '#1a1a2e', fontSize: '0.95rem' }}>{c.campaignName}</strong>
                      <p style={{ fontSize: '0.82rem', color: '#8888a0', marginTop: 2 }}>
                        {c.biddingStrategy && `Bid: ${c.biddingStrategy}`}
                        {c.budgetDollars && ` · ${c.budgetDollars}/mo`}
                        {c.budgetAllocation && ` (${c.budgetAllocation})`}
                      </p>
                    </div>
                    {c.matchTypeApproach && <Tag color='#4285F4' bg='#eff6ff'>{c.matchTypeApproach}</Tag>}
                  </div>
                  {c.adGroups?.length > 0 && (
                    <div style={{ padding: '12px 18px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {c.adGroups.map((ag: any, j: number) => (
                        <div key={j} style={{ padding: '6px 12px', background: '#f0f7ff', borderRadius: 20, fontSize: '0.8rem', color: '#1d4ed8', fontWeight: 600 }}>
                          {ag.name || ag.theme}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Keyword Buckets */}
        {kw.length > 0 && (
          <>
            <SectionTitle sub="Organized by search intent — ready for Google Ads Keyword Planner">Keyword Strategy</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16, marginBottom: 32 }}>
              {kw.map((b: any, i: number) => {
                const c = intentColor[b.category] || '#64748b';
                return (
                  <div key={i} style={{ padding: 18, background: '#fff', borderRadius: 14, border: `1px solid ${c}25` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <p style={{ fontSize: '0.78rem', fontWeight: 700, color: c, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{b.category}</p>
                      {b.matchTypes && <Tag color={c} bg={`${c}15`}>{b.matchTypes}</Tag>}
                    </div>
                    {b.intent && <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 10 }}>{b.intent}</p>}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {(b.keywords || []).map((k: string, j: number) => (
                        <div key={j} style={{ padding: '4px 10px', background: `${c}12`, borderRadius: 8, fontSize: '0.82rem', color: c, fontWeight: 500 }}>{k}</div>
                      ))}
                    </div>
                    {b.bidModifier && <p style={{ fontSize: '0.75rem', color: '#8888a0', marginTop: 10 }}>Bid modifier: {b.bidModifier}</p>}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* RSA Copy Bank */}
        {(rsa.headlines?.length > 0 || rsa.descriptions?.length > 0) && (
          <>
            <SectionTitle sub="Responsive Search Ad assets — paste directly into Google Ads">RSA Copy Bank</SectionTitle>
            <div style={{ background: '#fff', border: '1px solid #f0eef6', borderRadius: 14, padding: 24, marginBottom: 32 }}>
              {rsa.pinnedHeadline1 && (
                <div style={{ padding: '10px 14px', background: '#f0f7ff', borderRadius: 10, marginBottom: 16, display: 'flex', gap: 10 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4285F4' }}>PIN H1</span>
                  <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1a1a2e' }}>{rsa.pinnedHeadline1}</p>
                </div>
              )}
              {rsa.headlines?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4285F4', textTransform: 'uppercase', marginBottom: 10 }}>Headlines (max 30 chars each)</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {rsa.headlines.map((h: string, i: number) => (
                      <div key={i} style={{ background: '#f8faff', border: '1px solid #e0eaff', borderRadius: 8, padding: '6px 12px', fontSize: '0.85rem', color: '#1a1a2e' }}>{h}</div>
                    ))}
                  </div>
                </div>
              )}
              {rsa.descriptions?.length > 0 && (
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4285F4', textTransform: 'uppercase', marginBottom: 10 }}>Descriptions (max 90 chars each)</p>
                  {rsa.descriptions.map((desc: string, i: number) => (
                    <p key={i} style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6, marginBottom: 6, padding: '8px 12px', background: '#fafafe', borderRadius: 8 }}>{desc}</p>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Shopping */}
        {shopping.applicable && (
          <>
            <SectionTitle sub="Google Shopping and Performance Max for e-commerce">Shopping Strategy</SectionTitle>
            <div style={{ padding: 20, background: '#fff', border: '1px solid #f0eef6', borderRadius: 14, marginBottom: 32 }}>
              {shopping.structure && <p style={{ fontSize: '0.9rem', color: '#1a1a2e', marginBottom: 14 }}>{shopping.structure}</p>}
              {shopping.feedOptimizationTips?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f9d58', textTransform: 'uppercase', marginBottom: 8 }}>Feed Optimisation Tips</p>
                  {shopping.feedOptimizationTips.map((tip: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 10px', marginBottom: 4, background: '#f0fdf4', borderRadius: 8 }}>
                      <span style={{ color: '#0f9d58', fontWeight: 700 }}>→</span>
                      <p style={{ fontSize: '0.85rem', color: '#1a1a2e' }}>{tip}</p>
                    </div>
                  ))}
                </div>
              )}
              {shopping.targetROAS && <p style={{ fontSize: '0.85rem', color: '#1a1a2e', marginTop: 8 }}>Target ROAS: <strong>{shopping.targetROAS}</strong></p>}
            </div>
          </>
        )}

        {/* Display Remarketing */}
        {(display.audienceSegments?.length > 0 || display.remarketing30Day) && (
          <>
            <SectionTitle sub="Display and remarketing campaign setup">Display & Remarketing</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16, marginBottom: 32 }}>
              {display.audienceSegments?.map((seg: any, i: number) => (
                <div key={i} style={{ padding: 16, background: '#fff', border: '1px solid #f0eef6', borderRadius: 12 }}>
                  <p style={{ fontWeight: 700, color: '#1a1a2e', marginBottom: 4, fontSize: '0.9rem' }}>{seg.segment}</p>
                  {seg.adAngle && <p style={{ fontSize: '0.83rem', color: '#64748b', marginBottom: 6 }}>{seg.adAngle}</p>}
                  {seg.frequencyCap && <Tag color='#f4b400' bg='#fffbeb'>Cap: {seg.frequencyCap}</Tag>}
                </div>
              ))}
              {(display.remarketing30Day || display.remarketing7Day) && (
                <div style={{ padding: 16, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12 }}>
                  <p style={{ fontWeight: 700, color: '#d97706', marginBottom: 10 }}>Remarketing Windows</p>
                  {display.remarketing30Day && <p style={{ fontSize: '0.85rem', color: '#1a1a2e', marginBottom: 6 }}>30-day: {display.remarketing30Day}</p>}
                  {display.remarketing7Day && <p style={{ fontSize: '0.85rem', color: '#1a1a2e' }}>7-day: {display.remarketing7Day}</p>}
                </div>
              )}
            </div>
          </>
        )}

        {/* Negative Keywords */}
        {negKw.length > 0 && (
          <>
            <SectionTitle sub="Add these to every campaign to prevent wasted spend">Negative Keywords</SectionTitle>
            <div style={{ marginBottom: 32 }}>
              {negKw.map((k: string, i: number) => <Tag key={i} color='#dc2626' bg='#fee2e2'>-{k}</Tag>)}
            </div>
          </>
        )}

        {/* Performance Max */}
        {pmax.applicable && (
          <>
            <SectionTitle sub="Performance Max campaign setup and asset groups">Performance Max</SectionTitle>
            <div style={{ padding: 20, background: '#fafafe', border: '1px solid #f0eef6', borderRadius: 14, marginBottom: 32 }}>
              {pmax.assetGroups?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#db4437', textTransform: 'uppercase', marginBottom: 8 }}>Asset Groups</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {pmax.assetGroups.map((ag: string, i: number) => <Tag key={i} color='#db4437' bg='#fef2f2'>{ag}</Tag>)}
                  </div>
                </div>
              )}
              {pmax.headlines?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>PMax Headlines</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {pmax.headlines.map((h: string, i: number) => <div key={i} style={{ padding: '4px 10px', background: '#f0eef6', borderRadius: 8, fontSize: '0.82rem', color: '#1a1a2e' }}>{h}</div>)}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Findings */}
        {data.findings?.length > 0 && (
          <>
            <SectionTitle sub="Key issues in your Google Ads setup">Findings</SectionTitle>
            <div style={{ marginBottom: 32 }}>
              {data.findings.map((f: any, i: number) => <FindingRow key={i} {...f} />)}
            </div>
          </>
        )}
      </>
    );
  }

  // ── Generic fallback ─────────────────────────────────────────────
  const keys = Object.keys(d);
  return (
    <>
      {data.findings?.length > 0 && (
        <>
          <SectionTitle sub="Key findings from the analysis">Findings</SectionTitle>
          <div style={{ marginBottom: 32 }}>
            {data.findings.map((f: any, i: number) => <FindingRow key={i} {...f} />)}
          </div>
        </>
      )}
      {keys.length > 0 && (
        <>
          <SectionTitle sub="Full analysis output">Analysis Results</SectionTitle>
          {keys.map(key => {
            const val = d[key];
            if (!val) return null;
            return (
              <div key={key} style={{ marginBottom: 24 }}>
                <p style={{ fontSize: '0.83rem', fontWeight: 700, color: '#7B2FBE', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </p>
                {Array.isArray(val) ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {val.map((item, i) => (
                      <div key={i} style={{ padding: '8px 14px', background: '#fafafe', borderRadius: 10, border: '1px solid #f0eef6', fontSize: '0.875rem', color: '#1a1a2e' }}>
                        {typeof item === 'string' ? item : JSON.stringify(item)}
                      </div>
                    ))}
                  </div>
                ) : typeof val === 'object' ? (
                  <div style={{ padding: 16, background: '#fafafe', borderRadius: 12, border: '1px solid #f0eef6', fontFamily: 'monospace', fontSize: '0.83rem', whiteSpace: 'pre-wrap', color: '#475569' }}>
                    {JSON.stringify(val, null, 2)}
                  </div>
                ) : (
                  <p style={{ padding: '12px 16px', background: '#fafafe', borderRadius: 10, border: '1px solid #f0eef6', fontSize: '0.9rem', color: '#1a1a2e', lineHeight: 1.65 }}>{String(val)}</p>
                )}
              </div>
            );
          })}
        </>
      )}
    </>
  );
}

// ─── Progress tips ────────────────────────────────────────────────
const TIPS = [
  'AI agents analyze your brand, copy, audiences, and competitors simultaneously.',
  'Top performing ads share one thing: a single clear hook in the first 3 seconds.',
  'ZieAds mirrors what senior media buyers do — just in under 60 seconds.',
  'Score above 75? You\'re in the top 20% of ad setups we\'ve analyzed.',
  'The best copy isn\'t clever — it\'s the most specific about one problem.',
];

// ─── Progress step card ───────────────────────────────────────────
function ProgressCard({ label, desc, progress, color }: { label: string; desc: string; progress: number; color: string }) {
  const done = progress >= 100;
  return (
    <div style={{
      background: '#fff',
      border: `1px solid ${done ? color + '40' : '#f0eef6'}`,
      borderRadius: 14,
      padding: '16px 20px',
      marginBottom: 10,
      transition: 'border-color 0.4s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: done ? color : '#f4f2fa', border: `2px solid ${done ? color : '#e8e6f0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.4s' }}>
            {done
              ? <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" width="16" height="16"><path d="M5 13l4 4L19 7"/></svg>
              : <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, opacity: 0.4 }} />
            }
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1a1a2e' }}>{label}</p>
            <p style={{ fontSize: '0.78rem', color: '#8888a0', marginTop: 1 }}>{done ? 'Complete' : desc}</p>
          </div>
        </div>
        <span style={{ fontSize: '0.83rem', fontWeight: 700, color: done ? color : '#b0b0c0' }}>
          {done ? 'Done' : `${Math.round(progress)}%`}
        </span>
      </div>
      <div style={{ height: 4, background: '#f0eef6', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: color, borderRadius: 4, transition: 'width 0.3s ease' }} />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────
export default function SkillReport() {
  const { skillName = '' } = useParams<{ skillName: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [agencyName, setAgencyName] = useState('ZieAds');
  const [showBrandingModal, setShowBrandingModal] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);
  const startedRef = useRef(false);

  const url = searchParams.get('url') || '';
  const businessName = searchParams.get('businessName') || '';

  const meta = SKILL_META[skillName] || { title: skillName, icon: <Bot size={40} />, platform: 'AI Analysis', color: '#7B2FBE' };

  // Rotate tips
  useEffect(() => {
    const t = setInterval(() => setCurrentTip(p => (p + 1) % TIPS.length), 5000);
    return () => clearInterval(t);
  }, []);

  // Auto-run on mount
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    // Check session cache first
    const cached = sessionStorage.getItem(`skill_result_${skillName}_${url}`);
    if (cached) {
      setResult(JSON.parse(cached));
      setProgress(100);
      setStatus('done');
      return;
    }

    if (!url) {
      setError('No URL provided. Go back to the dashboard and enter a URL first.');
      setStatus('error');
      return;
    }

    // Animate progress bar
    const cap = 88;
    const ticker = setInterval(() => {
      setProgress(p => {
        if (p >= cap) { clearInterval(ticker); return p; }
        return Math.min(cap, p + Math.random() * 4 + 1);
      });
    }, 300);

    const run = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`/api/skill/${skillName}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ url, businessName }),
        });
        const json = await res.json();

        clearInterval(ticker);

        if (res.status === 403 && json.error === 'PAYWALL_LIMIT') {
          alert('You have used all 5 free credits. Please upgrade to continue.');
          navigate('/pricing');
          return;
        }
        if (json.success && json.data) {
          // Save to sessionStorage for back-nav cache
          sessionStorage.setItem(`skill_result_${skillName}_${url}`, JSON.stringify(json.data));

          // Save to localStorage audit history (same shape as full audit)
          const auditRecord = {
            id: `skill_${skillName}_${Date.now()}`,
            report: { ...json.data, overall: json.data.score || 0, grade: scoreGrade(json.data.score || 0) },
            agent_results: [json.data],
            url,
            business_name: businessName || url,
            overall_score: json.data.score || 0,
            grade: scoreGrade(json.data.score || 0),
            created_at: new Date().toISOString(),
            audit_type: skillName,
            skill_name: skillName,
          };
          localStorage.setItem('zieads_latest_audit', JSON.stringify(auditRecord));
          const existing = JSON.parse(localStorage.getItem('zieads_audit_history') || '[]');
          localStorage.setItem('zieads_audit_history', JSON.stringify([auditRecord, ...existing].slice(0, 20)));

          setProgress(100);
          setResult(json.data);
          setStatus('done');
        } else {
          setError(json.error || 'Analysis failed. Please try again.');
          setStatus('error');
        }
      } catch (e: any) {
        clearInterval(ticker);
        setError(e.message);
        setStatus('error');
      }
    };

    run();
    return () => clearInterval(ticker);
  }, [skillName, url]);

  function scoreGrade(s: number) {
    return s >= 80 ? 'A' : s >= 65 ? 'B' : s >= 50 ? 'C' : s >= 35 ? 'D' : 'F';
  }

  const score = result?.score ?? 0;

  // ── Full-screen loading view ──────────────────────────────────────
  if (status === 'loading') {
    // Build 3 sub-steps from the skill to simulate granular progress
    const steps = [
      { label: 'Scraping website', desc: 'Reading your landing page content...', pct: Math.min(100, progress * 1.15) },
      { label: 'Running AI analysis', desc: 'Applying Gemini intelligence to your data...', pct: Math.max(0, Math.min(100, (progress - 25) * 1.5)) },
      { label: 'Generating deliverables', desc: 'Formatting insights for your report...', pct: Math.max(0, Math.min(100, (progress - 65) * 3.5)) },
    ];

    return (
      <div style={{ minHeight: '100vh', background: '#f8f7fc', display: 'flex', flexDirection: 'column' }}>
        <nav className="navbar">
          <div className="nav-inner">
            <div className="nav-brand">
              <ZieAdsLogo size={34} />
              <span className="brand-name">{agencyName}</span>
            </div>
          </div>
        </nav>

        <div style={{ flex: 1, maxWidth: 600, margin: '0 auto', padding: '60px 24px', width: '100%' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12, display: 'flex', justifyContent: 'center', color: meta.color }}>
              {typeof meta.icon === 'string' ? meta.icon : meta.icon}
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1a1a2e', letterSpacing: '-0.02em', marginBottom: 8 }}>
              Running {meta.title}...
            </h1>
            <p style={{ color: '#8888a0', fontSize: '0.9rem' }}>
              Analyzing <strong style={{ color: '#475569' }}>{businessName || url}</strong>
            </p>
          </div>

          {/* Overall bar */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #f0eef6', marginBottom: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: '0.83rem', fontWeight: 700, color: '#1a1a2e' }}>Overall Progress</span>
              <span style={{ fontSize: '0.83rem', fontWeight: 700, color: meta.color }}>{Math.round(progress)}%</span>
            </div>
            <div style={{ height: 8, background: '#f0eef6', borderRadius: 8 }}>
              <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg,${meta.color},${meta.color}99)`, borderRadius: 8, transition: 'width 0.3s ease' }} />
            </div>
          </div>

          {/* Step cards */}
          {steps.map((s, i) => (
            <ProgressCard key={i} label={s.label} desc={s.desc} progress={s.pct} color={meta.color} />
          ))}

          {/* Tip */}
          <div style={{ marginTop: 32, padding: '16px 20px', background: `${meta.color}08`, borderRadius: 14, border: `1px solid ${meta.color}20`, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <Lightbulb size={20} style={{ color: meta.color, flexShrink: 0 }} />
            <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6 }}>{TIPS[currentTip]}</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Error view ────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f7fc', display: 'flex', flexDirection: 'column' }}>
        <nav className="navbar">
          <div className="nav-inner">
            <div className="nav-brand"><ZieAdsLogo size={34} /><span className="brand-name">{agencyName}</span></div>
            <button onClick={() => navigate('/clients')} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: '6px 14px', fontSize: '0.83rem', fontWeight: 600, color: '#64748b', cursor: 'pointer' }}>
              ← Dashboard
            </button>
          </div>
        </nav>
        <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, color: '#dc2626' }}>
            <AlertTriangle size={48} />
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1a1a2e', marginBottom: 12 }}>Analysis Failed</h2>
          <p style={{ color: '#64748b', marginBottom: 24, lineHeight: 1.6 }}>{error}</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => navigate('/clients')} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#64748b' }}>
              Back to Dashboard
            </button>
            <button onClick={() => { setStatus('loading'); startedRef.current = false; }} style={{ padding: '10px 20px', borderRadius: 10, background: meta.color, border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Result view ───────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#f8f7fc' }}>
      {/* Navbar */}
      <nav className="navbar" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="nav-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="nav-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
              <ZieAdsLogo size={34} />
              <span className="brand-name">{agencyName}</span>
            </div>
            <button onClick={() => navigate('/clients')} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: '6px 14px', fontSize: '0.83rem', fontWeight: 600, color: '#64748b', cursor: 'pointer' }}>
              ← Dashboard
            </button>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowBrandingModal(true)} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: '6px 14px', fontSize: '0.83rem', fontWeight: 600, color: '#64748b', cursor: 'pointer' }}>
              White-Label
            </button>
            <button onClick={() => window.print()} style={{ background: 'linear-gradient(135deg,#9B59D0,#5c8aff)', border: 'none', borderRadius: 20, padding: '6px 16px', fontSize: '0.83rem', fontWeight: 600, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Download size={14} />
              Export PDF
            </button>
          </div>
        </div>
      </nav>

      {/* Intelligence Brief Header */}
      <div style={{
        background: `linear-gradient(135deg, ${meta.color}18, ${meta.color}06)`,
        borderBottom: `1px solid ${meta.color}20`,
        padding: '40px 0 32px',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: '2rem', color: meta.color }}>
                  {typeof meta.icon === 'string' ? meta.icon : React.cloneElement(meta.icon as React.ReactElement<{ size?: number }>, { size: 32 })}
                </span>
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                    {agencyName} · Intelligence Brief
                  </p>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1a1a2e', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
                    {meta.title}
                  </h1>
                </div>
              </div>
              {url && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: '0.8rem', color: '#8888a0' }}>Analyzing:</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>{businessName || url}</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
                <Tag color={meta.color} bg={`${meta.color}15`}>{meta.platform}</Tag>
                <span style={{ fontSize: '0.78rem', color: '#b0b0c0' }}>
                  {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
            {score > 0 && (
              <div style={{ background: '#fff', borderRadius: 16, padding: '20px 28px', border: '1px solid #f0eef6', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', textAlign: 'center' }}>
                <ScoreBadge score={score} label="Score" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 80px' }}>
        {result && (
          <>
            {/* Live Ad Creative Analysis */}
            {SHOW_LIVE_ADS_FOR.has(skillName) && (
              <LiveAdsSection url={url} businessName={businessName} accentColor={meta.color} skillData={result} />
            )}

            {/* Findings (universal) */}
            {result.findings?.length > 0 && (
              <>
                <SectionTitle sub={`${result.findings.length} issues identified`}>Key Findings</SectionTitle>
                <div style={{ marginBottom: 32 }}>
                  {result.findings.slice(0, 5).map((f: any, i: number) => <FindingRow key={i} {...f} />)}
                </div>
              </>
            )}

            {/* Skill-specific content */}
            {renderSkillContent(skillName, result, businessName, url)}

            {/* Footer CTA */}
            <div style={{ marginTop: 48, padding: 32, background: 'linear-gradient(135deg,#7B2FBE15,#5c8aff10)', borderRadius: 20, border: '1px solid #7B2FBE20', textAlign: 'center' }}>
              <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7B2FBE', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                {agencyName} Intelligence Platform
              </p>
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                This report was generated by AI and should be reviewed by a media buyer before implementation.
              </p>
            </div>
          </>
        )}
      </div>

      {/* White-Label Modal */}
      {showBrandingModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 16, width: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1a1a2e', marginBottom: 20 }}>White-Label Settings</h2>
            <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 600, color: '#475569', marginBottom: 8 }}>Agency Name</label>
            <input
              type="text"
              value={agencyName}
              onChange={e => setAgencyName(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: '0.95rem', marginBottom: 20 }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowBrandingModal(false)} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#64748b' }}>
                Close
              </button>
              <button onClick={() => setShowBrandingModal(false)} style={{ padding: '10px 20px', borderRadius: 10, background: '#7B2FBE', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media print {
          nav { display: none !important; }
          button { display: none !important; }
        }
      `}</style>
    </div>
  );
}
