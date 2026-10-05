import { Check, Clock, Shield } from 'lucide-react';
import { IMG } from '../images';
import { AnimatedHeading, ImageCard, Reveal, TextRollButton, scrollToId } from '../ui';

export default function FinalCtaSection() {
  return (
    <section className="zx-section zx-tone-white zx-final">
      <div className="zx-container">
        <ImageCard src={IMG.finalCta} alt="Bright modern office ready for the work day" ratio="auto" className="zx-final-card">
          <div className="zx-final-inner">
            <AnimatedHeading text="Meet your AI marketing agent. Get your first briefing tomorrow." className="zx-final-title" />
            <Reveal delay={120}>
              <p className="zx-final-sub">
                Start with a free website audit. No signup and no credit card. Connect your accounts when you are ready and
                wake up to your first daily briefing.
              </p>
            </Reveal>
            <Reveal delay={220} className="zx-final-actions">
              <TextRollButton text="Start free" onClick={() => scrollToId('free-audit-try')} />
              <div className="zx-final-trust">
                <span>
                  <Shield size={14} /> No ad account access to start
                </span>
                <span>
                  <Check size={14} /> No card for the free audit
                </span>
                <span>
                  <Clock size={14} /> First briefing within 24 hours
                </span>
              </div>
            </Reveal>
          </div>
        </ImageCard>
      </div>
    </section>
  );
}
