/* Demo data for the AI Analyst overview, shaped like GET /api/v3/analyst/overview */
export type Period = '24h' | '3d' | '7d' | '30d';
const HRS: Record<Period, number> = { '24h': 24, '3d': 72, '7d': 168, '30d': 720 };

export function sampleOverview(period: Period) {
  const f = { '24h': 1, '3d': 2.6, '7d': 5.8, '30d': 23 }[period];
  const n = (v: number) => Math.round(v * f);
  const now = Date.now();
  const ago = (h: number) => new Date(now - h * 3600 * 1000).toISOString();
  const bucketCount = period === '24h' ? 12 : period === '3d' ? 12 : period === '7d' ? 7 : 30;
  const seed = [3, 5, 2, 8, 6, 4, 9, 7, 5, 11, 6, 4, 8, 10, 7, 5, 6, 9, 12, 8, 6, 7, 10, 9, 5, 8, 11, 6, 7, 9];
  const series = Array.from({ length: bucketCount }, (_, i) => {
    const t = new Date(now - (bucketCount - i) * (HRS[period] / bucketCount) * 3600 * 1000);
    const c = Math.round(seed[i % seed.length] * (period === '30d' ? 1.6 : period === '7d' ? 1.8 : 0.9));
    return {
      label: period === '24h' || period === '3d' ? t.toISOString().slice(11, 13) + ':00' : t.toISOString().slice(5, 10),
      comments: c,
      negative: i % 5 === 3 ? 1 : 0,
      posts: i % 4 === 0 ? 1 : 0,
      interactions: c * 23,
    };
  });
  const comments = series.reduce((s, x) => s + x.comments, 0);
  return {
    period,
    window: { from: ago(HRS[period]), to: ago(0), previous_from: ago(HRS[period] * 2) },
    monitoring: {
      channels: [
        { platform: 'instagram', handle: 'acme_coffee', last_synced_at: ago(0.07), status: 'live' },
        { platform: 'tiktok', handle: 'acme_coffee_co', last_synced_at: ago(0.3), status: 'live' },
        { platform: 'linkedin', handle: 'Acme Coffee Co', last_synced_at: ago(27), status: 'stale' },
      ],
      channels_live: 2,
      last_sync_at: ago(0.07),
    },
    kpis: {
      comments: { value: comments, previous: Math.round(comments * 0.82), change_pct: 22 },
      unanswered: { value: 9, overdue_24h: 3 },
      response_rate: { value: 64, previous: 51, change_pct: 25.5, unit: '%' },
      median_reply_hours: { value: period === '24h' ? 2.4 : 5.1 },
      buying_questions: { value: n(4), previous: n(3), change_pct: 33.3 },
      followers: { value: 12480, net: n(42), previous_net: n(30), change_pct: Math.round(((n(42) / 12480) * 1000)) / 10 },
      reach: { value: n(18400), previous: n(15100), change_pct: 21.9 },
      interactions: { value: n(1240), previous: n(1105), change_pct: 12.2 },
      engagement_rate: { value: 6.7, previous: 7.3 },
      posts: { value: Math.max(1, n(0.8)), previous: Math.max(1, n(0.7)), change_pct: 14 },
    },
    comments: {
      sentiment: { positive: Math.round(comments * 0.62), neutral: Math.round(comments * 0.3), negative: Math.max(1, Math.round(comments * 0.08)) },
      previous_sentiment: { positive: 0, neutral: 0, negative: 0 },
      questions: n(6),
      buying_intent: n(4),
      themes: [
        { word: 'cold brew', count: n(9) },
        { word: 'harga', count: n(6) },
        { word: 'shipping', count: n(4) },
        { word: 'decaf', count: n(3) },
        { word: 'oat milk', count: n(2) + 1 },
      ],
      waiting: [
        { id: 'c_3', platform: 'instagram', from: 'mike_roast', text: 'My bag arrived torn and some beans spilled inside the box. Very upset.', sentiment: 'negative', waiting_hours: 26.5, intent: false, has_ai_draft: true },
        { id: 'c_2', platform: 'instagram', from: 'sarah_k', text: 'Do you ship your beans to Canada? I want to buy a bag.', sentiment: 'neutral', waiting_hours: 3.1, intent: true, has_ai_draft: false },
        { id: 'c_13', platform: 'tiktok', from: 'nadia.skin', text: 'Berapa harga cold brew 1 liter kak? Ready stock?', sentiment: 'neutral', waiting_hours: 1.2, intent: true, has_ai_draft: false },
        { id: 'c_8', platform: 'instagram', from: 'tim_d', text: 'Is there a decaf version of the signature blend?', sentiment: 'neutral', waiting_hours: 0.6, intent: true, has_ai_draft: false },
      ],
    },
    content: {
      top: [
        { id: 'p1', platform: 'instagram', caption: 'Start your morning right with our new signature cold brew blend.', format: 'reels', posted_at: ago(20), interactions: n(612), reach: n(8200), likes: n(540), comments: n(48) },
        { id: 'p2', platform: 'tiktok', caption: 'Behind the scenes roasting the perfect batch', format: 'video', posted_at: ago(40), interactions: n(388), reach: n(6100), likes: n(350), comments: n(21) },
        { id: 'p3', platform: 'instagram', caption: '5 coffee myths we hear every week', format: 'carousel_album', posted_at: ago(60), interactions: n(241), reach: n(3900), likes: n(210), comments: n(18) },
      ],
      weakest: null,
      by_format: [
        { format: 'reels', posts: 3, avg_interactions: 612 },
        { format: 'carousel', posts: 2, avg_interactions: 241 },
        { format: 'image', posts: 2, avg_interactions: 198 },
      ],
    },
    publishing: { drafts: 2, upcoming: 4, failed: 0, next: { platform: 'instagram', caption: 'Cold brew Friday', scheduled_for: new Date(now + 20 * 3600 * 1000).toISOString() } },
    series,
    events: [
      { at: ago(0.6), kind: 'buying_question', severity: 'warn', title: 'Buying question from @tim_d', detail: 'Is there a decaf version of the signature blend?', link: '/inbox?comment=c_8' },
      { at: ago(1.2), kind: 'buying_question', severity: 'warn', title: 'Buying question from @nadia.skin', detail: 'Berapa harga cold brew 1 liter kak? Ready stock?', link: '/inbox' },
      { at: ago(4), kind: 'anomaly', severity: 'warn', title: 'Comments on your cold brew Reel are 2.4x your usual pace', detail: 'Pin a reply with price and how to order.' },
      { at: ago(9), kind: 'published', severity: 'good', title: 'Published to instagram', detail: 'Start your morning right with our new signature cold brew blend.', link: '/calendar' },
      { at: ago(18), kind: 'followers', severity: 'good', title: '+42 followers in this period', link: '/analytics' },
      { at: ago(26.5), kind: 'negative_comment', severity: 'bad', title: 'Negative comment from @mike_roast', detail: 'My bag arrived torn and some beans spilled inside the box.', link: '/inbox' },
      { at: ago(27), kind: 'channel', severity: 'warn', title: 'linkedin data is more than a day old', detail: 'Zie will retry on the next check.', link: '/connections' },
    ],
    todo: [
      { key: 'intent', severity: 'bad', title: '3 buying questions waiting', detail: 'Price, stock and order questions are sales. Reply while they are warm.', cta: 'Draft replies with Zie', prompt: 'Draft replies for every unanswered buying question (price, stock, how to order) in my comments', link: '/inbox' },
      { key: 'overdue', severity: 'warn', title: '1 comment waiting more than 24 hours', detail: 'Most people expect a reply within a day.', cta: 'Open Inbox', link: '/inbox' },
      { key: 'drafts', severity: 'info', title: '2 drafts waiting for your review', detail: 'Zie prepared them. Approve or edit before they can publish.', cta: 'Review drafts', link: '/calendar' },
    ],
    briefing: null,
  };
}
