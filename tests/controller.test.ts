import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IslandController } from '../src/controller';
import { createProgress } from '../src/model/progress';
import { SAVE_KEY, validateProgress } from '../src/model/save';
import type { BuildingId, Progress } from '../src/model/types';

let saves: Map<string, string>;
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-23T12:00:00Z'));
  saves = new Map();
  vi.stubGlobal('window', {
    matchMedia: (query: string) => ({ matches: query.includes('959px'), addEventListener: vi.fn() }),
    addEventListener: vi.fn(),
    localStorage: { getItem: (key: string) => saves.get(key) ?? null, setItem: (key: string, value: string) => saves.set(key, value) },
  });
  vi.stubGlobal('document', { addEventListener: vi.fn(), hidden: false });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
const saved = () => JSON.parse(saves.get(SAVE_KEY)!) as Progress;
const ready = () => { const controller = new IslandController(); controller.bridge.onReady(); return controller; };
const finish = (controller: IslandController) => { vi.advanceTimersByTime(5_000); controller.tick(0); };

describe('playable settlement commands', () => {
  it('keeps locked projects and unaffordable offers from changing stock or the active target', () => {
    const c = ready();
    c.selectPlot('lookout');
    c.chooseStyle('watchtower');
    c.buy('stone');
    c.build();
    expect(c.progress.target).toBe('home');
    expect(c.progress.buildings.lookout).toEqual({ style: 'lighthouse', built: false });
    expect(c.progress.wallet).toEqual({ timber: 0, stone: 0, coins: 0 });
    c.selectPlot('home');
    c.buy('timber');
    expect(c.progress.wallet.coins).toBe(0);
    expect(c.canBuild).toBe(false);
  });

  it('buys supplies, banks real stone contacts, and resumes the same construction after reload', () => {
    const fixture = createProgress();
    fixture.buildings.home.built = true;
    fixture.target = 'workshop';
    fixture.wallet = { timber: 30, stone: 15, coins: 25 };
    saves.set(SAVE_KEY, JSON.stringify(fixture));
    let c = ready();
    expect(c.selectedPlot).toBe('workshop');
    c.chooseStyle('studio');
    c.buy('timber');
    c.buy('stone');
    expect(c.progress.wallet).toEqual({ timber: 35, stone: 20, coins: 0 });
    c.startRun();
    expect(c.run!.target).toBe('workshop');
    expect(c.run!.materials).toEqual(['timber', 'stone']);
    c.run!.entities = [
      { id: 't', kind: 'timber', lane: 0, z: 9 },
      { id: 's', kind: 'stone', lane: 0, z: 18 },
      { id: 'c', kind: 'coin', lane: 0, z: 27 },
      { id: 'stop', kind: 'obstacle', lane: 0, z: 36 },
    ];
    c.tick(3);
    expect(c.view).toBe('results');
    expect(c.progress.wallet).toEqual({ timber: 40, stone: 25, coins: 1 });
    c.island();
    expect(c.canBuild).toBe(true);
    c.build();
    const deadline = c.progress.pendingConstruction!.completesAt;
    expect(c.progress.wallet).toEqual({ timber: 0, stone: 5, coins: 1 });
    vi.advanceTimersByTime(2_000);
    c = ready();
    expect(c.selectedPlot).toBe('workshop');
    expect(c.progress.pendingConstruction!.completesAt).toBe(deadline);
    expect(c.bridge.read().constructionBuilding).toBe('workshop');
    c.startRun();
    expect(c.view).toBe('island');
    vi.advanceTimersByTime(3_000);
    c.tick(0);
    expect(c.progress.buildings.workshop).toEqual({ style: 'studio', built: true });
    expect(c.progress.wallet).toEqual({ timber: 0, stone: 5, coins: 1 });
    expect(c.progress.target).toBe('lookout');
    expect(validateProgress(saved())).toBe(true);
  });

  it.each([['workshop', 'lookout'], ['lookout', 'workshop']] as BuildingId[][])(
    'finishes the settlement in %s then %s order and supports a saved coin-only replay', (first, second) => {
      const c = ready();
      c.progress.wallet = { timber: 100, stone: 70, coins: 30 };
      c.build();
      finish(c);
      expect(c.level).toBe(2);
      for (const id of [first, second]) {
        c.selectPlot(id);
        c.chooseStyle(id === 'workshop' ? 'studio' : 'watchtower');
        expect(c.canBuild).toBe(true);
        c.build();
        expect(c.progress.buildings[id].built).toBe(false);
        finish(c);
        expect(c.progress.buildings[id].built).toBe(true);
      }
      expect(c.complete).toBe(true);
      expect(c.progress.target).toBeNull();
      expect(c.progress.wallet).toEqual({ timber: 10, stone: 10, coins: 30 });
      const reloaded = ready();
      expect(reloaded.complete).toBe(true);
      expect(reloaded.progress.buildings.workshop.style).toBe('studio');
      expect(reloaded.progress.buildings.lookout.style).toBe('watchtower');
      reloaded.buy('timber');
      expect(reloaded.progress.wallet).toEqual(c.progress.wallet);
      reloaded.startRun();
      expect(reloaded.run!.materials).toEqual([]);
      expect(reloaded.run!.entities.some(entity => entity.kind === 'stone' || entity.kind === 'timber')).toBe(false);
    },
  );
});

