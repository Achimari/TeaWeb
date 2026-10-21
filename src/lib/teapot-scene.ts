// The teapot and cup on a gallery floor. Loaded lazily with three.js; renders only when something changes.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { fitTurntable, type CameraBasis, type Window } from './framing';
import { LID_HINGE, lidPose, settle, stepLid, type LidState } from './lid';
import { addTeapotArt } from './teapot-art';

export type Part = 'spout' | 'body' | 'cup';
export type Insets = { top: number; right: number; bottom: number; left: number };
// Where a callout may point: spots on the part (the first is its usual one), the part's outline on screen, and
// whether the part is out of sight.
export type Box = { left: number; top: number; right: number; bottom: number };
export type Anchor = { x: number; y: number; spots: { x: number; y: number }[]; box: Box; hidden: boolean };
export type TeapotScene = {
  setYaw(yaw: number): void;
  setLidOpen(open: boolean): void;
  setReducedMotion(reduced: boolean): void;
  setHighlight(part: Part | null): void;
  pick(clientX: number, clientY: number): Part | null;
  anchors(): { parts: Record<Part, Anchor>; pot: Box; cup: Box }; // the parts, and the outlines of the pot (body, lid and handle) and the cup
  resize(insets: Insets | Insets[]): void; // several candidate free areas: the one that frames the set largest wins
  dispose(): void;
};

const FOV = 24;
const partOf = (object: THREE.Object3D): Part => {
  for (let node: THREE.Object3D | null = object; node; node = node.parent) {
    if (node.name.startsWith('Spout') || node.name.startsWith('HitSpout')) return 'spout';
    if (node.name === 'Cup') return 'cup';
  }
  return 'body';
};

// Broad, soft studio light: a warm overhead dome fading to a darker floor, with one large soft source high left.
// No hard-edged panels, so the satin glaze shows long gradients rather than window-shaped reflections.
function studio(): THREE.Scene {
  const room = new THREE.Scene(), dome = new THREE.SphereGeometry(10, 64, 32), position = dome.getAttribute('position'), colours: number[] = [];
  const top = new THREE.Color('#ffffff'), horizon = new THREE.Color('#d8d2c8'), floor = new THREE.Color('#6d6a66'), c = new THREE.Color();
  for (let i = 0; i < position.count; i++) {
    const y = position.getY(i) / 10;
    (y > 0 ? c.copy(horizon).lerp(top, Math.pow(y, 0.6)) : c.copy(horizon).lerp(floor, Math.pow(-y, 0.5))).toArray(colours, i * 3);
  }
  dome.setAttribute('color', new THREE.Float32BufferAttribute(colours, 3));
  room.add(new THREE.Mesh(dome, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  // One large, gentle source high left, and a faint cool one behind right that draws the far edge.
  const soft = new THREE.Mesh(new THREE.SphereGeometry(4.5, 32, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.3, 1.26, 1.18) }));
  soft.position.set(-5.5, 5.5, 4.5);
  const rim = new THREE.Mesh(new THREE.SphereGeometry(3.5, 32, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.95, 1.0, 1.1) }));
  rim.position.set(6, 3, -5);
  room.add(soft, rim);
  return room;
}

