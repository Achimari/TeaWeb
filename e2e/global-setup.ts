// The browser checks make many joins and timer changes from one address in a few minutes, more than the
// production rate limit allows. Clear only the counters (never the line or the archive) before a run.
import 'dotenv/config';
import pg from 'pg';

export default async function globalSetup() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query('DELETE FROM rate_limits');
  await client.end();
}
