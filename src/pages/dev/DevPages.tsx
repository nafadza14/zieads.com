/*
  Public product pages for developers and AI users, in the v4 landing design:
    /mcp  ZieAds inside Claude, ChatGPT, Cursor and other AI assistants
    /api  the REST API for Zapier, Make, n8n and your own code
  Docs live at /docs; these pages explain the why and link there for the how.
  Competitor facts come from each product's help pages, checked November 2026.
*/
import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Copy, Minus } from 'lucide-react';
import '../landing/lx/lx.css';
import './dev.css';
import LxNav from '../landing/lx/LxNav';
import LxFooter from '../landing/lx/LxFooter';
import { LxBadge, LxButton, LxReveal } from '../landing/lx/kit';
import { MCP_URL, REST_BASE } from '../../lib/publicUrls';
import { supabase } from '../../lib/supabaseClient';

function useSeo(title: string, description: string) {
  useEffect(() => {
    document.title = title;
    let m = document.querySelector('meta[name="description"]');
    if (!m) {
      m = document.createElement('meta');
      m.setAttribute('name', 'description');
      document.head.appendChild(m);
    }
    m.setAttribute('content', description);
    window.scrollTo(0, 0);
  }, [title, description]);
}

function useSignedIn() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setOn(!!data.session));
  }, []);
  return on;
}

