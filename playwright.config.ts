// Browser regression checks (e2e/). They run the production build against the PostgreSQL in DATABASE_URL:
//   npm run build && npm run test:e2e
import 'dotenv/config';
import { defineConfig } from '@playwright/test';

const PORT = 3210;
export default defineConfig({
  testDir: 'e2e',
  globalSetup: './e2e/global-setup.ts',
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: { baseURL: `http://localhost:${PORT}`, browserName: 'chromium' },
  webServer: {
    // The same standalone server CI ships to the droplet, with its static files beside it.
    command: `rm -rf .next/standalone/.next/static .next/standalone/public && cp -R .next/static .next/standalone/.next/static && cp -R public .next/standalone/public && node .next/standalone/server.js`,
    url: `http://localhost:${PORT}/api/state`,
    reuseExistingServer: false,
    timeout: 60_000,
    env: { PORT: String(PORT), HOSTNAME: 'localhost', DATABASE_URL: process.env.DATABASE_URL ?? '', BUSINESS_TIMEZONE: process.env.BUSINESS_TIMEZONE ?? 'Europe/Riga' },
  },
});
