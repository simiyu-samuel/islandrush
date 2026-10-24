import Phaser from 'phaser';
import type { Frame, GameBridge } from '../bridge';
import { buildingVisual, buildingWidth } from '../art';
import { drawConstruction } from '../construction';
import type { BuildingInstance } from '../../model/types';
import { BUILDINGS } from '../../model/catalog';
import { BUILDING_LOTS } from '../../model/placement';
import { islandMapLayout, lotPosition, lotFootprint, lotHitPolygon, regionPosition, MAP_CAMERA_EVENT, MIN_MAP_ZOOM, MAX_MAP_ZOOM, MAP_ZOOM_STEP, type MapCameraCommand, type IslandMap } from '../islandMap';

type BuildingView = {
  image: Phaser.GameObjects.Image; shadow: Phaser.GameObjects.Ellipse;
  site: Phaser.GameObjects.Graphics; construction: Phaser.GameObjects.Graphics;
  meter: Phaser.GameObjects.Graphics; percent: Phaser.GameObjects.Text;
  complete: boolean; reveal: number;
};
type LotView = { container: Phaser.GameObjects.Container; graphics: Phaser.GameObjects.Graphics };

export class IslandScene extends Phaser.Scene {
  private water!: Phaser.GameObjects.Graphics;
  private bridges!: Phaser.GameObjects.Graphics;
  private life!: Phaser.GameObjects.Graphics;
  private landmarks!: Phaser.GameObjects.Graphics;
  private islands: Phaser.GameObjects.Image[] = [];
  private buildings = new Map<string, BuildingView>();
  private residents = new Map<string, Phaser.GameObjects.Graphics>();
  private lots = new Map<string, LotView>();
  private ghost!: Phaser.GameObjects.Image;
  private zoom = 1;
  private panX = 0;
  private panY = 0;
  private dragStart: { x: number; y: number; panX: number; panY: number } | null = null;
  private dragged = false;
  private lastPlacementLot: string | null = null;
  private focusTarget: { x: number; y: number } | null = null;

  constructor(private readonly bridge: GameBridge) { super('island'); }

  create(): void {
    this.islands = []; this.buildings.clear(); this.lots.clear(); this.residents.clear();
    this.water = this.add.graphics().setDepth(-10);
    this.bridges = this.add.graphics().setDepth(1);
    this.life = this.add.graphics().setDepth(8000);
    this.landmarks = this.add.graphics().setDepth(2);
    this.ghost = this.add.image(0, 0, 'island').setOrigin(0.5, 0.91).setDepth(8500).setVisible(false);
    const frame = this.bridge.read();
    this.bindMapNavigation();
    if (!frame.reducedMotion) this.cameras.main.fadeIn(280, 21, 68, 74);
    this.paint(frame, 0, 0);
  }

  update(time: number, delta: number): void {
    if (this.bridge.read().view !== 'island') { this.scene.start('run'); return; }
    this.bridge.tick(Math.max(0, delta / 1000));
    const frame = this.bridge.read();
    if (frame.view !== 'island') { this.scene.start('run'); return; }
    this.paint(frame, time, delta / 1000);
  }

  private makeBuilding(instance: BuildingInstance): BuildingView {
    const visual = buildingVisual(instance.type, instance.style);
    const image = this.add.image(0, 0, visual.key, visual.frame).setOrigin(0.5, 0.91).setInteractive({ useHandCursor: true });
    image.on('pointerup', () => { if (!this.dragged && !this.bridge.read().placement) this.bridge.selectBuilding(instance.id); });
    const percent = this.add.text(0, 0, '', { fontFamily: 'Arial, sans-serif', fontSize: '10px', fontStyle: 'bold', color: '#285c50' }).setOrigin(0.5, 0);
    return { image, shadow: this.add.ellipse(0, 0, 1, 1, 0x294d37, 0.18),
      site: this.add.graphics(), construction: this.add.graphics(), meter: this.add.graphics(), percent,
      complete: instance.state === 'complete', reveal: 1 };
  }

