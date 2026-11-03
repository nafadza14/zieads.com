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
import { PHOTOS } from './images';

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
    q: 'Does ZieAds post, reply or spend money on its own?',
    a: 'No. Every post, reply and recommendation waits for your approval, and ZieAds never spends ad budget. Every action is recorded in your activity log so you can see who did what and when.',
  },
  {
    q: 'What is ZieAds?',
    a: 'A social media tool for publishing, inbox, analytics and competitor tracking that also tells you what to do next. Every morning it turns your numbers into 3 actions and does them after you approve. It works with Instagram, Facebook, TikTok and LinkedIn.',
  },
  {
    q: 'Who is ZieAds for?',
    a: 'Anyone who runs social for a brand: in-house marketing teams, founders, creators, freelancers and agencies. Pricing is per brand with seats included, so adding a teammate does not change the bill.',
  },
  {
    q: 'Will drafts sound like our brand?',
    a: 'Yes. ZieAds learns your brand voice from your website, your brand profile and your best posts, and you can edit every draft before it goes out.',
  },
  {
    q: 'How is this different from a dashboard?',
    a: 'A dashboard shows numbers and leaves the next step to you. ZieAds reads the same numbers and writes the next step: each action says what to do, why, and links to the post or metric behind it.',
  },
  {
    q: 'What happens if a post fails?',
    a: 'ZieAds retries it up to 3 times. If it still fails, it waits at the top of your morning plan with the reason, so you never find out the next day by accident.',
  },
  {
    q: 'Are there credits or hidden add-ons?',
    a: 'No. One price per brand. X support will be an optional add-on when it arrives, because X charges per post.',
  },
  {
    q: 'How does ZieAds read my ads?',
    a: 'Read only. ZieAds never changes your campaigns or spends budget. Today you bring Meta, Google and TikTok Ads results in with a CSV import from our template. Direct connections arrive as each platform approves our read-only access.',
  },
  {
    q: 'Which platforms does ZieAds support today?',
    a: 'Publishing: Instagram, Facebook Pages, Threads, TikTok, LinkedIn, YouTube, Pinterest, Bluesky, Mastodon, Telegram channels and Discord channels. Analytics: Instagram, Facebook, TikTok and LinkedIn. Inbox: Instagram and Facebook comments, with more coming. Competitor tracking: Instagram, Threads and the Meta Ad Library (ads that ran in the EU and UK). X, Tumblr and Reddit are on the roadmap.',
  },
  {
    q: 'Is there a free plan?',
    a: 'Yes, and it is a real product: one brand, a weekly plan, 20 scheduled posts a month, the Instagram and Facebook inbox with reply drafts, 30 days of analytics and 3 competitors. No credit card needed.',
  },
  {
    q: 'Can I use ZieAds from Claude or ChatGPT?',
    a: 'Yes. Add ZieAds as a connector in Claude or ChatGPT, sign in, and ask for your plan, a week of posts or reply drafts. Anything it prepares waits for your approval in ZieAds. See zieads.com/mcp.',
  },
  {
    q: 'How is my data kept safe?',
    a: 'ZieAds only uses official platform APIs. Access tokens are encrypted, every account is isolated, and you can disconnect a platform or delete your whole account at any time from Settings. Disconnecting deletes what ZieAds stored from that platform. Read the Privacy Policy and the Data Deletion page for the details.',
  },
  {
    q: 'How is ZieAds different from Metricool or Vista Social?',
    a: 'They show you charts and leave the next step to you. ZieAds sends 3 actions every morning, prepares the drafts and does the work after you approve, on every plan. The full side by side is on our comparison pages.',
  },
  {
    q: 'Can I use ZieAds for several brands or clients?',
    a: 'Pricing is per brand: every channel of one business counts as one brand. Today each workspace runs one brand. Multi brand workspaces for Pro and Agency are coming soon.',
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
    desc: 'What moved across your accounts overnight, ranked by impact, with three actions for today you approve in one click.',
  },
  {
    Icon: Rocket,
    name: 'Needs you',
    desc: 'Buying questions waiting for a reply, failed posts and accounts that need reconnecting, at the top of the briefing.',
  },
  {
    Icon: EyeOff,
    name: 'Format Fatigue Alerts',
    desc: 'Spot content formats that are wearing out before reach drops, with fresh angles based on your own past winners.',
  },
  {
    Icon: Sliders,
    name: 'Smart Scheduling',
    desc: 'Plan and queue posts for Instagram, Facebook, TikTok and LinkedIn at the times your own audience is most active.',
  },
  {
    Icon: Radar,
    name: 'Competitor Hunt',
    desc: 'Track competitors on Instagram and Threads and their Meta Ad Library ads, then find the content gaps you can win.',
  },
  {
    Icon: TrendingDown,
    name: 'Ads, read only',
    desc: 'Meta, Google and TikTok Ads results explained next to organic. ZieAds never changes campaigns or spends budget.',
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
  photo: string;
  result: string;
  visual: 'hours' | 'posts' | 'reporting';
}

