'use client';
// The three panels. The line and the timer are shared by everyone on the site (see useTeaState); a panel
// only ever shows the server's state, and disables its actions when the server can't be reached.
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, LoaderCircle } from 'lucide-react';
import { PRESETS, durationMs, formatClock } from '@/lib/timer';
import { displayNameSchema } from '@/lib/validation';
import { rowsThatFit, windowStart } from '@/lib/line';
import type { Archive } from '@/lib/tea';
import type { Tea } from './useTeaState';

const ordinals = new Intl.PluralRules('en', { type: 'ordinal' });
const suffix: Record<string, string> = { one: 'st', two: 'nd', few: 'rd', other: 'th' };
export const ordinal = (n: number) => `${n}${suffix[ordinals.select(n)]}`;
const clockTime = (iso: string, timeZone: string) => new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', timeZone });
const longDate = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
const Loading = ({ children }: { children: string }) => <p className="loading"><LoaderCircle className="spin" size={18} aria-hidden/> {children}</p>;
const Unavailable = ({ message, id }: { message: string; id?: string }) => <p id={id} className="form-error" role="alert">{message}</p>;

// ---- The shared tea timer ----------------------------------------------------------------------------
export function TimerPanel({ tea }: { tea: Tea }) {
  const [minutes, setMinutes] = useState('3'), [seconds, setSeconds] = useState('0');
  const [problem, setProblem] = useState(''), [busy, setBusy] = useState(false), [note, setNote] = useState('');
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() => ('Notification' in globalThis ? Notification.permission : 'unsupported'));
  const { timer, state, error } = tea;
  const offline = Boolean(error) || !state;
  // Focus follows only your own actions: when your Start or Stop replaces the panel's content, focus moves to
  // the new content's first control. A change made by someone else never moves it; if it removes the control you
  // were on, focus rests on the panel itself rather than falling out of it.
  const ownAction = useRef(false), body = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const panel = body.current?.closest<HTMLElement>('.panel');
    if (ownAction.current) { ownAction.current = false; panel?.querySelector<HTMLElement>('[data-autofocus]')?.focus(); }
    else if (panel && document.activeElement === document.body) panel.focus();
  }, [timer.status, timer.version]);

  async function act(run: () => Promise<{ started?: boolean; stopped?: boolean }>, otherwise: string) {
    if (busy) return;
    setBusy(true); setProblem(''); setNote(''); ownAction.current = true;
    try { const result = await run(); if (result.started === false || result.stopped === false) setNote(otherwise); }
    catch (e) { ownAction.current = false; setProblem((e as Error).message); }
    finally { setBusy(false); }
  }
  const start = (name: string, ms?: number) => act(() => tea.startTimer(name, ms), 'Someone else put the pot on first. This is their timer.');
  const stop = () => act(() => tea.stopTimer(timer.version), 'That timer had already changed. This is the current one.');
  function startCustom(event: React.FormEvent) {
    event.preventDefault();
    const ms = durationMs(Number(minutes), Number(seconds));
    if (ms === null) { setProblem('Choose between 1 second and 60 minutes.'); return; }
    start('Custom', ms);
  }
  // Notifications are this device's choice; permission is asked for only when the visitor presses the button.
  async function askToNotify() {
    if (!('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') tea.setNotify(true);
  }
  const notifyControl = <>
    {permission === 'default' && <button type="button" className="link" onClick={askToNotify}>Notify me on this device when it’s ready</button>}
    {permission === 'granted' && !tea.notify && <button type="button" className="link" onClick={() => tea.setNotify(true)}>Notify me on this device when it’s ready</button>}
    {permission === 'granted' && tea.notify && <p className="note">This device will show a notification when the pot’s ready, while this page is open in the background. <button type="button" className="link inline" onClick={() => tea.setNotify(false)}>Turn off</button></p>}
    {permission === 'denied' && <p className="note">Notifications are blocked for this site in your browser settings.</p>}
  </>;
  const label = timer.label === 'Custom' ? 'Custom pour' : timer.label ?? 'The tea';
  const feedback = <>{note && <p className="note" role="status">{note}</p>}{(problem || error) && <Unavailable message={problem || error!}/>}</>;

  if (!state && !error) return <div className="panel-body" ref={body}><h2 className="panel-title">Tea timer</h2><Loading>Checking the pot…</Loading></div>;
  if (timer.status === 'ready') return <div className="panel-body" ref={body}>
    <h2 className="panel-title">The pot’s ready.</h2>
    <p className="panel-lede" role="status">{label} has steeped for {formatClock(timer.durationMs ?? 0)}. Pour up.</p>
    <div className="actions">
      <button type="button" className="button primary" data-autofocus onClick={stop} disabled={busy || offline}>Clear the timer</button>
      {timer.label && timer.label !== 'Custom' && <button type="button" className="button quiet" onClick={() => start(timer.label!)} disabled={busy || offline}>Brew another {timer.label}</button>}
    </div>
    <div className="panel-foot">{feedback}<p className="note">Everyone here sees Ready until someone clears it or puts the next pot on.</p></div>
  </div>;
  if (timer.status === 'running') return <div className="panel-body" ref={body}>
    <h2 className="panel-title">{label}</h2>
    <p className="clock" aria-live="off">{formatClock(timer.remainingMs)}</p>
    <p className="panel-lede">One pot for the whole party: every screen here counts down to {timer.deadline && clockTime(timer.deadline, state?.timeZone ?? 'Europe/Riga')}. Anyone can stop it.</p>
    <div className="actions"><button type="button" className="button quiet" data-autofocus onClick={stop} disabled={busy || offline}>Stop the timer</button></div>
    <div className="panel-foot">{notifyControl}{feedback}</div>
  </div>;
  return <div className="panel-body" ref={body}>
    <h2 className="panel-title">Tea timer</h2>
    <p className="panel-lede">One timer for the whole party. Put the pot on and everyone here watches it count down.</p>
    <div className="presets" role="group" aria-label="Steeping times">
      {PRESETS.map((preset, index) => <button key={preset.label} type="button" className="preset" data-autofocus={index === 0 || undefined} onClick={() => start(preset.label)} disabled={busy || offline}>
        <span>{preset.label}</span><span className="preset-time">{preset.minutes} min</span>
      </button>)}
    </div>
    <div className="panel-foot">
      <form className="custom" onSubmit={startCustom} noValidate aria-label="Your own time" aria-describedby={problem ? 'timer-error' : undefined}>
        <label className="field"><span>Minutes</span><input inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} aria-invalid={!!problem}/></label>
        <label className="field"><span>Seconds</span><input inputMode="numeric" value={seconds} onChange={(e) => setSeconds(e.target.value)} aria-invalid={!!problem}/></label>
        <button type="submit" className="button primary" disabled={busy || offline}>Start</button>
      </form>
      {note && <p className="note" role="status">{note}</p>}
      {(problem || error) && <Unavailable id="timer-error" message={problem || error!}/>}
    </div>
  </div>;
}

