'use client';
// The page's view of the shared line and the shared timer. It loads /api/state, then listens on /api/events:
// when anyone joins, leaves, starts or stops, the server says "changed" and the page fetches once. No
// per-second polling: the visible clock ticks locally against the server deadline and the measured clock offset.
// If the server or database can't be reached, `error` is set and joining is disabled; there is no offline line.
import { useCallback, useEffect, useRef, useState } from 'react';
import { clockOffset, countdown } from '@/lib/timer';
import type { TeaState } from '@/lib/tea';

const NOTIFY_KEY = 'tea-notify';
const SAFETY_NET_MS = 60_000; // a slow re-check in case a change notice was missed (sleep, network switch)
const UNAVAILABLE = 'The line and the timer can’t be reached right now. Try again in a little while.';

async function call(path: string, init?: RequestInit) {
  const sent = Date.now();
  const response = await fetch(path, { cache: 'no-store', ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.error || UNAVAILABLE), { status: response.status });
  return { data, sent, received: Date.now() };
}

export function useTeaState() {
  const [state, setState] = useState<TeaState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [offset, setOffset] = useState(0); // server clock minus this device's clock
  const inFlight = useRef(false), again = useRef(false);
  // Writes and refreshes must not overtake each other. A write's own change notice can reach the page before the
  // write's response does (and with it, on a first join, the new guest cookie), so a refresh sent meanwhile would
  // come back without "you" and overwrite the write's answer. So refreshes wait while a write is in flight, and a
  // refresh that overlapped a write is thrown away and asked again.
  const writing = useRef(0), epoch = useRef(0);

  const apply = useCallback(({ data, sent, received }: { data: TeaState; sent: number; received: number }) => {
    setOffset(clockOffset(Date.parse(data.serverNow), sent, received));
    setState(data); setNow(Date.now()); setError(null);
  }, []);

  // One fetch at a time; a change that arrives mid-fetch triggers exactly one more.
  const refresh = useCallback(async () => {
    if (inFlight.current || writing.current) { again.current = true; return; }
    inFlight.current = true;
    try {
      do {
        again.current = false;
        const asked = epoch.current;
        try {
          const result = await call('/api/state');
          if (asked === epoch.current && !writing.current) apply(result);
          else again.current = true; // a write happened meanwhile: this answer may predate it
        } catch (e) { setError((e as { status?: number }).status === 429 ? (e as Error).message : UNAVAILABLE); }
      } while (again.current && !writing.current);
    } finally { inFlight.current = false; }
  }, [apply]);
  useEffect(() => {
    // The old browser-only preview kept a private line and timer here; they mean nothing now, so they go.
    try { for (const key of ['tea-demo-line', 'tea-demo-guest', 'tea-timer']) localStorage.removeItem(key); } catch { /* storage blocked */ }
    refresh();
    // EventSource retries a dropped stream by itself, but gives up for good after an error response (the
    // server answers 503 while the database is away), so a closed stream is reopened here with backoff.
    let events: EventSource | null = null, retry = 0, delay = 3_000, stopped = false;
    const open = () => {
      events = new EventSource('/api/events');
      events.addEventListener('change', () => refresh());
      events.addEventListener('open', () => { delay = 3_000; refresh(); }); // catch up after a reconnect
      events.addEventListener('error', () => {
        if (events?.readyState !== EventSource.CLOSED || stopped) return;
        retry = window.setTimeout(open, delay); delay = Math.min(delay * 2, 60_000);
      });
    };
    open();
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    const net = window.setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, SAFETY_NET_MS);
    return () => { stopped = true; events?.close(); window.clearTimeout(retry); document.removeEventListener('visibilitychange', onVisible); window.clearInterval(net); };
  }, [refresh]);

  // The visible clock: tick each second while the timer runs, and wake exactly at the deadline.
  const timer = state ? countdown(state.timer, now, offset) : { status: 'idle' as const, remainingMs: 0 };
  const deadline = state?.timer.deadline ?? null, version = state?.timer.version ?? 0, running = timer.status === 'running';
  useEffect(() => {
    if (!running || !deadline) return;
    const tick = () => setNow(Date.now());
    const interval = window.setInterval(tick, 1000), wake = window.setTimeout(tick, Date.parse(deadline) - (Date.now() + offset) + 20);
    return () => { window.clearInterval(interval); window.clearTimeout(wake); };
  }, [running, deadline, offset]);

  // Optional, and only on this device: a browser notification when the shared pot this device watched is ready.
  // The permission is asked for only when the visitor presses the button; the choice is remembered here only.
  const [notify, setNotify] = useState(() => { try { return typeof window !== 'undefined' && localStorage.getItem(NOTIFY_KEY) === '1'; } catch { return false; } });
  const watched = useRef<{ version: number; status: string } | null>(null);
  useEffect(() => {
    const before = watched.current; watched.current = { version, status: timer.status };
    if (!notify || timer.status !== 'ready' || before?.version !== version || before.status !== 'running') return;
    if ('Notification' in window && Notification.permission === 'granted' && document.visibilityState === 'hidden') new Notification('The pot’s ready', { body: `${state?.timer.label ?? 'The tea'} has steeped.` });
  }, [notify, timer.status, version, state?.timer.label]);
  const setNotifyHere = useCallback((on: boolean) => { setNotify(on); try { localStorage.setItem(NOTIFY_KEY, on ? '1' : '0'); } catch { /* not remembered */ } }, []);

  // Writes answer with the whole new state. Failures are thrown to the panel that asked, to show in place.
  const write = useCallback(async (path: string, method: 'POST' | 'DELETE', body?: unknown) => {
    writing.current++; epoch.current++;
    try {
      const result = await call(path, { method, body: body === undefined ? undefined : JSON.stringify(body) });
      apply(result);
      return result.data as TeaState & { started?: boolean; stopped?: boolean };
    } finally {
      writing.current--; epoch.current++;
      if (!writing.current && again.current) refresh(); // catch up on changes that arrived during the write
    }
  }, [apply, refresh]);

  return {
    state, error, refresh, notify, setNotify: setNotifyHere,
    timer: { ...timer, version, label: state?.timer.label ?? null, durationMs: state?.timer.durationMs ?? null, deadline: state?.timer.deadline ?? null },
    join: (name: string) => write('/api/queue', 'POST', { name }),
    leave: () => write('/api/queue', 'DELETE'),
    startTimer: (tea: string, durationMs?: number) => write('/api/timer', 'POST', durationMs === undefined ? { tea } : { tea, durationMs }),
    stopTimer: (version: number) => write('/api/timer', 'DELETE', { version }),
  };
}
export type Tea = ReturnType<typeof useTeaState>;
