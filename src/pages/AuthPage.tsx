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

const AppleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.69-1.13 1.83-.99 2.94.1.08 2.16.88 2.82-.47c.66-.81 1.11-1.93.99-3.06z" />
  </svg>
);

const FacebookIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

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
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate(from, { replace: true });
    });
  }, [navigate, from]);

  const handleContinueWithEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setError(null);
    setShowPassword(true);
  };

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
      <div className="w-full lg:w-[25%] shrink-0 flex flex-col min-h-screen z-10 bg-[#F7F5F0] border-r border-[#DDD6C8]/30">
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

            <h1 className="text-[32px] font-bold text-gray-900 mb-8 tracking-tight leading-tight text-left">
              {isSignUp ? 'Sign up' : 'Log in'}
            </h1>

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

            {!showPassword ? (
              <form onSubmit={handleContinueWithEmail} className="space-y-4">
                <div>
                  <label className="block text-[14px] font-semibold mb-2 auth-label text-left">Email</label>
                  <input
                    id="email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your address email"
                    className="w-full px-4 py-3.5 auth-input text-[15px] placeholder:text-gray-400"
                  />
                </div>

                <button
                  id="email-continue-btn"
                  type="submit"
                  className="w-full py-3.5 btn-lp-primary-gradient auth-submit-btn text-white font-semibold text-[15px] active:scale-[0.98] disabled:opacity-60"
                >
                  Continue with email
                </button>
              </form>
            ) : (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="flex justify-between items-center bg-[#F1EFEA] border border-[#DDD6C8]/40 p-3.5 rounded-xl mb-4">
                  <span className="text-[14px] text-gray-700 truncate font-medium">{email}</span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(false)}
                    className="text-[12px] font-semibold text-[#1E7BFF] hover:underline"
                  >
                    Change
                  </button>
                </div>

                <div>
                  <label className="block text-[14px] font-semibold mb-2 auth-label text-left">Password</label>
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
            )}

            {!showPassword && (
              <>
                <div className="flex items-center my-6">
                  <div className="flex-1 border-t border-gray-200"></div>
                  <span className="px-3 text-[12px] text-gray-400 font-semibold tracking-wider">OR</span>
                  <div className="flex-1 border-t border-gray-200"></div>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-3 py-3.5 border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 text-gray-700 rounded-xl text-[15px] font-semibold transition-all active:scale-[0.98] shadow-sm"
                  >
                    <AppleIcon />
                    Continue with Apple
                  </button>
                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-3 py-3.5 border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 text-gray-700 rounded-xl text-[15px] font-semibold transition-all active:scale-[0.98] shadow-sm"
                  >
                    <FacebookIcon />
                    Continue with Facebook
                  </button>
                  <button
                    id="google-signin-btn"
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading}
                    className="w-full flex items-center justify-center gap-3 py-3.5 border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 text-gray-700 rounded-xl text-[15px] font-semibold transition-all active:scale-[0.98] shadow-sm disabled:opacity-60"
                  >
                    {googleLoading ? (
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    ) : (
                      <GoogleIcon />
                    )}
                    Continue with Google
                  </button>
                </div>
              </>
            )}

            {/* Toggle sign in / sign up */}
            <p className="text-center mt-8 text-[14px] text-gray-500">
              {isSignUp ? (
                <>Already have an account?{' '}
                  <button onClick={() => { navigate('/sign-in'); setShowPassword(false); }} className="auth-toggle-link text-[14px]">Log in</button>
                </>
              ) : (
                <>New to ZieAds?{' '}
                  <button onClick={() => { navigate('/sign-up'); setShowPassword(false); }} className="auth-toggle-link text-[14px]">Get Started</button>
                </>
              )}
            </p>

            {/* Consent text */}
            <p className="text-center mt-6 text-[12px] text-gray-400 leading-relaxed max-w-[360px] mx-auto">
              By clicking on 'Continue' you consent to receive occasional product updates
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
      <div className="hidden lg:flex lg:w-[75%] flex-col lp-visual-panel overflow-hidden relative justify-between">
        
        {/* Dotted Wallpaper pattern container */}
        <div className="absolute inset-0 opacity-40 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(var(--lp-border-grid) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }} />

        {/* Testimonial Quote */}
        <div className="px-16 pt-24 max-w-[680px] z-10 text-left">
          <p className="text-[20px] lg:text-[24px] text-gray-700 font-normal leading-relaxed mb-4">
            "ZieAds has been a game-changer for our design team, streamlining our workflow and allowing us to create consistent, high-quality designs with ease!"
          </p>
          <p className="text-[14px] text-gray-400 font-semibold">
            — Adam Doe, Senior Product Designer
          </p>
        </div>

        {/* Marketing dashboard preview */}
        <div className="flex-1 flex items-end justify-center px-12 z-10 w-full mt-10 overflow-hidden translate-y-[100px] hover:translate-y-[80px] transition-transform duration-500">
          <div className="lp-showcase-container !mt-0 w-full max-w-[580px]">
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
                      <span className="lp-metric-label text-[9px] text-gray-400 font-medium ">Readiness Score</span>
                      <span className="lp-metric-value text-[14px] font-bold text-gray-900 mt-1 font-mono">87/100</span>
                    </div>
                    <div className="lp-metric-card p-3 rounded-xl border border-gray-100 bg-gray-50 flex flex-col">
                      <span className="lp-metric-label text-[9px] text-gray-400 font-medium ">Est. ROAS Increase</span>
                      <span className="lp-metric-value text-[14px] font-bold text-green-600 mt-1 font-mono">+42%</span>
                    </div>
                    <div className="lp-metric-card p-3 rounded-xl border border-gray-100 bg-gray-50 flex flex-col">
                      <span className="lp-metric-label text-[9px] text-gray-400 font-medium ">AI Agent Audit</span>
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
      </div>
    </div>
  );
}