  private paint(frame: Frame, time: number, dt: number): void {
    const width = this.scale.width, height = this.scale.height;
    const desktop = width >= 960;
    let map = islandMapLayout(width, height, this.zoom, this.panX, this.panY, frame.regions);
    if (frame.placement && frame.placement.lot !== this.lastPlacementLot) {
      const lot = frame.lots.find(item => item.id === frame.placement!.lot);
      if (lot) {
        const point = lotPosition(lot, map);
        const target = islandMapLayout(width, height, this.zoom,
          this.panX + map.viewport.x + map.viewport.width / 2 - point.x,
          this.panY + map.viewport.y + map.viewport.height / 2 - point.y, frame.regions);
        this.focusTarget = { x: target.panX, y: target.panY };
      }
    }
    this.lastPlacementLot = frame.placement?.lot ?? null;
    if (this.focusTarget) {
      const amount = frame.reducedMotion ? 1 : Math.min(1, dt * 10);
      this.panX += (this.focusTarget.x - this.panX) * amount;
      this.panY += (this.focusTarget.y - this.panY) * amount;
      if (Math.hypot(this.focusTarget.x - this.panX, this.focusTarget.y - this.panY) < 0.5) this.focusTarget = null;
      map = islandMapLayout(width, height, this.zoom, this.panX, this.panY, frame.regions);
    }
    this.panX = map.panX; this.panY = map.panY;
    // A camera viewport clips in WebGL and Canvas. Matching its scroll to its
    // screen origin preserves the existing absolute map and pointer positions.
    this.cameras.main.setViewport(map.viewport.x, map.viewport.y, map.viewport.width, map.viewport.height).setScroll(map.viewport.x, map.viewport.y);
    const motion = frame.reducedMotion || (!desktop && frame.settlementOpen) ? 0 : time / 1000;
    this.paintWater(width, height, motion);
    this.paintRegions(frame, map);
    this.paintLandmarks(frame, map, motion);
    this.paintLots(frame, map);
    const retained = new Set(frame.buildings.map(building => building.id));
    for (const [id, view] of this.buildings) if (!retained.has(id)) {
      Object.values(view).forEach(object => { if (object && typeof object === 'object' && 'destroy' in object) object.destroy(); });
      this.buildings.delete(id);
    }
    for (const instance of frame.buildings) {
      let view = this.buildings.get(instance.id);
      if (!view) { view = this.makeBuilding(instance); this.buildings.set(instance.id, view); }
      this.paintBuilding(view, instance, frame, map, dt);
    }
    this.paintPreview(frame, map);
    this.paintResidents(frame, map, motion);
    this.paintShipping(frame, map, motion);
  }

  private paintRegions(frame: Frame, map: IslandMap): void {
    while (this.islands.length < frame.regions) this.islands.push(this.add.image(0, 0, 'island').setDepth(0));
    for (let index = 0; index < this.islands.length; index++) {
      const origin = regionPosition(index, map);
      this.islands[index]!.setVisible(index < frame.regions).setPosition(origin.x + map.mapWidth / 2, origin.y + map.mapHeight / 2).setDisplaySize(map.mapWidth, map.mapHeight);
    }
    const graphics = this.bridges.clear();
    for (let region = 1; region < frame.regions; region++) {
      const a = regionPosition(region - 1, map), b = regionPosition(region, map);
      const horizontal = Math.abs(a.x - b.x) > map.mapWidth * 0.5;
      const from = { x: a.x + map.mapWidth * (horizontal ? (b.x > a.x ? 0.86 : 0.17) : 0.52), y: a.y + map.mapHeight * (horizontal ? 0.48 : 0.78) };
      const to = { x: b.x + map.mapWidth * (horizontal ? (b.x > a.x ? 0.17 : 0.86) : 0.52), y: b.y + map.mapHeight * (horizontal ? 0.48 : 0.19) };
      const thickness = Math.max(4, map.mapWidth * 0.014);
      graphics.lineStyle(thickness + 4, 0x456957).lineBetween(from.x, from.y + 3, to.x, to.y + 3);
      graphics.lineStyle(thickness, 0xd9bf88).lineBetween(from.x, from.y, to.x, to.y);
      const length = Math.hypot(to.x - from.x, to.y - from.y);
      for (let step = 0; step <= length; step += Math.max(5, map.mapWidth * 0.008)) {
        const fraction = length ? step / length : 0;
        const x = Phaser.Math.Linear(from.x, to.x, fraction), y = Phaser.Math.Linear(from.y, to.y, fraction);
        const nx = horizontal ? 0 : thickness * 0.48, ny = horizontal ? thickness * 0.48 : 0;
        graphics.lineStyle(1, 0x9a7e54).lineBetween(x - nx, y - ny, x + nx, y + ny);
      }
    }
  }


