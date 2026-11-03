import './setup-env.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const { parseAdsCsv, num, summarize, ADS_TEMPLATE } = await import('../server/ads/csvImport.ts');
const { classifyIntent } = await import('../server/inbox/intent.ts');

test('template parses cleanly', () => {
  const r = parseAdsCsv(ADS_TEMPLATE);
  assert.equal(r.errors.length, 0);
  assert.equal(r.rows.length, 2);
  assert.equal(r.rows[0].spend, 152.4);
});

test('meta ads manager export headers are recognised', () => {
  const csv = 'Reporting starts,Campaign name,Ad set name,Amount spent (USD),Impressions,Link clicks,Results,Purchase conversion value\n2026-10-01,Promo,All,"1,234.50",10000,200,10,"2,500.00"\n2026-10-01,Total,,9,9,9,9,9\n';
  const r = parseAdsCsv(csv);
  assert.equal(r.errors.length, 0);
  assert.equal(r.rows.length, 1, 'total row skipped');
  assert.equal(r.rows[0].spend, 1234.5);
  assert.equal(r.rows[0].revenue, 2500);
  assert.equal(r.mapped.spend, 'Amount spent (USD)');
});

test('missing columns and bad numbers are reported', () => {
  assert.match(parseAdsCsv('foo,bar\n1,2').errors[0].message, /date/);
  const r = parseAdsCsv('date,campaign,spend\n2026-10-01,A,abc\n2026-10-02,,1\n01/10/2026,B,5');
  assert.equal(r.rows.length, 2);
  assert.equal(r.rows[1].date, '2026-10-01');
});

test('number formats', () => {
  assert.equal(num('Rp1.234,56'), 1234.56);
  assert.equal(num('$1,234.56'), 1234.56);
  assert.equal(num(''), 0);
});

test('summary metrics', () => {
  const s = summarize([{ spend: 100, impressions: 10000, clicks: 100, conversions: 5, revenue: 400 }]);
  assert.equal(s.ctr, 0.01);
  assert.equal(s.cpa, 20);
  assert.equal(s.roas, 4);
});

test('buying signals in English and Bahasa', () => {
  for (const t of ['Berapa harganya kak?', 'Do you ship to Jakarta?', 'Would love a wholesale price list', 'ready stock ga min?', 'cara order gimana']) {
    assert.equal(classifyIntent(t).intent, 'buying_signal', t);
  }
  assert.equal(classifyIntent('Still waiting on my refund').intent, 'complaint');
  assert.equal(classifyIntent('Kapan buka cabang Bandung?').intent, 'question');
  assert.equal(classifyIntent('Mantap, suka banget').intent, 'praise');
  assert.equal(classifyIntent('follow back ya kak').intent, 'spam');
  assert.equal(classifyIntent('Berapa harganya kak?').priority, 1);
});
