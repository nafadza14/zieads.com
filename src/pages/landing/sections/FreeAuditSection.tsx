import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShieldCheck } from 'lucide-react';
import { reportTabs } from '../data';
import { IMG } from '../images';
import { AnimatedHeading, CountUp, ImageCard, Reveal, Section, TextRollButton } from '../ui';

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
            {error && <p className="zx-form-error">{error}</p>}
            <p className="zx-form-note">
              <ShieldCheck size={14} /> No signup. No credit card. No ad account access.
            </p>
          </Reveal>

          <ImageCard src={IMG.auditSmall} alt="Marketer reviewing a website audit on a laptop" ratio="16 / 10" className="zx-card-small" delay={200} />
        </div>

        <ImageCard src={IMG.auditMain} alt="Analytics dashboard showing a paid ads readiness score" ratio="4 / 5" delay={120}>
          <div className="zx-float-chip zx-float-bottom-left">
            <span className="zx-chip-label">Readiness score</span>
            <span className="zx-chip-value">
              <CountUp to={61} />
              <small>/100</small>
            </span>
          </div>
          <div className="zx-float-chip zx-float-top-right zx-chip-dark">6 dimensions scored</div>
        </ImageCard>
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
