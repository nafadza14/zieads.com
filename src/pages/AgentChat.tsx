import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, PlayCircle } from 'lucide-react';
import { 
  UilSearchAlt, UilBedDouble, UilChartDown, UilMoneyBill, UilEye, UilMedicalSquare, 
  UilFlask, UilAnalysis, UilCrosshairs, UilRocket, UilChat, UilBolt, UilArrowUp, UilArrowRight, UilPlay
} from '@iconscout/react-unicons';
import { supabase } from '../lib/supabaseClient';

const P = '#7B2FBE';
const PL = 'rgba(123,47,190,0.08)';
const G = '#64748b';
const D = '#1e293b';
const B = '#e2e8f0';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
  isAnalysis?: boolean;
  analysisMode?: string;
}

interface Conversation {
  id: string;
  title: string;
  context_url?: string;
  updated_at: string;
}

// ─── Use-case modes ───────────────────────────────────────────────────────────
const USE_CASES = [
  {
    id: 'daily',
    icon: <UilSearchAlt size={22} />,
    label: 'Daily Diagnosis',
    shortDesc: '5 min · urgent issues only',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca',
    prompt: 'Run a daily diagnosis on my campaigns. Flag anything urgent, warn me about developing issues, and confirm what\'s stable. End with my #1 priority action for today.',
  },
  {
    id: 'fatigue',
    icon: <UilBedDouble size={22} />,
    label: 'Creative Fatigue',
    shortDesc: '10 min · score each creative',
    color: '#f59e0b',
    bg: '#fffbeb',
    border: '#fde68a',
    prompt: 'Analyze my creatives for fatigue. Score each one, estimate budget waste from tired ads, and tell me what to refresh or kill.',
  },
  {
    id: 'roas',
    icon: <UilChartDown size={22} />,
    label: 'ROAS Drop Analysis',
    shortDesc: '8 min · 4+ root causes ranked',
    color: '#ef4444',
    bg: '#fef2f2',
    border: '#fecaca',
    prompt: 'My ROAS dropped. Diagnose the 4 most likely root causes ranked by probability, give me evidence for each, and tell me which one to fix first.',
  },
  {
    id: 'budget',
    icon: <UilMoneyBill size={22} />,
    label: 'Budget Optimization',
    shortDesc: '7 min · profit-first reallocation',
    color: '#10b981',
    bg: '#f0fdf4',
    border: '#a7f3d0',
    prompt: 'Run a budget optimization analysis. Show me current vs. recommended allocation, which campaigns to scale vs. pause, and projected monthly profit change.',
  },
  {
    id: 'competitive',
    icon: <UilEye size={22} />,
    label: 'Competitive Intel',
    shortDesc: '12 min · 5 competitors mapped',
    color: '#8b5cf6',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    prompt: 'Analyze my top 5 competitors\' ad strategies. Map their platforms, creative angles, offers, and positioning. Show me gaps I can exploit.',
  },
  {
    id: 'health',
    icon: <UilMedicalSquare size={22} />,
    label: 'Campaign Health',
    shortDesc: '15 min · 8-dimension scorecard',
    color: '#3b82f6',
    bg: '#eff6ff',
    border: '#bfdbfe',
    prompt: 'Run a full campaign health scorecard. Score every campaign across 8 dimensions. Flag the 3 that need the most attention and give me a weekly action plan.',
  },
  {
    id: 'abtest',
    icon: <UilFlask size={22} />,
    label: 'A/B Test Design',
    shortDesc: '10 min · statistically valid plan',
    color: '#06b6d4',
    bg: '#ecfeff',
    border: '#a5f3fc',
    prompt: 'Design a statistically valid A/B test for my highest-leverage variable. Calculate required sample size, write the hypothesis, and set monitoring checkpoints.',
  },
  {
    id: 'executive',
    icon: <UilAnalysis size={22} />,
    label: 'Executive Summary',
    shortDesc: '20 min · CEO-ready report',
    color: '#1e293b',
    bg: '#f8fafc',
    border: '#e2e8f0',
    prompt: 'Write a CEO/CMO-ready executive summary of my ads performance. Frame everything in revenue impact. Include wins, risks with $ impact, and a 90-day forecast.',
  },
  {
    id: 'audience',
    icon: <UilCrosshairs size={22} />,
    label: 'Audience Quality',
    shortDesc: '12 min · fraud + overlap detection',
    color: '#e8457a',
    bg: '#fdf2f8',
    border: '#f9a8d4',
    prompt: 'Audit my audience quality. Detect bot traffic signals, audience overlap, and low-quality segments. Quantify the financial impact and tell me what to block.',
  },
  {
    id: 'launch',
    icon: <UilRocket size={22} />,
    label: 'Launch Readiness',
    shortDesc: '8 min · pre-flight checklist',
    color: '#7B2FBE',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    prompt: 'Run a launch readiness check on my campaign setup. Give me a pass/fail checklist, flag any critical blockers, and estimate risk if I launch with current issues.',
  },
] as const;

