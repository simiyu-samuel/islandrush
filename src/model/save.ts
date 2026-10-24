import { BLOCK_IDS, getLots } from './placement';
import { BUILDING_IDS, BUILDINGS } from './catalog';
import { CONSTRUCTION_DURATION_MS, createProgress } from './progress';
import type { BuildingType, LoadResult, Progress, SaveResult, StorageAdapter, StyleId, TutorialStep } from './types';
export const SAVE_KEY = 'island-rush:progress:v1';
export const LEGACY_BACKUP_KEY = `${SAVE_KEY}:backup:v1`;
const TUTORIAL_STEPS: TutorialStep[] = ['welcome', 'choose-style', 'first-run', 'results', 'build'];
const GOODS = ['grain', 'flour', 'bread', 'fish', 'water', 'planks', 'tools'];
const record = (value: unknown): value is Record<string, any> => value !== null && typeof value === 'object' && !Array.isArray(value);
const keysAre = (value: Record<string, unknown>, keys: readonly string[]) => Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
const integer = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0;
const time = (value: unknown): value is number => integer(value) && value <= 8_640_000_000_000_000;
const id = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length <= 200;
const range = (value: unknown, max: number) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max;
const nullableId = (value: unknown) => value === null || id(value);
const wallet = (value: unknown) => record(value) && keysAre(value, ['timber', 'stone', 'coins']) && Object.values(value).every(integer);
function common(value: Record<string, any>): boolean {
  const tutorial = value.tutorial;
  if (!record(tutorial) || !keysAre(tutorial, ['completed', 'skipped']) || typeof tutorial.skipped !== 'boolean' || !Array.isArray(tutorial.completed) || !tutorial.completed.every(step => TUTORIAL_STEPS.includes(step)) || new Set(tutorial.completed).size !== tutorial.completed.length) return false;
  const ids = value.settledRunIds;
  return Array.isArray(ids) && ids.every(id) && new Set(ids).size === ids.length && (ids.length ? value.lastSettledRunId === ids[ids.length - 1] : value.lastSettledRunId === null);
}
export function validateProgress(value: unknown): value is Progress {
  if (!record(value) || !keysAre(value, ['version', 'wallet', 'buildings', 'target', 'designs', 'tutorial', 'lastSettledRunId', 'settledRunIds', 'updatedAt', 'simulation']) || value.version !== 2 || !time(value.updatedAt) || !wallet(value.wallet) || !common(value)) return false;
  if (!BUILDING_IDS.includes(value.target) || !record(value.designs) || !keysAre(value.designs, BUILDING_IDS) || BUILDING_IDS.some(type => !BUILDINGS[type].styles.some(style => style.id === value.designs[type]))) return false;
  if (!Array.isArray(value.buildings)) return false;
  const ids = new Set<string>(); const lots = new Set<string>();
  for (const b of value.buildings) {
    if (!record(b) || !keysAre(b, ['id', 'type', 'style', 'lot', 'facing', 'state', 'startedAt', 'completesAt', 'level', ...(Object.hasOwn(b, 'legacy') ? ['legacy'] : [])]) || !id(b.id) || ids.has(b.id) || !BUILDING_IDS.includes(b.type) || !BUILDINGS[b.type as BuildingType].styles.some(s => s.id === b.style) || !id(b.lot) || lots.has(b.lot) || !['left', 'right'].includes(b.facing) || !['building', 'complete'].includes(b.state) || !time(b.startedAt) || !time(b.completesAt) || b.completesAt - b.startedAt !== CONSTRUCTION_DURATION_MS || !integer(b.level) || (b.type === 'town-hall' ? b.level < 1 || b.level > 2 : b.level !== 1) || (b.legacy !== undefined && (b.legacy !== true || !['legacy-home', 'legacy-workshop', 'legacy-lookout'].includes(b.id)))) return false;
    ids.add(b.id); lots.add(b.lot);
  }
  const available = getLots(value as Progress);
  for (const b of value.buildings) {
    const lot = available.find(l => l.id === b.lot);
    const terrain = BUILDINGS[b.type as BuildingType].terrain;
    if (!lot?.unlocked || (!b.legacy && terrain !== 'any' && !lot.tags.includes(terrain))) return false;
  }
  const sim = value.simulation;
  if (!record(sim) || !keysAre(sim, ['lastTickAt', 'tick', 'citizens', 'nextCitizenId', 'goods', 'overflow', 'forest', 'policy', 'visitors', 'offers', 'rareItems', 'ship', 'events', 'festivals', 'lastFestivalAt']) || !time(sim.lastTickAt) || !integer(sim.tick) || !integer(sim.nextCitizenId) || sim.nextCitizenId < 1 || !record(sim.goods) || !keysAre(sim.goods, GOODS) || !Object.values(sim.goods).every(integer) || !wallet(sim.overflow) || !range(sim.forest, 100) || !['balanced', 'harvest', 'wellbeing', 'trade'].includes(sim.policy) || !integer(sim.festivals) || !time(sim.lastFestivalAt)) return false;
  const personIds = new Set<string>(); const jobs = new Set<string>();
  if (!Array.isArray(sim.citizens)) return false;
  for (const c of sim.citizens) {
    if (!record(c) || !keysAre(c, ['id', 'name', 'homeId', 'jobId', 'hunger', 'health', 'illness', 'illSince']) || !id(c.id) || personIds.has(c.id) || !/^citizen-[1-9]\d*$/.test(c.id) || Number(c.id.slice(8)) >= sim.nextCitizenId || !id(c.name) || !nullableId(c.homeId) || !nullableId(c.jobId) || !range(c.hunger, 100) || !range(c.health, 100) || ![null, 'fever'].includes(c.illness) || (c.illness === null ? c.illSince !== null : !time(c.illSince))) return false;
    if (c.homeId && !value.buildings.some((b: any) => b.id === c.homeId && b.state === 'complete' && ['pioneer-cottage', 'terrace-hamlet'].includes(b.type))) return false;
    if (c.jobId && (jobs.has(c.jobId) || !value.buildings.some((b: any) => b.id === c.jobId && b.state === 'complete' && ['rainwater-collector', 'windmill-bakery', 'medical-clinic', 'lumber-yard', 'archipelago-pier', 'artisan-workshop', 'visitor-lodge'].includes(b.type)))) return false;
    personIds.add(c.id); if (c.jobId) jobs.add(c.jobId);
  }
  if (!Array.isArray(sim.visitors) || !sim.visitors.every((v: unknown) => record(v) && keysAre(v, ['id', 'name', 'arrivedAt', 'leavesAt', 'spending']) && id(v.id) && id(v.name) && time(v.arrivedAt) && time(v.leavesAt) && v.leavesAt > v.arrivedAt && integer(v.spending))) return false;
  if (!Array.isArray(sim.offers) || !sim.offers.every((o: unknown) => record(o) && keysAre(o, ['id', 'item', 'price', 'remaining']) && id(o.id) && ['seed-crate', 'medicine', 'navigation-chart'].includes(o.item) && integer(o.price) && integer(o.remaining))) return false;
  if (!record(sim.rareItems) || !keysAre(sim.rareItems, ['seeds', 'medicine', 'charts']) || !Object.values(sim.rareItems).every(integer)) return false;
  const ship = sim.ship;
  if (!record(ship) || !keysAre(ship, ['phase', 'progress', 'arrivesAt', 'departsAt', 'region', 'visits']) || !['sailing', 'docked', 'fogbound'].includes(ship.phase) || !range(ship.progress, 1) || !time(ship.arrivesAt) || !time(ship.departsAt) || ship.departsAt - ship.arrivesAt !== 30_000 || !integer(ship.region) || ship.region >= 1 + value.buildings.filter((b: any) => b.state === 'complete' && b.type === 'bridge-link').length || !integer(ship.visits)) return false;
  if (!Array.isArray(sim.events) || sim.events.length > 30 || !sim.events.every((e: unknown) => record(e) && keysAre(e, ['id', 'at', 'text', 'kind']) && id(e.id) && time(e.at) && typeof e.text === 'string' && e.text.length > 0 && e.text.length <= 1000 && ['arrival', 'production', 'health', 'trade', 'construction', 'policy'].includes(e.kind))) return false;
  return true;
}
const oldIds = ['home', 'workshop', 'lookout'] as const;
const oldTypes: Record<typeof oldIds[number], BuildingType> = { home: 'pioneer-cottage', workshop: 'artisan-workshop', lookout: 'coastal-lighthouse' };
const oldDefault = { home: 'harbor', workshop: 'grove', lookout: 'east' };
function migrateLegacy(value: unknown): Progress | null {
  if (!record(value)) return null;
  const hasPending = Object.hasOwn(value, 'pendingConstruction');
  if (!keysAre(value, ['version', 'wallet', 'buildings', 'target', 'tutorial', 'lastSettledRunId', 'settledRunIds', 'updatedAt', ...(hasPending ? ['pendingConstruction'] : [])]) || value.version !== 1 || !wallet(value.wallet) || !time(value.updatedAt) || !common(value) || !record(value.buildings) || !keysAre(value.buildings, oldIds)) return null;
  const reserved = new Set<string>();
  for (const key of oldIds) {
    const b = value.buildings[key];
    const styles = key === 'home' ? ['cottage', 'bungalow'] : key === 'workshop' ? ['forge', 'studio'] : ['lighthouse', 'watchtower'];
    if (!record(b) || !keysAre(b, ['style', 'built', ...(Object.hasOwn(b, 'lot') ? ['lot'] : []), ...(Object.hasOwn(b, 'facing') ? ['facing'] : [])]) || !styles.includes(b.style) || typeof b.built !== 'boolean' || (b.lot !== undefined && !BLOCK_IDS.includes(b.lot)) || (b.facing !== undefined && !['left', 'right'].includes(b.facing))) return null;
    if (b.built || b.lot !== undefined || value.pendingConstruction?.buildingId === key) {
      const lot = b.lot ?? oldDefault[key]; if (reserved.has(lot)) return null; reserved.add(lot);
    }
  }
  if (!value.buildings.home.built && (value.buildings.workshop.built || value.buildings.lookout.built)) return null;
  const allBuilt = oldIds.every(key => value.buildings[key].built);
  if (allBuilt ? value.target !== null : !oldIds.includes(value.target) || value.buildings[value.target].built || (value.target !== 'home' && !value.buildings.home.built)) return null;
  const pending = value.pendingConstruction;
  if (pending !== undefined && pending !== null && (!record(pending) || !keysAre(pending, ['buildingId', 'startedAt', 'completesAt']) || !oldIds.includes(pending.buildingId) || value.target !== pending.buildingId || value.buildings[pending.buildingId].built || !time(pending.startedAt) || !time(pending.completesAt) || pending.completesAt - pending.startedAt !== CONSTRUCTION_DURATION_MS)) return null;
  const next = createProgress(value.updatedAt);
  next.wallet = { ...value.wallet }; next.tutorial = structuredClone(value.tutorial);
  next.lastSettledRunId = value.lastSettledRunId; next.settledRunIds = [...value.settledRunIds];
  next.target = value.target ? oldTypes[value.target as typeof oldIds[number]] : 'pioneer-cottage';
  for (const key of oldIds) {
    const old: Record<string, any> = value.buildings[key];
    const type = key === 'lookout' && old.style === 'watchtower' ? 'border-outpost' : oldTypes[key];
    next.designs[type] = old.style as StyleId;
    if (key === 'lookout' && value.target === key) next.target = type;
    if (!old.built && pending?.buildingId !== key) continue;
    const active = pending?.buildingId === key;
    const startedAt = active ? pending.startedAt : Math.max(0, value.updatedAt - CONSTRUCTION_DURATION_MS);
    next.buildings.push({ id: `legacy-${key}`, type, style: old.style as StyleId, lot: `0:${old.lot ?? oldDefault[key]}:0`, facing: old.facing ?? 'left', legacy: true, state: active ? 'building' : 'complete', startedAt, completesAt: active ? pending.completesAt : startedAt + CONSTRUCTION_DURATION_MS, level: 1 });
  }
  return validateProgress(next) ? next : null;
}
const corrupt = (raw: string): LoadResult => ({ status: 'corrupt', raw, message: 'This saved island could not be read. It has been preserved until you choose a fresh start.' });
export function loadProgress(storage: StorageAdapter | null | undefined): LoadResult {
  if (!storage) return { status: 'unavailable', message: 'Browser saving is unavailable. This island will last for this session.' };
  let raw: string | null;
  try { raw = storage.getItem(SAVE_KEY); } catch { return { status: 'unavailable', message: 'Browser saving is unavailable. This island will last for this session.' }; }
  if (raw === null) return { status: 'empty' };
  try {
    const value: unknown = JSON.parse(raw);
    if (validateProgress(value)) return { status: 'ok', progress: value };
    const migrated = migrateLegacy(value);
    return migrated ? { status: 'ok', progress: migrated, migrated: true } : corrupt(raw);
  } catch { return corrupt(raw); }
}
export function saveProgress(storage: StorageAdapter | null | undefined, progress: Progress, options: { overwriteCorrupt?: boolean } = {}): SaveResult {
  if (!validateProgress(progress)) return { ok: false, reason: 'invalid', message: 'This island could not be saved because its data is invalid.' };
  if (!storage) return { ok: false, reason: 'unavailable', message: 'Saving is unavailable. Your progress is kept for this session.' };
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (raw !== null) {
      let value: unknown; try { value = JSON.parse(raw); } catch { value = null; }
      if (!validateProgress(value)) {
        const migrated = migrateLegacy(value);
        if (migrated) {
          // Backup must succeed before the first V2 write. A failed backup leaves
          // the original save untouched and the migrated island usable in-session.
          const prior = storage.getItem(LEGACY_BACKUP_KEY);
          storage.setItem(prior === null || prior === raw ? LEGACY_BACKUP_KEY : `${LEGACY_BACKUP_KEY}:${migrated.updatedAt}`, raw);
        } else if (!options.overwriteCorrupt) return { ok: false, reason: 'corrupt', message: 'The unreadable saved island is preserved. Confirm a fresh start before replacing it.' };
      }
    }
    storage.setItem(SAVE_KEY, JSON.stringify(progress)); return { ok: true };
  } catch { return { ok: false, reason: 'unavailable', message: 'Your browser could not save this change. Progress is kept for this session.' }; }
}
