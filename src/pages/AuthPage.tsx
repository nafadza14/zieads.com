import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ZieAdsLogo from '../components/ZieAdsLogo';
import { supabase } from '../lib/supabaseClient';

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isSignUp = location.pathname.includes('/sign-up');
  const from = location.state?.from || '/clients';
  
  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate(from, { replace: true });
    });
  }, [navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        // Proceed normally, Supabase logs in automatically if email confirm is off
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff' }}>
        <div style={{ padding: '24px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <ZieAdsLogo size={32} />
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#7B2FBE' }}>zieads</span>
          </div>
        </div>
        
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
          <div style={{ width: '100%', maxWidth: 360 }}>
             <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
               {isSignUp ? 'Create an account' : 'Welcome back'}
             </h2>
             <p style={{ color: '#64748b', marginBottom: 32, fontSize: '0.95rem' }}>
               {isSignUp ? 'Sign up to start executing AI strategy.' : 'Sign in to access your agency dashboard.'}
             </p>

             {error && (
               <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', padding: '12px 16px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 24 }}>
                 {error}
               </div>
             )}

             <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
               <div>
                 <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: 8 }}>Email Address</label>
                 <input 
                   type="email" 
                   required
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none' }} 
                   placeholder="you@agency.com"
                 />
               </div>
               <div>
                 <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: 8 }}>Password</label>
                 <input 
                   type="password" 
                   required
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none' }} 
                   placeholder="••••••••"
                 />
               </div>

               <button 
                 type="submit" 
                 disabled={loading}
                 style={{ 
                   background: 'linear-gradient(135deg, #7B2FBE 0%, #5c8aff 100%)', 
                   color: '#fff', 
                   border: 'none', 
                   padding: '14px', 
                   borderRadius: 100, 
                   fontSize: '1rem', 
                   fontWeight: 600, 
                   cursor: loading ? 'not-allowed' : 'pointer',
                   opacity: loading ? 0.7 : 1,
                   marginTop: 8
                 }}
               >
                 {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
               </button>
             </form>

             <div style={{ textAlign: 'center', marginTop: 32, fontSize: '0.9rem', color: '#64748b' }}>
               {isSignUp ? (
                 <>Already have an account? <span onClick={() => navigate('/sign-in')} style={{ color: '#7B2FBE', fontWeight: 600, cursor: 'pointer' }}>Sign in</span></>
               ) : (
                 <>Don't have an account? <span onClick={() => navigate('/sign-up')} style={{ color: '#7B2FBE', fontWeight: 600, cursor: 'pointer' }}>Sign up</span></>
               )}
             </div>
          </div>
        </div>
      </div>
      
      <div className="auth-illustration" style={{ flex: 1, background: 'linear-gradient(135deg, #7B2FBE 0%, #5c8aff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px', color: '#fff' }}>
        <div style={{ maxWidth: 480 }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 24, lineHeight: 1.1 }}>Your AI Ads Team, <br/>ready to execute.</h1>
          <p style={{ fontSize: '1.25rem', opacity: 0.9, marginBottom: 40, lineHeight: 1.5 }}>Join thousands of agencies and freelancers generating revenue-driving campaigns in seconds.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
             <div style={{ background: 'rgba(255,255,255,0.1)', padding: 20, borderRadius: 12, backdropFilter: 'blur(10px)' }}>
                <span style={{ display: 'block', fontSize: '2rem', fontWeight: 800, marginBottom: 8 }}>#1</span>
                <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>AI Copilot for Ad Agencies</span>
             </div>
             <div style={{ background: 'rgba(255,255,255,0.1)', padding: 20, borderRadius: 12, backdropFilter: 'blur(10px)' }}>
                <span style={{ display: 'block', fontSize: '2rem', fontWeight: 800, marginBottom: 8 }}>14x</span>
                <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>Faster Strategy Execution</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
