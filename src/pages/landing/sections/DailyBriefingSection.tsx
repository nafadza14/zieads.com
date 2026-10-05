import { useNavigate } from 'react-router-dom';
import { dailyBriefingCards } from '../data';
import { IMG } from '../images';
import { AnimatedHeading, ImageCard, Reveal, Section, TextRollButton } from '../ui';

export default function DailyBriefingSection() {
  const navigate = useNavigate();

  return (
    <Section id="ai-analyst" number="02" label="AI Analyst" tone="gray">
      <AnimatedHeading text="Your AI marketing analyst sends a daily briefing every morning." />

      {/* Reference layout: small card, copy + CTA, large card */}
      <div className="zx-trio">
        <ImageCard src={IMG.briefingSmall} alt="Morning coffee next to a laptop with the daily briefing" ratio="4 / 3" className="zx-trio-small" delay={60} />

        <div className="zx-trio-copy">
          <Reveal delay={120}>
            <p className="zx-body">
              ZieAds reads your social media and ad performance overnight, then tells you what changed, why it matters
              and what to do next.
            </p>
            <p className="zx-body">
              It remembers your history, your best content angles and last week's issues, so every recommendation is
              specific to your brand instead of generic advice.
            </p>
          </Reveal>
          <Reveal delay={220}>
            <TextRollButton text="Get your first briefing" onClick={() => navigate('/sign-up')} />
          </Reveal>
        </div>

        <ImageCard src={IMG.briefingMain} alt="Marketing team reviewing their AI briefing together" ratio="16 / 11" className="zx-trio-large" delay={140}>
          <div className="zx-float-card zx-float-bottom-left">
            <span className="zx-live-dot" /> Today's briefing
            <strong>Boost the Tuesday Reel. Pause ad set 3.</strong>
          </div>
        </ImageCard>
      </div>

      <div className="zx-grid-3">
        {dailyBriefingCards.map((card, i) => (
          <Reveal key={card.name} delay={(i % 3) * 90} className="zx-feature-card">
            <ImageCard src={card.image} alt={card.name} ratio="16 / 10" parallax={false} />
            <div className="zx-feature-body">
              <div className="zx-feature-title">
                <span className="zx-icon-dot">
                  <card.Icon size={16} />
                </span>
                <h3>{card.name}</h3>
              </div>
              <p>{card.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
