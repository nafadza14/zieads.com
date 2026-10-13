import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckCircle2, Globe, Lightbulb, Lock, Mail, Sparkles, XCircle } from 'lucide-react';
import ZieAdsLogo from '../components/ZieAdsLogo';
import { TextRollButton } from './landing/ui';
import './audit-flow.css';

interface Props {
  scanData: any;
  onStartFullAudit: (ctx: any) => void;
}

const getTone = (s: number) => (s >= 80 ? 'good' : s >= 65 ? 'ok' : s >= 50 ? 'warn' : 'bad');
const TONE_COLOR: Record<string, string> = { good: '#16a34a', ok: '#f26522', warn: '#d97706', bad: '#dc2626' };

const getGrade = (s: number) => {
  if (s >= 80) return 'A';
  if (s >= 65) return 'B';
  if (s >= 50) return 'C';
  if (s >= 35) return 'D';
  return 'F';
};

const signalTone = (score: number) => (score >= 8 ? 'good' : score >= 5 ? 'warn' : 'bad');
const SignalIcon = ({ tone }: { tone: string }) =>
  tone === 'good' ? <CheckCircle2 size={18} /> : tone === 'warn' ? <AlertTriangle size={18} /> : <XCircle size={18} />;

/** Animated score ring */
function ScoreRing({ score }: { score: number }) {
  const [drawn, setDrawn] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now() + 150;
    const tick = (now: number) => {
      const t = Math.max(0, Math.min(1, (now - start) / 1400));
      setDrawn(score * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);
  const r = 70;
  const c = 2 * Math.PI * r;
  const color = TONE_COLOR[getTone(score)];
  return (
    <div className="zf-ring">
      <svg viewBox="0 0 160 160" width="168" height="168" aria-hidden="true">
        <circle cx="80" cy="80" r={r} fill="none" stroke="#f1ece8" strokeWidth="10" />
        <circle
          cx="80"
          cy="80"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * drawn) / 100}
          transform="rotate(-90 80 80)"
        />
      </svg>
      <div className="zf-ring-label">
        <strong>{Math.round(drawn)}</strong>
        <span>out of 100</span>
      </div>
    </div>
  );
}

export default function QuickScanResult({ scanData, onStartFullAudit }: Props) {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');

  useEffect(() => {
    if (!scanData) navigate('/');
  }, [scanData, navigate]);

  if (!scanData) return null;

  const { url, businessName, businessType, score, findings = [], signals = {} } = scanData;
  const tone = getTone(score);
  const signalList = Object.entries(signals) as [string, any][];
  const hidden = Math.max(0, findings.length - 3) || 5;

  const handleRunFullAudit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartFullAudit({ url, businessName, businessType });
    navigate('/sign-up', { state: { email, from: '/onboarding' } });
  };

  const headline =
    score >= 65 ? 'Your ads setup is in good shape.' : score >= 50 ? 'Your ads setup has a few gaps.' : 'Your ads setup has gaps worth fixing first.';

  return (
    <div className="zf-page">
      <div className="zf-bg" aria-hidden="true">
        <span />
        <span />
      </div>

      <header className="zf-top">
        <button className="zf-brand" onClick={() => navigate('/')} aria-label="ZieAds home">
          <ZieAdsLogo size={28} />
          <span>zieads</span>
        </button>
        <button className="zf-back" onClick={() => navigate('/')}>
          <ArrowLeft size={15} /> Scan another site
        </button>
      </header>

      <main className="zf-wrap">
        {/* Score hero */}
        <section className="zf-card zf-hero zf-rise">
          <ScoreRing score={score} />
          <div className="zf-hero-copy">
            <div className="zf-badge-row">
              <span className="zf-badge-num">01</span>
              <span className="zf-badge-label">Quick scan result</span>
            </div>
            <h1>{headline}</h1>
            <div className="zf-hero-meta">
              <span className={`zf-pill is-${tone}`}>Grade {getGrade(score)}</span>
              <span className="zf-pill">
                <Globe size={13} /> {businessName || url}
              </span>
              {businessType && <span className="zf-pill">{businessType}</span>}
            </div>
            <p>
              We checked {signalList.length || 'the key'} ads readiness signals on your site. Below are the ones to fix first, ranked by how much they
              cost you in wasted ad spend.
            </p>
          </div>
        </section>

        {/* Signals */}
        {signalList.length > 0 && (
          <section className="zf-block">
            <div className="zf-badge-row">
              <span className="zf-badge-num">02</span>
              <span className="zf-badge-label">Readiness signals</span>
            </div>
            <div className="zf-signals">
              {signalList.map(([name, signal], i) => {
                const t = signalTone(signal.score);
                return (
                  <div key={name} className={`zf-card zf-signal is-${t} zf-rise`} style={{ animationDelay: `${0.1 + i * 0.06}s` }}>
                    <span className="zf-signal-ico">
                      <SignalIcon tone={t} />
                    </span>
                    <div>
                      <h4>{name}</h4>
                      <p>{signal.status}</p>
                    </div>
                    <span className="zf-signal-score">{signal.score}/10</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Findings */}
        <section className="zf-block">
          <div className="zf-badge-row">
            <span className="zf-badge-num">03</span>
            <span className="zf-badge-label">Critical findings</span>
          </div>
          <div className="zf-findings">
            {findings.slice(0, 3).map((f: any, i: number) => (
              <article key={i} className="zf-card zf-finding zf-rise" style={{ animationDelay: `${0.15 + i * 0.08}s` }}>
                <div className="zf-finding-head">
                  <span className={`zf-sev is-${String(f.severity).toLowerCase()}`}>{f.severity}</span>
                  <h4>{f.title}</h4>
                </div>
                <p className="zf-finding-impact">{f.impact}</p>
                <div className="zf-fix">
                  <Lightbulb size={16} />
                  <span>
                    <strong>How to fix it</strong>
                    {f.recommendation}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Locked teaser */}
        <section className="zf-card zf-unlock zf-rise">
          <div className="zf-unlock-ghosts" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="zf-ghost">
                <i />
                <b />
                <b />
              </div>
            ))}
          </div>
          <div className="zf-unlock-body">
            <span className="zf-lock">
              <Lock size={18} />
            </span>
            <h3>{hidden} more findings are waiting in your full audit.</h3>
            <p>Save these results and run your first full AI audit free. Five specialist agents check creative, audience, competitors, budget and funnel.</p>
            <form onSubmit={handleRunFullAudit} className="zf-email">
              <label className="zf-email-field">
                <Mail size={16} />
                <input type="email" placeholder="you@company.com" required value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
              </label>
              <TextRollButton type="submit" text="Unlock full audit" />
            </form>
            <p className="zf-unlock-note">
              <Sparkles size={13} /> Free plan, no credit card. Need more?{' '}
              <a href="/#pricing" onClick={(e) => { e.preventDefault(); navigate('/#pricing'); }}>
                See paid plans
              </a>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
