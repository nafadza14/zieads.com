import { ReactNode } from 'react';
import {
  Activity,
  AlertTriangle,
  Briefcase,
  EyeOff,
  Radar,
  Rocket,
  Sliders,
  TrendingDown,
  UserCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';

export const rotatingPlaceholders = [
  "Ask AI Agent: 'Generate 5 viral TikTok hooks for my brand...'",
  "Ask AI Agent: 'Why did my Meta Ads ROAS drop this week?'",
  "Ask AI Agent: 'Create a 7-day Instagram content calendar...'",
  "Ask AI Agent: 'Recommend audience targeting & budget for Meta vs TikTok...'",
];

export const rotatingPhrases = [
  'runs your social media.',
  "never misses what's working.",
  'briefs you every morning.',
  'turns your data into decisions.',
  'watches while you sleep.',
];

export interface ReportTab {
  label: string;
  content: ReactNode;
}

export const reportTabs: ReportTab[] = [
  {
    label: 'Readiness Score',
    content: (
      <div className="report-tab-panel">
        <p
          className="report-tab-intro"
          style={{ marginBottom: 16, fontSize: '14px', lineHeight: '1.6', color: 'var(--lp-text-secondary)' }}
        >
          Your score breaks down across six dimensions, each weighted by how much it actually affects paid performance.
          A weak score on 'Creative and Offer' matters more than a weak score on 'Competitive' because it kills your
          campaign before the first impression.
        </p>
        <div className="report-score-header">
          <div className="report-overall-score">
            <span className="report-score-number mono-num">61</span>
            <span className="report-score-max mono-num">/100</span>
          </div>
          <div className="report-grade-badge report-grade-c">C - Structural gaps present</div>
        </div>
        <div className="report-dimensions-list">
          {[
            { name: 'Creative & Offer', score: 55, weight: '25%', flag: 'Offer clarity below threshold' },
            { name: 'Audience Clarity', score: 70, weight: '20%', flag: 'ICP partially defined' },
            { name: 'Landing Page', score: 48, weight: '20%', flag: 'No above-fold CTA detected' },
            { name: 'Platform Fit', score: 65, weight: '15%', flag: '' },
            { name: 'Funnel Coverage', score: 60, weight: '10%', flag: 'No retargeting layer detected' },
            { name: 'Competitive', score: 55, weight: '10%', flag: '' },
          ].map((d, i) => (
            <div key={i} className="report-dim-row">
              <div className="report-dim-info">
                <span className="report-dim-name">{d.name}</span>
                <span className="report-dim-weight mono-num">{d.weight}</span>
              </div>
              <div className="report-dim-bar-track">
                <div className="report-dim-bar-fill" style={{ width: `${d.score}%` }}></div>
              </div>
              <div className="report-dim-meta">
                <span className="report-dim-score mono-num">{d.score}</span>
                {d.flag && (
                  <span className="report-dim-flag">
                    <AlertTriangle size={12} /> {d.flag}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    label: 'Top Gaps',
    content: (
      <div className="report-tab-panel">
        <div className="report-findings-list">
          {[
            {
              severity: 'Critical',
              finding: 'No Meta Pixel detected on your checkout page',
              impact:
                'Meta cannot optimize ad delivery without conversion data. You are spending money to train their algorithm but giving it nothing to learn from.',
              fix: 'Install Pixel on checkout and thank-you pages. Verify with Meta Pixel Helper before spending.',
            },
            {
              severity: 'High',
              finding: 'Primary offer is not visible above the fold on mobile',
              impact:
                'More than half your paid traffic is on mobile. If they cannot see what you are selling in the first screen, they leave. Higher bounce rate means worse ad delivery over time.',
              fix: 'Move your product name, key benefit, and CTA above 600px on mobile viewport.',
            },
            {
              severity: 'High',
              finding: 'No retargeting or warm audience strategy detected',
              impact:
                'You are paying to bring people to your site and then not following up when they leave without buying. That warm traffic is your cheapest possible conversion.',
              fix: 'Build a 30-day website visitor audience. Run a separate campaign with a different angle for them.',
            },
          ].map((f, i) => (
            <div key={i} className={`report-finding-card report-severity-${f.severity.toLowerCase()}`}>
              <div className="report-finding-header">
                <span className={`report-severity-badge severity-${f.severity.toLowerCase()}`}>{f.severity}</span>
              </div>
              <h4 className="report-finding-title">{f.finding}</h4>
              <div className="report-finding-detail">
                <div className="report-detail-block">
                  <span className="report-detail-label">Impact</span>
                  <p>{f.impact}</p>
                </div>
                <div className="report-detail-block">
                  <span className="report-detail-label">How to fix</span>
                  <p>{f.fix}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    label: 'Creative Brief',
    content: (
      <div className="report-tab-panel">
        <p style={{ marginBottom: 20, fontSize: '14px', lineHeight: '1.6', color: 'var(--lp-text-secondary)' }}>
          Three creative directions per platform, each with a hook angle, visual direction, and copy framework.
        </p>
        <div className="report-brief-platform">
          <span className="report-platform-badge">Meta Ads</span>
        </div>
        <div className="report-creative-angles">
          {[
            {
              angle: 'Problem-first',
              hook: 'Still getting clicks that do not convert?',
              visual:
                'Screen recording of cart abandonment. No voiceover. Subtitles only. Under 20 seconds.',
              framework:
                'Name the problem. Identify the root cause. Show the fix. One proof point. CTA.',
              format: 'Vertical video, 15 to 30 seconds',
            },
          ].map((c, i) => (
            <div key={i} className="report-angle-card">
              <h4>{c.angle}</h4>
              <div className="report-angle-details">
                <div className="report-angle-field">
                  <span className="report-field-label">Hook copy</span>
                  <p className="report-hook-text">"{c.hook}"</p>
                </div>
                <div className="report-angle-field">
                  <span className="report-field-label">Visual direction</span>
                  <p>{c.visual}</p>
                </div>
                <div className="report-angle-field">
                  <span className="report-field-label">Copy framework</span>
                  <p>{c.framework}</p>
                </div>
                <div className="report-angle-field">
                  <span className="report-field-label">Ad format</span>
                  <p>{c.format}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    label: 'Audience Strategy',
    content: (
      <div className="report-tab-panel">
        <p style={{ marginBottom: 20, fontSize: '14px', lineHeight: '1.6', color: 'var(--lp-text-secondary)' }}>
          Cold, warm, and hot audience tiers with platform-specific targeting logic. Not generic advice. Built from what
          ZieAds read on your actual page.
        </p>
        <div className="report-audience-tiers">
          {[
            {
              tier: 'Cold audience',
              budget: '50%',
              meta: 'Advantage+ with interest signals from your product category. Exclude existing customers.',
              google: 'Broad match keywords with smart bidding. Target In-Market matching your category.',
            },
            {
              tier: 'Warm audience',
              budget: '35%',
              meta: 'Website visitors last 30 days. Video viewers 75%+. Lookalike 1% from customer list.',
              google: 'Remarketing list for search ads (RLSA) on branded and competitor terms.',
            },
            {
              tier: 'Hot audience',
              budget: '15%',
              meta: 'Cart abandoners, checkout starters, and lead form openers last 7 days. Dynamic product ads if applicable.',
              google: 'Branded search + exact match competitor terms.',
            },
          ].map((a, i) => (
            <div key={i} className="report-tier-card">
              <div className="report-tier-header">
                <h4>{a.tier}</h4>
                <span className="report-budget-tag mono-num">{a.budget} of budget</span>
              </div>
              <div className="report-tier-platforms">
                <div className="report-platform-row">
                  <span className="report-plat-label">Meta</span>
                  <p>{a.meta}</p>
                </div>
                <div className="report-platform-row">
                  <span className="report-plat-label">Google</span>
                  <p>{a.google}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    label: 'Budget Plan',
    content: (
      <div className="report-tab-panel">
        <p style={{ marginBottom: 20, fontSize: '14px', lineHeight: '1.6', color: 'var(--lp-text-secondary)' }}>
          Where to put your budget and why, based on your business type and the gaps found in your audit.
        </p>
        <div className="report-budget-split">
          {[
            {
              platform: 'Meta Ads',
              pct: 55,
              amount: '$1,650',
              rationale:
                'Strongest visual platform for your product category. Start with awareness and conversion campaigns.',
            },
            {
              platform: 'Google Search',
              pct: 30,
              amount: '$900',
              rationale: 'High-intent buyers searching for your product type. Protect branded terms first.',
            },
            {
              platform: 'TikTok',
              pct: 15,
              amount: '$450',
              rationale: 'Test budget only. Your product skews older, validate before scaling.',
            },
          ].map((b, i) => (
            <div key={i} className="report-budget-row">
              <div className="report-budget-bar-header">
                <span className="report-budget-platform">{b.platform}</span>
                <span className="report-budget-amount mono-num">
                  {b.amount} ({b.pct}%)
                </span>
              </div>
              <div className="report-budget-bar-track">
                <div className="report-budget-bar-fill" style={{ width: `${b.pct}%` }}></div>
              </div>
              <p className="report-budget-rationale">{b.rationale}</p>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 24, fontSize: '12px', fontStyle: 'italic', color: 'var(--lp-text-muted)' }}>
          This is a starting allocation, not a final answer. Adjust based on your first two weeks of data.
        </p>
      </div>
    ),
  },
];

export interface FaqItem {
  q: string;
  a: string;
}

export const faqItems: FaqItem[] = [
  {
    q: 'What does the ZieAds agent actually do?',
    a: 'The agent connects to your social accounts and ad data, then works like an AI marketing team. It tracks your accounts daily, drafts high-performing content, analyzes metrics, and delivers morning briefings. It proposes the actions and strategies. You approve what goes live, and the AI executes.',
  },
  {
    q: 'Does it post and spend on its own?',
    a: 'No. The agent drafts, schedules, and recommends, but you approve what publishes and what gets boosted. You stay in control of anything that costs money or goes public. Once you approve, it handles the execution. We built it this way on purpose, because marketing you care about should not run without you.',
  },
  {
    q: 'Do I need to connect my ad accounts?',
    a: 'Not to start. The free audit works with just a URL, no account access. To get the full agent experience with daily briefings, you connect your social accounts and upload your ad performance data. We never need write access to your ad spend.',
  },
  {
    q: 'What platforms does it work with?',
    a: 'For scheduling and organic tracking: Instagram, TikTok, and LinkedIn. For paid performance: upload your data from Meta, Google, and TikTok Ads. More platforms are on the way as the agent grows.',
  },
  {
    q: 'Does this work if I have never run ads before?',
    a: 'Yes. The audit tells you whether your setup is ready before you spend a rupiah or a dollar. Many people use ZieAds specifically to find out what to fix before their first campaign, so the first one is not a waste.',
  },
  {
    q: 'How is this different from a scheduler or an analytics dashboard?',
    a: 'A scheduler tells you when a post goes out. A dashboard shows you charts. Neither tells you what any of it means or what to do next. The agent does. It reads your numbers in the context of your specific setup and gives you a decision, not just data.',
  },
];

export interface BriefingCard {
  Icon: LucideIcon;
  name: string;
  desc: string;
}

export const dailyBriefingCards: BriefingCard[] = [
  {
    Icon: Activity,
    name: 'Daily Diagnosis',
    desc: 'What changed across your accounts today and what it likely means. Not a data dump. A read on what actually matters this morning.',
  },
  {
    Icon: TrendingDown,
    name: 'ROAS Drop Analysis',
    desc: 'When returns fall, there is usually one specific cause. The agent works through the likely culprits in order of probability, using what it knows about your setup.',
  },
  {
    Icon: EyeOff,
    name: 'Creative Fatigue',
    desc: 'Your audience has seen the ad. The agent flags it before performance craters and suggests new angles based on what has worked for you before.',
  },
  {
    Icon: Sliders,
    name: 'Content Scheduling',
    desc: 'Draft once, customize per platform, and queue across Instagram, TikTok, and LinkedIn. The agent suggests the times your audience actually shows up.',
  },
  {
    Icon: Radar,
    name: 'Competitor Watch',
    desc: 'What the accounts you track are doing right now. What they are posting, where they are gaining, and where the gaps are for you.',
  },
  {
    Icon: Rocket,
    name: 'Unified Inbox',
    desc: 'Every comment across every connected account in one place, sorted by sentiment, so you reply to what matters and skip the noise.',
  },
];

export interface AnalyticsDimension {
  name: string;
  weight: string;
  color: string;
}

export const analyticsDimensions: AnalyticsDimension[] = [
  { name: 'Creative and Offer', weight: '25%', color: 'var(--lp-accent)' },
  { name: 'Audience Clarity', weight: '20%', color: 'var(--lp-accent-hover)' },
  { name: 'Landing Page', weight: '20%', color: 'var(--lp-text-secondary)' },
  { name: 'Platform Fit', weight: '15%', color: 'var(--lp-text-tertiary)' },
  { name: 'Funnel Coverage', weight: '10%', color: 'var(--lp-text-muted)' },
  { name: 'Competitive', weight: '10%', color: 'var(--lp-border-strong)' },
];

export interface ComparisonRow {
  criteria: string;
  zieads: string;
  chatgpt: string;
  agency: string;
  manual: string;
}

export const comparisonRows: ComparisonRow[] = [
  {
    criteria: 'Knows your actual accounts',
    zieads: 'Yes. Connected and synced daily',
    chatgpt: 'No. Only what you describe',
    agency: 'Yes, after two weeks of onboarding',
    manual: 'Yes, if you remember to check',
  },
  {
    criteria: 'Remembers your history',
    zieads: 'Yes. Every briefing builds on the last',
    chatgpt: 'No. Fresh start every chat',
    agency: 'Partially. Notes in a doc',
    manual: 'Only if you keep records',
  },
  {
    criteria: 'Works every morning',
    zieads: 'Yes. Briefing before your coffee',
    chatgpt: 'Only when you prompt it',
    agency: 'During business hours',
    manual: 'When you find the time',
  },
  {
    criteria: 'Monthly cost',
    zieads: 'Free to start, from $29',
    chatgpt: '$20, plus all your prompting time',
    agency: '$3,000 to $5,000',
    manual: 'Your time, which has a cost',
  },
  {
    criteria: 'Acts across organic and paid',
    zieads: 'Yes. Both in one view',
    chatgpt: 'No',
    agency: 'Yes, if you brief them',
    manual: 'Depends on your bandwidth',
  },
];

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  avatar: string;
}

/* PLACEHOLDER TESTIMONIALS - To be replaced with real user quotes post-launch */
export const testimonials: Testimonial[] = [
  {
    quote:
      "I used to spend Sunday nights planning the week's posts and guessing what to boost. Now the briefing is waiting when I wake up. I read it in five minutes and I know exactly what to do. I got my Sundays back.",
    name: 'Agnes Angelina',
    role: 'Founder, DTC skincare brand',
    avatar: '/testimonial-agnes.jpg',
  },
  {
    quote:
      'The agent flagged that my best-performing Reel format had gone stale two weeks before I would have noticed. It suggested three new angles based on what had worked for me before. Two of them are now my top posts this month.',
    name: 'Andreas L Lino',
    role: 'Solo founder, 2-person team',
    avatar: '/testimonial-andreas.jpg',
  },
  {
    quote:
      'I run marketing for six clients. The agent gives each one its own briefing and tracks their accounts separately. What used to take me a full day of dashboard-hopping every Monday now takes an hour.',
    name: 'Lucas Keneth',
    role: 'Freelance marketing consultant',
    avatar: '/testimonial-lucas.jpg',
  },
];

export interface Persona {
  Icon: LucideIcon;
  title: string;
  headline: string;
  body: string;
  features: string[];
  plan_suggestion: string;
}

export const personas: Persona[] = [
  {
    Icon: Briefcase,
    title: 'You run your own marketing.',
    headline: 'You want a marketing analyst without hiring one.',
    body: 'The agent watches your accounts, briefs you every morning, and tells you what to do next. You get analyst-level insight without the analyst-level salary or the two-week onboarding.',
    features: [
      'Free audit with no signup',
      'Daily briefing across all channels',
      'Scheduling and analytics in one place',
    ],
    plan_suggestion: 'Start free. Upgrade when the agent proves its worth.',
  },
  {
    Icon: UserCheck,
    title: 'You do this for clients.',
    headline: 'You want to walk in already knowing what is wrong.',
    body: 'Run an audit on any client URL before your first call. Show up with a readiness score, a gap breakdown, and a plan already prepared. Then let the agent track their accounts so you are never caught off guard.',
    features: [
      'Audit any URL in minutes',
      'White-label reports you can share',
      'Per-client briefings and tracking',
    ],
    plan_suggestion: 'Pro is built for client work.',
  },
  {
    Icon: Users,
    title: 'You run marketing for a team.',
    headline: 'You want one place the whole operation runs from.',
    body: 'Every account, every client, every channel, tracked by an agent that never takes a day off. Aggregate reporting, team seats, and a briefing for each brand you manage.',
    features: ['Unlimited audits', 'White-label with your logo', 'Team seats and client dashboard'],
    plan_suggestion: 'The Agency plan scales with you.',
  },
];

export interface PricingPlan {
  id: string;
  tier: string;
  tagline: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  highlight: boolean;
}

/*
  FOUNDER FLAG: PRICING DISCREPANCY
  - Landing Page 0.2: Free / Starter $29 / Pro $79 / Agency $199
  - Spec 0.3: Free / Solo $29 / Pro $89 / Studio $229
  Using 0.2 prices as currently canonical, pending Stripe config review.
*/
export const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    tier: 'Free',
    tagline: 'Start with the Day-1 agent audit.',
    price: '$0',
    period: 'forever',
    features: [
      'Free URL audit on any domain',
      'Readiness score across 6 dimensions',
      'Top 3 critical gap findings',
      'No card required to start',
    ],
    cta: 'Start for free',
    highlight: false,
  },
  {
    id: 'starter',
    tier: 'Starter',
    tagline: 'Your daily marketing agent briefing.',
    price: '$29',
    period: '/month',
    features: [
      'Daily agent briefing (1 account)',
      '10 deep-dive audits per month',
      'All 15 AI skill commands',
      'Organic post scheduling',
      'Unified notifications inbox',
    ],
    cta: 'Start Starter',
    highlight: false,
  },
  {
    id: 'pro',
    tier: 'Pro',
    tagline: 'For active builders and multiple brands.',
    price: '$79',
    period: '/month',
    features: [
      'Daily agent briefings (3 accounts)',
      '40 deep-dive audits per month',
      'White-label client PDF reports',
      'Unified inbox with sentiment checks',
      'Competitor watch lists',
    ],
    cta: 'Go Pro',
    highlight: true,
  },
  {
    id: 'agency',
    tier: 'Agency',
    tagline: 'For professional marketing operations.',
    price: '$199',
    period: '/month',
    features: [
      'Unlimited agent briefings',
      'Unlimited deep-dive audits',
      'Agency-branded white-label PDFs',
      '10 team seats & client portals',
      'Client aggregate performance briefs',
    ],
    cta: 'Start Agency',
    highlight: false,
  },
];
