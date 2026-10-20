# Deploy The Tea Party

The app is a Next.js site with server API routes. Vercel is the simplest host for this repository; keep its Next.js framework preset and default build/output settings. Use Node 24 (see `.nvmrc`). Do not configure a static export: the shared line needs the API routes.

## Before connecting a host

Run these checks from the project root:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm audit --omit=dev --audit-level=high
```

The generated 3D model at `public/models/teapot.glb`, fonts, and app icons are part of the source and must be committed. Local AI instructions, browser artifacts, secrets, build output, and the unused reference video are excluded by `.gitignore`; `.vercelignore` also excludes local context from direct CLI uploads.

## Choose the line mode before building

`NEXT_PUBLIC_TEA_MODE` is embedded in the browser bundle at build time. Changing the mode or business timezone requires a new deployment.

| Mode | Environment | What visitors see |
| --- | --- | --- |
| Browser-only preview | `NEXT_PUBLIC_TEA_MODE=demo` | The line is saved on that device only; the join panel says so. No database is required. |
| Shared line | `NEXT_PUBLIC_TEA_MODE=supabase` | Everyone uses the same daily line and previous-day archive. Configure Supabase first. |

For a shared deployment, create a Supabase project and run `supabase/schema.sql` in its SQL editor. Enable `pg_cron`, then run `supabase/cron.sql`; confirm the `tea-queue-rollover` job exists. If this database held the old account-based version, back it up and review the destructive migration in `supabase/migrations/2026-10-20-anonymous-line.sql` before running the schema.

Set these variables in the host's **Production** environment before the first build:

```text
NEXT_PUBLIC_TEA_MODE=supabase
NEXT_PUBLIC_BUSINESS_TIMEZONE=Europe/Riga
SUPABASE_URL=<your Supabase project URL>
SUPABASE_SERVICE_ROLE_KEY=<server-only service role key>
```

Set the same values for Preview deployments only if they should share the production line. Otherwise set `NEXT_PUBLIC_TEA_MODE=demo` for Preview. Keep `SUPABASE_SERVICE_ROLE_KEY` in the host's secret settings; never prefix it with `NEXT_PUBLIC_`, put it in Git, or send it to the browser. If the timezone changes, update `app_settings.business_timezone` in Supabase to the same IANA timezone.

## Deploy on Vercel

1. Push the Git repository to your chosen Git provider and import it as a Vercel project.
2. Select the project root and the **Next.js** preset. Leave Build Command and Output Directory at their detected defaults.
3. Add the environment variables above to the intended environments, then deploy. Vercel builds from the Git commit; no `vercel.json` is needed for this app.
4. Check the deployment URL over HTTPS. Open `/`, confirm the teapot and cup render, turn the pot, open the timer, join the line, and view the previous-day panel. In shared mode, `/api/queue` should return a line snapshot rather than a 503 response.
5. Check the host's function logs if an API request fails. For a broken app release, roll back to the previous deployment. Treat database migrations separately: restore from the pre-migration backup if a schema change must be reversed.

## Current limitation

The shared-line API has per-process, in-memory request limits. Those counters are not shared across serverless instances, so they are only a light abuse guard. The database's 500-place daily capacity and one-place-per-guest rule remain enforced. Add a shared rate limiter or host-level protection before inviting large public traffic.

The project has no connected Supabase credentials or Vercel account in this workspace, so the live database and hosted deployment must be configured in those services.
