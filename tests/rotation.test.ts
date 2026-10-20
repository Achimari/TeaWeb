import test from 'node:test';
import assert from 'node:assert/strict';
import { approach, coast, dragTurn, keyTurn, releaseVelocity, wheelTurn } from '../src/lib/rotation.ts';

test('wheel down turns one way and wheel up the other, symmetrically', () => {
  assert.ok(wheelTurn(100, 0, 800) > 0);
  assert.equal(wheelTurn(100, 0, 800), -wheelTurn(-100, 0, 800));
});

test('a long scroll turns the teapot a full circle, with no stop at 360°', () => {
  let yaw = 0;
  for (let i = 0; i < 30; i++) yaw += wheelTurn(100, 0, 800);
  assert.ok(yaw > Math.PI * 2);
});

test('line and page wheel modes are converted to pixels first', () => {
  assert.equal(wheelTurn(3, 1, 800), wheelTurn(48, 0, 800));
  assert.equal(wheelTurn(1, 2, 800), wheelTurn(800, 0, 800));
});

test('dragging across the whole width turns the teapot half a revolution', () => {
  assert.ok(Math.abs(dragTurn(400, 400) - Math.PI) < 1e-9);
  assert.ok(Math.abs(dragTurn(-200, 400) + Math.PI / 2) < 1e-9);
  assert.equal(dragTurn(100, 0), 0);
});

test('arrow keys turn in 15° steps; Home returns to the front; other keys do nothing', () => {
  assert.ok(Math.abs((keyTurn('ArrowRight') as number) - Math.PI / 12) < 1e-9);
  assert.ok(Math.abs((keyTurn('ArrowLeft') as number) + Math.PI / 12) < 1e-9);
  assert.equal(keyTurn('Home'), 'reset');
  assert.equal(keyTurn('a'), null);
});

test('easing follows the input and lands exactly on the target, so motion stops when input stops', () => {
  const step = approach(0, 1, 16);
  assert.ok(step > 0 && step < 1);
  let yaw = 0;
  for (let i = 0; i < 60; i++) yaw = approach(yaw, 1, 16);
  assert.equal(yaw, 1);
  assert.equal(approach(0.5, 1, 0), 0.5);
  assert.equal(approach(0, 1, 10_000), 1);
});

test('release velocity comes from the last moments of a drag, not its whole length', () => {
  const samples = [{ t: 0, x: 0 }, { t: 400, x: 10 }, { t: 450, x: 60 }, { t: 500, x: 110 }];
  const v = releaseVelocity(samples, 400);
  assert.ok(Math.abs(v - dragTurn(1, 400)) < 1e-9, '1px per ms over the final stretch');
  assert.equal(releaseVelocity([{ t: 0, x: 0 }], 400), 0);
  assert.equal(releaseVelocity([{ t: 0, x: 0 }, { t: 300, x: 200 }, { t: 400, x: 200 }], 400), 0, 'a held finger has no throw');
});

test('a flick coasts, slows, and comes to an exact stop', () => {
  let velocity = 0.01, turned = 0, frames = 0;
  while (velocity !== 0 && frames < 1000) { const step = coast(velocity, 16); assert.ok(Math.abs(step.velocity) < Math.abs(velocity)); turned += step.turn; velocity = step.velocity; frames++; }
  assert.equal(velocity, 0);
  assert.ok(turned > 0.5 && turned < 6, `a firm flick turns it a good way but not forever (${turned.toFixed(2)} rad)`);
  assert.ok(frames < 200);
  const back = coast(-0.01, 16);
  assert.ok(back.turn < 0 && back.velocity < 0, 'symmetric');
});
