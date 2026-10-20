import test from 'node:test';
import assert from 'node:assert/strict';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';

test('the teapot handle is part of the body surface, with no overlapping attachment mesh', async () => {
  await MeshoptDecoder.ready;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
  const document = await io.read('public/models/teapot.glb');
  const nodes = document.getRoot().listNodes();
  const bodyNode = nodes.find((node) => node.getName() === 'BodyGlaze');
  const body = bodyNode?.getMesh();
  assert.ok(body && bodyNode, 'the visible cobalt body exists');

  const position = body.listPrimitives()[0].getAttribute('POSITION');
  assert.ok(position);
  const matrix = bodyNode.getWorldMatrix();
  let leftmost = Infinity;
  for (let i = 0; i < position.getCount(); i++) {
    const [x, y, z] = position.getElement(i, [0, 0, 0]);
    leftmost = Math.min(leftmost, matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12]);
  }
  assert.ok(leftmost < -1.7, 'the body mesh includes the full handle loop');
  assert.equal(nodes.some((node) => node.getName() === 'Handle' || node.getName() === 'HandleShadow'), false,
    'there is no separate shell or shadow mesh cutting across the glazed body');
});
