import { runTravel, timeForRunDistance } from './runPace';
import {
  COIN_PICKUP_UNITS, JUMP_DURATION, JUMP_PEAK, LANE_CHANGE_SECONDS,
  MATERIAL_PICKUP_UNITS, OBSTACLE_CLEARANCE,
} from './catalog';
import { getTargetMaterials } from './progress';
import type { ActiveRun, Lane, Progress, RunEntity } from './types';

export const FIRST_OBSTACLE_DISTANCE = 100;
const laneValues: Lane[] = [-1, 0, 1];
const contactOrder = (a: RunEntity, b: RunEntity) =>
  a.z - b.z || Number(b.kind === 'obstacle') - Number(a.kind === 'obstacle');
const randomGenerator = (seed: number) => {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let mixed = Math.imul(value ^ (value >>> 15), 1 | value);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
};
export function createCourseRange(seed:number, materials:ActiveRun['materials'], from:number, through:number):RunEntity[] {
  const entities:RunEntity[]=[];
  const add=(kind:RunEntity['kind'],lane:Lane,z:number)=>{
    if (z>from && z<=through) entities.push({id:`entity-${z}-${kind}-${lane}`,kind,lane,z});
  };
  const intro=randomGenerator(seed);
  for (const z of [16,44,72]) if (materials.length) add(materials[Math.floor(intro()*materials.length)]!,0,z);
  add('coin',0,30); add('coin',0,58); add('obstacle',0,FIRST_OBSTACLE_DISTANCE);
  if (materials.length) add(materials[Math.floor(intro()*materials.length)]!,-1,124);
  add('coin',-1,140);
  // Per-row random seeds make streaming deterministic across frame/chunk sizes.
  const first=Math.max(0,Math.floor((from-164)/48)-1);
  const last=Math.floor((through-164)/48);
  for (let row=first;row<=last;row++) {
    const z=164+row*48;
    const random=randomGenerator(seed ^ Math.imul(row+1,0x9e3779b9));
    const hazardLane=laneValues[Math.floor(random()*3)]!;
    const hasHazard=row>=24 || row%3!==2;
    if (hasHazard) add('obstacle',hazardLane,z+32);
    const safe=hasHazard ? laneValues.filter(lane=>lane!==hazardLane) : laneValues;
    const pickupLane=safe[Math.floor(random()*safe.length)]!;
    if (materials.length) add(materials[Math.floor(random()*materials.length)]!,pickupLane,z);
    add('coin',pickupLane,z+14);
  }
  return entities.sort(contactOrder);
}

export function returnRun(run:ActiveRun):ActiveRun {
  return run.phase==='active' || run.phase==='paused' ? {...run,phase:'ended',endReason:'return'} : run;
}

export function createRun(progress: Progress, options: { id?: string; seed?: number } = {}): ActiveRun {
  const seed = (options.seed ?? Math.floor(Math.random() * 4294967296)) >>> 0;
  const id = options.id ?? globalThis.crypto?.randomUUID?.() ?? ('run-' + Date.now() + '-' + Math.random().toString(36).slice(2));
  const materials = getTargetMaterials(progress);
  return {
    id, seed, phase: 'active', endReason: null, target: progress.target, materials,
    elapsed: 0, distance: 0, lane: 0, targetLane: 0, jumpHeight: 0, jumpElapsed: -1,
    entities: createCourseRange(seed, materials, 0, 720), generatedUntil: 720, loot: { timber: 0, stone: 0, coins: 0 }, collectedIds: [],
  };
}
export function moveRun(run: ActiveRun, direction: -1 | 1): ActiveRun {
  if (run.phase !== 'active') return run;
  const targetLane = Math.max(-1, Math.min(1, run.targetLane + direction)) as Lane;
  return targetLane === run.targetLane ? run : { ...run, targetLane };
}
export function jumpRun(run: ActiveRun): ActiveRun {
  return run.phase === 'active' && run.jumpElapsed < 0
    ? { ...run, jumpElapsed: 0, jumpHeight: 0 } : run;
}
export function pauseRun(run: ActiveRun): ActiveRun {
  return run.phase === 'active' ? { ...run, phase: 'paused' } : run;
}
export function resumeRun(run: ActiveRun): ActiveRun {
  return run.phase === 'paused' ? { ...run, phase: 'active' } : run;
}
function motionAt(run: ActiveRun, seconds: number) {
  const delta = run.targetLane - run.lane;
  const lane = run.lane + Math.sign(delta) * Math.min(Math.abs(delta), seconds / LANE_CHANGE_SECONDS);
  const jumpTime = run.jumpElapsed < 0 ? -1 : run.jumpElapsed + seconds;
  const jumpElapsed = jumpTime >= JUMP_DURATION ? -1 : jumpTime;
  const jumpHeight = jumpElapsed < 0 ? 0 : Math.sin(Math.PI * jumpElapsed / JUMP_DURATION) * JUMP_PEAK;
  return { lane, jumpElapsed, jumpHeight };
}
export function advanceRun(run: ActiveRun, dtSeconds: number): ActiveRun {
  if (run.phase !== 'active' || !Number.isFinite(dtSeconds) || dtSeconds <= 0) return run;
  const dt = dtSeconds;
  const nextDistance = run.distance + runTravel(run.elapsed,dt);
  let generatedUntil=run.generatedUntil;
  let entities=run.entities;
  if (nextDistance+230>=generatedUntil) {
    const through=Math.ceil((nextDistance+345)/480)*480;
    entities=[...entities,...createCourseRange(run.seed,run.materials,generatedUntil,through)].sort(contactOrder);
    generatedUntil=through;
  }
  let impactDistance=nextDistance;
  let duration = dt;
  let collided = false;
  let loot = run.loot;
  const collected = new Set(run.collectedIds);
  const contacts = entities.filter(entity =>
    (entity.z > run.distance || (run.elapsed === 0 && entity.z === run.distance)) && entity.z <= nextDistance,
  ).sort(contactOrder);
  for (const entity of contacts) {
    const contactTime = timeForRunDistance(run.elapsed,entity.z-run.distance);
    const motion = motionAt(run, contactTime);
    const sameLane = Math.abs(motion.lane - entity.lane) <= (entity.kind === 'obstacle' ? 0.32 : 0.42);
    if (!sameLane) continue;
    if (entity.kind === 'obstacle') {
      if (motion.jumpHeight <= OBSTACLE_CLEARANCE) {
        collided = true;
        duration = contactTime;
        impactDistance = entity.z;
        break;
      }
      continue;
    }
    if (collected.has(entity.id) || motion.jumpHeight > 1.7) continue;
    if (entity.kind !== 'coin' && !run.materials.includes(entity.kind)) continue;
    collected.add(entity.id);
    if (loot === run.loot) loot = { ...run.loot };
    if (entity.kind === 'coin') loot.coins += COIN_PICKUP_UNITS;
    else loot[entity.kind] += MATERIAL_PICKUP_UNITS;
  }
  const elapsed = run.elapsed + duration;
  // Discard old scenery/collection IDs so long runs keep a bounded live window.
  entities=entities.filter(entity=>entity.z>=impactDistance-115);
  const retained=new Set(entities.map(entity=>entity.id));
  return {
    ...run, ...motionAt(run, duration), elapsed, distance: impactDistance, entities, generatedUntil,
    loot, collectedIds: [...collected].filter(id=>retained.has(id)),
    phase: collided ? 'ended' : 'active',
    endReason: collided ? 'collision' : null,
  };
}
