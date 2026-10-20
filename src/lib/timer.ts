// The tea timer is a saved deadline, so it stays right across reloads and sleeping tabs.
export const TIMER_KEY = 'tea-timer';
export const PRESETS = [
  { label: 'Green', minutes: 2 },
  { label: 'Oolong', minutes: 3 },
  { label: 'Black', minutes: 4 },
  { label: 'Herbal', minutes: 5 },
];
export type TimerState = { status: 'idle' | 'running' | 'ready'; remainingMs: number };

export function durationMs(minutes: number, seconds: number): number | null {
  if (!Number.isInteger(minutes) || !Number.isInteger(seconds) || minutes < 0 || seconds < 0 || seconds > 59) return null;
  const total = (minutes * 60 + seconds) * 1000;
  return total > 0 && total <= 3_600_000 ? total : null;
}
export function timerState(deadline: number | null, now: number): TimerState {
  if (deadline === null) return { status: 'idle', remainingMs: 0 };
  return deadline > now ? { status: 'running', remainingMs: deadline - now } : { status: 'ready', remainingMs: 0 };
}
export function readDeadline(raw: string | null): number | null {
  try {
    const deadline = raw ? JSON.parse(raw)?.deadline : null;
    return typeof deadline === 'number' && Number.isFinite(deadline) && deadline > 0 ? deadline : null;
  } catch { return null; }
}
// Rounds up: the clock never shows 0:00 while tea is still steeping.
export function formatClock(ms: number): string {
  const seconds = Math.ceil(Math.max(0, ms) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
