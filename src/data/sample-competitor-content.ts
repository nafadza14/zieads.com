/* Demo data for Competitor Hunt, shaped like GET /api/v3/competitors/:id/content */
const U = (id: string) => `https://images.unsplash.com/${id}?w=600`;
const IMG = [
  U('photo-1517701604599-bb29b565090c'),
  U('photo-1447933601403-0c6688de566e'),
  U('photo-1542601906990-b4d3fb778b09'),
  U('photo-1507133750040-4a8f57021571'),
  U('photo-1510972527921-ce041ee94df0'),
  U('photo-1495474472287-4d71bcdd2085'),
  U('photo-1570968915860-54d5c301fc9f'),
  U('photo-1577219491135-ce391730fb2c'),
];

const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString();

export const sampleHuntCompetitors = [
  {
    id: 'demo_comp_1',
    name: 'Brew Republic',
    website_url: 'https://brewrepublic.co',
    instagram_username: 'brewrepublic',
    tiktok_username: 'brewrepublic',
    facebook_url: 'https://www.facebook.com/brewrepublic',
    linkedin_url: 'https://www.linkedin.com/company/brewrepublic',
    logo_url: null,
    audit_score: 67,
    last_audited_at: daysAgo(2),
    content_synced_at: new Date(Date.now() - 40 * 60000).toISOString(),
    content_stats: { active_ads: 4, ads: 6, posts_30d: 18, new_7d: 2 },
    content_sync_status: {},
  },
  {
    id: 'demo_comp_2',
    name: 'Kopi Senja',
    website_url: 'https://kopisenja.id',
    instagram_username: 'kopisenja.id',
    tiktok_username: 'kopisenja',
    facebook_url: null,
    linkedin_url: null,
    logo_url: null,
    audit_score: null,
    last_audited_at: null,
    content_synced_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    content_stats: { active_ads: 4, ads: 6, posts_30d: 26, new_7d: 7 },
    content_sync_status: {},
  },
];

const ok = (count: number) => ({ ok: true, count, at: new Date(Date.now() - 40 * 60000).toISOString() });

