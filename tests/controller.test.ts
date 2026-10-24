import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IslandController } from '../src/controller';
import { availableLots } from '../src/model/placement';
import { createProgress } from '../src/model/progress';
import { LEGACY_BACKUP_KEY, SAVE_KEY, validateProgress } from '../src/model/save';
import { addBuilding, funded, legacy } from './settlement-fixtures';
import type { BuildingType, Progress } from '../src/model/types';

let saves: Map<string,string>;
let events: Map<string, () => void>;
beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-24T12:00:00Z'));
  saves=new Map();events=new Map();
  vi.stubGlobal('window', {matchMedia:(query:string)=>({matches:query.includes('959px'),addEventListener:vi.fn()}),
    addEventListener:vi.fn((event:string,listener:()=>void)=>events.set(event,listener)),
    localStorage:{getItem:(key:string)=>saves.get(key)??null,setItem:(key:string,value:string)=>saves.set(key,value)}});
  vi.stubGlobal('document',{addEventListener:vi.fn((event:string,listener:()=>void)=>events.set(event,listener)),hidden:false});
});
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});
const saved=()=>JSON.parse(saves.get(SAVE_KEY)!) as Progress;
const ready=()=>{const c=new IslandController();c.bridge.onReady();return c;};
const seed=(p:Progress)=>saves.set(SAVE_KEY,JSON.stringify(p));
const finish=(c:IslandController,ms=5000)=>{vi.advanceTimersByTime(ms);c.tick(0);};
const build=(c:IslandController,type:BuildingType='pioneer-cottage',lot?:string)=>{c.selectType(type);c.openPlacement();if(lot)c.selectPlacementLot(lot);c.confirmPlacement();};
const supplyRun=(c:IslandController)=>{c.selectType('artisan-workshop');c.startRun();c.run!.generatedUntil=Infinity;c.run!.entities=[{id:'wood',kind:'timber',lane:0,z:9},{id:'stone',kind:'stone',lane:0,z:18},{id:'coin',kind:'coin',lane:0,z:27},{id:'stop',kind:'obstacle',lane:0,z:36}];c.tick(3);};

