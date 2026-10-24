import { runSpeedAt, runTravel, timeForRunDistance } from '../src/model/runPace';
import { MAX_RUN_SPEED } from '../src/model/catalog';
import { describe, expect, it } from 'vitest';
import { createProgress } from '../src/model/progress';
import { FIRST_OBSTACLE_DISTANCE, createCourseRange, returnRun, advanceRun, createRun, jumpRun, moveRun, pauseRun, resumeRun } from '../src/model/run';
import { RUN_SPEED } from '../src/model/catalog';
import type { RunEntity } from '../src/model/types';

const course = (entities: RunEntity[]) => ({ ...createRun(createProgress(), { id: 'test', seed: 12 }), entities, generatedUntil: Infinity });
const entity = (id: string, kind: RunEntity['kind'], z: number, lane: RunEntity['lane'] = 0): RunEntity => ({ id, kind, z, lane });

describe('runner contacts', () => {
  it('settles contact order through a large frame and collects nothing beyond impact', () => {
    const run = course([
      entity('late', 'timber', 36), entity('hit', 'obstacle', 27),
      entity('coin', 'coin', 18), entity('wood', 'timber', 9),
    ]);
    const result = advanceRun(run, 10);
    expect(result).toMatchObject({
      phase: 'ended', endReason: 'collision', distance: 27,
      loot: { timber: 5, stone: 0, coins: 1 },
    });
    expect(result.elapsed).toBeCloseTo(timeForRunDistance(0,27));
    expect(result.collectedIds).toEqual(['wood', 'coin']);
    expect(advanceRun(result, 30)).toBe(result);
    expect(run.loot).toEqual({ timber: 0, stone: 0, coins: 0 });
  });

  it('runs past sixty seconds and resolves later impacts at the accelerated contact time', () => {
    const endless=advanceRun(course([]),120);
    expect(endless).toMatchObject({phase:'active',endReason:null,elapsed:120});
    expect(endless.distance).toBeCloseTo(runTravel(0,120));
    const run={...course([entity('wood','timber',1409),entity('coin','coin',1418),entity('hit','obstacle',1418)]),elapsed:59,distance:1400};
    const result=advanceRun(run,10);
    expect(result.phase).toBe('ended');expect(result.endReason).toBe('collision');
    expect(result.elapsed).toBeCloseTo(59+timeForRunDistance(59,18));
    expect(result.distance).toBe(1418);
    expect(result.loot).toEqual({timber:5,stone:0,coins:0});
    expect(advanceRun(result,10)).toBe(result);
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
      expect(timeForRunDistance(0,first.z)).toBeGreaterThan(5);
      expect(run.entities.some(e=>e.kind==='stone')).toBe(true);
    }
  });
});


describe('endless progression', () => {
  it('increases pace to a bounded cap and integrates equally across frame sizes', () => {
    expect(runSpeedAt(0)).toBe(RUN_SPEED);
    expect(runSpeedAt(40)).toBeGreaterThan(runSpeedAt(20));
    expect(runSpeedAt(1000)).toBe(MAX_RUN_SPEED);
    const whole=advanceRun(course([]),200);
    let split=course([]);
    for (let i=0;i<2000;i++) split=advanceRun(split,0.1);
    expect(split.distance).toBeCloseTo(whole.distance,6);
    expect(timeForRunDistance(0,whole.distance)).toBeCloseTo(200);
  });

  it('streams deterministic chunks, preserves their boundary encounters, and raises hazard frequency', () => {
    const full=createCourseRange(42,['timber','stone'],0,2400);
    const chunks=[...createCourseRange(42,['timber','stone'],0,720),...createCourseRange(42,['timber','stone'],720,1440),...createCourseRange(42,['timber','stone'],1440,2400)];
    expect(chunks).toEqual(full);
    expect(new Set(chunks.map(e=>e.id)).size).toBe(chunks.length);
    const later=createCourseRange(42,['timber'],1800,2280);
    expect(later.filter(e=>e.kind==='obstacle').length).toBe(10);
  });

  it('keeps long-running live entities and collection IDs bounded', () => {
    let run=createRun(createProgress(),{seed:42});
    for(let i=0;i<2000;i++) {
      // Remove hazards in this fixture so streaming can be exercised beyond
      // ordinary impact. Newly streamed hazards start well ahead of contact.
      run={...run,entities:run.entities.filter(e=>e.kind!=='obstacle')};
      run=advanceRun(run,0.1);
      expect(run.phase).toBe('active');
      expect(run.entities.length).toBeLessThan(100);
      expect(run.collectedIds.length).toBeLessThan(25);
    }
    expect(run.distance).toBeGreaterThan(5000);
    expect(run.generatedUntil).toBeGreaterThan(run.distance);
  });

  it('supports voluntary return while active or paused and does not re-end a settled run', () => {
    const active=advanceRun(course([entity('t','timber',9)]),1);
    expect(returnRun(active)).toMatchObject({phase:'ended',endReason:'return',loot:{timber:5}});
    expect(returnRun(pauseRun(active))).toMatchObject({phase:'ended',endReason:'return',loot:{timber:5}});
    const ended=returnRun(active);
    expect(returnRun(ended)).toBe(ended);
  });
});
