// A throwaway PostgreSQL database for one test file: created on the server named by TEST_DATABASE_URL,
// migrated with the same SQL Prisma Migrate applies (prisma/migrations), and dropped afterwards.
// Local: `npm run db:up` starts a PostgreSQL container; TEST_DATABASE_URL lives in .env. CI uses a service container.
import { readdirSync, readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client.ts';

const server = process.env.TEST_DATABASE_URL;

export async function testDatabase() {
  if (!server) throw new Error('TEST_DATABASE_URL is not set. Start PostgreSQL with `npm run db:up` (see README, "Checks").');
  const name = `tea_test_${randomBytes(6).toString('hex')}`;
  const admin = new pg.Client({ connectionString: server });
  await admin.connect();
  await admin.query(`CREATE DATABASE ${name}`);
  await admin.end();
  const url = new URL(server); url.pathname = `/${name}`;
  const connectionString = url.toString();

  const migrations = new URL('../../prisma/migrations/', import.meta.url);
  const setup = new pg.Client({ connectionString });
  await setup.connect();
  for (const dir of readdirSync(migrations).filter((d) => /^\d+_/.test(d)).sort()) await setup.query(readFileSync(new URL(`${dir}/migration.sql`, migrations), 'utf8'));
  await setup.end();

  const clients: PrismaClient[] = [];
  return {
    connectionString,
    // Each call is a separate client with its own connection pool, like a separate server process.
    client() { const c = new PrismaClient({ adapter: new PrismaPg({ connectionString, max: 10 }) }); clients.push(c); return c; },
    async drop() {
      await Promise.all(clients.map((c) => c.$disconnect()));
      const end = new pg.Client({ connectionString: server });
      await end.connect();
      await end.query(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
      await end.end();
    },
  };
}
