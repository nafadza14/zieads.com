import { useState } from 'react';

const P = '#7B2FBE';
const G = '#64748b';
const D = '#1e293b';
const B = '#e2e8f0';

export default function AdsIntegrationMock() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConnect = () => {
    setLoading(true);
    // Simulate OAuth popup delay
    setTimeout(() => {
      setConnected(true);
      setLoading(false);
    }, 1500);
  };

  return (
    <div style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 12, padding: 24, marginBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', color: D, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: P, display: 'flex' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
            </span> True ROAS Tracking (Beta)
          </h3>
          <p style={{ fontSize: '0.9rem', color: G, maxWidth: 500 }}>
            Connect your Meta Ads Manager or Google Ads account to track your actual ROAS performance against ZieAds score predictions.
          </p>
        </div>
        {!connected && (
          <button 
            onClick={handleConnect} 
            disabled={loading}
            style={{ background: '#1e293b', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: loading ? 'wait' : 'pointer' }}
          >
            {loading ? 'Authenticating...' : 'Connect Accounts'}
          </button>
        )}
        {connected && (
          <div style={{ background: '#ecfdf5', color: '#059669', padding: '6px 12px', borderRadius: 100, fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></span> Connected
          </div>
        )}
      </div>

      {connected ? (
        <div style={{ background: '#f8fafc', borderRadius: 8, padding: 16, border: `1px solid ${B}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: D }}>Actual ROAS vs Predicted Differential</div>
            <select style={{ padding: '4px 8px', borderRadius: 4, border: `1px solid ${B}`, fontSize: '0.8rem' }}>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div style={{ background: '#fff', padding: 16, borderRadius: 8, border: `1px solid ${B}` }}>
              <div style={{ fontSize: '0.75rem', color: G, textTransform: 'uppercase', fontWeight: 600 }}>ZieAds Prediction</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: D, marginTop: 4 }}>2.4x ROAS</div>
            </div>
            <div style={{ background: '#fff', padding: 16, borderRadius: 8, border: `1px solid ${B}` }}>
              <div style={{ fontSize: '0.75rem', color: G, textTransform: 'uppercase', fontWeight: 600 }}>Actual Logged</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#10b981', marginTop: 4 }}>2.6x ROAS</div>
            </div>
            <div style={{ background: '#fff', padding: 16, borderRadius: 8, border: `1px solid ${B}` }}>
              <div style={{ fontSize: '0.75rem', color: G, textTransform: 'uppercase', fontWeight: 600 }}>CPA Trajectory</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: P, marginTop: 4 }}>-12.4% Drop</div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ background: '#f1f5f9', borderRadius: 8, padding: 24, textAlign: 'center', border: `1px dashed ${G}` }}>
          <div style={{ fontSize: '0.9rem', color: G, marginBottom: 16 }}>Securely integrate via OAuth to unlock ML-based predictions.</div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <div style={{ width: 40, height: 40, background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/GitHub_Invertocat_Logo.svg/1200px-GitHub_Invertocat_Logo.svg.png" alt="Dummy Icon" style={{ width: 20, opacity: 0.5 }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
