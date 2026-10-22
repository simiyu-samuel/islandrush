import { BUILDING_IDS, BUILDINGS, MATERIALS, PURCHASES } from './catalog';
import type { ActiveRun, BuildingId, CommandResult, Material, Progress, StyleId, TutorialStep, Wallet } from './types';

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
    target: 'home', tutorial: { completed: [], skipped: false },
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
  if (!BUILDINGS[id]) return fail(progress, 'That building is not available.');
  if (progress.buildings[id].built) return fail(progress, 'This building is already finished.');
  if (!BUILDINGS[id].styles.some(option => option.id === style)) return fail(progress, 'Choose a design for this building.');
  if (!canTarget(progress, id)) return fail(progress, 'Finish your home to unlock this building.');
  return succeed(progress, { buildings: { ...progress.buildings, [id]: { ...progress.buildings[id], style } } }, 'Design selected.');
}
export function selectTarget(progress: Progress, id: BuildingId): CommandResult {
  if (!BUILDINGS[id]) return fail(progress, 'That building is not available.');
  if (progress.buildings[id].built) return fail(progress, 'This building is already finished.');
  if (!canTarget(progress, id)) return fail(progress, 'Finish your home to unlock this building.');
  return succeed(progress, { target: id }, BUILDINGS[id].name + ' selected.');
}
export function buildBuilding(progress: Progress, id: BuildingId): CommandResult {
  if (!BUILDINGS[id]) return fail(progress, 'That building is not available.');
  if (progress.buildings[id].built) return fail(progress, 'This building is already finished.');
  if (!canTarget(progress, id)) return fail(progress, 'Finish your home to unlock this building.');
  const recipe = BUILDINGS[id].recipe;
  if (MATERIALS.some(material => progress.wallet[material] < recipe[material])) {
    return fail(progress, 'Collect the remaining materials before building.');
  }
  const wallet = { ...progress.wallet, timber: progress.wallet.timber - recipe.timber, stone: progress.wallet.stone - recipe.stone };
  const buildings = { ...progress.buildings, [id]: { ...progress.buildings[id], built: true } };
  const next = { ...progress, buildings };
  const target = progress.target !== id && progress.target && canTarget(next, progress.target)
    ? progress.target : BUILDING_IDS.find(candidate => canTarget(next, candidate)) ?? null;
  return succeed(progress, { wallet, buildings, target }, BUILDINGS[id].name + ' completed!');
}
export function purchaseMaterials(progress: Progress, material: Material): CommandResult {
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
