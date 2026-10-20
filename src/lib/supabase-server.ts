// Server-only access to Supabase with the service-role key (next/headers makes it unusable in the browser).
import { createClient } from '@supabase/supabase-js';
import { cookies, headers } from 'next/headers';
import { GUEST_COOKIE, hashGuestToken, isGuestToken, newGuestToken } from './guest';

const url = process.env.SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const configured = Boolean(url && service);

export function adminClient() {
  if (!url || !service) throw new Error('Supabase is not configured');
  return createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
}

// The guest's key is the hash of their cookie token. A new token is issued only when they join.
export async function guestKey({ create }: { create: boolean }): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(GUEST_COOKIE)?.value;
  if (isGuestToken(token)) return hashGuestToken(token);
  if (!create) return null;
  const fresh = newGuestToken();
  jar.set(GUEST_COOKIE, fresh, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 400 });
  return hashGuestToken(fresh);
}

// The first address in X-Forwarded-For, as set by the hosting proxy; used only for rate limiting.
export async function clientAddress(): Promise<string> {
  const list = (await headers()).get('x-forwarded-for');
  return list?.split(',')[0]?.trim() || 'local';
}
