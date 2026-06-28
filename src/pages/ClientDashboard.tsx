import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bot, Home, FileText, User, Share2, Settings as SettingsIcon, LayoutGrid, Sparkles, Calendar, Target, Link2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import NounIcon from '../components/NounIcon';
import { useCreditStore } from '../lib/creditStore';
import CreditBadge from '../components/CreditBadge';
import FeatureGateModal from '../components/FeatureGateModal';
import DepletionOverlay from '../components/DepletionOverlay';

const P = 'var(--primary)';
const PL = 'var(--primary-bg)';
const G = 'var(--text-muted)';
const D = 'var(--text)';
const B = 'var(--border)';

const SKILLS = [
  { id: 'audit', name: 'Full Audit', icon: <NounIcon name="audit" color="#6366f1" size={20} />, color: '#6366f1', desc: '5 agents · all 6 dimensions scored', cmd: '/ads audit' },
  { id: 'quick', name: 'Quick Scan', icon: <NounIcon name="quick" color="#f59e0b" size={20} />, color: '#f59e0b', desc: '60-second ads readiness snapshot', cmd: '/ads quick' },
  { id: 'copy', name: 'Ad Copy', icon: <NounIcon name="copy" color="#2563eb" size={20} />, color: '#2563eb', desc: 'Google, Meta, TikTok, LinkedIn ready', cmd: '/ads copy' },
  { id: 'creatives', name: 'Creative Brief', icon: <NounIcon name="creatives" color="#ec4899" size={20} />, color: '#ec4899', desc: '3 concepts per platform', cmd: '/ads creatives' },
  { id: 'landing', name: 'Landing Page CRO', icon: <NounIcon name="landing" color="#10b981" size={20} />, color: '#10b981', desc: '8-dimension conversion audit', cmd: '/ads landing' },
  { id: 'audiences', name: 'Audience Targeting', icon: <NounIcon name="audiences" color="#8b5cf6" size={20} />, color: '#8b5cf6', desc: 'ICP & platform matrices', cmd: '/ads audiences' },
  { id: 'competitors', name: 'Competitor Intel', icon: <NounIcon name="competitors" color="#ef4444" size={20} />, color: '#ef4444', desc: '3-tier intelligence map', cmd: '/ads competitors' },
  { id: 'funnel', name: 'Funnel Architecture', icon: <NounIcon name="funnel" color="#06b6d4" size={20} />, color: '#06b6d4', desc: 'TOFU/MOFU/BOFU routing', cmd: '/ads funnel' },
  { id: 'budget', name: 'Budget Model', icon: <NounIcon name="budget" color="#16a34a" size={20} />, color: '#16a34a', desc: 'Platform allocation + KPIs', cmd: '/ads budget' },
  { id: 'google', name: 'Google Ads', icon: <NounIcon name="google" color="#4285f4" size={20} />, color: '#4285f4', desc: 'Search, Shopping, Display strategy', cmd: '/ads google' },
  { id: 'meta', name: 'Meta Ads', icon: <NounIcon name="meta" color="#1877f2" size={20} />, color: '#1877f2', desc: 'Facebook & Instagram strategy', cmd: '/ads meta' },
  { id: 'tiktok', name: 'TikTok Ads', icon: <NounIcon name="tiktok" color="#ff0050" size={20} />, color: '#ff0050', desc: 'UGC & spark ads strategy', cmd: '/ads tiktok' },
  { id: 'linkedin', name: 'LinkedIn Ads', icon: <NounIcon name="linkedin" color="#0a66c2" size={20} />, color: '#0a66c2', desc: 'B2B account-based marketing', cmd: '/ads linkedin' },
  { id: 'report', name: 'Strategy Report', icon: <NounIcon name="report" color="#f97316" size={20} />, color: '#f97316', desc: 'Full markdown strategy export', cmd: '/ads report' },
  { id: 'report-pdf', name: 'White-Label PDF', icon: <NounIcon name="report-pdf" color="#d946ef" size={20} />, color: '#d946ef', desc: 'Professional agency deck', cmd: '/ads report-pdf' },
];


const RHYTHM = [
  { day: 'MON', label: 'Full audit + score review', cmds: '/ads audit', color: P },
  { day: 'TUE', label: 'Ad copy refresh', cmds: '/ads copy', color: '#f59e0b' },
  { day: 'WED', label: 'Creative briefing day', cmds: '/ads creatives', color: '#8b5cf6' },
  { day: 'THU', label: 'Landing page + funnel check', cmds: '/ads landing · /ads funnel', color: '#5c8aff' },
  { day: 'FRI', label: 'Client PDF report delivery', cmds: '/ads report-pdf', color: P },
];

import { generatePDF } from '../lib/pdfGenerator';
import CompareAuditView from '../components/CompareAuditView';
import IndustryInsights from '../components/IndustryInsights';
import AdsIntegrationMock from '../components/AdsIntegrationMock';
import CollaborativeReport from '../components/CollaborativeReport';

interface Props {
  reportData?: any;
}

