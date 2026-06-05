import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ZieAdsLogo from '../components/ZieAdsLogo';
import { supabase } from '../lib/supabaseClient';

const GoogleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const TESTIMONIALS = [
  {
    quote: "ZieAds cut our client onboarding from 3 days to 20 minutes. Every agency needs this.",
    name: "Rafi S.",
    role: "Performance Marketing Lead",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
  },
  {
    quote: "The AI audit caught targeting gaps our team missed for months. ROI improved within the first week.",
    name: "Dewi A.",
    role: "Head of Growth, e-Commerce",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
  },
  {
    quote: "We run ZieAds on every new client before a single rupiah is spent. It changed how we work.",
    name: "Bima P.",
    role: "Founder, Digital Agency",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80",
  },
  {
    quote: "The ad copy output is genuinely better than what my copywriter was producing. Fast and on-brand.",
    name: "Sinta W.",
    role: "Marketing Director",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80",
  },
  {
    quote: "Competitor intelligence alone is worth the subscription. I can see exactly what rivals are running.",
    name: "Aryo K.",
    role: "Media Buyer",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80",
  },
];

const TICKER = [...TESTIMONIALS, ...TESTIMONIALS];

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isSignUp = location.pathname.includes('/sign-up');
  const from = (location.state as any)?.from || '/clients';

  const [email, setEmail]       = useState((location.state as any)?.email || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate(from, { replace: true });
    });
  }, [navigate, from]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccessMsg('Account created. Check your email to confirm, then sign in.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}${from}` },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Could not sign in with Google. Please try again.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="landing-page min-h-screen flex">
      {/* GRID LINES BACKGROUND */}
      <div className="lp-grid-line lp-line-left"></div>
      <div className="lp-grid-line lp-line-right"></div>

      {/* ── Left: Form Panel ── */}
      <div className="flex-1 flex flex-col min-h-screen z-10">
        {/* Logo */}
        <div className="px-12 pt-10">
          <div
            className="flex items-center gap-2.5 cursor-pointer w-fit"
            onClick={() => navigate('/')}
          >
            <div className="lp-auth-logo-bg p-2 rounded-xl">
              <ZieAdsLogo size={20} className="text-gray-900" />
            </div>
            <span className="lp-auth-logo-text text-[18px]">zieads</span>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-12 py-10">
          <div className="w-full max-w-[420px]">

            <h1 className="text-[32px] font-bold text-gray-900 mb-2 tracking-tight leading-tight">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-[16px] text-gray-500 mb-8">
              {isSignUp
                ? 'Start running AI powered ad strategy today.'
                : 'Welcome back! Please enter your details.'}
            </p>

            {error && (
              <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-[14px]">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="mb-5 px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-[14px]">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleEmailSubmit} className="space-y-5">
              <div>
                <label className="block text-[14px] font-semibold mb-2 auth-label">Email</label>
                <input
                  id="email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3.5 auth-input text-[15px] placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-[14px] font-semibold mb-2 auth-label">Password</label>
                <input
                  id="password-input"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full px-4 py-3.5 auth-input text-[15px] placeholder:text-gray-400"
                />
              </div>

              <button
                id="email-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3.5 btn-lp-primary-gradient auth-submit-btn text-white font-semibold text-[15px] active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? 'Processing...' : isSignUp ? 'Sign up' : 'Sign in'}
              </button>
            </form>

            {/* Google */}
            {/* Google */}
            <button
              id="google-signin-btn"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full mt-3 flex items-center justify-center gap-3 py-3.5 btn-lp-google text-[15px] active:scale-[0.98] disabled:opacity-60"
            >
              {googleLoading
                ? <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                : <GoogleIcon />}
              {googleLoading ? 'Redirecting...' : isSignUp ? 'Sign up with Google' : 'Sign in with Google'}
            </button>

            {/* Toggle sign in / sign up */}
            <p className="text-center mt-6 text-[14px] text-gray-500">
              {isSignUp ? (
                <>Already have an account?{' '}
                  <button onClick={() => navigate('/sign-in')} className="auth-toggle-link">Sign in</button>
                </>
              ) : (
                <>Don't have an account?{' '}
                  <button onClick={() => navigate('/sign-up')} className="auth-toggle-link">Sign up</button>
                </>
              )}
            </p>

            {/* Consent text */}
            <p className="text-center mt-4 text-[12px] text-gray-400 leading-relaxed max-w-[360px] mx-auto">
              By clicking on 'Continue with Google' or Email you consent to receive occasional product updates
              and important account alerts. Read our{' '}
              <button
                onClick={() => navigate('/privacy-policy')}
                className="auth-toggle-link text-[12px] font-medium"
              >
                Privacy Policy
              </button>
              .
            </p>

            {/* Links */}
            <p className="text-center mt-3 text-[12px] text-gray-400">
              <button onClick={() => navigate('/terms')} className="hover:underline hover:text-gray-600 transition-colors">Terms of Service</button>
              {' · '}
              <button onClick={() => navigate('/privacy-policy')} className="hover:underline hover:text-gray-600 transition-colors">Privacy Policy</button>
            </p>
          </div>
        </div>
      </div>

      {/* ── Right: Visual Panel ── */}
      <div className="hidden lg:flex flex-1 flex-col lp-visual-panel overflow-hidden relative justify-between">
        
        {/* Dotted Wallpaper pattern container */}
        <div className="absolute inset-0 opacity-40 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(var(--lp-border-grid) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }} />

        {/* Marketing dashboard preview */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 z-10 w-full">
          <div className="lp-showcase-container !mt-0 w-full max-w-[560px]">
            <div className="lp-rainbow-glow !top-[30%]"></div>
            <div className="lp-showcase-card shadow-2xl">
              <div className="lp-showcase-header">
                <div className="lp-chrome-dots">
                  <span className="lp-dot-red"></span>
                  <span className="lp-dot-yellow"></span>
                  <span className="lp-dot-green"></span>
                </div>
                <div className="lp-chrome-title">app.zieads.com/dashboard</div>
              </div>
              <div className="lp-showcase-body !h-[340px]">
                <div className="lp-showcase-sidebar !w-[160px] p-4 flex flex-col gap-4">
                  <div className="lp-sidebar-logo flex items-center gap-2 font-bold text-gray-900 text-[14px]">
                    <ZieAdsLogo size={14} className="text-gray-900" />
                    <span>zieads</span>
                  </div>
                  <div className="lp-sidebar-links flex flex-col gap-2 mt-2">
                    <div className="lp-sidebar-link active px-3 py-1.5 rounded-lg text-[12px] font-medium bg-gray-100 text-gray-900 cursor-pointer">Dashboard</div>
                    <div className="lp-sidebar-link px-3 py-1.5 rounded-lg text-[12px] font-medium text-gray-500 cursor-pointer hover:bg-gray-50 hover:text-gray-900">AI Audit</div>
                    <div className="lp-sidebar-link px-3 py-1.5 rounded-lg text-[12px] font-medium text-gray-500 cursor-pointer hover:bg-gray-50 hover:text-gray-900">Creative Studio</div>
                    <div className="lp-sidebar-link px-3 py-1.5 rounded-lg text-[12px] font-medium text-gray-500 cursor-pointer hover:bg-gray-50 hover:text-gray-900">Audience Builder</div>
                  </div>
                </div>
                <div className="lp-showcase-content flex-1 p-5 flex flex-col gap-4 overflow-y-auto">
                  <div className="lp-content-header flex justify-between items-center">
                    <h3 className="text-[16px] font-bold text-gray-900">Strategy Report</h3>
                    <span className="lp-badge-success px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">Ready</span>
                  </div>
                  <div className="lp-showcase-metrics grid grid-cols-3 gap-2">
                    <div className="lp-metric-card p-3 rounded-xl border border-gray-100 bg-gray-50 flex flex-col">
                      <span className="lp-metric-label text-[9px] text-gray-400 font-medium uppercase tracking-wider">Readiness</span>
                      <span className="lp-metric-value text-[14px] font-bold text-gray-900 mt-1 font-mono">87/100</span>
                    </div>
                    <div className="lp-metric-card p-3 rounded-xl border border-gray-100 bg-gray-50 flex flex-col">
                      <span className="lp-metric-label text-[9px] text-gray-400 font-medium uppercase tracking-wider">Est. ROAS</span>
                      <span className="lp-metric-value text-[14px] font-bold text-green-600 mt-1 font-mono">+42%</span>
                    </div>
                    <div className="lp-metric-card p-3 rounded-xl border border-gray-100 bg-gray-50 flex flex-col">
                      <span className="lp-metric-label text-[9px] text-gray-400 font-medium uppercase tracking-wider">AI Agents</span>
                      <span className="lp-metric-value text-[14px] font-bold text-blue-600 mt-1 font-mono">5/5 Done</span>
                    </div>
                  </div>
                  <div className="lp-chat-mock flex flex-col gap-3 mt-1 text-[12px]">
                    <div className="lp-chat-bubble lp-ai flex gap-2 items-start bg-blue-50/50 p-2.5 rounded-xl">
                      <span className="lp-ai-avatar w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[9px] shrink-0">AI</span>
                      <p className="text-gray-700 leading-relaxed">I've detected Meta pixel gaps on your cart page. Here is the recommended targeting strategy...</p>
                    </div>
                    <div className="lp-chat-bubble lp-user flex justify-end">
                      <p className="bg-gray-100 text-gray-800 p-2.5 rounded-xl max-w-[85%]">Generate 3 image ad hooks for our SaaS launch.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Glassmorphism testimonial ticker */}
        <div
          className="pb-8 overflow-hidden z-10"
          style={{
            background: 'linear-gradient(to top, rgba(30,123,255,0.06) 0%, transparent 100%)',
          }}
        >
          <p className="text-center text-[13px] font-semibold tracking-normal text-[#1E7BFF] mb-4">
            Trusted by marketers worldwide
          </p>

          <div className="overflow-hidden">
            <div
              className="flex gap-4 px-2"
              style={{
                animation: 'ticker-rtl 32s linear infinite',
                width: 'max-content',
              }}
            >
              {TICKER.map((t, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 px-5 py-4 border-0"
                  style={{
                    width: 280,
                    background: 'var(--lp-accent-gradient)',
                    borderRadius: 'var(--lp-radius-card-sm)',
                    boxShadow: 'var(--lp-shadow-card-hover)',
                  }}
                >
                  <p className="text-[13px] text-white/95 leading-relaxed mb-3 font-medium">
                    "{t.quote}"
                  </p>
                  <div className="flex items-center gap-2.5">
                    <img
                      src={t.avatar}
                      alt={t.name}
                      className="w-7 h-7 rounded-full object-cover shrink-0 border border-white/20"
                    />
                    <div>
                      <div className="text-[12px] font-semibold text-white">{t.name}</div>
                      <div className="text-[11px] text-white/80">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ticker-rtl {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

