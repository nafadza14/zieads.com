import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Check, Filter, Lightbulb, Palette, Search, Target } from 'lucide-react';
import ZieAdsLogo from '../components/ZieAdsLogo';
import { supabase } from '../lib/supabaseClient';
import { TextRollButton } from './landing/ui';
import './audit-flow.css';

interface Props {
  businessContext: any;
}

const agentIcons: Record<string, React.ReactNode> = {
  creative: <Palette size={18} />,
  audience: <Target size={18} />,
  competitive: <Search size={18} />,
  platform: <BarChart3 size={18} />,
  funnel: <Filter size={18} />,
};

const AGENTS = [
  { id: 'creative', name: 'Creative Intelligence', desc: 'Reading your brand voice and creative angles' },
  { id: 'audience', name: 'Audience & Targeting', desc: 'Building your ideal customer and targeting' },
  { id: 'competitive', name: 'Competitive Intelligence', desc: 'Mapping rivals and positioning gaps' },
  { id: 'platform', name: 'Platform & Budget Strategy', desc: 'Working out the best channel mix and budget' },
  { id: 'funnel', name: 'Funnel & Conversion', desc: 'Checking landing pages, pixels and funnel' },
];

const TIPS = [
  'Businesses that audit weekly see 16+ point score improvements in their first month.',
  'The #1 finding in first audits? Missing tracking pixels, preventing retargeting entirely.',
  'ZieAds runs the same checks a top ads agency would, in under 3 minutes.',
  'Score above 75? You are in the top 20% of ads setups we have analyzed.',
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

  const headline =
    status === 'running' ? 'Five AI agents are auditing your site.' :
    status === 'synthesizing' ? 'Writing your report.' :
    status === 'done' ? 'Your audit is ready.' :
    'The audit could not finish.';
  const doneCount = AGENTS.filter((a) => (agentProgress[a.id] || 0) >= 100).length;

  return (
    <div className="zf-page">
      <div className="zf-bg" aria-hidden="true">
        <span />
        <span />
      </div>

      <header className="zf-top">
        <span className="zf-brand">
          <ZieAdsLogo size={28} />
          <span>zieads</span>
        </span>
        <span className="zf-pill">
          <i className={`zf-live ${status === 'error' ? 'is-off' : ''}`} /> {status === 'error' ? 'Stopped' : status === 'done' ? 'Complete' : 'Live audit'}
        </span>
      </header>

      <main className="zf-wrap zf-wrap-narrow">
        <section className="zf-card zf-progress-hero zf-rise">
          <span className={`zf-orb zf-orb-lg ${status === 'running' || status === 'synthesizing' ? 'is-active' : ''}`}>
            <span className="zf-orb-core">{status === 'done' ? <Check size={26} /> : <ZieAdsLogo size={28} />}</span>
          </span>
          <div className="zf-badge-row is-center">
            <span className="zf-badge-num">{String(doneCount).padStart(2, '0')}/05</span>
            <span className="zf-badge-label">Agents finished</span>
          </div>
          <h1 key={status} className="zf-fade">{headline}</h1>
          <p className="zf-progress-url">{businessContext?.url}</p>

          <div className="zf-overall">
            <div className="zf-overall-track">
              <div className="zf-overall-fill" style={{ width: `${overallProgress}%` }} />
            </div>
            <div className="zf-overall-info">
              <span>
                <strong>{overallProgress}%</strong> complete
              </span>
              {status === 'running' && <span>About 2 minutes left</span>}
              {status === 'synthesizing' && <span>Combining agent findings</span>}
            </div>
          </div>
        </section>

        <div className="zf-agents">
          {AGENTS.map((agent, i) => {
            const progress = agentProgress[agent.id] || 0;
            const done = progress >= 100;
            return (
              <div key={agent.id} className={`zf-card zf-agent-card zf-rise ${done ? 'is-done' : ''}`} style={{ animationDelay: `${0.1 + i * 0.07}s` }}>
                <span className="zf-agent-ico">{done ? <Check size={18} /> : agentIcons[agent.id]}</span>
                <div className="zf-agent-body">
                  <div className="zf-agent-row">
                    <strong>{agent.name}</strong>
                    <span className="zf-agent-pct">{done ? 'Done' : `${Math.round(progress)}%`}</span>
                  </div>
                  <div className="zf-bar">
                    <div className="zf-bar-fill" style={{ width: `${progress}%` }} />
                  </div>
                  <small className={done ? '' : 'zf-shimmer'}>{done ? 'Analysis complete' : agent.desc}</small>
                </div>
              </div>
            );
          })}
        </div>

        {status !== 'error' && (
          <div className="zf-tip">
            <span className="zf-tip-ico">
              <Lightbulb size={15} />
            </span>
            <span key={currentTip} className="zf-fade">
              {TIPS[currentTip]}
            </span>
          </div>
        )}

        {status === 'error' && (
          <div className="zf-card zf-error zf-rise">
            <strong>Something went wrong</strong>
            <p>{errorMsg}</p>
            <TextRollButton text="Back to home" variant="dark" onClick={() => navigate('/')} />
          </div>
        )}
      </main>
    </div>
  );
}