function CopyLine({ text, label }: { text: string; label: string }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="dv-copyline">
      <span className="dv-copyline-label">{label}</span>
      <code>{text}</code>
      <button
        type="button"
        aria-label={`Copy ${label}`}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setOk(true);
            setTimeout(() => setOk(false), 1400);
          } catch {
            setOk(false);
          }
        }}
      >
        {ok ? <Check size={14} /> : <Copy size={14} />}
        {ok ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

function CodeCard({ title, code }: { title: string; code: string }) {
  return (
    <div className="dv-code">
      <div className="dv-code-bar">
        <span className="dv-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>{title}</span>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

type Cell = string | boolean;
function CompareTable({ rows }: { rows: { label: string; values: [Cell, Cell, Cell] }[] }) {
  const cell = (v: Cell) => (v === true ? <Check size={15} aria-label="Yes" /> : v === false ? <Minus size={15} className="dv-dash" aria-label="No" /> : v);
  return (
    <div className="lx-cmp-wrap">
      <table className="lx-cmp dv-cmp">
        <thead>
          <tr>
            <th scope="col">
              <span className="lx-sr">Feature</span>
            </th>
            <th scope="col" className="is-us">
              ZieAds
            </th>
            <th scope="col">Metricool</th>
            <th scope="col">Vista Social</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <th scope="row">{r.label}</th>
              {r.values.map((v, i) => (
                <td key={i} className={i === 0 ? 'is-us' : ''}>
                  {cell(v)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({ n, badge, title, sub, lead, children, soft, id }: { n: string; badge: string; title: string; sub: string; lead?: string; children: ReactNode; soft?: boolean; id?: string }) {
  return (
    <section className={`lx-section ${soft ? 'is-soft' : ''}`} id={id}>
      <div className="lx-wrap">
        <LxReveal>
          <div className="lx-center">
            <LxBadge n={n}>{badge}</LxBadge>
            <h2 className="lx-h2">
              {title}
              <span>{sub}</span>
            </h2>
            {lead && <p className="lx-lead">{lead}</p>}
          </div>
        </LxReveal>
        <LxReveal delay={100}>{children}</LxReveal>
      </div>
    </section>
  );
}

function FinalCta({ title, sub, primary, secondary }: { title: string; sub: string; primary: [string, string]; secondary: [string, string] }) {
  const navigate = useNavigate();
  return (
    <section className="lx-section" style={{ paddingTop: 0 }}>
      <div className="lx-wrap">
        <LxReveal>
          <div className="dv-cta lx-center">
            <h2>{title}</h2>
            <p>{sub}</p>
            <div className="dv-btns">
              <LxButton variant="dark" onClick={() => navigate(primary[1])}>
                {primary[0]}
              </LxButton>
              <LxButton variant="white" onClick={() => navigate(secondary[1])}>
                {secondary[0]}
              </LxButton>
            </div>
          </div>
        </LxReveal>
      </div>
    </section>
  );
}

const CLIENTS = ['Claude', 'ChatGPT', 'Cursor', 'Claude Code', 'VS Code', 'n8n', 'Windsurf'];

const PROMPTS = [
  { q: 'What does my ZieAds briefing say today? Start with the one thing I should do first.', a: 'Reads get_briefing' },
  { q: 'Which comments are buying signals? Draft a friendly reply to each one.', a: 'list_comments, then draft_comment_reply' },
  { q: 'Compare my Instagram reach this month with last month and tell me why it moved.', a: 'get_analytics' },
  { q: 'Draft 3 Reels captions for next week from my best formats and put them on my calendar.', a: 'create_draft_post' },
  { q: 'Is anything broken? Failed posts, expiring tokens, accounts that stopped syncing.', a: 'get_guardian_status' },
  { q: 'Start tracking Kopi Senja in Competitor Hunt and show me what they posted lately.', a: 'add_competitor, list_competitors' },
];

const READ_TOOLS = ['list_accounts', 'get_briefing', 'get_analytics', 'get_ads_summary', 'list_posts', 'list_comments', 'list_competitors', 'get_guardian_status', 'list_pending_actions'];
const DRAFT_TOOLS = ['create_draft_post', 'draft_comment_reply', 'add_competitor'];

/* ─────────────────────────── /mcp ─────────────────────────── */
export function McpPage() {
  useSeo('ZieAds MCP server: use ZieAds in Claude and ChatGPT', 'Connect ZieAds to Claude, ChatGPT, Cursor and other AI assistants. Ask about your briefing, analytics and inbox, and let the assistant draft posts and replies you approve.');
  const navigate = useNavigate();
  const signedIn = useSignedIn();
  return (
    <div className="lx">
      <LxNav />
      <main>
        <section className="dv-hero lx-center">
          <div className="lx-wrap">
            <LxReveal>
              <LxBadge n="01">MCP server</LxBadge>
              <h1 className="dv-h1">
                Your social media manager,
                <span>inside Claude and ChatGPT.</span>
              </h1>
              <p className="lx-lead">Ask about your briefing, analytics, inbox and competitors in plain words. The assistant drafts posts and replies, and every draft waits for your approval in ZieAds.</p>
              <div className="dv-btns">
                <LxButton variant="orange" onClick={() => navigate(signedIn ? '/settings/api' : '/sign-up')}>
                  {signedIn ? 'Connect an assistant' : 'Start for free'}
                </LxButton>
                <LxButton variant="white" onClick={() => navigate('/docs/mcp')}>
                  Read the MCP docs
                </LxButton>
              </div>
              <div className="dv-hero-url">
                <CopyLine label="Server URL" text={MCP_URL} />
              </div>
              <div className="dv-chips" aria-label="Works with">
                <span className="dv-chips-label">Works with</span>
                {CLIENTS.map((c) => (
                  <span key={c} className="dv-chip">
                    {c}
                  </span>
                ))}
              </div>
            </LxReveal>
          </div>
        </section>

        <Section n="02" badge="How it works" title="Connected in a minute." sub="No key to copy, no code.">
          <ol className="dv-steps">
            <li>
              <span>1</span>
              <strong>Paste the URL</strong>
              <p>In Claude add a custom connector, in ChatGPT create a connector, in Cursor add it to mcp.json.</p>
            </li>
            <li>
              <span>2</span>
              <strong>Sign in with ZieAds</strong>
              <p>A ZieAds screen shows what the assistant can read and draft. Choose Allow access.</p>
            </li>
            <li>
              <span>3</span>
              <strong>Ask anything</strong>
              <p>The assistant picks the right ZieAds tool, reads your synced data and answers with numbers.</p>
            </li>
          </ol>
        </Section>

        <Section n="03" badge="What you can ask" title="Work in the chat you already use." sub="ZieAds does the lookups." soft>
          <div className="dv-prompts">
            {PROMPTS.map((p) => (
              <div key={p.q} className="dv-prompt">
                <p>"{p.q}"</p>
                <small>{p.a}</small>
              </div>
            ))}
          </div>
        </Section>

        <Section n="04" badge="Tools" title="12 tools over your account." sub="Read freely, draft with approval." lead="A connection can be read only. Drafting tools appear only when you allow Create drafts.">
          <div className="dv-tools">
            <div className="dv-tool-col">
              <div className="dv-tool-head">
                <strong>Read</strong>
                <span>{READ_TOOLS.length} tools</span>
              </div>
              {READ_TOOLS.map((t) => (
                <code key={t}>{t}</code>
              ))}
            </div>
            <div className="dv-tool-col">
              <div className="dv-tool-head">
                <strong>Draft</strong>
                <span>{DRAFT_TOOLS.length} tools, wait for approval</span>
              </div>
              {DRAFT_TOOLS.map((t) => (
                <code key={t}>{t}</code>
              ))}
              <p className="dv-tool-note">Posts land on your calendar as drafts. Replies are saved, not sent. Competitors are added after you approve.</p>
            </div>
          </div>
          <p className="dv-more">
            <a href="/docs/mcp/tools">Every tool and its arguments</a>
          </p>
        </Section>

        <Section n="05" badge="Safe by design" title="The assistant drafts." sub="You decide what goes out." soft>
          <div className="dv-promises">
            <div>
              <strong>Nothing publishes on its own</strong>
              <p>Every write becomes an approval request in ZieAds. Approve it, edit it or dismiss it.</p>
            </div>
            <div>
              <strong>Ads are read only</strong>
              <p>The assistant can read spend and ROAS. It can never change a campaign or spend money.</p>
            </div>
            <div>
              <strong>Disconnect any time</strong>
              <p>Every connected app is listed in Settings. One click and its access stops.</p>
            </div>
            <div>
              <strong>Logged and limited</strong>
              <p>Every call is in the activity log and counts toward a daily limit per plan.</p>
            </div>
          </div>
        </Section>

        <Section n="06" badge="Compare" title="MCP on every plan." sub="Free included.">
          <CompareTable
            rows={[
              { label: 'MCP on the free plan', values: [true, true, 'Advanced plan and up'] },
              { label: 'Sign in with OAuth', values: [true, true, 'Key inside the URL'] },
              { label: 'Inbox comments over MCP', values: [true, false, true] },
              { label: 'Drafts wait for your approval', values: [true, 'Not stated', 'Not stated'] },
            ]}
          />
          <p className="lx-cmp-note">From each product's help pages, checked November 2026. Things change, so check before you buy.</p>
        </Section>

        <FinalCta
          title="Bring ZieAds into your assistant."
          sub="Free for one brand. 50 MCP calls a day on Free, up to 20,000 on Agency."
          primary={[signedIn ? 'Connect an assistant' : 'Start for free', signedIn ? '/settings/api' : '/sign-up']}
          secondary={['Building an integration? See the API', '/api']}
        />
      </main>
      <LxFooter />
    </div>
  );
}

/* ─────────────────────────── /api ─────────────────────────── */
const ENDPOINTS: [string, string, string, string][] = [
  ['GET', '/me', 'Key, plan and usage today', '/docs/api/account'],
  ['GET', '/accounts', 'Connected social accounts', '/docs/api/account'],
  ['GET', '/briefing', "Today's briefing as JSON", '/docs/api/briefing'],
  ['GET', '/analytics', 'Organic results per network', '/docs/api/analytics'],
  ['GET', '/ads/summary', 'Spend, conversions and ROAS', '/docs/api/analytics'],
  ['GET', '/posts', 'Calendar posts by date and status', '/docs/api/posts'],
  ['POST', '/posts', 'Draft a post', '/docs/api/posts'],
  ['GET', '/comments', 'Inbox, buying signals first', '/docs/api/comments'],
  ['POST', '/comments/:id/reply', 'Draft a reply', '/docs/api/comments'],
  ['GET', '/competitors', 'Tracked competitors', '/docs/api/competitors'],
  ['POST', '/competitors', 'Ask to track a competitor', '/docs/api/competitors'],
  ['GET', '/guardian', 'Account health and failed posts', '/docs/api/health'],
  ['GET', '/actions', 'Actions waiting for approval', '/docs/api/health'],
];

const USES = [
  { t: 'Posts from a spreadsheet', d: 'Every new Google Sheet row becomes a draft on your ZieAds calendar.' },
  { t: 'Briefing in your team chat', d: 'Send the morning briefing to Slack or WhatsApp at 8am with Zapier or Make.' },
  { t: 'Client reports and BI', d: 'Pull analytics and ads totals into Looker Studio, Sheets or your own dashboard.' },
  { t: 'Your own app', d: 'Show account health or pending approvals inside the tools your team already uses.' },
];

export function ApiPage() {
  useSeo('ZieAds REST API: briefing, analytics, posts and inbox over HTTPS', 'A simple REST API for ZieAds. Read your briefing, analytics, posts and comments, and draft posts and replies from Zapier, Make, n8n or your own code. Included on every plan.');
  const navigate = useNavigate();
  const signedIn = useSignedIn();
  const curl = `curl ${REST_BASE}/briefing \\\n  -H "Authorization: Bearer zk_your_key"`;
  const res = JSON.stringify(
    { data: { date: '2026-11-03', headline: 'Reels are winning this week.', actions: [{ rank: 1, title: 'Reply to 4 buying questions', kind: 'reply_comments' }] } },
    null,
    2
  );
  return (
    <div className="lx">
      <LxNav />
      <main>
        <section className="dv-hero dv-hero-split">
          <div className="lx-wrap dv-split">
            <LxReveal>
              <LxBadge n="01">REST API</LxBadge>
              <h1 className="dv-h1">
                Build on ZieAds
                <span>with plain HTTPS and JSON.</span>
              </h1>
              <p className="lx-lead">Read your briefing, analytics, posts and inbox, and draft posts and replies from Zapier, Make, n8n or your own code. Included on every plan.</p>
              <div className="dv-btns is-left">
                <LxButton variant="orange" onClick={() => navigate(signedIn ? '/settings/api' : '/sign-up')}>
                  {signedIn ? 'Get an API key' : 'Start for free'}
                </LxButton>
                <LxButton variant="white" onClick={() => navigate('/docs/api')}>
                  API reference
                </LxButton>
              </div>
              <div className="dv-hero-url is-left">
                <CopyLine label="Base URL" text={REST_BASE} />
              </div>
            </LxReveal>
            <LxReveal delay={120}>
              <div className="dv-code-stack">
                <CodeCard title="Request" code={curl} />
                <CodeCard title="Response 200" code={res} />
              </div>
            </LxReveal>
          </div>
        </section>

        <Section n="02" badge="Use cases" title="Automate the busywork." sub="Keep the approvals." soft>
          <div className="dv-uses">
            {USES.map((u) => (
              <div key={u.t} className="dv-use">
                <strong>{u.t}</strong>
                <p>{u.d}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section n="03" badge="Endpoints" title="13 endpoints." sub="One response shape." lead="Success returns { data }. Errors return { error: { code, message } } with a clear HTTP status.">
          <div className="dv-endpoints">
            {ENDPOINTS.map(([m, p, d, href]) => (
              <a key={m + p} href={href} className="dv-ep">
                <span className={`dv-method is-${m.toLowerCase()}`}>{m}</span>
                <code>/api{p}</code>
                <span className="dv-ep-desc">{d}</span>
              </a>
            ))}
          </div>
        </Section>

        <Section n="04" badge="Limits" title="Included on every plan." sub="One daily limit for API and MCP." soft>
          <div className="dv-limits">
            {[
              ['Free', '50'],
              ['Starter', '1,000'],
              ['Pro', '5,000'],
              ['Agency', '20,000'],
            ].map(([p, n]) => (
              <div key={p}>
                <small>{p}</small>
                <strong>{n}</strong>
                <span>calls a day</span>
              </div>
            ))}
          </div>
          <p className="dv-more">
            Keys start with zk_, can be read only, and can be revoked in one click. <a href="/docs/authentication">How keys and scopes work</a>
          </p>
        </Section>

        <Section n="05" badge="API or MCP" title="Two doors to the same data." sub="Pick by who is asking.">
          <div className="dv-pick">
            <div>
              <small>REST API</small>
              <strong>Your code asks</strong>
              <p>Fixed endpoints and predictable JSON for scripts, automations and your own apps. You send a key.</p>
              <a href="/docs/api">API reference</a>
            </div>
            <div>
              <small>MCP server</small>
              <strong>An AI assistant asks</strong>
              <p>Claude, ChatGPT or Cursor choose the right tool from a plain question. You sign in with ZieAds.</p>
              <a href="/mcp">About the MCP server</a>
            </div>
          </div>
          <CompareTable
            rows={[
              { label: 'REST API on every plan', values: [true, 'Advanced or Custom', 'Paid add-on'] },
              { label: 'One key for API and MCP', values: [true, 'Not stated', false] },
            ]}
          />
          <p className="lx-cmp-note">From each product's help pages, checked November 2026. Things change, so check before you buy.</p>
        </Section>

        <FinalCta
          title="Make your first call in two minutes."
          sub="Create a key in Settings, then call /api/me."
          primary={[signedIn ? 'Get an API key' : 'Start for free', signedIn ? '/settings/api' : '/sign-up']}
          secondary={['Read the quickstart', '/docs/quickstart']}
        />
      </main>
      <LxFooter />
    </div>
  );
}
