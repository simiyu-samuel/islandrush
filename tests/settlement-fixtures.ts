import { availableLots } from '../src/model/placement';
import { createProgress } from '../src/model/progress';
import type { BuildingType, Progress } from '../src/model/types';
export const funded = (now = 0): Progress => ({ ...createProgress(now), wallet: { timber: 150, stone: 150, coins: 500 } });
export function addBuilding(progress: Progress, type: BuildingType, level = 1): Progress {
  const next = structuredClone(progress);
  const lot = availableLots(next, type)[0];
  if (!lot) throw new Error(`No eligible test lot for ${type}`);
  next.buildings.push({ id: `test-${type}-${next.buildings.length}`, type, style: 'island', lot: lot.id, facing: 'left', state: 'complete', startedAt: 0, completesAt: 5000, level });
  return next;
}
export function withBuildings(types: BuildingType[], level = 1): Progress {
  return types.reduce((progress, type) => addBuilding(progress, type, type === 'town-hall' ? level : 1), funded());
}
export const legacy = () => ({ version: 1, wallet: { timber: 345, stone: 280, coins: 19 },
  buildings: { home: { style: 'bungalow', built: true, lot: 'ridge', facing: 'right' }, workshop: { style: 'studio', built: false }, lookout: { style: 'lighthouse', built: false } },
  target: 'workshop', pendingConstruction: null, tutorial: { completed: ['welcome', 'choose-style'], skipped: false }, lastSettledRunId: 'earlier-run', settledRunIds: ['earlier-run'], updatedAt: 100000 });
