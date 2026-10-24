import { describe, expect, it } from 'vitest';
import { availableLots, getLots, getRegionCount, lotOccupant, validLot } from '../src/model/placement';
import { beginConstruction, dismantleBuilding, finishConstruction, placeBuilding } from '../src/model/progress';
import { validateProgress } from '../src/model/save';
import { addBuilding, funded } from './settlement-fixtures';

describe('spatial settlement expansion and movement', () => {
  it('starts with sixteen usable spaces in four grass macroblocks, with sixteen more surveyable', () => {
    const lots = getLots(funded()); expect(lots).toHaveLength(32); expect(lots.filter(l => l.unlocked)).toHaveLength(16);
    expect(new Set(lots.map(l => l.id)).size).toBe(32); expect(lots.every(l => l.x > 0 && l.x < 1 && l.y > 0 && l.y < 1)).toBe(true);
  });
  it('keeps forest, coast, hot-spring, edge and hillside recipes on suitable ground', () => {
    const p = funded(); const pairs = [['lumber-yard','forest'], ['archipelago-pier','coast'], ['geothermal-generator','spring'], ['border-outpost','edge'], ['terrace-hamlet','hill']] as const;
    for (const [type, tag] of pairs) { expect(availableLots(p, type).length).toBeGreaterThan(0); expect(availableLots(p, type).every(l => l.tags.includes(tag))).toBe(true); }
    expect(validLot(p, 'lumber-yard', '0:harbor:0')).toMatch(/forest/); expect(validLot(p, 'pioneer-cottage', '0:shore:0')).toMatch(/not open/);
    expect(validLot(p, 'pioneer-cottage', 'ocean')).toMatch(/not open/);
  });
  it('expands locally by four spaces per outpost until all eight blocks are surveyed', () => {
    let p = funded(); for (let n = 0; n < 5; n++) p = addBuilding(p, 'border-outpost');
    expect(getLots(p).filter(l => l.unlocked)).toHaveLength(32); expect(getRegionCount(p)).toBe(1);
  });
  it('opens another islet per bridge with no artificial region limit', () => {
    let p = funded(); for (let n = 0; n < 10; n++) p = addBuilding(p, 'bridge-link');
    expect(getRegionCount(p)).toBe(11); expect(getLots(p)).toHaveLength(352); expect(getLots(p).filter(l => l.unlocked)).toHaveLength(176);
    expect(validateProgress(p)).toBe(true);
  });
  it('reserves a construction site and allows free relocation only after completion', () => {
    let p = funded(); const lot = availableLots(p, 'pioneer-cottage')[0]!.id;
    p = beginConstruction(p, { id: 'home', type: 'pioneer-cottage', style: 'island', facing: 'left', lot }, 0).progress;
    expect(lotOccupant(p, lot)?.id).toBe('home'); expect(placeBuilding(p, 'home', '0:grove:0', 'right').ok).toBe(false);
    p = finishConstruction(p, 5000).progress; const moved = placeBuilding(p, 'home', '0:grove:0', 'right');
    expect(moved.ok).toBe(true); expect(moved.progress.buildings[0]).toMatchObject({ lot: '0:grove:0', facing: 'right' }); expect(moved.progress.wallet).toEqual(p.wallet); expect(lotOccupant(moved.progress, lot)).toBeUndefined();
  });
  it('prevents moves onto occupied land and prevents removing an outpost supporting occupied expansion', () => {
    let p = addBuilding(funded(), 'border-outpost'); p = addBuilding(p, 'bridge-link');
    const outpost = p.buildings[0]!; const second = p.buildings[1]!;
    expect(placeBuilding(p, outpost.id, second.lot, 'left').ok).toBe(false);
    p.buildings.push({ id: 'outer-home', type: 'pioneer-cottage', style: 'island', lot: '0:square:0', facing: 'left', state: 'complete', startedAt: 0, completesAt: 5000, level: 1 });
    expect(placeBuilding(p, outpost.id, '1:west:0', 'right').ok).toBe(false); expect(validateProgress(p)).toBe(true);
  });
});


