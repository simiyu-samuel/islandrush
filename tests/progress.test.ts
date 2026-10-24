import { describe, expect, it } from 'vitest';
import {
  beginConstruction, buildBuilding, chooseStyle, createProgress, finishConstruction, getLevel, isSettlementComplete,
  purchaseMaterials, selectTarget, settleRun,
} from '../src/model/progress';
import { returnRun, advanceRun, createRun } from '../src/model/run';

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
  it('stores collision or voluntary-return rewards once, including a stale older result', () => {
    let progress = createProgress();
    const first = {
      ...returnRun(advanceRun({ ...createRun(progress, { id: 'first', seed: 1 }), entities: [], generatedUntil:Infinity }, 60)),
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

describe('five-second construction', () => {
  it('reserves materials once without revealing the building or unlocking level two early', () => {
    const original = createProgress();
    original.wallet = { timber: 45, stone: 0, coins: 20 };
    const selected = chooseStyle(original, 'home', 'bungalow').progress;
    const started = beginConstruction(selected, 'home', 1_000);
    expect(started.ok).toBe(true);
    expect(started.progress.pendingConstruction).toEqual({ buildingId: 'home', startedAt: 1_000, completesAt: 6_000 });
    expect(started.progress.wallet).toEqual({ timber: 15, stone: 0, coins: 20 });
    expect(started.progress.buildings.home).toEqual({ style: 'bungalow', built: false });
    expect(getLevel(started.progress)).toBe(1);
    expect(beginConstruction(started.progress, 'home', 2_000)).toMatchObject({ ok: false, progress: started.progress });
    expect(selected.wallet.timber).toBe(45);
    expect(selected.pendingConstruction).toBeNull();
  });

  it('reveals the selected design at the deadline without charging again', () => {
    const progress = createProgress();
    progress.wallet.timber = 45;
    const chosen = chooseStyle(progress, 'home', 'bungalow').progress;
    const pending = beginConstruction(chosen, 'home', 1_000).progress;
    expect(finishConstruction(pending, 5_999)).toMatchObject({ ok: false, progress: pending });
    expect(getLevel(pending)).toBe(1);
    const completed = finishConstruction(pending, 6_000);
    expect(completed.ok).toBe(true);
    expect(completed.progress.buildings.home).toEqual({ style: 'bungalow', built: true });
    expect(completed.progress.pendingConstruction).toBeNull();
    expect(completed.progress.wallet.timber).toBe(15);
    expect(completed.progress.target).toBe('workshop');
    expect(getLevel(completed.progress)).toBe(2);
    expect(finishConstruction(completed.progress, 6_001)).toMatchObject({ ok: false, progress: completed.progress });
    expect(completed.progress.wallet.timber).toBe(15);
    expect(pending.buildings.home.built).toBe(false);
  });

  it('keeps the reserved design and target stable until construction finishes', () => {
    const progress = createProgress();
    progress.wallet = { timber: 60, stone: 0, coins: 20 };
    const pending = beginConstruction(progress, 'home', 1_000).progress;
    for (const result of [
      chooseStyle(pending, 'home', 'bungalow'),
      selectTarget(pending, 'home'),
      buildBuilding(pending, 'home'),
      purchaseMaterials(pending, 'timber'),
      beginConstruction(pending, 'home', 6_000),
    ]) {
      expect(result.ok).toBe(false);
      expect(result.progress).toBe(pending);
    }
    expect(pending.buildings.home.style).toBe('cottage');
    expect(pending.wallet).toEqual({ timber: 30, stone: 0, coins: 20 });
  });

  it('requires an unlocked building and sufficient supplies before reserving anything', () => {
    const poor = createProgress();
    poor.wallet.timber = 29;
    expect(beginConstruction(poor, 'home', 1_000)).toMatchObject({ ok: false, progress: poor });
    const rich = createProgress();
    rich.wallet = { timber: 100, stone: 70, coins: 0 };
    expect(beginConstruction(rich, 'workshop', 1_000)).toMatchObject({ ok: false, progress: rich });
    expect(rich.pendingConstruction).toBeNull();
    expect(rich.wallet.timber).toBe(100);
  });

  it('derives the next target when a different unlocked project was started', () => {
    const progress = createProgress();
    progress.wallet = { timber: 100, stone: 70, coins: 0 };
    const unlocked = buildBuilding(progress, 'home').progress;
    const pending = beginConstruction(unlocked, 'lookout', 10_000).progress;
    expect(pending.target).toBe('lookout');
    expect(pending.wallet).toEqual({ timber: 50, stone: 30, coins: 0 });
    const completed = finishConstruction(pending, 15_000).progress;
    expect(completed.buildings.lookout.built).toBe(true);
    expect(completed.buildings.workshop.built).toBe(false);
    expect(completed.target).toBe('workshop');
    expect(completed.wallet).toEqual(pending.wallet);
  });

  it('retains newly earned loot when a reserved construction completes', () => {
    const progress = createProgress();
    progress.wallet.timber = 30;
    const pending = beginConstruction(progress, 'home', 1_000).progress;
    const ended = {
      ...returnRun(advanceRun({ ...createRun(pending, { id: 'while-building', seed: 1 }), entities: [], generatedUntil:Infinity }, 60)),
      loot: { timber: 5, stone: 0, coins: 1 },
    };
    const banked = settleRun(pending, ended).progress;
    const completed = finishConstruction(banked, 6_000).progress;
    expect(completed.wallet).toEqual({ timber: 5, stone: 0, coins: 1 });
    expect(completed.buildings.home.built).toBe(true);
    expect(completed.lastSettledRunId).toBe('while-building');
  });

  it.each([-1, 1.5, Infinity, 8_640_000_000_000_000])('rejects invalid construction start time %s', now => {
    const progress = createProgress();
    progress.wallet.timber = 30;
    expect(beginConstruction(progress, 'home', now)).toMatchObject({ ok: false, progress });
    expect(progress.wallet.timber).toBe(30);
  });
});
