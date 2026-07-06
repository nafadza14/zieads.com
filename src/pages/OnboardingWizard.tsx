import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import ZieAdsLogo from '../components/ZieAdsLogo';
import { 
  ArrowRight, 
  ArrowLeft, 
  User, 
  Briefcase, 
  Building, 
  UserCheck, 
  Users, 
  Video, 
  Circle, 
  Edit3, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  CheckCircle, 
  BarChart2, 
  Layout, 
  Calendar, 
  MessageCircle, 
  FileText, 
  Check,
  Shield,
  Clock
} from 'lucide-react';

const ACCENT_BLUE = '#1E7BFF';

// Brand accurate SVG icons for Step 6 Platform focus
const BrandIcons: Record<string, React.ReactNode> = {
  instagram: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="url(#ig-grad)" />
      <rect x="5" y="5" width="14" height="14" rx="4" stroke="white" strokeWidth="2" />
      <circle cx="12" cy="12" r="3" stroke="white" strokeWidth="2" />
      <circle cx="16.5" cy="7.5" r="1" fill="white" />
      <defs>
        <linearGradient id="ig-grad" x1="0" y1="24" x2="24" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FED976" />
          <stop offset="0.25" stopColor="#FEB24C" />
          <stop offset="0.5" stopColor="#FD8D3C" />
          <stop offset="0.75" stopColor="#FC4E2A" />
          <stop offset="1" stopColor="#C90076" />
        </linearGradient>
      </defs>
    </svg>
  ),
  tiktok: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="black" />
      <path d="M16 8.5C14.5 8.5 13.5 7.5 13.5 6H11V15.5C11 17.43 9.43 19 7.5 19C5.57 19 4 17.43 4 15.5C4 13.57 5.57 12 7.5 12C8 12 8.46 12.11 8.88 12.3V9.8C8.44 9.73 8 9.7 7.5 9.7C4.3 9.7 1.7 12.3 1.7 15.5C1.7 18.7 4.3 21.3 7.5 21.3C10.7 21.3 13.3 18.7 13.3 15.5V11C14.5 12 16 12.5 17.5 12.5V10C16.7 10 16 9.3 16 8.5Z" fill="white" />
    </svg>
  ),
  linkedin: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="#0A66C2" />
      <path d="M19 19H16V14.5C16 13.2 15.5 12.5 14.5 12.5C13.7 12.5 13.2 13 13.2 13.7V19H10.2V10H13.2V11.2C13.6 10.6 14.5 10 15.8 10C17.8 10 19 11.3 19 14V19ZM6.7 8.5C5.7 8.5 5 7.8 5 6.8C5 5.8 5.7 5 6.7 5C7.7 5 8.5 5.8 8.5 6.8C8.5 7.8 7.7 8.5 6.7 8.5ZM5.2 19V10H8.2V19H5.2Z" fill="white" />
    </svg>
  ),
  facebook: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="#1877F2" />
      <path d="M17.5 12.5H15V19H12V12.5H10V9.8H12V8.2C12 6.2 13.2 5 15.2 5C16.1 5 17 5.1 17.5 5.2V7.5H16.2C15.2 7.5 15 8 15 8.8V9.8H17.5L17.5 12.5Z" fill="white" />
    </svg>
  ),
  twitter: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="#000000" />
      <path d="M18.2 5H19.8L16.2 9.1L20.5 19H17.2L14.7 15.6L11.7 19H10.1L14 14.4L9.8 5H13.2L15.4 8.3L18.2 5ZM17.6 17.9H18.5L12.7 6H11.7L17.6 17.9Z" fill="white" />
    </svg>
  ),
  youtube: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="#FF0000" />
      <path d="M19.7 8.4C19.9 9.3 20 10.6 20 12C20 13.4 19.9 14.7 19.7 15.6C19.5 16.5 19 17 18.1 17.2C17.2 17.5 14.8 17.5 12 17.5C9.2 17.5 6.8 17.5 5.9 17.2C5 17 4.5 16.5 4.3 15.6C4.1 14.7 4 13.4 4 12C4 10.6 4.1 9.3 4.3 8.4C4.5 7.5 5 7 5.9 6.8C6.8 6.5 9.2 6.5 12 6.5C14.8 6.5 17.2 6.5 18.1 6.8C19 7 19.5 7.5 19.7 8.4ZM10.5 14.5L15 12L10.5 9.5V14.5Z" fill="white" />
    </svg>
  ),
  threads: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="#000000" />
      <path d="M16.5 11C16.5 8.5 14.5 6.5 12 6.5C9.5 6.5 7.5 8.5 7.5 11C7.5 13.5 9.5 15.5 12 15.5C13.2 15.5 14.3 15 15 14.2L16.2 15.2C15.2 16.5 13.7 17.3 12 17.3C8.5 17.3 5.7 14.5 5.7 11C5.7 7.5 8.5 4.7 12 4.7C15.5 4.7 18.3 7.5 18.3 11C18.3 13.5 17.5 15.3 16 16.5C14.7 17.5 13.2 17.8 12 17.8C9.5 17.8 7.5 16.8 6.7 15L8 14.2C8.5 15.5 10 16 12 16C13 16 14.2 15.7 15 14.8C16 13.8 16.5 12.5 16.5 11ZM12 8.3C13.5 8.3 14.7 9.5 14.7 11C14.7 12.5 13.5 13.7 12 13.7C10.5 13.7 9.3 12.5 9.3 11C9.3 9.5 10.5 8.3 12 8.3Z" fill="white" />
    </svg>
  ),
  pinterest: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="#BD081C" />
      <path d="M12 4.7C8 4.7 4.7 8 4.7 12C4.7 15.1 6.6 17.7 9.4 18.7C9.3 18.1 9.3 17.3 9.5 16.6C9.6 15.9 10.6 11.9 10.6 11.9C10.6 11.9 10.3 11.3 10.3 10.3C10.3 8.8 11.2 7.7 12.3 7.7C13.3 7.7 13.8 8.4 13.8 9.3C13.8 10.3 13.2 11.8 12.8 13.3C12.5 14.5 13.4 15.5 14.6 15.5C16.8 15.5 18.5 13.2 18.5 9.9C18.5 7 16.4 5 12.5 5C8 5 4.7 8.3 4.7 12.7C4.7 14.1 5.2 15.6 6 16.5C6.1 16.6 6.1 16.8 6.1 16.9C6 17.3 5.8 18.1 5.8 18.2C5.7 18.4 5.5 18.5 5.3 18.4C4.1 17.9 3.3 16.1 3.3 14.7C3.3 9.7 6.9 5.2 12.8 5.2C17.5 5.2 21.1 8.5 21.1 12.9C21.1 17.6 18.2 21.4 14.1 21.4C12.7 21.4 11.4 20.7 10.9 19.8C10.9 19.8 10.1 23 9.9 23.8C9.5 25.1 8.7 26.8 8.1 27.8C9.3 28.1 10.6 28.3 12 28.3C16.4 28.3 19.7 25 19.7 20.6C19.7 16.2 16.4 12.9 12 12.9" fill="white" />
    </svg>
  )
};

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState<number>(0); // will be initialized dynamically
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [savingStep, setSavingStep] = useState(false);

  // Flow State
  const [answers, setAnswers] = useState({
    role: null as string | null,
    goals: [] as string[],
    currentTools: [] as string[],
    accountVolume: null as string | null,
    platformsInFocus: [] as string[],
  });

  // Step 2 configurations
  const roleOptions = [
    { label: "Solo founder", icon: <User size={18} color={ACCENT_BLUE} /> },
    { label: "Small business owner", icon: <Briefcase size={18} color={ACCENT_BLUE} /> },
    { label: "In-house marketer", icon: <Building size={18} color={ACCENT_BLUE} /> },
    { label: "Freelance marketer or consultant", icon: <UserCheck size={18} color={ACCENT_BLUE} /> },
    { label: "Marketing agency", icon: <Users size={18} color={ACCENT_BLUE} /> },
    { label: "Content creator", icon: <Video size={18} color={ACCENT_BLUE} /> },
    { label: "Other", icon: <Circle size={18} color={ACCENT_BLUE} /> }
  ];

  // Step 3 configurations
  const goalOptions = [
    { id: "post", label: "What to post today", sublabel: "Get daily content direction", icon: <Edit3 size={18} color={ACCENT_BLUE} /> },
    { id: "performance", label: "Which of my ads are working", sublabel: "Read paid performance", icon: <TrendingUp size={18} color={ACCENT_BLUE} /> },
    { id: "anomalies", label: "Why my numbers dropped", sublabel: "Diagnose slumps", icon: <TrendingDown size={18} color={ACCENT_BLUE} /> },
    { id: "competitors", label: "What competitors are doing", sublabel: "Track your market", icon: <Target size={18} color={ACCENT_BLUE} /> },
    { id: "readiness", label: "Whether my setup is ready", sublabel: "Audit before you spend", icon: <CheckCircle size={18} color={ACCENT_BLUE} /> },
    { id: "scaling", label: "How to scale what works", sublabel: "Grow the winners", icon: <BarChart2 size={18} color={ACCENT_BLUE} /> }
  ];

  // Step 4 configurations
  const toolOptions = [
    { label: "Nothing yet", sublabel: "Just getting started", icon: <Circle size={18} color={ACCENT_BLUE} /> },
    { label: "Native platform tools", sublabel: "Meta Business Suite, TikTok Studio, etc.", icon: <Layout size={18} color={ACCENT_BLUE} /> },
    { label: "A social media scheduler", sublabel: "Existing publishing tool", icon: <Calendar size={18} color={ACCENT_BLUE} /> },
    { label: "A general AI assistant", sublabel: "ChatGPT, Claude, etc.", icon: <MessageCircle size={18} color={ACCENT_BLUE} /> },
    { label: "A hired analyst or agency", sublabel: "Outsourced marketing", icon: <UserCheck size={18} color={ACCENT_BLUE} /> },
    { label: "Spreadsheets and notes", sublabel: "Manual tracking", icon: <FileText size={18} color={ACCENT_BLUE} /> },
    { label: "Other", sublabel: null, icon: <Circle size={18} color={ACCENT_BLUE} /> }
  ];

  // Step 5 configurations
  const volumeOptions = ["1-3", "4-6", "7-10", "11-20", "21-50", "50+"];

  // Step 6 configurations
  const platformsActive = [
    { id: "instagram", name: "Instagram", desc: "Full support: publishing, analytics, briefings" },
    { id: "tiktok", name: "TikTok", desc: "Full support: publishing, analytics, briefings" },
    { id: "linkedin", name: "LinkedIn", desc: "Full support: publishing, analytics, briefings" }
  ];

  const platformsSoon = [
    { id: "facebook", name: "Facebook" },
    { id: "twitter", name: "X (Twitter)" },
    { id: "youtube", name: "YouTube" },
    { id: "threads", name: "Threads" },
    { id: "pinterest", name: "Pinterest" }
  ];

  // Step 7 highlights list
  const capabilityList = [
    {
      title: "Brief you every morning",
      body: "Wake up to a personalized read on what worked, what is slipping, and what to do today.",
      highlighted: true
    },
    {
      title: "Schedule your posts across every platform",
      body: "Draft once, publish to Instagram, TikTok, and LinkedIn with per-platform tweaks. Nothing goes live without your approval.",
      highlighted: false
    },
    {
      title: "Read your organic and paid performance together",
      body: "One view. Both sides of your marketing. The agent tells you what the numbers mean.",
      highlighted: false
    },
    {
      title: "Watch competitors and reply to comments in one place",
      body: "The agent tracks the accounts you care about and unifies every comment across your connected platforms.",
      highlighted: false
    }
  ];

  // Load profile state initially
  useEffect(() => {
    const fetchState = async () => {
      try {
        const sessionRes = await supabase.auth.getSession();
        const token = sessionRes.data?.session?.access_token;
        if (!token) {
          setLoading(false);
          return;
        }

        const [onboardingRes, profileRes] = await Promise.all([
          fetch('/api/v3/profile/onboarding', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/profile', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        const onboardingJ = await onboardingRes.json();
        const profileJ = await profileRes.json();

        if (onboardingJ.success) {
          if (onboardingJ.hasCompletedOnboarding) {
            navigate('/analyst');
            return;
          }
          // Default starting step: if database says step 1, load step 1
          setStep(onboardingJ.onboardingStep || 1);
        } else {
          setStep(1);
        }

        if (profileJ.success && profileJ.data) {
          const prof = profileJ.data;
          setAnswers({
            role: prof.role || null,
            goals: prof.goals || [],
            currentTools: prof.current_tools || [],
            accountVolume: prof.account_volume || null,
            platformsInFocus: prof.platforms_in_focus || [],
          });
        }

        // Fetch User profile metadata for Greeting Name
        const userRes = await supabase.auth.getUser();
        const meta = userRes.data?.user?.user_metadata;
        const nameVal = meta?.first_name || meta?.name || userRes.data?.user?.email?.split('@')[0] || '';
        setUserName(nameVal);

      } catch (err) {
        console.error('Failed to initialize onboarding flow preferences', err);
        setStep(1);
      } finally {
        setLoading(false);
      }
    };
    fetchState();
  }, [navigate]);

  // Transition & save logic
  const handleNextStep = async (next: number, updatedAnswers = answers) => {
    setSavingStep(true);
    try {
      const sessionRes = await supabase.auth.getSession();
      const token = sessionRes.data?.session?.access_token;
      if (token) {
        // Prepare payload mapping answers to database column names
        const payload = {
          role: updatedAnswers.role,
          goals: updatedAnswers.goals,
          current_tools: updatedAnswers.currentTools,
          account_volume: updatedAnswers.accountVolume,
          platforms_in_focus: updatedAnswers.platformsInFocus,
          onboardingStep: next
        };

        const res = await fetch('/api/profile', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error('Failed to sync progress to profiles DB:', errText);
          alert('Database Save Error: ' + errText);
          setSavingStep(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Could not sync progress step to profiles DB', e);
      alert('Network Error saving profile: ' + e);
      setSavingStep(false);
      return;
    }
    setSavingStep(false);
    setStep(next);
  };

  const handleCompleteFlow = async () => {
    setSavingStep(true);
    try {
      const sessionRes = await supabase.auth.getSession();
      const token = sessionRes.data?.session?.access_token;
      if (token) {
        // Complete onboarding database flag
        const res = await fetch('/api/v3/profile/onboarding/complete', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          const errText = await res.text();
          console.error('Failed to complete onboarding wizard session:', errText);
          alert('Database Onboarding Complete Error: ' + errText);
          setSavingStep(false);
          return;
        }
        localStorage.setItem('zieads_onboarding_completed', 'true');
        sessionStorage.setItem('zieads_onboarding_check_done', 'true');
      }
    } catch (e) {
      console.error('Failed to complete onboarding wizard session', e);
      alert('Network Error completing onboarding: ' + e);
      setSavingStep(false);
      return;
    }
    setSavingStep(false);
    navigate('/analyst');
  };

  const toggleMultiSelect = (key: 'goals' | 'currentTools' | 'platformsInFocus', value: string) => {
    const current = [...answers[key]];
    const updated = current.includes(value)
      ? current.filter(x => x !== value)
      : [...current, value];

    setAnswers(prev => ({ ...prev, [key]: updated }));
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF8F5', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ color: '#1A1A1A', fontWeight: 600 }}>Loading setup context...</div>
      </div>
    );
  }

  // Visual helper elements
  const renderProgressDots = (current: number) => {
    // Steps 2-6 mapping: dots from index 0 to 4 (step 2 maps to dot 1, step 6 to dot 5)
    return (
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, margin: '24px 0 16px' }} aria-label={`Step ${current - 1} of 5`}>
        {[2, 3, 4, 5, 6].map((sVal) => (
          <span 
            key={sVal} 
            style={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              background: sVal === current ? ACCENT_BLUE : (sVal < current ? 'rgba(30,123,255,0.35)' : 'rgba(0,0,0,0.08)'),
              transition: 'background 0.3s ease'
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#FAF8F5', 
      fontFamily: "'DM Sans', sans-serif",
      color: '#1A1A1A',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      {/* Dashed outer layouts (blueprint lines) */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: '6%', width: 1, borderLeft: '1px dashed rgba(0,0,0,0.06)', zIndex: 1, pointerEvents: 'none' }}></div>
      <div style={{ position: 'absolute', top: 0, bottom: 0, right: '6%', width: 1, borderRight: '1px dashed rgba(0,0,0,0.06)', zIndex: 1, pointerEvents: 'none' }}></div>

      {/* Top logo */}
      <header style={{ padding: '24px 8%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <ZieAdsLogo size={32} />
          <span style={{ fontSize: '1rem', fontWeight: 600, letterSpacing: '-0.02em' }}>zieads</span>
        </div>
      </header>

      {/* Page transitions wrap */}
      <main style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '24px 8% 80px',
        zIndex: 10
      }}>
        
        {/* Progress dots at top center for Steps 2 to 6 */}
        {step >= 2 && step <= 6 && renderProgressDots(step)}

        {/* ════════════════════ STEP 1: WELCOME ════════════════════ */}
        {step === 1 && (
          <div className="fade-in-onboarding" style={{ maxWidth: 540, width: '100%', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT_BLUE }}>Introduce your analyst</span>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, marginTop: 12, marginBottom: 16 }}>
              Hey there {userName || ''}.<br />
              <span style={{ 
                background: 'rgba(30, 123, 255, 0.08)', 
                color: ACCENT_BLUE, 
                padding: '4px 10px', 
                borderRadius: 8,
                display: 'inline-block',
                marginTop: 8
              }}>
                Meet your AI Marketing Agent.
              </span>
            </h1>
            <p style={{ fontSize: '1.05rem', color: '#64748B', lineHeight: 1.5, marginBottom: 32 }}>
              It watches your accounts, reads your data, and tells you what to do next. Every morning. Let's get it set up for you.
            </p>
            <button 
              onClick={() => handleNextStep(2)}
              disabled={savingStep}
              style={{ 
                background: ACCENT_BLUE,
                border: 'none', 
                padding: '14px 32px', 
                fontSize: '15px', 
                fontWeight: 600, 
                borderRadius: '12px', 
                color: 'white', 
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(30,123,255,0.3)'
              }}
            >
              {savingStep ? 'Saving...' : 'Let\'s start'} <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ════════════════════ STEP 2: ROLE SEGMENTATION ════════════════════ */}
        {step === 2 && (
          <div className="fade-in-onboarding" style={{ maxWidth: 640, width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
                How would you describe yourself?
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 640 ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 32 }}>
              {roleOptions.map((opt) => {
                const isSelected = answers.role === opt.label;
                return (
                  <div 
                    key={opt.label}
                    onClick={() => setAnswers(prev => ({ ...prev, role: opt.label }))}
                    style={{
                      background: '#fff',
                      border: isSelected ? `2px solid ${ACCENT_BLUE}` : '1px solid var(--border)',
                      borderRadius: 12,
                      padding: 16,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      position: 'relative',
                      boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <div style={{ 
                      width: 36, 
                      height: 36, 
                      borderRadius: 8, 
                      background: 'rgba(30, 123, 255, 0.08)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}>
                      {opt.icon}
                    </div>
                    <span style={{ fontSize: '0.92rem', fontWeight: 600 }}>{opt.label}</span>
                    {isSelected && (
                      <span style={{ 
                        position: 'absolute', 
                        top: 10, 
                        right: 10, 
                        width: 16, 
                        height: 16, 
                        borderRadius: '50%', 
                        background: ACCENT_BLUE, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: 'white'
                      }}>
                        <Check size={10} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Step Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', gap: 16, width: '100%', justifyContent: 'center' }}>
                <button 
                  onClick={() => setStep(1)} 
                  style={{ 
                    background: 'transparent', 
                    border: '1px solid var(--border)', 
                    borderRadius: 10, 
                    padding: '12px 24px', 
                    fontSize: '0.9rem', 
                    fontWeight: 600, 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button 
                  onClick={() => handleNextStep(3)}
                  disabled={!answers.role || savingStep}
                  style={{ 
                    background: ACCENT_BLUE,
                    border: 'none', 
                    padding: '12px 32px', 
                    fontSize: '0.9rem', 
                    fontWeight: 600, 
                    borderRadius: 10, 
                    color: 'white', 
                    cursor: !answers.role ? 'not-allowed' : 'pointer',
                    opacity: !answers.role ? 0.5 : 1
                  }}
                >
                  {savingStep ? 'Saving...' : 'Continue'}
                </button>
              </div>
              <button 
                onClick={() => {
                  setAnswers(prev => ({ ...prev, role: null }));
                  handleNextStep(3, { ...answers, role: null });
                }}
                style={{ background: 'none', border: 'none', color: '#1A1A1A', fontSize: '0.85rem', cursor: 'pointer', outline: 'none' }}
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════ STEP 3: GOALS ════════════════════ */}
        {step === 3 && (
          <div className="fade-in-onboarding" style={{ maxWidth: 680, width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 8px' }}>
                What are you here to figure out?
              </h2>
              <p style={{ fontSize: '0.95rem', color: '#64748B', margin: 0 }}>
                Pick as many as apply. The agent will lead with these in your first briefing.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 640 ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 32 }}>
              {goalOptions.map((opt) => {
                const isSelected = answers.goals.includes(opt.label);
                return (
                  <div 
                    key={opt.label}
                    onClick={() => toggleMultiSelect('goals', opt.label)}
                    style={{
                      background: '#fff',
                      border: isSelected ? `2px solid ${ACCENT_BLUE}` : '1px solid var(--border)',
                      borderRadius: 12,
                      padding: 16,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 16,
                      position: 'relative',
                      boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <div style={{ 
                      width: 36, 
                      height: 36, 
                      borderRadius: 8, 
                      background: 'rgba(30, 123, 255, 0.08)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {opt.icon}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#1A1A1A' }}>{opt.label}</span>
                      <span style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 2 }}>{opt.sublabel}</span>
                    </div>
                    {isSelected && (
                      <span style={{ 
                        position: 'absolute', 
                        top: 12, 
                        right: 12, 
                        width: 16, 
                        height: 16, 
                        borderRadius: '4px', 
                        background: ACCENT_BLUE, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: 'white'
                      }}>
                        <Check size={10} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Step Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', gap: 16, width: '100%', justifySelf: 'center', justifyContent: 'center' }}>
                <button 
                  onClick={() => handleNextStep(2)} 
                  style={{ 
                    background: 'transparent', 
                    border: '1px solid var(--border)', 
                    borderRadius: 10, 
                    padding: '12px 24px', 
                    fontSize: '0.9rem', 
                    fontWeight: 600, 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button 
                  onClick={() => handleNextStep(4)}
                  disabled={savingStep}
                  style={{ 
                    background: ACCENT_BLUE,
                    border: 'none', 
                    padding: '12px 32px', 
                    fontSize: '0.9rem', 
                    fontWeight: 600, 
                    borderRadius: 10, 
                    color: 'white', 
                    cursor: 'pointer'
                  }}
                >
                  {savingStep ? 'Saving...' : 'Continue'}
                </button>
              </div>
              <button 
                onClick={() => {
                  setAnswers(prev => ({ ...prev, goals: [] }));
                  handleNextStep(4, { ...answers, goals: [] });
                }}
                style={{ background: 'none', border: 'none', color: '#1A1A1A', fontSize: '0.85rem', cursor: 'pointer', outline: 'none' }}
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════ STEP 4: CURRENT TOOLS ════════════════════ */}
        {step === 4 && (
          <div className="fade-in-onboarding" style={{ maxWidth: 680, width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 8px' }}>
                What are you using today?
              </h2>
              <p style={{ fontSize: '0.95rem', color: '#64748B', margin: 0 }}>
                Helps us understand what the agent is replacing.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 640 ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 32 }}>
              {toolOptions.map((opt) => {
                const isSelected = answers.currentTools.includes(opt.label);
                return (
                  <div 
                    key={opt.label}
                    onClick={() => toggleMultiSelect('currentTools', opt.label)}
                    style={{
                      background: '#fff',
                      border: isSelected ? `2px solid ${ACCENT_BLUE}` : '1px solid var(--border)',
                      borderRadius: 12,
                      padding: 16,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 16,
                      position: 'relative',
                      boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <div style={{ 
                      width: 36, 
                      height: 36, 
                      borderRadius: 8, 
                      background: 'rgba(30, 123, 255, 0.08)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {opt.icon}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#1A1A1A' }}>{opt.label}</span>
                      {opt.sublabel && <span style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 2 }}>{opt.sublabel}</span>}
                    </div>
                    {isSelected && (
                      <span style={{ 
                        position: 'absolute', 
                        top: 12, 
                        right: 12, 
                        width: 16, 
                        height: 16, 
                        borderRadius: '4px', 
                        background: ACCENT_BLUE, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: 'white'
                      }}>
                        <Check size={10} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Step Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', gap: 16, width: '100%', justifySelf: 'center', justifyContent: 'center' }}>
                <button 
                  onClick={() => handleNextStep(3)} 
                  style={{ 
                    background: 'transparent', 
                    border: '1px solid var(--border)', 
                    borderRadius: 10, 
                    padding: '12px 24px', 
                    fontSize: '0.9rem', 
                    fontWeight: 600, 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button 
                  onClick={() => handleNextStep(5)}
                  disabled={savingStep}
                  style={{ 
                    background: ACCENT_BLUE,
                    border: 'none', 
                    padding: '12px 32px', 
                    fontSize: '0.9rem', 
                    fontWeight: 600, 
                    borderRadius: 10, 
                    color: 'white', 
                    cursor: 'pointer'
                  }}
                >
                  {savingStep ? 'Saving...' : 'Continue'}
                </button>
              </div>
              <button 
                onClick={() => {
                  setAnswers(prev => ({ ...prev, currentTools: [] }));
                  handleNextStep(5, { ...answers, currentTools: [] });
                }}
                style={{ background: 'none', border: 'none', color: '#1A1A1A', fontSize: '0.85rem', cursor: 'pointer', outline: 'none' }}
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════ STEP 5: ACCOUNT VOLUME ════════════════════ */}
        {step === 5 && (
          <div className="fade-in-onboarding" style={{ maxWidth: 540, width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 8px' }}>
                How many social accounts do you manage?
              </h2>
              <p style={{ fontSize: '0.95rem', color: '#64748B', margin: 0 }}>
                Rough count is fine. Includes your own brand and any clients.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
              {volumeOptions.map((opt) => {
                const isSelected = answers.accountVolume === opt;
                return (
                  <div 
                    key={opt}
                    onClick={() => setAnswers(prev => ({ ...prev, accountVolume: opt }))}
                    style={{
                      background: '#fff',
                      border: isSelected ? `2px solid ${ACCENT_BLUE}` : '1px solid var(--border)',
                      borderRadius: 12,
                      padding: '24px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{opt}</span>
                    {isSelected && (
                      <span style={{ 
                        position: 'absolute', 
                        top: 10, 
                        right: 10, 
                        width: 16, 
                        height: 16, 
                        borderRadius: '50%', 
                        background: ACCENT_BLUE, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: 'white'
                      }}>
                        <Check size={10} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Step Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', gap: 16, width: '100%', justifySelf: 'center', justifyContent: 'center' }}>
                <button 
                  onClick={() => handleNextStep(4)} 
                  style={{ 
                    background: 'transparent', 
                    border: '1px solid var(--border)', 
                    borderRadius: 10, 
                    padding: '12px 24px', 
                    fontSize: '0.9rem', 
                    fontWeight: 600, 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button 
                  onClick={() => handleNextStep(6)}
                  disabled={!answers.accountVolume || savingStep}
                  style={{ 
                    background: ACCENT_BLUE,
                    border: 'none', 
                    padding: '12px 32px', 
                    fontSize: '0.9rem', 
                    fontWeight: 600, 
                    borderRadius: 10, 
                    color: 'white', 
                    cursor: !answers.accountVolume ? 'not-allowed' : 'pointer',
                    opacity: !answers.accountVolume ? 0.5 : 1
                  }}
                >
                  {savingStep ? 'Saving...' : 'Continue'}
                </button>
              </div>
              <button 
                onClick={() => {
                  setAnswers(prev => ({ ...prev, accountVolume: null }));
                  handleNextStep(6, { ...answers, accountVolume: null });
                }}
                style={{ background: 'none', border: 'none', color: '#1A1A1A', fontSize: '0.85rem', cursor: 'pointer', outline: 'none' }}
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════ STEP 6: PLATFORM FOCUS ════════════════════ */}
        {step === 6 && (
          <div className="fade-in-onboarding" style={{ maxWidth: 760, width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 8px' }}>
                Which platforms are in focus?
              </h2>
              <p style={{ fontSize: '0.95rem', color: '#64748B', margin: 0 }}>
                Pick the ones the agent should watch closely. You can change this later.
              </p>
            </div>

            {/* Currently Supported Platforms */}
            <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 640 ? '1fr' : 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
              {platformsActive.map((opt) => {
                const isSelected = answers.platformsInFocus.includes(opt.id);
                return (
                  <div 
                    key={opt.id}
                    onClick={() => toggleMultiSelect('platformsInFocus', opt.id)}
                    style={{
                      background: '#fff',
                      border: isSelected ? `2px solid ${ACCENT_BLUE}` : '1px solid var(--border)',
                      borderRadius: 12,
                      padding: 20,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      position: 'relative',
                      boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <div style={{ marginBottom: 12 }}>{BrandIcons[opt.id]}</div>
                    <strong style={{ fontSize: '0.95rem', display: 'block', marginBottom: 4 }}>{opt.name}</strong>
                    <span style={{ fontSize: '0.73rem', color: '#64748B', lineHeight: 1.3 }}>{opt.desc}</span>
                    {isSelected && (
                      <span style={{ 
                        position: 'absolute', 
                        top: 10, 
                        right: 10, 
                        width: 16, 
                        height: 16, 
                        borderRadius: '4px', 
                        background: ACCENT_BLUE, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: 'white'
                      }}>
                        <Check size={10} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Coming Soon Platforms */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 12, paddingLeft: 4 }}>Coming Soon</div>
              <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 640 ? '1fr 1fr' : 'repeat(5, 1fr)', gap: 12 }}>
                {platformsSoon.map((opt) => (
                  <div 
                    key={opt.id}
                    style={{
                      background: '#fff',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      padding: '12px 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      opacity: 0.5,
                      position: 'relative',
                      cursor: 'not-allowed'
                    }}
                  >
                    <span style={{ position: 'absolute', top: 4, right: 4, fontSize: '8px', background: '#E2E8F0', padding: '1px 4px', borderRadius: 4, fontWeight: 700 }}>Soon</span>
                    <div style={{ marginBottom: 6 }}>{BrandIcons[opt.id]}</div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{opt.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', gap: 16, width: '100%', justifySelf: 'center', justifyContent: 'center' }}>
                <button 
                  onClick={() => handleNextStep(5)} 
                  style={{ 
                    background: 'transparent', 
                    border: '1px solid var(--border)', 
                    borderRadius: 10, 
                    padding: '12px 24px', 
                    fontSize: '0.9rem', 
                    fontWeight: 600, 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button 
                  onClick={() => handleNextStep(7)}
                  disabled={savingStep}
                  style={{ 
                    background: ACCENT_BLUE,
                    border: 'none', 
                    padding: '12px 32px', 
                    fontSize: '0.9rem', 
                    fontWeight: 600, 
                    borderRadius: 10, 
                    color: 'white', 
                    cursor: 'pointer'
                  }}
                >
                  {savingStep ? 'Saving...' : 'Continue'}
                </button>
              </div>
              <button 
                onClick={() => {
                  setAnswers(prev => ({ ...prev, platformsInFocus: [] }));
                  handleNextStep(7, { ...answers, platformsInFocus: [] });
                }}
                style={{ background: 'none', border: 'none', color: '#1A1A1A', fontSize: '0.85rem', cursor: 'pointer', outline: 'none' }}
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════ STEP 7: CAPABILITIES PREVIEW ════════════════════ */}
        {step === 7 && (
          <div className="fade-in-onboarding" style={{ maxWidth: 960, width: '100%' }}>
            <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr', gap: 48, alignItems: 'center' }}>
              
              {/* Left Column: text description */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT_BLUE }}>Setup Complete</span>
                <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, margin: 0 }}>
                  Here's what your agent<br />
                  will do for you.
                </h1>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {capabilityList.map((item, idx) => (
                    <div 
                      key={idx}
                      style={{
                        paddingLeft: 16,
                        borderLeft: item.highlighted ? `3px solid ${ACCENT_BLUE}` : '3px solid transparent',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2
                      }}
                    >
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: item.highlighted ? '#1A1A1A' : '#64748B' }}>
                        {item.title}
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B', lineHeight: 1.4 }}>
                        {item.body}
                      </p>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={handleCompleteFlow}
                  disabled={savingStep}
                  style={{ 
                    background: ACCENT_BLUE,
                    border: 'none', 
                    padding: '14px 32px', 
                    fontSize: '15px', 
                    fontWeight: 600, 
                    borderRadius: '12px', 
                    color: 'white', 
                    cursor: 'pointer',
                    alignSelf: 'flex-start',
                    marginTop: 12,
                    boxShadow: '0 4px 14px rgba(30,123,255,0.3)'
                  }}
                >
                  {savingStep ? 'Saving...' : 'Get Started'}
                </button>
              </div>

              {/* Right Column: visual card mockup */}
              <div style={{ 
                background: 'rgba(30, 123, 255, 0.04)', 
                borderRadius: 24, 
                padding: window.innerWidth < 640 ? 16 : 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ 
                  background: '#fff',
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                  width: '100%',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                  overflow: 'hidden'
                }}>
                  {/* Browser Chrome Header */}
                  <div style={{ background: '#FAF8F5', borderBottom: '1px solid var(--border)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }}></span>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }}></span>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }}></span>
                    <span style={{ marginLeft: 12, fontSize: '10px', color: '#64748B', fontFamily: 'monospace' }}>app.zieads.com</span>
                  </div>

                  {/* Browser Mock Content */}
                  <div style={{ padding: 20 }}>
                    {/* Mock header row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                      <div>
                        <div style={{ width: 100, height: 12, background: '#E2E8F0', borderRadius: 4, marginBottom: 4 }}></div>
                        <div style={{ width: 60, height: 8, background: '#F1F5F9', borderRadius: 4 }}></div>
                      </div>
                      <div style={{ width: 80, height: 20, background: 'rgba(30,123,255,0.08)', borderRadius: 100 }}></div>
                    </div>

                    {/* Briefing summary block */}
                    <div style={{ background: 'linear-gradient(135deg, rgba(30,123,255,0.06) 0%, rgba(255,255,255,1) 100%)', border: '1px solid var(--border)', borderRadius: 8, padding: 14, marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '9px', fontWeight: 700, color: ACCENT_BLUE, textTransform: 'uppercase', marginBottom: 6 }}>
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: ACCENT_BLUE }}></span> Morning Briefing Summary
                      </div>
                      <div style={{ width: '90%', height: 10, background: '#1A1A1A', borderRadius: 4, marginBottom: 6 }}></div>
                      <div style={{ width: '40%', height: 10, background: '#1A1A1A', borderRadius: 4 }}></div>
                    </div>

                    {/* Wins & concerns skeletons */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {/* Wins */}
                      <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
                        <div style={{ width: 40, height: 8, background: '#E2E8F0', borderRadius: 3, marginBottom: 6 }}></div>
                        <div style={{ width: 60, height: 16, background: '#10B981', borderRadius: 4, marginBottom: 4 }}></div>
                        <div style={{ width: '80%', height: 6, background: '#F1F5F9', borderRadius: 2 }}></div>
                      </div>
                      {/* Concerns */}
                      <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
                        <div style={{ width: 40, height: 8, background: '#E2E8F0', borderRadius: 3, marginBottom: 6 }}></div>
                        <div style={{ width: 60, height: 16, background: '#F59E0B', borderRadius: 4, marginBottom: 4 }}></div>
                        <div style={{ width: '80%', height: 6, background: '#F1F5F9', borderRadius: 2 }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* Styled inject for transition keyframes */}
      <style>{`
        @keyframes fadeInOnboarding {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.99);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .fade-in-onboarding {
          animation: fadeInOnboarding 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
