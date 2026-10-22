import { describe, expect, it } from 'vitest';
import { createProgress } from '../src/model/progress';
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
