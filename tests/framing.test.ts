import test from 'node:test';
import assert from 'node:assert/strict';
import { fit, fitTurntable, type Frame, type Window } from '../src/lib/framing.ts';

// Points are in the camera's basis: x right, y up, z toward the camera.
const project = (p: number[], f: Frame) => [(p[0] - f.x) / (f.distance - p[2]), (p[1] - f.y) / (f.distance - p[2])];
const cube = [-1, 1].flatMap((x) => [-1, 1].flatMap((y) => [-1, 1].map((z) => [x, y, z])));

test('fit places every point inside the window, touching it on the binding side', () => {
  const window: Window = { left: -0.2, right: 0.3, bottom: -0.15, top: 0.25 };
  const points = [...cube, [2, 0.5, 0.3], [-0.4, 1.6, -0.8]];
  const frame = fit(points.flat(), window);
  let touches = 0;
  for (const p of points) {
    const [u, v] = project(p, frame);
    assert.ok(u >= window.left - 1e-9 && u <= window.right + 1e-9 && v >= window.bottom - 1e-9 && v <= window.top + 1e-9);
    if (Math.abs(u - window.left) < 1e-6 || Math.abs(u - window.right) < 1e-6 || Math.abs(v - window.bottom) < 1e-6 || Math.abs(v - window.top) < 1e-6) touches++;
  }
  assert.ok(touches >= 2, 'tight: no closer camera would fit');
});

test('a wider window brings a wide set closer', () => {
  const wide = [[-3, 0, 0], [3, 0, 0], [0, 1, 0]];
  assert.ok(fit(wide.flat(), { left: -0.4, right: 0.4, bottom: -0.2, top: 0.2 }).distance < fit(wide.flat(), { left: -0.2, right: 0.2, bottom: -0.2, top: 0.2 }).distance);
});

test('turntable framing holds the entire rotating pot and fixed cup without camera breathing', () => {
  const window: Window = { left: -0.25, right: 0.25, bottom: -0.18, top: 0.18 };
  const view: [number, number, number] = [0.12, 0.36, 1];
  const length = Math.hypot(...view);
  view[0] /= length; view[1] /= length; view[2] /= length;
  const right: [number, number, number] = [view[2], 0, -view[0]];
  const rightLength = Math.hypot(...right);
  right[0] /= rightLength; right[2] /= rightLength;
  const up: [number, number, number] = [-view[1] * right[2], view[2] * right[0] - view[0] * right[2], view[1] * right[0]];
  const turning = [2, 0.5, 0, -1.7, 0.2, 0.3, 0.8, 1.8, -0.5];
  const fixed = [2.6, 0, 1.1, 3.2, 0.8, 1.1];
  const axes = { right, up, view };
  const frame = fitTurntable(turning, fixed, axes, window);
  const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  for (let i = 0; i < 360; i++) {
    const yaw = i * Math.PI / 180;
    for (const source of [turning, fixed]) for (let k = 0; k < source.length; k += 3) {
      const [x, y, z] = source.slice(k, k + 3);
      const world = source === turning ? [x * Math.cos(yaw) + z * Math.sin(yaw), y, -x * Math.sin(yaw) + z * Math.cos(yaw)] : [x, y, z];
      const p = [dot(world, right), dot(world, up), dot(world, view)];
      const [u, v] = project(p, frame);
      assert.ok(u >= window.left - 1e-9 && u <= window.right + 1e-9 && v >= window.bottom - 1e-9 && v <= window.top + 1e-9,
        `point ${k / 3} at ${i}° must stay in frame`);
    }
  }
  assert.ok(frame.distance < 25, 'the steady view should still fill the available area');
});
