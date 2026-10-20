// Anonymous guest identity: a random token in an HttpOnly cookie. The database stores only its hash,
// so neither a database read nor a log can be replayed as someone's identity.
import { createHash, randomBytes } from 'node:crypto';

export const GUEST_COOKIE = 'tea_guest';
export const newGuestToken = () => randomBytes(32).toString('base64url');
export const isGuestToken = (value: string | undefined): value is string => typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value);
export const hashGuestToken = (token: string) => createHash('sha256').update(token).digest('hex');

// A sliding-window limiter. ponytail: in-memory per server instance; move to the database or an edge store if this runs on many instances.
export function allowRequest(store: Map<string, number[]>, key: string, now: number, { limit, windowMs }: { limit: number; windowMs: number }): boolean {
  const recent = (store.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) { store.set(key, recent); return false; }
  recent.push(now); store.set(key, recent);
  return true;
}
