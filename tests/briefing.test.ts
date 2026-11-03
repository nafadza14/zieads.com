import './setup-env.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const { buildBriefing, briefingDue, localNow } = await import('../server/briefing/briefing.ts');
const { expiryBucket, daysUntil } = await import('../server/guardian/guardian.ts');

const ov = {
  monitoring: { channels: [{ platform: 'instagram', status: 'live' }, { platform: 'facebook', status: 'needs_reconnect', error: 'Lost role' }] },
  kpis: {
    comments: { value: 40, previous: 20, change_pct: 100 },
    unanswered: { value: 6, overdue_24h: 2 },
    response_rate: { value: 50, previous: 80, change_pct: -38 },
    buying_questions: { value: 3, previous: 1, change_pct: 200 },
    followers: { value: 1200, net: 45, change_pct: 3.9 },
    reach: { value: 9000, previous: 10000, change_pct: -10 },
    interactions: { value: 700, previous: 500, change_pct: 40 },
    posts: { value: 2, previous: 4, change_pct: -50 },
  },
  comments: { buying_intent: 3, sentiment: { positive: 10, neutral: 5, negative: 4 }, previous_sentiment: { negative: 1 } },
  content: { top: [{ caption: 'Serum launch', interactions: 300, format: 'REELS' }], by_format: [{ format: 'REELS', avg_interactions: 150 }, { format: 'IMAGE', avg_interactions: 20 }] },
  publishing: { failed: 1, upcoming: 0 },
};

test('briefing is answer first and built from real numbers', () => {
  const b = buildBriefing(ov, { date: '2026-11-03', reliability: { due: 5, published: 4, on_time: 4, failed: 1, on_time_rate: 0.8 } });
  assert.equal(b.version, 2);
  assert.ok(b.summary.length >= 2 && b.summary.length <= 4);
  assert.match(b.headline, /comment/);
  assert.ok(b.needs_you.some((n) => /6 comments waiting/.test(n.title)));
  assert.ok(b.needs_you.some((n) => /did not go out/.test(n.title)));
  assert.ok(b.needs_you.some((n) => /facebook needs attention/.test(n.title)));
  assert.ok(b.wins.some((w) => /Interactions up 40%/.test(w.title)));
  assert.ok(b.concerns.some((c) => /Response rate down 38%/.test(c.title)));
  assert.ok(!b.concerns.some((c) => /Reach/.test(c.title)), '10% is under the 25% threshold');
  assert.ok(b.concerns.some((c) => /4 negative comments/.test(c.title)));
  assert.equal(b.actions.length, 3);
  assert.deepEqual(b.actions.map((a) => a.rank), [1, 2, 3]);
  assert.match(b.actions[0].title, /Answer 3 buying questions/);
  assert.ok(b.actions.every((a) => a.why && Array.isArray(a.evidence)));
  assert.ok(b.summary.some((s) => /4 of 5 scheduled posts went out on time/.test(s)));
});

test('quiet account still gets 3 actions and a steady week summary', () => {
  const b = buildBriefing({ monitoring: { channels: [{ platform: 'instagram', status: 'live' }] }, kpis: {}, content: {}, publishing: { upcoming: 5 } }, { date: '2026-11-03' });
  assert.equal(b.actions.length, 3);
  assert.match(b.summary[0], /steady week/);
});

test('custom threshold changes what counts as a move', () => {
  const b = buildBriefing(ov, { date: 'd', threshold: 5 });
  assert.ok(b.concerns.some((c) => /Reach down 10%/.test(c.title)));
});

test('briefing due at the user time in the user zone, weekly on Mondays for Free', () => {
  // 2030-01-14 is a Monday. 00:30 UTC = 07:30 in Jakarta
  const at = new Date('2030-01-14T00:30:00Z');
  assert.equal(localNow('Asia/Jakarta', at).time, '07:30');
  assert.deepEqual(briefingDue({ briefing_time: '07:00', timezone: 'Asia/Jakarta' }, 'daily', null, at), { due: true, date: '2030-01-14' });
  assert.equal(briefingDue({ briefing_time: '08:00', timezone: 'Asia/Jakarta' }, 'daily', null, at).due, false);
  assert.equal(briefingDue({ briefing_time: '07:00', timezone: 'Asia/Jakarta' }, 'daily', '2030-01-14', at).due, false, 'once a day');
  const tue = new Date('2030-01-15T00:30:00Z');
  assert.equal(briefingDue({ briefing_time: '07:00', timezone: 'Asia/Jakarta' }, 'weekly', null, tue).due, false);
  assert.equal(briefingDue({ briefing_time: '07:00', timezone: 'Asia/Jakarta' }, 'weekly', null, at).due, true);
});

test('token expiry buckets', () => {
  const now = Date.parse('2030-01-01T00:00:00Z');
  assert.equal(expiryBucket(daysUntil('2030-01-05T00:00:00Z', now)), '7d');
  assert.equal(expiryBucket(daysUntil('2030-01-01T12:00:00Z', now)), '1d');
  assert.equal(expiryBucket(daysUntil('2029-12-31T00:00:00Z', now)), 'expired');
  assert.equal(expiryBucket(daysUntil('2030-03-01T00:00:00Z', now)), null);
  assert.equal(expiryBucket(daysUntil(null, now)), null);
});
