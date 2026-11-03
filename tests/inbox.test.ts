import './setup-env.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const { VIEWS, sortComments } = await import('../server/routes/api-inbox.ts');
const { templateDraft } = await import('../server/inbox/actions.ts');

const rows = [
  { id: 'a', status: 'unread', intent: 'praise', priority: 4, posted_at: '2026-11-03T10:00:00Z' },
  { id: 'b', status: 'unread', intent: 'buying_signal', priority: 1, posted_at: '2026-11-02T10:00:00Z' },
  { id: 'c', status: 'read', intent: 'complaint', priority: 2, posted_at: '2026-11-03T09:00:00Z' },
  { id: 'd', status: 'unread', intent: 'spam', priority: 5, posted_at: '2026-11-03T11:00:00Z' },
  { id: 'e', status: 'replied', intent: 'question', priority: 3, posted_at: '2026-11-03T08:00:00Z' },
  { id: 'f', status: 'hidden', intent: 'buying_signal', priority: 1, posted_at: '2026-11-01T08:00:00Z' },
  { id: 'g', status: 'archived', intent: 'complaint', priority: 2, posted_at: '2026-11-01T08:00:00Z' },
];

test('needs reply skips spam, replied, hidden and archived', () => {
  assert.deepEqual(rows.filter(VIEWS.needs_reply).map((r) => r.id), ['a', 'b', 'c']);
});

test('buying view leaves hidden comments out', () => {
  assert.deepEqual(rows.filter(VIEWS.buying).map((r) => r.id), ['b']);
  assert.deepEqual(rows.filter(VIEWS.hidden).map((r) => r.id), ['f']);
  assert.deepEqual(rows.filter(VIEWS.archived).map((r) => r.id), ['g']);
});

test('priority sort puts buying signals then complaints first, newest within a level', () => {
  assert.deepEqual(sortComments(rows.filter(VIEWS.needs_reply), 'priority').map((r) => r.id), ['b', 'c', 'a']);
  assert.deepEqual(sortComments(rows.filter(VIEWS.needs_reply), 'recent').map((r) => r.id), ['a', 'c', 'b']);
});

test('template drafts follow the brand language and never promise prices', () => {
  const id = templateDraft('buying_signal', 'sari', 'Kopi Senja', 'Bahasa Indonesia');
  assert.match(id, /@sari/);
  assert.match(id, /DM/);
  const en = templateDraft('complaint', null, 'Kopi Senja', 'English');
  assert.match(en, /from Kopi Senja/);
  assert.doesNotMatch(en + id, /[–—]/);
  assert.doesNotMatch(en + id, /\d/);
});
