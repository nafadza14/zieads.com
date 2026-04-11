import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ZieAdsLogo from '../components/ZieAdsLogo';
import { supabase } from '../lib/supabaseClient';

interface Props {
  businessContext: any;
}

// SVG icons for agents
const agentIcons: Record<string, React.ReactNode> = {
  creative: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="12" r="1.5" fill="currentColor"/><circle cx="15.5" cy="10" r="1.5" fill="currentColor"/><circle cx="15" cy="14.5" r="1.5" fill="currentColor"/><path d="M9 17c1-1 3-1.5 5-.5"/></svg>,
  audience: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  competitive: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
  platform: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  funnel: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>,
};

const AGENTS = [
  { id: 'creative', name: 'Creative Intelligence', desc: 'Analyzing brand identity and generating creative concepts...' },
  { id: 'audience', name: 'Audience & Targeting', desc: 'Building ICP and targeting strategy across platforms...' },
  { id: 'competitive', name: 'Competitive Intelligence', desc: 'Mapping competitive landscape and positioning gaps...' },
  { id: 'platform', name: 'Platform & Budget Strategy', desc: 'Calculating optimal platform mix and budget allocation...' },
  { id: 'funnel', name: 'Funnel & Conversion', desc: 'Auditing landing pages and mapping funnel coverage...' },
];

const TIPS = [
  'Businesses that audit weekly see 16+ point score improvements in their first month.',
  'The #1 finding in first audits? Missing tracking pixels, preventing retargeting entirely.',
  'ZieAds agent architecture mirrors what top ads agencies do, but in under 3 minutes.',
  'Score above 75? You\'re in the top 20% of ads setups we\'ve analyzed.',
  'Freelancers use ZieAds to produce 10+ client deliverables per day.',
];

