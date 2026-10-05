import { dailyBriefingCards } from '../data';

export default function DailyBriefingSection() {
  return (
    <section className="axion-section axion-section-gray">
      {/* Numbered Badge */}
      <div className="axion-badge-row">
        <span className="axion-badge-number">02</span>
        <span className="axion-badge-label">The Daily Briefing</span>
      </div>

      <h2 className="section-title" style={{ marginTop: 8, marginBottom: 16, textAlign: 'center' }}>
        A marketing analyst's report. Every single morning.
      </h2>
      <p className="section-subtitle" style={{ maxWidth: '640px', margin: '0 auto 40px', textAlign: 'center' }}>
        Most tools hand you data and walk away. The agent reads that data in the context of your specific setup and
        hands you decisions.
      </p>

      <div className="axion-explanation-card">
        <p style={{ margin: 0 }}>
          It knows your pixel was misfiring last week. It knows your best angle has been problem-first. It knows you
          have been running cold audiences only. So when it says boost the Tuesday Reel and pause ad set three, it is
          not guessing. It is reasoning from everything it already knows about you.
        </p>
      </div>

      <div className="pain-grid" style={{ marginBottom: 48 }}>
        {dailyBriefingCards.map((mode, i) => (
          <div key={i} className="pain-card">
            <div className="axion-icon-wrap">
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
