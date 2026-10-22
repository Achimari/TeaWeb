// Prisma 7 no longer accepts `url` in the datasource block, so the CLI reads the
// connection string from here. This is for Migrate only: the server builds its
// own PrismaPg driver adapter from the same DATABASE_URL (src/lib/server/db.ts),
// so nothing at runtime depends on this file.
//
// Deliberately a plain object rather than `defineConfig` from 'prisma/config':
// the droplet applies migrations from the release bundle, which carries no
// devDependencies, so an import here would fail to resolve there.
export default {
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env.DATABASE_URL ?? '' },
};
