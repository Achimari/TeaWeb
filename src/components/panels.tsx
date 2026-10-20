'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, LoaderCircle } from 'lucide-react';
import { PRESETS, TIMER_KEY, durationMs, formatClock, readDeadline, timerState, type TimerState } from '@/lib/timer';
import { displayNameSchema } from '@/lib/validation';
import { isSharedLine, join, leave, loadArchive, loadLine, type Archive, type Snapshot } from '@/lib/line-client';
import { rowsThatFit, windowStart } from '@/lib/line';
import { BUSINESS_TIMEZONE } from '@/lib/day';

const ordinals = new Intl.PluralRules('en', { type: 'ordinal' });
const suffix: Record<string, string> = { one: 'st', two: 'nd', few: 'rd', other: 'th' };
export const ordinal = (n: number) => `${n}${suffix[ordinals.select(n)]}`;
const clockTime = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', timeZone: BUSINESS_TIMEZONE });
const longDate = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

// ---- Tea timer -------------------------------------------------------------------------------------
type Saved = { deadline: number; durationMs: number; label: string; notify?: boolean };
function readSaved(): Saved | null {
  try { const raw = localStorage.getItem(TIMER_KEY), deadline = readDeadline(raw); return deadline ? { ...JSON.parse(raw!), deadline } : null; } catch { return null; }
}
// The timer lives at the page level so the spout can show it while the panel is closed.
export function useTeaTimer() {
  const [saved, setSaved] = useState<Saved | null>(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const restore = () => { setSaved(readSaved()); setNow(Date.now()); }; restore(); window.addEventListener('storage', restore); return () => window.removeEventListener('storage', restore); }, []);
  const state: TimerState = timerState(saved?.deadline ?? null, now);
  // Tick once a second only while steeping, and wake exactly at the deadline (browsers may delay timers in hidden tabs; the saved deadline keeps the answer right).
  useEffect(() => {
    if (!saved || state.status !== 'running') return;
    const tick = () => setNow(Date.now());
    const interval = window.setInterval(tick, 1000), wake = window.setTimeout(tick, saved.deadline - Date.now() + 20);
    document.addEventListener('visibilitychange', tick);
    return () => { window.clearInterval(interval); window.clearTimeout(wake); document.removeEventListener('visibilitychange', tick); };
  }, [saved, state.status]);
  const notified = useRef<number | null>(null);
  useEffect(() => {
    if (state.status !== 'ready' || !saved?.notify || notified.current === saved.deadline) return;
    notified.current = saved.deadline;
    if ('Notification' in window && Notification.permission === 'granted' && document.visibilityState === 'hidden') new Notification('Your tea is ready', { body: `${saved.label} has steeped. Enjoy it while it’s warm.` });
  }, [state.status, saved]);
  const persist = (next: Saved | null) => { if (next) localStorage.setItem(TIMER_KEY, JSON.stringify(next)); else localStorage.removeItem(TIMER_KEY); setSaved(next); setNow(Date.now()); };
  return {
    state, saved,
    start: (ms: number, label: string) => persist({ deadline: Date.now() + ms, durationMs: ms, label, notify: saved?.notify }),
    clear: () => persist(null),
    setNotify: (notify: boolean) => saved && persist({ ...saved, notify }),
  };
}
export type TeaTimer = ReturnType<typeof useTeaTimer>;

