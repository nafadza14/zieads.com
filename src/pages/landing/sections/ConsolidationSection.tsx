const tools = ['Scheduler', 'Analytics', 'Ad Reporting', 'Spreadsheets', 'Generic AI'];

export default function ConsolidationSection() {
  return (
    <section className="axion-section axion-section-gray" style={{ textAlign: 'center' }}>
      {/* Numbered Badge */}
      <div className="axion-badge-row">
        <span className="axion-badge-number">06</span>
        <span className="axion-badge-label">Consolidation</span>
      </div>

      <h2 className="section-title">Stop paying for five tools that don't talk to each other.</h2>
      <div className="pain-body" style={{ maxWidth: '780px', margin: '0 auto 40px' }}>
        <p>
          A scheduler here. An analytics dashboard there. An ad reporting tool. A spreadsheet you update on Mondays. A
          generic AI you re-explain your business to every morning. Five subscriptions, five tabs, and still no one
          telling you what to actually do.
        </p>
        <p>The agent replaces the whole stack with one thing that sees everything and gives you the answer.</p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px', marginTop: '32px' }}>
        {tools.map((tool) => (
          <span key={tool} className="axion-tool-pill">
            {tool}
          </span>
        ))}
      </div>
    </section>
  );
}
