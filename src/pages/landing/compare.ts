/*
  Comparison data for the landing table and the /vs pages (spec 3, 12).
  Facts about other products come from their public pages, checked November 2026.
  Re-check before every release: prices and plans change. Sources sit next to each product.
*/

export type CompareKey = 'zieads' | 'metricool' | 'vista' | 'chatgpt' | 'agency';

export const COMPARE_COLUMNS: Array<{ key: CompareKey; label: string }> = [
  { key: 'zieads', label: 'ZieAds' },
  { key: 'metricool', label: 'Metricool' },
  { key: 'vista', label: 'Vista Social' },
  { key: 'chatgpt', label: 'ChatGPT' },
  { key: 'agency', label: 'Hiring an agency' },
];

export interface CompareRow {
  criteria: string;
  values: Record<CompareKey, string>;
}

export const COMPARE_ROWS: CompareRow[] = [
  {
    criteria: 'Briefing every morning with actions',
    values: { zieads: 'Yes, on every plan', metricool: 'No proactive briefing', vista: 'Scheduled agents on Advanced ($199)', chatgpt: 'Only when you ask', agency: 'Usually a weekly report' },
  },
  {
    criteria: 'Agent prepares the work, you approve, it executes',
    values: { zieads: 'Posts, replies and plans', metricool: 'AI writes, does not act on its own', vista: 'Yes, asks before it acts', chatgpt: 'No', agency: 'Yes, by people' },
  },
  {
    criteria: 'Ads read together with organic',
    values: { zieads: 'Yes, read only', metricool: 'Yes, ads module', vista: 'No ads reporting', chatgpt: 'No', agency: 'If you brief them' },
  },
  {
    criteria: 'MCP server for Claude, ChatGPT, Cursor',
    values: { zieads: 'Every plan', metricool: 'Every plan, limited on Free', vista: 'Advanced plan and up', chatgpt: 'Not applicable', agency: 'Not applicable' },
  },
  {
    criteria: 'Remembers your history',
    values: { zieads: 'Every briefing builds on the last', metricool: 'Analytics history', vista: 'Analytics history', chatgpt: 'Starts fresh in each chat', agency: 'In shared notes' },
  },
  {
    criteria: 'Starting price',
    values: { zieads: 'Free, paid from $29 per brand', metricool: 'Free, Starter $20 for 5 brands', vista: 'From $79 a month', chatgpt: '$20 plus your time', agency: '$3,000 to $5,000 a month' },
  },
];

/* Landing table: the alternatives buyers actually weigh (paid user research, Nov 2026).
   Suite price: Sprout Social Standard, from $199 per user a month on its public pricing page.
   Tool by tool comparisons live on the /vs pages. */
export type LandingKey = 'zieads' | 'scheduler' | 'suite' | 'agency';
export const LANDING_COMPARE_COLUMNS: Array<{ key: LandingKey; label: string }> = [
  { key: 'zieads', label: 'ZieAds' },
  { key: 'scheduler', label: 'A scheduler' },
  { key: 'suite', label: 'An enterprise suite' },
  { key: 'agency', label: 'Hiring an agency' },
];
export const LANDING_COMPARE_ROWS: Array<{ criteria: string; values: Record<LandingKey, string> }> = [
  {
    criteria: 'Tells you what to do next',
    values: { zieads: 'A morning plan with 3 actions and the evidence', scheduler: 'No, it posts what you give it', suite: 'Dashboards you read yourself', agency: 'A weekly or monthly report' },
  },
  {
    criteria: 'Does the work after you approve',
    values: { zieads: 'Posts, replies and plans', scheduler: 'Scheduling only', suite: 'Scheduling and replies by your team', agency: 'Yes, by people' },
  },
  {
    criteria: 'Checks every post went live',
    values: { zieads: 'Yes, retries up to 3 times, then flags it', scheduler: 'Varies by tool', suite: 'Varies by tool', agency: 'By hand' },
  },
  {
    criteria: 'Replies sorted by what matters',
    values: { zieads: 'Buying questions and complaints first', scheduler: 'Comments in one list, if included', suite: 'Yes, with rules you set up', agency: 'Yes, by people' },
  },
  {
    criteria: 'How you pay',
    values: { zieads: 'Per brand, seats included. Free, paid from $29', scheduler: 'Per channel or per seat', suite: 'From $199 per user a month', agency: 'From $1,500 a month' },
  },
];

export interface VsPage {
  slug: string;
  name: string;
  title: string;
  description: string;
  intro: string;
  theyDoWell: string[];
  whereZieAdsDiffers: string[];
  rows: Array<{ criteria: string; them: string; zieads: string }>;
  sources: Array<{ label: string; url: string }>;
}

