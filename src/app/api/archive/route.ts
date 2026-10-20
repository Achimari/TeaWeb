import { NextResponse } from 'next/server';
import { allowRequest } from '@/lib/guest';
import { adminClient, clientAddress, configured } from '@/lib/supabase-server';

const limits = new Map<string, number[]>();
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

// The first five of the most recently completed business day: names, order and join time only.
export async function GET() {
  if (!configured) return json({ error: 'The shared line is not configured.' }, 503);
  if (!allowRequest(limits, await clientAddress(), Date.now(), { limit: 120, windowMs: 60_000 })) return json({ error: 'Too many requests. Try again in a minute.' }, 429);
  const { data, error } = await adminClient().rpc('archive_latest');
  return error ? json({ error: 'Could not load the first five.' }, 500) : json(data);
}
