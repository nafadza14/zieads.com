import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import V3Layout from '../../components/v3/V3Layout';
import { supabase } from '../../lib/supabaseClient';
import { useDemoMode } from '../../lib/demoStore';
import { sampleConnections, sampleDailyBriefing } from '../../data/sample-data';
import {
  Card,
  CardTitle,
  CountUp,
  EmptyState,
  GhostButton,
  GrowBar,
  LoadingState,
  Orb,
  PageBody,
  PageHeader,
  Pill,
  Skeleton,
  TextRollButton,
  WordReveal,
} from '../../components/v3/ui';
import SocialIcon from '../../components/v3/SocialIcon';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Check,
  ArrowRight,
  Flame,
  Compass,
  Link2,
  X,
  MessageSquare,
  Search,
  Bell,
  Radio,
} from 'lucide-react';
import './analyst.css';

/** Animate the numeric part of a metric string like "6.3%", "+148", "$0.51", "2.8x". */
function MetricValue({ value }: { value: any }) {
  const str = value === null || value === undefined ? '' : String(value);
  const m = str.match(/^([^\d-]*)(-?[\d,]*\.?\d+)(.*)$/);
  if (!m) return <span className="zd-num">{str}</span>;
  const num = parseFloat(m[2].replace(/,/g, ''));
  if (!Number.isFinite(num)) return <span className="zd-num">{str}</span>;
  const dot = m[2].indexOf('.');
  const decimals = dot >= 0 ? m[2].length - dot - 1 : 0;
  return <CountUp value={num} decimals={decimals} prefix={m[1]} suffix={m[3]} format={m[2].includes(',')} />;
}

const prettyKey = (s: string) => (s || '').replace(/_/g, ' ');

