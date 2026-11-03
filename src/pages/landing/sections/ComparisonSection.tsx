import { Check, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { COMPARE_COLUMNS, COMPARE_ROWS } from '../compare';
import { AnimatedHeading, Reveal, Section } from '../ui';
import { ApprovalVisual } from '../visuals';
import { Collage } from '../collage';
import { PHOTOS } from '../images';

export default function ComparisonSection() {
  return (
    <Section id="comparison" number="07" label="Comparison" tone="gray">
      <div className="zx-head-row">
        <AnimatedHeading text="ZieAds vs Metricool, Vista Social, ChatGPT and an agency." />
        <Reveal delay={120} className="zx-head-aside">
          <p className="zx-body">
            Metricool and Vista Social are strong suites. ChatGPT is a good brainstorming partner. ZieAds is the one that reads your accounts every morning, tells you what to do and prepares the work for your approval.
          </p>
        </Reveal>
      </div>

      <Reveal className="zx-table-card" delay={80}>
        <div className="zx-table-scroll">
          <table className="zx-table">
            <thead>
              <tr>
                <th scope="col"></th>
                {COMPARE_COLUMNS.map((c) => (
                  <th key={c.key} scope="col" className={c.key === 'zieads' ? 'is-hl' : ''}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row) => (
                <tr key={row.criteria}>
                  <th scope="row">{row.criteria}</th>
                  {COMPARE_COLUMNS.map((c) => (
                    <td key={c.key} className={c.key === 'zieads' ? 'is-hl' : ''}>
                      {row.values[c.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="zx-table-note">
          Other products checked on their public pricing pages in November 2026. Read the full comparisons: <Link to="/vs/metricool">vs Metricool</Link>, <Link to="/vs/vista-social">vs Vista Social</Link>, <Link to="/vs/hootsuite">vs Hootsuite</Link>.
        </p>
      </Reveal>

      <div className="zx-split zx-split-media-left zx-split-tight">
        <Collage
          photo={PHOTOS.approval}
          photoAlt="Marketer approving a recommendation on her laptop"
          layout="left"
          ratio="16 / 11"
          front={<ApprovalVisual />}
        />
        <Reveal className="zx-promise-card" delay={140}>
          <div className="zx-promise-head">
            <span className="zx-promise-badge">
              <ShieldCheck size={22} />
            </span>
            <span className="zx-promise-eyebrow">Our promise</span>
          </div>
          <h3>What the agent will never do</h3>
          <p>
            ZieAds monitors, analyzes, drafts and recommends. You make the final call, and the agent executes once you
            approve. That is the right balance for marketing you care about.
          </p>
          <ul className="zx-promise-list">
            <li>
              <span className="zx-promise-check">
                <Check size={13} />
              </span>
              Never publishes a post without your approval
            </li>
            <li>
              <span className="zx-promise-check">
                <Check size={13} />
              </span>
              Never spends ad budget or changes your campaigns
            </li>
            <li>
              <span className="zx-promise-check">
                <Check size={13} />
              </span>
              Disconnect any channel at any time
            </li>
          </ul>
        </Reveal>
      </div>
    </Section>
  );
}
