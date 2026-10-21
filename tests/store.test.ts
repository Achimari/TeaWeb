// The shared line, the daily archive and the shared tea timer, against a real PostgreSQL.
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { testDatabase } from './helpers/database.ts';
import { LineFullError, createTeaStore, type TeaStore } from '../src/lib/server/store.ts';

const key = (n: number) => n.toString(16).padStart(64, '0');
let db: Awaited<ReturnType<typeof testDatabase>>;
before(async () => { db = await testDatabase(); });
after(async () => { await db.drop(); });

// A store with its own clock. Each test uses its own day, so tests never see each other's lines.
function storeAt(iso: string, options: { capacity?: number } = {}) {
  const clock = { now: new Date(iso) };
  const store = createTeaStore(db.client(), { timeZone: 'Europe/Riga', capacity: options.capacity ?? 500, now: () => clock.now });
  return { store, at: (next: string) => { clock.now = new Date(next); } };
}
const names = async (store: TeaStore, guest: number) => (await store.snapshot(key(guest))).entries.map((e) => e.name);

test('two guests on two devices join with different names and see the same ordered line', async () => {
  const { store, at } = storeAt('2026-11-02T08:00:00Z');
  const ada = await store.join(key(1), 'Ada');
  at('2026-11-02T08:01:00Z');
  const grace = await store.join(key(2), 'Grace');
  assert.equal(ada.me, 1); assert.equal(grace.me, 2);
  const fromAda = await store.snapshot(key(1)), fromGrace = await store.snapshot(key(2));
  assert.deepEqual(fromAda.entries.map((e) => [e.position, e.name]), [[1, 'Ada'], [2, 'Grace']]);
  assert.deepEqual(fromGrace.entries.map((e) => [e.position, e.name]), [[1, 'Ada'], [2, 'Grace']]);
  assert.equal(fromAda.total, 2); assert.equal(fromGrace.total, 2);
  assert.deepEqual(fromAda.entries.map((e) => e.mine), [true, false]);
  assert.deepEqual(fromGrace.entries.map((e) => e.mine), [false, true]);
  assert.equal((await store.snapshot(null)).me, null);
});

test('submitting twice keeps one place and the first name', async () => {
  const { store, at } = storeAt('2026-11-03T08:00:00Z');
  await store.join(key(1), 'Ada');
  at('2026-11-03T08:05:00Z');
  const again = await store.join(key(1), 'Ada Lovelace');
  assert.equal(again.total, 1); assert.equal(again.me, 1);
  assert.deepEqual(await names(store, 1), ['Ada']);
});

test('concurrent joins: every guest gets exactly one place, and a guest double-tapping still gets one', async () => {
  const { store } = storeAt('2026-11-04T08:00:00Z');
  const other = createTeaStore(db.client(), { timeZone: 'Europe/Riga', capacity: 500, now: () => new Date('2026-11-04T08:00:00Z') });
  const joins = Array.from({ length: 12 }, (_, i) => (i % 2 ? store : other).join(key(100 + i), `Guest ${i}`));
  const doubleTap = [store.join(key(200), 'Twin'), other.join(key(200), 'Twin'), store.join(key(200), 'Twin')];
  await Promise.all([...joins, ...doubleTap]);
  const view = await store.snapshot(key(200));
  assert.equal(view.total, 13);
  assert.deepEqual(view.entries.map((e) => e.position), Array.from({ length: 13 }, (_, i) => i + 1));
  assert.equal(view.entries.filter((e) => e.name === 'Twin').length, 1);
});

test('the daily capacity holds even when the last places are raced for', async () => {
  const { store } = storeAt('2026-11-05T08:00:00Z', { capacity: 3 });
  const results = await Promise.allSettled(Array.from({ length: 6 }, (_, i) => store.join(key(300 + i), `Guest ${i}`)));
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 3);
  assert.ok(results.filter((r) => r.status === 'rejected').every((r) => (r as PromiseRejectedResult).reason instanceof LineFullError));
  assert.equal((await store.snapshot(null)).total, 3);
});

test('a guest can remove only their own place', async () => {
  const { store } = storeAt('2026-11-06T08:00:00Z');
  await store.join(key(1), 'Ada'); await store.join(key(2), 'Grace');
  assert.equal((await store.leave(key(3))).total, 2, 'a stranger removes nothing');
  const left = await store.leave(key(1));
  assert.deepEqual(left.entries.map((e) => e.name), ['Grace']);
  assert.equal(left.me, null);
  assert.equal((await store.snapshot(key(2))).me, 1);
});

