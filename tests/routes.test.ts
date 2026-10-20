import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import nextConfig from '../next.config.ts';

test('old /dashboard links redirect to the single page', async () => {
  const redirects = await nextConfig.redirects!();
  assert.deepEqual(redirects.find(r => r.source === '/dashboard'), { source: '/dashboard', destination: '/', permanent: false });
});

test('there is no separate dashboard page to drift from /', () => {
  assert.equal(existsSync(new URL('../src/app/dashboard/page.tsx', import.meta.url)), false);
});