describe('v2 construction and settlement commands',()=>{
  it('keeps unaffordable or locked construction previews from deducting resources',()=>{
    const c=ready();c.openPlacement();expect(c.placement).not.toBeNull();c.confirmPlacement();
    expect(c.progress.buildings).toEqual([]);expect(c.progress.wallet.timber).toBe(0);expect(c.placement).not.toBeNull();
    c.cancelPlacement();c.selectType('medical-clinic');c.openPlacement();expect(c.placement).toBeNull();expect(c.progress.target).toBe('medical-clinic');
    c.buy('stone');expect(c.progress.wallet.coins).toBe(0);expect(c.canBuild).toBe(false);
  });
  it('opens four catalog categories and keeps selected gathering recipes independent of old building caps',()=>{
    const c=ready();c.selectCategory('production');expect(c.category).toBe('production');expect(c.selectedType).toBe('lumber-yard');
    c.selectType('geothermal-generator');expect(c.progress.target).toBe('geothermal-generator');c.startRun();expect(c.run!.materials).toEqual(['timber','stone']);
    expect(c.run!.target).toBe('geothermal-generator');
  });
  it('builds repeated copies concurrently, reserves once and completes after the original deadlines across reload',()=>{
    let c=ready();c.progress.wallet={timber:100,stone:50,coins:0};c.chooseStyle('bungalow');build(c);
    const first=c.progress.buildings[0]!;expect(first.state).toBe('building');expect(c.progress.wallet.timber).toBe(70);
    finish(c,1000);build(c);expect(c.progress.buildings).toHaveLength(2);expect(c.progress.wallet.timber).toBe(40);
    expect(new Set(c.progress.buildings.map(b=>b.id)).size).toBe(2);expect(new Set(c.progress.buildings.map(b=>b.lot)).size).toBe(2);
    c=ready();expect(c.progress.buildings[0]!.completesAt).toBe(first.completesAt);expect(c.progress.buildings.every(b=>b.style==='bungalow')).toBe(true);
    finish(c,4000);expect(c.progress.buildings.map(b=>b.state)).toEqual(['complete','building']);finish(c,1000);
    expect(c.progress.buildings.every(b=>b.state==='complete')).toBe(true);expect(c.progress.wallet.timber).toBe(40);expect(c.stats.capacity).toBe(8);
    c.tick(0);expect(c.progress.wallet.timber).toBe(40);expect(validateProgress(saved())).toBe(true);
  });
  it('finishes expired construction on the next rendered tick after reopen and never charges twice',()=>{
    const c=ready();c.progress.wallet.timber=35;build(c);const deadline=c.progress.buildings[0]!.completesAt;
    vi.advanceTimersByTime(6000);const restored=ready();expect(restored.progress.buildings[0]!.completesAt).toBe(deadline);restored.tick(0);
    expect(restored.progress.buildings[0]!.state).toBe('complete');expect(restored.progress.wallet.timber).toBe(5);expect(restored.progress.tutorial.completed).toContain('build');
    expect(ready().progress.buildings[0]!.state).toBe('complete');
  });
  it('keeps canceled drafts out of persisted data and validates occupied or unsuitable slots',()=>{
    const c=ready();c.progress.wallet.timber=50;c.chooseStyle('cottage');const before=saves.get(SAVE_KEY);
    c.openPlacement();c.selectPlacementLot('0:west:1');c.flipPlacement();expect(c.placement).toMatchObject({lot:'0:west:1',facing:'right'});c.cancelPlacement();
    expect(saves.get(SAVE_KEY)).toBe(before);expect(c.progress.buildings).toEqual([]);
    build(c,'pioneer-cottage','0:west:1');finish(c);c.selectType('lumber-yard');c.openPlacement();const valid=c.placement!.lot;
    c.selectPlacementLot('0:harbor:0');expect(c.placement!.lot).toBe(valid);c.selectPlacementLot('0:west:1');expect(c.placement!.lot).toBe(valid);
  });
  it('opens map relocation directly and saves free movement and facing without changing the building identity',()=>{
    const fixture=addBuilding(funded(Date.now()),'pioneer-cottage');seed(fixture);const c=ready();const id=c.progress.buildings[0]!.id;const wallet={...c.progress.wallet};
    c.openSettlement();c.bridge.selectBuilding(id);expect(c.placement?.instanceId).toBe(id);expect(c.settlementOpen).toBe(false);
    c.bridge.selectLot('0:west:2');c.flipPlacement();c.confirmPlacement();expect(c.placement).toBeNull();
    expect(c.progress.buildings[0]).toMatchObject({id,lot:'0:west:2',facing:'right'});expect(c.progress.wallet).toEqual(wallet);expect(ready().progress.buildings[0]!.lot).toBe('0:west:2');
  });
  it('shows a selected construction site without trying to move its unfinished instance',()=>{
    const c=ready();c.progress.wallet.timber=30;build(c);const site=c.progress.buildings[0]!;c.bridge.selectBuilding(site.id);
    expect(c.selected?.id).toBe(site.id);expect(c.placement).toBeNull();expect(c.settlementOpen).toBe(true);
  });
  it('saves policy, upgrade and worker commands through the same validated settlement state',()=>{
    let p=funded(Date.now());p=addBuilding(p,'town-hall');p=addBuilding(p,'rainwater-collector');seed(p);const c=ready();
    c.changePolicy('wellbeing');expect(c.progress.simulation.policy).toBe('wellbeing');c.upgrade(c.progress.buildings[0]!.id);expect(c.level).toBe(3);
    const person=c.progress.simulation.citizens[0]!;c.assignWorker(person.id,c.progress.buildings[1]!.id);c.inspectCitizen(person.id);
    expect(c.selectedCitizen).toBe(person.id);expect(saved().simulation.citizens[0]!.jobId).toBe(c.progress.buildings[1]!.id);expect(validateProgress(saved())).toBe(true);
  });
  it('salvages a completed cottage to recover space and keeps the refund on reload',()=>{
    const p=addBuilding(funded(Date.now()),'pioneer-cottage');p.wallet.timber=0;seed(p);const c=ready();const id=c.progress.buildings[0]!.id;c.bridge.selectBuilding(id);c.dismantle(id);
    expect(c.placement).toBeNull();expect(c.selectedInstance).toBeNull();expect(c.progress.buildings).toEqual([]);expect(c.progress.wallet.timber).toBe(15);expect(ready().progress.wallet.timber).toBe(15);
  });
});

