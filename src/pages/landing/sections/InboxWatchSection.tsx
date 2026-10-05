import { Radar, Users } from 'lucide-react';

const iconWrapStyle = {
  width: '48px',
  height: '48px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '12px',
  background: 'var(--lp-pill-bg)',
  color: 'var(--lp-text-primary)',
  marginBottom: '20px',
} as const;

export default function InboxWatchSection() {
  return (
    <section
      className="pain-section"
      style={{ borderTop: '1px solid var(--lp-border-subtle)', background: 'var(--lp-bg-canvas)' }}
    >
      <span className="section-eyebrow">
        Nothing slips past it
      </span>
      <h2 className="section-title">It watches the conversations and the competition.</h2>
      <div
        className="pain-grid"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', maxWidth: '960px', margin: '0 auto' }}
      >
        <div className="pain-card">
          <div className="pain-icon-wrap" style={iconWrapStyle}>
            <Users size={24} />
          </div>
          <h3>Unified inbox</h3>
          <p>
            Every comment across every connected account in one place, sorted by sentiment. Reply to what matters, skip
            the noise, and never lose a warm lead in a notification pile again.
          </p>
        </div>
        <div className="pain-card">
          <div className="pain-icon-wrap" style={iconWrapStyle}>
            <Radar size={24} />
          </div>
          <h3>Competitor watch</h3>
          <p>
            Point the agent at the accounts you care about and it tracks what they post, where they are gaining, and
            where the gaps are for you. You find out what is working in your market before it becomes obvious to
            everyone.
          </p>
        </div>
      </div>
    </section>
  );
}
