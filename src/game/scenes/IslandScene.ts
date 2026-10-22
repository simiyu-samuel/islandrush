import Phaser from 'phaser';
import type { Frame, GameBridge, PlotId } from '../bridge';

type PlotView = {
  id: PlotId;
  x: number;
  y: number;
  container: Phaser.GameObjects.Container;
  halo: Phaser.GameObjects.Ellipse;
  ground: Phaser.GameObjects.Ellipse;
  label: Phaser.GameObjects.Text;
};

export class IslandScene extends Phaser.Scene {
  private water!: Phaser.GameObjects.Graphics;
  private island!: Phaser.GameObjects.Image;
  private home!: Phaser.GameObjects.Image;
  private homeShadow!: Phaser.GameObjects.Ellipse;
  private plots: PlotView[] = [];
  private builtBefore = false;
  private reveal = 1;

  constructor(private readonly bridge: GameBridge) { super('island'); }

  create(): void {
    this.water = this.add.graphics().setDepth(-10);
    this.island = this.add.image(0, 0, 'island').setDepth(0);
    this.homeShadow = this.add.ellipse(0, 0, 120, 36, 0x294d37, 0.17).setDepth(8);
    this.home = this.add.image(0, 0, 'cottage', 'content').setOrigin(0.5, 0.91).setDepth(10);
    this.plots = [
      { id: 'home' as const, x: 0.29, y: 0.55 },
      { id: 'workshop' as const, x: 0.69, y: 0.55 },
      { id: 'lookout' as const, x: 0.5, y: 0.32 },
    ].map((plot) => {
      const halo = this.add.ellipse(0, 0, 104, 48, 0xfff3bf, 0.3).setStrokeStyle(2, 0xfff6d4, 0.95);
      const ground = this.add.ellipse(0, 0, 88, 36, 0x3f8061, 0.25).setStrokeStyle(1, 0x254f43, 0.5);
      const plus = this.add.text(0, -2, '+', {
        fontFamily: 'Arial, sans-serif', fontSize: '29px', fontStyle: 'bold', color: '#fff9df',
        stroke: '#447051', strokeThickness: 3,
      }).setOrigin(0.5, 0.5);
      const label = this.add.text(0, 33, plot.id === 'home' ? 'YOUR HOME' : plot.id.toUpperCase(), {
        fontFamily: 'Arial, sans-serif', fontSize: '10px', fontStyle: 'bold', color: '#214f47',
        backgroundColor: '#fff2d5', padding: { x: 9, y: 6 },
      }).setOrigin(0.5, 0);
      const container = this.add.container(0, 0, [halo, ground, plus, label]).setDepth(20);
      container.setSize(112, 105).setInteractive({ useHandCursor: true });
      container.on('pointerdown', () => this.bridge.selectPlot(plot.id));
      return { ...plot, container, halo, ground, label };
    });
    this.builtBefore = this.bridge.read().homeBuilt;
    this.reveal = 1;
    this.paint(this.bridge.read(), 0, 0);
  }

  update(time: number, delta: number): void {
    if (this.bridge.read().view !== 'island') { this.scene.start('run'); return; }
    this.bridge.tick(Math.max(0, delta / 1000));
    const frame = this.bridge.read();
    if (frame.view !== 'island') { this.scene.start('run'); return; }
    this.paint(frame, time, delta / 1000);
  }

