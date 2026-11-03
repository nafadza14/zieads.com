/* Content of the ZieAds docs at /docs. One entry per page; the sidebar, search, prev and next come from this list. */
import { ReactNode } from 'react';
import { MCP_URL, REST_BASE, APP_ORIGIN } from '../../lib/publicUrls';
import { A, C, Callout, Cards, Code, Endpoint, H2, H3, P, Params, Steps, Table, Ul } from './kit';

export interface DocPage {
  slug: string;
  group: string;
  title: string;
  nav?: string;
  description: string;
  keywords?: string;
  body: () => ReactNode;
}

const KEY = 'zk_your_key';
const curl = (path: string, method = 'GET', body?: object) =>
  `curl${method !== 'GET' ? ` -X ${method}` : ''} ${REST_BASE}${path} \\\n  -H "Authorization: Bearer ${KEY}"${body ? ` \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(body)}'` : ''}`;
const js = (path: string, method = 'GET', body?: object) =>
  `const res = await fetch("${REST_BASE}${path}", {\n  method: "${method}",\n  headers: {\n    Authorization: "Bearer ${KEY}",${body ? '\n    "Content-Type": "application/json",' : ''}\n  },${body ? `\n  body: JSON.stringify(${JSON.stringify(body, null, 2).replace(/\n/g, '\n  ')}),` : ''}\n});\nconst { data } = await res.json();`;
const py = (path: string, method = 'GET', body?: object) =>
  `import requests\n\nres = requests.${method.toLowerCase()}(\n    "${REST_BASE}${path}",\n    headers={"Authorization": "Bearer ${KEY}"},${body ? `\n    json=${JSON.stringify(body).replace(/true/g, 'True').replace(/false/g, 'False')},` : ''}\n)\ndata = res.json()["data"]`;
const sample = (path: string, method = 'GET', body?: object) => (
  <Code
    tabs={[
      { label: 'curl', code: curl(path, method, body) },
      { label: 'JavaScript', code: js(path, method, body) },
      { label: 'Python', code: py(path, method, body) },
    ]}
  />
);
const resp = (obj: object, status = '200') => <Code title={`Response ${status}`} code={JSON.stringify(obj, null, 2)} />;

const TOOLS = [
  ['list_accounts', 'read', 'Connected social accounts with platform and handle.'],
  ['get_briefing', 'read', "Today's briefing: summary, what needs you, wins, concerns and 3 actions."],
  ['get_analytics', 'read', 'Followers, reach, interactions and engagement per network, top posts and paid totals.'],
  ['get_ads_summary', 'read', 'Spend, clicks, conversions, revenue and ROAS by platform and top campaigns.'],
  ['list_posts', 'read', 'Calendar posts between two dates, with status.'],
  ['list_comments', 'read', 'Inbox comments, buying signals and complaints first.'],
  ['list_competitors', 'read', 'Competitors tracked in Competitor Hunt.'],
  ['get_guardian_status', 'read', 'Connection health, failed posts and on time publishing.'],
  ['list_pending_actions', 'read', 'Actions waiting for your approval.'],
  ['create_draft_post', 'draft', 'Draft a post for one connected account. Waits for approval.'],
  ['draft_comment_reply', 'draft', 'Save a reply to a comment. Waits for approval before sending.'],
  ['add_competitor', 'draft', 'Ask to track a brand in Competitor Hunt. Waits for approval.'],
];

