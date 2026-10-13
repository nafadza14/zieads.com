import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  TrendingUp,
  Link,
  Users,
  MousePointer2,
  PlayCircle,
  Settings,
  LayoutGrid,
  Target,
  Wallet,
  Swords,
  Quote,
  Layers,
  
  ListChecks,
  Wrench,
  Gauge,
} from 'lucide-react';
import ZIcon from '../components/icons/ZIcon';
import V3Layout from '../components/v3/V3Layout';
import {
  Card,
  CardTitle,
  CountUp,
  DarkButton,
  GhostButton,
  GrowBar,
  Orb,
  PageBody,
  PageHeader,
  Pill,
  SegTabs,
  Skeleton,
  TextRollButton,
} from '../components/v3/ui';
import SocialIcon from '../components/v3/SocialIcon';
import NounIcon from '../components/NounIcon';
import { supabase } from '../lib/supabaseClient';
import './report-dashboard.css';

const TABS = ['Overview', 'Creatives', 'Audiences', 'Platforms', 'Funnel', 'Competitors', 'Budget'];

const TAB_ICONS: Record<string, string> = {
  Overview: 'audit',
  Creatives: 'creatives',
  Audiences: 'audiences',
  Platforms: 'meta',
  Funnel: 'funnel',
  Competitors: 'competitors',
  Budget: 'budget',
};

/** Map a free-text platform name to a SocialIcon key, if we have a brand mark for it. */
function platformKey(name: string): string | null {
  const n = (name || '').toLowerCase();
  if (n.includes('tiktok')) return 'tiktok';
  if (n.includes('instagram')) return 'instagram';
  if (n.includes('linkedin')) return 'linkedin';
  if (n.includes('facebook')) return 'facebook';
  if (n.includes('meta')) return 'meta';
  if (n.includes('google')) return 'google_ads';
  return null;
}

function PlatformMark({ name, index }: { name: string; index: number }) {
  const key = platformKey(name);
  if (key) return <SocialIcon platform={key} size={26} />;
  return <span className="zd-rank">{index + 1}</span>;
}

/** Orange conic ring that fills on mount, with a counting score. */
function ScoreRing({ value }: { value: number }) {
  const safe = Number.isFinite(Number(value)) ? Number(value) : 0;
  const [p, setP] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setP(Math.max(0, Math.min(100, safe))));
    return () => cancelAnimationFrame(id);
  }, [safe]);
  return (
    <div className="zrd-ring" style={{ ['--zrd-p' as any]: p }} role="img" aria-label={`Total score ${safe} out of 100`}>
      <div className="zrd-ring-inner">
        <span className="zrd-ring-value">
          <CountUp value={safe} duration={1400} />
        </span>
        <span className="zrd-ring-label">Total score</span>
      </div>
    </div>
  );
}

const severityTone = (s: string): 'bad' | 'warn' | 'accent' => {
  const v = (s || '').toLowerCase();
  if (v === 'critical' || v === 'high') return 'bad';
  if (v === 'medium') return 'warn';
  return 'accent';
};

const gradeTone = (g: string): 'good' | 'accent' | 'warn' | 'bad' => {
  const v = (g || '').toUpperCase();
  if (v.startsWith('A')) return 'good';
  if (v.startsWith('B')) return 'accent';
  if (v.startsWith('C')) return 'warn';
  return 'bad';
};

const pctNumber = (v: any): number | null => {
  const n = parseFloat(String(v ?? ''));
  return Number.isFinite(n) ? n : null;
};

