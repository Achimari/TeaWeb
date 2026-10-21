import * as THREE from 'three';
import { BODY_PROFILE } from './body-profile.mjs';

const INK = '#f6edd7';
const SHADOW = '#172f78';
const RED = '#df6448';
const TAU = Math.PI * 2;

function randomFrom(seed: number) {
  let value = seed;
  return () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 4294967296; };
}

function spray(ctx: CanvasRenderingContext2D, seed: number, x: number, y: number, rx: number, ry: number, count: number, color: string) {
  const random = randomFrom(seed);
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    const a = random() * TAU, distance = Math.sqrt(random());
    ctx.globalAlpha = 0.08 + random() * 0.38;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * distance * rx, y + Math.sin(a) * distance * ry, 0.8 + random() * 3.8, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drip(ctx: CanvasRenderingContext2D, x: number, y: number, length: number, width: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineCap = 'round'; ctx.lineWidth = width;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x + 4, y + length * 0.35, x - 5, y + length * 0.72, x, y + length); ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(x, y + length, width * 0.56, width * 0.8, 0, 0, TAU); ctx.fill();
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color = INK) {
  ctx.strokeStyle = color; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 4;
    ctx.moveTo(x - Math.cos(a) * size, y - Math.sin(a) * size);
    ctx.lineTo(x + Math.cos(a) * size, y + Math.sin(a) * size);
  }
  ctx.stroke();
}

function arrow(ctx: CanvasRenderingContext2D, x: number, y: number, color = RED) {
  ctx.strokeStyle = color; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(x - 82, y + 51); ctx.quadraticCurveTo(x - 18, y - 16, x + 72, y - 12);
  ctx.moveTo(x + 40, y - 42); ctx.lineTo(x + 75, y - 12); ctx.lineTo(x + 40, y + 20); ctx.stroke();
}

// The painterly marks are drawn once onto transparent canvases, then bent around the clay.
// They are kept separate from the glaze so their edges stay crisp without changing the pot's material.
function frontPaint(ctx: CanvasRenderingContext2D) {
  ctx.translate(95, 20);
  ctx.rotate(-0.065);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  // Three loose marker letters, drawn as strokes so the lettering stays characterful on every browser.
  const letters = () => {
    ctx.beginPath();
    ctx.moveTo(250, 238); ctx.bezierCurveTo(254, 330, 238, 455, 261, 541);
    ctx.moveTo(139, 309); ctx.bezierCurveTo(212, 313, 307, 272, 372, 291);
    ctx.moveTo(423, 457); ctx.bezierCurveTo(513, 477, 565, 429, 528, 386);
    ctx.bezierCurveTo(492, 346, 413, 388, 420, 472);
    ctx.bezierCurveTo(425, 543, 506, 561, 574, 509);
    ctx.moveTo(754, 407); ctx.bezierCurveTo(715, 362, 639, 402, 632, 469);
    ctx.bezierCurveTo(621, 549, 722, 565, 766, 485);
    ctx.moveTo(777, 390); ctx.bezierCurveTo(769, 453, 774, 503, 797, 550);
  };
  ctx.save(); ctx.filter = 'blur(17px)'; ctx.globalAlpha = 0.78;
  ctx.strokeStyle = RED; ctx.lineWidth = 108; letters(); ctx.stroke(); ctx.restore();
  spray(ctx, 3104, 520, 430, 390, 166, 1900, RED);
  ctx.strokeStyle = SHADOW; ctx.lineWidth = 72; letters(); ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 48; letters(); ctx.stroke();

  // A quick second sweep and paint flecks give the pot the feel of a one-off studio piece.
  ctx.strokeStyle = INK;
  ctx.lineWidth = 13;
  ctx.beginPath();
  ctx.moveTo(106, 415); ctx.bezierCurveTo(64, 521, 211, 609, 544, 607);
  ctx.bezierCurveTo(816, 605, 960, 517, 882, 316);
  ctx.stroke();
  ctx.font = 'italic 72px Georgia, serif';
  ctx.fillStyle = INK;
  ctx.fillText('take five', 512, 691);
  ctx.font = '900 66px "Arial Narrow", sans-serif';
  ctx.fillText('NO RUSH', 105, 190);
  ctx.strokeStyle = RED; ctx.lineWidth = 10;
  ctx.beginPath(); ctx.moveTo(112, 213); ctx.lineTo(392, 201); ctx.stroke();
  star(ctx, 91, 390, 37); star(ctx, 866, 205, 49); star(ctx, 915, 577, 24, RED);
  arrow(ctx, 783, 292);
  drip(ctx, 269, 540, 80, 18, INK); drip(ctx, 786, 545, 62, 12, INK);
}

