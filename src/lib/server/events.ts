// Server-only: change notifications. Every write in the store runs pg_notify('tea_changes', 'line' | 'timer');
// each server process keeps ONE listening connection and fans the news out to its open pages (Server-Sent
// Events in /api/events). Pages then fetch /api/state once, so nobody polls every second.
import pg from 'pg';
import { CHANNEL } from './store';
import { databaseUrl } from './db';

type Listener = (kind: string) => void;
const cache = globalThis as unknown as { teaEvents?: { listeners: Set<Listener>; client: pg.Client | null; connecting: Promise<void> | null } };
const state = (cache.teaEvents ??= { listeners: new Set(), client: null, connecting: null });

async function connect(): Promise<void> {
  const client = new pg.Client({ connectionString: databaseUrl });
  client.on('notification', (message) => { if (message.channel === CHANNEL) for (const listener of state.listeners) listener(message.payload ?? 'change'); });
  // A dropped connection is replaced after a pause; pages reconnect their streams and refetch meanwhile.
  client.on('error', () => drop(client));
  client.on('end', () => drop(client));
  await client.connect();
  await client.query(`LISTEN ${CHANNEL}`);
  state.client = client;
}
function drop(client: pg.Client) {
  if (state.client !== client) return;
  state.client = null;
  client.end().catch(() => {});
  for (const listener of state.listeners) listener('reconnect');
  retry(2_000);
}
// While pages are listening, keep trying (2 s, doubling to 1 min). Once back, tell every page to refetch:
// it may have missed changes while the database was away.
function retry(delay: number) {
  if (!state.listeners.size) return;
  setTimeout(() => {
    ensureListening().then(() => { for (const listener of state.listeners) listener('reconnect'); }, () => retry(Math.min(delay * 2, 60_000)));
  }, delay);
}
export function ensureListening(): Promise<void> {
  if (state.client) return Promise.resolve();
  state.connecting ??= connect().finally(() => { state.connecting = null; });
  return state.connecting;
}

export function subscribe(listener: Listener): () => void {
  state.listeners.add(listener);
  return () => { state.listeners.delete(listener); };
}
export const openStreams = () => state.listeners.size;
