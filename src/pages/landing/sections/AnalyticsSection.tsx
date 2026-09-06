import { analyticsDimensions } from '../data';

export default function AnalyticsSection() {
  return (
    <section className="scoring-section" style={{ borderTop: '1px solid var(--lp-border-subtle)' }}>
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
        Analytics that decide, not just display
      </span>
      <h2 className="section-title">Your numbers, already interpreted.</h2>
      <p className="section-subtitle" style={{ maxWidth: '640px', margin: '0 auto 40px', textAlign: 'center' }}>
        Follower growth, engagement, reach, top and worst performers, best posting windows, all in one view across every
        connected account.
      </p>
      <div
        className="pain-body"
        style={{
          maxWidth: '780px',
          margin: '0 auto 48px',
          fontSize: '15.5px',
          lineHeight: '1.75',
          color: 'var(--lp-text-secondary)',
        }}
      >
        <p>
          But the agent does not stop at showing you the chart. It tells you the Tuesday Reel format is fatiguing, the
          LinkedIn carousels are your quiet winners, and the paid campaign you are about to scale is built on a creative
          angle your organic audience already ignored. Organic and paid, read together, because your customers never saw
          them as separate.
        </p>
      </div>

      <div className="score-dimensions" style={{ maxWidth: '640px', margin: '0 auto' }}>
        {analyticsDimensions.map((dim, i) => (
          <div key={i} className="dimension-bar">
            <div className="dim-info">
              <span className="dim-name">{dim.name}</span>
              <span className="dim-weight mono-num">{dim.weight}</span>
            </div>
            <div className="dim-track">
              <div className="dim-fill" style={{ width: `${70 + i * 4}%`, backgroundColor: dim.color }}></div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
