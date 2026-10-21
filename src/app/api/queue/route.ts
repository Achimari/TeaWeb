// POST /api/queue { name } joins today's line; DELETE /api/queue leaves it. Both answer with the new state.
// The guest is the HttpOnly cookie; the body only ever carries a display name, never an identity.
import { sameOrigin } from '@/lib/request-security';
import { displayNameSchema } from '@/lib/validation';
import { allowWrite, configured, readJson, json, teaState, tooMany, unavailable } from '@/lib/server/api';
import { guestKey } from '@/lib/server/guest';
import { LineFullError } from '@/lib/server/store';
import { store } from '@/lib/server/db';

export const dynamic = 'force-dynamic';
const refused = () => json({ error: 'This request did not come from the page.' }, 403);

export async function POST(request: Request) {
  if (!sameOrigin(request)) return refused();
  if (!configured()) return unavailable();
  const name = displayNameSchema.safeParse((await readJson(request) as { name?: unknown } | null)?.name);
  if (!name.success) return json({ error: name.error.issues[0]?.message ?? 'Enter a display name.' }, 400);
  try {
    if (!(await allowWrite('line'))) return tooMany();
    const key = (await guestKey({ create: true }))!;
    await store().join(key, name.data);
    return json(await teaState(key));
  } catch (error) {
    if (error instanceof LineFullError) return json({ error: 'The line is full for today.' }, 409);
    console.error('join', error); return unavailable();
  }
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return refused();
  if (!configured()) return unavailable();
  try {
    if (!(await allowWrite('line'))) return tooMany();
    const key = await guestKey({ create: false });
    if (key) await store().leave(key);
    return json(await teaState(key));
  } catch (error) { console.error('leave', error); return unavailable(); }
}
