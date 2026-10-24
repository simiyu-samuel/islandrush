import { LOT_IDS, DEFAULT_LOTS } from './placement';
import { BUILDING_IDS, BUILDINGS } from './catalog';
import { CONSTRUCTION_DURATION_MS } from './progress';
import type { LoadResult, Progress, SaveResult, StorageAdapter, TutorialStep } from './types';

export const SAVE_KEY = 'island-rush:progress:v1';
const TUTORIAL_STEPS: TutorialStep[] = ['welcome', 'choose-style', 'first-run', 'results', 'build'];
const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const keysAre = (value: Record<string, unknown>, keys: string[]) =>
  Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
const nonnegativeInteger = (value: unknown) => Number.isSafeInteger(value) && (value as number) >= 0;
const validId = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length <= 200;

export function validateProgress(value: unknown): value is Progress {
  if (!record(value)) return false;
  const hasConstruction = Object.hasOwn(value, 'pendingConstruction');
  const expectedKeys = [
    'version', 'wallet', 'buildings', 'target', 'tutorial',
    'lastSettledRunId', 'settledRunIds', 'updatedAt',
    ...(hasConstruction ? ['pendingConstruction'] : []),
  ];
  if (!keysAre(value, expectedKeys) || value.version !== 1 || !nonnegativeInteger(value.updatedAt)) return false;
  const wallet = value.wallet;
  if (!record(wallet) || !keysAre(wallet, ['timber', 'stone', 'coins']) ||
    !Object.values(wallet).every(nonnegativeInteger)) return false;
  const buildings = value.buildings;
  if (!record(buildings) || !keysAre(buildings, BUILDING_IDS)) return false;
  for (const id of BUILDING_IDS) {
    const building = buildings[id];
    if (!record(building) || !keysAre(building, ['style', 'built', ...(Object.hasOwn(building, 'lot') ? ['lot'] : []), ...(Object.hasOwn(building, 'facing') ? ['facing'] : [])]) || typeof building.built !== 'boolean' ||
      !BUILDINGS[id].styles.some(style => style.id === building.style)) return false;
  }
  for (const id of BUILDING_IDS) {
    const state = buildings[id] as Record<string, unknown>;
    if (Object.hasOwn(state, 'lot') && !LOT_IDS.includes(state.lot as typeof LOT_IDS[number])) return false;
    if (Object.hasOwn(state, 'facing') && state.facing !== 'left' && state.facing !== 'right') return false;
  }
  const reserved = BUILDING_IDS.filter(id => {
    const state = buildings[id] as Record<string, unknown>;
    return state.built || state.lot !== undefined || (record(value.pendingConstruction) && value.pendingConstruction.buildingId === id);
  }).map(id => (buildings[id] as Record<string, unknown>).lot ?? DEFAULT_LOTS[id]);
  if (new Set(reserved).size !== reserved.length) return false;
  const built = (id: keyof Progress['buildings']) => (buildings[id] as { built: boolean }).built;
  if (!built('home') && (built('workshop') || built('lookout'))) return false;
  const complete = BUILDING_IDS.every(id => built(id));
  if (complete) {
    if (value.target !== null) return false;
  } else {
    if (!BUILDING_IDS.includes(value.target as typeof BUILDING_IDS[number])) return false;
    const target = value.target as typeof BUILDING_IDS[number];
    if (built(target) || (target !== 'home' && !built('home'))) return false;
  }
  if (hasConstruction && value.pendingConstruction !== null) {
    const pending = value.pendingConstruction;
    if (!record(pending) || !keysAre(pending, ['buildingId', 'startedAt', 'completesAt']) ||
      !BUILDING_IDS.includes(pending.buildingId as typeof BUILDING_IDS[number]) ||
      !nonnegativeInteger(pending.startedAt) || !nonnegativeInteger(pending.completesAt) ||
      (pending.completesAt as number) > 8_640_000_000_000_000 ||
      (pending.completesAt as number) - (pending.startedAt as number) !== CONSTRUCTION_DURATION_MS) return false;
    const buildingId = pending.buildingId as typeof BUILDING_IDS[number];
    if (value.target !== buildingId || built(buildingId) || (buildingId !== 'home' && !built('home'))) return false;
  }
  const tutorial = value.tutorial;
  if (!record(tutorial) || !keysAre(tutorial, ['completed', 'skipped']) || typeof tutorial.skipped !== 'boolean' ||
    !Array.isArray(tutorial.completed) || !tutorial.completed.every(step => TUTORIAL_STEPS.includes(step)) ||
    new Set(tutorial.completed).size !== tutorial.completed.length) return false;
  const ids = value.settledRunIds;
  if (!Array.isArray(ids) || !ids.every(validId) || new Set(ids).size !== ids.length) return false;
  if (ids.length === 0 ? value.lastSettledRunId !== null : value.lastSettledRunId !== ids[ids.length - 1]) return false;
  return true;
}
export function loadProgress(storage: StorageAdapter | null | undefined): LoadResult {
  if (!storage) return { status: 'unavailable', message: 'Browser saving is unavailable. This island will last for this session.' };
  let raw: string | null;
  try { raw = storage.getItem(SAVE_KEY); }
  catch { return { status: 'unavailable', message: 'Browser saving is unavailable. This island will last for this session.' }; }
  if (raw === null) return { status: 'empty' };
  try {
    const parsed: unknown = JSON.parse(raw);
    return validateProgress(parsed) ? { status: 'ok', progress: parsed } :
      { status: 'corrupt', raw, message: 'This saved island could not be read. It has been preserved until you choose a fresh start.' };
  } catch {
    return { status: 'corrupt', raw, message: 'This saved island could not be read. It has been preserved until you choose a fresh start.' };
  }
}
export function saveProgress(
  storage: StorageAdapter | null | undefined,
  progress: Progress,
  options: { overwriteCorrupt?: boolean } = {},
): SaveResult {
  if (!validateProgress(progress)) return { ok: false, reason: 'invalid', message: 'This island could not be saved because its data is invalid.' };
  if (!storage) return { ok: false, reason: 'unavailable', message: 'Saving is unavailable. Your progress is kept for this session.' };
  // The explicit option is reserved for a confirmed fresh-start action.
  const existing = loadProgress(storage);
  if (existing.status === 'corrupt' && !options.overwriteCorrupt) {
    return { ok: false, reason: 'corrupt', message: 'The unreadable saved island is preserved. Confirm a fresh start before replacing it.' };
  }
  if (existing.status === 'unavailable') return { ok: false, reason: 'unavailable', message: existing.message };
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(progress));
    return { ok: true };
  } catch {
    return { ok: false, reason: 'unavailable', message: 'Your browser could not save this change. Progress is kept for this session.' };
  }
}
