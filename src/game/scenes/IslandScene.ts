import Phaser from 'phaser';
import type { Frame, GameBridge, PlotId } from '../bridge';
import { drawConstruction } from '../construction';
import { BUILDINGS } from '../../model/catalog';
import { buildingWidth } from '../art';

type PlotView = {
  id: PlotId; x: number; y: number;
  container: Phaser.GameObjects.Container;
  halo: Phaser.GameObjects.Ellipse;
  ground: Phaser.GameObjects.Ellipse;
  plus: Phaser.GameObjects.Text;
  label: Phaser.GameObjects.Text;
  image: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Ellipse;
  wasBuilt: boolean;
  reveal: number;
};

export class IslandScene extends Phaser.Scene {
  private water!: Phaser.GameObjects.Graphics;
  private island!: Phaser.GameObjects.Image;
  private construction!: Phaser.GameObjects.Graphics;
  private constructionMeter!: Phaser.GameObjects.Graphics;
  private constructionPercent!: Phaser.GameObjects.Text;
  private plots: PlotView[] = [];

  constructor(private readonly bridge: GameBridge) { super('island'); }

  create(): void {
    this.water = this.add.graphics().setDepth(-10);
    this.island = this.add.image(0, 0, 'island').setDepth(0);
    this.construction = this.add.graphics().setDepth(11);
    this.constructionMeter = this.add.graphics().setDepth(10000);
    this.constructionPercent = this.add.text(0, 0, '', {
      fontFamily: 'Arial, sans-serif', fontSize: '12px', fontStyle: 'bold', color: '#285c50',
    }).setOrigin(0.5, 0).setDepth(10001);
    const frame = this.bridge.read();
    this.plots = [
      { id: 'home' as const, x: 0.29, y: 0.55 },
      { id: 'workshop' as const, x: 0.69, y: 0.55 },
      { id: 'lookout' as const, x: 0.5, y: 0.32 },
    ].map(plot => {
      const halo = this.add.ellipse(0, 0, 104, 48, 0xfff3bf, 0.3).setStrokeStyle(2, 0xfff6d4, 0.95);
      const ground = this.add.ellipse(0, 0, 88, 36, 0x3f8061, 0.25).setStrokeStyle(1, 0x254f43, 0.5);
      const plus = this.add.text(0, -2, '+', {
        fontFamily: 'Arial, sans-serif', fontSize: '29px', fontStyle: 'bold', color: '#fff9df',
        stroke: '#447051', strokeThickness: 3,
      }).setOrigin(0.5);
      const label = this.add.text(0, 33, BUILDINGS[plot.id].name.toUpperCase(), {
        fontFamily: 'Arial, sans-serif', fontSize: '10px', fontStyle: 'bold', color: '#214f47',
        backgroundColor: '#fff2d5', padding: { x: 9, y: 6 },
      }).setOrigin(0.5, 0);
      const container = this.add.container(0, 0, [halo, ground, plus, label]).setDepth(20);
      container.setSize(112, 105).setInteractive({ useHandCursor: true });
      container.on('pointerdown', () => this.bridge.selectPlot(plot.id));
      const shadow = this.add.ellipse(0, 0, 120, 36, 0x294d37, 0.17).setDepth(8);
      const image = this.add.image(0, 0, frame.buildings[plot.id].style, 'content').setOrigin(0.5, 0.91).setDepth(10);
      image.setInteractive({ useHandCursor: true });
      image.on('pointerdown', () => this.bridge.selectPlot(plot.id));
      return { ...plot, container, halo, ground, plus, label, image, shadow,
        wasBuilt: frame.buildings[plot.id].built, reveal: 1 };
    });
    this.paint(frame, 0, 0);
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
    const availableHeight = desktop ? height * 0.76 : Math.max(180, height - 180);
    const availableWidth = desktop ? Math.max(420, width - 356) : width * 1.55;
    const islandWidth = Math.min(availableWidth * (desktop ? 1.03 : 1), availableHeight * 1.5, 1150);
    const islandHeight = islandWidth * 2 / 3;
    const centerX = desktop ? (width - 350) / 2 : width / 2;
    const centerY = desktop ? height * 0.58 : 90 + availableHeight / 2;
    const left = centerX - islandWidth / 2;
    const top = centerY - islandHeight / 2;
    const motion = frame.reducedMotion || (!desktop && frame.settlementOpen) ? 0 : time / 1000;
    this.paintWater(width, height, motion);
    this.island.setPosition(centerX, centerY).setDisplaySize(islandWidth, islandHeight);
    this.construction.clear().setVisible(frame.constructionBuilding !== null);
    this.constructionMeter.clear().setVisible(false);
    this.constructionPercent.setVisible(false);
    const markerSize = Math.max(54, Math.min(105, islandWidth * 0.13));
    for (const plot of this.plots) {
      const state = frame.buildings[plot.id];
      const building = frame.constructionBuilding === plot.id;
      const unlocked = plot.id === 'home' || frame.buildings.home.built;
      const selected = frame.selectedPlot === plot.id;
      const x = left + plot.x * islandWidth;
      const y = top + plot.y * islandHeight;
      const anchorY = y + islandHeight * 0.025;
      plot.image.setTexture(state.style, 'content');
      const aspect = plot.image.frame.realHeight / plot.image.frame.realWidth;
      const desiredWidth = islandWidth * buildingWidth(plot.id, state.style);
      const spriteWidth = plot.id === 'lookout' ? Math.min(desiredWidth, islandHeight * 0.42 / aspect) : desiredWidth;
      const spriteHeight = spriteWidth * aspect;
      plot.container.setPosition(x, y).setAlpha(unlocked ? 1 : 0.65);
      plot.halo.setSize(markerSize, markerSize * 0.46)
        .setFillStyle(selected ? 0xffef9e : 0xfaf6cf, selected ? 0.49 : 0.18)
        .setStrokeStyle(selected ? 3 : 1, selected ? 0xfff5c5 : 0xe3edd3, selected ? 1 : 0.6)
        .setScale(selected && !frame.reducedMotion ? 1 + Math.sin(motion * 2) * 0.025 : 1)
        .setVisible(!building && !state.built);
      plot.ground.setSize(markerSize * 0.84, markerSize * 0.34).setVisible(!building && !state.built);
      plot.plus.setVisible(!state.built && !building).setText(unlocked ? '+' : '·');
      plot.label.setY(markerSize * 0.34 + 7).setText(BUILDINGS[plot.id].name.toUpperCase() + (state.built ? ' ✓' : unlocked ? '' : ' · LV2'));
      if (plot.container.input) plot.container.input.enabled = !frame.constructionBuilding && !(frame.settlementOpen && !desktop);
      if (plot.image.input) plot.image.input.enabled = !frame.constructionBuilding && !(frame.settlementOpen && !desktop);
      plot.image.setPosition(x, anchorY).setVisible(state.built).setDepth(y);
      plot.shadow.setPosition(x, anchorY).setSize(spriteWidth * 0.78, spriteWidth * 0.22).setVisible(state.built || building).setDepth(y - 1);
      if (state.built && !plot.wasBuilt) plot.reveal = frame.reducedMotion ? 1 : 0;
      plot.wasBuilt = state.built;
      plot.reveal = Math.min(1, plot.reveal + dt * 3.8);
      if (state.built) {
        plot.image.setTexture(state.style, 'content');
        const revealScale = frame.reducedMotion ? 1 : 0.84 + 0.16 * Phaser.Math.Easing.Back.Out(plot.reveal);
        plot.image.setScale(spriteWidth / plot.image.frame.realWidth * revealScale).setAlpha(plot.reveal);
      }
      if (building) {
        this.construction.setDepth(y + 1);
        drawConstruction(this.construction, x, anchorY, spriteWidth, frame.constructionProgress ?? 0, state.style, frame.reducedMotion);
      }
      if (building || (state.built && plot.reveal < 1)) {
        this.paintConstructionMeter(x, anchorY, spriteHeight, state.built ? 1 : frame.constructionProgress ?? 0, width);
      }
    }
  }

  private paintConstructionMeter(x: number, y: number, spriteHeight: number, progress: number, viewportWidth: number) {
    const ratio = Phaser.Math.Clamp(progress, 0, 1);
    const meterWidth = 124;
    const meterX = Phaser.Math.Clamp(x, meterWidth / 2 + 8, viewportWidth - meterWidth / 2 - 8);
    const meterY = Math.max(88, y - spriteHeight * 0.91 - 50);
    const graphics = this.constructionMeter.setVisible(true);
    graphics.fillStyle(0xfff9e9, 0.98).fillRoundedRect(meterX - meterWidth / 2, meterY, meterWidth, 42, 10);
    graphics.lineStyle(1, 0xd8cba5).strokeRoundedRect(meterX - meterWidth / 2, meterY, meterWidth, 42, 10);
    graphics.fillStyle(0xe6dfc8).fillRoundedRect(meterX - 51, meterY + 27, 102, 7, 3);
    if (ratio > 0) graphics.fillStyle(0x34836d).fillRoundedRect(meterX - 51, meterY + 27, 102 * ratio, 7, 3);
    this.constructionPercent.setVisible(true).setPosition(meterX, meterY + 7).setText(`BUILDING  ${Math.round(ratio * 100)}%`);
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