export default function AuditProgress({ businessContext }: Props) {
  const navigate = useNavigate();
  const [agentProgress, setAgentProgress] = useState<Record<string, number>>({});
  const [currentTip, setCurrentTip] = useState(0);
  const [status, setStatus] = useState<'running' | 'synthesizing' | 'done' | 'error'>('running');
  const [errorMsg, setErrorMsg] = useState('');
  const startedRef = useRef(false);

  useEffect(() => {
    if (!businessContext) {
      navigate('/');
      return;
    }
    if (startedRef.current) return;
    startedRef.current = true;

    // Start staggered progress simulation for the UI
    const intervals: NodeJS.Timer[] = [];
    const caps: Record<string, number> = {};
    
    AGENTS.forEach((agent, i) => {
      // Assign distinct max limits for each category to ensure they don't look perfectly synced
      caps[agent.id] = 65 + Math.floor(Math.random() * 28);
      
      const interval = setInterval(() => {
        setAgentProgress(prev => {
          const current = prev[agent.id] || 0;
          const targetCap = caps[agent.id];
          if (current >= targetCap) {
            clearInterval(interval as any);
            return prev;
          }
          // Increment slower to feel more authentic
          return { ...prev, [agent.id]: Math.min(targetCap, current + Math.random() * 5 + 1) };
        });
      }, 400 + i * 150);
      intervals.push(interval);
    });

    // Start the actual API call
    const initiateAudit = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/audit', {
          method: 'POST',
          headers,
          body: JSON.stringify(businessContext),
        });
        const json = await res.json();

        intervals.forEach(i => clearInterval(i as any));

        if (json.success) {
          // Build normalized audit record (matches the DB row shape)
          const auditRecord = {
            id: `local_${Date.now()}`,
            report: json.data.report,
            agent_results: json.data.agentResults,
            url: json.data.url,
            business_name: json.data.businessName,
            overall_score: json.data.report?.overall,
            grade: json.data.report?.grade,
            created_at: json.data.generatedAt,
            audit_type: 'full',
          };

          // 1. Persist as latest (used by ReportDashboard)
          localStorage.setItem('zieads_latest_audit', JSON.stringify(auditRecord));

          // 2. Prepend to audit history array (used by ClientDashboard)
          const existing = JSON.parse(localStorage.getItem('zieads_audit_history') || '[]');
          // Keep at most 20 local audits
          const updated = [auditRecord, ...existing].slice(0, 20);
          localStorage.setItem('zieads_audit_history', JSON.stringify(updated));

          // Complete all progress bars only on success
          const completed: Record<string, number> = {};
          AGENTS.forEach(a => (completed[a.id] = 100));
          setAgentProgress(completed);

          setStatus('synthesizing');
          setTimeout(() => {
            setStatus('done');
            setTimeout(() => navigate('/audit/report'), 800);
          }, 1000);
        } else {
          if (json.error === 'PAYWALL_LIMIT' || res.status === 403) {
            alert("You have exhausted your 5 free AI credits! Redirecting you to upgrade.");
            navigate('/pricing');
            return;
          }
          setStatus('error');
          setErrorMsg(json.error || 'Audit failed');
        }
      } catch (err: any) {
        intervals.forEach(i => clearInterval(i as any));
        setStatus('error');
        setErrorMsg(err.message);
      }
    };

    initiateAudit();

    return () => intervals.forEach(i => clearInterval(i as any));
  }, [businessContext]);

  // Rotate tips
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % TIPS.length);
    }, 5000);
    return () => clearInterval(tipInterval);
  }, []);

  const overallProgress = AGENTS.length > 0
    ? Math.round(AGENTS.reduce((sum, a) => sum + (agentProgress[a.id] || 0), 0) / AGENTS.length)
    : 0;

  // Status icons
  const StatusDone = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="#00c9a7" strokeWidth="2.5" width="18" height="18" style={{ display: 'inline', verticalAlign: 'middle' }}><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>
  );
  const StatusFail = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="#e8457a" strokeWidth="2.5" width="18" height="18" style={{ display: 'inline', verticalAlign: 'middle' }}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
  );
  const TipIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="#7B2FBE" strokeWidth="2" width="18" height="18"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17H8v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z"/></svg>
  );

  return (
    <div className="audit-progress-page">
      <nav className="navbar">
        <div className="nav-inner">
          <div className="nav-brand">
            <ZieAdsLogo size={36} />
            <span className="brand-name">zieads</span>
          </div>
        </div>
      </nav>

      <div className="progress-container">
        <div className="progress-header">
          <h1>
            {status === 'running' ? 'Running Full Audit...' :
             status === 'synthesizing' ? 'Synthesizing Report...' :
             status === 'done' ? <><StatusDone /> Audit Complete!</> :
             <><StatusFail /> Audit Failed</>}
          </h1>
          <p className="progress-url">{businessContext?.url}</p>
        </div>

        {/* Agent Cards */}
        <div className="agent-cards">
          {AGENTS.map(agent => {
            const progress = agentProgress[agent.id] || 0;
            return (
              <div key={agent.id} className={`agent-progress-card ${progress >= 100 ? 'agent-done' : ''}`}>
                <div className="apc-header">
                  <span className="apc-icon" style={{ color: '#7B2FBE' }}>{agentIcons[agent.id]}</span>
                  <span className="apc-name">{agent.name}</span>
                  <span className="apc-status">
                    {progress >= 100 ? <><StatusDone /> Done</> : `${Math.round(progress)}%`}
                  </span>
                </div>
                <div className="apc-bar-track">
                  <div
                    className="apc-bar-fill"
                    style={{ width: `${progress}%`, transition: 'width 0.3s ease' }}
                  ></div>
                </div>
                <p className="apc-desc">
                  {progress >= 100 ? 'Analysis complete' : agent.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Overall Progress */}
        <div className="overall-progress">
          <div className="op-bar-track">
            <div className="op-bar-fill" style={{ width: `${overallProgress}%` }}></div>
          </div>
          <div className="op-info">
            <span>Overall: {overallProgress}%</span>
            {status === 'running' && <span className="op-eta">Estimated: ~2 min remaining</span>}
          </div>
        </div>

        {/* Tip */}
        <div className="progress-tip">
          <span className="tip-icon"><TipIcon /></span>
          <span className="tip-text">{TIPS[currentTip]}</span>
        </div>

        {/* Error State */}
        {status === 'error' && (
          <div className="audit-error">
            <p>{errorMsg}</p>
            <button onClick={() => navigate('/')} className="error-back-btn">Back to Home</button>
          </div>
        )}
      </div>
    </div>
  );
}
