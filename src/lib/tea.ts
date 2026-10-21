// What the server tells every browser: today's shared line, the shared tea timer and the server's clock.
// Plain types only, shared by the API routes and the page. Guest keys never appear in any of them.
export type LineEntry = { position: number; name: string; joinedAt: string; mine: boolean };
export type Snapshot = { date: string; total: number; me: number | null; entries: LineEntry[] };
export type Archive = { date: string; entries: { position: number; name: string; joinedAt: string }[] };
export type TimerStatus = 'idle' | 'running' | 'ready';
// version changes on every start and stop: a Stop names the version it saw, so it can only end that timer.
export type SharedTimer = { version: number; status: TimerStatus; label: string | null; durationMs: number | null; startedAt: string | null; deadline: string | null };
export type TeaState = { line: Snapshot; timer: SharedTimer; serverNow: string; timeZone: string };
