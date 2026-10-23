import { describe, expect, it } from 'vitest';
import { beginConstruction, buildBuilding, chooseStyle, createProgress, finishConstruction } from '../src/model/progress';
import { loadProgress, SAVE_KEY, saveProgress, validateProgress } from '../src/model/save';
import type { StorageAdapter } from '../src/model/types';

function memoryStorage(initial: string | null = null) {
  let raw = initial;
  let writes = 0;
  const storage: StorageAdapter = {
    getItem: () => raw,
    setItem: (_key, value) => { raw = value; writes++; },
  };
  return { storage, read: () => raw, writes: () => writes };
}
describe('browser save boundary', () => {
  it('round-trips the complete progress record and never creates a save on read', () => {
    const memory = memoryStorage();
    expect(loadProgress(memory.storage)).toEqual({ status: 'empty' });
    expect(memory.writes()).toBe(0);
    const progress = createProgress();
    expect(saveProgress(memory.storage, progress)).toEqual({ ok: true });
    expect(loadProgress(memory.storage)).toEqual({ status: 'ok', progress });
    expect(SAVE_KEY).toBe('island-rush:progress:v1');
  });

  it('preserves unreadable data until a confirmed reset explicitly replaces it', () => {
    const memory = memoryStorage('{broken original save');
    const loaded = loadProgress(memory.storage);
    expect(loaded).toMatchObject({ status: 'corrupt', raw: '{broken original save' });
    expect(saveProgress(memory.storage, createProgress())).toMatchObject({ ok: false, reason: 'corrupt' });
    expect(memory.read()).toBe('{broken original save');
    expect(memory.writes()).toBe(0);
    const fresh = createProgress();
    expect(saveProgress(memory.storage, fresh, { overwriteCorrupt: true })).toEqual({ ok: true });
    expect(loadProgress(memory.storage)).toEqual({ status: 'ok', progress: fresh });
  });

  it.each([
    ['negative balance', (progress: any) => { progress.wallet.coins = -1; }],
    ['fractional material', (progress: any) => { progress.wallet.timber = 2.5; }],
    ['infinite balance', (progress: any) => { progress.wallet.stone = Infinity; }],
    ['unsafe balance', (progress: any) => { progress.wallet.timber = Number.MAX_SAFE_INTEGER + 1; }],
    ['unknown style', (progress: any) => { progress.buildings.home.style = 'forge'; }],
    ['locked building completed', (progress: any) => { progress.buildings.lookout.built = true; }],
    ['invalid target', (progress: any) => { progress.target = 'workshop'; }],
    ['missing active target', (progress: any) => { progress.target = null; }],
    ['unknown schema', (progress: any) => { progress.version = 2; }],
    ['duplicate reward ledger', (progress: any) => { progress.lastSettledRunId = 'one'; progress.settledRunIds = ['one', 'one']; }],
    ['unknown tutorial step', (progress: any) => { progress.tutorial.completed = ['unknown']; }],
  ])('rejects %s without overwriting', (_name, mutate) => {
    const progress = createProgress();
    mutate(progress);
    expect(validateProgress(progress)).toBe(false);
    const memory = memoryStorage();
    expect(saveProgress(memory.storage, progress)).toMatchObject({ ok: false, reason: 'invalid' });
    expect(memory.writes()).toBe(0);
  });

  it('reports unavailable reads and full-storage writes without throwing', () => {
    const blocked = { getItem: () => { throw new Error('blocked'); }, setItem: () => {} };
    expect(loadProgress(blocked)).toMatchObject({ status: 'unavailable' });
    expect(saveProgress(blocked, createProgress())).toMatchObject({ ok: false, reason: 'unavailable' });
    const full = { getItem: () => null, setItem: () => { throw new Error('quota'); } };
    expect(saveProgress(full, createProgress())).toMatchObject({ ok: false, reason: 'unavailable' });
    expect(loadProgress(null)).toMatchObject({ status: 'unavailable' });
  });
});

