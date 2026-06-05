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
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate(from, { replace: true });
    });
  }, [navigate, from]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

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
    <div className="landing-page min-h-screen w-full relative flex flex-col justify-between overflow-x-hidden bg-white font-sans selection:bg-pink-100">
      
      {/* Ambient Gradient Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-tr from-pink-300/20 to-cyan-300/20 blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute top-[20%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-tr from-cyan-200/10 to-blue-300/20 blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr from-pink-200/20 to-purple-300/20 blur-[140px] pointer-events-none z-0"></div>
      
      {/* Brand Header */}
      <header className="w-full px-8 pt-8 pb-4 flex items-center justify-between z-10 relative">
        <div
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <div className="lp-auth-logo-bg p-2 rounded-xl">
            <ZieAdsLogo size={20} className="text-gray-900" />
          </div>
          <span className="lp-auth-logo-text text-[18px]">zieads</span>
        </div>
      </header>

      {/* Main Dual-Panel Content */}
      <main className="flex-1 flex items-center justify-center px-4 md:px-12 py-8 z-10 relative">
        <div className="w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
          
          {/* Left Panel: Glassmorphic Auth Form */}
          <div className="backdrop-blur-xl bg-white/75 border border-gray-100 shadow-[0_12px_40px_-15px_rgba(0,0,0,0.05)] rounded-[32px] p-8 md:p-12 flex flex-col justify-center text-left">
            <h1 className="text-[32px] font-bold text-gray-950 tracking-tight mb-1">
              {isSignUp ? 'Create an account' : 'Welcome back'}
            </h1>
            <p className="text-[14px] text-gray-500 mb-8 font-medium">
              Continue with one of the following options
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
              {/* Email Field */}
              <div>
                <label className="block text-[14px] font-semibold text-gray-800 mb-2">Email</label>
                <input
                  id="email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 placeholder:text-gray-400 bg-white/50 transition-all"
                />
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-[14px] font-semibold text-gray-800 mb-2">Password</label>
                <div className="relative">
                  <input
                    id="password-input"
                    type={isPasswordVisible ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isSignUp ? 'At least 6 characters' : 'Password 8-16 character'}
                    className="w-full pl-4 pr-12 py-3.5 border border-gray-200 rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 placeholder:text-gray-400 bg-white/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {isPasswordVisible ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Options Row */}
              <div className="flex items-center justify-between text-[13px] pt-1">
                <label className="flex items-center gap-2 text-gray-400 font-medium cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-350 accent-gray-900 cursor-pointer"
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => navigate('/reset-password')}
                  className="text-gray-950 font-bold hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                id="email-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full h-12 flex items-center justify-center bg-gray-950 text-white rounded-xl font-semibold text-[15px] hover:bg-gray-900 active:scale-[0.98] transition-all disabled:opacity-60 mt-2"
              >
                {loading ? 'Processing...' : isSignUp ? 'Sign up' : 'Sign in'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6 flex items-center">
              <div className="flex-grow border-t border-gray-200/80"></div>
              <span className="mx-3 text-[11px] text-gray-400 font-semibold uppercase tracking-wider">or</span>
              <div className="flex-grow border-t border-gray-200/80"></div>
            </div>

            {/* Social Google Login */}
            <button
              id="google-signin-btn"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full h-12 flex items-center justify-center gap-3 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-[15px] font-semibold transition-all active:scale-[0.98] shadow-sm disabled:opacity-60"
            >
              {googleLoading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              Continue with Google
            </button>

            {/* Auth Toggle footer */}
            <p className="text-center mt-8 text-[14px] text-gray-500 font-medium">
              {isSignUp ? (
                <>Already have an account?{' '}
                  <button onClick={() => navigate('/sign-in')} className="text-gray-950 font-bold hover:underline">Log In</button>
                </>
              ) : (
                <>New to ZieAds?{' '}
                  <button onClick={() => navigate('/sign-up')} className="text-gray-950 font-bold hover:underline">Get Started</button>
                </>
              )}
            </p>
          </div>

          {/* Right Panel: Floating Astronaut */}
          <div className="hidden lg:flex flex-col justify-center items-center rounded-[32px] border border-gray-100/50 bg-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.02)] backdrop-blur-md p-8 relative overflow-hidden group min-h-[500px]">
            {/* Animated subtle light orb inside astronaut container */}
            <div className="absolute w-[250px] h-[250px] rounded-full bg-gradient-to-tr from-pink-300/10 via-purple-300/10 to-cyan-300/10 blur-[50px] z-0 animate-pulse"></div>
            
            <img
              src="/astronaut_floating.png"
              alt="Floating Astronaut illustration"
              className="w-full max-w-[320px] h-auto object-contain z-10 relative drop-shadow-[0_20px_50px_rgba(0,0,0,0.06)] group-hover:scale-105 group-hover:-translate-y-2 transition-all duration-700 ease-out"
              style={{
                animation: 'float 6s ease-in-out infinite'
              }}
            />
          </div>

        </div>
      </main>

      {/* Footer Links */}
      <footer className="w-full py-6 text-center text-[12px] text-gray-400 z-10 relative">
        <div className="flex justify-center gap-4">
          <button onClick={() => navigate('/terms')} className="hover:underline hover:text-gray-600 transition-colors">Terms of Service</button>
          <span>·</span>
          <button onClick={() => navigate('/privacy-policy')} className="hover:underline hover:text-gray-600 transition-colors">Privacy Policy</button>
        </div>
      </footer>

      {/* Embedded CSS for Floating animation */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(1.5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
      `}</style>
    </div>
  );
}