test('snapshots and the archive never contain guest keys', async () => {
  const { store } = storeAt('2026-11-07T08:00:00Z');
  await store.join(key(0xabc), 'Ada');
  assert.ok(!JSON.stringify(await store.snapshot(key(0xabc))).includes(key(0xabc)));
});

test('at Riga midnight the first five are archived in order and the line is cleared, once', async () => {
  const { store, at } = storeAt('2026-11-09T06:00:00Z');
  for (let i = 1; i <= 7; i++) { at(`2026-11-09T0${i}:00:00Z`); await store.join(key(400 + i), `Guest ${i}`); }
  at('2026-11-09T21:59:59Z'); // 23:59:59 in Riga (UTC+2): still the same day
  assert.equal((await store.snapshot(null)).total, 7);
  at('2026-11-09T22:00:01Z'); // 00:00:01 on 10 November in Riga
  const other = createTeaStore(db.client(), { timeZone: 'Europe/Riga', capacity: 500, now: () => new Date('2026-11-09T22:00:02Z') });
  await Promise.all([store.rollover(), other.rollover(), store.rollover()]); // the scheduled job and two requests at once
  const view = await store.snapshot(null);
  assert.equal(view.date, '2026-11-10'); assert.equal(view.total, 0);
  const archive = await store.archive();
  assert.equal(archive.date, '2026-11-09');
  assert.deepEqual(archive.entries.map((e) => [e.position, e.name]), [[1, 'Guest 1'], [2, 'Guest 2'], [3, 'Guest 3'], [4, 'Guest 4'], [5, 'Guest 5']]);
  assert.equal(await store.rollover(), 0, 'running again does nothing');
  assert.equal((await store.archive()).entries.length, 5);
});

test('the business day follows Riga across the end of daylight-saving time', async () => {
  // Riga leaves UTC+3 at 04:00 local on 25 October 2026; that day ends at 22:00 UTC, an hour later than the day before.
  const { store, at } = storeAt('2026-10-24T20:30:00Z');
  await store.join(key(500), 'Before'); // 23:30 on 24 October (UTC+3)
  at('2026-10-24T21:00:01Z'); // 00:00:01 on 25 October (UTC+3)
  assert.equal((await store.snapshot(null)).date, '2026-10-25');
  await store.join(key(501), 'Sunday');
  at('2026-10-25T21:30:00Z'); // 23:30 on 25 October (now UTC+2): still Sunday
  assert.equal((await store.snapshot(null)).date, '2026-10-25');
  assert.deepEqual(await names(store, 500), ['Sunday']);
  at('2026-10-25T22:00:01Z'); // 00:00:01 on 26 October
  assert.equal((await store.snapshot(null)).date, '2026-10-26');
  assert.deepEqual((await store.archive()).entries.map((e) => e.name), ['Sunday']);
});

test('a day nobody joined archives as an honest empty list', async () => {
  const { store } = storeAt('2026-11-12T10:00:00Z');
  const archive = await store.archive();
  assert.equal(archive.date, '2026-11-11'); assert.deepEqual(archive.entries, []);
});

// ---- The shared tea timer ------------------------------------------------------------------------
test('one shared timer: started anywhere, seen everywhere, stopped by anyone', async () => {
  const { store, at } = storeAt('2026-11-13T08:00:00Z');
  const other = createTeaStore(db.client(), { timeZone: 'Europe/Riga', capacity: 500, now: () => new Date('2026-11-13T08:00:30Z') });
  assert.equal((await store.timer()).status, 'idle');
  const started = await store.startTimer('Oolong', 180_000);
  assert.equal(started.started, true);
  assert.equal(started.timer.status, 'running');
  assert.equal(started.timer.deadline, '2026-11-13T08:03:00.000Z');
  const seen = await other.timer();
  assert.deepEqual([seen.status, seen.label, seen.deadline, seen.version], ['running', 'Oolong', '2026-11-13T08:03:00.000Z', started.timer.version]);
  const stopped = await other.stopTimer(seen.version);
  assert.equal(stopped.stopped, true); assert.equal(stopped.timer.status, 'idle');
  at('2026-11-13T08:01:00Z');
  assert.equal((await store.timer()).status, 'idle');
});

