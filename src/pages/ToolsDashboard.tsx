import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ZieAdsLogo from '../components/ZieAdsLogo';

const SKILL_CATEGORIES = [
  {
    category: 'Core Pipeline',
    skills: [
      { id: 'audit', name: 'Full Strategy Audit', desc: '5 parallel agents · 3 min', command: '/ads audit', fixes: 'All 6 dimensions' },
      { id: 'quick', name: 'Quick Scan Snapshot', desc: '60-second ads readiness', command: '/ads quick', fixes: 'Overview only' },
    ]
  },
  {
    category: 'Creative & Content',
    skills: [
      { id: 'creatives', name: 'Ad Creative Briefs', desc: 'Generate briefs for all platforms', command: '/ads creatives', fixes: 'Creative & Offer' },
      { id: 'copy', name: 'Ad Copy Generation', desc: 'Platform-specific text and CTAs', command: '/ads copy', fixes: 'Creative & Offer' },
      { id: 'landing', name: 'Landing Page CRO', desc: 'Audit destination pages', command: '/ads landing', fixes: 'Conversion' },
      { id: 'audiences', name: 'Audience Targeting', desc: 'ICP & platform matrices', command: '/ads audiences', fixes: 'Audience Clarity' },
    ]
  },
  {
    category: 'Strategy & Intelligence',
    skills: [
      { id: 'competitors', name: 'Competitive Intel', desc: 'Ad presence mapping', command: '/ads competitors', fixes: 'Positioning' },
      { id: 'funnel', name: 'Funnel Architecture', desc: 'TOFU/MOFU/BOFU routing', command: '/ads funnel', fixes: 'Funnel Coverage' },
      { id: 'budget', name: 'Budget Allocation', desc: 'Media mix modeling', command: '/ads budget', fixes: 'Platform Fit' },
    ]
  },
  {
    category: 'Platform Deep-Dives',
    skills: [
      { id: 'google', name: 'Google Ads Strategy', desc: 'Search, Shopping, Display', command: '/ads google', fixes: 'Platform Fit' },
      { id: 'meta', name: 'Meta Ads Strategy', desc: 'Facebook, Instagram Reels', command: '/ads meta', fixes: 'Platform Fit' },
      { id: 'tiktok', name: 'TikTok Ads Strategy', desc: 'UGC & spark ads focus', command: '/ads tiktok', fixes: 'Creative & Offer' },
      { id: 'linkedin', name: 'LinkedIn B2B Strategy', desc: 'Account-based marketing', command: '/ads linkedin', fixes: 'Platform Fit' },
    ]
  },
  {
    category: 'Export & Reporting',
    skills: [
      { id: 'report', name: 'Markdown Strategy', desc: 'Standard text export', command: '/ads report', fixes: '—' },
      { id: 'report-pdf', name: 'White-Label PDF', desc: 'Professional agency deck', command: '/ads report-pdf', fixes: '—' },
    ]
  }
];

export default function ToolsDashboard() {
  const navigate = useNavigate();
  const [globalUrl, setGlobalUrl] = useState('');
  const [runningSkill, setRunningSkill] = useState<string | null>(null);
  const [skillResult, setSkillResult] = useState<any>(null);

  const handleRunSkill = async (skillId: string) => {
    if (!globalUrl) {
      alert('Please enter a target URL first.');
      return;
    }
    
    // Core pipeline reroute
    if (skillId === 'audit') {
      navigate('/onboarding');
      return;
    }
    if (skillId === 'quick') {
      navigate('/');
      return;
    }

    setRunningSkill(skillId);
    setSkillResult(null);
    try {
      const resp = await fetch(`/api/skill/${skillId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: globalUrl }),
      });
      const json = await resp.json();
      if (resp.ok && json.data) {
        setSkillResult({ skillId, data: json.data });
      } else {
        alert('Skill execution failed. Please check backend.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to connect to the skill server.');
    } finally {
      setRunningSkill(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <nav className="navbar" style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => navigate('/clients')}>
          <ZieAdsLogo size={28} />
          <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#1e293b' }}>
            zieads <span style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: 6, color: '#64748b' }}>AGENCY</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-get-started" onClick={() => navigate('/clients')} style={{ background: '#fff', color: '#1e293b', border: '1px solid #cbd5e1' }}>Back to Portfolio</button>
        </div>
      </nav>

      <main style={{ maxWidth: 1200, margin: '40px auto', padding: '0 24px' }}>
        <div style={{ marginBottom: 40, textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.5rem', color: '#0f172a', marginBottom: 16 }}>All Features Command Center</h1>
          <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: 600, margin: '0 auto 24px' }}>
            Run any of the 15 specialized PRD AI skills instantly on a target URL.
          </p>
          
          <div style={{ display: 'flex', gap: 12, maxWidth: 640, margin: '0 auto', background: '#fff', padding: 8, borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
            <input 
              type="url" 
              placeholder="https://example-client.com"
              value={globalUrl}
              onChange={(e) => setGlobalUrl(e.target.value)}
              style={{ flex: 1, padding: '12px 16px', fontSize: '1.05rem', border: 'none', outline: 'none', background: 'transparent' }}
            />
          </div>
        </div>

        {skillResult && (
          <div style={{ marginBottom: 40, padding: 24, background: '#1e293b', color: '#fff', borderRadius: 16, border: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: '#38bdf8' }}>Result: {SKILL_CATEGORIES.flatMap(c => c.skills).find(s => s.id === skillResult.skillId)?.name}</h3>
              <button onClick={() => setSkillResult(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>Close ✕</button>
            </div>
            <pre style={{ margin: 0, padding: 16, background: '#0f172a', borderRadius: 8, fontSize: '0.9rem', overflow: 'auto', maxHeight: 400 }}>
              {JSON.stringify(skillResult.data.deliverables, null, 2)}
            </pre>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>
          {SKILL_CATEGORIES.map((category, i) => (
            <div key={i}>
              <h3 style={{ fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: 16 }}>
                {category.category}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {category.skills.map(skill => (
                  <div key={skill.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }} onMouseOver={(e) => e.currentTarget.style.borderColor = '#cbd5e1'} onMouseOut={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <strong style={{ display: 'block', fontSize: '1.05rem', color: '#0f172a', marginBottom: 4 }}>{skill.name}</strong>
                        <code style={{ fontSize: '0.75rem', color: '#7B2FBE', background: '#f3e8ff', padding: '2px 6px', borderRadius: 4 }}>{skill.command}</code>
                      </div>
                      <button 
                        onClick={() => handleRunSkill(skill.id)}
                        disabled={runningSkill === skill.id}
                        style={{ padding: '6px 16px', background: runningSkill === skill.id ? '#e2e8f0' : '#7B2FBE', color: runningSkill === skill.id ? '#64748b' : '#fff', border: 'none', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600, cursor: runningSkill === skill.id ? 'not-allowed' : 'pointer' }}
                      >
                        {runningSkill === skill.id ? 'Running...' : 'Run'}
                      </button>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '12px 0 0 0' }}>{skill.desc}</p>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 8, borderTop: '1px solid #f1f5f9', paddingTop: 8 }}>
                      Fixes: <strong>{skill.fixes}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
