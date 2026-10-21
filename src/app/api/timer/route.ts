// The one shared tea timer. POST { tea } or { tea: 'Custom', durationMs } starts it if it is idle or finished;
// if another visitor's timer is running, you get that one back (started: false). DELETE { version } stops
// only the timer with that version, so a Stop pressed on an out-of-date screen can't end a newer pot.
import { sameOrigin } from '@/lib/request-security';
import { timerStartSchema, timerStopSchema } from '@/lib/validation';
import { allowWrite, configured, readJson, currentGuest, json, teaState, tooMany, unavailable } from '@/lib/server/api';
import { store } from '@/lib/server/db';

export const dynamic = 'force-dynamic';
const refused = () => json({ error: 'This request did not come from the page.' }, 403);

export async function POST(request: Request) {
  if (!sameOrigin(request)) return refused();
  if (!configured()) return unavailable();
  const start = timerStartSchema.safeParse(await readJson(request));
  if (!start.success) return json({ error: 'Pick a tea, or a time from 1 second to 60 minutes.' }, 400);
  try {
    if (!(await allowWrite('timer'))) return tooMany();
    const { started } = await store().startTimer(start.data.label, start.data.durationMs);
    return json({ started, ...(await teaState(await currentGuest())) });
  } catch (error) { console.error('timer start', error); return unavailable(); }
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return refused();
  if (!configured()) return unavailable();
  const stop = timerStopSchema.safeParse(await readJson(request));
  if (!stop.success) return json({ error: 'That timer could not be found.' }, 400);
  try {
    if (!(await allowWrite('timer'))) return tooMany();
    const { stopped } = await store().stopTimer(stop.data.version);
    return json({ stopped, ...(await teaState(await currentGuest())) });
  } catch (error) { console.error('timer stop', error); return unavailable(); }
}
