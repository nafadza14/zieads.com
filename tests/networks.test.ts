import './setup-env.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const { bskyFacets, graphemes, youtubeTitle, pinTitle, telegramPermalink, discordPayload } = await import('../server/social/publishers.ts');
const { authUrl, normalizeInstance, callbackUrl } = await import('../server/social/oauth.ts');
const { normalizeBskyHandle, normalizeTelegramChat, DISCORD_WEBHOOK } = await import('../server/social/credentials.ts');
const { validatePost } = await import('../src/lib/postValidation.ts');

test('bluesky facets use UTF-8 byte offsets for links and hashtags', () => {
  const text = 'Kopi ☕ baru! https://kopi.id/menu. #kopisenja';
  const f = bskyFacets(text);
  const enc = new TextEncoder();
  const link = f.find((x: any) => x.features[0].uri);
  assert.equal(link.features[0].uri, 'https://kopi.id/menu');
  const bytes = enc.encode(text);
  assert.equal(new TextDecoder().decode(bytes.slice(link.index.byteStart, link.index.byteEnd)), 'https://kopi.id/menu');
  const tag = f.find((x: any) => x.features[0].tag);
  assert.equal(tag.features[0].tag, 'kopisenja');
  assert.equal(new TextDecoder().decode(bytes.slice(tag.index.byteStart, tag.index.byteEnd)), '#kopisenja');
});

test('graphemes count emoji as one', () => {
  assert.equal(graphemes('👩‍👩‍👧 hi'), 4);
});

test('youtube and pin titles come from the first line', () => {
  assert.equal(youtubeTitle('\n  Behind the roastery <live>\nsecond line'), 'Behind the roastery live');
  assert.equal([...youtubeTitle('a'.repeat(140))].length, 100);
  assert.equal(youtubeTitle(''), 'New video');
  assert.equal(pinTitle('Fall menu\nmore'), 'Fall menu');
});

test('telegram permalinks for public and private channels', () => {
  assert.equal(telegramPermalink({ chat_username: 'kopisenja' }, 42), 'https://t.me/kopisenja/42');
  assert.equal(telegramPermalink({ chat_id: -1001234567890 }, 7), 'https://t.me/c/1234567890/7');
  assert.equal(telegramPermalink({ chat_id: -4567 }, 7), undefined);
});

test('discord payload: images as embeds, videos as links, no mass mentions', () => {
  const p = discordPayload('New drop @everyone', ['https://x.com/a.jpg', 'https://x.com/b.mp4']);
  assert.equal(p.embeds.length, 1);
  assert.match(p.content, /b\.mp4/);
  assert.deepEqual(p.allowed_mentions, { parse: [] });
  assert.equal(discordPayload('x'.repeat(2500), []).content.length, 2000);
});

test('consent URLs carry state, scopes and the shared callback', () => {
  process.env.THREADS_APP_ID = 'th';
  process.env.PINTEREST_APP_ID = 'pin';
  process.env.GOOGLE_CLIENT_ID = 'goog';
  const base = 'https://www.zieads.com';
  const th = new URL(authUrl('threads', 'S1', base));
  assert.equal(th.hostname, 'threads.net');
  assert.match(th.searchParams.get('scope')!, /threads_content_publish/);
  assert.equal(th.searchParams.get('redirect_uri'), callbackUrl(base, 'threads'));
  const yt = new URL(authUrl('youtube', 'S2', base));
  assert.equal(yt.searchParams.get('access_type'), 'offline');
  assert.match(yt.searchParams.get('scope')!, /youtube\.upload/);
  const pin = new URL(authUrl('pinterest', 'S3', base));
  assert.match(pin.searchParams.get('scope')!, /pins:write/);
  const ma = new URL(authUrl('mastodon', 'S4', base, { instance: 'mastodon.social', clientId: 'cid' }));
  assert.equal(ma.hostname, 'mastodon.social');
  assert.equal(ma.searchParams.get('client_id'), 'cid');
});

test('input normalizers', () => {
  assert.equal(normalizeInstance('https://Mastodon.Social/@me'), 'mastodon.social');
  assert.equal(normalizeInstance('@me@fosstodon.org'), 'fosstodon.org');
  assert.equal(normalizeInstance('not a host'), null);
  assert.equal(normalizeBskyHandle('@Kopi.bsky.social'), 'kopi.bsky.social');
  assert.equal(normalizeTelegramChat('https://t.me/kopisenja'), '@kopisenja');
  assert.equal(normalizeTelegramChat('-1001234567890'), '-1001234567890');
  assert.equal(normalizeTelegramChat('a b'), null);
  assert.ok(DISCORD_WEBHOOK.test('https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyzABCDEFGHIJ_-12'));
  assert.ok(!DISCORD_WEBHOOK.test('https://evil.com/api/webhooks/1/2'));
});

test('validation rules for the new networks', () => {
  assert.equal(validatePost('bluesky', { caption: 'x'.repeat(301), media: [] })[0].code, 'caption_too_long');
  assert.ok(validatePost('youtube', { caption: 'hi', media: [{ url: 'a.jpg' }] }).some((i) => i.code === 'video_required'));
  assert.ok(validatePost('pinterest', { caption: 'hi', media: [] }).some((i) => i.code === 'media_required'));
  assert.ok(validatePost('pinterest', { caption: 'hi', media: [{ url: 'a.mp4' }] }).some((i) => i.code === 'image_required'));
  assert.equal(validatePost('telegram', { caption: 'Hello', media: [] }).length, 0);
  assert.equal(validatePost('discord', { caption: 'Hello', media: [{ url: 'a.jpg' }] }).length, 0);
});
