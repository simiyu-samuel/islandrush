import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import type Phaser from 'phaser';
import { describe, expect, it } from 'vitest';
import { islandMapLayout, lotPosition, lotFootprint, regionOffset, regionPosition, lotHitPolygon, MAX_MAP_ZOOM } from './islandMap';
import { buildingWidth } from './art';
import { getLots } from '../model/placement';
import type { BuildingInstance } from '../model/types';

// Test against Phaser's actual polygon hit routine, without starting a browser.
const require = createRequire(import.meta.url);
const phaserRoot = dirname(dirname(require.resolve('phaser')));
const Polygon = require(join(phaserRoot,'src/geom/polygon/Polygon.js')) as typeof Phaser.Geom.Polygon;
const polygonContains = require(join(phaserRoot,'src/geom/polygon/Contains.js')) as typeof Phaser.Geom.Polygon.Contains;

const sizes = [[320,640],[390,844],[768,1024],[844,390],[960,540],[1280,720],[1920,1080]];
const island = { buildings: [] as BuildingInstance[] };

describe('expandable archipelago map', () => {
  it('gives the island 32 distinct foundations with room for enlarged buildings', () => {
    const lots = getLots(island);
    expect(lots).toHaveLength(32);
    expect(new Set(lots.map(lot => lot.id)).size).toBe(32);
    const map = islandMapLayout(1280,720);
    const footprint = lotFootprint(map);
    expect(footprint.width / map.mapWidth).toBeLessThanOrEqual(0.064);
    for (const lot of lots) {
      const point = lotPosition(lot, map);
      expect(point.x).toBeGreaterThan(map.left);
      expect(point.x).toBeLessThan(map.left + map.mapWidth);
      expect(point.y).toBeGreaterThan(map.top);
      expect(point.y).toBeLessThan(map.top + map.mapHeight);
      for (const neighbor of lots.filter(other => other.block === lot.block && other.id !== lot.id)) {
        const horizontal = Math.abs(lot.x - neighbor.x) * map.mapWidth / footprint.width;
        const vertical = Math.abs(lot.y - neighbor.y) * map.mapHeight / footprint.height;
        expect(horizontal + vertical).toBeGreaterThan(1);
      }
    }
  });

  it('keeps homes readable at normal scale and supports close inspection on a narrow phone', () => {
    const phone = islandMapLayout(320,640);
    const desktop = islandMapLayout(1366,768);
    const close = islandMapLayout(320,640,MAX_MAP_ZOOM);
    expect(phone.mapWidth * buildingWidth('pioneer-cottage')).toBeGreaterThanOrEqual(28);
    expect(desktop.mapWidth * buildingWidth('pioneer-cottage')).toBeGreaterThanOrEqual(60);
    expect(close.mapWidth * buildingWidth('pioneer-cottage')).toBeGreaterThanOrEqual(110);
    expect(buildingWidth('coastal-lighthouse')).toBeLessThan(buildingWidth('pioneer-cottage'));
  });

  it('lets zoom-out reveal a single terrain inside the usable viewport', () => {
    for (const [width,height] of sizes) {
      const map = islandMapLayout(width!,height!,0.65,9999,-9999);
      expect(map.mapWidth).toBeLessThanOrEqual(map.viewport.width);
      expect(map.mapHeight).toBeLessThanOrEqual(map.viewport.height);
      expect(map.panX).toBeCloseTo(0);
      expect(map.panY).toBeCloseTo(0);
    }
  });

  it('bounds panning across every connected islet without losing the archipelago', () => {
    for (const [width,height] of sizes) for (const regions of [1,2,4,12,50]) for (const direction of [-1,1]) {
      const map = islandMapLayout(width!,height!,100,100000*direction,100000*direction,regions);
      expect(map.zoom).toBe(MAX_MAP_ZOOM);
      expect(map.left).toBeLessThanOrEqual(map.viewport.x + 1e-8);
      expect(map.top).toBeLessThanOrEqual(map.viewport.y + 1e-8);
      expect(map.left + map.worldWidth).toBeGreaterThanOrEqual(map.viewport.x + map.viewport.width - 1e-8);
      expect(map.top + map.worldHeight).toBeGreaterThanOrEqual(map.viewport.y + map.viewport.height - 1e-8);
    }
  });

  it('keeps each newly revealed islet adjacent to its preceding bridge with no region cap', () => {
    const seen = new Set<string>();
    for (let index = 0; index < 200; index++) {
      const position = regionOffset(index);
      expect(seen.has(`${position.x},${position.y}`)).toBe(false);
      seen.add(`${position.x},${position.y}`);
      if (index) {
        const previous = regionOffset(index - 1);
        expect(Math.abs(position.x - previous.x) + Math.abs(position.y - previous.y)).toBeCloseTo(1.04);
      }
    }
    const map = islandMapLayout(1280,720,1,0,0,200);
    const last = regionPosition(199,map);
    expect(last.x).toBeGreaterThanOrEqual(map.left);
    expect(last.x + map.mapWidth).toBeLessThanOrEqual(map.left + map.worldWidth + 1e-8);
    expect(last.y + map.mapHeight).toBeLessThanOrEqual(map.top + map.worldHeight + 1e-8);
  });
});

describe('map foundation pointer alignment', () => {
  it('hits each drawn foundation center and its visible sides after Phaser origin normalization', () => {
    for (const [width,height] of sizes) for(const zoom of [0.65,1,2,4]) {
      const map=islandMapLayout(width!,height!,zoom,210,-95);
      const footprint=lotFootprint(map);
      const area=new Polygon(lotHitPolygon(map));
      for(const lot of getLots(island).filter(l=>l.unlocked)) {
        const anchor=lotPosition(lot,map);
        for(const [dx,dy] of [[0,0],[0.42,0],[-0.42,0],[0,0.42],[0,-0.42]]) {
          const click={x:anchor.x+dx!*footprint.width,y:anchor.y+dy!*footprint.height};
          // This normalization is InputManager.pointWithinHitArea's contract.
          const inputX=click.x-anchor.x+footprint.width/2;
          const inputY=click.y-anchor.y+footprint.height/2;
          expect(polygonContains(area,inputX,inputY)).toBe(true);
        }
      }
    }
  });
  it('does not turn neighboring foundations or surrounding roads into this site', () => {
    for(const zoom of [0.65,1,2,4]) {
      const map=islandMapLayout(1366,768,zoom);
      const footprint=lotFootprint(map);
      const area=new Polygon(lotHitPolygon(map));
      const lots=getLots(island).filter(l=>l.unlocked);
      for(const lot of lots) {
        const anchor=lotPosition(lot,map);
        for(const other of lots.filter(l=>l.id!==lot.id)) {
          const point=lotPosition(other,map);
          expect(polygonContains(area,point.x-anchor.x+footprint.width/2,point.y-anchor.y+footprint.height/2)).toBe(false);
        }
        expect(polygonContains(area,footprint.width*1.1,footprint.height/2)).toBe(false);
      }
    }
  });
});
