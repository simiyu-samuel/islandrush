import Phaser from 'phaser';
import type { Frame } from './bridge';
import { LOOK_AHEAD, projectRoute, sceneryTransform, type RouteLayout } from './projection';

const BOARD_LENGTH = 6;
const FIRST_ROW = -5;
const ROWS = 26;
const SOURCE_WIDTH = 1024;
const SOURCE_HEIGHT = 1536;

/**
 * This scene geometry reuses the approved route PNG without editing the asset.
 * Its sky/coast are preserved at native aspect. Wood is sampled from a clean
 * central patch and projected into moving boards across all three equal lanes.
 * The original fixed road/rail triangles are omitted, so there is one road.
 */
export class Boardwalk {
  private readonly water: Phaser.GameObjects.Graphics;
  private readonly coast: Phaser.GameObjects.Mesh2D;
  private readonly road: Phaser.GameObjects.Mesh2D;
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
    const vertices: number[] = [];
    const indices: number[] = [];
    for (let row = 0; row < ROWS; row++) {
      for (let lane = 0; lane < 3; lane++) {
        const start = vertices.length / 4;
        vertices.push(...new Array<number>(16).fill(0));
        indices.push(start, start + 1, start + 2, 0, start + 1, start + 2, start + 3, 0);
      }
    }
    this.road = scene.add.mesh2d(0, 0, 'route', vertices, indices).setOrigin(0, 0).setDepth(-25);
    this.road.buildOrderedIndices(1, true);
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
    this.paintWood(frame, layout);
    this.paintEdges(frame, layout);
  }

  private paintWood(frame: Frame, layout: RouteLayout): void {
    const phase = frame.distance % BOARD_LENGTH;
    const worldRow = Math.floor(frame.distance / BOARD_LENGTH);
    let offset = 0;
    for (let index = 0; index < ROWS; index++) {
      const row = FIRST_ROW + index;
      const nearZ = row * BOARD_LENGTH - phase;
      const farZ = nearZ + BOARD_LENGTH;
      const pattern = ((worldRow + row) % 3 + 3) % 3;
      // These clean central wood strips contain grain, not the PNG's old dividers.
      const v0 = (1000 + pattern * 160) / SOURCE_HEIGHT;
      const v1 = (1160 + pattern * 160) / SOURCE_HEIGHT;
      for (const lane of [-1, 0, 1]) {
        const farLeft = projectRoute(lane - 0.5, frame.distance + farZ, frame.distance, layout);
        const farRight = projectRoute(lane + 0.5, frame.distance + farZ, frame.distance, layout);
        const nearLeft = projectRoute(lane - 0.5, frame.distance + nearZ, frame.distance, layout);
        const nearRight = projectRoute(lane + 0.5, frame.distance + nearZ, frame.distance, layout);
        const points = [farLeft, farRight, nearLeft, nearRight];
        const u0 = 350 / SOURCE_WIDTH;
        const u1 = 674 / SOURCE_WIDTH;
        for (let corner = 0; corner < 4; corner++) {
          const point = points[corner]!;
          this.road.vertices[offset++] = point.x;
          this.road.vertices[offset++] = point.y;
          this.road.vertices[offset++] = corner % 2 === 0 ? u0 : u1;
          this.road.vertices[offset++] = corner < 2 ? v0 : v1;
        }
      }
    }
  }

  private paintEdges(frame: Frame, layout: RouteLayout): void {
    const graphics = this.details;
    graphics.clear();
    const point = (lane: number, relative: number) => projectRoute(lane, frame.distance + relative, frame.distance, layout);
    const band = (lane: number, halfWidth: number, color: number, alpha = 1) => {
      const points = [point(lane - halfWidth, LOOK_AHEAD), point(lane + halfWidth, LOOK_AHEAD),
        point(lane + halfWidth, -30), point(lane - halfWidth, -30)];
      graphics.fillStyle(color, alpha).beginPath().moveTo(points[0]!.x, points[0]!.y);
      for (const edge of points.slice(1)) graphics.lineTo(edge.x, edge.y);
      graphics.closePath().fillPath();
    };
    // Exactly two uninterrupted seams, at the true thirds of the full boardwalk.
    for (const divider of [-0.5, 0.5]) {
      band(divider, 0.008, 0x8b542d, 0.95);
      band(divider - 0.011, 0.003, 0xffdb8d, 0.85);
    }
    for (const edge of [-1.5, 1.5]) {
      band(edge, 0.026, 0x80502a);
      band(edge - Math.sign(edge) * 0.02, 0.012, 0xe9b867);
    }
    const phase = frame.distance % BOARD_LENGTH;
    const worldRow = Math.floor(frame.distance / BOARD_LENGTH);
    // Board joins/nails and rail posts all travel with the same ground surface.
    for (let row = 21; row >= FIRST_ROW; row--) {
      const relative = row * BOARD_LENGTH - phase;
      if (relative > LOOK_AHEAD) continue;
      const left = point(-1.48, relative);
      const right = point(1.48, relative);
      if (left.y > layout.height + 120) continue;
      graphics.lineStyle(Math.max(0.6, 1.7 * left.scale), 0x8c572c, 0.48)
        .beginPath().moveTo(left.x, left.y).lineTo(right.x, right.y).strokePath();
      if (left.scale > 0.21) {
        for (const lane of [-1.32, -0.68, -0.32, 0.32, 0.68, 1.32]) {
          const nail = point(lane, relative - 0.3);
          const size = Math.max(1, Math.round(nail.scale * 2));
          graphics.fillStyle(0x8d5c35, 0.6).fillRect(Math.round(nail.x), Math.round(nail.y), size, size);
        }
      }
      if ((worldRow + row) % 2 !== 0 || relative < -12) continue;
      for (const side of [-1, 1]) {
        const base = point(side * 1.55, relative);
        const farBase = point(side * 1.55, relative + BOARD_LENGTH * 2);
        const postHeight = 88 * base.scale;
        const postWidth = Math.max(2, 14 * base.scale);
        const farHeight = 88 * farBase.scale;
        graphics.lineStyle(Math.max(1, 4 * base.scale), 0xead7a2, 1);
        graphics.beginPath().moveTo(base.x, base.y - postHeight * 0.72)
          .lineTo((base.x + farBase.x) / 2, (base.y - postHeight * 0.72 + farBase.y - farHeight * 0.72) / 2 + postHeight * 0.08)
          .lineTo(farBase.x, farBase.y - farHeight * 0.72).strokePath();
        graphics.fillStyle(0xa46832).fillRect(base.x - postWidth / 2, base.y - postHeight, postWidth, postHeight);
        graphics.fillStyle(0x754822).fillRect(base.x + postWidth * 0.15, base.y - postHeight, postWidth * 0.35, postHeight);
        graphics.fillStyle(0xf0be6a).fillRect(base.x - postWidth / 2 - base.scale, base.y - postHeight, postWidth + base.scale * 2, Math.max(2, 5 * base.scale));
      }
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
