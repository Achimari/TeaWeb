// The shared tea timer: one deadline on the server for everyone, shown on each device against its measured clock offset.
import type { SharedTimer, TimerStatus } from './tea.ts';

export const PRESETS = [
  { label: 'Green', minutes: 2 },
  { label: 'Oolong', minutes: 3 },
  { label: 'Black', minutes: 4 },
  { label: 'Herbal', minutes: 5 },
];

export function durationMs(minutes: number, seconds: number): number | null {
  if (!Number.isInteger(minutes) || !Number.isInteger(seconds) || minutes < 0 || seconds < 0 || seconds > 59) return null;
  const total = (minutes * 60 + seconds) * 1000;
  return total > 0 && total <= 3_600_000 ? total : null;
}
// The shared timer as one device should show it now. Each device measures how far its clock is from the
// server's (offsetMs) and counts down to the server's deadline, so every screen shows the same time.
export function countdown(timer: SharedTimer, clientNow: number, offsetMs: number): { status: TimerStatus; remainingMs: number } {
  if (timer.status === 'idle' || !timer.deadline) return { status: 'idle', remainingMs: 0 };
  const remainingMs = Date.parse(timer.deadline) - (clientNow + offsetMs);
  return remainingMs > 0 && timer.status === 'running' ? { status: 'running', remainingMs } : { status: 'ready', remainingMs: 0 };
}
// Server clock minus local clock, taking the server's stamp to be from the middle of the round trip.
export const clockOffset = (serverNow: number, sentAt: number, receivedAt: number) => serverNow - (sentAt + receivedAt) / 2;
// Rounds up: the clock never shows 0:00 while tea is still steeping.
export function formatClock(ms: number): string {
  const seconds = Math.ceil(Math.max(0, ms) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
