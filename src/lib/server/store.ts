// The shared line, the daily archive, the shared tea timer and the shared rate limits, in PostgreSQL via Prisma.
// Every function takes "now" from one injected clock, so the business day and the timer agree with each other.
// Races are settled by the database: a unique (guest, day) key, an advisory lock around capacity checks and
// rollover, and conditional single-statement updates for the timer.
import type { PrismaClient } from '../../generated/prisma/client.ts';
import { businessDate, previousDate } from '../day.ts';
import type { Archive, SharedTimer, Snapshot } from '../tea.ts';

export class LineFullError extends Error { constructor() { super('The line is full for today.'); } }

type Options = { timeZone: string; capacity: number; now?: () => Date };
type Rule = { limit: number; windowMs: number };
// Listeners (src/lib/server/events.ts) wake every open page when one of these changes.
export const CHANNEL = 'tea_changes';
const asDay = (date: string) => new Date(`${date}T00:00:00.000Z`); // a DATE column reads and writes as UTC midnight
const TX = { maxWait: 10_000, timeout: 10_000 };

export function createTeaStore(db: PrismaClient, { timeZone, capacity, now = () => new Date() }: Options) {
  const today = () => businessDate(now(), timeZone);

  // Archive every finished day's first five and clear it, in one transaction. The lock serialises the
  // scheduled job with request-time checks; the archive's primary key makes a retry a no-op.
  async function rollover(): Promise<number> {
    const cutoff = asDay(today());
    if (!(await db.queueEntry.findFirst({ where: { businessDate: { lt: cutoff } }, select: { id: true } }))) return 0;
    return db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('tea-queue-rollover'))`;
      const days = await tx.queueEntry.findMany({ where: { businessDate: { lt: cutoff } }, distinct: ['businessDate'], select: { businessDate: true }, orderBy: { businessDate: 'asc' } });
      for (const { businessDate: day } of days) {
        const firstFive = await tx.queueEntry.findMany({ where: { businessDate: day }, orderBy: [{ joinedAt: 'asc' }, { id: 'asc' }], take: 5, select: { displayName: true, joinedAt: true } });
        await tx.dailyArchive.createMany({ data: firstFive.map((e, i) => ({ businessDate: day, position: i + 1, displayName: e.displayName, joinedAt: e.joinedAt })), skipDuplicates: true });
        await tx.queueEntry.deleteMany({ where: { businessDate: day } });
      }
      if (days.length) await tx.$executeRaw`SELECT pg_notify(${CHANNEL}, 'line')`;
      return days.length;
    }, TX);
  }

  // Today's line as one guest sees it: names, order and join times, plus which place (if any) is theirs.
  async function snapshot(guestKey: string | null): Promise<Snapshot> {
    await rollover();
    const date = today();
    const rows = await db.queueEntry.findMany({ where: { businessDate: asDay(date) }, orderBy: [{ joinedAt: 'asc' }, { id: 'asc' }], select: { displayName: true, joinedAt: true, guestKey: true } });
    const entries = rows.map((r, i) => ({ position: i + 1, name: r.displayName, joinedAt: r.joinedAt.toISOString(), mine: guestKey !== null && r.guestKey === guestKey }));
    return { date, total: entries.length, me: entries.find((e) => e.mine)?.position ?? null, entries };
  }

  // One place per guest per day; a repeat keeps the first place and name. Joins take a lock so the
  // capacity check and the insert cannot interleave; the unique key covers the guest's own retries.
  async function join(guestKey: string, displayName: string): Promise<Snapshot> {
    await rollover();
    const day = asDay(today()), joinedAt = now();
    await db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('tea-queue-join'))`;
      if (await tx.queueEntry.findUnique({ where: { guestKey_businessDate: { guestKey, businessDate: day } }, select: { id: true } })) return;
      if ((await tx.queueEntry.count({ where: { businessDate: day } })) >= capacity) throw new LineFullError();
      await tx.queueEntry.create({ data: { guestKey, displayName, businessDate: day, joinedAt } });
      await tx.$executeRaw`SELECT pg_notify(${CHANNEL}, 'line')`;
    }, TX);
    return snapshot(guestKey);
  }

  // Removes only the caller's own place: the key comes from their own cookie, never from the request.
  async function leave(guestKey: string): Promise<Snapshot> {
    await rollover();
    const { count } = await db.queueEntry.deleteMany({ where: { guestKey, businessDate: asDay(today()) } });
    if (count) await db.$executeRaw`SELECT pg_notify(${CHANNEL}, 'line')`;
    return snapshot(guestKey);
  }

  // The first five of the most recently finished business day (yesterday). Empty if nobody joined.
  async function archive(): Promise<Archive> {
    await rollover();
    const date = previousDate(today());
    const rows = await db.dailyArchive.findMany({ where: { businessDate: asDay(date) }, orderBy: { position: 'asc' }, select: { position: true, displayName: true, joinedAt: true } });
    return { date, entries: rows.map((r) => ({ position: r.position, name: r.displayName, joinedAt: r.joinedAt.toISOString() })) };
  }

  async function timer(): Promise<SharedTimer> {
    const row = await db.sharedTimer.findUniqueOrThrow({ where: { id: 1 } });
    const status = row.deadline === null ? 'idle' : row.deadline.getTime() > now().getTime() ? 'running' : 'ready';
    return { version: row.version, status, label: row.label, durationMs: row.durationMs, startedAt: row.startedAt?.toISOString() ?? null, deadline: row.deadline?.toISOString() ?? null };
  }

  // Starts only when idle or finished. Postgres re-checks the condition after waiting on the row lock,
  // so of simultaneous starts exactly one updates; the others get the timer that won.
  async function startTimer(label: string, durationMs: number): Promise<{ started: boolean; timer: SharedTimer }> {
    if (!Number.isInteger(durationMs) || durationMs < 1_000 || durationMs > 3_600_000) throw new RangeError('The timer runs from 1 second to 60 minutes.');
    const at = now(), deadline = new Date(at.getTime() + durationMs);
    const { count } = await db.sharedTimer.updateMany({
      where: { id: 1, OR: [{ deadline: null }, { deadline: { lte: at } }] },
      data: { version: { increment: 1 }, label, durationMs, startedAt: at, deadline, updatedAt: at },
    });
    if (count) await db.$executeRaw`SELECT pg_notify(${CHANNEL}, 'timer')`;
    return { started: count === 1, timer: await timer() };
  }

  // Stops only the timer the caller saw: a Stop carrying an older version leaves a newer timer running.
  async function stopTimer(version: number): Promise<{ stopped: boolean; timer: SharedTimer }> {
    const at = now();
    const { count } = await db.sharedTimer.updateMany({
      where: { id: 1, version, deadline: { not: null } },
      data: { version: { increment: 1 }, label: null, durationMs: null, startedAt: null, deadline: null, updatedAt: at },
    });
    if (count) await db.$executeRaw`SELECT pg_notify(${CHANNEL}, 'timer')`;
    return { stopped: count === 1, timer: await timer() };
  }

  // A fixed-window counter in the database, so every server process shares one count per key.
  async function allow(key: string, { limit, windowMs }: Rule): Promise<boolean> {
    const windowStart = new Date(Math.floor(now().getTime() / windowMs) * windowMs);
    const [{ hits }] = await db.$queryRaw<{ hits: number }[]>`
      INSERT INTO "rate_limits" ("key", "window_start", "hits") VALUES (${key}, ${windowStart}, 1)
      ON CONFLICT ("key", "window_start") DO UPDATE SET "hits" = "rate_limits"."hits" + 1
      RETURNING "hits"`;
    return hits <= limit;
  }

  // Old rate-limit windows are useless after a day; the scheduled job clears them.
  async function sweep(): Promise<number> {
    return (await db.rateLimit.deleteMany({ where: { windowStart: { lt: new Date(now().getTime() - 86_400_000) } } })).count;
  }

  return { rollover, snapshot, join, leave, archive, timer, startTimer, stopTimer, allow, sweep };
}
export type TeaStore = ReturnType<typeof createTeaStore>;
