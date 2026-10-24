import { availableLots, getLots, getRegionCount, validLot, type LotId, type Facing } from './placement';
import { BUILDING_IDS, BUILDINGS, MATERIALS, PURCHASES } from './catalog';
import { addEvent, completed, initialSimulation, settlementStats, storageCapacity, unloadCargo, zeroWallet } from './simulation';
import type { ActiveRun, BuildingInstance, BuildingType, CommandResult, Material, Policy, Progress, StyleId, TutorialStep, Wallet } from './types';
export { advanceSettlement, settlementStats, unloadCargo, SIMULATION_TICK_MS, MAX_OFFLINE_TICKS } from './simulation';
export const CONSTRUCTION_DURATION_MS = 5_000;
const validTime = (value: number) => Number.isSafeInteger(value) && value >= 0 && value <= 8_640_000_000_000_000;
const timestamp = (previous = 0) => Math.max(Date.now(), previous + 1);
const fail = (progress: Progress, message: string): CommandResult => ({ ok: false, progress, message });
const succeed = (progress: Progress, changes: Partial<Progress>, message: string): CommandResult =>
  ({ ok: true, progress: { ...progress, ...changes, updatedAt: timestamp(progress.updatedAt) }, message });
const validWallet = (wallet: Wallet) => wallet && Object.keys(wallet).length === 3 &&
  ['timber', 'stone', 'coins'].every(key => Number.isSafeInteger(wallet[key as keyof Wallet]) && wallet[key as keyof Wallet] >= 0);