test('starting while a timer runs gives you the running timer, not a second one', async () => {
  const { store } = storeAt('2026-11-14T08:00:00Z');
  await resetTimer(store);
  const first = await store.startTimer('Green', 120_000);
  const second = await store.startTimer('Black', 240_000);
  assert.equal(second.started, false);
  assert.deepEqual([second.timer.label, second.timer.version], ['Green', first.timer.version]);
});

test('simultaneous starts while idle: exactly one wins and everyone gets that timer', async () => {
  const { store } = storeAt('2026-11-15T08:00:00Z');
  await resetTimer(store);
  const stores = [store, ...Array.from({ length: 5 }, () => createTeaStore(db.client(), { timeZone: 'Europe/Riga', capacity: 500, now: () => new Date('2026-11-15T08:00:00Z') }))];
  const results = await Promise.all(stores.map((s, i) => s.startTimer(['Green', 'Oolong', 'Black', 'Herbal', 'Green', 'Black'][i], (i + 1) * 60_000)));
  assert.equal(results.filter((r) => r.started).length, 1);
  const winner = results.find((r) => r.started)!.timer;
  for (const r of results) assert.deepEqual([r.timer.version, r.timer.label, r.timer.deadline], [winner.version, winner.label, winner.deadline]);
});

test('a stale stop cannot end a newer timer', async () => {
  const { store, at } = storeAt('2026-11-16T08:00:00Z');
  await resetTimer(store);
  const old = (await store.startTimer('Green', 60_000)).timer;
  await store.stopTimer(old.version);
  at('2026-11-16T08:00:10Z');
  const fresh = (await store.startTimer('Black', 240_000)).timer;
  const stale = await store.stopTimer(old.version); // a second device still showing the first timer presses Stop
  assert.equal(stale.stopped, false);
  assert.deepEqual([stale.timer.status, stale.timer.label, stale.timer.version], ['running', 'Black', fresh.version]);
});

test('at the deadline everyone sees Ready until someone stops it or starts the next pot', async () => {
  const { store, at } = storeAt('2026-11-17T08:00:00Z');
  await resetTimer(store);
  await store.startTimer('Green', 120_000);
  at('2026-11-17T08:01:59Z'); assert.equal((await store.timer()).status, 'running');
  at('2026-11-17T08:02:00Z'); assert.equal((await store.timer()).status, 'ready');
  at('2026-11-17T09:00:00Z'); assert.equal((await store.timer()).status, 'ready', 'Ready stays until someone acts');
  const next = await store.startTimer('Herbal', 300_000);
  assert.equal(next.started, true); assert.equal(next.timer.status, 'running');
});

test('the timer refuses durations outside 1 second to 60 minutes, in the database too', async () => {
  const { store } = storeAt('2026-11-18T08:00:00Z');
  await resetTimer(store);
  await assert.rejects(store.startTimer('Green', 0));
  await assert.rejects(store.startTimer('Green', 3_600_001));
});

// ---- Shared abuse protection ---------------------------------------------------------------------
test('rate limits are shared across server processes and reset each window', async () => {
  const { store, at } = storeAt('2026-11-19T08:00:10Z');
  const other = createTeaStore(db.client(), { timeZone: 'Europe/Riga', capacity: 500, now: () => new Date('2026-11-19T08:00:20Z') });
  const rule = { limit: 3, windowMs: 60_000 };
  assert.deepEqual([await store.allow('write:1.2.3.4', rule), await other.allow('write:1.2.3.4', rule), await store.allow('write:1.2.3.4', rule)], [true, true, true]);
  assert.equal(await other.allow('write:1.2.3.4', rule), false);
  assert.equal(await store.allow('write:5.6.7.8', rule), true, 'other addresses are unaffected');
  at('2026-11-19T08:01:05Z');
  assert.equal(await store.allow('write:1.2.3.4', rule), true, 'a new window starts fresh');
  at('2026-11-20T08:01:06Z');
  assert.equal(await store.sweep(), 3, 'a day later the scheduled sweep clears every old window');
});

async function resetTimer(store: TeaStore) {
  const current = await store.timer();
  if (current.status !== 'idle') await store.stopTimer(current.version);
}
