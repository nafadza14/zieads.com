import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Check, CreditCard, Copy, Gift, Calendar, Sparkles, Target, BarChart3, LineChart, History, Bell, Briefcase, MessageSquare, Code2, LayoutGrid } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import NounIcon from '../components/NounIcon';
import { useCreditStore } from '../lib/creditStore';
import FeatureGateModal from '../components/FeatureGateModal';
import DepletionOverlay from '../components/DepletionOverlay';
import V3Layout from '../components/v3/V3Layout';
import {
  Card,
  CardTitle,
  DarkButton,
  EmptyState,
  GhostButton,
  GrowBar,
  CountUp,
  LoadingState,
  PageBody,
  PageHeader,
  Pill,
  SegTabs,
  Skeleton,
  TextRollButton,
} from '../components/v3/ui';
import './client-dashboard.css';

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

const BUSINESS_TYPES = ['E-commerce', 'SaaS', 'Local Business', 'B2B Lead Gen', 'Creator', 'Other'];
const BUDGETS = ['Under $1K', '$1K to $5K', '$5K to $20K', '$20K to $100K', 'Over $100K'];
const ROLES = [
  'Solo founder',
  'Small business owner',
  'In-house marketer',
  'Freelance marketer or consultant',
  'Marketing agency',
  'Content creator',
  'Other'
];
const ACCOUNT_VOLUMES = ['1-3', '4-6', '7-10', '11-20', '21-50', '50+'];
const ONBOARDING_GOALS = [
  'What to post today',
  'Which of my ads are working',
  'Why my numbers dropped',
  'What competitors are doing',
  'Whether my setup is ready',
  'How to scale what works',
  'Write high converting copy',
  'Improve ROAS / CPA',
  'Scale ad spend budget'
];
const ONBOARDING_TOOLS = [
  'Native platform tools',
  'A social media scheduler',
  'A general AI assistant',
  'A hired analyst or agency',
  'Spreadsheets and notes',
  'Meta Ads Manager',
  'Google Analytics',
  'Shopify'
];
const PLATFORMS = ['Instagram', 'TikTok', 'LinkedIn', 'Facebook', 'Google Ads', 'YouTube', 'X (Twitter)', 'Threads'];

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
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      setSidebarNav(tabParam);
    } else if (location.state && (location.state as any).defaultTab) {
      setSidebarNav((location.state as any).defaultTab);
    } else if (location.pathname === '/clients') {
      setSidebarNav('settings');
    }
  }, [location.state, location.pathname, location.search]);

  const [selectedSkill, setSelectedSkill] = useState('audit');
  const [urlInput, setUrlInput] = useState('');
  const [checkedFindings, setCheckedFindings] = useState<Set<number>>(new Set());
  const [runningSkill] = useState<string | null>(null);
  const [skillResult] = useState<any>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [sidebarNav, setSidebarNav] = useState('settings');
  const [latestAudit, setLatestAudit] = useState<any>(null);
  const [recentAudits, setRecentAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [copyActiveTab, setCopyActiveTab] = useState('metaAds');

  const [profileForm, setProfileForm] = useState({
    businessName: '',
    primaryUrl: '',
    businessType: '',
    monthlyBudget: '',
    role: '',
    accountVolume: '',
    goals: [] as string[],
    currentTools: [] as string[],
    platformsInFocus: [] as string[],
    challenge: '',
    weeklyDigest: false
  });

  const toggleGoalSetting = (g: string) => {
    setProfileForm(prev => ({
      ...prev,
      goals: prev.goals.includes(g)
        ? prev.goals.filter(x => x !== g)
        : [...prev.goals, g],
    }));
  };

  const toggleToolSetting = (t: string) => {
    setProfileForm(prev => ({
      ...prev,
      currentTools: prev.currentTools.includes(t)
        ? prev.currentTools.filter(x => x !== t)
        : [...prev.currentTools, t],
    }));
  };

  const togglePlatformSetting = (pl: string) => {
    setProfileForm(prev => ({
      ...prev,
      platformsInFocus: prev.platformsInFocus.includes(pl)
        ? prev.platformsInFocus.filter(x => x !== pl)
        : [...prev.platformsInFocus, pl],
    }));
  };

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
          const p = profileJson.data;
          setUserProfile(p);
          setProfileForm({
            businessName: p.business_name || '',
            primaryUrl: p.primary_url || '',
            businessType: p.business_type || '',
            monthlyBudget: p.monthly_budget || '',
            role: p.role || '',
            accountVolume: p.account_volume || '',
            goals: p.goals || [],
            currentTools: p.current_tools || [],
            platformsInFocus: p.platforms_in_focus || (p.platforms || []),
            challenge: p.challenge || '',
            weeklyDigest: p.weekly_digest || false
          });
          // Pre-fill URL input from saved profile if user hasn't typed one
          if (p.primary_url) {
            setUrlInput(prev => prev || p.primary_url);
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

    if (skillId === 'audit' || skillId === 'quick') {
      localStorage.setItem('zieads_businessContext', JSON.stringify({
        url: u,
        businessName: userProfile?.business_name || 'My Business',
        auditType: skillId === 'audit' ? 'full' : 'quick'
      }));
      window.location.href = '/audit/progress';
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
    localStorage.removeItem('zieads_onboarding_completed');
    await supabase.auth.signOut();
    navigate('/');
  };


  // Brief "Saved" confirmation after a successful save (presentation only)
  const [savedFlash, setSavedFlash] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers,
        body: JSON.stringify(profileForm)
      });
      if (res.ok) {
        alert('Settings & Onboarding profile saved successfully!');
        setUserProfile({
          ...userProfile,
          business_name: profileForm.businessName,
          primary_url: profileForm.primaryUrl,
          business_type: profileForm.businessType,
          monthly_budget: profileForm.monthlyBudget,
          role: profileForm.role,
          account_volume: profileForm.accountVolume,
          goals: profileForm.goals,
          current_tools: profileForm.currentTools,
          platforms_in_focus: profileForm.platformsInFocus,
          challenge: profileForm.challenge,
          weekly_digest: profileForm.weeklyDigest
        });
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 2600);
      } else {
        alert('Failed to save settings');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  // Extract report data from latestAudit (fetched from DB)
  const hasReport = !!latestAudit;
  const report = latestAudit?.report || {};
  const overall = latestAudit?.overall_score || 0;
  const grade = latestAudit?.grade || '-';
  const dims = latestAudit?.dimensions || {};
  const findings: any[] = latestAudit?.findings || [];
  const businessName = latestAudit?.business_name || '';
  const auditUrl = latestAudit?.url || '';
  const todayStr = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());
  const todayShort = todayStr.slice(0, 3).toUpperCase();
  const scoreTone = (s: number): 'good' | 'warn' | 'bad' | 'neutral' => (s >= 70 ? 'good' : s >= 50 ? 'warn' : s > 0 ? 'bad' : 'neutral');
  const getScoreColor = (s: number) => {
    const t = scoreTone(s);
    return t === 'good' ? 'var(--zd-good)' : t === 'warn' ? 'var(--zd-warn)' : t === 'bad' ? 'var(--zd-bad)' : 'var(--zd-ink-3)';
  };
  const focusCommand = () => document.querySelector<HTMLInputElement>('input[type="text"]')?.focus();
  const handle = userEmail ? userEmail.split('@')[0] : 'user123';

  const HEAD: Record<string, { label: string; title: string; subtitle: string }> = {
    settings: {
      label: 'Settings',
      title: 'Your workspace settings.',
      subtitle: 'Your business profile and campaign goals. These settings frame every AI Agent audit and daily briefing.',
    },
    reports: {
      label: 'Reports',
      title: 'Account and report history.',
      subtitle: 'Score trends, every audit you have run, and how you compare to your industry.',
    },
    home: {
      label: 'Home',
      title: hasReport ? "Good morning. Let's make your ads win today." : 'Welcome to ZieAds. Run your first audit.',
      subtitle: hasReport ? 'Your latest audit, quick actions and the weekly rhythm in one place.' : 'Paste any website URL below and the agents will score your paid ads readiness.',
    },
    skills: {
      label: 'Skills',
      title: 'Every AI skill, one click away.',
      subtitle: 'Paste a URL in the command bar, then run any skill against it.',
    },
    referrals: {
      label: 'Referrals',
      title: 'Share ZieAds. Earn rewards.',
      subtitle: 'Share ZieAds with your network. Earn free months or direct cash commissions.',
    },
  };
  const head = HEAD[sidebarNav] || { label: 'Workspace', title: 'Your ZieAds workspace.', subtitle: '' };

  const opt = (active: boolean, label: React.ReactNode, onClick: () => void, key: string) => (
    <button key={key} type="button" className={`zcd-opt ${active ? 'is-active' : ''}`} onClick={onClick} aria-pressed={active}>
      <span className="zcd-check" aria-hidden="true"><Check size={11} strokeWidth={3} /></span>
      {label}
    </button>
  );
  const optCard = (active: boolean, label: string, sub: string | undefined, onClick: () => void, key: string) => (
    <button key={key} type="button" className={`zcd-opt-card ${active ? 'is-active' : ''}`} onClick={onClick} aria-pressed={active}>
      <span className="zcd-check" aria-hidden="true"><Check size={11} strokeWidth={3} /></span>
      {label}
      {sub && <small>{sub}</small>}
    </button>
  );

  const BIZ_SUB: Record<string, string> = {
    'E-commerce': 'Online store',
    SaaS: 'Software product',
    'Local Business': 'Physical location',
    'B2B Lead Gen': 'Pipeline and demos',
    Creator: 'Audience first',
    Other: 'Something else',
  };

  return (
    <V3Layout>
      <PageHeader
        number="09"
        label={head.label}
        title={head.title}
        subtitle={head.subtitle || undefined}
        actions={
          <>
            {hasReport && sidebarNav === 'home' && (
              <DarkButton onClick={handleGeneratePDF} loading={isGeneratingPDF}>
                Download PDF report
              </DarkButton>
            )}
            <span className="zcd-date">
              <span className="zd-live" />
              {todayStr}
            </span>
          </>
        }
      />

      <PageBody>
        {/* Command Bar */}
        {sidebarNav !== 'reports' && (
          <div>
            <Card glass padding={0}>
              <div className="zcd-command">
                <select className="zd-select" value={selectedSkill} onChange={e => setSelectedSkill(e.target.value)} aria-label="Skill">
                  {SKILLS.map(s => <option key={s.id} value={s.id}>{s.cmd}</option>)}
                </select>
                <input
                  type="text"
                  className="zd-input"
                  placeholder="Paste any website URL here..."
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRunSkill(selectedSkill)}
                />
                <DarkButton onClick={() => handleRunSkill(selectedSkill)} disabled={!!runningSkill} loading={!!runningSkill}>
                  Run agent
                </DarkButton>
              </div>
            </Card>
            <div className="zcd-command-hint">
              <Sparkles size={13} />
              <span>{SKILLS.find(s => s.id === selectedSkill)?.name}: {SKILLS.find(s => s.id === selectedSkill)?.desc}</span>
            </div>
            {/* Skill credit depletion inline banner */}
            {(creditStore.skill_run.state === 'DEPLETED' || creditStore.skill_run.state === 'RESET_IMMINENT') && (
              <div style={{ marginTop: 12 }}>
                <DepletionOverlay pool="skill_run" inline />
              </div>
            )}
          </div>
        )}

        {/* Skill Result Output: legacy, kept for type safety only, skills now navigate to /skill-report/:skillName */}
        {false && skillResult && sidebarNav !== 'reports' && (
          <Card>
            <CardTitle
              icon={<Sparkles />}
              action={<GhostButton onClick={() => void 0}>Back to dashboard</GhostButton>}
            >
              Result: {SKILLS.find(s => s.id === skillResult.skillId)?.name}
            </CardTitle>
            {skillResult.skillId === 'quick' ? (
              <div className="zcd-stack">
                <div className="zcd-score">
                  <div className="zcd-score-num" style={{ color: getScoreColor(skillResult.data.score) }}>{skillResult.data.score}</div>
                  <div className="zcd-score-meta">
                    <strong>Paid ads readiness snapshot</strong>
                    <span className="zd-muted zd-text-sm">{skillResult.data.businessName || skillResult.data.url}</span>
                    <Pill tone="accent">{skillResult.data.businessType}</Pill>
                  </div>
                </div>
                <div className="zd-grid-auto">
                  {Object.entries(skillResult.data.signals || {}).map(([name, sig]: [string, any]) => (
                    <Card key={name} padding={14}>
                      <div className="zcd-skill-head" style={{ marginBottom: 6 }}>
                        <span className="zd-eyebrow">{name}</span>
                        <Pill tone={sig.score >= 8 ? 'good' : sig.score >= 5 ? 'warn' : 'bad'}>{sig.score}/10</Pill>
                      </div>
                      <div className="zd-text-sm">{sig.status}</div>
                    </Card>
                  ))}
                </div>
                <div>
                  <TextRollButton
                    text="Run full 6 dimension audit"
                    onClick={() => {
                      localStorage.setItem('zieads_businessContext', JSON.stringify({
                        url: skillResult.data.url,
                        businessName: userProfile?.business_name || 'My Business',
                        auditType: 'full'
                      }));
                      window.location.href = '/audit/progress';
                    }}
                  />
                </div>
              </div>
            ) : skillResult.skillId === 'copy' ? (
              <div className="zcd-stack">
                {skillResult.data.analysis && (
                  <Card className="zd-card-accent">
                    <CardTitle icon={<Target />}>Strategic analysis</CardTitle>
                    <p className="zd-text-sm"><strong>Strategy:</strong> {skillResult.data.analysis.strategy}</p>
                    <p className="zd-text-sm"><strong>Tone of voice:</strong> {skillResult.data.analysis.toneOfVoice}</p>
                    <div className="zcd-opts">
                      {skillResult.data.analysis.keySellingPoints?.map((sp: string, i: number) => (
                        <Pill key={i} tone="neutral"><Check /> {sp}</Pill>
                      ))}
                    </div>
                  </Card>
                )}
                <SegTabs
                  size="sm"
                  tabs={['metaAds', 'googleAds', 'tiktokAds', 'linkedinAds'].map(tab => ({
                    id: tab,
                    label: tab.replace('Ads', '').charAt(0).toUpperCase() + tab.replace('Ads', '').slice(1),
                  }))}
                  value={copyActiveTab}
                  onChange={setCopyActiveTab}
                />
                <div key={copyActiveTab} className="zcd-stack">
                  {copyActiveTab === 'metaAds' && (
                    <>
                      <div>
                        <label className="zd-label">Primary text (long body)</label>
                        <div className="zcd-result-block">{skillResult.data.deliverables.metaAds.longBody || skillResult.data.deliverables.metaAds.primaryTexts?.[0]}</div>
                      </div>
                      <div className="zd-grid-2">
                        <div>
                          <label className="zd-label">Headlines</label>
                          <div className="zcd-stack" style={{ gap: 8 }}>
                            {skillResult.data.deliverables.metaAds.headlines?.map((h: string, i: number) => (
                              <div key={i} className="zcd-result-block">{h}</div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="zd-label">Short body</label>
                          <div className="zcd-result-block">{skillResult.data.deliverables.metaAds.shortBody}</div>
                        </div>
                      </div>
                    </>
                  )}
                  {copyActiveTab === 'googleAds' && (
                    <>
                      <div>
                        <label className="zd-label">Search headlines (15)</label>
                        <div className="zd-grid-2" style={{ gap: 8 }}>
                          {skillResult.data.deliverables.googleAds.headlines?.map((h: string, i: number) => (
                            <div key={i} className="zcd-result-block">{h}</div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="zd-label">Search descriptions (4)</label>
                        <div className="zcd-stack" style={{ gap: 8 }}>
                          {skillResult.data.deliverables.googleAds.descriptions?.map((d: string, i: number) => (
                            <div key={i} className="zcd-result-block">{d}</div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                  {copyActiveTab === 'tiktokAds' && (
                    <>
                      {skillResult.data.deliverables.tiktokAds.scriptOutlines?.map((s: any, i: number) => (
                        <Card key={i} padding={16}>
                          <div className="zd-eyebrow" style={{ marginBottom: 8 }}>Script option {i + 1}</div>
                          <p className="zd-text-sm"><strong>Hook:</strong> {s.hook}</p>
                          <p className="zd-text-sm"><strong>Body:</strong> {s.body}</p>
                          <p className="zd-text-sm"><strong>CTA:</strong> {s.cta}</p>
                        </Card>
                      ))}
                      <div>
                        <label className="zd-label">Captions</label>
                        <div className="zcd-opts">
                          {skillResult.data.deliverables.tiktokAds.captions?.map((c: string, i: number) => (
                            <Pill key={i}>{c}</Pill>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                  {copyActiveTab === 'linkedinAds' && (
                    <>
                      {skillResult.data.deliverables.linkedinAds.sponsoredContent?.map((c: any, i: number) => (
                        <Card key={i} padding={16}>
                          <div className="zd-eyebrow" style={{ marginBottom: 8 }}>Sponsored content {i + 1}</div>
                          <p className="zd-text-sm"><strong>Intro:</strong> {c.intro}</p>
                          <p className="zd-text-sm"><strong>Headline:</strong> {c.headline}</p>
                        </Card>
                      ))}
                      {skillResult.data.deliverables.linkedinAds.messageAds?.map((m: any, i: number) => (
                        <Card key={i} padding={16}>
                          <div className="zd-eyebrow" style={{ marginBottom: 8 }}>Direct message {i + 1}</div>
                          <p className="zd-text-sm"><strong>Subject:</strong> {m.subject}</p>
                          <p className="zd-text-sm" style={{ whiteSpace: 'pre-wrap' }}>{m.body}</p>
                        </Card>
                      ))}
                    </>
                  )}
                </div>
              </div>
            ) : (
              <pre className="zcd-result-block zcd-result-pre">
                {JSON.stringify(skillResult.data?.deliverables || skillResult.data, null, 2)}
              </pre>
            )}
          </Card>
        )}

        {/* ══════ REPORTS VIEW ══════ */}
        {sidebarNav === 'reports' && (
          <div className="zcd-stack">
            <AdsIntegrationMock />

            <Card>
              <CardTitle icon={<LineChart />} sub="Overall score of each audit, oldest to newest">
                Audit score trend
              </CardTitle>
              {loading ? (
                <Skeleton height={150} radius={14} />
              ) : (
                <div className="zcd-trend">
                  {recentAudits.slice().reverse().map((a, i) => (
                    <div key={i} className="zcd-trend-col" title={`${a.overall_score}/100`}>
                      <div className="zcd-trend-val">{a.overall_score}</div>
                      <div
                        className={`zcd-trend-bar tone-${scoreTone(a.overall_score)} ${i === recentAudits.length - 1 ? 'is-last' : ''}`}
                        style={{ height: `${a.overall_score}%`, animationDelay: `${i * 60}ms` }}
                      />
                      <div className="zcd-trend-date">{new Date(a.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                    </div>
                  ))}
                  {recentAudits.length === 0 && (
                    <div className="zd-muted zd-text-sm" style={{ width: '100%', textAlign: 'center', alignSelf: 'center' }}>No audits to display a trend yet.</div>
                  )}
                </div>
              )}
            </Card>

            <Card padding={0}>
              <div style={{ padding: '20px 20px 4px' }}>
                <CardTitle icon={<History />} sub={`${recentAudits.length} audit${recentAudits.length === 1 ? '' : 's'}`}>
                  Audit history
                </CardTitle>
              </div>
              <div className="zcd-hist">
                {loading ? (
                  <div style={{ padding: 14 }}><Skeleton height={44} count={3} radius={12} /></div>
                ) : recentAudits.length === 0 ? (
                  <EmptyState
                    icon={<History size={22} />}
                    title="No audits found"
                    body="Run an audit from Home and it will show up here."
                    action={<GhostButton onClick={() => setSidebarNav('home')}>Go to Home</GhostButton>}
                  />
                ) : (
                  recentAudits.map((a, i) => (
                    <div key={i} className="zd-row" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
                      <div className="zcd-hist-main">
                        <strong>{a.business_name || a.url}</strong>
                        <span>{new Date(a.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="zcd-hist-meta">
                        <span className="zcd-hist-score">
                          <span className={`zcd-dot tone-${scoreTone(a.overall_score)}`} />
                          {a.overall_score}/100
                        </span>
                        <Pill tone="dark">{a.grade}</Pill>
                        <Pill className="zcd-cap">{a.audit_type}</Pill>
                        <DarkButton
                          onClick={() => {
                            setLatestAudit(a);
                            localStorage.setItem('zieads_latest_audit', JSON.stringify(a));
                            navigate('/audit/report');
                          }}
                        >
                          View report
                        </DarkButton>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {recentAudits.length > 0 && <IndustryInsights latestScore={recentAudits[0].overall_score} />}
            <CompareAuditView audits={recentAudits} />
          </div>
        )}

        {/* ══════ HOME VIEW ══════ */}
        {sidebarNav === 'home' && (
          <>
            {/* Empty State */}
            {!hasReport && (loading ? (
              <Card>
                <LoadingState text="Loading your latest audit" />
              </Card>
            ) : (
              <EmptyState
                icon={<Target size={22} />}
                title="No audits yet"
                body="Paste any website URL above and run your first AI audit. You will get a full paid ads readiness score across 6 dimensions."
                action={<TextRollButton text="Run your first audit" onClick={focusCommand} />}
              />
            ))}

            {/* Daily Brief */}
            {hasReport && (
              <Card glass>
                <CardTitle
                  icon={<Sparkles />}
                  sub={businessName || auditUrl}
                  action={<Pill tone="accent"><span className="zd-live" /> Latest</Pill>}
                >
                  Latest audit insights
                </CardTitle>
                <p className="zd-text-sm" style={{ fontSize: 14.5, margin: '0 0 16px' }}>{report.executiveSummary || 'No executive summary available.'}</p>
                <GhostButton onClick={() => navigate('/audit/report')}>View full report <ArrowRight size={14} /></GhostButton>
              </Card>
            )}

            {/* Quick Actions */}
            <div className="zcd-section-h">
              <h2>Quick actions</h2>
              <span className="zd-eyebrow">Pick one, then paste a URL</span>
            </div>
            <div className="zd-grid-3">
              {SKILLS.slice(0, 6).map((s, i) => (
                <Card key={i} className="zcd-skill-card" onClick={() => { setSelectedSkill(s.id); focusCommand(); }}>
                  <div className="zcd-skill-head">
                    <span className="zd-icon-dot"><NounIcon name={s.id} size={16} color="currentColor" /></span>
                    {selectedSkill === s.id && <Pill tone="accent">Selected</Pill>}
                  </div>
                  <h3 className="zcd-skill-name">{s.name}</h3>
                  <p className="zcd-skill-desc">{s.desc}</p>
                  <div className="zcd-skill-foot">
                    <Pill className="zcd-cmd">{s.cmd}</Pill>
                    <span className="zcd-go"><ArrowRight size={13} /></span>
                  </div>
                </Card>
              ))}
            </div>

            {/* Score + Findings */}
            {hasReport && (
              <div className="zd-grid-2">
                {/* Score Card */}
                <Card>
                  <CardTitle icon={<BarChart3 />}>Paid ads readiness score</CardTitle>
                  <div className="zcd-score">
                    <div className="zcd-score-num"><CountUp value={overall} /></div>
                    <div className="zcd-score-meta">
                      <Pill tone={scoreTone(overall)}>Grade {grade}</Pill>
                      <span className="zd-muted zd-text-sm">{businessName || auditUrl}</span>
                    </div>
                  </div>
                  <div className="zcd-dims">
                    {[
                      { name: 'Creative & offer', score: dims.creative?.score || 0 },
                      { name: 'Audience clarity', score: dims.audience?.score || 0 },
                      { name: 'Landing page', score: dims.landing?.score || 0 },
                      { name: 'Platform fit', score: dims.platform?.score || 0 },
                      { name: 'Funnel coverage', score: dims.funnel?.score || 0 },
                      { name: 'Competitive pos.', score: dims.competitive?.score || 0 },
                    ].map((d, i) => (
                      <div key={i} className="zcd-dim">
                        <span>{d.name}</span>
                        <GrowBar value={d.score} delay={i * 90} tone={d.score >= 70 ? 'good' : d.score >= 50 ? 'accent' : 'dark'} />
                        <b>{d.score}</b>
                      </div>
                    ))}
                  </div>
                  <GhostButton onClick={() => navigate('/audit/report')}>View full report <ArrowRight size={14} /></GhostButton>
                </Card>

                {/* Critical Findings */}
                <Card style={{ display: 'flex', flexDirection: 'column' }}>
                  <CardTitle icon={<Target />} action={findings.length > 0 ? <Pill tone="bad">{findings.length}</Pill> : undefined}>
                    Critical findings and strategy
                  </CardTitle>
                  {findings.length === 0 ? (
                    <div className="zd-muted zd-text-sm" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>No findings</div>
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
                </Card>
              </div>
            )}

            {/* Weekly Rhythm */}
            <Card>
              <CardTitle icon={<Calendar />} sub="A simple cadence that keeps every account sharp">
                Weekly rhythm
              </CardTitle>
              <div className="zcd-rhythm">
                {RHYTHM.map((r, i) => {
                  const isToday = r.day === todayShort;
                  return (
                    <div key={i} className={`zcd-rhythm-row ${isToday ? 'is-today' : ''}`} style={{ animationDelay: `${i * 70}ms` }}>
                      <div className="zcd-rhythm-day">
                        <Pill tone={isToday ? 'accent' : 'neutral'}>{r.day}</Pill>
                      </div>
                      <div className="zcd-rhythm-rail">
                        <span className="zcd-rhythm-dot" />
                        {i < RHYTHM.length - 1 && <span className="zcd-rhythm-line" />}
                      </div>
                      <div className="zcd-rhythm-body">
                        <strong>{r.label}</strong>
                        <span>{r.cmds.replace(' · ', ', ')}</span>
                      </div>
                      <div className="zcd-rhythm-tag">{isToday && <Pill tone="dark">Today</Pill>}</div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </>
        )}

        {/* ══════ ALL SKILLS VIEW ══════ */}
        {sidebarNav === 'skills' && (
          <>
            <div className="zcd-section-h">
              <h2>All AI skills</h2>
              <Pill tone="accent"><LayoutGrid /> {SKILLS.length} skills</Pill>
            </div>
            <div className="zd-grid-auto">
              {SKILLS.map(s => (
                <Card key={s.id} hover className="zcd-skill-card">
                  <div className="zcd-skill-head">
                    <span className="zd-icon-dot"><NounIcon name={s.id} size={16} color="currentColor" /></span>
                    <Pill className="zcd-cmd" tone="neutral">{s.cmd}</Pill>
                  </div>
                  <h3 className="zcd-skill-name">{s.name}</h3>
                  <p className="zcd-skill-desc">{s.desc}</p>
                  <div className="zcd-skill-foot">
                    <span />
                    <DarkButton onClick={() => { setSelectedSkill(s.id); handleRunSkill(s.id); }} disabled={runningSkill === s.id} loading={runningSkill === s.id}>
                      Run
                    </DarkButton>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* ══════ SETTINGS VIEW ══════ */}
        {sidebarNav === 'settings' && (
          <form className="zcd-stack zcd-narrow" onSubmit={handleSaveSettings}>
            {/* Card 1: Business Basics */}
            <Card>
              <CardTitle icon={<Briefcase />} sub="Who you are and what you sell">Business basics</CardTitle>

              <div className="zcd-field">
                <label className="zd-label" htmlFor="zcd-bn">Business name</label>
                <input
                  id="zcd-bn"
                  type="text"
                  className="zd-input"
                  value={profileForm.businessName}
                  onChange={e => setProfileForm(p => ({ ...p, businessName: e.target.value }))}
                  placeholder="E.g. Acme Corp"
                />
              </div>

              <div className="zcd-field">
                <label className="zd-label" htmlFor="zcd-url">Primary website URL</label>
                <input
                  id="zcd-url"
                  type="url"
                  className="zd-input"
                  value={profileForm.primaryUrl}
                  onChange={e => setProfileForm(p => ({ ...p, primaryUrl: e.target.value }))}
                  placeholder="https://example.com"
                />
              </div>

              <div className="zcd-field">
                <label className="zd-label">Business type</label>
                <div className="zcd-opt-grid">
                  {BUSINESS_TYPES.map(t =>
                    optCard(profileForm.businessType === t, t, BIZ_SUB[t], () => setProfileForm(p => ({ ...p, businessType: t })), t)
                  )}
                </div>
              </div>

              <div className="zcd-field">
                <label className="zd-label">Monthly ads budget</label>
                <div className="zcd-opt-grid">
                  {BUDGETS.map(b =>
                    optCard(profileForm.monthlyBudget === b, b, 'per month', () => setProfileForm(p => ({ ...p, monthlyBudget: b })), b)
                  )}
                </div>
              </div>
            </Card>

            {/* Card 2: AI Context & Onboarding Persona Profile */}
            <Card>
              <CardTitle
                icon={<Sparkles />}
                sub="Your onboarding answers tune the AI Agent's tone, strategic depth and recommendations across ZieAds."
                action={<Pill tone="accent">Used by AI Agent & Analytics</Pill>}
              >
                AI persona and onboarding profile
              </CardTitle>

              <div className="zcd-field">
                <label className="zd-label">Your role</label>
                <div className="zcd-opts">
                  {ROLES.map(r => opt(profileForm.role === r, r, () => setProfileForm(p => ({ ...p, role: r })), r))}
                </div>
              </div>

              <div className="zcd-field">
                <label className="zd-label">Accounts managed</label>
                <div className="zcd-opts">
                  {ACCOUNT_VOLUMES.map(v => opt(profileForm.accountVolume === v, `${v} accounts`, () => setProfileForm(p => ({ ...p, accountVolume: v })), v))}
                </div>
              </div>

              <div className="zcd-field">
                <label className="zd-label">Strategic marketing priorities</label>
                <p className="zcd-field-hint">Pick as many as you like</p>
                <div className="zcd-opts">
                  {ONBOARDING_GOALS.map(g => opt(profileForm.goals.includes(g), g, () => toggleGoalSetting(g), g))}
                </div>
              </div>

              <div className="zcd-field">
                <label className="zd-label">Current marketing tool stack</label>
                <p className="zcd-field-hint">Pick as many as you like</p>
                <div className="zcd-opts">
                  {ONBOARDING_TOOLS.map(t => opt(profileForm.currentTools.includes(t), t, () => toggleToolSetting(t), t))}
                </div>
              </div>

              <div className="zcd-field">
                <label className="zd-label">Channels in focus</label>
                <p className="zcd-field-hint">Pick as many as you like</p>
                <div className="zcd-opts">
                  {PLATFORMS.map(pl => opt(profileForm.platformsInFocus.includes(pl), pl, () => togglePlatformSetting(pl), pl))}
                </div>
              </div>
            </Card>

            {/* Card 3: Biggest Challenge */}
            <Card>
              <CardTitle icon={<MessageSquare />} sub="The AI agent frames its analysis around your specific pain point.">
                Your biggest challenge
              </CardTitle>
              <textarea
                className="zd-textarea"
                value={profileForm.challenge}
                onChange={e => setProfileForm(p => ({ ...p, challenge: e.target.value }))}
                placeholder="e.g. My ROAS keeps dropping after 7 days of a new campaign..."
                rows={3}
              />
            </Card>

            {/* Card 4: Notifications */}
            <Card>
              <CardTitle icon={<Bell />}>Notifications</CardTitle>
              <label className="zcd-switch" htmlFor="wd">
                <input
                  type="checkbox"
                  checked={profileForm.weeklyDigest}
                  onChange={e => setProfileForm(p => ({ ...p, weeklyDigest: e.target.checked }))}
                  id="wd"
                />
                <span className="zcd-switch-track" aria-hidden="true" />
                <span>Send me the Monday weekly score digest email</span>
              </label>
            </Card>

            <div className="zcd-save">
              <TextRollButton type="submit" text="Save settings" />
              {savedFlash && (
                <Pill tone="good" className="zcd-saved"><Check /> Saved</Pill>
              )}
            </div>
          </form>
        )}

        {/* ══════ REFERRALS VIEW ══════ */}
        {sidebarNav === 'referrals' && (
          <>
            <div className="zd-grid-2">
              {/* Give 1 get 1 */}
              <Card hover>
                <div className="zcd-ref">
                  <CardTitle icon={<Gift />}>Give a month, get a month</CardTitle>
                  <p className="zd-text-sm" style={{ margin: 0 }}>
                    Invite friends to ZieAds. When they run their first audit, you both get 1 free month of the Pro tier, applied automatically.
                  </p>
                  <div className="zcd-codebox">
                    <div className="zd-eyebrow">Your invite link</div>
                    <div className="zcd-codebox-row">
                      <code>https://zieads.com/invite/{handle}</code>
                      <button type="button" className="zd-icon-btn" onClick={() => alert('Link copied!')} aria-label="Copy invite link" title="Copy">
                        <Copy />
                      </button>
                    </div>
                  </div>
                  <div className="zcd-ref-foot">
                    <span>Referrals: 0</span>
                    <span className="tone-accent">$0 earned</span>
                  </div>
                </div>
              </Card>

              {/* Affiliate Program */}
              <Card hover className="zd-card-accent">
                <div className="zcd-ref">
                  <CardTitle icon={<CreditCard />}>Affiliate program</CardTitle>
                  <p className="zd-text-sm" style={{ margin: '0 0 20px' }}>
                    Are you an agency or content creator? Earn a <strong>30% recurring commission</strong> on all paid plans for the first 12 months.
                  </p>
                  <div>
                    <TextRollButton text="Register as affiliate" onClick={() => window.open('https://stripe.com/', '_blank')} />
                  </div>
                </div>
              </Card>
            </div>

            {/* Social Proof Badge Embed */}
            <Card>
              <CardTitle icon={<Code2 />} sub="Show customers your paid ads readiness. Paste this HTML into your website footer.">
                Embed your score badge
              </CardTitle>
              <div className="zcd-badge-wrap">
                <div>
                  <div className="zcd-codebox">
                    <code style={{ display: 'block' }}>
                      {`<a href="https://zieads.com/reports/${handle}" target="_blank">\n  <img src="https://api.zieads.com/v1/badge/${handle}" alt="Verified by ZieAds" width="200" height="60" />\n</a>`}
                    </code>
                  </div>
                  <GhostButton onClick={() => alert('Code copied!')}><Copy /> Copy HTML</GhostButton>
                </div>
                <div className="zcd-badge-prev">
                  <img src={`/api/badge/${handle}`} alt="Badge Preview" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  <span>Badge preview</span>
                </div>
              </div>
            </Card>
          </>
        )}
      </PageBody>

      {/* Feature Gate Modal */}
      <FeatureGateModal
        isOpen={gateModal.open}
        onClose={() => setGateModal(m => ({ ...m, open: false }))}
        featureName={gateModal.featureName}
        featureDescription={gateModal.featureDesc}
        requiredPlan={gateModal.requiredPlan || 'starter'}
        featureType={gateModal.featureType || 'skill'}
      />
    </V3Layout>
  );
}
