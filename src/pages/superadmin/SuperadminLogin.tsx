import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-gradient'; // Wait, let's use react-router-dom
import { useNavigate as useNav } from 'react-router-dom';
import ZieAdsLogo from '../../components/ZieAdsLogo';

export default function SuperadminLogin() {
  const navigate = useNav();
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
  
  // Toggle password visibility
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

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
    <div className="landing-page min-h-screen w-full relative flex flex-col justify-between overflow-x-hidden bg-white font-sans selection:bg-pink-100">
      
      {/* Ambient Gradient Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-tr from-pink-300/20 to-cyan-300/20 blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute top-[20%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-tr from-cyan-200/10 to-blue-300/20 blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr from-pink-200/20 to-purple-300/20 blur-[140px] pointer-events-none z-0"></div>

      {/* Main Dual-Panel Content */}
      <main className="flex-1 flex items-center justify-center px-4 md:px-12 py-6 z-10 relative">
        <div className="w-full max-w-[1000px] grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-stretch">
          
          {/* Left Panel: Transparent/No-Card Auth Form */}
          <div className="flex flex-col justify-center text-left max-w-[450px] mx-auto w-full p-4 md:p-6">
            
            {/* Logo inside form column */}
            <div
              className="flex items-center gap-2.5 cursor-pointer mb-8 w-fit"
              onClick={() => navigate('/')}
            >
              <div className="lp-auth-logo-bg p-2 rounded-xl">
                <ZieAdsLogo size={20} className="text-gray-900" />
              </div>
              <span className="lp-auth-logo-text text-[18px]">zieads</span>
              <span className="text-[10px] font-mono tracking-wider font-semibold text-red-500 uppercase px-1.5 py-0.5 bg-red-500/10 rounded">superadmin</span>
            </div>

            <h1 className="text-[28px] font-bold text-gray-950 tracking-tight" style={{ marginBottom: '8px' }}>
              Internal Platform Access
            </h1>
            <p className="text-[14px] text-gray-500 font-medium" style={{ marginBottom: '48px' }}>
              Authorized personnel only
            </p>

            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-[14px]">
                {error}
              </div>
            )}

            {/* Setup 2FA Flow */}
            {setupMode ? (
              <form onSubmit={handleSetupSubmit} className="space-y-5">
                <div className="text-center bg-[#FDFCFB] p-5 rounded-2xl border border-[#E2D9D4] mb-6">
                  <span className="text-[13px] font-bold text-gray-950 block mb-3">Scan this QR Code in Authenticator app</span>
                  {qrUrl && (
                    <img 
                      src={qrUrl} 
                      alt="2FA QR Code" 
                      className="mx-auto bg-white p-2.5 rounded-xl border border-[#E2D9D4] shadow-sm"
                      width={160} 
                      height={160}
                    />
                  )}
                  <div className="mt-3.5 text-[12px] text-gray-500 font-medium">
                    Or enter key manually: 
                    <span className="font-mono text-gray-950 font-bold block mt-1 select-all tracking-wider text-[13px] bg-gray-50 py-1.5 px-3 rounded-lg border border-gray-100">{qrSecret}</span>
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label className="block text-[14px] font-bold text-gray-950" style={{ marginBottom: '8px' }}>Verification Code</label>
                  <input
                    type="text"
                    required
                    pattern="[0-9]*"
                    inputMode="numeric"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    placeholder="000000"
                    className="w-full border border-[#E2D9D4] bg-white transition-all focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 placeholder:text-gray-300 text-center font-mono tracking-[0.4em] text-lg"
                    style={{
                      height: '60px',
                      borderRadius: '16px',
                      fontSize: '18px'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center btn-lp-primary-gradient text-white font-bold transition-all active:scale-[0.98] disabled:opacity-60"
                  style={{
                    height: '60px',
                    borderRadius: '16px',
                    fontSize: '16px'
                  }}
                >
                  {loading ? 'Activating...' : 'Verify and Enable 2FA'}
                </button>
              </form>
            ) : totpRequired ? (
              /* TOTP verification step */
              <form onSubmit={handleCredentialsSubmit} className="space-y-5">
                <div style={{ marginBottom: '24px' }}>
                  <label className="block text-[14px] font-bold text-gray-950" style={{ marginBottom: '8px' }}>Two-Factor Authentication Code</label>
                  <input
                    type="text"
                    required
                    pattern="[0-9]*"
                    inputMode="numeric"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full border border-[#E2D9D4] bg-white transition-all focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 placeholder:text-gray-300 text-center font-mono tracking-[0.2em] text-base"
                    style={{
                      height: '60px',
                      borderRadius: '16px',
                      fontSize: '16px'
                    }}
                    autoFocus
                  />
                  <p className="text-[12px] text-gray-500 font-medium mt-2.5 text-center">Open your Google Authenticator or Authy app to view the code</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center btn-lp-primary-gradient text-white font-bold transition-all active:scale-[0.98] disabled:opacity-60"
                  style={{
                    height: '60px',
                    borderRadius: '16px',
                    fontSize: '16px'
                  }}
                >
                  {loading ? 'Processing...' : 'Verify & Enter'}
                </button>
              </form>
            ) : (
              /* Main Login Form */
              <form onSubmit={handleCredentialsSubmit} className="space-y-5">
                <div style={{ marginBottom: '24px' }}>
                  <label className="block text-[14px] font-bold text-gray-950" style={{ marginBottom: '8px' }}>Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@zieads.com"
                    className="w-full border border-[#E2D9D4] bg-white transition-all focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 placeholder:text-gray-300"
                    style={{
                      height: '60px',
                      borderRadius: '16px',
                      textAlign: 'left',
                      paddingLeft: '16px',
                      paddingRight: '16px',
                      fontSize: '15px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label className="block text-[14px] font-bold text-gray-950" style={{ marginBottom: '8px' }}>Password</label>
                  <div className="relative">
                    <input
                      type={isPasswordVisible ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full border border-[#E2D9D4] bg-white transition-all focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 placeholder:text-gray-300"
                      style={{
                        height: '60px',
                        borderRadius: '16px',
                        textAlign: 'left',
                        paddingLeft: '16px',
                        paddingRight: '48px',
                        fontSize: '15px'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center btn-lp-primary-gradient text-white font-bold transition-all active:scale-[0.98] disabled:opacity-60"
                  style={{
                    height: '60px',
                    borderRadius: '16px',
                    fontSize: '16px'
                  }}
                >
                  {loading ? 'Processing...' : 'Verify Credentials'}
                </button>
              </form>
            )}

            {/* Back link */}
            <p className="text-center mt-6 text-[14px] text-gray-500 font-medium">
              <button 
                onClick={() => navigate('/')} 
                className="text-gray-950 font-bold hover:underline"
              >
                ← Back to ZieAds Platform
              </button>
            </p>

          </div>

          {/* Right Panel: Floating Astronaut (Solid background so white image blends seamlessly) */}
          <div className="hidden lg:flex flex-col justify-center items-center rounded-[32px] border border-gray-100 bg-[#FFFDFD] shadow-[0_15px_50px_rgba(0,0,0,0.03)] p-10 relative overflow-hidden group min-h-[500px]">
            {/* Animated subtle light orb inside astronaut container */}
            <div className="absolute w-[250px] h-[250px] rounded-full bg-gradient-to-tr from-pink-300/10 via-purple-300/10 to-cyan-300/10 blur-[50px] z-0 animate-pulse"></div>
            
            <img
              src="/astronaut_floating.png"
              alt="Floating Astronaut illustration"
              className="w-full max-w-[300px] h-auto object-contain z-10 relative drop-shadow-[0_15px_35px_rgba(0,0,0,0.04)] group-hover:scale-105 group-hover:-translate-y-1.5 transition-all duration-700 ease-out"
              style={{
                animation: 'float 6s ease-in-out infinite'
              }}
            />
          </div>

        </div>
      </main>

      {/* Footer Links */}
      <footer className="w-full py-4 text-center text-[12px] text-gray-450 z-10 relative">
        <div className="flex justify-center gap-4">
          <button onClick={() => navigate('/terms')} className="hover:underline hover:text-gray-650 transition-colors">Terms of Service</button>
          <span>·</span>
          <button onClick={() => navigate('/privacy')} className="hover:underline hover:text-gray-650 transition-colors">Privacy Policy</button>
        </div>
      </footer>

    </div>
  );
}
