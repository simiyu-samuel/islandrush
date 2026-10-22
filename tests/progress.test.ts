import { describe, expect, it } from 'vitest';
import {
  buildBuilding, chooseStyle, createProgress, getLevel, isSettlementComplete,
  purchaseMaterials, selectTarget, settleRun,
} from '../src/model/progress';
import { advanceRun, createRun } from '../src/model/run';

describe('construction and inventory', () => {
  it('gates level two, preserves the chosen home, and deducts construction once', () => {
    const progress = createProgress();
    progress.wallet = { timber: 100, stone: 70, coins: 30 };
    expect(buildBuilding(progress, 'workshop')).toMatchObject({ ok: false, progress });
    expect(selectTarget(progress, 'lookout').ok).toBe(false);
    const selected = chooseStyle(progress, 'home', 'bungalow');
    expect(selected.ok).toBe(true);
    const built = buildBuilding(selected.progress, 'home');
    expect(built.ok).toBe(true);
    expect(built.progress.buildings.home).toEqual({ style: 'bungalow', built: true });
    expect(built.progress.wallet).toEqual({ timber: 70, stone: 70, coins: 30 });
    expect(getLevel(built.progress)).toBe(2);
    expect(built.progress.target).toBe('workshop');
    const repeated = buildBuilding(built.progress, 'home');
    expect(repeated.ok).toBe(false);
    expect(repeated.progress).toBe(built.progress);
    expect(progress.buildings.home.built).toBe(false);
    expect(progress.wallet.timber).toBe(100);
  });

  it('allows either level-two order and retains surplus at completion', () => {
    let progress = createProgress();
    progress.wallet = { timber: 100, stone: 70, coins: 30 };
    progress = buildBuilding(progress, 'home').progress;
    progress = selectTarget(progress, 'lookout').progress;
    progress = buildBuilding(progress, 'lookout').progress;
    expect(progress.target).toBe('workshop');
    progress = buildBuilding(progress, 'workshop').progress;
    expect(progress.wallet).toEqual({ timber: 10, stone: 10, coins: 30 });
    expect(progress.target).toBeNull();
    expect(isSettlementComplete(progress)).toBe(true);
    expect(purchaseMaterials(progress, 'timber').ok).toBe(false);
  });

  it('exchanges the displayed coin price only for eligible material', () => {
    const progress = createProgress();
    progress.wallet.coins = 25;
    expect(purchaseMaterials(progress, 'stone').ok).toBe(false);
    const bought = purchaseMaterials(progress, 'timber');
    expect(bought).toMatchObject({ ok: true, progress: { wallet: { timber: 5, stone: 0, coins: 15 } } });
    const poor = { ...progress, wallet: { ...progress.wallet, coins: 9 } };
    expect(purchaseMaterials(poor, 'timber')).toMatchObject({ ok: false, progress: poor });
    const unlocked = buildBuilding({ ...progress, wallet: { ...progress.wallet, timber: 30 } }, 'home').progress;
    expect(purchaseMaterials(unlocked, 'stone')).toMatchObject({ ok: true, progress: { wallet: { stone: 5, coins: 10 } } });
    expect(progress.wallet).toEqual({ timber: 0, stone: 0, coins: 25 });
  });

  it('requires sufficient stock and rejects a design belonging to another building', () => {
    const progress = createProgress();
    progress.wallet.timber = 29;
    expect(buildBuilding(progress, 'home')).toMatchObject({ ok: false, progress });
    expect(chooseStyle(progress, 'home', 'lighthouse')).toMatchObject({ ok: false, progress });
    expect(progress.wallet.timber).toBe(29);
  });
});

describe('run settlement', () => {
  it('stores collision or timer rewards once, including a stale older result', () => {
    let progress = createProgress();
    const first = {
      ...advanceRun({ ...createRun(progress, { id: 'first', seed: 1 }), entities: [] }, 60),
      loot: { timber: 15, stone: 0, coins: 3 },
    };
    progress = settleRun(progress, first).progress;
    expect(progress.wallet).toEqual({ timber: 15, stone: 0, coins: 3 });
    expect(settleRun(progress, first).ok).toBe(false);
    const second = { ...first, id: 'second', endReason: 'collision' as const, loot: { timber: 5, stone: 0, coins: 1 } };
    progress = settleRun(progress, second).progress;
    expect(settleRun(progress, first).ok).toBe(false);
    expect(progress.wallet).toEqual({ timber: 20, stone: 0, coins: 4 });
  });

  it('does not credit a running or paused run', () => {
    const progress = createProgress();
    const run = { ...createRun(progress), loot: { timber: 30, stone: 0, coins: 10 } };
    expect(settleRun(progress, run)).toMatchObject({ ok: false, progress });
    expect(progress.wallet.timber).toBe(0);
  });
});
