// Server-only: the PostgreSQL connection (DATABASE_URL), one Prisma client per server process, and the store.
// Nothing here reaches the browser bundle; credentials live only in the server's environment.
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';
import { BUSINESS_TIMEZONE } from '@/lib/day';
import { createTeaStore, type TeaStore } from './store';

export const databaseUrl = process.env.DATABASE_URL;
export const timeZone = BUSINESS_TIMEZONE;
const capacity = Number(process.env.LINE_CAPACITY) > 0 ? Math.floor(Number(process.env.LINE_CAPACITY)) : 500;

// Reused across hot reloads in development, so edits don't open a new pool each time.
const cache = globalThis as unknown as { teaStore?: TeaStore };
export function store(): TeaStore {
  if (!databaseUrl) throw new Error('DATABASE_URL is not set');
  cache.teaStore ??= createTeaStore(new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl, max: 5 }) }), { timeZone, capacity });
  return cache.teaStore;
}
