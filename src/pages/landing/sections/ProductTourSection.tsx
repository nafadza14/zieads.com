import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3,  Calendar, Check, Inbox, Link2, PenLine, Radar, BotMessageSquare } from 'lucide-react';
import ZIcon from '../../../components/icons/ZIcon';
import ZieAvatar from '../../../components/ZieAvatar';
import SocialIcon from '../../../components/v3/SocialIcon';
import { SHOTS } from '../images';
import { Chip, Shot, useScrollProgress } from '../collage';
import { AnimatedHeading, Reveal, Section, TextRollButton, useInView } from '../ui';

const TOUR = [
  {
    id: 'analyst',
    label: 'AI Analyst',
    icon: <ZIcon name="ai-analyst" size={15} />,
    title: 'A briefing waiting for you every morning.',
    desc: 'The agent reads your accounts overnight and opens your day with what changed, why it matters and what to do first.',
    points: ['Wins, concerns and actions in one card', 'Alerts when a metric moves', 'Live status for every connected channel'],
    shot: SHOTS.analyst,
    url: 'app.zieads.com/analyst',
  },
  {
    id: 'agent',
    label: 'AI Agent',
    icon: <BotMessageSquare size={15} />,
    title: 'Ask anything about your marketing.',
    desc: 'Chat with an agent that already knows your brand, or run one of ten deep analysis modes in a single click.',
    points: ['ROAS drops diagnosed with evidence', 'Hooks, captions and ad copy on demand', 'Budget splits across Meta, Google and TikTok'],
    shot: SHOTS.agent,
    url: 'app.zieads.com/agent',
  },
  {
    id: 'composer',
    label: 'Composer',
    icon: <PenLine size={15} />,
    title: 'Write once, post everywhere.',
    desc: 'Draft a post, tailor it per platform, attach media and publish now or at the time your audience is most active.',
    points: ['Live preview per platform', 'Queue, schedule or publish now', 'Nothing goes live without your approval'],
    shot: SHOTS.composer,
    url: 'app.zieads.com/composer',
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: <Calendar size={15} />,
    title: 'Your whole content plan at a glance.',
    desc: 'Every scheduled and published post on one calendar, with a visual feed preview so your grid always looks right.',
    points: ['Month and agenda views', 'Scheduled, published and failed states', 'Feed preview before you post'],
    shot: SHOTS.calendar,
    url: 'app.zieads.com/calendar',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <BarChart3 size={15} />,
    title: 'Numbers that explain themselves.',
    desc: 'Audience, impressions, engagement and best posting windows across every channel, ranked and explained.',
    points: ['Top performing content ranked', 'Best posting windows with confidence', 'Organic and paid in one view'],
    shot: SHOTS.analytics,
    url: 'app.zieads.com/analytics',
  },
  {
    id: 'inbox',
    label: 'Inbox',
    icon: <Inbox size={15} />,
    title: 'Every comment, one calm inbox.',
    desc: 'Comments from all your channels in one place, sorted by sentiment, with replies sent right from ZieAds.',
    points: ['Positive, neutral and negative filters', 'Reply without switching apps', 'Archive what is handled'],
    shot: SHOTS.inbox,
    url: 'app.zieads.com/inbox',
  },
  {
    id: 'hunt',
    label: 'Competitor Hunt',
    icon: <Radar size={15} />,
    title: 'Know every move your rivals make.',
    desc: 'Track competitor websites and accounts, run audits on them and see where their strategy leaves gaps for you.',
    points: ['Score every competitor', 'Audit on demand', 'Gaps turned into ideas'],
    shot: SHOTS.hunt,
    url: 'app.zieads.com/hunt',
  },
  {
    id: 'connections',
    label: 'Connections',
    icon: <Link2 size={15} />,
    title: 'Plug in every channel you run.',
    desc: 'Connect Instagram, TikTok, LinkedIn and Facebook in a few clicks, then add Meta, Google and TikTok Ads data.',
    points: ['Secure OAuth connections', 'Ads data via CSV upload', 'See what is live at a glance'],
    shot: SHOTS.connections,
    url: 'app.zieads.com/connections',
  },
];

const DURATION = 6500;

export default function ProductTourSection() {
  const navigate = useNavigate();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const { ref: viewRef, inView } = useInView<HTMLDivElement>(0.2);
  const tiltRef = useScrollProgress<HTMLDivElement>();
  const cur = TOUR[i];

  // Preload every screen once the tour is visible so switching tabs is instant
  useEffect(() => {
    if (!inView) return;
    TOUR.forEach((t) => {
      const img = new Image();
      img.src = t.shot;
    });
  }, [inView]);

  useEffect(() => {
    if (!inView || paused) return;
    const t = setTimeout(() => setI((x) => (x + 1) % TOUR.length), DURATION);
    return () => clearTimeout(t);
  }, [i, inView, paused]);

  return (
    <Section id="product-tour" tone="white" className="zt-section">
      <div className="zx-head-row">
        <AnimatedHeading text="See ZieAds in action. This is the real product." />
        <Reveal delay={120} className="zx-head-aside">
          <p className="zx-body">
            Every screen below is the actual ZieAds dashboard, shown with sample data. Pick a feature or let the tour play.
          </p>
        </Reveal>
      </div>

      <div
        ref={viewRef}
        className={`zt-tour ${paused ? 'is-paused' : ''}`}
        style={{ ['--zt-ms' as string]: `${DURATION}ms` }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="zt-tabs" role="tablist">
          {TOUR.map((t, k) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={k === i}
              className={`zt-tab ${k === i ? 'is-active' : ''}`}
              onClick={() => setI(k)}
            >
              {t.icon}
              {t.label}
              <span className="zt-tab-progress" key={`${k}-${i}-${inView}`} />
            </button>
          ))}
        </div>

        <div className="zt-stage">
          <div className="zt-copy" key={cur.id}>
            <span className="zt-eyebrow">{cur.label}</span>
            <h3>{cur.title}</h3>
            <p>{cur.desc}</p>
            <ul className="zt-points">
              {cur.points.map((p) => (
                <li key={p}>
                  <Check size={15} /> {p}
                </li>
              ))}
            </ul>
            <TextRollButton text="Try it free" onClick={() => navigate('/sign-up')} />
          </div>

          <div className="zt-screen" ref={tiltRef}>
            <div className="zt-glow" aria-hidden="true" />
            <div className="zt-screen-inner">
              <Shot key={cur.id} src={cur.shot} alt={`ZieAds ${cur.label} screen`} url={cur.url} ratio="16 / 10" eager />
            </div>
            <div className="zt-float zt-float-a">
              <Chip>
                <span className="zc-icons">
                  <SocialIcon platform="instagram" size={22} />
                  <SocialIcon platform="tiktok" size={22} />
                  <SocialIcon platform="linkedin" size={22} />
                  <SocialIcon platform="facebook" size={22} />
                </span>
                <span>4 channels synced</span>
              </Chip>
            </div>
            <div className="zt-float zt-float-b">
              <Chip>
                <ZieAvatar size={30} />
                <span>
                  <small>Agent status</small>
                  <strong>Watching 24/7</strong>
                </span>
              </Chip>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
