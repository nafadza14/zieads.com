import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import ZieAdsLogo from '../components/ZieAdsLogo';
import SocialIcon from '../components/v3/SocialIcon';
import { AuditScanVisual, BriefingVisual, ChartVisual, InboxVisual } from './landing/visuals';
import './landing/landing-v2.css';
import './landing/visuals.css';
import './auth.css';
import { supabase } from '../lib/supabaseClient';

const GoogleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isSignUp = location.pathname.includes('/sign-up');
  const queryParams = new URLSearchParams(location.search);
  const targetPlan = queryParams.get('plan');
  const targetYearly = queryParams.get('yearly');
  let redirectFrom = (location.state as any)?.from;
  if (!redirectFrom && targetPlan) {
    redirectFrom = `/pricing?plan=${targetPlan}&yearly=${targetYearly || 'false'}`;
  }
  const from = redirectFrom || '/analyst';

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

  const [mode, setMode] = useState<'in' | 'up'>(isSignUp ? 'up' : 'in');
  useEffect(() => setMode(isSignUp ? 'up' : 'in'), [isSignUp]);
  const switchMode = (m: 'in' | 'up') => {
    setError(null);
    setSuccessMsg(null);
    navigate(m === 'up' ? `/sign-up${location.search}` : `/sign-in${location.search}`, { state: location.state, replace: true });
  };

  return (
    <div className="landing-page za-auth">
      <div className="za-auth-grid">
        {/* ── Form column ── */}
        <div className="za-auth-form-col">
          <header className="za-auth-top">
            <button className="za-auth-brand" onClick={() => navigate('/')}>
              <ZieAdsLogo size={26} />
              <span>zieads</span>
            </button>
            <button className="za-auth-back" onClick={() => navigate('/')}>
              <ArrowLeft size={14} /> Back to home
            </button>
          </header>

          <div className="za-auth-form-wrap">
            <div className="za-auth-switch" role="tablist">
              <span className="za-auth-switch-pill" style={{ transform: `translateX(${mode === 'in' ? 0 : 100}%)` }} />
              <button role="tab" aria-selected={mode === 'in'} className={mode === 'in' ? 'is-active' : ''} onClick={() => switchMode('in')}>
                Log in
              </button>
              <button role="tab" aria-selected={mode === 'up'} className={mode === 'up' ? 'is-active' : ''} onClick={() => switchMode('up')}>
                Create account
              </button>
            </div>

            <h1 className="za-auth-title" key={`t-${mode}`}>{isSignUp ? 'Meet your AI marketing agent.' : 'Welcome back.'}</h1>
            <p className="za-auth-sub">
              {isSignUp
                ? 'Free plan, no credit card. Your first briefing arrives tomorrow morning.'
                : 'Log in to see today\'s briefing and pick up where your agent left off.'}
            </p>

            {isSignUp && (
              <ul className="za-auth-perks">
                <li>
                  <Check size={14} /> Free website audit
                </li>
                <li>
                  <Check size={14} /> No ad account access
                </li>
                <li>
                  <Check size={14} /> First briefing in 24 hours
                </li>
              </ul>
            )}

            <button
              id="google-signin-btn"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="za-auth-google"
            >
              {googleLoading ? <span className="za-auth-spin" /> : <GoogleIcon />}
              Continue with Google
            </button>

            <div className="za-auth-or">
              <span>or with email</span>
            </div>

            {error && <div className="za-auth-alert is-error">{error}</div>}
            {successMsg && <div className="za-auth-alert is-success">{successMsg}</div>}

            <form onSubmit={handleEmailSubmit} className="za-auth-form">
              <label className="za-auth-field">
                <span>Work email</span>
                <div className="za-auth-input">
                  <Mail size={16} />
                  <input
                    id="email-input"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@brand.com"
                  />
                </div>
              </label>

              <label className="za-auth-field">
                <span>Password</span>
                <div className="za-auth-input">
                  <Lock size={16} />
                  <input
                    id="password-input"
                    type={isPasswordVisible ? 'text' : 'password'}
                    required
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isSignUp ? 'At least 6 characters' : 'Your password'}
                  />
                  <button
                    type="button"
                    className="za-auth-eye"
                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                    aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                  >
                    {isPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              {!isSignUp && (
                <div className="za-auth-row">
                  <label className="za-auth-check">
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                    <span>Remember me</span>
                  </label>
                  <button type="button" className="za-auth-link" onClick={() => navigate('/reset-password')}>
                    Forgot password?
                  </button>
                </div>
              )}

              <button id="email-submit-btn" type="submit" disabled={loading} className="za-auth-submit">
                <span>{loading ? 'Processing...' : isSignUp ? 'Create free account' : 'Log in'}</span>
                <span className="za-auth-submit-arrow">
                  <ArrowRight size={15} />
                </span>
              </button>
            </form>

            <p className="za-auth-legal">
              By continuing you agree to the{' '}
              <button type="button" onClick={() => navigate('/terms')}>Terms of Service</button> and{' '}
              <button type="button" onClick={() => navigate('/privacy-policy')}>Privacy Policy</button>.
            </p>
          </div>
        </div>

        {/* ── Showcase column: what you get, in motion ── */}
        <AuthShowcase />
      </div>
    </div>
  );
}

