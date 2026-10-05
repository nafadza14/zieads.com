import { ShieldCheck } from 'lucide-react';
import { comparisonRows } from '../data';
import { IMG } from '../images';
import { AnimatedHeading, ImageCard, Reveal, Section } from '../ui';

export default function ComparisonSection() {
  return (
    <Section id="comparison" number="07" label="Comparison" tone="white">
      <div className="zx-head-row">
        <AnimatedHeading text="ZieAds vs ChatGPT, agencies and doing it yourself." />
        <Reveal delay={120} className="zx-head-aside">
          <p className="zx-body">
            ChatGPT is a great brainstorming partner. But it starts from zero in every chat, cannot see your accounts and
            forgets what you posted last week. ZieAds connects to your data, remembers your history and works every
            morning without a prompt.
          </p>
        </Reveal>
      </div>

      <Reveal className="zx-table-card" delay={80}>
        <div className="zx-table-scroll">
          <table className="zx-table">
            <thead>
              <tr>
                <th scope="col"></th>
                <th scope="col" className="is-hl">ZieAds AI Agent</th>
                <th scope="col">ChatGPT</th>
                <th scope="col">Hiring an agency</th>
                <th scope="col">Doing it yourself</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.criteria}>
                  <th scope="row">{row.criteria}</th>
                  <td className="is-hl">{row.zieads}</td>
                  <td>{row.chatgpt}</td>
                  <td>{row.agency}</td>
                  <td>{row.manual}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>

      <div className="zx-split zx-split-media-left zx-split-tight">
        <ImageCard src={IMG.comparison} alt="Marketer approving AI recommendations before they go live" ratio="16 / 10" />
        <Reveal className="zx-note-card" delay={140}>
          <span className="zx-icon-dot zx-icon-dot-lg">
            <ShieldCheck size={20} />
          </span>
          <h3>What the agent will never do</h3>
          <p>
            ZieAds never spends your budget or publishes content without your approval. It monitors, analyzes, drafts and
            recommends. You make the final call, and the agent executes once you approve. That is the right balance for
            marketing you care about.
          </p>
        </Reveal>
      </div>
    </Section>
  );
}
