import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Key, AlertCircle, ArrowRight } from 'lucide-react';
import ZieAdsLogo from '../../components/ZieAdsLogo';

export default function SuperadminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 2FA setup states
  const [setupMode, setSetupMode] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [qrSecret, setQrSecret] = useState('');
  
  // 2FA code entry state
  const [totpRequired, setTotpRequired] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('zieads_superadmin_token');
    if (token) {
      navigate('/superadmin');
    }
  }, [navigate]);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const resp = await fetch('/api/superadmin/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, totpCode: totpRequired ? totpCode : undefined }),
      });
      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (data.totp_enabled === false) {
        // First-time setup required
        setSetupMode(true);
        setQrUrl(data.qr_url);
        setQrSecret(data.qr_secret);
      } else if (data.totp_required) {
        // Credentials matched, now prompt for TOTP code
        setTotpRequired(true);
      } else if (data.success && data.token) {
        // Successful login
        localStorage.setItem('zieads_superadmin_token', data.token);
        localStorage.setItem('zieads_superadmin_profile', JSON.stringify(data.admin));
        navigate('/superadmin');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpCode) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const resp = await fetch('/api/superadmin/v1/auth/setup-totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, totpCode }),
      });
      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error || 'Setup verification failed');
      }

      if (data.success && data.token) {
        localStorage.setItem('zieads_superadmin_token', data.token);
        localStorage.setItem('zieads_superadmin_profile', JSON.stringify(data.admin));
        navigate('/superadmin');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during setup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#09090B] flex flex-col justify-center items-center px-4 font-sans selection:bg-red-500/20">
      
      {/* Premium Visual Glow behind Card */}
      <div className="absolute w-[400px] h-[400px] rounded-full bg-red-600/10 blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-[420px] bg-[#18181B] border border-[#27272A] rounded-2xl p-8 relative z-10 shadow-2xl">
        
        {/* Logo and Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-3 bg-[#27272A] p-2.5 rounded-xl border border-[#3F3F46]">
            <ZieAdsLogo size={22} className="text-white" />
            <span className="text-[10px] font-mono tracking-wider font-semibold text-red-500 uppercase px-1.5 py-0.5 bg-red-500/10 rounded">superadmin</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Internal Platform Access</h1>
          <p className="text-sm text-zinc-400 mt-1">Authorized personnel only</p>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-start gap-2.5">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Setup 2FA Flow */}
        {setupMode ? (
          <form onSubmit={handleSetupSubmit} className="space-y-6">
            <div className="text-center bg-[#27272A] p-4 rounded-xl border border-[#3F3F46]">
              <span className="text-xs font-semibold text-zinc-300 block mb-3">Scan this QR Code in Authenticator app</span>
              {qrUrl && (
                <img 
                  src={qrUrl} 
                  alt="2FA QR Code" 
                  className="mx-auto bg-white p-2 rounded-lg border border-zinc-700 shadow"
                  width={160} 
                  height={160}
                />
              )}
              <div className="mt-3 text-[11px] text-zinc-400">
                Or enter key manually: <span className="font-mono text-white block mt-0.5 select-all">{qrSecret}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-2">Verification Code</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input
                  type="text"
                  required
                  pattern="[0-9]*"
                  inputMode="numeric"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  placeholder="000000"
                  className="w-full h-12 bg-[#27272A] border border-[#3F3F46] rounded-xl pl-12 pr-4 text-white text-center font-mono tracking-[0.4em] text-lg focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? 'Activating...' : 'Verify and Enable 2FA'}
              <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          /* Main Login Form */
          <form onSubmit={handleCredentialsSubmit} className="space-y-5">
            {!totpRequired ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@zieads.com"
                      className="w-full h-12 bg-[#27272A] border border-[#3F3F46] rounded-xl pl-12 pr-4 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-red-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full h-12 bg-[#27272A] border border-[#3F3F46] rounded-xl pl-12 pr-4 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-red-500 transition"
                    />
                  </div>
                </div>
              </>
            ) : (
              /* TOTP verification step */
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">Two-Factor Authentication Code</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  <input
                    type="text"
                    required
                    pattern="[0-9]*"
                    inputMode="numeric"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full h-12 bg-[#27272A] border border-[#3F3F46] rounded-xl pl-12 pr-4 text-white text-center font-mono tracking-[0.2em] text-base focus:outline-none focus:border-red-500 transition"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-2 text-center">Open your Google Authenticator or Authy app to view the code</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? 'Processing...' : totpRequired ? 'Verify & Enter' : 'Verify Credentials'}
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* Back link */}
        <div className="mt-8 pt-6 border-t border-[#27272A] text-center">
          <button 
            onClick={() => navigate('/')} 
            className="text-xs text-zinc-500 hover:text-zinc-300 hover:underline transition"
          >
            ← Back to ZieAds Platform
          </button>
        </div>

      </div>
    </div>
  );
}