describe('guidance and save recovery', () => {
  it('remembers actual first-play actions, supports skipping, and never grants resources for guidance', () => {
    let c = ready();
    expect(c.guideStep).toBe('choose-style');
    c.openSettlement();
    expect(c.progress.tutorial.completed).toContain('welcome');
    c.chooseStyle('bungalow');
    expect(c.guideStep).toBe('first-run');
    c.startRun();
    c.move(1);
    expect(c.progress.tutorial.completed).toContain('first-run');
    expect(c.progress.wallet).toEqual({ timber: 0, stone: 0, coins: 0 });
    c = ready();
    expect(c.view).toBe('island');
    expect(c.run).toBeNull();
    expect(c.progress.buildings.home.style).toBe('bungalow');
    expect(c.progress.tutorial.completed).toContain('choose-style');
    c.skipGuide();
    expect(c.guideStep).toBeNull();
    c = ready();
    expect(c.progress.tutorial.skipped).toBe(true);
    expect(c.guideStep).toBeNull();
    c.startRun();
    expect(c.view).toBe('run');
    expect(c.progress.wallet.timber).toBe(0);
  });

  it('advances from the first banked run to building and completes the guide only after construction', () => {
    const c = ready();
    c.chooseStyle('cottage');
    c.startRun();
    c.run!.entities = [0,1,2,3,4,5].map(i => ({ id: String(i), kind: 'timber' as const, lane: 0 as const, z: 5 + i * 5 }));
    c.run!.generatedUntil=Infinity;
    c.tick(2);
    c.bankRun();
    expect(c.progress.wallet.timber).toBe(30);
    expect(c.guideStep).toBe('build');
    c.island();
    expect(c.progress.tutorial.completed).toContain('results');
    c.build();
    expect(c.progress.tutorial.completed).not.toContain('build');
    expect(c.guideStep).toBeNull();
    finish(c);
    expect(c.progress.tutorial.completed).toContain('build');
    expect(c.guideStep).toBeNull();
    expect(c.progress.wallet.timber).toBe(0);
  });

  it('completes an expired construction on reopen without another material charge', () => {
    const c = ready();
    c.chooseStyle('bungalow');
    c.progress.wallet.timber = 35;
    c.build();
    vi.advanceTimersByTime(6_000);
    const reloaded = ready();
    expect(reloaded.progress.buildings.home).toEqual({ style: 'bungalow', built: true });
    expect(reloaded.progress.pendingConstruction).toBeNull();
    expect(reloaded.progress.wallet.timber).toBe(5);
    expect(reloaded.progress.tutorial.completed).toContain('build');
    expect(reloaded.guideStep).toBeNull();
  });

  it('recognizes an older returning island without replaying newly introduced guidance', () => {
    const fixture = createProgress();
    fixture.wallet.timber = 15;
    saves.set(SAVE_KEY, JSON.stringify(fixture));
    const c = ready();
    expect(c.progress.wallet.timber).toBe(15);
    expect(c.progress.tutorial.skipped).toBe(true);
    expect(c.guideStep).toBeNull();
  });

  it('preserves corrupt save data through session play until a confirmed fresh start', () => {
    saves.set(SAVE_KEY, '{unreadable');
    const c = ready();
    expect(c.modal).toBe('save-recovery');
    c.continueSession();
    c.chooseStyle('bungalow');
    c.skipGuide();
    expect(saves.get(SAVE_KEY)).toBe('{unreadable');
    expect(c.saveMessage).toContain('previous save preserved');
    c.freshStart();
    expect(validateProgress(saved())).toBe(true);
    expect(saved().wallet).toEqual({ timber: 0, stone: 0, coins: 0 });
    expect(c.guideStep).toBe('choose-style');
  });

  it('keeps the run paused on focus loss until explicit resume and survives unavailable saving', () => {
    Object.defineProperty(window, 'localStorage', { value: {
      getItem: () => { throw new Error('unavailable'); },
      setItem: () => { throw new Error('unavailable'); },
    }, configurable: true });
    const c = ready();
    c.startRun();
    c.run!.entities = [];
    c.tick(1);
    const blur = vi.mocked(window.addEventListener).mock.calls.find(([name]) => name === 'blur')![1] as () => void;
    blur();
    c.tick(20);
    expect(c.run!.elapsed).toBe(1);
    expect(c.run!.phase).toBe('paused');
    c.resume();
    c.tick(1);
    expect(c.run!.elapsed).toBe(2);
    expect(c.saveMessage).toContain('Session only');
    expect(saves.size).toBe(0);
  });
});


