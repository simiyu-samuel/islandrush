import { describe, expect, it } from 'vitest';
import { BUILDING_IDS, BUILDINGS, CATEGORIES } from '../src/model/catalog';
import { availableLots } from '../src/model/placement';
import { beginConstruction, chooseStyle, completeTutorialStep, constructionStage, createProgress, finishConstruction, getLevel, getTargetMaterials, purchaseMaterials, selectTarget, settleRun, setPolicy, skipTutorial, unloadCargo, upgradeTownHall } from '../src/model/progress';
import { createRun, returnRun } from '../src/model/run';
import { validateProgress } from '../src/model/save';
import { addBuilding, funded } from './settlement-fixtures';
import type { BuildingType, Progress } from '../src/model/types';
const plan = (p: Progress, type: BuildingType, id = 'site-1') => ({ id, type, style: p.designs[type], lot: availableLots(p, type)[0]!.id, facing: 'left' as const });

describe('expanded building catalog and construction', () => {
  it('contains all sixteen actionable buildings in four categories with real recipes and terrain', () => {
    expect(BUILDING_IDS).toHaveLength(16); expect(CATEGORIES).toHaveLength(4);
    for (const category of CATEGORIES) expect(BUILDING_IDS.filter(id => BUILDINGS[id].category === category.id)).toHaveLength(4);
    for (const b of Object.values(BUILDINGS)) { expect(b.recipe.timber + b.recipe.stone).toBeGreaterThan(0); expect(b.stages).toHaveLength(3); expect(b.benefit.length).toBeGreaterThan(25); }
  });
  it('starts with two named pioneers, no built houses, and the cottage supply target', () => {
    const p = createProgress(0); expect(p.version).toBe(2); expect(p.buildings).toEqual([]); expect(p.target).toBe('pioneer-cottage');
    expect(p.simulation.citizens.map(c => c.name)).toEqual(['Amara', 'Kito']); expect(getTargetMaterials(p)).toEqual(['timber']); expect(validateProgress(p)).toBe(true);
  });
  it('reserves construction resources once, builds concurrently, and completes each copy once', () => {
    let p = funded(); const first = beginConstruction(p, plan(p, 'pioneer-cottage', 'home-a'), 1000); expect(first.ok).toBe(true); p = first.progress;
    const repeat = beginConstruction(p, plan(p, 'pioneer-cottage', 'home-a'), 1000); expect(repeat.ok).toBe(false); expect(repeat.progress).toBe(p);
    p = beginConstruction(p, plan(p, 'pioneer-cottage', 'home-b'), 2000).progress;
    expect(p.wallet.timber).toBe(90); expect(p.buildings).toHaveLength(2); expect(finishConstruction(p, 5999).ok).toBe(false);
    p = finishConstruction(p, 6000).progress; expect(p.buildings.map(b => b.state)).toEqual(['complete', 'building']);
    p = finishConstruction(p, 7000).progress; expect(p.buildings.every(b => b.state === 'complete')).toBe(true); expect(p.wallet.timber).toBe(90);
    expect(finishConstruction(p, 9000).ok).toBe(false); expect(validateProgress(p)).toBe(true);
  });
  it('checks occupancy, terrain, design, tier and affordability before deducting stock', () => {
    const p = funded(); const requested = plan(p, 'pioneer-cottage');
    const started = beginConstruction(p, requested, 0).progress;
    expect(beginConstruction(started, { ...requested, id: 'other' }, 0).ok).toBe(false);
    expect(beginConstruction(p, { ...requested, type: 'lumber-yard' }, 0).ok).toBe(false);
    expect(beginConstruction(p, { ...requested, style: 'forge' }, 0).ok).toBe(false);
    expect(beginConstruction(p, plan(p, 'medical-clinic'), 0).ok).toBe(false);
    expect(beginConstruction(createProgress(0), requested, 0).ok).toBe(false);
    expect(beginConstruction(p, { ...requested, type: '__proto__' as BuildingType }, 0).ok).toBe(false);
    expect(selectTarget(p, '__proto__' as BuildingType).ok).toBe(false);
    expect(chooseStyle(p, '__proto__' as BuildingType, 'island').ok).toBe(false);
    expect(p.wallet.timber).toBe(150); expect(p.buildings).toEqual([]);
  });
  it('rejects invalid construction times and exposes clear stages and percentage', () => {
    const p = funded(); const requested = plan(p, 'pioneer-cottage');
    for (const time of [NaN, Infinity, -1, 8_640_000_000_000_000]) expect(beginConstruction(p, requested, time).ok).toBe(false);
    const site = beginConstruction(p, requested, 1000).progress.buildings[0]!;
    expect(constructionStage(site, 3500)).toEqual({ percentage: 50, stage: BUILDINGS['pioneer-cottage'].stages[1] });
    expect(constructionStage(site, 6000).percentage).toBe(100);
  });
  it('permits repeated copies up to real space rather than a catalog count limit', () => {
    let p = funded();
    for (let n = 0; n < 16; n++) { p = { ...p, wallet: { ...p.wallet, timber: 150 } }; const result = beginConstruction(p, plan(p, 'pioneer-cottage', `home-${n}`), n * 6000); expect(result.ok).toBe(true); p = finishConstruction(result.progress, n * 6000 + 5000).progress; }
    expect(p.buildings).toHaveLength(16); expect(availableLots(p, 'pioneer-cottage')).toHaveLength(0);
  });
  it('gathers a selected future recipe while construction is gated by a Town Hall', () => {
    const p = selectTarget(createProgress(0), 'geothermal-generator').progress;
    expect(p.target).toBe('geothermal-generator'); expect(getTargetMaterials(p)).toEqual(['timber', 'stone']); expect(getLevel(p)).toBe(1);
    const hall = addBuilding(funded(), 'town-hall'); expect(getLevel(hall)).toBe(2);
    const upgrade = upgradeTownHall(hall); expect(upgrade.ok).toBe(true); expect(getLevel(upgrade.progress)).toBe(3);
    expect(upgrade.progress.wallet).toEqual({ timber: 50, stone: 70, coins: 500 }); expect(upgradeTownHall(upgrade.progress).ok).toBe(false);
  });
  it('keeps independent design choices and does not alter completed copies', () => {
    const p = addBuilding(funded(), 'pioneer-cottage'); const result = chooseStyle(p, 'pioneer-cottage', 'bungalow');
    expect(result.progress.designs['pioneer-cottage']).toBe('bungalow'); expect(result.progress.buildings[0]!.style).toBe('island');
    expect(chooseStyle(p, 'pioneer-cottage', 'forge').ok).toBe(false);
  });
});

