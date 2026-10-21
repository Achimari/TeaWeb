// Editable source for public/models/teapot.glb: an abstract, rounded cobalt teapot with a lifting lid, and its cup.
// Run: node scripts/build-teapot.mjs   (re-run after changing any shape or glaze below)
//
// Named nodes are the interaction contract with the page:
//   Spout* → tea timer     BodyGlaze (including the handle), Lid → join the line     Cup* → the first five
// "HitSpout" and "HitSpoutTip" are invisible, deliberately fat volumes so the thin spout is easy to click.
// "Lid" is a group whose origin is the centre of the rim; the page lifts and tips it along the path in src/lib/lid.ts.
// "KnobTop", "SpoutLip" and "CupRim" mark where the three labels point.
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, meshopt, prune, weld } from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';
import { mkdirSync, writeFileSync } from 'node:fs';
import { HANDLE_REACH, KNOB_PROFILE, LID_PROFILE, OPENING_R } from '../src/lib/lid.ts';
import { BODY_PROFILE } from '../src/lib/body-profile.mjs';
import { unifiedBody } from './unified-body.mjs';

const TAU = Math.PI * 2;

// ---- Glazes ---------------------------------------------------------------------------------
// Satin, not gloss: broad soft highlights instead of sharp window reflections.
const cobalt = new THREE.MeshPhysicalMaterial({ name: 'CobaltGlaze', color: '#2846b0', roughness: 0.46, clearcoat: 0.3, clearcoatRoughness: 0.42 });
// The spout is an open tube; its bore must render from inside too.
const cobaltBore = cobalt.clone(); cobaltBore.name = 'CobaltGlazeBore'; cobaltBore.side = THREE.DoubleSide;
const cream = new THREE.MeshPhysicalMaterial({ name: 'CreamGlaze', color: '#efe5d1', roughness: 0.5, clearcoat: 0.2, clearcoatRoughness: 0.5 });
const tea = new THREE.MeshPhysicalMaterial({ name: 'Tea', color: '#5a2c0a', roughness: 0.18, clearcoat: 0.5, envMapIntensity: 0.4 });
const hit = new THREE.MeshBasicMaterial({ name: 'Hit', transparent: true, opacity: 0 });

// A smooth surface of revolution through [radius, height] points. Normals are averaged across the seam and
// pointed straight up or down on the axis, so nothing pinches or shows a line.
function revolve(points, { segments = 160, rows = 72 } = {}) {
  const curve = new THREE.SplineCurve(points.map(([x, y]) => new THREE.Vector2(x, y)));
  const position = [], index = [];
  for (let j = 0; j <= segments; j++) {
    const theta = (j / segments) * TAU;
    for (let i = 0; i <= rows; i++) { const p = curve.getPointAt(i / rows); position.push(Math.sin(theta) * p.x, p.y, Math.cos(theta) * p.x); }
  }
  for (let j = 0; j < segments; j++) for (let i = 0; i < rows; i++) {
    const a = j * (rows + 1) + i, b = a + rows + 1;
    index.push(a, b, a + 1, b, b + 1, a + 1); // counter-clockwise when the profile climbs the outside, so normals face out
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
  geometry.setIndex(index); geometry.computeVertexNormals();
  const normal = geometry.getAttribute('normal'), last = segments * (rows + 1);
  for (let i = 0; i <= rows; i++) {
    const n = new THREE.Vector3().fromBufferAttribute(normal, i).add(new THREE.Vector3().fromBufferAttribute(normal, last + i)).normalize();
    const onAxis = curve.getPointAt(i / rows).x < 1e-4;
    if (onAxis) n.set(0, Math.sign(n.y) || (i === 0 ? -1 : 1), 0);
    for (let j = 0; j <= segments; j++) {
      if (onAxis || j === 0 || j === segments) normal.setXYZ(j * (rows + 1) + i, n.x, n.y, n.z);
    }
  }
  return geometry;
}

// A tube whose radius varies along its length.
function sweep(curve, radius, tubular = 120, radial = 40) {
  const frames = curve.computeFrenetFrames(tubular, false), position = [], index = [], point = new THREE.Vector3();
  for (let i = 0; i <= tubular; i++) {
    const t = i / tubular, r = radius(t); curve.getPointAt(t, point);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * TAU, n = frames.normals[i].clone().multiplyScalar(Math.cos(a)).add(frames.binormals[i].clone().multiplyScalar(Math.sin(a)));
      position.push(point.x + r * n.x, point.y + r * n.y, point.z + r * n.z);
    }
  }
  for (let i = 0; i < tubular; i++) for (let j = 0; j < radial; j++) { const a = i * (radial + 1) + j, b = a + radial + 1; index.push(a, b, a + 1, b, b + 1, a + 1); }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
  geometry.setIndex(index); geometry.computeVertexNormals();
  // Weld the ring seam's normals too.
  const normal = geometry.getAttribute('normal');
  for (let i = 0; i <= tubular; i++) {
    const a = i * (radial + 1), b = a + radial;
    const n = new THREE.Vector3().fromBufferAttribute(normal, a).add(new THREE.Vector3().fromBufferAttribute(normal, b)).normalize();
    normal.setXYZ(a, n.x, n.y, n.z); normal.setXYZ(b, n.x, n.y, n.z);
  }
  return geometry;
}
const mesh = (name, geometry, material) => Object.assign(new THREE.Mesh(geometry, material), { name });
const marker = (name, x, y, z) => { const node = new THREE.Object3D(); node.name = name; node.position.set(x, y, z); return node; };

