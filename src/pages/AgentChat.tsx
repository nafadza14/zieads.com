import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, PlayCircle, Send, Sparkles, ArrowRight, Zap, Link2, Mic, MicOff, Square } from 'lucide-react';
import ZieAdsLogo from '../components/ZieAdsLogo';
import { 
  UilSearchAlt, UilBedDouble, UilChartDown, UilMoneyBill, UilEye, UilMedicalSquare, 
  UilFlask, UilAnalysis, UilCrosshairs, UilRocket, UilChat, UilBolt, UilArrowUp, UilArrowRight, UilPlay
} from '@iconscout/react-unicons';
import { supabase } from '../lib/supabaseClient';
import { useCreditStore } from '../lib/creditStore';
import CreditBadge from '../components/CreditBadge';
import FeatureGateModal from '../components/FeatureGateModal';
import V3Layout from '../components/v3/V3Layout';

const P = '#1E7BFF'; // Premium electric blue accent
const G = '#6B7A89'; // Muted editorial text
const D = '#0B1B2B'; // Deep ink dark text
const B = '#E5DFCF'; // Vintage construction grid/cream border
const PL = '#FAF8F3'; // Soft sand inset

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
const DYNAMIC_SUGGESTIONS = [
  {
    tag: 'Meta Ads',
    q: 'What Meta audience should I target for my business?',
    match: (p: any) => p.platforms_in_focus?.includes('Meta') || p.platforms?.includes('Meta') || p.challenge?.toLowerCase().includes('meta')
  },
  {
    tag: 'Meta Ads',
    q: "My Meta ROAS dropped 40% this week. What's wrong?",
    match: (p: any) => p.challenge?.toLowerCase().includes('roas') || p.goals?.includes('Improve ROAS / CPA')
  },
  {
    tag: 'Google Ads',
    q: 'Build me a Google Search campaign structure with ad groups',
    match: (p: any) => p.platforms_in_focus?.includes('Google') || p.platforms?.includes('Google') || p.challenge?.toLowerCase().includes('google')
  },
  {
    tag: 'Google Ads',
    q: 'How do I fix a low Quality Score on my top keywords?',
    match: (p: any) => p.platforms_in_focus?.includes('Google') || p.platforms?.includes('Google') || p.challenge?.toLowerCase().includes('keywords')
  },
  {
    tag: 'Creative',
    q: 'Write 5 Meta ad headlines with strong hooks for my product',
    match: (p: any) => p.goals?.includes('Write high converting copy') || p.challenge?.toLowerCase().includes('copy') || p.challenge?.toLowerCase().includes('creative')
  },
  {
    tag: 'Creative',
    q: 'What video creative format is winning on TikTok right now?',
    match: (p: any) => p.platforms_in_focus?.includes('TikTok') || p.platforms?.includes('TikTok') || p.challenge?.toLowerCase().includes('tiktok')
  },
  {
    tag: 'Strategy',
    q: 'How should I split a $10K/month budget across Meta and Google?',
    match: (p: any) => p.goals?.includes('Scale ad spend budget') || p.monthly_budget === 'Over $100K' || p.monthly_budget === '$20K to $100K'
  },
  {
    tag: 'Strategy',
    q: 'Map my full-funnel ad strategy (TOFU → MOFU → BOFU)',
    match: (p: any) => p.goals?.includes('Structure full funnel strategy') || p.challenge?.toLowerCase().includes('funnel')
  }
];

