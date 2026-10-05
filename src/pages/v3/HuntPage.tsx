import { useState, useEffect } from 'react';
import V3Layout from '../../components/v3/V3Layout';
import { supabase } from '../../lib/supabaseClient';
import { useDemoMode } from '../../lib/demoStore';
import { sampleCompetitor } from '../../data/sample-data';
import {
  Card,
  CardTitle,
  CountUp,
  EmptyState,
  GhostButton,
  LoadingState,
  Orb,
  PageBody,
  PageHeader,
  Pill,
  Skeleton,
  StatCard,
  TextRollButton,
} from '../../components/v3/ui';
import {
  Target,
  Plus,
  RefreshCw,
  Trash2,
  ExternalLink,
  Shield,
  Zap,
  ChevronDown,
  Globe,
  Building2,
  Gauge,
  Radar as RadarIcon,
} from 'lucide-react';
import './hunt.css';

type Tone = 'good' | 'warn' | 'bad';

/** Small radar sweep with pinging blips (signature motion of this page). */
function Radar({ large = false, fast = false }: { large?: boolean; fast?: boolean }) {
  return (
    <span className={`zhu-radar ${large ? 'is-lg' : ''} ${fast ? 'is-fast' : ''}`} aria-hidden="true">
      <span className="zhu-radar-sweep" />
      <span className="zhu-radar-ping" style={{ left: '68%', top: '30%' }} />
      <span className="zhu-radar-ping" style={{ left: '30%', top: '62%' }} />
      <span className="zhu-radar-ping" style={{ left: '58%', top: '74%' }} />
    </span>
  );
}

