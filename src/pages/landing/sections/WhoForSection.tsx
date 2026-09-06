import { Check } from 'lucide-react';
import { personas } from '../data';

export default function WhoForSection() {
  return (
    <section className="who-section">
      <span
        className="section-eyebrow"
        style={{
          textTransform: 'uppercase',
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--lp-accent)',
          letterSpacing: '0.05em',
        }}
      >
        Built for people who take marketing seriously
      </span>
      <h2 className="section-title" style={{ marginTop: 8 }}>
        Whether it is your brand or your clients'.
      </h2>
      <div className="who-grid">
        {personas.map((persona, i) => (
          <div key={i} className="persona-card">
            <div className="persona-icon-wrap">
              <persona.Icon size={24} />
            </div>
            <span className="persona-type">{persona.title}</span>
            <h3>{persona.headline}</h3>
            <p className="persona-body">{persona.body}</p>
            <ul className="persona-features" style={{ marginBottom: '16px' }}>
              {persona.features.map((f, j) => (
                <li key={j}>
                  <Check size={14} /> {f}
                </li>
              ))}
            </ul>
            <div
              className="persona-suggestion"
              style={{
                fontSize: '13px',
                fontStyle: 'italic',
                color: 'var(--lp-accent)',
                borderTop: '1px solid var(--lp-border-subtle)',
                paddingTop: '12px',
              }}
            >
              {persona.plan_suggestion}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
