import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ZieAdsLogo from '../components/ZieAdsLogo';

interface Props {
  scanData?: any;
  onComplete: (ctx: any) => void;
}

const BUSINESS_TYPES = ['E-commerce', 'SaaS', 'Local Business', 'B2B Lead Gen', 'Creator', 'Other'];
const GOALS = ['Drive sales', 'Generate leads', 'App installs', 'Brand awareness', 'Event registrations'];
const BUDGETS = ['Under $1K', '$1K to $5K', '$5K to $20K', '$20K to $100K', 'Over $100K'];
const PLATFORMS = ['Meta', 'Google', 'TikTok', 'LinkedIn', 'YouTube'];

// SVG icons for agents
const agentIcons: Record<string, React.ReactNode> = {
  creative: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="12" r="1.5" fill="currentColor"/><circle cx="15.5" cy="10" r="1.5" fill="currentColor"/><circle cx="15" cy="14.5" r="1.5" fill="currentColor"/><path d="M9 17c1-1 3-1.5 5-.5"/></svg>,
  audience: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  competitive: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
  platform: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  funnel: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>,
};

import { supabase } from '../lib/supabaseClient';

export default function OnboardingWizard({ scanData, onComplete }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const stateUrl = location.state?.url || '';
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    businessName: scanData?.businessName || '',
    url: stateUrl || scanData?.url || '',
    businessType: scanData?.businessType || '',
    primaryGoal: '',
    monthlyBudget: '',
    platforms: [] as string[],
    challenge: '',
  });

  const togglePlatform = (p: string) => {
    setForm(prev => ({
      ...prev,
      platforms: prev.platforms.includes(p)
        ? prev.platforms.filter(x => x !== p)
        : [...prev.platforms, p],
    }));
  };

  const handleComplete = async () => {
    onComplete(form);
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (token) {
        const res = await fetch('/api/profile', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(form)
        });
        if (res.ok) setSaved(true);
      }
    } catch (e) {
      console.warn('Failed to save profile on onboarding', e);
    }
    setLoading(false);
    await new Promise(r => setTimeout(r, 1400));
    navigate('/audit/progress');
  };

  return (
    <div className="onboarding-page">
      <nav className="navbar">
        <div className="nav-inner">
          <div className="nav-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <ZieAdsLogo size={36} />
            <span className="brand-name">zieads</span>
          </div>
        </div>
      </nav>

      <div className="wizard-container">
        {/* Progress */}
        <div className="wizard-progress">
          {[1, 2, 3].map(s => (
            <div key={s} className={`progress-step ${s <= step ? 'active' : ''} ${s < step ? 'done' : ''}`}>
              <div className="progress-dot">{s < step ? '✓' : s}</div>
              <span>{s === 1 ? 'Business' : s === 2 ? 'Budget' : 'Preview'}</span>
            </div>
          ))}
          <div className="progress-line">
            <div className="progress-fill" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
          </div>
        </div>

        {/* Step 1: Business Context */}
        {step === 1 && (
          <div className="wizard-step">
            <h2>Tell us about your business</h2>
            <p className="step-desc">This helps our agents personalize the analysis.</p>

            <div className="field">
              <label>Business Name</label>
              <input
                type="text"
                value={form.businessName}
                onChange={e => setForm(p => ({ ...p, businessName: e.target.value }))}
                placeholder="Your business name"
              />
            </div>

            <div className="field">
              <label>Website URL</label>
              <input
                type="text"
                value={form.url}
                onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
                placeholder="https://example.com"
              />
            </div>

            <div className="field">
              <label>Business Type</label>
              <div className="option-grid">
                {BUSINESS_TYPES.map(t => (
                  <button
                    key={t}
                    className={`option-btn ${form.businessType === t ? 'selected' : ''}`}
                    onClick={() => setForm(p => ({ ...p, businessType: t }))}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label>Primary Advertising Goal</label>
              <div className="option-grid">
                {GOALS.map(g => (
                  <button
                    key={g}
                    className={`option-btn ${form.primaryGoal === g ? 'selected' : ''}`}
                    onClick={() => setForm(p => ({ ...p, primaryGoal: g }))}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="wizard-next"
              onClick={() => setStep(2)}
              disabled={!form.url || !form.businessType || !form.primaryGoal}
            >
              Continue
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" style={{ marginLeft: 6 }}><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
            </button>
          </div>
        )}

        {/* Step 2: Budget & Platforms */}
        {step === 2 && (
          <div className="wizard-step">
            <h2>Budget & Platform Context</h2>
            <p className="step-desc">Help us calibrate recommendations to your scale.</p>

            <div className="field">
              <label>Monthly Ads Budget</label>
              <div className="option-grid">
                {BUDGETS.map(b => (
                  <button
                    key={b}
                    className={`option-btn ${form.monthlyBudget === b ? 'selected' : ''}`}
                    onClick={() => setForm(p => ({ ...p, monthlyBudget: b }))}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label>Platforms Currently Using</label>
              <div className="option-grid">
                {PLATFORMS.map(p => (
                  <button
                    key={p}
                    className={`option-btn ${form.platforms.includes(p) ? 'selected' : ''}`}
                    onClick={() => togglePlatform(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label>Biggest Challenge (Optional)</label>
              <textarea
                value={form.challenge}
                onChange={e => setForm(p => ({ ...p, challenge: e.target.value }))}
                placeholder="What's your #1 frustration with your ads right now?"
                rows={3}
              />
            </div>

            <div className="wizard-buttons">
              <button className="wizard-back" onClick={() => setStep(1)}>Back</button>
              <button className="wizard-next" onClick={() => setStep(3)} disabled={!form.monthlyBudget}>
                Continue
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" style={{ marginLeft: 6 }}><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 3 && (
          <div className="wizard-step">
            <h2>Ready to Launch Your Audit</h2>
            <p className="step-desc">Here's what 5 AI agents will analyze in under 3 minutes.</p>

            <div className="preview-summary">
              <div className="preview-item">
                <strong>Business:</strong> {form.businessName || 'Your business'}
              </div>
              <div className="preview-item">
                <strong>URL:</strong> {form.url}
              </div>
              <div className="preview-item">
                <strong>Type:</strong> {form.businessType}
              </div>
              <div className="preview-item">
                <strong>Goal:</strong> {form.primaryGoal}
              </div>
              <div className="preview-item">
                <strong>Budget:</strong> {form.monthlyBudget}
              </div>
            </div>

            <div className="preview-agents">
              <h3>What the full audit produces:</h3>
              <div className="preview-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 200px', gap: '32px', alignItems: 'center' }}>
                <div className="preview-agent-list">
                  {[
                    { key: 'creative', name: 'Creative Intelligence', time: '~30s' },
                    { key: 'audience', name: 'Audience & Targeting', time: '~30s' },
                    { key: 'competitive', name: 'Competitive Intelligence', time: '~30s' },
                    { key: 'platform', name: 'Platform & Budget', time: '~30s' },
                    { key: 'funnel', name: 'Funnel & Conversion', time: '~30s' },
                  ].map((a, i) => (
                    <div key={i} className="preview-agent-row">
                      <span className="pa-icon" style={{ color: '#7B2FBE' }}>{agentIcons[a.key]}</span>
                      <span className="pa-name">{a.name}</span>
                      <span className="pa-time">{a.time}</span>
                    </div>
                  ))}
                </div>
                
                <div className="pdf-preview-box">
                  <div className="pdf-page">
                    <div className="pdf-header">ZieAds Audit Report</div>
                    <div className="pdf-body">
                      <div className="pdf-skeleton"></div>
                      <div className="pdf-skeleton-short"></div>
                      <div className="pdf-cards">
                        <div className="pdf-card"></div>
                        <div className="pdf-card"></div>
                      </div>
                    </div>
                  </div>
                  <p>Includes full PDF export with agency white-labeling.</p>
                </div>
              </div>
            </div>

            {saved && (
              <div style={{ margin: '0 0 16px', padding: '12px 16px', background: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: 8, fontSize: '0.9rem', color: '#065f46', fontWeight: 500 }}>
                ZieAds AI is now configured for <strong>{form.businessName || 'your business'}</strong>. We've stored your business context and all future analysis will be personalized to you.
              </div>
            )}

            <div className="wizard-buttons">
              <button className="wizard-back" onClick={() => setStep(2)}>Back</button>
              <button className="wizard-launch" onClick={handleComplete}>
                Run My First Full Audit
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20" style={{ marginLeft: 8 }}><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
