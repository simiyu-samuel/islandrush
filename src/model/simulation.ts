import type { BuildingInstance, BuildingType, Citizen, Good, Progress, SettlementEvent, SettlementStats, SimulationState, Wallet } from './types';
import { getRegionCount, lotRegion } from './placement';

export const SIMULATION_TICK_MS = 10_000;
export const MAX_OFFLINE_TICKS = 180;
export const SHIP_INTERVAL_MS = 90_000;
export const SHIP_DOCK_MS = 30_000;
export const zeroWallet = (): Wallet => ({ timber: 0, stone: 0, coins: 0 });
const names = ['Amara', 'Kito', 'Nia', 'Juma', 'Zuri', 'Amani', 'Lina', 'Tayo', 'Maya', 'Sefu', 'Imani', 'Noah', 'Asha', 'Kai', 'Eshe', 'Luka'];
export const citizen = (id: number): Citizen => ({ id: `citizen-${id}`, name: names[(id - 1) % names.length]! + (id > names.length ? ` ${Math.ceil(id / names.length)}` : ''), homeId: null, jobId: null, hunger: 10, health: 100, illness: null, illSince: null });
export function initialSimulation(now: number): SimulationState {
  return { lastTickAt: now, tick: 0, citizens: [citizen(1), citizen(2)], nextCitizenId: 3,
    goods: { grain: 20, flour: 0, bread: 20, fish: 0, water: 40, planks: 0, tools: 0 },
    overflow: zeroWallet(), forest: 100, policy: 'balanced', visitors: [], offers: [],
    rareItems: { seeds: 0, medicine: 0, charts: 0 },
    ship: { phase: 'sailing', progress: 0, arrivesAt: now + SHIP_INTERVAL_MS, departsAt: now + SHIP_INTERVAL_MS + SHIP_DOCK_MS, region: 0, visits: 0 },
    events: [{ id: 'event-welcome', at: now, text: 'Two pioneers have arrived. Build homes, water and food to help them settle.', kind: 'arrival' }],
    festivals: 0, lastFestivalAt: now };
}
export function completed(progress: Pick<Progress, 'buildings'>, type?: BuildingType): BuildingInstance[] {
  return progress.buildings.filter(b => b.state === 'complete' && (!type || b.type === type));
}
export function addEvent(sim: SimulationState, at: number, text: string, kind: SettlementEvent['kind']): void {
  const previousSerial = Number(sim.events.at(-1)?.id.match(/^event-\d+-\d+-(\d+)$/)?.[1] ?? 0);
  sim.events.push({ id: `event-${at}-${sim.tick}-${previousSerial + 1}`, at, text, kind });
  sim.events = sim.events.slice(-30);
}
export function storageCapacity(progress: Pick<Progress, 'buildings'>): number {
  return 150 + completed(progress, 'storage-depot').length * 150;
}
export function settlementStats(progress: Progress): SettlementStats {
  const sim = progress.simulation;
  const count = (type: BuildingType) => completed(progress, type).length;
  const capacity = count('pioneer-cottage') * 4 + count('terrace-hamlet') * 10;
  const pop = sim.citizens.length;
  const avg = (key: 'health' | 'hunger') => pop ? sim.citizens.reduce((n, c) => n + c[key], 0) / pop : 0;
  const power = count('geothermal-generator') * 12;
  const powerDemand = count('terrace-hamlet') * 2 + count('medical-clinic') * 2 + completed(progress).filter(b => b.type === 'town-hall' && b.level >= 2).length * 2;
  const hall = completed(progress, 'town-hall');
  const tier = hall.some(b => b.level >= 2) ? 3 : hall.length ? 2 : 1;
  const workers: Record<string, number> = {};
  for (const c of sim.citizens) if (c.jobId) workers[c.jobId] = (workers[c.jobId] ?? 0) + 1;
  const homeless = sim.citizens.filter(c => !c.homeId).length;
  const brownout = powerDemand > power ? 6 : 0;
  const happiness = Math.max(0, Math.min(100, Math.round(74 - brownout - avg('hunger') * .45 - homeless * 5 + Math.min(18, count('community-plaza') * 6) + (sim.policy === 'wellbeing' ? 10 : sim.policy === 'harvest' ? -8 : 0) + (sim.lastTickAt - sim.lastFestivalAt < 40_000 && sim.festivals > 0 ? 12 : 0))));
  return { population: pop, capacity, happiness, health: Math.round(avg('health')), water: sim.goods.water,
    food: sim.goods.bread + sim.goods.fish, power, powerDemand, storageCapacity: storageCapacity(progress),
    forest: Math.round(sim.forest), fog: Math.max(0, 100 - count('coastal-lighthouse') * 100 - sim.rareItems.charts * 25),
    employed: sim.citizens.filter(c => c.jobId).length, sick: sim.citizens.filter(c => c.illness).length,
    tourists: sim.visitors.length, workers, tier };
}
export function unloadCargo(progress: Progress): Progress {
  const limit = storageCapacity(progress);
  const wallet = { ...progress.wallet };
  const overflow = { ...progress.simulation.overflow };
  let changed = false;
  for (const key of ['timber', 'stone', 'coins'] as const) {
    const capacity = key === 'coins' ? Number.MAX_SAFE_INTEGER : limit;
    const quantity = Math.min(overflow[key], Math.max(0, capacity - wallet[key]));
    if (quantity > 0) { wallet[key] += quantity; overflow[key] -= quantity; changed = true; }
  }
  return changed ? { ...progress, wallet, simulation: { ...progress.simulation, overflow } } : progress;
}
const workerTypes: BuildingType[] = ['rainwater-collector', 'windmill-bakery', 'medical-clinic', 'lumber-yard', 'archipelago-pier', 'artisan-workshop', 'visitor-lodge'];
function settleHomesAndJobs(progress: Progress): void {
  const sim = progress.simulation;
  const homes = completed(progress).filter(b => b.type === 'pioneer-cottage' || b.type === 'terrace-hamlet');
  const capacities = new Map(homes.map(b => [b.id, b.type === 'pioneer-cottage' ? 4 : 10]));
  for (const c of sim.citizens) {
    const current = c.homeId && capacities.get(c.homeId);
    if (current) capacities.set(c.homeId!, current - 1); else c.homeId = null;
  }
  for (const c of sim.citizens) if (!c.homeId) {
    const free = homes.find(b => (capacities.get(b.id) ?? 0) > 0);
    if (free) { c.homeId = free.id; capacities.set(free.id, capacities.get(free.id)! - 1); }
  }
  const workplaces = completed(progress).filter(b => workerTypes.includes(b.type));
  const occupied = new Set<string>();
  for (const c of sim.citizens) {
    if (c.jobId && workplaces.some(b => b.id === c.jobId) && !occupied.has(c.jobId)) occupied.add(c.jobId);
    else c.jobId = null;
  }
  // Keep manual assignments; give unassigned citizens essential jobs first.
  for (const type of workerTypes) for (const b of workplaces.filter(w => w.type === type && !occupied.has(w.id))) {
    const free = sim.citizens.find(c => c.jobId === null);
    if (free) { free.jobId = b.id; occupied.add(b.id); }
  }
}
function tickSettlement(progress: Progress, at: number): void {
  const sim = progress.simulation;
  sim.lastTickAt = at; sim.tick++;
  settleHomesAndJobs(progress);
  let stats = settlementStats(progress);
  const count = (type: BuildingType) => completed(progress, type).length;
  const working = (b: BuildingInstance) => sim.citizens.some(c => c.jobId === b.id && (c.health > 25 || sim.tick % 2 === 0));
  const limit = stats.storageCapacity;
  const addGood = (good: Good, quantity: number) => { sim.goods[good] = Math.min(limit, sim.goods[good] + quantity); };
  const addStock = (material: 'timber' | 'stone', quantity: number) => { progress.wallet[material] = Math.min(limit, progress.wallet[material] + quantity); };
  const wellbeing = sim.policy === 'wellbeing';
  sim.forest = Math.min(100, sim.forest + (sim.policy === 'harvest' ? .25 : 2));
  for (const b of completed(progress)) {
    if (!working(b)) continue;
    switch (b.type) {
      case 'rainwater-collector': addGood('water', wellbeing ? 10 : 8); break;
      case 'lumber-yard': {
        if (sim.forest >= 3 && progress.wallet.timber < limit) {
          const amount = sim.policy === 'harvest' ? 5 : sim.goods.tools > 0 ? 4 : 3;
          addStock('timber', amount); sim.forest = Math.max(0, sim.forest - (sim.policy === 'harvest' ? 5 : 2));
          if (sim.tick % 12 === 0) addEvent(sim, at, 'The lumber crew delivered timber and replanted the grove.', 'production');
        }
        break;
      }
      case 'artisan-workshop':
        if (sim.goods.planks >= 2 && sim.tick % 3 === 0 && sim.goods.tools < limit) { sim.goods.planks -= 2; addGood('tools', 1); }
        else if (progress.wallet.timber >= 2 && sim.goods.planks < limit) { progress.wallet.timber -= 2; addGood('planks', 2); }
        break;
      case 'windmill-bakery':
        if (sim.goods.flour >= 1 && sim.goods.water >= 1 && sim.goods.bread < limit) { sim.goods.flour--; sim.goods.water--; addGood('bread', 4); }
        else if (sim.goods.grain >= 2 && sim.goods.flour < limit) { sim.goods.grain -= 2; addGood('flour', 3); }
        break;
      case 'archipelago-pier': addGood('fish', sim.policy === 'trade' ? 4 : 3); break;
      case 'medical-clinic': {
        const powered = stats.power >= stats.powerDemand;
        const patients = sim.citizens.filter(c => c.illness || c.health < 95).sort((a, b) => a.health - b.health).slice(0, powered ? 4 : 2);
        for (const patient of patients) if (sim.goods.water >= 1) {
          sim.goods.water--; patient.health = Math.min(100, patient.health + (powered ? 16 : 10));
          if (patient.illness && patient.health >= 65) { patient.illness = null; patient.illSince = null; addEvent(sim, at, `${patient.name} recovered after treatment at the clinic.`, 'health'); }
        }
        break;
      }
    }
  }
  // Every occupied cottage has a small family garden. No invisible agricultural building is required.
  for (const home of completed(progress, 'pioneer-cottage')) {
    if (sim.citizens.some(c => c.homeId === home.id) && sim.goods.water >= 1 && sim.goods.grain < limit) {
      sim.goods.water--; addGood('grain', sim.rareItems.seeds > 0 ? 3 : 2);
    }
  }
  const staffedClinic = completed(progress, 'medical-clinic').some(working) && sim.goods.water > 0;
  for (const c of sim.citizens) {
    c.hunger = Math.min(100, c.hunger + (wellbeing ? 2 : 3));
    if (c.hunger >= 15) {
      const food = sim.goods.bread > 0 ? 'bread' : sim.goods.fish > 0 ? 'fish' : null;
      if (food) { sim.goods[food]--; c.hunger = Math.max(0, c.hunger - 20); }
    }
    const hydrated = sim.goods.water > 0;
    if (hydrated) sim.goods.water--;
    const shortage = c.hunger > 65 || !hydrated;
    c.health = Math.max(10, Math.min(100, c.health + (shortage ? -5 : c.illness ? -2 : 2)));
    if (!c.illness && shortage && c.health <= 65 && !staffedClinic && (sim.tick + Number(c.id.split('-').at(-1))) % 3 === 0) {
      c.illness = 'fever'; c.illSince = at; addEvent(sim, at, `${c.name} developed a shortage-related fever. Restore food, water and clinic care.`, 'health');
    }
    // Healthy living also permits gradual recovery; illness never permanently removes a citizen.
    if (c.illness && !shortage && c.health >= 85) { c.illness = null; c.illSince = null; }
  }
  stats = settlementStats(progress);
  if (sim.tick % 3 === 0 && stats.population < stats.capacity) {
    const newcomer = citizen(sim.nextCitizenId++); sim.citizens.push(newcomer);
    addEvent(sim, at, `${newcomer.name} arrived and is looking for a home and useful work.`, 'arrival');
    settleHomesAndJobs(progress);
  }
  if (count('community-plaza') && at - sim.lastFestivalAt >= 120_000 && sim.goods.water >= 3 && stats.food >= 3) {
    sim.goods.water -= 3;
    const bread = Math.min(3, sim.goods.bread); sim.goods.bread -= bread; sim.goods.fish -= 3 - bread;
    sim.festivals++; sim.lastFestivalAt = at;
    addEvent(sim, at, 'Lantern festival! Neighbors gathered in the plaza; island happiness is boosted.', 'arrival');
  }
  sim.visitors = sim.visitors.filter(v => {
    if (v.leavesAt > at) return true;
    addEvent(sim, at, `${v.name} left the lodge after a coastal stay.`, 'arrival'); return false;
  });
  const lodgeCount = count('visitor-lodge');
  if (lodgeCount && sim.tick % 6 === 0 && sim.visitors.length < lodgeCount * 3 && stats.happiness >= 20) {
    const id = `visitor-${sim.tick}`;
    const staffedLodge = completed(progress, 'visitor-lodge').some(working);
    const spending = (sim.policy === 'trade' ? 9 : 6) + (staffedLodge ? 3 : 0);
    sim.visitors.push({ id, name: `Traveler ${Math.floor(sim.tick / 6)}`, arrivedAt: at, leavesAt: at + 90_000, spending });
    progress.wallet.coins += spending;
    addEvent(sim, at, 'A tourist checked into the lodge and spent coins in the settlement.', 'trade');
  }
  if (lodgeCount && sim.tick % 12 === 0) {
    sim.offers = [{ id: `offer-${sim.tick}-seeds`, item: 'seed-crate', price: 20, remaining: 1 }, { id: `offer-${sim.tick}-medicine`, item: 'medicine', price: 15, remaining: 2 }, { id: `offer-${sim.tick}-chart`, item: 'navigation-chart', price: 25, remaining: 1 }];
    addEvent(sim, at, 'A traveling merchant opened rare supplies at the lodge for the next 2 minutes.', 'trade');
  }
  const ship = sim.ship;
  const piers = completed(progress, 'archipelago-pier');
  // Schedule is continuous: 60 seconds approaching, 30 seconds docked in each 90-second cycle.
  if (at >= ship.departsAt) { const cycles = Math.floor((at - ship.departsAt) / SHIP_INTERVAL_MS) + 1; ship.arrivesAt += cycles * SHIP_INTERVAL_MS; ship.departsAt += cycles * SHIP_INTERVAL_MS; }
  const safe = stats.fog <= 25;
  const nextPhase = at >= ship.arrivesAt ? piers.length ? safe ? 'docked' : 'fogbound' : 'sailing' : 'sailing';
  if (nextPhase === 'docked' && ship.phase !== 'docked') {
    ship.visits++; ship.region = lotRegion(piers[(ship.visits - 1) % piers.length]!.lot);
    addEvent(sim, at, 'The cargo ship is docked for 30 seconds. Fish and planks can be traded for coins or stone.', 'trade');
  } else if (nextPhase === 'fogbound' && ship.phase !== 'fogbound') addEvent(sim, at, 'The cargo ship is waiting offshore. A lighthouse or navigation charts can clear the route.', 'trade');
  ship.phase = nextPhase;
  ship.progress = nextPhase === 'sailing' ? Math.max(0, Math.min(1, (at - (ship.arrivesAt - 60_000)) / 60_000)) : nextPhase === 'docked' ? (at - ship.arrivesAt) / SHIP_DOCK_MS : 1;
  if (!piers.length) ship.region = Math.min(ship.region, getRegionCount(progress) - 1);
}
export function advanceSettlement(progress: Progress, now: number): Progress {
  if (!Number.isSafeInteger(now) || now < 0 || now > 8_640_000_000_000_000 || now - progress.simulation.lastTickAt < SIMULATION_TICK_MS) return progress;
  const elapsedTicks = Math.floor((now - progress.simulation.lastTickAt) / SIMULATION_TICK_MS);
  const count = Math.min(MAX_OFFLINE_TICKS, elapsedTicks);
  const next: Progress = structuredClone(progress);
  // Skip excess offline wall time before running the bounded 30-minute simulation window.
  const start = progress.simulation.lastTickAt + (elapsedTicks - count) * SIMULATION_TICK_MS;
  for (let index = 1; index <= count; index++) tickSettlement(next, start + index * SIMULATION_TICK_MS);
  next.updatedAt = Math.max(progress.updatedAt + 1, now);
  return unloadCargo(next);
}
