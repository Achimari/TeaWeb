// One-time copy of a live Supabase line into the new PostgreSQL database. Read-only on Supabase: nothing
// there is changed or deleted. Safe to re-run: rows that already exist are skipped.
//
//   SUPABASE_DB_URL=postgresql://...  DATABASE_URL=postgresql://...  node scripts/import-from-supabase.mjs           # dry run: counts only
//   SUPABASE_DB_URL=postgresql://...  DATABASE_URL=postgresql://...  node scripts/import-from-supabase.mjs --apply   # copy, in one transaction
//
// SUPABASE_DB_URL is the old project's Postgres connection string (Supabase dashboard → Connect → Session pooler
// or Direct connection; it needs SELECT on public.queue_entries and public.daily_archive, which the postgres
// user has). DATABASE_URL is the new database, already migrated with `npx prisma migrate deploy`.
// Guest keys are copied as they are: they are SHA-256 hashes of the same `tea_guest` cookie, so a guest who
// returns to the same domain keeps their place. The shared timer is not copied (the old one lived in each browser).
import pg from 'pg';

const apply = process.argv.includes('--apply');
const source = process.env.SUPABASE_DB_URL, target = process.env.DATABASE_URL;
if (!source || !target) { console.error('Set SUPABASE_DB_URL (the old Supabase database) and DATABASE_URL (the new one).'); process.exit(1); }

// TLS comes from the connection string itself: Supabase's strings end in ?sslmode=require.
const from = new pg.Client({ connectionString: source });
const to = new pg.Client({ connectionString: target });
await from.connect(); await to.connect();
try {
  await from.query('BEGIN READ ONLY');
  const { rows: entries } = await from.query('SELECT guest_key, display_name, business_date::text AS business_date, joined_at FROM public.queue_entries ORDER BY business_date, joined_at, id');
  const { rows: archive } = await from.query('SELECT business_date::text AS business_date, position, display_name, joined_at, archived_at FROM public.daily_archive ORDER BY business_date, position');
  await from.query('COMMIT');
  console.log(`Supabase has ${entries.length} line entries and ${archive.length} archived places.`);
  if (!apply) { console.log('Dry run: nothing written. Re-run with --apply to copy.'); process.exit(0); }

  await to.query('BEGIN');
  let lineCopied = 0, archiveCopied = 0;
  for (const e of entries) {
    const r = await to.query('INSERT INTO queue_entries (guest_key, display_name, business_date, joined_at) VALUES ($1, $2, $3::date, $4) ON CONFLICT (guest_key, business_date) DO NOTHING', [e.guest_key, e.display_name, e.business_date, e.joined_at]);
    lineCopied += r.rowCount;
  }
  for (const a of archive) {
    const r = await to.query('INSERT INTO daily_archive (business_date, position, display_name, joined_at, archived_at) VALUES ($1::date, $2, $3, $4, $5) ON CONFLICT (business_date, position) DO NOTHING', [a.business_date, a.position, a.display_name, a.joined_at, a.archived_at]);
    archiveCopied += r.rowCount;
  }
  await to.query("SELECT pg_notify('tea_changes', 'line')");
  await to.query('COMMIT');
  console.log(`Copied ${lineCopied} line entries and ${archiveCopied} archived places (the rest were already there).`);
  console.log('Finished days among the copied entries are archived by the app on its next request or scheduled run.');
} catch (error) {
  await to.query('ROLLBACK').catch(() => {});
  console.error('Nothing was written:', error.message);
  process.exitCode = 1;
} finally {
  await from.end(); await to.end();
}
