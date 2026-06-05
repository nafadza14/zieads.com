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

      {/* ── Left: Form Panel (50% Split) ── */}
      <div className="w-full lg:w-[50%] shrink-0 flex flex-col min-h-screen z-10 bg-[#F7F5F0] border-r border-[#DDD6C8]/30">
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
            <p className="text-center mt-8 text-[14px] text-gray-500 font-medium">
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

      {/* ── Right: Visual Panel (50% Split) ── */}
      <div className="hidden lg:flex lg:w-[50%] flex-col lp-visual-panel overflow-hidden relative justify-between">
        
        {/* Dotted Wallpaper pattern container */}
        <div className="absolute inset-0 opacity-40 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(var(--lp-border-grid) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }} />

        {/* Real ZieAds Testimonial Quote */}
        <div className="px-16 pt-24 max-w-[680px] z-10 text-left">
          <p className="text-[20px] lg:text-[24px] text-gray-700 font-normal leading-relaxed mb-4">
            "ZieAds cut our client onboarding from 3 days to 20 minutes. Every agency needs this."
          </p>
          <p className="text-[14px] text-gray-400 font-semibold">
            — Rafi S., Performance Marketing Lead
          </p>
        </div>

        {/* Branded replica of the reference dashboard */}
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
                <div className="lp-chrome-title">app.zieads.com/main-library</div>
              </div>
              <div className="lp-showcase-body !h-[360px] flex">
                {/* Mock Sidebar */}
                <div className="lp-showcase-sidebar !w-[170px] p-4 flex flex-col justify-between bg-white border-r border-gray-100 shrink-0">
                  <div className="flex flex-col gap-5">
                    <div className="lp-sidebar-logo flex items-center gap-2 font-bold text-gray-900 text-[13px] tracking-tight">
                      <div className="p-1 bg-gray-900 text-white rounded">
                        <ZieAdsLogo size={10} className="text-white" />
                      </div>
                      <span>zieads.com</span>
                    </div>
                    <div className="lp-sidebar-links flex flex-col gap-1">
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium text-gray-500 cursor-pointer hover:bg-gray-50 hover:text-gray-900">
                        <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
                        Dashboard
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold bg-blue-50 text-blue-600 cursor-pointer">
                        <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                        Main Library
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium text-gray-500 cursor-pointer hover:bg-gray-50 hover:text-gray-900">
                        <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                        Master
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium text-gray-500 cursor-pointer hover:bg-gray-50 hover:text-gray-900">
                        <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 3v12M18 9a3 3 0 0 1-3-3m0 0a3 3 0 0 0-3 3m3-3v12"/></svg>
                        Branches
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium text-gray-500 cursor-pointer hover:bg-gray-50 hover:text-gray-900">
                        <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        Members
                      </div>
                    </div>
                  </div>
                  {/* Sidebar Bottom (Storage & Profile) */}
                  <div className="flex flex-col gap-3">
                    <div className="px-2">
                      <div className="flex justify-between items-center text-[10px] text-gray-400 mb-1">
                        <span>Your Storage</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
                        <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '33%' }}></div>
                      </div>
                      <p className="text-[9px] text-gray-400 leading-tight">4.9 GB of 15 GB used</p>
                      <button className="text-[9px] font-semibold text-blue-600 hover:underline block mt-1">Upgrade Storage</button>
                    </div>
                    <div className="border-t border-gray-100 pt-3 flex items-center gap-2">
                      <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&h=80&q=80" alt="John Doe" className="w-7 h-7 rounded-full object-cover" />
                      <span className="text-[11px] font-semibold text-gray-700 truncate">John Doe</span>
                    </div>
                  </div>
                </div>

                {/* Mock Content */}
                <div className="flex-1 p-5 flex flex-col gap-4 overflow-y-auto text-left">
                  <div>
                    <h3 className="text-[16px] font-bold text-gray-900 leading-tight">Main Library</h3>
                  </div>
                  {/* Tabs */}
                  <div className="flex gap-4 border-b border-gray-100 pb-1 text-[12px]">
                    <span className="text-blue-600 font-semibold border-b-2 border-blue-600 pb-1 cursor-pointer">Files</span>
                    <span className="text-gray-400 cursor-pointer hover:text-gray-600 pb-1">Activities</span>
                    <span className="text-gray-400 cursor-pointer hover:text-gray-600 pb-1">Overview</span>
                  </div>
                  {/* Folders Section */}
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Folders</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 border border-gray-100 rounded-xl bg-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-blue-500 fill-blue-500/10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                          <span className="text-[11px] font-semibold text-gray-700 truncate max-w-[80px]">Figma Library</span>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400">3</span>
                      </div>
                      <div className="p-3 border border-gray-100 rounded-xl bg-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-blue-500 fill-blue-500/10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                          <span className="text-[11px] font-semibold text-gray-700 truncate max-w-[80px]">React</span>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400">32</span>
                      </div>
                    </div>
                  </div>
                  {/* Recent Files Section */}
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Recent files</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 border border-gray-100 rounded-xl bg-white flex flex-col justify-between h-[85px]">
                        <div className="p-1.5 bg-blue-50 text-blue-600 rounded w-fit">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        </div>
                        <span className="text-[10px] font-semibold text-gray-700 truncate">About ZieAds</span>
                      </div>
                      <div className="p-3 border border-gray-100 rounded-xl bg-white flex flex-col justify-between h-[85px]">
                        <div className="p-1.5 bg-green-50 text-green-600 rounded w-fit">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        </div>
                        <span className="text-[10px] font-semibold text-gray-700 truncate">Competitor Audit</span>
                      </div>
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