  private paintLandmarks(frame: Frame, map: IslandMap, motion: number): void {
    const graphics = this.landmarks.clear();
    for (let region = 0; region < frame.regions; region++) {
      const origin = regionPosition(region, map);
      for (const block of Object.values(BUILDING_LOTS)) {
        const x = origin.x + (block.x + 0.048) * map.mapWidth;
        const y = origin.y + (block.y - 0.017) * map.mapHeight;
        const size = map.mapWidth * 0.011;
        const tags: readonly string[] = block.tags;
        if (tags.includes('spring')) {
          graphics.fillStyle(0x928b66).fillEllipse(x, y, size * 2.6, size * 1.25);
          graphics.fillStyle(0x6fc5b6).fillEllipse(x, y - size * 0.1, size * 2.05, size * 0.85);
          graphics.lineStyle(Math.max(1, size * 0.09), 0xc2ece2, 0.7).strokeEllipse(x, y - size * 0.1, size * 1.3, size * 0.5);
          if (!frame.reducedMotion) for (let steam = 0; steam < 2; steam++) {
            const cycle = (motion * 0.4 + steam * 0.5) % 1;
            graphics.fillStyle(0xe9f4d7, (1 - cycle) * 0.22).fillEllipse(x + Math.sin(cycle * 4 + steam) * size * 0.35, y - size * (0.7 + cycle * 1.8), size * (0.55 + cycle), size * (0.4 + cycle));
          }
        } else if (tags.includes('forest')) {
          graphics.lineStyle(Math.max(1.5, size * 0.25), 0x8f7446).lineBetween(x, y, x + size * 0.1, y - size * 2.2);
          for (let leaf = 0; leaf < 5; leaf++) {
            const angle = leaf * Math.PI * 0.4;
            graphics.lineStyle(Math.max(1.5, size * 0.32), leaf % 2 ? 0x68a34a : 0x4c8c43).lineBetween(x + size * 0.1, y - size * 2.2, x + Math.cos(angle) * size * 1.2, y - size * 2.2 + Math.sin(angle) * size * 0.55);
          }
        }
      }
    }
  }

  private paintBuilding(view: BuildingView, instance: BuildingInstance, frame: Frame, map: IslandMap, dt: number): void {
    const lot = frame.lots.find(item => item.id === instance.lot);
    if (!lot) { view.image.setVisible(false); return; }
    const point = lotPosition(lot, map);
    const x = point.x, y = point.y + map.mapHeight * 0.005;
    const moving = frame.placement?.instanceId === instance.id;
    const complete = instance.state === 'complete';
    const selected = frame.selectedInstance === instance.id;
    const visual = buildingVisual(instance.type, instance.style);
    view.image.setTexture(visual.key, visual.frame);
    const spriteWidth = map.mapWidth * buildingWidth(instance.type, instance.style);
    const spriteHeight = spriteWidth * view.image.frame.realHeight / view.image.frame.realWidth;
    const onMap = x + spriteWidth / 2 >= map.viewport.x && x - spriteWidth / 2 <= map.viewport.x + map.viewport.width && y >= map.viewport.y && y - spriteHeight <= map.viewport.y + map.viewport.height;
    view.image.setPosition(x, y).setVisible(complete && !moving && onMap).setDepth(y + 10).setFlipX(instance.facing === 'right');
    if (view.image.input) view.image.input.enabled = complete && !frame.placement && !(frame.settlementOpen && this.scale.width < 960);
    if (complete && !view.complete) view.reveal = frame.reducedMotion ? 1 : 0;
    view.complete = complete;
    view.reveal = Math.min(1, view.reveal + dt * 3.8);
    const revealScale = frame.reducedMotion ? 1 : 0.84 + 0.16 * Phaser.Math.Easing.Back.Out(view.reveal);
    view.image.setScale(spriteWidth / view.image.frame.realWidth * revealScale).setAlpha(view.reveal);
    view.shadow.setPosition(x, y).setSize(spriteWidth * 0.78, spriteWidth * 0.22).setDepth(y - 1).setVisible(!moving && onMap);
    view.site.setPosition(x, y).setDepth(y - 0.5).setVisible(selected && !frame.placement);
    this.paintFootprint(view.site, lotFootprint(map).width, selected, true);
    view.construction.clear().setVisible(!complete && onMap).setDepth(y + 11);
    view.meter.clear().setVisible(false); view.percent.setVisible(false);
    if (!complete) {
      const duration = Math.max(1, instance.completesAt - instance.startedAt);
      const progress = Phaser.Math.Clamp((Date.now() - instance.startedAt) / duration, 0, 1);
      drawConstruction(view.construction, x, y, spriteWidth, progress, instance.style, frame.reducedMotion, instance.type);
      if (onMap) this.paintConstructionMeter(view, x, y, spriteHeight, progress);
    }
  }

