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
import { IMG } from './images';

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
    q: 'What is ZieAds?',
    a: 'ZieAds is an AI marketing agent for founders, freelancers and agencies. It connects to your social media accounts and ad performance data, sends you a daily briefing, schedules posts, analyzes results, tracks competitors and recommends your next move. You approve what goes live and the agent handles the execution.',
  },
  {
    q: 'Does the AI agent post or spend money on its own?',
    a: 'No. The agent drafts, schedules and recommends, but nothing publishes and no budget is spent without your approval. You stay in control of anything that goes public or costs money. Once you approve, the agent takes care of the rest.',
  },
  {
    q: 'Do I need to connect my ad accounts to start?',
    a: 'No. The free website audit only needs a URL. For daily briefings you connect your social media accounts and upload ad performance data from Meta Ads, Google Ads or TikTok Ads. ZieAds never needs write access to your ad spend.',
  },
  {
    q: 'Which social media platforms does ZieAds support?',
    a: 'Scheduling, analytics and the unified inbox support Instagram, TikTok, LinkedIn and Facebook. For paid performance you can upload data from Meta Ads, Google Ads and TikTok Ads. More integrations are on the roadmap.',
  },
  {
    q: 'Is there a free plan?',
    a: 'Yes. The Free plan includes a website audit with a readiness score across six dimensions and your top three critical gaps. No credit card is required to sign up.',
  },
  {
    q: 'Does ZieAds work if I have never run paid ads before?',
    a: 'Yes. The audit shows whether your website, tracking and offer are ready before you spend anything. Many users run ZieAds specifically to fix their setup before the first campaign, so their first budget is not wasted.',
  },
  {
    q: 'How is ZieAds different from Buffer, Hootsuite or an analytics dashboard?',
    a: 'Schedulers tell you when a post goes out and dashboards show you charts. Neither tells you what your numbers mean or what to do next. ZieAds reads your data in the context of your brand and gives you a clear decision, not just another report.',
  },
  {
    q: 'Can I use ZieAds for multiple brands or clients?',
    a: 'Yes. The Pro plan covers up to three accounts with white label PDF reports. The Agency plan includes unlimited briefings, ten team seats and client portals for every brand you manage.',
  },
];

export interface BriefingCard {
  Icon: LucideIcon;
  name: string;
  desc: string;
  image: string;
}

export const dailyBriefingCards: BriefingCard[] = [
  {
    Icon: Activity,
    name: 'Daily Diagnosis',
    desc: 'A five minute summary of what moved across your accounts overnight, ranked by impact so you know exactly where to focus first.',
    image: IMG.cardDiagnosis,
  },
  {
    Icon: TrendingDown,
    name: 'ROAS Drop Analysis',
    desc: 'When return on ad spend falls, the agent ranks the most likely causes by probability and shows you the evidence behind each one.',
    image: IMG.cardRoas,
  },
  {
    Icon: EyeOff,
    name: 'Creative Fatigue Alerts',
    desc: 'Spot tired ads and stale content formats before performance drops, with fresh hooks based on what already works for your audience.',
    image: IMG.cardFatigue,
  },
  {
    Icon: Sliders,
    name: 'Smart Scheduling',
    desc: 'Plan and queue posts for Instagram, TikTok, LinkedIn and Facebook at the times your own audience is most active.',
    image: IMG.cardScheduling,
  },
  {
    Icon: Radar,
    name: 'Competitor Hunt',
    desc: 'Track competitor accounts, see what they publish and where they grow, then find the content gaps you can win.',
    image: IMG.cardCompetitor,
  },
  {
    Icon: Rocket,
    name: 'Unified Inbox',
    desc: 'Reply to comments from every connected account in one inbox, sorted by sentiment and priority so warm leads never slip away.',
    image: IMG.cardInbox,
  },
];

export interface AnalyticsDimension {
  name: string;
  weight: string;
  value: number;
}

export const analyticsDimensions: AnalyticsDimension[] = [
  { name: 'Creative and Offer', weight: '25%', value: 72 },
  { name: 'Audience Clarity', weight: '20%', value: 80 },
  { name: 'Landing Page', weight: '20%', value: 64 },
  { name: 'Platform Fit', weight: '15%', value: 76 },
  { name: 'Funnel Coverage', weight: '10%', value: 58 },
  { name: 'Competitive Position', weight: '10%', value: 69 },
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
    criteria: 'Connects to your real accounts',
    zieads: 'Yes. Synced every day',
    chatgpt: 'No. Only what you type in',
    agency: 'Yes, after weeks of onboarding',
    manual: 'Yes, if you remember to check',
  },
  {
    criteria: 'Remembers your history',
    zieads: 'Yes. Every briefing builds on the last',
    chatgpt: 'No. Starts fresh every chat',
    agency: 'Partly, in shared notes',
    manual: 'Only if you keep records',
  },
  {
    criteria: 'Daily insights without asking',
    zieads: 'Yes. Briefing before your first coffee',
    chatgpt: 'Only when you prompt it',
    agency: 'During business hours',
    manual: 'When you find the time',
  },
  {
    criteria: 'Schedules and publishes posts',
    zieads: 'Yes. Built in, with your approval',
    chatgpt: 'No',
    agency: 'Yes, usually at extra cost',
    manual: 'Manually, platform by platform',
  },
  {
    criteria: 'Organic and paid in one view',
    zieads: 'Yes. Read together, side by side',
    chatgpt: 'No',
    agency: 'Yes, if you brief them',
    manual: 'Depends on your bandwidth',
  },
  {
    criteria: 'Monthly cost',
    zieads: 'Free to start, paid from $29',
    chatgpt: '$20 plus your prompting time',
    agency: '$3,000 to $5,000',
    manual: 'Your time, which is not free',
  },
];

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  avatar: string;
  cover: string;
  result: string;
}