// ---- Teapot: one full, low, rounded body; base at y = 0, spout toward +x, handle toward −x -------------
const RIM_Y = 1.5;
const teapot = new THREE.Group(); teapot.name = 'Teapot';
const BODY = BODY_PROFILE;
// The outer wall and handle are built together below, after the interior and handle path are defined.
// The rim turns over into a finished cream interior, down to the tea.
const TEA_Y = 1.06;
const INSIDE = [[0.56, RIM_Y], [0.52, RIM_Y - 0.004], [OPENING_R, 1.48], [OPENING_R, 1.43], [0.62, 1.34], [0.86, 1.22], [1.0, TEA_Y + 0.02], [1.04, TEA_Y - 0.06]];
teapot.add(mesh('BodyInside', revolve(INSIDE, { rows: 40 }), cream));
teapot.add(mesh('BodyTea', new THREE.CircleGeometry(1.0, 128).rotateX(-Math.PI / 2).translate(0, TEA_Y, 0), tea));

// Lid: a separate assembly seated on the rim with a hairline gap, origin at the rim's centre.
const lid = new THREE.Group(); lid.name = 'Lid'; lid.position.set(0, RIM_Y, 0);
// The underside is glazed cream like the inside of the pot, so the open lid looks finished from below.
const SKIRT = LID_PROFILE.findIndex(([r, y]) => r > 0.45 && y > -0.07);
lid.add(mesh('LidUnderside', revolve(LID_PROFILE.slice(0, SKIRT + 1), { rows: 24 }), cream));
lid.add(mesh('LidDome', revolve(LID_PROFILE.slice(SKIRT), { rows: 56 }), cobalt));
lid.add(mesh('LidKnob', revolve(KNOB_PROFILE, { segments: 96, rows: 40 }), cream));
lid.add(marker('KnobTop', 0, KNOB_PROFILE.at(-1)[1], 0));
teapot.add(lid);

// Spout: one clean tapering curve from low on the belly, ending in a rounded lip just above the rim.
const spoutPath = new THREE.CatmullRomCurve3([[0.86, 0.46], [1.28, 0.6], [1.56, 0.92], [1.72, 1.28], [1.84, 1.5], [1.92, 1.58]].map(([x, y]) => new THREE.Vector3(x, y, 0)));
const spoutRadius = (t) => 0.1 + (0.32 - 0.1) * Math.pow(1 - t, 1.5);
teapot.add(mesh('Spout', sweep(spoutPath, spoutRadius, 96, 40), cobaltBore));
const lip = mesh('SpoutLip', new THREE.TorusGeometry(spoutRadius(1), 0.022, 20, 72), cobalt);
lip.position.copy(spoutPath.getPointAt(1)); lip.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), spoutPath.getTangentAt(1));
teapot.add(lip);
teapot.add(mesh('HitSpout', sweep(spoutPath, (t) => Math.max(0.32, spoutRadius(t) + 0.2), 24, 12), hit));
// The tube is open at the tip, so a sphere covers the lip itself: the most natural place to click the "nose".
const tipHit = mesh('HitSpoutTip', new THREE.SphereGeometry(0.4, 16, 12), hit); tipHit.position.copy(spoutPath.getPointAt(1)); teapot.add(tipHit);

