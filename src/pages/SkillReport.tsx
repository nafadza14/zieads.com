import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Bot, Lightbulb, AlertTriangle, Download } from 'lucide-react';
import { generateSkillPDF } from '../lib/pdfGenerator';
import NounIcon from '../components/NounIcon';
import ZieAdsLogo from '../components/ZieAdsLogo';
import LiveAdsSection from '../components/LiveAdsSection';
import { supabase } from '../lib/supabaseClient';

// ─── Design tokens (match ClientDashboard) ───────────────────────
const RP = 'var(--primary)';
const RD = 'var(--text)';
const RG = 'var(--text-muted)';
const RB = 'var(--border)';

// Skills that should show the live ads section from Meta Ads Library
const SHOW_LIVE_ADS_FOR = new Set([
  'ads-copy', 'ads-creatives', 'ads-competitors', 'ads-meta',
  'ads-tiktok', 'ads-report', 'ads-report-pdf',
]);

// ─── Platform config ──────────────────────────────────────────────
const PLATFORM_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  meta: { bg: 'var(--primary)', text: '#fff', label: 'Meta' },
  facebook: { bg: 'var(--primary)', text: '#fff', label: 'Facebook' },
  instagram: { bg: 'var(--primary)', text: '#fff', label: 'Instagram' },
  google: { bg: 'var(--primary)', text: '#fff', label: 'Google' },
  tiktok: { bg: 'var(--primary)', text: '#fff', label: 'TikTok' },
  linkedin: { bg: 'var(--primary)', text: '#fff', label: 'LinkedIn' },
  youtube: { bg: 'var(--primary)', text: '#fff', label: 'YouTube' },
};

const SKILL_META: Record<string, { title: string; platform: string; color: string }> = {
  'ads-copy':       { title: 'Ad Copy Intelligence',      platform: 'All Platforms',          color: '#2563eb' },
  'ads-creatives':  { title: 'Creative Brief',            platform: 'Creative Studio',        color: '#ec4899' },
  'ads-competitors':{ title: 'Competitor Intelligence',   platform: 'Competitive Landscape',  color: '#ef4444' },
  'ads-google':     { title: 'Google Ads Strategy',       platform: 'Google Ads',             color: '#4285f4' },
  'ads-meta':       { title: 'Meta Ads Strategy',         platform: 'Facebook & Instagram',   color: '#1877f2' },
  'ads-tiktok':     { title: 'TikTok Ads Strategy',       platform: 'TikTok',                 color: '#ff0050' },
  'ads-linkedin':   { title: 'LinkedIn B2B Strategy',     platform: 'LinkedIn',               color: '#0a66c2' },
  'ads-report':     { title: 'Strategy Report',           platform: 'Full Analysis',          color: '#f97316' },
  'ads-report-pdf': { title: 'White-Label PDF Report',    platform: 'Agency Export',          color: '#d946ef' },
  'ads-landing':    { title: 'Landing Page CRO Audit',    platform: 'Conversion Rate',        color: '#10b981' },
  'ads-funnel':     { title: 'Funnel Architecture',       platform: 'Full Funnel',            color: '#06b6d4' },
  'ads-audiences':  { title: 'Audience Intelligence',     platform: 'Targeting',              color: '#8b5cf6' },
  'ads-budget':     { title: 'Budget Strategy',           platform: 'Budget Allocation',      color: '#16a34a' },
  'ads-quick':      { title: 'Quick Scan',                platform: 'Ads Readiness',          color: '#f59e0b' },
  // short-name aliases
  'copy':           { title: 'Ad Copy Intelligence',      platform: 'All Platforms',          color: '#2563eb' },
  'creatives':      { title: 'Creative Brief',            platform: 'Creative Studio',        color: '#ec4899' },
  'landing':        { title: 'Landing Page CRO Audit',    platform: 'Conversion Rate',        color: '#10b981' },
  'quick':          { title: 'Quick Scan',                platform: 'Ads Readiness',          color: '#f59e0b' },
  'competitors':    { title: 'Competitor Intelligence',   platform: 'Competitive Landscape',  color: '#ef4444' },
  'google':         { title: 'Google Ads Strategy',       platform: 'Google Ads',             color: '#4285f4' },
  'meta':           { title: 'Meta Ads Strategy',         platform: 'Facebook & Instagram',   color: '#1877f2' },
  'tiktok':         { title: 'TikTok Ads Strategy',       platform: 'TikTok',                 color: '#ff0050' },
  'linkedin':       { title: 'LinkedIn B2B Strategy',     platform: 'LinkedIn',               color: '#0a66c2' },
  'funnel':         { title: 'Funnel Architecture',       platform: 'Full Funnel',            color: '#06b6d4' },
  'audiences':      { title: 'Audience Intelligence',     platform: 'Targeting',              color: '#8b5cf6' },
  'budget':         { title: 'Budget Strategy',           platform: 'Budget Allocation',      color: '#16a34a' },
  'report':         { title: 'Strategy Report',           platform: 'Full Analysis',          color: '#f97316' },
  'report-pdf':     { title: 'White-Label PDF Report',    platform: 'Agency Export',          color: '#d946ef' },
};

