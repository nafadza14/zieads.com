import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import V3Layout from '../../components/v3/V3Layout';
import { supabase } from '../../lib/supabaseClient';
import { useDemoMode } from '../../lib/demoStore';
import { sampleConnections, sampleDailyBriefing } from '../../data/sample-data';
import { 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  ArrowRight, 
  Flame, 
  Compass, 
  Link2 
} from 'lucide-react';

const P = 'var(--primary)';
const G = 'var(--text-muted)';
const D = 'var(--text)';
const B = 'var(--border)';

export default function AnalystPage() {
  const navigate = useNavigate();
  const demo = useDemoMode();
  const [briefing, setBriefing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<any[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const getAuthHeaders = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    return token
      ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };
  };

  const loadData = async () => {
    if (demo.isActive) {
      setUserProfile({ business_name: "Acme Coffee Co", primary_url: "https://acmecoffee.com", primary_goal: "Increase sales & reach" });
      setConnections(sampleConnections);
      setActiveAlerts([]);
      setBriefing(sampleDailyBriefing);
      setLoading(false);
      return;
    }

    try {
      const headers = await getAuthHeaders();
      
      // Fetch profile
      const profRes = await fetch('/api/profile', { headers });
      const profJ = await profRes.json();
      if (profJ.success) setUserProfile(profJ.data);

      // Fetch connections
      const connRes = await fetch('/api/v3/connections', { headers });
      const connJ = await connRes.json();
      if (connJ.success) setConnections(connJ.data);

      // Fetch alerts
      const alertsRes = await fetch('/api/v3/alerts', { headers });
      const alertsJ = await alertsRes.json();
      if (alertsJ.success) setActiveAlerts(alertsJ.data);

      // Fetch daily briefing
      if (connJ.data && connJ.data.length > 0) {
        const briefRes = await fetch('/api/v3/analyst/briefing', { headers });
        const briefJ = await briefRes.json();
        if (briefJ.success) setBriefing(briefJ.data);
      }
    } catch (err) {
      console.error("Failed to load briefing page data:", err);
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
    loadData();
  }, [demo.isActive]);

  const triggerOnDemandBriefing = async () => {
    if (demo.isActive) {
      alert("Daily briefing is pre-populated in Demo Mode!");
      return;
    }
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/v3/analyst/briefing', {
        method: 'POST', // triggers re-generate
        headers
      });
      const j = await res.json();
      if (j.success) setBriefing(j.data);
    } catch (err) {
      alert("Failed to compile today's briefing.");
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgeAlert = async (id: string) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/v3/alerts/acknowledge', {
        method: 'POST',
        headers,
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setActiveAlerts(prev => prev.filter(a => a.id !== id));
      }
    } catch (err) {
      console.error("Failed to dismiss alert:", err);
    }
  };

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  // Handle Empty State
  const hasConnections = connections.length > 0;

  return (
    <V3Layout>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${B}`, padding: '20px 40px', display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: '1.25rem', margin: 0 }}>AI Analyst Daily</h1>
          <p style={{ fontSize: '0.78rem', color: G, margin: '2px 0 0' }}>{todayStr}</p>
        </div>
        {hasConnections && (
          <button 
            onClick={triggerOnDemandBriefing}
            disabled={loading}
            style={{ background: 'var(--primary-bg)', color: P, border: 'none', padding: '8px 16px', borderRadius: 6, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Sparkles size={14} /> Refresh Briefing
          </button>
        )}
      </div>

      {/* Main Container */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 40 }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: G, marginTop: 40 }}>Analyzing your channels and compiling daily insights...</div>
        ) : !hasConnections ? (
          <div style={{ maxWidth: 540, margin: '60px auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Link2 size={28} style={{ color: P }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 8px' }}>Connect Your Marketing Channels</h2>
              <p style={{ fontSize: '0.85rem', color: G, margin: 0 }}>To generate your daily dashboard intelligence, you need to connect at least one organic social account or upload paid advertising performance spreadsheets.</p>
            </div>
            <button 
              onClick={() => navigate('/connections')}
              style={{ background: P, color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 6, fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Go to Connections Manager
            </button>
          </div>
        ) : !briefing ? (
          <div style={{ maxWidth: 540, margin: '60px auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={28} style={{ color: P }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 8px' }}>Your first briefing is ready to compile!</h2>
              <p style={{ fontSize: '0.85rem', color: G, margin: 0 }}>We have connected your accounts and analyzed initial baselines. Click below to generate your daily marketing report.</p>
            </div>
            <button 
              onClick={triggerOnDemandBriefing}
              style={{ background: P, color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 6, fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Compile Briefing
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', gap: 32, alignItems: 'start' }}>
            
            {/* Left Content Area */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              
              {/* Daily Headline */}
              <div style={{ background: 'linear-gradient(135deg, var(--primary-bg) 0%, rgba(255,255,255,1) 100%)', border: `1px solid ${B}`, borderRadius: 10, padding: 24, boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', fontWeight: 700, color: P, textTransform: 'uppercase', marginBottom: 8 }}>
                  <Sparkles size={14} /> Morning Briefing Summary
                </div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, lineHeight: 1.4 }}>
                  "{briefing.headline}"
                </h2>
              </div>

              {/* Wins & Concerns */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 24 }}>
                
                {/* Wins */}
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <TrendingUp size={16} style={{ color: '#10B981' }} /> Key Wins (Yesterday)
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {(briefing.wins || []).length > 0 ? (
                      briefing.wins.map((win: any, idx: number) => (
                        <div key={idx} style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 8, padding: 16 }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>{win.title}</div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10B981', fontFamily: 'monospace', marginBottom: 4 }}>{win.value}</div>
                          <div style={{ fontSize: '0.73rem', color: G }}>{win.context}</div>
                        </div>
                      ))
                    ) : (
                      <div style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 8, padding: 20, textAlign: 'center', color: G, fontSize: '0.8rem' }}>No significant wins detected yesterday.</div>
                    )}
                  </div>
                </div>

                {/* Concerns / Anomalies */}
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <AlertTriangle size={16} style={{ color: '#F59E0B' }} /> Concerns & Anomalies
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {(briefing.concerns || []).length > 0 ? (
                      briefing.concerns.map((con: any, idx: number) => {
                        const isHigh = con.severity === 'high' || con.severity === 'critical';
                        return (
                          <div key={idx} style={{ background: '#fff', border: `1px solid ${isHigh ? '#FEE2E2' : B}`, borderRadius: 8, padding: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{con.title}</span>
                              <span style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', padding: '2px 6px', borderRadius: 4, background: isHigh ? '#EF4444' : '#F59E0B', color: '#fff' }}>
                                {con.severity}
                              </span>
                            </div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: isHigh ? '#EF4444' : '#F59E0B', fontFamily: 'monospace', marginBottom: 4 }}>{con.value}</div>
                            <div style={{ fontSize: '0.73rem', color: G }}>{con.context || con.message}</div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 8, padding: 20, textAlign: 'center', color: G, fontSize: '0.8rem' }}>All metrics are currently performing stable.</div>
                    )}
                  </div>
                </div>

              </div>

              {/* Today Actions */}
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Flame size={16} style={{ color: '#F59E0B' }} /> Recommended Actions for Today
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(briefing.today_actions || []).map((act: any, idx: number) => {
                    const isHighImpact = act.estimated_impact === 'High';
                    return (
                      <div key={idx} style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 8, padding: 20, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                          {act.rank || idx + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 4 }}>{act.action}</div>
                          <div style={{ fontSize: '0.78rem', color: G, lineHeight: 1.4 }}>{act.reasoning}</div>
                          
                          <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                            <span style={{ fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                              Impact: <strong style={{ color: isHighImpact ? '#10B981' : '#6366F1' }}>{act.estimated_impact}</strong>
                            </span>
                            <span style={{ fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                              Effort: <strong style={{ color: '#71717A' }}>{act.effort}</strong>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Suggested Deep Dives */}
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Compass size={16} style={{ color: '#8B5CF6' }} /> Suggested Deep Analysis Dives
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  {(briefing.suggested_deep_dives || []).map((dive: any, idx: number) => (
                    <div key={idx} style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 8, padding: 20, display: 'flex', flexDirection: 'column', justifySelf: 'stretch', gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 4 }}>{dive.v02_mode_name}</div>
                        <p style={{ fontSize: '0.78rem', color: G, margin: 0, lineHeight: 1.4 }}>{dive.reasoning_for_suggestion}</p>
                      </div>
                      
                      <button 
                        onClick={() => navigate('/clients', { state: { defaultTab: 'skills' } })}
                        style={{ marginTop: 'auto', background: 'none', border: 'none', padding: 0, color: P, fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        Run Deep Dive <ArrowRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Sidebar Widgets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              {/* Account sync state */}
              <div style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 8, padding: 20 }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: G }}>Connected status</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {connections.map(conn => (
                    <div key={conn.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 500 }}>{conn.platform.toUpperCase().replace('_', ' ')}</span>
                      <span style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 4, color: '#10B981' }}>
                        <CheckCircle size={10} /> Active
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active notifications */}
              {activeAlerts.length > 0 && (
                <div style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 8, padding: 20 }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: G }}>Active Alerts</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {activeAlerts.map(alert => (
                      <div key={alert.id} style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 10px', background: 'var(--bg-soft)', borderRadius: 6 }}>
                        <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>{alert.alert_type.toUpperCase().replace('_', ' ')}</span>
                          <button onClick={() => handleAcknowledgeAlert(alert.id)} style={{ border: 'none', background: 'none', color: G, fontSize: '0.7rem', cursor: 'pointer' }}>Dismiss</button>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{alert.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>
        )}
      </div>
    </V3Layout>
  );
}