export function createProgress(now = Date.now()): Progress {
  const at = validTime(now) ? now : Date.now();
  return { version: 2, wallet: zeroWallet(), buildings: [], target: 'pioneer-cottage',
    designs: Object.fromEntries(BUILDING_IDS.map(type => [type, 'island'])) as Progress['designs'],
    tutorial: { completed: [], skipped: false }, lastSettledRunId: null, settledRunIds: [],
    updatedAt: at, simulation: initialSimulation(at) };
}
export function getLevel(progress: Progress): 1 | 2 | 3 { return settlementStats(progress).tier; }
export function isSettlementComplete(_progress: Progress): boolean { return false; }
export function canTarget(progress: Progress, type: BuildingType): boolean { return BUILDING_IDS.includes(type) && BUILDINGS[type].tier <= getLevel(progress); }
export function getTargetMaterials(progress: Progress): Material[] {
  return MATERIALS.filter(material => BUILDINGS[progress.target].recipe[material] > 0);
}
export function chooseStyle(progress: Progress, type: BuildingType, style: StyleId): CommandResult {
  if (!BUILDING_IDS.includes(type) || !BUILDINGS[type].styles.some(option => option.id === style)) return fail(progress, 'Choose a design for this building.');
  return succeed(progress, { designs: { ...progress.designs, [type]: style } }, 'Design selected.');
}
export function selectTarget(progress: Progress, type: BuildingType): CommandResult {
  if (!BUILDING_IDS.includes(type)) return fail(progress, 'That building is not available.');
  // A player may gather for a locked recipe before the town hall unlocks construction.
  return succeed(progress, { target: type }, `Gathering supplies for ${BUILDINGS[type].name}.`);
}
export interface ConstructionPlan { id: string; type: BuildingType; style: StyleId; lot: LotId; facing: Facing }
export function beginConstruction(progress: Progress, plan: ConstructionPlan, now = Date.now()): CommandResult {
  if (!plan || typeof plan.id !== 'string' || !plan.id.trim() || plan.id.length > 200 || progress.buildings.some(b => b.id === plan.id)) return fail(progress, 'Choose a new construction site.');
  if (!BUILDING_IDS.includes(plan.type)) return fail(progress, 'That building is not available.');
  if (!canTarget(progress, plan.type)) return fail(progress, BUILDINGS[plan.type].tier === 3 ? 'Upgrade a Town Hall to unlock tier 3.' : 'Complete a Town Hall to unlock tier 2.');
  if (!BUILDINGS[plan.type].styles.some(s => s.id === plan.style) || !['left', 'right'].includes(plan.facing)) return fail(progress, 'Choose a valid design and facing.');
  const reason = validLot(progress, plan.type, plan.lot);
  if (reason) return fail(progress, reason);
  if (!validTime(now) || !validTime(now + CONSTRUCTION_DURATION_MS)) return fail(progress, 'Construction could not start because the current time is invalid.');
  const stocked = unloadCargo(progress);
  const recipe = BUILDINGS[plan.type].recipe;
  if (MATERIALS.some(material => stocked.wallet[material] < recipe[material])) return fail(progress, 'Collect the remaining materials before building.');
  const wallet = { ...stocked.wallet, timber: stocked.wallet.timber - recipe.timber, stone: stocked.wallet.stone - recipe.stone };
  const instance: BuildingInstance = { ...plan, state: 'building', startedAt: now, completesAt: now + CONSTRUCTION_DURATION_MS, level: 1 };
  const next = unloadCargo({ ...stocked, wallet, target: plan.type, buildings: [...stocked.buildings, instance] });
  return succeed(progress, next, `${BUILDINGS[plan.type].name}: ${BUILDINGS[plan.type].stages[0]}. Supplies reserved; ready in 5 seconds.`);
}
export function finishConstruction(progress: Progress, now = Date.now()): CommandResult {
  if (!validTime(now)) return fail(progress, 'Construction time is invalid.');
  const finished = progress.buildings.filter(b => b.state === 'building' && b.completesAt <= now);
  if (!finished.length) return fail(progress, 'Your construction sites are still in progress.');
  const buildings = progress.buildings.map(b => finished.some(f => f.id === b.id) ? { ...b, state: 'complete' as const } : b);
  const simulation = structuredClone(progress.simulation);
  for (const b of finished) addEvent(simulation, now, `${BUILDINGS[b.type].name} completed. ${BUILDINGS[b.type].benefit}`, 'construction');
  const next = unloadCargo({ ...progress, buildings, simulation });
  return succeed(progress, next, finished.map(b => BUILDINGS[b.type].name).join(', ') + ' completed!');
}
export function placeBuilding(progress: Progress, instanceId: string, lot: LotId, facing: Facing): CommandResult {
  const building = progress.buildings.find(b => b.id === instanceId);
  if (!building || building.state !== 'complete') return fail(progress, 'Finish construction before moving this building.');
  if (!['left', 'right'].includes(facing)) return fail(progress, 'Choose a valid facing.');
  const reason = validLot(progress, building.type, lot, instanceId);
  if (reason) return fail(progress, reason);
  const buildings = progress.buildings.map(b => b.id === instanceId ? { ...b, lot, facing } : b);
  const next = { ...progress, buildings };
  const openLots = new Set(getLots(next).filter(l => l.unlocked).map(l => l.id));
  if (buildings.some(b => !openLots.has(b.lot))) return fail(progress, 'This outpost keeps occupied ground open. Move those buildings first.');
  return succeed(progress, { buildings }, 'Building moved. Make the coast your own.');
}
export function purchaseMaterials(progress: Progress, material: Material): CommandResult {
  if (!MATERIALS.includes(material)) return fail(progress, 'Choose timber or stone.');
  const offer = PURCHASES[material];
  const stocked = unloadCargo(progress);
  if (stocked.wallet.coins < offer.coins) return fail(progress, 'You need more coins for this purchase.');
  if (stocked.wallet[material] + offer.quantity > storageCapacity(stocked)) return fail(progress, 'Storage is full. Spend supplies or build a Storage Depot.');
  const wallet = { ...stocked.wallet, [material]: stocked.wallet[material] + offer.quantity, coins: stocked.wallet.coins - offer.coins };
  if (!validWallet(wallet)) return fail(progress, 'This purchase exceeds the inventory limit.');
  return succeed(progress, { ...stocked, wallet }, `Bought ${offer.quantity} ${material}.`);
}
export function settleRun(progress: Progress, run: ActiveRun): CommandResult {
  if (run.phase !== 'ended' || !run.endReason) return fail(progress, 'This run has not ended.');
  if (!run.id || progress.lastSettledRunId === run.id || progress.settledRunIds.includes(run.id)) return fail(progress, 'These rewards have already been stored.');
  if (!validWallet(run.loot)) return fail(progress, 'The run rewards are invalid.');
  const wallet = { timber: progress.wallet.timber + run.loot.timber, stone: progress.wallet.stone + run.loot.stone, coins: progress.wallet.coins + run.loot.coins };
  if (!validWallet(wallet)) return fail(progress, 'These rewards exceed the inventory limit.');
  const overflow = { ...progress.simulation.overflow };
  const capacity = storageCapacity(progress);
  for (const material of MATERIALS) { const excess = Math.max(0, wallet[material] - capacity); wallet[material] -= excess; overflow[material] += excess; }
  if (!validWallet(overflow)) return fail(progress, 'These rewards exceed the harbor limit.');
  return succeed(progress, { wallet, simulation: { ...progress.simulation, overflow }, lastSettledRunId: run.id, settledRunIds: [...progress.settledRunIds, run.id] }, 'All supplies kept. Storage overflow is waiting safely at the harbor.');
}
export function completeTutorialStep(progress: Progress, step: TutorialStep): CommandResult {
  if (progress.tutorial.completed.includes(step)) return fail(progress, 'This step is already complete.');
  return succeed(progress, { tutorial: { ...progress.tutorial, completed: [...progress.tutorial.completed, step] } }, 'Guide updated.');
}
export function skipTutorial(progress: Progress): CommandResult { return succeed(progress, { tutorial: { ...progress.tutorial, skipped: true } }, 'Guide skipped.'); }
export function setPolicy(progress: Progress, policy: Policy): CommandResult {
  if (!['balanced', 'harvest', 'wellbeing', 'trade'].includes(policy)) return fail(progress, 'Choose an island policy.');
  if (!completed(progress, 'town-hall').length) return fail(progress, 'Complete a Town Hall to manage island policies.');
  const simulation = structuredClone(progress.simulation); simulation.policy = policy;
  addEvent(simulation, Date.now(), `Island policy changed to ${policy}.`, 'policy');
  return succeed(progress, { simulation }, 'Island policy updated.');
}
export function upgradeTownHall(progress: Progress, instanceId?: string): CommandResult {
  const hall = completed(progress, 'town-hall').find(b => (!instanceId || b.id === instanceId) && b.level === 1);
  if (!hall) return fail(progress, 'Choose a completed Town Hall that has not been upgraded.');
  const stocked = unloadCargo(progress);
  if (stocked.wallet.timber < 100 || stocked.wallet.stone < 80) return fail(progress, 'The Town Hall upgrade needs 100 timber and 80 stone.');
  const buildings = stocked.buildings.map(b => b.id === hall.id ? { ...b, level: 2 } : b);
  const wallet = { ...stocked.wallet, timber: stocked.wallet.timber - 100, stone: stocked.wallet.stone - 80 };
  const simulation = structuredClone(stocked.simulation); addEvent(simulation, Date.now(), 'The Town Hall reached tier 3. Geothermal engineering is now available.', 'construction');
  const next = unloadCargo({ ...stocked, buildings, wallet, simulation });
  return succeed(progress, next, 'Town Hall upgraded. Tier 3 buildings unlocked.');
}
export interface TradeOffer { id: string; label: string; description: string; available: boolean; coins?: number }
export function tradeOffers(progress: Progress): TradeOffer[] {
  const docked = progress.simulation.ship.phase === 'docked' && completed(progress, 'archipelago-pier').length > 0;
  const multiplier = progress.simulation.policy === 'trade' ? 1.5 : 1;
  const result: TradeOffer[] = [
    { id: 'sell-fish', label: `Sell 5 fish · +${Math.floor(10 * multiplier)} coins`, description: 'Cargo ship must be docked.', available: docked && progress.simulation.goods.fish >= 5 },
    { id: 'sell-planks', label: `Sell 5 planks · +${Math.floor(15 * multiplier)} coins`, description: 'Cargo ship must be docked.', available: docked && progress.simulation.goods.planks >= 5 },
    { id: 'buy-stone', label: 'Import 10 stone · 12 coins', description: 'A docked cargo ship brings construction stone.', coins: 12, available: docked && progress.wallet.coins >= 12 && progress.wallet.stone + 10 <= storageCapacity(progress) },
  ];
  for (const offer of progress.simulation.offers) result.push({ id: offer.id, label: `${offer.item === 'seed-crate' ? 'Rare seeds' : offer.item === 'medicine' ? 'Medicine kit' : 'Navigation chart'} · ${offer.price} coins`,
    description: offer.item === 'seed-crate' ? 'Improves every cottage garden and supplies 10 grain.' : offer.item === 'medicine' ? 'Treats all current fever and restores 30 health.' : 'Clears 25% sea fog permanently. Three charts also allow safe ship docking.',
    coins: offer.price, available: offer.remaining > 0 && progress.wallet.coins >= offer.price && completed(progress, 'visitor-lodge').length > 0 });
  return result;
}
export function trade(progress: Progress, offerId: string): CommandResult {
  const offer = tradeOffers(progress).find(o => o.id === offerId);
  if (!offer?.available) return fail(progress, 'This trade is unavailable. Check the ship, merchant, stock and coins.');
  const next = structuredClone(progress);
  const sim = next.simulation;
  const multiplier = sim.policy === 'trade' ? 1.5 : 1;
  if (offerId === 'sell-fish') { sim.goods.fish -= 5; next.wallet.coins += Math.floor(10 * multiplier); }
  else if (offerId === 'sell-planks') { sim.goods.planks -= 5; next.wallet.coins += Math.floor(15 * multiplier); }
  else if (offerId === 'buy-stone') { next.wallet.coins -= 12; next.wallet.stone += 10; }
  else {
    const rare = sim.offers.find(o => o.id === offerId)!; next.wallet.coins -= rare.price; rare.remaining--;
    if (rare.item === 'seed-crate') { sim.rareItems.seeds++; sim.goods.grain = Math.min(storageCapacity(next), sim.goods.grain + 10); }
    if (rare.item === 'medicine') { sim.rareItems.medicine++; for (const c of sim.citizens) { c.health = Math.min(100, c.health + 30); c.illness = null; c.illSince = null; } }
    if (rare.item === 'navigation-chart') sim.rareItems.charts++;
  }
  if (!validWallet(next.wallet)) return fail(progress, 'This trade exceeds the inventory limit.');
  addEvent(sim, Date.now(), offer.label, 'trade');
  return succeed(progress, next, 'Trade completed.');
}
export function assignCitizen(progress: Progress, citizenId: string, jobId: string | null): CommandResult {
  const person = progress.simulation.citizens.find(c => c.id === citizenId);
  const workers = ['rainwater-collector', 'windmill-bakery', 'medical-clinic', 'lumber-yard', 'archipelago-pier', 'artisan-workshop', 'visitor-lodge'];
  if (!person || (jobId !== null && !completed(progress).some(b => b.id === jobId && workers.includes(b.type)))) return fail(progress, 'Choose a citizen and a completed workplace.');
  const simulation = structuredClone(progress.simulation);
  const current = simulation.citizens.find(c => c.id === citizenId)!;
  const displaced = simulation.citizens.find(c => c.jobId === jobId && c.id !== citizenId);
  if (displaced) displaced.jobId = current.jobId;
  current.jobId = jobId;
  return succeed(progress, { simulation }, `${person.name}'s work assignment updated.`);
}
export function constructionStage(building: BuildingInstance, now: number): { percentage: number; stage: string } {
  const percentage = Math.max(0, Math.min(100, Math.round((now - building.startedAt) / (building.completesAt - building.startedAt) * 100)));
  return { percentage, stage: BUILDINGS[building.type].stages[Math.min(2, Math.floor(percentage / 34))]! };
}
export function nextAvailableLot(progress: Progress, type: BuildingType): LotId | undefined { return availableLots(progress, type)[0]?.id; }

