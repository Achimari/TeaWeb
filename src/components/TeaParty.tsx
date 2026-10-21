'use client';
import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import TeapotStage from './TeapotStage';
import { CupPanel, LinePanel, TimerPanel, ordinal } from './panels';
import { useTeaState } from './useTeaState';
import { formatClock } from '@/lib/timer';
import type { Part } from '@/lib/teapot-scene';

const TITLES: Record<Part, string> = { spout: 'Tea timer', body: 'Join the line', cup: 'The first five' };

export default function TeaParty() {
  const [open, setOpen] = useState<Part | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const trigger = useRef<HTMLElement | null>(null);
  const panel = useRef<HTMLElement>(null);
  // The shared line and timer: the pot's badge and the spout's clock stay current with everyone's changes.
  const tea = useTeaState(), timer = tea.timer, place = tea.state?.line.me ?? null;

  const openPart = (part: Part, from: HTMLElement) => { trigger.current = from; setOpen(part); };
  const close = () => setOpen(null);
  // Focus returns to the part's label after the panel has gone (on phones the labels reappear only then).
  useEffect(() => { if (open === null) trigger.current?.focus(); }, [open]);
  // Focus moves into a panel once, when it opens: to its first action, or to the panel itself while it loads.
  // Live changes (someone else's timer, your place moving up) never move it; the panels handle your own actions.
  useEffect(() => { if (open && panel.current) (panel.current.querySelector<HTMLElement>('[data-autofocus]') ?? panel.current).focus(); }, [open]);

  const badges = {
    spout: timer.status === 'running' ? formatClock(timer.remainingMs) : timer.status === 'ready' ? 'Ready' : undefined,
    body: place ? ordinal(place) : undefined,
  };

  return <main className="tea">
    <TeapotStage onOpen={openPart} active={open} badges={badges}/>
    {/* The artwork's voice. Fixed, art-directed placement (the tilt and overlap are set in CSS, never random);
        the camera and the callouts keep the sculpture clear of every .say block. */}
    <header className="band band-top">
      <h1 className="say mark">The Tea Party</h1>
      <p className="say shout">The pot’s on. <span className="sticker">Who’s next?</span></p>
    </header>
    <footer className="band band-bottom">
      <p className="say chaos"><span className="thin">A little chaos.</span> <span className="heavy">A lot of tea.</span></p>
      <p className="say tag">Pull up. Pour up.</p>
      <p className="say hint">Spin the pot. Tap the spout, the pot or the cup.</p>
    </footer>
    {open && <section ref={panel} className={`panel panel-${open}`} role="dialog" aria-modal="false" aria-label={TITLES[open]} tabIndex={-1} onKeyDown={(event) => { if (event.key === 'Escape') close(); }}>
      <button type="button" className="close" onClick={close} aria-label={`Close ${TITLES[open].toLowerCase()}`}><X size={18} aria-hidden/></button>
      {open === 'spout' && <TimerPanel tea={tea}/>}
      {open === 'body' && <LinePanel tea={tea} announce={setAnnouncement}/>}
      {open === 'cup' && <CupPanel timeZone={tea.state?.timeZone ?? 'Europe/Riga'}/>}
    </section>}
    <p className="sr-only" role="status" aria-live="polite">{announcement}</p>
    <p className="sr-only" role="status" aria-live="assertive">{timer.status === 'ready' ? 'The pot’s ready.' : ''}</p>
  </main>;
}
