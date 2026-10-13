import { Check } from 'lucide-react';
import { personas } from '../data';
import { AnimatedHeading, Reveal, Section } from '../ui';
import { PersonaVisual } from '../visuals';

export default function WhoForSection() {
  return (
    <Section id="who-its-for" number="09" label="Who It's For" tone="white">
      <AnimatedHeading text="Built for founders, freelancers and marketing teams." />

      <div className="zx-grid-3">
        {personas.map((p, i) => (
          <Reveal key={p.title} delay={i * 110} className="zx-persona-card">
            <PersonaVisual kind={p.visual} />
            <div className="zx-persona-body">
              <h3>{p.headline}</h3>
              <p>{p.body}</p>
              <ul className="zx-check-list zx-check-sm">
                {p.features.map((f) => (
                  <li key={f}>
                    <Check size={14} /> {f}
                  </li>
                ))}
              </ul>
              <div className="zx-persona-plan">{p.plan_suggestion}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
