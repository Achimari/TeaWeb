'use client';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { approach, coast, dragTurn, keyTurn, releaseVelocity, wheelTurn } from '@/lib/rotation';
import { placeCallout, type Rect } from '@/lib/callouts';
import type { Insets, Part, TeapotScene } from '@/lib/teapot-scene';

const reducedQuery = '(prefers-reduced-motion: reduce)';
function subscribeReduced(onChange: () => void) {
  const media = window.matchMedia(reducedQuery);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}
// Room the artwork's type keeps clear of the object, measured from the rendered type itself so large text or zoom
// never lets it overlap. An open panel is an edge too: on wide screens it claims the right side, on phones the
// bottom sheet claims the lower part, and the set glides into the space that is left.
const PANEL_ROOM = 26 * 16 + 48;
const CAPTION_ROOM = 44; // above the lid, for its caption
const sheetHeight = (height: number) => Math.min(25 * 16, 0.55 * height) + 12; // matches .panel on phones
function insetsFor(stage: HTMLElement, panelOpen: boolean): Insets | Insets[] {
  const box = stage.getBoundingClientRect(), width = box.width;
  const say = (band: string) => [...document.querySelectorAll(`${band} .say`)].map((n) => n.getBoundingClientRect()).filter((r) => r.width > 0);
  const top = say('.band-top'), bottom = say('.band-bottom');
  const lowest = (rects: DOMRect[]) => Math.max(box.top, ...rects.map((r) => r.bottom)) - box.top; // tilts included
  const highest = (rects: DOMRect[]) => box.bottom - Math.min(box.bottom, ...rects.map((r) => r.top));
  if (width >= 700) {
    const right = panelOpen ? PANEL_ROOM : 64;
    // Two ways to keep the type clear: the set between the top and bottom bands, or beside the left-hand type
    // (below the mark and above the tag on the right). The scene keeps whichever frames the set larger.
    const leftSide = [...top, ...bottom].filter((r) => r.left + r.width / 2 < box.left + width / 2);
    const rightSide = (rects: DOMRect[]) => rects.filter((r) => r.left + r.width / 2 >= box.left + width / 2);
    const bands = { top: lowest(top) + CAPTION_ROOM, right, bottom: highest(bottom) + 16, left: 64 };
    const beside = { top: lowest(rightSide(top)) + CAPTION_ROOM, right, bottom: highest(rightSide(bottom)) + 16, left: Math.max(64, Math.max(0, ...leftSide.map((r) => r.right - box.left)) + 32) };
    return [bands, beside];
  }
  // On phones the callouts hide while the sheet is open, so the set can use the space they would need.
  return panelOpen ? { top: lowest(top) + 8, right: 16, bottom: sheetHeight(window.innerHeight) + 16, left: 16 } : { top: lowest(top) + CAPTION_ROOM, right: 20, bottom: highest(bottom) + 12, left: 20 };
}
const PARTS: { part: Part; label: string }[] = [
  { part: 'spout', label: 'Tea timer' },
  { part: 'body', label: 'Join the line' },
  { part: 'cup', label: 'The first five' },
];
// The resting view: on wide screens a near-profile with the spout to the right; on phones the spout turns toward
// the viewer, which makes the pot narrower and so larger in a narrow frame.
const homeYaw = () => (window.innerWidth < 700 ? -0.45 : 0.3);

type Props = { onOpen: (part: Part, trigger: HTMLElement) => void; active: Part | null; badges: Partial<Record<Part, string>> };

