import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { createProgress } from '../../src/model/progress';
import { SAVE_KEY } from '../../src/model/save';
import type { Progress } from '../../src/model/types';

// Software WebGL startup and repeated page loads need their own budget.
test.setTimeout(90_000);

test.beforeEach(async ({ page }) => {
  page.on('pageerror', error => console.error('Uncaught browser error:', error.stack ?? error.message));
});

async function captureScene(page: Page, name: string) {
  const directory = process.env.ISLAND_RUSH_QA_DIR;
  if (!directory) return;
  await mkdir(directory, { recursive: true });
  await page.screenshot({ path: join(directory, name), fullPage: true });
}

async function waitForWorld(page: Page) {
  await expect(page.getByRole('heading', { name: 'Charting your coast…' })).toBeHidden({ timeout: 30_000 });
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.locator('canvas')).toBeVisible();
}

async function openIsland(page: Page) {
  await page.goto('/');
  await waitForWorld(page);
  if ((page.viewportSize()?.width ?? 1280) < 960) {
    await expect(page.getByRole('navigation', { name: 'Island navigation' })).toBeVisible();
    await expect(page.getByRole('complementary', { name: 'Home construction' })).toHaveCount(0);
  } else {
    await expect(page.getByRole('button', { name: 'Gather supplies' })).toBeInViewport({ ratio: 1 });
  }
}

async function expectNoPageOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() => ({
    horizontal: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > window.innerWidth,
    vertical: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) > window.innerHeight,
  }))).toEqual({ horizontal: false, vertical: false });
}

async function expectThumbTarget(control: ReturnType<Page['getByRole']>) {
  await expect(control).toBeInViewport({ ratio: 1 });
  const bounds = await control.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.width).toBeGreaterThanOrEqual(44);
  expect(bounds!.height).toBeGreaterThanOrEqual(44);
}

async function expectPastFirstObstacle(page: Page) {
  await expect.poll(async () => {
    if (await page.getByRole('dialog', { name: 'A bump in the road.' }).isVisible()) {
      const duration = await page.getByText(/Active running time:/).textContent();
      // The first block ends a centered run at 3.6s; a later collision is valid gameplay.
      return Number(duration?.match(/([0-9.]+)s/)?.[1] ?? 0) > 3.6;
    }
    const seconds = Number((await page.locator('#time-left').textContent())?.replace('s', ''));
    return seconds <= 56;
  }, { timeout: 12_000, message: 'Actual controls steer past the first center-lane obstacle' }).toBe(true);
}

async function setSavedFixture(page: Page, progress: Progress) {
  await page.evaluate(({ key, value }) => {
    localStorage.setItem(key, JSON.stringify(value));
  }, { key: SAVE_KEY, value: progress });
  await page.reload();
  await waitForWorld(page);
}

async function waitForCollision(page: Page, timber: number, coins: number) {
  const result = page.getByRole('dialog', { name: 'A bump in the road.' });
  await expect(result).toBeVisible({ timeout: 15_000 });
  await expect(result.getByLabel('15 timber', { exact: true })).toBeVisible();
  await expect(result.getByLabel('2 coins', { exact: true })).toBeVisible();
  await expect(result.getByText(timber + ' timber · ' + coins + ' coins', { exact: true })).toBeVisible();
  return result;
}