export default function ReportDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');
  const [checkedFindings, setCheckedFindings] = useState<Set<number>>(new Set());
  const [findingsOpen, setFindingsOpen] = useState(true);
  const [runningSkill] = useState<string | null>(null);

  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showBrandingModal, setShowBrandingModal] = useState(false);
  const [agencyModel, setAgencyModel] = useState({ name: 'ZieAds', includeWatermark: true });
  const [copyActiveTab, setCopyActiveTab] = useState('metaAds');

  // Kept from the original implementation (currently not surfaced in the UI).
  void findingsOpen;
  void setFindingsOpen;

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (token) {
          const res = await fetch('/api/audits/latest', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const json = await res.json();
          if (json.success && json.data) {
            setReportData(json.data);
            setLoading(false);
            return;
          }
        }

        const cached = localStorage.getItem('zieads_latest_audit');
        if (cached) {
          setReportData(JSON.parse(cached));
        } else {
          navigate('/clients');
        }
      } catch (err) {
        console.error('Error fetching audit:', err);
        const cached = localStorage.getItem('zieads_latest_audit');
        if (cached) {
          setReportData(JSON.parse(cached));
        } else {
          navigate('/clients');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchLatest();
  }, [navigate]);

  if (loading) {
    return (
      <V3Layout>
        <PageHeader number="01" label="Audit report" title="Compiling your report." subtitle="Pulling together scores, findings and the action plan from every agent." />
        <PageBody>
          <Card>
            <div className="zrd-loading">
              <Orb size={52} active />
              <span className="zd-shimmer" style={{ fontSize: 15 }}>Compiling your report</span>
            </div>
          </Card>
          <div className="zd-grid-3">
            {[0, 1, 2].map((i) => (
              <Card key={i}>
                <Skeleton height={12} width="45%" />
                <Skeleton height={26} width="75%" />
                <Skeleton height={10} count={2} />
              </Card>
            ))}
          </div>
        </PageBody>
      </V3Layout>
    );
  }

  if (!reportData) return null;

  const { report, agent_results: agentResults, url, business_name: businessName, created_at: generatedAt, audit_type: auditType = 'full' } = reportData;
  const { overall, grade, dimensions, findings, actionPlan, platformPriority } = report;
  const isSkillAudit = auditType !== 'full' && auditType !== 'quick';

  const toggleFinding = (i: number) => {
    const newChecked = new Set(checkedFindings);
    if (newChecked.has(i)) newChecked.delete(i);
    else newChecked.add(i);
    setCheckedFindings(newChecked);
  };

  const getAgent = (name: string) => agentResults?.find((a: any) => a.agentName === name);

  const handleRunSkill = (skillName: string) => {
    const params = new URLSearchParams({ url, businessName: businessName || '' });
    navigate(`/skill-report/${skillName}?${params.toString()}`);
  };

  const renderSkillButton = (skillName: string, label: string) => (
    <DarkButton key={skillName} onClick={() => handleRunSkill(skillName)} disabled={runningSkill === skillName}>
      <PlayCircle size={15} />
      {label}
    </DarkButton>
  );

  const cleanUrl = String(url || '').replace(/^https?:\/\//, '');
  const generatedLabel = new Date(generatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const dimensionList: any[] = Array.isArray(dimensions) ? dimensions : [];
  const openCount = findings?.filter((f: any) => !checkedFindings.has(findings.indexOf(f))).length;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Overview': {
        const plan: { key: string; label: string; tone: 'good' | 'warn' | 'accent'; color: string; items?: string[] }[] = [
          { key: 'quick', label: 'Quick wins', tone: 'good', color: 'var(--zd-good)', items: actionPlan?.quickWins },
          { key: 'medium', label: 'Medium term', tone: 'warn', color: 'var(--zd-warn)', items: actionPlan?.mediumTerm },
          { key: 'long', label: 'Long term', tone: 'accent', color: 'var(--zd-accent)', items: actionPlan?.strategic },
        ];
        return (
          <>
            <div className="zd-grid-2" style={{ alignItems: 'start' }}>
              <Card hover>
                <CardTitle icon={<Building2 />}>Project overview</CardTitle>
                <div className="zrd-field">
                  <span className="zd-eyebrow">Business name</span>
                  <div className="zrd-field-value" style={{ fontSize: 18 }}>{businessName}</div>
                </div>
                <div className="zrd-field">
                  <span className="zd-eyebrow">Target website</span>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="zrd-url" style={{ marginTop: 0, fontWeight: 600, color: 'var(--zd-ink)' }}>
                    {cleanUrl} <Link size={13} />
                  </a>
                </div>
                <div className="zrd-field">
                  <span className="zd-eyebrow">Audit generated</span>
                  <div className="zd-text-sm">{generatedLabel}</div>
                </div>
              </Card>

              <Card hover>
                <CardTitle icon={<Layers />} sub="Where to spend first">Platform priority</CardTitle>
                <div>
                  {platformPriority?.slice(0, 3).map((p: any, i: number) => (
                    <div key={i} className="zd-row zd-slide-in" style={{ animationDelay: `${i * 70}ms`, padding: '10px 6px' }}>
                      <PlatformMark name={p.platform} index={i} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{p.platform}</div>
                        <div className="zd-muted" style={{ fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.reason}</div>
                      </div>
                      <Pill tone={i === 0 ? 'accent' : 'neutral'}>#{i + 1}</Pill>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <Card>
              <CardTitle icon={<TrendingUp />} sub="What to do now, next and later">Strategic action plan</CardTitle>
              <div className="zd-grid-3">
                {plan.map((col) => (
                  <div key={col.key} className="zd-card zd-card-soft" style={{ padding: 16 }}>
                    <div className="zrd-plan-head">
                      <Pill tone={col.tone}>{col.label}</Pill>
                    </div>
                    <ul className="zrd-list">
                      {col.items?.map((a: string, i: number) => (
                        <li key={i} className="zd-slide-in" style={{ animationDelay: `${i * 60}ms` }}>
                          <CheckCircle2 size={16} style={{ color: col.color }} />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>
          </>
        );
      }

      case 'Creatives': {
        const creative = getAgent('creative-intelligence');
        const d = creative?.deliverables || {};
        return (
          <>
            <Card>
              <CardTitle icon={<ZIcon name="creative" />}>Core creative strategy</CardTitle>
              <p className="zrd-lede">{d.heroOfferAssessment}</p>
              <div className="zd-grid-3">
                <Card hover className="zd-card-soft" padding={16}>
                  <span className="zd-eyebrow">Tone of voice</span>
                  <div className="zrd-field-value" style={{ marginTop: 6 }}>{d.brandIdentity?.tone || "Conversion Focused"}</div>
                </Card>
                <Card hover className="zd-card-soft" padding={16}>
                  <span className="zd-eyebrow">Visual palette</span>
                  <div className="zrd-field-value" style={{ marginTop: 6 }}>{d.brandIdentity?.colors || "Not found"}</div>
                </Card>
                <Card hover className="zd-card-soft" padding={16}>
                  <span className="zd-eyebrow">Aesthetic style</span>
                  <div className="zrd-field-value" style={{ marginTop: 6 }}>{d.brandIdentity?.style || "Modern"}</div>
                </Card>
              </div>
            </Card>

            <div className="zd-grid-2" style={{ alignItems: 'start' }}>
              <div>
                <h4 className="zrd-section-head">
                  <SocialIcon platform="meta" size={30} />
                  Meta angles
                </h4>
                <div className="zrd-stack">
                  {d.creativeConceptsMeta?.map((c: any, i: number) => (
                    <Card key={i} hover className="zd-slide-in" style={{ animationDelay: `${i * 70}ms` }}>
                      <Pill tone="neutral"><Megaphone /> {c.format}</Pill>
                      <div className="zrd-quote">“{c.hook}”</div>
                      <p className="zd-text-sm" style={{ margin: 0 }}>{c.visualDirection}</p>
                    </Card>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="zrd-section-head">
                  <SocialIcon platform="tiktok" size={30} />
                  TikTok hooks
                </h4>
                <div className="zrd-stack">
                  {d.creativeConceptsTikTok?.map((c: any, i: number) => (
                    <Card key={i} hover className="zd-slide-in" style={{ animationDelay: `${i * 70}ms` }}>
                      <Pill tone="accent"><PlayCircle /> {c.format}</Pill>
                      <div className="zrd-quote">“{c.hook}”</div>
                      <p className="zd-text-sm" style={{ margin: 0 }}>{c.visualDirection}</p>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            <div className="zrd-actions">
              {renderSkillButton('ads-copy', 'Generate Ad Copy')}
              {renderSkillButton('ads-creatives', 'Advanced Video Mockups')}
            </div>
          </>
        );
      }

      case 'Audiences': {
        const audience = getAgent('audience-targeting');
        const d = audience?.deliverables || {};
        return (
          <>
            <Card className="zd-card-accent">
              <CardTitle icon={<Users />} sub="Who this business should be talking to">Ideal customer persona</CardTitle>
              <div className="zd-grid-3">
                <div>
                  <span className="zd-eyebrow">Demographics</span>
                  <p className="zd-text-sm" style={{ margin: '6px 0 0', color: 'var(--zd-ink)' }}>{d.icp?.demographics || 'Not identified'}</p>
                </div>
                <div>
                  <span className="zd-eyebrow">Pain points</span>
                  <p className="zd-text-sm" style={{ margin: '6px 0 0', color: 'var(--zd-ink)' }}>{d.icp?.psychographics || 'Not identified'}</p>
                </div>
                <div>
                  <span className="zd-eyebrow">Core motivator</span>
                  <p className="zd-text-sm" style={{ margin: '6px 0 0', color: 'var(--zd-ink)' }}>{d.icp?.jobToBeDone || 'Not identified'}</p>
                </div>
              </div>
            </Card>

            <div className="zd-grid-2" style={{ alignItems: 'start' }}>
              <Card hover>
                <CardTitle icon={<Target />} sub="Cold, warm and hot tiers">Meta targeting segments</CardTitle>
                {['cold', 'warm', 'hot'].map((tier, i) => (
                  <div key={tier} className="zrd-tier zd-slide-in" style={{ animationDelay: `${i * 70}ms` }}>
                    <Pill tone={tier === 'hot' ? 'accent' : tier === 'warm' ? 'warn' : 'neutral'}>{tier}</Pill>
                    <p className="zd-text-sm" style={{ margin: 0, flex: 1, minWidth: 0 }}>{d.metaAudiences?.[tier]?.join(", ") || "Auto-match broad algorithm"}</p>
                  </div>
                ))}
              </Card>

              <Card hover>
                <CardTitle icon={<SocialIcon platform="google" size={16} variant="mono" />} sub="Keywords with buying intent">Google search intent</CardTitle>
                <div className="zrd-kw">
                  {d.googleAudiences?.searchIntent?.map((keyword: string, i: number) => (
                    <span key={i}>{keyword}</span>
                  )) || <div className="zd-text-sm zd-muted">No intent keywords detected.</div>}
                </div>
              </Card>
            </div>

            <div className="zrd-actions">
              {renderSkillButton('ads-audiences', 'Export Detailed Targeting Lists')}
            </div>
          </>
        );
      }

      case 'Platforms': {
        const platform = getAgent('platform-budget');
        const d = platform?.deliverables || {};
        return (
          <>
            <Card>
              <CardTitle icon={<LayoutGrid />} sub="How well each channel fits this business">Channel fit analysis</CardTitle>
              <div>
                {d.platformRanking?.map((p: any, i: number) => (
                  <div key={i} className="zd-row zd-slide-in" style={{ animationDelay: `${i * 60}ms`, display: 'block', padding: '14px 8px' }}>
                    <div className="zrd-plat">
                      <div className="zrd-plat-name">
                        <PlatformMark name={p.platform} index={i} />
                        <span>{p.platform}</span>
                      </div>
                      <div className="zrd-plat-fit">
                        <CountUp value={Number(p.fitScore) || 0} suffix="%" />
                        <GrowBar value={Number(p.fitScore) || 0} delay={i * 80} tone={Number(p.fitScore) >= 80 ? 'good' : 'accent'} />
                      </div>
                      <Pill tone="neutral">{p.allocation}</Pill>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div className="zrd-actions">
              {renderSkillButton('ads-google', 'Google Ads Plan')}
              {renderSkillButton('ads-meta', 'Meta Ads Plan')}
              {renderSkillButton('ads-tiktok', 'TikTok Plan')}
              {renderSkillButton('ads-linkedin', 'LinkedIn Plan')}
            </div>
          </>
        );
      }

      case 'Funnel': {
        const funnel = getAgent('funnel-conversion');
        const d = funnel?.deliverables || {};
        return (
          <>
            <Card>
              <CardTitle icon={<MousePointer2 />} sub="Landing page scored out of 10">Conversion rate optimization</CardTitle>
              <div className="zd-grid-4">
                {Object.entries(d.landingPageScores || {}).map(([key, val]: [string, any], i) => (
                  <Card key={key} hover className="zd-card-soft" padding={16}>
                    <span className="zd-eyebrow" style={{ display: 'block', minHeight: 28 }}>{key.replace(/([A-Z])/g, ' $1')}</span>
                    <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', margin: '6px 0 10px' }}>
                      <CountUp value={Number(val) || 0} />
                      <span className="zd-muted" style={{ fontSize: 15, fontWeight: 500 }}>/10</span>
                    </div>
                    <GrowBar value={(Number(val) || 0) * 10} delay={i * 80} tone={Number(val) >= 8 ? 'good' : 'accent'} />
                  </Card>
                ))}
              </div>
            </Card>

            <div className="zd-grid-2" style={{ alignItems: 'start' }}>
              <Card hover>
                <CardTitle icon={<Quote />}>High-converting headline alternatives</CardTitle>
                <div className="zrd-stack" style={{ gap: 10 }}>
                  {d.headlineRewrites?.map((h: string, i: number) => (
                    <div key={i} className="zrd-callout is-good zd-slide-in" style={{ animationDelay: `${i * 60}ms` }}>
                      <CheckCircle2 size={16} />
                      <span style={{ fontWeight: 600 }}>"{h}"</span>
                    </div>
                  ))}
                </div>
              </Card>
              <Card hover>
                <CardTitle icon={<AlertCircle />}>Primary conversion killers</CardTitle>
                <div className="zrd-stack" style={{ gap: 10 }}>
                  {d.conversionBlockers?.map((b: string, i: number) => (
                    <div key={i} className="zrd-callout is-bad zd-slide-in" style={{ animationDelay: `${i * 60}ms` }}>
                      <AlertCircle size={16} />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="zrd-actions">
              {renderSkillButton('ads-landing', 'Generate Landing Page Copy')}
              {renderSkillButton('ads-funnel', 'Build Full Customer Journey')}
            </div>
          </>
        );
      }

      case 'Competitors': {
        const comp = getAgent('competitive-intelligence');
        const d = comp?.deliverables || {};
        return (
          <>
            <div className="zd-grid-2" style={{ alignItems: 'start' }}>
              {d.directCompetitors?.map((c: any, i: number) => (
                <Card key={i} hover>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, paddingBottom: 14, marginBottom: 14, borderBottom: '1px solid var(--zd-line)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <span className="zd-icon-dot"><Swords /></span>
                      <div style={{ minWidth: 0 }}>
                        <span className="zd-eyebrow">Direct competitor</span>
                        <div style={{ fontSize: 19, fontWeight: 650, letterSpacing: '-0.02em', overflowWrap: 'anywhere' }}>{c.name}</div>
                      </div>
                    </div>
                    <Pill tone="dark">{c.adSpendTier} spend</Pill>
                  </div>
                  <div className="zrd-field">
                    <span className="zd-eyebrow">Creative angle</span>
                    <p className="zd-text-sm" style={{ margin: 0 }}>{c.creativeApproach}</p>
                  </div>
                  <div className="zrd-field">
                    <span className="zd-eyebrow">Core offer</span>
                    <p className="zd-text-sm" style={{ margin: 0 }}>{c.offer}</p>
                  </div>
                </Card>
              ))}
            </div>
            <div className="zrd-actions">
              {renderSkillButton('ads-competitors', 'Analyze Competitor Ad Libraries')}
            </div>
          </>
        );
      }

      case 'Budget': {
        const platform = getAgent('platform-budget');
        const d = platform?.deliverables || {};
        const splits = [
          { label: 'Top of funnel', value: d.budgetAllocation?.tofu || "40%" },
          { label: 'Middle of funnel', value: d.budgetAllocation?.mofu || "30%" },
          { label: 'Bottom of funnel', value: d.budgetAllocation?.bofu || "30%" },
        ];
        return (
          <>
            <Card className="zd-card-accent">
              <span className="zd-eyebrow">Recommended monthly investment</span>
              <div className="zrd-budget-big">{d.benchmarks?.expectedCPA ? "Custom Plan" : "Analyzing"}</div>
            </Card>

            <div className="zd-grid-3">
              {splits.map((s, i) => {
                const n = pctNumber(s.value);
                return (
                  <Card key={s.label} hover>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="zd-eyebrow">{s.label}</span>
                      <span className="zd-stat-icon"><Wallet /></span>
                    </div>
                    <div className="zrd-budget-val">{s.value}</div>
                    {n !== null && <GrowBar value={n} delay={i * 100} tone={i === 2 ? 'dark' : 'accent'} />}
                  </Card>
                );
              })}
            </div>

            <Card>
              <CardTitle icon={<TrendingUp />}>Scaling strategy</CardTitle>
              <p className="zrd-lede" style={{ marginBottom: 0 }}>{d.scalingThresholds || "Focus on stabilizing initial CPA before aggressive scaling. Do not increase daily budgets by more than 20% every 3 days to avoid resetting the learning phase."}</p>
            </Card>

            <div className="zrd-actions">
              {renderSkillButton('ads-budget', 'Generate 90-Day Financial Projection')}
            </div>
          </>
        );
      }

      default:
        return null;
    }
  };

  return (
    <V3Layout>
      <PageHeader
        number="01"
        label={`Audit report · ${agencyModel.name}`}
        title={isSkillAudit ? 'Your ads deep-dive report.' : 'Your paid ads readiness report.'}
        subtitle={
          <>
            {businessName}
            {cleanUrl ? ` · ${cleanUrl}` : ''}
            {generatedAt ? ` · ${generatedLabel}` : ''}
          </>
        }
        actions={
          <>
            <GhostButton onClick={() => navigate('/clients')}>
              <LayoutGrid /> Dashboard
            </GhostButton>
            <GhostButton onClick={() => setShowBrandingModal(true)}>
              <Settings /> Settings
            </GhostButton>
            <TextRollButton text="Export PDF" onClick={() => window.print()} />
          </>
        }
      />

      <PageBody>
        {/* Score hero */}
        <Card>
          <div className="zrd-hero">
            <ScoreRing value={overall} />
            <div className="zrd-hero-meta">
              <div className="zrd-hero-pills">
                <Pill tone={gradeTone(grade)}>Grade {grade}</Pill>
                <Pill tone="neutral" className="capitalize">{auditType} analysis</Pill>
              </div>
              <h2 className="zrd-biz">{businessName}</h2>
              {url && (
                <a href={url} target="_blank" rel="noreferrer" className="zrd-url">
                  {cleanUrl} <Link size={13} />
                </a>
              )}
              {dimensionList.length > 0 && (
                <div className="zrd-dims">
                  {dimensionList.map((dim: any, i: number) => (
                    <div key={dim.name || i} className="zd-slide-in" style={{ animationDelay: `${150 + i * 70}ms` }}>
                      <div className="zrd-dim-top">
                        <span className="zrd-dim-name">{dim.name}</span>
                        <span className="zrd-dim-score"><CountUp value={Number(dim.score) || 0} /></span>
                      </div>
                      <GrowBar value={Number(dim.score) || 0} delay={200 + i * 90} tone={Number(dim.score) >= 80 ? 'good' : 'accent'} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Critical findings */}
        <Card>
          <CardTitle
            icon={<ListChecks />}
            sub="The highest-impact issues blocking your ad performance."
            action={<Pill tone={openCount ? 'bad' : 'good'}>{openCount} issues open</Pill>}
          >
            Critical findings
          </CardTitle>
          <div className="zrd-stack" style={{ gap: 12 }}>
            {findings?.map((f: any, i: number) => {
              const done = checkedFindings.has(i);
              return (
                <Card key={i} hover={!done} className={`zd-slide-in ${done ? 'zd-card-soft' : ''}`} style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }} padding={18}>
                  <div className={`zrd-finding ${done ? 'is-done' : ''}`}>
                    <input
                      type="checkbox"
                      className="zrd-check"
                      checked={done}
                      onChange={() => toggleFinding(i)}
                      aria-label={`Mark "${f.title}" as done`}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="zrd-finding-head">
                        <Pill tone={severityTone(f.severity)}>{f.severity} priority</Pill>
                        <h3 className="zrd-finding-title">{f.title}</h3>
                      </div>
                      <div className="zrd-panels">
                        <div className="zrd-panel is-impact">
                          <span className="zd-eyebrow"><Gauge size={12} /> Impact</span>
                          {f.impact}
                        </div>
                        <div className="zrd-panel is-fix">
                          <span className="zd-eyebrow"><Wrench size={12} /> Fix</span>
                          {f.recommendation}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </Card>

        {/* Tabs */}
        {!isSkillAudit && (
          <div className="zrd-tab-panel">
            <div className="zrd-tabs" role="tablist">
              {TABS.map((tab) => {
                const active = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveTab(tab)}
                    className={`zd-chip is-accent ${active ? 'is-active' : ''}`}
                  >
                    <NounIcon name={TAB_ICONS[tab]} size={14} color={active ? '#fff' : '#F26522'} />
                    <span>{tab}</span>
                  </button>
                );
              })}
            </div>
            <div key={activeTab} className="zrd-tab-panel zd-fade-up">
              {renderTabContent()}
            </div>
          </div>
        )}

        {/* Skill audit view */}
        {isSkillAudit && (
          <Card>
            <div style={{ paddingBottom: 18, marginBottom: 20, borderBottom: '1px solid var(--zd-line)' }}>
              <Pill tone="accent" className="capitalize">{auditType} deep-dive</Pill>
              <h2 className="zrd-biz" style={{ marginTop: 10 }}>{businessName}</h2>
              <div className="zd-muted" style={{ fontSize: 14, marginTop: 4, overflowWrap: 'anywhere' }}>{url}</div>
            </div>

            {auditType === 'copy' ? (
              <div className="zrd-stack" style={{ gap: 20 }}>
                <div className="zd-grid-2">
                  <Card hover className="zd-card-soft">
                    <span className="zd-eyebrow">Copy master strategy</span>
                    <p style={{ margin: '8px 0 0', fontSize: 16, fontWeight: 600, lineHeight: 1.55, color: 'var(--zd-ink)' }}>{report.analysis?.strategy}</p>
                  </Card>
                  <Card hover className="zd-card-soft">
                    <span className="zd-eyebrow">Audience resonance</span>
                    <div className="zrd-kw" style={{ marginTop: 10 }}>
                      {report.analysis?.keySellingPoints?.map((p: string, i: number) => (
                        <span key={i}>#{p}</span>
                      ))}
                    </div>
                  </Card>
                </div>

                <div style={{ maxWidth: '100%', overflowX: 'auto' }}>
                  <SegTabs
                    size="sm"
                    value={copyActiveTab}
                    onChange={(id) => setCopyActiveTab(id)}
                    tabs={['metaAds', 'googleAds', 'tiktokAds'].map((p) => ({ id: p, label: p.replace('Ads', '') }))}
                  />
                </div>

                <div key={copyActiveTab} className="zd-fade-up">
                  {copyActiveTab === 'metaAds' && (
                    <Card>
                      <Pill tone="accent">Option A (high intent variant)</Pill>
                      <div className="zrd-copy-body">
                        {report.deliverables?.metaAds?.longBody || report.deliverables?.metaAds?.primaryTexts?.[0]}
                      </div>
                      <div className="zd-grid-2">
                        {report.deliverables?.metaAds?.headlines?.map((h: string, i: number) => (
                          <Card key={i} hover className="zd-card-soft" padding={16}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                              <span className="zd-icon-dot" style={{ width: 28, height: 28 }}><Quote /></span>
                              <span style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.5 }}>"{h}"</span>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </Card>
                  )}

                  {copyActiveTab === 'googleAds' && (
                    <div className="zd-grid-2">
                      {report.deliverables?.googleAds?.headlines?.map((h: string, i: number) => (
                        <Card key={i} hover padding={16}>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <span className="zd-rank">H{i + 1}</span>
                            <span style={{ fontWeight: 600, fontSize: 14.5 }}>{h}</span>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}

                  {copyActiveTab === 'tiktokAds' && (
                    <div className="zrd-stack">
                      {report.deliverables?.tiktokAds?.scriptOutlines?.map((s: any, i: number) => (
                        <Card key={i} hover>
                          <Pill tone="accent">First 3s hook</Pill>
                          <div className="zrd-quote" style={{ fontSize: 19 }}>"{s.hook}"</div>
                          <p className="zd-text-sm" style={{ margin: '0 0 14px', fontSize: 14.5 }}>{s.body}</p>
                          <Pill tone="good">CTA: {s.cta}</Pill>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <pre className="zrd-pre">{JSON.stringify(report.deliverables || report, null, 2)}</pre>
            )}
          </Card>
        )}
      </PageBody>

      {/* Settings modal */}
      <AnimatePresence>
        {showBrandingModal && (
          <div className="zrd-modal-wrap">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBrandingModal(false)}
              className="zrd-modal-backdrop"
            />
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 16 }}
              transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
              className="zrd-modal"
            >
              <h2>White-label settings</h2>
              <label className="zd-label" htmlFor="zrd-agency-name">Agency name</label>
              <input
                id="zrd-agency-name"
                type="text"
                value={agencyModel.name}
                onChange={(e) => setAgencyModel({ ...agencyModel, name: e.target.value })}
                className="zd-input"
                style={{ marginBottom: 14 }}
              />
              <label className="zrd-toggle">
                <input
                  type="checkbox"
                  className="zrd-check"
                  style={{ margin: 0 }}
                  checked={agencyModel.includeWatermark}
                  onChange={(e) => setAgencyModel({ ...agencyModel, includeWatermark: e.target.checked })}
                />
                <span>Include "Powered by ZieAds" in footer</span>
              </label>
              <div className="zrd-modal-actions">
                <GhostButton onClick={() => setShowBrandingModal(false)}>Cancel</GhostButton>
                <DarkButton onClick={() => setShowBrandingModal(false)}>Save</DarkButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </V3Layout>
  );
}