const SLIDES = [
  {
    eyebrow: 'Every morning, 07:00',
    title: 'A briefing that tells you what to do next.',
    visual: <BriefingVisual />,
  },
  {
    eyebrow: 'Free website audit',
    title: 'Your ads readiness, scored in 3 minutes.',
    visual: <AuditScanVisual />,
  },
  {
    eyebrow: 'Unified inbox',
    title: 'Every comment from every channel, sorted.',
    visual: <InboxVisual />,
  },
  {
    eyebrow: 'Analytics',
    title: 'Numbers that explain themselves.',
    visual: <ChartVisual />,
  },
];

const QUOTES = [
  { q: 'Now the briefing is waiting when I wake up. I got my weekends back.', name: 'Agnes Angelina', role: 'Founder, DTC skincare brand', avatar: '/testimonial-agnes.jpg' },
  { q: 'It flagged my best Reel format going stale two weeks before I would have noticed.', name: 'Andreas L Lino', role: 'Solo founder', avatar: '/testimonial-andreas.jpg' },
  { q: 'Monday reporting for six clients went from a full day to about an hour.', name: 'Lucas Keneth', role: 'Marketing consultant', avatar: '/testimonial-lucas.jpg' },
];

const SLIDE_MS = 5500;

function AuthShowcase() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = window.setTimeout(() => setI((x) => (x + 1) % SLIDES.length), SLIDE_MS);
    return () => window.clearTimeout(t);
  }, [i]);
  const slide = SLIDES[i];
  const quote = QUOTES[i % QUOTES.length];

  return (
    <aside className="za-show" aria-label="What ZieAds does">
      <div className="za-show-aura" aria-hidden="true">
        <span />
        <span />
      </div>
      <div className="za-show-dots" aria-hidden="true" />

      <div className="za-show-head">
        <div className="za-show-bars">
          {SLIDES.map((s, k) => (
            <button key={s.title} onClick={() => setI(k)} className={k === i ? 'is-active' : k < i ? 'is-done' : ''} aria-label={s.eyebrow}>
              <span style={{ animationDuration: `${SLIDE_MS}ms` }} key={`${k}-${i}`} />
            </button>
          ))}
        </div>
        <div className="za-show-copy" key={`c-${i}`}>
          <span className="za-show-eyebrow">{slide.eyebrow}</span>
          <h2>{slide.title}</h2>
        </div>
      </div>

      <div className="za-show-stage" key={`v-${i}`}>
        {slide.visual}
      </div>

      <div className="za-show-foot">
        <div className="za-show-quote" key={`q-${i}`}>
          <p>"{quote.q}"</p>
          <div className="za-show-author">
            <img src={quote.avatar} alt="" />
            <span>
              <strong>{quote.name}</strong>
              <small>{quote.role}</small>
            </span>
          </div>
        </div>
        <div className="za-show-channels">
          <SocialIcon platform="instagram" size={22} />
          <SocialIcon platform="tiktok" size={22} />
          <SocialIcon platform="linkedin" size={22} />
          <SocialIcon platform="facebook" size={22} />
          <span>Works with your channels</span>
        </div>
      </div>
    </aside>
  );
}
