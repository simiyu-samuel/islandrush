import { describe, expect, it } from 'vitest';
import { createProgress } from '../src/model/progress';
import { FIRST_OBSTACLE_DISTANCE, advanceRun, createRun, jumpRun, moveRun, pauseRun, resumeRun } from '../src/model/run';
import { RUN_SPEED } from '../src/model/catalog';
import type { RunEntity } from '../src/model/types';

const course = (entities: RunEntity[]) => ({ ...createRun(createProgress(), { id: 'test', seed: 12 }), entities });
const entity = (id: string, kind: RunEntity['kind'], z: number, lane: RunEntity['lane'] = 0): RunEntity => ({ id, kind, z, lane });

describe('timed runner', () => {
  it('settles contact order through a large frame and collects nothing beyond impact', () => {
    const run = course([
      entity('late', 'timber', 36), entity('hit', 'obstacle', 27),
      entity('coin', 'coin', 18), entity('wood', 'timber', 9),
    ]);
    const result = advanceRun(run, 10);
    expect(result).toMatchObject({
      phase: 'ended', endReason: 'collision', elapsed: 1.5, distance: 27,
      loot: { timber: 5, stone: 0, coins: 1 },
    });
    expect(result.collectedIds).toEqual(['wood', 'coin']);
    expect(advanceRun(result, 30)).toBe(result);
    expect(run.loot).toEqual({ timber: 0, stone: 0, coins: 0 });
  });

  it('uses one terminal transition when collision and timeout coincide', () => {
    const run = {
      ...course([entity('wood', 'timber', 1071), entity('coin', 'coin', 1080), entity('hit', 'obstacle', 1080)]),
      elapsed: 59, distance: 59 * RUN_SPEED,
    };
    const result = advanceRun(run, 5);
    expect(result.phase).toBe('ended');
    expect(result.endReason).toBe('collision');
    expect(result.elapsed).toBe(60);
    expect(result.loot).toEqual({ timber: 5, stone: 0, coins: 0 });
    const timed = advanceRun({ ...run, entities: [entity('past', 'timber', 1081)] }, 5);
    expect(timed).toMatchObject({ phase: 'ended', endReason: 'timeout', elapsed: 60, distance: 1080 });
    expect(timed.loot.timber).toBe(0);
  });

  it('freezes time, motion, and input while paused until explicit resume', () => {
    const moving = jumpRun(moveRun(course([]), 1));
    const paused = pauseRun(advanceRun(moving, 0.05));
    expect(advanceRun(paused, 100)).toBe(paused);
    expect(moveRun(paused, -1)).toBe(paused);
    expect(jumpRun(paused)).toBe(paused);
    expect(advanceRun(resumeRun(paused), 0.05).elapsed).toBeCloseTo(0.1);
  });

  it('checks interpolated lane at the contact rather than the target lane', () => {
    const run = moveRun(course([entity('early', 'obstacle', 0.18)]), 1);
    const result = advanceRun(run, 0.2);
    expect(result.endReason).toBe('collision');
    expect(result.lane).toBeCloseTo(0.0625);
    const clear = advanceRun(moveRun(course([entity('later', 'obstacle', 9)]), 1), 1);
    expect(clear.phase).toBe('active');
    expect(clear.lane).toBe(1);
  });

  it('clears an obstacle at jump height and lands without double jumping', () => {
    const jumped = jumpRun(course([entity('jumpable', 'obstacle', 6.75)]));
    expect(jumpRun(jumped)).toBe(jumped);
    const airborne = advanceRun(jumped, 0.4);
    expect(airborne.phase).toBe('active');
    expect(airborne.jumpHeight).toBeGreaterThan(2);
    const landed = advanceRun(airborne, 0.4);
    expect(landed.jumpHeight).toBe(0);
    expect(landed.jumpElapsed).toBe(-1);
    expect(jumpRun(landed).jumpElapsed).toBe(0);
  });

  it('does not collect twice at an exact frame boundary or offer locked stone', () => {
    const run = course([entity('wood', 'timber', 9), entity('locked', 'stone', 10)]);
    const first = advanceRun(run, 0.5);
    const next = advanceRun(first, 0.5);
    expect(next.loot).toEqual({ timber: 5, stone: 0, coins: 0 });
    const generated = createRun(createProgress(), { seed: 99 });
    expect(generated.entities.some(item => item.kind === 'stone')).toBe(false);
    expect(generated.entities).toEqual(createRun(createProgress(), { seed: 99 }).entities);
  });
});


describe('readable coastal encounters', () => {
  it('separates pickup, coin, and hazard depths across generated courses', () => {
    for (const seed of [0,1,42,99,9999]) {
      const p=createProgress();
      p.buildings.home.built=true;p.target='workshop';
      const run=createRun(p,{seed});
      for (let i=1;i<run.entities.length;i++) {
        expect(run.entities[i]!.z-run.entities[i-1]!.z).toBeGreaterThanOrEqual(14);
      }
      const first=run.entities.find(e=>e.kind==='obstacle')!;
      expect(first.z).toBe(FIRST_OBSTACLE_DISTANCE);
      expect(first.z/RUN_SPEED).toBeGreaterThan(5);
      expect(run.entities.some(e=>e.kind==='stone')).toBe(true);
    }
  });
});