test('a collision banks collected loot once, replay adds new loot, and reload preserves the island', async ({ page }) => {
  await openIsland(page);
  await captureScene(page, 'island-desktop.png');
  await page.getByRole('button', { name: 'Gather supplies' }).click();
  const firstResult = await waitForCollision(page, 15, 2);
  await firstResult.getByRole('button', { name: 'Return to island' }).click();
  await expect(page.getByLabel('15 timber', { exact: true })).toBeVisible();
  await expect(page.getByLabel('2 coins', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Build your home' })).toBeDisabled();

  await page.getByRole('button', { name: 'Gather supplies' }).click();
  const secondResult = await waitForCollision(page, 30, 4);
  await secondResult.getByRole('button', { name: 'Run again', exact: true }).click();
  const running = page.getByLabel('Run progress', { exact: true });
  await expect(running.getByLabel('0 timber', { exact: true })).toBeVisible();
  await expect(running.getByLabel('0 coins', { exact: true })).toBeVisible();
  await captureScene(page, 'runner-desktop.png');

  // Reload discards this unfinished third run; it must not credit prior results again.
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Charting your coast…' })).toBeHidden({ timeout: 30_000 });
  await expect(page.getByLabel('30 timber', { exact: true })).toBeVisible();
  await expect(page.getByLabel('4 coins', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Build your home' })).toBeEnabled();
});

test('the selected home stays under construction for five seconds before its saved reveal', async ({ page }) => {
  await openIsland(page);
  await page.getByRole('button', { name: 'Palm Bungalow', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Palm Bungalow', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await waitForWorld(page);
  await expect(page.getByRole('button', { name: 'Palm Bungalow', exact: true })).toHaveAttribute('aria-pressed', 'true');

  const supplies = createProgress();
  supplies.buildings.home.style = 'bungalow';
  supplies.wallet.timber = 30;
  await setSavedFixture(page, supplies);
  await page.getByRole('button', { name: 'Build your home' }).click();
  await expect(page.getByRole('heading', { name: 'Building in progress' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Welcome home.' })).toHaveCount(0);
  await expect(page.getByText('Level 1', { exact: true })).toBeVisible();
  await expect(page.getByLabel('0 timber', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Build your home' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Palm Bungalow', exact: true })).toHaveCount(0);
  await expect(page.getByRole('progressbar', { name: 'Construction progress' })).toBeVisible();
  // Observe the intermediate phase rather than photographing only the finished home.
  await page.waitForTimeout(1_200);
  await expect(page.getByRole('heading', { name: 'Building in progress' })).toBeVisible();
  await captureScene(page, 'construction-desktop.png');

  await expect(page.getByRole('heading', { name: 'Welcome home.' })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('Level 2', { exact: true })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Your completed palm bungalow' })).toBeVisible();
  await expect(page.getByLabel('0 timber', { exact: true })).toBeVisible();
  await page.waitForTimeout(350);
  await captureScene(page, 'complete-desktop.png');
  await page.reload();
  await waitForWorld(page);
  await expect(page.getByRole('heading', { name: 'Welcome home.' })).toBeVisible();
  await expect(page.getByText('Level 2', { exact: true })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Your completed palm bungalow' })).toBeVisible();
  await expect(page.getByLabel('0 timber', { exact: true })).toBeVisible();
});

test('reloading during construction preserves the reservation and finishes the same home', async ({ page }) => {
  await openIsland(page);
  const supplies = createProgress();
  supplies.wallet.timber = 30;
  await setSavedFixture(page, supplies);
  await page.getByRole('button', { name: 'Build your home' }).click();
  await expect(page.getByRole('heading', { name: 'Building in progress' })).toBeVisible();
  await expect(page.getByLabel('0 timber', { exact: true })).toBeVisible();
  await page.reload();
  await waitForWorld(page);
  // Asset loading may span the deadline; the original five-second job is never restarted.
  await expect(page.getByRole('heading', { name: 'Welcome home.' })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('Level 2', { exact: true })).toBeVisible();
  await expect(page.getByLabel('0 timber', { exact: true })).toBeVisible();
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? 'null'), SAVE_KEY);
  expect(saved).toMatchObject({
    wallet: { timber: 0, stone: 0, coins: 0 },
    buildings: { home: { style: 'cottage', built: true } },
    pendingConstruction: null,
  });
});

test('the pause overlay freezes the visible timer until explicit resume', async ({ page }) => {
  await openIsland(page);
  await page.getByRole('button', { name: 'Gather supplies' }).click();
  const timer = page.locator('#time-left');
  await page.getByRole('button', { name: 'Pause run', exact: true }).click();
  const paused = page.getByRole('dialog', { name: 'The coast can wait.' });
  await expect(paused).toBeVisible();
  const frozenTime = await timer.textContent();
  // This elapsed real time is the behavior under test, not a wait for the page to load.
  await page.waitForTimeout(1_200);
  await expect(timer).toHaveText(frozenTime!);
  await expect(page.getByRole('dialog', { name: 'A bump in the road.' })).toHaveCount(0);
  await paused.getByRole('button', { name: 'Resume run', exact: true }).click();
  await expect(paused).toHaveCount(0);
  await page.locator('canvas').focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Space');
  await expect.poll(async () => {
    const timerAdvanced = await timer.textContent() !== frozenTime;
    const reachedResult = await page.getByRole('dialog', { name: 'A bump in the road.' }).count() > 0;
    return timerAdvanced || reachedResult;
  }, { timeout: 15_000, message: 'The timer advances or the run ends after explicit resume' }).toBe(true);
  await expectPastFirstObstacle(page);
});

test('active time advances at a low rendering frame rate', async ({ page }) => {
  await page.addInitScript(() => {
    const requestFrame = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = callback => requestFrame(() => {
      window.setTimeout(() => callback(performance.now()), 120);
    });
  });
  await openIsland(page);
  await page.getByRole('button', { name: 'Gather supplies' }).click();
  await expect.poll(async () => {
    const visibleSeconds = Number((await page.locator('#time-left').textContent())?.replace('s', ''));
    return visibleSeconds < 60;
  }, { timeout: 3_000, message: 'Active time follows elapsed time even when frames are delayed' }).toBe(true);
  await page.getByRole('button', { name: 'Pause run', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'The coast can wait.' })).toBeVisible();
});

test.describe('compact layouts and touch controls', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('bottom navigation, building sheets, and runner controls fit phone, tablet, and landscape screens', async ({ page }) => {
    test.setTimeout(120_000);
    const sizes = [
      { width: 320, height: 640 },
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 844, height: 390 },
    ];
    for (const size of sizes) {
      await test.step(size.width + '×' + size.height, async () => {
        await page.setViewportSize(size);
        await openIsland(page);
        await expectNoPageOverflow(page);
        const nav = page.getByRole('navigation', { name: 'Island navigation' });
        for (const name of ['Island', 'Buildings', 'Run']) {
          await expectThumbTarget(nav.getByRole('button', { name, exact: true }));
        }
        await expect(page.getByRole('region', { name: 'Buildings', exact: true })).toHaveCount(0);
        if (size.width === 390) await captureScene(page, 'island-phone.png');

        await nav.getByRole('button', { name: 'Buildings', exact: true }).tap();
        const buildings = page.getByRole('region', { name: 'Buildings', exact: true });
        await expect(buildings).toBeInViewport({ ratio: 1 });
        const close = buildings.getByRole('button', { name: 'Close buildings', exact: true });
        await expectThumbTarget(close);
        const gather = buildings.getByRole('button', { name: 'Gather supplies', exact: true });
        await expectThumbTarget(gather);
        await buildings.getByRole('button', { name: 'Build your home' }).scrollIntoViewIfNeeded();
        await expect(gather).toBeInViewport({ ratio: 1 });
        await expect(close).toBeInViewport({ ratio: 1 });
        await expectNoPageOverflow(page);
        if (size.width === 390) await captureScene(page, 'buildings-phone.png');
        await close.tap();
        await expect(buildings).toHaveCount(0);
        await expect(page.getByRole('complementary', { name: 'Home construction' })).toHaveCount(0);
        await nav.getByRole('button', { name: 'Buildings', exact: true }).tap();
        await nav.getByRole('button', { name: 'Island', exact: true }).tap();
        await expect(buildings).toHaveCount(0);
        await expect(page.getByRole('complementary', { name: 'Home construction' })).toHaveCount(0);

        await nav.getByRole('button', { name: 'Run', exact: true }).tap();
        const hud = page.getByLabel('Run progress', { exact: true });
        await expect(hud).toBeInViewport({ ratio: 1 });
        const right = page.getByRole('button', { name: 'Move right', exact: true });
        const jump = page.getByRole('button', { name: 'Jump', exact: true });
        for (const control of [page.getByRole('button', { name: 'Move left', exact: true }), jump, right,
          page.getByRole('button', { name: 'Pause run', exact: true })]) {
          await expectThumbTarget(control);
        }
        await expectNoPageOverflow(page);
        await right.tap();
        await jump.tap();
        if (size.width === 390) await captureScene(page, 'runner-phone.png');
        if (size.height === 390) await captureScene(page, 'runner-landscape.png');
        await page.getByRole('button', { name: 'Pause run', exact: true }).tap();
        const paused = page.getByRole('dialog', { name: 'The coast can wait.' });
        await expect(paused).toBeVisible();
        if (size.width === 390) {
          await paused.getByRole('button', { name: 'Resume run', exact: true }).tap();
          await expectPastFirstObstacle(page);
        }
      });
    }
  });
});
