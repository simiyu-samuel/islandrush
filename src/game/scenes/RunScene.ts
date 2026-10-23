import Phaser from 'phaser';
import type { Frame, GameBridge, RenderEntity } from '../bridge';
import { bindRunnerInput } from '../input';
import { Boardwalk } from '../Boardwalk';
import { projectRoute, routeLayout } from '../projection';

type EntityView = {
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Ellipse;
  glow: Phaser.GameObjects.Ellipse;
  kind: RenderEntity['kind'];
};
type Burst = { x: number; y: number; age: number };

export class RunScene extends Phaser.Scene {
  private boardwalk!: Boardwalk;
  private sparks!: Phaser.GameObjects.Graphics;
  private courier!: Phaser.GameObjects.Sprite;
  private shadow!: Phaser.GameObjects.Ellipse;
  private views = new Map<string, EntityView>();
  private previousEntities = new Map<string, RenderEntity>();
  private previousDistance = 0;
  private previousPhase: Frame['phase'] = 'active';
  private bursts: Burst[] = [];

  constructor(private readonly bridge: GameBridge) { super('run'); }

  create(): void {
    this.boardwalk = new Boardwalk(this);
    this.sparks = this.add.graphics().setDepth(100000);
    this.shadow = this.add.ellipse(0, 0, 62, 18, 0x60452b, 0.25);
    this.courier = this.add.sprite(0, 0, 'courier', 0).setOrigin(0.5, 1);
    this.views = new Map();
    this.previousEntities = new Map();
    this.bursts = [];
    this.previousDistance = 0;
    this.previousPhase = 'active';
    const unbind = bindRunnerInput(this.game.canvas, this.bridge);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, unbind);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { this.views.clear(); this.previousEntities.clear(); });
    this.paint(this.bridge.read(), 0);
  }

  update(_time: number, delta: number): void {
    if (this.bridge.read().view !== 'run') { this.scene.start('island'); return; }
    this.bridge.tick(Math.max(0, delta / 1000));
    const frame = this.bridge.read();
    if (frame.view !== 'run') { this.scene.start('island'); return; }
    this.paint(frame, delta / 1000);
  }

  private paint(frame: Frame, dt: number): void {
    const layout = routeLayout(this.scale.width, this.scale.height);
    const { height, stageWidth, baselineY } = layout;
    this.boardwalk.paint(frame, layout);
    const reset = frame.distance + 0.01 < this.previousDistance;
    if (reset) {
      for (const actor of this.views.values()) actor.container.destroy();
      this.views.clear();
      this.previousEntities.clear();
      this.bursts = [];
      this.cameras.main.resetFX();
    }
    const live = new Set<string>();
    for (const entity of frame.entities) {
      const point = projectRoute(entity.lane, entity.z, frame.distance, layout);
      if (!point.visible) continue;
      live.add(entity.id);
      let actor = this.views.get(entity.id);
      if (!actor) {
        actor = this.makeEntity(entity.kind);
        this.views.set(entity.id, actor);
      }
      // At the model's 1.05-unit jump clearance, the boots must visibly
      // clear the block, including on short phone screens.
      const nearHeight = entity.kind === 'obstacle' ? Math.min(56, height * 0.075) : entity.kind === 'coin' ? 43 : 47;
      const spriteScale = nearHeight / actor.sprite.frame.realHeight;
      const bob = frame.reducedMotion || entity.kind === 'obstacle' ? 0 : Math.sin(frame.elapsed * 3.8 + entity.z * 0.25) * 5;
      const lift = entity.kind === 'obstacle' ? 0 : 32 + bob;
      actor.container.setPosition(point.x, point.y).setScale(point.scale).setDepth(point.y);
      actor.sprite.setScale(spriteScale).setPosition(0, -lift);
      actor.sprite.setAngle(entity.kind === 'timber' && !frame.reducedMotion ? Math.sin(frame.elapsed * 2.1 + entity.z) * 3 : 0);
      const visualWidth = actor.sprite.displayWidth;
      actor.shadow.setSize(Math.max(22, visualWidth * 0.76), entity.kind === 'obstacle' ? 14 : 10)
        .setAlpha(entity.kind === 'obstacle' ? 0.3 : 0.16);
      actor.glow.setPosition(0, -lift - nearHeight * 0.45).setSize(visualWidth * 1.38, nearHeight * 1.2)
        .setAlpha(entity.kind === 'obstacle' ? 0 : 0.14 + (frame.reducedMotion ? 0 : Math.sin(frame.elapsed * 3 + entity.z) * 0.025));
    }
    for (const [id, actor] of this.views) {
      if (live.has(id)) continue;
      const before = this.previousEntities.get(id);
      const earned = before && before.kind !== 'obstacle' && !frame.entities.some(entity => entity.id === id) && Math.abs(before.z - frame.distance) < 5 && frame.phase === 'active';
      if (earned && !frame.reducedMotion) this.bursts.push({ x: actor.container.x, y: actor.container.y - 40, age: 0 });
      actor.container.destroy();
      this.views.delete(id);
    }
    const courierHeight = layout.mobile
      ? Math.max(128, Math.min(174, height * 0.205))
      : Math.max(116, Math.min(184, height * 0.215));
    const jump = Phaser.Math.Clamp(frame.jumpHeight / 2.2, 0, 1);
    const jumpPixels = jump * Math.min(125, height * 0.16);
    const contact = projectRoute(frame.lane, frame.distance, frame.distance, layout);
    const x = contact.x;
    const grounded = jump < 0.015;
    this.shadow.setPosition(x, baselineY - 2).setSize(courierHeight * (0.31 - jump * 0.06), courierHeight * 0.08)
      .setAlpha(0.28 - jump * 0.12).setDepth(baselineY - 1);
    this.courier.setPosition(x, baselineY - jumpPixels).setScale(courierHeight / this.courier.frame.realHeight)
      .setDepth(baselineY + 2).setAngle(!grounded && !frame.reducedMotion ? frame.lane * -2 : 0);
    if (frame.phase === 'active' && grounded) {
      this.courier.play('courier-run', true);
      if (this.courier.anims.isPaused) this.courier.anims.resume();
    } else {
      this.courier.anims.pause();
      if (!grounded) this.courier.setFrame(1);
    }
    if (!reset && this.previousPhase === 'active' && frame.phase !== 'active' && frame.phase !== 'paused' && frame.elapsed < 59.9 && !frame.reducedMotion) {
      this.cameras.main.shake(120, 0.0035);
    }
    this.paintBursts(frame.phase === 'active' ? dt : 0, frame.reducedMotion);
    this.previousPhase = frame.phase;
    this.previousDistance = frame.distance;
    this.previousEntities = new Map(frame.entities.map((entity) => [entity.id, entity]));
    // Keep the stage-width calculation visible to the runtime inspector.
    this.registry.set('routeStageWidth', stageWidth);
  }

  private makeEntity(kind: RenderEntity['kind']): EntityView {
    const key = kind;
    const shadow = this.add.ellipse(0, -1, 50, 12, 0x5e4024, 0.2);
    const glow = this.add.ellipse(0, -50, 70, 62, kind === 'coin' ? 0xffdc71 : 0xffefb5, 0.14);
    const sprite = this.add.image(0, -32, key, 'content').setOrigin(0.5, 1);
    const container = this.add.container(0, 0, [shadow, glow, sprite]);
    return { container, shadow, glow, sprite, kind };
  }

  private paintBursts(dt: number, reducedMotion: boolean): void {
    this.sparks.clear();
    if (reducedMotion) { this.bursts = []; return; }
    this.bursts = this.bursts.filter((burst) => burst.age < 0.36);
    for (const burst of this.bursts) {
      burst.age += dt;
      const progress = Math.min(1, burst.age / 0.36);
      for (let ray = 0; ray < 6; ray++) {
        const angle = ray * Math.PI / 3;
        const x = burst.x + Math.cos(angle) * (8 + progress * 22);
        const y = burst.y + Math.sin(angle) * (8 + progress * 22) - progress * 8;
        this.sparks.fillStyle(0xfff5bd, 1 - progress).fillRect(Math.round(x), Math.round(y), 3, 3);
      }
    }
  }
}
