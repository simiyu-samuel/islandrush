import type Phaser from 'phaser';
import type { BuildingType, StyleId } from '../model/types';

type Point = { x: number; y: number };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const step = (value: number, start: number, end: number) => Math.max(0, Math.min(1, (value - start) / (end - start)));

/** Staged original geometry extends the building artwork while the controller builds. */
export function drawConstruction(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  progress: number,
  style: StyleId,
  reducedMotion: boolean,
  type?: BuildingType,
): void {
  graphics.clear();
  const roofColor = style === 'studio' ? 0x4e9390 : style === 'cottage' || style === 'forge' || style === 'lighthouse' ? 0xc97543 : 0xc4ac64;
  const roofHighlight = style === 'studio' ? 0x85bbb0 : style === 'cottage' || style === 'forge' || style === 'lighthouse' ? 0xe09356 : 0xe4ce89;
  const roofSeam = style === 'studio' ? 0x356e70 : style === 'cottage' || style === 'forge' || style === 'lighthouse' ? 0xaf6139 : 0x9e894d;
  const p = reducedMotion ? Math.min(0.99, Math.floor(progress * 5) / 5) : progress;
  const local = (px: number, py: number): Point => ({ x: x + px * width, y: y + py * width });
  const frontLeft = local(-0.46, -0.04);
  const frontRight = local(0.12, 0.15);
  const backRight = local(0.46, 0.0);
  const backLeft = local(-0.12, -0.19);
  const base = [frontLeft, frontRight, backRight, backLeft];
  const polygon = (points: Point[], fill: number, alpha = 1) => {
    graphics.fillStyle(fill, alpha).beginPath().moveTo(points[0]!.x, points[0]!.y);
    for (const point of points.slice(1)) graphics.lineTo(point.x, point.y);
    graphics.closePath().fillPath();
  };
  const beam = (from: Point, to: Point, color = 0xb47c3d, size = 0.028) => {
    graphics.lineStyle(Math.max(2, width * size), 0x76532d).beginPath().moveTo(from.x, from.y).lineTo(to.x, to.y).strokePath();
    graphics.lineStyle(Math.max(1, width * size * 0.62), color).beginPath().moveTo(from.x - width * 0.003, from.y).lineTo(to.x - width * 0.003, to.y).strokePath();
  };
  const foundationDepth = width * 0.045;
  polygon([frontLeft, frontRight, { x: frontRight.x, y: frontRight.y + foundationDepth }, { x: frontLeft.x, y: frontLeft.y + foundationDepth }], 0x9b9a7c);
  polygon([frontRight, backRight, { x: backRight.x, y: backRight.y + foundationDepth }, { x: frontRight.x, y: frontRight.y + foundationDepth }], 0x7f806a);
  polygon(base, 0xd1c59a);
  for (let i = 1; i <= 6; i++) {
    const t = i / 7;
    const left = { x: lerp(frontLeft.x, backLeft.x, t), y: lerp(frontLeft.y, backLeft.y, t) };
    const right = { x: lerp(frontRight.x, backRight.x, t), y: lerp(frontRight.y, backRight.y, t) };
    graphics.lineStyle(Math.max(1, width * 0.006), 0x92866a, 0.8).beginPath().moveTo(left.x, left.y).lineTo(right.x, right.y).strokePath();
  }
  for (let i = 1; i <= 5; i++) {
    const t = i / 6;
    const bx = lerp(frontLeft.x, frontRight.x, t);
    const by = lerp(frontLeft.y, frontRight.y, t);
    graphics.lineStyle(Math.max(1, width * 0.006), 0x676e5a, 0.7).beginPath().moveTo(bx, by).lineTo(bx, by + foundationDepth).strokePath();
  }
  const rise = step(p, 0.16, 0.44);
  const openStructure = type === 'community-plaza' || type === 'archipelago-pier' || type === 'bridge-link';
  const wallHeight = width * (type === 'coastal-lighthouse' || style === 'lighthouse' ? 1.8 : type === 'terrace-hamlet' ? 0.9 : style === 'watchtower' ? 1.25 : openStructure ? 0.18 : style === 'cottage' ? 0.43 : 0.5);
  const tops = base.map(point => ({ x: point.x, y: point.y - wallHeight * rise }));
  const [topFrontLeft, topFrontRight, topBackRight, topBackLeft] = tops as [Point, Point, Point, Point];
  if (p >= 0.16) {
    for (let i = 0; i < 4; i++) beam(base[i]!, tops[i]!, 0xc18b48);
    if (rise > 0.75) {
      beam(topFrontLeft, topFrontRight);
      beam(topFrontRight, topBackRight);
      beam(topBackRight, topBackLeft);
      beam(topBackLeft, topFrontLeft);
      beam(frontLeft, topFrontRight, 0xc89554, 0.019);
      beam(frontRight, topBackRight, 0xc89554, 0.019);
    }
  }
  const roof = step(p, 0.43, 0.65);
  const roofRise = width * (style === 'cottage' ? 0.27 : 0.18) * roof;
  const ridgeFront = { x: (topFrontLeft.x + topFrontRight.x) / 2, y: (topFrontLeft.y + topFrontRight.y) / 2 - roofRise };
  const ridgeBack = { x: (topBackLeft.x + topBackRight.x) / 2, y: (topBackLeft.y + topBackRight.y) / 2 - roofRise };
  if (p >= 0.43) {
    beam(topFrontLeft, ridgeFront, 0xd3a264);
    beam(topFrontRight, ridgeFront, 0xd3a264);
    beam(topBackLeft, ridgeBack, 0xc08b4c);
    beam(topBackRight, ridgeBack, 0xc08b4c);
    beam(ridgeFront, ridgeBack, 0xc99555);
    for (let i = 1; i < 4; i++) {
      const t = i / 4;
      const ridge = { x: lerp(ridgeFront.x, ridgeBack.x, t), y: lerp(ridgeFront.y, ridgeBack.y, t) };
      const eave = { x: lerp(topFrontRight.x, topBackRight.x, t), y: lerp(topFrontRight.y, topBackRight.y, t) };
      beam(ridge, eave, 0xd0a163, 0.019);
    }
  }
  if (p >= 0.64 && style !== 'watchtower' && !openStructure) {
    const walls = step(p, 0.64, 0.82);
    const frontTopL = { x: frontLeft.x, y: frontLeft.y - wallHeight * walls };
    const frontTopR = { x: frontRight.x, y: frontRight.y - wallHeight * walls };
    const sideTopR = { x: backRight.x, y: backRight.y - wallHeight * walls };
    polygon([frontLeft, frontRight, frontTopR, frontTopL], 0xf5e4b8);
    polygon([frontRight, backRight, sideTopR, frontTopR], 0xd9c593);
    for (let i = 0; i < 3; i++) beam(base[i]!, tops[i]!);
    beam(topFrontLeft, topFrontRight);
    beam(topFrontRight, topBackRight);
  }
  if (p >= 0.8 && !openStructure) {
    const cover = step(p, 0.8, 0.98);
    const frontEave = { x: lerp(ridgeFront.x, topFrontRight.x, cover), y: lerp(ridgeFront.y, topFrontRight.y, cover) };
    const backEave = { x: lerp(ridgeBack.x, topBackRight.x, cover), y: lerp(ridgeBack.y, topBackRight.y, cover) };
    polygon([ridgeFront, ridgeBack, backEave, frontEave], roofColor);
    beam(ridgeFront, ridgeBack, roofHighlight, 0.024);
    for (let i = 1; i <= 4; i++) {
      const t = i / 5;
      beam({ x: lerp(ridgeFront.x, frontEave.x, t), y: lerp(ridgeFront.y, frontEave.y, t) },
        { x: lerp(ridgeBack.x, backEave.x, t), y: lerp(ridgeBack.y, backEave.y, t) },
        roofSeam, 0.009);
    }
  }
  // Temporary scaffold braces make the unfinished state explicit at every stage.
  if (p > 0.25 && p < 0.96) {
    const a = local(-0.57, 0.03), b = local(-0.08, 0.2);
    const ah = { x: a.x, y: a.y - wallHeight * 0.76 }, bh = { x: b.x, y: b.y - wallHeight * 0.76 };
    beam(a, ah, 0xa98a58, 0.014);
    beam(b, bh, 0xa98a58, 0.014);
    beam(ah, bh, 0xc6a774, 0.02);
    beam(a, bh, 0xa98a58, 0.011);
  }
  if (!reducedMotion) {
    for (let i = 0; i < 9; i++) {
      const cycle = ((progress * 6 + i * 0.137) % 1);
      const px = x + Math.sin(i * 7.3) * width * 0.42;
      const py = y - cycle * width * 0.34;
      graphics.fillStyle(i % 2 ? 0xfff2cb : 0xdeb978, (1 - cycle) * 0.7)
        .fillRect(Math.round(px), Math.round(py), Math.max(2, width * 0.012), Math.max(2, width * 0.012));
    }
  }
}