function backPaint(ctx: CanvasRenderingContext2D) {
  ctx.translate(76, 12); ctx.rotate(0.045);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  spray(ctx, 893, 448, 386, 300, 155, 1150, RED);
  ctx.strokeStyle = RED; ctx.lineWidth = 19;
  ctx.beginPath(); ctx.moveTo(115, 294); ctx.lineTo(854, 233);
  ctx.moveTo(116, 531); ctx.lineTo(875, 488); ctx.stroke();
  ctx.font = '900 255px "Arial Black", sans-serif';
  ctx.lineWidth = 27; ctx.strokeStyle = SHADOW; ctx.strokeText('ЧАЙ', 117, 463);
  ctx.fillStyle = INK; ctx.fillText('ЧАЙ', 117, 463);
  ctx.fillStyle = RED; ctx.fillRect(155, 342, 54, 10); ctx.fillRect(420, 375, 68, 10); ctx.fillRect(755, 414, 57, 10);
  ctx.strokeStyle = INK; ctx.lineWidth = 10;
  ctx.beginPath(); ctx.moveTo(135, 565); ctx.bezierCurveTo(394, 647, 649, 620, 868, 550); ctx.stroke();
  ctx.font = '900 70px "Arial Narrow", sans-serif'; ctx.fillStyle = INK;
  ctx.fillText('SIP SLOW / STAY LONG', 145, 682);
  star(ctx, 89, 190, 40, RED); star(ctx, 875, 575, 37);
  drip(ctx, 834, 490, 72, 12, RED);
}

function sidePaint(ctx: CanvasRenderingContext2D) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  spray(ctx, 1208, 510, 380, 330, 240, 1050, RED);
  ctx.strokeStyle = RED; ctx.lineWidth = 22;
  ctx.beginPath(); ctx.ellipse(510, 376, 266, 225, -0.2, 0.1, TAU - 0.6); ctx.stroke();
  ctx.strokeStyle = SHADOW; ctx.lineWidth = 64;
  ctx.beginPath(); ctx.moveTo(253, 471); ctx.lineTo(356, 316); ctx.lineTo(456, 489); ctx.lineTo(563, 300); ctx.lineTo(688, 475); ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 43; ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 12;
  ctx.beginPath(); ctx.moveTo(252, 571); ctx.lineTo(735, 536); ctx.stroke();
  star(ctx, 170, 221, 47); arrow(ctx, 778, 524);
  drip(ctx, 456, 488, 91, 14, INK);
}

function stampPaint(ctx: CanvasRenderingContext2D) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  spray(ctx, 1807, 498, 365, 310, 240, 1100, INK);
  ctx.strokeStyle = INK; ctx.lineWidth = 17;
  ctx.beginPath(); ctx.ellipse(510, 384, 282, 230, 0.13, 0.17, TAU - 0.5); ctx.stroke();
  ctx.strokeStyle = RED; ctx.lineWidth = 50;
  ctx.beginPath(); ctx.moveTo(304, 270); ctx.lineTo(461, 515);
  ctx.moveTo(480, 248); ctx.lineTo(649, 496); ctx.stroke();
  ctx.strokeStyle = SHADOW; ctx.lineWidth = 14; ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 12;
  ctx.beginPath(); ctx.moveTo(209, 600); ctx.lineTo(789, 562); ctx.stroke();
  star(ctx, 134, 164, 43, RED); star(ctx, 887, 490, 37);
  drip(ctx, 636, 502, 86, 12, RED);
}