export default function TeapotStage({ onOpen, active, badges }: Props) {
  const reduced = useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [hover, setHover] = useState<Part | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const labels = useRef<Partial<Record<Part, HTMLButtonElement | null>>>({});
  const pins = useRef<Partial<Record<Part, HTMLSpanElement | null>>>({});
  const badgeOf = useRef(badges);
  useEffect(() => { badgeOf.current = badges; });
  const scene = useRef<TeapotScene | null>(null);
  const yaw = useRef(0), target = useRef(0), easing = useRef(0), last = useRef(0);
  const press = useRef<{ x: number; y: number; from: number; dragging: boolean; samples: { t: number; x: number }[] } | null>(null);
  const coasting = useRef(0);
  const turnTicket = useRef(0);
  const focused = useRef<Part | null>(null);
  const panelOpen = useRef(false);

  // Callouts are placed once the scene is still: after a turn ends, and after the lid and the framing finish
  // gliding when a panel opens or closes. Each sits within a short hairline of its part (src/lib/callouts.ts), on
  // screen and as clear as it can be of the pot, the cup, the spout, the artwork's type, an open panel and the
  // other callouts. The layout is a pure function of what is on screen, with no memory of earlier placements,
  // so the same pot, angle and viewport always give the same callouts. A callout whose part is behind the pot dims.
  const placeLabels = useRef(() => {
    const found = scene.current?.anchors(); if (!found) return;
    const { parts, pot, cup } = found, placed: Rect[] = [];
    const grow = (b: Rect, by: number): Rect => ({ left: b.left - by, top: b.top - by, right: b.right + by, bottom: b.bottom + by });
    const around = [...document.querySelectorAll('.say, .panel')].map((node) => grow(node.getBoundingClientRect(), 8));
    const solids = [grow(pot, -3), grow(cup, -3), grow(parts.spout.box, -2)];
    const bounds = { left: 8, top: 8, right: window.innerWidth - 8, bottom: window.innerHeight - 8 };
    for (const { part } of PARTS) {
      const label = labels.current[part], pin = pins.current[part]; if (!label || !pin) continue;
      const { spots, hidden } = parts[part];
      // Try each of the part's anchor spots; the first (its usual one) is preferred whenever it is about as clear.
      const pinsOfOthers = PARTS.filter((p) => p.part !== part).map((p) => grow({ left: parts[p.part].x, right: parts[p.part].x, top: parts[p.part].y, bottom: parts[p.part].y }, 14));
      const avoid = [...around, ...pinsOfOthers, ...placed.map((r) => grow(r, 8))];
      const attempt = (compact: boolean) => {
        label.dataset.compact = String(compact);
        const size = { width: label.offsetWidth, height: label.offsetHeight };
        return spots.map((anchor, index) => ({ anchor, index, compact, spot: placeCallout({ anchor, size, bounds, solids, avoid }) }));
      };
      // Where it's tight, a callout carrying a badge (the timer, your place) can stack into a narrower block instead.
      const tries = [...attempt(false), ...(badgeOf.current[part] ? attempt(true) : [])];
      const score = (t: (typeof tries)[number]) => t.spot.cost + (t.index === 0 ? 0 : 900) + (t.compact ? 300 : 0);
      const { anchor: { x, y }, spot, compact } = tries.reduce((a, b) => (score(b) < score(a) ? b : a));
      label.dataset.compact = String(compact);
      placed.push(spot);
      label.style.transform = `translate(${Math.round(spot.left)}px, ${Math.round(spot.top)}px)`;
      // The hairline runs from the part to the nearest point of the callout.
      const ex = Math.min(Math.max(x, spot.left), spot.right), ey = Math.min(Math.max(y, spot.top), spot.bottom);
      pin.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
      pin.style.setProperty('--leader', `${Math.max(0, Math.hypot(ex - x, ey - y) - 4).toFixed(1)}px`);
      pin.style.setProperty('--angle', `${Math.atan2(ey - y, ex - x).toFixed(3)}rad`);
      label.dataset.hidden = pin.dataset.hidden = String(hidden);
    }
  });

  useEffect(() => {
    let cancelled = false, observer: ResizeObserver | undefined;
    const node = canvas.current!;
    const lost = (event: Event) => { event.preventDefault(); setStatus('failed'); };
    node.addEventListener('webglcontextlost', lost);
    // While the lid or the framing glides, the callouts step aside (like during a turn) and come back placed for
    // the settled scene, so a transition can't leave them anywhere but where the still scene puts them.
    import('@/lib/teapot-scene').then(({ createTeapotScene }) => createTeapotScene(node, (settled) => {
      if (!settled) { stage.current?.setAttribute('data-moving', 'true'); return; }
      stage.current?.removeAttribute('data-moving');
      if (!stage.current?.hasAttribute('data-turning')) placeLabels.current();
    })).then((created) => {
      if (cancelled) { created.dispose(); return; }
      scene.current = created; yaw.current = target.current = homeYaw(); created.setYaw(yaw.current);
      created.setReducedMotion(window.matchMedia(reducedQuery).matches);
      observer = new ResizeObserver(() => created.resize(insetsFor(stage.current!, panelOpen.current))); observer.observe(node);
      document.fonts?.ready.then(() => { if (!cancelled) created.resize(insetsFor(stage.current!, panelOpen.current)); }); // the corner type's size settles once its fonts load
      setStatus('ready');
    }).catch((error) => { console.error('The 3D teapot could not load.', error); if (!cancelled) setStatus('failed'); });
    return () => { cancelled = true; observer?.disconnect(); node.removeEventListener('webglcontextlost', lost); cancelAnimationFrame(easing.current); cancelAnimationFrame(coasting.current); scene.current?.dispose(); scene.current = null; };
  }, []);

  const highlighted = hover ?? active;
  // Opening the pot lifts its lid as the panel appears; closing sets it back along the same path.
  useEffect(() => {
    panelOpen.current = active !== null;
    scene.current?.setLidOpen(active === 'body'); // first, so the framing is chosen for where the lid is going
    if (stage.current) scene.current?.resize(insetsFor(stage.current, active !== null));
  }, [active, status]);
  useEffect(() => { scene.current?.setReducedMotion(reduced); }, [reduced, status]);
  useEffect(() => { scene.current?.setHighlight(highlighted); }, [highlighted, status]);

  // Turning: input moves a target; the view eases onto it and stops exactly there (instantly with reduced motion).
  // Let the artwork turn without the moving captions hopping across it. They return at their settled anchors.
  const beginTurn = () => { if (!reduced) { turnTicket.current++; stage.current?.setAttribute('data-turning', 'true'); } };
  const endTurn = () => {
    const ticket = turnTicket.current;
    requestAnimationFrame(() => {
      if (ticket !== turnTicket.current) return;
      placeLabels.current();
      stage.current?.removeAttribute('data-turning');
    });
  };
  function turnTo(next: number, direct = false) {
    cancelAnimationFrame(coasting.current); coasting.current = 0; // any new input takes over from a coasting turn
    target.current = next;
    if (direct || reduced) {
      cancelAnimationFrame(easing.current); easing.current = 0;
      yaw.current = next; scene.current?.setYaw(next); return;
    }
    beginTurn();
    if (easing.current) return;
    last.current = performance.now();
    const tick = (now: number) => {
      yaw.current = approach(yaw.current, target.current, now - last.current); last.current = now;
      scene.current?.setYaw(yaw.current);
      easing.current = yaw.current === target.current ? 0 : requestAnimationFrame(tick);
      if (!easing.current) endTurn();
    };
    easing.current = requestAnimationFrame(tick);
  }

  // The wheel turns the teapot instead of the page, unless large text has made the page itself scroll.
  useEffect(() => {
    const node = stage.current; if (!node) return;
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || document.documentElement.scrollHeight > window.innerHeight + 1) return;
      event.preventDefault();
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      turnTo(target.current + wheelTurn(delta, event.deltaMode, window.innerHeight));
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  });

  function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    cancelAnimationFrame(coasting.current); coasting.current = 0; // a touch catches a coasting pot
    cancelAnimationFrame(easing.current); easing.current = 0; target.current = yaw.current; // and catches a wheel turn
    endTurn();
    press.current = { x: event.clientX, y: event.clientY, from: yaw.current, dragging: false, samples: [] };
  }
  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const start = press.current;
    if (!start) { setHover(scene.current?.pick(event.clientX, event.clientY) ?? null); return; }
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (!start.dragging && Math.hypot(dx, dy) < 6) return; // a press that barely moves is a click
    start.dragging = true; setHover(null);
    beginTurn();
    const along = Math.abs(dx) >= Math.abs(dy) ? dx : -dy;
    start.samples.push({ t: event.timeStamp, x: along }); if (start.samples.length > 12) start.samples.shift();
    turnTo(start.from + dragTurn(along, event.currentTarget.clientWidth), true);
  }
  function onPointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    const start = press.current; press.current = null;
    if (start?.dragging) {
      // Let go while moving and the pot keeps turning, slowing to a stop (not under reduced motion).
      // The release itself is the last sample, so a finger held still before lifting throws nothing.
      const dx = event.clientX - start.x, dy = event.clientY - start.y, release = { t: event.timeStamp, x: Math.abs(dx) >= Math.abs(dy) ? dx : -dy };
      let velocity = reduced ? 0 : releaseVelocity([...start.samples, release], event.currentTarget.clientWidth), last = performance.now();
      const glide = (now: number) => {
        const step = coast(velocity, now - last); last = now; velocity = step.velocity;
        yaw.current = target.current = yaw.current + step.turn; scene.current?.setYaw(yaw.current);
        coasting.current = velocity ? requestAnimationFrame(glide) : 0;
        if (!velocity) endTurn();
      };
      if (velocity) coasting.current = requestAnimationFrame(glide);
      else endTurn();
      return;
    }
    if (!start) return;
    const part = scene.current?.pick(event.clientX, event.clientY);
    if (part) onOpen(part, labels.current[part] ?? event.currentTarget);
  }
  function onKeyDown(event: React.KeyboardEvent) {
    const step = keyTurn(event.key); if (step === null) return;
    event.preventDefault();
    turnTo(step === 'reset' ? Math.round((target.current - homeYaw()) / (Math.PI * 2)) * Math.PI * 2 + homeYaw() : target.current + step);
  }

  return <div ref={stage} className="stage" data-status={status}>
    <div className="turntable" tabIndex={0} role="group" aria-roledescription="3D object" aria-label="Teapot and cup. Left and right arrow keys turn the teapot; Home faces it forward." onKeyDown={onKeyDown}>
      <canvas ref={canvas} className="scene" aria-hidden onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={() => { press.current = null; endTurn(); }} onPointerLeave={() => { if (!press.current) setHover(null); }}
        data-hover={hover !== null}/>
    </div>
    <ul className="hotspots" data-floating={status === 'ready'} aria-label="Parts of the teapot">
      {PARTS.map(({ part, label }) => <li key={part}>
        <span ref={(node) => { pins.current[part] = node; }} className="hotspot-pin" data-active={highlighted === part} aria-hidden/>
        <button ref={(node) => { labels.current[part] = node; }} type="button" className={`hotspot hotspot-${part}`} data-active={highlighted === part}
          onClick={(event) => onOpen(part, event.currentTarget)}
          onPointerEnter={() => setHover(part)} onPointerLeave={() => { if (focused.current !== part) setHover(null); }}
          onFocus={() => { focused.current = part; setHover(part); }} onBlur={() => { focused.current = null; setHover(null); }}>
          {label}{badges[part] && <span className="hotspot-badge">{badges[part]}</span>}
        </button>
      </li>)}
    </ul>
    {status === 'failed' && <p className="stage-note">The 3D teapot could not be shown on this device. The three parts are still here as buttons.</p>}
  </div>;
}
