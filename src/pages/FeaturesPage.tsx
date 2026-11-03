/*
  /features: the full feature list that used to sit on the landing page. The landing page now sells
  three outcomes; this page is for visitors who want every piece. Same v4 design (lx.css).
*/
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, BotMessageSquare, CalendarCheck, MessageSquareText, Newspaper, Radar, ShieldCheck, Plug } from 'lucide-react';
import './landing/lx/lx.css';
import LxNav from './landing/lx/LxNav';
import LxFooter from './landing/lx/LxFooter';
import { LxBadge, LxButton, LxReveal } from './landing/lx/kit';
import { SHOTS } from './landing/images';

const FEATURES = [
  { icon: <Newspaper size={17} />, title: 'Morning plan', body: 'Every morning: what changed, what needs you, and 3 actions you approve in one tap. Each one links to the post or number behind it.' },
  { icon: <MessageSquareText size={17} />, title: 'Inbox that puts buyers first', body: 'Instagram and Facebook comments in one queue. Buying questions and complaints go to the top, with reply drafts in your voice.' },
  { icon: <CalendarCheck size={17} />, title: 'Calendar and composer', body: 'Write once, tailor per network, schedule or queue. Month and week views, drag to reschedule, best times from your own posts.' },
  { icon: <ShieldCheck size={17} />, title: 'Every post checked', body: 'ZieAds confirms every post went live, retries a failed one up to 3 times, and warns you before an account disconnects.' },
  { icon: <BarChart3 size={17} />, title: 'Organic and paid, side by side', body: 'Followers, reach and post results per network, with your Meta, Google and TikTok Ads results next to them, read only.' },
  { icon: <Radar size={17} />, title: 'Competitor Hunt', body: 'See what competitors post on Instagram and Threads, and their ads in the Meta Ad Library (EU and UK).' },
  { icon: <BotMessageSquare size={17} />, title: 'Ask Zie', body: 'Ask in plain words why something changed or what to post next. Quick reports turn your data into a plan, and drafts land on your calendar.' },
  { icon: <Plug size={17} />, title: 'Claude, ChatGPT and API', body: 'Use ZieAds inside Claude or ChatGPT, or connect Zapier, Make and n8n with the REST API. Everything waits for your approval.' },
];

const SCREENS = [
  { title: 'Morning plan', body: 'Wins, concerns, what needs you and the actions behind the numbers.', img: SHOTS.analyst, alt: 'Morning plan screen' },
  { title: 'Inbox', body: 'Needs reply, buying questions, complaints. Draft, hide or delete without leaving ZieAds.', img: SHOTS.inbox, alt: 'Inbox with buying questions sorted first' },
  { title: 'Calendar', body: 'Month and week views, drag to reschedule, and your best times.', img: SHOTS.calendar, alt: 'Calendar week view' },
  { title: 'Analytics', body: 'Organic, Paid and Combined tabs, per network and per post, with CSV export.', img: SHOTS.analytics, alt: 'Analytics per network with daily charts' },
];

export default function FeaturesPage() {
  const navigate = useNavigate();
  useEffect(() => {
    document.title = 'Features | ZieAds';
    window.scrollTo(0, 0);
  }, []);
  return (
    <div className="lx">
      <LxNav />
      <main>
        <section className="lx-section lx-center" style={{ paddingTop: 136 }}>
          <div className="lx-wrap">
            <LxReveal>
              <LxBadge n="01">Features</LxBadge>
              <h1 className="lx-h2">
                Everything in ZieAds.
                <span>One place for Instagram, Facebook, TikTok and LinkedIn.</span>
              </h1>
            </LxReveal>
            <div className="lx-feat-cols" style={{ textAlign: 'left' }}>
              {FEATURES.map((f, i) => (
                <LxReveal key={f.title} delay={(i % 3) * 80}>
                  <div className="lx-feat">
                    <span className="lx-feat-ic" aria-hidden="true">
                      {f.icon}
                    </span>
                    <div>
                      <h3>{f.title}</h3>
                      <p>{f.body}</p>
                    </div>
                  </div>
                </LxReveal>
              ))}
            </div>
          </div>
        </section>
        <section className="lx-section is-soft">
          <div className="lx-wrap">
            <LxReveal>
              <LxBadge n="02">Screens</LxBadge>
              <h2 className="lx-h2">
                See it before you sign up.
                <span>This is the real dashboard.</span>
              </h2>
            </LxReveal>
            {[0, 2].map((k) => (
              <LxReveal key={k} delay={80}>
                <div className={`lx-feat-cards ${k ? 'is-flip' : ''}`}>
                  {SCREENS.slice(k, k + 2).map((c) => (
                    <div key={c.title} className="lx-card lx-shot-card">
                      <h4>{c.title}</h4>
                      <p>{c.body}</p>
                      <div className="lx-shot">
                        <img src={c.img} alt={c.alt} loading="lazy" width={1600} height={1000} />
                      </div>
                    </div>
                  ))}
                </div>
              </LxReveal>
            ))}
          </div>
        </section>
        <section className="lx-section lx-center">
          <div className="lx-wrap">
            <h2 className="lx-h2">
              Start with your website.
              <span>See your first plan for free.</span>
            </h2>
            <div className="lx-hero-ctas" style={{ marginTop: 26 }}>
              <LxButton variant="orange" onClick={() => navigate('/#audit')}>
                Show my first briefing
              </LxButton>
              <LxButton variant="white" onClick={() => navigate('/pricing')}>
                See pricing
              </LxButton>
            </div>
          </div>
        </section>
      </main>
      <LxFooter />
    </div>
  );
}
