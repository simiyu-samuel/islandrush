import { buildingLot, lotOccupant, LOT_IDS, DEFAULT_LOTS, type LotId, type Facing } from './placement';
import { BUILDING_IDS, BUILDINGS, MATERIALS, PURCHASES } from './catalog';
import type { ActiveRun, BuildingId, CommandResult, Material, Progress, StyleId, TutorialStep, Wallet } from './types';

export const CONSTRUCTION_DURATION_MS = 5_000;
const validConstructionTime = (value: number) => Number.isSafeInteger(value) && value >= 0 && value <= 8_640_000_000_000_000;

const zeroWallet = (): Wallet => ({ timber: 0, stone: 0, coins: 0 });
const timestamp = (previous = 0) => Math.max(Date.now(), previous + 1);
const fail = (progress: Progress, message: string): CommandResult => ({ ok: false, progress, message });
const succeed = (progress: Progress, changes: Partial<Progress>, message: string): CommandResult =>
  ({ ok: true, progress: { ...progress, ...changes, updatedAt: timestamp(progress.updatedAt) }, message });
const validWallet = (wallet: Wallet) => wallet && Object.values(wallet).length === 3 &&
  ['timber', 'stone', 'coins'].every(key => Number.isSafeInteger(wallet[key as keyof Wallet]) && wallet[key as keyof Wallet] >= 0);

export function createProgress(): Progress {
  return {
    version: 1, wallet: zeroWallet(),
    buildings: {
      home: { style: 'cottage', built: false },
      workshop: { style: 'forge', built: false },
      lookout: { style: 'lighthouse', built: false },
    },
    target: 'home', pendingConstruction: null, tutorial: { completed: [], skipped: false },
    lastSettledRunId: null, settledRunIds: [], updatedAt: timestamp(),
  };
}
export function getLevel(progress: Progress): 1 | 2 { return progress.buildings.home.built ? 2 : 1; }
export function isSettlementComplete(progress: Progress): boolean {
  return BUILDING_IDS.every(id => progress.buildings[id].built);
}
export function canTarget(progress: Progress, id: BuildingId): boolean {
  return Boolean(BUILDINGS[id] && !progress.buildings[id].built && BUILDINGS[id].level <= getLevel(progress));
}
export function getTargetMaterials(progress: Progress): Material[] {
  if (!progress.target || !canTarget(progress, progress.target)) return [];
  return MATERIALS.filter(material => BUILDINGS[progress.target!].recipe[material] > 0);
}
export function chooseStyle(progress: Progress, id: BuildingId, style: StyleId): CommandResult {
  if (progress.pendingConstruction) return fail(progress, 'Wait for the current building to finish.');
  if (!BUILDINGS[id]) return fail(progress, 'That building is not available.');
  if (progress.buildings[id].built) return fail(progress, 'This building is already finished.');
  if (!BUILDINGS[id].styles.some(option => option.id === style)) return fail(progress, 'Choose a design for this building.');
  if (!canTarget(progress, id)) return fail(progress, 'Finish your home to unlock this building.');
  return succeed(progress, { buildings: { ...progress.buildings, [id]: { ...progress.buildings[id], style } } }, 'Design selected.');
}
export function selectTarget(progress: Progress, id: BuildingId): CommandResult {
  if (progress.pendingConstruction) return fail(progress, 'Wait for the current building to finish.');
  if (!BUILDINGS[id]) return fail(progress, 'That building is not available.');
  if (progress.buildings[id].built) return fail(progress, 'This building is already finished.');
  if (!canTarget(progress, id)) return fail(progress, 'Finish your home to unlock this building.');
  return succeed(progress, { target: id }, BUILDINGS[id].name + ' selected.');
}
export function placeBuilding(progress: Progress, id: BuildingId, lot: LotId, facing: Facing): CommandResult {
  if (progress.pendingConstruction) return fail(progress, 'Finish construction before moving a building.');
  if (!BUILDINGS[id] || (!progress.buildings[id].built && !canTarget(progress, id))) return fail(progress, 'This building is not unlocked yet.');
  if (!LOT_IDS.includes(lot) || !['left', 'right'].includes(facing)) return fail(progress, 'Choose a clear grass block.');
  if (lotOccupant(progress, lot, id)) return fail(progress, 'That block already has a building or a saved plan.');
  return succeed(progress, { buildings: { ...progress.buildings, [id]: { ...progress.buildings[id], lot, facing } } },
    progress.buildings[id].built ? 'Building moved. Make the coast your own.' : 'Location saved. Your supplies will build here.');
}

function anchoredBuildings(progress: Progress, id: BuildingId) {
  const lot = buildingLot(progress, id);
  return lot === DEFAULT_LOTS[id] && !progress.buildings[id].lot ? progress.buildings :
    { ...progress.buildings, [id]: { ...progress.buildings[id], lot } };
}

