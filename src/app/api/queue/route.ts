import { NextResponse } from 'next/server';
import { sameOrigin } from '@/lib/request-security';
import { displayNameSchema } from '@/lib/validation';
import { allowRequest } from '@/lib/guest';
import { adminClient, clientAddress, configured, guestKey } from '@/lib/supabase-server';

const limits = new Map<string, number[]>();
const READS = { limit: 120, windowMs: 60_000 }, WRITES = { limit: 12, windowMs: 10 * 60_000 };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const unavailable = () => json({ error: 'The shared line is not configured.' }, 503);

// The snapshot only ever contains positions, names, join times and a "mine" flag; never guest keys.
async function snapshot(key: string | null) {
  const { data, error } = await adminClient().rpc('queue_snapshot', { p_guest_key: key ?? '' });
  if (error) throw error;
  return data;
}

export async function GET() {
  if (!configured) return unavailable();
  if (!allowRequest(limits, `read:${await clientAddress()}`, Date.now(), READS)) return json({ error: 'Too many requests. Try again in a minute.' }, 429);
  try { return json(await snapshot(await guestKey({ create: false }))); }
  catch { return json({ error: 'Could not load the line.' }, 500); }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: 'Invalid request origin.' }, 403);
  if (!configured) return unavailable();
  if (!allowRequest(limits, `write:${await clientAddress()}`, Date.now(), WRITES)) return json({ error: 'Too many attempts. Try again in a few minutes.' }, 429);
  const body = await request.json().catch(() => null);
  const name = displayNameSchema.safeParse(body?.name);
  if (!name.success) return json({ error: name.error.issues[0]?.message ?? 'Enter a display name.' }, 400);
  const key = await guestKey({ create: true });
  const { error } = await adminClient().rpc('join_queue', { p_guest_key: key, p_name: name.data });
  if (error) return json({ error: error.message.includes('line_full') ? 'The line is full for today.' : 'Could not join the line.' }, error.message.includes('line_full') ? 409 : 500);
  try { return json(await snapshot(key)); } catch { return json({ error: 'Joined, but the line could not be loaded.' }, 500); }
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return json({ error: 'Invalid request origin.' }, 403);
  if (!configured) return unavailable();
  if (!allowRequest(limits, `write:${await clientAddress()}`, Date.now(), WRITES)) return json({ error: 'Too many attempts. Try again in a few minutes.' }, 429);
  const key = await guestKey({ create: false });
  if (key) {
    const { error } = await adminClient().rpc('leave_queue', { p_guest_key: key });
    if (error) return json({ error: 'Could not leave the line.' }, 500);
  }
  try { return json(await snapshot(key)); } catch { return json({ error: 'Could not load the line.' }, 500); }
}
