// The local-demo line, as pure state transitions. Connected mode does the same in Postgres (supabase/schema.sql).
export type Entry = { guest: string; name: string; joinedAt: string };
export type ArchivedEntry = { position: number; name: string; joinedAt: string };
export type LineState = { date: string; entries: Entry[]; archive: Record<string, ArchivedEntry[]> };
const ARCHIVE_DAYS = 14;

export const emptyLine = (date: string): LineState => ({ date, entries: [], archive: {} });
const ordered = (entries: Entry[]) => [...entries].sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));

// One place per guest per day; a repeated join keeps the original place and name.
export function joinLine(state: LineState, guest: string, name: string, joinedAt: string): LineState {
  if (state.entries.some((e) => e.guest === guest)) return state;
  return { ...state, entries: ordered([...state.entries, { guest, name, joinedAt }]) };
}
export function leaveLine(state: LineState, guest: string): LineState {
  return state.entries.some((e) => e.guest === guest) ? { ...state, entries: state.entries.filter((e) => e.guest !== guest) } : state;
}
export function positionIn(state: LineState, guest: string): number {
  return state.entries.findIndex((e) => e.guest === guest) + 1;
}
// When the business day changes: archive the day's first five, clear the line. Idempotent.
export function rollover(state: LineState, today: string): LineState {
  if (state.date >= today) return state;
  const firstFive = state.entries.slice(0, 5).map((e, i) => ({ position: i + 1, name: e.name, joinedAt: e.joinedAt }));
  const archive = { ...state.archive, [state.date]: state.archive[state.date] ?? firstFive };
  const kept = Object.keys(archive).sort().slice(-ARCHIVE_DAYS);
  return { date: today, entries: [], archive: Object.fromEntries(kept.map((d) => [d, archive[d]])) };
}
export function archivedDay(state: LineState, date: string): ArchivedEntry[] {
  return state.archive[date] ?? [];
}
export function rowsThatFit(height: number, rowHeight: number): number { return rowHeight > 0 ? Math.max(1, Math.floor(height / rowHeight)) : 1; }
// Index of the first row shown. null follows the visitor: the window ends at their row.
export function windowStart(from: number | null, position: number, total: number, size: number): number {
  return Math.max(0, Math.min(from ?? position - size, total - size));
}
