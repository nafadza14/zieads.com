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
import { TextRollButton } from './landing/ui';
import './agent-chat.css';

const P = '#F26522'; // Orange accent (matches landing page)
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
  // Onboarding Goal matches
  {
    tag: 'Daily Direction',
    q: 'What high-performing ad or content should I publish today based on my goals?',
    match: (p: any) => p.goals?.some((g: string) => g.toLowerCase().includes('post') || g.toLowerCase().includes('daily') || g.toLowerCase().includes('content'))
  },
  {
    tag: 'Performance',
    q: 'Which of my ads are generating the highest ROI and which should I pause?',
    match: (p: any) => p.goals?.some((g: string) => g.toLowerCase().includes('working') || g.toLowerCase().includes('roas') || g.toLowerCase().includes('cpa'))
  },
  {
    tag: 'Diagnosis',
    q: 'Diagnose why my ads performance or ROAS dropped recently and how to fix it',
    match: (p: any) => p.goals?.some((g: string) => g.toLowerCase().includes('drop') || g.toLowerCase().includes('numbers') || g.toLowerCase().includes('slump')) || p.challenge?.toLowerCase().includes('roas')
  },
  {
    tag: 'Competitor Intel',
    q: 'Analyze what competitors in my niche are doing with their ad creatives and offers',
    match: (p: any) => p.goals?.some((g: string) => g.toLowerCase().includes('competitor') || g.toLowerCase().includes('market'))
  },
  {
    tag: 'Audit & Scaling',
    q: 'Audit my advertising setup and tell me how to scale winning campaigns',
    match: (p: any) => p.goals?.some((g: string) => g.toLowerCase().includes('ready') || g.toLowerCase().includes('scale') || g.toLowerCase().includes('budget'))
  },
  {
    tag: 'Copy & Hooks',
    q: 'Write 5 high-converting ad headlines with strong hooks for my target audience',
    match: (p: any) => p.goals?.some((g: string) => g.toLowerCase().includes('copy') || g.toLowerCase().includes('hook') || g.toLowerCase().includes('converting'))
  },
  // Role matches
  {
    tag: 'Solo Founder',
    q: 'As a solo founder, what is the single highest-leverage ads task I should execute today?',
    match: (p: any) => p.role?.toLowerCase().includes('solo') || p.role?.toLowerCase().includes('founder')
  },
  {
    tag: 'Agency & Consultant',
    q: 'Generate a structured performance audit breakdown for my client accounts',
    match: (p: any) => p.role?.toLowerCase().includes('agency') || p.role?.toLowerCase().includes('freelance') || p.role?.toLowerCase().includes('consultant')
  },
  {
    tag: 'In-house Marketer',
    q: 'Draft a full-funnel ad budget allocation and channel strategy proposal',
    match: (p: any) => p.role?.toLowerCase().includes('in-house') || p.role?.toLowerCase().includes('manager')
  },
  // Platform matches
  {
    tag: 'Meta Ads',
    q: 'What Meta audience structure should I target for my business?',
    match: (p: any) => p.platforms_in_focus?.some((pl: string) => pl.toLowerCase().includes('meta') || pl.toLowerCase().includes('instagram') || pl.toLowerCase().includes('facebook')) || p.platforms?.includes('Meta')
  },
  {
    tag: 'TikTok Ads',
    q: 'What short-form video hooks and creative angles are working on TikTok right now?',
    match: (p: any) => p.platforms_in_focus?.some((pl: string) => pl.toLowerCase().includes('tiktok')) || p.platforms?.includes('TikTok')
  },
  {
    tag: 'LinkedIn Ads',
    q: 'How should I structure B2B LinkedIn sponsored content for high-intent leads?',
    match: (p: any) => p.platforms_in_focus?.some((pl: string) => pl.toLowerCase().includes('linkedin')) || p.platforms?.includes('LinkedIn')
  },
  {
    tag: 'Google Ads',
    q: 'Build me a high-intent Google Search campaign structure with negative keywords',
    match: (p: any) => p.platforms_in_focus?.some((pl: string) => pl.toLowerCase().includes('google')) || p.platforms?.includes('Google')
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
  const baseInputRef = useRef<string>('');

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

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

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    baseInputRef.current = input.trim();

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = navigator.language || 'en-US';

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
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = 0; i < event.results.length; i++) {
        const item = event.results[i];
        const text = item[0]?.transcript || '';
        if (item.isFinal) {
          finalTranscript += text + ' ';
        } else {
          interimTranscript += text;
        }
      }

      const spoken = (finalTranscript + interimTranscript).trim();
      const base = baseInputRef.current;
      const combined = base ? (spoken ? `${base} ${spoken}` : base) : spoken;
      setInput(combined);
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsListening(false);
    }
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
        setMessages(prev => [...prev, { role: 'assistant', content: `**Rate limit reached.** ${j.message || 'Limit reached.'}` }]);
        setLoading(false);
        return;
      }
      if (!j.success) {
        const errorContent = j.error || j.message || 'Something went wrong. Please try again.';
        setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${errorContent}` }]);
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
    // Use the campaign data pasted in the Analysis Modes tab, falling back to the chat input
    const analysisContext = (additionalData.trim() || input.trim());
    setInput('');
    setAdditionalData('');

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

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const usagePct = usage.limit > 0 ? Math.min(100, Math.round((usage.used / usage.limit) * 100)) : 0;
  const suggestions = getTailoredSuggestions();

  return (
    <>
      <div className="za-chat">
        {/* Mobile backdrop */}
        {sidebarOpen && <div className="za-backdrop" onClick={() => setSidebarOpen(false)} />}

        {/* ─── LEFT SIDEBAR (CONVERSATIONS) ─── */}
        <aside className={`za-sidebar ${sidebarOpen ? 'is-open' : ''}`}>
          <div className="za-brand">
            <ZieAdsLogo size={26} />
            <span className="za-brand-name">zieads</span>
            <span className="za-brand-pill">AI Agent</span>
          </div>

          <div className="za-side-actions">
            <button className="za-ghost-btn" onClick={() => navigate('/clients')}>
              <ArrowRight size={14} style={{ transform: 'rotate(180deg)' }} /> Back to dashboard
            </button>
            <TextRollButton
              text="New conversation"
              className="za-new-btn"
              onClick={() => {
                startNew();
                setSidebarOpen(false);
              }}
            />
          </div>

          <div className="za-conv-list">
            <div className="za-eyebrow-row">
              <span className="za-eyebrow">Recent chats</span>
              {conversations.length > 0 && <span className="za-count">{conversations.length}</span>}
            </div>
            {loadingConvs ? (
              <div className="za-conv-skeletons">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="za-skeleton" style={{ animationDelay: `${i * 120}ms` }} />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="za-conv-empty">No conversations yet. Ask your first question to get started.</div>
            ) : (
              conversations.map((conv, i) => {
                const isActive = activeConvId === conv.id;
                return (
                  <div
                    key={conv.id}
                    className={`za-conv ${isActive ? 'is-active' : ''}`}
                    style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                    onClick={() => {
                      loadConversation(conv.id);
                      setSidebarOpen(false);
                    }}
                  >
                    <div className="za-conv-text">
                      <div className="za-conv-title">{conv.title}</div>
                      <div className="za-conv-date">
                        {new Date(conv.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <button className="za-conv-del" onClick={(e) => deleteConv(conv.id, e)} title="Delete" aria-label="Delete conversation">
                      ×
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className="za-usage">
            <div className="za-usage-row">
              <span>Messages this month</span>
              <span className="za-mono">
                {usage.used}/{usage.limit}
              </span>
            </div>
            <div className="za-usage-track">
              <div className="za-usage-fill" style={{ width: `${usagePct}%` }} />
            </div>
            <button className="za-link-btn" onClick={() => navigate('/pricing')}>
              <span className="za-plan">{usage.plan} plan</span> Upgrade <ArrowRight size={12} />
            </button>
          </div>
        </aside>

        {/* ─── WORKSPACE ─── */}
        <main className="za-main">
          {activeTab === 'chat' && messages.length === 0 && (
            <div className="za-aura" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          )}
          {/* Header */}
          <header className="za-header">
            <div className="za-header-left">
              <button className="za-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open conversations">
                <span />
                <span />
                <span />
              </button>
              <AgentOrb size={38} active={loading} />
              <div>
                <div className="za-title">ZieAds AI Agent</div>
                <div className="za-status">
                  <span className={`za-live ${loading ? 'is-busy' : ''}`} />
                  {loading ? (runningMode ? 'Running analysis...' : 'Thinking...') : 'Online. Knows your brand context'}
                </div>
              </div>
            </div>

            <div className="za-tabs" role="tablist">
              <span className="za-tab-indicator" style={{ transform: `translateX(${activeTab === 'chat' ? 0 : 100}%)` }} />
              {(['chat', 'modes'] as const).map((tab) => (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={activeTab === tab}
                  className={`za-tab ${activeTab === tab ? 'is-active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'chat' ? <UilChat size={14} /> : <UilBolt size={14} />}
                  <span>{tab === 'chat' ? 'Chat' : 'Analysis modes'}</span>
                </button>
              ))}
            </div>
          </header>

          {/* Tab: Analysis Modes */}
          {activeTab === 'modes' && (
            <div className="za-scroll" key="modes">
              <div className="za-modes-wrap">
                <div className="za-badge-row za-fade-in">
                  <span className="za-badge-num">10</span>
                  <span className="za-badge-label">Deep analysis modes</span>
                </div>
                <WordReveal text="Run a structured diagnosis in one click." className="za-h2" />
                <p className="za-sub za-fade-in" style={{ animationDelay: '200ms' }}>
                  Each mode runs a focused analysis on your audit data and brand profile. Paste campaign metrics below for
                  extra precision.
                </p>

                <div className="za-glass za-context-card za-fade-in" style={{ animationDelay: '260ms' }}>
                  <label className="za-eyebrow" htmlFor="za-context">
                    Optional campaign data
                  </label>
                  <textarea
                    id="za-context"
                    value={additionalData}
                    onChange={(e) => setAdditionalData(e.target.value)}
                    placeholder="e.g. Meta spend $400/day, ROAS 2.1, CTR 1.2%, creative fatigue on variant A"
                    rows={3}
                  />
                </div>

                <div className="za-modes-grid">
                  {USE_CASES.map((uc, i) => (
                    <UseCaseCard
                      key={uc.id}
                      index={i}
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
              <div className="za-scroll" key="chat">
                {messages.length === 0 ? (
                  <div className="za-empty">
                    <div className="za-empty-inner">
                      <div className="za-eyebrow-pill za-fade-in">
                        <Sparkles size={13} /> Your AI marketing agent
                      </div>
                      <WordReveal key={randomGreeting} text={randomGreeting} className="za-greeting" />
                      <p className="za-sub za-fade-in" style={{ animationDelay: '350ms' }}>
                        Type your question below or pick a suggestion to get insights tailored to your brand.
                      </p>

                      <div className="za-suggest-grid">
                        {suggestions.map((q, idx) => (
                          <button
                            key={q.q}
                            className="za-suggest-card"
                            style={{ animationDelay: `${450 + idx * 90}ms` }}
                            onClick={() => sendMessage(q.q)}
                            title={q.q}
                          >
                            <span className="za-suggest-tag">{q.tag}</span>
                            <span className="za-suggest-q">{q.q}</span>
                            <span className="za-suggest-arrow">
                              <ArrowRight size={14} />
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="za-thread">
                    {messages.map((msg, i) => (
                      <MessageBubble key={msg.id || i} message={msg} streaming={loading && i === messages.length - 1 && msg.role === 'assistant'} />
                    ))}
                    {loading && (messages[messages.length - 1]?.role === 'user') && <TypingIndicator running={!!runningMode} />}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Composer */}
              <div className={`za-composer-wrap ${messages.length === 0 ? 'is-empty' : ''}`}>
                {isAtLimit ? (
                  <div className="za-limit za-fade-in">
                    <div>
                      <strong>Monthly message limit reached</strong>
                      <span>You have used all {usage.limit} messages on your current plan.</span>
                    </div>
                    <TextRollButton text="Upgrade plan" onClick={() => navigate('/pricing')} />
                  </div>
                ) : (
                  <div className={`za-composer ${loading ? 'is-loading' : ''} ${isListening ? 'is-listening' : ''}`}>
                    <div className="za-composer-top">
                      <span>
                        {usage.used}/{usage.limit} messages
                      </span>
                      <span className="za-powered">
                        <Sparkles size={12} /> Powered by AI Agent
                      </span>
                    </div>

                    {attachedFile && (
                      <div className="za-attach-chip">
                        <Link2 size={13} /> {attachedFile.name}
                        <button onClick={() => setAttachedFile(null)} aria-label="Remove attachment">
                          ×
                        </button>
                      </div>
                    )}
                    {uploadingFile && <div className="za-uploading">Uploading attachment...</div>}

                    <div className="za-input-row">
                      <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isListening ? 'Listening... speak now' : 'Ask anything: ad strategy, hooks, budget split, target audience...'}
                        rows={1}
                        onInput={(e) => {
                          const el = e.currentTarget;
                          el.style.height = 'auto';
                          el.style.height = Math.min(el.scrollHeight, 160) + 'px';
                        }}
                        disabled={loading}
                      />
                      {loading ? (
                        <button type="button" className="za-send is-stop" onClick={stopGeneration} title="Stop generating">
                          <Square size={13} fill="currentColor" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="za-send"
                          onClick={() => sendMessage()}
                          disabled={!input.trim() && !attachedFile}
                          aria-label="Send message"
                        >
                          <UilArrowUp size={20} />
                        </button>
                      )}
                    </div>

                    <div className="za-composer-bottom">
                      <div className="za-chips">
                        <button
                          type="button"
                          className="za-chip"
                          onClick={() => document.getElementById('agentFileUpload')?.click()}
                          disabled={uploadingFile || loading}
                        >
                          <Link2 size={13} /> Attach
                        </button>
                        <button type="button" className={`za-chip ${isListening ? 'is-rec' : ''}`} onClick={toggleListening}>
                          {isListening ? <MicOff size={13} /> : <Mic size={13} />} {isListening ? 'Stop' : 'Voice'}
                        </button>
                        <button type="button" className="za-chip" onClick={() => setActiveTab('modes')}>
                          <Zap size={13} /> Modes
                        </button>
                      </div>
                      <span className="za-char za-mono">{input.length.toLocaleString()}/3,000</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Mode Feature Gate Modal */}
      <FeatureGateModal
        isOpen={modeGateModal.open}
        onClose={() => setModeGateModal((m) => ({ ...m, open: false }))}
        featureName={modeGateModal.modeName}
        featureDescription={`${modeGateModal.modeName} is available on Pro and above. Unlock every AI analysis mode with Pro.`}
        requiredPlan={modeGateModal.requiredPlan}
        featureType="mode"
      />
      <input type="file" id="agentFileUpload" style={{ display: 'none' }} onChange={handleFileUpload} />
    </>
  );
}

// ─── Animated agent avatar ────────────────────────────────────────────────────
function AgentOrb({ size = 32, active = false }: { size?: number; active?: boolean }) {
  return (
    <span className={`za-orb ${active ? 'is-active' : ''}`} style={{ width: size, height: size }}>
      <span className="za-orb-core">
        <Bot size={Math.round(size * 0.45)} />
      </span>
    </span>
  );
}

// ─── Word-by-word reveal heading (same motion as the landing page) ────────────
function WordReveal({ text, className = '' }: { text: string; className?: string }) {
  const words = text.split(' ');
  return (
    <h2 className={`za-reveal-h ${className}`} aria-label={text}>
      {words.map((w, i) => (
        <React.Fragment key={i}>
          <span className="za-word" aria-hidden="true">
            <span className="za-word-inner" style={{ animationDelay: `${i * 40}ms` }}>
              {w}
            </span>
          </span>
          {i < words.length - 1 ? ' ' : null}
        </React.Fragment>
      ))}
    </h2>
  );
}

// ─── Use-case card ────────────────────────────────────────────────────────────
function UseCaseCard({ useCase, isRunning, isDisabled, onRun, index }: {
  useCase: typeof USE_CASES[number];
  isRunning: boolean;
  isDisabled: boolean;
  onRun: () => void;
  index: number;
}) {
  return (
    <div className={`za-mode-card ${isRunning ? 'is-running' : ''}`} style={{ animationDelay: `${300 + index * 60}ms` }}>
      <div className="za-mode-top">
        <span className="za-mode-icon">{useCase.icon}</span>
        <span className="za-mode-num za-mono">{String(index + 1).padStart(2, '0')}</span>
      </div>
      <div className="za-mode-label">{useCase.label}</div>
      <div className="za-mode-meta">{useCase.shortDesc}</div>
      <p className="za-mode-desc">{useCase.prompt.slice(0, 110)}...</p>
      <button className="za-mode-run" onClick={onRun} disabled={isDisabled}>
        {isRunning ? (
          <>
            <SpinnerDots /> Running analysis
          </>
        ) : (
          <>
            <span className="za-roll">
              <span>Run analysis</span>
              <span aria-hidden="true">Run analysis</span>
            </span>
            <span className="za-mode-run-arrow">
              <ArrowRight size={13} />
            </span>
          </>
        )}
      </button>
    </div>
  );
}

// Helper to strip emojis/emoticons from chatbot responses
const stripEmojis = (text: string) => {
  return text.replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/gu, '');
};

function MessageBubble({ message, streaming = false }: { message: Message; streaming?: boolean }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isAnalysisResult = !isUser && message.isAnalysis;

  const copy = () => {
    navigator.clipboard?.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  };

  if (isUser && message.isAnalysis) {
    const uc = USE_CASES.find((u) => u.id === message.analysisMode);
    return (
      <div className="za-msg za-msg-mode">
        <span className="za-mode-chip">
          <span className="za-mode-chip-icon">{uc?.icon || <Zap size={14} />}</span>
          {stripEmojis(message.content)}
        </span>
      </div>
    );
  }

  return (
    <div className={`za-msg ${isUser ? 'za-msg-user' : 'za-msg-agent'} ${isAnalysisResult ? 'is-wide' : ''} ${streaming ? 'is-streaming' : ''}`}>
      {!isUser && <AgentOrb size={30} />}
      <div className="za-bubble-wrap">
        <div className="za-bubble">
          <MarkdownContent content={stripEmojis(message.content)} isUser={isUser} />
        </div>
        {!isUser && message.content && !streaming && (
          <button className="za-copy" onClick={copy}>
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>
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
      .replace(/`([^`]+)`/g, '<code>$1</code>');

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
      result.push(<div key={i} className="za-md-h3" dangerouslySetInnerHTML={{ __html: rendered.replace(/^###\s/, '') }} />);
    } else if (line.startsWith('## ')) {
      result.push(<div key={i} className="za-md-h2" dangerouslySetInnerHTML={{ __html: rendered.replace(/^##\s/, '') }} />);
    } else if (line.startsWith('# ')) {
      result.push(<div key={i} className="za-md-h1" dangerouslySetInnerHTML={{ __html: rendered.replace(/^#\s/, '') }} />);
    } else if (line.match(/^(\d+)\.\s/)) {
      const num = line.match(/^(\d+)\./)?.[1];
      result.push(
        <div key={i} className="za-md-li">
          <span className="za-md-num">{num}</span>
          <span dangerouslySetInnerHTML={{ __html: rendered.replace(/^\d+\.\s/, '') }} />
        </div>
      );
    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      result.push(
        <div key={i} className="za-md-li">
          <span className="za-md-dot" />
          <span dangerouslySetInnerHTML={{ __html: rendered.replace(/^[-•]\s/, '') }} />
        </div>
      );
    } else if (line.startsWith('🔴') || line.startsWith('🟡') || line.startsWith('🟢')) {
      const level = line.startsWith('🔴') ? 'red' : line.startsWith('🟡') ? 'amber' : 'green';
      const cleanText = rendered.replace(/^(🔴|🟡|🟢)/u, '').trim();
      result.push(<div key={i} className={`za-md-flag za-flag-${level}`} dangerouslySetInnerHTML={{ __html: cleanText }} />);
    } else if (line.trim() === '') {
      result.push(<div key={i} style={{ height: 8 }} />);
    } else {
      result.push(<div key={i} className="za-md-p" dangerouslySetInnerHTML={{ __html: rendered }} />);
    }
    i++;
  }

  return <>{result}</>;
}

function MarkdownTable({ rows }: { rows: string[]; isUser: boolean }) {
  const parseRow = (row: string) => row.split('|').filter((_, i, a) => i > 0 && i < a.length - 1).map((c) => c.trim());
  const header = parseRow(rows[0]);
  const body = rows.slice(2).map(parseRow);
  const md = (s: string) => s.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  return (
    <div className="za-table-wrap">
      <table className="za-table">
        <thead>
          <tr>
            {header.map((h, i) => (
              <th key={i} dangerouslySetInnerHTML={{ __html: md(h) }} />
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} dangerouslySetInnerHTML={{ __html: md(cell) }} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Typing / loading indicator ───────────────────────────────────────────────
function TypingIndicator({ running = false }: { running?: boolean }) {
  return (
    <div className="za-msg za-msg-agent">
      <AgentOrb size={30} active />
      <div className="za-typing">
        <span className="za-typing-dots">
          <i />
          <i />
          <i />
        </span>
        <span className="za-shimmer">{running ? 'Running deep analysis on your data' : 'Reading your brand context'}</span>
      </div>
    </div>
  );
}

function SpinnerDots() {
  return (
    <span className="za-spinner-dots">
      <i />
      <i />
      <i />
    </span>
  );
}
