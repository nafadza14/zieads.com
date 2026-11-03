import { useNavigate } from 'react-router-dom';
import { Check, KeyRound } from 'lucide-react';
import { AnimatedHeading, Reveal, Section, TextRollButton } from '../ui';

/* MCP on the landing page (spec 10, 12): one MCP for the whole social stack */
const TOOLS = [
  ['Briefing', 'get_daily_briefing, list_pending_actions, approve_action'],
  ['Publishing', 'create_draft_post, schedule_post, get_best_times'],
  ['Inbox', 'list_comments, draft_reply, send_reply'],
  ['Analytics', 'get_account_metrics, compare_periods'],
  ['Competitors', 'list_competitors, add_competitor, get_content_gaps'],
  ['Ads, read only', 'get_ads_metrics, run_ads_analysis_mode'],
];

export default function McpSection() {
  const navigate = useNavigate();
  return (
    <Section id="mcp" number="05" label="MCP Server" tone="gray">
      <div className="zx-head-row">
        <AnimatedHeading text="One MCP for your whole social stack." />
        <Reveal delay={120} className="zx-head-aside">
          <p className="zx-body">
            Use your briefing, calendar, inbox, analytics, competitors and ads from Claude, ChatGPT or Cursor. Every write
            becomes a pending approval in ZieAds, so an assistant can never post or reply on its own.
          </p>
        </Reveal>
      </div>
      <div className="zx-mcp">
        <Reveal className="zx-mcp-card">
          <div className="zx-mcp-head">
            <span className="zx-icon-dot">
              <KeyRound size={16} />
            </span>
            <strong>Tools your assistant gets</strong>
          </div>
          <dl className="zx-mcp-tools">
            {TOOLS.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>
                  <code>{v}</code>
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
        <Reveal className="zx-mcp-copy" delay={140}>
          <ul className="zx-check-list">
            <li>
              <Check size={14} /> A key per brand, never one key for every customer
            </li>
            <li>
              <Check size={14} /> Posts, replies and competitor changes wait for your approval
            </li>
            <li>
              <Check size={14} /> Every call is written to your activity log
            </li>
            <li>
              <Check size={14} /> Included in every plan, with a small daily quota on Free
            </li>
          </ul>
          <TextRollButton text="Get your MCP key" onClick={() => navigate('/sign-up')} />
        </Reveal>
      </div>
    </Section>
  );
}
