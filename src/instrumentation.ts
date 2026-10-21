// Runs once when the Node server starts. Closes finished business days on a schedule (every five minutes,
// so Riga midnight is caught within minutes in summer and winter time alike); every request also checks
// first, so a missed run changes nothing. rollover() is idempotent and locked, so overlapping runs are safe.
// The same run sweeps rate-limit windows older than a day.
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs' || !process.env.DATABASE_URL) return;
  const { store } = await import('./lib/server/db');
  const run = () => Promise.all([store().rollover(), store().sweep()]).catch((error) => console.error('scheduled rollover', error));
  run();
  setInterval(run, 5 * 60_000).unref();
}
