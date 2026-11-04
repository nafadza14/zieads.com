import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import ZieAdsLogo, { ZieAdsWordmark } from '../components/ZieAdsLogo';
import SocialIcon from '../components/v3/SocialIcon';
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

const ACCENT_BLUE = '#F26522';

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

  // Step 7: brand setup (spec 7.1). The website scan drafts the profile, the user reviews it.
  const detectedTz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jakarta'; } catch { return 'Asia/Jakarta'; } })();
  const [brand, setBrand] = useState({ name: '', website: '', industry: '', timezone: detectedTz, language: 'English' });
  const [brandDraft, setBrandDraft] = useState<any>(null);
  const [scanState, setScanState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const [brandError, setBrandError] = useState('');
  const timezones: string[] = (() => {
    const base = ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura', 'Asia/Singapore', 'Asia/Kuala_Lumpur', 'Asia/Bangkok', 'Asia/Manila', 'Asia/Tokyo', 'Australia/Sydney', 'Europe/London', 'Europe/Berlin', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'UTC'];
    return base.includes(detectedTz) ? base : [detectedTz, ...base];
  })();
  const languages = ['English', 'Bahasa Indonesia', 'English and Bahasa Indonesia', 'Malay', 'Thai', 'Vietnamese', 'Spanish'];

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
  // What each connector really does today (spec 8). Keep these claims honest.
  const platformsActive = [
    { id: "instagram", name: "Instagram", desc: "Publishing, insights, comments, briefings" },
    { id: "facebook", name: "Facebook", desc: "Page publishing, insights, comments, briefings" },
    { id: "tiktok", name: "TikTok", desc: "Upload to your TikTok inbox, profile stats" },
    { id: "linkedin", name: "LinkedIn", desc: "Text posts to your profile" }
  ];

  // Coming soon platforms are listed as text, no logos (CLAUDE.md icon rule)
  const platformsSoon = ["YouTube", "Threads", "Pinterest", "X"];

  // Step 7 highlights list
  const capabilityList = [
    {
      title: "Brief you every morning",
      body: "Wake up to a personalized read on what worked, what is slipping, and what to do today.",
      highlighted: true
    },
    {
      title: "Schedule your posts across every platform",
      body: "Draft once, publish to Instagram, Facebook, TikTok, and LinkedIn with per-platform tweaks. Zie checks every post after it goes out.",
      highlighted: false
    },
    {
      title: "Read your organic and paid performance together",
      body: "Organic insights from your connected accounts, plus ads data you import from Meta, Google, or TikTok exports.",
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

        try {
          const br = await fetch('/api/profile/brand', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
          const existing = br?.data?.identity ? br.data : null;
          if (existing) {
            setBrandDraft(existing);
            setBrand((b) => ({
              ...b,
              name: existing.identity.name || '',
              website: existing.identity.website || '',
              industry: existing.identity.industry || '',
              language: existing.identity.languages?.[0] || b.language,
            }));
          }
        } catch { /* brand step starts empty */ }

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
        // 1. Ensure full profile answers are saved
        const payload = {
          role: answers.role,
          goals: answers.goals,
          current_tools: answers.currentTools,
          account_volume: answers.accountVolume,
          platforms_in_focus: answers.platformsInFocus,
          onboardingStep: 9,
          hasCompletedOnboarding: true
        };

        await fetch('/api/profile', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        // 2. Complete onboarding database flag & save payload
        const res = await fetch('/api/v3/profile/onboarding/complete', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error('Failed to complete onboarding wizard session:', errText);
        }
        localStorage.setItem('zieads_onboarding_completed', 'true');
        sessionStorage.setItem('zieads_onboarding_check_done', 'true');
      }
    } catch (e) {
      console.error('Failed to complete onboarding wizard session', e);
    } finally {
      setSavingStep(false);
      // Connecting is the step that unlocks the first real briefing
      navigate('/connections', { state: { fromOnboarding: true } });
    }
  };

  const authToken = async () => (await supabase.auth.getSession()).data?.session?.access_token;

  const scanWebsite = async () => {
    const url = brand.website.trim();
    if (!url) { setBrandError('Add your website first.'); return; }
    setScanState('busy');
    setBrandError('');
    try {
      const token = await authToken();
      const r = await fetch('/api/profile/brand/autofill', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.data) throw new Error(j.error || 'Could not read that website');
      setBrandDraft(j.data);
      const id = j.data.identity || {};
      setBrand((b) => ({
        ...b,
        name: b.name || id.name || '',
        website: id.website || b.website,
        industry: b.industry || id.industry || '',
        language: id.languages?.[0] && languages.includes(id.languages[0]) ? id.languages[0] : b.language,
      }));
      setScanState('done');
    } catch (e: any) {
      setScanState('error');
      setBrandError(`${e.message}. You can fill the fields in yourself.`);
    }
  };

  const saveBrandAndContinue = async () => {
    if (!brand.name.trim()) { setBrandError('Add your brand name so Zie knows who it works for.'); return; }
    setSavingStep(true);
    setBrandError('');
    try {
      const token = await authToken();
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
      const draft = brandDraft || {};
      const profile = {
        ...draft,
        identity: {
          ...(draft.identity || {}),
          name: brand.name.trim(),
          website: brand.website.trim(),
          industry: brand.industry.trim(),
          languages: [brand.language],
        },
        goals: {
          ...(draft.goals || {}),
          role: answers.role || draft.goals?.role,
          account_volume: answers.accountVolume || draft.goals?.account_volume,
          goals: answers.goals.length ? answers.goals : draft.goals?.goals,
          platforms: answers.platformsInFocus.length ? answers.platformsInFocus : draft.goals?.platforms,
        },
      };
      const [b, st] = await Promise.all([
        fetch('/api/profile/brand', { method: 'POST', headers, body: JSON.stringify({ brand: profile }) }),
        fetch('/api/settings', { method: 'POST', headers, body: JSON.stringify({ timezone: brand.timezone }) }),
      ]);
      if (!b.ok) throw new Error((await b.json().catch(() => ({}))).error || 'Could not save the brand');
      if (!st.ok) console.warn('Time zone not saved', await st.text());
    } catch (e: any) {
      setBrandError(e.message);
      setSavingStep(false);
      return;
    }
    setSavingStep(false);
    await handleNextStep(8);
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
          <span style={{ fontSize: '1rem', display: 'inline-flex' }}><ZieAdsWordmark /></span>
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
            <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 640 ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
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
                    <div style={{ marginBottom: 12 }}><SocialIcon platform={opt.id} size={28} /></div>
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

            {/* Coming Soon Platforms, text only */}
            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#64748B', margin: '0 0 32px' }}>
              Coming soon: {platformsSoon.join(', ')}
            </p>

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

        {/* ════════════════════ STEP 7: BRAND SETUP ════════════════════ */}
        {step === 7 && (
          <div className="fade-in-onboarding ob-brand" style={{ maxWidth: 560, width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 8px' }}>
                Tell Zie about your brand
              </h2>
              <p style={{ fontSize: '0.95rem', color: '#64748B', margin: 0 }}>
                Add your website and Zie drafts the rest. You can edit everything later in Settings.
              </p>
            </div>

            <div className="ob-card">
              <label className="ob-field">
                <span>Website</span>
                <div className="ob-row">
                  <input
                    type="url"
                    inputMode="url"
                    placeholder="yourbrand.com"
                    value={brand.website}
                    onChange={(e) => setBrand({ ...brand, website: e.target.value })}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); scanWebsite(); } }}
                  />
                  <button type="button" className="ob-scan" onClick={scanWebsite} disabled={scanState === 'busy'}>
                    {scanState === 'busy' ? 'Scanning...' : 'Scan website'}
                  </button>
                </div>
                {scanState === 'done' && (
                  <small className="ob-ok"><Check size={12} /> Draft ready. Check the fields below.</small>
                )}
              </label>

              <label className="ob-field">
                <span>Brand name</span>
                <input value={brand.name} onChange={(e) => setBrand({ ...brand, name: e.target.value })} placeholder="Your brand" />
              </label>

              <label className="ob-field">
                <span>Category</span>
                <input value={brand.industry} onChange={(e) => setBrand({ ...brand, industry: e.target.value })} placeholder="Coffee shop, skincare, B2B software" />
              </label>

              <div className="ob-two">
                <label className="ob-field">
                  <span>Time zone</span>
                  <select value={brand.timezone} onChange={(e) => setBrand({ ...brand, timezone: e.target.value })}>
                    {timezones.map((tz) => <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>)}
                  </select>
                  <small>Briefings and scheduled posts use this time zone.</small>
                </label>
                <label className="ob-field">
                  <span>Content language</span>
                  <select value={brand.language} onChange={(e) => setBrand({ ...brand, language: e.target.value })}>
                    {languages.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </label>
              </div>

              {brandDraft?.offer?.summary && (
                <div className="ob-draft">
                  <strong>What Zie read from your site</strong>
                  <p>{brandDraft.offer.summary}</p>
                  {brandDraft.audience?.description && <p>Audience: {brandDraft.audience.description}</p>}
                </div>
              )}

              {brandError && <p className="ob-err" role="alert">{brandError}</p>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 24 }}>
              <button
                onClick={() => handleNextStep(6)}
                style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 24px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button
                onClick={saveBrandAndContinue}
                disabled={savingStep}
                style={{ background: ACCENT_BLUE, border: 'none', padding: '12px 32px', fontSize: '0.9rem', fontWeight: 600, borderRadius: 10, color: 'white', cursor: 'pointer' }}
              >
                {savingStep ? 'Saving...' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════ STEP 8: CAPABILITIES PREVIEW ════════════════════ */}
        {step === 8 && (
          <div className="fade-in-onboarding" style={{ maxWidth: 960, width: '100%' }}>
            <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr', gap: 48, alignItems: 'center' }}>
              
              {/* Left Column: text description */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT_BLUE }}>Last step: connect</span>
                <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, margin: 0 }}>
                  Here's what your agent<br />
                  will do for you.
                </h1>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {capabilityList.map((item, idx) => (
                    <div 
                      key={idx}
                      style={{
                        padding: '16px 20px',
                        background: item.highlighted ? 'rgba(30, 123, 255, 0.03)' : '#fff',
                        border: item.highlighted ? `1px solid rgba(30, 123, 255, 0.2)` : '1px solid var(--border)',
                        borderRadius: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                        boxShadow: item.highlighted ? '0 4px 12px rgba(30,123,255,0.03)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: '50%', 
                          background: item.highlighted ? ACCENT_BLUE : '#94A3B8' 
                        }} />
                        <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#1A1A1A' }}>
                          {item.title}
                        </h4>
                      </div>
                      <p style={{ margin: 0, paddingLeft: 18, fontSize: '0.85rem', color: '#64748B', lineHeight: 1.5 }}>
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
                    padding: '16px 36px', 
                    fontSize: '16px', 
                    fontWeight: 600, 
                    borderRadius: '12px', 
                    color: 'white', 
                    cursor: 'pointer',
                    alignSelf: 'flex-start',
                    marginTop: 12,
                    boxShadow: '0 4px 14px rgba(30,123,255,0.35)'
                  }}
                >
                  {savingStep ? 'Saving...' : 'Connect your accounts'}
                </button>
              </div>

              {/* Right Column: high-fidelity showcase card */}
              <div style={{ 
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px'
              }}>
                {/* Rainbow Glow background */}
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '-12px',
                  right: '-12px',
                  bottom: '-12px',
                  background: 'linear-gradient(135deg, #F26522 0%, #a78bfa 50%, #EC4899 100%)',
                  filter: 'blur(32px)',
                  opacity: 0.12,
                  zIndex: 0,
                  borderRadius: '30px'
                }} />

                {/* Browser Card Showcase */}
                <div style={{ 
                  position: 'relative',
                  background: '#fff',
                  border: '1px solid var(--border)',
                  borderRadius: 20,
                  width: '100%',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.06)',
                  overflow: 'hidden',
                  zIndex: 1
                }}>
                  {/* Browser Chrome Header */}
                  <div style={{ background: '#FAF8F5', borderBottom: '1px solid var(--border)', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }}></span>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }}></span>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }}></span>
                    <span style={{ marginLeft: 12, fontSize: '10px', color: '#64748B', fontFamily: 'monospace', fontWeight: 500 }}>app.zieads.com</span>
                  </div>

                  {/* Image Body */}
                  <div style={{ background: '#FAF8F5', padding: 0 }}>
                    <img 
                      src="/zieads-dashboard.png" 
                      alt="ZieAds Morning Briefing Dashboard Preview" 
                      style={{ 
                        width: '100%', 
                        height: 'auto', 
                        display: 'block',
                        borderBottomLeftRadius: 'inherit',
                        borderBottomRightRadius: 'inherit'
                      }} 
                    />
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
        .ob-card { background: #fff; border: 1px solid var(--border); border-radius: 14px; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
        .ob-field { display: flex; flex-direction: column; gap: 6px; font-size: 0.85rem; }
        .ob-field > span { font-weight: 600; color: #1A1A1A; }
        .ob-field small { color: #64748B; font-size: 0.75rem; }
        .ob-field input, .ob-field select { border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; font: inherit; font-size: 0.9rem; background: #fff; color: #1A1A1A; min-width: 0; width: 100%; box-sizing: border-box; }
        .ob-field input:focus, .ob-field select:focus { outline: 2px solid rgba(242,101,34,0.35); outline-offset: 0; border-color: #F26522; }
        .ob-row { display: flex; gap: 8px; }
        .ob-scan { flex-shrink: 0; border: 1px solid var(--border); background: #FAF8F5; border-radius: 8px; padding: 0 14px; font: inherit; font-size: 0.85rem; font-weight: 600; cursor: pointer; color: #1A1A1A; }
        .ob-scan:disabled { opacity: 0.6; cursor: progress; }
        .ob-ok { display: inline-flex; align-items: center; gap: 4px; }
        .ob-two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 560px) { .ob-two { grid-template-columns: 1fr; } }
        .ob-draft { background: #FAF8F5; border-radius: 10px; padding: 12px 14px; font-size: 0.82rem; color: #475569; }
        .ob-draft strong { display: block; color: #1A1A1A; margin-bottom: 4px; }
        .ob-draft p { margin: 4px 0 0; line-height: 1.45; }
        .ob-err { margin: 0; color: #B42318; font-size: 0.82rem; }
        .fade-in-onboarding {
          animation: fadeInOnboarding 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
