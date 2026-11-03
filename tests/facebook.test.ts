import './setup-env.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const fb = await import('../server/utils/facebookApi.ts');
const { buildAuthUrl } = await import('../server/routes/api-auth.ts');
const { parseMetaSignedRequest } = await import('../server/dataDeletion.ts');
const { validMetaSignature, isCronAuthorized } = await import('../server/routes/api-jobs.ts');

test('facebook consent URL uses config_id when set, scopes otherwise', () => {
  process.env.FACEBOOK_APP_ID = '123';
  delete process.env.FACEBOOK_LOGIN_CONFIG_ID;
  let u = new URL(buildAuthUrl('facebook', 'st4te', 'https://zieads.com'));
  assert.equal(u.hostname, 'www.facebook.com');
  assert.match(u.pathname, /\/v\d+\.\d+\/dialog\/oauth$/);
  assert.equal(u.searchParams.get('redirect_uri'), 'https://zieads.com/api/auth/facebook/callback');
  assert.equal(u.searchParams.get('state'), 'st4te');
  assert.ok(u.searchParams.get('scope')!.split(',').includes('pages_manage_posts'));
  process.env.FACEBOOK_LOGIN_CONFIG_ID = 'cfg9';
  u = new URL(buildAuthUrl('facebook', 's', 'https://zieads.com'));
  assert.equal(u.searchParams.get('config_id'), 'cfg9');
  assert.equal(u.searchParams.get('scope'), null);
});

test('graph errors become plain sentences', () => {
  assert.match(fb.explainGraphError({ code: 190, subcode: 492 }).reason, /lost its role/);
  assert.equal(fb.explainGraphError({ code: 190, subcode: 492 }).needsReconnect, true);
  assert.equal(fb.explainGraphError({ code: 4 }).needsReconnect, false);
  assert.match(fb.explainGraphError({ code: 200 }).reason, /permission/);
});

test('publishToPage picks the right endpoint per media type', async () => {
  const calls: Array<{ url: string; method: string; body: string }> = [];
  fb.__setFetch((async (url: any, init: any) => {
    calls.push({ url: String(url), method: init?.method || 'GET', body: String(init?.body || '') });
    const u = String(url);
    const json = u.includes('/photos') ? { id: 'ph' + calls.length, post_id: 'P_1' } : u.includes('/videos') ? { id: 'V_1' } : u.includes('/feed') ? { id: 'F_1' } : { permalink_url: 'https://facebook.com/p/1' };
    return new Response(JSON.stringify(json), { status: 200 });
  }) as any);
  let r = await fb.publishToPage('PG', 'tok', { message: 'hi', link: 'https://zieads.com' });
  assert.equal(r.id, 'F_1');
  assert.match(calls[0].url, /\/PG\/feed$/);
  assert.match(calls[0].body, /link=https/);
  calls.length = 0;
  r = await fb.publishToPage('PG', 'tok', { message: 'pic', imageUrls: ['https://x/a.jpg'] });
  assert.equal(r.id, 'P_1');
  assert.match(calls[0].url, /\/PG\/photos$/);
  calls.length = 0;
  r = await fb.publishToPage('PG', 'tok', { message: 'two', imageUrls: ['https://x/a.jpg', 'https://x/b.jpg'] });
  assert.equal(calls.filter((c) => c.url.endsWith('/photos')).length, 2);
  assert.match(calls.find((c) => c.url.endsWith('/feed'))!.body, /attached_media/);
  assert.match(calls[0].body, /published=false/);
  calls.length = 0;
  r = await fb.publishToPage('PG', 'tok', { message: 'vid', videoUrl: 'https://x/v.mp4' });
  assert.match(calls[0].url, /\/PG\/videos$/);
  await assert.rejects(() => fb.publishToPage('PG', 'tok', { message: '' }));
});

test('graph error bodies surface code and subcode', async () => {
  fb.__setFetch((async () => new Response(JSON.stringify({ error: { message: 'Session invalid', code: 190, error_subcode: 463 } }), { status: 400 })) as any);
  await assert.rejects(() => fb.graph('me', 't'), (e: any) => e.code === 190 && e.subcode === 463);
});

test('meta signed_request is verified', () => {
  const secret = 'shh';
  const payload = Buffer.from(JSON.stringify({ algorithm: 'HMAC-SHA256', user_id: '42' })).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  assert.equal(parseMetaSignedRequest(`${sig}.${payload}`, secret)?.user_id, '42');
  assert.equal(parseMetaSignedRequest(`${sig}.${payload}`, 'wrong'), null);
  assert.equal(parseMetaSignedRequest('garbage', secret), null);
  assert.equal(parseMetaSignedRequest(`abc.${payload}`, secret), null);
});

test('webhook signature and cron auth', () => {
  const body = '{"a":1}';
  const h = 'sha256=' + crypto.createHmac('sha256', 'k').update(body).digest('hex');
  assert.equal(validMetaSignature(body, h, 'k'), true);
  assert.equal(validMetaSignature(body, h, 'x'), false);
  assert.equal(validMetaSignature(body, undefined, 'k'), false);
  const env = { CRON_SECRET: 'x'.repeat(32) } as any;
  assert.equal(isCronAuthorized('Bearer ' + 'x'.repeat(32), env), true);
  assert.equal(isCronAuthorized('Bearer nope', env), false);
  assert.equal(isCronAuthorized('Bearer local_secret', {} as any), false, 'no default secret');
});