export const VS_PAGES: VsPage[] = [
  {
    slug: 'metricool',
    name: 'Metricool',
    title: 'ZieAds vs Metricool: AI social media manager vs analytics suite',
    description: 'Compare ZieAds and Metricool for scheduling, inbox, analytics, ads reporting, AI agents and MCP. See which fits a founder or small agency.',
    intro: 'Metricool is a strong, affordable suite for scheduling and analytics across many networks. ZieAds is built around an agent that reads your accounts every morning, tells you what to do and prepares the work for your approval.',
    theyDoWell: ['A generous free plan and a low Starter price for several brands', 'Wide network coverage and a mature ads module', 'An MCP server on every plan'],
    whereZieAdsDiffers: ['A briefing every morning with three ranked actions, without asking', 'Approve and the agent executes: posts, replies and posting plans', 'Guardian checks that every scheduled post really went out', 'Organic and ads explained together in plain language'],
    rows: [
      { criteria: 'Proactive daily briefing', them: 'No', zieads: 'Yes, every plan' },
      { criteria: 'AI that acts after approval', them: 'Metricool describes its AI as not an autonomous agent', zieads: 'Yes' },
      { criteria: 'Ads reporting', them: 'Meta, Google and TikTok Ads', zieads: 'Meta, Google and TikTok Ads, read only' },
      { criteria: 'MCP', them: 'Every plan', zieads: 'Every plan' },
      { criteria: 'Starting paid price', them: '$20 a month for 5 brands', zieads: '$29 a month per brand' },
    ],
    sources: [
      { label: 'Metricool pricing', url: 'https://metricool.com/pricing/' },
      { label: 'Metricool: AI agents vs automation', url: 'https://metricool.com/ai-agents-vs-social-media-automation/' },
      { label: 'Metricool MCP', url: 'https://metricool.com/how-to-use-metricool-mcp-with-claude/' },
    ],
  },
  {
    slug: 'vista-social',
    name: 'Vista Social',
    title: 'ZieAds vs Vista Social: AI agent on every plan',
    description: 'Compare ZieAds and Vista Social for AI agents, scheduling, inbox, reviews, ads reporting and pricing for small teams and agencies.',
    intro: 'Vista Social is a complete social suite with a capable assistant and scheduled agents. ZieAds puts its agent in every plan, prices per brand and reads your ads next to organic results.',
    theyDoWell: ['Broad feature set including reviews and listening', 'Scheduled agents with a morning briefing and confirmation before actions', 'An MCP server with many tools'],
    whereZieAdsDiffers: ['The agent and briefing are included from the Free plan', 'Ads results read together with organic', 'Price per brand, not per profile bundle'],
    rows: [
      { criteria: 'Agent and scheduled briefing', them: 'From the Advanced plan ($199)', zieads: 'Every plan' },
      { criteria: 'Ads reporting', them: 'Not included', zieads: 'Read only, Meta, Google, TikTok' },
      { criteria: 'MCP', them: 'Advanced plan and up', zieads: 'Every plan' },
      { criteria: 'Starting paid price', them: '$79 a month', zieads: '$29 a month per brand' },
    ],
    sources: [
      { label: 'Vista Social pricing', url: 'https://vistasocial.com/pricing' },
      { label: 'Vista Social agents', url: 'https://support.vistasocial.com/hc/en-us/articles/49115170173339' },
      { label: 'Vista Social MCP tools', url: 'https://support.vistasocial.com/hc/en-us/articles/46525029430299-Vista-Social-s-Available-MCP-Tools' },
    ],
  },
  {
    slug: 'hootsuite',
    name: 'Hootsuite',
    title: 'ZieAds vs Hootsuite: an agent that tells you what to do',
    description: 'Compare ZieAds and Hootsuite for daily briefings, approvals, inbox, analytics, ads reporting and MCP for small businesses.',
    intro: 'Hootsuite is one of the best known social media suites, built for teams of every size. ZieAds is smaller and focused: one agent that briefs you every morning and does the work after you approve it, priced per brand.',
    theyDoWell: ['Large ecosystem of integrations', 'Enterprise features for big teams', 'An MCP integration'],
    whereZieAdsDiffers: ['Answer first: a briefing with actions instead of a dashboard to read', 'Pricing per brand with every AI feature included', 'Guardian checks for failed posts and expiring access'],
    rows: [
      { criteria: 'Proactive daily briefing', them: 'Check current plans', zieads: 'Yes, every plan' },
      { criteria: 'Pricing model', them: 'Per plan, see hootsuite.com/plans', zieads: 'Per brand, from $29' },
      { criteria: 'MCP', them: 'Available, see Hootsuite integrations', zieads: 'Every plan' },
    ],
    sources: [
      { label: 'Hootsuite plans', url: 'https://www.hootsuite.com/plans' },
      { label: 'Hootsuite MCP', url: 'https://www.hootsuite.com/integrations/mcp' },
    ],
  },
];
