import { analyticsDimensions } from '../data';
import { AnimatedHeading, CountUp, GrowBar, Reveal, Section } from '../ui';
import { ChartVisual, ScoreVisual } from '../visuals';

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
          <ChartVisual />
          <div className="zx-project-meta">
            <h3>Organic and paid performance in one dashboard</h3>
            <p>Instagram, TikTok, LinkedIn and Facebook, read together with your Meta, Google and TikTok Ads data.</p>
          </div>
        </Reveal>

        <Reveal className="zx-project" delay={140}>
          <ScoreVisual dims={analyticsDimensions.map((d) => ({ name: d.name, value: d.value }))} />
          <div className="zx-project-meta">
            <h3>Insights, not just charts</h3>
            <p>Every metric comes with a plain language explanation and a recommended next step. Sample data shown.</p>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