describe('salvage recovery without settlement softlocks', () => {
  it('recovers an edge space from a full cottage island so an outpost can open more grounds', () => {
    let p = funded();
    for (let n = 0; n < 16; n++) p = addBuilding(p, 'pioneer-cottage');
    expect(availableLots(p, 'border-outpost')).toHaveLength(0);
    const edgeHome = p.buildings.find(b => b.lot === '0:harbor:0')!;
    p = dismantleBuilding(p, edgeHome.id).progress;
    expect(availableLots(p, 'border-outpost')).toHaveLength(1);
    const site = beginConstruction(p, { id: 'new-outpost', type: 'border-outpost', style: 'island', lot: edgeHome.lot, facing: 'left' }, 0);
    expect(site.ok).toBe(true); p = finishConstruction(site.progress, 5000).progress;
    expect(getLots(p).filter(l => l.unlocked)).toHaveLength(20); expect(availableLots(p, 'pioneer-cottage')).toHaveLength(4); expect(validateProgress(p)).toBe(true);
  });
  it('cannot dismantle unfinished sites or remove a bridge or outpost supporting occupied land', () => {
    let p = addBuilding(funded(), 'border-outpost'); p = addBuilding(p, 'bridge-link');
    const outpost = p.buildings[0]!; const bridge = p.buildings[1]!;
    p.buildings.push({ id: 'outer-home', type: 'pioneer-cottage', style: 'island', lot: '0:square:0', facing: 'left', state: 'complete', startedAt: 0, completesAt: 5000, level: 1 });
    expect(dismantleBuilding(p, outpost.id).ok).toBe(false);
    p.buildings.push({ id: 'far-home', type: 'pioneer-cottage', style: 'island', lot: '1:harbor:0', facing: 'left', state: 'complete', startedAt: 0, completesAt: 5000, level: 1 });
    expect(dismantleBuilding(p, bridge.id).ok).toBe(false);
    const started = beginConstruction(p, { id: 'site', type: 'pioneer-cottage', style: 'island', lot: '0:grove:0', facing: 'left' }, 0).progress;
    expect(dismantleBuilding(started, 'site').ok).toBe(false); expect(dismantleBuilding(started, 'missing').ok).toBe(false);
    expect(started.buildings).toHaveLength(5);
  });
  it('clears housing and workplace references when salvaging an inhabited service', () => {
    let p = addBuilding(funded(), 'pioneer-cottage'); p = addBuilding(p, 'rainwater-collector');
    const home = p.buildings[0]!; const water = p.buildings[1]!;
    p.simulation.citizens[0]!.homeId = home.id; p.simulation.citizens[0]!.jobId = water.id;
    p = dismantleBuilding(p, water.id).progress; expect(p.simulation.citizens[0]!.jobId).toBeNull();
    p = dismantleBuilding(p, home.id).progress; expect(p.simulation.citizens[0]!.homeId).toBeNull(); expect(p.simulation.citizens).toHaveLength(2); expect(validateProgress(p)).toBe(true);
  });
  it('keeps a depot refund and over-cap stock safe when storage capacity shrinks', () => {
    let p = addBuilding(funded(), 'storage-depot'); p.wallet.timber = 280; p.wallet.stone = 280;
    p.simulation.overflow.timber = 40; p.simulation.overflow.stone = 20; p.simulation.goods.water = 280;
    const result = dismantleBuilding(p, p.buildings[0]!.id); expect(result.ok).toBe(true); p = result.progress;
    expect(p.wallet).toEqual({ timber: 150, stone: 150, coins: 500 }); expect(p.simulation.overflow).toEqual({ timber: 185, stone: 157, coins: 0 });
    expect(p.simulation.goods.water).toBe(280); expect(validateProgress(p)).toBe(true);
  });
});


describe('salvaged archipelago navigation', () => {
  it('returns the ship to a valid region when an empty last islet loses its bridge', () => {
    let p = addBuilding(funded(), 'bridge-link');
    p.simulation.ship.region = 1; p.simulation.ship.phase = 'docked';
    const result = dismantleBuilding(p, p.buildings[0]!.id);
    expect(result.ok).toBe(true); p = result.progress;
    expect(getRegionCount(p)).toBe(1); expect(p.simulation.ship.region).toBe(0); expect(validateProgress(p)).toBe(true);
  });
});
