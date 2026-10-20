// Camera framing as plain maths. Points are in the camera's basis: x right, y up, z toward the camera.
// A window is the part of the screen the set may use, as slopes of the view (tan of the angle off-centre).
export type Window = { left: number; right: number; bottom: number; top: number };
export type Frame = { distance: number; x: number; y: number }; // where the camera sits, in the same basis

// The closest camera that keeps every point inside the window. For one axis, a point p projects to
// (p - c) / (D - z); requiring a ≤ that ≤ b for all points gives D directly, and c as the middle of what's allowed.
function axis(points: ArrayLike<number>, i: number, a: number, b: number) {
  let high = -Infinity, low = Infinity;
  for (let k = 0; k < points.length; k += 3) { const p = points[k + i], z = points[k + 2]; high = Math.max(high, p + b * z); low = Math.min(low, p + a * z); }
  return { need: (high - low) / (b - a), centre: (d: number) => (high - b * d + low - a * d) / 2 };
}
// `points` is a flat list of x, y, z triples.
export function fit(points: ArrayLike<number>, window: Window): Frame {
  const h = axis(points, 0, window.left, window.right), v = axis(points, 1, window.bottom, window.top);
  const distance = Math.max(h.need, v.need);
  return { distance, x: h.centre(distance), y: v.centre(distance) };
}
