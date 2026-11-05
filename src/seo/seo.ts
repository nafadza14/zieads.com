/*
  One source of truth for search and AI discovery of the public pages:
  title, description, canonical, sitemap priority and structured data (JSON-LD).
  Used by the build-time prerender (scripts/prerender.mjs), the sitemap, llms.txt,
  and in the browser to update the head when someone navigates between pages.
*/
import { DOCS } from '../pages/docs/pages';
import { VS_PAGES } from '../pages/landing/compare';
import { faqItems, pricingPlans } from '../pages/landing/data';

export const SITE = 'https://www.zieads.com';
export const SITE_NAME = 'ZieAds';
export const OG_IMAGE = `${SITE}/og-image.png`;

export interface SeoRoute {
  path: string;
  title: string;
  description: string;
  priority: number;
  changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly';
  /** Breadcrumb trail names, home excluded */
  crumbs?: string[];
  kind?: 'home' | 'pricing' | 'features' | 'vs' | 'docs' | 'dev' | 'legal';
}

const HOME_TITLE = 'ZieAds: The social media tool that tells you what to do next';
const HOME_DESC =
  'Schedule, reply and report across Instagram, Facebook, TikTok, LinkedIn, Threads, YouTube and more. Every morning ZieAds turns your numbers into 3 actions and does them when you approve. Free for one brand.';

const BASE: SeoRoute[] = [
  { path: '/', title: HOME_TITLE, description: HOME_DESC, priority: 1, changefreq: 'weekly', kind: 'home' },
  {
    path: '/features',
    title: 'Features: scheduling, inbox, comments, analytics and an AI agent | ZieAds',
    description: 'Every ZieAds feature in one place: a morning plan, a composer for 11 networks, calendar, unified inbox and comments, analytics with ads, competitor tracking, the Zie AI agent, API and MCP.',
    priority: 0.9,
    changefreq: 'weekly',
    crumbs: ['Features'],
    kind: 'features',
  },
  {
    path: '/pricing',
    title: 'Pricing: priced per brand, not per seat | ZieAds',
    description: 'ZieAds is free for one brand. Paid plans from $29 a month per brand with every AI feature included, no credits to run out and no per seat pricing.',
    priority: 0.9,
    changefreq: 'monthly',
    crumbs: ['Pricing'],
    kind: 'pricing',
  },
  {
    path: '/mcp',
    title: 'ZieAds MCP server: use ZieAds inside Claude and ChatGPT',
    description: 'Connect ZieAds to Claude, ChatGPT and other MCP clients. Ask what to post this week, draft replies and read your analytics; everything waits for your approval.',
    priority: 0.8,
    changefreq: 'monthly',
    crumbs: ['MCP server'],
    kind: 'dev',
  },
  {
    path: '/api',
    title: 'ZieAds REST API: posts, comments, analytics and briefings',
    description: 'The ZieAds REST API for developers and agencies: create and schedule posts, read comments and analytics, fetch the morning briefing. OAuth 2.1 or API keys.',
    priority: 0.7,
    changefreq: 'monthly',
    crumbs: ['REST API'],
    kind: 'dev',
  },
  { path: '/privacy-policy', title: 'Privacy Policy | ZieAds', description: 'How ZieAds collects, uses, stores and deletes data from Instagram, Facebook, TikTok, LinkedIn, Google, YouTube and ads platforms.', priority: 0.3, changefreq: 'yearly', crumbs: ['Privacy Policy'], kind: 'legal' },
  { path: '/terms', title: 'Terms of Service | ZieAds', description: 'The terms for using ZieAds, the social media tool from PT. Banko Indonesia Technology.', priority: 0.3, changefreq: 'yearly', crumbs: ['Terms of Service'], kind: 'legal' },
  { path: '/data-deletion', title: 'Data deletion | ZieAds', description: 'How to delete your ZieAds data and disconnect Instagram, Facebook, TikTok and LinkedIn, and how to check the status of a deletion request.', priority: 0.2, changefreq: 'yearly', crumbs: ['Data deletion'], kind: 'legal' },
];

