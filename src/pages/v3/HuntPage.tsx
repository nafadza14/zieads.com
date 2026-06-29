import { useState, useEffect } from 'react';
import V3Layout from '../../components/v3/V3Layout';
import { supabase } from '../../lib/supabaseClient';
import { useDemoMode } from '../../lib/demoStore';
import { sampleCompetitor } from '../../data/sample-data';
import { 
  Target, 
  Plus, 
  RefreshCw, 
  Trash2, 
  ExternalLink, 
  Shield, 
  Zap, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';

const P = 'var(--primary)';
const G = 'var(--text-muted)';
const B = 'var(--border)';

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
          competitor_name: sampleCompetitor.competitor_name,
          competitor_url: sampleCompetitor.competitor_url,
          latest_audit_score: sampleCompetitor.latest_audit_score,
          last_audited_at: sampleCompetitor.last_audited_at,
          audit_history: sampleCompetitor.audit_history
        }
      ]);
      setLoading(false);
      return;
    }

    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/v3/hunt/competitors', { headers });
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
      const res = await fetch('/api/v3/hunt/competitors', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          competitorUrl: formattedUrl,
          competitorName: name.trim()
        })
      });
      const j = await res.json();
      if (j.success) {
        setUrl('');
        setName('');
        await fetchCompetitors();
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
      const res = await fetch('/api/v3/hunt/audit', {
        method: 'POST',
        headers,
        body: JSON.stringify({ id })
      });
      const j = await res.json();
      if (j.success) {
        await fetchCompetitors();
      }
    } catch (err) {
      alert("Failed to run competitor audit.");
    } finally {
      setAuditingId(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981'; // Green
    if (score >= 65) return '#F59E0B'; // Amber
    return '#EF4444'; // Red
  };

  return (
    <V3Layout>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${B}`, padding: '20px 40px', display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: '1.25rem', margin: 0 }}>Competitor Hunt</h1>
          <p style={{ fontSize: '0.78rem', color: G, margin: '2px 0 0' }}>Monitor and audit your competitors' advertising performance autonomously.</p>
        </div>
      </div>

      {/* Main Body */}
      <div style={{ padding: isMobile ? 20 : 40, overflowY: 'auto', flex: 1, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '320px 1fr', gap: 32, alignItems: 'start' }}>
        
        {/* Left Form Panel */}
        <div style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 8, padding: 24, boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '0.92rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} style={{ color: P }} /> Track New Competitor
          </h3>

          <form onSubmit={handleAddCompetitor} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: 6 }}>Competitor Name</label>
              <input 
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Competitor Brand"
                required
                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${B}`, borderRadius: 6, fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: 6 }}>Website URL</label>
              <input 
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="competitor.com"
                required
                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${B}`, borderRadius: 6, fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <button 
              type="submit" 
              disabled={addingCompetitor}
              style={{ background: P, color: '#fff', border: 'none', padding: '10px 0', borderRadius: 6, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', marginTop: 8 }}
            >
              {addingCompetitor ? 'Adding...' : 'Track Site'}
            </button>
          </form>
        </div>

        {/* Right List Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: G }}>Loading tracked competitors...</div>
          ) : competitors.length === 0 ? (
            <div style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 8, padding: 40, textAlign: 'center', color: G }}>
              <Target size={36} style={{ color: G, marginBottom: 12, margin: '0 auto' }} />
              <p style={{ margin: 0, fontSize: '0.88rem' }}>No competitors tracked yet. Add one on the left to start monitoring!</p>
            </div>
          ) : (
            competitors.map(comp => {
              const isExpanded = expandedId === comp.id;
              const hasScore = comp.latest_audit_score !== null;
              const isAuditing = auditingId === comp.id;
              const latestAuditDetails = comp.audit_history?.[comp.audit_history.length - 1];

              return (
                <div key={comp.id} style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 8, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                  
                  {/* Competitor Summary Header */}
                  <div style={{ padding: '20px 24px', display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      
                      {/* Circular/Pill Score Badge */}
                      <div 
                        style={{ 
                          width: 48, 
                          height: 48, 
                          borderRadius: '50%', 
                          background: hasScore ? `${getScoreColor(comp.latest_audit_score)}1F` : 'var(--bg-soft)', 
                          border: `2px solid ${hasScore ? getScoreColor(comp.latest_audit_score) : B}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '1rem',
                          fontFamily: 'monospace',
                          color: hasScore ? getScoreColor(comp.latest_audit_score) : G
                        }}
                      >
                        {hasScore ? comp.latest_audit_score : '--'}
                      </div>

                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{comp.competitor_name}</div>
                        <a 
                          href={comp.competitor_url} 
                          target="_blank" 
                          rel="noreferrer"
                          style={{ fontSize: '0.75rem', color: P, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', marginTop: 2 }}
                        >
                          {comp.competitor_url} <ExternalLink size={10} />
                        </a>
                      </div>

                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <button 
                        onClick={() => handleAudit(comp.id)}
                        disabled={isAuditing}
                        style={{ border: `1px solid ${B}`, background: '#fff', padding: '8px 12px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                      >
                        <RefreshCw size={12} className={isAuditing ? 'spin' : ''} /> 
                        {isAuditing ? 'Scanning...' : 'Audit Now'}
                      </button>
                      <button 
                        onClick={() => setExpandedId(isExpanded ? null : comp.id)}
                        style={{ border: 'none', background: 'none', color: G, padding: 6, cursor: 'pointer' }}
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>

                  </div>

                  {/* Expanded Audit Report Details panel */}
                  {isExpanded && (
                    <div style={{ borderTop: `1px solid ${B}`, background: 'var(--bg-soft)', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                      {!hasScore ? (
                        <div style={{ textAlign: 'center', color: G, fontSize: '0.8rem' }}>No audit history available. Click "Audit Now" to scan this competitor's readiness.</div>
                      ) : (
                        <>
                          {/* Dimensions grid */}
                          <div>
                            <h4 style={{ margin: '0 0 12px', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: G }}>Readiness breakdown</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                              {Object.entries(latestAuditDetails?.report?.dimensions || {}).map(([dim, val]: any) => (
                                <div key={dim} style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 6, padding: '10px 14px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 4 }}>
                                    <span style={{ fontWeight: 600 }}>{dim}</span>
                                    <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{val}</span>
                                  </div>
                                  <div style={{ width: '100%', height: 4, background: 'var(--bg-surface)', borderRadius: 2 }}>
                                    <div style={{ width: `${val}%`, height: '100%', background: getScoreColor(val), borderRadius: 2 }}></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Key competitor finding alerts */}
                          <div>
                            <h4 style={{ margin: '0 0 12px', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: G }}>Key Findings & Gaps</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                              {(latestAuditDetails?.report?.findings || []).slice(0, 3).map((f: any, idx: number) => (
                                <div key={idx} style={{ display: 'flex', gap: 10, background: '#fff', border: `1px solid ${B}`, borderRadius: 6, padding: 12, fontSize: '0.78rem' }}>
                                  <Shield size={14} style={{ color: '#EF4444', flexShrink: 0, marginTop: 2 }} />
                                  <div>
                                    <div style={{ fontWeight: 700, marginBottom: 2 }}>{f.title || f}</div>
                                    <div style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>{f.impact || f.recommendation}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

      </div>
    </V3Layout>
  );
}
