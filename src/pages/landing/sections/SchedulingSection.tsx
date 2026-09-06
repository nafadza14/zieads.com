export default function SchedulingSection() {
  return (
    <section
      className="pain-section"
      style={{ borderTop: '1px solid var(--lp-border-subtle)', background: 'white' }}
    >
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
        Publishing and scheduling
      </span>
      <h2 className="section-title">Draft once. The agent handles every platform.</h2>
      <div className="pain-body" style={{ marginBottom: 40 }}>
        <p>
          Write your post once and the agent adapts it for Instagram, TikTok, and LinkedIn, respecting what each
          platform rewards. It suggests the times your audience actually shows up, based on your own history rather than
          a generic best-time chart.
        </p>
        <p>
          Queue a week in one sitting, or let the agent propose a schedule and approve it with one tap. Nothing goes
          live without your say-so.
        </p>
      </div>

      <div
        style={{
          maxWidth: '640px',
          margin: '0 auto',
          background: 'var(--lp-bg-card)',
          border: '1px solid var(--lp-border-subtle)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: 'var(--lp-shadow-card)',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <span
            style={{
              background: '#3B7FF5',
              color: 'white',
              fontSize: '12px',
              fontWeight: 600,
              padding: '4px 8px',
              borderRadius: '6px',
            }}
          >
            Instagram
          </span>
          <span
            style={{
              background: '#E4E4E7',
              color: '#3F3F46',
              fontSize: '12px',
              fontWeight: 600,
              padding: '4px 8px',
              borderRadius: '6px',
            }}
          >
            TikTok
          </span>
          <span
            style={{
              background: '#E4E4E7',
              color: '#3F3F46',
              fontSize: '12px',
              fontWeight: 600,
              padding: '4px 8px',
              borderRadius: '6px',
            }}
          >
            LinkedIn
          </span>
        </div>
        <div
          style={{
            background: 'var(--lp-bg-inset)',
            padding: '16px',
            borderRadius: '12px',
            minHeight: '80px',
            fontSize: '14px',
            color: 'var(--lp-text-primary)',
            border: '1px solid var(--lp-border-subtle)',
          }}
        >
          We've analyzed your engagement profiles. Recommended post adjustments: Add vertical captions for TikTok
          viewport safety, and move the call-to-action link to client bio.
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <span style={{ fontSize: '12px', color: 'var(--lp-accent)', fontWeight: 600 }}>
            Suggested Time: Tuesday, 5:45 PM (Local)
          </span>
          <button
            className="btn-lp-primary-gradient"
            style={{
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Approve & Schedule
          </button>
        </div>
      </div>
    </section>
  );
}