describe('construction save compatibility', () => {
  it('reads and round-trips an existing version-one save without adding or changing fields', () => {
    const legacy: Record<string, unknown> = { ...createProgress() };
    delete legacy.pendingConstruction;
    const raw = JSON.stringify(legacy);
    const memory = memoryStorage(raw);
    const loaded = loadProgress(memory.storage);
    expect(loaded).toEqual({ status: 'ok', progress: legacy });
    expect(memory.writes()).toBe(0);
    expect(memory.read()).toBe(raw);
    if (loaded.status !== 'ok') throw new Error('Expected the existing save to load.');
    expect(saveProgress(memory.storage, loaded.progress)).toEqual({ ok: true });
    expect(memory.read()).toBe(raw);
  });

  it('reloads a pending construction with its original deadline and reserved materials', () => {
    const progress = createProgress();
    progress.wallet.timber = 45;
    const chosen = chooseStyle(progress, 'home', 'bungalow').progress;
    const pending = beginConstruction(chosen, 'home', 1_000).progress;
    const memory = memoryStorage();
    expect(saveProgress(memory.storage, pending)).toEqual({ ok: true });
    const loaded = loadProgress(memory.storage);
    if (loaded.status !== 'ok') throw new Error('Expected pending construction to load.');
    expect(loaded.progress.pendingConstruction).toEqual({ buildingId: 'home', startedAt: 1_000, completesAt: 6_000 });
    expect(loaded.progress.wallet.timber).toBe(15);
    expect(loaded.progress.buildings.home.built).toBe(false);
    expect(finishConstruction(loaded.progress, 5_999).ok).toBe(false);
    const completed = finishConstruction(loaded.progress, 6_000).progress;
    expect(completed.wallet.timber).toBe(15);
    expect(completed.buildings.home).toEqual({ style: 'bungalow', built: true });
    expect(completed.pendingConstruction).toBeNull();
    expect(saveProgress(memory.storage, completed)).toEqual({ ok: true });
    expect(loadProgress(memory.storage)).toEqual({ status: 'ok', progress: completed });
  });

  it.each([
    ['unknown building', (progress: any) => { progress.pendingConstruction.buildingId = 'castle'; }],
    ['negative timestamp', (progress: any) => { progress.pendingConstruction.startedAt = -1; progress.pendingConstruction.completesAt = 4_999; }],
    ['fractional timestamp', (progress: any) => { progress.pendingConstruction.startedAt = 1_000.5; progress.pendingConstruction.completesAt = 6_000.5; }],
    ['shorter duration', (progress: any) => { progress.pendingConstruction.completesAt = 5_999; }],
    ['longer duration', (progress: any) => { progress.pendingConstruction.completesAt = 6_001; }],
    ['unsupported timestamp', (progress: any) => { progress.pendingConstruction.startedAt = 8_640_000_000_000_000; progress.pendingConstruction.completesAt = 8_640_000_000_005_000; }],
    ['unexpected construction field', (progress: any) => { progress.pendingConstruction.extra = true; }],
    ['missing construction timestamp', (progress: any) => { delete progress.pendingConstruction.startedAt; }],
    ['already completed building', (progress: any) => { progress.buildings.home.built = true; progress.target = 'workshop'; }],
    ['unexpected progress field', (progress: any) => { progress.extra = true; }],
  ])('preserves a construction save with %s as unreadable data', (_name, mutate) => {
    const progress = createProgress();
    progress.wallet.timber = 30;
    const pending = beginConstruction(progress, 'home', 1_000).progress;
    mutate(pending);
    const raw = JSON.stringify(pending);
    const memory = memoryStorage(raw);
    expect(loadProgress(memory.storage)).toMatchObject({ status: 'corrupt', raw });
    expect(saveProgress(memory.storage, createProgress())).toMatchObject({ ok: false, reason: 'corrupt' });
    expect(memory.read()).toBe(raw);
    expect(memory.writes()).toBe(0);
  });

  it('rejects a pending construction whose target changed to another unlocked project', () => {
    const progress = createProgress();
    progress.wallet = { timber: 100, stone: 70, coins: 0 };
    const unlocked = buildBuilding(progress, 'home').progress;
    const pending = beginConstruction(unlocked, 'workshop', 1_000).progress;
    pending.target = 'lookout';
    expect(validateProgress(pending)).toBe(false);
  });

  it('allows only null or a complete record when the optional construction field is present', () => {
    const progress = createProgress();
    expect(validateProgress({ ...progress, pendingConstruction: null })).toBe(true);
    for (const invalid of [undefined, false, 0, [], {}]) {
      expect(validateProgress({ ...progress, pendingConstruction: invalid })).toBe(false);
    }
  });
});
