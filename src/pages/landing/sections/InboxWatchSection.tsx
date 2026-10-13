import { MessageCircle, Radar } from 'lucide-react';
import { AnimatedHeading, Reveal, Section } from '../ui';
import { InboxVisual, RadarVisual } from '../visuals';

const inboxItems = [
  { who: '@maya.studio', text: 'Do you ship to Jakarta?', tag: 'Buying signal', tone: 'hot' },
  { who: '@ryan_k', text: 'Love the new drop, ordering today!', tag: 'Positive', tone: 'good' },
  { who: '@dina.w', text: 'Still waiting on my refund...', tag: 'Needs reply', tone: 'warn' },
];

export default function InboxWatchSection() {
  return (
    <Section id="inbox" number="05" label="Inbox & Competitor Hunt" tone="white">
      <AnimatedHeading text="One social inbox for every comment, and a radar on every competitor." />

      <div className="zx-grid-2 zx-grid-offset">
        <Reveal className="zx-project">
          <InboxVisual />
          <div className="zx-project-meta">
            <div className="zx-feature-title">
              <span className="zx-icon-dot">
                <MessageCircle size={16} />
              </span>
              <h3>Unified social inbox</h3>
            </div>
            <p>
              Every comment from Instagram, TikTok, LinkedIn and Facebook in one place, sorted by sentiment. Reply faster,
              catch buying signals and never lose a warm lead in a pile of notifications.
            </p>
          </div>
        </Reveal>

        <Reveal className="zx-project" delay={160}>
          <RadarVisual />
          <div className="zx-project-meta">
            <div className="zx-feature-title">
              <span className="zx-icon-dot">
                <Radar size={16} />
              </span>
              <h3>Competitor Hunt</h3>
            </div>
            <p>
              Add the brands you compete with and the agent tracks what they post, which content gains traction and where
              their strategy leaves gaps. Run a competitor audit in minutes, not days.
            </p>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