/* PLACEHOLDER TESTIMONIALS: replace with real customer quotes after launch */
export const testimonials: Testimonial[] = [
  {
    quote:
      'I used to spend Sunday nights planning posts and guessing what to boost. Now the briefing is waiting when I wake up. Five minutes of reading and I know exactly what to do. I got my weekends back.',
    name: 'Agnes Angelina',
    role: 'Founder, DTC skincare brand',
    avatar: '/testimonial-agnes.jpg',
    cover: IMG.testimonial1,
    result: '6 hours saved every week',
  },
  {
    quote:
      'The agent flagged that my best Reel format was going stale two weeks before I would have noticed. It suggested three new angles based on my own past winners. Two of them became my top posts that month.',
    name: 'Andreas L Lino',
    role: 'Solo founder, 2 person team',
    avatar: '/testimonial-andreas.jpg',
    cover: IMG.testimonial2,
    result: '2 of 3 new angles became top posts',
  },
  {
    quote:
      'I manage marketing for six clients. Each one gets its own briefing and tracking. What used to take a full Monday of jumping between dashboards now takes about an hour.',
    name: 'Lucas Keneth',
    role: 'Freelance marketing consultant',
    avatar: '/testimonial-lucas.jpg',
    cover: IMG.testimonial3,
    result: 'Monday reporting cut from 8 hours to 1',
  },
];

export interface Persona {
  Icon: LucideIcon;
  title: string;
  headline: string;
  body: string;
  features: string[];
  plan_suggestion: string;
  image: string;
}

export const personas: Persona[] = [
  {
    Icon: Briefcase,
    title: 'Founders and small businesses',
    headline: 'Get a marketing analyst without hiring one.',
    body: 'ZieAds monitors your social media and ads, sends a daily briefing and tells you exactly what to do next. Analyst level insight for a fraction of the cost of a full time hire.',
    features: ['Free website audit, no signup', 'Daily briefing across every channel', 'Scheduling and analytics in one place'],
    plan_suggestion: 'Start free and upgrade when it pays for itself.',
    image: IMG.personaFounder,
  },
  {
    Icon: UserCheck,
    title: 'Freelancers and consultants',
    headline: 'Walk into every client call already knowing what is wrong.',
    body: 'Audit any client website before the first meeting. Arrive with a readiness score, a prioritized gap list and an action plan, then let the agent watch their accounts between calls.',
    features: ['Audit any URL in minutes', 'White label PDF reports', 'Separate briefings for each client'],
    plan_suggestion: 'Pro is built for client work.',
    image: IMG.personaFreelancer,
  },
  {
    Icon: Users,
    title: 'Agencies and marketing teams',
    headline: 'Run every brand and channel from one workspace.',
    body: 'Track every account, client and platform with an AI agent that never takes a day off. Get aggregate reporting, team seats and a dedicated briefing for each brand you manage.',
    features: ['Unlimited audits', 'White label reports with your logo', 'Team seats and client portals'],
    plan_suggestion: 'The Agency plan grows with your roster.',
    image: IMG.personaAgency,
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
    tagline: 'See what the agent finds on day one.',
    price: '$0',
    period: 'forever',
    features: [
      'Free website audit on any URL',
      'Readiness score across 6 dimensions',
      'Top 3 critical gaps with fixes',
      'No credit card required',
    ],
    cta: 'Start for free',
    highlight: false,
  },
  {
    id: 'starter',
    tier: 'Starter',
    tagline: 'Your daily AI marketing briefing.',
    price: '$29',
    period: '/month',
    features: [
      'Daily agent briefing for 1 account',
      '10 deep dive audits per month',
      'All 15 AI skill commands',
      'Social media post scheduling',
      'Unified notifications inbox',
    ],
    cta: 'Choose Starter',
    highlight: false,
  },
  {
    id: 'pro',
    tier: 'Pro',
    tagline: 'For growing brands and client work.',
    price: '$79',
    period: '/month',
    features: [
      'Daily agent briefings for 3 accounts',
      '40 deep dive audits per month',
      'White label client PDF reports',
      'Unified inbox with sentiment sorting',
      'Competitor watch lists',
    ],
    cta: 'Go Pro',
    highlight: true,
  },
  {
    id: 'agency',
    tier: 'Agency',
    tagline: 'For agencies and marketing teams.',
    price: '$199',
    period: '/month',
    features: [
      'Unlimited agent briefings',
      'Unlimited deep dive audits',
      'Agency branded white label PDFs',
      '10 team seats and client portals',
      'Aggregate performance briefs',
    ],
    cta: 'Choose Agency',
    highlight: false,
  },
];