describe('runner rewards, pause and game boundaries',()=>{
  it('banks every real collision pickup once and restores resources after reload',()=>{
    const c=ready();supplyRun(c);expect(c.view).toBe('results');expect(c.run!.phase).toBe('settled');expect(c.run!.endReason).toBe('collision');
    expect(c.progress.wallet).toEqual({timber:5,stone:5,coins:1});c.bankRun();c.tick(20);expect(c.progress.wallet.timber).toBe(5);
    expect(ready().progress.wallet).toEqual(c.progress.wallet);c.island();expect(c.view).toBe('island');expect(c.run).toBeNull();
  });
  it('keeps overflow safe at the harbor and unloads after enough storage becomes available',()=>{
    const c=ready();c.startRun();c.run!.loot={timber:220,stone:180,coins:8};c.pause();c.bankRun();
    expect(c.progress.wallet).toEqual({timber:150,stone:150,coins:8});expect(c.progress.simulation.overflow).toEqual({timber:70,stone:30,coins:0});
    c.island();c.progress=addBuilding(c.progress,'storage-depot');c.unloadCargo();expect(c.progress.wallet.timber).toBe(220);expect(c.progress.simulation.overflow.timber).toBe(0);expect(validateProgress(saved())).toBe(true);
  });
  it('protects unsettled loot against duplicate starts and exiting a paused run',()=>{
    const c=ready();c.startRun();c.run!.loot.timber=15;const id=c.run!.id;c.startRun();expect(c.run!.id).toBe(id);
    c.pause();c.island();c.startRun();expect(c.view).toBe('run');expect(c.run!.id).toBe(id);expect(c.run!.phase).toBe('paused');
    c.bankRun();expect(c.view).toBe('results');expect(c.progress.wallet.timber).toBe(15);c.startRun();expect(c.run!.id).not.toBe(id);
  });
  it('freezes runner elapsed time on blur or hidden document until explicit resume',()=>{
    const c=ready();c.startRun();c.run!.entities=[];c.run!.generatedUntil=Infinity;c.tick(1);events.get('blur')!();c.tick(20);
    expect(c.run!.phase).toBe('paused');expect(c.run!.elapsed).toBe(1);c.resume();c.tick(1);expect(c.run!.elapsed).toBe(2);
    Object.defineProperty(document,'hidden',{value:true,configurable:true});events.get('visibilitychange')!();c.tick(5);expect(c.run!.elapsed).toBe(2);expect(c.run!.phase).toBe('paused');
  });
  it('pauses for help and blocks background inputs, recipe edits and premature resume',()=>{
    const c=ready();c.startRun();const target=c.selectedType;c.openHelp();const before=c.run;c.move(1);c.jump();c.resume();c.chooseStyle('bungalow');c.selectType('lumber-yard');c.bankRun();
    expect(c.run).toBe(before);expect(c.selectedType).toBe(target);expect(c.run!.phase).toBe('paused');c.closeModal();expect(c.run!.phase).toBe('paused');c.resume();expect(c.run!.phase).toBe('active');
  });
  it('continues settlement wall-time simulation while a runner is paused without advancing run physics',()=>{
    seed(addBuilding(funded(Date.now()),'rainwater-collector'));const c=ready();c.startRun();c.pause();vi.advanceTimersByTime(10000);c.tick(50);
    expect(c.run!.elapsed).toBe(0);expect(c.progress.simulation.tick).toBe(1);expect(c.stats.employed).toBe(1);expect(validateProgress(saved())).toBe(true);
  });
  it('keeps play disabled until art is ready and reports renderer errors without creating a run',()=>{
    const c=new IslandController();c.startRun();expect(c.run).toBeNull();c.bridge.onError('Image could not load');c.bridge.onReady();c.startRun();expect(c.run).toBeNull();expect(c.error).toContain('Image');
  });
});

