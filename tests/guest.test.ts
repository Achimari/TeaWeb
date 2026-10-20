import test from 'node:test';
import assert from 'node:assert/strict';
import { allowRequest, hashGuestToken, isGuestToken, newGuestToken } from '../src/lib/guest.ts';

test('guest tokens are long, URL-safe, and never repeat', () => {
  const a = newGuestToken(), b = newGuestToken();
  assert.ok(isGuestToken(a) && isGuestToken(b));
  assert.notEqual(a, b);
  assert.equal(a.length, 43);
});

test('only well-formed tokens are accepted from a cookie', () => {
  for (const raw of [undefined, '', 'short', 'x'.repeat(43) + '!', 'a b'.repeat(15)]) assert.equal(isGuestToken(raw), false, String(raw));
});

test('the database only ever sees a one-way hash of the token', () => {
  const token = newGuestToken(), hash = hashGuestToken(token);
  assert.match(hash, /^[0-9a-f]{64}$/);
  assert.equal(hashGuestToken(token), hash);
  assert.ok(!hash.includes(token));
});

test('requests are allowed up to the limit within a window, then refused until it passes', () => {
  const store = new Map<string, number[]>(), rule = { limit: 3, windowMs: 60_000 };
  assert.deepEqual([0, 1, 2, 3].map((i) => allowRequest(store, 'ip', 1000 + i, rule)), [true, true, true, false]);
  assert.equal(allowRequest(store, 'other', 1005, rule), true);
  assert.equal(allowRequest(store, 'ip', 61_001, rule), true);
});
