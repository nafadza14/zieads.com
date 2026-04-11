import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ZieAdsLogo from '../components/ZieAdsLogo';
import { supabase } from '../lib/supabaseClient';

const TABS = ['Overview', 'Creatives', 'Audiences', 'Platforms', 'Funnel', 'Competitors', 'Budget'];

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

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token;

        // Try DB first (when authenticated)
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

        // Fallback: use the cached result written by AuditProgress
        const cached = localStorage.getItem('zieads_latest_audit');
        if (cached) {
          setReportData(JSON.parse(cached));
        } else {
          navigate('/clients');
        }
      } catch {
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

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa', color: '#64748b' }}>Loading your strategy...</div>;
  if (!reportData) return null;

  const { report, agent_results: agentResults, url, business_name: businessName, created_at: generatedAt, audit_type: auditType = 'full' } = reportData;
  const { overall, grade, dimensions, findings, actionPlan, platformPriority } = report;
  const isSkillAudit = auditType !== 'full' && auditType !== 'quick';

  const getScoreColor = (s: number) => {
    if (s >= 70) return '#00c9a7'; // Green
    if (s >= 50) return '#f59e0b'; // Amber
    return '#dc2626'; // Red
  };

  const getDimensionScoreColor = (s: number) => {
    if (s >= 60) return '#00c9a7'; // Green
    if (s >= 40) return '#f59e0b'; // Amber
    return '#dc2626'; // Red
  };

  const toggleFinding = (i: number) =>
    setCheckedFindings(prev => {
      const s = new Set(prev);
      s.has(i) ? s.delete(i) : s.add(i);
      return s;
    });

  const getAgent = (name: string) => agentResults?.find((a: any) => a.agentName === name);

  const handleRunSkill = (skillName: string) => {
    const params = new URLSearchParams({ url, businessName: businessName || '' });
    navigate(`/skill-report/${skillName}?${params.toString()}`);
  };

  const renderSkillButton = (skillName: string, label: string) => (
    <div style={{ marginTop: 16, marginBottom: 8 }}>
      <button
        className="btn-get-started"
        style={{ padding: '9px 18px', fontSize: '0.875rem', width: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}
        onClick={() => handleRunSkill(skillName)}
        disabled={runningSkill === skillName}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        {label}
      </button>
    </div>
  );

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'Overview':
        return (
          <div className="tab-content" id="print-tab-overview">
            <h3>Executive Summary</h3>
            <div className="summary-card">
              <p><strong>Business:</strong> {businessName}</p>
              <p><strong>URL:</strong> {url}</p>
              <p><strong>Audit Date:</strong> {new Date(generatedAt).toLocaleDateString()}</p>
              <p><strong>Overall Score:</strong> {overall}/100 (Grade {grade})</p>
            </div>

            <h3>Platform Priority</h3>
            <div className="platform-priority-list">
              {platformPriority?.map((p: any, i: number) => (
                <div key={i} className="platform-priority-item">
                  <span className="pp-rank">#{i + 1}</span>
                  <div className="pp-info">
                    <strong>{p.platform}</strong>
                    <p>{p.reason}</p>
                  </div>
                  <span className="pp-kpi">{p.estimatedCPA}</span>
                </div>
              ))}
            </div>

            <h3>Action Plan</h3>
            <div className="action-plan">
              <div className="ap-section">
                <h4>Quick Wins (This Week)</h4>
                <ul>{actionPlan?.quickWins?.map((a: string, i: number) => <li key={i}>{a}</li>)}</ul>
              </div>
              <div className="ap-section">
                <h4>Medium Term (1 to 3 Months)</h4>
                <ul>{actionPlan?.mediumTerm?.map((a: string, i: number) => <li key={i}>{a}</li>)}</ul>
              </div>
              <div className="ap-section">
                <h4>Strategic (3 to 6 Months)</h4>
                <ul>{actionPlan?.strategic?.map((a: string, i: number) => <li key={i}>{a}</li>)}</ul>
              </div>
            </div>
          </div>
        );

      case 'Creatives': {
        const creative = getAgent('creative-intelligence');
        const d = creative?.deliverables || {};
        return (
          <div className="tab-content" id="print-tab-creatives">
            <h3>Brand Identity</h3>
            {d.brandIdentity && (
              <div className="detail-card">
                <p><strong>Colors:</strong> {d.brandIdentity.colors}</p>
                <p><strong>Style:</strong> {d.brandIdentity.style}</p>
                <p><strong>Tone:</strong> {d.brandIdentity.tone}</p>
              </div>
            )}
            <h3>Hero Offer Assessment</h3>
            <p className="detail-text">{d.heroOfferAssessment}</p>
            <h3>Emotional Triggers</h3>
            <div className="tag-list">
              {d.emotionalTriggers?.map((t: string, i: number) => <span key={i} className="tag">{t}</span>)}
            </div>
            <h3>Creative Concepts — Meta</h3>
            {d.creativeConceptsMeta?.map((c: any, i: number) => (
              <div key={i} className="concept-card">
                <h4>Concept {i + 1}</h4>
                <p><strong>Hook:</strong> {c.hook}</p>
                <p><strong>Visual:</strong> {c.visualDirection}</p>
                <p><strong>Format:</strong> {c.format}</p>
                <p><strong>Angle:</strong> {c.emotionalAngle}</p>
                <p><strong>CTA:</strong> {c.cta}</p>
              </div>
            ))}
            <h3>Creative Concepts — TikTok</h3>
            {d.creativeConceptsTikTok?.map((c: any, i: number) => (
              <div key={i} className="concept-card">
                <h4>Concept {i + 1}</h4>
                <p><strong>Hook:</strong> {c.hook}</p>
                <p><strong>Visual:</strong> {c.visualDirection}</p>
                <p><strong>Format:</strong> {c.format}</p>
              </div>
            ))}
            {d.testingSequence && <><h3>Testing Sequence</h3><p className="detail-text">{d.testingSequence}</p></>}
            
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
               {renderSkillButton('ads-copy', 'Generate Ad Copy (Meta/Google/TikTok)')}
               {renderSkillButton('ads-creatives', 'Generate Deep Dive Creative Concepts')}
            </div>
          </div>
        );
      }

      case 'Audiences': {
        const audience = getAgent('audience-targeting');
        const d = audience?.deliverables || {};
        return (
          <div className="tab-content" id="print-tab-audiences">
            <h3>Ideal Customer Profile (ICP)</h3>
            {d.icp && (
              <div className="detail-card">
                <p><strong>Demographics:</strong> {d.icp.demographics}</p>
                <p><strong>Psychographics:</strong> {d.icp.psychographics}</p>
                <p><strong>Job to Be Done:</strong> {d.icp.jobToBeDone}</p>
              </div>
            )}
            <h3>Meta Audiences</h3>
            {d.metaAudiences && (
              <div className="audience-tiers">
                <div className="tier"><h4>Cold Audience</h4><ul>{d.metaAudiences.cold?.map((a: string, i: number) => <li key={i}>{a}</li>)}</ul></div>
                <div className="tier"><h4>Warm Audience</h4><ul>{d.metaAudiences.warm?.map((a: string, i: number) => <li key={i}>{a}</li>)}</ul></div>
                <div className="tier"><h4>Hot Audience</h4><ul>{d.metaAudiences.hot?.map((a: string, i: number) => <li key={i}>{a}</li>)}</ul></div>
              </div>
            )}
            <h3>Google Audiences</h3>
            {d.googleAudiences && (
              <div className="detail-card">
                <p><strong>Search Intent:</strong> {d.googleAudiences.searchIntent?.join(', ')}</p>
                <p><strong>In-Market:</strong> {d.googleAudiences.inMarket?.join(', ')}</p>
                <p><strong>Customer Match:</strong> {d.googleAudiences.customerMatch}</p>
              </div>
            )}
            <h3>Exclusions</h3>
            <div className="tag-list">{d.exclusions?.map((e: string, i: number) => <span key={i} className="tag tag-red">{e}</span>)}</div>
            <h3>Lookalike Seeds</h3>
            <div className="tag-list">{d.lookalikeSeeds?.map((s: string, i: number) => <span key={i} className="tag">{s}</span>)}</div>
            
            {renderSkillButton('ads-audiences', 'Generate Granular Audience Lists')}
          </div>
        );
      }

      case 'Platforms': {
        const platform = getAgent('platform-budget');
        const d = platform?.deliverables || {};
        return (
          <div className="tab-content" id="print-tab-platforms">
            <h3>Platform Ranking</h3>
            <div className="platform-table">
              <div className="pt-header">
                <span>Platform</span><span>Fit Score</span><span>Allocation</span><span>Primary KPI</span>
              </div>
              {d.platformRanking?.map((p: any, i: number) => (
                <div key={i} className="pt-row">
                  <span className="pt-platform">{p.platform}</span>
                  <span className="pt-score" style={{ color: getScoreColor(p.fitScore) }}>{p.fitScore}/100</span>
                  <span>{p.allocation}</span>
                  <span>{p.primaryKPI}</span>
                </div>
              ))}
            </div>
            <h3>Bidding Strategy</h3>
            {d.biddingStrategy?.map((b: any, i: number) => (
              <div key={i} className="detail-card">
                <p><strong>{b.platform}:</strong> {b.strategy}</p>
                <p className="detail-sub">{b.rationale}</p>
              </div>
            ))}
            <h3>Benchmarks</h3>
            {d.benchmarks && (
              <div className="benchmarks-grid">
                <div className="benchmark"><span className="bm-label">Expected CPA</span><span className="bm-value">{d.benchmarks.expectedCPA}</span></div>
                <div className="benchmark"><span className="bm-label">Expected ROAS</span><span className="bm-value">{d.benchmarks.expectedROAS}</span></div>
                <div className="benchmark"><span className="bm-label">Expected CTR</span><span className="bm-value">{d.benchmarks.expectedCTR}</span></div>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
               {renderSkillButton('ads-google', 'Deep Dive: Google Ads Strategy')}
               {renderSkillButton('ads-meta', 'Deep Dive: Meta Ads Strategy')}
               {renderSkillButton('ads-tiktok', 'Deep Dive: TikTok Ads Strategy')}
               {renderSkillButton('ads-linkedin', 'Deep Dive: LinkedIn B2B Strategy')}
            </div>
          </div>
        );
      }

      case 'Funnel': {
        const funnel = getAgent('funnel-conversion');
        const d = funnel?.deliverables || {};
        return (
          <div className="tab-content" id="print-tab-funnel">
            <h3>Landing Page Scores</h3>
            {d.landingPageScores && (
              <div className="lp-scores-grid">
                {Object.entries(d.landingPageScores).map(([key, val]: [string, any]) => (
                  <div key={key} className="lp-score-item">
                    <span className="lps-name">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <div className="lps-bar-track">
                      <div className="lps-bar-fill" style={{ width: `${val * 10}%`, backgroundColor: getScoreColor(val * 10) }}></div>
                    </div>
                    <span className="lps-val">{val}/10</span>
                  </div>
                ))}
              </div>
            )}
            <h3>Headline Rewrites</h3>
            <ul className="rewrite-list">{d.headlineRewrites?.map((h: string, i: number) => <li key={i}>"{h}"</li>)}</ul>
            <h3>CTA Rewrites</h3>
            <ul className="rewrite-list">{d.ctaRewrites?.map((c: string, i: number) => <li key={i}>"{c}"</li>)}</ul>
            <h3>Funnel Map</h3>
            {d.funnelMap && (
              <div className="funnel-map">
                {['tofu', 'mofu', 'bofu'].map(stage => (
                  <div key={stage} className="funnel-stage">
                    <h4>{stage.toUpperCase()}</h4>
                    <p><strong>Status:</strong> {d.funnelMap[stage]?.status}</p>
                    <ul>{d.funnelMap[stage]?.gaps?.map((g: string, i: number) => <li key={i}>{g}</li>)}</ul>
                  </div>
                ))}
              </div>
            )}
            <h3>Conversion Blockers</h3>
            <ul>{d.conversionBlockers?.map((b: string, i: number) => <li key={i}>{b}</li>)}</ul>
            
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
               {renderSkillButton('ads-landing', 'Run Deep Landing Page CRO Audit')}
               {renderSkillButton('ads-funnel', 'Generate Advanced Funnel Architectures')}
            </div>
          </div>
        );
      }

      case 'Competitors': {
        const comp = getAgent('competitive-intelligence');
        const d = comp?.deliverables || {};
        return (
          <div className="tab-content" id="print-tab-competitors">
            <h3>Direct Competitors</h3>
            {d.directCompetitors?.map((c: any, i: number) => (
              <div key={i} className="competitor-card">
                <div className="comp-header">
                  <strong>{c.name}</strong>
                  <span className={`spend-badge spend-${c.adSpendTier?.toLowerCase()}`}>{c.adSpendTier} Spend</span>
                </div>
                <p><strong>URL:</strong> {c.url}</p>
                <p><strong>Platforms:</strong> {c.platforms?.join(', ')}</p>
                <p><strong>Offer:</strong> {c.offer}</p>
                <p><strong>Creative:</strong> {c.creativeApproach}</p>
              </div>
            ))}
            <h3>Indirect Competitors</h3>
            {d.indirectCompetitors?.map((c: any, i: number) => (
              <div key={i} className="detail-card"><strong>{c.name}</strong> — {c.offer}</div>
            ))}
            <h3>Competitive Gaps</h3>
            {d.competitiveGaps && (
              <div className="gaps-grid">
                <div className="gap-section"><h4>Platform Gaps</h4><ul>{d.competitiveGaps.platformGaps?.map((g: string, i: number) => <li key={i}>{g}</li>)}</ul></div>
                <div className="gap-section"><h4>Offer Gaps</h4><ul>{d.competitiveGaps.offerGaps?.map((g: string, i: number) => <li key={i}>{g}</li>)}</ul></div>
                <div className="gap-section"><h4>Audience Gaps</h4><ul>{d.competitiveGaps.audienceGaps?.map((g: string, i: number) => <li key={i}>{g}</li>)}</ul></div>
              </div>
            )}
            <h3>Positioning Recommendation</h3>
            <p className="detail-text">{d.positioningRecommendation}</p>
            
            {renderSkillButton('ads-competitors', 'Deep Dive: Competitor Funnel Mapping')}
          </div>
        );
      }

      case 'Budget': {
        const platform = getAgent('platform-budget');
        const d = platform?.deliverables || {};
        return (
          <div className="tab-content" id="print-tab-budget">
            <h3>Budget Allocation</h3>
            {d.budgetAllocation && (
              <div className="budget-split">
                <div className="bs-item"><span className="bs-stage">TOFU (Awareness)</span><span className="bs-amount">{d.budgetAllocation.tofu}</span></div>
                <div className="bs-item"><span className="bs-stage">MOFU (Retargeting)</span><span className="bs-amount">{d.budgetAllocation.mofu}</span></div>
                <div className="bs-item"><span className="bs-stage">BOFU (Conversion)</span><span className="bs-amount">{d.budgetAllocation.bofu}</span></div>
              </div>
            )}
            <h3>Testing Budget</h3>
            <p className="detail-text">{d.testingBudget}</p>
            <h3>Scaling Thresholds</h3>
            <p className="detail-text">{d.scalingThresholds}</p>
            <h3>Platform Allocation</h3>
            {d.platformRanking?.map((p: any, i: number) => (
              <div key={i} className="alloc-bar">
                <div className="alloc-info">
                  <span>{p.platform}</span>
                  <span>{p.allocation}</span>
                </div>
                <div className="alloc-track">
                  <div className="alloc-fill" style={{ width: p.allocation || '20%' }}></div>
                </div>
                <p className="alloc-reason">{p.reason}</p>
              </div>
            ))}
            
            {renderSkillButton('ads-budget', 'Generate 90-Day Budget Projection')}
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="report-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="nav-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
              <ZieAdsLogo size={36} />
              <span className="brand-name">{agencyModel.name}</span>
            </div>
            <button 
              onClick={() => navigate('/clients')}
              style={{ 
                background: '#fff', 
                border: '1px solid #e2e8f0', 
                borderRadius: 20, 
                padding: '6px 16px', 
                fontSize: '0.85rem', 
                fontWeight: 600, 
                color: '#64748b', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s'
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = '#7B2FBE'; e.currentTarget.style.color = '#7B2FBE'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}
            >
              ← Back to Dashboard
            </button>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-login" onClick={() => setShowBrandingModal(true)}>
              White-Label Settings
            </button>
            <button className="pdf-cta" onClick={() => window.print()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download PDF Report
            </button>
          </div>
        </div>
      </nav>

      {/* White Label Modal */}
      {showBrandingModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 16, width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginBottom: 16, fontSize: '1.25rem', color: '#1e293b' }}>White-Label Settings</h2>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: 8 }}>Agency Name</label>
              <input type="text" value={agencyModel.name} onChange={(e) => setAgencyModel({ ...agencyModel, name: e.target.value })} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '1rem' }} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#475569', cursor: 'pointer' }}>
                <input type="checkbox" checked={agencyModel.includeWatermark} onChange={(e) => setAgencyModel({ ...agencyModel, includeWatermark: e.target.checked })} />
                Include "Powered by ZieAds" in PDF footer
              </label>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button style={{ padding: '8px 16px', borderRadius: 8, background: '#f1f5f9', border: 'none', color: '#475569', cursor: 'pointer', fontWeight: 600 }} onClick={() => setShowBrandingModal(false)}>Cancel</button>
              <button style={{ padding: '8px 16px', borderRadius: 8, background: '#7B2FBE', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600 }} onClick={() => setShowBrandingModal(false)}>Save Branding</button>
            </div>
          </div>
        </div>
      )}

      {/* Print-only White Label Header */}
      <div className="print-only-branding" style={{ display: 'none', padding: '24px 0', borderBottom: '2px solid #000', marginBottom: 32 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{agencyModel.name}</h1>
        <p style={{ color: '#475569' }}>Strategic Paid Ads Audit Report</p>
      </div>

      {/* Score Header (Zone A) */}
      <section className="score-header">
        <div className="sh-main">
          <div className="sh-score" style={{ borderColor: getScoreColor(overall) }}>
            <span className="sh-value" style={{ color: getScoreColor(overall) }}>{overall}</span>
            <span className="sh-max">/100</span>
          </div>
          <div className="sh-info">
            <h1>Paid Ads Readiness Score</h1>
            <p className="sh-business">{businessName} · {url}</p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
              <span className="sh-grade" style={{ backgroundColor: getScoreColor(overall) }}>Grade {grade}</span>
              <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 4, background: '#d1fae5', padding: '4px 8px', borderRadius: 12 }}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                +14 pts since last month
              </span>
            </div>
          </div>
          <div className="sh-history" style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>90-Day Trend</span>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 40 }}>
              {[42, 48, 55, overall].map((s, i) => (
                <div key={i} style={{ width: 24, height: `${s}%`, backgroundColor: getScoreColor(s), borderRadius: '4px 4px 0 0', opacity: i === 3 ? 1 : 0.4 }} title={`Score: ${s}`}></div>
              ))}
            </div>
          </div>
        </div>
        <div className="sh-dimensions">
          {dimensions?.map((d: any, i: number) => (
            <div key={i} className="sh-dim">
              <span className="sh-dim-score" style={{ color: getDimensionScoreColor(d.score) }}>{d.score}</span>
              <span className="sh-dim-name">{d.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Findings Panel (Zone B) */}
      <section className="findings-section">
        <div 
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', paddingBottom: findingsOpen ? 16 : 0 }}
          onClick={() => setFindingsOpen(!findingsOpen)}
        >
          <h2 style={{ margin: 0 }}>Critical Findings ({findings?.filter((f: any) => !checkedFindings.has(findings.indexOf(f))).length} remaining)</h2>
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" style={{ transform: findingsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: '#64748b' }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
        
        {findingsOpen && (
          <div className="findings-list">
            {findings?.map((f: any, i: number) => (
            <div key={i} className={`finding-row ${checkedFindings.has(i) ? 'finding-checked' : ''}`}>
              <label className="finding-check">
                <input
                  type="checkbox"
                  checked={checkedFindings.has(i)}
                  onChange={() => toggleFinding(i)}
                />
                <span className="checkmark"></span>
              </label>
              <span className={`finding-sev sev-${f.severity}`}>{f.severity.toUpperCase()}</span>
              <div className="finding-body">
                <strong>{f.title}</strong>
                <p>{f.impact}</p>
                <p className="finding-fix"><svg viewBox="0 0 24 24" fill="none" stroke="#00c9a7" strokeWidth="2" width="14" height="14" style={{display:'inline',verticalAlign:'middle',marginRight:4}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>{f.recommendation}</p>
              </div>
            </div>
          ))}
        </div>
        )}
      </section>

      {/* Tab bar */}
      {!isSkillAudit && (
        <div className="tab-nav">
          <div className="tab-nav-inner">
            {TABS.map(tab => (
              <button 
                key={tab} 
                className={activeTab === tab ? 'active' : ''} 
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="report-container">
        {isSkillAudit ? (
          <div style={{ padding: '0 24px 64px 24px', maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
               {/* Header */}
               <div style={{ padding: '32px 40px', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <div style={{ display: 'inline-block', padding: '4px 12px', background: 'rgba(123,47,190,0.2)', color: '#d8b4fe', borderRadius: 100, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 12, border: '1px solid rgba(123,47,190,0.3)' }}>
                          {auditType} Analysis
                        </div>
                        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800 }}>{businessName}</h1>
                        <p style={{ margin: '8px 0 0 0', color: '#94a3b8', fontSize: '1rem' }}>{url}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                       <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: 4 }}>Audit Date</div>
                       <div style={{ fontWeight: 600 }}>{new Date(generatedAt).toLocaleDateString()}</div>
                    </div>
                  </div>
               </div>

               {/* Skill Content */}
               <div style={{ padding: 40 }}>
                  {auditType === 'copy' ? (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                        {/* Analysis Section */}
                        {report.analysis && (
                          <div style={{ padding: 24, background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                              <span style={{ fontSize: '1.5rem' }}>🎯</span>
                              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#1e293b' }}>Strategic Analysis</h3>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                               <div>
                                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Copy Strategy</label>
                                  <p style={{ margin: 0, fontSize: '1rem', color: '#334155', lineHeight: 1.6 }}>{report.analysis.strategy}</p>
                               </div>
                               <div>
                                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Tone of Voice</label>
                                  <p style={{ margin: 0, fontSize: '1rem', color: '#334155', lineHeight: 1.6 }}>{report.analysis.toneOfVoice}</p>
                               </div>
                            </div>
                            <div style={{ marginTop: 24, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                              {report.analysis.keySellingPoints?.map((sp: string, i: number) => (
                                <span key={i} style={{ fontSize: '0.85rem', background: '#fff', padding: '6px 14px', borderRadius: 100, color: '#475569', border: '1px solid #e2e8f0', fontWeight: 600 }}>
                                  ✓ {sp}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Platform Tabs & Content */}
                        <div>
                          <div style={{ display: 'flex', gap: 12, marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 1 }}>
                            {['metaAds', 'googleAds', 'tiktokAds', 'linkedinAds'].map(tab => (
                              <button
                                key={tab}
                                onClick={() => setCopyActiveTab(tab)}
                                style={{
                                  padding: '12px 24px',
                                  background: 'transparent',
                                  border: 'none',
                                  borderBottom: copyActiveTab === tab ? `3px solid #7B2FBE` : '3px solid transparent',
                                  color: copyActiveTab === tab ? '#7B2FBE' : '#64748b',
                                  fontSize: '0.95rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  marginBottom: -1,
                                  transition: 'all 0.2s'
                                }}
                              >
                                {tab.replace('Ads', '').charAt(0).toUpperCase() + tab.replace('Ads', '').slice(1)}
                              </button>
                            ))}
                          </div>

                          <div style={{ padding: 24, background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                            {copyActiveTab === 'metaAds' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>Primary Text (Long Body)</label>
                                  <div style={{ padding: 16, background: '#f8fafc', borderRadius: 8, fontSize: '1rem', color: '#334155', whiteSpace: 'pre-wrap', border: '1px solid #e2e8f0' }}>
                                    {report.deliverables?.metaAds?.longBody || report.deliverables?.metaAds?.primaryTexts?.[0]}
                                  </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>Headlines</label>
                                    {report.deliverables?.metaAds?.headlines?.map((h: string, i: number) => (
                                      <div key={i} style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 8, fontSize: '0.9rem', color: '#334155', marginBottom: 8, border: '1px solid #e2e8f0' }}>{h}</div>
                                    ))}
                                  </div>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>Short Body</label>
                                    <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 8, fontSize: '0.9rem', color: '#334155', border: '1px solid #e2e8f0' }}>{report.deliverables?.metaAds?.shortBody}</div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {copyActiveTab === 'googleAds' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>Search Headlines (15)</label>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    {report.deliverables?.googleAds?.headlines?.map((h: string, i: number) => (
                                      <div key={i} style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 8, fontSize: '0.9rem', color: '#334155', border: '1px solid #e2e8f0' }}>{h}</div>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>Search Descriptions (4)</label>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {report.deliverables?.googleAds?.descriptions?.map((d: string, i: number) => (
                                      <div key={i} style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 8, fontSize: '0.9rem', color: '#334155', border: '1px solid #e2e8f0' }}>{d}</div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {copyActiveTab === 'tiktokAds' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                {report.deliverables?.tiktokAds?.scriptOutlines?.map((s: any, i: number) => (
                                  <div key={i} style={{ padding: 20, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                                    <div style={{ fontWeight: 800, marginBottom: 12, color: '#7B2FBE', fontSize: '1rem' }}>Script Option {i + 1}</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                      <p style={{ margin: 0, fontSize: '0.95rem' }}><strong>Hook:</strong> {s.hook}</p>
                                      <p style={{ margin: 0, fontSize: '0.95rem' }}><strong>Body:</strong> {s.body}</p>
                                      <p style={{ margin: 0, fontSize: '0.95rem' }}><strong>CTA:</strong> {s.cta}</p>
                                    </div>
                                  </div>
                                ))}
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>Captions</label>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                    {report.deliverables?.tiktokAds?.captions?.map((c: string, i: number) => (
                                      <div key={i} style={{ padding: '8px 16px', background: '#f8fafc', borderRadius: 100, fontSize: '0.9rem', color: '#334155', border: '1px solid #e2e8f0' }}>{c}</div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {copyActiveTab === 'linkedinAds' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                 {report.deliverables?.linkedinAds?.sponsoredContent?.map((c: any, i: number) => (
                                   <div key={i} style={{ padding: 20, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                                     <div style={{ fontWeight: 800, marginBottom: 12, color: '#7B2FBE', fontSize: '1rem' }}>Sponsored Content {i + 1}</div>
                                     <p style={{ margin: '0 0 10px 0', fontSize: '0.95rem' }}><strong>Intro:</strong> {c.intro}</p>
                                     <p style={{ margin: 0, fontSize: '0.95rem' }}><strong>Headline:</strong> {c.headline}</p>
                                   </div>
                                 ))}
                                 {report.deliverables?.linkedinAds?.messageAds?.map((m: any, i: number) => (
                                   <div key={i} style={{ padding: 20, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                                     <div style={{ fontWeight: 800, marginBottom: 12, color: '#7B2FBE', fontSize: '1rem' }}>Direct Message {i + 1}</div>
                                     <p style={{ margin: '0 0 10px 0', fontSize: '0.95rem' }}><strong>Subject:</strong> {m.subject}</p>
                                     <p style={{ margin: 0, fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>{m.body}</p>
                                   </div>
                                 ))}
                              </div>
                            )}
                          </div>
                        </div>
                     </div>
                  ) : (
                    <div>
                        <h3 style={{ textTransform: 'capitalize' }}>{auditType} Deliverables</h3>
                        <pre style={{ padding: 24, background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'auto', whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                          {JSON.stringify(report.deliverables || report, null, 2)}
                        </pre>
                    </div>
                  )}
               </div>
            </div>
          </div>
        ) : (
          renderTabContent()
        )}
      </main>
    </div>
  );
}