describe('guidance, migration and safe recovery',()=>{
  it('guides real actions from a design to retained loot to completed first construction without free resources',()=>{
    const c=ready();expect(c.guideStep).toBe('choose-style');c.openSettlement();c.chooseStyle('cottage');expect(c.guideStep).toBe('first-run');
    c.startRun();c.run!.generatedUntil=Infinity;c.run!.entities=[0,1,2,3,4,5].map(i=>({id:String(i),kind:'timber' as const,lane:0 as const,z:5+i*5}));c.tick(2);c.bankRun();
    expect(c.progress.wallet.timber).toBe(30);expect(c.guideStep).toBe('build');c.island();expect(c.progress.tutorial.completed).toContain('results');build(c);
    expect(c.guideStep).toBeNull();expect(c.progress.tutorial.completed).not.toContain('build');finish(c);expect(c.progress.tutorial.completed).toContain('build');expect(c.progress.wallet.timber).toBe(0);expect(ready().guideStep).toBeNull();c.dismantle(c.progress.buildings[0]!.id);expect(c.guideStep).toBeNull();
  });
  it('remembers design and guide skipping across reload while active runs remain ephemeral',()=>{
    let c=ready();c.chooseStyle('bungalow');c.startRun();c.move(1);c=ready();expect(c.view).toBe('island');expect(c.run).toBeNull();expect(c.progress.designs['pioneer-cottage']).toBe('bungalow');
    expect(c.progress.tutorial.completed).toContain('first-run');c.skipGuide();expect(ready().guideStep).toBeNull();expect(c.progress.wallet).toEqual({timber:0,stone:0,coins:0});
  });
  it('migrates an existing island and backs it up byte-for-byte before its first controller save',()=>{
    const fixture=legacy();const raw=JSON.stringify(fixture);saves.set(SAVE_KEY,raw);const c=ready();
    expect(c.progress.version).toBe(2);expect(c.progress.buildings[0]).toMatchObject({type:'pioneer-cottage',style:'bungalow',facing:'right',lot:'0:ridge:0'});
    expect(saves.get(LEGACY_BACKUP_KEY)).toBe(raw);expect(saved().wallet).toEqual(fixture.wallet);expect(c.selectedType).toBe('artisan-workshop');expect(c.guideStep).toBeNull();expect(validateProgress(saved())).toBe(true);
  });
  it('preserves corrupt data through session play until an explicit fresh-start action',()=>{
    saves.set(SAVE_KEY,'{unreadable');const c=ready();expect(c.modal).toBe('save-recovery');c.chooseStyle('bungalow');expect(c.progress.designs['pioneer-cottage']).toBe('island');
    c.continueSession();c.chooseStyle('bungalow');c.skipGuide();expect(saves.get(SAVE_KEY)).toBe('{unreadable');expect(c.saveMessage).toContain('previous save preserved');
    c.freshStart();expect(validateProgress(saved())).toBe(true);expect(saved().wallet).toEqual({timber:0,stone:0,coins:0});expect(c.guideStep).toBe('choose-style');
  });
  it('plays and retains loot in-session when browser saving is unavailable',()=>{
    Object.defineProperty(window,'localStorage',{value:{getItem:()=>{throw new Error('unavailable');},setItem:()=>{throw new Error('unavailable');}},configurable:true});
    const c=ready();supplyRun(c);expect(c.progress.wallet).toEqual({timber:5,stone:5,coins:1});expect(c.saveMessage).toContain('Session only');expect(saves.size).toBe(0);
  });
  it('resets selected instances, citizens, drafts and old run state on a fresh coast',()=>{
    const c=ready();c.progress=addBuilding(funded(Date.now()),'pioneer-cottage');c.bridge.selectBuilding(c.progress.buildings[0]!.id);c.inspectCitizen(c.progress.simulation.citizens[0]!.id);c.freshStart();
    expect(c.selectedInstance).toBeNull();expect(c.selectedCitizen).toBeNull();expect(c.placement).toBeNull();expect(c.run).toBeNull();expect(c.progress.buildings).toEqual([]);expect(c.progress.simulation.citizens).toHaveLength(2);expect(c.modal).toBe('none');
  });
});

it('clears the migration notice after the game is ready instead of covering vitals indefinitely',()=>{
  saves.set(SAVE_KEY,JSON.stringify(legacy()));
  const c=ready();
  expect(c.notice).toContain('carried');
  vi.advanceTimersByTime(4200);
  expect(c.notice).toBe('');
});