export const DOCS: DocPage[] = [
  /* ─────────────── Getting started ─────────────── */
  {
    slug: '',
    group: 'Getting started',
    title: 'Welcome to the ZieAds developer docs',
    nav: 'Introduction',
    description: 'Connect ZieAds to Claude, ChatGPT and Cursor with MCP, or build on the REST API.',
    keywords: 'intro overview start',
    body: () => (
      <>
        <P>
          ZieAds is an AI social media manager. It syncs your Instagram, Facebook, TikTok and LinkedIn accounts, writes a briefing every morning and drafts posts and replies you approve. Everything you see in the dashboard is also
          available to other tools, in two ways:
        </P>
        <Cards
          items={[
            { title: 'MCP server', desc: 'Ask Claude, ChatGPT or Cursor about your accounts and let them draft for you.', to: '/docs/mcp' },
            { title: 'REST API', desc: 'Plain HTTPS and JSON for Zapier, Make, n8n or your own code.', to: '/docs/api' },
            { title: 'Quickstart', desc: 'Connect Claude in two minutes, or make your first API call.', to: '/docs/quickstart' },
            { title: 'Authentication', desc: 'OAuth, keys, scopes and approvals.', to: '/docs/authentication' },
          ]}
        />
        <H2>How it works</H2>
        <Ul
          items={[
            <>
              <strong>One account, two doors.</strong> MCP and the REST API read the same data and share one daily limit.
            </>,
            <>
              <strong>Nothing goes out without you.</strong> Write actions create drafts and approval requests. You approve them in ZieAds, unless you let a key skip approval for a specific action.
            </>,
            <>
              <strong>Ads data is read only.</strong> ZieAds never changes your campaigns or spends money.
            </>,
          ]}
        />
        <H2>Addresses</H2>
        <Table
          head={['What', 'URL']}
          rows={[
            ['MCP server', <C>{MCP_URL}</C>],
            ['REST API base', <C>{REST_BASE}</C>],
            ['Keys and connected apps', <A to="/settings/api">Settings, API and MCP</A>],
          ]}
        />
        <Callout type="warning" title="Always use www">
          <C>zieads.com</C> redirects to <C>www.zieads.com</C>. Many MCP clients drop the Authorization header when they follow a redirect, so paste the www address exactly as shown.
        </Callout>
      </>
    ),
  },
  {
    slug: 'quickstart',
    group: 'Getting started',
    title: 'Quickstart',
    description: 'Connect an AI assistant or make your first API call in a few minutes.',
    keywords: 'start first call setup',
    body: () => (
      <>
        <H2>Connect Claude with MCP</H2>
        <Steps
          items={[
            { title: 'Copy the server URL', body: <Code code={MCP_URL} title="Server URL" /> },
            { title: 'Add a custom connector', body: <P>In Claude open Settings, then Connectors, and choose Add custom connector. Name it ZieAds and paste the URL.</P> },
            { title: 'Sign in with ZieAds', body: <P>Click Connect. A ZieAds window asks you to allow access. Choose Allow access and you are back in Claude.</P> },
            { title: 'Ask something', body: <P>Try: "What does my ZieAds briefing say today?" or "Draft 3 Instagram posts for next week from my best formats."</P> },
          ]}
        />
        <P>
          Using ChatGPT, Cursor or Claude Code instead? See <A to="/docs/mcp">all MCP clients</A>.
        </P>
        <H2>Make your first API call</H2>
        <Steps
          items={[
            {
              title: 'Create a key',
              body: (
                <P>
                  Open <A to="/settings/api">Settings, API and MCP</A>, scroll to Keys, name it and click Create key. Copy it right away, it is shown once.
                </P>
              ),
            },
            { title: 'Call the API', body: sample('/me') },
            { title: 'Read the response', body: resp({ data: { key: { name: 'My script', kind: 'key', scopes: ['read', 'draft'] }, plan: 'starter', usage: { day: '2026-11-03', used: 1, limit: 1000 } } }) },
          ]}
        />
      </>
    ),
  },
  {
    slug: 'authentication',
    group: 'Getting started',
    title: 'Authentication',
    description: 'OAuth for AI assistants, keys for scripts, scopes and approvals.',
    keywords: 'oauth api key bearer token scope approve auto approve revoke security',
    body: () => (
      <>
        <P>Every request carries a bearer token. There are two kinds, and both work on MCP and the REST API.</P>
        <Table
          head={['', 'OAuth (Sign in with ZieAds)', 'Key']}
          rows={[
            ['Best for', 'Claude, ChatGPT, Cursor, Claude Code, VS Code', 'REST API, Zapier, Make, n8n, scripts, MCP clients that take headers'],
            ['How you get it', 'The app opens a ZieAds screen and you choose Allow access', 'Create one in Settings, API and MCP'],
            ['Lifetime', 'Access token 1 hour, refreshed by the app for 90 days', 'Until you revoke it'],
            ['Where to revoke', 'Connected apps, Disconnect', 'Keys, Revoke'],
          ]}
        />
        <H2>Sending a key</H2>
        <Code code={`Authorization: Bearer ${KEY}`} title="Header" />
        <P>
          Keys start with <C>zk_</C>. ZieAds stores only a SHA-256 fingerprint, so a lost key cannot be recovered. Create a new one and revoke the old one. You can have 10 active keys.
        </P>
        <H2>Scopes</H2>
        <Table
          head={['Scope', 'Allows']}
          rows={[
            [<C>read</C>, 'Briefing, analytics, ads summary, posts, comments, competitors, account health and pending actions. Always included.'],
            [<C>draft</C>, 'Create draft posts, draft comment replies and ask to track competitors. Every draft waits for approval.'],
          ]}
        />
        <H2>Approvals and auto approve</H2>
        <P>
          A draft action creates an approval request in ZieAds. You see it on the AI Analyst page and in the approvals list. When you approve it, ZieAds does the work, for example schedules the post. A key can skip approval
          for these actions only:
        </P>
        <Table
          head={['Action', 'What happens when skipped']}
          rows={[
            [<C>schedule_post</C>, 'A drafted post is scheduled right away for its time.'],
            [<C>send_reply</C>, 'A drafted reply is sent to the comment.'],
            [<C>add_competitor</C>, 'The brand is added to Competitor Hunt.'],
          ]}
        />
        <Callout type="tip">Leave auto approve off until you trust a workflow. Every call is recorded in the activity log either way.</Callout>
        <H2>Keep keys safe</H2>
        <Ul items={['Never put a key in front end code or a public repository.', 'Use one key per tool, so you can revoke one without breaking the others.', 'Give read only keys to tools that only read.']} />
      </>
    ),
  },
  {
    slug: 'limits',
    group: 'Getting started',
    title: 'Plans and limits',
    description: 'Daily calls per plan, and what happens when you reach the limit.',
    keywords: 'rate limit quota 429 plan pricing calls per day',
    body: () => (
      <>
        <P>
          API and MCP calls share one daily counter per account. MCP counts each <C>tools/call</C>; listing tools and the handshake are free. REST counts each request. The counter resets at 00:00 UTC.
        </P>
        <Table
          head={['Plan', 'Calls a day', 'Brands', 'Analytics history']}
          rows={[
            ['Free', '50', '1', '30 days'],
            ['Starter', '1,000', '1', '12 months'],
            ['Pro', '5,000', '3', 'Unlimited'],
            ['Agency', '20,000', '10', 'Unlimited'],
          ]}
        />
        <H2>When you reach the limit</H2>
        <P>
          REST answers <C>429</C> with code <C>rate_limited</C>. MCP returns a JSON-RPC error with code <C>-32029</C>. REST responses also carry <C>X-RateLimit-Limit</C> and <C>X-RateLimit-Remaining</C> headers.
        </P>
        <P>
          Other plan limits apply as in the app, for example the number of competitors you can track. See <A to="/pricing">pricing</A>.
        </P>
      </>
    ),
  },

  /* ─────────────── MCP ─────────────── */
  {
    slug: 'mcp',
    group: 'MCP server',
    title: 'MCP server',
    nav: 'Overview',
    description: 'One URL that gives AI assistants your briefing, analytics, calendar, inbox and drafts.',
    keywords: 'model context protocol mcp server url transport streamable http',
    body: () => (
      <>
        <P>The Model Context Protocol (MCP) lets AI assistants call tools on other services. The ZieAds MCP server gives them 12 tools over your account.</P>
        <Table
          head={['Setting', 'Value']}
          rows={[
            ['Server URL', <C>{MCP_URL}</C>],
            ['Transport', 'Streamable HTTP (JSON responses, stateless)'],
            ['Authentication', 'OAuth 2.1 with PKCE and dynamic client registration, or a key as a Bearer token'],
            ['Protocol versions', '2025-06-18, 2025-03-26, 2024-11-05'],
          ]}
        />
        <H2>Pick your client</H2>
        <Cards
          items={[
            { title: 'Claude', desc: 'claude.ai, Claude Desktop and mobile.', to: '/docs/mcp/claude' },
            { title: 'ChatGPT', desc: 'Developer mode connectors.', to: '/docs/mcp/chatgpt' },
            { title: 'Cursor', desc: 'One line in mcp.json.', to: '/docs/mcp/cursor' },
            { title: 'Claude Code', desc: 'One terminal command.', to: '/docs/mcp/claude-code' },
            { title: 'VS Code', desc: 'GitHub Copilot agent mode.', to: '/docs/mcp/vscode' },
            { title: 'Other clients', desc: 'Windsurf, n8n, stdio only apps.', to: '/docs/mcp/other-clients' },
          ]}
        />
        <H2>What the assistant can do</H2>
        <Table head={['Tool', 'Scope', 'Does']} rows={TOOLS.map(([n, s, d]) => [<C>{n}</C>, s, d])} />
        <P>
          Full arguments are in the <A to="/docs/mcp/tools">tools reference</A>.
        </P>
        <H2>Prompts to try</H2>
        <Ul
          items={[
            '"Summarize my ZieAds briefing and tell me the one thing to do first."',
            '"Which comments are buying signals? Draft a friendly reply to each."',
            '"Compare my Instagram reach this month with last month."',
            '"Draft a carousel caption for Friday 7pm and put it on my calendar."',
          ]}
        />
      </>
    ),
  },
  {
    slug: 'mcp/claude',
    group: 'MCP server',
    title: 'Connect Claude',
    nav: 'Claude',
    description: 'Add ZieAds as a custom connector in claude.ai, Claude Desktop and the Claude mobile apps.',
    keywords: 'anthropic claude desktop claude.ai custom connector',
    body: () => (
      <>
        <P>Custom connectors sync across claude.ai, Claude Desktop and mobile, so you set it up once.</P>
        <Steps
          items={[
            { title: 'Open connector settings', body: <P>In Claude open Settings, then Connectors. Choose Add custom connector.</P> },
            {
              title: 'Paste the URL',
              body: (
                <>
                  <P>Name: ZieAds. Remote MCP server URL:</P>
                  <Code code={MCP_URL} title="URL" />
                  <P>Leave the OAuth client ID and secret empty. ZieAds registers Claude for you.</P>
                </>
              ),
            },
            { title: 'Connect and allow', body: <P>Click Add, then Connect. Log in to ZieAds if asked, review the access and choose Allow access.</P> },
            { title: 'Turn it on in a chat', body: <P>In a new chat open the tools menu and make sure ZieAds is enabled. Then ask about your accounts.</P> },
          ]}
        />
        <Callout title="Team and Enterprise">On Claude Team and Enterprise, an owner adds the connector once in the organization settings. Each member then connects their own ZieAds account.</Callout>
        <H2>Claude Desktop with a key</H2>
        <P>If you prefer a key over OAuth, Claude Desktop can run the connector through mcp-remote. Add this to claude_desktop_config.json and restart Claude.</P>
        <Code
          title="claude_desktop_config.json"
          code={JSON.stringify({ mcpServers: { zieads: { command: 'npx', args: ['-y', 'mcp-remote', MCP_URL, '--header', `Authorization: Bearer ${KEY}`] } } }, null, 2)}
        />
      </>
    ),
  },
  {
    slug: 'mcp/chatgpt',
    group: 'MCP server',
    title: 'Connect ChatGPT',
    nav: 'ChatGPT',
    description: 'Add ZieAds as a connector in ChatGPT developer mode.',
    keywords: 'openai chatgpt connector developer mode apps',
    body: () => (
      <>
        <Steps
          items={[
            { title: 'Turn on developer mode', body: <P>In ChatGPT open Settings, Apps and Connectors, Advanced settings, and turn on Developer mode. Your plan and workspace must allow it.</P> },
            {
              title: 'Create the connector',
              body: (
                <>
                  <P>Choose Create. Name: ZieAds. MCP server URL:</P>
                  <Code code={MCP_URL} title="URL" />
                  <P>Authentication: OAuth. Confirm that you trust the app and create it.</P>
                </>
              ),
            },
            { title: 'Sign in', body: <P>ChatGPT opens the ZieAds screen. Choose Allow access.</P> },
            { title: 'Use it', body: <P>In a chat, pick ZieAds from the tools or developer mode menu and ask your question.</P> },
          ]}
        />
        <Callout type="warning">ChatGPT asks you to confirm write actions. With ZieAds those only create drafts, which still wait for your approval in ZieAds.</Callout>
      </>
    ),
  },
  {
    slug: 'mcp/cursor',
    group: 'MCP server',
    title: 'Connect Cursor',
    nav: 'Cursor',
    description: 'Add the ZieAds MCP server to Cursor.',
    keywords: 'cursor ide mcp.json',
    body: () => (
      <>
        <P>Open Cursor Settings, MCP, Add new MCP server, or edit ~/.cursor/mcp.json directly.</P>
        <H2>With OAuth</H2>
        <Code title="mcp.json" code={JSON.stringify({ mcpServers: { zieads: { url: MCP_URL } } }, null, 2)} />
        <P>Cursor shows a Login button next to ZieAds the first time. Click it and choose Allow access.</P>
        <H2>With a key</H2>
        <Code title="mcp.json" code={JSON.stringify({ mcpServers: { zieads: { url: MCP_URL, headers: { Authorization: `Bearer ${KEY}` } } } }, null, 2)} />
      </>
    ),
  },
  {
    slug: 'mcp/claude-code',
    group: 'MCP server',
    title: 'Connect Claude Code',
    nav: 'Claude Code',
    description: 'Add ZieAds to Claude Code from the terminal.',
    keywords: 'claude code cli terminal',
    body: () => (
      <>
        <H2>With OAuth</H2>
        <Code title="Terminal" code={`claude mcp add --transport http zieads ${MCP_URL}`} />
        <P>
          Start Claude Code, type <C>/mcp</C>, pick zieads and choose Authenticate. Your browser opens the ZieAds screen.
        </P>
        <H2>With a key</H2>
        <Code title="Terminal" code={`claude mcp add --transport http zieads ${MCP_URL} \\\n  --header "Authorization: Bearer ${KEY}"`} />
        <P>
          Add <C>--scope user</C> to use it in every project.
        </P>
      </>
    ),
  },
  {
    slug: 'mcp/vscode',
    group: 'MCP server',
    title: 'Connect VS Code',
    nav: 'VS Code',
    description: 'Use ZieAds in GitHub Copilot agent mode.',
    keywords: 'vscode visual studio code copilot',
    body: () => (
      <>
        <P>Create .vscode/mcp.json in your project, or run MCP: Add Server from the command palette.</P>
        <Code title=".vscode/mcp.json" code={JSON.stringify({ servers: { zieads: { type: 'http', url: MCP_URL } } }, null, 2)} />
        <P>VS Code asks you to sign in the first time the server starts. To use a key instead, add a headers object with Authorization.</P>
      </>
    ),
  },
  {
    slug: 'mcp/other-clients',
    group: 'MCP server',
    title: 'Other MCP clients',
    nav: 'Other clients',
    description: 'Windsurf, n8n, Zed and apps that only run local stdio servers.',
    keywords: 'windsurf n8n zed mcp-remote stdio inspector',
    body: () => (
      <>
        <P>Any client that speaks Streamable HTTP works. Give it the server URL and either let it sign in with OAuth or send a key in the Authorization header.</P>
        <Code title="Generic config" code={JSON.stringify({ mcpServers: { zieads: { type: 'http', url: MCP_URL, headers: { Authorization: `Bearer ${KEY}` } } } }, null, 2)} />
        <H2>Clients that only run local servers</H2>
        <P>Use mcp-remote as a bridge. It runs locally over stdio and talks to ZieAds over HTTPS.</P>
        <Code title="Command" code={`npx -y mcp-remote ${MCP_URL} --header "Authorization: Bearer ${KEY}"`} />
        <H2>n8n</H2>
        <P>Add an MCP Client Tool node to your AI Agent. Endpoint: the server URL. Server transport: HTTP Streamable. Authentication: Header Auth with name Authorization and value Bearer plus your key.</P>
        <H2>Test with MCP Inspector</H2>
        <Code title="Terminal" code="npx @modelcontextprotocol/inspector" />
        <P>Choose Streamable HTTP, paste the URL, then either use the OAuth flow or add the Authorization header.</P>
      </>
    ),
  },
  {
    slug: 'mcp/tools',
    group: 'MCP server',
    title: 'Tools reference',
    description: 'Every MCP tool with its arguments and scope.',
    keywords: 'tools arguments schema list_accounts get_briefing get_analytics create_draft_post draft_comment_reply add_competitor',
    body: () => (
      <>
        <P>
          Tools return JSON in <C>structuredContent</C> and the same JSON as text. Input mistakes come back as a result with <C>isError: true</C> so the assistant can fix them.
        </P>
        <H2 id="list_accounts">list_accounts</H2>
        <P>Connected accounts. No arguments. Scope read.</P>
        <H2 id="get_briefing">get_briefing</H2>
        <P>The latest daily briefing: headline, summary, needs_you, wins, concerns and actions. No arguments. Scope read.</P>
        <H2 id="get_analytics">get_analytics</H2>
        <Params
          items={[
            { name: 'days', type: '7 | 30 | 90 | 365', desc: 'Window, default 30. Limited by your plan history.' },
            { name: 'platform', type: 'instagram | facebook | tiktok | linkedin', desc: 'Only one network.' },
          ]}
        />
        <H2 id="get_ads_summary">get_ads_summary</H2>
        <Params items={[{ name: 'days', type: 'integer 1-365', desc: 'Window, default 30.' }]} />
        <H2 id="list_posts">list_posts</H2>
        <Params
          items={[
            { name: 'from', type: 'ISO date-time', desc: 'Default 7 days ago.' },
            { name: 'to', type: 'ISO date-time', desc: 'Default 30 days ahead.' },
            { name: 'status', type: 'string', desc: 'draft, in_review, approved, scheduled, publishing, published, needs_action or failed.' },
          ]}
        />
        <H2 id="list_comments">list_comments</H2>
        <Params
          items={[
            { name: 'view', type: 'needs_reply | buying | complaints | questions | all', desc: 'Default needs_reply.' },
            { name: 'limit', type: 'integer 1-50', desc: 'Default 20.' },
          ]}
        />
        <H2 id="list_competitors">list_competitors</H2>
        <P>No arguments. Scope read.</P>
        <H2 id="get_guardian_status">get_guardian_status</H2>
        <P>Connections, problem posts and the 7 day on time rate. No arguments. Scope read.</P>
        <H2 id="list_pending_actions">list_pending_actions</H2>
        <P>No arguments. Scope read.</P>
        <H2 id="create_draft_post">create_draft_post</H2>
        <Params
          items={[
            { name: 'platform', type: 'instagram | facebook | tiktok | linkedin', required: true, desc: 'Must be connected in ZieAds.' },
            { name: 'caption', type: 'string, max 2200', required: true, desc: 'Post text.' },
            { name: 'scheduled_for', type: 'ISO date-time', desc: 'When it goes out after approval.' },
            { name: 'media_url', type: 'https URL', desc: 'Public image or video.' },
            { name: 'first_comment', type: 'string', desc: 'Posted as the first comment.' },
          ]}
        />
        <H2 id="draft_comment_reply">draft_comment_reply</H2>
        <Params
          items={[
            { name: 'comment_id', type: 'string', required: true, desc: 'From list_comments.' },
            { name: 'text', type: 'string, max 2200', required: true, desc: 'Reply text.' },
          ]}
        />
        <H2 id="add_competitor">add_competitor</H2>
        <Params
          items={[
            { name: 'name', type: 'string', required: true, desc: 'Brand name.' },
            { name: 'website_url', type: 'string', desc: 'Website.' },
            { name: 'instagram_username', type: 'string', desc: 'With or without @.' },
          ]}
        />
      </>
    ),
  },
  {
    slug: 'mcp/oauth',
    group: 'MCP server',
    title: 'OAuth reference',
    description: 'Endpoints and rules for developers building an MCP client.',
    keywords: 'oauth 2.1 pkce dynamic client registration well-known metadata token refresh',
    body: () => (
      <>
        <P>ZieAds follows the MCP authorization spec. Clients that implement it, like Claude and ChatGPT, need nothing but the server URL.</P>
        <Table
          head={['Endpoint', 'URL']}
          rows={[
            ['Protected resource metadata', <C>{APP_ORIGIN}/.well-known/oauth-protected-resource/mcp</C>],
            ['Authorization server metadata', <C>{APP_ORIGIN}/.well-known/oauth-authorization-server</C>],
            ['Registration (RFC 7591)', <C>{APP_ORIGIN}/api/oauth/register</C>],
            ['Authorization', <C>{APP_ORIGIN}/oauth/authorize</C>],
            ['Token', <C>{APP_ORIGIN}/api/oauth/token</C>],
            ['Revocation', <C>{APP_ORIGIN}/api/oauth/revoke</C>],
          ]}
        />
        <H2>Flow</H2>
        <Ul
          items={[
            <>
              A request without a token gets <C>401</C> and a <C>WWW-Authenticate</C> header with <C>resource_metadata</C>.
            </>,
            'The client reads both metadata documents and registers itself.',
            <>
              The user is sent to <C>/oauth/authorize</C> with <C>response_type=code</C>, <C>code_challenge</C> (S256 only), <C>state</C> and <C>scope</C> (read, draft).
            </>,
            'After Allow access the browser returns to the redirect URI with code, state and iss.',
            <>
              The client exchanges the code at the token endpoint with <C>code_verifier</C>. Codes last 10 minutes and work once.
            </>,
          ]}
        />
        <H2>Tokens</H2>
        <Table
          head={['Token', 'Lifetime', 'Notes']}
          rows={[
            ['Access token', '1 hour', 'Send as Authorization: Bearer'],
            ['Refresh token', '90 days', 'Rotates on every use; reusing an old one fails'],
          ]}
        />
        <P>Redirect URIs must be https, http on localhost, or a custom app scheme. Public clients use token_endpoint_auth_method none; confidential clients may use client_secret_post or client_secret_basic.</P>
      </>
    ),
  },
  {
    slug: 'mcp/troubleshooting',
    group: 'MCP server',
    title: 'Troubleshooting',
    description: 'Fixes for the most common connection problems.',
    keywords: 'error not working failed connect 401 403 redirect',
    body: () => (
      <>
        <H2>The connection fails right away</H2>
        <Ul
          items={[
            <>
              Check the URL is exactly <C>{MCP_URL}</C>, with www and without a trailing slash.
            </>,
            'Make sure you are logged in to ZieAds in the same browser that opens the sign in window.',
            'Disconnect the app in Settings, API and MCP, remove the connector in your client and add it again.',
          ]}
        />
        <H2>401 Missing, expired or revoked key</H2>
        <P>The key was revoked or mistyped, or the app's token expired and it could not refresh. Create a new key, or reconnect the app.</P>
        <H2>Tools are missing</H2>
        <P>A read only key or connection shows only read tools. Reconnect and keep Create drafts on, or create a key with drafting allowed.</P>
        <H2>Daily MCP limit reached</H2>
        <P>
          You used today's calls for your plan. It resets at 00:00 UTC. See <A to="/docs/limits">limits</A>.
        </P>
        <H2>API and MCP is not set up on the database yet</H2>
        <P>
          For self hosted ZieAds: run <C>supabase/migrations/20261104_api_mcp_oauth.sql</C> in the Supabase SQL editor.
        </P>
        <H2>Still stuck?</H2>
        <P>
          Email <A to="mailto:founder@zieads.com">founder@zieads.com</A> with the client you use and the error text.
        </P>
      </>
    ),
  },

  /* ─────────────── REST API ─────────────── */
  {
    slug: 'api',
    group: 'REST API',
    title: 'REST API',
    nav: 'Overview',
    description: 'Base URL, authentication, response format and errors.',
    keywords: 'rest api http json base url errors status codes',
    body: () => (
      <>
        <Table
          head={['', '']}
          rows={[
            ['Base URL', <C>{REST_BASE}</C>],
            ['Auth', <>Authorization: Bearer {KEY}</>],
            ['Format', 'JSON in, JSON out. Dates are ISO 8601 in UTC.'],
            ['Limit', <A to="/docs/limits">Shared with MCP, per day</A>],
          ]}
        />
        <H2>Responses</H2>
        <P>
          Success responses wrap the result in <C>data</C>. Creating something returns <C>201</C>.
        </P>
        {resp({ data: { accounts: [{ id: '6b1f0c2e-...', platform: 'instagram', handle: '@kopikita', connected_at: '2026-10-02T09:12:00Z' }] } })}
        <H2>Errors</H2>
        {resp({ error: { code: 'insufficient_scope', message: 'This key does not have the "draft" scope' } }, '403')}
        <Table
          head={['Status', 'code', 'Meaning']}
          rows={[
            ['400', <C>invalid_request</C>, 'A parameter is missing or wrong. The message says which.'],
            ['401', <C>unauthorized</C>, 'Missing, expired or revoked key.'],
            ['403', <C>insufficient_scope</C>, 'The key cannot draft.'],
            ['404', <C>not_found</C>, 'No such endpoint.'],
            ['429', <C>rate_limited</C>, 'Daily limit reached.'],
            ['500', <C>server_error</C>, 'Something broke on our side. Retry with backoff.'],
          ]}
        />
        <H2>Endpoints</H2>
        <Table
          head={['Method', 'Path', 'Scope']}
          rows={[
            ['GET', <A to="/docs/api/account">/me</A>, 'read'],
            ['GET', <A to="/docs/api/account">/accounts</A>, 'read'],
            ['GET', <A to="/docs/api/briefing">/briefing</A>, 'read'],
            ['GET', <A to="/docs/api/analytics">/analytics</A>, 'read'],
            ['GET', <A to="/docs/api/analytics">/ads/summary</A>, 'read'],
            ['GET', <A to="/docs/api/posts">/posts</A>, 'read'],
            ['POST', <A to="/docs/api/posts">/posts</A>, 'draft'],
            ['GET', <A to="/docs/api/comments">/comments</A>, 'read'],
            ['POST', <A to="/docs/api/comments">/comments/:id/reply</A>, 'draft'],
            ['GET', <A to="/docs/api/competitors">/competitors</A>, 'read'],
            ['POST', <A to="/docs/api/competitors">/competitors</A>, 'draft'],
            ['GET', <A to="/docs/api/health">/guardian</A>, 'read'],
            ['GET', <A to="/docs/api/health">/actions</A>, 'read'],
          ]}
        />
      </>
    ),
  },
  {
    slug: 'api/account',
    group: 'REST API',
    title: 'Account and connected accounts',
    nav: 'Account',
    description: 'Who the key belongs to, the plan, usage and connected social accounts.',
    keywords: 'me usage accounts plan',
    body: () => (
      <>
        <H2>Get the key and usage</H2>
        <Endpoint method="GET" path="/api/me" scope="read" />
        {sample('/me')}
        {resp({ data: { key: { id: 'a3c1...', name: 'Zapier', kind: 'key', scopes: ['read', 'draft'], auto_approve: [] }, plan: 'pro', usage: { day: '2026-11-03', used: 42, limit: 5000 } } })}
        <H2>List connected accounts</H2>
        <Endpoint method="GET" path="/api/accounts" scope="read" />
        {sample('/accounts')}
        {resp({ data: { accounts: [{ id: '6b1f...', platform: 'instagram', handle: '@kopikita', connected_at: '2026-10-02T09:12:00Z' }, { id: '91d0...', platform: 'facebook', handle: 'Kopi Kita', connected_at: '2026-10-02T09:13:00Z' }] } })}
      </>
    ),
  },
  {
    slug: 'api/briefing',
    group: 'REST API',
    title: 'Briefing',
    description: "Today's briefing as JSON.",
    keywords: 'daily briefing morning summary actions',
    body: () => (
      <>
        <Endpoint method="GET" path="/api/briefing" scope="read" />
        <P>Returns the latest briefing. Free plans get a weekly briefing, paid plans a daily one.</P>
        {sample('/briefing')}
        {resp({
          data: {
            version: 2,
            date: '2026-11-03',
            headline: 'Reels are winning this week. 4 buying questions are waiting for you.',
            summary: ['Reels got 2.3x the interactions of photos this week.'],
            needs_you: [{ title: '4 buying questions waiting', detail: 'Price and stock questions on the serum Reel.' }],
            wins: [{ title: 'Serum Reel: 412 interactions', metric: '412' }],
            concerns: [{ title: 'Facebook token expires in 6 days' }],
            actions: [{ rank: 1, title: 'Reply to 4 buying questions', why: 'Warm buyers go cold after a day.', kind: 'reply_comments', evidence: [{ label: 'Waiting', value: 4 }] }],
            channels: [{ platform: 'instagram', handle: '@kopikita', status: 'live' }],
          },
        })}
      </>
    ),
  },
  {
    slug: 'api/analytics',
    group: 'REST API',
    title: 'Analytics and ads',
    nav: 'Analytics',
    description: 'Organic results per network and the paid summary.',
    keywords: 'analytics reach followers engagement ads roas spend',
    body: () => (
      <>
        <H2>Organic and paid results</H2>
        <Endpoint method="GET" path="/api/analytics" scope="read" />
        <Params
          title="Query"
          items={[
            { name: 'days', type: '7 | 30 | 90 | 365', desc: 'Default 30. Limited by your plan history.' },
            { name: 'platform', type: 'instagram | facebook | tiktok | linkedin', desc: 'Only one network.' },
          ]}
        />
        {sample('/analytics?days=30')}
        {resp({
          data: {
            totals: { followers: 23710, followers_net: 312, reach: 41200, interactions: 2380, interactions_change_pct: 12.4, posts: 18, engagement_rate: 5.78 },
            per_network: [{ platform: 'instagram', handle: '@kopikita', followers: 18200, reach: 33100, posts: 12, interactions: 1980, engagement_rate: 5.98 }],
            organic: { posts: [{ id: 'p1', platform: 'instagram', format: 'reels', caption: 'Serum Reel', reach: 9100, likes: 380, comments: 32 }] },
          },
        })}
        <H2>Ads summary</H2>
        <Endpoint method="GET" path="/api/ads/summary" scope="read" />
        <Params title="Query" items={[{ name: 'days', type: 'integer 1-365', desc: 'Default 30.' }]} />
        {sample('/ads/summary?days=30')}
        {resp({ data: { days: 30, has_data: true, source: 'api', totals: { spend: 1240.5, clicks: 3920, conversions: 118, revenue: 4980, roas: 4.01 }, by_platform: [], top_campaigns: [] } })}
      </>
    ),
  },
  {
    slug: 'api/posts',
    group: 'REST API',
    title: 'Posts',
    description: 'List calendar posts and draft new ones.',
    keywords: 'posts calendar schedule draft publish caption media',
    body: () => (
      <>
        <H2>List posts</H2>
        <Endpoint method="GET" path="/api/posts" scope="read" />
        <Params
          title="Query"
          items={[
            { name: 'from', type: 'ISO date-time', desc: 'Default 7 days ago.' },
            { name: 'to', type: 'ISO date-time', desc: 'Default 30 days ahead.' },
            { name: 'status', type: 'string', desc: 'draft, in_review, approved, scheduled, publishing, published, needs_action or failed.' },
          ]}
        />
        {sample('/posts?status=scheduled')}
        {resp({ data: { posts: [{ id: 'f2a9...', platform: 'instagram', caption: 'Behind the scenes at the roastery', status: 'scheduled', scheduled_for: '2026-11-06T12:30:00Z', published_at: null }] } })}
        <H2>Draft a post</H2>
        <Endpoint method="POST" path="/api/posts" scope="draft" />
        <Params
          title="Body"
          items={[
            { name: 'platform', type: 'instagram | facebook | tiktok | linkedin', required: true, desc: 'Must be connected.' },
            { name: 'caption', type: 'string, max 2200', required: true, desc: 'Post text.' },
            { name: 'scheduled_for', type: 'ISO date-time', desc: 'When it goes out after approval.' },
            { name: 'media_url', type: 'https URL', desc: 'Public image or video.' },
            { name: 'first_comment', type: 'string', desc: 'Posted as the first comment.' },
          ]}
        />
        {sample('/posts', 'POST', { platform: 'instagram', caption: 'New single origin is in. Which one should we brew first?', scheduled_for: '2026-11-07T11:00:00Z' })}
        {resp({ data: { post_id: 'f2a9...', task_id: '0c7e...', status: 'pending_approval', message: 'Waiting for approval in ZieAds (AI Analyst or the approvals list).' } }, '201')}
        <Callout type="info">The post lands on your calendar as a draft. If the key auto approves schedule_post, status is executed and the post is scheduled.</Callout>
      </>
    ),
  },
  {
    slug: 'api/comments',
    group: 'REST API',
    title: 'Comments',
    description: 'Read the Inbox and draft replies.',
    keywords: 'comments inbox reply buying signals complaints',
    body: () => (
      <>
        <H2>List comments</H2>
        <Endpoint method="GET" path="/api/comments" scope="read" />
        <Params
          title="Query"
          items={[
            { name: 'view', type: 'needs_reply | buying | complaints | questions | all', desc: 'Default needs_reply.' },
            { name: 'limit', type: 'integer 1-50', desc: 'Default 20.' },
          ]}
        />
        {sample('/comments?view=buying')}
        {resp({ data: { comments: [{ id: '5d21...', platform: 'instagram', author_username: 'dinda.rahma', text: 'Kak serumnya masih ready? Harga yang 30ml berapa ya?', intent: 'buying_signal', sentiment: 'neutral', status: 'unread', posted_at: '2026-11-03T02:14:00Z' }] } })}
        <H2>Draft a reply</H2>
        <Endpoint method="POST" path="/api/comments/:id/reply" scope="draft" />
        <Params title="Body" items={[{ name: 'text', type: 'string, max 2200', required: true, desc: 'Reply text.' }]} />
        {sample('/comments/5d21.../reply', 'POST', { text: 'Masih ready kak! Yang 30ml Rp149.000, cek link di bio ya.' })}
        {resp({ data: { task_id: '7a10...', status: 'pending_approval', message: 'Waiting for approval in ZieAds (AI Analyst or the approvals list).' } }, '201')}
      </>
    ),
  },
  {
    slug: 'api/competitors',
    group: 'REST API',
    title: 'Competitors',
    description: 'List tracked competitors and ask to track new ones.',
    keywords: 'competitors hunt track',
    body: () => (
      <>
        <H2>List competitors</H2>
        <Endpoint method="GET" path="/api/competitors" scope="read" />
        {sample('/competitors')}
        {resp({ data: { competitors: [{ id: 'c1...', name: 'Kopi Senja', website_url: 'https://kopisenja.id', instagram_username: 'kopisenja', content_stats: { ads_active: 6, posts: 120 } }] } })}
        <H2>Track a competitor</H2>
        <Endpoint method="POST" path="/api/competitors" scope="draft" />
        <Params
          title="Body"
          items={[
            { name: 'name', type: 'string', required: true, desc: 'Brand name.' },
            { name: 'website_url', type: 'string', desc: 'Website.' },
            { name: 'instagram_username', type: 'string', desc: 'With or without @.' },
          ]}
        />
        {sample('/competitors', 'POST', { name: 'Kopi Senja', instagram_username: 'kopisenja' })}
        {resp({ data: { task_id: '9b42...', status: 'pending_approval', message: 'Waiting for approval in ZieAds (AI Analyst or the approvals list).' } }, '201')}
      </>
    ),
  },
  {
    slug: 'api/health',
    group: 'REST API',
    title: 'Account health and approvals',
    nav: 'Health and approvals',
    description: 'Guardian status and actions waiting for approval.',
    keywords: 'guardian health failed posts approvals pending actions',
    body: () => (
      <>
        <H2>Account health</H2>
        <Endpoint method="GET" path="/api/guardian" scope="read" />
        {sample('/guardian')}
        {resp({ data: { connections: [{ platform: 'facebook', platform_username: 'Kopi Kita', status: 'live', token_expires_at: '2026-11-09T00:00:00Z' }], problem_posts: [], reliability: { due: 14, published: 14, on_time: 14, failed: 0, on_time_rate: 100 } } })}
        <H2>Waiting for approval</H2>
        <Endpoint method="GET" path="/api/actions" scope="read" />
        {sample('/actions')}
        {resp({ data: { actions: [{ id: '0c7e...', kind: 'schedule_post', title: 'Schedule a instagram post from Zapier', created_by: 'mcp', created_at: '2026-11-03T07:20:00Z' }] } })}
      </>
    ),
  },

  /* ─────────────── Guides ─────────────── */
  {
    slug: 'guides/automations',
    group: 'Guides',
    title: 'Zapier, Make and n8n',
    nav: 'Zapier, Make and n8n',
    description: 'Use the REST API from no code tools with an HTTP step.',
    keywords: 'zapier make integromat n8n webhook automation no code',
    body: () => (
      <>
        <P>Every no code tool has a step that sends an HTTP request. Point it at the REST API with your key.</P>
        <H2>Zapier</H2>
        <Steps
          items={[
            { title: 'Add a Webhooks by Zapier action', body: <P>Pick Custom Request.</P> },
            { title: 'Fill it in', body: <P>Method GET or POST, URL for example {REST_BASE}/posts, Headers: Authorization = Bearer {KEY} and Content-Type = application/json, Data: the JSON body.</P> },
            { title: 'Test', body: <P>Zapier shows the data object. Map its fields into the next steps.</P> },
          ]}
        />
        <H2>Make</H2>
        <P>Add an HTTP, Make a request module. Same URL, method and headers. Set Body type to Raw, content type JSON, and turn on Parse response.</P>
        <H2>n8n</H2>
        <P>Add an HTTP Request node. Authentication: Generic, Header Auth, name Authorization, value Bearer plus your key. For an AI Agent node, use the MCP Client Tool instead, see <A to="/docs/mcp/other-clients">other clients</A>.</P>
        <H2>Recipe: draft a post from a Google Sheet row</H2>
        <Code title="Body for POST /api/posts" code={JSON.stringify({ platform: 'instagram', caption: '{{caption column}}', scheduled_for: '{{date column}}', media_url: '{{image url column}}' }, null, 2)} />
        <P>Each row becomes a draft on your calendar. Approve them in ZieAds, or let the key auto approve schedule_post.</P>
      </>
    ),
  },
  {
    slug: 'faq',
    group: 'Guides',
    title: 'FAQ',
    description: 'Short answers to common questions.',
    keywords: 'faq questions security data',
    body: () => (
      <>
        <H3>Can an assistant publish or reply without me?</H3>
        <P>No. Write tools create drafts and approval requests. Only a key you set to auto approve a specific action can skip that step.</P>
        <H3>Does the API change my ads?</H3>
        <P>No. Ads data is read only.</P>
        <H3>Is there a cost?</H3>
        <P>API and MCP are included in every plan, Free included, within the daily call limit.</P>
        <H3>Which data can an app see?</H3>
        <P>Only your ZieAds account: connected accounts, briefing, analytics, calendar, inbox, competitors and pending approvals. Never your password or social media tokens.</P>
        <H3>How do I disconnect an app?</H3>
        <P>
          Open <A to="/settings/api">Settings, API and MCP</A> and choose Disconnect next to the app, or Revoke next to the key. It stops working right away.
        </P>
        <H3>Is there a sandbox?</H3>
        <P>Not yet. Use a read only key while you build, then switch to a key that can draft.</P>
      </>
    ),
  },
  {
    slug: 'changelog',
    group: 'Guides',
    title: 'Changelog',
    description: 'What changed in the API and MCP server.',
    keywords: 'changelog versions release notes',
    body: () => (
      <>
        <H2 id="2026-11-05">November 5, 2026</H2>
        <Ul items={[<>New short addresses: MCP at <C>{MCP_URL}</C> and the REST API at <C>{REST_BASE}</C>.</>, 'The old /api/mcp and /v1 addresses keep working, so existing setups need no change.']} />
        <H2 id="2026-11-04">November 4, 2026</H2>
        <Ul
          items={['Sign in with ZieAds (OAuth 2.1) for Claude, ChatGPT, Cursor, Claude Code and VS Code.', 'REST API v1 with 13 endpoints.', 'New list_accounts tool.', 'One daily limit shared by API and MCP.']}
        />
        <H2 id="2026-11-03">November 3, 2026</H2>
        <Ul items={['MCP server v1 with 11 tools, key authentication, scopes and approvals.']} />
      </>
    ),
  },
];

export const GROUPS = ['Getting started', 'MCP server', 'REST API', 'Guides'];
