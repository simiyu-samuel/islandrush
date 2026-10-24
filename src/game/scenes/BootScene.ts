import Phaser from 'phaser';
import { BUILDING_ART, SETTLEMENT_ATLASES } from '../art';
import type { GameBridge } from '../bridge';

const ASSETS = {
  island: 'world/island-township-v2.png',
  coastalBackdrop: 'world/coastal-jungle-backdrop-v3.png',
  jungleFoliage: 'world/jungle-foliage-v3.png',
  courier: 'courier/run-v1.png',
  ...Object.fromEntries(Object.entries(BUILDING_ART).map(([key, path]) => [key, path.replace('/assets/', '')])),
  ...Object.fromEntries(Object.entries(SETTLEMENT_ATLASES).map(([key, atlas]) => [key, atlas.path.replace('/assets/', '')])),
  stone: 'pickups/stone-v1.png',
  timber: 'pickups/timber-v1.png',
  coin: 'pickups/coin-v1.png',
  obstacle: 'pickups/obstacle-v1.png',
};

/** Trim transparent padding at runtime; original generated PNGs remain untouched. */
function addContentFrames(texture: Phaser.Textures.Texture, columns = 1): void {
  const source = texture.getSourceImage() as HTMLImageElement;
  const width = source.width;
  const height = source.height;
  const cellWidth = Math.floor(width / columns);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return;
  context.drawImage(source, 0, 0);
  const pixels = context.getImageData(0, 0, width, height).data;
  let left = cellWidth, top = height, right = 0, bottom = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (pixels[(y * width + x) * 4 + 3]! < 25) continue;
      const localX = x % cellWidth;
      left = Math.min(left, localX);
      right = Math.max(right, localX);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }
  if (right <= left || bottom <= top) {
    left = 0; top = 0; right = cellWidth - 1; bottom = height - 1;
  }
  for (let column = 0; column < columns; column++) {
    texture.add(columns === 1 ? 'content' : column, 0, column * cellWidth + left, top, right - left + 1, bottom - top + 1);
  }
  canvas.width = canvas.height = 1;
}

/** Each atlas cell has its own bounds; a tall tower never changes a neighbor's frame. */
function addAtlasFrames(texture: Phaser.Textures.Texture, names: readonly string[]): void {
  const source = texture.getSourceImage() as HTMLImageElement;
  const width = source.width;
  const height = source.height;
  const cellWidth = Math.floor(width / 2);
  const cellHeight = Math.floor(height / 2);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Atlas pixel reader unavailable');
  context.drawImage(source, 0, 0);
  const pixels = context.getImageData(0, 0, width, height).data;
  names.forEach((name, cell) => {
    const startX = (cell % 2) * cellWidth;
    const startY = Math.floor(cell / 2) * cellHeight;
    let left = cellWidth, top = cellHeight, right = -1, bottom = -1;
    for (let y = 0; y < cellHeight; y++) {
      for (let x = 0; x < cellWidth; x++) {
        if (pixels[((startY + y) * width + startX + x) * 4 + 3]! < 25) continue;
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }
    if (right < left || bottom < top) throw new Error(`Empty building atlas cell: ${name}`);
    texture.add(name, 0, startX + left, startY + top, right - left + 1, bottom - top + 1);
  });
  canvas.width = canvas.height = 1;
}

export class BootScene extends Phaser.Scene {
  private failed = false;
  constructor(private readonly bridge: GameBridge) { super('boot'); }

  preload(): void {
    this.failed = false;
    this.load.on('loaderror', () => { this.failed = true; });
    for (const [key, path] of Object.entries(ASSETS)) this.load.image(key, `/assets/${path}`);
  }

  create(): void {
    if (this.failed) {
      this.bridge.onError('Some island artwork could not load. Check your connection, then reload to try again.');
      return;
    }
    try {
      for (const key of [...Object.keys(BUILDING_ART), 'timber', 'stone', 'coin', 'obstacle', 'jungleFoliage']) addContentFrames(this.textures.get(key));
      for (const [key, atlas] of Object.entries(SETTLEMENT_ATLASES)) addAtlasFrames(this.textures.get(key), atlas.frames);
      addContentFrames(this.textures.get('courier'), 4);
      this.anims.create({
        key: 'courier-run',
        frames: [0, 1, 2, 3].map((frame) => ({ key: 'courier', frame })),
        frameRate: 9,
        repeat: -1,
      });
      this.scene.start(this.bridge.read().view === 'run' ? 'run' : 'island');
      this.bridge.onReady();
    } catch {
      this.bridge.onError('The game artwork could not be prepared. Reload to try again. Your saved island stays in this browser.');
    }
  }
}