// A restrained oval loop, pulled directly out of the body. The body and handle are one surface,
// so neither root can show an intersection crease or a separate shadow shell.
const handlePath = new THREE.CatmullRomCurve3([
  [-0.96, 1.08], [-1.2, 1.09], [-1.47, 1.08], [-1.72, 0.97], [-1.87, 0.75],
  [-1.79, 0.51], [-1.56, 0.4], [-1.23, 0.41], [-0.96, 0.45],
].map(([x, y]) => new THREE.Vector3(x, y, 0)), false, 'centripetal');
const handleRadius = () => 0.126;
teapot.add(mesh('BodyGlaze', unifiedBody(BODY, INSIDE, handlePath, { rimY: RIM_Y, teaY: TEA_Y }), cobalt));

// ---- Cup: handleless and round, cream inside, with tea ------------------------------------------
const cup = new THREE.Group(); cup.name = 'Cup'; cup.position.set(2.6, 0, 1.1);
const CUP_RIM = 0.755;
cup.add(mesh('CupGlaze', revolve([[0, 0.01], [0.28, 0.01], [0.33, 0.025], [0.34, 0.07], [0.42, 0.14], [0.56, 0.3], [0.64, 0.5], [0.665, 0.68], [0.655, 0.74], [0.635, CUP_RIM]]), cobalt));
cup.add(mesh('CupInside', revolve([[0.635, CUP_RIM], [0.612, 0.735], [0.6, 0.56], [0.575, 0.48], [0.5, 0.32], [0.3, 0.19], [0, 0.16]], { rows: 48 }), cream));
cup.add(mesh('CupTea', new THREE.CircleGeometry(0.574, 96).rotateX(-Math.PI / 2).translate(0, 0.5, 0), tea)); // below the rim, so a cream band shows all round
cup.add(marker('CupRim', 0, CUP_RIM, 0));
cup.add(mesh('HitCup', new THREE.CylinderGeometry(0.8, 0.55, 0.95, 24).translate(0, 0.46, 0), hit));

// The handle stays below the lid's moving edge; its roots are buried in the body field.
const handleTop = Math.max(...handlePath.getSpacedPoints(200).map((p) => p.y + handleRadius()));
if (handleTop - RIM_Y > HANDLE_REACH.top) throw new Error(`Handle top ${handleTop.toFixed(3)} rises into the lid's path`);
for (const [name, at, reach] of [['spout', spoutPath, spoutRadius], ['handle', handlePath, handleRadius]]) {
  // Only the parts low enough to meet the cup matter; the spout's tip passes high above it.
  const far = Math.max(0, ...at.getSpacedPoints(200).map((p, i) => (p.y - reach(i / 200) < CUP_RIM ? Math.hypot(p.x, p.z) + reach(i / 200) : 0)));
  // The page also sets the cup at (1.7, 0, 2.2) on tall screens (CUP_AT.tall in src/lib/teapot-scene.ts).
  if (far + 0.665 + 0.05 > Math.min(Math.hypot(cup.position.x, cup.position.z), Math.hypot(1.7, 2.2))) throw new Error(`The cup is close enough for the ${name} to hit it as the pot turns`);
}

const scene = new THREE.Scene(); scene.add(teapot, cup);
scene.updateMatrixWorld(true);

// ---- Export, then weld, deduplicate and meshopt-compress (decoded by three's MeshoptDecoder) -----
globalThis.FileReader ??= class { readAsArrayBuffer(blob) { blob.arrayBuffer().then((buffer) => { this.result = buffer; this.onloadend?.(); this.onload?.(); }); } };
const glb = await new Promise((resolve, reject) => new GLTFExporter().parse(scene, resolve, reject, { binary: true }));
await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
const document = await io.readBinary(new Uint8Array(glb));
await document.transform(dedup(), weld(), prune({ keepLeaves: true }), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
mkdirSync('public/models', { recursive: true });
const out = await io.writeBinary(document);
writeFileSync('public/models/teapot.glb', out);
let meshes = 0; scene.traverse((o) => { if (o.isMesh) meshes++; });
console.log(`public/models/teapot.glb ${(out.byteLength / 1024).toFixed(0)} KB, ${meshes} meshes`);
