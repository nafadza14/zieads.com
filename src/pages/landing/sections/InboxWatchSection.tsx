import { MessageCircle, Radar } from 'lucide-react';
import { IMG } from '../images';
import { AnimatedHeading, ImageCard, Reveal, Section } from '../ui';

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
          <ImageCard src={IMG.inbox} alt="Social media manager replying to comments in a unified inbox" ratio="4 / 3">
            <div className="zx-inbox-stack">
              {inboxItems.map((m) => (
                <div key={m.who} className="zx-inbox-item">
                  <div>
                    <strong>{m.who}</strong>
                    <span>{m.text}</span>
                  </div>
                  <em className={`zx-tag zx-tag-${m.tone}`}>{m.tag}</em>
                </div>
              ))}
            </div>
          </ImageCard>
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
          <ImageCard src={IMG.competitor} alt="Marketing team mapping competitor strategy on a whiteboard" ratio="4 / 3">
            <div className="zx-radar">
              <span className="zx-radar-sweep" />
              <span className="zx-radar-ping" style={{ top: '28%', left: '62%' }} />
              <span className="zx-radar-ping" style={{ top: '64%', left: '34%', animationDelay: '0.8s' }} />
              <span className="zx-radar-ping" style={{ top: '44%', left: '74%', animationDelay: '1.6s' }} />
            </div>
          </ImageCard>
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
