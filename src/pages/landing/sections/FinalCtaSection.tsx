import { Check, Clock, Shield } from 'lucide-react';
import SocialIcon from '../../../components/v3/SocialIcon';
import { Photo } from '../collage';
import { PHOTOS } from '../images';
import { AnimatedHeading, Reveal, TextRollButton, scrollToId, useInView } from '../ui';

const FLOATERS = [
  { p: 'instagram', top: '14%', left: '74%', d: '0s' },
  { p: 'tiktok', top: '26%', left: '88%', d: '1.2s' },
  { p: 'google_ads', top: '42%', left: '76%', d: '1.8s' },
  { p: 'linkedin', top: '56%', left: '90%', d: '2.4s' },
  { p: 'facebook', top: '70%', left: '80%', d: '0.6s' },
];

export default function FinalCtaSection() {
  const { ref, inView } = useInView<HTMLDivElement>(0.2);

  return (
    <section className="zx-section zx-tone-white zx-final">
      <div className="zx-container">
        <div ref={ref} className={`zx-final-card zx-final-live ${inView ? 'is-in' : ''}`}>
          <div className="zx-final-photo" aria-hidden="true">
            <Photo src={PHOTOS.final} alt="" />
          </div>
          <div className="zx-final-aura" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="zx-final-dots" aria-hidden="true" />
          <div className="zx-final-floaters" aria-hidden="true">
            {FLOATERS.map((f) => (
              <span key={f.p} style={{ top: f.top, left: f.left, animationDelay: f.d }}>
                <SocialIcon platform={f.p} size={22} />
              </span>
            ))}
          </div>

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
        </div>
      </div>
    </section>
  );
}
