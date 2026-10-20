// Runs supabase/schema.sql in a real Postgres (PGlite, compiled to WebAssembly) and exercises the queue functions.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const schema = readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8');
const key = (n: number) => n.toString(16).padStart(64, '0');
async function fresh() { const db = new PGlite(); await db.exec(schema); return db; }
const join = async (db: PGlite, guest: number, name: string, at: string) => (await db.query<{ result: { position: number; total: number; joined: boolean } }>('select public.join_queue($1, $2, $3::timestamptz) as result', [key(guest), name, at])).rows[0].result;
const leave = async (db: PGlite, guest: number, at: string) => (await db.query<{ left: boolean }>('select public.leave_queue($1, $2::timestamptz) as left', [key(guest), at])).rows[0].left;
const snapshot = async (db: PGlite, guest: number, at: string) => (await db.query<{ s: { date: string; total: number; me: number | null; entries: { position: number; name: string; mine: boolean }[] } }>('select public.queue_snapshot($1, $2::timestamptz) as s', [key(guest), at])).rows[0].s;
const archive = async (db: PGlite, at: string) => (await db.query<{ a: { date: string; entries: { position: number; name: string }[] } }>('select public.archive_latest($1::timestamptz) as a', [at])).rows[0].a;
const archiveRows = async (db: PGlite) => (await db.query<{ n: number }>('select count(*)::int as n from public.daily_archive')).rows[0].n;
const MORNING = '2026-10-24T06:00:00Z'; // 09:00 in Riga (UTC+3)

test('joining returns your position; a duplicate submit keeps one place and the first name', async () => {
  const db = await fresh();
  assert.deepEqual(await join(db, 1, 'Ada', MORNING), { position: 1, total: 1, joined: true });
  assert.deepEqual(await join(db, 2, 'Grace', '2026-10-24T06:01:00Z'), { position: 2, total: 2, joined: true });
  assert.deepEqual(await join(db, 1, 'Ada again', '2026-10-24T06:02:00Z'), { position: 1, total: 2, joined: false });
  const view = await snapshot(db, 1, '2026-10-24T06:03:00Z');
  assert.deepEqual(view.entries.map((e) => [e.position, e.name, e.mine]), [[1, 'Ada', true], [2, 'Grace', false]]);
  assert.equal(view.me, 1);
});

test('concurrent duplicate joins from one guest still produce exactly one entry', async () => {
  const db = await fresh();
  await Promise.all([join(db, 7, 'Ada', MORNING), join(db, 7, 'Ada', MORNING), join(db, 7, 'Ada', MORNING)]);
  assert.equal((await snapshot(db, 7, MORNING)).total, 1);
});

test('a guest can only leave their own place', async () => {
  const db = await fresh();
  await join(db, 1, 'Ada', MORNING); await join(db, 2, 'Grace', '2026-10-24T06:01:00Z');
  assert.equal(await leave(db, 3, '2026-10-24T06:02:00Z'), false);
  assert.equal(await leave(db, 1, '2026-10-24T06:02:00Z'), true);
  const view = await snapshot(db, 2, '2026-10-24T06:03:00Z');
  assert.deepEqual(view.entries.map((e) => e.name), ['Grace']);
  assert.equal(view.me, 1);
});

test('names and guest keys are validated in the database too', async () => {
  const db = await fresh();
  await assert.rejects(join(db, 1, 'A', MORNING));
  await assert.rejects(db.query('select public.join_queue($1, $2, $3::timestamptz)', ['not-a-key', 'Ada', MORNING]));
});

test('the line has a capacity, so it cannot be flooded', async () => {
  const db = await fresh();
  await db.query("update public.app_settings set value = '2' where key = 'line_capacity'");
  await join(db, 1, 'Ada', MORNING); await join(db, 2, 'Grace', MORNING);
  await assert.rejects(join(db, 3, 'Linus', MORNING), /line_full/);
});

test('at Riga midnight the first five are archived in order and the line is cleared', async () => {
  const db = await fresh();
  for (let i = 1; i <= 7; i++) await join(db, i, `Guest ${i}`, `2026-10-24T0${i}:00:00Z`);
  const after = '2026-10-24T21:00:01Z'; // 00:00:01 on 25 October in Riga (still UTC+3)
  const view = await snapshot(db, 1, after);
  assert.equal(view.date, '2026-10-25');
  assert.equal(view.total, 0);
  assert.equal(view.me, null);
  const latest = await archive(db, after);
  assert.equal(latest.date, '2026-10-24');
  assert.deepEqual(latest.entries.map((e) => [e.position, e.name]), [[1, 'Guest 1'], [2, 'Guest 2'], [3, 'Guest 3'], [4, 'Guest 4'], [5, 'Guest 5']]);
});

test('one second before Riga midnight nothing is archived yet', async () => {
  const db = await fresh();
  await join(db, 1, 'Ada', MORNING);
  assert.equal((await snapshot(db, 1, '2026-10-24T20:59:59Z')).total, 1);
  assert.equal(await archiveRows(db), 0);
});

test('a retried rollover (cron plus a request at the same time) neither erases nor duplicates', async () => {
  const db = await fresh();
  for (let i = 1; i <= 6; i++) await join(db, i, `Guest ${i}`, MORNING);
  const after = '2026-10-24T21:30:00Z';
  await Promise.all([db.query('select public.rollover_queue($1::timestamptz)', [after]), db.query('select public.rollover_queue($1::timestamptz)', [after])]);
  await db.query('select public.rollover_queue($1::timestamptz)', [after]);
  assert.equal(await archiveRows(db), 5);
  assert.equal((await archive(db, after)).entries.length, 5);
});

test('fewer than five people are archived as they are, and a day nobody joined is honestly empty', async () => {
  const db = await fresh();
  await join(db, 1, 'Ada', MORNING); await join(db, 2, 'Grace', MORNING);
  assert.deepEqual((await archive(db, '2026-10-24T22:00:00Z')).entries.map((e) => e.name), ['Ada', 'Grace']);
  assert.deepEqual(await archive(db, '2026-10-26T10:00:00Z'), { date: '2026-10-25', entries: [] });
});

test('the business day follows Riga through the end of summer time', async () => {
  const db = await fresh();
  const today = async (at: string) => (await db.query<{ d: string }>('select public.business_today($1::timestamptz)::text as d', [at])).rows[0].d;
  assert.equal(await today('2026-10-25T21:59:59Z'), '2026-10-25'); // 23:59:59, now UTC+2
  assert.equal(await today('2026-10-25T22:00:00Z'), '2026-10-26');
});

test('the archive and line tables are closed to anonymous database roles', async () => {
  const db = await fresh();
  const rls = await db.query<{ relname: string; relrowsecurity: boolean }>("select relname, relrowsecurity from pg_class where relname in ('queue_entries','daily_archive','app_settings') order by relname");
  assert.ok(rls.rows.every((r) => r.relrowsecurity));
  const policies = await db.query<{ n: number }>("select count(*)::int as n from pg_policies where tablename in ('queue_entries','daily_archive','app_settings')");
  assert.equal(policies.rows[0].n, 0);
});
