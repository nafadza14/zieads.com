import { useEffect, useState } from 'react';

const P = '#7B2FBE';
const G = '#64748b';
const D = '#1e293b';
const B = '#e2e8f0';

export default function IndustryInsights({ latestScore }: { latestScore: number }) {
  const [data, setData] = useState<{ globalAverage: number; totalScanned: number } | null>(null);

  useEffect(() => {
    fetch('/api/benchmarks').then(r => r.json()).then(res => {
      if (res.success) setData(res.data);
    });
  }, []);

  if (!data) return null;

  const diff = latestScore - data.globalAverage;
  const percentileCalc = Math.min(99, Math.max(1, Math.round((latestScore / 100) * 100)));
  const isAbove = diff >= 0;

  return (
    <div style={{ marginTop: 40, marginBottom: 40 }}>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: D, marginBottom: 16 }}>Industry Insights</h2>
      
      <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: 12, padding: 32, color: 'white', display: 'flex', gap: 32, alignItems: 'center' }}>
        
        {/* Metric Block */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 12 }}>Your Percentile</div>
          <div style={{ fontSize: '3rem', fontWeight: 800, marginBottom: 8 }}>Top {100 - percentileCalc}%</div>
          <p style={{ fontSize: '0.95rem', color: '#cbd5e1', lineHeight: '1.5' }}>
            Based on {data.totalScanned.toLocaleString()} recent SaaS audits, your score of {latestScore} is {Math.abs(diff)} points 
            <strong style={{ color: isAbove ? '#10b981' : '#f59e0b' }}> {isAbove ? 'above' : 'below'} </strong> 
            the global industry average of {data.globalAverage}.
          </p>
        </div>

        {/* Visualizer */}
        <div style={{ flex: 1, position: 'relative', height: 100, borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: 32 }}>
          <div style={{ position: 'relative', height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, marginTop: 40 }}>
            {/* Average Marker */}
            <div style={{ position: 'absolute', left: `${data.globalAverage}%`, top: -20, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Avg ({data.globalAverage})</span>
              <div style={{ width: 2, height: 28, background: '#94a3b8', marginTop: 4 }}></div>
            </div>
            {/* User Marker */}
            <div style={{ position: 'absolute', left: `${latestScore}%`, top: -30, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff', background: P, padding: '2px 8px', borderRadius: 12 }}>You</span>
              <div style={{ width: 3, height: 38, background: P, marginTop: 4 }}></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
