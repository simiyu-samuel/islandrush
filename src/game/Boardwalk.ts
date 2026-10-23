import Phaser from 'phaser';
import type { Frame } from './bridge';
import { LOOK_AHEAD, projectRoute, sceneryTransform, type RouteLayout } from './projection';

const BOARD_LENGTH = 12;
const SOURCE_WIDTH = 1024;
const SOURCE_HEIGHT = 1536;

/**
 * This scene geometry reuses the approved route PNG without editing the asset.
 * Its sky/coast are preserved at native aspect. A continuous painted deck stays
 * stable while fine plank joins move through the shared perspective camera.
 * No animated texture tiles, posts, or ropes interrupt the running surface.
 */
export class Boardwalk {
  private readonly water: Phaser.GameObjects.Graphics;
  private readonly coast: Phaser.GameObjects.Mesh2D;
  private readonly road: Phaser.GameObjects.Graphics;
  private readonly details: Phaser.GameObjects.Graphics;
  private readonly coastSource = [
    [0, 0], [1024, 0], [0, 267], [1024, 267],
    [0, 267], [467, 267], [0, 603],
    [557, 267], [1024, 267], [1024, 603],
  ];

  constructor(scene: Phaser.Scene) {
    this.water = scene.add.graphics().setDepth(-40);
    const coastVertices = this.coastSource.flatMap(([x, y]) => [x!, y!, x! / SOURCE_WIDTH, y! / SOURCE_HEIGHT]);
    this.coast = scene.add.mesh2d(0, 0, 'route', coastVertices,
      [0, 1, 2, 0, 1, 2, 3, 0, 4, 5, 6, 0, 7, 8, 9, 0])
      .setOrigin(0, 0).setDepth(-35).setRenderAsTriangles(true);
    this.road = scene.add.graphics().setDepth(-25);
    this.details = scene.add.graphics().setDepth(-20);
  }

  paint(frame: Frame, layout: RouteLayout): void {
    this.paintOcean(frame, layout);
    const camera = sceneryTransform(layout);
    for (let index = 0; index < this.coastSource.length; index++) {
      const point = this.coastSource[index]!;
      this.coast.vertices[index * 4] = camera.x + point[0]! * camera.scale;
      this.coast.vertices[index * 4 + 1] = camera.y + point[1]! * camera.scale;
    }
    this.paintWood(layout);
    this.paintEdges(frame, layout);
  }

  private paintWood(layout: RouteLayout): void {
    const graphics = this.road;
    graphics.clear();
    const point = (lane: number, relative: number) => projectRoute(lane, relative, 0, layout);
    const farLeft = point(-1.5, LOOK_AHEAD);
    const farRight = point(1.5, LOOK_AHEAD);
    const nearLeft = point(-1.5, -LOOK_AHEAD);
    const nearRight = point(1.5, -LOOK_AHEAD);
    // A single unbroken surface: only its quiet cross joins scroll.
    graphics.fillStyle(0xc39761).beginPath().moveTo(farLeft.x, farLeft.y)
      .lineTo(farRight.x, farRight.y).lineTo(nearRight.x, nearRight.y)
      .lineTo(nearLeft.x, nearLeft.y).closePath().fillPath();
  }

  private paintEdges(frame: Frame, layout: RouteLayout): void {
    const graphics = this.details;
    graphics.clear();
    const point = (lane: number, relative: number) => projectRoute(lane, relative, 0, layout);
    const band = (lane: number, halfWidth: number, color: number, alpha = 1) => {
      const points = [point(lane - halfWidth, LOOK_AHEAD), point(lane + halfWidth, LOOK_AHEAD),
        point(lane + halfWidth, -LOOK_AHEAD), point(lane - halfWidth, -LOOK_AHEAD)];
      graphics.fillStyle(color, alpha).beginPath().moveTo(points[0]!.x, points[0]!.y);
      for (const edge of points.slice(1)) graphics.lineTo(edge.x, edge.y);
      graphics.closePath().fillPath();
    };
    // Two restrained seams identify the three lanes; curbs remain straight.
    for (const divider of [-0.5, 0.5]) band(divider, 0.006, 0x765536, 0.32);
    for (const edge of [-1.5, 1.5]) {
      band(edge, 0.035, 0x795335);
      band(edge - Math.sign(edge) * 0.032, 0.012, 0xe3be84);
    }
    const phase = frame.distance % BOARD_LENGTH;
    for (let row = -10; row <= Math.ceil(LOOK_AHEAD / BOARD_LENGTH); row++) {
      const relative = row * BOARD_LENGTH - phase;
      if (relative > LOOK_AHEAD) continue;
      const left = point(-1.46, relative);
      if (left.y < layout.horizonY + 4 || left.y > layout.height + 2) continue;
      const right = point(1.46, relative);
      graphics.lineStyle(Math.max(0.5, left.scale), 0x795635, 0.23 * Math.min(1, (left.y - layout.horizonY) / 48))
        .beginPath().moveTo(left.x, left.y).lineTo(right.x, right.y).strokePath();
    }
  }

  private paintOcean(frame: Frame, layout: RouteLayout): void {
    const { width, height, horizonY } = layout;
    const graphics = this.water;
    graphics.clear().fillStyle(0x239bdf).fillRect(0, 0, width, height);
    const bands = 26;
    for (let row = 0; row < bands; row++) {
      const t = row / bands;
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(0x139fcf), Phaser.Display.Color.ValueToColor(0x2bc3bd), bands, row,
      );
      graphics.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b))
        .fillRect(0, horizonY + (height - horizonY) * t, width, (height - horizonY) / bands + 1);
    }
    const motion = frame.reducedMotion ? 0 : frame.elapsed * 2;
    for (let index = 0; index < 80; index++) {
      const t = ((index * 0.137 + motion * 0.003) % 1);
      const y = horizonY + t * (height - horizonY);
      const x = ((index * 137.19 + Math.sin(index + motion * 0.1) * 9) % (width + 100)) - 50;
      const rippleWidth = (9 + index % 5 * 7) * (0.3 + t);
      graphics.fillStyle(index % 3 === 0 ? 0xe1ffff : 0x60e0e0, index % 3 === 0 ? 0.48 : 0.38)
        .fillRect(Math.round(x), Math.round(y), Math.round(rippleWidth), Math.max(1, Math.round(t * 3)));
      if (index % 4 === 0) graphics.fillRect(Math.round(x + rippleWidth * 0.5), Math.round(y + 4), Math.round(rippleWidth * 0.4), 1);
    }
  }
}
