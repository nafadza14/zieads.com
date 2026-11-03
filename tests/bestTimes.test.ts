import './setup-env.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const { bestTimes, MIN_POSTS, engagementOf } = await import('../server/publish/bestTimes.ts');

test('too few posts falls back to default slots and says so', () => {
  const r = bestTimes([{ posted_at: '2026-10-01T12:00:00Z', raw_metrics: { likes: 9 } }], 'Asia/Jakarta');
  assert.equal(r.source, 'default');
  assert.equal(r.slots.length, 3);
  assert.match(r.note, new RegExp(String(MIN_POSTS)));
});

test('ranks local hours by average engagement and ignores single viral posts', () => {
  const posts: any[] = [];
  // 19:00 Jakarta = 12:00 UTC, strong and steady
  for (let i = 0; i < 4; i++) posts.push({ posted_at: `2026-10-0${i + 1}T12:00:00Z`, raw_metrics: { likes: 100, comments: 10 } });
  // 09:00 Jakarta = 02:00 UTC, weaker
  for (let i = 0; i < 4; i++) posts.push({ posted_at: `2026-10-0${i + 1}T02:00:00Z`, raw_metrics: { like_count: 20 } });
  // one viral post at 03:00 Jakarta, alone in its hour
  posts.push({ posted_at: '2026-10-05T20:00:00Z', raw_metrics: { likes: 99999 } });
  const r = bestTimes(posts, 'Asia/Jakarta');
  assert.equal(r.source, 'your_posts');
  assert.deepEqual(r.slots.map((s) => s.time), ['19:00', '09:00']);
  assert.equal(r.posts_analyzed, 9);
});

test('engagement weights comments, shares and saves', () => {
  assert.equal(engagementOf({ likes: 1, comments: 1, shares: 1, saved: 1 }), 9);
  assert.equal(engagementOf(null), 0);
});