// ---- Join the line ----------------------------------------------------------------------------------
export function LinePanel({ tea, announce }: { tea: Tea; announce: (message: string) => void }) {
  const [name, setName] = useState('');
  const [problem, setProblem] = useState('');
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState(5), [from, setFrom] = useState<number | null>(null);
  const list = useRef<HTMLDivElement>(null);
  const { state, error } = tea, line = state?.line;
  useEffect(() => {
    const node = list.current; if (!node) return;
    const observer = new ResizeObserver(() => setRows(rowsThatFit(node.clientHeight, 2.5 * parseFloat(getComputedStyle(document.documentElement).fontSize))));
    observer.observe(node); return () => observer.disconnect();
  }, [line?.me]);

  // Once the line has loaded, focus follows into the form or the leave button, if focus is still in the panel.
  const ready = Boolean(line), inLine = Boolean(line?.me);
  useEffect(() => {
    const target = document.querySelector<HTMLElement>(inLine ? '.panel-line [data-autofocus]' : '#display-name');
    if (ready && target && target.closest('.panel')?.contains(document.activeElement)) target.focus();
  }, [ready, inLine]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || error) return; // a second click while the first is in flight does nothing; nobody joins while offline
    const parsed = displayNameSchema.safeParse(name);
    if (!parsed.success) { setProblem(parsed.error.issues[0]?.message ?? 'Enter a display name.'); return; }
    setBusy(true); setProblem('');
    try { const next = await tea.join(parsed.data); setFrom(null); if (next.line.me) announce(`You’re in. You’re ${ordinal(next.line.me)} in today’s line.`); }
    catch (e) { setProblem((e as Error).message); }
    finally { setBusy(false); }
  }
  async function leaveLine() {
    setBusy(true); setProblem('');
    try { await tea.leave(); announce('You left the line.'); }
    catch (e) { setProblem((e as Error).message); }
    finally { setBusy(false); }
  }

  const paused = error && <Unavailable message={`${error} Joining is paused until it’s back.`}/>;
  if (!line) return <div className="panel-body"><h2 className="panel-title">Join the line</h2>{paused || <Loading>Finding the line…</Loading>}</div>;
  if (!line.me) return <div className="panel-body">
    <h2 className="panel-title">Join the line</h2>
    <p className="panel-lede">{line.total === 0 ? 'Nobody’s here yet. You could be first.' : `${line.total} ${line.total === 1 ? 'person is' : 'people are'} in today’s line.`} Pull up a chair: a name is all it takes, no account.</p>
    {paused}
    {line.total > 0 && <div className="roster roster-preview">
      <ol role="list" aria-label="Today’s line">
        {line.entries.map((entry) => <li key={entry.position}><span className="place">{entry.position}</span><span className="name">{entry.name}</span><time dateTime={entry.joinedAt}>{clockTime(entry.joinedAt, state!.timeZone)}</time></li>)}
      </ol>
    </div>}
    <form className="join panel-foot" onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor="display-name">Display name</label>
        <input id="display-name" data-autofocus autoComplete="nickname" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!problem} aria-describedby={problem ? 'name-error' : undefined}/>
        {problem && <span id="name-error" className="field-error" role="alert">{problem}</span>}
      </div>
      <button type="submit" className="button primary" disabled={busy || Boolean(error)} aria-busy={busy}>{busy && <LoaderCircle className="spin" size={18} aria-hidden/>}Join the line</button>
    </form>
  </div>;

  const start = windowStart(from, line.me, line.total, rows), visible = line.entries.slice(start, start + rows);
  return <div className="panel-body panel-line">
    <h2 className="panel-title">You’re {ordinal(line.me)} in line</h2>
    <p className="panel-lede">{line.total === 1 ? 'Just you so far. The kettle’s warming.' : `${line.total} people are in today’s line, and it updates as people come and go.`}</p>
    {(problem || error) && <Unavailable message={problem || error!}/>}
    <div ref={list} className="roster">
      <ol role="list" aria-label={`Today’s line, places ${start + 1} to ${start + visible.length} of ${line.total}`}>
        {visible.map((entry) => <li key={entry.position} className={entry.mine ? 'mine' : undefined} aria-current={entry.mine || undefined}>
          <span className="place">{entry.position}</span><span className="name">{entry.name}{entry.mine && <span className="you"> (you)</span>}</span><time dateTime={entry.joinedAt}>{clockTime(entry.joinedAt, state!.timeZone)}</time>
        </li>)}
      </ol>
    </div>
    <div className="line-foot panel-foot">
      {line.total > rows && <nav className="pager" aria-label="Browse the line">
        <button type="button" className="icon-button" onClick={() => setFrom(start - rows)} disabled={start === 0} aria-label="Earlier places"><ChevronLeft size={20} aria-hidden/></button>
        <button type="button" className="icon-button" onClick={() => setFrom(start + rows)} disabled={start + rows >= line.total} aria-label="Later places"><ChevronRight size={20} aria-hidden/></button>
      </nav>}
      <button type="button" className="button quiet" data-autofocus onClick={leaveLine} disabled={busy || Boolean(error)}>Leave the line</button>
    </div>
  </div>;
}

