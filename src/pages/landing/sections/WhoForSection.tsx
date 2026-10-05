import { Check } from 'lucide-react';
import { personas } from '../data';

export default function WhoForSection() {
  return (
    <section className="who-section">
      {/* Numbered Badge */}
      <div className="axion-badge-row">
        <span className="axion-badge-number">09</span>
        <span className="axion-badge-label">Who It's For</span>
      </div>

      <h2 className="section-title" style={{ marginTop: 8 }}>
        Whether it is your brand or your clients'.
      </h2>
      <div className="who-grid">
        {personas.map((persona, i) => (
          <div key={i} className="persona-card">
            <div className="axion-icon-wrap">
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
            <div className="persona-suggestion">
              {persona.plan_suggestion}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