export const SEO_ROUTES: SeoRoute[] = [
  ...BASE,
  ...VS_PAGES.map<SeoRoute>((p) => ({ path: `/vs/${p.slug}`, title: `${p.title} | ZieAds`, description: p.description, priority: 0.8, changefreq: 'monthly', crumbs: [`ZieAds vs ${p.name}`], kind: 'vs' })),
  ...DOCS.map<SeoRoute>((d) => ({
    path: d.slug ? `/docs/${d.slug}` : '/docs',
    title: `${d.title} | ZieAds Docs`,
    description: d.description,
    priority: d.slug ? 0.5 : 0.7,
    changefreq: 'monthly',
    crumbs: d.slug ? ['Docs', d.nav || d.title] : ['Docs'],
    kind: 'docs',
  })),
];

export function seoFor(path: string): SeoRoute | undefined {
  const clean = path.replace(/\/+$/, '') || '/';
  return SEO_ROUTES.find((r) => r.path === clean);
}

/* ── Structured data (schema.org) ── */

const ORG = {
  '@type': 'Organization',
  '@id': `${SITE}/#org`,
  name: SITE_NAME,
  legalName: 'PT. Banko Indonesia Technology',
  url: SITE,
  logo: `${SITE}/icon-512.png`,
  email: 'privacy@zieads.com',
  sameAs: [] as string[],
};

const WEBSITE = { '@type': 'WebSite', '@id': `${SITE}/#website`, url: SITE, name: SITE_NAME, publisher: { '@id': `${SITE}/#org` }, inLanguage: 'en' };

const priceOf = (p: string) => Number(String(p).replace(/[^0-9.]/g, '')) || 0;

const APP = {
  '@type': 'SoftwareApplication',
  '@id': `${SITE}/#app`,
  name: SITE_NAME,
  url: SITE,
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'Social media management',
  operatingSystem: 'Web',
  description:
    'Social media tool for publishing, inbox, comments, analytics and competitors. Every morning it turns your numbers into three actions, and Zie, the AI agent, prepares the work for your approval. Works with Instagram, Facebook, TikTok, LinkedIn, Threads, YouTube, Pinterest, Bluesky, Mastodon, Telegram and Discord, and inside Claude and ChatGPT through MCP.',
  image: OG_IMAGE,
  publisher: { '@id': `${SITE}/#org` },
  featureList: [
    'Schedule and publish to 11 social networks',
    'Morning plan with three ranked actions',
    'Unified inbox and comments with reply drafts',
    'Analytics with Meta, Google and TikTok Ads, read only',
    'Competitor tracking with live ads and posts',
    'Zie, an AI agent that drafts posts and replies for approval',
    'Workspaces, one per brand',
    'REST API and MCP server',
  ],
  offers: pricingPlans.map((p) => ({ '@type': 'Offer', name: p.tier, price: priceOf(p.price), priceCurrency: 'USD', description: p.tagline, url: `${SITE}/pricing` })),
};

const faqLd = () => ({
  '@type': 'FAQPage',
  mainEntity: faqItems.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
});

const crumbsLd = (r: SeoRoute) =>
  r.crumbs?.length
    ? {
        '@type': 'BreadcrumbList',
        itemListElement: [{ name: 'Home', url: SITE }, ...r.crumbs.map((name, i) => ({ name, url: i === r.crumbs!.length - 1 ? `${SITE}${r.path}` : `${SITE}/docs` }))].map((c, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: c.name,
          item: c.url,
        })),
      }
    : null;

/** The JSON-LD graph for one page */
export function jsonLdFor(r: SeoRoute): object {
  const page = { '@type': r.kind === 'docs' ? 'TechArticle' : 'WebPage', '@id': `${SITE}${r.path}#page`, url: `${SITE}${r.path}`, name: r.title, description: r.description, isPartOf: { '@id': `${SITE}/#website` }, about: { '@id': `${SITE}/#app` }, inLanguage: 'en' };
  const graph: object[] = [ORG, WEBSITE, page];
  if (r.kind === 'home' || r.kind === 'pricing' || r.kind === 'features') graph.push(APP);
  if (r.kind === 'home' || r.kind === 'pricing') graph.push(faqLd());
  const c = crumbsLd(r);
  if (c) graph.push(c);
  return { '@context': 'https://schema.org', '@graph': graph };
}
