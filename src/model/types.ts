import type { LotId, Facing } from './placement';

export type Material = 'timber' | 'stone';
export type BuildingType = 'town-hall' | 'community-plaza' | 'medical-clinic' | 'visitor-lodge' | 'lumber-yard' | 'artisan-workshop' | 'windmill-bakery' | 'archipelago-pier' | 'rainwater-collector' | 'coastal-lighthouse' | 'storage-depot' | 'geothermal-generator' | 'pioneer-cottage' | 'border-outpost' | 'terrace-hamlet' | 'bridge-link';
export type BuildingId = BuildingType;
export type CategoryId = 'civic' | 'production' | 'utility' | 'expansion';
export type StyleId = 'island' | 'cottage' | 'bungalow' | 'forge' | 'studio' | 'lighthouse' | 'watchtower';
export type Lane = -1 | 0 | 1;
export interface Wallet { timber: number; stone: number; coins: number }
export interface BuildingInstance {
  id: string; type: BuildingType; style: StyleId; lot: LotId; facing: Facing;
  legacy?: true; state: 'building' | 'complete'; startedAt: number; completesAt: number; level: number;
}
export type TutorialStep = 'welcome' | 'choose-style' | 'first-run' | 'results' | 'build';
export interface TutorialState { completed: TutorialStep[]; skipped: boolean }
export type Policy = 'balanced' | 'harvest' | 'wellbeing' | 'trade';
export type Good = 'grain' | 'flour' | 'bread' | 'fish' | 'water' | 'planks' | 'tools';
export type Goods = Record<Good, number>;
export interface Citizen {
  id: string; name: string; homeId: string | null; jobId: string | null;
  hunger: number; health: number; illness: 'fever' | null; illSince: number | null;
}
export interface Visitor { id: string; name: string; arrivedAt: number; leavesAt: number; spending: number }
export interface MerchantOffer { id: string; item: 'seed-crate' | 'medicine' | 'navigation-chart'; price: number; remaining: number }
export interface ShipState { phase: 'sailing' | 'docked' | 'fogbound'; progress: number; arrivesAt: number; departsAt: number; region: number; visits: number }
export interface SettlementEvent { id: string; at: number; text: string; kind: 'arrival' | 'production' | 'health' | 'trade' | 'construction' | 'policy' }
export interface SimulationState {
  lastTickAt: number; tick: number; citizens: Citizen[]; nextCitizenId: number; goods: Goods;
  overflow: Wallet; forest: number; policy: Policy; visitors: Visitor[]; offers: MerchantOffer[];
  rareItems: { seeds: number; medicine: number; charts: number }; ship: ShipState; events: SettlementEvent[]; festivals: number; lastFestivalAt: number;
}
export interface SettlementStats {
  population: number; capacity: number; happiness: number; health: number; water: number; food: number;
  power: number; powerDemand: number; storageCapacity: number; forest: number; fog: number;
  employed: number; sick: number; tourists: number; workers: Record<string, number>; tier: 1 | 2 | 3;
}
export interface Progress {
  version: 2; wallet: Wallet; buildings: BuildingInstance[]; target: BuildingType;
  designs: Record<BuildingType, StyleId>; tutorial: TutorialState;
  lastSettledRunId: string | null; settledRunIds: string[]; updatedAt: number; simulation: SimulationState;
}
export interface CommandResult { ok: boolean; progress: Progress; message: string }
export type EntityKind = Material | 'coin' | 'obstacle';
export interface RunEntity { id: string; kind: EntityKind; lane: Lane; z: number }
export type RunPhase = 'active' | 'paused' | 'ended' | 'settled';
export type EndReason = 'collision' | 'return' | null;
export interface ActiveRun {
  id: string; seed: number; phase: RunPhase; endReason: EndReason; target: BuildingType | null;
  materials: Material[]; elapsed: number; distance: number; lane: number; targetLane: Lane;
  jumpHeight: number; jumpElapsed: number; entities: RunEntity[]; loot: Wallet;
  collectedIds: string[]; generatedUntil: number;
}
export interface StorageAdapter { getItem(key: string): string | null; setItem(key: string, value: string): void }
export type LoadResult =
  | { status: 'empty' } | { status: 'ok'; progress: Progress; migrated?: boolean }
  | { status: 'corrupt'; raw: string; message: string } | { status: 'unavailable'; message: string };
export type SaveResult = { ok: true } | { ok: false; reason: 'invalid' | 'unavailable' | 'corrupt'; message: string };
