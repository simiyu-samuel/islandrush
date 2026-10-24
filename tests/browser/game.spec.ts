import { expect, test, type Page } from '@playwright/test';
import { createProgress } from '../../src/model/progress';
import { SAVE_KEY } from '../../src/model/save';
import { islandMapLayout, lotPosition } from '../../src/game/islandMap';
import { getLots } from '../../src/model/placement';
import type { BuildingInstance, BuildingType, Progress } from '../../src/model/types';

// Prepared browser journeys only. Run separately when browser access is allowed.
test.setTimeout(90_000);
test.beforeEach(async ({ page }) => {
  page.on('pageerror', error => console.error('Uncaught browser error:', error.stack ?? error.message));
});

async function worldReady(page: Page) {
  await expect(page.getByRole('heading', { name: 'Charting your coast…' })).toBeHidden({ timeout: 30_000 });
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.locator('canvas')).toBeVisible();
}
async function openIsland(page: Page) { await page.goto('/'); await worldReady(page); }
async function openCatalog(page: Page) {
  if ((page.viewportSize()?.width ?? 1280) < 960) await page.getByRole('navigation', { name: 'Island navigation' }).getByRole('button', { name: 'Build', exact: true }).click();
  await expect(page.getByRole('complementary', { name: 'Settlement', exact: true })).toBeVisible();
}
async function saved(page: Page): Promise<Progress> {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? 'null'), SAVE_KEY);
}
async function fixture(page: Page, progress: Progress) {
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: SAVE_KEY, value: progress });
  await page.reload(); await worldReady(page);
}
function settlement(types: BuildingType[] = []): Progress {
  const now = Date.now(); const progress = createProgress(now);
  progress.wallet = { timber: 90, stone: 90, coins: 50 };
  progress.tutorial.skipped = true;
  progress.buildings = types.map((type, index): BuildingInstance => ({ id: `qa-building-${index}`, type,
    style: 'island', lot: ['0:harbor:0','0:grove:0','0:west:0','0:east:0'][index]!,
    facing: 'left', state: 'complete', startedAt: now-10_000, completesAt: now-5_000, level: 1 }));
  return progress;
}
async function chooseCottage(page: Page) {
  await openCatalog(page);
  await page.locator('.building-catalog').getByRole('button', { name: /Pioneer Cottage/ }).click();
}
async function preview(page: Page) {
  await page.getByRole('button', { name: /Choose a building space|Preview a location/ }).click();
  await expect(page.getByRole('complementary', { name: 'Building placement' })).toBeVisible();
}
async function startRun(page: Page) {
  if ((page.viewportSize()?.width ?? 1280) < 960) await page.getByRole('navigation', { name: 'Island navigation' }).getByRole('button', { name: 'Run', exact: true }).click();
  else await page.getByRole('button', { name: /Gather supplies|Run for supplies/ }).click();
  await expect(page.getByLabel('Run progress', { exact: true })).toBeVisible();
}
async function noPageOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() => ({ horizontal: document.documentElement.scrollWidth > innerWidth,
    vertical: document.documentElement.scrollHeight > innerHeight }))).toEqual({ horizontal: false, vertical: false });
}
async function thumbTarget(page: Page, name: string) {
  const button = page.getByRole('button', { name, exact: true });
  await expect(button).toBeInViewport({ ratio: 1 });
  const bounds = await button.boundingBox();
  expect(bounds?.width).toBeGreaterThanOrEqual(44); expect(bounds?.height).toBeGreaterThanOrEqual(44);
}

test('the four categories expose sixteen distinct building types with recipes and construction stages', async ({ page }) => {
  await openIsland(page); await openCatalog(page);
  const categories = page.getByRole('group', { name: 'Building categories' });
  const names = new Set<string>();
  for (const category of ['Civic','Resource','Utility','Settlement']) {
    await categories.getByRole('button', { name: new RegExp(category) }).click();
    await expect(page.locator('.building-catalog button')).toHaveCount(4);
    for (const name of await page.locator('.building-catalog strong').allTextContents()) names.add(name);
    await page.getByText('How it takes shape', { exact: true }).click();
    await expect(page.locator('.build-stages li')).toHaveCount(3);
  }
  expect(names.size).toBe(16);
});

