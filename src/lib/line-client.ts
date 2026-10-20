// The line as seen by the page, in either mode. Connected mode calls the API routes; the local demo keeps
// the line in this browser only, and archives a finished day on the first visit after the date changes.
import { businessDate, previousDate } from './day';
import { archivedDay, emptyLine, joinLine, leaveLine, rollover, type LineState } from './line';

export const isSharedLine = process.env.NEXT_PUBLIC_TEA_MODE === 'supabase';
export type Snapshot = { date: string; total: number; me: number | null; entries: { position: number; name: string; joinedAt: string; mine: boolean }[] };
export type Archive = { date: string; entries: { position: number; name: string; joinedAt: string }[] };

const LINE_KEY = 'tea-demo-line', GUEST_KEY = 'tea-demo-guest';

function localGuest(): string {
  let id = localStorage.getItem(GUEST_KEY);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(GUEST_KEY, id); }
  return id;
}
function localState(): LineState {
  const today = businessDate(new Date());
  let stored: LineState | null = null;
  try { const parsed = JSON.parse(localStorage.getItem(LINE_KEY) || 'null'); if (parsed && typeof parsed.date === 'string' && Array.isArray(parsed.entries) && parsed.archive && typeof parsed.archive === 'object') stored = parsed; } catch { /* corrupt storage reads as a new line */ }
  const state = rollover(stored ?? emptyLine(today), today);
  if (state !== stored) localStorage.setItem(LINE_KEY, JSON.stringify(state));
  return state;
}
function localSnapshot(state: LineState): Snapshot {
  const guest = localGuest();
  const entries = state.entries.map((e, i) => ({ position: i + 1, name: e.name, joinedAt: e.joinedAt, mine: e.guest === guest }));
  return { date: state.date, total: entries.length, me: entries.find((e) => e.mine)?.position ?? null, entries };
}
function save(state: LineState) { localStorage.setItem(LINE_KEY, JSON.stringify(state)); return localSnapshot(state); }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { cache: 'no-store', ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Something went wrong. Try again.');
  return data as T;
}

export const loadLine = (): Promise<Snapshot> => isSharedLine ? request('/api/queue') : Promise.resolve(localSnapshot(localState()));
export const join = (name: string): Promise<Snapshot> => isSharedLine
  ? request('/api/queue', { method: 'POST', body: JSON.stringify({ name }) })
  : Promise.resolve(save(joinLine(localState(), localGuest(), name, new Date().toISOString())));
export const leave = (): Promise<Snapshot> => isSharedLine
  ? request('/api/queue', { method: 'DELETE' })
  : Promise.resolve(save(leaveLine(localState(), localGuest())));
export function loadArchive(): Promise<Archive> {
  if (isSharedLine) return request('/api/archive');
  const state = localState(), date = previousDate(state.date);
  return Promise.resolve({ date, entries: archivedDay(state, date) });
}
