import './setup-env.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const { nextRun } = await import('../server/agents/scheduled.ts');
const { cleanAgentInput } = await import('../server/routes/api-scheduled-agents.ts');

test('daily run at 08:00 Jakarta is 01:00 UTC, today if still ahead, else tomorrow', () => {
  assert.equal(nextRun('daily', '08:00', null, 'Asia/Jakarta', new Date('2026-11-03T00:30:00Z')).toISOString(), '2026-11-03T01:00:00.000Z');
  assert.equal(nextRun('daily', '08:00', null, 'Asia/Jakarta', new Date('2026-11-03T01:00:00Z')).toISOString(), '2026-11-04T01:00:00.000Z');
});

test('weekly lands on the chosen weekday', () => {
  // 2026-11-03 is a Tuesday; Monday 09:00 Jakarta is next Monday 02:00 UTC
  const d = nextRun('weekly', '09:00', 1, 'Asia/Jakarta', new Date('2026-11-03T05:00:00Z'));
  assert.equal(d.toISOString(), '2026-11-09T02:00:00.000Z');
});

test('hourly keeps the minute and moves forward', () => {
  assert.equal(nextRun('hourly', '00:15', null, 'UTC', new Date('2026-11-03T05:20:00Z')).toISOString(), '2026-11-03T06:15:00.000Z');
  assert.equal(nextRun('hourly', '00:15', null, 'UTC', new Date('2026-11-03T05:10:00Z')).toISOString(), '2026-11-03T05:15:00.000Z');
});

test('input validation', () => {
  assert.match(cleanAgentInput({ name: '', prompt: 'x' }).error!, /name/);
  assert.match(cleanAgentInput({ name: 'A', prompt: 'short' }).error!, /task/);
  assert.match(cleanAgentInput({ name: 'A', prompt: 'Review my week and draft posts', cadence: 'monthly' }).error!, /Cadence/);
  assert.match(cleanAgentInput({ name: 'A', prompt: 'Review my week and draft posts', cadence: 'daily', run_at: '25:00' }).error!, /Time/);
  const ok = cleanAgentInput({ name: 'Weekly review', prompt: 'Review my week and draft posts', cadence: 'weekly', run_at: '09:00' });
  assert.equal(ok.error, undefined);
  assert.equal(ok.patch.weekday, 1);
  assert.deepEqual(cleanAgentInput({ is_active: false }, true).patch, { is_active: false });
});
