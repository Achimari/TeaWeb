import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS, durationMs, formatClock, readDeadline, timerState } from '../src/lib/timer.ts';

test('presets are a few common steeping times, shortest first', () => {
  assert.ok(PRESETS.length >= 3 && PRESETS.length <= 5);
  const minutes = PRESETS.map((p) => p.minutes);
  assert.deepEqual([...minutes].sort((a, b) => a - b), minutes);
});

test('a custom duration accepts minutes and seconds within an hour', () => {
  assert.equal(durationMs(3, 30), 210_000);
  assert.equal(durationMs(0, 45), 45_000);
  assert.equal(durationMs(60, 0), 3_600_000);
});

test('impossible or empty durations are refused', () => {
  for (const [m, s] of [[0, 0], [-1, 0], [0, 60], [60, 1], [1.5, 0], [Number.NaN, 0]]) assert.equal(durationMs(m, s), null, `${m}:${s}`);
});

test('with no deadline the timer is idle', () => {
  assert.deepEqual(timerState(null, 1000), { status: 'idle', remainingMs: 0 });
});

test('before the deadline it runs, counting down from the saved deadline', () => {
  assert.deepEqual(timerState(10_000, 4_000), { status: 'running', remainingMs: 6_000 });
});

test('at or after the deadline the tea is ready, even if the tab slept through it', () => {
  assert.deepEqual(timerState(10_000, 10_000), { status: 'ready', remainingMs: 0 });
  assert.deepEqual(timerState(10_000, 99_000_000), { status: 'ready', remainingMs: 0 });
});

test('a reload recomputes from the stored deadline, not from a restarted countdown', () => {
  const stored = JSON.stringify({ deadline: 1_000_000 });
  assert.equal(readDeadline(stored), 1_000_000);
  assert.deepEqual(timerState(readDeadline(stored), 940_000), { status: 'running', remainingMs: 60_000 });
});

test('corrupt or foreign storage reads as no timer', () => {
  for (const raw of [null, '', '{bad', '{"deadline":"soon"}', '[]', '{"deadline":-5}']) assert.equal(readDeadline(raw), null, String(raw));
});

test('the clock rounds up, so it never shows 0:00 while tea is still steeping', () => {
  assert.equal(formatClock(125_000), '2:05');
  assert.equal(formatClock(1), '0:01');
  assert.equal(formatClock(0), '0:00');
  assert.equal(formatClock(3_600_000), '60:00');
});
