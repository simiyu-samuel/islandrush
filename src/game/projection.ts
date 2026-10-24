export const LOOK_AHEAD = 115;
export const DEPTH_EXPONENT = 1.6;

export interface RouteLayout {
  width: number;
  height: number;
  stageWidth: number;
  centerX: number;
  horizonY: number;
  baselineY: number;
  laneSpacing: number;
  horizonWidth: number;
  mobile: boolean;
}

/** The complete boardwalk is three equal lanes at the courier's contact line. */
export function routeLayout(width: number, height: number): RouteLayout {
  const mobile = width < 960;
  const horizonY = height * (mobile ? 0.245 : 0.2);
  const baselineY = height - (mobile ? Math.max(132, height * 0.17) : height * 0.18);
  const horizonWidth = Math.max(12, Math.min(36, width * 0.025));
  // Size at the bottom of the viewport, rather than letting perspective expand
  // a nearly full-width contact line beyond both screen edges.
  const bottomWidth = Math.min(width * 0.58, 780);
  const bottomDepth = (height - horizonY) / (baselineY - horizonY);
  const stageWidth = mobile ? width * 0.94 : horizonWidth + (bottomWidth - horizonWidth) / bottomDepth;
  return {
    width,
    height,
    stageWidth,
    centerX: width / 2,
    horizonY,
    baselineY,
    laneSpacing: stageWidth / 3,
    horizonWidth,
    mobile,
  };
}

/** The panorama keeps its native aspect, with its waterline at our horizon. */
export function sceneryTransform(layout: RouteLayout) {
  const scale = Math.max(layout.width / 1024, layout.height / 1536);
  return {
    scale,
    x: (layout.width - 1024 * scale) / 2,
    y: layout.horizonY - 267 * scale,
  };
}

/**
 * Lane centers are -1, 0, 1; dividers are -0.5/+0.5; edges are -1.5/+1.5.
 * All road texture, rails, hazards, pickups, and boots use this same projection.
 * Sprite rectangles never enter the collision model.
 */
export function projectRoute(
  lane: number,
  z: number,
  distance: number,
  layout: RouteLayout,
): { x: number; y: number; scale: number; visible: boolean } {
  const relative = z - distance;
  const t = Math.max(0, 1 - relative / LOOK_AHEAD);
  const depth = Math.pow(t, DEPTH_EXPONENT);
  const roadWidth = layout.horizonWidth + (layout.stageWidth - layout.horizonWidth) * depth;
  return {
    x: layout.centerX + lane * roadWidth / 3,
    y: layout.horizonY + (layout.baselineY - layout.horizonY) * depth,
    scale: roadWidth / layout.stageWidth,
    visible: relative >= -5 && relative < LOOK_AHEAD,
  };
}
