import { RUN_SPEED, RUN_ACCELERATION, MAX_RUN_SPEED } from './catalog';

export const runSpeedAt = (elapsed:number) => Math.min(MAX_RUN_SPEED,RUN_SPEED+Math.max(0,elapsed)*RUN_ACCELERATION);
export function runTravel(elapsed:number,seconds:number):number {
  const speed=runSpeedAt(elapsed);
  const ramp=Math.min(seconds,Math.max(0,(MAX_RUN_SPEED-speed)/RUN_ACCELERATION));
  return speed*ramp+RUN_ACCELERATION*ramp*ramp/2+MAX_RUN_SPEED*(seconds-ramp);
}
export function timeForRunDistance(elapsed:number,distance:number):number {
  if (distance<=0) return 0;
  const speed=runSpeedAt(elapsed);
  const ramp=Math.max(0,(MAX_RUN_SPEED-speed)/RUN_ACCELERATION);
  const rampDistance=speed*ramp+RUN_ACCELERATION*ramp*ramp/2;
  if (distance<=rampDistance) return 2*distance/(Math.sqrt(speed*speed+2*RUN_ACCELERATION*distance)+speed);
  return ramp+(distance-rampDistance)/MAX_RUN_SPEED;
}
