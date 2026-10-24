import { BUILDINGS } from './catalog';
import type { BuildingInstance, BuildingType, Progress } from './types';
export type LotId = string;
export type Facing = 'left' | 'right';
export interface BuildingLot { id: LotId; name: string; region: number; block: string; x: number; y: number; tags: string[]; unlocked: boolean }
// Macroblocks lie inside existing painted grass clearings. Four small foundations
// replace each old oversized anchor, leaving roads, plazas and coastline clear.
export const BUILDING_LOTS = {
  harbor: { x: .442, y: .653, name: 'Harbor green', tags: ['coast', 'edge'] },
  grove: { x: .402, y: .452, name: 'Palm grove', tags: ['forest', 'spring'] },
  east: { x: .746, y: .309, name: 'East terrace', tags: ['coast', 'hill'] },
  west: { x: .300, y: .550, name: 'West garden', tags: ['forest', 'edge'] },
  square: { x: .584, y: .504, name: 'Square side', tags: ['hill'] },
  ridge: { x: .454, y: .197, name: 'Ridge meadow', tags: ['spring', 'hill'] },
  upper: { x: .398, y: .280, name: 'Upper grove', tags: ['forest', 'hill', 'edge'] },
  shore: { x: .846, y: .414, name: 'Shore lawn', tags: ['coast', 'edge'] },
} as const;
export const BLOCK_IDS = Object.keys(BUILDING_LOTS) as (keyof typeof BUILDING_LOTS)[];
export const LOT_IDS = BLOCK_IDS.flatMap(block => [0, 1, 2, 3].map(cell => `0:${block}:${cell}`));
export function lotRegion(id: string): number { return Number(id.split(':')[0]); }
export function getRegionCount(progress: Pick<Progress, 'buildings'>): number {
  return 1 + progress.buildings.filter(b => b.type === 'bridge-link' && b.state === 'complete').length;
}
export function getLots(progress: Pick<Progress, 'buildings'>): BuildingLot[] {
  const lots: BuildingLot[] = [];
  for (let region = 0; region < getRegionCount(progress); region++) {
    const outposts = progress.buildings.filter(b => b.type === 'border-outpost' && b.state === 'complete' && lotRegion(b.lot) === region).length;
    const unlockedBlocks = Math.min(8, 4 + outposts);
    BLOCK_IDS.forEach((block, index) => {
      const base = BUILDING_LOTS[block];
      for (let cell = 0; cell < 4; cell++) {
        // Isometric diamond offsets follow the painted street axes.
        const a = cell % 2 ? 1 : -1;
        const b = cell < 2 ? -1 : 1;
        lots.push({ id: `${region}:${block}:${cell}`, name: `${base.name} ${cell + 1}`, region, block,
          x: base.x + a * .016 + b * .014, y: base.y + a * .010 - b * .010,
          tags: [...base.tags], unlocked: index < unlockedBlocks || progress.buildings.some(b => b.legacy && b.lot.startsWith(`${region}:${block}:`)) });
      }
    });
  }
  return lots;
}
export function lotOccupant(progress: Pick<Progress, 'buildings'>, lot: LotId, except?: string): BuildingInstance | undefined {
  return progress.buildings.find(b => b.lot === lot && b.id !== except);
}
export function validLot(progress: Pick<Progress, 'buildings'>, type: BuildingType, lotId: LotId, except?: string): string | null {
  const lot = getLots(progress).find(l => l.id === lotId);
  if (!lot || !lot.unlocked) return 'This ground is not open. Build an outpost or bridge to expand.';
  if (lotOccupant(progress, lotId, except)) return 'That space already has a building or construction site.';
  const terrain = BUILDINGS[type]?.terrain;
  if (!terrain) return 'Choose a known building.';
  if (terrain !== 'any' && !lot.tags.includes(terrain)) return `This building needs ${terrain === 'coast' ? 'coastal' : terrain} ground.`;
  return null;
}
export function availableLots(progress: Pick<Progress, 'buildings'>, type: BuildingType, except?: string): BuildingLot[] {
  return getLots(progress).filter(l => validLot(progress, type, l.id, except) === null);
}
export function buildingLot(progress: Pick<Progress, 'buildings'>, instanceId: string): LotId | undefined {
  return progress.buildings.find(b => b.id === instanceId)?.lot;
}
