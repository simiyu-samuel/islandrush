import Phaser from 'phaser';
import type { GameBridge } from './bridge';
import { BootScene } from './scenes/BootScene';
import { IslandScene } from './scenes/IslandScene';
import { RunScene } from './scenes/RunScene';

export function mountGame(parent: HTMLElement, bridge: GameBridge): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.WEBGL,
    parent,
    backgroundColor: '#68c5c3',
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    banner: false,
    // Active run time must follow elapsed seconds even on a slow renderer.
    // Phaser's default smoothing caps long frames during its 120-frame cooldown.
    fps: { smoothStep: false },
    transparent: false,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: Math.max(1, parent.clientWidth),
      height: Math.max(1, parent.clientHeight),
    },
    input: { keyboard: false, activePointers: 2 },
    scene: [new BootScene(bridge), new IslandScene(bridge), new RunScene(bridge)],
    callbacks: {
      postBoot(game) {
        game.canvas.addEventListener('webglcontextlost', () => {
          bridge.pause();
          bridge.onError('The graphics connection was interrupted. Reload to restore your saved island.');
        });
      },
    },
  });
}
