import { describe, expect, it } from 'vitest';
import { beginConstruction, createProgress, finishConstruction } from '../src/model/progress';
import { LEGACY_BACKUP_KEY, loadProgress, SAVE_KEY, saveProgress, validateProgress } from '../src/model/save';
import { funded, legacy, withBuildings } from './settlement-fixtures';
import { advanceSettlement } from '../src/model/simulation';
import type { StorageAdapter } from '../src/model/types';
const memory = (raw?: string) => { const data = new Map<string,string>(raw === undefined ? [] : [[SAVE_KEY, raw]]); const writes: string[] = []; const storage: StorageAdapter = { getItem: key => data.get(key) ?? null, setItem: (key, value) => { writes.push(key); data.set(key, value); } }; return { data, writes, storage }; };

describe('v2 durable settlement validation and saves', () => {
  it('round-trips a fresh island, construction sites, citizens and live ship state', () => {
    const store = memory(); expect(loadProgress(store.storage)).toEqual({ status: 'empty' }); let p = funded();
    p = beginConstruction(p, { id: 'first', type: 'pioneer-cottage', style: 'island', lot: '0:harbor:0', facing: 'right' }, 1000).progress;
    expect(saveProgress(store.storage, p)).toEqual({ ok: true }); expect(loadProgress(store.storage)).toEqual({ status: 'ok', progress: p });
    p = finishConstruction(p, 6000).progress; p = advanceSettlement(p, 10000); expect(validateProgress(p)).toBe(true); expect(saveProgress(store.storage, p).ok).toBe(true);
    expect(loadProgress(store.storage)).toEqual({ status: 'ok', progress: p });
  });
  it('does not silently overwrite unreadable or unknown-version saves', () => {
    for (const raw of ['broken-json', '{}', JSON.stringify({ ...createProgress(0), version: 99 })]) {
      const store = memory(raw); expect(loadProgress(store.storage).status).toBe('corrupt'); expect(saveProgress(store.storage, createProgress(0)).ok).toBe(false); expect(store.data.get(SAVE_KEY)).toBe(raw);
      expect(saveProgress(store.storage, createProgress(0), { overwriteCorrupt: true }).ok).toBe(true);
    }
  });
  it('rejects duplicate instances, overlapping sites, illegal grounds and invalid simulation references', () => {
    const original = withBuildings(['pioneer-cottage', 'rainwater-collector']);
    const bad = (edit: (p: typeof original) => void) => { const p = structuredClone(original); edit(p); expect(validateProgress(p)).toBe(false); };
    bad(p => { p.buildings[1]!.id = p.buildings[0]!.id; }); bad(p => { p.buildings[1]!.lot = p.buildings[0]!.lot; });
    bad(p => { p.buildings[0]!.lot = '0:ridge:0'; }); bad(p => { p.buildings[1]!.completesAt++; });
    bad(p => { p.simulation.citizens[0]!.jobId = 'missing'; }); bad(p => { p.simulation.citizens[0]!.health = NaN; });
    bad(p => { p.simulation.goods.water = -1; }); bad(p => { p.simulation.ship.departsAt++; });
    bad(p => { p.settledRunIds = ['run', 'run']; p.lastSettledRunId = 'run'; });
  });
  it('reports unavailable reads/writes and never writes invalid progress', () => {
    expect(loadProgress(null).status).toBe('unavailable'); expect(saveProgress(null, createProgress(0)).ok).toBe(false);
    const denied: StorageAdapter = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); } };
    expect(loadProgress(denied).status).toBe('unavailable'); expect(saveProgress(denied, createProgress(0)).ok).toBe(false);
    const store = memory(); const invalid = createProgress(0); invalid.wallet.timber = -1; expect(saveProgress(store.storage, invalid).ok).toBe(false); expect(store.writes).toEqual([]);
  });
});

