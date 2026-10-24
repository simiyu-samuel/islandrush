import { BUILDING_IDS } from './catalog';
import type { BuildingId, Progress } from './types';

// Clear grass blocks inspected against island-township-v2.png. Road and park
// interiors are deliberately excluded. Each anchor is the building's ground base.
export const BUILDING_LOTS = {
  harbor: { x: 0.442, y: 0.653, name: 'Harbor green' },
  grove: { x: 0.402, y: 0.452, name: 'Palm grove' },
  east: { x: 0.746, y: 0.309, name: 'East terrace' },
  west: { x: 0.300, y: 0.550, name: 'West garden' },
  square: { x: 0.584, y: 0.504, name: 'Square side' },
  ridge: { x: 0.454, y: 0.197, name: 'Ridge meadow' },
  upper: { x: 0.398, y: 0.280, name: 'Upper grove' },
  shore: { x: 0.846, y: 0.414, name: 'Shore lawn' },
} as const;
export type LotId = keyof typeof BUILDING_LOTS;
export type Facing = 'left' | 'right';
export const LOT_IDS = Object.keys(BUILDING_LOTS) as LotId[];
export const DEFAULT_LOTS: Record<BuildingId, LotId> = { home: 'harbor', workshop: 'grove', lookout: 'east' };
type IslandSites = Pick<Progress, 'buildings' | 'pendingConstruction'>;

export function lotOccupant(progress: IslandSites, lot: LotId, except?: BuildingId): BuildingId | undefined {
  return BUILDING_IDS.find(id => id !== except &&
    (progress.buildings[id].built || progress.buildings[id].lot !== undefined || progress.pendingConstruction?.buildingId === id) &&
    (progress.buildings[id].lot ?? DEFAULT_LOTS[id]) === lot);
}

export function buildingLot(progress: IslandSites, id: BuildingId): LotId {
  const explicit = progress.buildings[id].lot;
  if (explicit) return explicit;
  const preferred = DEFAULT_LOTS[id];
  if (!lotOccupant(progress, preferred, id)) return preferred;
  return LOT_IDS.find(lot => !lotOccupant(progress, lot, id)) ?? preferred;
}
