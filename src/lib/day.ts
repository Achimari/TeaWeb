// The line runs on a business day in one timezone (Europe/Riga by default), DST included.
// Timestamps are stored in UTC; only the calendar date is local.
// Set on the server (BUSINESS_TIMEZONE); the browser is told the zone by /api/state, so it is never baked into the bundle.
export const BUSINESS_TIMEZONE = process.env.BUSINESS_TIMEZONE || 'Europe/Riga';

export function businessDate(instant: Date, timeZone = BUSINESS_TIMEZONE): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(instant);
}
export function previousDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10);
}
