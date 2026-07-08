import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const P = 'var(--primary)';
const PL = 'var(--primary-bg)';
const G = 'var(--text-muted)';
const D = 'var(--text)';
const B = 'var(--border)';

const BUSINESS_TYPES = ['E-commerce', 'SaaS', 'Local Business', 'B2B Lead Gen', 'Creator', 'Other'];
const GOALS = ['Drive sales', 'Generate leads', 'App installs', 'Brand awareness', 'Event registrations'];
const BUDGETS = ['Under $1K', '$1K to $5K', '$5K to $20K', '$20K to $100K', 'Over $100K'];
const PLATFORMS = ['Meta', 'Google', 'TikTok', 'LinkedIn', 'YouTube'];

const ROLES = ['Founder / CEO', 'Marketing Manager', 'Agency Owner / Freelancer', 'Creator', 'Other'];
const ONBOARDING_GOALS = ['Improve ROAS / CPA', 'Scale ad spend budget', 'Generate high quality leads', 'Optimize landing page CRO', 'Research competitors ads', 'Write high converting copy', 'Structure full funnel strategy'];
const ONBOARDING_TOOLS = ['Meta Ads', 'Google Ads', 'TikTok Ads', 'Google Analytics', 'Shopify', 'HubSpot', 'Klaviyo', 'Excel / Sheets'];

