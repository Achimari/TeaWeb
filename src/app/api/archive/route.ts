// GET /api/archive: the first five of the most recently finished business day. Names, order and times only.
import { allowRead, configured, json, tooMany, unavailable } from '@/lib/server/api';
import { store } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!configured()) return unavailable();
  if (!(await allowRead())) return tooMany();
  try { return json(await store().archive()); }
  catch (error) { console.error('archive', error); return unavailable(); }
}
