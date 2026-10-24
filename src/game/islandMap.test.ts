import { describe, expect, it } from 'vitest';
import { islandMapLayout, ISLAND_PLOTS } from './islandMap';

const sizes = [[320,640],[390,844],[768,1024],[844,390],[960,540],[1280,720],[1920,1080]];

describe('explorable island map', () => {
  it('keeps every playable lot and its label inside the initial map area', () => {
    for (const [width,height] of sizes) {
      const map = islandMapLayout(width!,height!);
      for (const anchor of Object.values(ISLAND_PLOTS)) {
        const x = map.left + anchor.x * map.mapWidth;
        const y = map.top + anchor.y * map.mapHeight;
        expect(x - 50, `${width}×${height} label left`).toBeGreaterThanOrEqual(0);
        expect(x + 50, `${width}×${height} label right`).toBeLessThanOrEqual(width! >= 960 ? width! - 370 : width!);
        expect(y - 45, `${width}×${height} building top`).toBeGreaterThanOrEqual(70);
        expect(y + 35, `${width}×${height} label bottom`).toBeLessThanOrEqual(height! - 70);
      }
    }
  });

  it('lets zoom-out reveal the whole terrain inside the usable viewport', () => {
    for (const [width,height] of sizes) {
      const map = islandMapLayout(width!,height!,0.65,9999,-9999);
      expect(map.mapWidth).toBeLessThanOrEqual(map.viewport.width);
      expect(map.mapHeight).toBeLessThanOrEqual(map.viewport.height);
      expect(map.panX).toBeCloseTo(0);
      expect(map.panY).toBeCloseTo(0);
    }
  });

  it('bounds dragging and zooming so the island cannot be lost offscreen', () => {
    for (const [width,height] of sizes) {
      for (const direction of [-1,1]) {
        const map = islandMapLayout(width!,height!,100,100000*direction,100000*direction);
        expect(map.zoom).toBe(1.8);
        expect(map.left).toBeLessThanOrEqual(map.viewport.x + 1e-8);
        expect(map.top).toBeLessThanOrEqual(map.viewport.y + 1e-8);
        expect(map.left + map.mapWidth).toBeGreaterThanOrEqual(map.viewport.x + map.viewport.width - 1e-8);
        expect(map.top + map.mapHeight).toBeGreaterThanOrEqual(map.viewport.y + map.viewport.height - 1e-8);
      }
    }
  });
});
