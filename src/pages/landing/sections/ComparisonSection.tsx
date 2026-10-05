import { comparisonRows } from '../data';

export default function ComparisonSection() {
  return (
    <section className="comparison-section">
      {/* Numbered Badge */}
      <div className="axion-badge-row">
        <span className="axion-badge-number">07</span>
        <span className="axion-badge-label">Comparison</span>
      </div>

      <h2 className="section-title">Why not just use ChatGPT?</h2>
      <p className="section-subtitle">Fair question. Honest answer.</p>

      <div style={{ maxWidth: '780px', margin: '0 auto 40px', textAlign: 'left', fontSize: '15px', lineHeight: '1.6', color: '#505050' }}>
        <p>
          ChatGPT is a good thinking partner. It helps you brainstorm and structure ideas. But it starts from zero every
          time you open a new chat, it cannot see your accounts, and it has no memory of what you posted last week or
          what your numbers did. Your agent does all of that, every day, without being asked.
        </p>
      </div>

      <div className="comparison-table-wrap">
        <table className="comparison-table">
          <thead>
            <tr>
              <th></th>
              <th className="comp-highlight">ZieAds Agent</th>
              <th>ChatGPT</th>
              <th>Hiring an analyst</th>
              <th>Doing it yourself</th>
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row, i) => (
              <tr key={i}>
                <td className="comp-criteria">{row.criteria}</td>
                <td className="comp-highlight">{row.zieads}</td>
                <td>{row.chatgpt}</td>
                <td>{row.agency}</td>
                <td>{row.manual}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="axion-disclaimer-card">
        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 700, color: '#000' }}>
          What the agent does not do
        </h4>
        <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6', color: '#505050' }}>
          The agent does not autonomously spend your money or publish without your approval. You stay in control of what
          goes live and what gets boosted. It watches, analyzes, drafts, and recommends. You make the call, and it
          handles the execution once you do. We think that is the right balance for marketing you actually care about.
        </p>
      </div>
    </section>
  );
}
