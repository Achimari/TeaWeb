// GET /api/state: today's shared line (with your own place, if any), the shared timer and the server clock.
import { allowRead, configured, currentGuest, json, teaState, tooMany, unavailable } from '@/lib/server/api';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!configured()) return unavailable();
  if (!(await allowRead())) return tooMany();
  try { return json(await teaState(await currentGuest())); }
  catch (error) { console.error('state', error); return unavailable(); }
}
