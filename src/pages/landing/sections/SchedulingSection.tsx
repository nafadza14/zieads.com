import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { AnimatedHeading, Reveal, Section, TextRollButton } from '../ui';
import { ComposerVisual } from '../visuals';


export default function SchedulingSection() {
  const navigate = useNavigate();

  return (
    <Section id="composer" number="03" label="Composer & Calendar" tone="white">
      <AnimatedHeading text="Create, schedule and publish social media posts from one AI content calendar." />

      <div className="zx-split zx-split-media-right">
        <div className="zx-split-copy">
          <Reveal delay={80}>
            <p className="zx-lead">
              Write a post once and the AI agent adapts the caption, format and hashtags for Instagram, TikTok, LinkedIn
              and Facebook. Posting times come from your own engagement history, not a generic best time chart.
            </p>
            <ul className="zx-check-list">
              <li>
                <Check size={16} /> Plan a full week of content in one sitting
              </li>
              <li>
                <Check size={16} /> Preview your visual feed before anything goes live
              </li>
              <li>
                <Check size={16} /> Approve with one click. Nothing publishes without you
              </li>
            </ul>
          </Reveal>
          <Reveal delay={180}>
            <TextRollButton text="Plan your content calendar" onClick={() => navigate('/sign-up')} />
          </Reveal>
        </div>

        <ComposerVisual />
      </div>
    </Section>
  );
}