// Small marks interrupt the large tags at uneven heights and angles. The arrangement is authored and stable;
// randomising it on every load would make the sculpture feel like a changing UI state instead of a painted object.
function burstPaint(ctx: CanvasRenderingContext2D) {
  spray(ctx, 131, 252, 252, 165, 156, 520, RED);
  star(ctx, 252, 246, 101);
  star(ctx, 125, 358, 35, RED);
  ctx.strokeStyle = INK; ctx.lineWidth = 13;
  ctx.beginPath(); ctx.moveTo(104, 117); ctx.lineTo(408, 398); ctx.stroke();
}

function checkerPaint(ctx: CanvasRenderingContext2D) {
  ctx.translate(256, 252); ctx.rotate(-0.21); ctx.translate(-256, -252);
  spray(ctx, 401, 257, 257, 190, 143, 340, RED);
  ctx.fillStyle = INK;
  for (let row = 0; row < 4; row++) for (let col = 0; col < 5; col++) {
    if ((row + col) % 2 === 0) ctx.fillRect(101 + col * 62, 130 + row * 62, 52, 51);
  }
  ctx.strokeStyle = RED; ctx.lineWidth = 19;
  ctx.beginPath(); ctx.moveTo(120, 400); ctx.lineTo(413, 109); ctx.stroke();
}

function orbitPaint(ctx: CanvasRenderingContext2D) {
  spray(ctx, 502, 250, 252, 175, 165, 360, RED);
  ctx.strokeStyle = INK; ctx.lineWidth = 18; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.ellipse(252, 252, 153, 119, -0.32, 0.25, TAU - 0.35);
  ctx.ellipse(255, 257, 112, 153, 0.36, 0.4, TAU - 0.2); ctx.stroke();
  ctx.strokeStyle = RED; ctx.lineWidth = 19;
  ctx.beginPath(); ctx.moveTo(133, 376); ctx.lineTo(380, 133); ctx.stroke();
  star(ctx, 405, 94, 38);
}

function arrowsPaint(ctx: CanvasRenderingContext2D) {
  spray(ctx, 744, 256, 261, 178, 168, 390, INK);
  arrow(ctx, 242, 200, RED);
  arrow(ctx, 295, 324, INK);
  ctx.strokeStyle = RED; ctx.lineWidth = 15;
  ctx.beginPath(); ctx.moveTo(114, 411); ctx.lineTo(380, 421); ctx.stroke();
  drip(ctx, 376, 422, 62, 13, RED);
}

function tagPaint(ctx: CanvasRenderingContext2D) {
  ctx.translate(256, 256); ctx.rotate(0.13); ctx.translate(-256, -256);
  spray(ctx, 811, 255, 244, 175, 155, 350, RED);
  ctx.font = '900 180px "Arial Black", sans-serif';
  ctx.lineWidth = 23; ctx.strokeStyle = SHADOW; ctx.strokeText('T.P.', 98, 318);
  ctx.fillStyle = INK; ctx.fillText('T.P.', 98, 318);
  ctx.strokeStyle = RED; ctx.lineWidth = 17;
  ctx.beginPath(); ctx.moveTo(103, 367); ctx.lineTo(429, 345); ctx.stroke();
  star(ctx, 394, 141, 30, RED);
}

function cupPaint(ctx: CanvasRenderingContext2D) {
  spray(ctx, 927, 263, 261, 156, 161, 400, RED);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 16;
  ctx.beginPath(); ctx.moveTo(125, 235); ctx.quadraticCurveTo(254, 274, 384, 229);
  ctx.moveTo(143, 241); ctx.bezierCurveTo(136, 385, 352, 399, 377, 239);
  ctx.moveTo(372, 258); ctx.bezierCurveTo(447, 240, 455, 338, 377, 339); ctx.stroke();
  for (const x of [194, 263, 331]) {
    ctx.beginPath(); ctx.moveTo(x, 194); ctx.bezierCurveTo(x - 35, 146, x + 33, 133, x + 2, 83); ctx.stroke();
  }
  ctx.strokeStyle = RED; ctx.lineWidth = 11;
  ctx.beginPath(); ctx.moveTo(118, 419); ctx.lineTo(400, 393); ctx.stroke();
}

