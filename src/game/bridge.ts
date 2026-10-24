import type { LotId, Facing } from '../model/placement';
import type { BuildingState } from '../model/types';

/** The renderer reads this snapshot; the controller alone changes game rules. */
export type Resources = { timber: number; stone: number; coins: number };
export type PlotId = 'home' | 'workshop' | 'lookout';
export type RenderEntity = {
  id: string;
  kind: 'timber' | 'stone' | 'coin' | 'obstacle';
  /** Lane -1 is left, 0 is center, 1 is right. */
  lane: number;
  /** Absolute route distance; contact occurs at z === Frame.distance. */
  z: number;
};
export interface Frame {
  view: 'island' | 'run';
  phase: 'active' | 'paused' | 'ended' | 'settled';
  elapsed: number;
  distance: number;
  lane: number;
  /** Physical jump height, from 0 to 2.2 world units. */
  jumpHeight: number;
  entities: RenderEntity[];
  wallet: Resources;
  loot: Resources;
  buildings: Record<PlotId, BuildingState>;
  buildingLots: Record<PlotId, LotId>;
  placement: { id: PlotId; lot: LotId; facing: Facing } | null;
  constructionBuilding: PlotId | null;
  /** Five-second construction clock, or null when no build is underway. */
  constructionProgress: number | null;
  /** The mobile settlement sheet is open; desktop keeps its side panel. */
  settlementOpen: boolean;
  selectedPlot: PlotId;
  reducedMotion: boolean;
}
export interface GameBridge {
  read(): Frame;
  tick(dtSeconds: number): void;
  move(direction: -1 | 1): void;
  jump(): void;
  pause(): void;
  selectPlot(id: PlotId): void;
  selectLot(id: LotId): void;
  onReady(): void;
  onError(message: string): void;
}
