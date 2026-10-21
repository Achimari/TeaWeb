// Prisma ORM 7 CLI configuration (7.10+ names it prisma7.config.ts so it cannot clash with Prisma 8's format).
// The CLI does not load .env by itself; dotenv does it here for local work. Production sets DATABASE_URL directly.
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // `prisma generate` runs without a database (CI, npm install), so the URL is only required by commands that connect.
  datasource: { url: process.env.DATABASE_URL ?? '' },
});
