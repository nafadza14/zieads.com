import { useNavigate } from 'react-router-dom';
import { dailyBriefingCards } from '../data';
import { AnimatedHeading, Reveal, Section, TextRollButton } from '../ui';
import { BriefingVisual, NotifyVisual, FeatureTile } from '../visuals';
import { Bell } from 'lucide-react';
import { Chip, Collage, Shot } from '../collage';
import { PHOTOS, SHOTS } from '../images';

const TILE_SHOTS: Record<string, { src: string; focus: [number, number]; zoom: number }> = {
  'Daily Diagnosis': { src: SHOTS.analyst, focus: [40, 66], zoom: 2 },
  'ROAS Drop Analysis': { src: SHOTS.agent, focus: [56, 46], zoom: 2.1 },
  'Creative Fatigue Alerts': { src: SHOTS.analytics, focus: [38, 58], zoom: 2.1 },
  'Smart Scheduling': { src: SHOTS.calendar, focus: [40, 48], zoom: 1.7 },
  'Competitor Hunt': { src: SHOTS.hunt, focus: [44, 52], zoom: 1.9 },
  'Unified Inbox': { src: SHOTS.inbox, focus: [30, 45], zoom: 2.2 },
};

export default function DailyBriefingSection() {
  const navigate = useNavigate();

  return (
    <Section id="ai-analyst" number="02" label="AI Analyst" tone="gray">
      <AnimatedHeading text="Your AI marketing analyst sends a daily briefing every morning." />

      {/* Reference layout: small card, copy + CTA, large card */}
      <div className="zx-trio">
        <div className="zx-trio-small">
          <NotifyVisual />
        </div>

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

        <div className="zx-trio-large">
          <Collage
            photo={PHOTOS.briefing}
            photoAlt="Morning desk with coffee and a laptop"
            layout="right"
            ratio="16 / 11"
            shot={<Shot src={SHOTS.analyst} alt="ZieAds AI Analyst daily briefing" url="app.zieads.com/analyst" focus={[44, 60]} zoom={1.9} ratio="16 / 10" />}
            front={
              <div className="zc-chip-stack">
                <Chip>
                  <span className="zc-chip-ico">
                    <Bell size={15} />
                  </span>
                  <span>
                    <small>07:00</small>
                    <strong>Briefing ready</strong>
                  </span>
                </Chip>
                <Chip>3 actions for today</Chip>
              </div>
            }
          />
        </div>
      </div>

      <div className="zx-grid-3">
        {dailyBriefingCards.map((card, i) => (
          <Reveal key={card.name} delay={(i % 3) * 90} className="zx-feature-card">
            <div className="zx-tile-shot">
              <Shot src={TILE_SHOTS[card.name].src} alt={`${card.name} in ZieAds`} chrome={false} focus={TILE_SHOTS[card.name].focus} zoom={TILE_SHOTS[card.name].zoom} ratio="16 / 10" />
            </div>
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
