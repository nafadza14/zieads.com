import { useState } from 'react';

const P = 'var(--primary)';
const G = 'var(--text-muted)';
const D = 'var(--text)';
const B = 'var(--border)';

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
    <div style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 'var(--radius)', padding: 24, marginBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', color: D, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
            <span style={{ color: P, display: 'flex' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
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
            style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: loading ? 'wait' : 'pointer', fontSize: '0.875rem' }}
          >
            {loading ? 'Authenticating...' : 'Connect Accounts'}
          </button>
        )}
        {connected && (
          <div style={{ background: 'var(--green-bg)', color: 'var(--green-text)', border: '1px solid var(--green-border)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }}></span> Connected
          </div>
        )}
      </div>

      {connected ? (
        <div style={{ background: 'var(--bg-soft)', borderRadius: 'var(--radius-sm)', padding: 16, border: `1px solid ${B}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: D }}>Actual ROAS vs Predicted Differential</div>
            <select style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: `1px solid ${B}`, fontSize: '0.8rem', background: '#fff' }}>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div style={{ background: '#fff', padding: 16, borderRadius: 'var(--radius-sm)', border: `1px solid ${B}` }}>
              <div style={{ fontSize: '0.75rem', color: G, textTransform: 'uppercase', fontWeight: 600 }}>ZieAds Prediction</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: D, marginTop: 4 }}>2.4x ROAS</div>
            </div>
            <div style={{ background: '#fff', padding: 16, borderRadius: 'var(--radius-sm)', border: `1px solid ${B}` }}>
              <div style={{ fontSize: '0.75rem', color: G, textTransform: 'uppercase', fontWeight: 600 }}>Actual Logged</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--green-text)', marginTop: 4 }}>2.6x ROAS</div>
            </div>
            <div style={{ background: '#fff', padding: 16, borderRadius: 'var(--radius-sm)', border: `1px solid ${B}` }}>
              <div style={{ fontSize: '0.75rem', color: G, textTransform: 'uppercase', fontWeight: 600 }}>CPA Trajectory</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: P, marginTop: 4 }}>-12.4% Drop</div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ background: 'var(--bg-soft)', borderRadius: 'var(--radius-sm)', padding: 24, textAlign: 'center', border: `1px dashed ${B}` }}>
          <div style={{ fontSize: '0.9rem', color: G, marginBottom: 16 }}>Securely integrate via OAuth to unlock ML-based predictions.</div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <div style={{ width: 40, height: 40, background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${B}` }}>
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/GitHub_Invertocat_Logo.svg/1200px-GitHub_Invertocat_Logo.svg.png" alt="GitHub Logo" style={{ width: 20, opacity: 0.5 }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
