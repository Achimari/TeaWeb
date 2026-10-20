import test from 'node:test';
import assert from 'node:assert/strict';
import { archivedDay, emptyLine, joinLine, leaveLine, positionIn, rollover, rowsThatFit, windowStart, type LineState } from '../src/lib/line.ts';

const day = '2026-10-20';
const fill = (n: number, start = emptyLine(day)) => Array.from({ length: n }).reduce<LineState>((s, _, i) => joinLine(s, `g${i + 1}`, `Guest ${i + 1}`, `2026-10-20T0${Math.floor(i / 6)}:${String(i % 6 * 10).padStart(2, '0')}:00Z`), start);

test('joining adds the guest at the back and reports their position', () => {
  const state = fill(3);
  assert.equal(positionIn(state, 'g3'), 3);
  assert.equal(positionIn(state, 'nobody'), 0);
});

test('a duplicate join (double submit, second tab) keeps one place and the original name', () => {
  const once = joinLine(emptyLine(day), 'g1', 'Ada', '2026-10-20T08:00:00Z');
  const twice = joinLine(once, 'g1', 'Ada again', '2026-10-20T08:00:05Z');
  assert.deepEqual(twice, once);
});

test('leaving removes only your own place; everyone behind moves up', () => {
  const state = leaveLine(fill(3), 'g1');
  assert.equal(positionIn(state, 'g1'), 0);
  assert.equal(positionIn(state, 'g2'), 1);
  assert.deepEqual(leaveLine(state, 'nobody'), state);
});

test('order is first come, first served, even if entries arrive out of order', () => {
  let state = joinLine(emptyLine(day), 'late', 'Late', '2026-10-20T09:00:00Z');
  state = joinLine(state, 'early', 'Early', '2026-10-20T08:00:00Z');
  assert.equal(positionIn(state, 'early'), 1);
});

test('the day after, the first five are archived with their order and the line is cleared', () => {
  const next = rollover(fill(7), '2026-10-21');
  assert.equal(next.date, '2026-10-21');
  assert.deepEqual(next.entries, []);
  assert.deepEqual(archivedDay(next, '2026-10-20').map((e) => [e.position, e.name]), [[1, 'Guest 1'], [2, 'Guest 2'], [3, 'Guest 3'], [4, 'Guest 4'], [5, 'Guest 5']]);
});

test('rolling over twice (a retry) neither erases nor duplicates the archive', () => {
  const once = rollover(fill(7), '2026-10-21');
  assert.deepEqual(rollover(once, '2026-10-21'), once);
});

test('fewer than five people are archived as they are; an empty day archives nobody', () => {
  assert.equal(archivedDay(rollover(fill(2), '2026-10-21'), '2026-10-20').length, 2);
  assert.deepEqual(archivedDay(rollover(emptyLine(day), '2026-10-21'), '2026-10-20'), []);
});

test('a guest who left before midnight is not archived', () => {
  const next = rollover(leaveLine(fill(3), 'g1'), '2026-10-21');
  assert.deepEqual(archivedDay(next, '2026-10-20').map((e) => e.name), ['Guest 2', 'Guest 3']);
});

test('on the same day nothing changes', () => {
  const state = fill(3);
  assert.equal(rollover(state, day), state);
});

test('a day the app was not visited reads as empty, not as an older day', () => {
  const next = rollover(fill(3), '2026-10-25');
  assert.deepEqual(archivedDay(next, '2026-10-24'), []);
  assert.equal(archivedDay(next, '2026-10-20').length, 3);
});

test('page size follows the space available, and the window follows your place', () => {
  assert.equal(rowsThatFit(200, 44), 4);
  assert.equal(rowsThatFit(0, 0), 1);
  assert.equal(windowStart(null, 24, 24, 10), 14);
  assert.equal(windowStart(30, 24, 24, 10), 14);
});
