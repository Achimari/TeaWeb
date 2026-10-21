// Paging the roster in the line panel. (The line itself lives in PostgreSQL: src/lib/server/store.ts.)
export function rowsThatFit(height: number, rowHeight: number): number { return rowHeight > 0 ? Math.max(1, Math.floor(height / rowHeight)) : 1; }
// Index of the first row shown. null follows the visitor: the window ends at their row.
export function windowStart(from: number | null, position: number, total: number, size: number): number {
  return Math.max(0, Math.min(from ?? position - size, total - size));
}