export function TimerPanel({ timer }: { timer: TeaTimer }) {
  const [minutes, setMinutes] = useState('3'), [seconds, setSeconds] = useState('0');
  const [error, setError] = useState('');
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() => ('Notification' in globalThis ? Notification.permission : 'unsupported'));
  const { state, saved } = timer;
  function startCustom(event: React.FormEvent) {
    event.preventDefault();
    const ms = durationMs(Number(minutes), Number(seconds));
    if (ms === null) { setError('Choose between 1 second and 60 minutes.'); return; }
    setError(''); timer.start(ms, 'Your tea');
  }
  // Permission is requested only here, when the visitor asks for a notification.
  async function askToNotify() {
    if (!('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') timer.setNotify(true);
  }
  if (state.status === 'ready') return <div className="panel-body">
    <h2 className="panel-title">Your tea is ready.</h2>
    <p className="panel-lede" role="status">{saved?.label ?? 'Your tea'} has steeped for {formatClock(saved?.durationMs ?? 0)}. Enjoy it while it’s warm.</p>
    <div className="actions">
      <button type="button" className="button primary" data-autofocus onClick={timer.clear}>Done</button>
      {saved && <button type="button" className="button quiet" onClick={() => timer.start(saved.durationMs, saved.label)}>Steep again</button>}
    </div>
  </div>;
  if (state.status === 'running') return <div className="panel-body">
    <h2 className="panel-title">{saved?.label ?? 'Your tea'}</h2>
    <p className="clock" aria-live="off">{formatClock(state.remainingMs)}</p>
    <p className="panel-lede">Good tea takes a little time. Ready at {saved && new Date(saved.deadline).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}, even if you reload or switch tabs.</p>
    <div className="actions">
      <button type="button" className="button quiet" data-autofocus onClick={timer.clear}>Stop timer</button>
      {permission === 'default' && <button type="button" className="button quiet" onClick={askToNotify}>Notify me when it’s ready</button>}
    </div>
    {permission === 'granted' && saved?.notify && <p className="note">You’ll get a notification if this tab is in the background. It can’t reach you once the page is closed.</p>}
    {permission === 'granted' && !saved?.notify && <button type="button" className="link" onClick={() => timer.setNotify(true)}>Notify me when it’s ready</button>}
    {permission === 'denied' && <p className="note">Notifications are blocked for this site in your browser settings.</p>}
  </div>;
  return <div className="panel-body">
    <h2 className="panel-title">Tea timer</h2>
    <p className="panel-lede">Good tea takes a little time. Pick a tea, or set your own.</p>
    <div className="presets" role="group" aria-label="Steeping times">
      {PRESETS.map((preset, index) => <button key={preset.label} type="button" className="preset" data-autofocus={index === 0 || undefined} onClick={() => timer.start(preset.minutes * 60_000, preset.label)}>
        <span>{preset.label}</span><span className="preset-time">{preset.minutes} min</span>
      </button>)}
    </div>
    <form className="custom" onSubmit={startCustom} noValidate aria-describedby={error ? 'timer-error' : undefined}>
      <label className="field"><span>Minutes</span><input inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} aria-invalid={!!error}/></label>
      <label className="field"><span>Seconds</span><input inputMode="numeric" value={seconds} onChange={(e) => setSeconds(e.target.value)} aria-invalid={!!error}/></label>
      <button type="submit" className="button primary">Start</button>
    </form>
    {error && <p id="timer-error" className="form-error" role="alert">{error}</p>}
  </div>;
}