  private paint(frame: Frame, time: number, dt: number): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const desktop = width >= 960;
    const availableHeight = desktop ? height * 0.76 : Math.max(180, height - 430);
    const availableWidth = desktop ? Math.max(420, width - 356) : width * 0.96;
    const islandWidth = Math.min(availableWidth * (desktop ? 1.03 : 1), availableHeight * 1.5, 1150);
    const islandHeight = islandWidth * 2 / 3;
    const centerX = desktop ? (width - 350) / 2 : width / 2;
    const centerY = desktop ? height * 0.58 : 90 + availableHeight / 2;
    const left = centerX - islandWidth / 2;
    const top = centerY - islandHeight / 2;
    const motion = frame.reducedMotion ? 0 : time / 1000;
    this.paintWater(width, height, motion);
    this.island.setPosition(centerX, centerY).setDisplaySize(islandWidth, islandHeight);
    const markerSize = Math.max(54, Math.min(105, islandWidth * 0.13));
    for (const plot of this.plots) {
      const x = left + plot.x * islandWidth;
      const y = top + plot.y * islandHeight;
      const selected = frame.selectedPlot === plot.id;
      plot.container.setPosition(x, y);
      plot.halo.setSize(markerSize, markerSize * 0.46)
        .setFillStyle(selected ? 0xffef9e : 0xfaf6cf, selected ? 0.49 : 0.18)
        .setStrokeStyle(selected ? 3 : 1, selected ? 0xfff5c5 : 0xe3edd3, selected ? 1 : 0.6)
        .setScale(selected && !frame.reducedMotion ? 1 + Math.sin(motion * 2) * 0.025 : 1);
      plot.ground.setSize(markerSize * 0.84, markerSize * 0.34);
      plot.label.setY(markerSize * 0.34 + 7);
      plot.container.setAlpha(plot.id === 'home' || frame.homeBuilt ? 1 : 0.77);
      plot.label.setText(plot.id === 'home' && frame.homeBuilt ? 'HOME SWEET HOME' : plot.id === 'home' ? 'YOUR HOME' : `${plot.id.toUpperCase()}${frame.homeBuilt ? '' : ' · LV2'}`);
      if (plot.id === 'home') {
        plot.container.setDepth(frame.homeBuilt ? 6 : 20);
        plot.container.getAt<Phaser.GameObjects.Text>(2).setVisible(!frame.homeBuilt);
        this.home.setPosition(x, y + islandHeight * 0.025);
        this.homeShadow.setPosition(x, y + islandHeight * 0.024).setSize(islandWidth * 0.17, islandWidth * 0.047);
      }
    }
    if (frame.homeBuilt && !this.builtBefore) this.reveal = frame.reducedMotion ? 1 : 0;
    this.builtBefore = frame.homeBuilt;
    this.reveal = Math.min(1, this.reveal + dt * 3.8);
    this.home.setVisible(frame.homeBuilt);
    this.homeShadow.setVisible(frame.homeBuilt);
    if (frame.homeBuilt) {
      this.home.setTexture(frame.homeStyle, 'content');
      const houseWidth = islandWidth * (frame.homeStyle === 'bungalow' ? 0.235 : 0.22);
      const revealScale = frame.reducedMotion ? 1 : 0.84 + 0.16 * Phaser.Math.Easing.Back.Out(this.reveal);
      this.home.setScale(houseWidth / this.home.frame.realWidth * revealScale).setAlpha(this.reveal);
      this.home.setInteractive({ useHandCursor: true });
      if (this.home.listenerCount('pointerdown') === 0) this.home.on('pointerdown', () => this.bridge.selectPlot('home'));
    }
  }

  private paintWater(width: number, height: number, motion: number): void {
    const graphics = this.water;
    graphics.clear();
    graphics.fillStyle(0x63c4c2, 1).fillRect(0, 0, width, height);
    const strip = Math.max(36, height / 14);
    for (let row = 0; row < 16; row++) {
      graphics.fillStyle(row % 2 === 0 ? 0x66ccc7 : 0x5ac0bf, 0.32);
      graphics.fillRect(0, row * strip, width, strip * 0.56);
    }
    for (let i = 0; i < 45; i++) {
      const x = ((i * 179.3 + Math.sin(i * 2.3 + motion * 0.35) * 11) % (width + 60)) - 30;
      const y = 85 + (i * 83.7) % Math.max(1, height - 100);
      graphics.fillStyle(0xe0fff0, 0.12 + (Math.sin(motion * 0.7 + i) + 1) * 0.045);
      graphics.fillRect(Math.round(x), Math.round(y), 10 + (i % 4) * 7, 2);
      if (i % 3 === 0) graphics.fillRect(Math.round(x + 8), Math.round(y + 5), 10, 2);
    }
  }
}
