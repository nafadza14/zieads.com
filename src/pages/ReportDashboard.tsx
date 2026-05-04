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
  Megaphone,
  TrendingUp,
  Link,
  Users,
  MousePointer2,
  Download,
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center relative">
          <div className="absolute inset-0 bg-indigo-500/20 blur-[50px] rounded-full" />
          <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-6 relative z-10"></div>
          <p className="text-slate-400 font-medium tracking-wide animate-pulse relative z-10">Compiling Executive Report...</p>
        </div>
      </div>
    );
  }

  if (!reportData) return null;

  const { report, agent_results: agentResults, url, business_name: businessName, created_at: generatedAt, audit_type: auditType = 'full' } = reportData;
  const { overall, grade, dimensions, findings, actionPlan, platformPriority } = report;
  const isSkillAudit = auditType !== 'full' && auditType !== 'quick';

  const getScoreColor = (s: number) => {
    if (s >= 80) return '#10b981'; // Emerald
    if (s >= 60) return '#f59e0b'; // Amber
    return '#ef4444'; // Rose
  };

  const getScoreGradient = (s: number) => {
    if (s >= 80) return 'from-emerald-400 to-emerald-600';
    if (s >= 60) return 'from-amber-400 to-amber-600';
    return 'from-rose-400 to-rose-600';
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
      className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/25 transition-all text-sm font-bold disabled:opacity-50 w-full sm:w-auto border border-slate-800 hover:border-indigo-500"
    >
      <PlayCircle size={16} />
      {label}
    </button>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Overview':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Building2 size={120} />
                </div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Project Overview</h3>
                <div className="space-y-4 relative z-10">
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Business Name</div>
                    <div className="text-xl font-bold text-slate-900">{businessName}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Target Website</div>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-indigo-600 font-medium hover:text-indigo-700 hover:underline">
                      {url.replace(/^https?:\/\//, '')} <Link size={14} />
                    </a>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Audit Generated</div>
                    <div className="text-slate-700 font-medium">{new Date(generatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Platform Priority</h3>
                <div className="space-y-4">
                  {platformPriority?.slice(0, 3).map((p: any, i: number) => (
                    <div key={i} className="flex items-center gap-4 group">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-black text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                        0{i + 1}
                      </div>
                      <div className="flex-1 border-b border-slate-50 pb-3 group-hover:border-indigo-50 transition-colors">
                        <div className="text-sm font-bold text-slate-900 mb-0.5">{p.platform}</div>
                        <div className="text-xs text-slate-500 line-clamp-1">{p.reason}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                <TrendingUp className="text-indigo-500" size={16} /> Strategic Action Plan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                <div className="relative">
                  <div className="absolute top-0 bottom-0 left-0 w-px bg-emerald-100 hidden md:block" />
                  <div className="md:pl-6 space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-black uppercase tracking-widest">
                      Quick Wins
                    </div>
                    <ul className="space-y-4">
                      {actionPlan?.quickWins?.map((a: string, i: number) => (
                        <li key={i} className="text-sm text-slate-600 font-medium leading-relaxed flex items-start gap-3">
                          <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={16} />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="absolute top-0 bottom-0 left-0 w-px bg-amber-100 hidden md:block" />
                  <div className="md:pl-6 space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-black uppercase tracking-widest">
                      Medium Term
                    </div>
                    <ul className="space-y-4">
                      {actionPlan?.mediumTerm?.map((a: string, i: number) => (
                        <li key={i} className="text-sm text-slate-600 font-medium leading-relaxed flex items-start gap-3">
                          <CheckCircle2 className="text-amber-400 shrink-0 mt-0.5" size={16} />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute top-0 bottom-0 left-0 w-px bg-blue-100 hidden md:block" />
                  <div className="md:pl-6 space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-black uppercase tracking-widest">
                      Long Term
                    </div>
                    <ul className="space-y-4">
                      {actionPlan?.strategic?.map((a: string, i: number) => (
                        <li key={i} className="text-sm text-slate-600 font-medium leading-relaxed flex items-start gap-3">
                          <CheckCircle2 className="text-blue-400 shrink-0 mt-0.5" size={16} />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 'Creatives': {
        const creative = getAgent('creative-intelligence');
        const d = creative?.deliverables || {};
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-8">
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Core Creative Strategy</h3>
              <p className="text-slate-700 text-lg leading-relaxed font-medium mb-8 max-w-4xl">{d.heroOfferAssessment}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100/50">
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-2">Tone of Voice</span>
                  <p className="text-base text-slate-900 font-bold">{d.brandIdentity?.tone || "Conversion Focused"}</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100/50">
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block mb-2">Visual Palette</span>
                  <p className="text-base text-slate-900 font-bold">{d.brandIdentity?.colors || "Not found"}</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100/50">
                  <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block mb-2">Aesthetic Style</span>
                  <p className="text-base text-slate-900 font-bold">{d.brandIdentity?.style || "Modern"}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h4 className="flex items-center gap-3 font-black text-slate-900 text-lg">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                    <Megaphone size={18} />
                  </div>
                  Meta Angles
                </h4>
                {d.creativeConceptsMeta?.map((c: any, i: number) => (
                  <div key={i} className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 font-bold text-[10px] uppercase tracking-widest rounded-lg mb-4">{c.format}</div>
                    <div className="text-lg text-slate-900 font-bold mb-2">“{c.hook}”</div>
                    <p className="text-sm text-slate-500 leading-relaxed">{c.visualDirection}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-6">
                <h4 className="flex items-center gap-3 font-black text-slate-900 text-lg">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
                    <PlayCircle size={18} />
                  </div>
                  TikTok Hooks
                </h4>
                {d.creativeConceptsTikTok?.map((c: any, i: number) => (
                  <div key={i} className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="inline-block px-3 py-1 bg-rose-50 text-rose-600 font-bold text-[10px] uppercase tracking-widest rounded-lg mb-4">{c.format}</div>
                    <div className="text-lg text-slate-900 font-bold mb-2">“{c.hook}”</div>
                    <p className="text-sm text-slate-500 leading-relaxed">{c.visualDirection}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 pt-6 border-t border-slate-200/60">
               {renderSkillButton('ads-copy', 'Generate Ad Copy')}
               {renderSkillButton('ads-creatives', 'Advanced Video Mockups')}
            </div>
          </motion.div>
        );
      }

      case 'Audiences': {
        const audience = getAgent('audience-targeting');
        const d = audience?.deliverables || {};
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-8">
            <div className="bg-slate-900 p-8 md:p-12 rounded-[2rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px]" />
              <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-8 flex items-center gap-2 relative z-10">
                <Users size={16} /> Ideal Customer Persona
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Demographics</label>
                  <p className="text-slate-200 text-sm leading-relaxed font-medium">{d.icp?.demographics || 'Not identified'}</p>
                </div>
                <div className="space-y-3 md:border-l border-slate-800 md:pl-10">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pain Points</label>
                  <p className="text-slate-200 text-sm leading-relaxed font-medium">{d.icp?.psychographics || 'Not identified'}</p>
                </div>
                <div className="space-y-3 md:border-l border-slate-800 md:pl-10">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Core Motivator</label>
                  <p className="text-slate-200 text-sm leading-relaxed font-medium">{d.icp?.jobToBeDone || 'Not identified'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Meta Targeting Segments</h4>
                <div className="space-y-6">
                  {['cold', 'warm', 'hot'].map((tier) => (
                    <div key={tier} className="relative pl-6">
                      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-full bg-indigo-100" />
                      <span className="text-[10px] font-black text-indigo-600 uppercase block mb-2">{tier} Audience</span>
                      <p className="text-sm font-medium text-slate-700 leading-relaxed">{d.metaAudiences?.[tier]?.join(", ") || "Auto-match broad algorithm"}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Google Search Intent</h4>
                <div className="flex flex-wrap gap-3">
                  {d.googleAudiences?.searchIntent?.map((keyword: string, i: number) => (
                    <div key={i} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-bold shadow-sm">
                      {keyword}
                    </div>
                  )) || <div className="text-sm text-slate-500 font-medium">No intent keywords detected.</div>}
                </div>
              </div>
            </div>
            
            <div className="flex pt-4">
              {renderSkillButton('ads-audiences', 'Export Detailed Targeting Lists')}
            </div>
          </motion.div>
        );
      }

      case 'Platforms': {
        const platform = getAgent('platform-budget');
        const d = platform?.deliverables || {};
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-8">
             <div className="bg-white overflow-hidden rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Channel Fit Analysis</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-white border-b border-slate-100">
                      <tr>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Compatibility</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Recommendation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {d.platformRanking?.map((p: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-6 font-bold text-slate-900">{p.platform}</td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <span className="font-black w-12" style={{ color: getScoreColor(p.fitScore) }}>{p.fitScore}%</span>
                              <div className="w-32 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full bg-gradient-to-r ${getScoreGradient(p.fitScore)}`} style={{ width: `${p.fitScore}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg">{p.allocation}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200/60">
                {renderSkillButton('ads-google', 'Google Ads Plan')}
                {renderSkillButton('ads-meta', 'Meta Ads Plan')}
                {renderSkillButton('ads-tiktok', 'TikTok Plan')}
                {renderSkillButton('ads-linkedin', 'LinkedIn Plan')}
             </div>
          </motion.div>
        );
      }

      case 'Funnel': {
        const funnel = getAgent('funnel-conversion');
        const d = funnel?.deliverables || {};
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-8">
            <div className="bg-slate-900 p-8 md:p-12 rounded-[2rem] shadow-2xl relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px]" />
              <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-10 flex items-center gap-2 relative z-10">
                <MousePointer2 size={16} /> Conversion Rate Optimization
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
                {Object.entries(d.landingPageScores || {}).map(([key, val]: [string, any]) => (
                  <div key={key} className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="text-xl font-black text-white">{val}/10</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full bg-gradient-to-r ${getScoreGradient(val * 10)}`} style={{ width: `${val * 10}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                 <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">High-Converting Headline Alternatives</h4>
                 <div className="space-y-4">
                    {d.headlineRewrites?.map((h: string, i: number) => (
                      <div key={i} className="p-5 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                        <p className="text-sm font-bold text-emerald-900 leading-relaxed italic">"{h}"</p>
                      </div>
                    ))}
                 </div>
               </div>
               <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                 <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Primary Conversion Killers</h4>
                 <div className="space-y-4">
                    {d.conversionBlockers?.map((b: string, i: number) => (
                      <div key={i} className="flex gap-4 p-5 bg-rose-50/50 border border-rose-100 rounded-2xl">
                        <AlertCircle className="text-rose-500 shrink-0" size={20} />
                        <span className="text-sm font-medium text-rose-900 leading-relaxed">{b}</span>
                      </div>
                    ))}
                 </div>
               </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-200/60">
               {renderSkillButton('ads-landing', 'Generate Landing Page Copy')}
               {renderSkillButton('ads-funnel', 'Build Full Customer Journey')}
            </div>
          </motion.div>
        );
      }

      case 'Competitors': {
        const comp = getAgent('competitive-intelligence');
        const d = comp?.deliverables || {};
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {d.directCompetitors?.map((c: any, i: number) => (
                  <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl transition-all group">
                    <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-6">
                       <div>
                         <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Direct Competitor</div>
                         <div className="font-black text-slate-900 text-2xl tracking-tight">{c.name}</div>
                       </div>
                       <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black rounded-lg uppercase tracking-widest shadow-md">
                         {c.adSpendTier} Spend
                       </span>
                    </div>
                    <div className="space-y-5">
                       <div>
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Creative Angle</span>
                         <p className="text-sm font-medium text-slate-700 leading-relaxed">{c.creativeApproach}</p>
                       </div>
                       <div>
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Core Offer</span>
                         <p className="text-sm font-medium text-slate-700 leading-relaxed">{c.offer}</p>
                       </div>
                    </div>
                  </div>
                ))}
             </div>
             <div className="pt-4 border-t border-slate-200/60">
                {renderSkillButton('ads-competitors', 'Analyze Competitor Ad Libraries')}
             </div>
          </motion.div>
        );
      }

      case 'Budget': {
        const platform = getAgent('platform-budget');
        const d = platform?.deliverables || {};
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-8">
            <div className="bg-slate-900 p-10 md:p-16 rounded-[2.5rem] shadow-2xl text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10" />
              <div className="relative z-10">
                <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Recommended Monthly Investment</h3>
                <div className="text-5xl md:text-7xl font-black text-white mb-12 tracking-tighter">
                  {d.benchmarks?.expectedCPA ? "Custom Plan" : "Analyzing"}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem]">
                    <div className="text-3xl font-black text-white mb-2">{d.budgetAllocation?.tofu || "40%"}</div>
                    <div className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Top of Funnel</div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem]">
                    <div className="text-3xl font-black text-white mb-2">{d.budgetAllocation?.mofu || "30%"}</div>
                    <div className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Middle of Funnel</div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem]">
                    <div className="text-3xl font-black text-white mb-2">{d.budgetAllocation?.bofu || "30%"}</div>
                    <div className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Bottom of Funnel</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
               <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Scaling Strategy</h4>
               <p className="text-slate-700 font-medium leading-relaxed text-lg max-w-4xl">{d.scalingThresholds || "Focus on stabilizing initial CPA before aggressive scaling. Do not increase daily budgets by more than 20% every 3 days to avoid resetting the learning phase."}</p>
            </div>

            <div className="pt-4 border-t border-slate-200/60">
               {renderSkillButton('ads-budget', 'Generate 90-Day Financial Projection')}
            </div>
          </motion.div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Premium Navbar */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
                <div className="bg-indigo-600 p-2 rounded-xl group-hover:scale-105 transition-transform shadow-lg shadow-indigo-600/20">
                   <ZieAdsLogo size={20} className="text-white" />
                </div>
                <span className="text-xl font-black tracking-tighter text-slate-900">{agencyModel.name}</span>
              </div>
              <div className="h-8 w-px bg-slate-200 hidden sm:block" />
              <button 
                onClick={() => navigate('/clients')}
                className="hidden sm:block text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest"
              >
                Dashboard
              </button>
            </div>
            
            <div className="hidden md:flex items-center gap-4">
              <button 
                onClick={() => setShowBrandingModal(true)}
                className="px-5 py-2.5 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
              >
                Settings
              </button>
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-xl shadow-slate-900/10 hover:bg-slate-800 hover:-translate-y-0.5 transition-all"
              >
                <Download size={14} />
                Export PDF
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Premium Executive Hero */}
      <header className="bg-slate-950 text-white pt-20 pb-24 px-4 relative overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
           <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[100%] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen" />
           <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[100%] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex-1 text-center md:text-left space-y-6">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
              <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md text-white rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/10">
                Grade {grade}
              </span>
              <span className="px-4 py-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-500/30">
                {auditType} Analysis
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight">Executive Ads <br/> Strategy Report</h1>
            <p className="text-slate-400 font-medium text-lg flex items-center justify-center md:justify-start gap-3">
              <Building2 size={20} className="text-slate-500" /> {businessName}
              <span className="text-slate-700">•</span>
              <a href={url} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">{url.replace(/^https?:\/\//, '')}</a>
            </p>
          </div>

          {/* Premium Score Dial */}
          <div className="relative shrink-0 w-56 h-56 flex items-center justify-center">
            {/* Inner Glow */}
            <div className="absolute inset-4 bg-indigo-500/20 rounded-full blur-2xl" />
            
            {/* The SVG Circle - strictly constrained by parent w-56 h-56 */}
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 relative z-10">
              {/* Background Track */}
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
              {/* Progress Track */}
              <circle 
                cx="50" cy="50" r="42" fill="none" 
                stroke={getScoreColor(overall)} 
                strokeWidth="8" 
                strokeDasharray={`${overall * 2.64} 264`} 
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out drop-shadow-2xl"
              />
            </svg>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
              <span className="text-6xl font-black tracking-tighter" style={{ color: getScoreColor(overall) }}>{overall}</span>
              <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest mt-1">Total Score</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <div className="max-w-6xl mx-auto px-4 -mt-8 relative z-20">
        
        {/* Critical Action Items */}
        <section className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl shadow-slate-200/50 p-8 md:p-12 mb-12">
           <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
             <div>
               <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                 <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100">
                   <AlertCircle size={24} />
                 </div>
                 Critical Findings
               </h2>
               <p className="text-slate-500 font-medium mt-2 ml-15">The highest-impact issues blocking your ad performance.</p>
             </div>
             <div className="bg-rose-50 border border-rose-100 text-rose-600 font-black text-xs uppercase tracking-widest px-5 py-2.5 rounded-xl">
               {findings?.filter((f: any) => !checkedFindings.has(findings.indexOf(f))).length} Issues Open
             </div>
           </div>

           <div className="grid grid-cols-1 gap-4">
             {findings?.map((f: any, i: number) => (
               <div 
                 key={i} 
                 className={`group relative flex items-start gap-5 p-6 rounded-2xl transition-all border ${checkedFindings.has(i) ? 'bg-slate-50/50 border-slate-100 opacity-60 grayscale' : 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300'}`}
               >
                 <div className="pt-1 shrink-0">
                   <input 
                     type="checkbox" 
                     checked={checkedFindings.has(i)}
                     onChange={() => toggleFinding(i)}
                     className="w-6 h-6 rounded-lg border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer transition-colors"
                   />
                 </div>
                 <div className="flex-1">
                   <div className="flex items-center gap-3 mb-2">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${f.severity === 'high' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                         {f.severity} Priority
                      </span>
                      <h3 className="font-black text-lg text-slate-900 tracking-tight">{f.title}</h3>
                   </div>
                   <p className="text-base text-slate-600 font-medium leading-relaxed mb-4">{f.impact}</p>
                   <div className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      Fix: {f.recommendation}
                   </div>
                 </div>
               </div>
             ))}
           </div>
        </section>

        {/* Segmented Tab Navigation */}
        {!isSkillAudit && (
          <div className="mb-10">
            <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar">
              <div className="flex p-1.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                {TABS.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative px-8 py-3.5 rounded-xl text-sm font-black uppercase tracking-widest whitespace-nowrap transition-colors z-10 ${activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    {activeTab === tab && (
                      <motion.div 
                        layoutId="activeTab"
                        className="absolute inset-0 bg-slate-900 rounded-xl -z-10 shadow-lg"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            {renderTabContent()}
          </div>
        )}

        {/* Special Skill Audit View */}
        {isSkillAudit && (
           <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden">
                  <div className="p-10 md:p-16 bg-slate-950 text-white relative overflow-hidden">
                      <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/30 blur-[100px] rounded-full pointer-events-none" />
                      <div className="relative z-10">
                        <div className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-md text-white rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/10 mb-6">
                          {auditType} deep-dive
                        </div>
                        <h2 className="text-5xl md:text-6xl font-black tracking-tighter mb-4">{businessName}</h2>
                        <p className="text-slate-400 font-medium text-xl">{url}</p>
                      </div>
                  </div>

                  <div className="p-10 md:p-16">
                     {auditType === 'copy' ? (
                        <div className="space-y-12">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-slate-50 p-10 rounded-[2rem] border border-slate-100">
                              <div>
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Copy Master Strategy</label>
                                 <p className="text-xl text-slate-900 leading-relaxed font-bold tracking-tight">{report.analysis?.strategy}</p>
                              </div>
                              <div className="md:border-l border-slate-200 md:pl-10">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Audience Resonance</label>
                                 <div className="flex flex-wrap gap-3">
                                    {report.analysis?.keySellingPoints?.map((p:string, i:number) => (
                                      <span key={i} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 font-bold shadow-sm">#{p}</span>
                                    ))}
                                 </div>
                              </div>
                           </div>

                           <div>
                              <div className="flex gap-2 mb-8 p-1.5 bg-slate-100 rounded-2xl w-fit">
                                 {['metaAds', 'googleAds', 'tiktokAds'].map(p => (
                                   <button 
                                      key={p}
                                      onClick={() => setCopyActiveTab(p)}
                                      className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${copyActiveTab === p ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                                   >
                                     {p.replace('Ads', '')}
                                   </button>
                                 ))}
                              </div>

                              <div className="space-y-8">
                                 {copyActiveTab === 'metaAds' && (
                                   <div className="p-10 bg-white border-2 border-slate-100 rounded-[2rem]">
                                      <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-6">Option A (High Intent Variant)</label>
                                      <div className="text-slate-900 leading-relaxed whitespace-pre-wrap font-medium text-xl mb-10 max-w-3xl">
                                        {report.deliverables?.metaAds?.longBody || report.deliverables?.metaAds?.primaryTexts?.[0]}
                                      </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        {report.deliverables?.metaAds?.headlines?.map((h:string, i:number) => (
                                          <div key={i} className="bg-slate-50 p-6 rounded-[1.5rem] border-l-4 border-indigo-500 font-bold text-slate-800 text-lg">"{h}"</div>
                                        ))}
                                      </div>
                                   </div>
                                 )}

                                  {copyActiveTab === 'googleAds' && (
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      {report.deliverables?.googleAds?.headlines?.map((h:string, i:number) => (
                                          <div key={i} className="bg-white p-6 rounded-[1.5rem] border border-slate-200 text-slate-900 font-bold text-base shadow-sm hover:shadow-md transition-shadow">
                                            <span className="text-slate-300 mr-3 text-xs uppercase tracking-widest">H{i+1}</span> {h}
                                          </div>
                                       ))}
                                   </div>
                                 )}

                                 {copyActiveTab === 'tiktokAds' && (
                                   <div className="space-y-6">
                                      {report.deliverables?.tiktokAds?.scriptOutlines?.map((s:any, i:number) => (
                                        <div key={i} className="p-8 bg-slate-900 text-white rounded-[2rem] shadow-xl">
                                          <div className="text-rose-400 font-black text-sm uppercase tracking-widest mb-4">First 3s Hook</div>
                                          <div className="text-2xl font-bold mb-6">"{s.hook}"</div>
                                          <div className="text-slate-300 leading-relaxed font-medium mb-6 text-lg">{s.body}</div>
                                          <div className="inline-flex px-4 py-2 bg-white/10 rounded-xl text-emerald-400 font-bold text-sm tracking-wide">CTA: {s.cta}</div>
                                        </div>
                                      ))}
                                   </div>
                                 )}
                              </div>
                           </div>
                        </div>
                     ) : (
                        <div className="p-8 bg-slate-900 rounded-3xl font-mono text-sm text-emerald-400 overflow-auto shadow-inner">
                           <pre className="whitespace-pre-wrap">{JSON.stringify(report.deliverables || report, null, 2)}</pre>
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
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-10 border border-slate-100"
            >
              <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">White-Label Settings</h2>
              <div className="space-y-8">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Agency Name</label>
                  <input 
                    type="text" 
                    value={agencyModel.name}
                    onChange={(e) => setAgencyModel({ ...agencyModel, name: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[1rem] focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-slate-900 text-lg"
                  />
                </div>
                <label className="flex items-center gap-4 cursor-pointer group p-4 bg-slate-50 rounded-[1rem] border border-slate-100">
                  <input 
                    type="checkbox"
                    checked={agencyModel.includeWatermark}
                    onChange={(e) => setAgencyModel({ ...agencyModel, includeWatermark: e.target.checked })}
                    className="w-6 h-6 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Include "Powered by ZieAds" in footer</span>
                </label>
                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setShowBrandingModal(false)}
                    className="flex-1 px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => setShowBrandingModal(false)}
                    className="flex-1 px-6 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-900/20 hover:bg-slate-800 hover:-translate-y-0.5 transition-all"
                  >
                    Save
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        @media print {
          nav, .no-print, button { display: none !important; }
          body { background: white !important; }
          * { border-color: #f1f5f9 !important; box-shadow: none !important; }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