type UseCaseId = typeof USE_CASES[number]['id'];

// ─── Suggested questions grouped by category ─────────────────────────────────
const QUICK_QUESTIONS = [
  { cat: 'Meta Ads', q: 'What Meta audience should I target for my business?' },
  { cat: 'Meta Ads', q: 'My Meta ROAS dropped 40% this week — what\'s wrong?' },
  { cat: 'Google Ads', q: 'Build me a Google Search campaign structure with ad groups' },
  { cat: 'Google Ads', q: 'How do I fix a low Quality Score on my top keywords?' },
  { cat: 'Creative', q: 'Write 5 Meta ad headlines with strong hooks for my product' },
  { cat: 'Creative', q: 'What video creative format is winning on TikTok right now?' },
  { cat: 'Strategy', q: 'How should I split a $10K/month budget across Meta and Google?' },
  { cat: 'Strategy', q: 'Map my full-funnel ad strategy (TOFU → MOFU → BOFU)' },
];

// ─── Main component ───────────────────────────────────────────────────────────
export default function AgentChat() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [usage, setUsage] = useState<{ used: number; limit: number; plan: string }>({ used: 0, limit: 5, plan: 'free' });
  const [userEmail, setUserEmail] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'modes'>('chat');
  const [runningMode, setRunningMode] = useState<UseCaseId | null>(null);
  const [additionalData, setAdditionalData] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const getAuthHeaders = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    return token
      ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const init = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.email) setUserEmail(userData.user.email);
      const headers = await getAuthHeaders();
      const [convRes, usageRes, profileRes] = await Promise.all([
        fetch('/api/agent/conversations', { headers }),
        fetch('/api/agent/usage', { headers }),
        fetch('/api/profile', { headers }),
      ]);
      if (convRes.ok) { const j = await convRes.json(); setConversations(j.data || []); }
      if (usageRes.ok) { const j = await usageRes.json(); if (j.data) setUsage(j.data); }
      if (profileRes.ok) { const j = await profileRes.json(); if (j.data) setUserProfile(j.data); }
      setLoadingConvs(false);
    };
    init();
  }, [getAuthHeaders]);

  const loadConversation = async (convId: string) => {
    setActiveConvId(convId);
    setActiveTab('chat');
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/agent/conversations/${convId}`, { headers });
    if (res.ok) { const j = await res.json(); setMessages(j.data || []); }
  };

  const startNew = () => {
    setActiveConvId(null);
    setMessages([]);
    setActiveTab('chat');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const deleteConv = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const headers = await getAuthHeaders();
    await fetch(`/api/agent/conversations/${convId}`, { method: 'DELETE', headers });
    setConversations(prev => prev.filter(c => c.id !== convId));
    if (activeConvId === convId) startNew();
  };

  const refreshConversations = async () => {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/agent/conversations', { headers });
    if (res.ok) { const j = await res.json(); setConversations(j.data || []); }
  };

  // ─── Send chat message ────────────────────────────────────────────────────
  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: msg }]);

    const headers = await getAuthHeaders();
    try {
      const res = await fetch('/api/agent/message', {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: msg, conversationId: activeConvId }),
      });
      const j = await res.json();

      if (res.status === 429) {
        setMessages(prev => [...prev, { role: 'assistant', content: `**Rate limit reached.** ${j.message}` }]);
        return;
      }
      if (!j.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }]);
        return;
      }
      if (!activeConvId && j.conversationId) {
        setActiveConvId(j.conversationId);
        await refreshConversations();
      }
      setMessages(prev => [...prev, { role: 'assistant', content: j.reply }]);
      if (j.usage) setUsage(prev => ({ ...prev, used: j.usage.used, limit: j.usage.limit }));
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Network error. Please check your connection.' }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  // ─── Run structured analysis mode ────────────────────────────────────────
  const runAnalysis = async (modeId: UseCaseId) => {
    setRunningMode(modeId);
    setActiveTab('chat');
    setLoading(true);

    const modeInfo = USE_CASES.find(u => u.id === modeId)!;
    setMessages(prev => [...prev, {
      role: 'user',
      content: `${modeInfo.icon} Running **${modeInfo.label}**...`,
      isAnalysis: true,
      analysisMode: modeId,
    }]);

    const headers = await getAuthHeaders();
    try {
      const res = await fetch('/api/agent/analyze', {
        method: 'POST',
        headers,
        body: JSON.stringify({ mode: modeId, data: additionalData, conversationId: activeConvId }),
      });
      const j = await res.json();

      if (!activeConvId && j.conversationId) {
        setActiveConvId(j.conversationId);
        await refreshConversations();
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: j.result || 'Analysis complete.',
        isAnalysis: true,
        analysisMode: modeId,
      }]);
      if (j.usage) setUsage(prev => ({ ...prev, used: j.usage.used, limit: j.usage.limit }));
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Analysis failed. Please try again.' }]);
    } finally {
      setLoading(false);
      setRunningMode(null);
      setAdditionalData('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const isAtLimit = usage.used >= usage.limit;
  const usagePct = Math.min((usage.used / Math.max(usage.limit, 1)) * 100, 100);
  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : 'ZA';

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc', fontFamily: "'DM Sans', sans-serif" }}>

      {/* ─── LEFT SIDEBAR ─── */}
      <aside style={{ width: 256, background: '#fff', borderRight: `1px solid ${B}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {/* Logo + new */}
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${B}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 16 }} onClick={() => navigate('/')}>
            <div style={{ width: 26, height: 26, background: P, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13 }}>Z</div>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: D }}>ZieAds</span>
            <span style={{ fontSize: '0.7rem', background: PL, color: P, borderRadius: 4, padding: '2px 6px', fontWeight: 700, marginLeft: 2 }}>AI</span>
          </div>
          <button onClick={startNew} style={{ width: '100%', background: P, color: '#fff', border: 'none', padding: '9px 0', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem' }}>
            + New conversation
          </button>
        </div>

        {/* Usage */}
        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${B}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: '0.72rem', color: G }}>
            <span>Messages this month</span>
            <span style={{ fontWeight: 700, color: isAtLimit ? '#dc2626' : D }}>{usage.used}/{usage.limit >= 1e9 ? '∞' : usage.limit}</span>
          </div>
          <div style={{ width: '100%', height: 3, background: B, borderRadius: 2 }}>
            <div style={{ width: `${usagePct}%`, height: '100%', background: isAtLimit ? '#dc2626' : P, borderRadius: 2, transition: 'width 0.3s' }} />
          </div>
          {isAtLimit && (
            <button onClick={() => navigate('/pricing')} style={{ marginTop: 8, width: '100%', background: PL, border: `1px solid rgba(123,47,190,0.2)`, borderRadius: 5, padding: '5px 0', fontSize: '0.75rem', fontWeight: 600, color: P, cursor: 'pointer' }}>
              Upgrade for more →
            </button>
          )}
        </div>

        {/* Back to dashboard */}
        <div style={{ padding: '8px 20px', borderBottom: `1px solid ${B}` }}>
          <button onClick={() => navigate('/clients')} style={{ background: 'transparent', border: 'none', color: G, fontSize: '0.82rem', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
            ← Dashboard
          </button>
        </div>

        {/* Business context pill */}
        {userProfile?.business_name && (
          <div style={{ padding: '10px 16px', borderBottom: `1px solid ${B}` }}>
            <div style={{ fontSize: '0.63rem', fontWeight: 700, color: G, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Analyzing</div>
            <div style={{ background: PL, border: `1px solid rgba(123,47,190,0.18)`, borderRadius: 6, padding: '8px 10px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: D, marginBottom: 1 }}>{userProfile.business_name}</div>
              {userProfile.business_type && <div style={{ fontSize: '0.7rem', color: G, marginBottom: 1 }}>{userProfile.business_type}</div>}
              {userProfile.monthly_budget && <div style={{ fontSize: '0.7rem', color: G, marginBottom: 1 }}>Budget: {userProfile.monthly_budget}</div>}
              {userProfile.platforms?.length > 0 && <div style={{ fontSize: '0.7rem', color: G }}>Platforms: {userProfile.platforms.join(', ')}</div>}
            </div>
            <button onClick={() => navigate('/profile')} style={{ marginTop: 5, background: 'none', border: 'none', fontSize: '0.68rem', color: P, cursor: 'pointer', padding: 0, fontWeight: 600 }}>
              Update profile →
            </button>
          </div>
        )}

        {/* Conversation list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          <div style={{ padding: '6px 20px 4px', fontSize: '0.68rem', fontWeight: 700, color: G, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent</div>
          {loadingConvs ? (
            <div style={{ padding: '12px 20px', color: G, fontSize: '0.82rem' }}>Loading...</div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: '12px 20px', color: G, fontSize: '0.82rem' }}>No conversations yet</div>
          ) : conversations.map(conv => (
            <div key={conv.id} onClick={() => loadConversation(conv.id)} style={{ padding: '8px 20px', cursor: 'pointer', background: activeConvId === conv.id ? '#f1f5f9' : 'transparent', borderLeft: activeConvId === conv.id ? `3px solid ${P}` : '3px solid transparent', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: activeConvId === conv.id ? 600 : 400, color: D, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{conv.title}</div>
                <div style={{ fontSize: '0.7rem', color: G, marginTop: 1 }}>{new Date(conv.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
              </div>
              <button onClick={e => deleteConv(conv.id, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: G, fontSize: '1rem', padding: '1px 3px', opacity: 0.5 }} title="Delete">×</button>
            </div>
          ))}
        </div>

        {/* User */}
        <div style={{ padding: '14px 20px', borderTop: `1px solid ${B}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: D }}>{initials}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: D, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>{userEmail || 'User'}</div>
              <div style={{ fontSize: '0.68rem', color: G, textTransform: 'capitalize' }}>{usage.plan} plan</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── MAIN AREA ─── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header with tabs */}
        <div style={{ background: '#fff', borderBottom: `1px solid ${B}`, flexShrink: 0 }}>
          <div style={{ padding: '12px 28px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: P, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Bot size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.97rem', color: D }}>ZieAds AI Agent</div>
              <div style={{ fontSize: '0.74rem', color: G }}>Expert paid ads strategist · 10 deep analysis modes · powered by Claude</div>
            </div>
            {/* Status badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: 20, padding: '4px 10px', fontSize: '0.72rem', fontWeight: 600, color: '#065f46' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
              Ready
            </div>
          </div>
          {/* Tabs */}
          <div style={{ display: 'flex', paddingLeft: 28, gap: 0, borderTop: `1px solid ${B}` }}>
            {(['chat', 'modes'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ background: 'transparent', border: 'none', padding: '10px 20px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: activeTab === tab ? 700 : 400, color: activeTab === tab ? P : G, borderBottom: activeTab === tab ? `2px solid ${P}` : '2px solid transparent', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}>
                {tab === 'chat' ? (
                  <><UilChat size={16} /> Chat</>
                ) : (
                  <><UilBolt size={16} /> Analysis Modes</>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab: Analysis Modes */}
        {activeTab === 'modes' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: D, margin: '0 0 6px' }}>10 Deep Analysis Modes</h2>
                <p style={{ color: G, fontSize: '0.88rem', margin: 0 }}>Each mode runs a full structured analysis using your audit data as context. Paste any extra data (metrics, screenshots text, campaign stats) below to get more specific results.</p>
              </div>

              {/* Optional data input */}
              <div style={{ marginBottom: 20, background: '#fff', border: `1px solid ${B}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: G, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Optional: Paste your campaign data (metrics, numbers, issues)</div>
                <textarea
                  value={additionalData}
                  onChange={e => setAdditionalData(e.target.value)}
                  placeholder="e.g. 'Meta ROAS: 1.8, CPA: $42, CTR: 0.9%, Daily spend: $800, Campaign: Prospecting-Broad' — the more specific you are, the better the analysis"
                  rows={3}
                  style={{ width: '100%', border: `1px solid ${B}`, borderRadius: 6, padding: '10px 12px', fontSize: '0.85rem', color: D, fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Mode grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {USE_CASES.map(uc => (
                  <UseCaseCard
                    key={uc.id}
                    useCase={uc}
                    isRunning={runningMode === uc.id && loading}
                    isDisabled={loading || isAtLimit}
                    onRun={() => runAnalysis(uc.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Chat */}
        {activeTab === 'chat' && (
          <>
            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
              {messages.length === 0 ? (
                <EmptyState onSuggest={q => sendMessage(q)} onSwitchModes={() => setActiveTab('modes')} businessName={userProfile?.business_name} />
              ) : (
                <>
                  {messages.map((msg, i) => (
                    <MessageBubble key={i} message={msg} />
                  ))}
                  {loading && <TypingIndicator />}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div style={{ padding: '14px 28px', background: '#fff', borderTop: `1px solid ${B}`, flexShrink: 0 }}>
              {isAtLimit ? (
                <div style={{ padding: 14, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ color: '#dc2626', fontWeight: 600, marginBottom: 6 }}>Monthly limit reached</div>
                  <div style={{ color: G, fontSize: '0.83rem', marginBottom: 10 }}>You've used all {usage.limit} messages this month.</div>
                  <button onClick={() => navigate('/pricing')} style={{ background: P, color: '#fff', border: 'none', padding: '7px 20px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem' }}>Upgrade Plan</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', background: '#f8fafc', border: `1px solid ${B}`, borderRadius: 10, padding: '10px 14px' }}>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything — ad strategy, copy, analysis, ROAS issues... (Enter to send)"
                    rows={1}
                    style={{ flex: 1, resize: 'none', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.92rem', color: D, fontFamily: 'inherit', lineHeight: '1.5', maxHeight: 120, overflowY: 'auto' }}
                    onInput={e => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px'; }}
                    disabled={loading}
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={loading || !input.trim()}
                    style={{ background: loading || !input.trim() ? B : P, color: loading || !input.trim() ? G : '#fff', border: 'none', width: 34, height: 34, borderRadius: 7, cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1rem' }}
                  >
                    {loading ? '…' : <UilArrowUp size={20} />}
                  </button>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                <span style={{ fontSize: '0.68rem', color: G }}>Uses your audit history · Enter to send · Shift+Enter for new line</span>
                <button onClick={() => setActiveTab('modes')} style={{ fontSize: '0.72rem', color: P, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <UilBolt size={14} /> Run deep analysis <UilArrowRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// ─── Use-case card ────────────────────────────────────────────────────────────
function UseCaseCard({ useCase, isRunning, isDisabled, onRun }: {
  useCase: typeof USE_CASES[number];
  isRunning: boolean;
  isDisabled: boolean;
  onRun: () => void;
}) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 10, transition: 'border-color 0.15s, box-shadow 0.15s' }}
      onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.borderColor = useCase.color; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 2px 12px ${useCase.color}22`; }}
      onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.borderColor = B; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 8, background: useCase.bg, border: `1px solid ${useCase.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
          {useCase.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1e293b' }}>{useCase.label}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>{useCase.shortDesc}</div>
        </div>
      </div>
      <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.5 }}>{useCase.prompt.slice(0, 100)}…</div>
      <button
        onClick={onRun}
        disabled={isDisabled}
        style={{
          background: isRunning ? useCase.bg : useCase.color,
          color: isRunning ? useCase.color : '#fff',
          border: `1px solid ${isRunning ? useCase.border : useCase.color}`,
          borderRadius: 6,
          padding: '7px 0',
          fontWeight: 600,
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          fontSize: '0.82rem',
          opacity: isDisabled && !isRunning ? 0.5 : 1,
          transition: 'all 0.15s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        {isRunning ? (
          <><SpinnerDots /> Running analysis…</>
        ) : (
          <><UilPlay size={14} /> Run {useCase.label}</>
        )}
      </button>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ onSuggest, onSwitchModes, businessName }: { onSuggest: (q: string) => void; onSwitchModes: () => void; businessName?: string }) {
  const cats = [...new Set(QUICK_QUESTIONS.map(q => q.cat))];

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', paddingTop: 30 }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ width: 60, height: 60, background: PL, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: P }}>
          <Bot size={30} />
        </div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: D, margin: '0 0 10px' }}>ZieAds AI Agent</h2>
        <p style={{ color: G, fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 12px' }}>
          Your expert paid ads strategist. Ask anything about Meta, Google, TikTok or LinkedIn — or run one of our 10 deep analysis modes.
        </p>
        {businessName && (
          <div style={{ display: 'inline-block', background: PL, border: `1px solid rgba(123,47,190,0.2)`, borderRadius: 20, padding: '4px 14px', fontSize: '0.78rem', color: P, fontWeight: 600, marginBottom: 14 }}>
            Personalized for: {businessName}
          </div>
        )}
        <button onClick={onSwitchModes} style={{ background: P, color: '#fff', border: 'none', padding: '9px 22px', borderRadius: 20, fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <UilBolt size={18} /> Run Deep Analysis <UilArrowRight size={18} />
        </button>
      </div>

      {/* Feature pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 28 }}>
        {['Daily Diagnosis', 'ROAS Drop Analysis', 'Creative Fatigue', 'Budget Optimization', 'Competitive Intel', 'Launch Readiness'].map(f => (
          <span key={f} style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 20, padding: '4px 12px', fontSize: '0.75rem', color: G, fontWeight: 500 }}>{f}</span>
        ))}
      </div>

      {/* Quick questions by category */}
      <div style={{ marginBottom: 8, fontSize: '0.75rem', fontWeight: 700, color: G, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick questions</div>
      {cats.map(cat => (
        <div key={cat} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: P, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{cat}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {QUICK_QUESTIONS.filter(q => q.cat === cat).map((q, i) => (
              <button key={i} onClick={() => onSuggest(q.q)} style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 7, padding: '10px 14px', textAlign: 'left', cursor: 'pointer', fontSize: '0.82rem', color: D, lineHeight: 1.4, transition: 'all 0.15s' }}
                onMouseOver={e => { e.currentTarget.style.borderColor = P; e.currentTarget.style.background = PL; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = B; e.currentTarget.style.background = '#fff'; }}
              >
                {q.q}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const isAnalysisResult = !isUser && message.isAnalysis;

  if (isUser && message.isAnalysis) {
    const uc = USE_CASES.find(u => u.id === message.analysisMode);
    return (
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: uc?.bg || '#f1f5f9', border: `1px solid ${uc?.border || B}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>
          {uc?.icon || '⚡'}
        </div>
        <div style={{ padding: '8px 14px', background: uc?.bg || '#f1f5f9', border: `1px solid ${uc?.border || B}`, borderRadius: '10px 10px 10px 4px', fontSize: '0.85rem', color: uc?.color || D, fontWeight: 600 }}>
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 18, justifyContent: isUser ? 'flex-end' : 'flex-start', maxWidth: isAnalysisResult ? '100%' : undefined }}>
      {!isUser && (
        <div style={{ width: 28, height: 28, borderRadius: 7, background: P, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff' }}>
          <Bot size={15} />
        </div>
      )}
      <div style={{
        maxWidth: isAnalysisResult ? '100%' : '74%',
        width: isAnalysisResult ? '100%' : undefined,
        padding: isAnalysisResult ? '16px 20px' : '11px 14px',
        borderRadius: isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
        background: isUser ? P : '#fff',
        color: isUser ? '#fff' : D,
        border: isUser ? 'none' : `1px solid ${B}`,
        fontSize: '0.88rem',
        lineHeight: 1.65,
        boxShadow: isAnalysisResult ? '0 2px 8px rgba(0,0,0,0.06)' : undefined,
      }}>
        <MarkdownContent content={message.content} isUser={isUser} />
      </div>
      {isUser && !message.isAnalysis && (
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.7rem', fontWeight: 700, color: D }}>You</div>
      )}
    </div>
  );
}

// ─── Markdown renderer ────────────────────────────────────────────────────────
function MarkdownContent({ content, isUser }: { content: string; isUser: boolean }) {
  const lines = content.split('\n');
  const result: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const rendered = line
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code style="background:rgba(0,0,0,0.06);padding:1px 5px;border-radius:3px;font-family:monospace;font-size:0.88em">$1</code>');

    // Table detection
    if (line.includes('|') && i + 1 < lines.length && lines[i + 1].includes('---')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].includes('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      result.push(<MarkdownTable key={i} rows={tableLines} isUser={isUser} />);
      continue;
    }

    if (line.startsWith('### ')) {
      result.push(<div key={i} style={{ fontWeight: 700, fontSize: '0.92rem', color: isUser ? '#fff' : P, marginTop: 14, marginBottom: 5 }} dangerouslySetInnerHTML={{ __html: rendered.replace(/^###\s/, '') }} />);
    } else if (line.startsWith('## ')) {
      result.push(<div key={i} style={{ fontWeight: 800, fontSize: '0.97rem', color: isUser ? '#fff' : D, marginTop: 16, marginBottom: 6, borderBottom: isUser ? 'none' : `1px solid ${B}`, paddingBottom: 4 }} dangerouslySetInnerHTML={{ __html: rendered.replace(/^##\s/, '') }} />);
    } else if (line.startsWith('# ')) {
      result.push(<div key={i} style={{ fontWeight: 800, fontSize: '1.05rem', color: isUser ? '#fff' : D, marginTop: 16, marginBottom: 8 }} dangerouslySetInnerHTML={{ __html: rendered.replace(/^#\s/, '') }} />);
    } else if (line.match(/^(\d+)\.\s/)) {
      const num = line.match(/^(\d+)\./)?.[1];
      result.push(
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
          <span style={{ flexShrink: 0, fontWeight: 700, color: isUser ? 'rgba(255,255,255,0.7)' : P, minWidth: 16 }}>{num}.</span>
          <span dangerouslySetInnerHTML={{ __html: rendered.replace(/^\d+\.\s/, '') }} />
        </div>
      );
    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      result.push(
        <div key={i} style={{ display: 'flex', gap: 7, marginBottom: 4 }}>
          <span style={{ flexShrink: 0, marginTop: 3, color: isUser ? 'rgba(255,255,255,0.6)' : P, fontSize: '0.6rem' }}>●</span>
          <span dangerouslySetInnerHTML={{ __html: rendered.replace(/^[-•]\s/, '') }} />
        </div>
      );
    } else if (line.startsWith('🔴') || line.startsWith('🟡') || line.startsWith('🟢')) {
      result.push(
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, padding: '8px 12px', background: isUser ? 'rgba(255,255,255,0.1)' : (line.startsWith('🔴') ? '#fef2f2' : line.startsWith('🟡') ? '#fffbeb' : '#f0fdf4'), borderRadius: 6 }}>
          <span dangerouslySetInnerHTML={{ __html: rendered }} />
        </div>
      );
    } else if (line.trim() === '') {
      result.push(<div key={i} style={{ height: 6 }} />);
    } else {
      result.push(<div key={i} style={{ marginBottom: 2 }} dangerouslySetInnerHTML={{ __html: rendered }} />);
    }
    i++;
  }

  return <>{result}</>;
}

function MarkdownTable({ rows, isUser }: { rows: string[]; isUser: boolean }) {
  const parseRow = (row: string) => row.split('|').filter((_, i, a) => i > 0 && i < a.length - 1).map(c => c.trim());
  const header = parseRow(rows[0]);
  const body = rows.slice(2).map(parseRow);

  return (
    <div style={{ overflowX: 'auto', margin: '10px 0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
        <thead>
          <tr style={{ background: isUser ? 'rgba(255,255,255,0.15)' : '#f8fafc' }}>
            {header.map((h, i) => (
              <th key={i} style={{ padding: '7px 12px', textAlign: 'left', fontWeight: 700, color: isUser ? '#fff' : D, borderBottom: `2px solid ${isUser ? 'rgba(255,255,255,0.3)' : B}`, whiteSpace: 'nowrap' }}
                dangerouslySetInnerHTML={{ __html: h.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: `1px solid ${isUser ? 'rgba(255,255,255,0.1)' : B}`, background: ri % 2 === 1 ? (isUser ? 'rgba(255,255,255,0.05)' : '#fafafa') : 'transparent' }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{ padding: '6px 12px', color: isUser ? '#fff' : D }}
                  dangerouslySetInnerHTML={{ __html: cell.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Typing / loading indicator ───────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: P, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff' }}>
        <Bot size={15} />
      </div>
      <div style={{ padding: '12px 16px', background: '#fff', border: `1px solid ${B}`, borderRadius: '12px 12px 12px 4px', display: 'flex', gap: 5, alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: P, animation: `za-pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </div>
      <style>{`@keyframes za-pulse { 0%,80%,100%{transform:scale(0.7);opacity:0.35} 40%{transform:scale(1);opacity:1} }`}</style>
    </div>
  );
}

function SpinnerDots() {
  return (
    <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor', display: 'inline-block', animation: `za-pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
      ))}
    </span>
  );
}