  private paintLots(frame: Frame, map: IslandMap): void {
    const active = new Set(frame.lots.map(lot => lot.id));
    for (const [id, view] of this.lots) if (!active.has(id)) { view.container.destroy(true); this.lots.delete(id); }
    const draft = frame.placement;
    for (const lot of frame.lots) {
      let view = this.lots.get(lot.id);
      if (!view) {
        const graphics = this.add.graphics();
        const container = this.add.container(0, 0, [graphics]).setDepth(7000).setInteractive(new Phaser.Geom.Polygon([]), Phaser.Geom.Polygon.Contains);
        container.on('pointerup', () => { if (!this.dragged) this.bridge.selectLot(lot.id); });
        view = { container, graphics }; this.lots.set(lot.id, view);
      }
      const occupied = frame.buildings.some(building => building.id !== draft?.instanceId && building.lot === lot.id);
      const terrain = draft && BUILDINGS[draft.type].terrain;
      const suitable = terrain === 'any' || Boolean(terrain && lot.tags.includes(terrain));
      const eligible = Boolean(draft && lot.unlocked && !occupied && suitable);
      const visible = Boolean(draft && !occupied);
      view.container.setVisible(visible);
      if (view.container.input) view.container.input.enabled = eligible;
      if (!visible) continue;
      const point = lotPosition(lot, map), footprint = lotFootprint(map);
      view.container.setPosition(point.x, point.y).setAlpha(eligible ? 1 : 0.2);
      view.container.setSize(footprint.width, footprint.height);
      // InputManager adds displayOrigin to pointer-local coordinates. Center the
      // input polygon there, matching the diamond drawn around container (0,0).
      if (view.container.input) {
        (view.container.input.hitArea as Phaser.Geom.Polygon).setTo(lotHitPolygon(map));
        view.container.input.cursor = 'pointer';
      }
      this.paintFootprint(view.graphics, footprint.width, draft?.lot === lot.id, eligible);
      if (suitable && lot.unlocked && !occupied) {
        const color = lot.tags.includes('spring') ? 0x8ad9d2 : lot.tags.includes('forest') ? 0xaedc82 : lot.tags.includes('coast') ? 0x86c8e0 : 0xe9d8aa;
        view.graphics.fillStyle(color, 0.9).fillCircle(0, footprint.height * 0.8, Math.max(1.5, footprint.width * 0.055));
      }
    }
  }

  private paintPreview(frame: Frame, map: IslandMap): void {
    const draft = frame.placement;
    const lot = draft && frame.lots.find(item => item.id === draft.lot);
    this.ghost.setVisible(Boolean(draft && lot));
    if (!draft || !lot) return;
    const visual = buildingVisual(draft.type, draft.style), point = lotPosition(lot, map);
    this.ghost.setTexture(visual.key, visual.frame).setPosition(point.x, point.y + map.mapHeight * 0.005)
      .setScale(map.mapWidth * buildingWidth(draft.type, draft.style) / this.ghost.frame.realWidth)
      .setFlipX(draft.facing === 'right').setAlpha(0.68);
  }