// onRender runs after every drawn frame; `settled` is true once the lid and the framing have stopped moving.
export async function createTeapotScene(canvas: HTMLCanvasElement, onRender: (settled: boolean) => void): Promise<TeapotScene> {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer), room = studio();
  scene.environment = pmrem.fromScene(room, 0.08).texture;
  room.traverse((object) => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); object.material.dispose(); } });
  // A gentle key from the same high left, only to lay a soft shadow on the floor.
  const key = new THREE.DirectionalLight('#fff3e2', 1.2);
  key.position.set(-5, 9, 6); key.castShadow = true;
  key.shadow.mapSize.setScalar(coarse ? 1024 : 2048); key.shadow.radius = 8; key.shadow.bias = -0.0005; key.shadow.normalBias = 0.02;
  Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 30 });
  scene.add(key);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.13 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync('/models/teapot.glb');
  const model = gltf.scene, teapot = model.getObjectByName('Teapot')!, cup = model.getObjectByName('Cup')!, lid = model.getObjectByName('Lid')!;
  const targets: THREE.Mesh[] = [], glow = new Map<Part, THREE.MeshStandardMaterial[]>([['spout', []], ['body', []], ['cup', []]]);
  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    targets.push(object);
    // Hit volumes are invisible but still raycast, from either side (a ray can enter the spout's open end).
    if (object.name.startsWith('Hit')) { Object.assign(object.material, { colorWrite: false, depthWrite: false, side: THREE.DoubleSide }); return; }
    object.castShadow = true; object.receiveShadow = true;
    // Each part gets its own material copies, so a hover can light up one part only.
    object.material = (object.material as THREE.MeshStandardMaterial).clone();
    if (!object.name.endsWith('Tea')) glow.get(partOf(object))!.push(object.material as THREE.MeshStandardMaterial); // lit tea reads as the wrong drink
  });
  const disposeArt = addTeapotArt(teapot);
  scene.add(model);
  const visible = targets.filter((t) => !t.name.startsWith('Hit'));

  const anchorPoints: Record<Part, THREE.Object3D> = { spout: teapot.getObjectByName('SpoutLip')!, body: teapot.getObjectByName('KnobTop')!, cup: cup.getObjectByName('CupRim')! };
  const rimHeight = anchorPoints.cup.position.y;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  const raycaster = new THREE.Raycaster();

  // ---- The lid: one path (src/lib/lid.ts), tipped over whichever edge faces the viewer's back left when it starts to open.
  const seat = lid.position.clone();
  let lidState: LidState = { t: 0, v: 0 }, lidTarget = 0, hinge = 0;
  lid.matrixAutoUpdate = false;
  const poseLid = (matrix: THREE.Matrix4, t: number, around: number) => {
    const { lift, tilt } = lidPose(t), m = new THREE.Matrix4();
    return matrix.makeTranslation(seat.x, seat.y, seat.z).multiply(m.makeRotationY(around)).multiply(m.makeTranslation(LID_HINGE.radius, LID_HINGE.y + lift, 0))
      .multiply(m.makeRotationZ(-tilt)).multiply(m.makeTranslation(-LID_HINGE.radius, -LID_HINGE.y, 0)).multiply(m.makeRotationY(-around));
  };
  poseLid(lid.matrix, 0, 0);

  // ---- Framing: one camera position for every turn angle. It changes only when the lid, available area or cup moves.
  const view = new THREE.Vector3(0.12, 0.36, 1).normalize();
  const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), view).normalize(), up = new THREE.Vector3().crossVectors(view, right);
  const cameraBasis: CameraBasis = { right: [right.x, right.y, right.z], up: [up.x, up.y, up.z], view: [view.x, view.y, view.z] };
  camera.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, view));
  // Vertices, sampled once: the pot's in its own frame, the lid's in the lid's frame, the cup's in the cup's.
  const sample = (root: THREE.Object3D, ...skip: THREE.Object3D[]) => {
    const out: number[] = [], v = new THREE.Vector3(), inverse = root.matrixWorld.clone().invert();
    root.traverse((object) => {
      if (!(object instanceof THREE.Mesh) || object.name.startsWith('Hit')) return;
      for (let n: THREE.Object3D | null = object; n && n !== root; n = n.parent) if (skip.includes(n)) return;
      const position = object.geometry.getAttribute('position'), m = inverse.clone().multiply(object.matrixWorld);
      for (let i = 0; i < position.count; i += 3) out.push(...v.fromBufferAttribute(position, i).applyMatrix4(m).toArray());
    });
    return out;
  };
  model.updateMatrixWorld(true);
  const potPoints = sample(teapot, lid), lidPoints = sample(lid), cupPoints = sample(cup);
  const turningPoints = new Float32Array(potPoints.length + lidPoints.length);
  turningPoints.set(potPoints);
  const fixedPoints = new Float32Array(cupPoints.length);
  // Each caption keeps clear of its whole part: the spout, the lid (wherever it is), the cup.
  const spout = teapot.getObjectByName('Spout')!, spoutPoints = sample(spout), bodyPoints = sample(teapot, lid, spout, teapot.getObjectByName('SpoutLip')!);
  const outlines: Record<Part, [number[], () => THREE.Matrix4]> = { spout: [spoutPoints, () => spout.matrixWorld], body: [lidPoints, () => lid.matrixWorld], cup: [cupPoints, () => cup.matrixWorld] };

  // Landscape screens set the cup beside the pot; tall screens bring it forward, so the set stays large.
  const CUP_AT = { wide: cup.position.clone(), tall: new THREE.Vector3(1.7, 0, 2.2) };
  let windowNow: Window | null = null, windowFrom: Window | null = null, windowTo: Window | null = null, insetsTo: Insets | null = null;
  let shift: LidState = { t: 1, v: 0 }; // progress from windowFrom to windowTo when the free area changes (a panel opens or closes)
  let reduced = false, lastSize = { width: 0, height: 0 };
  let frameDirty = true;

  // The closest framing of the whole turning set (lid wherever it is) plus the cup inside a free area.
  function fitFor(window: Window) {
    const p = new THREE.Vector3();
    for (let i = 0; i < lidPoints.length; i += 3) {
      p.fromArray(lidPoints, i).applyMatrix4(lid.matrix).toArray(turningPoints, potPoints.length + i);
    }
    for (let i = 0; i < cupPoints.length; i += 3) p.fromArray(cupPoints, i).applyMatrix4(cup.matrixWorld).toArray(fixedPoints, i);
    return fitTurntable(turningPoints, fixedPoints, cameraBasis, window);
  }
  function frame() {
    const f = fitFor(windowNow!);
    camera.position.copy(right).multiplyScalar(f.x).addScaledVector(up, f.y).addScaledVector(view, f.distance * 1.015); // a hair of air at the binding edge
    frameDirty = false;
  }

  // Springs advance by the time between animation frames (the rAF timestamps), so a slow frame still moves at the
  // right pace; a loop starting from rest takes one ordinary frame's step.
  let frameId = 0, lastFrame = 0;
  const animating = () => !settle(lidState, lidTarget) || !settle(shift, 1);
  const draw = (time?: number) => {
    frameId = 0;
    const seconds = time === undefined ? 0 : lastFrame ? Math.min(0.1, (time - lastFrame) / 1000) : 1 / 60;
    if (time !== undefined) lastFrame = time;
    if (!settle(lidState, lidTarget)) { lidState = reduced ? { t: lidTarget, v: 0 } : stepLid(lidState, lidTarget, seconds); frameDirty = true; }
    if (!settle(shift, 1)) { shift = reduced ? { t: 1, v: 0 } : stepLid(shift, 1, seconds); frameDirty = true; }
    if (windowFrom && windowTo) {
      const s = shift.t, mix = (key: keyof Window) => windowFrom![key] + (windowTo![key] - windowFrom![key]) * s;
      windowNow = { left: mix('left'), right: mix('right'), bottom: mix('bottom'), top: mix('top') };
    }
    poseLid(lid.matrix, lidState.t, hinge);
    model.updateMatrixWorld(true);
    if (windowNow && frameDirty) frame();
    renderer.render(scene, camera);
    const moving = animating();
    onRender(!moving);
    if (moving) request(); else lastFrame = 0;
  };
  const request = () => { if (!frameId) frameId = requestAnimationFrame(draw); };

  const project = (point: THREE.Vector3) => { const p = point.clone().project(camera); return { x: (p.x + 1) / 2 * canvas.clientWidth, y: (1 - p.y) / 2 * canvas.clientHeight }; };

  return {
    setYaw(yaw) { teapot.rotation.y = yaw; request(); },
    setLidOpen(open) {
      const next = open ? 1 : 0;
      if (next === lidTarget) return;
      if (open && lidState.t === 0) {
        // Tip it over the edge at the viewer's back left, so the opening faces the viewer and the lid is seen in profile.
        const away = right.clone().multiplyScalar(-Math.cos(0.55)).addScaledVector(new THREE.Vector3(view.x, 0, view.z).normalize(), -Math.sin(0.55));
        const local = away.applyAxisAngle(new THREE.Vector3(0, 1, 0), -teapot.rotation.y);
        // Never over the spout (+x) or the handle (−x): keep the hinge within 40° of the pot's sides, so the open lid
        // never stands right above either of them.
        const side = Math.atan2(-local.z, local.x), toward = Math.sin(side) >= 0 ? Math.PI / 2 : -Math.PI / 2;
        const off = Math.atan2(Math.sin(side - toward), Math.cos(side - toward)), limit = (40 * Math.PI) / 180;
        hinge = toward + Math.max(-limit, Math.min(limit, off));
      }
      lidTarget = next; request();
    },
    setReducedMotion(next) { reduced = next; request(); },
    setHighlight(part) {
      for (const [name, materials] of glow) for (const material of materials) { material.emissive.set(name === part ? '#ffffff' : '#000000'); material.emissiveIntensity = name === part ? 0.035 : 0; }
      request();
    },
    pick(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      model.updateMatrixWorld(true);
      raycaster.setFromCamera(new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1), camera);
      const hit = raycaster.intersectObjects(targets, false)[0];
      return hit ? partOf(hit.object) : null;
    },
    anchors() {
      const parts = {} as Record<Part, Anchor>;
      // The cup's spot is the right-hand edge of its rim as seen from the camera, clear of the tea.
      anchorPoints.cup.position.set(0, rimHeight, 0).addScaledVector(right, 0.64);
      cup.updateMatrixWorld(true);
      const outline = (points: number[], matrix: THREE.Matrix4, box: Box) => {
        const p = new THREE.Vector3();
        for (let i = 0; i < points.length; i += 9) {
          const q = project(p.fromArray(points, i).applyMatrix4(matrix));
          box.left = Math.min(box.left, q.x); box.right = Math.max(box.right, q.x); box.top = Math.min(box.top, q.y); box.bottom = Math.max(box.bottom, q.y);
        }
        return box;
      };
      const empty = (): Box => ({ left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity });
      for (const part of ['spout', 'body', 'cup'] as Part[]) {
        const world = anchorPoints[part].getWorldPosition(new THREE.Vector3());
        // A caption dims when its part has turned behind the pot: the first surface on the line of sight belongs to another part.
        raycaster.set(camera.position, world.clone().sub(camera.position).normalize());
        const first = raycaster.intersectObjects(visible, false)[0];
        const hidden = !!first && partOf(first.object) !== part && first.distance < camera.position.distanceTo(world) - 0.05;
        const at = project(world), [points, matrix] = outlines[part];
        // The cup can also be labelled from the front of its foot, for when the floor is free below it rather than beside.
        const spots = part === 'cup' ? [at, project(new THREE.Vector3(0, 0.03, 0).addScaledVector(new THREE.Vector3(view.x, 0, view.z).normalize(), 0.34).applyMatrix4(cup.matrixWorld))] : [at];
        parts[part] = { ...at, spots, box: outline(points, matrix(), { left: at.x, top: at.y, right: at.x, bottom: at.y }), hidden };
      }
      const pot = outline(lidPoints, lid.matrixWorld, outline(bodyPoints, teapot.matrixWorld, empty()));
      return { parts, pot, cup: outline(cupPoints, cup.matrixWorld, empty()) };
    },
    resize(candidates) {
      const width = canvas.clientWidth, height = canvas.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height; camera.updateProjectionMatrix();
      const tanV = Math.tan((FOV * Math.PI) / 360), tanH = tanV * camera.aspect;
      const windowOf = (i: Insets): Window => ({ left: -tanH * (1 - (2 * i.left) / width), right: tanH * (1 - (2 * i.right) / width), bottom: -tanV * (1 - (2 * i.bottom) / height), top: tanV * (1 - (2 * i.top) / height) });
      const cupFor = (i: Insets) => ((width - i.left - i.right) / (height - i.top - i.bottom) < 0.9 ? CUP_AT.tall : CUP_AT.wide);
      // Where the type can leave room in more than one way (above and below, or beside), frame each and keep the
      // arrangement that shows the sculpture largest: the smallest camera distance.
      const list = Array.isArray(candidates) ? candidates : [candidates];
      // The choice is made for where the lid is going, not where it is mid-swing: closing a panel must pick exactly
      // the framing the closed pot had before, whichever way the lid was moving when the panel changed.
      const distanceFor = (i: Insets) => { cup.position.copy(cupFor(i)); cup.updateMatrixWorld(true); return fitFor(windowOf(i)).distance; };
      const swing = lid.matrix.clone();
      poseLid(lid.matrix, lidTarget, hinge);
      const insets = list.length === 1 ? list[0] : list.map((i) => ({ i, d: distanceFor(i) })).reduce((a, b) => (b.d < a.d ? b : a)).i;
      lid.matrix.copy(swing);
      const next = windowOf(insets);
      cup.position.copy(cupFor(insets));
      // A panel opening or closing glides the set to its new place; a window resize simply re-fits.
      const panelMoved = insetsTo && windowNow && width === lastSize.width && height === lastSize.height && (insets.left !== insetsTo.left || insets.right !== insetsTo.right || insets.top !== insetsTo.top || insets.bottom !== insetsTo.bottom);
      lastSize = { width, height }; insetsTo = insets;
      frameDirty = true;
      if (panelMoved && !reduced) { windowFrom = windowNow; windowTo = next; shift = { t: 0, v: 0 }; }
      else { windowFrom = windowTo = windowNow = next; shift = { t: 1, v: 0 }; }
      if (frameId) { cancelAnimationFrame(frameId); frameId = 0; }
      draw();
    },
    dispose() {
      cancelAnimationFrame(frameId);
      scene.traverse((object) => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); for (const m of [object.material].flat()) m.dispose(); } });
      disposeArt(); scene.environment?.dispose(); pmrem.dispose(); renderer.dispose();
    },
  };
}
