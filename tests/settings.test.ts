import { test } from 'node:test';
import assert from 'node:assert/strict';
process.env.SUPABASE_URL ||= 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY ||= 'test';
const { sanitizeSettingsPatch } = await import('../server/routes/api-settings.ts');

test('valid patch passes through', () => {
  const { patch, errors } = sanitizeSettingsPatch({ briefing_time: '08:30', timezone: 'Asia/Makassar', alert_threshold_pct: 30, unanswered_hours: 4, briefing_channels: { email: true, push: true } });
  assert.deepEqual(errors, []);
  assert.equal(patch.briefing_time, '08:30');
  assert.equal(patch.timezone, 'Asia/Makassar');
  assert.deepEqual(patch.briefing_channels, { in_app: true, email: true, push: true });
});

test('bad values are rejected with readable errors', () => {
  const { errors } = sanitizeSettingsPatch({ briefing_time: '25:00', timezone: 'Mars/Base', alert_threshold_pct: 1, unanswered_hours: 999 });
  assert.equal(errors.length, 4);
});

test('checklist keys are whitelisted', () => {
  const { patch } = sanitizeSettingsPatch({ checklist: { connect_account: true, 'bad key!': true, add_competitors: 'dismissed' } });
  assert.deepEqual(patch.checklist, { connect_account: true, add_competitors: 'dismissed' });
});
