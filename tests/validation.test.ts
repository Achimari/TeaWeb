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
