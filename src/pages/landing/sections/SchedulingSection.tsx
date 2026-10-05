import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarClock, Check } from 'lucide-react';
import { IMG } from '../images';
import { AnimatedHeading, ImageCard, Reveal, Section, TextRollButton } from '../ui';

const platforms = [
  { name: 'Instagram', tip: 'Square crop, 5 hashtags, link in bio. Suggested time: Tuesday, 5:45 PM.' },
  { name: 'TikTok', tip: 'Shorter hook, vertical safe captions, trending sound slot. Suggested time: Wednesday, 7:10 PM.' },
  { name: 'LinkedIn', tip: 'Professional opener, carousel format, no hashtags in the first line. Suggested time: Thursday, 8:30 AM.' },
  { name: 'Facebook', tip: 'Longer caption, native link preview, question to spark comments. Suggested time: Friday, 12:15 PM.' },
];

export default function SchedulingSection() {
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  // Auto cycle through platforms so the mockup feels alive
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setActive((a) => (a + 1) % platforms.length), 3200);
    return () => clearInterval(t);
  }, [paused]);

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

        <ImageCard src={IMG.composerMain} alt="Social media content calendar on a laptop" ratio="5 / 4" delay={100}>
          <div
            className="zx-glass-panel"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div className="zx-platform-tabs">
              {platforms.map((p, i) => (
                <button
                  key={p.name}
                  className={`zx-platform-tab ${active === i ? 'is-active' : ''}`}
                  onClick={() => setActive(i)}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <p className="zx-glass-text" key={active}>
              {platforms[active].tip}
            </p>
            <div className="zx-glass-foot">
              <span>
                <CalendarClock size={14} /> Queued for this week: 12 posts
              </span>
              <span className="zx-mini-btn">Approve and schedule</span>
            </div>
          </div>
        </ImageCard>
      </div>
    </Section>
  );
}
