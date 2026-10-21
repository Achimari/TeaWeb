// Server-only: the anonymous guest. A random token lives in an HttpOnly cookie; the database only ever sees
// its SHA-256 hash, and no response ever contains either. A token is issued only when the guest first joins.
import { cookies, headers } from 'next/headers';
import { GUEST_COOKIE, hashGuestToken, isGuestToken, newGuestToken } from '@/lib/guest';

export async function guestKey({ create }: { create: boolean }): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(GUEST_COOKIE)?.value;
  if (isGuestToken(token)) return hashGuestToken(token);
  if (!create) return null;
  const fresh = newGuestToken();
  jar.set(GUEST_COOKIE, fresh, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 400 });
  return hashGuestToken(fresh);
}

// The client's address as the proxy reports it, used only to key rate limits. The proxy in front (Caddy)
// replaces any X-Forwarded-For the client sends, so its first entry is the real peer.
export async function clientAddress(): Promise<string> {
  const list = (await headers()).get('x-forwarded-for');
  return list?.split(',')[0]?.trim() || 'local';
}