  private paintResidents(frame: Frame, map: IslandMap, motion: number): void {
    // Positions derive from persistent citizen identities, homes and simulation
    // time. Scene recreation never invents inhabitants or advances the economy.
    this.life.clear();
    const retained = new Set(frame.citizens.map(citizen => citizen.id));
    for (const [id, graphics] of this.residents) if (!retained.has(id)) { graphics.destroy(); this.residents.delete(id); }
    for (let index = 0; index < frame.citizens.length; index++) {
      const citizen = frame.citizens[index]!;
      let graphics = this.residents.get(citizen.id);
      if (!graphics) { graphics = this.add.graphics(); this.residents.set(citizen.id, graphics); }
      graphics.clear();
      const home = frame.buildings.find(item => item.id === citizen.homeId);
      const homeLot = home && frame.lots.find(lot => lot.id === home.lot);
      const region = homeLot?.region ?? 0;
      const origin = regionPosition(region, map);
      const seed = [...citizen.id].reduce((value, char) => value + char.charCodeAt(0), 0);
      const job = frame.buildings.find(item => item.id === citizen.jobId);
      const jobLot = job && frame.lots.find(lot => lot.id === job.lot && lot.region === region);
      // Join a home and its assigned workplace through the painted street spine.
      // Cross-islet workers use their home district path rather than walking water.
      const homePoint = homeLot ? [homeLot.x, homeLot.y] : [0.442,0.653];
      const destination = jobLot ? [jobLot.x,jobLot.y] : [0.584,0.504];
      const street = [[0.35,0.60],[0.47,0.51],[0.57,0.43],[0.68,0.35]];
      const nearest = (point: number[]) => street.reduce((best,node,index) => Math.hypot(node[0]! - point[0]!,node[1]! - point[1]!) < Math.hypot(street[best]![0]! - point[0]!,street[best]![1]! - point[1]!) ? index : best, 0);
      const fromIndex = nearest(homePoint), toIndex = nearest(destination);
      const corridor = fromIndex <= toIndex ? street.slice(fromIndex,toIndex+1) : street.slice(toIndex,fromIndex+1).reverse();
      const outward = [homePoint,...corridor,destination];
      const path = [...outward,...outward.slice(1,-1).reverse()];
      const simSeconds = frame.simTime / 1000;
      const walkSpeed = citizen.illness ? 0.05 : 0.12;
      const position = (seed * 0.17 + (frame.reducedMotion ? 0 : simSeconds * walkSpeed)) % path.length;
      const from = path[Math.floor(position)]!, to = path[(Math.floor(position) + 1) % path.length]!;
      const x = origin.x + Phaser.Math.Linear(from[0]!, to[0]!, position % 1) * map.mapWidth;
      const y = origin.y + Phaser.Math.Linear(from[1]!, to[1]!, position % 1) * map.mapHeight;
      graphics.setDepth(y + 12);
      const size = Math.max(2, map.mapWidth * 0.0038);
      const stride = motion ? Math.sin(simSeconds * 6 + seed) * size * 0.5 : 0;
      graphics.fillStyle(0x214d40, 0.2).fillEllipse(x, y + size * 0.3, size * 2.5, size);
      graphics.fillStyle(index % 3 === 0 ? 0xe3a459 : index % 3 === 1 ? 0x609c9a : 0xc07e6a).fillRect(x - size * 0.6, y - size * 3, size * 1.3, size * 1.8);
      graphics.fillStyle(0x334d50).fillRect(x - size * 0.6, y - size * 1.4, size * 0.5, size * 1.4 + stride).fillRect(x + size * 0.2, y - size * 1.4, size * 0.5, size * 1.4 - stride);
      graphics.fillStyle(0xb77b4d).fillCircle(x, y - size * 3.6, size * 0.65);
      graphics.fillStyle(0x443e30).fillRect(x - size * 0.65, y - size * 4.1, size * 1.3, size * 0.45);
      if (citizen.illness && frame.selectedInstance === citizen.homeId) {
        graphics.fillStyle(0xf5e9d8).fillCircle(x + size * 1.4, y - size * 4, size);
        graphics.lineStyle(Math.max(1, size * 0.35), 0xc96856).lineBetween(x + size * 0.8, y - size * 4, x + size * 2, y - size * 4).lineBetween(x + size * 1.4, y - size * 4.6, x + size * 1.4, y - size * 3.4);
      }
    }
  }


