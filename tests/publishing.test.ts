import './setup-env.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const { validatePost, countHashtags } = await import('../src/lib/postValidation.ts');
const { parseBulkCsv, zonedToUtc, parseCsv } = await import('../server/publish/bulkCsv.ts');
const { retryDelayMinutes, idempotencyKeyFor } = await import('../server/publish/publisher.ts');

test('instagram needs media, caps hashtags and caption', () => {
  const issues = validatePost('instagram', { caption: 'x'.repeat(2300) + ' #a'.repeat(31), media: [] });
  const codes = issues.map((i) => i.code);
  assert.ok(codes.includes('media_required'));
  assert.ok(codes.includes('caption_too_long'));
  assert.ok(codes.includes('too_many_hashtags'));
});

test('facebook accepts a text only post with a link', () => {
  assert.deepEqual(validatePost('facebook', { caption: 'Read https://zieads.com', media: [] }), []);
});

test('tiktok requires video and respects creator max duration', () => {
  assert.ok(validatePost('tiktok', { caption: '', media: [{ url: 'https://x/a.jpg' }] }).some((i) => i.code === 'video_required'));
  assert.ok(validatePost('tiktok', { caption: '', media: [{ url: 'https://x/a.mp4', durationSec: 200 }] }, { creatorMaxVideoSec: 180 }).some((i) => i.code === 'video_too_long'));
});

test('instagram link warning and ratio check', () => {
  const i = validatePost('instagram', { caption: 'go https://x.co', media: [{ url: 'https://x/a.jpg', width: 1000, height: 3000 }] });
  assert.ok(i.some((x) => x.code === 'link_not_clickable' && x.level === 'warning'));
  assert.ok(i.some((x) => x.code === 'bad_ratio'));
});

test('hashtags in Bahasa and with numbers count', () => {
  assert.equal(countHashtags('#promo #diskon2026 #kopi_susu email@x.co'), 3);
});

test('csv parser handles quotes and new lines', () => {
  const rows = parseCsv('a,b\n"x, y","line1\nline2"\n"he said ""hi""",z\n');
  assert.deepEqual(rows, [['a', 'b'], ['x, y', 'line1\nline2'], ['he said "hi"', 'z']]);
});

test('zoned time converts Jakarta to UTC', () => {
  assert.equal(zonedToUtc('2030-01-15', '09:00', 'Asia/Jakarta'), '2030-01-15T02:00:00.000Z');
  assert.equal(zonedToUtc('2030-13-01', '09:00', 'UTC'), null);
});

test('bulk csv validates each row', () => {
  const csv = 'date,time,platform,caption,media_url,first_comment\n2030-01-15,09:00,instagram,Hello,https://x/a.jpg,First\n2030-01-15,09:00,myspace,Hi,,\n2000-01-01,09:00,facebook,Old,,\n2030-01-16,10:30,facebook,Text post,,\n';
  const r = parseBulkCsv(csv, 'Asia/Jakarta');
  assert.equal(r.rows.length, 2);
  assert.equal(r.rows[0].first_comment, 'First');
  assert.equal(r.errors.length, 2);
  assert.match(r.errors[0].message, /Unknown platform/);
  assert.match(r.errors[1].message, /past/);
  assert.equal(parseBulkCsv('foo\n1', 'UTC').errors[0].message, 'Missing column: date');
});

test('retry backoff and idempotency key are stable', () => {
  assert.deepEqual([1, 2, 3].map(retryDelayMinutes), [2, 4, 8]);
  const k = idempotencyKeyFor({ id: 'a', platform: 'facebook', scheduled_for: '2030-01-01T00:00:00Z' });
  assert.equal(k, idempotencyKeyFor({ id: 'a', platform: 'facebook', scheduled_for: '2030-01-01T00:00:00Z' }));
  assert.notEqual(k, idempotencyKeyFor({ id: 'a', platform: 'instagram', scheduled_for: '2030-01-01T00:00:00Z' }));
});

test('queue picks the next free default slot in the brand time zone', async () => {
  const { nextQueueSlot } = await import('../server/publish/submit.ts');
  const now = new Date('2030-01-15T01:00:00Z'); // 08:00 in Jakarta
  const first = nextQueueSlot([], now, 'Asia/Jakarta');
  assert.equal(first.toISOString(), '2030-01-15T02:00:00.000Z'); // 09:00 WIB
  const second = nextQueueSlot([first], now, 'Asia/Jakarta');
  assert.equal(second.toISOString(), '2030-01-15T05:30:00.000Z'); // 12:30 WIB
  const late = nextQueueSlot([], new Date('2030-01-15T12:30:00Z'), 'Asia/Jakarta'); // 19:30 WIB
  assert.equal(late.toISOString(), '2030-01-16T02:00:00.000Z');
});
