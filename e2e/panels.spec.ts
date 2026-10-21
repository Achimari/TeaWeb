// Panel usability in a real browser, against the shared PostgreSQL line and timer. Two isolated contexts are two
// separate guests (separate cookies). Tests leave the shared timer idle when they finish.
import { expect, test, type Browser, type Page } from '@playwright/test';

// Names unique to this run, so guests left in the shared line by an earlier, interrupted run can't confuse a check.
const RUN = String(Date.now() % 100000);
const named = (name: string) => `${name} ${RUN}`;
async function load(page: Page, width: number, height: number) {
  await page.setViewportSize({ width, height });
  await page.goto('/');
  await page.waitForSelector('.stage[data-status="ready"]');
  await page.evaluate(() => document.fonts.ready);
}
async function guest(browser: Browser, width = 1440, height = 900) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await load(page, width, height);
  return { context, page };
}
async function join(page: Page, name: string) {
  await page.getByRole('button', { name: /^join the line/i }).first().click();
  await page.locator('#display-name').fill(name);
  await page.getByRole('button', { name: /^join the line$/i }).last().click();
  await expect(page.locator('.roster li.mine')).toBeVisible();
  await page.keyboard.press('Escape');
}
async function leave(page: Page) {
  await page.getByRole('button', { name: /^join the line/i }).first().click();
  await page.getByRole('button', { name: /leave the line/i }).click();
  await page.keyboard.press('Escape');
}
async function idleTimer(page: Page) {
  await page.evaluate(async () => {
    const state = await (await fetch('/api/state')).json();
    if (state.timer.status !== 'idle') await fetch('/api/timer', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ version: state.timer.version }) });
  });
}

for (const [width, height] of [[1440, 900], [390, 844], [320, 568]]) {
  test(`no sideways scrolling at ${width}×${height}`, async ({ page }) => {
    await load(page, width, height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
  });
}

test('on a short phone the custom time and Start are within the sheet, without scrolling it', async ({ page }) => {
  await load(page, 320, 568);
  await idleTimer(page);
  await page.reload(); await page.waitForSelector('.stage[data-status="ready"]');
  await page.getByRole('button', { name: /^tea timer/i }).click();
  const panel = page.getByRole('dialog');
  await expect(panel.getByRole('button', { name: /^start$/i })).toBeVisible();
  const [sheet, start, minutes] = await Promise.all([panel.boundingBox(), panel.getByRole('button', { name: /^start$/i }).boundingBox(), panel.getByLabel('Minutes').boundingBox()]);
  expect(start!.y + start!.height).toBeLessThanOrEqual(sheet!.y + sheet!.height);
  expect(minutes!.y + minutes!.height).toBeLessThanOrEqual(sheet!.y + sheet!.height);
  expect(await panel.evaluate((p) => p.scrollTop)).toBe(0);
});

test('desktop panels use their height: the last content sits at the foot, not half way down', async ({ page }) => {
  await load(page, 1440, 900);
  await idleTimer(page);
  for (const name of [/^tea timer/i, /^join the line/i, /^the first five/i]) {
    await page.getByRole('button', { name }).first().click();
    await expect(page.locator('.panel .loading')).toHaveCount(0);
    const gap = await page.evaluate(() => {
      const panel = document.querySelector('.panel')!, inner = panel.getBoundingClientRect().bottom - parseFloat(getComputedStyle(panel).paddingBottom);
      const bottoms = [...panel.querySelectorAll('.panel-body > *')].map((n) => n.getBoundingClientRect().bottom);
      return inner - Math.max(...bottoms);
    });
    expect(gap, `${name} leaves ${Math.round(gap)}px empty under its content`).toBeLessThanOrEqual(24);
    await page.keyboard.press('Escape');
  }
});

test('before joining you can see who is already in today’s line', async ({ browser }) => {
  const host = await guest(browser), visitor = await guest(browser);
  await join(host.page, named('Hazel'));
  await visitor.page.getByRole('button', { name: /^join the line/i }).first().click();
  const panel = visitor.page.getByRole('dialog');
  await expect(panel.getByRole('list', { name: /today’s line/i })).toContainText(named('Hazel'));
  await expect(panel.locator('#display-name')).toBeVisible();
  await leave(host.page);
  await expect(panel.getByRole('list', { name: /today’s line/i })).not.toContainText(named('Hazel'));
  await host.context.close(); await visitor.context.close();
});

test('live updates from other people never move your focus', async ({ browser }) => {
  const other = await guest(browser), me = await guest(browser);
  await idleTimer(me.page);
  await join(other.page, named('Otto'));
  await join(me.page, named('Mia')); // Mia is behind Otto

  // Typing a name for a friend's visit? No: typing a custom time while the line changes under you.
  await me.page.getByRole('button', { name: /^tea timer/i }).click();
  const minutes = me.page.getByLabel('Minutes');
  await minutes.fill('7');
  await leave(other.page); // Mia moves up a place
  await expect(me.page.locator('.hotspot-body .hotspot-badge')).not.toHaveText('2nd');
  await expect(minutes).toBeFocused();
  await expect(minutes).toHaveValue('7');

  // Typing a name while other people join and leave.
  await me.page.keyboard.press('Escape');
  await leave(me.page);
  await me.page.getByRole('button', { name: /^join the line/i }).first().click();
  const name = me.page.locator('#display-name');
  await name.fill('Mi');
  await join(other.page, named('Otto'));
  await expect(me.page.getByRole('list', { name: /today’s line/i })).toContainText(named('Otto'));
  await expect(name).toBeFocused();
  await expect(name).toHaveValue('Mi');

  await leave(other.page);
  await other.context.close(); await me.context.close();
});

test('an action you take moves focus to what replaced it; closing returns focus to the callout', async ({ page }) => {
  await load(page, 1440, 900);
  await idleTimer(page);
  await page.getByRole('button', { name: /^tea timer/i }).click();
  await expect(page.getByRole('button', { name: /^green/i })).toBeFocused(); // first open
  await page.getByRole('button', { name: /^green/i }).click();
  await expect(page.getByRole('button', { name: /stop the timer/i })).toBeFocused(); // your start replaced the presets
  await page.getByRole('button', { name: /stop the timer/i }).click();
  await expect(page.getByRole('button', { name: /^green/i })).toBeFocused(); // your stop brought them back
  await page.keyboard.press('Escape');
  await expect(page.locator('.hotspot-spout')).toBeFocused();
});
