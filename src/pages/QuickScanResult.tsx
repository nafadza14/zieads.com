import React from 'react';
import { useNavigate } from 'react-router-dom';
import ZieAdsLogo from '../components/ZieAdsLogo';

interface Props {
  scanData: any;
  onStartFullAudit: (ctx: any) => void;
}

// SVG signal icons
const IconPass = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#00c9a7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
    <circle cx="12" cy="12" r="10" /><path d="M9 12l2 2 4-4" />
  </svg>
);
const IconWarn = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const IconFail = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#e8457a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
    <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);
const IconTip = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#00c9a7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }}>
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

export default function QuickScanResult({ scanData, onStartFullAudit }: Props) {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');

  if (!scanData) {
    navigate('/');
    return null;
  }

  const { url, businessName, businessType, score, findings, signals } = scanData;

  const getScoreColor = (s: number) => {
    if (s >= 80) return '#00c9a7';
    if (s >= 65) return '#5c8aff';
    if (s >= 50) return '#f59e0b';
    if (s >= 35) return '#e8457a';
    return '#e03131';
  };

  const getGrade = (s: number) => {
    if (s >= 80) return 'A';
    if (s >= 65) return 'B';
    if (s >= 50) return 'C';
    if (s >= 35) return 'D';
    return 'F';
  };

  const handleRunFullAudit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartFullAudit({ url, businessName, businessType });
    navigate('/sign-up', { state: { email, from: '/onboarding' } });
  };

  return (
    <div className="scan-result-page">
      <nav className="navbar">
        <div className="nav-inner">
          <div className="nav-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <ZieAdsLogo size={36} />
            <span className="brand-name">zieads</span>
          </div>
        </div>
      </nav>

      <div className="scan-result-container">
        {/* Score Header */}
        <div className="score-hero">
          <div className="score-circle" style={{ borderColor: getScoreColor(score) }}>
            <span className="score-value" style={{ color: getScoreColor(score) }}>{score}</span>
            <span className="score-max">/100</span>
          </div>
          <div className="score-grade" style={{ backgroundColor: getScoreColor(score) }}>
            Grade {getGrade(score)}
          </div>
          <h1 className="score-headline">
            {score >= 65 ? 'Your ads setup is looking good' :
             score >= 50 ? 'Your ads setup has some gaps' :
             'Your ads setup has significant gaps'}
          </h1>
          <p className="score-url">{businessName || url}</p>
          <span className="score-type-badge">{businessType}</span>
        </div>

        {/* Signals Grid */}
        <div className="signals-grid">
          {Object.entries(signals).map(([name, signal]: [string, any]) => (
            <div key={name} className={`signal-card ${signal.score >= 8 ? 'signal-pass' : signal.score >= 5 ? 'signal-warn' : 'signal-fail'}`}>
              <div className="signal-indicator">
                {signal.score >= 8 ? <IconPass /> : signal.score >= 5 ? <IconWarn /> : <IconFail />}
              </div>
              <div className="signal-info">
                <h4>{name}</h4>
                <p>{signal.status}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Findings */}
        <div className="scan-findings">
          <h2>Critical Findings</h2>
          {findings.slice(0, 3).map((f: any, i: number) => (
            <div key={i} className={`finding-card finding-${f.severity}`}>
              <div className="finding-header">
                <div className="finding-title-group">
                  <span className="finding-badge">{f.severity.toUpperCase()}</span>
                  <div className="finding-content">
                    <h4>{f.title}</h4>
                  </div>
                </div>
              </div>
              <p className="finding-impact">{f.impact}</p>
              <div className="finding-rec">
                <IconTip />
                <span>{f.recommendation}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Blurred Teaser */}
        <div className="blurred-teaser">
          <div className="blurred-content">
            <div className="blur-finding"></div>
            <div className="blur-finding"></div>
            <div className="blur-finding"></div>
          </div>
          <div className="blur-overlay">
            <h3>5 more critical findings found. Unlock to see</h3>
            <p>Enter your email to save your results and run your first full audit free.</p>
            <form onSubmit={handleRunFullAudit} className="email-capture-form">
              <input 
                type="email" 
                placeholder="you@agency.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="email-input"
              />
              <button type="submit" className="unlock-cta">
                Unlock Full Strategy
                <span className="btn-arrow-circle">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
                </span>
              </button>
            </form>
            <p style={{ marginTop: 16, fontSize: '0.85rem', color: '#64748b' }}>
              Want to scale operations? <a href="/pricing" style={{ color: '#7B2FBE', fontWeight: 600, textDecoration: 'none' }}>View Paid Plans</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
