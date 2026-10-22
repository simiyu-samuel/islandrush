export const LOOK_AHEAD = 115;

export interface RouteLayout {
  width: number;
  height: number;
  stageWidth: number;
  centerX: number;
  horizonY: number;
  baselineY: number;
  laneSpacing: number;
}

/** One camera calculation drives scenery, pickups, hazards, and the courier. */
export function routeLayout(width: number, height: number): RouteLayout {
  const stageWidth = Math.min(width, Math.max(760, height * 1.05));
  return {
    width,
    height,
    stageWidth,
    centerX: width / 2,
    horizonY: height * 0.18,
    baselineY: height * 0.82,
    laneSpacing: stageWidth * 0.27,
  };
}

/** Sprite rectangles never enter the collision model. This is presentation only. */
export function projectRoute(
  lane: number,
  z: number,
  distance: number,
  layout: RouteLayout,
): { x: number; y: number; scale: number; visible: boolean } {
  const relative = z - distance;
  const t = Math.max(0, Math.min(1.06, 1 - relative / LOOK_AHEAD));
  const depth = t * t;
  return {
    x: layout.centerX + lane * layout.laneSpacing * (0.035 + depth * 0.965),
    y: layout.horizonY + (layout.baselineY - layout.horizonY) * depth,
    scale: 0.08 + depth * 0.92,
    visible: relative >= -5 && relative < LOOK_AHEAD,
  };
}
