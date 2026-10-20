import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_LEADER, placeCallout, type Rect } from '../src/lib/callouts.ts';

const size = { width: 110, height: 44 };
const bounds: Rect = { left: 8, top: 8, right: 1432, bottom: 892 };
const leaderOf = (spot: Rect, x: number, y: number) => Math.hypot(Math.min(Math.max(x, spot.left), spot.right) - x, Math.min(Math.max(y, spot.top), spot.bottom) - y);
const overlaps = (a: Rect, b: Rect) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

test('a callout stays next to its anchor, however crowded it is around it', () => {
  // The anchor sits inside a big solid block: every nearby spot overlaps something, and the far side of the block is free.
  const block: Rect = { left: 200, top: 200, right: 900, bottom: 700 };
  const spot = placeCallout({ anchor: { x: 500, y: 400 }, size, bounds, solids: [block], avoid: [] });
  assert.ok(leaderOf(spot, 500, 400) <= MAX_LEADER, `leader ${leaderOf(spot, 500, 400)}`);
});

test('it takes a clear spot beside the anchor when there is one', () => {
  const pot: Rect = { left: 300, top: 300, right: 700, bottom: 600 };
  const spot = placeCallout({ anchor: { x: 700, y: 320 }, size, bounds, solids: [pot], avoid: [] });
  assert.ok(!overlaps(spot, pot));
  assert.ok(leaderOf(spot, 700, 320) <= MAX_LEADER);
});

test('it stays inside the screen near an edge', () => {
  const spot = placeCallout({ anchor: { x: 1425, y: 12 }, size, bounds, solids: [], avoid: [] });
  assert.ok(spot.left >= bounds.left && spot.right <= bounds.right && spot.top >= bounds.top && spot.bottom <= bounds.bottom);
  assert.ok(leaderOf(spot, 1425, 12) <= MAX_LEADER);
});

test('it keeps clear of other callouts, corner text and an open panel', () => {
  const panel: Rect = { left: 760, top: 40, right: 1400, bottom: 560 }, other: Rect = { left: 500, top: 160, right: 610, bottom: 204 };
  const spot = placeCallout({ anchor: { x: 740, y: 200 }, size, bounds, solids: [], avoid: [panel, other] });
  assert.ok(!overlaps(spot, panel) && !overlaps(spot, other));
});

test('it keeps its side while that side stays clear, so it does not jump as the pot turns', () => {
  const first = placeCallout({ anchor: { x: 600, y: 400 }, size, bounds, solids: [], avoid: [] });
  const flipped = first.side === 'left' ? 'right' : 'left';
  for (let dx = 0; dx <= 30; dx += 5) {
    const next = placeCallout({ anchor: { x: 600 + dx, y: 400 }, size, bounds, solids: [], avoid: [], previous: flipped });
    assert.equal(next.side, flipped);
  }
});

test('it leaves its side once that side is blocked', () => {
  const wall: Rect = { left: 610, top: 300, right: 800, bottom: 500 };
  const next = placeCallout({ anchor: { x: 600, y: 400 }, size, bounds, solids: [wall], avoid: [], previous: 'right' });
  assert.notEqual(next.side, 'right');
  assert.ok(!overlaps(next, wall));
});

test('it reports how good its spot is, so the clearer of two anchors can win', () => {
  // A phone: the pot stands above the cup, the cup touches the right edge, open floor lies below it.
  const pot: Rect = { left: 8, top: 200, right: 382, bottom: 452 }, cup: Rect = { left: 230, top: 450, right: 382, bottom: 560 }, narrow = { left: 8, top: 8, right: 382, bottom: 836 };
  const rim = placeCallout({ anchor: { x: 380, y: 455 }, size, bounds: narrow, solids: [pot, cup], avoid: [] });
  const foot = placeCallout({ anchor: { x: 306, y: 560 }, size, bounds: narrow, solids: [pot, cup], avoid: [] });
  assert.ok(foot.cost < rim.cost);
  assert.ok(!overlaps(foot, cup));
});
