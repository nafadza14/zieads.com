export default function SchedulingSection() {
  return (
    <section className="axion-section axion-section-white">
      {/* Numbered Badge */}
      <div className="axion-badge-row">
        <span className="axion-badge-number">03</span>
        <span className="axion-badge-label">Publishing & Scheduling</span>
      </div>

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

      <div className="axion-showcase-card">
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <span className="axion-platform-tab axion-platform-active">Instagram</span>
          <span className="axion-platform-tab">TikTok</span>
          <span className="axion-platform-tab">LinkedIn</span>
        </div>
        <div className="axion-showcase-content">
          We've analyzed your engagement profiles. Recommended post adjustments: Add vertical captions for TikTok
          viewport safety, and move the call-to-action link to client bio.
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <span style={{ fontSize: '12px', color: '#717171', fontWeight: 600 }}>
            Suggested Time: Tuesday, 5:45 PM (Local)
          </span>
          <button className="axion-btn-orange" style={{ padding: '8px 16px', fontSize: '13px' }}>
            Approve & Schedule
          </button>
        </div>
      </div>
    </section>
  );
}
