import test from 'node:test';
import assert from 'node:assert/strict';
import { sameOrigin } from '../src/lib/request-security.ts';

// The app runs behind a proxy that terminates TLS: the Node server sees http://127.0.0.1:3000/... while the
// browser's Origin is https://tea.example. The Host header is what both agree on.
const post = (headers: Record<string, string>) => new Request('http://127.0.0.1:3000/api/queue', { method: 'POST', headers: { host: 'tea.example', ...headers } });

test('a write from the page itself is allowed behind a TLS-terminating proxy', () => {
  assert.equal(sameOrigin(post({ origin: 'https://tea.example', 'sec-fetch-site': 'same-origin' })), true);
  assert.equal(sameOrigin(post({ origin: 'https://tea.example' })), true, 'browsers without Fetch Metadata');
});

test('writes from other sites are refused', () => {
  assert.equal(sameOrigin(post({ origin: 'https://evil.example', 'sec-fetch-site': 'cross-site' })), false);
  assert.equal(sameOrigin(post({ origin: 'https://evil.example' })), false);
  assert.equal(sameOrigin(post({ origin: 'https://shop.tea.example', 'sec-fetch-site': 'same-site' })), false, 'a sibling subdomain is not the same origin');
  assert.equal(sameOrigin(post({ origin: 'null' })), false);
  assert.equal(sameOrigin(post({ 'sec-fetch-site': 'cross-site' })), false);
});

test('a request with no browser origin at all (a script, not a page) carries no visitor cookie to abuse, so it passes', () => {
  assert.equal(sameOrigin(post({})), true);
});