describe('placement preview commands', () => {
  it('keeps canceled previews out of saves and saves a confirmed position without spending stock', () => {
    const c=ready();
    c.openPlacement();
    c.selectPlacementLot('ridge');
    c.flipPlacement();
    expect(c.placement).toMatchObject({lot:'ridge',facing:'right'});
    expect(c.progress.buildings.home.lot).toBeUndefined();
    c.cancelPlacement();
    expect(c.progress.buildings.home.lot).toBeUndefined();
    c.openPlacement();c.selectPlacementLot('ridge');c.confirmPlacement();
    expect(c.placement).toBeNull();
    expect(saved().buildings.home.lot).toBe('ridge');
    expect(c.progress.wallet).toEqual({timber:0,stone:0,coins:0});
    const reloaded=ready();
    expect(reloaded.bridge.read().buildingLots.home).toBe('ridge');
  });

  it('does not start a run or build while a placement preview is pending', () => {
    const c=ready();c.progress.wallet.timber=30;
    c.openPlacement();c.startRun();c.build();
    expect(c.view).toBe('island');
    expect(c.run).toBeNull();
    expect(c.progress.pendingConstruction).toBeNull();
    expect(c.progress.wallet.timber).toBe(30);
  });
});


describe('endless return and direct building moves', () => {
  it('banks a paused run once and reloads the retained loot', () => {
    const c=ready();c.startRun();
    c.run!.entities=[{id:'t',kind:'timber',lane:0,z:9},{id:'c',kind:'coin',lane:0,z:18}];
    c.tick(1);c.pause();c.bankRun();
    expect(c.view).toBe('results');expect(c.run!.endReason).toBe('return');
    expect(c.progress.wallet).toEqual({timber:5,stone:0,coins:1});
    c.bankRun();expect(c.progress.wallet.timber).toBe(5);
    expect(ready().progress.wallet).toEqual(c.progress.wallet);
  });

  it('opens relocation directly when a completed building is selected on the map', () => {
    const c=ready();c.progress.buildings.home.built=true;c.progress.target='workshop';
    c.bridge.selectPlot('home');
    expect(c.placement).toMatchObject({id:'home',lot:'harbor'});
    expect(c.settlementOpen).toBe(false);
  });
});
