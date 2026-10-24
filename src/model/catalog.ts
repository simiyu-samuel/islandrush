import type { BuildingId, Material, StyleId } from './types';

export const BUILDING_IDS: BuildingId[] = ['home', 'workshop', 'lookout'];
export const MATERIALS: Material[] = ['timber', 'stone'];
export const RUN_SPEED = 18;
export const MAX_RUN_SPEED = 34;
export const RUN_ACCELERATION = 0.2;
export const LANE_CHANGE_SECONDS = 0.16;
export const JUMP_DURATION = 0.75;
export const JUMP_PEAK = 2.2;
export const OBSTACLE_CLEARANCE = 1.05;
export const PICKUP_HEIGHT = 0.65;
export const MATERIAL_PICKUP_UNITS = 5;
export const COIN_PICKUP_UNITS = 1;
export const PURCHASES = {
  timber: { coins: 10, quantity: 5 },
  stone: { coins: 15, quantity: 5 },
} as const;

export interface BuildingDefinition {
  id: BuildingId;
  name: string;
  level: 1 | 2;
  recipe: { timber: number; stone: number };
  styles: readonly { id: StyleId; name: string; description: string }[];
}
export const BUILDINGS: Record<BuildingId, BuildingDefinition> = {
  home: {
    id: 'home', name: 'Coastal Home', level: 1,
    recipe: { timber: 30, stone: 0 },
    styles: [
      { id: 'cottage', name: 'Coast Cottage', description: 'Warm timber, a terracotta roof, and a welcoming porch.' },
      { id: 'bungalow', name: 'Palm Bungalow', description: 'A breezy coastal home with an open veranda.' },
    ],
  },
  workshop: {
    id: 'workshop', name: 'Workshop', level: 2,
    recipe: { timber: 40, stone: 20 },
    styles: [
      { id: 'forge', name: 'Harbor Forge', description: 'Stone walls and a sturdy copper-roofed workshop.' },
      { id: 'studio', name: 'Maker Studio', description: 'A sunny timber studio for the island builders.' },
    ],
  },
  lookout: {
    id: 'lookout', name: 'Lookout', level: 2,
    recipe: { timber: 20, stone: 40 },
    styles: [
      { id: 'lighthouse', name: 'Coast Lighthouse', description: 'A bright stone beacon watching over the coast.' },
      { id: 'watchtower', name: 'Timber Watchtower', description: 'An elevated lookout framed in warm coastal timber.' },
    ],
  },
};
export const CATALOG = BUILDINGS;
