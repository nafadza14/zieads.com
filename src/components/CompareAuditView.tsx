import { useState } from 'react';

const P = '#7B2FBE';
const G = '#64748b';
const D = '#1e293b';
const B = '#e2e8f0';

export default function CompareAuditView({ audits }: { audits: any[] }) {
  if (audits.length < 2) return null;

  const [audit1Idx, setAudit1Idx] = useState(1); // older
  const [audit2Idx, setAudit2Idx] = useState(0); // newer

  const a1 = audits[audit1Idx];
  const a2 = audits[audit2Idx];

  const getScoreColor = (s: number) => s >= 70 ? '#00c9a7' : s >= 50 ? '#f59e0b' : s > 0 ? '#dc2626' : G;
  const formatDate = (d: string) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  const getDelta = (s1: number, s2: number) => {
    const diff = s2 - s1;
    if (diff === 0) return <span style={{ color: G, fontSize: '0.85rem' }}>No change</span>;
    if (diff > 0) return <span style={{ color: '#00c9a7', fontWeight: 600, fontSize: '0.85rem' }}>+{diff} pts</span>;
    return <span style={{ color: '#dc2626', fontWeight: 600, fontSize: '0.85rem' }}>{diff} pts</span>;
  };

  const dimsList = ['creative', 'audience', 'landing', 'platform', 'funnel', 'competitive'];

  return (
    <div style={{ marginTop: 40 }}>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: D, marginBottom: 16 }}>Audit Comparison (Before & After)</h2>
      
      <div style={{ background: '#fff', border: `1px solid ${B}`, borderRadius: 12, padding: 24, marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
          {/* Selectors */}
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: G, marginBottom: 8 }}>Older Audit (Before)</label>
            <select value={audit1Idx} onChange={(e) => setAudit1Idx(Number(e.target.value))} style={{ width: '100%', padding: '8px 12px', border: `1px solid ${B}`, borderRadius: 6 }}>
              {audits.map((a, i) => (
                <option key={i} value={i}>{formatDate(a.created_at)} — Score: {a.overall_score}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: G, marginBottom: 8 }}>Newer Audit (After)</label>
            <select value={audit2Idx} onChange={(e) => setAudit2Idx(Number(e.target.value))} style={{ width: '100%', padding: '8px 12px', border: `1px solid ${B}`, borderRadius: 6 }}>
              {audits.map((a, i) => (
                <option key={i} value={i}>{formatDate(a.created_at)} — Score: {a.overall_score}</option>
              ))}
            </select>
          </div>
        </div>

        {a1 && a2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: 16 }}>
            {/* Header */}
            <div style={{ paddingBottom: 12, borderBottom: `1px solid ${B}` }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: D }}>{a1.overall_score}</div>
              <div style={{ fontSize: '0.85rem', color: G }}>Overall Score ({formatDate(a1.created_at)})</div>
            </div>
            <div style={{ paddingBottom: 12, borderBottom: `1px solid ${B}` }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: D }}>{a2.overall_score}</div>
              <div style={{ fontSize: '0.85rem', color: G }}>Overall Score ({formatDate(a2.created_at)})</div>
            </div>
            <div style={{ paddingBottom: 12, borderBottom: `1px solid ${B}`, display: 'flex', alignItems: 'flex-end', paddingLeft: 12 }}>
              <div style={{ fontSize: '1rem', fontWeight: 700 }}>{getDelta(a1.overall_score, a2.overall_score)}</div>
            </div>

            {/* Dimensional Rows */}
            {dimsList.map(dKey => {
              const d1 = a1.dimensions?.[dKey] || { score: 0 };
              const d2 = a2.dimensions?.[dKey] || { score: 0 };
              return (
                <div key={dKey} style={{ display: 'contents' }}>
                  <div style={{ padding: '12px 0', borderBottom: `1px solid ${B}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.85rem', color: D, textTransform: 'capitalize' }}>{dKey}</span>
                      <span style={{ fontWeight: 600, color: getScoreColor(d1.score) }}>{d1.score}</span>
                    </div>
                  </div>
                  <div style={{ padding: '12px 0', borderBottom: `1px solid ${B}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.85rem', color: D, textTransform: 'capitalize' }}>{dKey}</span>
                      <span style={{ fontWeight: 600, color: getScoreColor(d2.score) }}>{d2.score}</span>
                    </div>
                  </div>
                  <div style={{ padding: '12px 0', borderBottom: `1px solid ${B}`, display: 'flex', alignItems: 'center', paddingLeft: 12 }}>
                    {getDelta(d1.score, d2.score)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