// ─── Ad Creative Card ─────────────────────────────────────────────
function AdCreativeCard({ platform, headline, body, cta, angle, runningDays }: any) {
  const pc = PLATFORM_COLORS[platform?.toLowerCase()] || PLATFORM_COLORS.meta;
  const platformBg = typeof pc.bg === 'string' && pc.bg.startsWith('linear') ? '#000' : pc.bg;

  return (
    <div style={{ borderRadius: 10, overflow: 'hidden', background: '#fff', border: '1px solid #e2e8f0' }}>
      {/* Header bar */}
      <div style={{ background: platformBg, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#fff', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.04em', opacity: 0.9 }}>{pc.label}</span>
        {runningDays && (
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem' }}>Running {runningDays}d+</span>
        )}
      </div>
      {/* Body */}
      <div style={{ padding: '14px 16px' }}>
        {angle && (
          <span style={{ display: 'inline-block', background: '#f1f5f9', color: '#475569', fontSize: '0.78rem', fontWeight: 600, padding: '2px 8px', borderRadius: 3, marginBottom: 8, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
            {angle}
          </span>
        )}
        {headline && (
          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b', lineHeight: 1.4, marginBottom: 8 }}>
            {headline}
          </p>
        )}
        {body && (
          <p style={{ fontSize: '0.825rem', color: RP, lineHeight: 1.5, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {body}
          </p>
        )}
        {cta && (
          <div style={{ display: 'inline-block', background: '#1e293b', color: '#fff', fontSize: '0.78rem', fontWeight: 600, padding: '5px 12px', borderRadius: 5 }}>
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
    <div style={{ marginBottom: 16, marginTop: 32, paddingBottom: 10, borderBottom: `1px solid ${RB}` }}>
      <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: RD, margin: 0 }}>{children}</h2>
      {sub && <p style={{ color: RG, fontSize: '0.825rem', marginTop: 3, margin: '3px 0 0' }}>{sub}</p>}
    </div>
  );
}

// ─── Score Badge ──────────────────────────────────────────────────
function ScoreBadge({ score, label }: { score: number; label?: string }) {
  const color = score >= 70 ? '#16a34a' : score >= 50 ? '#d97706' : '#dc2626';
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: 64, height: 64, borderRadius: 8,
        border: `1px solid ${RB}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: '#fff',
      }}>
        <span style={{ fontSize: '1.4rem', fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: '0.7rem', color: RG, fontWeight: 600, marginTop: 1 }}>/100</span>
      </div>
      {label && <p style={{ fontSize: '0.78rem', color: RG, fontWeight: 600, marginTop: 4 }}>{label}</p>}
    </div>
  );
}

// ─── Pill Tag ─────────────────────────────────────────────────────
function Tag({ children }: { children: React.ReactNode; color?: string; bg?: string }) {
  return (
    <span style={{
      display: 'inline-block',
      background: 'var(--bg-soft)',
      color: RG,
      fontSize: '0.78rem',
      fontWeight: 500,
      padding: '2px 8px',
      borderRadius: 4,
      border: `1px solid ${RB}`,
      margin: '2px',
    }}>
      {children}
    </span>
  );
}

// ─── Finding row ──────────────────────────────────────────────────
function FindingRow({ severity, title, impact, recommendation }: any) {
  const dot: Record<string, string> = {
    critical: '#dc2626', high: '#d97706', medium: '#2563eb', low: '#16a34a',
  };
  const dotColor = dot[(severity || 'medium').toLowerCase()] || dot.medium;
  return (
    <div style={{ padding: '12px 0', borderBottom: `1px solid ${RB}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: dotColor, marginTop: 7, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <strong style={{ color: RD, fontSize: '0.875rem', fontWeight: 600 }}>{title}</strong>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: dotColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{severity}</span>
          </div>
          {impact && <p style={{ fontSize: '0.825rem', color: RG, marginBottom: 4, lineHeight: 1.5 }}>{impact}</p>}
          {recommendation && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <span style={{ color: RP, fontWeight: 700, fontSize: '0.825rem', flexShrink: 0 }}>→</span>
              <p style={{ fontSize: '0.825rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>{recommendation}</p>
            </div>
          )}
        </div>
      </div>
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
                <div style={{ padding: 20, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '0.825rem', fontWeight: 700, color: RP, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Strategy</p>
                  <p style={{ fontSize: '0.875rem', color: '#1e293b', lineHeight: 1.6 }}>{analysis.strategy}</p>
                </div>
              )}
              {analysis.toneOfVoice && (
                <div style={{ padding: 20, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '0.825rem', fontWeight: 700, color: RP, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tone of Voice</p>
                  <p style={{ fontSize: '0.875rem', color: '#1e293b', lineHeight: 1.6 }}>{analysis.toneOfVoice}</p>
                </div>
              )}
            </div>
            {analysis.keySellingPoints?.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <p style={{ fontSize: '0.825rem', fontWeight: 700, color: RP, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Key Selling Points</p>
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
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, marginBottom: 24 }}>
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 16, marginBottom: 16 }}>
                <p style={{ fontSize: '0.825rem', fontWeight: 700, color: RP, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Headlines</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {google.headlines.map((h: string, i: number) => (
                    <div key={i} style={{ background: '#f8faff', border: '1px solid #e0eaff', borderRadius: 8, padding: '6px 12px', fontSize: '0.875rem', color: '#1e293b' }}>
                      {h}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ fontSize: '0.825rem', fontWeight: 700, color: RP, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Descriptions</p>
                {google.descriptions?.map((desc: string, i: number) => (
                  <p key={i} style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6, marginBottom: 6, padding: '8px 12px', background: '#f8fafc', borderRadius: 8 }}>{desc}</p>
                ))}
              </div>
              {google.sitelinks?.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <p style={{ fontSize: '0.825rem', fontWeight: 700, color: RP, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sitelinks</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 8 }}>
                    {google.sitelinks.map((s: any, i: number) => (
                      <div key={i} style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                        <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1d4ed8' }}>{s.text}</p>
                        <p style={{ fontSize: '0.825rem', color: RP }}>{s.description}</p>
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
                <div key={label as string} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 20 }}>
                  <p style={{ fontSize: '0.825rem', fontWeight: 700, color: RP, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label as string} Version</p>
                  <p style={{ fontSize: '0.875rem', color: '#1e293b', lineHeight: 1.65 }}>{body as string}</p>
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
                <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ background: '#000', padding: '10px 16px' }}>
                    <p style={{ color: '#fff', fontSize: '0.825rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Script {i + 1}</p>
                  </div>
                  <div style={{ padding: 16 }}>
                    <p style={{ fontSize: '0.825rem', fontWeight: 700, color: RP, marginBottom: 4 }}>HOOK</p>
                    <p style={{ fontSize: '0.875rem', color: '#1e293b', marginBottom: 12, fontStyle: 'italic' }}>"{s.hook}"</p>
                    <p style={{ fontSize: '0.825rem', fontWeight: 700, color: RP, marginBottom: 4 }}>BODY</p>
                    <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: 12 }}>{s.body}</p>
                    <p style={{ fontSize: '0.825rem', fontWeight: 700, color: RP, marginBottom: 4 }}>CTA</p>
                    <p style={{ fontSize: '0.875rem', color: RP, fontWeight: 600 }}>{s.cta}</p>
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
              <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 20, marginBottom: 12 }}>
                <p style={{ fontSize: '0.825rem', fontWeight: 700, color: RP, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sponsored Content {i + 1}</p>
                <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: 8 }}>{c.intro}</p>
                <p style={{ fontWeight: 700, color: '#1e293b' }}>{c.headline}</p>
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
                <div key={k as string} style={{ padding: 20, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: RP, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{k as string}</p>
                  <p style={{ fontSize: '0.875rem', color: '#1e293b' }}>{v as string}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {d.heroOfferAssessment && (
          <>
            <SectionTitle sub="Offer clarity and competitive differentiation">Hero Offer Assessment</SectionTitle>
            <div style={{ padding: 20, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', borderLeft: '3px solid #16a34a', marginBottom: 32 }}>
              <p style={{ fontSize: '0.95rem', color: '#1e293b', lineHeight: 1.65 }}>{d.heroOfferAssessment}</p>
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
            <div style={{ padding: 20, background: '#f8fafc', borderRadius: 8, border: '1px solid #e8e6f0', marginBottom: 32 }}>
              <p style={{ fontSize: '0.95rem', color: '#1e293b', lineHeight: 1.7 }}>{d.testingSequence}</p>
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
              <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', boxShadow: 'none' }}>
                <div style={{ background: '#f8fafc', padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <strong style={{ color: '#1e293b', fontSize: '1rem' }}>{c.name}</strong>
                  <span style={{ background: spendColor, color: '#fff', fontSize: '0.78rem', fontWeight: 700, padding: '3px 8px', borderRadius: 4 }}>
                    {c.adSpendTier} Spend
                  </span>
                </div>
                <div style={{ padding: 18 }}>
                  {c.url && <p style={{ fontSize: '0.825rem', color: '#94a3b8', marginBottom: 8 }}>{c.url}</p>}
                  <div style={{ marginBottom: 10 }}>
                    {c.platforms?.map((p: string) => (
                      <Tag key={p} color='#1877F2' bg='#eff6ff'>{p}</Tag>
                    ))}
                  </div>
                  {c.offer && (
                    <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: 8 }}>
                      <strong style={{ color: '#1e293b' }}>Offer: </strong>{c.offer}
                    </p>
                  )}
                  {c.creativeApproach && (
                    <p style={{ fontSize: '0.875rem', color: '#475569' }}>
                      <strong style={{ color: '#1e293b' }}>Creative: </strong>{c.creativeApproach}
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
                { label: 'Platform Gaps', items: d.competitiveGaps.platformGaps, color: RP },
                { label: 'Offer Gaps', items: d.competitiveGaps.offerGaps, color: RP },
                { label: 'Audience Gaps', items: d.competitiveGaps.audienceGaps, color: RP },
                { label: 'Creative Gaps', items: d.competitiveGaps.creativeGaps, color: RP },
              ].map(({ label, items, color }) => items?.length ? (
                <div key={label} style={{ padding: 20, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', borderLeft: `3px solid ${color}` }}>
                  <p style={{ fontSize: '0.825rem', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>{label}</p>
                  <ul style={{ paddingLeft: 16 }}>
                    {items.map((item: string, i: number) => (
                      <li key={i} style={{ fontSize: '0.875rem', color: '#1e293b', lineHeight: 1.6, marginBottom: 4 }}>{item}</li>
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
            <div style={{ padding: 16, background: '#f8fafc', border: '1px solid #e2e8f0', borderLeft: `3px solid ${RP}`, borderRadius: 0, marginBottom: 32 }}>
              <p style={{ fontSize: '1rem', color: '#1e293b', lineHeight: 1.7 }}>{d.positioningRecommendation}</p>
            </div>
          </>
        )}

        {d.indirectCompetitors?.length > 0 && (
          <>
            <SectionTitle sub="Alternative solutions your audience might choose">Indirect Competitors</SectionTitle>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 32 }}>
              {d.indirectCompetitors.map((c: any, i: number) => (
                <div key={i} style={{ padding: '10px 16px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <strong style={{ color: '#1e293b' }}>{c.name}</strong>
                  {c.offer && <span style={{ color: '#94a3b8', fontSize: '0.875rem', marginLeft: 8 }}>({c.offer})</span>}
                </div>
              ))}
            </div>
          </>
        )}
      </>
    );
  }

  // ── ads-meta ─────────────────────────────────────────────────────
  if (skillName === 'ads-meta' || skillName === 'meta') {
    const structure = d.accountStructure || d.campaignStructure?.map((c: any) => ({ ...c, adSets: [] })) || [];
    const audience = d.audienceStrategy || {};
    const creative = d.creativeStrategy || {};
    const copy = d.adCopy || {};
    const pixel = d.pixelTracking || {};
    const bidding = d.biddingBudget || {};
    const launch = d.launchPlan || [];

    return (
      <>
        {/* Account Structure */}
        {structure.length > 0 && (
          <>
            <SectionTitle sub="Full Ads Manager account structure ready to build">Account Structure</SectionTitle>
            <div style={{ marginBottom: 32 }}>
              {structure.map((c: any, ci: number) => (
                <div key={ci} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 16, overflow: 'hidden' }}>
                  <div style={{ background: '#f8fafc', padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#1877F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.875rem', flexShrink: 0 }}>{ci + 1}</div>
                    <div style={{ flex: 1 }}>
                      <strong style={{ color: '#1e293b', fontSize: '0.95rem' }}>{c.campaignName}</strong>
                      <p style={{ fontSize: '0.825rem', color: RP, marginTop: 2 }}>
                        {c.objective} · {c.optimizationEvent && `Optimize: ${c.optimizationEvent} · `}{c.monthlyBudget || c.budgetSplit}
                        {c.bidStrategy && ` · ${c.bidStrategy}`}
                      </p>
                    </div>
                    {c.placementStrategy && <Tag color='#1877F2' bg='#eff6ff'>{c.placementStrategy}</Tag>}
                  </div>
                  {c.adSets?.length > 0 && (
                    <div style={{ padding: '12px 18px' }}>
                      <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>Ad Sets</p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 10 }}>
                        {c.adSets.map((as: any, ai: number) => {
                          const tierColor = as.audienceType === 'Cold' ? '#4285F4' : as.audienceType === 'Warm' ? '#f59e0b' : '#dc2626';
                          return (
                            <div key={ai} style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b' }}>{as.name}</p>
                                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', background: '#f1f5f9', padding: '2px 8px', borderRadius: 4 }}>{as.audienceType}</span>
                              </div>
                              {as.audienceDescription && <p style={{ fontSize: '0.825rem', color: RP, marginBottom: 6 }}>{as.audienceDescription}</p>}
                              {as.interests?.length > 0 && <div style={{ marginBottom: 4 }}>{as.interests.slice(0, 4).map((int: string, ii: number) => <Tag key={ii} color='#1877F2' bg='#eff6ff'>{int}</Tag>)}</div>}
                              {as.placements?.length > 0 && <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 4 }}>📍 {as.placements.join(', ')}</p>}
                              {as.dailyBudget && <p style={{ fontSize: '0.78rem', fontWeight: 700, color: RP, marginTop: 4 }}>{as.dailyBudget}/day</p>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Audience Strategy */}
        {(audience.coldAudiences || audience.warmAudiences || audience.hotAudiences) && (
          <>
            <SectionTitle sub="Cold → Warm → Hot audience ladder">Audience Strategy</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16, marginBottom: 32 }}>
              {[
                { key: 'coldAudiences', label: 'COLD', color: RP },
                { key: 'warmAudiences', label: 'WARM', color: RP },
                { key: 'hotAudiences', label: 'HOT', color: '#dc2626' },
              ].map(({ key, label, color }) => {
                const list: any[] = audience[key] || [];
                if (!list.length) return null;
                return (
                  <div key={key} style={{ background: '#fff', border: '1px solid #e2e8f0', borderLeft: `3px solid ${color}`, borderRadius: 0 }}>
                    <div style={{ padding: '10px 16px', borderBottom: '1px solid #e2e8f0' }}>
                      <p style={{ fontWeight: 800, color, fontSize: '0.875rem' }}>{label} Audiences</p>
                    </div>
                    <div style={{ padding: 14 }}>
                      {list.map((a: any, i: number) => (
                        <div key={i} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: i < list.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                          <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b', marginBottom: 2 }}>{a.name}</p>
                          {a.interestStack?.length > 0 && <div style={{ marginBottom: 4 }}>{a.interestStack.slice(0, 4).map((int: string, ii: number) => <Tag key={ii}>{int}</Tag>)}</div>}
                          {a.source && <p style={{ fontSize: '0.825rem', color: RP }}>Source: {a.source}</p>}
                          {a.window && <p style={{ fontSize: '0.825rem', color: RP }}>Window: {a.window}</p>}
                          {a.messagingAngle && <p style={{ fontSize: '0.825rem', color: '#1e293b', fontStyle: 'italic', marginTop: 4 }}>→ {a.messagingAngle}</p>}
                          {a.estimatedReach && <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, marginTop: 4, display: 'inline-block' }}>~{a.estimatedReach}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            {audience.lookalikeSeeds?.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <p style={{ fontSize: '0.825rem', fontWeight: 700, color: RP, textTransform: 'uppercase', marginBottom: 10 }}>Lookalike Seeds</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {audience.lookalikeSeeds.map((s: any, i: number) => (
                    <div key={i} style={{ padding: '8px 14px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, color: i === 0 ? '#16a34a' : i === 1 ? '#f59e0b' : '#94a3b8', fontSize: '0.875rem' }}>#{i + 1}</span>
                      <span style={{ fontSize: '0.875rem', color: '#1e293b', fontWeight: 600 }}>{s.seed}</span>
                      {s.quality && <Tag color={s.quality === 'High' ? '#16a34a' : s.quality === 'Medium' ? '#f59e0b' : '#94a3b8'} bg={s.quality === 'High' ? '#f0fdf4' : s.quality === 'Medium' ? '#fffbeb' : '#f4f4f4'}>{s.quality}</Tag>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Creative Strategy */}
        {creative.heroCreatives?.length > 0 && (
          <>
            <SectionTitle sub="Hero ad creative concepts ready to brief your designer">Creative Strategy</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16, marginBottom: 24 }}>
              {creative.heroCreatives.map((c: any, i: number) => (
                <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ background: '#f8fafc', padding: '10px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.875rem' }}>Concept {i + 1}</p>
                    {c.format && <Tag>{c.format}</Tag>}
                  </div>
                  <div style={{ padding: 16 }}>
                    {c.concept && <p style={{ fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>{c.concept}</p>}
                    {c.hook && <div style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 6, marginBottom: 8, borderLeft: `3px solid ${RP}` }}><p style={{ fontSize: '0.78rem', fontWeight: 700, color: RP, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Hook</p><p style={{ fontSize: '0.875rem', color: '#1e293b' }}>{c.hook}</p></div>}
                    {c.visualDirection && <p style={{ fontSize: '0.825rem', color: RP, marginBottom: 6 }}><strong style={{ color: '#1e293b' }}>Visual: </strong>{c.visualDirection}</p>}
                    {c.copyAngle && <p style={{ fontSize: '0.825rem', color: RP, marginBottom: 6 }}><strong style={{ color: '#1e293b' }}>Angle: </strong>{c.copyAngle}</p>}
                    {c.emotionalTrigger && <Tag color='#e8457a' bg='#fff0f3'>{c.emotionalTrigger}</Tag>}
                  </div>
                </div>
              ))}
            </div>
            {creative.ugcVsPolishedSplit && (
              <div style={{ padding: '12px 18px', background: '#f8fafc', border: '1px solid #e2e8f0', borderLeft: '3px solid #16a34a', borderRadius: 0, marginBottom: 16 }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: RP, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>UGC vs Polished Split</p>
                <p style={{ fontSize: '0.875rem', color: '#1e293b' }}>{creative.ugcVsPolishedSplit}</p>
              </div>
            )}
            {creative.testingMatrix?.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <p style={{ fontSize: '0.825rem', fontWeight: 700, color: RP, textTransform: 'uppercase', marginBottom: 10 }}>Testing Matrix</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 10 }}>
                  {creative.testingMatrix.map((t: any, i: number) => (
                    <div key={i} style={{ padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10 }}>
                      <p style={{ fontWeight: 700, fontSize: '0.875rem', color: RP, marginBottom: 6 }}>{t.variable}</p>
                      <div style={{ marginBottom: 6 }}>{(t.variants || []).map((v: string, vi: number) => <Tag key={vi} color={RP} bg='var(--bg-surface)'>{v}</Tag>)}</div>
                      {t.successMetric && <p style={{ fontSize: '0.78rem', color: RP }}>Metric: {t.successMetric}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Ad Copy */}
        {(copy.primaryTexts?.length > 0 || copy.headlines?.length > 0) && (
          <>
            <SectionTitle sub="Ready-to-paste copy for Meta Ads Manager">Ad Copy</SectionTitle>
            {copy.primaryTexts?.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 14, marginBottom: 20 }}>
                {copy.primaryTexts.map((t: any, i: number) => (
                  <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 18 }}>
                    <p style={{ fontSize: '0.78rem', fontWeight: 700, color: RP, textTransform: 'uppercase', marginBottom: 8 }}>{typeof t === 'string' ? `Variant ${i + 1}` : t.label}</p>
                    <p style={{ fontSize: '0.875rem', color: '#1e293b', lineHeight: 1.65 }}>{typeof t === 'string' ? t : t.text}</p>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 32 }}>
              {copy.headlines?.length > 0 && (
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: RP, textTransform: 'uppercase', marginBottom: 10 }}>Headlines</p>
                  {copy.headlines.map((h: string, i: number) => (
                    <div key={i} style={{ padding: '6px 10px', background: '#f8faff', border: '1px solid #e0eaff', borderRadius: 8, marginBottom: 6, fontSize: '0.875rem', color: '#1e293b' }}>{h}</div>
                  ))}
                </div>
              )}
              {copy.linkDescriptions?.length > 0 && (
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: RP, textTransform: 'uppercase', marginBottom: 10 }}>Link Descriptions</p>
                  {copy.linkDescriptions.map((ld: string, i: number) => (
                    <p key={i} style={{ padding: '6px 10px', background: '#f8fafc', borderRadius: 8, marginBottom: 6, fontSize: '0.875rem', color: '#475569' }}>{ld}</p>
                  ))}
                  {copy.ctaButton && <div style={{ marginTop: 12, padding: '8px 16px', background: '#1877F2', color: '#fff', borderRadius: 8, fontSize: '0.875rem', fontWeight: 700, display: 'inline-block' }}>{copy.ctaButton}</div>}
                </div>
              )}
            </div>
          </>
        )}

        {/* Pixel & Tracking */}
        {pixel.keyEvents?.length > 0 && (
          <>
            <SectionTitle sub="Pixel events to fire for accurate attribution">Pixel & Tracking Setup</SectionTitle>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0, padding: '8px 14px', background: '#f8fafc', borderRadius: '10px 10px 0 0', border: '1px solid #e2e8f0' }}>
                {['Event', 'Trigger', 'Value'].map(h => <p key={h} style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>{h}</p>)}
              </div>
              {pixel.keyEvents.map((e: any, i: number) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0, padding: '10px 14px', background: i % 2 === 0 ? '#fff' : '#fafafe', border: '1px solid #e2e8f0', borderTop: 'none' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: RP }}>{e.event}</p>
                  <p style={{ fontSize: '0.875rem', color: '#475569' }}>{e.trigger}</p>
                  <p style={{ fontSize: '0.875rem', color: '#16a34a' }}>{e.value}</p>
                </div>
              ))}
            </div>
            {pixel.utmStructure && <p style={{ fontSize: '0.875rem', color: RP, marginBottom: 32, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', fontFamily: 'monospace' }}>{pixel.utmStructure}</p>}
          </>
        )}

        {/* Bidding & Budget Targets */}
        {(bidding.roasTarget || bidding.cpaTarget || bidding.scaleThresholds?.length > 0) && (
          <>
            <SectionTitle sub="Bid targets and when to scale">Bidding & Budget Targets</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 24 }}>
              {[['ROAS Target', bidding.roasTarget, '#16a34a'], ['CPA Target', bidding.cpaTarget, '#7B2FBE']].filter(([, v]) => v).map(([k, v, c]) => (
                <div key={k as string} style={{ padding: 18, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, textAlign: 'center' }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: RP, textTransform: 'uppercase', marginBottom: 6 }}>{k as string}</p>
                  <p style={{ fontSize: '1.3rem', fontWeight: 900, color: '#1e293b' }}>{v as string}</p>
                </div>
              ))}
            </div>
            {bidding.scaleThresholds?.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <p style={{ fontSize: '0.825rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', marginBottom: 8 }}>Scale When →</p>
                {bidding.scaleThresholds.map((t: string, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 8, padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 0, marginBottom: 0, borderBottom: '1px solid #e2e8f0' }}>
                    <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
                    <p style={{ fontSize: '0.875rem', color: '#1e293b' }}>{t}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* 30-Day Launch Plan */}
        {launch.length > 0 && (
          <>
            <SectionTitle sub="Week-by-week Meta Ads launch roadmap">30-Day Launch Plan</SectionTitle>
            <div style={{ marginBottom: 32 }}>
              {launch.map((w: any, i: number) => (
                <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 10, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#1877F2', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.825rem', flexShrink: 0 }}>{i + 1}</div>
                    <div>
                      <p style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.875rem' }}>{w.week}</p>
                      {w.focus && <p style={{ fontSize: '0.825rem', color: RP }}>{w.focus}</p>}
                    </div>
                  </div>
                  <div style={{ padding: '12px 18px' }}>
                    {w.actions?.map((a: string, ai: number) => (
                      <div key={ai} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                        <span style={{ color: RP, fontWeight: 700, fontSize: '0.875rem' }}>→</span>
                        <p style={{ fontSize: '0.875rem', color: '#1e293b' }}>{a}</p>
                      </div>
                    ))}
                    {w.checkpoints?.length > 0 && (
                      <div style={{ marginTop: 10, padding: '8px 12px', background: '#f8fafc', borderRadius: 6, borderLeft: '2px solid #e2e8f0' }}>
                        <p style={{ fontSize: '0.78rem', fontWeight: 700, color: RP, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Checkpoints</p>
                        {w.checkpoints.map((cp: string, ci: number) => <p key={ci} style={{ fontSize: '0.825rem', color: RP }}>✓ {cp}</p>)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Findings */}
        {data.findings?.length > 0 && (
          <>
            <SectionTitle sub="Key Meta Ads issues to address">Findings</SectionTitle>
            <div style={{ marginBottom: 32 }}>
              {data.findings.map((f: any, i: number) => <FindingRow key={i} {...f} />)}
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
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#4285F4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0 }}>
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{ color: '#1e293b', fontSize: '0.875rem' }}>{c.campaignName}</strong>
                <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: 2 }}>Type: {c.type} · Budget: {c.budgetAllocation}</p>
              </div>
            </div>
          ))}
        </div>

        {d.keywordBuckets?.length > 0 && (
          <>
            <SectionTitle sub="Organized by intent and search behavior">Keyword Strategy</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16, marginBottom: 32 }}>
              {d.keywordBuckets.map((b: any, i: number) => (
                <div key={i} style={{ padding: 18, background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '0.825rem', fontWeight: 700, color: RP, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>{b.category}</p>
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
            <div style={{ padding: 20, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 32 }}>
              <p style={{ fontSize: '0.95rem', color: '#1e293b', lineHeight: 1.65 }}>{d.biddingStrategy}</p>
            </div>
          </>
        )}
      </>
    );
  }

  // ── ads-tiktok ───────────────────────────────────────────────────
  if (skillName === 'ads-tiktok' || skillName === 'tiktok') {
    const campaigns = d.campaignArchitecture || d.campaignStructure || [];
    const formats = d.adFormatStrategy || {};
    const scripts = d.ugcScripts || [];
    const targeting = d.targetingMatrix || d.targeting || {};
    const testing = d.creativeTestingFramework || {};
    const trending = d.trendingStrategy || {};
    const kpi = d.kpiBenchmarks || {};

    return (
      <>
        {/* Campaign Architecture */}
        {campaigns.length > 0 && (
          <>
            <SectionTitle sub="TikTok For Business campaign architecture">Campaign Architecture</SectionTitle>
            <div style={{ marginBottom: 32 }}>
              {campaigns.map((c: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ color: '#1e293b', fontSize: '0.92rem' }}>{c.campaignName || c.objective}</strong>
                    <p style={{ fontSize: '0.825rem', color: '#94a3b8', marginTop: 2 }}>
                      {c.objective && c.campaignName ? `${c.objective} · ` : ''}{c.optimizationGoal && `Optimize: ${c.optimizationGoal} · `}{c.biddingModel && `Bid: ${c.biddingModel} · `}{c.budgetDollars || c.budgetSplit}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Ad Format Strategy */}
        {(formats.sparkAds?.applicable || formats.inFeedAds || formats.shoppingAds?.applicable) && (
          <>
            <SectionTitle sub="Which TikTok ad formats to use and how">Ad Format Strategy</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 14, marginBottom: 32 }}>
              {formats.inFeedAds && (
                <div style={{ padding: 18, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <p style={{ fontSize: '0.825rem', fontWeight: 700, color: '#000', textTransform: 'uppercase', marginBottom: 8 }}>In-Feed Ads</p>
                  {formats.inFeedAds.specs && <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: 4 }}>{formats.inFeedAds.specs}</p>}
                  {formats.inFeedAds.bestFor && <p style={{ fontSize: '0.825rem', color: RP }}><strong>Best for:</strong> {formats.inFeedAds.bestFor}</p>}
                </div>
              )}
              {formats.sparkAds?.applicable && (
                <div style={{ padding: 18, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <p style={{ fontSize: '0.825rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', marginBottom: 8 }}>Spark Ads</p>
                  {formats.sparkAds.sourcingMethod && <p style={{ fontSize: '0.875rem', color: '#1e293b', marginBottom: 6 }}>{formats.sparkAds.sourcingMethod}</p>}
                  {formats.sparkAds.boostingStrategy && <p style={{ fontSize: '0.825rem', color: RP, marginBottom: 8 }}>{formats.sparkAds.boostingStrategy}</p>}
                  {formats.sparkAds.creatorTiers?.length > 0 && (
                    <div>
                      <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#16a34a', marginBottom: 6, textTransform: 'uppercase' }}>Creator Tiers</p>
                      {formats.sparkAds.creatorTiers.map((tier: any, i: number) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #e2e8f0' }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>{tier.tier}</span>
                          <span style={{ fontSize: '0.825rem', color: RP }}>{tier.followerRange}</span>
                          <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#16a34a' }}>{tier.budgetAllocation}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {formats.topView?.applicable && (
                <div style={{ padding: 18, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <p style={{ fontSize: '0.825rem', fontWeight: 700, color: RP, textTransform: 'uppercase', marginBottom: 8 }}>TopView</p>
                  {formats.topView.estimatedCPM && <p style={{ fontSize: '0.875rem', color: '#1e293b', marginBottom: 4 }}>Est. CPM: {formats.topView.estimatedCPM}</p>}
                  {formats.topView.bestUseCase && <p style={{ fontSize: '0.825rem', color: RP }}>{formats.topView.bestUseCase}</p>}
                </div>
              )}
              {formats.shoppingAds?.applicable && (
                <div style={{ padding: 18, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <p style={{ fontSize: '0.825rem', fontWeight: 700, color: RP, textTransform: 'uppercase', marginBottom: 8 }}>TikTok Shopping</p>
                  {formats.shoppingAds.formats?.map((f: string, i: number) => <Tag key={i}>{f}</Tag>)}
                  {formats.shoppingAds.catalogSetup && <p style={{ fontSize: '0.825rem', color: RP, marginTop: 8 }}>{formats.shoppingAds.catalogSetup}</p>}
                </div>
              )}
            </div>
          </>
        )}

        {/* UGC Scripts */}
        {scripts.length > 0 && (
          <>
            <SectionTitle sub="Full video scripts ready to brief creators (word-for-word)">UGC Video Scripts</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 16, marginBottom: 32 }}>
              {scripts.map((s: any, i: number) => (
                <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ background: '#000', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ color: '#fff', fontWeight: 800, fontSize: '0.875rem' }}>Script {s.scriptNumber || i + 1}</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {s.totalLength && <span style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '2px 8px', borderRadius: 10 }}>{s.totalLength}</span>}
                      {s.angle && <span style={{ fontSize: '0.78rem', background: RP, color: '#fff', padding: '2px 8px', borderRadius: 10 }}>{s.angle}</span>}
                    </div>
                  </div>
                  <div style={{ padding: 16 }}>
                    {s.creatorPersona && <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', marginBottom: 12 }}>Creator: {s.creatorPersona} · Audio: {s.audioDirection}</p>}
                    {[
                      { label: 'HOOK (3 sec)', value: s.hook },
                      { label: 'PROBLEM (3–5 sec)', value: s.problemSetup },
                      { label: 'SOLUTION (5–8 sec)', value: s.solutionReveal },
                      { label: 'PROOF (3–5 sec)', value: s.socialProof },
                      { label: 'CTA (2–3 sec)', value: s.cta },
                    ].filter(item => item.value).map(({ label, value }) => (
                      <div key={label} style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 0, borderBottom: '1px solid #e2e8f0', marginBottom: 0 }}>
                        <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</p>
                        <p style={{ fontSize: '0.875rem', color: '#1e293b' }}>{value}</p>
                      </div>
                    ))}
                    {s.textOverlays?.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Text Overlays</p>
                        <div>{s.textOverlays.map((t: string, ti: number) => <Tag key={ti} color='#000' bg='#f4f4f4'>{t}</Tag>)}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Targeting Matrix */}
        {(targeting.interestCategories?.length > 0 || targeting.behavioralSignals?.length > 0) && (
          <>
            <SectionTitle sub="TikTok For Business targeting parameters">Targeting Matrix</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14, marginBottom: 32 }}>
              {targeting.interestCategories?.length > 0 && (
                <div style={{ padding: 18, background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '0.825rem', fontWeight: 700, color: '#000', textTransform: 'uppercase', marginBottom: 10 }}>Interests</p>
                  {targeting.interestCategories.map((t: string, i: number) => <Tag key={i} color='#1e293b' bg='#f4f4f4'>{t}</Tag>)}
                </div>
              )}
              {targeting.behavioralSignals?.length > 0 && (
                <div style={{ padding: 18, background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '0.825rem', fontWeight: 700, color: '#000', textTransform: 'uppercase', marginBottom: 10 }}>Behavioral</p>
                  {targeting.behavioralSignals.map((b: string, i: number) => <Tag key={i} color='#1e293b' bg='#f4f4f4'>{b}</Tag>)}
                </div>
              )}
              {(targeting.interests?.length > 0) && (
                <div style={{ padding: 18, background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '0.825rem', fontWeight: 700, color: '#000', textTransform: 'uppercase', marginBottom: 10 }}>Interests</p>
                  {targeting.interests.map((t: string, i: number) => <Tag key={i} color='#1e293b' bg='#f4f4f4'>{t}</Tag>)}
                </div>
              )}
              {(targeting.behaviors?.length > 0) && (
                <div style={{ padding: 18, background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '0.825rem', fontWeight: 700, color: '#000', textTransform: 'uppercase', marginBottom: 10 }}>Behaviors</p>
                  {targeting.behaviors.map((b: string, i: number) => <Tag key={i} color='#1e293b' bg='#f4f4f4'>{b}</Tag>)}
                </div>
              )}
              {targeting.demographics && (
                <div style={{ padding: 18, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '0.825rem', fontWeight: 700, color: '#000', textTransform: 'uppercase', marginBottom: 10 }}>Demographics</p>
                  {targeting.demographics.ageRange && <p style={{ fontSize: '0.875rem', color: '#1e293b', marginBottom: 4 }}>Age: {targeting.demographics.ageRange}</p>}
                  {targeting.demographics.gender && <p style={{ fontSize: '0.875rem', color: '#1e293b', marginBottom: 4 }}>Gender: {targeting.demographics.gender}</p>}
                  {targeting.demographics.geography && <p style={{ fontSize: '0.875rem', color: '#1e293b' }}>Geo: {targeting.demographics.geography}</p>}
                </div>
              )}
            </div>
          </>
        )}

        {/* Creative Testing Framework */}
        {testing.hookVariants?.length > 0 && (
          <>
            <SectionTitle sub="A/B test these variables to find your winning creative">Creative Testing Framework</SectionTitle>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: '0.825rem', fontWeight: 700, color: RP, textTransform: 'uppercase', marginBottom: 10 }}>Hook Variants to Test</p>
              {testing.hookVariants.map((h: string, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 0, marginBottom: 0, borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#94a3b8', fontWeight: 700, minWidth: 24, fontSize: '0.825rem' }}>H{i + 1}</span>
                  <p style={{ fontSize: '0.875rem', color: '#1e293b' }}>{h}</p>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 32 }}>
              {testing.killThreshold && (
                <div style={{ padding: 14, background: '#f8fafc', border: '1px solid #e2e8f0', borderLeft: '3px solid #dc2626', borderRadius: 0 }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', marginBottom: 4 }}>Kill Threshold</p>
                  <p style={{ fontSize: '0.875rem', color: '#1e293b' }}>{testing.killThreshold}</p>
                </div>
              )}
              {testing.scaleThreshold && (
                <div style={{ padding: 14, background: '#f8fafc', border: '1px solid #e2e8f0', borderLeft: '3px solid #16a34a', borderRadius: 0 }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', marginBottom: 4 }}>Scale Threshold</p>
                  <p style={{ fontSize: '0.875rem', color: '#1e293b' }}>{testing.scaleThreshold}</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Trending Strategy */}
        {(trending.audioCategories?.length > 0 || trending.hashtagStrategy) && (
          <>
            <SectionTitle sub="Trending content and organic/paid synergy strategy">Trending Content Strategy</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 14, marginBottom: 24 }}>
              {trending.audioCategories?.length > 0 && (
                <div style={{ padding: 16, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#000', textTransform: 'uppercase', marginBottom: 10 }}>Audio Categories</p>
                  {trending.audioCategories.map((a: string, i: number) => <Tag key={i} color='#1e293b' bg='#f4f4f4'>🎵 {a}</Tag>)}
                </div>
              )}
              {trending.hashtagStrategy && (
                <div style={{ padding: 16, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#000', textTransform: 'uppercase', marginBottom: 10 }}>Hashtag Strategy</p>
                  {trending.hashtagStrategy.niche?.map((h: string, i: number) => <Tag key={i} color='#4285F4' bg='#eff6ff'>#{h}</Tag>)}
                  {trending.hashtagStrategy.trending?.map((h: string, i: number) => <Tag key={i} color='#e8457a' bg='#fff0f3'>#{h}</Tag>)}
                  {trending.hashtagStrategy.branded?.map((h: string, i: number) => <Tag key={i} color={RP} bg='var(--bg-surface)'>#{h}</Tag>)}
                </div>
              )}
              {trending.postingCadence && (
                <div style={{ padding: 16, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: RP, textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.04em' }}>Posting Cadence</p>
                  <p style={{ fontSize: '0.875rem', color: '#1e293b' }}>{trending.postingCadence}</p>
                </div>
              )}
            </div>
            {trending.organicPaidSynergy && (
              <div style={{ padding: 16, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 32 }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>Organic + Paid Synergy</p>
                <p style={{ fontSize: '0.875rem', color: '#1e293b', lineHeight: 1.65 }}>{trending.organicPaidSynergy}</p>
              </div>
            )}
          </>
        )}

        {/* KPI Benchmarks */}
        {(kpi.cpm || kpi.cpc) && (
          <>
            <SectionTitle sub="Industry benchmark targets for TikTok Ads">KPI Benchmarks</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: 10, marginBottom: 16 }}>
              {[['CPM', kpi.cpm], ['CPC', kpi.cpc], ['CTR', kpi.ctr], ['VTR', kpi.vtr], ['CPA', kpi.cpa]].filter(([, v]) => v).map(([k, v]) => (
                <div key={k as string} style={{ padding: '14px 10px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, textAlign: 'center' }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>{k as string}</p>
                  <p style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>{v as string}</p>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 32 }}>
              {kpi.greenThreshold && <div style={{ padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderLeft: '3px solid #16a34a', borderRadius: 0 }}><p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#16a34a', marginBottom: 3, textTransform: 'uppercase' }}>Scale When</p><p style={{ fontSize: '0.825rem', color: '#1e293b' }}>{kpi.greenThreshold}</p></div>}
              {kpi.yellowThreshold && <div style={{ padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderLeft: '3px solid #d97706', borderRadius: 0 }}><p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#d97706', marginBottom: 3, textTransform: 'uppercase' }}>Optimise</p><p style={{ fontSize: '0.825rem', color: '#1e293b' }}>{kpi.yellowThreshold}</p></div>}
              {kpi.redThreshold && <div style={{ padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderLeft: '3px solid #dc2626', borderRadius: 0 }}><p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#dc2626', marginBottom: 3, textTransform: 'uppercase' }}>Pause If</p><p style={{ fontSize: '0.825rem', color: '#1e293b' }}>{kpi.redThreshold}</p></div>}
            </div>
          </>
        )}

        {/* Findings */}
        {data.findings?.length > 0 && (
          <>
            <SectionTitle sub="Key TikTok Ads issues">Findings</SectionTitle>
            <div style={{ marginBottom: 32 }}>
              {data.findings.map((f: any, i: number) => <FindingRow key={i} {...f} />)}
            </div>
          </>
        )}
      </>
    );
  }

  // ── ads-linkedin ─────────────────────────────────────────────────
  if (skillName === 'ads-linkedin' || skillName === 'linkedin') {
    const abm = d.abmStrategy || {};
    const campaigns = d.campaignArchitecture || d.campaignStructure || [];
    const formats = d.adFormats || {};
    const targeting = d.targetingMatrix || {};
    const offers = d.contentOffers || [];
    const convAds = d.conversationAdScripts || [];
    const synergy = d.organicPaidSynergy || {};
    const kpi = d.kpiBenchmarks || {};

    return (
      <>
        {/* ABM Strategy */}
        {(abm.idealCompanyProfile || abm.buyingCommittee?.length > 0) && (
          <>
            <SectionTitle sub="Account-Based Marketing targeting strategy">ABM Target Account Strategy</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16, marginBottom: 32 }}>
              {abm.idealCompanyProfile && (
                <div style={{ padding: 20, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: RP, textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.04em' }}>Ideal Company Profile</p>
                  {[['Company Size', abm.idealCompanyProfile.companySize], ['Revenue Range', abm.idealCompanyProfile.revenueRange], ['Growth Stage', abm.idealCompanyProfile.growthStage]].filter(([, v]) => v).map(([k, v]) => (
                    <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e2e8f0' }}>
                      <p style={{ fontSize: '0.825rem', color: RP }}>{k as string}</p>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>{v as string}</p>
                    </div>
                  ))}
                  {abm.idealCompanyProfile.industries?.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <p style={{ fontSize: '0.78rem', fontWeight: 700, color: RP, textTransform: 'uppercase', marginBottom: 6 }}>Industries</p>
                      <div>{abm.idealCompanyProfile.industries.map((ind: string, i: number) => <Tag key={i} color='#0077B5' bg='#e0f0fa'>{ind}</Tag>)}</div>
                    </div>
                  )}
                  {abm.idealCompanyProfile.techStackSignals?.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <p style={{ fontSize: '0.78rem', fontWeight: 700, color: RP, textTransform: 'uppercase', marginBottom: 6 }}>Tech Stack Signals</p>
                      <div>{abm.idealCompanyProfile.techStackSignals.map((t: string, i: number) => <Tag key={i} color='#475569' bg='#f4f4f4'>{t}</Tag>)}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Buying Committee */}
              {abm.buyingCommittee?.length > 0 && (
                <div style={{ padding: 20, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <p style={{ fontSize: '0.825rem', fontWeight: 700, color: RP, textTransform: 'uppercase', marginBottom: 12 }}>Buying Committee</p>
                  {abm.buyingCommittee.map((person: any, i: number) => (
                    <div key={i} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: i < abm.buyingCommittee.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <p style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.875rem' }}>{person.role}</p>
                        <Tag color='#0077B5' bg='#e0f0fa'>{person.linkedinSeniority}</Tag>
                      </div>
                      <p style={{ fontSize: '0.825rem', color: RP, marginBottom: 4 }}>{person.title}</p>
                      {person.concerns?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {person.concerns.map((c: string, ci: number) => <Tag key={ci} color='#dc2626' bg='#fef2f2'>{c}</Tag>)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Account Tiers */}
            {abm.accountTiers?.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12, marginBottom: 32 }}>
                {abm.accountTiers.map((tier: any, i: number) => (
                  <div key={i} style={{ padding: 16, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                    <p style={{ fontWeight: 800, color: RP, fontSize: '0.875rem', marginBottom: 6 }}>{tier.tier}</p>
                    <p style={{ fontSize: '0.825rem', color: '#1e293b', marginBottom: 6 }}>{tier.approach}</p>
                    {tier.budgetAllocation && <p style={{ fontSize: '0.825rem', fontWeight: 700, color: '#16a34a' }}>{tier.budgetAllocation}</p>}
                    {tier.targetAccounts && <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 4 }}>Target: {tier.targetAccounts}</p>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Campaign Architecture */}
        {campaigns.length > 0 && (
          <>
            <SectionTitle sub="LinkedIn Campaign Manager structure">Campaign Architecture</SectionTitle>
            <div style={{ marginBottom: 32 }}>
              {campaigns.map((c: any, i: number) => (
                <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 8, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#0077B5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.875rem', flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <strong style={{ color: '#1e293b', fontSize: '0.92rem' }}>{c.campaignName || c.format || `Campaign ${i + 1}`}</strong>
                      <p style={{ fontSize: '0.825rem', color: '#94a3b8', marginTop: 2 }}>
                        {c.objective} · {c.format && `${c.format} · `}{c.funnelStage && `${c.funnelStage} · `}{c.monthlyBudget || c.budgetSplit}
                        {c.bidStrategy && ` · ${c.bidStrategy}`}
                      </p>
                    </div>
                    {c.funnelStage && (
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, padding: '3px 8px', borderRadius: 4, color: '#475569', background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
                        {c.funnelStage}
                      </span>
                    )}
                  </div>
                  {c.expectedCPL && (
                    <div style={{ padding: '6px 18px 10px', borderTop: '1px solid #e2e8f0' }}>
                      <p style={{ fontSize: '0.825rem', color: RP }}>Expected CPL: <strong style={{ color: '#1e293b' }}>{c.expectedCPL}</strong>{c.audience && ` · Audience: ${c.audience}`}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Targeting Matrix */}
        {(targeting.jobTitles?.length > 0 || targeting.seniority?.length > 0) && (
          <>
            <SectionTitle sub="LinkedIn-specific targeting parameters">Targeting Matrix</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14, marginBottom: 32 }}>
              {[
                { label: 'Job Titles', items: targeting.jobTitles },
                { label: 'Seniority', items: targeting.seniority },
                { label: 'Industries', items: targeting.industries },
                { label: 'Company Sizes', items: targeting.companySizes },
                { label: 'Job Functions', items: targeting.jobFunctions },
                { label: 'Skills', items: targeting.skills },
              ].filter(({ items }) => items?.length > 0).map(({ label, items }) => (
                <div key={label} style={{ padding: 16, background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: RP, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>{label}</p>
                  <div>{items.map((item: string, i: number) => <Tag key={i}>{item}</Tag>)}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Content Offers */}
        {offers.length > 0 && (
          <>
            <SectionTitle sub="Lead magnets ranked by lead quality and CPL efficiency">Content Offer Strategy</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
              {offers.map((offer: any, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 16, padding: '16px 18px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: i === 0 ? '#16a34a' : '#0077B5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.875rem', flexShrink: 0 }}>#{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <p style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.92rem' }}>{typeof offer === 'string' ? offer : offer.title}</p>
                      {offer.format && <Tag color='#0077B5' bg='#e0f0fa'>{offer.format}</Tag>}
                    </div>
                    {offer.funnelStage && <p style={{ fontSize: '0.825rem', color: RP, marginBottom: 4 }}>Stage: {offer.funnelStage}</p>}
                    {offer.whyItWorks && <p style={{ fontSize: '0.825rem', color: '#475569', marginBottom: 4 }}>{offer.whyItWorks}</p>}
                    {offer.followUpSequence && <p style={{ fontSize: '0.825rem', color: '#94a3b8', fontStyle: 'italic' }}>Follow-up: {offer.followUpSequence}</p>}
                  </div>
                  {offer.expectedCPL && (
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: 2 }}>Est. CPL</p>
                      <p style={{ fontWeight: 800, color: RP, fontSize: '1rem' }}>{offer.expectedCPL}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Conversation Ad Scripts */}
        {convAds.length > 0 && (
          <>
            <SectionTitle sub="LinkedIn Conversation Ads, ready to build">Conversation Ad Scripts</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 16, marginBottom: 32 }}>
              {convAds.map((ad: any, i: number) => (
                <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ background: '#0077B5', padding: '10px 16px' }}>
                    <p style={{ color: '#fff', fontWeight: 700, fontSize: '0.875rem' }}>Conversation Ad {i + 1}</p>
                    {ad.subject && <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.825rem', marginTop: 2 }}>Subject: {ad.subject}</p>}
                  </div>
                  <div style={{ padding: 16 }}>
                    {ad.introMessage && (
                      <div style={{ padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, marginBottom: 12 }}>
                        <p style={{ fontSize: '0.875rem', color: '#1e293b', lineHeight: 1.6 }}>{ad.introMessage}</p>
                      </div>
                    )}
                    {ad.ctaOptions?.length > 0 && (
                      <div>
                        <p style={{ fontSize: '0.78rem', fontWeight: 700, color: RP, textTransform: 'uppercase', marginBottom: 6 }}>CTA Options</p>
                        {ad.ctaOptions.map((cta: any, ci: number) => (
                          <div key={ci} style={{ display: 'flex', gap: 8, padding: '7px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, marginBottom: 6, alignItems: 'center' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: RP }}>{cta.text}</span>
                            {cta.destination && <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginLeft: 'auto' }}>→ {cta.destination}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                    {ad.followUpBranch && (
                      <div style={{ marginTop: 10, padding: '8px 12px', background: '#f8fafc', borderRadius: 8 }}>
                        <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', marginBottom: 2 }}>Follow-up branch</p>
                        <p style={{ fontSize: '0.825rem', color: '#475569' }}>{ad.followUpBranch}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Organic + Paid Synergy */}
        {(synergy.thoughtLeadershipTopics?.length > 0 || synergy.employeeAdvocacyStrategy) && (
          <>
            <SectionTitle sub="Amplify paid reach with organic LinkedIn content">Organic + Paid Synergy</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14, marginBottom: 32 }}>
              {synergy.thoughtLeadershipTopics?.length > 0 && (
                <div style={{ padding: 18, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <p style={{ fontSize: '0.825rem', fontWeight: 700, color: RP, textTransform: 'uppercase', marginBottom: 10 }}>Thought Leadership Topics</p>
                  {synergy.thoughtLeadershipTopics.map((t: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: '1px solid #e2e8f0' }}>
                      <span style={{ color: RP, fontWeight: 700 }}>→</span>
                      <p style={{ fontSize: '0.875rem', color: '#1e293b' }}>{t}</p>
                    </div>
                  ))}
                </div>
              )}
              {synergy.employeeAdvocacyStrategy && (
                <div style={{ padding: 18, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: RP, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.04em' }}>Employee Advocacy</p>
                  <p style={{ fontSize: '0.875rem', color: '#1e293b', lineHeight: 1.65 }}>{synergy.employeeAdvocacyStrategy}</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* KPI Benchmarks */}
        {(kpi.expectedCTR || kpi.expectedCPL) && (
          <>
            <SectionTitle sub="LinkedIn Ads industry benchmarks">KPI Benchmarks</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10, marginBottom: 32 }}>
              {[['CTR', kpi.expectedCTR], ['CPL', kpi.expectedCPL], ['CPC', kpi.expectedCPC], ['Engagement', kpi.engagementRate], ['Form Fill', kpi.leadFormFillRate], ['MQL→SQL', kpi.mqtToSqlRate]].filter(([, v]) => v).map(([k, v]) => (
                <div key={k as string} style={{ padding: '14px 10px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, textAlign: 'center' }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: RP, textTransform: 'uppercase', marginBottom: 4 }}>{k as string}</p>
                  <p style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>{v as string}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Findings */}
        {data.findings?.length > 0 && (
          <>
            <SectionTitle sub="Key LinkedIn B2B Ads issues">Findings</SectionTitle>
            <div style={{ marginBottom: 32 }}>
              {data.findings.map((f: any, i: number) => <FindingRow key={i} {...f} />)}
            </div>
          </>
        )}
      </>
    );
  }

  // ── ads-report ───────────────────────────────────────────────────
  if (skillName === 'ads-report' || skillName === 'report') {
    const targetAud = d.targetAudience || {};
    const platformStrat = d.platformStrategy || {};
    const budgetAlloc = d.budgetAllocation || {};
    const funnelArch = d.funnelArchitecture || {};
    const campaigns = d.campaignOverview || [];
    const kpiFramework = d.kpiFramework || {};
    const plan = d.ninetyDayPlan || [];
    const risks = d.riskFactors || [];

    return (
      <>
        {/* Executive Summary */}
        {d.executiveSummary && (
          <>
            <SectionTitle sub="Senior media buyer assessment of this business">Executive Summary</SectionTitle>
            <div style={{ padding: 16, background: '#f8fafc', border: '1px solid #e2e8f0', borderLeft: `3px solid ${RP}`, borderRadius: 0, marginBottom: 32 }}>
              <p style={{ fontSize: '1.02rem', color: '#1e293b', lineHeight: 1.8 }}>{d.executiveSummary}</p>
            </div>
          </>
        )}

        {/* Market Landscape */}
        {d.marketLandscape && (
          <>
            <SectionTitle sub="Competitive context and market opportunity">Market Landscape</SectionTitle>
            <div style={{ padding: 16, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 32 }}>
              <p style={{ fontSize: '0.95rem', color: '#1e293b', lineHeight: 1.75 }}>{d.marketLandscape}</p>
            </div>
          </>
        )}

        {/* Target Audience */}
        {(typeof targetAud === 'string' ? targetAud : targetAud.primaryICP) && (
          <>
            <SectionTitle sub="ICP definition and buyer psychology">Target Audience & ICP</SectionTitle>
            {typeof targetAud === 'string' ? (
              <div style={{ padding: 20, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 32 }}>
                <p style={{ fontSize: '0.95rem', color: '#1e293b', lineHeight: 1.75 }}>{targetAud}</p>
              </div>
            ) : (
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 14, marginBottom: 14 }}>
                  {[['Primary ICP', targetAud.primaryICP], ['Psychographics', targetAud.psychographics], ['Buyer Journey', targetAud.buyerJourney]].filter(([, v]) => v).map(([k, v]) => (
                    <div key={k as string} style={{ padding: 18, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                      <p style={{ fontSize: '0.78rem', fontWeight: 700, color: RP, textTransform: 'uppercase', marginBottom: 8 }}>{k as string}</p>
                      <p style={{ fontSize: '0.875rem', color: '#1e293b', lineHeight: 1.65 }}>{v as string}</p>
                    </div>
                  ))}
                </div>
                {(targetAud.keyObjections?.length > 0 || targetAud.emotionalTriggers?.length > 0) && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {targetAud.keyObjections?.length > 0 && (
                      <div style={{ padding: 16, background: '#f8fafc', border: '1px solid #e2e8f0', borderLeft: '3px solid #dc2626', borderRadius: 0 }}>
                        <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', marginBottom: 8 }}>Key Objections</p>
                        {targetAud.keyObjections.map((o: string, i: number) => <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}><span style={{ color: '#94a3b8', fontWeight: 700 }}>✕</span><p style={{ fontSize: '0.875rem', color: '#1e293b' }}>{o}</p></div>)}
                      </div>
                    )}
                    {targetAud.emotionalTriggers?.length > 0 && (
                      <div style={{ padding: 16, background: '#f8fafc', border: '1px solid #e2e8f0', borderLeft: '3px solid #16a34a', borderRadius: 0 }}>
                        <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', marginBottom: 8 }}>Emotional Triggers</p>
                        {targetAud.emotionalTriggers.map((t: string, i: number) => <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}><span style={{ color: '#94a3b8', fontWeight: 700 }}>→</span><p style={{ fontSize: '0.875rem', color: '#1e293b' }}>{t}</p></div>)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Platform Strategy */}
        {(typeof platformStrat === 'string' ? platformStrat : platformStrat.platforms?.length > 0) && (
          <>
            <SectionTitle sub="Platform recommendations ranked by fit and priority">Platform Strategy</SectionTitle>
            {typeof platformStrat === 'string' ? (
              <div style={{ padding: 20, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 32 }}>
                <p style={{ fontSize: '0.95rem', color: '#1e293b', lineHeight: 1.75 }}>{platformStrat}</p>
              </div>
            ) : (
              <div style={{ marginBottom: 32 }}>
                {platformStrat.summary && <p style={{ fontSize: '0.92rem', color: RP, lineHeight: 1.7, marginBottom: 16 }}>{platformStrat.summary}</p>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {platformStrat.platforms?.map((p: any, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 14, padding: '12px 18px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, alignItems: 'center' }}>
                      <span style={{ width: 26, height: 26, borderRadius: '50%', background: RP, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.825rem', flexShrink: 0 }}>#{p.priority || i + 1}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>{p.platform}</p>
                        <p style={{ fontSize: '0.825rem', color: RP }}>{p.rationale}</p>
                      </div>
                      {p.allocation && <Tag color='#16a34a' bg='#f0fdf4'>{p.allocation}</Tag>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Creative Direction */}
        {d.creativeDirection && (
          <>
            <SectionTitle sub="Visual style, tone, and creative execution guidance">Creative Direction</SectionTitle>
            <div style={{ padding: 16, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 32 }}>
              <p style={{ fontSize: '0.95rem', color: '#1e293b', lineHeight: 1.75 }}>{typeof d.creativeDirection === 'string' ? d.creativeDirection : JSON.stringify(d.creativeDirection)}</p>
            </div>
          </>
        )}

        {/* Budget Allocation */}
        {(typeof budgetAlloc === 'string' ? budgetAlloc : budgetAlloc.breakdown?.length > 0) && (
          <>
            <SectionTitle sub="How to allocate the monthly ad budget">Budget Allocation</SectionTitle>
            {typeof budgetAlloc === 'string' ? (
              <div style={{ padding: 20, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 32 }}>
                <p style={{ fontSize: '0.95rem', color: '#1e293b', lineHeight: 1.75 }}>{budgetAlloc}</p>
              </div>
            ) : (
              <div style={{ marginBottom: 32 }}>
                {budgetAlloc.summary && <p style={{ fontSize: '0.875rem', color: RP, marginBottom: 14 }}>{budgetAlloc.summary}</p>}
                {budgetAlloc.breakdown?.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                    {budgetAlloc.breakdown.map((item: any, i: number) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 100px 80px', gap: 12, padding: '10px 16px', background: i % 2 === 0 ? '#fafafe' : '#fff', border: '1px solid #e2e8f0', borderRadius: 10 }}>
                        <p style={{ fontSize: '0.875rem', color: '#1e293b', fontWeight: 600 }}>{item.item}</p>
                        <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#16a34a' }}>{item.amount}</p>
                        <p style={{ fontSize: '0.825rem', color: '#94a3b8' }}>{item.percentage}</p>
                      </div>
                    ))}
                  </div>
                )}
                {budgetAlloc.totalMonthly && <div style={{ padding: '12px 18px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}><p style={{ fontWeight: 800, color: '#1e293b', fontSize: '1.05rem' }}>Total: {budgetAlloc.totalMonthly}/mo</p></div>}
              </div>
            )}
          </>
        )}

        {/* Funnel Architecture */}
        {(typeof funnelArch === 'string' ? funnelArch : funnelArch.tofu) && (
          <>
            <SectionTitle sub="Full-funnel ad-to-conversion architecture">Funnel Architecture</SectionTitle>
            {typeof funnelArch === 'string' ? (
              <div style={{ padding: 20, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 32 }}>
                <p style={{ fontSize: '0.95rem', color: '#1e293b', lineHeight: 1.75 }}>{funnelArch}</p>
              </div>
            ) : (
              <div style={{ marginBottom: 32 }}>
                {funnelArch.summary && <p style={{ fontSize: '0.875rem', color: RP, marginBottom: 14 }}>{funnelArch.summary}</p>}
                {[['TOFU', funnelArch.tofu, '#4285F4'], ['MOFU', funnelArch.mofu, '#f59e0b'], ['BOFU', funnelArch.bofu, '#16a34a']].filter(([, v]) => v).map(([stage, content, color]) => (
                  <div key={stage as string} style={{ display: 'flex', gap: 12, padding: '12px 16px', background: '#fff', border: '1px solid #e2e8f0', borderLeft: `3px solid ${color as string}`, borderRadius: 0, marginBottom: 8 }}>
                    <span style={{ fontWeight: 800, color: color as string, minWidth: 50, fontSize: '0.875rem' }}>{stage as string}</span>
                    <p style={{ fontSize: '0.875rem', color: '#1e293b', lineHeight: 1.6 }}>{content as string}</p>
                  </div>
                ))}
                {funnelArch.retargetingSequence && <div style={{ padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderLeft: `3px solid ${RP}`, borderRadius: 0, marginTop: 8 }}><p style={{ fontSize: '0.78rem', fontWeight: 700, color: RP, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Retargeting Sequence</p><p style={{ fontSize: '0.875rem', color: '#1e293b' }}>{funnelArch.retargetingSequence}</p></div>}
              </div>
            )}
          </>
        )}

        {/* Campaign Overview */}
        {campaigns.length > 0 && (
          <>
            <SectionTitle sub="All recommended campaigns across platforms">Campaign Overview</SectionTitle>
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 0, padding: '8px 14px', background: '#f8fafc', borderRadius: '10px 10px 0 0', border: '1px solid #e2e8f0' }}>
                {['Campaign', 'Platform', 'Objective', 'Audience', 'Budget'].map(h => <p key={h} style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>{h}</p>)}
              </div>
              {campaigns.map((c: any, i: number) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 0, padding: '10px 14px', background: i % 2 === 0 ? '#fff' : '#fafafe', border: '1px solid #e2e8f0', borderTop: 'none' }}>
                  <p style={{ fontSize: '0.825rem', fontWeight: 600, color: '#1e293b' }}>{c.campaignName}</p>
                  <p style={{ fontSize: '0.825rem', color: RP }}>{c.platform}</p>
                  <p style={{ fontSize: '0.825rem', color: '#475569' }}>{c.objective}</p>
                  <p style={{ fontSize: '0.825rem', color: '#475569' }}>{c.audience}</p>
                  <p style={{ fontSize: '0.825rem', fontWeight: 700, color: '#16a34a' }}>{c.budget}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* KPI Framework */}
        {kpiFramework.primaryKPIs?.length > 0 && (
          <>
            <SectionTitle sub="What to measure, targets, and when to act">KPI Framework</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10, marginBottom: 16 }}>
              {kpiFramework.primaryKPIs.map((kpi: any, i: number) => (
                <div key={i} style={{ padding: '14px 16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: RP, textTransform: 'uppercase', marginBottom: 4 }}>{kpi.kpi}</p>
                  <p style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', marginBottom: 2 }}>{kpi.target}</p>
                  <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{kpi.platform}</p>
                </div>
              ))}
            </div>
            {kpiFramework.optimizationTriggers?.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: RP, textTransform: 'uppercase', marginBottom: 8 }}>Optimization Triggers</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {kpiFramework.optimizationTriggers.map((t: string, i: number) => <Tag key={i} color={RP} bg='var(--bg-surface)'>{t}</Tag>)}
                </div>
              </div>
            )}
          </>
        )}

        {/* 90-Day Plan */}
        {plan.length > 0 && (
          <>
            <SectionTitle sub="Phase-by-phase implementation roadmap">90-Day Action Plan</SectionTitle>
            <div style={{ marginBottom: 32 }}>
              {plan.map((phase: any, i: number) => (
                <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 12, overflow: 'hidden' }}>
                  <div style={{ background: '#f8fafc', padding: '12px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.92rem' }}>{phase.phase || `Phase ${i + 1}`}</p>
                      {phase.weeks && <p style={{ fontSize: '0.825rem', color: '#94a3b8' }}>{phase.weeks}</p>}
                    </div>
                    {phase.focus && <Tag color={i === 0 ? '#4285F4' : i === 1 ? '#d97706' : '#16a34a'} bg={i === 0 ? '#eff6ff' : i === 1 ? '#fffbeb' : '#f0fdf4'}>{phase.focus}</Tag>}
                  </div>
                  <div style={{ padding: '12px 18px' }}>
                    {(phase.actions || (phase.action ? [phase.action] : [])).map((a: string, ai: number) => (
                      <div key={ai} style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
                        <span style={{ color: RP, fontWeight: 700 }}>→</span>
                        <p style={{ fontSize: '0.86rem', color: '#1e293b' }}>{a}</p>
                      </div>
                    ))}
                    {phase.expectedOutcome && (
                      <div style={{ marginTop: 10, padding: '8px 12px', background: '#f8fafc', borderRadius: 0, borderLeft: '2px solid #16a34a' }}>
                        <p style={{ fontSize: '0.825rem', color: '#16a34a', fontWeight: 600 }}>Expected: {phase.expectedOutcome}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Risk Factors */}
        {risks.length > 0 && (
          <>
            <SectionTitle sub="Risks that could derail the strategy and how to mitigate them">Risk Factors</SectionTitle>
            <div style={{ marginBottom: 32 }}>
              {risks.map((r: any, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 18px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>⚠️</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>{r.risk}</p>
                    {r.probability && <p style={{ fontSize: '0.825rem', color: RP, fontWeight: 600, marginBottom: 4 }}>Probability: {r.probability}</p>}
                    {r.mitigation && <p style={{ fontSize: '0.875rem', color: '#475569' }}>Mitigation: {r.mitigation}</p>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </>
    );
  }

  // ── ads-report-pdf ───────────────────────────────────────────────
  if (skillName === 'ads-report-pdf' || skillName === 'report-pdf') {
    const cover = d.coverPage || {};
    const brief = d.executiveBrief || {};
    const scores = d.auditScores || d.scoreBreakdown || [];
    const findings = d.topFindings || [];
    const platforms = d.platformRecommendations || [];
    const creative = d.creativeBrief || [];
    const recs = d.recommendations || [];
    const invest = d.investmentSummary || {};
    const next = d.nextSteps || [];
    const benchmarks = d.benchmarksAppendix || [];

    const statusColor = (s: string) => s === 'green' ? '#16a34a' : s === 'yellow' ? '#d97706' : '#dc2626';
    const statusBg = (s: string) => s === 'green' ? '#f0fdf4' : s === 'yellow' ? '#fffbeb' : '#fef2f2';

    return (
      <>
        {/* Cover Page */}
        {cover.title && (
          <div style={{ padding: 32, background: 'linear-gradient(135deg,#1e293b,#2d1b69)', borderRadius: 8, marginBottom: 32, color: '#fff' }}>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: '0.825rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>ZieAds · Agency Report</p>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 900, lineHeight: 1.2, marginBottom: 8 }}>{cover.title}</h1>
              {cover.subtitle && <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)', marginBottom: 20 }}>{cover.subtitle}</p>}
            </div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {cover.preparedFor && <div><p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>PREPARED FOR</p><p style={{ fontWeight: 700 }}>{cover.preparedFor}</p></div>}
              {cover.url && <div><p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>URL</p><p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{cover.url}</p></div>}
              {cover.date && <div><p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>DATE</p><p style={{ fontWeight: 700 }}>{cover.date}</p></div>}
            </div>
            {cover.tagline && <p style={{ marginTop: 24, fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>{cover.tagline}</p>}
          </div>
        )}

        {/* Executive Brief */}
        {brief.summary && (
          <>
            <SectionTitle sub="Client-facing summary in non-technical language">Executive Brief</SectionTitle>
            <div style={{ padding: 16, background: '#f8fafc', border: '1px solid #e8e6f0', borderRadius: 8, marginBottom: 16 }}>
              <p style={{ fontSize: '1rem', color: '#1e293b', lineHeight: 1.8, marginBottom: 16 }}>{brief.summary}</p>
              {brief.topPriority && (
                <div style={{ padding: '12px 16px', background: '#fee2e2', borderRadius: 10, marginBottom: 10 }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', marginBottom: 4 }}>Top Priority</p>
                  <p style={{ fontSize: '0.92rem', fontWeight: 600, color: '#1e293b' }}>{brief.topPriority}</p>
                </div>
              )}
              {brief.expectedOutcome && (
                <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 6, borderLeft: '3px solid #16a34a' }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', marginBottom: 4 }}>Expected Outcome (90 days)</p>
                  <p style={{ fontSize: '0.92rem', color: '#1e293b' }}>{brief.expectedOutcome}</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Audit Scores */}
        {scores.length > 0 && (
          <>
            <SectionTitle sub="8-dimension audit scores with traffic-light status">Audit Scorecard</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12, marginBottom: 32 }}>
              {scores.map((s: any, i: number) => {
                const sc = s.score ?? 0;
                const status = s.status || (sc >= 70 ? 'green' : sc >= 45 ? 'yellow' : 'red');
                return (
                  <div key={i} style={{ padding: 18, background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <ScoreBadge score={sc} label={s.dimension} />
                    <div style={{ display: 'inline-block', marginTop: 8, padding: '3px 10px', background: '#f1f5f9', border: `1px solid ${statusColor(status)}`, borderRadius: 4 }}>
                      <p style={{ fontSize: '0.78rem', fontWeight: 700, color: statusColor(status) }}>{status.toUpperCase()}</p>
                    </div>
                    {s.summary && <p style={{ fontSize: '0.825rem', color: RP, marginTop: 10, lineHeight: 1.5 }}>{s.summary}</p>}
                    {s.topRecommendation && <p style={{ fontSize: '0.78rem', color: RP, marginTop: 8, fontStyle: 'italic' }}>{s.topRecommendation}</p>}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Top Findings */}
        {findings.length > 0 && (
          <>
            <SectionTitle sub="Client-presentation findings with revenue impact">Top Findings</SectionTitle>
            <div style={{ marginBottom: 32 }}>
              {findings.map((f: any, i: number) => {
                const sev = (f.severity || '').toLowerCase();
                return (
                  <div key={i} style={{ padding: '18px 20px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <span style={{ background: '#f1f5f9', border: `1px solid ${sev === 'critical' ? '#dc2626' : sev === 'high' ? '#d97706' : sev === 'medium' ? '#0284c7' : '#16a34a'}`, color: sev === 'critical' ? '#dc2626' : sev === 'high' ? '#d97706' : sev === 'medium' ? '#0284c7' : '#16a34a', fontSize: '0.78rem', fontWeight: 700, padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase' }}>{f.severity}</span>
                      <strong style={{ color: '#1e293b', fontSize: '0.95rem' }}>{f.title}</strong>
                    </div>
                    {f.clientDescription && <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.65, marginBottom: 10 }}>{f.clientDescription}</p>}
                    {f.recommendedFix && <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 10, marginBottom: 8 }}><p style={{ fontSize: '0.875rem', color: '#1e293b' }}>Fix: {f.recommendedFix}</p></div>}
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      {f.timeToImplement && <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>⏱ {f.timeToImplement}</p>}
                      {f.expectedImpact && <p style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 600 }}>📈 {f.expectedImpact}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Platform Recommendations */}
        {platforms.length > 0 && (
          <>
            <SectionTitle sub="Which platforms to use and why">Platform Recommendations</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14, marginBottom: 32 }}>
              {platforms.map((p: any, i: number) => (
                <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontWeight: 800, color: '#1e293b' }}>{p.platform}</p>
                    <span style={{ fontWeight: 800, color: p.fitScore >= 70 ? '#16a34a' : p.fitScore >= 50 ? '#d97706' : '#dc2626', fontSize: '0.875rem' }}>{p.fitScore}/100</span>
                  </div>
                  <div style={{ padding: 16 }}>
                    {p.whyItFits && <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: 10, lineHeight: 1.55 }}>{p.whyItFits}</p>}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                      {p.expectedCPA && <div style={{ padding: '4px 10px', background: '#f8fafc', borderRadius: 8, fontSize: '0.825rem', color: '#1e293b' }}>CPA: {p.expectedCPA}</div>}
                      {p.expectedROAS && <div style={{ padding: '4px 10px', background: '#f8fafc', borderRadius: 8, fontSize: '0.825rem', color: '#1e293b' }}>ROAS: {p.expectedROAS}</div>}
                    </div>
                    {p.budgetAllocation && <p style={{ fontSize: '0.825rem', fontWeight: 700, color: '#16a34a' }}>Allocation: {p.budgetAllocation}</p>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Creative Brief */}
        {creative.length > 0 && (
          <>
            <SectionTitle sub="Ad concept briefs for your creative team">Creative Brief</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14, marginBottom: 32 }}>
              {creative.map((c: any, i: number) => (
                <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ padding: '10px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                    <p style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.875rem' }}>{c.conceptName || `Concept ${i + 1}`}</p>
                    {c.format && <Tag>{c.format}</Tag>}
                  </div>
                  <div style={{ padding: 16 }}>
                    {c.hook && <div style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 0, marginBottom: 8, borderLeft: `3px solid ${RP}` }}><p style={{ fontSize: '0.78rem', fontWeight: 700, color: RP, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Hook</p><p style={{ fontSize: '0.875rem', color: '#1e293b' }}>{c.hook}</p></div>}
                    {c.visualDirection && <p style={{ fontSize: '0.825rem', color: RP, marginBottom: 4 }}><strong style={{ color: '#1e293b' }}>Visual: </strong>{c.visualDirection}</p>}
                    {c.copyDirection && <p style={{ fontSize: '0.825rem', color: RP, marginBottom: 4 }}><strong style={{ color: '#1e293b' }}>Copy: </strong>{c.copyDirection}</p>}
                    {c.targetAudience && <p style={{ fontSize: '0.825rem', color: '#94a3b8', marginBottom: 4 }}>Audience: {c.targetAudience}</p>}
                    {c.expectedCTR && <Tag color='#16a34a' bg='#f0fdf4'>CTR: {c.expectedCTR}</Tag>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Prioritised Recommendations */}
        {recs.length > 0 && (
          <>
            <SectionTitle sub="Ordered by ROI impact, implement in this order">Prioritised Recommendations</SectionTitle>
            <div style={{ marginBottom: 32 }}>
              {recs.map((r: any, i: number) => {
                const effortColor = { Low: '#16a34a', Medium: '#d97706', High: '#dc2626' }[(r.effort || 'Medium') as string] || '#64748b';
                return (
                  <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 18px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: RP, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.825rem', flexShrink: 0 }}>{r.rank || i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <p style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.875rem' }}>{r.title || r.action}</p>
                        {r.category && <Tag color={RP} bg='var(--bg-surface)'>{r.category}</Tag>}
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', background: '#f1f5f9', padding: '2px 8px', borderRadius: 4 }}>{r.effort} Effort</span>
                      </div>
                      {r.action && r.title && <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: 4 }}>{r.action}</p>}
                      {r.expectedImpact && <p style={{ fontSize: '0.825rem', color: '#16a34a', fontWeight: 600 }}>Impact: {r.expectedImpact}</p>}
                    </div>
                    {r.timeline && <p style={{ fontSize: '0.825rem', color: '#94a3b8', flexShrink: 0, whiteSpace: 'nowrap' }}>{r.timeline}</p>}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Investment Summary */}
        {(invest.monthlyAdSpend || invest.results30Days) && (
          <>
            <SectionTitle sub="Monthly investment and expected return milestones">Investment Summary</SectionTitle>
            <div style={{ padding: 16, background: 'linear-gradient(135deg,#1e293b,#2d1b69)', borderRadius: 8, marginBottom: 16, color: '#fff' }}>
              {invest.monthlyAdSpend && <p style={{ fontSize: '0.825rem', color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>MONTHLY AD SPEND</p>}
              {invest.monthlyAdSpend && <p style={{ fontSize: '2rem', fontWeight: 900, marginBottom: 20 }}>{invest.monthlyAdSpend}</p>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                {[['30 Days', invest.results30Days], ['60 Days', invest.results60Days], ['90 Days', invest.results90Days]].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k as string} style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.08)', borderRadius: 8 }}>
                    <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>{k as string}</p>
                    <p style={{ fontSize: '0.875rem', color: '#fff', lineHeight: 1.5 }}>{v as string}</p>
                  </div>
                ))}
              </div>
              {invest.breakEvenAnalysis && <p style={{ marginTop: 16, fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>{invest.breakEvenAnalysis}</p>}
            </div>
            {invest.platformBreakdown?.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                {invest.platformBreakdown.map((p: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 14, padding: '8px 14px', background: i % 2 === 0 ? '#fafafe' : '#fff', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 4, alignItems: 'center' }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', flex: 1 }}>{p.platform}</p>
                    <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#16a34a' }}>{p.amount}</p>
                    <p style={{ fontSize: '0.825rem', color: '#94a3b8', minWidth: 40, textAlign: 'right' }}>{p.percentage}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Next Steps */}
        {next.length > 0 && (
          <>
            <SectionTitle sub="First 30-day onboarding actions">Next Steps</SectionTitle>
            <div style={{ marginBottom: 32 }}>
              {next.map((n: any, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 14, padding: '12px 18px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#16a34a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.825rem', flexShrink: 0 }}>{n.step || i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>{typeof n === 'string' ? n : n.action}</p>
                    {n.owner && <p style={{ fontSize: '0.825rem', color: RP }}>Owner: {n.owner}</p>}
                  </div>
                  {n.timeline && <p style={{ fontSize: '0.825rem', color: RP, fontWeight: 600, flexShrink: 0 }}>{n.timeline}</p>}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Benchmarks Appendix */}
        {benchmarks.length > 0 && (
          <>
            <SectionTitle sub="Industry performance benchmarks across platforms">Benchmarks Appendix</SectionTitle>
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', padding: '8px 14px', background: '#f8fafc', borderRadius: '10px 10px 0 0', border: '1px solid #e2e8f0' }}>
                {['Platform', 'Metric', 'Industry Avg', 'Top Performer'].map(h => <p key={h} style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>{h}</p>)}
              </div>
              {benchmarks.map((b: any, i: number) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', padding: '10px 14px', background: i % 2 === 0 ? '#fff' : '#fafafe', border: '1px solid #e2e8f0', borderTop: 'none' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: RP }}>{b.platform}</p>
                  <p style={{ fontSize: '0.875rem', color: '#1e293b' }}>{b.metric}</p>
                  <p style={{ fontSize: '0.875rem', color: RP }}>{b.industryAvg}</p>
                  <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#16a34a' }}>{b.topPerformer}</p>
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
          <div style={{ marginBottom: 32, padding: 16, borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', borderLeft: `4px solid ${d.readyToRun ? '#16a34a' : '#dc2626'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: '2rem' }}>{d.readyToRun ? '🟢' : '🔴'}</span>
              <div>
                <p style={{ fontWeight: 800, fontSize: '1.1rem', color: d.readyToRun ? '#15803d' : '#dc2626', marginBottom: 2 }}>
                  {d.readyToRun ? 'Ready to Run Ads' : 'Not Ready: Fix Issues First'}
                </p>
                <p style={{ fontSize: '0.875rem', color: RP }}>Grade: {d.estimatedReadinessGrade} · {d.platformRecommendation}</p>
              </div>
            </div>
            {d.topPriority && (
              <div style={{ background: 'rgba(0,0,0,0.04)', borderRadius: 10, padding: '12px 16px' }}>
                <span style={{ fontSize: '0.825rem', fontWeight: 700, color: RP, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Top Priority → </span>
                <span style={{ fontSize: '0.92rem', color: '#1e293b', fontWeight: 600 }}>{d.topPriority}</span>
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
                <div key={key} style={{ padding: '16px 18px', background: '#fff', border: '1px solid #e2e8f0', borderLeft: `3px solid ${statusColor(val.status)}`, borderRadius: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b' }}>{signalLabels[key] || key}</p>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: statusColor(val.status), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 800 }}>
                      {statusIcon(val.status)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: '0.825rem', color: RP, lineHeight: 1.5, flex: 1, marginRight: 8 }}>{val.detail}</p>
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
                  <div key={key} style={{ padding: '16px 18px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: scoreColor(score), marginBottom: 4 }}>{score}</div>
                    <div style={{ width: '100%', height: 4, background: '#e2e8f0', borderRadius: 2, marginBottom: 8 }}>
                      <div style={{ width: `${score}%`, height: '100%', background: scoreColor(score), borderRadius: 2 }} />
                    </div>
                    <p style={{ fontSize: '0.825rem', fontWeight: 600, color: RP }}>{scoreLabels[key] || key}</p>
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
                <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderLeft: '3px solid #16a34a', borderRadius: 0, marginBottom: 0, borderBottom: i < d.quickWins.length - 1 ? '1px solid #e2e8f0' : '1px solid #e2e8f0' }}>
                  <span style={{ color: '#16a34a', fontWeight: 800, fontSize: '1rem' }}>{i + 1}.</span>
                  <p style={{ fontSize: '0.875rem', color: '#1e293b' }}>{win}</p>
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
                <div key={i} style={{ padding: '14px 18px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>
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
                <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 0, marginBottom: 0, borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#d97706', fontWeight: 700 }}>→</span>
                  <p style={{ fontSize: '0.875rem', color: '#1e293b' }}>{cta}</p>
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
                <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderLeft: '3px solid #dc2626', borderRadius: 0, marginBottom: 0, borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#dc2626', fontWeight: 700 }}>✕</span>
                  <p style={{ fontSize: '0.875rem', color: '#1e293b' }}>{gap}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Messaging recommendations */}
        {d.messagingRecommendations && (
          <>
            <SectionTitle sub="Align page copy with your paid ad messaging">Messaging Recommendations</SectionTitle>
            <div style={{ padding: 20, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 32 }}>
              <p style={{ fontSize: '0.95rem', color: '#1e293b', lineHeight: 1.75 }}>{d.messagingRecommendations}</p>
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
      { key: 'cold', label: 'Cold: Top of Funnel', color: RP, desc: 'Cold interest-based audiences' },
      { key: 'warm', label: 'Warm: Mid Funnel', color: RP, desc: 'Engagement & lookalike audiences' },
      { key: 'hot', label: 'Hot: Bottom Funnel', color: '#dc2626', desc: 'Retargeting & customer lists' },
    ];

    return (
      <>
        {/* ICP Hero */}
        {icp.name && (
          <>
            <SectionTitle sub="Your primary buyer persona (be specific, not assumed)">Ideal Customer Profile (ICP)</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16, marginBottom: 24 }}>
              <div style={{ padding: 16, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                <p style={{ fontSize: '0.825rem', fontWeight: 700, color: RP, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Primary ICP</p>
                <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', marginBottom: 16 }}>{icp.name}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  {[['Age Range', icp.ageRange], ['Income', icp.income], ['Role/Stage', icp.jobOrLifeStage]].map(([k, v]) => v ? (
                    <div key={k as string} style={{ padding: '8px 12px', background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                      <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', marginBottom: 2 }}>{k as string}</p>
                      <p style={{ fontSize: '0.875rem', color: '#1e293b', fontWeight: 600 }}>{v as string}</p>
                    </div>
                  ) : null)}
                </div>
                {icp.painPoints?.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase' }}>Pain Points</p>
                    {icp.painPoints.map((p: string, i: number) => (
                      <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 10px', background: '#fef2f2', borderRadius: 8, marginBottom: 4 }}>
                        <span style={{ color: '#dc2626', fontWeight: 800, fontSize: '0.875rem' }}>✕</span>
                        <p style={{ fontSize: '0.875rem', color: '#1e293b' }}>{p}</p>
                      </div>
                    ))}
                  </div>
                )}
                {icp.triggerEvents?.length > 0 && (
                  <div>
                    <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase' }}>Trigger Events</p>
                    {icp.triggerEvents.map((e: string, i: number) => (
                      <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 10px', background: '#f0fdf4', borderRadius: 8, marginBottom: 4 }}>
                        <span style={{ color: '#16a34a', fontWeight: 800 }}>→</span>
                        <p style={{ fontSize: '0.875rem', color: '#1e293b' }}>{e}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Job to Be Done + Secondary ICP */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(jtbd.functional || jtbd.emotional) && (
                  <div style={{ padding: 20, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, flex: 1 }}>
                    <p style={{ fontSize: '0.825rem', fontWeight: 700, color: RP, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Job To Be Done</p>
                    {[['Functional', jtbd.functional, '#4285F4'], ['Emotional', jtbd.emotional, '#e8457a'], ['Social', jtbd.social, '#8b5cf6']].filter(([, v]) => v).map(([k, v, c]) => (
                      <div key={k as string} style={{ marginBottom: 10 }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: c as string, textTransform: 'uppercase' }}>{k as string}: </span>
                        <span style={{ fontSize: '0.875rem', color: '#1e293b' }}>{v as string}</span>
                      </div>
                    ))}
                  </div>
                )}
                {sec.name && (
                  <div style={{ padding: 18, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                    <p style={{ fontSize: '0.825rem', fontWeight: 700, color: RP, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Secondary ICP</p>
                    <p style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>{sec.name}</p>
                    <p style={{ fontSize: '0.875rem', color: RP }}>{sec.description}</p>
                    {sec.difference && <p style={{ fontSize: '0.825rem', color: '#94a3b8', marginTop: 6, fontStyle: 'italic' }}>vs Primary: {sec.difference}</p>}
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
              {tierConfig.map(({ key, label, color }) => {
                const audiences: any[] = tiers[key] || [];
                if (!audiences.length) return null;
                return (
                  <div key={key} style={{ background: '#fff', border: '1px solid #e2e8f0', borderLeft: `3px solid ${color}`, borderRadius: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '12px 18px', borderBottom: '1px solid #e2e8f0' }}>
                      <p style={{ fontWeight: 800, fontSize: '0.875rem', color }}>{label}</p>
                    </div>
                    <div style={{ padding: 16 }}>
                      {audiences.map((a: any, i: number) => (
                        <div key={i} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: i < audiences.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                          <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b', marginBottom: 2 }}>{a.label || a}</p>
                          {a.rationale && <p style={{ fontSize: '0.825rem', color: RP, marginBottom: 2 }}>{a.rationale}</p>}
                          {a.estimatedReach && <span style={{ fontSize: '0.78rem', fontWeight: 600, color: RP, background: '#f1f5f9', padding: '2px 8px', borderRadius: 4 }}>~{a.estimatedReach}</span>}
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
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ background: '#1877F2', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.875rem' }}>Meta Ads</span>
                    {pm.meta.recommendedBudgetSplit && <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)' }}>{pm.meta.recommendedBudgetSplit}</span>}
                  </div>
                  <div style={{ padding: 16 }}>
                    {pm.meta.coldInterests?.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>Cold Interests</p>
                        <div>{pm.meta.coldInterests.map((i: string, idx: number) => <Tag key={idx} color='#1877F2' bg='#eff6ff'>{i}</Tag>)}</div>
                      </div>
                    )}
                    {pm.meta.warmLookalikes?.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>Warm Lookalikes</p>
                        <div>{pm.meta.warmLookalikes.map((l: string, idx: number) => <Tag key={idx} color='#f59e0b' bg='#fffbeb'>{l}</Tag>)}</div>
                      </div>
                    )}
                    {pm.meta.hotRetargetingWindows?.length > 0 && (
                      <div>
                        <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>Hot Retargeting</p>
                        <div>{pm.meta.hotRetargetingWindows.map((w: string, idx: number) => <Tag key={idx} color='#dc2626' bg='#fef2f2'>{w}</Tag>)}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Google */}
              {pm.google && (
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ background: '#4285F4', padding: '10px 16px' }}>
                    <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.875rem' }}>Google Ads</span>
                  </div>
                  <div style={{ padding: 16 }}>
                    {pm.google.searchIntentKeywords?.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>Search Intent</p>
                        <div>{pm.google.searchIntentKeywords.map((k: string, idx: number) => <Tag key={idx} color='#4285F4' bg='#eff6ff'>{k}</Tag>)}</div>
                      </div>
                    )}
                    {pm.google.inMarketSegments?.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>In-Market</p>
                        <div>{pm.google.inMarketSegments.map((s: string, idx: number) => <Tag key={idx} color='#0f9d58' bg='#f0fdf4'>{s}</Tag>)}</div>
                      </div>
                    )}
                    {pm.google.customerMatchStrategy && (
                      <div>
                        <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Customer Match</p>
                        <p style={{ fontSize: '0.875rem', color: '#1e293b' }}>{pm.google.customerMatchStrategy}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TikTok */}
              {pm.tiktok && (
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ background: '#000', padding: '10px 16px' }}>
                    <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.875rem' }}>TikTok Ads</span>
                  </div>
                  <div style={{ padding: 16 }}>
                    {pm.tiktok.interestCategories?.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>Interests</p>
                        <div>{pm.tiktok.interestCategories.map((c: string, idx: number) => <Tag key={idx} color='#1e293b' bg='#f4f4f4'>{c}</Tag>)}</div>
                      </div>
                    )}
                    {pm.tiktok.behavioralSignals?.length > 0 && (
                      <div>
                        <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>Behavioral</p>
                        <div>{pm.tiktok.behavioralSignals.map((b: string, idx: number) => <Tag key={idx} color='#1e293b' bg='#f4f4f4'>{b}</Tag>)}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* LinkedIn — only if B2B */}
              {pm.linkedin?.applicableIfB2B && (
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ background: '#0077B5', padding: '10px 16px' }}>
                    <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.875rem' }}>LinkedIn Ads</span>
                  </div>
                  <div style={{ padding: 16 }}>
                    {[['Job Titles', pm.linkedin.jobTitles, '#0077B5', '#e0f0fa'], ['Seniority', pm.linkedin.seniority, '#0077B5', '#e0f0fa'], ['Industries', pm.linkedin.industries, '#0077B5', '#e0f0fa']].map(([label, items, c, bg]) => (items as string[])?.length ? (
                      <div key={label as string} style={{ marginBottom: 12 }}>
                        <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>{label as string}</p>
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
            <SectionTitle sub="Ranked by conversion probability, use these as Lookalike seeds">Lookalike Seed Audiences</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
              {seeds.map((s: any, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 16, padding: '14px 18px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: i === 0 ? '#16a34a' : i === 1 ? '#f59e0b' : '#94a3b8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.875rem', flexShrink: 0 }}>
                    #{i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <strong style={{ color: '#1e293b', fontSize: '0.92rem' }}>{s.seed}</strong>
                      {s.platform && <Tag color={RP} bg='var(--bg-surface)'>{s.platform}</Tag>}
                    </div>
                    {s.reason && <p style={{ fontSize: '0.875rem', color: RP }}>{s.reason}</p>}
                    {s.conversionProbability && <p style={{ fontSize: '0.825rem', color: '#16a34a', fontWeight: 600, marginTop: 4 }}>Conv. Probability: {s.conversionProbability}</p>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Exclusion Strategy */}
        {excl.length > 0 && (
          <>
            <SectionTitle sub="Segments to exclude to protect budget from irrelevant audiences">Exclusion Strategy</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12, marginBottom: 32 }}>
              {excl.map((e: any, i: number) => (
                <div key={i} style={{ padding: '14px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ color: '#dc2626', fontWeight: 800 }}>✕</span>
                    <strong style={{ color: '#1e293b', fontSize: '0.875rem' }}>{typeof e === 'string' ? e : e.segment}</strong>
                  </div>
                  {e.reason && <p style={{ fontSize: '0.825rem', color: RP, marginBottom: 4 }}>{e.reason}</p>}
                  {e.estimatedWasteSaved && <p style={{ fontSize: '0.825rem', color: '#16a34a', fontWeight: 600 }}>Saves: {e.estimatedWasteSaved}</p>}
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
            <SectionTitle sub="Same product, same ICP, your direct ad competitors">Tier 1: Direct Competitors</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16, marginBottom: 32 }}>
              {t1.map((c: any, i: number) => {
                const spendColor: Record<string, string> = { low: '#16a34a', medium: '#f59e0b', high: '#dc2626', heavy: '#7B2FBE' };
                const sc = spendColor[(c.adSpendTier || '').toLowerCase()] || '#64748b';
                return (
                  <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', boxShadow: 'none' }}>
                    <div style={{ background: '#f8fafc', padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <strong style={{ color: '#1e293b', fontSize: '1rem' }}>{c.name}</strong>
                      <span style={{ background: sc, color: '#fff', fontSize: '0.78rem', fontWeight: 700, padding: '3px 8px', borderRadius: 4 }}>{c.adSpendTier} Spend</span>
                    </div>
                    <div style={{ padding: 18 }}>
                      {c.estimatedMonthlySpend && <p style={{ fontSize: '0.825rem', color: sc, fontWeight: 700, marginBottom: 8 }}>Est. {c.estimatedMonthlySpend}/mo</p>}
                      {c.url && <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: 8 }}>{c.url}</p>}
                      <div style={{ marginBottom: 10 }}>
                        {(c.activePlatforms || c.platforms || []).map((p: string) => <Tag key={p} color='#1877F2' bg='#eff6ff'>{p}</Tag>)}
                      </div>
                      {(c.heroOffer || c.offer) && <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: 6 }}><strong style={{ color: '#1e293b' }}>Offer: </strong>{c.heroOffer || c.offer}</p>}
                      {(c.messagingAngle || c.creativeApproach) && <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: 6 }}><strong style={{ color: '#1e293b' }}>Angle: </strong>{c.messagingAngle || c.creativeApproach}</p>}
                      {c.weakness && (
                        <div style={{ marginTop: 10, padding: '8px 12px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #a7f3d0' }}>
                          <p style={{ fontSize: '0.825rem', fontWeight: 700, color: '#16a34a', marginBottom: 2 }}>Their Weakness →</p>
                          <p style={{ fontSize: '0.825rem', color: '#1e293b' }}>{c.weakness}</p>
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
            <SectionTitle sub="Different product, same problem, alternative solutions your ICP might choose">Tier 2: Indirect Competitors</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12, marginBottom: 32 }}>
              {t2.map((c: any, i: number) => (
                <div key={i} style={{ padding: '16px 18px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <strong style={{ color: '#1e293b', display: 'block', marginBottom: 6 }}>{c.name}</strong>
                  <p style={{ fontSize: '0.875rem', color: RP, marginBottom: 6 }}>{c.alternativeOffer || c.offer}</p>
                  {c.whyCustomersChooseThem && <p style={{ fontSize: '0.825rem', color: '#94a3b8', fontStyle: 'italic', marginBottom: 6 }}>Why chosen: {c.whyCustomersChooseThem}</p>}
                  {c.howToCounterPosition && (
                    <div style={{ padding: '6px 10px', background: 'var(--bg-soft)', borderRadius: 8, marginTop: 8 }}>
                      <p style={{ fontSize: '0.825rem', color: RP }}>Counter: {c.howToCounterPosition}</p>
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
                <div key={i} style={{ padding: '14px 18px', background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: 8, flex: '1 1 240px' }}>
                  <strong style={{ color: RP, display: 'block', marginBottom: 4 }}>{c.name}</strong>
                  {c.reasonToStudy && <p style={{ fontSize: '0.875rem', color: RP, marginBottom: 6 }}>{c.reasonToStudy}</p>}
                  {(c.tacticToBorrow || c.whyAspirate) && <p style={{ fontSize: '0.825rem', color: '#1e293b', fontWeight: 600 }}>Steal: {c.tacticToBorrow || c.whyAspirate}</p>}
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
                <div style={{ padding: 18, background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '0.825rem', fontWeight: 700, color: RP, textTransform: 'uppercase', marginBottom: 10 }}>Dominant Platforms</p>
                  {intel.dominantPlatforms.map((p: string, i: number) => <Tag key={i} color='#1877F2' bg='#eff6ff'>{p}</Tag>)}
                </div>
              )}
              {intel.saturatedAngles?.length > 0 && (
                <div style={{ padding: 18, background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca' }}>
                  <p style={{ fontSize: '0.825rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', marginBottom: 10 }}>Saturated Angles</p>
                  {intel.saturatedAngles.map((a: string, i: number) => <Tag key={i} color='#dc2626' bg='#fee2e2'>{a}</Tag>)}
                </div>
              )}
              {intel.underusedAngles?.length > 0 && (
                <div style={{ padding: 18, background: '#f0fdf4', borderRadius: 8, border: '1px solid #a7f3d0' }}>
                  <p style={{ fontSize: '0.825rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', marginBottom: 10 }}>Underused Angles (Opportunities)</p>
                  {intel.underusedAngles.map((a: string, i: number) => <Tag key={i} color='#16a34a' bg='#dcfce7'>{a}</Tag>)}
                </div>
              )}
              {(intel.industryCPMRange || intel.industryCPARange) && (
                <div style={{ padding: 18, background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '0.825rem', fontWeight: 700, color: RP, textTransform: 'uppercase', marginBottom: 10 }}>Industry Benchmarks</p>
                  {intel.industryCPMRange && <p style={{ fontSize: '0.875rem', color: '#1e293b', marginBottom: 4 }}>CPM: {intel.industryCPMRange}</p>}
                  {intel.industryCPARange && <p style={{ fontSize: '0.875rem', color: '#1e293b', marginBottom: 4 }}>CPA: {intel.industryCPARange}</p>}
                  {intel.averageROASBenchmark && <p style={{ fontSize: '0.875rem', color: '#1e293b' }}>ROAS: {intel.averageROASBenchmark}</p>}
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
                { label: 'Platform Gaps', items: gaps.platformGaps, color: RP, bg: '#eff6ff' },
                { label: 'Offer Gaps', items: gaps.offerGaps, color: RP },
                { label: 'Audience Gaps', items: gaps.audienceGaps, color: RP },
                { label: 'Creative Gaps', items: gaps.creativeGaps, color: RP },
                { label: 'Messaging Gaps', items: gaps.messagingGaps, color: RP },
              ].map(({ label, items, color }) => {
                const normalizedItems = Array.isArray(items) ? items.map((item: any) => typeof item === 'string' ? item : `${item.platform || ''}: ${item.opportunity || ''}`) : [];
                return normalizedItems.length ? (
                  <div key={label} style={{ padding: 18, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', borderLeft: `3px solid ${color}` }}>
                    <p style={{ fontSize: '0.825rem', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>{label}</p>
                    <ul style={{ paddingLeft: 16 }}>
                      {normalizedItems.map((item: string, i: number) => (
                        <li key={i} style={{ fontSize: '0.875rem', color: '#1e293b', lineHeight: 1.6, marginBottom: 4 }}>{item}</li>
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
                  <div style={{ padding: 18, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <p style={{ fontSize: '0.825rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>Current Positioning</p>
                    <p style={{ fontSize: '0.875rem', color: '#1e293b', lineHeight: 1.6 }}>{playbook.currentPositioning}</p>
                  </div>
                )}
                {playbook.recommendedPositioning && (
                  <div style={{ padding: 18, background: 'var(--bg-soft)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <p style={{ fontSize: '0.825rem', fontWeight: 700, color: RP, textTransform: 'uppercase', marginBottom: 8 }}>Recommended Positioning</p>
                    <p style={{ fontSize: '0.875rem', color: '#1e293b', lineHeight: 1.6 }}>{playbook.recommendedPositioning}</p>
                  </div>
                )}
              </div>
            )}
            {posRec && !playbook.recommendedPositioning && (
              <div style={{ padding: 16, background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 20 }}>
                <p style={{ fontSize: '1rem', color: '#1e293b', lineHeight: 1.7 }}>{posRec}</p>
              </div>
            )}
            {playbook.messagingAnglesToOwn?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: '0.825rem', fontWeight: 700, color: RP, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Messaging Angles to Own</p>
                {playbook.messagingAnglesToOwn.map((a: string, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 14px', background: 'var(--bg-soft)', borderRadius: 10, marginBottom: 6, border: '1px solid var(--border)' }}>
                    <span style={{ color: RP, fontWeight: 700 }}>→</span>
                    <p style={{ fontSize: '0.875rem', color: '#1e293b' }}>{a}</p>
                  </div>
                ))}
              </div>
            )}
            {playbook.blueOceanOpportunity && (
              <div style={{ padding: 20, background: '#f0fdf4', borderRadius: 8, border: '1px solid #a7f3d0', marginBottom: 32 }}>
                <p style={{ fontSize: '0.825rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', marginBottom: 8 }}>Blue Ocean Opportunity</p>
                <p style={{ fontSize: '0.95rem', color: '#1e293b', lineHeight: 1.65 }}>{playbook.blueOceanOpportunity}</p>
              </div>
            )}
            {playbook.taglineOptions?.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <p style={{ fontSize: '0.825rem', fontWeight: 700, color: RP, textTransform: 'uppercase', marginBottom: 10 }}>Tagline Options</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {playbook.taglineOptions.map((t: string, i: number) => (
                    <div key={i} style={{ padding: '8px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', fontStyle: 'italic' }}>
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
      { key: 'tofu', label: 'Tofu: Top of Funnel', sublabel: 'Awareness & Discovery', color: RP, bg: '#eff6ff', border: '#bfdbfe' },
      { key: 'mofu', label: 'Mofu: Middle of Funnel', sublabel: 'Consideration & Nurture', color: RP, bg: '#fffbeb', border: '#fde68a' },
      { key: 'bofu', label: 'Bofu: Bottom of Funnel', sublabel: 'Conversion & Close', color: '#16a34a', bg: '#f0fdf4', border: '#a7f3d0' },
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
              <div key={label} style={{ padding: 20, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: c, marginBottom: 4 }}>{score}</div>
                <p style={{ fontWeight: 600, color: '#1e293b', marginBottom: 2, fontSize: '0.875rem' }}>{label}</p>
                <p style={{ fontSize: '0.825rem', color: '#94a3b8' }}>{sub}</p>
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
                  <div key={key} style={{ padding: '14px 16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: scoreColor(s), marginBottom: 4 }}>{s}</div>
                    <div style={{ width: '100%', height: 4, background: '#e2e8f0', borderRadius: 2, marginBottom: 8 }}>
                      <div style={{ width: `${s}%`, height: '100%', background: scoreColor(s), borderRadius: 2 }} />
                    </div>
                    <p style={{ fontSize: '0.78rem', fontWeight: 600, color: RP }}>{lpLabels[key] || key}</p>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Funnel Map — 3 stages */}
        {(fm.tofu || fm.mofu || fm.bofu) && (
          <>
            <SectionTitle sub="Current funnel state (green = present, yellow = partial, red = missing)">Funnel Architecture Map</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16, marginBottom: 32 }}>
              {stageConfig.map(({ key, label, sublabel, color, bg, border }) => {
                const stage: any = fm[key];
                if (!stage) return null;
                const sb = statusBadge(stage.status);
                return (
                  <div key={key} style={{ background: '#fff', border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ background: bg, padding: '12px 18px', borderBottom: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontWeight: 800, fontSize: '0.875rem', color }}>{label}</p>
                        <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{sublabel}</p>
                      </div>
                      <span style={{ background: sb.bg, color: sb.text, fontSize: '0.78rem', fontWeight: 700, padding: '3px 10px', borderRadius: 8 }}>{stage.status}</span>
                    </div>
                    <div style={{ padding: 16 }}>
                      {stage.currentState && <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: 12 }}>{stage.currentState}</p>}
                      {(stage.recommendedAdType || stage.recommendedOffer) && (
                        <div style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 6, marginBottom: 10, borderLeft: `3px solid ${RP}` }}>
                          <p style={{ fontSize: '0.78rem', fontWeight: 700, color: RP, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Recommended</p>
                          <p style={{ fontSize: '0.875rem', color: '#1e293b' }}>{stage.recommendedAdType || stage.recommendedOffer}</p>
                        </div>
                      )}
                      {stage.retargetingWindow && <p style={{ fontSize: '0.825rem', color: RP, marginBottom: 6 }}>Retargeting Window: {stage.retargetingWindow}</p>}
                      {stage.stepsToConvert !== undefined && <p style={{ fontSize: '0.825rem', color: RP, marginBottom: 6 }}>Steps to convert: <strong>{stage.stepsToConvert}</strong></p>}
                      {stage.gaps?.length > 0 && (
                        <div>
                          <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', marginBottom: 6 }}>Gaps</p>
                          {stage.gaps.map((g: string, i: number) => (
                            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                              <span style={{ color: '#dc2626', fontSize: '0.825rem' }}>✕</span>
                              <p style={{ fontSize: '0.825rem', color: RP }}>{g}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {stage.recommendedContent?.length > 0 && (
                        <div style={{ marginTop: 8 }}>
                          <p style={{ fontSize: '0.78rem', fontWeight: 700, color: RP, textTransform: 'uppercase', marginBottom: 6 }}>Content Ideas</p>
                          {stage.recommendedContent.map((c: string, i: number) => <Tag key={i} color='#475569' bg='#f1f5f9'>{c}</Tag>)}
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, marginBottom: 6, padding: '8px 14px', background: '#f8fafc', borderRadius: '10px 10px 0 0', border: '1px solid #e2e8f0' }}>
                {['Audience Type', 'Ad Objective', 'Creative Direction', 'Pixel Event'].map(h => (
                  <p key={h} style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>{h}</p>
                ))}
              </div>
              {routing.map((row: any, i: number) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, padding: '12px 14px', background: i % 2 === 0 ? '#fff' : '#fafafe', border: '1px solid #e2e8f0', borderTop: 'none' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>{row.audienceType}</p>
                  <p style={{ fontSize: '0.875rem', color: RP }}>{row.adObjective}</p>
                  <p style={{ fontSize: '0.875rem', color: '#475569' }}>{row.creative}</p>
                  <p style={{ fontSize: '0.875rem', color: '#16a34a' }}>{row.pixelEvent}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Build Sequence */}
        {buildSeq.length > 0 && (
          <>
            <SectionTitle sub="Prioritised by revenue impact, build in this order">Funnel Build Sequence</SectionTitle>
            <div style={{ marginBottom: 32 }}>
              {buildSeq.map((step: any, i: number) => {
                const effortColor = { Low: '#16a34a', Medium: '#d97706', High: '#dc2626' }[(step.effort || 'Medium') as string] || '#64748b';
                return (
                  <div key={i} style={{ display: 'flex', gap: 16, padding: '14px 18px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: RP, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.875rem', flexShrink: 0 }}>
                      {step.step || i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <p style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.875rem' }}>{step.action}</p>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: effortColor, background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, border: `1px solid #e2e8f0` }}>{step.effort} Effort</span>
                      </div>
                      {step.impact && <p style={{ fontSize: '0.825rem', color: RP }}>Impact: {step.impact}</p>}
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
                <div key={i} style={{ padding: '14px 18px', background: '#fff', border: '1px solid #e2e8f0', borderLeft: '3px solid #dc2626', borderRadius: 0, marginBottom: 8 }}>
                  <p style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4, fontSize: '0.875rem' }}>{typeof b === 'string' ? b : b.blocker}</p>
                  {b.impact && <p style={{ fontSize: '0.825rem', color: RP, marginBottom: 4 }}>Impact: {b.impact}</p>}
                  {b.fix && (
                    <div style={{ padding: '6px 10px', background: '#fff', borderRadius: 8, marginTop: 6 }}>
                      <p style={{ fontSize: '0.825rem', color: '#1e293b' }}>Fix: {b.fix}</p>
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
                  <p style={{ fontSize: '0.825rem', fontWeight: 700, color: RP, textTransform: 'uppercase', marginBottom: 10 }}>Headline Rewrites</p>
                  {d.headlineRewrites.map((h: string, i: number) => (
                    <div key={i} style={{ padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, marginBottom: 6, fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>"{h}"</div>
                  ))}
                </div>
              )}
              {d.ctaRewrites?.length > 0 && (
                <div>
                  <p style={{ fontSize: '0.825rem', fontWeight: 700, color: RP, textTransform: 'uppercase', marginBottom: 10 }}>CTA Rewrites</p>
                  {d.ctaRewrites.map((c: string, i: number) => (
                    <div key={i} style={{ padding: '12px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, marginBottom: 6, fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>→ {c}</div>
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
      { key: 'tofu', label: 'TOFU', color: RP },
      { key: 'mofu', label: 'MOFU', color: RP },
      { key: 'bofu', label: 'BOFU', color: '#16a34a' },
      { key: 'testing', label: 'Testing', color: RP },
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
                  <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f0eef6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: RP, fontSize: '0.875rem', flexShrink: 0 }}>
                        #{i + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                          <strong style={{ color: '#1e293b', fontSize: '0.95rem' }}>{p.platform}</strong>
                          <span style={{ background: rb, color: rc, fontSize: '0.78rem', fontWeight: 700, padding: '2px 8px', borderRadius: 8 }}>{p.recommendation}</span>
                          <span style={{ marginLeft: 'auto', fontWeight: 800, color: p.fitScore >= 70 ? '#16a34a' : p.fitScore >= 45 ? '#d97706' : '#dc2626', fontSize: '1rem' }}>
                            {p.fitScore}/100
                          </span>
                        </div>
                        <p style={{ fontSize: '0.825rem', color: RP }}>{p.reason}</p>
                      </div>
                    </div>
                    {/* Fit bar */}
                    <div style={{ height: 4, background: '#f0eef6' }}>
                      <div style={{ width: `${p.fitScore}%`, height: '100%', background: p.fitScore >= 70 ? '#16a34a' : p.fitScore >= 45 ? '#f59e0b' : '#dc2626' }} />
                    </div>
                    {/* Budget row */}
                    {(p.allocation || p.allocationDollars) && (
                      <div style={{ padding: '8px 18px 12px', display: 'flex', gap: 20, alignItems: 'center' }}>
                        {p.allocationDollars && <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b' }}>{p.allocationDollars}/mo</span>}
                        {p.allocation && <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>({p.allocation})</span>}
                        {p.primaryKPI && <span style={{ fontSize: '0.825rem', color: RP, marginLeft: 'auto' }}>KPI: {p.primaryKPI}</span>}
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
                  <div key={key} style={{ padding: 18, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, textAlign: 'center' }}>
                    <p style={{ fontSize: '0.825rem', fontWeight: 700, color, textTransform: 'uppercase', marginBottom: 8 }}>{label}</p>
                    {stage.dollars && <p style={{ fontSize: '1.3rem', fontWeight: 900, color: '#1e293b', marginBottom: 2 }}>{stage.dollars}</p>}
                    {stage.percentage && <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: 8 }}>{stage.percentage}</p>}
                    {stage.purpose && <p style={{ fontSize: '0.825rem', color: RP, lineHeight: 1.5 }}>{stage.purpose}</p>}
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
                <div key={label as string} style={{ padding: 18, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <p style={{ fontSize: '0.825rem', fontWeight: 700, color: c as string, textTransform: 'uppercase', marginBottom: 8 }}>{label as string}</p>
                  <p style={{ fontSize: '0.875rem', color: '#1e293b', lineHeight: 1.6 }}>{val as string}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* KPI Benchmarks */}
        {(kpi.meta || kpi.googleSearch) && (
          <>
            <SectionTitle sub="Industry benchmarks, these are your green/yellow/red targets">KPI Benchmarks</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16, marginBottom: 32 }}>
              {[
                { key: 'meta', label: 'Meta Ads', color: RP, fields: ['cpm', 'cpc', 'ctr', 'cpa', 'roas'] },
                { key: 'googleSearch', label: 'Google Search', color: RP, fields: ['cpc', 'ctr', 'conversionRate', 'cpa'] },
                { key: 'tiktok', label: 'TikTok', color: '#000', fields: ['cpm', 'cpc', 'ctr', 'cpa'] },
                { key: 'linkedin', label: 'LinkedIn', color: RP, fields: ['cpl', 'ctr'] },
              ].map(({ key, label, color, fields }) => {
                const bench = kpi[key];
                if (!bench) return null;
                return (
                  <div key={key} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ background: color, padding: '10px 16px' }}>
                      <p style={{ color: '#fff', fontWeight: 700, fontSize: '0.875rem' }}>{label}</p>
                    </div>
                    <div style={{ padding: 16 }}>
                      {fields.filter(f => bench[f]).map(f => (
                        <div key={f} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0eef6' }}>
                          <p style={{ fontSize: '0.825rem', color: RP, textTransform: 'uppercase', fontWeight: 600 }}>{f.toUpperCase()}</p>
                          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b' }}>{bench[f]}</p>
                        </div>
                      ))}
                      {bench.greenThreshold && (
                        <div style={{ marginTop: 10, padding: '8px 10px', background: '#f0fdf4', borderRadius: 8 }}>
                          <p style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 600 }}>✓ Scale when: {bench.greenThreshold}</p>
                        </div>
                      )}
                      {bench.redThreshold && (
                        <div style={{ marginTop: 6, padding: '8px 10px', background: '#fef2f2', borderRadius: 8 }}>
                          <p style={{ fontSize: '0.78rem', color: '#dc2626', fontWeight: 600 }}>✕ Pause if: {bench.redThreshold}</p>
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
                <div key={i} style={{ display: 'flex', gap: 16, padding: '14px 18px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 8 }}>
                  <div style={{ flexShrink: 0, minWidth: 80 }}>
                    <p style={{ fontWeight: 700, color: RP, fontSize: '0.875rem' }}>{b.platform}</p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      {b.startingBid && <Tag color='#4285F4' bg='#eff6ff'>Start: {b.startingBid}</Tag>}
                      {b.graduateTo && <Tag color='#16a34a' bg='#f0fdf4'>→ {b.graduateTo}</Tag>}
                    </div>
                    {b.rationale && <p style={{ fontSize: '0.825rem', color: RP }}>{b.rationale}</p>}
                  </div>
                  {b.pacing && <p style={{ fontSize: '0.825rem', color: '#94a3b8', flexShrink: 0 }}>{b.pacing}</p>}
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
                <div style={{ padding: 18, background: '#f0fdf4', borderRadius: 8, border: '1px solid #a7f3d0' }}>
                  <p style={{ fontSize: '0.825rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', marginBottom: 10 }}>Scale When →</p>
                  {scaling.scaleSignals.map((s: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                      <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
                      <p style={{ fontSize: '0.875rem', color: '#1e293b' }}>{s}</p>
                    </div>
                  ))}
                </div>
              )}
              {scaling.pauseSignals?.length > 0 && (
                <div style={{ padding: 18, background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca' }}>
                  <p style={{ fontSize: '0.825rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', marginBottom: 10 }}>Pause If →</p>
                  {scaling.pauseSignals.map((s: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                      <span style={{ color: '#dc2626', fontWeight: 700 }}>✕</span>
                      <p style={{ fontSize: '0.875rem', color: '#1e293b' }}>{s}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {scaling.milestones?.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                {scaling.milestones.map((m: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 16, padding: '12px 16px', background: i % 2 === 0 ? '#fafafe' : '#fff', border: '1px solid #e2e8f0', borderRadius: 10, marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, color: RP, minWidth: 70 }}>{m.period}</span>
                    <p style={{ fontSize: '0.875rem', color: '#475569', flex: 1 }}>Target: {m.target}</p>
                    <p style={{ fontSize: '0.875rem', color: '#16a34a', fontWeight: 600, flexShrink: 0 }}>{m.budgetAction}</p>
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
                <div key={k as string} style={{ padding: 16, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, textAlign: 'center' }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: c as string, textTransform: 'uppercase', marginBottom: 6 }}>{k as string}</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>{v as string}</p>
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
                <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 12, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', borderBottom: '1px solid #f0eef6' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#4285F4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <strong style={{ color: '#1e293b', fontSize: '0.95rem' }}>{c.campaignName}</strong>
                      <p style={{ fontSize: '0.825rem', color: '#94a3b8', marginTop: 2 }}>
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
                        <div key={j} style={{ padding: '6px 12px', background: '#f0f7ff', borderRadius: 8, fontSize: '0.825rem', color: '#1d4ed8', fontWeight: 600 }}>
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
            <SectionTitle sub="Organized by search intent, ready for Google Ads Keyword Planner">Keyword Strategy</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16, marginBottom: 32 }}>
              {kw.map((b: any, i: number) => {
                const c = intentColor[b.category] || '#64748b';
                return (
                  <div key={i} style={{ padding: 18, background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <p style={{ fontSize: '0.825rem', fontWeight: 700, color: RP, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{b.category}</p>
                      {b.matchTypes && <Tag color='#475569' bg='#f1f5f9'>{b.matchTypes}</Tag>}
                    </div>
                    {b.intent && <p style={{ fontSize: '0.825rem', color: RP, marginBottom: 10 }}>{b.intent}</p>}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {(b.keywords || []).map((k: string, j: number) => (
                        <div key={j} style={{ padding: '4px 10px', background: '#f1f5f9', borderRadius: 4, fontSize: '0.825rem', color: '#1e293b', fontWeight: 500, border: '1px solid #e2e8f0' }}>{k}</div>
                      ))}
                    </div>
                    {b.bidModifier && <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 10 }}>Bid modifier: {b.bidModifier}</p>}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* RSA Copy Bank */}
        {(rsa.headlines?.length > 0 || rsa.descriptions?.length > 0) && (
          <>
            <SectionTitle sub="Responsive Search Ad assets, paste directly into Google Ads">RSA Copy Bank</SectionTitle>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, marginBottom: 32 }}>
              {rsa.pinnedHeadline1 && (
                <div style={{ padding: '10px 14px', background: '#f0f7ff', borderRadius: 10, marginBottom: 16, display: 'flex', gap: 10 }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: RP }}>PIN H1</span>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>{rsa.pinnedHeadline1}</p>
                </div>
              )}
              {rsa.headlines?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: RP, textTransform: 'uppercase', marginBottom: 10 }}>Headlines (max 30 chars each)</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {rsa.headlines.map((h: string, i: number) => (
                      <div key={i} style={{ background: '#f8faff', border: '1px solid #e0eaff', borderRadius: 8, padding: '6px 12px', fontSize: '0.875rem', color: '#1e293b' }}>{h}</div>
                    ))}
                  </div>
                </div>
              )}
              {rsa.descriptions?.length > 0 && (
                <div>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: RP, textTransform: 'uppercase', marginBottom: 10 }}>Descriptions (max 90 chars each)</p>
                  {rsa.descriptions.map((desc: string, i: number) => (
                    <p key={i} style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6, marginBottom: 6, padding: '8px 12px', background: '#f8fafc', borderRadius: 8 }}>{desc}</p>
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
            <div style={{ padding: 20, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 32 }}>
              {shopping.structure && <p style={{ fontSize: '0.875rem', color: '#1e293b', marginBottom: 14 }}>{shopping.structure}</p>}
              {shopping.feedOptimizationTips?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: '0.825rem', fontWeight: 700, color: '#0f9d58', textTransform: 'uppercase', marginBottom: 8 }}>Feed Optimisation Tips</p>
                  {shopping.feedOptimizationTips.map((tip: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 10px', marginBottom: 4, background: '#f0fdf4', borderRadius: 8 }}>
                      <span style={{ color: '#0f9d58', fontWeight: 700 }}>→</span>
                      <p style={{ fontSize: '0.875rem', color: '#1e293b' }}>{tip}</p>
                    </div>
                  ))}
                </div>
              )}
              {shopping.targetROAS && <p style={{ fontSize: '0.875rem', color: '#1e293b', marginTop: 8 }}>Target ROAS: <strong>{shopping.targetROAS}</strong></p>}
            </div>
          </>
        )}

        {/* Display Remarketing */}
        {(display.audienceSegments?.length > 0 || display.remarketing30Day) && (
          <>
            <SectionTitle sub="Display and remarketing campaign setup">Display & Remarketing</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16, marginBottom: 32 }}>
              {display.audienceSegments?.map((seg: any, i: number) => (
                <div key={i} style={{ padding: 16, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <p style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4, fontSize: '0.875rem' }}>{seg.segment}</p>
                  {seg.adAngle && <p style={{ fontSize: '0.875rem', color: RP, marginBottom: 6 }}>{seg.adAngle}</p>}
                  {seg.frequencyCap && <Tag color='#f4b400' bg='#fffbeb'>Cap: {seg.frequencyCap}</Tag>}
                </div>
              ))}
              {(display.remarketing30Day || display.remarketing7Day) && (
                <div style={{ padding: 16, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8 }}>
                  <p style={{ fontWeight: 700, color: '#d97706', marginBottom: 10 }}>Remarketing Windows</p>
                  {display.remarketing30Day && <p style={{ fontSize: '0.875rem', color: '#1e293b', marginBottom: 6 }}>30-day: {display.remarketing30Day}</p>}
                  {display.remarketing7Day && <p style={{ fontSize: '0.875rem', color: '#1e293b' }}>7-day: {display.remarketing7Day}</p>}
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
            <div style={{ padding: 20, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 32 }}>
              {pmax.assetGroups?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: '0.825rem', fontWeight: 700, color: '#db4437', textTransform: 'uppercase', marginBottom: 8 }}>Asset Groups</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {pmax.assetGroups.map((ag: string, i: number) => <Tag key={i} color='#db4437' bg='#fef2f2'>{ag}</Tag>)}
                  </div>
                </div>
              )}
              {pmax.headlines?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: '0.825rem', fontWeight: 700, color: RP, textTransform: 'uppercase', marginBottom: 8 }}>PMax Headlines</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {pmax.headlines.map((h: string, i: number) => <div key={i} style={{ padding: '4px 10px', background: '#f0eef6', borderRadius: 8, fontSize: '0.825rem', color: '#1e293b' }}>{h}</div>)}
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
                <p style={{ fontSize: '0.875rem', fontWeight: 700, color: RP, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </p>
                {Array.isArray(val) ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {val.map((item, i) => (
                      <div key={i} style={{ padding: '8px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: '0.875rem', color: '#1e293b' }}>
                        {typeof item === 'string' ? item : JSON.stringify(item)}
                      </div>
                    ))}
                  </div>
                ) : typeof val === 'object' ? (
                  <div style={{ padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', fontFamily: 'monospace', fontSize: '0.875rem', whiteSpace: 'pre-wrap', color: '#475569' }}>
                    {JSON.stringify(val, null, 2)}
                  </div>
                ) : (
                  <p style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: '0.875rem', color: '#1e293b', lineHeight: 1.65 }}>{String(val)}</p>
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
  'ZieAds mirrors what senior media buyers do, just in under 60 seconds.',
  'Score above 75? You\'re in the top 20% of ad setups we\'ve analyzed.',
  'The best copy isn\'t clever, it\'s the most specific about one problem.',
];

// ─── Progress step card ───────────────────────────────────────────
function ProgressCard({ label, desc, progress }: { label: string; desc: string; progress: number; color: string }) {
  const done = progress >= 100;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 18, marginBottom: 18, borderBottom: '1px solid #f1f5f9' }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: done ? '#1e293b' : '#f8fafc',
        border: `1.5px solid ${done ? '#1e293b' : '#e2e8f0'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, transition: 'all 0.3s',
      }}>
        {done
          ? <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" width="13" height="13"><path d="M5 13l4 4L19 7"/></svg>
          : <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#cbd5e1' }} />
        }
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: done ? '#1e293b' : '#64748b' }}>{label}</span>
          <span style={{ fontSize: '0.825rem', color: done ? '#16a34a' : '#94a3b8', fontWeight: 600 }}>
            {done ? 'Done' : `${Math.round(progress)}%`}
          </span>
        </div>
        <div style={{ height: 3, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: done ? '#16a34a' : '#1e293b', borderRadius: 3, transition: 'width 0.4s ease' }} />
        </div>
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
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const startedRef = useRef(false);

  const url = searchParams.get('url') || '';
  const businessName = searchParams.get('businessName') || '';

  const meta = SKILL_META[skillName] || { title: skillName, icon: <Bot size={40} />, platform: 'AI Analysis', color: RP };

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
      <div style={{ minHeight: '100vh', background: '#fafafa', display: 'flex', flexDirection: 'column', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ background: '#fff', borderBottom: `1px solid ${RB}`, padding: '0 24px', height: 52, display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ZieAdsLogo size={28} />
            <span style={{ fontSize: '1rem', fontWeight: 800, color: RD }}>{agencyName}</span>
          </div>
        </div>

        <div style={{ flex: 1, maxWidth: 480, margin: '0 auto', padding: '60px 24px 60px', width: '100%' }}>
          <div style={{ marginBottom: 40 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: `${meta.color}15`, color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <NounIcon name={skillName} size={24} color={meta.color} />
            </div>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
              Analyzing {businessName || url}
            </p>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.02em', margin: '0 0 6px' }}>
              {meta.title}
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>This usually takes 30–60 seconds</p>
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#475569' }}>Progress</span>
              <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#1e293b' }}>{Math.round(progress)}%</span>
            </div>
            <div style={{ height: 4, background: '#f1f5f9', borderRadius: 4 }}>
              <div style={{ height: '100%', width: `${progress}%`, background: '#1e293b', borderRadius: 4, transition: 'width 0.4s ease' }} />
            </div>
          </div>

          {/* Steps */}
          {steps.map((s, i) => (
            <ProgressCard key={i} label={s.label} desc={s.desc} progress={s.pct} color={meta.color} />
          ))}

          {/* Tip */}
          <div style={{ marginTop: 36, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <Lightbulb size={16} style={{ color: '#94a3b8', flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: '0.825rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>{TIPS[currentTip]}</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Error view ────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div style={{ minHeight: '100vh', background: '#fafafa', display: 'flex', flexDirection: 'column', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ background: '#fff', borderBottom: `1px solid ${RB}`, padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ZieAdsLogo size={28} />
            <span style={{ fontSize: '1rem', fontWeight: 800, color: RD }}>{agencyName}</span>
          </div>
          <button onClick={() => navigate('/clients')} style={{ background: 'none', border: 'none', fontSize: '0.875rem', fontWeight: 500, color: RG, cursor: 'pointer' }}>
            ← Dashboard
          </button>
        </div>
        <div style={{ maxWidth: 440, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, color: '#dc2626' }}>
            <AlertTriangle size={40} />
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>Analysis Failed</h2>
          <p style={{ color: RP, marginBottom: 28, lineHeight: 1.6, fontSize: '0.875rem' }}>{error}</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button onClick={() => navigate('/clients')} style={{ padding: '9px 18px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, color: RP, fontSize: '0.875rem' }}>
              Back to Dashboard
            </button>
            <button onClick={() => { setStatus('loading'); startedRef.current = false; }} style={{ padding: '9px 18px', borderRadius: 6, background: '#1e293b', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Result view ───────────────────────────────────────────────────
  const scoreColor = score >= 70 ? '#16a34a' : score >= 50 ? '#d97706' : '#dc2626';

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', fontFamily: "'DM Sans', sans-serif", display: 'flex', flexDirection: 'column' }}>

      {/* Top bar */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${RB}`, padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <ZieAdsLogo size={28} />
            <span style={{ fontSize: '1rem', fontWeight: 800, color: RD }}>{agencyName}</span>
          </div>
          <span style={{ color: RB }}>|</span>
          <button onClick={() => navigate('/clients')} style={{ background: 'none', border: 'none', fontSize: '0.875rem', fontWeight: 500, color: RG, cursor: 'pointer', padding: 0 }}>
            ← Dashboard
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowBrandingModal(true)} style={{ background: '#fff', border: `1px solid ${RB}`, borderRadius: 6, padding: '6px 12px', fontSize: '0.825rem', fontWeight: 600, color: RG, cursor: 'pointer' }}>
            White-Label
          </button>
          <button
            disabled={downloadingPDF}
            onClick={async () => {
              if (!result) return;
              setDownloadingPDF(true);
              try {
                await generateSkillPDF(meta.title, skillName, businessName, url, result, { isAgency: agencyName !== 'ZieAds', agencyName });
              } finally { setDownloadingPDF(false); }
            }}
            style={{ background: RD, border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: '0.825rem', fontWeight: 600, color: '#fff', cursor: downloadingPDF ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: downloadingPDF ? 0.6 : 1 }}
          >
            <Download size={13} />
            {downloadingPDF ? 'Generating…' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* Body: sidebar + main */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Sidebar */}
        <aside style={{ width: 220, background: '#fff', borderRight: `1px solid ${RB}`, flexShrink: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ padding: '20px 20px 16px' }}>
            {/* Report title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${meta.color}15`, color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <NounIcon name={skillName} size={20} color={meta.color} />
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: RG, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {meta.platform}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: RD, lineHeight: 1.3 }}>
                  {meta.title}
                </div>
              </div>
            </div>

            {/* Score widget */}
            {score > 0 && (
              <div style={{ background: '#f8fafc', border: `1px solid ${RB}`, borderRadius: 8, padding: 14, marginBottom: 20 }}>
                <div style={{ fontSize: '0.78rem', color: RG, marginBottom: 6, fontWeight: 500 }}>Overall score</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginBottom: 8 }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 800, color: RD, lineHeight: 1 }}>{score}</span>
                  <span style={{ fontSize: '0.825rem', color: RG }}>/100</span>
                </div>
                <div style={{ width: '100%', height: 4, background: RB, borderRadius: 2 }}>
                  <div style={{ width: `${score}%`, height: '100%', background: scoreColor, borderRadius: 2, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            )}

            {/* Meta */}
            <div style={{ fontSize: '0.78rem', color: RG, marginBottom: 4 }}>
              <span style={{ fontWeight: 600 }}>Site: </span>{businessName || url || '—'}
            </div>
            <div style={{ fontSize: '0.78rem', color: RG, marginBottom: 20 }}>
              <span style={{ fontWeight: 600 }}>Date: </span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>

            {/* Divider */}
            <div style={{ borderTop: `1px solid ${RB}`, marginBottom: 16 }} />

            {/* Findings count */}
            {result?.findings?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: RG, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Issues found</div>
                {(['critical', 'high', 'medium', 'low'] as const).map(sev => {
                  const count = result.findings.filter((f: any) => (f.severity || '').toLowerCase() === sev).length;
                  if (!count) return null;
                  const c = { critical: '#dc2626', high: '#d97706', medium: '#2563eb', low: '#16a34a' }[sev];
                  return (
                    <div key={sev} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: c }} />
                        <span style={{ fontSize: '0.825rem', color: RG, textTransform: 'capitalize' }}>{sev}</span>
                      </div>
                      <span style={{ fontSize: '0.825rem', fontWeight: 700, color: RD }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom: back button */}
          <div style={{ marginTop: 'auto', padding: '16px 20px', borderTop: `1px solid ${RB}` }}>
            <button
              onClick={() => navigate('/clients')}
              style={{ width: '100%', background: 'transparent', border: `1px solid ${RB}`, borderRadius: 6, padding: '7px 0', fontSize: '0.825rem', fontWeight: 600, color: RG, cursor: 'pointer' }}
            >
              ← Back to Dashboard
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px 80px' }}>
          <div style={{ maxWidth: 780 }}>
            {result && (
              <>
                {SHOW_LIVE_ADS_FOR.has(skillName) && (
                  <LiveAdsSection url={url} businessName={businessName} accentColor={meta.color} skillData={result} />
                )}

                {result.findings?.length > 0 && (
                  <>
                    <SectionTitle sub={`${result.findings.length} issues identified`}>Key Findings</SectionTitle>
                    <div style={{ background: '#fff', border: `1px solid ${RB}`, borderRadius: 8, padding: '4px 16px', marginBottom: 24 }}>
                      {result.findings.slice(0, 5).map((f: any, i: number) => <FindingRow key={i} {...f} />)}
                    </div>
                  </>
                )}

                {renderSkillContent(skillName, result, businessName, url)}

                <div style={{ marginTop: 48, paddingTop: 16, borderTop: `1px solid ${RB}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '0.78rem', color: RG }}>{agencyName} · {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                  <p style={{ fontSize: '0.78rem', color: RG }}>Review with a media buyer before implementation.</p>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* White-Label Modal */}
      {showBrandingModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: 16, borderRadius: 8, width: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: RD, marginBottom: 16 }}>White-Label Settings</h2>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: RG, marginBottom: 6 }}>Agency Name</label>
            <input
              type="text"
              value={agencyName}
              onChange={e => setAgencyName(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: `1px solid ${RB}`, fontSize: '0.875rem', marginBottom: 16, boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowBrandingModal(false)} style={{ padding: '8px 16px', borderRadius: 6, border: `1px solid ${RB}`, background: '#fff', cursor: 'pointer', fontWeight: 600, color: RG, fontSize: '0.875rem', fontFamily: 'inherit' }}>
                Close
              </button>
              <button onClick={() => setShowBrandingModal(false)} style={{ padding: '8px 16px', borderRadius: 6, background: RP, border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', fontFamily: 'inherit' }}>
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