describe('v1 migration without data loss', () => {
  it('preserves stocks, original completed design, facing, location, tutorial and reward ledger before any save writes', () => {
    const raw = JSON.stringify(legacy()); const store = memory(raw); const loaded = loadProgress(store.storage);
    expect(loaded.status).toBe('ok'); if (loaded.status !== 'ok') throw new Error('migration failed');
    expect(loaded.migrated).toBe(true); expect(loaded.progress.wallet).toEqual(legacy().wallet); expect(loaded.progress.buildings[0]).toMatchObject({ id: 'legacy-home', type: 'pioneer-cottage', style: 'bungalow', lot: '0:ridge:0', facing: 'right', state: 'complete', legacy: true });
    expect(loaded.progress.designs['artisan-workshop']).toBe('studio'); expect(loaded.progress.target).toBe('artisan-workshop'); expect(loaded.progress.settledRunIds).toEqual(['earlier-run']);
    expect(store.writes).toEqual([]); expect(store.data.get(SAVE_KEY)).toBe(raw);
    expect(saveProgress(store.storage, loaded.progress).ok).toBe(true); expect(store.writes).toEqual([LEGACY_BACKUP_KEY, SAVE_KEY]); expect(store.data.get(LEGACY_BACKUP_KEY)).toBe(raw); expect(JSON.parse(store.data.get(SAVE_KEY)!).version).toBe(2);
  });
  it('retains the original deadline and reserved stock for an in-flight legacy build, then completes it once', () => {
    const old: any = legacy(); old.buildings.workshop.lot = 'square'; old.buildings.workshop.facing = 'right'; old.pendingConstruction = { buildingId: 'workshop', startedAt: 98000, completesAt: 103000 };
    const store = memory(JSON.stringify(old)); const loaded = loadProgress(store.storage); if (loaded.status !== 'ok') throw new Error('migration failed');
    const p = loaded.progress; expect(p.buildings[1]).toMatchObject({ state: 'building', startedAt: 98000, completesAt: 103000, style: 'studio', lot: '0:square:0', facing: 'right' });
    expect(finishConstruction(p, 102999).ok).toBe(false); const result = finishConstruction(p, 103000); expect(result.ok).toBe(true); expect(result.progress.wallet).toEqual(old.wallet); expect(finishConstruction(result.progress, 103000).ok).toBe(false);
  });
  it('migrates watchtower and finished starter settlements without imposing a new recipe limit', () => {
    const old: any = legacy(); old.buildings.workshop.built = true; old.buildings.lookout = { built: true, style: 'watchtower', lot: 'upper', facing: 'left' }; old.target = null;
    const loaded = loadProgress(memory(JSON.stringify(old)).storage); if (loaded.status !== 'ok') throw new Error('migration failed');
    expect(loaded.progress.buildings.map(b => b.type)).toEqual(['pioneer-cottage', 'artisan-workshop', 'border-outpost']); expect(loaded.progress.buildings[2]!.lot).toBe('0:upper:0'); expect(loaded.progress.target).toBe('pioneer-cottage'); expect(validateProgress(loaded.progress)).toBe(true);
  });
  it('preserves the original save if its required byte-for-byte backup cannot be written', () => {
    const raw = JSON.stringify(legacy()); let primary = raw; const writes: string[] = [];
    const storage: StorageAdapter = { getItem: key => key === SAVE_KEY ? primary : null, setItem: (key, value) => { writes.push(key); if (key === LEGACY_BACKUP_KEY) throw new Error('quota'); primary = value; } };
    const loaded = loadProgress(storage); if (loaded.status !== 'ok') throw new Error('migration failed');
    expect(saveProgress(storage, loaded.progress).ok).toBe(false); expect(primary).toBe(raw); expect(writes).toEqual([LEGACY_BACKUP_KEY]);
  });
  it('rejects malformed v1 saves without attempting repair or backup writes', () => {
    for (const change of [(p: any) => { p.wallet.coins = -1; }, (p: any) => { p.buildings.workshop.built = true; p.buildings.home.built = false; }, (p: any) => { p.pendingConstruction = { buildingId: 'workshop', startedAt: 0, completesAt: 9 }; }, (p: any) => { p.buildings.workshop.lot = 'ridge'; }]) {
      const old = legacy(); change(old); const store = memory(JSON.stringify(old)); expect(loadProgress(store.storage).status).toBe('corrupt'); expect(store.writes).toEqual([]);
    }
  });
});
