import test from 'node:test';
import assert from 'node:assert/strict';
import { HANDLE_REACH, LID_PROFILE, OPENING_R, lidPoints, lidPose, settle, stepLid } from '../src/lib/lid.ts';

test('the lid is seated when closed and fully open at the end of its path', () => {
  assert.deepEqual(lidPose(0), { lift: 0, tilt: 0 });
  const open = lidPose(1);
  assert.ok(open.tilt > 1 && open.tilt < Math.PI / 2, 'lifts clear and tilts back, short of upright');
  assert.deepEqual(lidPose(-1), lidPose(0));
  assert.deepEqual(lidPose(2), lidPose(1));
});

test('the lid lifts clear before it tilts, then tips back to lean on the rim', () => {
  const skirt = -Math.min(...LID_PROFILE.map(([, y]) => y));
  const firstTilt = Array.from({ length: 101 }, (_, i) => i / 100).find((t) => lidPose(t).tilt > 0)!;
  assert.ok(lidPose(firstTilt).lift > skirt, 'the skirt is out of the opening before any tilt');
  let previous = lidPose(0);
  for (let i = 1; i <= 100; i++) {
    const pose = lidPose(i / 100);
    assert.ok(pose.tilt >= previous.tilt, 'tilt only grows along the path');
    assert.ok(pose.lift >= 0);
    previous = pose;
  }
  assert.ok(lidPose(1).lift < 0.05, 'open, it rests close to the rim instead of floating');
});

test('at every point of its path the lid stays clear of the rim, the body and the handle', () => {
  const skirt = Math.min(...LID_PROFILE.map(([, y]) => y));
  assert.ok(skirt < 0, 'the lid has a skirt that sits inside the opening');
  for (let i = 0; i <= 200; i++) {
    for (const [radius, y] of lidPoints(i / 200)) {
      // Below the rim a point must be inside the opening; anything out at the handle must be above it.
      if (y < 0.004) assert.ok(radius < OPENING_R - 0.004, `t=${i / 200}: point at r=${radius.toFixed(3)} y=${y.toFixed(3)} cuts the rim`);
      assert.ok(radius < HANDLE_REACH.radius || y > HANDLE_REACH.top, `t=${i / 200}: point reaches the handle`);
    }
  }
});

test('opening and closing settle exactly, without overshooting the ends', () => {
  let state = { t: 0, v: 0 }, steps = 0;
  while (!settle(state, 1) && steps < 600) { state = stepLid(state, 1, 1 / 60); assert.ok(state.t >= 0 && state.t <= 1); steps++; }
  assert.deepEqual(state, { t: 1, v: 0 });
  assert.ok(steps > 12 && steps < 90, `takes a visible but short time (${steps} frames)`);
  while (!settle(state, 0) && steps < 1200) { state = stepLid(state, 0, 1 / 60); steps++; }
  assert.deepEqual(state, { t: 0, v: 0 });
});

test('reversing mid-way turns back smoothly from where the lid is, without a jump', () => {
  let state = { t: 0, v: 0 };
  for (let i = 0; i < 10; i++) state = stepLid(state, 1, 1 / 60);
  const turning = state.t;
  assert.ok(turning > 0.05 && turning < 0.95);
  const next = stepLid(state, 0, 1 / 60);
  assert.ok(Math.abs(next.t - turning) < 0.05, 'position is continuous when the target flips');
  let back = next;
  for (let i = 0; i < 300 && !settle(back, 0); i++) back = stepLid(back, 0, 1 / 60);
  assert.deepEqual(back, { t: 0, v: 0 });
});

test('a long frame (a background tab) cannot throw the lid past its ends', () => {
  const state = stepLid({ t: 0.5, v: 4 }, 1, 2);
  assert.ok(state.t >= 0 && state.t <= 1);
});
