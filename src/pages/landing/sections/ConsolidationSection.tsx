import { useNavigate } from 'react-router-dom';
import { AnimatedHeading, Reveal, Section, TextRollButton } from '../ui';
import { ConsolidateVisual } from '../visuals';
import { Collage } from '../collage';
import { PHOTOS } from '../images';

const tools = [
  'Social media scheduler',
  'Analytics dashboard',
  'Ad reporting tool',
  'Weekly spreadsheet',
  'Generic AI chatbot',
  'Competitor tracker',
  'Comment inbox',
];

export default function ConsolidationSection() {
  const navigate = useNavigate();

  return (
    <Section id="all-in-one" number="06" label="All in One" tone="gray">
      <div className="zx-split zx-split-media-left">
        <Collage
          photo={PHOTOS.consolidation}
          photoAlt="Team working together from one laptop"
          layout="left"
          ratio="1 / 1"
          front={<ConsolidateVisual />}
        />

        <div className="zx-split-copy">
          <AnimatedHeading text="Replace five marketing tools with one AI marketing agent." />
          <Reveal delay={100}>
            <p className="zx-lead">
              A social media scheduler, an analytics dashboard, an ad reporting tool, a weekly spreadsheet and a chatbot
              you brief again every morning. Five subscriptions, five tabs and still no clear next step.
            </p>
            <p className="zx-body">
              ZieAds brings scheduling, analytics, inbox, competitor research and AI recommendations into one workspace
              that already knows your brand.
            </p>
          </Reveal>
          <Reveal delay={200}>
            <TextRollButton text="Start free" onClick={() => navigate('/sign-up')} />
          </Reveal>
        </div>
      </div>

      <div className="zx-marquee" aria-label="Tools ZieAds replaces">
        <div className="zx-marquee-track">
          {[...tools, ...tools].map((t, i) => (
            <span key={i} className="zx-marquee-pill">
              <s>{t}</s>
            </span>
          ))}
        </div>
      </div>
    </Section>
  );
}
