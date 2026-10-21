import test from 'node:test';
import assert from 'node:assert/strict';
import { rowsThatFit, windowStart } from '../src/lib/line.ts';

test('page size follows the space available, and the window follows your place', () => {
  assert.equal(rowsThatFit(200, 44), 4);
  assert.equal(rowsThatFit(0, 0), 1);
  assert.equal(windowStart(null, 24, 24, 10), 14);
  assert.equal(windowStart(30, 24, 24, 10), 14);
});
