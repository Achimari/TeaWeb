import * as THREE from 'three';
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Turn a pottery profile into a radius lookup. The profiles start with a flat base, so when
// several points have the same height the outermost point defines the visible wall.
function radiiAtRows(profile, count, worldY, step) {
  const points = new THREE.SplineCurve(profile.map(([r, y]) => new THREE.Vector2(r, y))).getSpacedPoints(2400);
  const radii = new Float32Array(count);
  for (let row = 0; row < count; row++) {
    const y = worldY(row), epsilon = 1e-5;
    let below = -Infinity, above = Infinity, lowerRadius = 0, upperRadius = 0;
    for (const p of points) {
      if (p.y <= y && p.y > below + epsilon) { below = p.y; lowerRadius = p.x; }
      else if (Math.abs(p.y - below) <= epsilon) lowerRadius = Math.max(lowerRadius, p.x);
      if (p.y >= y && p.y < above - epsilon) { above = p.y; upperRadius = p.x; }
      else if (Math.abs(p.y - above) <= epsilon) upperRadius = Math.max(upperRadius, p.x);
    }
    radii[row] = below === -Infinity ? upperRadius : above === Infinity ? lowerRadius
      : THREE.MathUtils.lerp(lowerRadius, upperRadius, Math.min(1, Math.max(0, (y - below) / Math.max(step * 0.01, above - below))));
  }
  return radii;
}

const smoothUnion = (a, b, width) => {
  const h = Math.max(width - Math.abs(a - b), 0) / width;
  return Math.min(a, b) - h * h * width * 0.25;
};

// A single glazed surface removes the overlapping shells that made dark crescents at the roots.
// The loop is thin and oval; a small smooth union makes each end flow into the body like pulled clay.
export function unifiedBody(bodyProfile, insideProfile, handlePath, { rimY, teaY }) {
  const size = 224, halfSpan = 2.15, centreY = 0.76, step = (halfSpan * 2) / size;
  const world = (i) => (i - size / 2) * step;
  const worldY = (i) => world(i) + centreY;
  const outer = radiiAtRows(bodyProfile, size, worldY, step);
  const inner = radiiAtRows(insideProfile, size, worldY, step);
  const line = handlePath.getSpacedPoints(180);
  const near = new Float32Array(size * size), narrow = new Float32Array(size * size), wide = new Float32Array(size * size);

  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const index = y * size + x, px = world(x), py = worldY(y);
    if (px > -0.68 || px < -2.12 || py < 0.2 || py > 1.36) { near[index] = 100; continue; }
    let best = Infinity, along = 0;
    for (let i = 0; i < line.length - 1; i++) {
      const a = line[i], b = line[i + 1], dx = b.x - a.x, dy = b.y - a.y;
      const t = Math.min(1, Math.max(0, ((px - a.x) * dx + (py - a.y) * dy) / (dx * dx + dy * dy)));
      const d = (px - a.x - t * dx) ** 2 + (py - a.y - t * dy) ** 2;
      if (d < best) { best = d; along = (i + t) / (line.length - 1); }
    }
    near[index] = best;
    const root = Math.max(0, 1 - Math.min(along, 1 - along) / 0.18);
    narrow[index] = 0.079 + root * 0.023;
    wide[index] = 0.108 + root * 0.018;
  }

  const cubes = new MarchingCubes(size, new THREE.MeshBasicMaterial(), false, false, 350000);
  cubes.isolation = 0;
  for (let z = 0; z < size; z++) {
    const pz = world(z), z2 = pz * pz, zOffset = z * size * size;
    for (let y = 0; y < size; y++) {
      const py = worldY(y), base = zOffset + y * size;
      for (let x = 0; x < size; x++) {
        const px = world(x), radial = Math.hypot(px, pz);
        const outside = Math.max(radial - outer[y], 0.012 - py, py - rimY);
        // Keep the cobalt inner wall behind the separately glazed cream interior. A small gap
        // prevents the two surfaces from fighting for the same pixels when the lid lifts.
        const cavity = Math.max(radial - Math.max(0.05, inner[y] + 0.02), teaY - 0.03 - py);
        const body = Math.max(outside, -cavity);
        const handleIndex = y * size + x;
        let joined = body;
        if (near[handleIndex] < 1) {
          const a = narrow[handleIndex], b = wide[handleIndex];
          const handle = (Math.sqrt(near[handleIndex] / (a * a) + z2 / (b * b)) - 1) * a;
          joined = smoothUnion(body, handle, 0.105);
        }
        cubes.field[base + x] = -joined;
      }
    }
  }
  cubes.update();
  if (cubes.count / 3 >= 350000) throw new Error('Unified body exceeded its mesh budget');
  const position = cubes.geometry.getAttribute('position').array.slice(0, cubes.count * 3);
  const normal = cubes.geometry.getAttribute('normal').array.slice(0, cubes.count * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normal, 3));
  geometry.scale(halfSpan, halfSpan, halfSpan);
  geometry.translate(0, centreY, 0);
  const welded = mergeVertices(geometry, 1e-5);
  geometry.dispose(); cubes.geometry.dispose(); cubes.material.dispose();
  return welded;
}