export default function BusinessProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    businessName: '',
    primaryUrl: '',
    businessType: '',
    primaryGoal: '',
    monthlyBudget: '',
    platforms: [] as string[],
    challenge: '',
    // Onboarding context fields
    role: '',
    goals: [] as string[],
    currentTools: [] as string[],
    platformsInFocus: [] as string[],
  });

  const getAuthHeaders = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    return token
      ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };
  };

  useEffect(() => {
    const load = async () => {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/profile', { headers });
      const j = await res.json();
      if (j.data) {
        const p = j.data;
        setForm({
          businessName:  p.business_name  || '',
          primaryUrl:    p.primary_url    || '',
          businessType:  p.business_type  || '',
          primaryGoal:   p.primary_goal   || '',
          monthlyBudget: p.monthly_budget || '',
          platforms:     p.platforms      || [],
          challenge:     p.challenge      || '',
          role:          p.role           || '',
          goals:         p.goals          || [],
          currentTools:  p.current_tools  || [],
          platformsInFocus: p.platforms_in_focus || [],
        });
      }
      setLoading(false);
    };
    load();
  }, []);

  const togglePlatform = (pl: string) => {
    setForm(prev => ({
      ...prev,
      platforms: prev.platforms.includes(pl)
        ? prev.platforms.filter(x => x !== pl)
        : [...prev.platforms, pl],
    }));
  };

  const toggleGoal = (g: string) => {
    setForm(prev => ({
      ...prev,
      goals: prev.goals.includes(g)
        ? prev.goals.filter(x => x !== g)
        : [...prev.goals, g],
    }));
  };

  const toggleTool = (t: string) => {
    setForm(prev => ({
      ...prev,
      currentTools: prev.currentTools.includes(t)
        ? prev.currentTools.filter(x => x !== t)
        : [...prev.currentTools, t],
    }));
  };

  const togglePlatformInFocus = (pl: string) => {
    setForm(prev => ({
      ...prev,
      platformsInFocus: prev.platformsInFocus.includes(pl)
        ? prev.platformsInFocus.filter(x => x !== pl)
        : [...prev.platformsInFocus, pl],
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers,
        body: JSON.stringify(form),
      });
      if (res.ok) setSaved(true);
    } catch {
      alert('Network error while saving profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: G }}>
        Loading profile...
      </div>
    );
  }

  const pillBtn = (active: boolean) => ({
    padding: '8px 16px',
    borderRadius: 9999,
    border: `1px solid ${active ? P : B}`,
    background: active ? PL : '#fff',
    color: active ? P : D,
    fontWeight: active ? 600 : 400,
    cursor: 'pointer' as const,
    fontSize: '0.85rem',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-soft)', color: 'var(--text)' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${B}`, padding: '14px 40px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={() => navigate('/clients')}
          style={{ background: 'none', border: 'none', color: G, cursor: 'pointer', fontSize: '0.88rem', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
        >
          ← Dashboard
        </button>
        <div style={{ width: 1, height: 20, background: B }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: D }}>Business Profile</div>
          <div style={{ fontSize: '0.73rem', color: G }}>This context is used by all AI agents and skill reports</div>
        </div>
      </div>

      {/* Form */}
      <div style={{ maxWidth: 720, margin: '40px auto', padding: '0 24px 60px' }}>
        {saved && (
          <div style={{ marginBottom: 20, padding: '12px 16px', background: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: 8, fontSize: '0.9rem', color: '#065f46', fontWeight: 500 }}>
            Profile saved. All future AI analysis will use this updated context.
          </div>
        )}

        <form onSubmit={handleSave}>
          {/* Business Basics */}
          <div style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 8, padding: 28, marginBottom: 20 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: D, margin: '0 0 20px' }}>Business Basics</h2>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: D, marginBottom: 6 }}>Business Name</label>
              <input
                value={form.businessName}
                onChange={e => setForm(p => ({ ...p, businessName: e.target.value }))}
                placeholder="Acme Corp"
                style={{ width: '100%', padding: '10px 14px', border: `1px solid ${B}`, borderRadius: 6, fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: D, marginBottom: 6 }}>Website URL</label>
              <input
                type="url"
                value={form.primaryUrl}
                onChange={e => setForm(p => ({ ...p, primaryUrl: e.target.value }))}
                placeholder="https://example.com"
                style={{ width: '100%', padding: '10px 14px', border: `1px solid ${B}`, borderRadius: 6, fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: D, marginBottom: 8 }}>Business Type</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {BUSINESS_TYPES.map(t => (
                  <button key={t} type="button" onClick={() => setForm(p => ({ ...p, businessType: t }))} style={pillBtn(form.businessType === t)}>{t}</button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: D, marginBottom: 8 }}>Primary Advertising Goal</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {GOALS.map(g => (
                  <button key={g} type="button" onClick={() => setForm(p => ({ ...p, primaryGoal: g }))} style={pillBtn(form.primaryGoal === g)}>{g}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Budget & Platforms */}
          <div style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 8, padding: 28, marginBottom: 20 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: D, margin: '0 0 20px' }}>Budget & Platforms</h2>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: D, marginBottom: 8 }}>Monthly Ads Budget</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {BUDGETS.map(b => (
                  <button key={b} type="button" onClick={() => setForm(p => ({ ...p, monthlyBudget: b }))} style={pillBtn(form.monthlyBudget === b)}>{b}</button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: D, marginBottom: 8 }}>Active Platforms</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {PLATFORMS.map(pl => (
                  <button key={pl} type="button" onClick={() => togglePlatform(pl)} style={pillBtn(form.platforms.includes(pl))}>{pl}</button>
                ))}
              </div>
            </div>
          </div>

          {/* AI Onboarding Context */}
          <div style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 8, padding: 28, marginBottom: 20 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: D, margin: '0 0 20px' }}>AI Context & Onboarding Profile</h2>

            {/* Role */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: D, marginBottom: 8 }}>Your Role in the Business</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ROLES.map(r => (
                  <button key={r} type="button" onClick={() => setForm(p => ({ ...p, role: r }))} style={pillBtn(form.role === r)}>{r}</button>
                ))}
              </div>
            </div>

            {/* Goals */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: D, marginBottom: 8 }}>Strategic Marketing Goals (Multi-select)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ONBOARDING_GOALS.map(g => (
                  <button key={g} type="button" onClick={() => toggleGoal(g)} style={pillBtn(form.goals.includes(g))}>{g}</button>
                ))}
              </div>
            </div>

            {/* Current Tools */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: D, marginBottom: 8 }}>Active Marketing Stack Tools (Multi-select)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ONBOARDING_TOOLS.map(t => (
                  <button key={t} type="button" onClick={() => toggleTool(t)} style={pillBtn(form.currentTools.includes(t))}>{t}</button>
                ))}
              </div>
            </div>

            {/* Platforms in Focus */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: D, marginBottom: 8 }}>Marketing Channels in Focus (Multi-select)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {PLATFORMS.map(pl => (
                  <button key={pl} type="button" onClick={() => togglePlatformInFocus(pl)} style={pillBtn(form.platformsInFocus.includes(pl))}>{pl}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Challenge */}
          <div style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 8, padding: 28, marginBottom: 24 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: D, margin: '0 0 6px' }}>Your Biggest Challenge</h2>
            <p style={{ fontSize: '0.83rem', color: G, margin: '0 0 12px' }}>The AI agent uses this to frame analysis around your specific pain point.</p>
            <textarea
              value={form.challenge}
              onChange={e => setForm(p => ({ ...p, challenge: e.target.value }))}
              placeholder="e.g. My ROAS keeps dropping after 7 days of a new campaign..."
              rows={3}
              style={{ width: '100%', padding: '10px 14px', border: `1px solid ${B}`, borderRadius: 6, fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{ background: saving ? '#e2e8f0' : P, color: saving ? G : '#fff', border: 'none', padding: '12px 28px', borderRadius: 6, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.95rem', fontFamily: 'inherit' }}
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
