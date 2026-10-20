// The teapot's lid: its shape and its path, as plain numbers shared by the model script, the scene and the tests.
// Lengths are model units, measured from the centre of the body's rim (y = 0 is the top of the rim).

export const OPENING_R = 0.5; // inner radius of the body's opening
export const RIM_OUTER_R = 0.6;
// The lid's outline as [radius, height], revolved: a skirt that drops inside the opening, a flange that
// rests on the rim with a hairline gap, and a low dome.
export const LID_PROFILE: [number, number][] = [
  [0, -0.05], [0.3, -0.07], [0.44, -0.08], [0.46, -0.06], [0.465, 0.012],
  [0.6, 0.014], [0.632, 0.028], [0.62, 0.05], [0.52, 0.115], [0.36, 0.19], [0.18, 0.232], [0, 0.242],
];
export const KNOB_PROFILE: [number, number][] = [[0, 0.232], [0.075, 0.244], [0.12, 0.29], [0.13, 0.35], [0.1, 0.41], [0.05, 0.44], [0, 0.447]];
// Everything of the handle lies outside this radius and below this height.
export const HANDLE_REACH = { radius: 0.9, top: -0.06 };

const HINGE = { radius: 0.632, y: 0.02 }; // the far edge of the flange, where a hand would tip it
const LIFT = 0.16; // more than the skirt is deep, so the lid is clear of the rim before it tilts
const TILT = (58 * Math.PI) / 180; // open far enough to show the tea, not so far that it reads as a loose saucer
const smooth = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };

const REST = 0.02; // open, the lid leans on its edge just above the rim
// One path, t from 0 (seated) to 1 (open): lift straight up, then tip back over the far edge and settle onto it,
// as a hand would prop a lid open. Closing runs the same path backwards.
export function lidPose(t: number): { lift: number; tilt: number } {
  return { lift: LIFT * smooth(t / 0.4) - (LIFT - REST) * smooth((t - 0.55) / 0.45), tilt: TILT * smooth((t - 0.3) / 0.7) };
}

// Where a point of the lid at [radius, height] and azimuth `around` (0 = towards the hinge) ends up at pose t,
// returned as [distance from the axis, height]. The hinge side is the same for every azimuth, so the lid is checked whole.
export function placeLidPoint(radius: number, y: number, around: number, t: number): [number, number] {
  const { lift, tilt } = lidPose(t);
  const du = radius * Math.cos(around) - HINGE.radius, dy = y - HINGE.y, across = radius * Math.sin(around);
  const u = HINGE.radius + du * Math.cos(tilt) + dy * Math.sin(tilt);
  return [Math.hypot(u, across), HINGE.y + lift - du * Math.sin(tilt) + dy * Math.cos(tilt)];
}
export function lidPoints(t: number): [number, number][] {
  const points: [number, number][] = [];
  for (let k = 0; k < 36; k++) for (const [r, y] of [...LID_PROFILE, ...KNOB_PROFILE]) points.push(placeLidPoint(r, y, (k / 36) * Math.PI * 2, t));
  return points;
}
export const LID_HINGE = HINGE;

// A critically damped spring on t: it can be retargeted at any moment, keeps its speed, and lands exactly.
const RATE = 9; // 1/s; settles in about two thirds of a second
export type LidState = { t: number; v: number };
export function stepLid({ t, v }: LidState, target: number, seconds: number): LidState {
  const x = t - target, decay = Math.exp(-RATE * seconds), k = v + RATE * x;
  let next = target + (x + k * seconds) * decay, speed = (v - RATE * k * seconds) * decay;
  if (next < 0 || next > 1) { next = Math.min(1, Math.max(0, next)); speed = 0; }
  return Math.abs(next - target) < 1e-3 && Math.abs(speed) < 1e-2 ? { t: target, v: 0 } : { t: next, v: speed };
}
export const settle = (state: LidState, target: number) => state.t === target && state.v === 0;
