import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS, clockOffset, countdown, durationMs, formatClock } from '../src/lib/timer.ts';

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

const shared = (status: 'idle' | 'running' | 'ready', deadline: string | null) => ({ version: 3, status, label: deadline ? 'Oolong' : null, durationMs: deadline ? 180_000 : null, startedAt: null, deadline });

test('an idle shared timer shows nothing to count', () => {
  assert.deepEqual(countdown(shared('idle', null), 0, 0), { status: 'idle', remainingMs: 0 });
});

test('every device counts down to the same server deadline, whatever its own clock says', () => {
  const timer = shared('running', '2026-11-13T08:03:00.000Z'), serverNow = Date.parse('2026-11-13T08:01:00.000Z');
  // One device's clock is right; another's runs 90 seconds fast. With each device's measured offset, both show 2:00.
  assert.deepEqual(countdown(timer, serverNow, 0), { status: 'running', remainingMs: 120_000 });
  assert.deepEqual(countdown(timer, serverNow + 90_000, -90_000), { status: 'running', remainingMs: 120_000 });
});

test('a running timer turns Ready on its own at the deadline, even in a tab that slept through it', () => {
  const timer = shared('running', '2026-11-13T08:03:00.000Z');
  assert.deepEqual(countdown(timer, Date.parse('2026-11-13T08:03:00.000Z'), 0), { status: 'ready', remainingMs: 0 });
  assert.deepEqual(countdown(timer, Date.parse('2026-11-14T00:00:00.000Z'), 0), { status: 'ready', remainingMs: 0 });
  assert.deepEqual(countdown(shared('ready', '2026-11-13T08:03:00.000Z'), 0, 0), { status: 'ready', remainingMs: 0 });
});

test('the clock offset is measured against the middle of the request', () => {
  // Sent at 1000 and answered at 1400 by the local clock (midpoint 1200); the server stamped 5200: 4000 ahead.
  assert.equal(clockOffset(5_200, 1_000, 1_400), 4_000);
});

test('the clock rounds up, so it never shows 0:00 while tea is still steeping', () => {
  assert.equal(formatClock(125_000), '2:05');
  assert.equal(formatClock(1), '0:01');
  assert.equal(formatClock(0), '0:00');
  assert.equal(formatClock(3_600_000), '60:00');
});
