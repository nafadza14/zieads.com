import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2, Search, ShieldCheck } from 'lucide-react';
import '../../audit-flow.css';
import { reportTabs } from '../data';
import { AnimatedHeading, CountUp, Reveal, Section, TextRollButton } from '../ui';
import { AuditScanVisual, AuditFindingsVisual } from '../visuals';
import { Collage } from '../collage';
import { PHOTOS } from '../images';

const SCAN_STEPS = [
  'Opening your website',
  'Reading your offer and headline',
  'Checking tracking pixels',
  'Reviewing landing page speed and trust',
  'Scoring your ads readiness',
];

/** Live checklist shown while the quick scan runs */
function ScanSteps({ url }: { url: string }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setStep((s) => Math.min(s + 1, SCAN_STEPS.length - 1)), 1600);
    return () => window.clearInterval(t);
  }, []);
  const pct = Math.round(((step + 1) / SCAN_STEPS.length) * 92);
  return (
    <div className="zf-scan" role="status" aria-live="polite">
      <div className="zf-scan-head">
        <span className="zf-orb is-active">
          <span className="zf-orb-core">
            <Search size={13} />
          </span>
        </span>
        <span>
          <strong>Scanning {url.replace(/^https?:\/\//, '')}</strong>
          <small>{pct}% done</small>
        </span>
      </div>
      <div className="zf-bar">
        <div className="zf-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <ul>
        {SCAN_STEPS.map((label, i) => (
          <li key={label} className={i < step ? 'is-done' : i === step ? 'is-now' : ''}>
            <span className="zf-scan-dot">{i < step ? <Check size={11} /> : i === step ? <Loader2 size={11} className="zf-spin" /> : null}</span>
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

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
    <Section id="free-audit-try" number="01" label="Free Website Audit" tone="white">
      <AnimatedHeading text="Get a free AI marketing audit of your website in under 3 minutes." />

      <div className="zx-split zx-split-media-right">
        <div className="zx-split-copy">
          <Reveal delay={80}>
            <p className="zx-lead">
              Paste any URL and the ZieAds AI agent reviews it the way a senior strategist would. It checks your offer,
              landing page, tracking pixels, funnel and creative angles, then scores your paid ads readiness across six
              dimensions.
            </p>
          </Reveal>

          <Reveal delay={160}>
            <form
              className="zx-url-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleQuickScan();
              }}
            >
              <Search size={18} className="zx-url-icon" />
              <input
                type="text"
                inputMode="url"
                aria-label="Website URL"
                placeholder="yourbrand.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
              />
              <TextRollButton
                type="submit"
                text={loading ? 'Scanning...' : 'Run free audit'}
                disabled={loading || !url.trim()}
              />
            </form>
            {loading && <ScanSteps url={url} />}
            {error && <p className="zx-form-error">{error}</p>}
            <p className="zx-form-note">
              <ShieldCheck size={14} /> No signup. No credit card. No ad account access.
            </p>
          </Reveal>

          <div className="zx-card-small">
            <AuditFindingsVisual />
          </div>
        </div>

        <Collage
          photo={PHOTOS.audit}
          photoAlt="Marketer reviewing website analytics on a laptop"
          layout="right"
          ratio="4 / 5"
          front={<AuditScanVisual />}
        />
      </div>

      <Reveal className="zx-report-card" delay={100}>
        <div className="zx-report-head">
          <span className="zx-eyebrow">Sample audit report</span>
          <div className="zx-tabs" role="tablist">
            {reportTabs.map((tab, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={activeReportTab === i}
                className={`zx-tab ${activeReportTab === i ? 'is-active' : ''}`}
                onClick={() => setActiveReportTab(i)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="zx-report-body" key={activeReportTab}>
          <div className="zx-tab-panel">{reportTabs[activeReportTab].content}</div>
        </div>
      </Reveal>
    </Section>
  );
}