export default function HuntPage() {
  const demo = useDemoMode();
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingCompetitor, setAddingCompetitor] = useState(false);
  const [auditingId, setAuditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Form State
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');

  const getAuthHeaders = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    return token
      ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };
  };

  const fetchCompetitors = async () => {
    if (demo.isActive) {
      setCompetitors([
        {
          id: "demo_comp_1",
          name: sampleCompetitor.competitor_name,
          website_url: sampleCompetitor.competitor_url,
          audit_score: sampleCompetitor.latest_audit_score,
          last_audited_at: sampleCompetitor.last_audited_at,
          audit_report: (sampleCompetitor as any).audit_history?.[0]?.report
        }
      ]);
      setLoading(false);
      return;
    }

    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/v3/competitors', { headers });
      const j = await res.json();
      if (j.success) setCompetitors(j.data);
    } catch (err) {
      console.error("Failed to fetch competitors:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchCompetitors();
  }, [demo.isActive]);

  const handleAddCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (demo.isActive) {
      alert("Please exit Demo Mode to add competitors.");
      return;
    }
    if (!url.trim() || !name.trim()) return;

    setAddingCompetitor(true);
    try {
      let formattedUrl = url.trim();
      if (!formattedUrl.startsWith('http')) formattedUrl = 'https://' + formattedUrl;

      const headers = await getAuthHeaders();
      const res = await fetch('/api/v3/competitors', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: name.trim(),
          website_url: formattedUrl
        })
      });
      const j = await res.json();
      if (res.ok && j.success) {
        setUrl('');
        setName('');
        await fetchCompetitors();
      } else {
        alert(j.error || "Failed to track competitor.");
      }
    } catch (err) {
      alert("Failed to track competitor.");
    } finally {
      setAddingCompetitor(false);
    }
  };

  const handleAudit = async (id: string) => {
    if (demo.isActive) {
      alert("Auditing is disabled in Demo Mode.");
      return;
    }
    setAuditingId(id);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/v3/competitors/${id}/audit`, {
        method: 'POST',
        headers
      });
      const j = await res.json();
      if (j.success) {
        await fetchCompetitors();
      } else {
        alert(j.error || "Failed to run competitor audit.");
      }
    } catch (err) {
      alert("Failed to run competitor audit.");
    } finally {
      setAuditingId(null);
    }
  };

  const handleDelete = async (id: string, competitorName: string) => {
    if (demo.isActive) {
      alert("Deleting is disabled in Demo Mode.");
      return;
    }
    if (!confirm(`Stop tracking ${competitorName}? This will delete all audit history.`)) return;

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/v3/competitors/${id}`, {
        method: 'DELETE',
        headers
      });
      const j = await res.json();
      if (j.success) {
        setCompetitors(prev => prev.filter(c => c.id !== id));
        if (expandedId === id) setExpandedId(null);
      }
    } catch (err) {
      alert("Failed to delete competitor.");
    }
  };

  const getScoreTone = (score: number): Tone => {
    if (score >= 80) return 'good';
    if (score >= 65) return 'warn';
    return 'bad';
  };

  const scored = competitors.filter((c) => c.audit_score !== null && c.audit_score !== undefined);
  const avgScore = scored.length ? scored.reduce((sum, c) => sum + Number(c.audit_score || 0), 0) / scored.length : 0;
  const anyAuditing = auditingId !== null;

  return (
    <V3Layout>
      <PageHeader
        number="07"
        label="Competitor Hunt"
        title="Know every move your rivals make."
        subtitle="Monitor and audit your competitors' advertising performance autonomously."
        actions={
          <span className="zhu-header-meta">
            <Pill tone={competitors.length ? 'accent' : 'neutral'}>
              <span className={`zd-live ${competitors.length ? '' : 'is-off'}`} />
              {competitors.length} tracked
            </Pill>
            <Radar fast={anyAuditing} />
          </span>
        }
      />

      <PageBody>
        {/* Add competitor */}
        <Card glass className="zhu-form-card">
          <CardTitle icon={<Plus />} sub="Name the brand and its website. We will start watching it right away.">
            Track a new competitor
          </CardTitle>
          <form onSubmit={handleAddCompetitor}>
            <div className="zhu-pill-form">
              <label className="zhu-field">
                <Building2 />
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Competitor brand"
                  aria-label="Competitor name"
                  required
                />
              </label>
              <label className="zhu-field">
                <Globe />
                <input
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="competitor.com"
                  aria-label="Website URL"
                  required
                />
              </label>
              <span className="zhu-submit">
                {addingCompetitor ? (
                  <span className="zhu-adding">
                    <LoadingState text="Adding" inline />
                  </span>
                ) : (
                  <TextRollButton type="submit" text="Track site" disabled={addingCompetitor} />
                )}
              </span>
            </div>
          </form>
        </Card>

        {loading ? (
          <>
            <div className="zhu-grid">
              {[0, 1].map((i) => (
                <Card key={i}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <Skeleton height={44} width={44} radius={999} />
                    <div style={{ flex: 1 }}>
                      <Skeleton height={14} width="55%" />
                      <Skeleton height={11} width="75%" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <LoadingState text="Loading tracked competitors" />
          </>
        ) : competitors.length === 0 ? (
          <EmptyState
            icon={<Target size={20} />}
            title="No competitors on the radar yet"
            body="Add a competitor above to start monitoring their ads and readiness."
            action={<Radar large={!isMobile} />}
          />
        ) : (
          <>
            <div className="zd-grid-3">
              <StatCard label="Tracked" value={competitors.length} icon={<RadarIcon />} hint="Competitors on watch" />
              <StatCard
                label="Average score"
                value={avgScore}
                icon={<Gauge />}
                hint={scored.length ? `Across ${scored.length} audited` : 'Run an audit to score'}
                hintTone={scored.length ? 'accent' : 'muted'}
              />
              <StatCard
                label="Audited"
                value={scored.length}
                icon={<Zap />}
                hint={anyAuditing ? 'Audit in progress' : `${competitors.length - scored.length} awaiting audit`}
                hintTone={anyAuditing ? 'accent' : 'muted'}
              />
            </div>

            <div className="zhu-grid">
              {competitors.map((comp, ci) => {
                const isExpanded = expandedId === comp.id;
                const hasScore = comp.audit_score !== null && comp.audit_score !== undefined;
                const isAuditing = auditingId === comp.id;
                const auditReportObj = comp.audit_report;
                const tone = hasScore ? getScoreTone(comp.audit_score) : null;
                const initial = (comp.name || '?').trim().charAt(0).toUpperCase() || '?';
                const dims = Object.entries(auditReportObj?.dimensions || {});
                const findings = (auditReportObj?.findings || []).slice(0, 3);

                return (
                  <Card
                    key={comp.id}
                    hover
                    padding={0}
                    delay={ci * 60}
                    className={`zhu-card ${isExpanded ? 'is-open' : ''}`}
                  >
                    {isAuditing && <div className="zhu-scanline" />}

                    {/* Summary */}
                    <div className="zhu-card-head">
                      <span className="zhu-avatar">{initial}</span>
                      <div className="zhu-id">
                        <div className="zhu-name">{comp.name}</div>
                        <a className="zhu-url" href={comp.website_url} target="_blank" rel="noreferrer">
                          <span>{comp.website_url}</span> <ExternalLink size={11} />
                        </a>
                      </div>
                      <span
                        className={`zhu-ring ${tone ? `tone-${tone}` : 'is-empty'}`}
                        style={{ ['--zhu-pct' as any]: hasScore ? Math.max(0, Math.min(100, Number(comp.audit_score))) : 0 }}
                        title={hasScore ? 'Readiness score' : 'Not audited yet'}
                      >
                        <span>{hasScore ? <CountUp value={Number(comp.audit_score)} /> : '--'}</span>
                      </span>
                    </div>

                    <div className="zhu-card-meta">
                      <div className="zhu-pills">
                        <Pill tone="neutral">
                          <Globe /> Website
                        </Pill>
                        {hasScore ? (
                          <Pill tone={tone!}>
                            {tone === 'good' ? 'Strong' : tone === 'warn' ? 'Average' : 'Weak'}
                          </Pill>
                        ) : (
                          <Pill tone="neutral">Not audited</Pill>
                        )}
                      </div>
                      <div className="zhu-actions">
                        <GhostButton className="zhu-audit-btn" onClick={() => handleAudit(comp.id)} disabled={isAuditing}>
                          <RefreshCw className={isAuditing ? 'is-spin' : ''} />
                          {isAuditing ? 'Scanning' : 'Audit now'}
                        </GhostButton>
                        <button
                          type="button"
                          className="zd-icon-btn zhu-del"
                          onClick={() => handleDelete(comp.id, comp.name)}
                          aria-label={`Stop tracking ${comp.name}`}
                          title="Stop tracking"
                        >
                          <Trash2 />
                        </button>
                        <button
                          type="button"
                          className={`zd-icon-btn zhu-chev ${isExpanded ? 'is-open' : ''}`}
                          onClick={() => setExpandedId(isExpanded ? null : comp.id)}
                          aria-expanded={isExpanded}
                          aria-label={isExpanded ? 'Hide details' : 'Show details'}
                        >
                          <ChevronDown />
                        </button>
                      </div>
                    </div>

                    {isAuditing && (
                      <div className="zhu-auditing">
                        <Orb size={28} active />
                        <LoadingState text="Auditing competitor" />
                      </div>
                    )}

                    {/* Expandable detail */}
                    <div className={`zhu-collapse ${isExpanded ? 'is-open' : ''}`} aria-hidden={!isExpanded}>
                      <div className="zhu-collapse-inner">
                        <div className="zhu-detail">
                          {!hasScore ? (
                            <div className="zhu-no-audit">
                              <span className="zhu-gap-icon"><Zap size={14} /></span>
                              <span>No audit history yet. Run "Audit now" to scan this competitor's readiness.</span>
                            </div>
                          ) : (
                            <>
                              {dims.length > 0 && <div>
                                <div className="zd-eyebrow zhu-section-title">Readiness breakdown</div>
                                <div className="zhu-dims">
                                  {dims.map(([dim, val]: any, di) => (
                                    <div key={dim} className="zhu-dim">
                                      <div className="zhu-dim-top">
                                        <span>{dim}</span>
                                        <span className="zd-num">{val}</span>
                                      </div>
                                      <div className="zhu-bar">
                                        <i
                                          className={`tone-${getScoreTone(val)}`}
                                          style={{ ['--zhu-w' as any]: `${Math.max(0, Math.min(100, Number(val) || 0))}%`, transitionDelay: `${150 + di * 70}ms` }}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>}

                              {findings.length > 0 && <div>
                                <div className="zd-eyebrow zhu-section-title">Key findings and gaps</div>
                                <div className="zhu-gaps">
                                  {findings.map((f: any, idx: number) => {
                                    const title = typeof f === 'string' ? f : (f.title || 'Finding');
                                    const detail = typeof f === 'string' ? '' : (f.impact || f.recommendation || '');
                                    return (
                                      <div key={idx} className="zd-row zhu-gap" style={{ animationDelay: `${200 + idx * 80}ms` }}>
                                        <span className="zhu-gap-icon"><Shield size={14} /></span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <div className="zhu-gap-title">{title}</div>
                                          {detail && <div className="zhu-gap-detail">{detail}</div>}
                                        </div>
                                        <Pill tone="accent">Gap {idx + 1}</Pill>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </PageBody>
    </V3Layout>
  );
}
