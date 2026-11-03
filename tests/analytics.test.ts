import './setup-env.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const { buildOrganic, postsCsv, dailyCsv, shapePost } = await import('../server/analytics/report.ts');

const now = Date.parse('2026-11-03T12:00:00Z');
const day = (d: number) => new Date(now - d * 86400000).toISOString();
const input = {
  days: 7,
  now,
  connections: [{ platform: 'instagram', platform_username: 'kopi', status: 'live' }, { platform: 'facebook', platform_username: 'Kopi Page', status: 'live' }],
  insights: [
    { platform: 'instagram', snapshot_date: day(8).slice(0, 10), followers_count: 1000, reach_daily: 50 },
    { platform: 'instagram', snapshot_date: day(1).slice(0, 10), followers_count: 1040, reach_daily: 400 },
    { platform: 'facebook', snapshot_date: day(1).slice(0, 10), followers_count: 300, reach_daily: null },
  ],
  posts: [
    { id: 'a', platform: 'instagram', posted_at: day(2), raw_metrics: { likes: 30, comments: 5 } },
    { id: 'b', platform: 'instagram', posted_at: day(3), raw_metrics: { like_count: 80, comments_count: 10, saved: 4, reach: 900 } },
    { id: 'c', platform: 'facebook', posted_at: day(1), raw_metrics: { likes: 12, comments: 1, shares: 2 } },
    { id: 'old', platform: 'instagram', posted_at: day(10), raw_metrics: { likes: 10 } },
  ],
};

test('organic totals, per network and follower change from daily snapshots', () => {
  const r = buildOrganic(input);
  const ig = r.per_network.find((n: any) => n.platform === 'instagram');
  const fb = r.per_network.find((n: any) => n.platform === 'facebook');
  assert.equal(ig.followers, 1040);
  assert.equal(ig.followers_net, 40);
  assert.equal(ig.reach, 400);
  assert.equal(ig.interactions, 129);
  assert.equal(ig.posts, 2);
  assert.equal(ig.interactions_change_pct, 1190);
  assert.equal(fb.reach, null, 'no reach data means null, not zero');
  assert.equal(fb.engagement_rate, null);
  assert.equal(r.totals.posts, 3);
  assert.equal(r.totals.followers, 1340);
  assert.deepEqual(r.posts.map((p: any) => p.id), ['b', 'a', 'c']);
  assert.equal(r.series.length, 7);
});

test('post engagement rate only when reach is known', () => {
  assert.equal(shapePost(input.posts[1]).engagement_rate, 10.44);
  assert.equal(shapePost(input.posts[0]).engagement_rate, null);
});

test('csv export escapes captions and keeps empty cells for unknown metrics', () => {
  const csv = postsCsv([{ ...shapePost({ id: 'x', platform: 'instagram', posted_at: day(1), content_text: 'Halo, "kopi"\nbaru', raw_metrics: { likes: 1 } }) }]);
  const nl = csv.indexOf('\n');
  const head = csv.slice(0, nl);
  const row = csv.slice(nl + 1).trimEnd();
  assert.match(head, /^posted_at,platform/);
  assert.match(row, /"Halo, ""kopi""\nbaru"/);
  assert.match(row, /,1,0,0,0,,,1,,$/);
  const d = dailyCsv([{ date: '2026-11-01', followers: 5, reach: null, interactions: 2, posts: 1 }], [{ date: '2026-11-01', spend: 10, impressions: 100, clicks: 3, conversions: 1, revenue: 40 }]);
  assert.match(d, /2026-11-01,5,,2,1,10,100,3,1,40/);
});