/** Salvage a finished instance to recover space without stranding occupied land. */
export function dismantleBuilding(progress: Progress, instanceId: string): CommandResult {
  const building = progress.buildings.find(b => b.id === instanceId);
  if (!building || building.state !== 'complete') return fail(progress, 'Only a completed building can be dismantled.');
  const buildings = progress.buildings.filter(b => b.id !== instanceId);
  const next = { ...progress, buildings };
  const openLots = new Set(getLots(next).filter(l => l.unlocked).map(l => l.id));
  if (buildings.some(b => !openLots.has(b.lot))) return fail(progress, 'This connection keeps occupied ground accessible. Clear that ground before dismantling it.');
  const wallet = { ...progress.wallet };
  const simulation = structuredClone(progress.simulation);
  const recipe = BUILDINGS[building.type].recipe;
  const capacity = storageCapacity(next);
  for (const material of MATERIALS) {
    const total = wallet[material] + Math.floor(recipe[material] / 2);
    wallet[material] = Math.min(capacity, total);
    simulation.overflow[material] += Math.max(0, total - capacity);
  }
  if (!validWallet(wallet) || !validWallet(simulation.overflow)) return fail(progress, 'The salvage cannot be stored safely.');
  for (const person of simulation.citizens) {
    if (person.homeId === instanceId) person.homeId = null;
    if (person.jobId === instanceId) person.jobId = null;
  }
  simulation.ship.region = Math.min(simulation.ship.region, getRegionCount(next) - 1);
  addEvent(simulation, Date.now(), `${BUILDINGS[building.type].name} dismantled. Half its timber and stone were salvaged.`, 'construction');
  return succeed(progress, unloadCargo({ ...next, wallet, simulation }), 'Space cleared. Half the building materials were kept, including any harbor overflow.');
}
