import test from 'node:test';
import assert from 'node:assert/strict';
import { displayNameSchema } from '../src/lib/validation.ts';

const parse = (value: unknown) => displayNameSchema.safeParse(value);

test('a display name is trimmed and inner spaces are collapsed', () => {
  assert.equal(parse('  Ada   Lovelace ').data, 'Ada Lovelace');
});

test('ordinary names in any script are accepted', () => {
  for (const name of ['Ada', 'Jānis', 'Zoë O’Neil', 'Анна', 'Mei-Ling', 'tea.lover_2']) assert.equal(parse(name).success, true, name);
});

test('names must be 2 to 24 characters', () => {
  assert.equal(parse('A').success, false);
  assert.equal(parse('x'.repeat(25)).success, false);
  assert.equal(parse('   ').success, false);
});

test('markup, control characters and non-strings are refused', () => {
  for (const name of ['<b>Ada</b>', 'Ada\u0000', 'Ada\nLovelace', 42, null]) assert.equal(parse(name).success, false, String(name));
});

test('a shared timer starts from a known tea, or a custom time within an hour', async () => {
  const { timerStartSchema } = await import('../src/lib/validation.ts');
  assert.deepEqual(timerStartSchema.parse({ tea: 'Oolong' }), { label: 'Oolong', durationMs: 180_000 });
  assert.deepEqual(timerStartSchema.parse({ tea: 'Custom', durationMs: 90_000 }), { label: 'Custom', durationMs: 90_000 });
  for (const body of [{ tea: 'Oolong', durationMs: 3_000_000 }, { tea: 'Vodka' }, { tea: 'Custom' }, { tea: 'Custom', durationMs: 500 }, { tea: 'Custom', durationMs: 3_600_001 }, { tea: 'Custom', durationMs: 1.5 }, null, 'Green'])
    assert.equal(timerStartSchema.safeParse(body).success, false, JSON.stringify(body));
});

test('a stop names the timer version it saw', async () => {
  const { timerStopSchema } = await import('../src/lib/validation.ts');
  assert.deepEqual(timerStopSchema.parse({ version: 4 }), { version: 4 });
  for (const body of [{}, { version: -1 }, { version: 1.5 }, { version: '4' }]) assert.equal(timerStopSchema.safeParse(body).success, false, JSON.stringify(body));
});
