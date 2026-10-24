import { describe, expect, it } from 'vitest';
import { beginConstruction, buildBuilding, createProgress, finishConstruction, placeBuilding } from '../src/model/progress';
import { buildingLot, DEFAULT_LOTS } from '../src/model/placement';
import { loadProgress, saveProgress, validateProgress } from '../src/model/save';

describe('player chosen building locations', () => {
  it('places a plan and preserves its lot and facing through construction and reload', () => {
    let p = createProgress();
    p.wallet = { timber: 50, stone: 12, coins: 9 };
    p = placeBuilding(p,'home','ridge','right').progress;
    const pending = beginConstruction(p,'home',1000).progress;
    expect(pending.buildings.home).toMatchObject({lot:'ridge',facing:'right',built:false});
    const complete = finishConstruction(pending,6000).progress;
    expect(complete.wallet).toEqual({timber:20,stone:12,coins:9});
    expect(complete.buildings.home).toMatchObject({lot:'ridge',facing:'right',built:true});
    let raw:string|null=null;
    const storage={getItem:()=>raw,setItem:(_k:string,v:string)=>{raw=v;}};
    expect(saveProgress(storage,complete).ok).toBe(true);
    expect(loadProgress(storage)).toEqual({status:'ok',progress:complete});
  });

  it('moves completed buildings for free and protects occupied and reserved blocks', () => {
    let p = createProgress(); p.wallet.timber=30;
    p=buildBuilding(p,'home').progress;
    p=placeBuilding(p,'workshop','square','left').progress;
    const moved=placeBuilding(p,'home','west','right');
    expect(moved.ok).toBe(true);
    expect(moved.progress.wallet).toEqual(p.wallet);
    expect(moved.progress.buildings.home.built).toBe(true);
    expect(placeBuilding(moved.progress,'home','square','left').ok).toBe(false);
    expect(placeBuilding(moved.progress,'lookout','west','left').ok).toBe(false);
    expect(moved.progress.buildings.workshop.lot).toBe('square');
  });

  it('lets the home use an unbuilt default site and gives the later project a free site', () => {
    let p=createProgress();p.wallet={timber:100,stone:80,coins:0};
    p=placeBuilding(p,'home','grove','left').progress;
    p=buildBuilding(p,'home').progress;
    expect(buildingLot(p,'workshop')).not.toBe('grove');
    p=beginConstruction(p,'workshop',1000).progress;
    expect(p.buildings.workshop.lot).not.toBe('grove');
    expect(validateProgress(p)).toBe(true);
    expect(validateProgress(finishConstruction(p,6000).progress)).toBe(true);
  });

  it('rejects illegal blocks, locked buildings, bad facing, and moves during construction', () => {
    const p=createProgress();p.wallet.timber=30;
    expect(placeBuilding(p,'workshop','ridge','left').ok).toBe(false);
    expect(placeBuilding(p,'home','ocean' as any,'left').ok).toBe(false);
    expect(placeBuilding(p,'home','ridge','up' as any).ok).toBe(false);
    const pending=beginConstruction(p,'home',1000).progress;
    expect(placeBuilding(pending,'home','ridge','left').ok).toBe(false);
    expect(p.buildings.home).toEqual({style:'cottage',built:false});
  });

  it('retains old save defaults and rejects corrupt placement metadata or collisions', () => {
    const p=createProgress();
    expect(validateProgress(p)).toBe(true);
    expect(buildingLot(p,'home')).toBe(DEFAULT_LOTS.home);
    for (const field of [{lot:'sea'},{facing:'north'},{lot:undefined},{facing:undefined}]) {
      expect(validateProgress({...p,buildings:{...p.buildings,home:{...p.buildings.home,...field}}})).toBe(false);
    }
    const home=placeBuilding(p,'home','grove','left').progress;
    expect(validateProgress({...home,buildings:{...home.buildings,workshop:{...home.buildings.workshop,lot:'grove'}}})).toBe(false);
  });
});
