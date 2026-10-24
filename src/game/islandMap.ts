export const ISLAND_ASPECT = 4 / 3;
export const MIN_MAP_ZOOM = 0.65;
export const MAX_MAP_ZOOM = 4;
export const MAP_ZOOM_STEP = 0.25;
export const MAP_CAMERA_EVENT = 'island-rush:map-camera';
export type MapCameraCommand = 'in' | 'out' | 'reset';
export type MapPoint = { x: number; y: number };

/** Connected, serpentine rows can grow without a fixed archipelago limit. */
export function regionOffset(region: number): MapPoint {
  const index = Math.max(0, Math.floor(region));
  const row = Math.floor(index / 3);
  const column = row % 2 === 0 ? index % 3 : 2 - index % 3;
  return { x: column * 1.04, y: row * 1.04 };
}

export function islandMapLayout(width: number, height: number, requestedZoom = 1, requestedPanX = 0, requestedPanY = 0, regions = 1) {
  const desktop = width >= 960;
  const landscape = !desktop && width > height;
  const viewport = desktop
    ? { x: 12, y: 134, width: width - 402, height: Math.max(200, height - 184) }
    : landscape
      ? { x: 12, y: 80, width: width * 0.66, height: Math.max(160, height - 145) }
      : { x: 12, y: 130, width: width - 24, height: Math.max(150, height - 370) };
  const zoom = Math.max(MIN_MAP_ZOOM, Math.min(MAX_MAP_ZOOM, requestedZoom));
  const fit = Math.min(viewport.width, viewport.height * ISLAND_ASPECT);
  const mapWidth = fit * (desktop ? 1.2 : landscape ? 1.3 : 1.4) * zoom;
  const mapHeight = mapWidth / ISLAND_ASPECT;
  const offsets = Array.from({ length: Math.max(1, regions) }, (_, index) => regionOffset(index));
  const maxRegionX = Math.max(...offsets.map(point => point.x));
  const maxRegionY = Math.max(...offsets.map(point => point.y));
  const baseLeft = viewport.x + (viewport.width - mapWidth) / 2;
  const baseTop = viewport.y + (viewport.height - mapHeight) / 2;
  const bound = (requested: number, start: number, size: number, viewStart: number, viewSize: number) =>
    size <= viewSize ? viewStart + (viewSize - size) / 2 - start :
      Math.max(viewStart + viewSize - start - size, Math.min(viewStart - start, requested));
  const panX = bound(requestedPanX, baseLeft, mapWidth * (maxRegionX + 1), viewport.x, viewport.width);
  const panY = bound(requestedPanY, baseTop, mapHeight * (maxRegionY + 1), viewport.y, viewport.height);
  const left = baseLeft + panX;
  const top = baseTop + panY;
  return { viewport, zoom, panX, panY, mapWidth, mapHeight,
    centerX: left + mapWidth / 2, centerY: top + mapHeight / 2, left, top,
    worldWidth: mapWidth * (maxRegionX + 1), worldHeight: mapHeight * (maxRegionY + 1) };
}

export type IslandMap = ReturnType<typeof islandMapLayout>;
export function regionPosition(region: number, map: IslandMap): MapPoint {
  const offset = regionOffset(region);
  return { x: map.left + offset.x * map.mapWidth, y: map.top + offset.y * map.mapHeight };
}
export function lotPosition(lot: { x: number; y: number; region: number }, map: IslandMap): MapPoint {
  const origin = regionPosition(lot.region, map);
  return { x: origin.x + lot.x * map.mapWidth, y: origin.y + lot.y * map.mapHeight };
}

/** Foundations follow the enlarged architecture while leaving each grass block usable. */
export function lotFootprint(map: IslandMap): { width: number; height: number } {
  const width = map.mapWidth * 0.064;
  return { width, height: width * 0.52 };
}

/** Phaser tests container input after adding its half-size display origin. */
export function lotHitPolygon(map: IslandMap): MapPoint[] {
  const { width, height } = lotFootprint(map);
  return [{ x: width / 2, y: 0 }, { x: width, y: height / 2 },
    { x: width / 2, y: height }, { x: 0, y: height / 2 }];
}
