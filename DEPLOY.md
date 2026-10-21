# Deploy The Tea Party

The app is a Next.js site with server API routes and a PostgreSQL database (Prisma ORM 7). It is self-hosted on a droplet behind Caddy: on every push to `main`, `.github/workflows/deploy.yml` runs the checks, builds a standalone Node server (`output: 'standalone'`), and ships it to the droplet, where a forced-command receiver replaces the release and restarts the container. Use Node 24 (see `.nvmrc`). Do not configure a static export: the line, the timer and their live updates need the server.

There is only one mode now: the shared line and the shared timer in PostgreSQL. There is no browser-only preview and no `NEXT_PUBLIC_TEA_MODE`. If the database is unreachable, the site says so and disables joining and the timer.

## Checks before a release

CI runs these; run them locally before pushing schema changes:

```bash
npm ci                                   # also generates Prisma Client
npm run lint
npm run typecheck
npm test                                 # needs TEST_DATABASE_URL (a PostgreSQL server; see README)
npm audit --omit=dev --audit-level=high
npm run build
```

In CI, `npm test` uses a PostgreSQL 17 service container (`TEST_DATABASE_URL` in the workflow). No secret is needed for it.

## One-time setup on the droplet (you need SSH access as root)

These steps are not in the repository because they change the droplet itself.

1. **PostgreSQL.** Install PostgreSQL 14 or newer on the droplet (for example `apt install postgresql`), or use a managed PostgreSQL that the droplet can reach. Create a database and a role for the app with a long random password:

   ```sql
   CREATE ROLE tea WITH LOGIN PASSWORD '<long random password>';
   CREATE DATABASE tea OWNER tea;
   ```

   Keep PostgreSQL listening on localhost (or a private network) only; the app is its only client. The droplet has 961 MiB of RAM and already runs another app, so keep PostgreSQL's settings modest (the app opens at most 5 pooled connections plus one listening connection per server process).

2. **Environment for the app container.** Add these to the environment the `teaweb-deploy` receiver starts the container with (its env file or `docker run --env-file`). They are read at runtime, so changing them needs a restart, not a rebuild:

   ```text
   DATABASE_URL=postgresql://tea:<password>@<host>:5432/tea
   BUSINESS_TIMEZONE=Europe/Riga
   # optional: LINE_CAPACITY=500
   ```

   If PostgreSQL runs on the droplet's host and the app in a container, `<host>` is the host as seen from the container (for example `host.docker.internal` with `--add-host=host.docker.internal:host-gateway`, or the Docker bridge gateway), and PostgreSQL must accept that address in `pg_hba.conf`. Never put `DATABASE_URL` in Git or in a `NEXT_PUBLIC_` variable.

3. **Create the tables.** Run the migrations once now, and again after any release that adds a file under `prisma/migrations/`. The standalone release does not include the Prisma CLI, so run it from a checkout with access to the database. From your machine, through an SSH tunnel:

   ```bash
   ssh -N -L 15432:localhost:5432 root@206.81.29.175 &       # if PostgreSQL is on the droplet
   DATABASE_URL="postgresql://tea:<password>@localhost:15432/tea" npx prisma migrate deploy
   ```

   `prisma migrate deploy` (Prisma 7.10.0) applies only pending migrations, never resets data, and records what it applied in `_prisma_migrations`.

4. **Caddy.** The existing `reverse_proxy` to the app is enough. Two behaviours this app relies on are Caddy's defaults: it passes the `Host` header through (used for the same-origin check on writes), and it sets `X-Forwarded-For` to the real client address, ignoring any value the client sent (used for rate limits). Server-Sent Events at `/api/events` stream through `reverse_proxy` as they are; do not add response buffering in front of it.

5. **Remove the old build-time variables.** The repository variables `TEA_MODE` and `BUSINESS_TIMEZONE` that the old workflow read are no longer used and can be deleted from the GitHub repository settings.

## Moving an existing Supabase line (only if a live Supabase database exists)

The old workflow built in `demo` mode unless the `TEA_MODE` repository variable was `supabase`, so check that variable first: in `demo` mode every visitor's line lived only in their own browser and there is nothing to move.

If a Supabase project did hold the live line:

1. You need its Postgres connection string (Supabase dashboard → **Connect**; the session pooler or direct connection, ending in `?sslmode=require`). Its default `postgres` user can read `public.queue_entries` and `public.daily_archive`; nothing is written there.
2. Create and migrate the new database first (steps 1–3 above).
3. Dry run, then copy:

   ```bash
   SUPABASE_DB_URL="postgresql://postgres...?sslmode=require" DATABASE_URL="postgresql://tea:...@localhost:15432/tea" node scripts/import-from-supabase.mjs
   SUPABASE_DB_URL="..." DATABASE_URL="..." node scripts/import-from-supabase.mjs --apply
   ```

   The copy runs in one transaction and skips rows that are already there, so re-running is harmless. Guest keys are copied unchanged: they are hashes of the same `tea_guest` cookie, so returning guests on the same domain keep their place.
4. Supabase is left exactly as it was. Delete that project yourself only once you are satisfied; nothing here deletes it.

## After deploying

Open the site over HTTPS and check, ideally in two browsers (or one normal and one private window):

1. The teapot and cup render; turning works.
2. `/api/state` returns JSON with a `line` and a `timer`, not a 503.
3. Join from both browsers with different names: both show the same ordered line and total.
4. Start the timer in one: the other shows the same countdown within a moment. Stop it in the other: the first clears.
5. Open the cup: the previous day's first five (or the honest empty state).

If an API request fails, check the container's logs (`docker logs`); database errors are logged there with the route name. A broken app release is rolled back by redeploying the previous commit; a schema change is reversed from a database backup taken before running `prisma migrate deploy` (take one with `pg_dump` before each migration).

## Limits

- Writes are rate-limited per client address in the database (shared by every process); reads per process. The daily capacity (500 by default) bounds the line whatever the traffic.
- Live updates hold one connection per open page and one database `LISTEN` connection per server process. That is fine for one droplet; on many servers PostgreSQL's notifications still reach every process, but each needs its own listening connection.