export default function AnalystPage() {
  const navigate = useNavigate();
  const demo = useDemoMode();
  const [briefing, setBriefing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<any[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [firstStepsDismissed, setFirstStepsDismissed] = useState(() => {
    return localStorage.getItem('zieads_first_steps_dismissed') === 'true';
  });

  const handleDismissFirstSteps = () => {
    localStorage.setItem('zieads_first_steps_dismissed', 'true');
    setFirstStepsDismissed(true);
  };

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
      if (j.success && j.data) {
        setBriefing(j.data);
      } else {
        alert(j.error || "Briefing generation temporarily unavailable. Please try again in a few minutes.");
      }
    } catch (err: any) {
      alert("Failed to compile briefing: " + (err.message || "Unknown error"));
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

  const steps = [
    {
      key: 'connect',
      icon: <Link2 size={17} />,
      title: 'Connect your accounts',
      body: 'Link Instagram, TikTok and LinkedIn so the agent can start watching.',
      done: hasConnections,
      primary: true,
      action: <TextRollButton text="Connect" onClick={() => navigate('/connections')} />,
    },
    {
      key: 'audit',
      icon: <Search size={17} />,
      title: 'Try a free audit',
      body: "Paste any URL and see the agent's readiness score in under 3 minutes.",
      done: false,
      primary: false,
      action: <GhostButton onClick={() => navigate('/clients', { state: { defaultTab: 'skills' } })}>Run audit</GhostButton>,
    },
    {
      key: 'agent',
      icon: <MessageSquare size={17} />,
      title: 'Meet the agent',
      body: 'Ask a question to see how it reasons from your setup.',
      done: false,
      primary: false,
      action: <GhostButton onClick={() => navigate('/agent')}>Open agent</GhostButton>,
    },
  ];
  const doneCount = steps.filter((st) => st.done).length;

  const alertTone = (sev?: string): 'bad' | 'warn' | 'good' => {
    const v = (sev || '').toLowerCase();
    if (v === 'high' || v === 'critical') return 'bad';
    if (v === 'low' || v === 'info' || v === 'positive') return 'good';
    return 'warn';
  };

  return (
    <V3Layout>
      <PageHeader
        number="01"
        label="AI Analyst"
        title="Your daily marketing briefing."
        subtitle={todayStr}
        actions={
          hasConnections ? (
            <TextRollButton text={loading ? 'Compiling' : 'Refresh briefing'} onClick={triggerOnDemandBriefing} disabled={loading} />
          ) : undefined
        }
      />

      <PageBody>
        {/* First Steps Checklist */}
        {!firstStepsDismissed && (
          <Card className="zan-check" glass>
            <div className="zan-check-head">
              <div>
                <span className="zd-eyebrow tone-accent">Get started</span>
                <h2>First steps checklist</h2>
              </div>
              <button className="zd-icon-btn" onClick={handleDismissFirstSteps} aria-label="Dismiss checklist">
                <X />
              </button>
            </div>
            <div className="zan-progress">
              <GrowBar value={(doneCount / steps.length) * 100} />
              <span className="zan-progress-label">
                <CountUp value={doneCount} /> of {steps.length} done
              </span>
            </div>
            <div className="zd-grid-3">
              {steps.map((st) => (
                <Card
                  key={st.key}
                  hover
                  padding={18}
                  className={`zan-step ${st.done ? 'is-done' : st.primary ? 'is-primary' : ''}`}
                >
                  {st.done ? (
                    <span className="zan-step-badge zan-check-pop">
                      <Pill tone="accent">
                        <Check size={11} /> Done
                      </Pill>
                    </span>
                  ) : st.primary ? (
                    <span className="zan-step-badge">
                      <Pill tone="accent">Start here</Pill>
                    </span>
                  ) : null}
                  <div className="zan-step-top">
                    <span className="zan-step-icon">{st.done ? <Check size={17} /> : st.icon}</span>
                    <div>
                      <h3>{st.title}</h3>
                      <p>{st.body}</p>
                    </div>
                  </div>
                  <div className="zan-step-actions">{st.action}</div>
                </Card>
              ))}
            </div>
          </Card>
        )}

        {loading ? (
          <Card glass className="zan-hero">
            <div className="zd-aura" aria-hidden="true">
              <span />
              <span />
            </div>
            <div className="zan-hero-inner zan-loading">
              <div className="zan-hero-top">
                <Orb size={40} active />
                <LoadingState inline text="Analyzing your channels and compiling daily insights" />
              </div>
              <Skeleton height={26} width="85%" />
              <Skeleton height={26} width="60%" />
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <Skeleton height={34} width={110} radius={999} />
                <Skeleton height={34} width={110} radius={999} />
                <Skeleton height={34} width={110} radius={999} />
              </div>
            </div>
          </Card>
        ) : !hasConnections ? (
          <EmptyState
            icon={<Link2 size={22} />}
            title="Connect your marketing channels"
            body="To generate your daily intelligence, connect at least one organic social account or upload paid advertising performance spreadsheets."
            action={<TextRollButton text="Go to Connections" onClick={() => navigate('/connections')} />}
          />
        ) : !briefing ? (
          <EmptyState
            icon={<Sparkles size={22} />}
            title="Your first briefing is ready to compile"
            body="Your accounts are connected and initial baselines are analyzed. Generate your daily marketing report below."
            action={<TextRollButton text="Compile briefing" onClick={triggerOnDemandBriefing} />}
          />
        ) : (
          <div className="zan-layout" style={{ gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : 'minmax(0, 1fr) 300px' }}>
            {/* Left content */}
            <div className="zan-main">
              {/* Daily headline hero */}
              <Card glass className="zan-hero">
                <div className="zd-aura" aria-hidden="true">
                  <span />
                  <span />
                </div>
                <div className="zan-hero-inner">
                  <div className="zan-hero-top">
                    <Orb size={40} active={loading} />
                    <div>
                      <div className="zd-eyebrow tone-accent">Morning briefing</div>
                      <div className="zd-text-sm zd-muted">{userProfile?.business_name || 'Your business'}</div>
                    </div>
                  </div>
                  <WordRevealQuote text={`"${briefing.headline}"`} />
                  <div className="zan-hero-stats">
                    <span className="zan-hero-stat">
                      <strong><CountUp value={(briefing.wins || []).length} /></strong> wins
                    </span>
                    <span className="zan-hero-stat">
                      <strong><CountUp value={(briefing.concerns || []).length} /></strong> concerns
                    </span>
                    <span className="zan-hero-stat">
                      <strong><CountUp value={(briefing.today_actions || []).length} /></strong> actions today
                    </span>
                  </div>
                </div>
              </Card>

              {/* Wins & concerns */}
              <div className="zd-grid-2" style={{ alignItems: 'start' }}>
                <Card>
                  <CardTitle icon={<TrendingUp />} sub="Yesterday">
                    Key wins
                  </CardTitle>
                  {(briefing.wins || []).length > 0 ? (
                    briefing.wins.map((win: any, idx: number) => (
                      <div key={idx} className="zan-metric zd-slide-in" style={{ animationDelay: `${idx * 70}ms` }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="zan-metric-title">{win.title}</div>
                          <div className="zan-metric-value tone-good">
                            <MetricValue value={win.value} />
                          </div>
                          <div className="zan-metric-ctx">{win.context}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="zd-text-sm zd-muted">No significant wins detected yesterday.</p>
                  )}
                </Card>

                <Card>
                  <CardTitle icon={<AlertTriangle />} sub="Things to watch">
                    Concerns and anomalies
                  </CardTitle>
                  {(briefing.concerns || []).length > 0 ? (
                    briefing.concerns.map((con: any, idx: number) => {
                      const isHigh = con.severity === 'high' || con.severity === 'critical';
                      return (
                        <div
                          key={idx}
                          className={`zan-metric zd-slide-in ${isHigh ? 'is-bad' : ''}`}
                          style={{ animationDelay: `${idx * 70}ms` }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                              <span className="zan-metric-title">{con.title}</span>
                              <Pill tone={isHigh ? 'bad' : 'warn'}>{con.severity}</Pill>
                            </div>
                            <div className="zan-metric-value" style={{ color: isHigh ? 'var(--zd-bad)' : 'var(--zd-warn)' }}>
                              <MetricValue value={con.value} />
                            </div>
                            <div className="zan-metric-ctx">{con.context || con.message}</div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="zd-text-sm zd-muted">All metrics are currently performing stable.</p>
                  )}
                </Card>
              </div>

              {/* Today actions */}
              <Card>
                <CardTitle icon={<Flame />} sub="Ranked by the analyst">
                  Recommended actions for today
                </CardTitle>
                <div>
                  {(briefing.today_actions || []).map((act: any, idx: number) => {
                    const isHighImpact = act.estimated_impact === 'High';
                    return (
                      <div key={idx} className="zd-row zan-action zd-slide-in" style={{ animationDelay: `${idx * 60}ms` }}>
                        <span className="zd-rank">{act.rank || idx + 1}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.45 }}>{act.action}</div>
                          <div className="zd-muted" style={{ fontSize: 12.5, lineHeight: 1.5, marginTop: 3 }}>{act.reasoning}</div>
                          <div className="zan-action-meta">
                            <Pill tone={isHighImpact ? 'good' : 'accent'}>Impact: {act.estimated_impact}</Pill>
                            <Pill tone="neutral">Effort: {act.effort}</Pill>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Suggested deep dives */}
              <div>
                <div className="zd-eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <Compass size={13} /> Suggested deep analysis dives
                </div>
                <div className="zd-grid-2">
                  {(briefing.suggested_deep_dives || []).map((dive: any, idx: number) => (
                    <Card key={idx} hover padding={20} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 650, fontSize: 14.5, marginBottom: 4 }}>{dive.v02_mode_name}</div>
                        <p className="zd-muted" style={{ fontSize: 12.5, margin: 0, lineHeight: 1.5 }}>{dive.reasoning_for_suggestion}</p>
                      </div>
                      <button className="zan-link" onClick={() => navigate('/clients', { state: { defaultTab: 'skills' } })}>
                        Run deep dive <ArrowRight size={14} />
                      </button>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            {/* Right sidebar */}
            <div className="zan-side">
              <Card glass padding={20}>
                <CardTitle icon={<Radio />} sub={<><CountUp value={connections.length} /> connected</>}>
                  Connection status
                </CardTitle>
                <div>
                  {connections.map((conn, idx) => (
                    <div key={conn.id} className="zan-conn zd-slide-in" style={{ animationDelay: `${idx * 60}ms` }}>
                      <SocialIcon platform={conn.platform} size={20} />
                      <span className="zan-conn-name">{prettyKey(conn.platform)}</span>
                      <span className="zan-conn-state">
                        <span className="zd-live" /> Active
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              {activeAlerts.length > 0 && (
                <Card padding={20}>
                  <CardTitle icon={<Bell />} sub={<><CountUp value={activeAlerts.length} /> need attention</>}>
                    Active alerts
                  </CardTitle>
                  <div>
                    {activeAlerts.map((alert, idx) => (
                      <div key={alert.id} className="zan-alert zd-slide-in" style={{ animationDelay: `${idx * 70}ms` }}>
                        <div className="zan-alert-top">
                          <Pill tone={alertTone(alert.severity)}>{prettyKey(alert.alert_type)}</Pill>
                          <button className="zan-dismiss" onClick={() => handleAcknowledgeAlert(alert.id)}>
                            Dismiss
                          </button>
                        </div>
                        <p>{alert.message}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </PageBody>
    </V3Layout>
  );
}

function WordRevealQuote({ text }: { text: string }) {
  return <WordReveal key={text} as="h2" text={text} className="zan-hero-quote" />;
}