export function sampleHuntContent(competitorId: string) {
  const comp = sampleHuntCompetitors.find((c) => c.id === competitorId) || sampleHuntCompetitors[0];
  const items = [
    { id: 'a1', kind: 'ad', source: 'meta_ads', platform: 'meta', placements: ['facebook', 'instagram'], media_type: 'video', thumbnail_url: IMG[0], aspect: '4:5', is_active: true, started_at: daysAgo(94), posted_at: daysAgo(94), headline: 'Cold brew that tastes like the cafe', caption: 'Steeped 18 hours, bottled the same morning. Try 3 bottles for the price of 2 this week only.', cta: 'Shop now', metrics: { run_days: 94, variants: 6 }, url: 'https://www.facebook.com/ads/library/' },
    { id: 'a2', kind: 'ad', source: 'meta_ads', platform: 'meta', placements: ['instagram'], media_type: 'image', thumbnail_url: IMG[1], aspect: '1:1', is_active: true, started_at: daysAgo(41), posted_at: daysAgo(41), headline: 'Free shipping over Rp150.000', caption: '"I stopped buying coffee on the way to work." Real review from Dinda, Jakarta. Subscribe and save 15% on every bag.', cta: 'Learn more', metrics: { run_days: 41, variants: 3 }, url: 'https://www.facebook.com/ads/library/' },
    { id: 'a3', kind: 'ad', source: 'meta_ads', platform: 'meta', placements: ['facebook', 'instagram', 'messenger'], media_type: 'carousel', thumbnail_url: IMG[2], carousel: [{ thumbnail_url: IMG[2] }, { thumbnail_url: IMG[3] }, { thumbnail_url: IMG[4] }], aspect: '1:1', is_active: true, started_at: daysAgo(6), posted_at: daysAgo(6), headline: 'Pick your roast', caption: 'Light, medium or dark. Swipe to find the one that matches your morning.', cta: 'Shop now', metrics: { run_days: 6, variants: 2 }, url: 'https://www.facebook.com/ads/library/' },
    { id: 'a4', kind: 'ad', source: 'meta_ads', platform: 'meta', placements: ['instagram'], media_type: 'video', thumbnail_url: IMG[5], aspect: '9:16', is_active: true, started_at: daysAgo(3), posted_at: daysAgo(3), headline: null, caption: 'POV: your barista knows your order. New oat latte, now in every outlet.', cta: 'Order now', metrics: { run_days: 3, variants: 1 }, url: 'https://www.facebook.com/ads/library/' },
    { id: 'a5', kind: 'ad', source: 'meta_ads', platform: 'meta', placements: ['facebook'], media_type: 'image', thumbnail_url: IMG[6], aspect: '1:1', is_active: false, started_at: daysAgo(80), ended_at: daysAgo(52), posted_at: daysAgo(80), headline: 'Grand opening Bandung', caption: 'Buy 1 get 1 for the first 100 customers.', cta: 'Get directions', metrics: { run_days: 28, variants: 1 }, url: 'https://www.facebook.com/ads/library/' },
    { id: 'l1', kind: 'ad', source: 'linkedin_ads', platform: 'linkedin', media_type: 'image', thumbnail_url: IMG[7], aspect: '1.91:1', is_active: null, started_at: daysAgo(20), posted_at: daysAgo(20), headline: 'Office coffee, sorted', caption: 'Fresh beans delivered to your office every Monday. Teams of 10 to 500.', cta: 'Request demo', metrics: { impressions_text: '1k-5k' }, url: 'https://www.linkedin.com/ad-library/' },
    { id: 'o1', kind: 'organic', source: 'instagram', platform: 'instagram', media_type: 'video', thumbnail_url: IMG[3], aspect: '9:16', posted_at: daysAgo(1), caption: 'How we roast 200kg a day, in 30 seconds.', metrics: { likes: 2140, comments: 87, views: 48200, format: 'reel' }, url: 'https://www.instagram.com/' },
    { id: 'o2', kind: 'organic', source: 'tiktok', platform: 'tiktok', media_type: 'video', thumbnail_url: IMG[4], aspect: '9:16', posted_at: daysAgo(2), caption: 'Rating every coffee order our customers asked for this week #coffeetok', metrics: { views: 132000, likes: 9800, comments: 312, shares: 410 }, url: 'https://www.tiktok.com/' },
    { id: 'o3', kind: 'organic', source: 'instagram', platform: 'instagram', media_type: 'carousel', thumbnail_url: IMG[5], aspect: '4:5', posted_at: daysAgo(3), caption: '5 signs your beans are stale (and what to do about it). Save this.', metrics: { likes: 1320, comments: 44, format: 'carousel' }, carousel: [{ thumbnail_url: IMG[5] }, { thumbnail_url: IMG[6] }], url: 'https://www.instagram.com/' },
    { id: 'o4', kind: 'organic', source: 'facebook', platform: 'facebook', media_type: 'image', thumbnail_url: IMG[0], aspect: '1.91:1', posted_at: daysAgo(4), caption: 'Our new Surabaya outlet opens Saturday. First 50 visitors get a free tumbler.', metrics: { likes: 412, comments: 38, shares: 21 }, url: 'https://www.facebook.com/' },
    { id: 'o5', kind: 'organic', source: 'tiktok', platform: 'tiktok', media_type: 'video', thumbnail_url: IMG[1], aspect: '9:16', posted_at: daysAgo(5), caption: 'Iced vs hot: which one are you? Comment below', metrics: { views: 58400, likes: 3100, comments: 540, shares: 88 }, url: 'https://www.tiktok.com/' },
    { id: 'o6', kind: 'organic', source: 'linkedin', platform: 'linkedin', media_type: 'text', thumbnail_url: null, aspect: '1.91:1', posted_at: daysAgo(6), caption: 'We are hiring 3 head baristas for our new Bali roastery. Know someone great? Tag them below.', metrics: { likes: 96, comments: 12 }, url: 'https://www.linkedin.com/' },
    { id: 'o7', kind: 'organic', source: 'instagram', platform: 'instagram', media_type: 'image', thumbnail_url: IMG[2], aspect: '4:5', posted_at: daysAgo(8), caption: 'Sunday slow bar. What are you brewing today?', metrics: { likes: 870, comments: 61, format: 'image' }, url: 'https://www.instagram.com/' },
    { id: 'o8', kind: 'organic', source: 'tiktok', platform: 'tiktok', media_type: 'video', thumbnail_url: IMG[6], aspect: '9:16', posted_at: daysAgo(10), caption: 'Day in the life of our roaster', metrics: { views: 21900, likes: 1200, comments: 45, shares: 19 }, url: 'https://www.tiktok.com/' },
  ].map((i: any) => ({ carousel: [], placements: [], ended_at: null, cta: null, headline: null, ...i }));

  const ads = items.filter((i) => i.kind === 'ad');
  return {
    competitor: { ...comp, content_sync_status: { meta_ads: ok(5), linkedin_ads: ok(1), tiktok_ads: ok(0), instagram: ok(3), facebook: ok(1), tiktok: ok(3), linkedin: ok(1) } },
    provider_configured: true,
    summary: {
      active_ads: ads.filter((a) => a.is_active).length,
      ads_total: ads.length,
      new_ads_7d: 2,
      posts_30d: 18,
      posts_per_week: 4.2,
      ad_formats: { video: 2, image: 1, carousel: 1 },
      longest_running: { id: 'a1', run_days: 94 },
      top_post: 'o2',
    },
    items,
  };
}