describe('retained runner rewards and supply actions', () => {
  it('credits collision or voluntary-return loot exactly once across later results', () => {
    let p = createProgress(0); const run = { ...returnRun(createRun(p, { id: 'run-a', seed: 3 })), loot: { timber: 20, stone: 5, coins: 4 } };
    p = settleRun(p, run).progress; expect(p.wallet).toEqual(run.loot); expect(settleRun(p, run).ok).toBe(false);
    const runB = { ...run, id: 'run-b', endReason: 'collision' as const }; p = settleRun(p, runB).progress;
    expect(p.wallet.timber).toBe(40); expect(settleRun(p, run).ok).toBe(false); expect(validateProgress(p)).toBe(true);
  });
  it('keeps every overflow pickup at the harbor and automatically unloads after spending', () => {
    let p = createProgress(0); const run = { ...returnRun(createRun(p)), loot: { timber: 220, stone: 180, coins: 5 } };
    p = settleRun(p, run).progress; expect(p.wallet).toEqual({ timber: 150, stone: 150, coins: 5 }); expect(p.simulation.overflow).toEqual({ timber: 70, stone: 30, coins: 0 });
    p = beginConstruction(p, plan(p, 'pioneer-cottage'), 0).progress;
    expect(p.wallet.timber).toBe(150); expect(p.simulation.overflow.timber).toBe(40);
    p = addBuilding(p, 'storage-depot'); p = unloadCargo(p); expect(p.wallet.timber).toBe(190); expect(p.wallet.stone).toBe(180); expect(p.simulation.overflow.timber).toBe(0);
  });
  it('rejects active or malformed runs without losing the original wallet', () => {
    const p = funded(); const run = createRun(p); expect(settleRun(p, run).ok).toBe(false);
    expect(settleRun(p, { ...returnRun(run), loot: { timber: -1, stone: 0, coins: 0 } }).ok).toBe(false); expect(p.wallet.timber).toBe(150);
  });
  it('enforces purchase stock capacity and exact coin costs', () => {
    let p = createProgress(0); p.wallet.coins = 25;
    p = purchaseMaterials(p, 'timber').progress; p = purchaseMaterials(p, 'stone').progress;
    expect(p.wallet).toEqual({ timber: 5, stone: 5, coins: 0 }); expect(purchaseMaterials(p, 'stone').ok).toBe(false);
    expect(purchaseMaterials(funded(), 'timber').ok).toBe(false);
  });
  it('records tutorial steps idempotently and supports skipping', () => {
    let p = completeTutorialStep(createProgress(0), 'welcome').progress; expect(completeTutorialStep(p, 'welcome').ok).toBe(false);
    p = skipTutorial(p).progress; expect(p.tutorial).toEqual({ completed: ['welcome'], skipped: true });
  });
  it('requires a completed Town Hall for policies and preserves all buildings when changing one', () => {
    expect(setPolicy(createProgress(0), 'harvest').ok).toBe(false);
    const p = addBuilding(funded(), 'town-hall'); const result = setPolicy(p, 'wellbeing');
    expect(result.progress.simulation.policy).toBe('wellbeing'); expect(result.progress.buildings).toEqual(p.buildings);
  });
});
