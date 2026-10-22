import {
  COIN_PICKUP_UNITS, JUMP_DURATION, JUMP_PEAK, LANE_CHANGE_SECONDS,
  MATERIAL_PICKUP_UNITS, OBSTACLE_CLEARANCE, RUN_DURATION, RUN_SPEED,
} from './catalog';
import { getTargetMaterials } from './progress';
import type { ActiveRun, Lane, Progress, RunEntity } from './types';

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
function createCourse(seed: number, materials: ActiveRun['materials']): RunEntity[] {
  const random = randomGenerator(seed);
  const entities: RunEntity[] = [];
  const add = (kind: RunEntity['kind'], lane: Lane, z: number) => {
    entities.push({ id: 'entity-' + entities.length, kind, lane, z });
  };
  const material = () => materials[Math.floor(random() * materials.length)]!;
  // Three readable pickups come before the first grounded obstacle.
  for (const z of [12, 28, 44]) {
    if (materials.length) add(material(), 0, z);
  }
  add('coin', 0, 20);
  add('coin', 0, 36);
  add('obstacle', 0, 64);
  if (materials.length) add(material(), -1, 80);
  add('coin', -1, 88);
  for (let z = 104, row = 0; z < RUN_DURATION * RUN_SPEED; z += 24, row++) {
    const hazardLane = laneValues[Math.floor(random() * laneValues.length)]!;
    const hasHazard = row % 3 !== 2;
    if (hasHazard) add('obstacle', hazardLane, z);
    const safe = hasHazard ? laneValues.filter(lane => lane !== hazardLane) : laneValues;
    const pickupLane = safe[Math.floor(random() * safe.length)]!;
    if (materials.length) add(material(), pickupLane, z);
    add('coin', pickupLane, z + 9);
  }
  return entities.sort(contactOrder);
}
export function createRun(progress: Progress, options: { id?: string; seed?: number } = {}): ActiveRun {
  const seed = (options.seed ?? Math.floor(Math.random() * 4294967296)) >>> 0;
  const id = options.id ?? globalThis.crypto?.randomUUID?.() ?? ('run-' + Date.now() + '-' + Math.random().toString(36).slice(2));
  const materials = getTargetMaterials(progress);
  return {
    id, seed, phase: 'active', endReason: null, target: progress.target, materials,
    elapsed: 0, distance: 0, lane: 0, targetLane: 0, jumpHeight: 0, jumpElapsed: -1,
    entities: createCourse(seed, materials), loot: { timber: 0, stone: 0, coins: 0 }, collectedIds: [],
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
  const dt = Math.max(0, Math.min(dtSeconds, RUN_DURATION - run.elapsed));
  const nextDistance = run.distance + dt * RUN_SPEED;
  let duration = dt;
  let collided = false;
  let loot = run.loot;
  const collected = new Set(run.collectedIds);
  const contacts = run.entities.filter(entity =>
    (entity.z > run.distance || (run.elapsed === 0 && entity.z === run.distance)) && entity.z <= nextDistance,
  ).sort(contactOrder);
  for (const entity of contacts) {
    const contactTime = (entity.z - run.distance) / RUN_SPEED;
    const motion = motionAt(run, contactTime);
    const sameLane = Math.abs(motion.lane - entity.lane) <= (entity.kind === 'obstacle' ? 0.32 : 0.42);
    if (!sameLane) continue;
    if (entity.kind === 'obstacle') {
      if (motion.jumpHeight <= OBSTACLE_CLEARANCE) {
        collided = true;
        duration = contactTime;
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
  const elapsed = Math.min(RUN_DURATION, run.elapsed + duration);
  const ended = collided || elapsed >= RUN_DURATION;
  return {
    ...run, ...motionAt(run, duration), elapsed, distance: run.distance + duration * RUN_SPEED,
    loot, collectedIds: [...collected],
    phase: ended ? 'ended' : 'active',
    endReason: collided ? 'collision' : ended ? 'timeout' : null,
  };
}
