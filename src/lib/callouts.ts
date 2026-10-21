// Where a part's callout goes: always within a short hairline of its anchor, on screen, and as clear as possible of
// the sculpture and everything else. Plain screen maths with no memory of earlier placements, so the same scene
// always gets the same layout (closing a panel restores exactly what was there before it opened).
export type Rect = { left: number; top: number; right: number; bottom: number };
export type Side = 'right' | 'left' | 'above' | 'below' | 'above-right' | 'above-left' | 'below-right' | 'below-left';
export const MAX_LEADER = 56; // px; a callout never travels further from its part than this

const SIDES: Side[] = ['right', 'above-right', 'above', 'above-left', 'left', 'below-left', 'below', 'below-right'];
const GAPS = [12, 24, 40]; // nearer spots win when they are just as clear
const area = (a: Rect, b: Rect) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));

type Input = { anchor: { x: number; y: number }; size: { width: number; height: number }; bounds: Rect; solids: Rect[]; avoid: Rect[] };

// The box whose nearest point lies `gap` px from the anchor in the given direction.
function boxAt(side: Side, gap: number, { anchor: { x, y }, size: { width, height } }: Input): Rect {
  const d = side.includes('-') ? gap / Math.SQRT2 : gap;
  const left = side.endsWith('right') ? x + d : side.endsWith('left') ? x - d - width : x - width / 2;
  const top = side.startsWith('above') ? y - d - height : side.startsWith('below') ? y + d : y - height / 2;
  return { left, top, right: left + width, bottom: top + height };
}

export function placeCallout(input: Input): Rect & { side: Side; cost: number } {
  const { anchor: { x, y }, bounds, solids, avoid } = input;
  const crosses = (r: Rect) => {
    const ex = Math.min(Math.max(x, r.left), r.right), ey = Math.min(Math.max(y, r.top), r.bottom), length = Math.hypot(ex - x, ey - y);
    for (let d = 8; d < length; d += 4) { const px = x + ((ex - x) * d) / length, py = y + ((ey - y) * d) / length; if (solids.some((s) => px > s.left && px < s.right && py > s.top && py < s.bottom)) return true; }
    return false;
  };
  let best: (Rect & { side: Side }) | null = null, bestCost = Infinity;
  for (const side of SIDES) for (const gap of GAPS) {
    const r = boxAt(side, gap, input);
    const outside = Math.max(0, bounds.left - r.left) + Math.max(0, r.right - bounds.right) + Math.max(0, bounds.top - r.top) + Math.max(0, r.bottom - bounds.bottom);
    const cost = outside * 1e4
      + solids.reduce((n, s) => n + 4 * area(r, s), 0) + avoid.reduce((n, a) => n + 3 * area(r, a), 0)
      + (crosses(r) ? 1500 : 0) + gap * 4;
    if (cost < bestCost) { bestCost = cost; best = { ...r, side }; }
  }
  // Squeezed against the screen edge: slide in, which only brings it nearer its anchor.
  const r = best!, dx = Math.max(0, bounds.left - r.left) - Math.max(0, r.right - bounds.right), dy = Math.max(0, bounds.top - r.top) - Math.max(0, r.bottom - bounds.bottom);
  return { left: r.left + dx, right: r.right + dx, top: r.top + dy, bottom: r.bottom + dy, side: r.side, cost: bestCost };
}
