// Camera framing as plain maths. Points are in the camera's basis: x right, y up, z toward the camera.
// A window is the part of the screen the set may use, as slopes of the view (tan of the angle off-centre).
export type Window = { left: number; right: number; bottom: number; top: number };
export type Frame = { distance: number; x: number; y: number }; // where the camera sits, in the same basis
export type Vec3 = readonly [number, number, number];
export type CameraBasis = { right: Vec3; up: Vec3; view: Vec3 };

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

// Fit an object that may turn through any yaw beside a fixed object. Each turning vertex traces a circle in
// the x/z plane; the extrema of each screen-space constraint can be found exactly from that circle. The camera
// therefore stays put while the visitor turns the teapot, instead of zooming and sliding at every angle.
export function fitTurntable(turning: ArrayLike<number>, fixed: ArrayLike<number>, basis: CameraBasis, window: Window): Frame {
  const constraint = (axis: Vec3, slope: number, high: boolean) => {
    const dx = axis[0] + slope * basis.view[0], dy = axis[1] + slope * basis.view[1], dz = axis[2] + slope * basis.view[2];
    const horizontal = Math.hypot(dx, dz);
    let extreme = high ? -Infinity : Infinity;
    for (let i = 0; i < turning.length; i += 3) {
      const value = turning[i + 1] * dy + (high ? 1 : -1) * Math.hypot(turning[i], turning[i + 2]) * horizontal;
      extreme = high ? Math.max(extreme, value) : Math.min(extreme, value);
    }
    for (let i = 0; i < fixed.length; i += 3) {
      const value = fixed[i] * dx + fixed[i + 1] * dy + fixed[i + 2] * dz;
      extreme = high ? Math.max(extreme, value) : Math.min(extreme, value);
    }
    return extreme;
  };
  const hHigh = constraint(basis.right, window.right, true), hLow = constraint(basis.right, window.left, false);
  const vHigh = constraint(basis.up, window.top, true), vLow = constraint(basis.up, window.bottom, false);
  const distance = Math.max((hHigh - hLow) / (window.right - window.left), (vHigh - vLow) / (window.top - window.bottom));
  return { distance, x: (hHigh - window.right * distance + hLow - window.left * distance) / 2,
    y: (vHigh - window.top * distance + vLow - window.bottom * distance) / 2 };
}
