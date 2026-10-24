import { describe, expect, it } from 'vitest';
import { advanceSettlement, assignCitizen, setPolicy, settlementStats, trade, tradeOffers } from '../src/model/progress';
import { MAX_OFFLINE_TICKS } from '../src/model/simulation';
import { validateProgress } from '../src/model/save';
import { addBuilding, funded, withBuildings } from './settlement-fixtures';

describe('individual islander and production simulation', () => {
  it('does nothing before the next ten-second tick and remains deterministic across elapsed-time partitions', () => {
    const p = withBuildings(['pioneer-cottage', 'rainwater-collector', 'windmill-bakery']);
    expect(advanceSettlement(p, 9999)).toBe(p); expect(advanceSettlement(p, NaN)).toBe(p);
    const whole = advanceSettlement(p, 120000);
    let split = p; for (let at = 10000; at <= 120000; at += 10000) split = advanceSettlement(split, at);
    expect(whole).toEqual(split); expect(validateProgress(whole)).toBe(true);
  });
  it('assigns individual homes and jobs, and brings new residents only up to housing capacity', () => {
    const p = advanceSettlement(withBuildings(['pioneer-cottage', 'rainwater-collector', 'windmill-bakery']), 120000);
    const stats = settlementStats(p); expect(stats.population).toBe(4); expect(stats.capacity).toBe(4); expect(stats.employed).toBe(2);
    expect(new Set(p.simulation.citizens.map(c => c.id)).size).toBe(4); expect(p.simulation.citizens.every(c => c.homeId !== null)).toBe(true);
    expect(p.simulation.events.some(e => e.text.includes('arrived'))).toBe(true);
  });
  it('grows watered garden grain, mills flour, bakes bread and consumes real food and water', () => {
    const p = withBuildings(['pioneer-cottage', 'rainwater-collector', 'windmill-bakery']);
    const next = advanceSettlement(p, 120000);
    expect(next.simulation.goods.grain).toBeGreaterThan(p.simulation.goods.grain);
    expect(next.simulation.goods.bread).toBeGreaterThan(p.simulation.goods.bread);
    expect(next.simulation.goods.water).toBeGreaterThan(0); expect(next.simulation.citizens.every(c => c.hunger < 25)).toBe(true);
    expect(p.simulation.tick).toBe(0);
  });
  it('requires a worker for production and supports swapping named citizens between workplaces', () => {
    let p = withBuildings(['lumber-yard', 'artisan-workshop', 'rainwater-collector']);
    p.wallet.timber = 50;
    p = advanceSettlement(p, 10000);
    const lumber = p.buildings.find(b => b.type === 'lumber-yard')!; const artisan = p.buildings.find(b => b.type === 'artisan-workshop')!;
    expect(p.simulation.citizens.some(c => c.jobId === lumber.id)).toBe(true); expect(p.simulation.citizens.some(c => c.jobId === artisan.id)).toBe(false);
    const person = p.simulation.citizens.find(c => c.jobId === lumber.id)!;
    const assigned = assignCitizen(p, person.id, artisan.id); expect(assigned.ok).toBe(true);
    expect(assigned.progress.simulation.citizens.find(c => c.id === person.id)?.jobId).toBe(artisan.id);
    const next = advanceSettlement(assigned.progress, 40000); expect(next.simulation.goods.planks + next.simulation.goods.tools).toBeGreaterThan(0);
    expect(assignCitizen(p, 'missing-person', artisan.id).ok).toBe(false);
  });
  it('replants forest under balanced policy and makes intensive harvest consume more forest', () => {
    let p = withBuildings(['town-hall', 'lumber-yard']); p.wallet.timber = 0;
    const balanced = advanceSettlement(p, 100000); const harvest = advanceSettlement(setPolicy(p, 'harvest').progress, 100000);
    expect(balanced.simulation.forest).toBeGreaterThanOrEqual(98); expect(harvest.simulation.forest).toBeLessThan(balanced.simulation.forest);
    expect(harvest.wallet.timber).toBeGreaterThan(balanced.wallet.timber);
  });
  it('models shortage illness without deleting citizens, then treats fever with clinic water', () => {
    let p = funded(); p.simulation.goods.water = 0; p.simulation.goods.bread = 0; p.simulation.goods.grain = 0;
    p.simulation.citizens.forEach(c => { c.hunger = 80; c.health = 60; });
    p = advanceSettlement(p, 30000); expect(p.simulation.citizens.some(c => c.illness === 'fever')).toBe(true); expect(p.simulation.citizens).toHaveLength(2);
    p = addBuilding(p, 'rainwater-collector'); p = addBuilding(p, 'medical-clinic'); p.simulation.goods.bread = 100;
    const next = advanceSettlement(p, 180000); expect(next.simulation.citizens.every(c => c.illness === null)).toBe(true); expect(settlementStats(next).health).toBeGreaterThan(60);
    expect(next.simulation.events.some(e => e.text.includes('recovered'))).toBe(true);
  });
  it('gives power an actual clinic treatment and happiness effect alongside advanced housing demand', () => {
    let p = withBuildings(['medical-clinic', 'terrace-hamlet']); p.simulation.citizens.forEach(c => { c.health = 40; c.illness = 'fever'; c.illSince = 0; });
    const noPower = advanceSettlement(p, 10000);
    const powered = advanceSettlement(addBuilding(p, 'geothermal-generator'), 10000);
    expect(settlementStats(powered).power).toBe(12); expect(settlementStats(powered).powerDemand).toBe(4);
    expect(powered.simulation.citizens[0]!.health).toBeGreaterThan(noPower.simulation.citizens[0]!.health);
    expect(settlementStats(powered).happiness).toBeGreaterThan(settlementStats(noPower).happiness);
  });
  it('runs resource-funded community festivals and applies a temporary happiness boost', () => {
    const p = withBuildings(['community-plaza', 'rainwater-collector']); p.simulation.goods.bread = 100;
    const next = advanceSettlement(p, 120000); expect(next.simulation.festivals).toBe(1); expect(next.simulation.events.some(e => e.text.includes('Lantern festival'))).toBe(true);
    expect(settlementStats(next).happiness).toBeGreaterThan(50);
  });
  it('bounds offline catch-up to thirty minutes while advancing the wall-time cursor and pruning events', () => {
    const next = advanceSettlement(withBuildings(['pioneer-cottage', 'rainwater-collector', 'windmill-bakery']), 1000 * 60 * 60 * 24 * 365);
    expect(next.simulation.tick).toBe(MAX_OFFLINE_TICKS); expect(next.simulation.lastTickAt).toBe(1000 * 60 * 60 * 24 * 365);
    expect(next.simulation.events.length).toBeLessThanOrEqual(30); expect(validateProgress(next)).toBe(true);
  });
});