/* Customer stories: only real customers with written permission (spec P0-3).
   Empty until the first ones are signed off; the section hides itself while empty. */
export const testimonials: Testimonial[] = [];

export interface Persona {
  Icon: LucideIcon;
  title: string;
  headline: string;
  body: string;
  features: string[];
  plan_suggestion: string;
  visual: 'founder' | 'freelancer' | 'agency';
}

export const personas: Persona[] = [
  {
    Icon: Briefcase,
    title: 'Founders and small businesses',
    headline: 'A social media manager without the hire.',
    body: 'ZieAds watches your accounts, inbox and competitors, sends a briefing every morning and prepares the posts and replies for you to approve.',
    features: ['Briefing with 3 actions for today', 'Scheduling and inbox in one place', 'Free plan you can actually run on'],
    plan_suggestion: 'Start free and upgrade when it pays for itself.',
    visual: 'founder',
  },
  {
    Icon: UserCheck,
    title: 'Freelancers and consultants',
    headline: 'Walk into every client call already knowing what changed.',
    body: 'Each client is its own brand with its own briefing, calendar and inbox. Audit a prospect website before the first meeting, then let the agent watch their accounts between calls.',
    features: ['Up to 3 brands on Pro', 'Weekly client report in one click', 'Free website audit for prospects'],
    plan_suggestion: 'Pro is built for client work.',
    visual: 'freelancer',
  },
  {
    Icon: Users,
    title: 'Agencies and marketing teams',
    headline: 'Run every brand and channel from one workspace.',
    body: 'A briefing per brand, team roles, and an agent that never takes a day off. Approvals stay with the people who own each brand.',
    features: ['10 brands and 10 team seats', 'Roles for admins, editors and viewers', 'Activity log for every action'],
    plan_suggestion: 'The Agency plan grows with your roster.',
    visual: 'agency',
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

/* Pricing per brand (spec section 11). Every AI feature is included, no hidden add-ons. */
export const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    tier: 'Free',
    tagline: 'A real product for one brand.',
    price: '$0',
    period: 'forever',
    features: ['A weekly plan for one brand', '20 scheduled posts a month', 'Instagram and Facebook inbox with reply drafts', '30 days of analytics, 3 competitors', 'We check every post went live', 'Works inside Claude and ChatGPT'],
    cta: 'Start for free',
    highlight: false,
  },
  {
    id: 'starter',
    tier: 'Starter',
    tagline: 'A plan in your inbox every morning.',
    price: '$29',
    period: '/month',
    features: ['A morning plan every day', 'Unlimited scheduled posts', 'Full inbox with reply drafts', '12 months of analytics, 10 competitors', 'Ask why anything changed, basic ads report', '3 routines, like a plan every Monday'],
    cta: 'Choose Starter',
    highlight: false,
  },
  {
    id: 'pro',
    tier: 'Pro',
    tagline: 'For growing brands and client work.',
    price: '$79',
    period: '/month',
    features: ['3 brands and 3 team seats, coming soon', 'Unlimited analytics history, 50 competitors', 'Full ads report', '20 routines', 'Saved replies, and DMs as platforms approve them'],
    cta: 'Go Pro',
    highlight: true,
  },
  {
    id: 'agency',
    tier: 'Agency',
    tagline: 'Client reports in minutes. Approvals in one click.',
    price: '$199',
    period: '/month',
    features: ['10 brands and 10 seats with roles, coming soon', '100 competitors per brand', 'Unlimited routines', 'White label reports, coming soon', 'Unlimited website audits'],
    cta: 'Choose Agency',
    highlight: false,
  },
];
