// Opening and closing a panel must give back the same closed composition: the same camera framing, pot, cup,
// lid, the visitor's own rotation, and all three callouts. Positions are read from the rendered page: each pin
// sits on its part (so it moves if the camera, the pot or the cup moves) and each callout is its button.
import { expect, test, type Page } from '@playwright/test';

type Layout = { pins: number[][]; labels: number[][] };
const TOLERANCE = 2; // px: rounding of projected points
const PANELS = [{ part: 'Tea timer', name: /^tea timer/i }, { part: 'Join the line', name: /^join the line/i }, { part: 'The first five', name: /^the first five/i }];

async function layout(page: Page): Promise<Layout> {
  return page.evaluate(() => {
    const at = (selector: string) => [...document.querySelectorAll(selector)].map((node) => { const m = new DOMMatrix(getComputedStyle(node).transform); return [m.e, m.f]; });
    return { pins: at('.hotspot-pin'), labels: at('.hotspot') };
  });
}
// Settled: no turn and no transition running, and two reads a beat apart agree.
async function settled(page: Page): Promise<Layout> {
  let previous = '';
  for (let i = 0; i < 60; i++) {
    await page.waitForTimeout(150);
    if (await page.locator('.stage[data-turning], .stage[data-moving]').count()) continue;
    const now = JSON.stringify(await layout(page));
    if (now === previous) return JSON.parse(now);
    previous = now;
  }
  throw new Error('The composition never settled');
}
function expectSame(actual: Layout, expected: Layout, what: string) {
  for (const kind of ['pins', 'labels'] as const) {
    expected[kind].forEach(([x, y], i) => {
      const [ax, ay] = actual[kind][i];
      expect(Math.abs(ax - x) <= TOLERANCE && Math.abs(ay - y) <= TOLERANCE, `${what}: ${kind}[${i}] was (${Math.round(x)}, ${Math.round(y)}), now (${Math.round(ax)}, ${Math.round(ay)})`).toBe(true);
    });
  }
}
async function load(page: Page, width: number, height: number) {
  await page.setViewportSize({ width, height });
  await page.goto('/');
  await page.waitForSelector('.stage[data-status="ready"]');
  await page.evaluate(() => document.fonts.ready);
  return settled(page);
}
async function open(page: Page, name: RegExp) {
  await page.getByRole('button', { name }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
}
async function close(page: Page) {
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
}
async function turn(page: Page, steps: number) {
  await page.locator('.turntable').focus();
  for (let i = 0; i < steps; i++) await page.keyboard.press('ArrowRight');
}

for (const [width, height] of [[1440, 900], [390, 844], [320, 568]]) {
  test.describe(`${width}×${height}`, () => {
    test('each panel opens and closes back to the same composition', async ({ page }) => {
      const before = await load(page, width, height);
      for (const { part, name } of PANELS) {
        await open(page, name);
        const opened = await settled(page);
        if (width >= 700) expect(JSON.stringify(opened), `${part} changes the composition while open`).not.toBe(JSON.stringify(before));
        await close(page);
        expectSame(await settled(page), before, `after closing ${part}`);
      }
    });

    test('repeated cycles, switching panels and closing mid-transition all end where they began', async ({ page }) => {
      const before = await load(page, width, height);
      for (let i = 0; i < 3; i++) { await open(page, /^join the line/i); await settled(page); await close(page); }
      expectSame(await settled(page), before, 'after three open/close cycles');
      await open(page, /^tea timer/i); await settled(page);
      await close(page); await open(page, /^join the line/i); await settled(page); // switch through a closed moment
      await page.getByRole('button', { name: /close join the line/i }).click();
      expectSame(await settled(page), before, 'after switching panels');
      await open(page, /^join the line/i); await page.waitForTimeout(120); await close(page); // reversed mid-glide
      expectSame(await settled(page), before, 'after closing mid-transition');
    });

    test('the visitor’s rotation survives a panel', async ({ page }) => {
      await load(page, width, height);
      await turn(page, 4);
      const turned = await settled(page);
      for (const { name } of PANELS) { await open(page, name); await settled(page); await close(page); }
      expectSame(await settled(page), turned, 'after panels on a turned pot');
    });
  });
}

test('resizing while a panel is open closes to the fresh layout for the new size', async ({ page, browser }) => {
  await load(page, 1440, 900);
  await turn(page, 2);
  await settled(page);
  await open(page, /^join the line/i); await settled(page);
  await page.setViewportSize({ width: 1200, height: 800 });
  await settled(page);
  await close(page);
  const resized = await settled(page);
  const fresh = await browser.newPage();
  await load(fresh, 1200, 800);
  await turn(fresh, 2);
  expectSame(resized, await settled(fresh), 'after a resize while open');
  await fresh.close();
});

test('with reduced motion the panels still close back to the same composition', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  const before = await load(page, 1440, 900);
  for (const { part, name } of PANELS) {
    await open(page, name); await settled(page); await close(page);
    expectSame(await settled(page), before, `after closing ${part} with reduced motion`);
  }
  await context.close();
});
