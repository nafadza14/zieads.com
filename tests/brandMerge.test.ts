import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fillEmpty, txt } from '../src/lib/brandMerge.ts';

const EMPTY = { identity: {}, offer: { products: [] }, audience: {}, voice: {}, goals: {}, competitors: [] as string[] };

test('null legacy columns never become objects (the /clients crash)', () => {
  const out: any = fillEmpty(EMPTY, {
    identity: { name: null, website: null, industry: null },
    audience: { pain_points: null },
    goals: { monthly_budget: null, primary_goal: null, goals: [], role: 'Solo founder' },
  });
  assert.equal(out.identity.name, undefined);
  assert.equal(out.goals.primary_goal, undefined);
  assert.equal(out.goals.role, 'Solo founder');
  assert.deepEqual(out.goals.goals, []);
});

test('typed values are kept, empty ones are filled', () => {
  const cur = { ...EMPTY, identity: { name: 'Glow', website: '' } };
  const out: any = fillEmpty(cur, { identity: { name: 'Other', website: 'https://glow.co' } });
  assert.equal(out.identity.name, 'Glow');
  assert.equal(out.identity.website, 'https://glow.co');
});

test('arrays only fill when empty, wrong shapes are ignored', () => {
  const out: any = fillEmpty({ ...EMPTY, competitors: ['A'] }, { competitors: ['B'], identity: 'oops' });
  assert.deepEqual(out.competitors, ['A']);
  assert.deepEqual(out.identity, {});
});

test('txt coerces anything to a safe string', () => {
  assert.equal(txt(null), '');
  assert.equal(txt(['a', 'b']), 'a, b');
  assert.equal(txt({}), '');
  assert.equal(txt(5), '5');
});