  private paintShipping(frame: Frame, map: IslandMap, motion: number): void {
    const ship = frame.ship;
    const graphics = this.life;
    for (const beacon of frame.buildings.filter(building => building.type === 'coastal-lighthouse' && building.state === 'complete')) {
      const lot = frame.lots.find(item => item.id === beacon.lot);
      if (!lot) continue;
      const point = lotPosition(lot, map);
      const angle = frame.reducedMotion ? -0.6 : motion * 0.35;
      const radius = map.mapWidth * 0.12;
      graphics.fillStyle(0xfff4b1, 0.065).beginPath().moveTo(point.x, point.y - map.mapWidth * 0.045).lineTo(point.x + Math.cos(angle - 0.12) * radius, point.y - map.mapWidth * 0.045 + Math.sin(angle - 0.12) * radius * 0.5).lineTo(point.x + Math.cos(angle + 0.12) * radius, point.y - map.mapWidth * 0.045 + Math.sin(angle + 0.12) * radius * 0.5).closePath().fillPath();
    }
    const piers = frame.buildings.filter(building => building.type === 'archipelago-pier' && building.state === 'complete');
    if (!ship || !piers.length) return;
    const pier = piers.find(building => frame.lots.find(lot => lot.id === building.lot)?.region === ship.region) ?? piers[0]!;
    const pierLot = frame.lots.find(lot => lot.id === pier.lot);
    if (!pierLot) return;
    const origin = regionPosition(pierLot.region, map);
    const shore = pierLot.block === 'harbor' ? { x: 0.13, y: 0.83 } : pierLot.block === 'east' ? { x: 0.91, y: 0.30 } : { x: 0.98, y: 0.48 };
    const dock = { x: origin.x + map.mapWidth * shore.x, y: origin.y + map.mapHeight * shore.y };
    const direction = shore.x < 0.5 ? -1 : 1;
    const distance = ship.phase === 'docked' ? 0 : ship.phase === 'fogbound' ? 0.13 : (1 - ship.progress) * 0.55;
    const x = dock.x + direction * distance * map.mapWidth;
    const y = dock.y + distance * map.mapHeight * 0.35 + (motion ? Math.sin(motion * 1.6) * map.mapWidth * 0.0015 : 0);
    const size = map.mapWidth * 0.018;
    graphics.lineStyle(Math.max(1, size * 0.15), 0xd8f3df, 0.45).lineBetween(x + size, y + size * 0.8, x + size * 3.3, y + size * 1.1);
    graphics.fillStyle(0x77583c).beginPath().moveTo(x - size * 1.7, y).lineTo(x + size * 1.6, y).lineTo(x + size, y + size * 0.8).lineTo(x - size, y + size * 0.8).closePath().fillPath();
    graphics.fillStyle(0xdcc38f).fillRect(x - size * 1.2, y - size * 0.35, size * 2.3, size * 0.38);
    graphics.fillStyle(0x4e8881).fillRect(x - size * 0.8, y - size * 0.9, size * 0.8, size * 0.55);
    graphics.fillStyle(0xa96b46).fillRect(x + size * 0.1, y - size * 0.75, size * 0.65, size * 0.4);
    graphics.fillStyle(0xf0e4bc).fillRect(x - size * 0.7, y - size * 1.5, size * 0.65, size * 0.65);
    graphics.fillStyle(0x3b676a).fillRect(x - size * 0.6, y - size * 1.37, size * 0.4, size * 0.2);
    if (ship.phase === 'fogbound') {
      for (let index = 0; index < 4; index++) graphics.fillStyle(0xd4e9df, 0.16).fillEllipse(x + Math.sin(index * 1.7) * size * 3, y - index * size * 0.45, size * 8, size * 1.7);
    }

  }