function dripsPaint(ctx: CanvasRenderingContext2D) {
  spray(ctx, 1172, 260, 264, 177, 144, 380, INK);
  ctx.lineCap = 'round'; ctx.strokeStyle = RED; ctx.lineWidth = 25;
  ctx.beginPath(); ctx.moveTo(116, 193); ctx.lineTo(408, 156);
  ctx.moveTo(138, 235); ctx.lineTo(363, 210); ctx.stroke();
  drip(ctx, 180, 228, 178, 19, RED); drip(ctx, 299, 207, 230, 24, RED); drip(ctx, 367, 197, 128, 14, RED);
  star(ctx, 404, 391, 36);
}

function slashesPaint(ctx: CanvasRenderingContext2D) {
  spray(ctx, 1416, 257, 258, 180, 151, 450, RED);
  ctx.strokeStyle = SHADOW; ctx.lineWidth = 59; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(129, 367); ctx.lineTo(236, 145);
  ctx.moveTo(239, 397); ctx.lineTo(347, 168);
  ctx.moveTo(344, 396); ctx.lineTo(430, 220); ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 39; ctx.stroke();
  star(ctx, 406, 109, 29, RED);
  drip(ctx, 248, 397, 83, 11, INK);
}

function eyePaint(ctx: CanvasRenderingContext2D) {
  spray(ctx, 1631, 260, 260, 175, 140, 490, RED);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 23;
  ctx.beginPath(); ctx.moveTo(90, 268); ctx.bezierCurveTo(176, 145, 329, 157, 425, 254);
  ctx.bezierCurveTo(331, 368, 180, 360, 90, 268); ctx.stroke();
  ctx.strokeStyle = RED; ctx.lineWidth = 30;
  ctx.beginPath(); ctx.arc(258, 259, 57, 0.2, TAU - 0.2); ctx.stroke();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(258, 259, 20, 0, TAU); ctx.fill();
  for (const x of [146, 257, 367]) {
    ctx.strokeStyle = INK; ctx.lineWidth = 11;
    ctx.beginPath(); ctx.moveTo(x - 12, 142); ctx.lineTo(x + 5, 100); ctx.stroke();
  }
  ctx.strokeStyle = RED; ctx.lineWidth = 12;
  ctx.beginPath(); ctx.moveTo(123, 380); ctx.lineTo(387, 351); ctx.stroke();
}

function numberPaint(ctx: CanvasRenderingContext2D) {
  ctx.translate(256, 256); ctx.rotate(0.18); ctx.translate(-256, -256);
  spray(ctx, 1742, 257, 254, 190, 180, 460, RED);
  ctx.font = '900 224px "Arial Black", sans-serif';
  ctx.lineWidth = 28; ctx.strokeStyle = SHADOW; ctx.strokeText('№5', 62, 329);
  ctx.fillStyle = INK; ctx.fillText('№5', 62, 329);
  ctx.strokeStyle = RED; ctx.lineWidth = 16;
  ctx.beginPath(); ctx.moveTo(100, 367); ctx.lineTo(415, 341); ctx.stroke();
  star(ctx, 407, 114, 27);
}

function wavePaint(ctx: CanvasRenderingContext2D) {
  spray(ctx, 1883, 263, 264, 190, 155, 420, RED);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = RED; ctx.lineWidth = 51;
  ctx.beginPath(); ctx.moveTo(88, 315); ctx.bezierCurveTo(144, 190, 195, 380, 251, 243);
  ctx.bezierCurveTo(305, 105, 363, 340, 425, 192); ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 22; ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 11;
  ctx.beginPath(); ctx.moveTo(109, 402); ctx.lineTo(380, 378); ctx.stroke();
  drip(ctx, 250, 274, 142, 11, RED);
}

