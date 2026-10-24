/** Original style variants retained for migrated islands. */
export const BUILDING_ART: Record<string, string> = {
  cottage: '/assets/buildings/home-cottage-v1.png',
  bungalow: '/assets/buildings/home-bungalow-v1.png',
  forge: '/assets/buildings/workshop-forge-v1.png',
  studio: '/assets/buildings/workshop-studio-v1.png',
  lighthouse: '/assets/buildings/lookout-lighthouse-v1.png',
  watchtower: '/assets/buildings/lookout-watchtower-v1.png',
};

/** Cell order is top left, top right, bottom left, bottom right. */
export const SETTLEMENT_ATLASES = {
  'settlement-civic': {
    path: '/assets/buildings/settlement-civic-v4.png',
    frames: ['town-hall', 'community-plaza', 'medical-clinic', 'visitor-lodge'],
  },
  'settlement-production': {
    path: '/assets/buildings/settlement-production-v4.png',
    frames: ['lumber-yard', 'artisan-workshop', 'windmill-bakery', 'archipelago-pier'],
  },
  'settlement-utility': {
    path: '/assets/buildings/settlement-utility-v4.png',
    frames: ['rainwater-collector', 'coastal-lighthouse', 'storage-depot', 'geothermal-generator'],
  },
  'settlement-expansion': {
    path: '/assets/buildings/settlement-expansion-v4.png',
    frames: ['pioneer-cottage', 'border-outpost', 'terrace-hamlet', 'bridge-link'],
  },
} as const;

export interface BuildingVisual {
  key: string;
  frame: string | number;
  path: string;
  cell?: number;
}

/** Canvas and HTML catalogue share the same original artwork. */
export function buildingVisual(type: string, style = 'island'): BuildingVisual {
  if (Object.hasOwn(BUILDING_ART, style)) {
    return { key: style, frame: 'content', path: BUILDING_ART[style]! };
  }
  for (const [key, atlas] of Object.entries(SETTLEMENT_ATLASES)) {
    const cell = (atlas.frames as readonly string[]).indexOf(type);
    if (cell >= 0) return { key, frame: type, path: atlas.path, cell };
  }
  return { key: 'cottage', frame: 'content', path: BUILDING_ART.cottage! };
}

/** Readable architecture at island scale; narrow towers retain their proportions. */
export const buildingWidth = (type: string, style = 'island'): number =>
  type === 'coastal-lighthouse' || type === 'lookout' || style === 'watchtower' ? 0.050
    : ['community-plaza', 'terrace-hamlet', 'archipelago-pier', 'bridge-link'].includes(type) ? 0.084
      : ['windmill-bakery', 'town-hall', 'storage-depot'].includes(type) ? 0.078
        : 0.070;
