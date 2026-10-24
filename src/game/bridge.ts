import type { Facing } from '../model/placement';
import type { BuildingInstance, BuildingType, Citizen, SettlementStats, ShipState, StyleId } from '../model/types';
import type { BuildingLot } from '../model/placement';

/** The renderer reads this snapshot; the controller alone changes game rules. */
export type Resources = { timber: number; stone: number; coins: number };
export type RenderEntity = {
  id: string;
  kind: 'timber' | 'stone' | 'coin' | 'obstacle';
  /** Lane -1 is left, 0 is center, 1 is right. */
  lane: number;
  /** Absolute route distance; contact occurs at z === Frame.distance. */
  z: number;
};
export type PlacementPreview = {
  type: BuildingType; style: StyleId; lot: string; facing: Facing; instanceId?: string;
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
  buildings: BuildingInstance[];
  lots: BuildingLot[];
  regions: number;
  placement: PlacementPreview | null;
  selectedInstance: string | null;
  /** The mobile settlement sheet is open; desktop keeps its side panel. */
  settlementOpen: boolean;
  simTime: number;
  citizens: Citizen[];
  stats: SettlementStats;
  ship?: ShipState;
  reducedMotion: boolean;
}
export interface GameBridge {
  read(): Frame;
  tick(dtSeconds: number): void;
  move(direction: -1 | 1): void;
  jump(): void;
  pause(): void;
  /** A completed map building opens its move preview directly. */
  selectBuilding(id: string): void;
  selectLot(id: string): void;
  onReady(): void;
  onError(message: string): void;
}