function morePaint(ctx: CanvasRenderingContext2D) {
  ctx.translate(256, 256); ctx.rotate(-0.12); ctx.translate(-256, -256);
  spray(ctx, 1949, 263, 259, 195, 150, 470, RED);
  ctx.font = '900 165px "Arial Black", sans-serif';
  ctx.lineWidth = 18; ctx.strokeStyle = SHADOW; ctx.strokeText('ЕЩЁ', 44, 312);
  ctx.fillStyle = INK; ctx.fillText('ЕЩЁ', 44, 312);
  ctx.strokeStyle = RED; ctx.lineWidth = 18;
  ctx.beginPath(); ctx.moveTo(66, 352); ctx.lineTo(437, 328); ctx.stroke();
  star(ctx, 406, 127, 31, RED);
}

function boltPaint(ctx: CanvasRenderingContext2D) {
  spray(ctx, 2072, 263, 245, 158, 188, 470, RED);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = SHADOW; ctx.lineWidth = 63;
  ctx.beginPath(); ctx.moveTo(329, 70); ctx.lineTo(173, 254); ctx.lineTo(289, 246); ctx.lineTo(165, 438); ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 37; ctx.stroke();
  ctx.strokeStyle = RED; ctx.lineWidth = 13;
  ctx.beginPath(); ctx.moveTo(366, 148); ctx.lineTo(404, 133); ctx.moveTo(326, 400); ctx.lineTo(378, 412); ctx.stroke();
}

function crossedPaint(ctx: CanvasRenderingContext2D) {
  spray(ctx, 2213, 256, 256, 169, 169, 440, RED);
  ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 30;
  ctx.beginPath(); ctx.moveTo(143, 138); ctx.lineTo(362, 374);
  ctx.moveTo(368, 121); ctx.lineTo(157, 405); ctx.stroke();
  ctx.strokeStyle = RED; ctx.lineWidth = 17;
  ctx.beginPath(); ctx.moveTo(102, 332); ctx.lineTo(425, 187); ctx.stroke();
  star(ctx, 404, 406, 30);
  drip(ctx, 170, 391, 70, 12, INK);
}

function texture(paint: (ctx: CanvasRenderingContext2D) => void, width = 1024, height = 768) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  paint(ctx);
  // Chip small holes out of the ink and scatter dry overspray around it, like paint on glazed clay.
  const random = randomFrom(40819);
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < Math.round(780 * (width * height) / (1024 * 768)); i++) {
    const x = random() * canvas.width, y = random() * canvas.height, radius = 0.5 + random() * 3.1;
    ctx.globalAlpha = 0.25 + random() * 0.55;
    ctx.beginPath(); ctx.arc(x, y, radius, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  // Keep paint away from a patch's silhouette edge, where a grazing camera would show a hard cut.
  ctx.globalCompositeOperation = 'destination-in';
  const horizontal = ctx.createLinearGradient(0, 0, canvas.width, 0);
  horizontal.addColorStop(0, 'transparent'); horizontal.addColorStop(0.12, 'white');
  horizontal.addColorStop(0.88, 'white'); horizontal.addColorStop(1, 'transparent');
  ctx.fillStyle = horizontal; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const vertical = ctx.createLinearGradient(0, 0, 0, canvas.height);
  vertical.addColorStop(0, 'transparent'); vertical.addColorStop(0.09, 'white');
  vertical.addColorStop(0.91, 'white'); vertical.addColorStop(1, 'transparent');
  ctx.fillStyle = vertical; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = 'source-over';
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  return map;
}

const profile = new THREE.SplineCurve(BODY_PROFILE.map(([r, y]) => new THREE.Vector2(r, y)))
  .getSpacedPoints(2200).filter((p) => p.y >= 0.2 && p.y <= 1.39).sort((a, b) => a.y - b.y);

function radiusAt(y: number) {
  let lo = 0, hi = profile.length - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >>> 1; if (profile[mid].y < y) lo = mid; else hi = mid; }
  const a = profile[lo], b = profile[hi];
  return THREE.MathUtils.lerp(a.x, b.x, (y - a.y) / (b.y - a.y));
}

