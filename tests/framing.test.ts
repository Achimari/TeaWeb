import test from 'node:test';
import assert from 'node:assert/strict';
import { fit, type Frame, type Window } from '../src/lib/framing.ts';

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
