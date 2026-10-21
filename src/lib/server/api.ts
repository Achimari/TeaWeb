// Server-only helpers shared by the API routes: JSON responses, the full state a page needs, and limits.
import { NextResponse } from 'next/server';
import { allowRequest } from '@/lib/guest';
import type { TeaState } from '@/lib/tea';
import { clientAddress, guestKey } from './guest';
import { databaseUrl, store, timeZone } from './db';

export const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export const unavailable = () => json({ error: 'The line and the timer are unavailable right now. Try again in a little while.' }, 503);
export const configured = () => Boolean(databaseUrl);

// Everything the page shows, for one guest. Never includes guest keys.
export async function teaState(key: string | null): Promise<TeaState> {
  const [line, timer] = await Promise.all([store().snapshot(key), store().timer()]);
  return { line, timer, serverNow: new Date().toISOString(), timeZone };
}
export const currentGuest = () => guestKey({ create: false });

// Reads are cheap and limited per server process. Writes are limited in the database, shared by every process.
const reads = new Map<string, number[]>();
export async function allowRead(): Promise<boolean> {
  return allowRequest(reads, await clientAddress(), Date.now(), { limit: 240, windowMs: 60_000 });
}
export async function allowWrite(kind: 'line' | 'timer'): Promise<boolean> {
  return store().allow(`${kind}:${await clientAddress()}`, kind === 'line' ? { limit: 20, windowMs: 10 * 60_000 } : { limit: 30, windowMs: 10 * 60_000 });
}
export const tooMany = () => json({ error: 'Too many requests. Try again in a few minutes.' }, 429);

// Request bodies here are a name or a tea: a few dozen bytes. Anything past 4 KB is refused unread.
export async function readJson(request: Request, limit = 4_096): Promise<unknown> {
  if (Number(request.headers.get('content-length')) > limit || !request.body) return null;
  const reader = request.body.getReader(), chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) { await reader.cancel(); return null; }
    chunks.push(value);
  }
  try { return JSON.parse(new TextDecoder().decode(Buffer.concat(chunks))); } catch { return null; }
}