function curvedPrint(name: string, map: THREE.Texture, middle: number, width: number, bottom: number, top: number, offset = 0.014, order = 1) {
  const columns = 56, rows = 32, positions: number[] = [], uvs: number[] = [], indices: number[] = [];
  for (let row = 0; row <= rows; row++) {
    const v = row / rows, y = bottom + v * (top - bottom), radius = radiusAt(y) + offset;
    for (let column = 0; column <= columns; column++) {
      const u = column / columns, angle = middle + (u - 0.5) * width;
      positions.push(Math.sin(angle) * radius, y, Math.cos(angle) * radius);
      uvs.push(u, v);
    }
  }
  for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
    const a = row * (columns + 1) + column, b = a + 1, c = a + columns + 1, d = c + 1;
    indices.push(a, b, c, b, d, c);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({ map, transparent: true, depthWrite: false, roughness: 0.88,
    metalness: 0, side: THREE.FrontSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const print = new THREE.Mesh(geometry, material);
  print.name = name;
  print.renderOrder = order;
  print.frustumCulled = false;
  return print;
}

export function addTeapotArt(teapot: THREE.Object3D) {
  const front = texture(frontPaint), back = texture(backPaint), side = texture(sidePaint), stamp = texture(stampPaint);
  const fragments = [
    { name: 'Burst', paint: burstPaint, angle: -0.59, width: 0.38, bottom: 1.11, top: 1.36 },
    { name: 'Checker', paint: checkerPaint, angle: 0.51, width: 0.39, bottom: 0.28, top: 0.55 },
    { name: 'Orbit', paint: orbitPaint, angle: 3.39, width: 0.46, bottom: 1.09, top: 1.35 },
    { name: 'Arrows', paint: arrowsPaint, angle: 3.79, width: 0.44, bottom: 0.27, top: 0.53 },
    { name: 'Tag', paint: tagPaint, angle: 2.32, width: 0.47, bottom: 0.43, top: 0.73 },
    { name: 'Cup', paint: cupPaint, angle: 4.66, width: 0.44, bottom: 0.87, top: 1.20 },
    { name: 'Drips', paint: dripsPaint, angle: 5.39, width: 0.42, bottom: 0.34, top: 0.65 },
    { name: 'Slashes', paint: slashesPaint, angle: 1.94, width: 0.46, bottom: 0.93, top: 1.26 },
    { name: 'Eye', paint: eyePaint, angle: -0.31, width: 0.38, bottom: 1.04, top: 1.33 },
    { name: 'Number', paint: numberPaint, angle: 0.40, width: 0.36, bottom: 1.06, top: 1.31 },
    { name: 'Wave', paint: wavePaint, angle: -0.45, width: 0.46, bottom: 0.34, top: 0.62 },
    { name: 'More', paint: morePaint, angle: 0.57, width: 0.42, bottom: 0.40, top: 0.64 },
    { name: 'Bolt', paint: boltPaint, angle: 2.91, width: 0.43, bottom: 1.06, top: 1.35 },
    { name: 'Crossed', paint: crossedPaint, angle: 3.50, width: 0.39, bottom: 0.34, top: 0.59 },
    { name: 'Scrawl', paint: wavePaint, angle: 4.12, width: 0.42, bottom: 0.52, top: 0.82 },
    { name: 'Watch', paint: eyePaint, angle: 5.80, width: 0.40, bottom: 0.83, top: 1.10 },
  ].map((mark) => ({ ...mark, map: texture(mark.paint, 512, 512) }));
  teapot.add(
    curvedPrint('TeaPaintFront', front, 0.05, 1.72, 0.54, 1.28),
    curvedPrint('TeaPaintBack', back, Math.PI + 0.1, 1.45, 0.53, 1.24),
    curvedPrint('TeaPaintSide', side, 1.18, 0.55, 0.68, 1.36),
    curvedPrint('TeaPaintStamp', stamp, -1.18, 0.55, 0.68, 1.36),
    ...fragments.map((mark) => curvedPrint(`TeaPaint${mark.name}`, mark.map, mark.angle, mark.width, mark.bottom, mark.top, 0.022, 2)),
  );
  return () => { front.dispose(); back.dispose(); side.dispose(); stamp.dispose(); for (const mark of fragments) mark.map.dispose(); };
}