export default function ClientDashboard({ reportData }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const creditStore = useCreditStore();

  useEffect(() => {
    if (location.state && (location.state as any).defaultTab) {
      setSidebarNav((location.state as any).defaultTab);
    }
  }, [location.state]);

  const [selectedSkill, setSelectedSkill] = useState('audit');
  const [urlInput, setUrlInput] = useState('');
  const [checkedFindings, setCheckedFindings] = useState<Set<number>>(new Set());
  const [runningSkill] = useState<string | null>(null);
  const [skillResult] = useState<any>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [sidebarNav, setSidebarNav] = useState('home');
  const [latestAudit, setLatestAudit] = useState<any>(null);
  const [recentAudits, setRecentAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [copyActiveTab, setCopyActiveTab] = useState('metaAds');

  // Feature gate modal state
  const [gateModal, setGateModal] = useState<{ open: boolean; featureName: string; featureDesc?: string; requiredPlan?: 'starter' | 'pro' | 'agency'; featureType?: 'skill' | 'mode' }>({
    open: false, featureName: '', requiredPlan: 'starter', featureType: 'skill',
  });

  const openGate = (skill: typeof SKILLS[0]) => {
    setGateModal({ open: true, featureName: skill.name, featureDesc: skill.desc, requiredPlan: 'starter', featureType: 'skill' });
  };

  // Helper to get auth headers
  const getAuthHeaders = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  };

  useEffect(() => {
    const loadData = async () => {
      // Get user
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.email) setUserEmail(userData.user.email);

      // Try DB first
      let dbLatest: any = null;
      let dbAll: any[] = [];
      try {
        const headers = await getAuthHeaders();
        const [latestRes, allRes, profileRes] = await Promise.all([
          fetch('/api/audits/latest', { headers }),
          fetch('/api/audits', { headers }),
          fetch('/api/profile', { headers })
        ]);
        const latestJson = await latestRes.json();
        const allJson = await allRes.json();
        const profileJson = await profileRes.json();

        if (latestJson.data) dbLatest = latestJson.data;
        if (allJson.data?.length) dbAll = allJson.data;
        if (profileJson.data) {
          setUserProfile(profileJson.data);
          // Pre-fill URL input from saved profile if user hasn't typed one
          if (profileJson.data.primary_url) {
            setUrlInput(prev => prev || profileJson.data.primary_url);
          }
        }
      } catch (err) {
        console.warn('Could not load data from API:', err);
      }

      // Merge with localStorage history (fallback when DB writes are blocked)
      const localHistory: any[] = JSON.parse(localStorage.getItem('zieads_audit_history') || '[]');

      if (dbAll.length > 0) {
        // DB has data — use it, but also merge any local-only audits not yet in DB
        const dbIds = new Set(dbAll.map((a: any) => a.id));
        const localOnly = localHistory.filter(a => !dbIds.has(a.id));
        const merged = [...localOnly, ...dbAll].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setRecentAudits(merged);
        setLatestAudit(dbLatest || merged[0] || null);
      } else if (localHistory.length > 0) {
        // No DB data — use localStorage history entirely
        setRecentAudits(localHistory);
        setLatestAudit(localHistory[0]);
      } else if (dbLatest) {
        setLatestAudit(dbLatest);
      }

      setLoading(false);
    };
    loadData();
  }, []);

  const toggleFinding = (i: number) => {
    setCheckedFindings(prev => {
      const s = new Set(prev);
      s.has(i) ? s.delete(i) : s.add(i);
      return s;
    });
  };

  const handleRunSkill = (skillId: string) => {
    // Feature gate check
    if (creditStore.isSkillLocked(`ads_${skillId}`)) {
      const skill = SKILLS.find(s => s.id === skillId);
      if (skill) openGate(skill);
      return;
    }
    // Depletion check
    if (creditStore.skill_run.state === 'DEPLETED' || creditStore.skill_run.state === 'RESET_IMMINENT') {
      alert('No skill run credits remaining. Please upgrade or wait for reset.');
      return;
    }

    if (!urlInput.trim()) { alert('Please enter a URL first.'); return; }

    let u = urlInput.trim();
    if (!u.startsWith('http')) u = 'https://' + u;

    if (skillId === 'audit') {
      navigate('/onboarding', { state: { url: u } });
      return;
    }
    if (skillId === 'quick') {
      navigate('/onboarding', { state: { url: u } });
      return;
    }

    // All other skills → dedicated SkillReport page
    const params = new URLSearchParams({ url: u, businessName: userProfile?.business_name || '' });
    navigate(`/skill-report/${skillId}?${params.toString()}`);
  };

  const handleGeneratePDF = async () => {
    if (!auditUrl) { alert('No active audit URL to generate a report for.'); return; }
    setIsGeneratingPDF(true);
    try {
      const headers = await getAuthHeaders();
      const resp = await fetch(`/api/skill/report-pdf`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ url: auditUrl }),
      });
      const json = await resp.json();
      if (resp.ok && json.data) {
        await generatePDF(json.data, { 
          isAgency: !!userProfile?.agency_name, 
          agencyName: userProfile?.agency_name,
          agencyLogo: userProfile?.agency_logo
        });
      } else {
        alert(json.error || 'Failed to generate PDF content.');
      }
    } catch {
      alert('Network error while generating PDF.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // Extract report data from latestAudit (fetched from DB)
  const hasReport = !!latestAudit;
  const report = latestAudit?.report || {};
  const overall = latestAudit?.overall_score || 0;
  const grade = latestAudit?.grade || '—';
  const dims = latestAudit?.dimensions || {};
  const findings: any[] = latestAudit?.findings || [];
  const businessName = latestAudit?.business_name || '';
  const auditUrl = latestAudit?.url || '';
  const todayStr = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());
  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : 'ZA';
  const getScoreColor = (s: number) => s >= 70 ? '#00c9a7' : s >= 50 ? '#f59e0b' : s > 0 ? '#dc2626' : G;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', fontFamily: 'inherit' }}>

      {/* ─── SIDEBAR ─── */}
      <aside style={{ width: 240, background: 'var(--bg-soft)', borderRight: `1px solid ${B}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 24, paddingLeft: 8 }} onClick={() => navigate('/')}>
            <div style={{ width: 28, height: 28, background: P, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Z</div>
            <span style={{ fontSize: '1rem', fontWeight: 600, color: D }}>ZieAds</span>
          </div>

          <button onClick={() => { setUrlInput(''); setSidebarNav('home'); }} style={{ width: '100%', background: P, color: '#fff', border: 'none', padding: '8px 0', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer', marginBottom: 24, fontSize: '0.875rem' }}>
            + New audit
          </button>

          {/* Score Pill */}
          <div style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 'var(--radius-sm)', padding: 16, marginBottom: 32, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: '0.75rem', color: G, marginBottom: 4 }}>Ads readiness score</div>
            {hasReport ? (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 600, color: D, fontFamily: 'monospace' }}>{overall}</span>
                  <span style={{ fontSize: '0.85rem', color: G }}>/100</span>
                </div>
                <div style={{ width: '100%', height: 4, background: 'var(--bg-surface)', borderRadius: 2 }}>
                  <div style={{ width: `${overall}%`, height: '100%', background: getScoreColor(overall), borderRadius: 2 }}></div>
                </div>
              </>
            ) : (
              <div style={{ fontSize: '0.85rem', color: G }}>No audit yet</div>
            )}
          </div>

          {/* Daily Operations */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: '0.68rem', color: G, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, paddingLeft: 8, marginBottom: 8 }}>Daily Operations</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { k: '/analyst', l: 'AI Analyst', icon: <Sparkles size={15} style={{ color: '#8B5CF6' }} /> },
                { k: '/studio', l: 'Content Studio', icon: <Calendar size={15} style={{ color: '#ec4899' }} /> },
                { k: '/hunt', l: 'Competitor Hunt', icon: <Target size={15} style={{ color: '#ef4444' }} /> },
                { k: '/connections', l: 'Connections', icon: <Link2 size={15} style={{ color: '#10b981' }} /> },
              ].map(n => (
                <li key={n.k} onClick={() => navigate(n.k)} style={{ cursor: 'pointer', padding: '8px 12px', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  {n.icon}
                  {n.l}
                </li>
              ))}
            </ul>
          </div>

          {/* Nav */}
          {['home', 'skills'].map(section => (
            <div key={section} style={{ marginBottom: 24 }}>
              <div style={{ fontSize: '0.68rem', color: G, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, paddingLeft: 8, marginBottom: 8 }}>{section === 'home' ? 'TOOLS & REPORTS' : 'SKILLS'}</div>
              {section === 'home' ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {[{k:'home',l:'Home'},{k:'reports',l:'Reports'},{k:'agent',l:'AI Agent'},{k:'profile-page',l:'Business Profile'},{k:'referrals',l:'Referrals'},{k:'settings',l:'Settings'},{k:'skills',l:'All Skills'}].map(n => (
                    <li key={n.k} onClick={() => { if (n.k === 'agent') { navigate('/agent'); return; } if (n.k === 'profile-page') { navigate('/profile'); return; } setSidebarNav(n.k); }} style={{ cursor: 'pointer', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontWeight: sidebarNav === n.k ? 600 : 400, background: sidebarNav === n.k ? 'var(--primary-bg)' : 'transparent', color: sidebarNav === n.k ? 'var(--text)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 10 }}>
                      {n.k === 'home' && <Home size={15} style={{ color: '#6366F1' }} />}
                      {n.k === 'reports' && <FileText size={15} style={{ color: '#0D9488' }} />}
                      {n.k === 'agent' && <Bot size={15} style={{ color: '#8B5CF6' }} />}
                      {n.k === 'profile-page' && <User size={15} style={{ color: '#F97316' }} />}
                      {n.k === 'referrals' && <Share2 size={15} style={{ color: '#EC4899' }} />}
                      {n.k === 'settings' && <SettingsIcon size={15} style={{ color: '#71717A' }} />}
                      {n.k === 'skills' && <LayoutGrid size={15} style={{ color: '#10B981' }} />}
                      {n.l}
                    </li>
                  ))}
                </ul>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'monospace', paddingLeft: 8 }}>
                  {SKILLS.slice(0, 5).map(s => (
                    <li key={s.id} onClick={() => { setSidebarNav('skills'); setSelectedSkill(s.id); }} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}>{s.cmd}</li>
                  ))}
                  <li onClick={() => setSidebarNav('skills')} style={{ cursor: 'pointer', color: G, fontFamily: 'inherit', fontSize: '0.8rem', paddingTop: 4 }}>+ {SKILLS.length - 5} more</li>
                </ul>
              )}
            </div>
          ))}

          {/* Clients */}
          {hasReport && (
            <div>
              <div style={{ fontSize: '0.68rem', color: G, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, paddingLeft: 8, marginBottom: 8 }}>CLIENTS</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', color: 'var(--text-secondary)' }}><span style={{ width: 4, height: 4, borderRadius: '50%', background: P }}></span>{auditUrl}</li>
              </ul>
            </div>
          )}
        </div>

        {/* User footer */}
        <div style={{ marginTop: 'auto', padding: '16px 20px', borderTop: `1px solid ${B}`, background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold', color: D }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 500, color: D, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userEmail || 'User'}</div>
              <div style={{ fontSize: '0.7rem', color: G }}>{creditStore.plan_display_name || 'Free'} Plan</div>
            </div>
          </div>
          {/* Credit badge row */}
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            <CreditBadge pool="ai_chat" />
            <CreditBadge pool="skill_run" />
          </div>
          <button onClick={() => navigate('/pricing')} style={{ marginTop: 10, width: '100%', background: '#fff', border: `1px solid ${B}`, borderRadius: 'var(--radius-sm)', padding: '6px 0', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>Upgrade Plan</button>
          <button onClick={handleSignOut} style={{ marginTop: 6, width: '100%', background: 'transparent', border: 'none', borderRadius: 'var(--radius-sm)', padding: '6px 0', fontSize: '0.78rem', color: G, cursor: 'pointer' }}>Sign out</button>
        </div>
      </aside>

      {/* Feature Gate Modal */}
      <FeatureGateModal
        isOpen={gateModal.open}
        onClose={() => setGateModal(m => ({ ...m, open: false }))}
        featureName={gateModal.featureName}
        featureDescription={gateModal.featureDesc}
        requiredPlan={gateModal.requiredPlan || 'starter'}
        featureType={gateModal.featureType || 'skill'}
      />

      {/* ─── MAIN ─── */}
      <main style={{ flex: 1, padding: '24px 40px', overflowY: 'auto' }}>

        {/* Top Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: '1.4rem', color: D, fontWeight: 700, margin: 0 }}>
            {sidebarNav === 'reports' ? 'Account & Report History' : (hasReport ? `Good morning. Let's make your ads win today.` : `Welcome to ZieAds. Run your first audit to get started.`)}
          </h1>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {hasReport && sidebarNav === 'home' && (
              <button 
                onClick={handleGeneratePDF} 
                disabled={isGeneratingPDF} 
                style={{ background: '#fff', border: `1px solid ${P}`, color: P, padding: '6px 16px', borderRadius: 16, fontSize: '0.85rem', fontWeight: 600, cursor: isGeneratingPDF ? 'not-allowed' : 'pointer' }}
              >
                {isGeneratingPDF ? 'Generating...' : 'Download PDF Report'}
              </button>
            )}
            <div style={{ background: PL, color: P, padding: '6px 16px', borderRadius: 16, fontSize: '0.85rem', fontWeight: 600, border: `1px solid rgba(123,47,190,0.2)` }}>
              {todayStr}
            </div>
          </div>
        </div>

        {/* Command Bar */}
        {sidebarNav !== 'reports' && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: `1px solid ${B}`, borderRadius: 8, padding: 4, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <select value={selectedSkill} onChange={e => setSelectedSkill(e.target.value)} style={{ padding: '12px 16px', background: 'transparent', border: 'none', outline: 'none', borderRight: `1px solid ${B}`, fontFamily: 'monospace', fontSize: '0.95rem', color: D, cursor: 'pointer' }}>
                {SKILLS.map(s => <option key={s.id} value={s.id}>{s.cmd}</option>)}
              </select>
              <input type="text" placeholder="Paste any website URL here..." value={urlInput} onChange={e => setUrlInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRunSkill(selectedSkill)} style={{ flex: 1, padding: '12px 16px', border: 'none', outline: 'none', fontSize: '1rem', color: D }} />
              <button onClick={() => handleRunSkill(selectedSkill)} disabled={!!runningSkill} style={{ background: runningSkill ? '#e2e8f0' : P, color: runningSkill ? G : '#fff', border: 'none', padding: '10px 24px', borderRadius: 6, fontWeight: 600, cursor: runningSkill ? 'not-allowed' : 'pointer', margin: '0 4px' }}>
                {runningSkill ? 'Running...' : 'Run agent'}
              </button>
            </div>
            {/* Skill credit depletion inline banner */}
            {(creditStore.skill_run.state === 'DEPLETED' || creditStore.skill_run.state === 'RESET_IMMINENT') && (
              <div style={{ marginTop: 12 }}>
                <DepletionOverlay pool="skill_run" inline />
              </div>
            )}
          </div>
        )}

        {/* Skill Result Output — legacy, kept for type safety only, skills now navigate to /skill-report/:skillName */}
        {false && skillResult && sidebarNav !== 'reports' && (
          <div style={{ marginBottom: 24, padding: 24, background: '#1e293b', borderRadius: 12, color: '#fff', border: '1px solid #334155', boxShadow: '0 12px 30px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#a78bfa', fontWeight: 700 }}>Result: {SKILLS.find(s => s.id === skillResult.skillId)?.name}</h3>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button 
                  onClick={() => void 0} 
                  style={{ background: 'rgba(167, 139, 250, 0.1)', border: '1px solid rgba(167, 139, 250, 0.3)', color: '#a78bfa', padding: '6px 16px', borderRadius: 100, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(167, 139, 250, 0.2)'}
                  onMouseOut={e => e.currentTarget.style.background = 'rgba(167, 139, 250, 0.1)'}
                >
                  Back to Dashboard
                </button>
                <button onClick={() => void 0} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem', padding: 4 }}>✕</button>
              </div>
            </div>

            {skillResult.skillId === 'quick' ? (
              <div style={{ padding: 20, background: '#0f172a', borderRadius: 10, border: '1px solid #1e293b' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24 }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', border: `4px solid ${getScoreColor(skillResult.data.score)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: getScoreColor(skillResult.data.score), lineHeight: 1 }}>{skillResult.data.score}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>PTS</div>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 4px 0' }}>Paid Ads Readiness Snapshot</h4>
                    <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: 0 }}>{skillResult.data.businessName || skillResult.data.url}</p>
                    <div style={{ marginTop: 8, display: 'inline-block', background: 'rgba(167, 139, 250, 0.1)', color: '#a78bfa', fontSize: '0.75rem', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>{skillResult.data.businessType}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                  {Object.entries(skillResult.data.signals || {}).map(([name, sig]: [string, any]) => (
                    <div key={name} style={{ background: '#1e293b', padding: 12, borderRadius: 8, border: '1px solid #334155' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{name}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: sig.score >= 8 ? '#00c9a7' : sig.score >= 5 ? '#f59e0b' : '#dc2626' }}>{sig.score}/10</span>
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#e2e8f0', fontWeight: 500 }}>{sig.status}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #1e293b' }}>
                  <button onClick={() => navigate('/onboarding', { state: { url: skillResult.data.url } })} style={{ background: P, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                    Run Full 6-Dimension Audit
                  </button>
                </div>
              </div>
            ) : skillResult.skillId === 'copy' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Analysis Section */}
                {skillResult.data.analysis && (
                  <div style={{ padding: 20, background: 'rgba(167, 139, 250, 0.05)', borderRadius: 12, border: '1px solid rgba(167, 139, 250, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span style={{ fontSize: '1.2rem' }}>🎯</span>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#a78bfa' }}>Strategic Analysis</h4>
                    </div>
                    <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                      <strong>Strategy:</strong> {skillResult.data.analysis.strategy}
                    </p>
                    <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                      <strong>Tone of Voice:</strong> {skillResult.data.analysis.toneOfVoice}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {skillResult.data.analysis.keySellingPoints?.map((sp: string, i: number) => (
                        <span key={i} style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 100, color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>
                          ✓ {sp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Platform Tabs */}
                <div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid #334155', paddingBottom: 1 }}>
                    {['metaAds', 'googleAds', 'tiktokAds', 'linkedinAds'].map(tab => (
                      <button
                        key={tab}
                        onClick={() => setCopyActiveTab(tab)}
                        style={{
                          padding: '8px 16px',
                          background: 'transparent',
                          border: 'none',
                          borderBottom: copyActiveTab === tab ? `2px solid ${P}` : '2px solid transparent',
                          color: copyActiveTab === tab ? '#fff' : '#64748b',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          marginBottom: -1,
                          transition: 'all 0.2s'
                        }}
                      >
                        {tab.replace('Ads', '').charAt(0).toUpperCase() + tab.replace('Ads', '').slice(1)}
                      </button>
                    ))}
                  </div>

                  <div style={{ padding: 20, background: '#0f172a', borderRadius: 12, border: '1px solid #1e293b' }}>
                    {copyActiveTab === 'metaAds' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>Primary Text (Long Body)</label>
                          <div style={{ padding: 12, background: '#1e293b', borderRadius: 6, fontSize: '0.9rem', color: '#e2e8f0', whiteSpace: 'pre-wrap', position: 'relative' }}>
                            {skillResult.data.deliverables.metaAds.longBody || skillResult.data.deliverables.metaAds.primaryTexts?.[0]}
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>Headlines</label>
                            {skillResult.data.deliverables.metaAds.headlines?.map((h: string, i: number) => (
                              <div key={i} style={{ padding: '8px 12px', background: '#1e293b', borderRadius: 6, fontSize: '0.85rem', color: '#e2e8f0', marginBottom: 8 }}>{h}</div>
                            ))}
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>Short Body</label>
                            <div style={{ padding: '8px 12px', background: '#1e293b', borderRadius: 6, fontSize: '0.85rem', color: '#e2e8f0' }}>{skillResult.data.deliverables.metaAds.shortBody}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {copyActiveTab === 'googleAds' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>Search Headlines (15)</label>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            {skillResult.data.deliverables.googleAds.headlines?.map((h: string, i: number) => (
                              <div key={i} style={{ padding: '8px 12px', background: '#1e293b', borderRadius: 6, fontSize: '0.85rem', color: '#e2e8f0' }}>{h}</div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>Search Descriptions (4)</label>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {skillResult.data.deliverables.googleAds.descriptions?.map((d: string, i: number) => (
                              <div key={i} style={{ padding: '8px 12px', background: '#1e293b', borderRadius: 6, fontSize: '0.85rem', color: '#e2e8f0' }}>{d}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {copyActiveTab === 'tiktokAds' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {skillResult.data.deliverables.tiktokAds.scriptOutlines?.map((s: any, i: number) => (
                          <div key={i} style={{ padding: 16, background: '#1e293b', borderRadius: 8, border: '1px solid #334155' }}>
                            <div style={{ fontWeight: 700, marginBottom: 8, color: '#a78bfa', fontSize: '0.9rem' }}>Script Option {i + 1}</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                              <p style={{ margin: 0, fontSize: '0.85rem' }}><strong>Hook:</strong> {s.hook}</p>
                              <p style={{ margin: 0, fontSize: '0.85rem' }}><strong>Body:</strong> {s.body}</p>
                              <p style={{ margin: 0, fontSize: '0.85rem' }}><strong>CTA:</strong> {s.cta}</p>
                            </div>
                          </div>
                        ))}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>Captions</label>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {skillResult.data.deliverables.tiktokAds.captions?.map((c: string, i: number) => (
                              <div key={i} style={{ padding: '6px 12px', background: '#1e293b', borderRadius: 100, fontSize: '0.8rem', color: '#e2e8f0' }}>{c}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {copyActiveTab === 'linkedinAds' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                         {skillResult.data.deliverables.linkedinAds.sponsoredContent?.map((c: any, i: number) => (
                           <div key={i} style={{ padding: 16, background: '#1e293b', borderRadius: 8, border: '1px solid #334155' }}>
                             <div style={{ fontWeight: 700, marginBottom: 8, color: '#a78bfa', fontSize: '0.9rem' }}>Sponsored Content {i + 1}</div>
                             <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem' }}><strong>Intro:</strong> {c.intro}</p>
                             <p style={{ margin: 0, fontSize: '0.85rem' }}><strong>Headline:</strong> {c.headline}</p>
                           </div>
                         ))}
                         {skillResult.data.deliverables.linkedinAds.messageAds?.map((m: any, i: number) => (
                           <div key={i} style={{ padding: 16, background: '#1e293b', borderRadius: 8, border: '1px solid #334155' }}>
                             <div style={{ fontWeight: 700, marginBottom: 8, color: '#a78bfa', fontSize: '0.9rem' }}>Direct Message {i + 1}</div>
                             <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem' }}><strong>Subject:</strong> {m.subject}</p>
                             <p style={{ margin: 0, fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{m.body}</p>
                           </div>
                         ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <pre style={{ margin: 0, padding: 16, background: '#0f172a', borderRadius: 8, fontSize: '0.85rem', overflow: 'auto', maxHeight: 400, whiteSpace: 'pre-wrap', border: '1px solid #1e293b' }}>
                {JSON.stringify(skillResult.data?.deliverables || skillResult.data, null, 2)}
              </pre>
            )}
          </div>
        )}

        {/* ══════ REPORTS VIEW ══════ */}
        {sidebarNav === 'reports' && (
          <div>
            <AdsIntegrationMock />
            
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: D, marginBottom: 16 }}>Audit Score Trend</h2>
            <div style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 12, padding: 24, marginBottom: 32, display: 'flex', gap: 12, alignItems: 'flex-end', height: 180 }}>
              {recentAudits.slice().reverse().map((a, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: D }}>{a.overall_score}</div>
                  <div style={{ width: '100%', maxWidth: 40, background: getScoreColor(a.overall_score), height: `${a.overall_score}%`, borderRadius: '4px 4px 0 0', opacity: i === recentAudits.length - 1 ? 1 : 0.6, transition: 'all 0.3s ease' }}></div>
                  <div style={{ fontSize: '0.65rem', color: G, whiteSpace: 'nowrap' }}>{new Date(a.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</div>
                </div>
              ))}
              {recentAudits.length === 0 && <div style={{ color: G, fontSize: '0.9rem', width: '100%', textAlign: 'center', paddingBottom: 20 }}>No audits to display trend</div>}
            </div>

            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: D, marginBottom: 16 }}>Audit History</h2>
            <div style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead style={{ background: '#f8fafc', color: G, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <tr>
                    <th style={{ padding: '12px 24px', fontWeight: 600, borderBottom: `1px solid ${B}` }}>Date</th>
                    <th style={{ padding: '12px 24px', fontWeight: 600, borderBottom: `1px solid ${B}` }}>Property</th>
                    <th style={{ padding: '12px 24px', fontWeight: 600, borderBottom: `1px solid ${B}` }}>Score</th>
                    <th style={{ padding: '12px 24px', fontWeight: 600, borderBottom: `1px solid ${B}` }}>Grade</th>
                    <th style={{ padding: '12px 24px', fontWeight: 600, borderBottom: `1px solid ${B}` }}>Type</th>
                    <th style={{ padding: '12px 24px', fontWeight: 600, borderBottom: `1px solid ${B}` }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAudits.map((a, i) => (
                    <tr key={i} style={{ borderBottom: i === recentAudits.length - 1 ? 'none' : `1px solid ${B}` }}>
                      <td style={{ padding: '16px 24px', color: G }}>{new Date(a.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '16px 24px', fontWeight: 500, color: D }}>{a.business_name || a.url}</td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: getScoreColor(a.overall_score) }}></span>
                          <span style={{ fontWeight: 600, color: D }}>{a.overall_score}/100</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', fontWeight: 600, color: D }}>{a.grade}</td>
                      <td style={{ padding: '16px 24px', color: G, textTransform: 'capitalize' }}>{a.audit_type}</td>
                      <td style={{ padding: '16px 24px' }}>
                        <button onClick={() => {
                          setLatestAudit(a);
                          localStorage.setItem('zieads_latest_audit', JSON.stringify(a));
                          navigate('/audit/report');
                        }} style={{ background: P, color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>View Report</button>
                      </td>
                    </tr>
                  ))}
                  {recentAudits.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: '32px 24px', textAlign: 'center', color: G }}>No audits found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {recentAudits.length > 0 && <IndustryInsights latestScore={recentAudits[0].overall_score} />}
            <CompareAuditView audits={recentAudits} />
          </div>
        )}

        {/* ══════ HOME VIEW ══════ */}
        {sidebarNav === 'home' && (
          <>
            {/* Empty State */}
            {!hasReport && (
              <div style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 'var(--radius)', padding: '64px 40px', textAlign: 'center', marginBottom: 32 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'var(--text-secondary)', border: `1px solid ${B}` }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: D, marginBottom: 8 }}>No audits yet</h2>
                <p style={{ fontSize: '1rem', color: G, marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
                  Paste any website URL above and run your first AI audit. You'll get a full paid ads readiness score across 6 dimensions.
                </p>
                <button onClick={() => document.querySelector<HTMLInputElement>('input[type="text"]')?.focus()} style={{ background: P, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>
                  Run your first audit
                </button>
              </div>
            )}

            {/* Daily Brief */}
            {hasReport && (
              <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: D, marginBottom: 16 }}>Latest audit insights</h2>
                <div style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 'var(--radius)', padding: 24 }}>
                  <p style={{ fontSize: '0.95rem', color: D, lineHeight: '1.5', marginBottom: 20 }}>{report.executiveSummary || 'No executive summary available.'}</p>
                  <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                    <button onClick={() => navigate('/audit/report')} style={{ padding: '8px 16px', background: '#fff', border: `1px solid ${B}`, borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>View full report</button>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div style={{ marginBottom: 12, fontSize: '0.85rem', fontWeight: 600, color: G }}>Quick actions</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
              {SKILLS.slice(0, 6).map((s, i) => (
                <div key={i} onClick={() => { setSelectedSkill(s.id); document.querySelector<HTMLInputElement>('input[type="text"]')?.focus(); }} style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 'var(--radius)', padding: 16, cursor: 'pointer', transition: 'border-color 0.15s' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: `${s.color}12`, border: `1px solid ${s.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <NounIcon name={s.id} size={18} color={s.color} />
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: D, marginBottom: 4 }}>{s.name}</div>
                  <div style={{ fontSize: '0.8rem', color: G, marginBottom: 8 }}>{s.desc}</div>
                  <div style={{ fontSize: '0.75rem', color: G, fontFamily: 'monospace' }}>{s.cmd}</div>
                </div>
              ))}
            </div>

            {/* Score + Findings or empty */}
            {hasReport && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                {/* Score Card */}
                <div style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 'var(--radius)', padding: 24 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: D, marginBottom: 16 }}>Paid ads readiness score</div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
                    <div style={{ fontSize: '3rem', fontWeight: 600, color: D, lineHeight: 1, fontFamily: 'monospace' }}>{overall}</div>
                    <div>
                      <div style={{ color: getScoreColor(overall), fontWeight: 700 }}>Grade {grade}</div>
                      <div style={{ color: G, fontSize: '0.8rem' }}>{businessName || auditUrl}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                    {[
                      { name: 'Creative & offer', score: dims.creative?.score || 0 },
                      { name: 'Audience clarity', score: dims.audience?.score || 0 },
                      { name: 'Landing page', score: dims.landing?.score || 0 },
                      { name: 'Platform fit', score: dims.platform?.score || 0 },
                      { name: 'Funnel coverage', score: dims.funnel?.score || 0 },
                      { name: 'Competitive pos.', score: dims.competitive?.score || 0 },
                    ].map((d, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem', color: D }}>
                        <span style={{ width: 120 }}>{d.name}</span>
                        <div style={{ flex: 1, background: 'var(--bg-surface)', height: 4, borderRadius: 2, margin: '0 12px' }}>
                          <div style={{ width: `${d.score}%`, height: '100%', background: getScoreColor(d.score), borderRadius: 2 }}></div>
                        </div>
                        <span style={{ fontWeight: 600, width: 24, textAlign: 'right', fontFamily: 'monospace' }}>{d.score}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => navigate('/audit/report')} style={{ padding: '8px 16px', background: '#fff', border: `1px solid ${B}`, borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>View full report</button>
                </div>

                {/* Critical Findings */}
                <div style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 'var(--radius)', padding: 24, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: D }}>Critical findings & Strategy</div>
                  </div>
                  {findings.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: G }}>No findings</div>
                  ) : (
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                      <CollaborativeReport 
                        findings={findings.slice(0, 4).map((f: any) => ({
                          category: 'Performance Alert',
                          title: f.title,
                          description: f.impact,
                          impact: f.severity,
                          actionableStep: f.recommendation || 'Review inside Ads Manager and deploy immediately.'
                        }))} 
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Weekly Rhythm */}
            <div style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 8, padding: 24, marginBottom: 32 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: D, marginBottom: 20 }}>Weekly rhythm</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {RHYTHM.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 16 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: G, width: 30 }}>{r.day}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, marginTop: 4 }}></div>
                      {i < RHYTHM.length - 1 && <div style={{ width: 2, flex: 1, background: B, margin: '4px 0' }}></div>}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: D }}>{r.label}</div>
                      <div style={{ fontSize: '0.8rem', color: G, fontFamily: 'monospace' }}>{r.cmds}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ══════ ALL SKILLS VIEW ══════ */}
        {sidebarNav === 'skills' && (
          <div>
            <h2 style={{ fontSize: '1.2rem', color: D, marginBottom: 24 }}>All AI Skills</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {SKILLS.map(s => (
                <div key={s.id} style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 8, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: `${s.color}15`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <NounIcon name={s.id} size={16} color={s.color} />
                        </div>
                        <strong style={{ color: D }}>{s.name}</strong>
                      </div>
                      <code style={{ fontSize: '0.75rem', color: P, background: '#f3e8ff', padding: '2px 6px', borderRadius: 4 }}>{s.cmd}</code>
                    </div>
                    <button onClick={() => { setSelectedSkill(s.id); handleRunSkill(s.id); }} disabled={runningSkill === s.id} style={{ padding: '6px 16px', background: runningSkill === s.id ? '#e2e8f0' : P, color: runningSkill === s.id ? G : '#fff', border: 'none', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600, cursor: runningSkill === s.id ? 'not-allowed' : 'pointer' }}>
                      {runningSkill === s.id ? 'Running...' : 'Run'}
                    </button>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: G, margin: 0 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════ SETTINGS VIEW ══════ */}
        {sidebarNav === 'settings' && (
          <form style={{ maxWidth: 640 }} onSubmit={async (e) => {
            e.preventDefault();
            try {
              const headers = await getAuthHeaders();
              const formData = new FormData(e.currentTarget);
              const payload = {
                agency_name: formData.get('agencyName') || '',
                agency_logo: formData.get('agencyLogo') || '',
                weekly_digest: formData.get('weeklyDigest') === 'on'
              };
              const res = await fetch('/api/profile', {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
              });
              if (res.ok) {
                alert('Settings saved successfully!');
                setUserProfile({ ...userProfile, ...payload });
              } else {
                alert('Failed to save settings');
              }
            } catch (err) { alert('Network error'); }
          }}>
            <h2 style={{ fontSize: '1.4rem', color: D, marginBottom: 24, fontWeight: 700 }}>Workspace Settings</h2>
            
            <div style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
              <h3 style={{ fontSize: '1.1rem', color: D, marginBottom: 16 }}>Business Profile</h3>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: D, marginBottom: 8 }}>Business Name</label>
                <input name="businessName" defaultValue={userProfile?.business_name} type="text" style={{ width: '100%', padding: '10px 14px', border: `1px solid ${B}`, borderRadius: 6, fontSize: '0.95rem', outline: 'none' }} placeholder="E.g. Acme Corp" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: D, marginBottom: 8 }}>Primary Website URL</label>
                <input name="primaryUrl" defaultValue={userProfile?.primary_url} type="url" style={{ width: '100%', padding: '10px 14px', border: `1px solid ${B}`, borderRadius: 6, fontSize: '0.95rem', outline: 'none' }} placeholder="https://..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: D, marginBottom: 8 }}>Industry / Type</label>
                  <input name="businessType" defaultValue={userProfile?.business_type} type="text" style={{ width: '100%', padding: '10px 14px', border: `1px solid ${B}`, borderRadius: 6, fontSize: '0.95rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: D, marginBottom: 8 }}>Monthly Budget</label>
                  <select name="monthlyBudget" defaultValue={userProfile?.monthly_budget} style={{ width: '100%', padding: '10px 14px', border: `1px solid ${B}`, borderRadius: 6, fontSize: '0.95rem', outline: 'none', background: '#fff' }}>
                    <option value="Under $1K">Under $1K</option>
                    <option value="$1K to $5K">$1K to $5K</option>
                    <option value="$5K to $20K">$5K to $20K</option>
                    <option value="$20K to $100K">$20K to $100K</option>
                    <option value="Over $100K">Over $100K</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 12, padding: 24, marginBottom: 32 }}>
              <h3 style={{ fontSize: '1.1rem', color: D, marginBottom: 16 }}>Notifications</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input type="checkbox" name="weeklyDigest" defaultChecked={userProfile?.weekly_digest} id="wd" style={{ width: 18, height: 18, accentColor: P, cursor: 'pointer' }} />
                <label htmlFor="wd" style={{ fontSize: '0.9rem', color: D, cursor: 'pointer' }}>Receive Monday weekly score digest emails</label>
              </div>
            </div>

            <button type="submit" style={{ background: P, color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem', transition: 'opacity 0.2s' }} onMouseOver={e=>e.currentTarget.style.opacity='0.9'} onMouseOut={e=>e.currentTarget.style.opacity='1'}>Save Settings</button>
          </form>
        )}

        {/* ══════ REFERRALS VIEW ══════ */}
        {sidebarNav === 'referrals' && (
          <div style={{ maxWidth: 800 }}>
            <h2 style={{ fontSize: '1.4rem', color: D, marginBottom: 8, fontWeight: 700 }}>Partner Program</h2>
            <p style={{ fontSize: '0.95rem', color: G, marginBottom: 32 }}>Share ZieAds with your network. Earn free months or direct cash commissions.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {/* Give 1 get 1 */}
              <div style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column' }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>
                </div>
                <h3 style={{ fontSize: '1.1rem', color: D, marginBottom: 8 }}>Give a Month, Get a Month</h3>
                <p style={{ fontSize: '0.9rem', color: G, marginBottom: 24, flex: 1 }}>Invite friends to ZieAds. When they run their first audit, you both get 1 free month of the Pro tier automatically applied to your accounts.</p>
                
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: `1px dashed ${B}`, marginBottom: 16 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: G, marginBottom: 4, textTransform: 'uppercase' }}>Your Invite Link</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <code style={{ flex: 1, fontSize: '0.85rem', color: D, wordBreak: 'break-all' }}>https://zieads.com/invite/{userEmail ? userEmail.split('@')[0] : 'user123'}</code>
                    <button onClick={() => alert('Link copied!')} style={{ background: 'transparent', border: `1px solid ${B}`, borderRadius: 4, padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600, color: D }}>Copy</button>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: D }}>
                  <span>Referrals: 0</span>
                  <span style={{ color: P }}>$0 Earned</span>
                </div>
              </div>

              {/* Affiliate Program */}
              <div style={{ background: 'linear-gradient(135deg, rgba(123,47,190,0.05) 0%, rgba(123,47,190,0.15) 100%)', border: `1px solid rgba(123,47,190,0.2)`, borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column' }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: P, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="2"></circle><path d="M6 12h.01M18 12h.01"></path></svg>
                </div>
                <h3 style={{ fontSize: '1.1rem', color: D, marginBottom: 8 }}>Affiliate Program</h3>
                <p style={{ fontSize: '0.9rem', color: G, marginBottom: 24, flex: 1 }}>Are you an agency or content creator? Earn a <strong>30% recurring commission</strong> on all paid plans for the first 12 months.</p>
                
                <button onClick={() => window.open('https://stripe.com/', '_blank')} style={{ background: P, color: '#fff', border: 'none', padding: '12px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem', alignSelf: 'flex-start' }}>
                  Register as Affiliate
                </button>
              </div>
            </div>

            {/* Social Proof Badge Embed */}
            <div style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 12, padding: 24, marginTop: 24 }}>
              <h3 style={{ fontSize: '1.1rem', color: D, marginBottom: 8 }}>Embed your Score Badge</h3>
              <p style={{ fontSize: '0.9rem', color: G, marginBottom: 16 }}>Showcase your paid ads readiness to your customers. Copy this HTML snippet and paste it into your website's footer.</p>
              
              <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <code style={{ display: 'block', padding: 12, background: '#f8fafc', border: `1px dashed ${B}`, borderRadius: 8, fontSize: '0.75rem', color: D, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {`<a href="https://zieads.com/reports/${userEmail ? userEmail.split('@')[0] : 'user123'}" target="_blank">\n  <img src="https://api.zieads.com/v1/badge/${userEmail ? userEmail.split('@')[0] : 'user123'}" alt="Verified by ZieAds" width="200" height="60" />\n</a>`}
                  </code>
                  <button onClick={() => alert('Code copied!')} style={{ marginTop: 12, background: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600, color: D, cursor: 'pointer' }}>Copy HTML</button>
                </div>
                <div style={{ width: 200, height: 60, background: '#f8fafc', borderRadius: 8, border: `2px solid ${B}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: G, fontSize: '0.8rem', position: 'relative' }}>
                  <img src={`/api/badge/${userEmail ? userEmail.split('@')[0] : 'user123'}`} alt="Badge Preview" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1 }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  <span style={{ position: 'relative', zIndex: 0 }}>Badge Preview</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
