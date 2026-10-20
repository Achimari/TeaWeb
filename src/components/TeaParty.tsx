'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import TeapotStage from './TeapotStage';
import { CupPanel, LinePanel, TimerPanel, ordinal, useTeaTimer } from './panels';
import { formatClock } from '@/lib/timer';
import { loadLine, type Snapshot } from '@/lib/line-client';
import type { Part } from '@/lib/teapot-scene';

const TITLES: Record<Part, string> = { spout: 'Tea timer', body: 'Join the line', cup: 'The first five' };

export default function TeaParty() {
  const [open, setOpen] = useState<Part | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [place, setPlace] = useState<number | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const panel = useRef<HTMLElement>(null);
  const timer = useTeaTimer();

  // Restore the visitor's place in today's line, so the pot can show it after a reload.
  useEffect(() => { loadLine().then((s) => setPlace(s.me)).catch(() => {}); }, []);
  const onLineChange = useCallback((s: Snapshot) => setPlace(s.me), []);

  const openPart = (part: Part, from: HTMLElement) => { trigger.current = from; setOpen(part); };
  const close = () => setOpen(null);
  // Focus returns to the part's label after the panel has gone (on phones the labels reappear only then).
  useEffect(() => { if (open === null) trigger.current?.focus(); }, [open]);
  // Focus moves into the panel: to its first action, or to the panel itself while its content loads.
  useEffect(() => { if (open && panel.current) (panel.current.querySelector<HTMLElement>('[data-autofocus]') ?? panel.current).focus(); }, [open, timer.state.status, place]);

  const badges = {
    spout: timer.state.status === 'running' ? formatClock(timer.state.remainingMs) : timer.state.status === 'ready' ? 'Ready' : undefined,
    body: place ? ordinal(place) : undefined,
  };

  return <main className="tea">
    <TeapotStage onOpen={openPart} active={open} badges={badges}/>
    <header className="corner corner-top-left">
      <p className="mark">The Tea Party</p>
    </header>
    <footer className="corner corner-bottom">
      <p className="statement">There’s always room for one more cup.</p>
      <p className="hint">Turn the pot. Stay for tea.</p>
    </footer>
    {open && <section ref={panel} className={`panel panel-${open}`} role="dialog" aria-modal="false" aria-label={TITLES[open]} tabIndex={-1} onKeyDown={(event) => { if (event.key === 'Escape') close(); }}>
      <button type="button" className="close" onClick={close} aria-label={`Close ${TITLES[open].toLowerCase()}`}><X size={18} aria-hidden/></button>
      {open === 'spout' && <TimerPanel timer={timer}/>}
      {open === 'body' && <LinePanel announce={setAnnouncement} onChange={onLineChange}/>}
      {open === 'cup' && <CupPanel/>}
    </section>}
    <p className="sr-only" role="status" aria-live="polite">{announcement}</p>
    <p className="sr-only" role="status" aria-live="assertive">{timer.state.status === 'ready' ? 'Your tea is ready.' : ''}</p>
  </main>;
}
