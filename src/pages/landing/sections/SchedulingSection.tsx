import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { AnimatedHeading, Reveal, Section, TextRollButton } from '../ui';
import { ComposerVisual } from '../visuals';
import { CalendarClock } from 'lucide-react';
import SocialIcon from '../../../components/v3/SocialIcon';
import { Chip, Collage, Shot } from '../collage';
import { PHOTOS, SHOTS } from '../images';


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

        <Collage
          photo={PHOTOS.composer}
          photoAlt="Social media apps on a smartphone"
          layout="right"
          ratio="5 / 4"
          shot={<Shot src={SHOTS.composer} alt="ZieAds Composer with live post preview" url="app.zieads.com/composer" focus={[62, 42]} zoom={1.45} ratio="16 / 10" />}
          front={
            <div className="zc-chip-stack">
              <Chip>
                <span className="zc-icons">
                  <SocialIcon platform="instagram" size={22} />
                  <SocialIcon platform="tiktok" size={22} />
                  <SocialIcon platform="linkedin" size={22} />
                  <SocialIcon platform="facebook" size={22} />
                </span>
              </Chip>
              <Chip>
                <span className="zc-chip-ico">
                  <CalendarClock size={15} />
                </span>
                <span>
                  <small>Best time for your audience</small>
                  <strong>Tue, 5:45 PM</strong>
                </span>
              </Chip>
            </div>
          }
        />
      </div>
    </Section>
  );
}