// ---- Join the line ---------------------------------------------------------------------------------
// Without the shared backend the line lives in this browser only; say so plainly where people join, nowhere else.
const preview = isSharedLine ? null : <p className="note">Preview: your place is saved only on this device.</p>;
export function LinePanel({ announce, onChange }: { announce: (message: string) => void; onChange: (snapshot: Snapshot) => void }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState(5), [from, setFrom] = useState<number | null>(null);
  const list = useRef<HTMLDivElement>(null);
  const apply = useCallback((next: Snapshot) => { setSnapshot(next); onChange(next); }, [onChange]);
  const refresh = useCallback(() => loadLine().then(apply).catch((e: Error) => setError(e.message)), [apply]);
  useEffect(() => {
    refresh();
    if (!isSharedLine) return;
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, 15_000);
    return () => window.clearInterval(timer);
  }, [refresh]);
  useEffect(() => {
    const node = list.current; if (!node) return;
    const observer = new ResizeObserver(() => setRows(rowsThatFit(node.clientHeight, 2.5 * parseFloat(getComputedStyle(document.documentElement).fontSize))));
    observer.observe(node); return () => observer.disconnect();
  }, [snapshot?.me]);

  // Once the line has loaded, focus follows into the form or the leave button, if focus is still in the panel.
  const ready = snapshot !== null, inLine = !!snapshot?.me;
  useEffect(() => {
    const target = document.querySelector<HTMLElement>(inLine ? '.panel-line [data-autofocus]' : '#display-name');
    if (ready && target && target.closest('.panel')?.contains(document.activeElement)) target.focus();
  }, [ready, inLine]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return; // a second click while the first is in flight does nothing
    const parsed = displayNameSchema.safeParse(name);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? 'Enter a display name.'); return; }
    setBusy(true); setError('');
    try { const next = await join(parsed.data); apply(next); setFrom(null); if (next.me) announce(`You’re in. You’re ${ordinal(next.me)} in today’s line.`); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  async function leaveLine() {
    setBusy(true); setError('');
    try { apply(await leave()); announce('You left the line. There’s always room for one more cup.'); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  if (!snapshot) return <div className="panel-body"><h2 className="panel-title">Join the line</h2>{error ? <p className="form-error" role="alert">{error}</p> : <p className="loading"><LoaderCircle className="spin" size={18} aria-hidden/> Setting the table…</p>}</div>;
  if (!snapshot.me) return <div className="panel-body">
    <h2 className="panel-title">Join the line</h2>
    <p className="panel-lede">{snapshot.total === 0 ? 'The table is quiet. You could be first.' : `${snapshot.total} ${snapshot.total === 1 ? 'person is' : 'people are'} in today’s line.`} Pull up a chair. Leave your name in today’s line. No account needed.</p>
    <form className="join" onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor="display-name">Display name</label>
        <input id="display-name" data-autofocus autoComplete="nickname" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!error} aria-describedby={error ? 'name-error' : undefined}/>
        {error && <span id="name-error" className="field-error" role="alert">{error}</span>}
      </div>
      <button type="submit" className="button primary" disabled={busy} aria-busy={busy}>{busy && <LoaderCircle className="spin" size={18} aria-hidden/>}Join the line</button>
    </form>
    {preview}
  </div>;

  const start = windowStart(from, snapshot.me, snapshot.total, rows), visible = snapshot.entries.slice(start, start + rows);
  return <div className="panel-body panel-line">
    <h2 className="panel-title">You’re {ordinal(snapshot.me)} in line</h2>
    <p className="panel-lede">Glad you’re here. {snapshot.total === 1 ? 'You’re the only one in today’s line so far.' : `${snapshot.total} people are in today’s line.`}</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div ref={list} className="roster">
      <ol role="list" aria-label={`Places ${start + 1} to ${start + visible.length} of ${snapshot.total}`}>
        {visible.map((entry) => <li key={entry.position} className={entry.mine ? 'mine' : undefined} aria-current={entry.mine || undefined}>
          <span className="place">{entry.position}</span><span className="name">{entry.name}{entry.mine && <span className="you"> (you)</span>}</span><time dateTime={entry.joinedAt}>{clockTime(entry.joinedAt)}</time>
        </li>)}
      </ol>
    </div>
    <div className="line-foot">
      {snapshot.total > rows && <nav className="pager" aria-label="Browse the line">
        <button type="button" className="icon-button" onClick={() => setFrom(start - rows)} disabled={start === 0} aria-label="Earlier places"><ChevronLeft size={20} aria-hidden/></button>
        <button type="button" className="icon-button" onClick={() => setFrom(start + rows)} disabled={start + rows >= snapshot.total} aria-label="Later places"><ChevronRight size={20} aria-hidden/></button>
      </nav>}
      <button type="button" className="button quiet" data-autofocus onClick={leaveLine} disabled={busy}>Leave the line</button>
    </div>
    {preview}
  </div>;
}

// ---- The first five ------------------------------------------------------------------------------
export function CupPanel() {
  const [archive, setArchive] = useState<Archive | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { loadArchive().then(setArchive).catch((e: Error) => setError(e.message)); }, []);
  if (!archive) return <div className="panel-body"><h2 className="panel-title">The first five</h2>{error ? <p className="form-error" role="alert">{error}</p> : <p className="loading"><LoaderCircle className="spin" size={18} aria-hidden/> Finding yesterday’s list…</p>}</div>;
  return <div className="panel-body">
    <h2 className="panel-title">The first five</h2>
    <p className="panel-lede">The first to pull up a chair on <time dateTime={archive.date}>{longDate(archive.date)}</time>, in the order they joined the line.</p>
    {archive.entries.length === 0
      ? <p className="empty" data-autofocus tabIndex={-1}>The table was quiet that day. Nobody joined the line.</p>
      : <ol className="first-five">{archive.entries.map((entry) => <li key={entry.position}><span className="place">{entry.position}</span><span className="name">{entry.name}</span><time dateTime={entry.joinedAt}>{clockTime(entry.joinedAt)}</time></li>)}</ol>}
    {archive.entries.length > 0 && archive.entries.length < 5 && <p className="note">Just {archive.entries.length} {archive.entries.length === 1 ? 'person' : 'people'} joined that day.</p>}
  </div>;
}
