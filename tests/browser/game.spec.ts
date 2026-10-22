import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { createProgress } from '../../src/model/progress';
import { SAVE_KEY } from '../../src/model/save';
import type { Progress } from '../../src/model/types';

// Software WebGL startup and repeated page loads need their own budget.
test.setTimeout(60_000);

test.beforeEach(async ({ page }) => {
  page.on('pageerror', error => console.error('Uncaught browser error:', error.stack ?? error.message));
});

async function captureScene(page: Page, name: string) {
  const directory = process.env.ISLAND_RUSH_QA_DIR;
  if (!directory) return;
  await mkdir(directory, { recursive: true });
  await page.screenshot({ path: join(directory, name), fullPage: true });
}

async function openIsland(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Charting your coast…' })).toBeHidden({ timeout: 30_000 });
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Gather supplies' })).toBeInViewport({ ratio: 1 });
}

async function setSavedFixture(page: Page, progress: Progress) {
  await page.evaluate(({ key, value }) => {
    localStorage.setItem(key, JSON.stringify(value));
  }, { key: SAVE_KEY, value: progress });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Charting your coast…' })).toBeHidden({ timeout: 30_000 });
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

test('the selected bungalow persists and explicit construction unlocks level two once', async ({ page }) => {
  await openIsland(page);
  await page.getByRole('button', { name: 'Palm Bungalow', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Palm Bungalow', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Palm Bungalow', exact: true })).toHaveAttribute('aria-pressed', 'true');

  const supplies = createProgress();
  supplies.buildings.home.style = 'bungalow';
  supplies.wallet.timber = 30;
  await setSavedFixture(page, supplies);
  const build = page.getByRole('button', { name: 'Build your home' });
  await expect(build).toBeEnabled();
  await build.click();
  await expect(page.getByRole('heading', { name: 'Welcome home.' })).toBeVisible();
  await expect(page.getByText('Level 2', { exact: true })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Your completed palm bungalow' })).toBeVisible();
  await expect(page.getByLabel('0 timber', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Build your home' })).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Charting your coast…' })).toBeHidden({ timeout: 30_000 });
  await expect(page.getByRole('heading', { name: 'Welcome home.' })).toBeVisible();
  await expect(page.getByText('Level 2', { exact: true })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Your completed palm bungalow' })).toBeVisible();
  await expect(page.getByLabel('0 timber', { exact: true })).toBeVisible();
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
  await expect.poll(async () => {
    const timerAdvanced = await timer.textContent() !== frozenTime;
    const reachedResult = await page.getByRole('dialog', { name: 'A bump in the road.' }).count() > 0;
    return timerAdvanced || reachedResult;
  }, { timeout: 15_000, message: 'The timer advances or the run ends after explicit resume' }).toBe(true);
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

test.describe('phone controls', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('the phone layout fits and real touch buttons steer past the first obstacle', async ({ page }) => {
    await openIsland(page);
    await captureScene(page, 'island-phone.png');
    await expect.poll(() => page.evaluate(() =>
      document.documentElement.scrollWidth <= window.innerWidth,
    )).toBe(true);
    await page.getByRole('button', { name: 'Gather supplies' }).tap();
    const right = page.getByRole('button', { name: 'Move right', exact: true });
    const left = page.getByRole('button', { name: 'Move left', exact: true });
    const jump = page.getByRole('button', { name: 'Jump', exact: true });
    for (const control of [left, jump, right]) {
      await expect(control).toBeInViewport();
      const bounds = await control.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.width).toBeGreaterThanOrEqual(44);
      expect(bounds!.height).toBeGreaterThanOrEqual(44);
    }
    await right.tap();
    await jump.tap();
    // Staying in the right lane must avoid the grounded center-lane block at 3.56s.
    await expect(page.locator('#time-left')).toHaveText('56s', { timeout: 8_000 });
    await expect(page.getByRole('dialog', { name: 'A bump in the road.' })).toHaveCount(0);
    await expect.poll(() => page.evaluate(() =>
      document.documentElement.scrollWidth <= window.innerWidth,
    )).toBe(true);
    await page.getByRole('button', { name: 'Pause run', exact: true }).tap();
    await expect(page.getByRole('dialog', { name: 'The coast can wait.' })).toBeVisible();
  });
});