export function buildBuilding(progress: Progress, id: BuildingId): CommandResult {
  if (progress.pendingConstruction) return fail(progress, 'Wait for the current building to finish.');
  if (!BUILDINGS[id]) return fail(progress, 'That building is not available.');
  if (progress.buildings[id].built) return fail(progress, 'This building is already finished.');
  if (!canTarget(progress, id)) return fail(progress, 'Finish your home to unlock this building.');
  const recipe = BUILDINGS[id].recipe;
  if (MATERIALS.some(material => progress.wallet[material] < recipe[material])) {
    return fail(progress, 'Collect the remaining materials before building.');
  }
  const wallet = { ...progress.wallet, timber: progress.wallet.timber - recipe.timber, stone: progress.wallet.stone - recipe.stone };
  return completeBuilding(progress, id, wallet);
}
function completeBuilding(progress: Progress, id: BuildingId, wallet = progress.wallet): CommandResult {
  const anchored = anchoredBuildings(progress, id);
  const buildings = { ...anchored, [id]: { ...anchored[id], built: true } };
  const next = { ...progress, buildings };
  const target = progress.target !== id && progress.target && canTarget(next, progress.target)
    ? progress.target : BUILDING_IDS.find(candidate => canTarget(next, candidate)) ?? null;
  return succeed(progress, { wallet, buildings, target, pendingConstruction: null }, BUILDINGS[id].name + ' completed!');
}
export function beginConstruction(progress: Progress, id: BuildingId, now = Date.now()): CommandResult {
  if (progress.pendingConstruction) return fail(progress, 'Wait for the current building to finish.');
  if (!BUILDINGS[id]) return fail(progress, 'That building is not available.');
  if (progress.buildings[id].built) return fail(progress, 'This building is already finished.');
  if (!canTarget(progress, id)) return fail(progress, 'Finish your home to unlock this building.');
  if (!validConstructionTime(now) || !validConstructionTime(now + CONSTRUCTION_DURATION_MS)) {
    return fail(progress, 'Construction could not start because the current time is invalid.');
  }
  const recipe = BUILDINGS[id].recipe;
  if (MATERIALS.some(material => progress.wallet[material] < recipe[material])) {
    return fail(progress, 'Collect the remaining materials before building.');
  }
  const wallet = { ...progress.wallet, timber: progress.wallet.timber - recipe.timber, stone: progress.wallet.stone - recipe.stone };
  return succeed(progress, {
    wallet, target: id, buildings: anchoredBuildings(progress, id),
    pendingConstruction: { buildingId: id, startedAt: now, completesAt: now + CONSTRUCTION_DURATION_MS },
  }, BUILDINGS[id].name + ' is under construction.');
}
export function finishConstruction(progress: Progress, now = Date.now()): CommandResult {
  const pending = progress.pendingConstruction;
  if (!pending) return fail(progress, 'There is no building under construction.');
  if (!validConstructionTime(now)) return fail(progress, 'Construction could not finish because the current time is invalid.');
  if (now < pending.completesAt) return fail(progress, 'Your building is still under construction.');
  if (progress.target !== pending.buildingId || !canTarget(progress, pending.buildingId)) {
    return fail(progress, 'This construction could not be completed.');
  }
  // Materials were reserved at the start; finishing never charges again.
  return completeBuilding(progress, pending.buildingId);
}
export function purchaseMaterials(progress: Progress, material: Material): CommandResult {
  if (progress.pendingConstruction) return fail(progress, 'Wait for the current building to finish.');
  if (!MATERIALS.includes(material) || !getTargetMaterials(progress).includes(material)) {
    return fail(progress, 'That material is not needed for your current building.');
  }
  const offer = PURCHASES[material];
  if (progress.wallet.coins < offer.coins) return fail(progress, 'You need more coins for this purchase.');
  const wallet = { ...progress.wallet, [material]: progress.wallet[material] + offer.quantity, coins: progress.wallet.coins - offer.coins };
  if (!validWallet(wallet)) return fail(progress, 'This purchase exceeds the inventory limit.');
  return succeed(progress, { wallet }, 'Bought ' + offer.quantity + ' ' + material + '.');
}
export function settleRun(progress: Progress, run: ActiveRun): CommandResult {
  if (run.phase !== 'ended' || !run.endReason) return fail(progress, 'This run has not ended.');
  if (!run.id || progress.lastSettledRunId === run.id || progress.settledRunIds.includes(run.id)) {
    return fail(progress, 'These rewards have already been stored.');
  }
  if (!validWallet(run.loot)) return fail(progress, 'The run rewards are invalid.');
  const wallet = {
    timber: progress.wallet.timber + run.loot.timber,
    stone: progress.wallet.stone + run.loot.stone,
    coins: progress.wallet.coins + run.loot.coins,
  };
  if (!validWallet(wallet)) return fail(progress, 'These rewards exceed the inventory limit.');
  return succeed(progress, {
    wallet, lastSettledRunId: run.id, settledRunIds: [...progress.settledRunIds, run.id],
  }, 'Your collected materials and coins are safely stored.');
}
export function completeTutorialStep(progress: Progress, step: TutorialStep): CommandResult {
  if (progress.tutorial.completed.includes(step)) return fail(progress, 'This step is already complete.');
  return succeed(progress, { tutorial: { ...progress.tutorial, completed: [...progress.tutorial.completed, step] } }, 'Guide updated.');
}
export function skipTutorial(progress: Progress): CommandResult {
  return succeed(progress, { tutorial: { ...progress.tutorial, skipped: true } }, 'Guide skipped.');
}
