import type { BuildingType, CategoryId, Material, StyleId } from './types';
export const CATEGORIES: { id: CategoryId; name: string; description: string }[] = [
  { id: 'civic', name: 'Civic & Community', description: 'Care, culture and island leadership' },
  { id: 'production', name: 'Resource & Production', description: 'Gather, grow, craft and trade' },
  { id: 'utility', name: 'Utility & Infrastructure', description: 'Water, storage, navigation and power' },
  { id: 'expansion', name: 'Settlement Expansion', description: 'Homes, new grounds and connected islets' },
];
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
export const PURCHASES = { timber: { coins: 10, quantity: 5 }, stone: { coins: 15, quantity: 5 } } as const;
export interface BuildingDefinition {
  id: BuildingType; name: string; category: CategoryId; tier: 1 | 2 | 3;
  recipe: { timber: number; stone: number }; description: string; benefit: string;
  stages: string[]; terrain: 'any' | 'forest' | 'coast' | 'spring' | 'edge' | 'hill';
  styles: readonly { id: StyleId; name: string; description: string }[];
}
const define = (id: BuildingType, name: string, category: CategoryId, tier: 1 | 2 | 3,
  timber: number, stone: number, terrain: BuildingDefinition['terrain'], description: string, benefit: string,
  stages: string[], extra: BuildingDefinition['styles'] = []): BuildingDefinition => ({
    id, name, category, tier, recipe: { timber, stone }, terrain, description, benefit, stages,
    styles: [{ id: 'island', name: 'Island original', description: 'Painted coastal architecture made for this island.' }, ...extra],
  });
