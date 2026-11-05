import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../components/v3/dash.css';
import './sa.css';
import ZieAdsLogo, { ZieAdsWordmark } from '../../components/ZieAdsLogo';
import { Button } from '../../components/v3/ui';

type Step = 'credentials' | 'code' | 'setup';

export default function SuperadminLogin() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [qrSecret, setQrSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Admin sign in | ZieAds';
    if (localStorage.getItem('zieads_superadmin_token')) navigate('/superadmin');
  }, [navigate]);

  const finish = (data: any) => {
    localStorage.setItem('zieads_superadmin_token', data.token);
    localStorage.setItem('zieads_superadmin_profile', JSON.stringify(data.admin));
    navigate('/superadmin');
  };

  const post = async (url: string, body: object) => {
    const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(data.error || 'Sign in failed');
    return data;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (step === 'setup') {
        const data = await post('/api/superadmin/v1/auth/setup-totp', { email, password, totpCode: code });
        if (data.success && data.token) finish(data);
        return;
      }
      const data = await post('/api/superadmin/v1/auth/login', { email, password, totpCode: step === 'code' ? code : undefined });
      if (data.totp_enabled === false) {
        setQrUrl(data.qr_url);
        setQrSecret(data.qr_secret);
        setCode('');
        setStep('setup');
      } else if (data.totp_required) {
        setCode('');
        setStep('code');
      } else if (data.success && data.token) {
        finish(data);
      }
    } catch (err: any) {
      setError(err.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const codeField = (
    <>
      <label htmlFor="sa-code">6 digit code</label>
      <input
        id="sa-code"
        className="zd-input"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        maxLength={6}
        required
        autoFocus
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
        placeholder="000000"
        style={{ letterSpacing: '0.3em', fontVariantNumeric: 'tabular-nums' }}
      />
    </>
  );

  return (
    <div className="zd-shell" style={{ display: 'block', height: 'auto', overflow: 'visible' }}>
    <div className="sa-login">
      <form className="sa-login-card" onSubmit={submit}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ZieAdsLogo size={28} />
          <ZieAdsWordmark />
          <span className="sa-admin-pill">Admin</span>
        </div>

        {step === 'credentials' && (
          <>
            <h1>Sign in to the admin console</h1>
            <p>For the ZieAds team only. Every action here is recorded in the audit log.</p>
            <label htmlFor="sa-email">Email</label>
            <input id="sa-email" className="zd-input" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@zieads.com" />
            <label htmlFor="sa-pass">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="sa-pass"
                className="zd-input"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: 64 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 0, background: 'none', font: 'inherit', fontSize: 12.5, fontWeight: 600, color: 'var(--zd-ink-3)', cursor: 'pointer' }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </>
        )}

        {step === 'code' && (
          <>
            <h1>Enter your 2FA code</h1>
            <p>Open your authenticator app (Google Authenticator, Authy or 1Password) and type the code for ZieAds Admin.</p>
            {codeField}
          </>
        )}

        {step === 'setup' && (
          <>
            <h1>Turn on two factor sign in</h1>
            <p>Scan this code with your authenticator app, then type the 6 digit code it shows.</p>
            {qrUrl && (
              <div className="sa-qr">
                <img src={qrUrl} alt="QR code for the authenticator app" width={168} height={168} style={{ borderRadius: 8, border: '1px solid var(--zd-line)' }} />
              </div>
            )}
            {qrSecret && (
              <p className="sa-small" style={{ textAlign: 'center' }}>
                Or type this key: <code style={{ userSelect: 'all', fontWeight: 600, color: 'var(--zd-ink)' }}>{qrSecret}</code>
              </p>
            )}
            {codeField}
          </>
        )}

        {error && <p className="sa-msg is-bad" role="alert">{error}</p>}

        <div style={{ marginTop: 18 }}>
          <Button type="submit" full loading={loading} disabled={loading}>
            {step === 'credentials' ? 'Continue' : step === 'setup' ? 'Turn on and sign in' : 'Sign in'}
          </Button>
        </div>
        {step !== 'credentials' && (
          <div style={{ marginTop: 8 }}>
            <Button variant="ghost" full onClick={() => { setStep('credentials'); setCode(''); setError(null); }}>
              Use a different account
            </Button>
          </div>
        )}
      </form>
    </div>
    </div>
  );
}
