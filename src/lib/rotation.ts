// Pure rotation maths for the teapot turntable.
const RADIANS_PER_PIXEL = (Math.PI * 2) / 1400; // about two long scrolls turn it all the way round
const STEP = Math.PI / 12;
const SETTLE_MS = 70; // time constant of the easing that smooths coarse mouse-wheel notches

export function wheelTurn(deltaY: number, deltaMode: number, pageHeight: number): number {
  const pixels = deltaMode === 1 ? deltaY * 16 : deltaMode === 2 ? deltaY * pageHeight : deltaY;
  return pixels * RADIANS_PER_PIXEL;
}
// Direct manipulation: dragging across the full width turns it half way round.
export function dragTurn(dx: number, width: number): number {
  return width > 0 ? (dx / width) * Math.PI : 0;
}
export function keyTurn(key: string): number | 'reset' | null {
  return key === 'ArrowRight' ? STEP : key === 'ArrowLeft' ? -STEP : key === 'Home' ? 'reset' : null;
}
// Eases toward the target and lands on it exactly, so nothing drifts once input stops.
export function approach(current: number, target: number, elapsedMs: number): number {
  const next = target + (current - target) * Math.exp(-Math.max(0, elapsedMs) / SETTLE_MS);
  return Math.abs(target - next) < 5e-4 ? target : next;
}

// Velocity handoff: a drag that ends moving keeps turning and slows to a stop, like a real turntable.
const THROW_WINDOW_MS = 100; // only the end of the drag says how fast it was let go
const MAX_THROW = 0.02; // rad/ms, so a wild flick spins it about a turn, not ten
export function releaseVelocity(samples: { t: number; x: number }[], width: number): number {
  const last = samples.at(-1); if (!last) return 0;
  const recent = samples.filter((s) => s.t >= last.t - THROW_WINDOW_MS), first = recent[0];
  if (last.t - first.t <= 0) return 0;
  const v = dragTurn((last.x - first.x) / (last.t - first.t), width);
  return Math.max(-MAX_THROW, Math.min(MAX_THROW, v));
}
const FRICTION_MS = 325; // time constant of the slow-down
export function coast(velocity: number, elapsedMs: number): { turn: number; velocity: number } {
  const decay = Math.exp(-Math.max(0, elapsedMs) / FRICTION_MS), next = velocity * decay;
  return { turn: velocity * FRICTION_MS * (1 - decay), velocity: Math.abs(next) < 2e-4 ? 0 : next };
}