describe('ships, tourism and rare goods', () => {
  it('holds cargo ships in fog, docks safely with a beacon, departs on schedule and gates trades', () => {
    let p = advanceSettlement(withBuildings(['archipelago-pier']), 90000);
    expect(p.simulation.ship.phase).toBe('fogbound'); expect(trade(p, 'sell-fish').ok).toBe(false);
    p = addBuilding(p, 'coastal-lighthouse'); p = advanceSettlement(p, 100000);
    expect(p.simulation.ship.phase).toBe('docked'); expect(p.simulation.ship.visits).toBe(1);
    const coins = p.wallet.coins; const fish = p.simulation.goods.fish;
    p = trade(p, 'sell-fish').progress; expect(p.wallet.coins).toBe(coins + 10); expect(p.simulation.goods.fish).toBe(fish - 5);
    p = advanceSettlement(p, 120000); expect(p.simulation.ship.phase).toBe('sailing'); expect(trade(p, 'sell-fish').ok).toBe(false);
    p = advanceSettlement(p, 180000); expect(p.simulation.ship.phase).toBe('docked'); expect(p.simulation.ship.visits).toBe(2);
  });
  it('has visitors arrive, spend and depart, and refreshes purchasable rare merchant offers', () => {
    const p = withBuildings(['pioneer-cottage', 'rainwater-collector', 'visitor-lodge']);
    let next = advanceSettlement(p, 120000); expect(next.simulation.visitors.length).toBeGreaterThan(0); expect(next.wallet.coins).toBeGreaterThan(p.wallet.coins);
    expect(next.simulation.offers).toHaveLength(3);
    const seedOffer = next.simulation.offers.find(o => o.item === 'seed-crate')!;
    expect(tradeOffers(next).find(o => o.id === seedOffer.id)?.available).toBe(true);
    next = trade(next, seedOffer.id).progress; expect(next.simulation.rareItems.seeds).toBe(1); expect(trade(next, seedOffer.id).ok).toBe(false);
    const medicine = next.simulation.offers.find(o => o.item === 'medicine')!;
    next.simulation.citizens.forEach(c => { c.health = 40; c.illness = 'fever'; c.illSince = 100000; });
    next = trade(next, medicine.id).progress; expect(next.simulation.citizens.every(c => c.health === 70 && c.illness === null)).toBe(true);
    const later = advanceSettlement(next, 240000); expect(later.simulation.offers[0]?.id).not.toBe(seedOffer.id); expect(later.simulation.events.some(e => e.text.includes('left the lodge'))).toBe(true);
    expect(validateProgress(later)).toBe(true);
  });
  it('uses trade policy to change fish-sale revenue and applies navigation-chart fog reduction', () => {
    let p = withBuildings(['town-hall', 'archipelago-pier', 'coastal-lighthouse']); p = advanceSettlement(p, 90000); p = setPolicy(p, 'trade').progress;
    const before = p.wallet.coins; expect(trade(p, 'sell-fish').progress.wallet.coins).toBe(before + 15);
    p = funded(); p.simulation.rareItems.charts = 1; expect(settlementStats(p).fog).toBe(75); p.simulation.rareItems.charts = 3; expect(settlementStats(p).fog).toBe(25);
  });
});
