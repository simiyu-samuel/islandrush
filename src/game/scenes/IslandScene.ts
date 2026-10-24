import Phaser from 'phaser';
import type { Frame, GameBridge, PlotId } from '../bridge';
import { drawConstruction } from '../construction';
import { BUILDINGS } from '../../model/catalog';
import { buildingWidth } from '../art';

type PlotView = {
  id: PlotId; x: number; y: number;
  container: Phaser.GameObjects.Container;
  site: Phaser.GameObjects.Graphics;
  badge: Phaser.GameObjects.Text;
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
      const site = this.add.graphics();
      const badge = this.add.text(0, -2, '01', {
        fontFamily: 'Arial, sans-serif', fontSize: '13px', fontStyle: 'bold', color: '#fff4d1',
      }).setOrigin(0.5);
      const label = this.add.text(0, 33, BUILDINGS[plot.id].name.toUpperCase(), {
        fontFamily: 'Arial, sans-serif', fontSize: '10px', fontStyle: 'bold', color: '#fff4d1',
        backgroundColor: '#173f49', padding: { x: 10, y: 7 },
      }).setOrigin(0.5, 0);
      const container = this.add.container(0, 0, [site, badge, label]).setDepth(20);
      container.setSize(150, 120).setInteractive({ useHandCursor: true });
      container.on('pointerdown', () => this.bridge.selectPlot(plot.id));
      const shadow = this.add.ellipse(0, 0, 120, 36, 0x294d37, 0.17).setDepth(8);
      const image = this.add.image(0, 0, frame.buildings[plot.id].style, 'content').setOrigin(0.5, 0.91).setDepth(10);
      image.setInteractive({ useHandCursor: true });
      image.on('pointerdown', () => this.bridge.selectPlot(plot.id));
      return { ...plot, container, site, badge, label, image, shadow,
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
    const landscape = !desktop && width > height;
    // Larger land area; mobile plots move inward so buildings remain reachable.
    const availableHeight = desktop ? height * 0.83 : landscape ? height * 0.92 : Math.max(260, height - 220);
    const availableWidth = desktop ? Math.max(540, width - 370) * 1.12 : width * 1.72;
    const islandWidth = Math.min(availableWidth, availableHeight * 1.6, 1350);
    const islandHeight = islandWidth * 2 / 3;
    const centerX = desktop ? (width - 380) / 2 : landscape ? width * 0.4 : width / 2;
    const centerY = desktop ? height * 0.56 : landscape ? height * 0.55 : height * 0.51;
    const left = centerX - islandWidth / 2;
    const top = centerY - islandHeight / 2;
    const motion = frame.reducedMotion || (!desktop && frame.settlementOpen) ? 0 : time / 1000;
    this.paintWater(width, height, motion);
    this.island.setPosition(centerX, centerY).setDisplaySize(islandWidth, islandHeight);
    this.construction.clear().setVisible(frame.constructionBuilding !== null);
    this.constructionMeter.clear().setVisible(false);
    this.constructionPercent.setVisible(false);
    const markerSize = Math.max(76, Math.min(150, islandWidth * 0.18));
    for (const plot of this.plots) {
      const state = frame.buildings[plot.id];
      const building = frame.constructionBuilding === plot.id;
      const unlocked = plot.id === 'home' || frame.buildings.home.built;
      const selected = frame.selectedPlot === plot.id;
      const plotX = desktop ? plot.x : plot.id === 'home' ? 0.34 : plot.id === 'workshop' ? 0.66 : 0.5;
      const x = left + plotX * islandWidth;
      const y = top + plot.y * islandHeight;
      const anchorY = y + islandHeight * 0.025;
      plot.image.setTexture(state.style, 'content');
      const aspect = plot.image.frame.realHeight / plot.image.frame.realWidth;
      const desiredWidth = islandWidth * buildingWidth(plot.id, state.style);
      const spriteWidth = plot.id === 'lookout' ? Math.min(desiredWidth, islandHeight * 0.42 / aspect) : desiredWidth;
      const spriteHeight = spriteWidth * aspect;
      plot.container.setPosition(x, y).setAlpha(unlocked ? 1 : 0.78).setDepth(y + 10);
      this.paintPlot(plot.site, markerSize, selected, unlocked);
      plot.site.setVisible(!building && !state.built);
      const plotIndex = plot.id === 'home' ? '01' : plot.id === 'workshop' ? '02' : '03';
      plot.badge.setVisible(!state.built && !building).setText(unlocked ? plotIndex : 'LV2');
      plot.label.setY(markerSize * 0.33 + 9).setVisible(!building)
        .setColor(selected ? '#173f49' : '#fff4d1')
        .setBackgroundColor(selected ? '#f5ce79' : '#173f49')
        .setText(BUILDINGS[plot.id].name.toUpperCase() + (state.built ? ' ✓' : unlocked ? '' : ' · LOCKED'));
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

  private paintPlot(graphics: Phaser.GameObjects.Graphics, size: number, selected: boolean, unlocked: boolean) {
    graphics.clear();
    const w = size / 2, h = size * 0.25;
    const color = selected ? 0xffd481 : unlocked ? 0xf0edca : 0xaac0a1;
    // A diamond footprint follows the island perspective, with survey stakes
    // at its four corners. It is a building site rather than a floating bubble.
    graphics.fillStyle(0x244d3d, selected ? 0.35 : 0.19)
      .beginPath().moveTo(0, -h).lineTo(w, 0).lineTo(0, h).lineTo(-w, 0).closePath().fillPath();
    graphics.lineStyle(selected ? 2 : 1, color, selected ? 1 : 0.7)
      .beginPath().moveTo(0, -h).lineTo(w, 0).lineTo(0, h).lineTo(-w, 0).closePath().strokePath();
    for (const [x, y] of [[0, -h], [w, 0], [0, h], [-w, 0]]) {
      graphics.fillStyle(0x79552e).fillRect(x! - 2, y! - 13, 4, 15);
      graphics.fillStyle(color).fillRect(x! - 3, y! - 14, 6, 4);
    }
    graphics.fillStyle(selected ? 0x9c712c : 0x173f49, 0.98).fillRoundedRect(-18, -14, 36, 28, 3);
    graphics.lineStyle(1, color, 0.85).strokeRoundedRect(-18, -14, 36, 28, 3);
  }

  private paintWater(width: number, height: number, motion: number): void {
    const graphics = this.water;
    graphics.clear();
    // Quiet depth behind the richly detailed island, without broad flat stripes.
    for (let row = 0; row < 40; row++) {
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(0x25858f), Phaser.Display.Color.ValueToColor(0x63c6b9), 39, row,
      );
      graphics.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b))
        .fillRect(0, row * height / 40, width, height / 40 + 1);
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
