import { Check, Clock, Shield } from 'lucide-react';

export default function FinalCtaSection() {
  const scrollToHero = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <section className="final-cta-section">
      <div className="lp-grid-line lp-line-left"></div>
      <div className="lp-grid-line lp-line-right"></div>
      <div className="final-cta-content">
        <h2 className="final-cta-title">
          Meet your agent. <br />
          <span className="lp-pill-highlight">First briefing tomorrow.</span>
        </h2>
        <p className="final-cta-subtitle">
          Start with a free audit, no signup and no card. Connect when you're ready and wake up to your first briefing.
        </p>
        <button className="btn-lp-primary-gradient final-cta-btn" onClick={scrollToHero} style={{ cursor: 'pointer' }}>
          Start Free
        </button>
        <div className="final-cta-trust-strip">
          <span>
            <Shield size={14} /> No ad account access to start
          </span>
          <span>
            <Check size={14} /> No card for the free audit
          </span>
          <span>
            <Clock size={14} /> First briefing in 24 hours
          </span>
        </div>
      </div>
    </section>
  );
}
