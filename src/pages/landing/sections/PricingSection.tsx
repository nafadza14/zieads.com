import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { pricingPlans } from '../data';

export default function PricingSection() {
  const navigate = useNavigate();

  const scrollToFreeAudit = () => {
    const el = document.getElementById('free-audit-try');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="pricing" className="pricing-section">
      <h2 className="section-title">Predictable cost. No surprises.</h2>
      <p className="section-subtitle">Start free. Upgrade when the agent has earned it.</p>
      <div className="pricing-grid">
        {pricingPlans.map((plan, i) => (
          <div key={i} className={`pricing-card ${plan.highlight ? 'pricing-highlight' : ''}`}>
            {plan.highlight && <div className="popular-badge">Most Used</div>}
            <h3 className="plan-name">{plan.tier}</h3>
            <p className="plan-tagline">{plan.tagline}</p>
            <div className="plan-price">
              <span className="price-amount mono-num">{plan.price}</span>
              <span className="price-period">{plan.period}</span>
            </div>
            <ul className="plan-features">
              {plan.features.map((f, j) => (
                <li key={j} className="flex items-center gap-2 py-2">
                  <Check size={16} className="check-icon" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              className="plan-cta"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(plan.id === 'free' ? '/sign-up' : `/pricing?plan=${plan.id}`)}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      <div className="pricing-roi-block">
        <h3>A marketing analyst costs $4,000 a month.</h3>
        <p>
          The agent starts free and runs from $29. If it catches one bad spend decision, flags one fatiguing campaign,
          or saves you one Sunday of planning, it has already paid for itself for the year.
        </p>
        <button className="btn-lp-primary-gradient" onClick={scrollToFreeAudit} style={{ cursor: 'pointer' }}>
          See what the agent finds
        </button>
      </div>
    </section>
  );
}