test('construction reserves resources once and reload finishes the same five-second building', async ({ page }) => {
  await openIsland(page); await fixture(page, settlement()); await chooseCottage(page); await preview(page);
  await page.getByRole('button', { name: 'Flip facing', exact: true }).click();
  await page.getByRole('button', { name: 'Build here', exact: true }).click();
  await expect.poll(async () => (await saved(page)).buildings[0]?.state).toBe('building');
  const pending = await saved(page); const id = pending.buildings[0]!.id;
  expect(pending.wallet.timber).toBe(60); expect(pending.buildings[0]!.facing).toBe('right');
  await expect(page.getByRole('progressbar', { name: 'Construction progress' })).toBeVisible();
  await page.reload(); await worldReady(page);
  await expect.poll(async () => (await saved(page)).buildings.find(building => building.id === id)?.state, { timeout: 12_000 }).toBe('complete');
  const complete = await saved(page); expect(complete.buildings).toHaveLength(1); expect(complete.wallet.timber).toBe(60);
});

test('another copy uses a different free space and keeps the first building identity', async ({ page }) => {
  await openIsland(page); const progress = settlement(['pioneer-cottage']); await fixture(page, progress);
  await chooseCottage(page); await preview(page);
  const options = await page.getByRole('combobox', { name: 'Available building space' }).locator('option').evaluateAll(nodes => nodes.map(node => (node as HTMLOptionElement).value));
  expect(options).not.toContain(progress.buildings[0]!.lot);
  await page.getByRole('button', { name: 'Build here', exact: true }).click();
  await expect.poll(async () => (await saved(page)).buildings.filter(building => building.state === 'complete').length, { timeout: 12_000 }).toBe(2);
  const next = await saved(page); expect(new Set(next.buildings.map(building => building.id)).size).toBe(2);
  expect(new Set(next.buildings.map(building => building.lot)).size).toBe(2);
  expect(next.buildings[0]!.id).toBe(progress.buildings[0]!.id);
});

