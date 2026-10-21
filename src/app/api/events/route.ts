// GET /api/events: a Server-Sent Events stream that says "something changed" (line or timer) the moment it
// happens anywhere. It carries no data: the page then fetches /api/state. A comment every 25 seconds keeps
// proxies from closing an idle stream; the browser's EventSource reconnects by itself if it drops.
import { allowRequest } from '@/lib/guest';
import { configured, unavailable, tooMany } from '@/lib/server/api';
import { clientAddress } from '@/lib/server/guest';
import { ensureListening, openStreams, subscribe } from '@/lib/server/events';

export const dynamic = 'force-dynamic';
const opened = new Map<string, number[]>();
const MAX_STREAMS = 400; // per server process

export async function GET(request: Request) {
  if (!configured()) return unavailable();
  if (openStreams() >= MAX_STREAMS || !allowRequest(opened, await clientAddress(), Date.now(), { limit: 30, windowMs: 60_000 })) return tooMany();
  try { await ensureListening(); } catch (error) { console.error('events', error); return unavailable(); }
  const encoder = new TextEncoder();
  let cleanup = () => {};
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (text: string) => { try { controller.enqueue(encoder.encode(text)); } catch { cleanup(); } };
      send('retry: 3000\n\n');
      const unsubscribe = subscribe((kind) => send(`event: change\ndata: ${kind === 'timer' ? 'timer' : kind === 'line' ? 'line' : 'all'}\n\n`));
      const heartbeat = setInterval(() => send(': still here\n\n'), 25_000);
      cleanup = () => { clearInterval(heartbeat); unsubscribe(); try { controller.close(); } catch { /* already closed */ } };
      request.signal.addEventListener('abort', () => cleanup());
    },
    cancel() { cleanup(); },
  });
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' } });
}
