import { describe, expect, it } from 'vitest';
import { LOOK_AHEAD, DEPTH_EXPONENT, projectRoute, routeSceneryX, routeLayout, sceneryTransform } from './projection';

describe('the three-lane boardwalk camera', () => {
  it.each([[390, 844], [320, 640], [844, 390], [1440, 900]])(
    'keeps all lane centers inside their painted thirds at %sx%s', (width, height) => {
      const camera = routeLayout(width, height);
      for (const relative of [0, 24, 72, 108]) {
        const projected = (lane: number) => projectRoute(lane, relative, 0, camera);
        const left = projected(-1.5).x;
        const right = projected(1.5).x;
        const thirds = (right - left) / 3;
        for (const lane of [-1, 0, 1]) {
          const center = projected(lane);
          expect(center.x).toBeCloseTo(left + (lane + 1.5) * thirds, 8);
          expect(center.y).toBeCloseTo(projected(-1.5).y, 8);
          expect(center.x).toBeGreaterThan(projected(lane - 0.5).x);
          expect(center.x).toBeLessThan(projected(lane + 0.5).x);
        }
      }
      // A grounded player can occupy both outer lanes without leaving the phone.
      const left = projectRoute(-1, 0, 0, camera).x;
      const right = projectRoute(1, 0, 0, camera).x;
      expect(left).toBeGreaterThan(width * 0.15);
      expect(right).toBeLessThan(width * 0.85);
      expect(camera.baselineY).toBeLessThan(height - 65);
    },
  );

  it.each([[960, 640], [1440, 900], [1920, 1080]])(
    'leaves ocean visible beside the desktop road at %sx%s', (width, height) => {
      const camera = routeLayout(width, height);
      const bottomRelative = LOOK_AHEAD * (1 - Math.pow((height - camera.horizonY) / (camera.baselineY - camera.horizonY), 1 / DEPTH_EXPONENT));
      const left = projectRoute(-1.5, bottomRelative, 0, camera);
      const right = projectRoute(1.5, bottomRelative, 0, camera);
      expect(left.y).toBeCloseTo(height);
      expect(left.x).toBeGreaterThanOrEqual(width * 0.20);
      expect(right.x).toBeLessThanOrEqual(width * 0.80);
      expect(right.x - left.x).toBeLessThanOrEqual(781);
      expect(camera.laneSpacing).toBeGreaterThan(100);
    },
  );

  it.each([[320, 640], [390, 844], [844, 390]])(
    'preserves the reviewed mobile road width at %sx%s', (width, height) => {
      const camera = routeLayout(width, height);
      const left = projectRoute(-1.5, 0, 0, camera);
      const right = projectRoute(1.5, 0, 0, camera);
      expect(right.x - left.x).toBeCloseTo(width * 0.94);
    },
  );

  it('projects moving road, hazards, and pickups to the same contact line', () => {
    const camera = routeLayout(390, 844);
    const before = projectRoute(1, 48, 30, camera);
    const contact = projectRoute(1, 48, 48, camera);
    expect(before.y).toBeLessThan(contact.y);
    expect(before.x).toBeLessThan(contact.x);
    expect(contact.y).toBeCloseTo(camera.baselineY);
    expect(contact.scale).toBeCloseTo(1);
    const behind = projectRoute(1.5, 18, 48, camera);
    expect(behind.y).toBeGreaterThan(camera.height);
  });

  it('converges at the retained scenery horizon and keeps the art aspect', () => {
    const camera = routeLayout(390, 844);
    const horizon = projectRoute(0, LOOK_AHEAD, 0, camera);
    const scenery = sceneryTransform(camera);
    expect(horizon.y).toBeCloseTo(camera.horizonY);
    expect(scenery.y + 267 * scenery.scale).toBeCloseTo(camera.horizonY);
    expect((1024 * scenery.scale) / (1536 * scenery.scale)).toBeCloseTo(2 / 3);
  });
});


it('gives separate encounters readable depth and avoids abrupt growth at the contact line', () => {
  for (const [w,h] of [[320,640],[390,844],[1280,720]]) {
    const camera=routeLayout(w!,h!);
    expect(projectRoute(0,40,0,camera).y-projectRoute(0,54,0,camera).y).toBeGreaterThan(35);
    expect(projectRoute(0,0,0,camera).scale-projectRoute(0,4,0,camera).scale).toBeLessThan(0.065);
  }
});


it('keeps the whole foliage image beyond both outer lanes on mobile', () => {
  for (const [width,height] of [[320,640],[390,844],[768,1024],[844,390]]) {
    const layout=routeLayout(width!,height!);
    for (const z of [-18,0,24,72,108]) for (const spriteWidth of [25,100,300]) {
      const left=routeSceneryX(-1,z,spriteWidth,layout)+spriteWidth/2;
      const right=routeSceneryX(1,z,spriteWidth,layout)-spriteWidth/2;
      expect(left).toBeLessThanOrEqual(projectRoute(-1.5,z,0,layout).x-10);
      expect(right).toBeGreaterThanOrEqual(projectRoute(1.5,z,0,layout).x+10);
    }
  }
});
