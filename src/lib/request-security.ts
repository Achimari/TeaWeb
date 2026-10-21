// Cross-site write protection for the API routes. Behind the proxy the Node server sees an internal
// http:// URL while the browser's Origin is https://, so the Origin is compared with the Host header
// (passed through by the proxy) rather than with the request URL. Fetch Metadata is checked first.
export function sameOrigin(request: Request): boolean {
  const site = request.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin' && site !== 'none') return false;
  const origin = request.headers.get('origin');
  if (!origin) return true; // not sent by a page: no visitor's cookie to ride on
  if (origin === 'null') return false;
  const host = request.headers.get('host') ?? new URL(request.url).host;
  try { return new URL(origin).host === host; } catch { return false; }
}
