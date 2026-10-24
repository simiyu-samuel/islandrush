import type { LotId, Facing } from './placement';

export type Material = 'timber' | 'stone';
export type BuildingId = 'home' | 'workshop' | 'lookout';
export type StyleId = 'cottage' | 'bungalow' | 'forge' | 'studio' | 'lighthouse' | 'watchtower';
export type Lane = -1 | 0 | 1;
export interface Wallet { timber: number; stone: number; coins: number }
export interface BuildingState { style: StyleId; built: boolean; lot?: LotId; facing?: Facing }
export interface PendingConstruction { buildingId: BuildingId; startedAt: number; completesAt: number }
export type TutorialStep = 'welcome' | 'choose-style' | 'first-run' | 'results' | 'build';
export interface TutorialState { completed: TutorialStep[]; skipped: boolean }
export interface Progress {
  version: 1;
  wallet: Wallet;
  buildings: Record<BuildingId, BuildingState>;
  target: BuildingId | null;
  /** Optional for compatibility with existing version-one islands. */
  pendingConstruction?: PendingConstruction | null;
  tutorial: TutorialState;
  lastSettledRunId: string | null;
  /** Ledger also guards stale result events after another run has settled. */
  settledRunIds: string[];
  updatedAt: number;
}
export interface CommandResult { ok: boolean; progress: Progress; message: string }
export type EntityKind = Material | 'coin' | 'obstacle';
export interface RunEntity { id: string; kind: EntityKind; lane: Lane; z: number }
export type RunPhase = 'active' | 'paused' | 'ended' | 'settled';
export type EndReason = 'collision' | 'timeout' | null;
export interface ActiveRun {
  id: string;
  seed: number;
  phase: RunPhase;
  endReason: EndReason;
  target: BuildingId | null;
  materials: Material[];
  elapsed: number;
  distance: number;
  lane: number;
  targetLane: Lane;
  jumpHeight: number;
  /** -1 means grounded; otherwise elapsed active seconds into the jump. */
  jumpElapsed: number;
  entities: RunEntity[];
  loot: Wallet;
  collectedIds: string[];
}
export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export type LoadResult =
  | { status: 'empty' }
  | { status: 'ok'; progress: Progress }
  | { status: 'corrupt'; raw: string; message: string }
  | { status: 'unavailable'; message: string };
export type SaveResult =
  | { ok: true }
  | { ok: false; reason: 'invalid' | 'unavailable' | 'corrupt'; message: string };
