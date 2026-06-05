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
    initials: "RS",
    color: "var(--lp-accent)",
  },
  {
    quote: "The AI audit caught targeting gaps our team missed for months. ROI improved within the first week.",
    name: "Dewi A.",
    role: "Head of Growth, e-Commerce",
    initials: "DA",
    color: "var(--lp-accent)",
  },
  {
    quote: "We run ZieAds on every new client before a single rupiah is spent. It changed how we work.",
    name: "Bima P.",
    role: "Founder, Digital Agency",
    initials: "BP",
    color: "var(--lp-accent)",
  },
  {
    quote: "The ad copy output is genuinely better than what my copywriter was producing. Fast and on-brand.",
    name: "Sinta W.",
    role: "Marketing Director",
    initials: "SW",
    color: "var(--lp-accent)",
  },
  {
    quote: "Competitor intelligence alone is worth the subscription. I can see exactly what rivals are running.",
    name: "Aryo K.",
    role: "Media Buyer",
    initials: "AK",
    color: "var(--lp-accent)",
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
            <button
              id="google-signin-btn"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full mt-3 flex items-center justify-center gap-3 py-3.5 btn-lp-google text-[15px] active:scale-[0.98] disabled:opacity-60"
            >
              {googleLoading
                ? <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                : <GoogleIcon />}
              {googleLoading ? 'Redirecting...' : 'Sign in with Google'}
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

        {/* Marketing hero image */}
        <div className="flex-1 flex items-center justify-center p-8 pb-4 z-10">
          <img
            src="/zieads-hero.png"
            alt="ZieAds Before and After comparison"
            className="w-full max-w-[560px] object-contain drop-shadow-xl"
          />
        </div>

        {/* Glassmorphism testimonial ticker */}
        <div
          className="pb-8 overflow-hidden z-10"
          style={{
            background: 'linear-gradient(to top, rgba(30,123,255,0.06) 0%, transparent 100%)',
          }}
        >
          <p className="text-center text-[11px] font-bold tracking-widest text-[#1E7BFF]/80 uppercase mb-4">
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
                  className="flex-shrink-0 rounded-2xl px-5 py-4 border"
                  style={{
                    width: 260,
                    background: 'var(--lp-bg-card)',
                    borderColor: 'var(--lp-border-subtle)',
                    borderRadius: 'var(--lp-radius-card-sm)',
                    boxShadow: 'var(--lp-shadow-card)',
                  }}
                >
                  <p className="text-[13px] text-gray-700 leading-relaxed mb-3 font-medium">
                    "{t.quote}"
                  </p>
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                      style={{ backgroundColor: t.color }}
                    >
                      {t.initials}
                    </div>
                    <div>
                      <div className="text-[12px] font-semibold text-gray-800">{t.name}</div>
                      <div className="text-[11px] text-gray-500">{t.role}</div>
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

