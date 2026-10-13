import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { pricingPlans } from '../data';
import { AnimatedHeading, Reveal, Section, TextRollButton, scrollToId } from '../ui';
import { CostVisual } from '../visuals';

export default function PricingSection() {
  const navigate = useNavigate();

  return (
    <Section id="pricing" number="10" label="Pricing" tone="gray">
      <div className="zx-head-row">
        <AnimatedHeading text="Simple pricing for AI marketing automation." />
        <Reveal delay={120} className="zx-head-aside">
          <p className="zx-body">
            Start free with no credit card. Upgrade when the agent has earned it. Every paid plan includes daily
            briefings, scheduling and the AI agent.
          </p>
        </Reveal>
      </div>

      <div className="zx-pricing-grid">
        {pricingPlans.map((plan, i) => (
          <Reveal key={plan.id} delay={i * 90} className={`zx-price-card ${plan.highlight ? 'is-hl' : ''}`}>
            {plan.highlight && <span className="zx-price-badge">Most popular</span>}
            <h3>{plan.tier}</h3>
            <p className="zx-price-tagline">{plan.tagline}</p>
            <div className="zx-price">
              <span className="mono-num">{plan.price}</span>
              <small>{plan.period}</small>
            </div>
            <ul className="zx-check-list zx-check-sm">
              {plan.features.map((f) => (
                <li key={f}>
                  <Check size={14} /> {f}
                </li>
              ))}
            </ul>
            <TextRollButton
              text={plan.cta}
              variant={plan.highlight ? 'orange' : 'dark'}
              className="zx-price-cta"
              onClick={() => navigate(plan.id === 'free' ? '/sign-up' : `/pricing?plan=${plan.id}`)}
            />
          </Reveal>
        ))}
      </div>

      <div className="zx-split zx-split-media-right zx-split-tight zx-roi">
        <Reveal className="zx-split-copy">
          <h3 className="zx-h3-lg">A marketing analyst costs around $4,000 a month.</h3>
          <p className="zx-body">
            ZieAds starts free and paid plans start at $29 per month. Catch one wasted budget decision, flag one
            fatiguing campaign or save one Sunday of planning, and it has paid for itself for the year.
          </p>
          <TextRollButton text="Run a free audit" onClick={() => scrollToId('free-audit-try')} />
        </Reveal>
        <CostVisual />
      </div>
    </Section>
  );
}
