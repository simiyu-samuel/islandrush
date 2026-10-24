import type { BuildingId } from '../model/types';
import { BUILDING_LOTS } from '../model/placement';

export const ISLAND_ASPECT = 4 / 3;
export const MAP_CAMERA_EVENT = 'island-rush:map-camera';
export type MapCameraCommand = 'in' | 'out' | 'reset';
// Centers of clear grass lots in the generated road-network terrain.
// These positions stay attached to the map at every zoom and viewport size.
export const ISLAND_PLOTS: Record<BuildingId, { x: number; y: number }> = {
  home: BUILDING_LOTS.harbor, workshop: BUILDING_LOTS.grove, lookout: BUILDING_LOTS.east,
};

export function islandMapLayout(width: number, height: number, requestedZoom = 1, requestedPanX = 0, requestedPanY = 0) {
  const desktop = width >= 960;
  const landscape = !desktop && width > height;
  const viewport = desktop
    ? { x: 12, y: 105, width: width - 402, height: Math.max(200, height - 155) }
    : landscape
      ? { x: 12, y: 80, width: width * 0.66, height: Math.max(160, height - 145) }
      : { x: 12, y: 112, width: width - 24, height: Math.max(200, height - 302) };
  const zoom = Math.max(0.65, Math.min(1.8, requestedZoom));
  const fit = Math.min(viewport.width, viewport.height * ISLAND_ASPECT);
  const mapWidth = fit * (desktop ? 1.2 : landscape ? 1.3 : 1.4) * zoom;
  const mapHeight = mapWidth / ISLAND_ASPECT;
  const maxPanX = Math.max(0, (mapWidth - viewport.width) / 2);
  const maxPanY = Math.max(0, (mapHeight - viewport.height) / 2);
  const panX = Math.max(-maxPanX, Math.min(maxPanX, requestedPanX));
  const panY = Math.max(-maxPanY, Math.min(maxPanY, requestedPanY));
  const centerX = viewport.x + viewport.width / 2 + panX;
  const centerY = viewport.y + viewport.height / 2 + panY;
  return { viewport, zoom, panX, panY, mapWidth, mapHeight, centerX, centerY,
    left: centerX - mapWidth / 2, top: centerY - mapHeight / 2 };
}
