import { analyticsDimensions } from '../data';
import { IMG } from '../images';
import { AnimatedHeading, CountUp, GrowBar, ImageCard, Reveal, Section } from '../ui';

export default function AnalyticsSection() {
  return (
    <Section id="analytics" number="04" label="Social Media Analytics" tone="gray">
      <div className="zx-head-row">
        <AnimatedHeading text="Social media analytics that explain what your numbers mean." />
        <Reveal delay={120} className="zx-head-aside">
          <p className="zx-body">
            Track follower growth, reach, impressions, engagement rate, top posts and best posting windows across every
            connected account. Then the agent tells you which formats are fatiguing, which posts are quiet winners and
            which ad creative your organic audience already ignored.
          </p>
        </Reveal>
      </div>

      <div className="zx-grid-2">
        <Reveal className="zx-project">
          <ImageCard src={IMG.analyticsA} alt="Engagement and reach charts across social media accounts" ratio="4 / 3">
            <div className="zx-stat-stack">
              <div className="zx-stat">
                <span className="zx-stat-value">
                  <CountUp to={18.4} decimals={1} prefix="+" suffix="%" />
                </span>
                <span className="zx-stat-label">Engagement rate</span>
              </div>
              <div className="zx-stat">
                <span className="zx-stat-value">
                  <CountUp to={3.2} decimals={1} suffix="x" />
                </span>
                <span className="zx-stat-label">Reach vs last month</span>
              </div>
              <div className="zx-stat">
                <span className="zx-stat-value">Tue 17:45</span>
                <span className="zx-stat-label">Best posting window</span>
              </div>
            </div>
          </ImageCard>
          <div className="zx-project-meta">
            <h3>Organic and paid performance in one dashboard</h3>
            <p>Instagram, TikTok, LinkedIn and Facebook, read together with your Meta, Google and TikTok Ads data.</p>
          </div>
        </Reveal>

        <Reveal className="zx-project" delay={140}>
          <ImageCard src={IMG.analyticsB} alt="Team reviewing a paid ads readiness score" ratio="4 / 3">
            <div className="zx-bars-panel">
              <span className="zx-eyebrow zx-eyebrow-light">Readiness by dimension</span>
              {analyticsDimensions.map((dim, i) => (
                <div key={dim.name} className="zx-bar-row">
                  <div className="zx-bar-label">
                    <span>{dim.name}</span>
                    <span className="mono-num">{dim.value}</span>
                  </div>
                  <GrowBar value={dim.value} delay={i * 90} />
                </div>
              ))}
            </div>
          </ImageCard>
          <div className="zx-project-meta">
            <h3>Insights, not just charts</h3>
            <p>Every metric comes with a plain language explanation and a recommended next step. Sample data shown.</p>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
