import { dailyBriefingCards } from '../data';

export default function DailyBriefingSection() {
  return (
    <section
      className="ai-strategist-section"
      style={{
        padding: '120px 24px',
        background: 'var(--lp-bg-canvas)',
        borderTop: '1px solid var(--lp-border-subtle)',
      }}
    >
      <span className="section-eyebrow">
        The daily briefing
      </span>
      <h2 className="section-title" style={{ marginTop: 8, marginBottom: 16, textAlign: 'center' }}>
        A marketing analyst's report. Every single morning.
      </h2>
      <p className="section-subtitle" style={{ maxWidth: '640px', margin: '0 auto 40px', textAlign: 'center' }}>
        Most tools hand you data and walk away. The agent reads that data in the context of your specific setup and
        hands you decisions.
      </p>

      <div
        className="ai-strategist-explanation"
        style={{
          maxWidth: '780px',
          margin: '0 auto 48px',
          textAlign: 'left',
          fontSize: '15.5px',
          lineHeight: '1.75',
          color: 'var(--lp-text-secondary)',
          background: 'var(--lp-bg-card)',
          border: '1px solid var(--lp-border-subtle)',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: 'var(--lp-shadow-card)',
        }}
      >
        <p style={{ margin: 0 }}>
          It knows your pixel was misfiring last week. It knows your best angle has been problem-first. It knows you
          have been running cold audiences only. So when it says boost the Tuesday Reel and pause ad set three, it is
          not guessing. It is reasoning from everything it already knows about you.
        </p>
      </div>

      <div className="pain-grid" style={{ marginBottom: 48 }}>
        {dailyBriefingCards.map((mode, i) => (
          <div key={i} className="pain-card">
            <div
              className="pain-icon-wrap"
              style={{
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '12px',
                background: 'var(--lp-pill-bg)',
                color: 'var(--lp-text-primary)',
                marginBottom: '20px',
              }}
            >
              <mode.Icon size={24} />
            </div>
            <h3>{mode.name}</h3>
            <p>{mode.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