// ---- The first five ------------------------------------------------------------------------------
export function CupPanel({ timeZone }: { timeZone: string }) {
  const [archive, setArchive] = useState<Archive | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    fetch('/api/archive', { cache: 'no-store' })
      .then(async (r) => { const data = await r.json().catch(() => ({})); if (!r.ok) throw new Error(data.error || 'The first five can’t be reached right now.'); setArchive(data); })
      .catch((e: Error) => setError(e.message));
  }, []);
  if (!archive) return <div className="panel-body"><h2 className="panel-title">The first five</h2>{error ? <Unavailable message={error}/> : <Loading>Finding yesterday’s list…</Loading>}</div>;
  return <div className="panel-body">
    <h2 className="panel-title">The first five</h2>
    <p className="panel-lede">The first to pull up a chair on <time dateTime={archive.date}>{longDate(archive.date)}</time>, in the order they joined the line.</p>
    {archive.entries.length === 0
      ? <p className="empty" data-autofocus tabIndex={-1}>The table was quiet that day. Nobody joined the line.</p>
      : <ol className="first-five">{archive.entries.map((entry) => <li key={entry.position}><span className="place">{entry.position}</span><span className="name">{entry.name}</span><time dateTime={entry.joinedAt}>{clockTime(entry.joinedAt, timeZone)}</time></li>)}</ol>}
    {archive.entries.length > 0 && archive.entries.length < 5 && <p className="note">Just {archive.entries.length} {archive.entries.length === 1 ? 'person' : 'people'} joined that day.</p>}
    <p className="note panel-foot">The first five are kept at midnight, Riga time, and stay here until the next midnight.</p>
  </div>;
}
