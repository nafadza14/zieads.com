import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  BarChart3, 
  Target, 
  Cpu, 
  CheckCircle2, 
  AlertCircle,
  LayoutDashboard,
  Megaphone,
  TrendingUp,
  Link,
  Users,
  MousePointer2,
  DollarSign,
  Download,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Layout,
  PlayCircle
} from 'lucide-react';
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium animate-pulse">Analyzing results...</p>
        </div>
      </div>
    );
  }

  if (!reportData) return null;

  const { report, agent_results: agentResults, url, business_name: businessName, created_at: generatedAt, audit_type: auditType = 'full' } = reportData;
  const { overall, grade, dimensions, findings, actionPlan, platformPriority } = report;
  const isSkillAudit = auditType !== 'full' && auditType !== 'quick';

  const getScoreColor = (s: number) => {
    if (s >= 80) return '#10b981';
    if (s >= 60) return '#f59e0b';
    return '#ef4444';
  };

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
    <button
      onClick={() => handleRunSkill(skillName)}
      disabled={runningSkill === skillName}
      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50"
    >
      <PlayCircle size={16} />
      {label}
    </button>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Overview':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Building2 className="text-indigo-600" size={20} />
                  Project Overview
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-slate-50">
                    <span className="text-slate-500">Business</span>
                    <span className="font-semibold text-slate-900">{businessName}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-50">
                    <span className="text-slate-500">Website</span>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1">
                      {url.replace(/^https?:\/\//, '')} <Link size={12} />
                    </a>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-50">
                    <span className="text-slate-500">Audit Date</span>
                    <span className="text-slate-900">{new Date(generatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Target className="text-indigo-600" size={20} />
                  Platform Priority
                </h3>
                <div className="space-y-3">
                  {platformPriority?.slice(0, 3).map((p: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-indigo-600 shadow-sm border border-slate-100">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-slate-900">{p.platform}</div>
                        <div className="text-xs text-slate-500 line-clamp-1">{p.reason}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <TrendingUp className="text-indigo-600" size={20} />
                Strategic Action Plan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider">
                    Quick Wins
                  </div>
                  <ul className="space-y-3">
                    {actionPlan?.quickWins?.map((a: string, i: number) => (
                      <li key={i} className="flex gap-2 text-sm text-slate-600">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold uppercase tracking-wider">
                    Medium Term
                  </div>
                  <ul className="space-y-3">
                    {actionPlan?.mediumTerm?.map((a: string, i: number) => (
                      <li key={i} className="flex gap-2 text-sm text-slate-600">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider">
                    Long Term
                  </div>
                  <ul className="space-y-3">
                    {actionPlan?.strategic?.map((a: string, i: number) => (
                      <li key={i} className="flex gap-2 text-sm text-slate-600">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'Creatives': {
        const creative = getAgent('creative-intelligence');
        const d = creative?.deliverables || {};
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Core Creative Strategy</h3>
              <p className="text-slate-600 mb-6">{d.heroOfferAssessment}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Primary Angle</span>
                  <p className="text-sm text-slate-900 font-medium">{d.brandIdentity?.tone || "Conversion Focused"}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Color Palette</span>
                  <p className="text-sm text-slate-900 font-medium">{d.brandIdentity?.colors || "Not found"}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Visual Style</span>
                  <p className="text-sm text-slate-900 font-medium">{d.brandIdentity?.style || "Modern"}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="flex items-center gap-2 font-bold text-slate-900 text-lg">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Megaphone size={18} />
                  </div>
                  Meta Creative Concepts
                </h4>
                {d.creativeConceptsMeta?.map((c: any, i: number) => (
                  <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-sm font-bold text-indigo-600 mb-2">{c.format}</div>
                    <div className="text-sm text-slate-900 font-medium mb-1">“{c.hook}”</div>
                    <p className="text-xs text-slate-500">{c.visualDirection}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                <h4 className="flex items-center gap-2 font-bold text-slate-900 text-lg">
                  <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center text-rose-500">
                    <PlayCircle size={18} />
                  </div>
                  TikTok Creative Concepts
                </h4>
                {d.creativeConceptsTikTok?.map((c: any, i: number) => (
                  <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-sm font-bold text-rose-500 mb-2">{c.format}</div>
                    <div className="text-sm text-slate-900 font-medium mb-1">“{c.hook}”</div>
                    <p className="text-xs text-slate-500">{c.visualDirection}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 pt-4">
               {renderSkillButton('ads-copy', 'Generate Ad Copy')}
               {renderSkillButton('ads-creatives', 'Advanced Video Mockups')}
            </div>
          </div>
        );
      }

      case 'Audiences': {
        const audience = getAgent('audience-targeting');
        const d = audience?.deliverables || {};
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
                <Users className="text-indigo-600" size={24} />
                Ideal Customer Persona
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Demographics</label>
                  <p className="text-slate-700 text-sm leading-relaxed">{d.icp?.demographics}</p>
                </div>
                <div className="space-y-2 border-l border-slate-100 md:pl-8">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pain Points</label>
                  <p className="text-slate-700 text-sm leading-relaxed">{d.icp?.psychographics}</p>
                </div>
                <div className="space-y-2 border-l border-slate-100 md:pl-8">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Motivators</label>
                  <p className="text-slate-700 text-sm leading-relaxed">{d.icp?.jobToBeDone}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="font-bold text-slate-900 mb-4">Meta Targeting Segments</h4>
                <div className="space-y-4">
                  {['cold', 'warm', 'hot'].map((tier) => (
                    <div key={tier} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-indigo-500 uppercase block mb-1">{tier}</span>
                      <p className="text-xs text-slate-600">{d.metaAudiences?.[tier]?.join(", ") || "Auto-match broad"}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="font-bold text-slate-900 mb-4">Google Search Intent</h4>
                <div className="space-y-2">
                  {d.googleAudiences?.searchIntent?.map((keyword: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-3 bg-indigo-50 rounded-lg text-indigo-700 text-xs font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      {keyword}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div>
              {renderSkillButton('ads-audiences', 'Export Detailed Audience Targeting Lists')}
            </div>
          </div>
        );
      }

      case 'Platforms': {
        const platform = getAgent('platform-budget');
        const d = platform?.deliverables || {};
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="bg-white overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Platform</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Fit Score</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Allocation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {d.platformRanking?.map((p: any, i: number) => (
                      <tr key={i}>
                        <td className="px-6 py-4 font-bold text-slate-900">{p.platform}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold" style={{ color: getScoreColor(p.fitScore) }}>{p.fitScore}%</span>
                            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${p.fitScore}%`, backgroundColor: getScoreColor(p.fitScore) }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-slate-600">{p.allocation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderSkillButton('ads-google', 'Google Ads Plan')}
                {renderSkillButton('ads-meta', 'Meta Ads Plan')}
                {renderSkillButton('ads-tiktok', 'TikTok Content Plan')}
                {renderSkillButton('ads-linkedin', 'LinkedIn B2B Strategy')}
             </div>
          </div>
        );
      }

      case 'Funnel': {
        const funnel = getAgent('funnel-conversion');
        const d = funnel?.deliverables || {};
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
                <MousePointer2 className="text-indigo-600" size={24} />
                Conversion Rate Optimization (CRO)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(d.landingPageScores || {}).map(([key, val]: [string, any]) => (
                  <div key={key} className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-bold text-slate-600">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="text-sm font-bold text-slate-900">{val}/10</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${val * 10}%`, backgroundColor: getScoreColor(val * 10) }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                 <h4 className="font-bold text-slate-900 mb-4 block">Recommended Headline Fixes</h4>
                 <div className="space-y-3">
                    {d.headlineRewrites?.map((h: string, i: number) => (
                      <div key={i} className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-sm border border-emerald-100 italic">
                        "{h}"
                      </div>
                    ))}
                 </div>
               </div>
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                 <h4 className="font-bold text-slate-900 mb-4 block">Primary Conversion Killers</h4>
                 <div className="space-y-3">
                    {d.conversionBlockers?.map((b: string, i: number) => (
                      <div key={i} className="flex gap-2 p-3 bg-rose-50 text-rose-800 rounded-xl text-sm border border-rose-100">
                        <AlertCircle className="shrink-0" size={16} />
                        {b}
                      </div>
                    ))}
                 </div>
               </div>
            </div>

            <div className="flex gap-4">
               {renderSkillButton('ads-landing', 'Audit High-Performing Landing Pages')}
               {renderSkillButton('ads-funnel', 'Build Full Customer Journey Map')}
            </div>
          </div>
        );
      }

      case 'Competitors': {
        const comp = getAgent('competitive-intelligence');
        const d = comp?.deliverables || {};
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {d.directCompetitors?.map((c: any, i: number) => (
                  <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                       <div className="font-black text-slate-900 text-lg uppercase">{c.name}</div>
                       <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded uppercase">
                         {c.adSpendTier} Spend
                       </span>
                    </div>
                    <div className="space-y-3">
                       <p className="text-sm text-slate-600"><span className="font-bold text-slate-400 uppercase text-[10px] mr-2">Strategy</span>{c.creativeApproach}</p>
                       <p className="text-sm text-slate-600"><span className="font-bold text-slate-400 uppercase text-[10px] mr-2">Core Offer</span>{c.offer}</p>
                    </div>
                  </div>
                ))}
             </div>
             <div>
                {renderSkillButton('ads-competitors', 'Analyze Competitor Ad Libraries')}
             </div>
          </div>
        );
      }

      case 'Budget': {
        const platform = getAgent('platform-budget');
        const d = platform?.deliverables || {};
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
              <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Recommended Monthly Investment</h3>
              <div className="text-5xl font-black text-slate-900 mb-8">{d.benchmarks?.expectedCPA ? "Custom Plan" : "Analyzing..."}</div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-6 rounded-2xl">
                  <div className="text-2xl font-bold text-indigo-600 mb-1">{d.budgetAllocation?.tofu || "40%"}</div>
                  <div className="text-xs font-bold text-slate-500 uppercase">Top of Funnel</div>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl">
                  <div className="text-2xl font-bold text-indigo-600 mb-1">{d.budgetAllocation?.mofu || "30%"}</div>
                  <div className="text-xs font-bold text-slate-500 uppercase">Middle of Funnel</div>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl">
                  <div className="text-2xl font-bold text-indigo-600 mb-1">{d.budgetAllocation?.bofu || "30%"}</div>
                  <div className="text-xs font-bold text-slate-500 uppercase">Bottom of Funnel</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
               <h4 className="font-bold text-slate-900 mb-4">Scaling Strategy</h4>
               <p className="text-slate-600 leading-relaxed text-sm">{d.scalingThresholds || "Focus on stabilizing initial CPA before aggressive scaling."}</p>
            </div>

            <div>
               {renderSkillButton('ads-budget', '90-Day Financial Projection')}
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                <ZieAdsLogo size={28} />
                <span className="text-lg font-black tracking-tighter text-slate-900">{agencyModel.name}</span>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <button 
                onClick={() => navigate('/clients')}
                className="text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
              >
                ← Back
              </button>
            </div>
            
            <div className="hidden md:flex items-center gap-3">
              <button 
                onClick={() => setShowBrandingModal(true)}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                Settings
              </button>
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 px-5 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg shadow-lg shadow-slate-200 hover:bg-slate-800 active:scale-95 transition-all"
              >
                <Download size={16} />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="bg-white border-b border-slate-200 py-12 px-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-10">
          <div className="relative">
            <svg viewBox="0 0 100 100" className="w-40 h-40 transform -rotate-90">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="10" />
              <circle 
                cx="50" cy="50" r="45" fill="none" stroke={getScoreColor(overall)} 
                strokeWidth="10" 
                strokeDasharray={`${overall * 2.82} 282`} 
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black" style={{ color: getScoreColor(overall) }}>{overall}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Score</span>
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-black text-slate-900 mb-2">Performance Audit Report</h1>
            <p className="text-slate-500 font-medium mb-6 flex items-center justify-center md:justify-start gap-2">
              <Building2 size={16} /> {businessName} • {url}
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <span className="px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-md shadow-emerald-200/50" style={{ backgroundColor: getScoreColor(overall) }}>
                GRADE {grade}
              </span>
              <span className="px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-100 uppercase tracking-tight">
                {auditType} analysis
              </span>
            </div>
          </div>

          <div className="hidden lg:grid grid-cols-2 gap-4">
            {dimensions?.map((d: any, i: number) => (
              <div key={i} className="flex flex-col items-end">
                <span className="text-xl font-bold text-slate-900">{d.score}</span>
                <span className="text-[10px] text-slate-400 uppercase font-bold">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto px-4 mt-12 pb-24">
        
        {/* Critical Findings Checklist - High Impact */}
        <section className="bg-rose-50 border border-rose-100 rounded-3xl p-8 mb-12 relative overflow-hidden">
           <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-200">
                    <AlertCircle size={24} />
                  </div>
                  <h2 className="text-2xl font-black text-rose-900">Critical To-Do List</h2>
                </div>
                <div className="hidden sm:block text-rose-700 font-bold text-sm bg-rose-100/50 px-4 py-2 rounded-full">
                  {findings?.filter((f: any) => !checkedFindings.has(findings.indexOf(f))).length} issues remaining
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {findings?.map((f: any, i: number) => (
                  <div 
                    key={i} 
                    className={`group relative flex items-start gap-4 p-5 rounded-2xl transition-all border ${checkedFindings.has(i) ? 'bg-white/40 border-transparent opacity-60 grayscale' : 'bg-white border-rose-100 shadow-sm'}`}
                  >
                    <div className="pt-1">
                      <input 
                        type="checkbox" 
                        checked={checkedFindings.has(i)}
                        onChange={() => toggleFinding(i)}
                        className="w-5 h-5 rounded-md border-rose-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                         <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-sm ${f.severity === 'high' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'}`}>
                            {f.severity}
                         </span>
                         <h3 className="font-bold text-slate-900 leading-tight">{f.title}</h3>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed mb-3">{f.impact}</p>
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 w-fit px-3 py-1.5 rounded-lg border border-emerald-100">
                         <CheckCircle2 size={12} />
                         {f.recommendation}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
           </div>
        </section>

        {/* Dynamic Tab Navigation */}
        {!isSkillAudit && (
          <>
          <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar mb-8">
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200' : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-200'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            {renderTabContent()}
          </>
        )}

        {/* Special Skill Audit View */}
        {isSkillAudit && (
           <div className="animate-in zoom-in-95 duration-500">
              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                  <div className="p-8 md:p-12 bg-gradient-to-br from-slate-900 to-indigo-950 text-white">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                          <div>
                            <div className="inline-block px-4 py-1.5 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-black uppercase tracking-tighter border border-indigo-500/30 mb-6">
                              {auditType} deep-dive
                            </div>
                            <h2 className="text-4xl font-black tracking-tight mb-2 underline decoration-indigo-500 decoration-4 underline-offset-8">{businessName}</h2>
                            <p className="text-slate-400 font-medium">{url}</p>
                          </div>
                      </div>
                  </div>

                  <div className="p-8 md:p-12">
                     {auditType === 'copy' ? (
                        <div className="space-y-12">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-8 rounded-3xl border border-slate-200">
                              <div>
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Copy Master Strategy</label>
                                 <p className="text-lg text-slate-800 leading-relaxed font-semibold">{report.analysis?.strategy}</p>
                              </div>
                              <div className="md:border-l border-slate-200 md:pl-8">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Audience Resonance</label>
                                 <div className="flex flex-wrap gap-2">
                                    {report.analysis?.keySellingPoints?.map((p:string, i:number) => (
                                      <span key={i} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 font-bold shadow-sm">#{p}</span>
                                    ))}
                                 </div>
                              </div>
                           </div>

                           <div>
                              <div className="flex gap-4 mb-8">
                                 {['metaAds', 'googleAds', 'tiktokAds'].map(p => (
                                   <button 
                                      key={p}
                                      onClick={() => setCopyActiveTab(p)}
                                      className={`px-6 py-2 rounded-xl text-sm font-black uppercase tracking-tight transition-all ${copyActiveTab === p ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}
                                   >
                                     {p.replace('Ads', '')}
                                   </button>
                                 ))}
                              </div>

                              <div className="space-y-6">
                                 {copyActiveTab === 'metaAds' && (
                                   <div className="p-8 bg-white border-2 border-slate-100 rounded-3xl shadow-inner">
                                      <label className="text-[10px] font-black text-indigo-500 uppercase block mb-4">Ad Copy - Option A (High Intent)</label>
                                      <div className="text-slate-900 leading-relaxed whitespace-pre-wrap font-medium text-lg mb-8">
                                        {report.deliverables?.metaAds?.longBody || report.deliverables?.metaAds?.primaryTexts?.[0]}
                                      </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {report.deliverables?.metaAds?.headlines?.map((h:string, i:number) => (
                                          <div key={i} className="bg-slate-50 p-4 rounded-xl border-l-4 border-indigo-500 font-bold text-slate-800 italic">"{h}"</div>
                                        ))}
                                      </div>
                                   </div>
                                 )}

                                  {copyActiveTab === 'googleAds' && (
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {report.deliverables?.googleAds?.headlines?.map((h:string, i:number) => (
                                          <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 text-slate-800 font-bold text-sm">
                                            <span className="text-slate-300 mr-2">H{i+1}:</span> {h}
                                          </div>
                                       ))}
                                   </div>
                                 )}

                                 {copyActiveTab === 'tiktokAds' && (
                                   <div className="space-y-4">
                                      {report.deliverables?.tiktokAds?.scriptOutlines?.map((s:any, i:number) => (
                                        <div key={i} className="p-6 bg-slate-900 text-white rounded-3xl">
                                          <div className="text-rose-400 font-black mb-4">HOOK: {s.hook}</div>
                                          <div className="text-slate-300 leading-tight mb-4">{s.body}</div>
                                          <div className="text-emerald-400 font-bold">CTA: {s.cta}</div>
                                        </div>
                                      ))}
                                   </div>
                                 )}
                              </div>
                           </div>
                        </div>
                     ) : (
                        <div className="p-8 bg-slate-50 rounded-2xl border border-slate-200 font-mono text-xs overflow-auto">
                           <pre>{JSON.stringify(report.deliverables || report, null, 2)}</pre>
                        </div>
                     )}
                  </div>
              </div>
           </div>
        )}
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showBrandingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBrandingModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-8"
            >
              <h2 className="text-2xl font-black text-slate-900 mb-6">White-Label Branding</h2>
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Agency / Business Name</label>
                  <input 
                    type="text" 
                    value={agencyModel.name}
                    onChange={(e) => setAgencyModel({ ...agencyModel, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-900"
                  />
                </div>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox"
                    checked={agencyModel.includeWatermark}
                    onChange={(e) => setAgencyModel({ ...agencyModel, includeWatermark: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">Include "Powered by ZieAds" in footer</span>
                </label>
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setShowBrandingModal(false)}
                    className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => setShowBrandingModal(false)}
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        @media print {
          .no-print, .navbar, .tab-nav, .btn-get-started { display: none !important; }
          .print-only-branding { display: block !important; }
          body { background: white !important; }
          .report-page { padding: 0 !important; }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