const QUICK_QUESTIONS = [
  { cat: 'Meta Ads', q: 'What Meta audience should I target for my business?' },
  { cat: 'Meta Ads', q: 'My Meta ROAS dropped 40% this week. What\'s wrong?' },
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
  const abortControllerRef = useRef<AbortController | null>(null);
  const typewriterIntervalRef = useRef<any>(null);

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (typewriterIntervalRef.current) {
      clearInterval(typewriterIntervalRef.current);
      typewriterIntervalRef.current = null;
    }
    setLoading(false);
    setRunningMode(null);
  };

  const simulateTypewriter = (text: string, onFinish?: () => void) => {
    // Append initial empty assistant message
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    let currentLength = 0;
    const interval = setInterval(() => {
      currentLength += Math.min(4, text.length - currentLength);
      const partial = text.slice(0, currentLength);
      
      setMessages(prev => {
        const copy = [...prev];
        if (copy.length > 0) {
          copy[copy.length - 1] = { ...copy[copy.length - 1], content: partial };
        }
        return copy;
      });

      if (currentLength >= text.length) {
        clearInterval(interval);
        typewriterIntervalRef.current = null;
        setLoading(false);
        if (onFinish) onFinish();
      }
    }, 15);

    typewriterIntervalRef.current = interval;
  };

  const [attachedFile, setAttachedFile] = useState<{ name: string; url: string; mimeType: string } | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [randomGreeting, setRandomGreeting] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const greetings = [
      "Hi {name}, I'm your dedicated AI Agent. Ready to audit your campaigns and grow your ROAS today?",
      "Hello {name}, your AI Agent is online. Let's optimize your marketing funnel and build winning strategies.",
      "Greetings {name}! I am your advertising assistant. What campaigns are we improving today?",
      "Hey {name}, your AI partner here. Let's crush your CPA targets and find new audiences.",
      "Hi {name}! As your growth agent, I'm ready to diagnose your ads and double your conversion rate.",
      "Hello {name}, your strategic copilot is ready. Tell me your biggest ad challenge and let's solve it.",
      "Welcome back, {name}. Your AI Agent is ready to brainstorm high-converting hooks and copy.",
      "Hey {name}, growth agent reporting for duty. Let's analyze your Meta and TikTok performance.",
      "Hello {name}! I am your personal ads expert. Let's build Google Search structures that convert.",
      "Hi {name}, let's audit your budget. I am your agent, here to maximize your daily ad spend return.",
      "Hey {name}! Ready to spy on competitors? I am your intelligence agent, at your service.",
      "Hello {name}, let's check your creative fatigue. Your dedicated AI copywriter is ready.",
      "Hi {name}! Ready for launch? Let's run a campaign readiness check and eliminate risks.",
      "Hey {name}, let's map your TOFU-MOFU-BOFU funnel. I'm your architect agent.",
      "Hello {name}, I am your ad performance doctor. Let's diagnose any recent ROAS drops.",
      "Hi {name}! As your strategic advisor, I'm here to recommend the best custom audience tests.",
      "Greetings {name}. Your AI Agent is set up. Let's write copy that hooks prospects instantly.",
      "Hey {name}, let's review your TikTok video hooks. I am your creative optimization agent.",
      "Hello {name}, ready to scale? I'm your budget allocation specialist. Let's do this.",
      "Hi {name}! What ad creative shall we optimize today? I'm here to write your briefs.",
      "Hey {name}, let's audit your landing page CRO. I am your conversion rate agent.",
      "Hello {name}, your AI assistant is active. Let's align your Google and Meta search keywords.",
      "Hi {name}, let's review your Meta Ads CPA benchmarks. Your data analyst agent is online.",
      "Hey {name}! I am your growth strategist. Ready to structure a $10K budget split?",
      "Hello {name}, let's design high-quality lead magnets. Your lead generation agent is here.",
      "Hi {name}, let's brainstorm new angles for your SaaS product. I am your creative agent.",
      "Hey {name}! Let's optimize your Shopify store conversions. Your e-commerce agent is active.",
      "Hello {name}, let's write 5 viral TikTok video hooks. Your UGC agent is ready.",
      "Hi {name}, ready to beat your competitors' ad copy? I'm your copywriting agent."
    ];
    const rawGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    const nameVal = userProfile?.business_name || userEmail.split('@')[0] || 'there';
    setRandomGreeting(rawGreeting.replace('{name}', nameVal));
  }, [activeConvId, userProfile, userEmail]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome or Safari.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setIsListening(true);
    };

    rec.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    rec.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(prev => {
        const base = prev.trim() ? prev + ' ' : '';
        return base + transcript;
      });
    };

    recognitionRef.current = rec;
    rec.start();
  };

  const getTailoredSuggestions = () => {
    let rawList: Array<{ tag: string; q: string }> = [];

    if (!userProfile) {
      rawList = [
        { tag: 'Strategy', q: 'Map my full-funnel ad strategy (TOFU → MOFU → BOFU)' },
        { tag: 'Meta Ads', q: 'What Meta audience should I target for my business?' },
        { tag: 'Creative', q: 'Write 5 Meta ad headlines with strong hooks for my product' }
      ];
    } else {
      const matched = DYNAMIC_SUGGESTIONS.filter(item => item.match(userProfile));
      rawList = matched.map(m => ({ tag: m.tag, q: m.q }));

      const defaultSuggestions = [
        { tag: 'Strategy', q: 'Map my full-funnel ad strategy (TOFU → MOFU → BOFU)' },
        { tag: 'Meta Ads', q: 'What Meta audience should I target for my business?' },
        { tag: 'Creative', q: 'Write 5 Meta ad headlines with strong hooks for my product' },
        { tag: 'Google Ads', q: 'Build me a Google Search campaign structure with ad groups' }
      ];

      for (const item of defaultSuggestions) {
        if (rawList.length >= 4) break;
        if (!rawList.some(r => r.q === item.q)) {
          rawList.push(item);
        }
      }
    }

    return rawList;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const headers = await getAuthHeaders();
      const authHeaders = { ...headers } as any;
      delete authHeaders['Content-Type'];

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/v3/media/upload?skipLibrary=true', {
        method: 'POST',
        headers: authHeaders,
        body: formData
      });

      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Upload failed');

      setAttachedFile({
        name: file.name,
        url: j.blob_url || j.url,
        mimeType: file.type
      });
    } catch (err: any) {
      alert('Upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

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
    let msg = (text || input).trim();
    if (!msg && !attachedFile) return;

    const originalMsg = msg || (attachedFile ? `[Attached file: ${attachedFile.name}]` : '');

    if (!text && attachedFile) {
      msg = `${msg}\n\n[User attached file: ${attachedFile.name} (URL: ${attachedFile.url})]`;
    }

    if (!msg || loading) return;
    setInput('');
    setAttachedFile(null);
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: originalMsg }]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const headers = await getAuthHeaders();
    try {
      const res = await fetch('/api/agent/message', {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: msg, conversationId: activeConvId }),
        signal: controller.signal
      });
      const j = await res.json();

      if (res.status === 429) {
        setMessages(prev => [...prev, { role: 'assistant', content: `**Rate limit reached.** ${j.message}` }]);
        setLoading(false);
        return;
      }
      if (!j.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }]);
        setLoading(false);
        return;
      }
      if (!activeConvId && j.conversationId) {
        setActiveConvId(j.conversationId);
        await refreshConversations();
      }

      abortControllerRef.current = null;
      simulateTypewriter(j.reply || '');
      if (j.usage) setUsage(prev => ({ ...prev, used: j.usage.used, limit: j.usage.limit }));
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setMessages(prev => [...prev, { role: 'assistant', content: '_Generation stopped._' }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Network error. Please check your connection.' }]);
      }
      setLoading(false);
    } finally {
      inputRef.current?.focus();
    }
  };

  // ─── Run structured analysis mode ────────────────────────────────────────
  const runAnalysis = async (modeId: UseCaseId) => {
    setRunningMode(modeId);
    setActiveTab('chat');
    setLoading(true);

    const modeInfo = USE_CASES.find(u => u.id === modeId)!;
    const analysisContext = input.trim();
    setInput('');

    setMessages(prev => [...prev, {
      role: 'user',
      content: `${modeInfo.label} initiated...${analysisContext ? `\n\nContext: ${analysisContext}` : ''}`,
      isAnalysis: true,
      analysisMode: modeId,
    }]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const headers = await getAuthHeaders();
    try {
      const res = await fetch('/api/agent/analyze', {
        method: 'POST',
        headers,
        body: JSON.stringify({ mode: modeId, data: analysisContext, conversationId: activeConvId }),
        signal: controller.signal
      });
      const j = await res.json();

      if (!activeConvId && j.conversationId) {
        setActiveConvId(j.conversationId);
        await refreshConversations();
      }

      abortControllerRef.current = null;

      simulateTypewriter(j.result || 'Analysis complete.', () => {
        setRunningMode(null);
      });
      if (j.usage) setUsage(prev => ({ ...prev, used: j.usage.used, limit: j.usage.limit }));
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setMessages(prev => [...prev, { role: 'assistant', content: '_Analysis stopped._' }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Analysis failed. Please try again.' }]);
      }
      setLoading(false);
      setRunningMode(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const isAtLimit = usage.used >= usage.limit;
  const creditStore = useCreditStore();
  const [modeGateModal, setModeGateModal] = useState<{ open: boolean; modeName: string; requiredPlan: 'starter' | 'pro' | 'agency' }>({ open: false, modeName: '', requiredPlan: 'pro' });

  const handleModeClick = (modeId: string, modeLabel: string) => {
    if (creditStore.isModeLocked(modeId)) {
      setModeGateModal({ open: true, modeName: modeLabel, requiredPlan: 'pro' });
      return;
    }
    runAnalysis(modeId as any);
  };

  return (
    <>
      <div style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        background: '#F7F5F0', // Cream editorial background
        fontFamily: 'var(--font-primary, "General Sans", ui-sans-serif, system-ui, sans-serif)',
        overflow: 'hidden'
      }}>

      {/* ─── LEFT SUB-SIDEBAR (CONVERSATIONS LIST) ─── */}
      <aside style={{
        width: 260,
        background: '#FFFFFF',
        borderRight: '1px solid #E5DFCF',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0
      }}>
        {/* New Conversation Trigger */}
        <div style={{ padding: '20px', borderBottom: '1px solid #E5DFCF', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Back to Dashboard Button */}
          <button
            onClick={() => navigate('/clients')}
            style={{
              width: '100%',
              background: 'transparent',
              border: '1px solid #E5DFCF',
              color: '#3D4F62',
              padding: '10px 0',
              borderRadius: '12px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FAF8F3'; e.currentTarget.style.borderColor = '#1E7BFF'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#E5DFCF'; }}
          >
            <span>← Back to Dashboard</span>
          </button>

          <button
            onClick={startNew}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #1E7BFF 0%, #0EA5E9 100%)',
              color: '#fff',
              border: 'none',
              padding: '12px 0',
              borderRadius: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.88rem',
              boxShadow: '0 4px 12px rgba(30,123,255,0.15)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <span>+ New Conversation</span>
          </button>
            
            {userProfile?.business_name && (
              <div style={{
                background: '#FAF8F3',
                border: '1px solid #EBE6DC',
                borderRadius: '12px',
                padding: '12px 14px',
                marginTop: '4px'
              }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#6B7A89', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Business Context</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0B1B2B', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{userProfile.business_name}</div>
                {userProfile.business_type && <div style={{ fontSize: '0.72rem', color: '#6B7A89', marginTop: 1 }}>{userProfile.business_type}</div>}
                <button onClick={() => navigate('/profile')} style={{ marginTop: '6px', background: 'none', border: 'none', fontSize: '11px', color: '#1E7BFF', cursor: 'pointer', padding: 0, fontWeight: 600 }}>
                  Edit Profile →
                </button>
              </div>
            )}
          </div>

          {/* Conversations feed */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
            <div style={{ padding: '0 20px 8px', fontSize: '10px', fontWeight: 700, color: '#6B7A89', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recent Chats</div>
            {loadingConvs ? (
              <div style={{ padding: '12px 20px', color: '#6B7A89', fontSize: '0.82rem' }}>Loading...</div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: '12px 20px', color: '#6B7A89', fontSize: '0.82rem' }}>No conversations yet</div>
            ) : conversations.map(conv => {
              const isActive = activeConvId === conv.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => loadConversation(conv.id)}
                  style={{
                    padding: '11px 20px',
                    cursor: 'pointer',
                    background: isActive ? '#FAF8F3' : 'transparent',
                    borderLeft: isActive ? '3px solid #1E7BFF' : '3px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: isActive ? 600 : 500, color: '#0B1B2B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{conv.title}</div>
                    <div style={{ fontSize: '0.7rem', color: '#6B7A89', marginTop: 2 }}>{new Date(conv.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  </div>
                  <button onClick={e => deleteConv(conv.id, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7A89', fontSize: '1rem', padding: '0 4px', opacity: 0.5 }} title="Delete">×</button>
                </div>
              );
            })}
          </div>
        </aside>

        {/* ─── WORKSPACE CONTENT ─── */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5DFCF', padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: '12px', background: 'linear-gradient(135deg, #1E7BFF 0%, #0EA5E9 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <Bot size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.97rem', color: '#0B1B2B' }}>ZieAds AI Agent</div>
                <div style={{ fontSize: '0.74rem', color: '#6B7A89' }}>Strategic Ads Analyst · Claude 3.5 Sonnet</div>
              </div>
            </div>

            {/* Toggle tabs */}
            <div style={{ display: 'flex', gap: 6, background: '#FAF8F3', border: '1px solid #E5DFCF', padding: '3px', borderRadius: '10px' }}>
              {(['chat', 'modes'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    background: activeTab === tab ? '#FFFFFF' : 'transparent',
                    border: activeTab === tab ? '1px solid #E5DFCF' : '1px solid transparent',
                    boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.03)' : 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: activeTab === tab ? '#1E7BFF' : '#6B7A89',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab === 'chat' ? <UilChat size={14} /> : <UilBolt size={14} />}
                  {tab === 'chat' ? 'Chat Workspace' : 'Analysis Modes'}
                </button>
              ))}
            </div>
          </div>

          {/* Tab: Analysis Modes */}
          {activeTab === 'modes' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
              <div style={{ maxWidth: 900, margin: '0 auto' }}>
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{ fontFamily: 'var(--font-display, "Bricolage Grotesque", sans-serif)', fontSize: '1.25rem', fontWeight: 700, color: '#0B1B2B', margin: '0 0 8px' }}>10 Deep Analysis Modes</h2>
                  <p style={{ color: '#6B7A89', fontSize: '0.88rem', lineHeight: 1.5, margin: 0 }}>Select a mode to run a structured diagnostic based on your audit data. You can paste custom raw campaign metrics below to deliver extra precision.</p>
                </div>

                {/* Additional context input card */}
                <div style={{ marginBottom: 24, background: '#FFFFFF', border: '1px solid #E5DFCF', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(9, 9, 11, 0.02)' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6B7A89', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>Optional: Paste Campaign Data (Metrics, ROAS, CPA, Spend)</div>
                  <textarea
                    value={additionalData}
                    onChange={e => setAdditionalData(e.target.value)}
                    placeholder="e.g., 'Meta Spend: $400/day, ROAS: 2.1, CTR: 1.2%, primary issue: creative ad fatigue on variant A.'"
                    rows={3}
                    style={{ width: '100%', border: '1px solid #E5DFCF', borderRadius: '10px', padding: '12px', fontSize: '0.85rem', color: '#0B1B2B', fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Modes grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                  {USE_CASES.map(uc => (
                    <UseCaseCard
                      key={uc.id}
                      useCase={uc}
                      isRunning={runningMode === uc.id && loading}
                      isDisabled={loading || isAtLimit}
                      onRun={() => handleModeClick(uc.id, uc.label)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab: Chat */}
          {activeTab === 'chat' && (
            <>
              {/* Messages viewport */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', display: 'flex', flexDirection: 'column' }}>
                {messages.length === 0 ? (
                  <div style={{ 
                    maxWidth: 600, 
                    width: '100%',
                    textAlign: 'center',
                    background: '#FFFFFF',
                    border: '1px solid #E5DFCF',
                    borderRadius: '24px',
                    padding: '40px 32px',
                    boxShadow: '0 12px 32px rgba(11,27,43,0.03)',
                    margin: 'auto'
                  }}>
                    <div style={{ width: 56, height: 56, borderRadius: '16px', background: '#1E7BFF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#FFFFFF' }}>
                      <Bot size={28} />
                    </div>
                    <h1 style={{ fontFamily: 'var(--font-display, "Bricolage Grotesque", sans-serif)', fontSize: '1.65rem', fontWeight: 700, color: '#0B1B2B', margin: '0 0 12px', lineHeight: 1.35 }}>
                      {randomGreeting}
                    </h1>
                    <p style={{ fontSize: '0.88rem', color: '#6B7A89', lineHeight: 1.5, margin: 0 }}>
                      Type your question below or click one of the suggestions to get insights for your brand context.
                    </p>
                  </div>
                ) : (
                  <div style={{ maxWidth: 950, margin: '0 auto', width: '100%' }}>
                    {messages.map((msg, i) => (
                      <MessageBubble key={i} message={msg} />
                    ))}
                    {loading && <TypingIndicator />}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Chat Input outer bar */}
              <div style={{ padding: '24px 40px 32px', background: 'transparent', flexShrink: 0 }}>
                <div style={{ maxWidth: 760, margin: '0 auto', width: '100%' }}>
                  {isAtLimit ? (
                    <div style={{ padding: 20, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '16px', textAlign: 'center' }}>
                      <div style={{ color: '#991B1B', fontWeight: 600, fontSize: '0.92rem', marginBottom: 4 }}>Monthly Message Limit Reached</div>
                      <div style={{ color: '#7F1D1D', fontSize: '0.83rem', marginBottom: 14 }}>You've reached your free plan limit of {usage.limit} messages.</div>
                      <button onClick={() => navigate('/pricing')} style={{ background: '#1E7BFF', color: '#fff', border: 'none', padding: '9px 24px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>Upgrade Plan</button>
                    </div>
                  ) : (
                    /* Redesigned Premium Chat Card */
                    <div className="hero-chat-card-outer" style={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      background: '#FFFFFF', 
                      border: '1px solid #E5DFCF', 
                      borderRadius: '24px', 
                      padding: '20px 24px',
                      boxShadow: '0 20px 40px -15px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.01)',
                      transition: 'all 0.25s ease'
                    }}>
                      {/* Attached file chip */}
                      {attachedFile && (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          alignSelf: 'flex-start',
                          gap: 6,
                          background: '#FAF8F3',
                          border: '1px solid #E5DFCF',
                          borderRadius: '10px',
                          padding: '6px 12px',
                          marginBottom: '10px',
                          fontSize: '0.78rem',
                          color: '#3D4F62'
                        }}>
                          <span>📎 {attachedFile.name}</span>
                          <button
                            onClick={() => setAttachedFile(null)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#6B7A89',
                              cursor: 'pointer',
                              fontSize: '1rem',
                              fontWeight: 700,
                              padding: '0 2px'
                            }}
                          >
                            ×
                          </button>
                        </div>
                      )}

                      {uploadingFile && (
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#1E7BFF',
                          marginBottom: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}>
                          <span style={{ animation: 'za-pulse 1.2s ease-in-out infinite' }}>Uploading attachment...</span>
                        </div>
                      )}

                      <textarea
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask anything: ad strategy, hook headlines, budget split, target audience..."
                        rows={1}
                        style={{ 
                          width: '100%',
                          background: 'transparent',
                          border: 'none',
                          fontSize: '16px',
                          lineHeight: '1.6',
                          color: '#0B1B2B',
                          outline: 'none',
                          resize: 'none',
                          minHeight: '60px',
                          maxHeight: '150px',
                          overflowY: 'auto'
                        }}
                        onInput={e => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 150) + 'px'; }}
                        disabled={loading}
                      />
                      
                      {/* Toolbar matching landing page style */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, borderTop: '1px solid #E5DFCF', paddingTop: 14 }}>
                         {/* Attachments */}
                         <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                           <button
                             type="button"
                             onClick={() => document.getElementById('agentFileUpload')?.click()}
                             disabled={uploadingFile || loading}
                             title="Attach File"
                             style={{
                               width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #E5DFCF',
                               background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center',
                               cursor: 'pointer', color: '#6B7280', transition: 'all 0.2s ease'
                             }}
                           >
                             <Link2 size={16} />
                           </button>
                         </div>
 
                         {/* Action buttons (Mic + Send) */}
                         <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                           {/* Microphone Button */}
                           <button
                             type="button"
                             onClick={toggleListening}
                             title={isListening ? "Stop recording voice" : "Record voice context"}
                             style={{
                               width: '38px',
                               height: '38px',
                               borderRadius: '50%',
                               border: `1px solid ${isListening ? '#EF4444' : '#E5DFCF'}`,
                               background: isListening ? '#FEF2F2' : '#F9FAFB',
                               display: 'flex',
                               alignItems: 'center',
                               justifyContent: 'center',
                               cursor: 'pointer',
                               color: isListening ? '#EF4444' : '#6B7280',
                               transition: 'all 0.2s ease',
                               animation: isListening ? 'za-pulse 1.2s ease-in-out infinite' : 'none'
                             }}
                           >
                             {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                           </button>
 
                           {/* Stop/Send Button */}
                           {loading ? (
                             <button
                               type="button"
                               onClick={stopGeneration}
                               title="Stop generating"
                               style={{
                                 width: '38px',
                                 height: '38px',
                                 borderRadius: '50%',
                                 border: 'none',
                                 background: '#EF4444',
                                 color: '#FFFFFF',
                                 display: 'flex',
                                 alignItems: 'center',
                                 justifyContent: 'center',
                                 cursor: 'pointer',
                                 transition: 'all 0.2s ease',
                                 boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
                               }}
                             >
                               <Square size={14} fill="#FFFFFF" />
                             </button>
                           ) : (
                             <button
                               type="button"
                               onClick={() => sendMessage()}
                               disabled={loading || (!input.trim() && !attachedFile)}
                               style={{ 
                                 width: '38px',
                                 height: '38px',
                                 borderRadius: '50%',
                                 border: 'none',
                                 background: '#1E7BFF',
                                 color: '#FFFFFF',
                                 display: 'flex',
                                 alignItems: 'center',
                                 justifyContent: 'center',
                                 cursor: loading || (!input.trim() && !attachedFile) ? 'not-allowed' : 'pointer',
                                 opacity: loading || (!input.trim() && !attachedFile) ? 0.6 : 1,
                                 transition: 'all 0.2s ease',
                                 boxShadow: '0 4px 12px rgba(30, 123, 255, 0.25)'
                               }}
                               onMouseEnter={e => { if (!loading && (input.trim() || attachedFile)) e.currentTarget.style.background = '#0056b3'; }}
                               onMouseLeave={e => { if (!loading && (input.trim() || attachedFile)) e.currentTarget.style.background = '#1E7BFF'; }}
                             >
                               <Send size={15} />
                             </button>
                           )}
                         </div>
                       </div>
                     </div>
                   )}
                   
                   {/* Pills suggestion block underneath the chat input card (disappears when chat starts) */}
                   {messages.length === 0 && (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>


                      {/* Quick Suggestions Pills */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#6B7A89', display: 'flex', alignItems: 'center', marginRight: 4 }}>
                          <Sparkles size={13} style={{ marginRight: 4, color: '#0EA5E9' }} />
                          Suggestions:
                        </span>
                        {getTailoredSuggestions().map((q, idx) => (
                          <button
                            key={idx}
                            onClick={() => sendMessage(q.q)}
                            style={{
                              background: '#FFFFFF',
                              border: '1px solid #E5DFCF',
                              borderRadius: '20px',
                              padding: '5px 12px',
                              fontSize: '11px',
                              fontWeight: 500,
                              color: '#3D4F62',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              maxWidth: '280px'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#1E7BFF'; e.currentTarget.style.background = '#FAF8F3'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5DFCF'; e.currentTarget.style.background = '#FFFFFF'; }}
                            title={q.q}
                          >
                            {q.q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Mode Feature Gate Modal */}
      <FeatureGateModal
        isOpen={modeGateModal.open}
        onClose={() => setModeGateModal(m => ({ ...m, open: false }))}
        featureName={modeGateModal.modeName}
        featureDescription={`${modeGateModal.modeName} is available on Pro and above. Unlock all 6 AI analysis modes with Pro.`}
        requiredPlan={modeGateModal.requiredPlan}
        featureType="mode"
      />
      <input
        type="file"
        id="agentFileUpload"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />
    </>
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
    <div style={{ 
      background: '#FFFFFF', 
      border: '1px solid #E5DFCF', 
      borderRadius: '16px', 
      padding: '20px', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 14, 
      transition: 'all 0.2s ease',
      boxShadow: '0 2px 8px rgba(11, 27, 43, 0.03)'
    }}
      onMouseOver={e => { 
        (e.currentTarget as HTMLDivElement).style.borderColor = '#1E7BFF'; 
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(11, 27, 43, 0.06)'; 
      }}
      onMouseOut={e => { 
        (e.currentTarget as HTMLDivElement).style.borderColor = '#E5DFCF'; 
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(11, 27, 43, 0.03)'; 
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ 
          width: 42, height: 42, borderRadius: '10px', 
          background: '#FAF8F3', border: '1px solid #EBE6DC', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          color: '#3D4F62', flexShrink: 0 
        }}>
          {useCase.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0B1B2B' }}>{useCase.label}</div>
          <div style={{ fontSize: '0.75rem', color: '#6B7A89', marginTop: 2 }}>{useCase.shortDesc}</div>
        </div>
      </div>
      <div style={{ fontSize: '0.8rem', color: '#3D4F62', lineHeight: 1.55, flex: 1 }}>{useCase.prompt.slice(0, 110)}…</div>
      <button
        onClick={onRun}
        disabled={isDisabled}
        style={{
          background: isRunning ? '#FAF8F3' : 'linear-gradient(135deg, #1E7BFF 0%, #0EA5E9 100%)',
          color: isRunning ? '#0B1B2B' : '#fff',
          border: isRunning ? '1px solid #E5DFCF' : 'none',
          borderRadius: '10px',
          padding: '8px 0',
          fontWeight: 600,
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          fontSize: '0.82rem',
          opacity: isDisabled && !isRunning ? 0.6 : 1,
          transition: 'all 0.15s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          boxShadow: isRunning ? 'none' : '0 4px 12px rgba(30,123,255,0.15)'
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
    <div style={{ maxWidth: 680, margin: '0 auto', paddingTop: 20 }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ width: 50, height: 50, background: '#FFFFFF', border: '1px solid #E5DFCF', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#1E7BFF', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <Bot size={24} />
        </div>
        <h2 style={{ fontFamily: 'var(--font-display, "Bricolage Grotesque", sans-serif)', fontSize: '30px', fontWeight: 700, color: '#0B1B2B', letterSpacing: '-0.02em', margin: '0 0 14px', lineHeight: 1.25 }}>
          Ask ZieAds anything about <span style={{ fontStyle: 'italic', color: '#1E7BFF', fontWeight: 800 }}>paid ads strategy</span>.
        </h2>
        <p style={{ color: '#6B7A89', fontSize: '0.88rem', lineHeight: 1.6, margin: '0 auto 24px', maxWidth: 520 }}>
          Your expert paid ads strategist. Ask anything about Meta, Google, TikTok or LinkedIn, or run one of our 10 deep analysis modes.
        </p>
        {businessName && (
          <div style={{ display: 'inline-block', background: '#FFFFFF', border: '1px solid #E5DFCF', borderRadius: '20px', padding: '4px 14px', fontSize: '0.78rem', color: '#3D4F62', fontWeight: 600, marginBottom: 20 }}>
            Analyzing: {businessName}
          </div>
        )}
        <div>
          <button 
            onClick={onSwitchModes} 
            className="btn-lp-primary-gradient"
            style={{ 
              color: '#fff', 
              border: 'none', 
              padding: '10px 22px', 
              borderRadius: '10px', 
              fontWeight: 600, 
              cursor: 'pointer', 
              fontSize: '0.85rem', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: 6,
              boxShadow: 'var(--lp-shadow-cta)'
            }}
          >
            <UilBolt size={14} /> Run Deep Analysis <UilArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Feature pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 32 }}>
        {['Daily Diagnosis', 'ROAS Drop Analysis', 'Creative Fatigue', 'Budget Optimization', 'Competitive Intel', 'Launch Readiness'].map(f => (
          <span key={f} style={{ background: '#FFFFFF', border: '1px solid #E5DFCF', borderRadius: '20px', padding: '5px 14px', fontSize: '0.75rem', color: '#3D4F62', fontWeight: 600 }}>{f}</span>
        ))}
      </div>

      {/* Quick questions by category */}
      <div style={{ marginBottom: 12, fontSize: '0.72rem', fontWeight: 700, color: '#6B7A89', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Quick Suggestions</div>
      {cats.map(cat => (
        <div key={cat} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#3D4F62', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>{cat}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {QUICK_QUESTIONS.filter(q => q.cat === cat).map((q, i) => (
              <button 
                key={i} 
                onClick={() => onSuggest(q.q)} 
                style={{ 
                  background: '#FFFFFF', 
                  border: '1px solid #E5DFCF', 
                  borderRadius: '12px', 
                  padding: '12px 16px', 
                  textAlign: 'left', 
                  cursor: 'pointer', 
                  fontSize: '0.82rem', 
                  color: '#0B1B2B', 
                  lineHeight: 1.45, 
                  transition: 'all 0.15s ease' 
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = '#1E7BFF'; e.currentTarget.style.background = '#FAF8F3'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = '#E5DFCF'; e.currentTarget.style.background = '#FFFFFF'; }}
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

// Helper to strip emojis/emoticons from chatbot responses
const stripEmojis = (text: string) => {
  return text.replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/gu, '');
};

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const isAnalysisResult = !isUser && message.isAnalysis;

  if (isUser && message.isAnalysis) {
    const uc = USE_CASES.find(u => u.id === message.analysisMode);
    return (
      <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
        <div style={{ width: 30, height: 30, borderRadius: '8px', background: uc?.bg || '#FAF8F3', border: `1px solid ${uc?.border || '#E5DFCF'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>
          {uc?.icon || '⚡'}
        </div>
        <div style={{ padding: '10px 16px', background: uc?.bg || '#FAF8F3', border: `1px solid ${uc?.border || '#E5DFCF'}`, borderRadius: '12px 12px 12px 4px', fontSize: '0.85rem', color: uc?.color || '#0B1B2B', fontWeight: 600 }}>
          {stripEmojis(message.content)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 20, justifyContent: isUser ? 'flex-end' : 'flex-start', maxWidth: isAnalysisResult ? '100%' : undefined }}>
      {!isUser && (
        <div style={{ width: 30, height: 30, borderRadius: '9px', background: 'linear-gradient(135deg, #1E7BFF 0%, #0EA5E9 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff' }}>
          <Bot size={16} />
        </div>
      )}
      <div style={{
        maxWidth: isAnalysisResult ? '100%' : (isUser ? '75%' : '90%'),
        width: isAnalysisResult ? '100%' : undefined,
        padding: isAnalysisResult ? '20px 24px' : '12px 16px',
        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        background: isUser ? '#EBF3FF' : '#FFFFFF',
        color: '#0B1B2B',
        border: isUser ? '1px solid #BFDBFE' : '1px solid #E5DFCF',
        fontSize: '0.88rem',
        lineHeight: 1.7,
        boxShadow: '0 2px 8px rgba(11, 27, 43, 0.02)',
      }}>
        <MarkdownContent content={stripEmojis(message.content)} isUser={isUser} />
      </div>
      {isUser && !message.isAnalysis && (
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#E5DFCF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.72rem', fontWeight: 700, color: '#0B1B2B' }}>Me</div>
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
      .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 550; color: #0B1B2B;">$1</strong>')
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
      result.push(<div key={i} style={{ fontWeight: 600, fontSize: '0.92rem', color: '#0B1B2B', marginTop: 14, marginBottom: 5 }} dangerouslySetInnerHTML={{ __html: rendered.replace(/^###\s/, '') }} />);
    } else if (line.startsWith('## ')) {
      result.push(<div key={i} style={{ fontWeight: 700, fontSize: '1.02rem', color: '#0B1B2B', marginTop: 16, marginBottom: 6, borderBottom: '1px solid #E5DFCF', paddingBottom: 4 }} dangerouslySetInnerHTML={{ __html: rendered.replace(/^##\s/, '') }} />);
    } else if (line.startsWith('# ')) {
      result.push(<div key={i} style={{ fontWeight: 700, fontSize: '1.12rem', color: '#0B1B2B', marginTop: 16, marginBottom: 8 }} dangerouslySetInnerHTML={{ __html: rendered.replace(/^#\s/, '') }} />);
    } else if (line.match(/^(\d+)\.\s/)) {
      const num = line.match(/^(\d+)\./)?.[1];
      result.push(
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
          <span style={{ flexShrink: 0, fontWeight: 600, color: '#6B7A89', minWidth: 16 }}>{num}.</span>
          <span dangerouslySetInnerHTML={{ __html: rendered.replace(/^\d+\.\s/, '') }} />
        </div>
      );
    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      result.push(
        <div key={i} style={{ display: 'flex', gap: 7, marginBottom: 4 }}>
          <span style={{ flexShrink: 0, marginTop: 7, color: '#6B7A89', fontSize: '0.45rem' }}>●</span>
          <span dangerouslySetInnerHTML={{ __html: rendered.replace(/^[-•]\s/, '') }} />
        </div>
      );
    } else if (line.startsWith('🔴') || line.startsWith('🟡') || line.startsWith('🟢')) {
      const cleanText = rendered.replace(/^[🔴🟡🟢]/, '').trim();
      result.push(
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, padding: '8px 12px', background: '#FAF8F3', border: '1px solid #E5DFCF', borderRadius: 8 }}>
          <span dangerouslySetInnerHTML={{ __html: cleanText }} />
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
    <div style={{ overflowX: 'auto', margin: '12px 0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
        <thead>
          <tr style={{ background: '#FAF8F3', borderTop: '1px solid #E5DFCF', borderBottom: '2px solid #E5DFCF' }}>
            {header.map((h, i) => (
              <th key={i} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#0B1B2B', whiteSpace: 'nowrap' }}
                dangerouslySetInnerHTML={{ __html: h.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: '1px solid #E5DFCF', background: ri % 2 === 1 ? '#FAF8F3' : 'transparent' }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{ padding: '8px 12px', color: '#0B1B2B' }}
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
    <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
      <div style={{ width: 30, height: 30, borderRadius: '9px', background: 'linear-gradient(135deg, #1E7BFF 0%, #0EA5E9 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff' }}>
        <Bot size={16} />
      </div>
      <div style={{ padding: '12px 18px', background: '#FFFFFF', border: '1px solid #E5DFCF', borderRadius: '16px 16px 16px 4px', display: 'flex', gap: 5, alignItems: 'center', boxShadow: '0 2px 8px rgba(11,27,43,0.02)' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#1E7BFF', animation: `za-pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
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
