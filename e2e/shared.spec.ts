// The shared line and the shared timer, seen from two isolated browsers (two guests with separate cookies).
import { expect, test, type Browser, type Page } from '@playwright/test';

const RUN = String(Date.now() % 100000);
async function device(browser: Browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  await page.waitForSelector('.stage[data-status="ready"]');
  return { context, page };
}
const state = (page: Page) => page.evaluate(async () => (await fetch('/api/state')).json());
const api = (page: Page, method: string, path: string, body?: unknown) => page.evaluate(async ({ method, path, body }) => {
  const r = await fetch(path, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: r.status, body: await r.json() };
}, { method, path, body });

test('two devices share one ordered line, and nobody holds two places', async ({ browser }) => {
  const a = await device(browser), b = await device(browser);
  for (const [d, name] of [[a, `Ada ${RUN}`], [b, `Ben ${RUN}`]] as const) {
    await d.page.getByRole('button', { name: /^join the line/i }).first().click();
    await d.page.locator('#display-name').fill(name);
    await d.page.getByRole('button', { name: /^join the line$/i }).last().click();
    await expect(d.page.locator('.roster li.mine')).toContainText(name);
  }
  const [sa, sb] = [await state(a.page), await state(b.page)];
  const names = (s: { line: { entries: { name: string }[] } }) => s.line.entries.map((e) => e.name);
  expect(sa.line.total).toBe(sb.line.total);
  expect(names(sa)).toEqual(names(sb));
  expect(names(sa).indexOf(`Ada ${RUN}`)).toBeLessThan(names(sa).indexOf(`Ben ${RUN}`));
  expect(sb.line.me).toBe(sa.line.me! + 1);
  // A second join from the same guest (another tab, a retry, a new name) keeps the one place.
  const again = await api(a.page, 'POST', '/api/queue', { name: `Ada again ${RUN}` });
  expect(again.body.line.total).toBe(sa.line.total);
  expect(again.body.line.me).toBe(sa.line.me);
  expect(JSON.stringify(again.body)).not.toMatch(/[0-9a-f]{64}/); // no guest key or hash in any response
  for (const d of [a, b]) await api(d.page, 'DELETE', '/api/queue');
  await a.context.close(); await b.context.close();
});

test('one timer for both devices: either can stop it, and a stale stop cannot end a newer timer', async ({ browser }) => {
  const a = await device(browser), b = await device(browser);
  const now = await state(a.page);
  if (now.timer.status !== 'idle') await api(a.page, 'DELETE', '/api/timer', { version: now.timer.version });
  await a.page.getByRole('button', { name: /^tea timer/i }).click();
  await a.page.getByRole('button', { name: /^oolong/i }).click();
  await expect(b.page.locator('.hotspot-spout .hotspot-badge')).toHaveText(/^[23]:\d\d$/); // B sees it with its panel closed
  const first = (await state(b.page)).timer;
  // B stops it from its own screen; A's screen clears.
  await b.page.getByRole('button', { name: /^tea timer/i }).click();
  await b.page.getByRole('button', { name: /stop the timer/i }).click();
  await expect(a.page.locator('.clock')).toHaveCount(0);
  await expect(a.page.getByRole('heading', { name: /^tea timer$/i })).toBeVisible();
  // A starts a new pot; a Stop still aimed at the first timer's version changes nothing.
  await a.page.getByRole('button', { name: /^green/i }).click();
  const stale = await api(b.page, 'DELETE', '/api/timer', { version: first.version });
  expect(stale.body.stopped).toBe(false);
  expect(stale.body.timer.status).toBe('running');
  expect(stale.body.timer.label).toBe('Green');
  await expect(b.page.locator('.clock')).toBeVisible();
  await api(a.page, 'DELETE', '/api/timer', { version: stale.body.timer.version });
  await a.context.close(); await b.context.close();
});

test('the first five come from the previous business day in Riga', async ({ page }) => {
  await page.goto('/');
  const archive = await api(page, 'GET', '/api/archive');
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Riga' }).format(new Date());
  const yesterday = new Date(`${today}T12:00:00Z`); yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  expect(archive.status).toBe(200);
  expect(archive.body.date).toBe(yesterday.toISOString().slice(0, 10));
  expect(archive.body.entries.length).toBeLessThanOrEqual(5);
});
