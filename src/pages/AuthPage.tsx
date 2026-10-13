import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import ZieAdsLogo from '../components/ZieAdsLogo';
import SocialIcon from '../components/v3/SocialIcon';
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

// ─── Showcase: every social account, connected to one ZieAds login ─────────
const HUB = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'x', label: 'X' },
  { key: 'meta_ads', label: 'Meta Ads' },
  { key: 'google_ads', label: 'Google Ads' },
  { key: 'tiktok_ads', label: 'TikTok Ads' },
];
const HUB_STEP = 520; // ms between connections
const HUB_HOLD = 4200; // ms to hold the fully connected state before replaying

function AuthShowcase() {
  const [connected, setConnected] = useState(0);
  useEffect(() => {
    const delay = connected < HUB.length ? (connected === 0 ? 700 : HUB_STEP) : HUB_HOLD;
    const t = window.setTimeout(() => setConnected((c) => (c < HUB.length ? c + 1 : 0)), delay);
    return () => window.clearTimeout(t);
  }, [connected]);

  const all = connected === HUB.length;
  const R = 41; // node orbit radius in % of the stage

  return (
    <aside className="za-show" aria-label="Every social account in one ZieAds dashboard">
      <div className="za-show-aura" aria-hidden="true">
        <span />
        <span />
      </div>
      <div className="za-show-dots" aria-hidden="true" />

      <div className="za-show-copy">
        <span className="za-show-eyebrow">One account, every channel</span>
        <h2>All your social media accounts in one ZieAds dashboard.</h2>
      </div>

      <div className="za-hub" aria-hidden="true">
        <svg className="za-hub-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
          {HUB.map((n, i) => {
            const a = (i / HUB.length) * Math.PI * 2 - Math.PI / 2;
            const x = 50 + Math.cos(a) * R;
            const y = 50 + Math.sin(a) * R;
            const on = i < connected;
            return (
              <g key={n.key} className={on ? 'is-on' : ''}>
                <line x1={x} y1={y} x2="50" y2="50" className="za-hub-line" />
                {on && <line x1={x} y1={y} x2="50" y2="50" className="za-hub-flow" style={{ animationDelay: `${(i % 4) * 0.25}s` }} />}
              </g>
            );
          })}
        </svg>

        {HUB.map((n, i) => {
          const a = (i / HUB.length) * Math.PI * 2 - Math.PI / 2;
          const on = i < connected;
          return (
            <div
              key={n.key}
              className={`za-hub-node ${on ? 'is-on' : ''} ${i === connected - 1 ? 'is-new' : ''}`}
              style={{ left: `${50 + Math.cos(a) * R}%`, top: `${50 + Math.sin(a) * R}%` }}
            >
              <span className="za-hub-icon">
                <SocialIcon platform={n.key} size={30} />
                <span className="za-hub-check">
                  <Check size={10} strokeWidth={3} />
                </span>
              </span>
              <small>{n.label}</small>
            </div>
          );
        })}

        <div className={`za-hub-core ${all ? 'is-full' : ''}`}>
          <span className="za-hub-pulse" />
          <ZieAdsLogo size={44} />
          <strong>1 ZieAds account</strong>
          <span className="za-hub-count">
            <b key={connected}>{connected}</b>/{HUB.length} channels connected
          </span>
        </div>
      </div>

      <ul className="za-hub-points">
        <li>
          <Check size={13} /> Post and schedule everywhere
        </li>
        <li>
          <Check size={13} /> Every comment in one inbox
        </li>
        <li>
          <Check size={13} /> One report for all channels
        </li>
      </ul>
    </aside>
  );
}