  private bindMapNavigation(): void {
    this.zoom = 1; this.panX = 0; this.panY = 0;
    this.dragStart = null; this.dragged = false; this.lastPlacementLot = null; this.focusTarget = null;
    const command = (event: Event) => {
      const action = (event as CustomEvent<MapCameraCommand>).detail;
      this.focusTarget = null;
      if (action === 'reset') { this.zoom = 1; this.panX = 0; this.panY = 0; }
      else if (action === 'in' || action === 'out') this.zoom = Math.max(MIN_MAP_ZOOM, Math.min(MAX_MAP_ZOOM, this.zoom + (action === 'in' ? MAP_ZOOM_STEP : -MAP_ZOOM_STEP)));
    };
    window.addEventListener(MAP_CAMERA_EVENT, command);
    const down = (pointer: Phaser.Input.Pointer) => {
      this.dragged = false; this.focusTarget = null;
      this.dragStart = { x: pointer.x, y: pointer.y, panX: this.panX, panY: this.panY };
    };
    const move = (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown || !this.dragStart) return;
      const dx = pointer.x - this.dragStart.x, dy = pointer.y - this.dragStart.y;
      if (Math.hypot(dx, dy) > 8) this.dragged = true;
      if (this.dragged) { this.panX = this.dragStart.panX + dx; this.panY = this.dragStart.panY + dy; }
    };
    const up = () => { this.dragStart = null; };
    this.input.on('pointerdown', down); this.input.on('pointermove', move);
    this.input.on('pointerup', up); this.input.on('pointerupoutside', up);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener(MAP_CAMERA_EVENT, command);
      this.input.off('pointerdown', down); this.input.off('pointermove', move);
      this.input.off('pointerup', up); this.input.off('pointerupoutside', up);
    });
  }

  private paintConstructionMeter(view: BuildingView, x: number, y: number, spriteHeight: number, progress: number): void {
    const camera = this.cameras.main;
    const meterWidth = 90, meterX = Phaser.Math.Clamp(x, camera.x + 53, camera.x + camera.width - 53);
    const meterY = Math.max(this.scale.width >= 960 ? 134 : this.scale.width > this.scale.height ? 80 : 130, y - spriteHeight * 0.91 - 34);
    const graphics = view.meter.setVisible(true).setDepth(9000);
    graphics.fillStyle(0xfff9e9, 0.98).fillRoundedRect(meterX - meterWidth / 2, meterY, meterWidth, 31, 7);
    graphics.lineStyle(1, 0xd8cba5).strokeRoundedRect(meterX - meterWidth / 2, meterY, meterWidth, 31, 7);
    graphics.fillStyle(0xe6dfc8).fillRoundedRect(meterX - 36, meterY + 21, 72, 4, 2);
    if (progress > 0) graphics.fillStyle(0x34836d).fillRoundedRect(meterX - 36, meterY + 21, 72 * progress, 4, 2);
    view.percent.setVisible(true).setDepth(9001).setPosition(meterX, meterY + 5).setText(`BUILDING ${Math.round(progress * 100)}%`);
  }

  private paintFootprint(graphics: Phaser.GameObjects.Graphics, size: number, selected: boolean, unlocked: boolean): void {
    graphics.clear();
    const w = size / 2, h = size * 0.26;
    const color = selected ? 0xffd481 : unlocked ? 0xf0edca : 0x9fae9b;
    graphics.fillStyle(selected ? 0x41785b : 0x244d3d, selected ? 0.42 : 0.15).beginPath().moveTo(0, -h).lineTo(w, 0).lineTo(0, h).lineTo(-w, 0).closePath().fillPath();
    graphics.lineStyle(selected ? 2 : 1, color, selected ? 1 : 0.65).beginPath().moveTo(0, -h).lineTo(w, 0).lineTo(0, h).lineTo(-w, 0).closePath().strokePath();
    for (const [x, y] of [[0,-h],[w,0],[0,h],[-w,0]]) graphics.fillStyle(color).fillRect(x! - 1, y! - 3, 2, 5);
  }

  private paintWater(width: number, height: number, motion: number): void {
    const graphics = this.water.clear();
    for (let row = 0; row < 40; row++) {
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(0x25858f), Phaser.Display.Color.ValueToColor(0x63c6b9), 39, row);
      graphics.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b)).fillRect(0, row * height / 40, width, height / 40 + 1);
    }
    for (let index = 0; index < 45; index++) {
      const x = ((index * 179.3 + Math.sin(index * 2.3 + motion * 0.35) * 11) % (width + 60)) - 30;
      const y = 85 + (index * 83.7) % Math.max(1, height - 100);
      graphics.fillStyle(0xe0fff0, 0.12 + (Math.sin(motion * 0.7 + index) + 1) * 0.045).fillRect(Math.round(x), Math.round(y), 10 + (index % 4) * 7, 2);
    }
  }
}
