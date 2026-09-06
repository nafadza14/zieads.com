import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { reportTabs } from '../data';

interface Props {
  onScanComplete: (data: any) => void;
}

export default function FreeAuditSection({ onScanComplete }: Props) {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeReportTab, setActiveReportTab] = useState(0);

  const handleQuickScan = async () => {
    if (!url.trim()) return;

    let scanUrl = url.trim();
    if (!scanUrl.startsWith('http')) scanUrl = 'https://' + scanUrl;

    setLoading(true);
    setError('');

    try {
      const resp = await fetch('/api/quick-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scanUrl }),
      });

      const contentType = resp.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(
          `Server returned an invalid response (${resp.status}). Make sure the backend server is running.`,
        );
      }

      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || 'Scan failed');
      onScanComplete(json.data);
      navigate('/scan-result');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="free-audit-try"
      className="scoring-section"
      style={{ borderTop: '1px solid var(--lp-border-subtle)', paddingTop: '100px' }}
    >
      <span
        className="section-eyebrow"
        style={{
          textTransform: 'uppercase',
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--lp-accent)',
          letterSpacing: '0.05em',
          display: 'block',
          textAlign: 'center',
          marginBottom: 8,
        }}
      >
        Try it free, no signup
      </span>
      <h2 className="section-title">Curious what the agent sees? Paste a URL.</h2>
      <p className="section-subtitle" style={{ maxWidth: '640px', margin: '0 auto 40px', textAlign: 'center' }}>
        Before you connect anything, drop in any website and the agent reads it like a strategist would. Your offer,
        your funnel, your tracking setup, your creative angles, and how you stack up, scored across six dimensions in
        under three minutes. It is free, it needs no account, and it is the fastest way to understand what having an
        agent actually feels like.
      </p>

      <div className="hero-input-wrapper" style={{ maxWidth: '640px', margin: '0 auto 48px' }}>
        <div className="hero-input-container">
          <Search className="input-icon" size={20} />
          <input
            type="text"
            className="hero-input"
            placeholder="Paste any website URL here..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuickScan()}
            disabled={loading}
          />
          <button className="hero-cta" onClick={handleQuickScan} disabled={loading || !url.trim()}>
            {loading ? <span className="spinner-inline"></span> : 'Get My Free Audit'}
          </button>
        </div>
        {error && <p className="hero-error">{error}</p>}
        <p className="hero-note" style={{ textAlign: 'center', marginTop: 12 }}>
          No signup. No ad account access. Your score in under 3 minutes.
        </p>
      </div>

      <div className="report-preview-section" style={{ padding: '0', background: 'transparent' }}>
        <div className="report-preview-container">
          <div className="report-tabs">
            {reportTabs.map((tab, i) => (
              <button
                key={i}
                className={`report-tab ${activeReportTab === i ? 'active' : ''}`}
                onClick={() => setActiveReportTab(i)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="report-tab-content">{reportTabs[activeReportTab].content}</div>
        </div>
      </div>
    </section>
  );
}