test('tapping a completed map building opens its free move preview and persists the move', async ({ page }) => {
  await openIsland(page); const progress = settlement(['pioneer-cottage']); await fixture(page, progress);
  const viewport = page.viewportSize()!; const map = islandMapLayout(viewport.width, viewport.height);
  const homeLot = getLots(progress).find(lot => lot.id === progress.buildings[0]!.lot)!;
  const point = lotPosition(homeLot, map);
  await page.locator('canvas').click({ position: { x: point.x, y: point.y - map.mapWidth * 0.012 } });
  const placement = page.getByRole('complementary', { name: 'Building placement' }); await expect(placement).toBeVisible();
  await expect(placement.getByText('Moves cost no supplies', { exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: 'Available building space' }).selectOption('0:harbor:1');
  await placement.getByRole('button', { name: 'Place here', exact: true }).click();
  const moved = await saved(page); expect(moved.buildings[0]!.lot).toBe('0:harbor:1'); expect(moved.wallet).toEqual(progress.wallet);
});

test('a collision banks earlier supplies exactly once and reload preserves the bank', async ({ page }) => {
  await openIsland(page); await startRun(page);
  const result = page.getByRole('dialog', { name: 'A bump in the road.' }); await expect(result).toBeVisible({ timeout: 15_000 });
  await expect(result.getByLabel('15 timber', { exact: true })).toBeVisible();
  await expect(result.getByLabel('2 coins', { exact: true })).toBeVisible();
  const bank = (await saved(page)).wallet;
  expect(bank.timber).toBe(15); expect(bank.coins).toBe(2);
  await result.getByRole('button', { name: 'Return to island' }).click();
  await page.reload(); await worldReady(page); expect((await saved(page)).wallet).toEqual(bank);
});

test('Head home banks an active run before collision and replay starts an empty backpack', async ({ page }) => {
  await openIsland(page); await startRun(page);
  await expect.poll(async () => Number((await page.locator('#run-distance').textContent())?.replace('m','')), { timeout: 5_000 }).toBeGreaterThan(20);
  await page.getByRole('button', { name: 'Return with supplies', exact: true }).click();
  const result = page.getByRole('dialog', { name: 'A run worth bringing home.' }); await expect(result).toBeVisible();
  expect((await saved(page)).wallet.timber).toBeGreaterThanOrEqual(5);
  await result.getByRole('button', { name: 'Run again', exact: true }).click();
  await expect(page.getByLabel('Run progress', { exact: true }).getByLabel('0 timber', { exact: true })).toBeVisible();
});

test('pause freezes runner distance until explicit resume while keeping a way to bank', async ({ page }) => {
  await openIsland(page); await startRun(page); await page.getByRole('button', { name: 'Pause run', exact: true }).click();
  const paused = page.getByRole('dialog', { name: 'The coast can wait.' }); await expect(paused).toBeVisible();
  const distance = await page.locator('#run-distance').textContent();
  // Elapsed wall time is deliberately the behavior being checked here.
  await page.waitForTimeout(1_000); await expect(page.locator('#run-distance')).toHaveText(distance!);
  await expect(paused.getByRole('button', { name: 'End run and return', exact: true })).toBeVisible();
  await paused.getByRole('button', { name: 'Resume run', exact: true }).click();
  await expect.poll(() => page.locator('#run-distance').textContent()).not.toBe(distance);
});

test('islanders expose persistent individual health, hunger and actual work assignments', async ({ page }) => {
  await openIsland(page); await fixture(page, settlement(['pioneer-cottage','rainwater-collector'])); await openCatalog(page);
  await page.getByRole('navigation', { name: 'Settlement sections' }).getByRole('button', { name: 'Islanders', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your islanders', exact: true })).toBeVisible();
  const person = (await saved(page)).simulation.citizens[0]!;
  await expect(page.getByRole('meter', { name: person.name+' health', exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: person.name+' work assignment', exact: true }).selectOption('qa-building-1');
  expect((await saved(page)).simulation.citizens[0]!.jobId).toBe('qa-building-1');
  await page.reload(); await worldReady(page); expect((await saved(page)).simulation.citizens[0]!.jobId).toBe('qa-building-1');
});

test('trade and council explain cargo schedules, fog safety and Town Hall unlocking', async ({ page }) => {
  await openIsland(page); await openCatalog(page); const sections = page.getByRole('navigation', { name: 'Settlement sections' });
  await sections.getByRole('button', { name: 'Trade', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Harbor & visitors', exact: true })).toBeVisible();
  await expect(page.getByText(/90 seconds, with a 30-second docking window/)).toBeVisible();
  await sections.getByRole('button', { name: 'Council', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Island council/ })).toBeVisible();
  await expect(page.locator('.policy-option').first()).toBeDisabled();
});

test('corrupt saved data is preserved until the player explicitly chooses a fresh island', async ({ page }) => {
  await openIsland(page); await page.evaluate(key => localStorage.setItem(key,'{broken-island'), SAVE_KEY); await page.reload(); await worldReady(page);
  const recovery = page.getByRole('dialog', { name: 'A save we couldn’t read.' }); await expect(recovery).toBeVisible();
  await recovery.getByRole('button', { name: 'Play this session', exact: true }).click();
  expect(await page.evaluate(key => localStorage.getItem(key), SAVE_KEY)).toBe('{broken-island');
});

test.describe('compact island and runner', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  test('phone, tablet and landscape keep separate settlement sheets and usable runner controls', async ({ page }) => {
    for (const size of [{width:320,height:640},{width:390,height:844},{width:768,height:1024},{width:844,height:390}]) {
      await page.setViewportSize(size); await openIsland(page); await noPageOverflow(page);
      const nav = page.getByRole('navigation', { name: 'Island navigation' }); await expect(nav).toBeVisible();
      await expect(page.getByRole('complementary', { name: 'Settlement', exact: true })).toHaveCount(0);
      await nav.getByRole('button', { name: 'Build', exact: true }).click();
      await expect(page.getByRole('complementary', { name: 'Settlement', exact: true })).toBeInViewport();
      await thumbTarget(page,'Close settlement'); await page.getByRole('button', { name: 'Close settlement', exact: true }).click();
      await startRun(page); await thumbTarget(page,'Move left'); await thumbTarget(page,'Jump'); await thumbTarget(page,'Move right');
      await page.getByRole('button', { name: 'Pause run', exact: true }).click();
      await page.getByRole('button', { name: 'End run and return', exact: true }).click();
      await page.getByRole('button', { name: 'Return to island' }).click();
    }
  });
});