export const BUILDINGS: Record<BuildingType, BuildingDefinition> = {
  'town-hall': define('town-hall', 'Town Hall', 'civic', 1, 45, 25, 'any', 'Coordinate policies and guide your settlement.', 'Unlocks tier 2, island policies and an upgrade to tier 3.', ['Set the civic foundation', 'Raise the council chamber', 'Open the island office']),
  'community-plaza': define('community-plaza', 'Community Plaza', 'civic', 1, 25, 15, 'any', 'An open-air gathering place for island life.', 'Raises happiness and hosts a festival every 2 minutes when food and water are available.', ['Lay the gathering square', 'Plant shade and seating', 'Hang the festival lanterns']),
  'medical-clinic': define('medical-clinic', 'Medical Clinic', 'civic', 2, 45, 40, 'any', 'Provide care and prevent shortage-related illness.', 'A staffed clinic uses water to heal and treat fever; healthy access prevents outbreaks.', ['Prepare a clean foundation', 'Fit the treatment rooms', 'Stock the clinic']),
  'visitor-lodge': define('visitor-lodge', 'Visitor Lodge', 'civic', 2, 55, 25, 'any', 'Welcome tourists and traveling specialists.', 'Visitors spend coins (more at staffed lodges); a merchant brings seeds, medicine and navigation charts every 2 minutes.', ['Build the guest foundation', 'Raise the lodge and veranda', 'Prepare guest rooms']),
  'lumber-yard': define('lumber-yard', 'Lumber Yard', 'production', 1, 20, 5, 'forest', 'Harvest responsibly beside the forest.', 'A worker logs timber and replants; harvest policy boosts output but consumes more forest.', ['Mark the forest worksite', 'Assemble the timber shed', 'Plant replacement saplings']),
  'artisan-workshop': define('artisan-workshop', 'Artisan Workshop', 'production', 1, 40, 20, 'any', 'Refine timber into useful island goods.', 'A worker turns timber into planks, then tools. Tools increase lumber-yard timber output.', ['Lay the workshop slab', 'Build the workroom', 'Install crafting benches'], [{ id: 'forge', name: 'Harbor Forge', description: 'Stone walls and a copper roof.' }, { id: 'studio', name: 'Maker Studio', description: 'A sunny timber craft studio.' }]),
  'windmill-bakery': define('windmill-bakery', 'Windmill Bakery', 'production', 1, 35, 15, 'any', 'Mill grain and bake fresh bread.', 'A worker mills grain to flour and flour to bread. Cottage gardens grow grain using water.', ['Set the mill foundation', 'Raise the windmill', 'Light the bakery oven']),
  'archipelago-pier': define('archipelago-pier', 'Archipelago Pier', 'production', 2, 50, 30, 'coast', 'Fish coastal waters and dock cargo boats.', 'Workers catch fish. Cargo ships arrive every 90 seconds and dock for 30; a lighthouse or 3 navigation charts makes trade safe.', ['Drive the shore pilings', 'Lay the cargo deck', 'Fit fishing and trading berths']),
  'rainwater-collector': define('rainwater-collector', 'Rainwater Collector', 'utility', 1, 20, 10, 'any', 'Catch and purify water for the island.', 'A worker filters water for residents, gardens and clinic treatments.', ['Set the cistern base', 'Fit the rain-catching roof', 'Connect purification filters']),
  'coastal-lighthouse': define('coastal-lighthouse', 'Coastal Lighthouse', 'utility', 2, 25, 45, 'coast', 'Guide ships through the coastal fog.', 'Clears sea fog and lets cargo ships dock safely.', ['Anchor the stone base', 'Raise the beacon tower', 'Illuminate the coast'], [{ id: 'lighthouse', name: 'Classic Lighthouse', description: 'A bright stone beacon.' }]),
  'storage-depot': define('storage-depot', 'Storage Depot', 'utility', 1, 30, 15, 'any', 'Keep supplies organized and secure.', 'Adds 150 capacity to each material and produced good. Runner overflow waits safely at the harbor.', ['Lay warehouse foundations', 'Raise the storage hall', 'Install organized shelving']),
  'geothermal-generator': define('geothermal-generator', 'Geothermal Generator', 'utility', 3, 80, 70, 'spring', 'Draw clean power from a hot spring.', 'Supplies 12 power, strengthens clinic treatment and prevents happiness loss from unpowered advanced services.', ['Anchor near the hot spring', 'Fit the geothermal loop', 'Connect the island grid']),
  'pioneer-cottage': define('pioneer-cottage', 'Pioneer Cottage', 'expansion', 1, 30, 0, 'any', 'A welcoming first home with a small garden.', 'Houses 4 residents; arrivals settle into free housing, and watered gardens grow grain.', ['Set the home foundation', 'Raise the timber walls', 'Finish the roof and garden'], [{ id: 'cottage', name: 'Coast Cottage', description: 'Terracotta roof and a warm porch.' }, { id: 'bungalow', name: 'Palm Bungalow', description: 'A breezy open veranda.' }]),
  'border-outpost': define('border-outpost', 'Border Outpost', 'expansion', 1, 25, 10, 'edge', 'Survey the edge of your current territory.', 'Unlocks another grass block on this islet, adding 4 building spaces (up to all 8 blocks).', ['Survey the island edge', 'Raise the boundary station', 'Mark the new building grounds'], [{ id: 'watchtower', name: 'Timber Watchtower', description: 'A raised timber lookout.' }]),
  'terrace-hamlet': define('terrace-hamlet', 'Terrace Hamlet', 'expansion', 2, 60, 45, 'hill', 'Stack welcoming homes along the hillside.', 'Houses 10 residents. Draws 2 power for its shared infrastructure.', ['Anchor the hillside terraces', 'Raise the stacked homes', 'Open the shared stairways']),
  'bridge-link': define('bridge-link', 'Bridge Link', 'expansion', 2, 65, 40, 'coast', 'Connect another neighboring islet.', 'Every finished bridge reveals another islet with 16 starter spaces. More bridges keep expanding the archipelago.', ['Anchor the coastal abutments', 'Raise the bridge spans', 'Open the path to a new islet']),
};
export const BUILDING_IDS = Object.keys(BUILDINGS) as BuildingType[];
export const CATALOG = BUILDINGS;
