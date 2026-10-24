import Phaser from 'phaser';
import type { Frame } from './bridge';
import { LOOK_AHEAD, projectRoute, routeSceneryX, type RouteLayout } from './projection';

const JOINT_DISTANCE = 16;
const BACKDROP_WIDTH = 1536;
const BACKDROP_HEIGHT = 1024;
const BACKDROP_HORIZON = 298;

/** Coastal jungle layers share the road camera, with a slower outer canopy. */
export class Boardwalk {
  private readonly water: Phaser.GameObjects.Graphics;
  private readonly backdrop: Phaser.GameObjects.Image;
  private readonly blend: Phaser.GameObjects.Graphics;
  private readonly trail: Phaser.GameObjects.Graphics;
  private readonly details: Phaser.GameObjects.Graphics;
  private readonly foliage: Phaser.GameObjects.Image[];

  constructor(scene: Phaser.Scene) {
    this.water = scene.add.graphics().setDepth(-40);
    this.backdrop = scene.add.image(0,0,'coastalBackdrop').setOrigin(0.5,0).setDepth(-35);
    // Runtime framing only; original image bytes remain unchanged.
    this.backdrop.setCrop(0,0,BACKDROP_WIDTH,640);
    this.blend = scene.add.graphics().setDepth(-34);
    this.trail = scene.add.graphics().setDepth(-25);
    this.details = scene.add.graphics().setDepth(-20);
    this.foliage = Array.from({length:12}, (_,i) => scene.add.image(0,0,'jungleFoliage','content')
      .setOrigin(0.5,1).setFlipX(i % 2 === 1));
  }

  paint(frame: Frame, layout: RouteLayout): void {
    const { width,height,horizonY } = layout;
    this.paintOcean(frame,layout);
    // Width-based framing keeps the island small and distant on a phone too.
    const scale = width / BACKDROP_WIDTH;
    const top = horizonY - BACKDROP_HORIZON * scale;
    this.backdrop.setPosition(width/2,top).setDisplaySize(width,BACKDROP_HEIGHT*scale);
    const end = top + 640 * scale;
    this.blend.clear();
    for (let i=0;i<24;i++) {
      const y = end - 42 + i*2;
      this.blend.fillStyle(this.seaColor(y,layout),i/23).fillRect(0,y,width,3);
    }
    this.paintTrail(layout);
    this.paintEdges(frame,layout);
    const travel = frame.reducedMotion ? 0 : frame.distance * 0.48;
    for (let i=0;i<this.foliage.length;i++) {
      const side = i%2===0 ? -1 : 1;
      const relative = ((Math.floor(i/2)*26 - travel)%156+156)%156-18;
      const point = projectRoute(side*1.92,relative,0,layout);
      const tree = this.foliage[i]!;
      tree.setVisible(relative < LOOK_AHEAD && point.y < height+170);
      const displayHeight = Math.min(layout.mobile ? 200 : 340,height*(layout.mobile ? 0.26 : 0.42)) * point.scale;
      tree.setScale(displayHeight/tree.frame.realHeight);
      const x=routeSceneryX(side,relative,tree.displayWidth,layout);
      tree.setPosition(x,point.y+6*point.scale)
        .setDepth(point.y-3).setAlpha(Math.min(1,point.scale*3));
    }
  }

  private paintTrail(layout: RouteLayout) {
    const g=this.trail.clear();
    const p=(lane:number,z:number)=>projectRoute(lane,z,0,layout);
    const a=p(-1.5,LOOK_AHEAD),b=p(1.5,LOOK_AHEAD),c=p(1.5,-LOOK_AHEAD),d=p(-1.5,-LOOK_AHEAD);
    // One continuous weathered-stone surface: no animated mesh or tile patches.
    g.fillStyle(0xbda979).beginPath().moveTo(a.x,a.y).lineTo(b.x,b.y).lineTo(c.x,c.y).lineTo(d.x,d.y).closePath().fillPath();
  }

  private paintEdges(frame:Frame,layout:RouteLayout) {
    const g=this.details.clear();
    const p=(lane:number,z:number)=>projectRoute(lane,z,0,layout);
    const band=(lane:number,half:number,color:number,alpha=1)=>{
      const a=p(lane-half,LOOK_AHEAD),b=p(lane+half,LOOK_AHEAD),c=p(lane+half,-LOOK_AHEAD),d=p(lane-half,-LOOK_AHEAD);
      g.fillStyle(color,alpha).beginPath().moveTo(a.x,a.y).lineTo(b.x,b.y).lineTo(c.x,c.y).lineTo(d.x,d.y).closePath().fillPath();
    };
    for (const edge of [-1.5,1.5]) {
      band(edge+Math.sign(edge)*0.07,0.08,0x638460);
      band(edge,0.028,0x716e4d);
      band(edge-Math.sign(edge)*0.035,0.012,0xe0cf9c);
    }
    for (const divider of [-0.5,0.5]) band(divider,0.005,0x746e50,0.28);
    const phase=frame.distance%JOINT_DISTANCE;
    for (let row=-10;row<=Math.ceil(LOOK_AHEAD/JOINT_DISTANCE);row++) {
      const relative=row*JOINT_DISTANCE-phase;
      if (relative>LOOK_AHEAD) continue;
      const left=p(-1.46,relative),right=p(1.46,relative);
      if (left.y<layout.horizonY+5 || left.y>layout.height+2) continue;
      g.lineStyle(Math.max(0.5,left.scale),0x726b4c,0.19*Math.min(1,(left.y-layout.horizonY)/55))
        .beginPath().moveTo(left.x,left.y).lineTo(right.x,right.y).strokePath();
    }
  }

  private seaColor(y:number,layout:RouteLayout) {
    const t=Phaser.Math.Clamp((y-layout.horizonY)/(layout.height-layout.horizonY),0,1);
    const color=Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(0x159ed0),Phaser.Display.Color.ValueToColor(0x49cdbd),100,Math.round(t*100));
    return Phaser.Display.Color.GetColor(color.r,color.g,color.b);
  }

  private paintOcean(frame:Frame,layout:RouteLayout) {
    const {width,height,horizonY}=layout;
    const g=this.water.clear().fillStyle(0x64c6e0).fillRect(0,0,width,height);
    for (let row=0;row<32;row++) {
      const y=horizonY+(height-horizonY)*row/32;
      g.fillStyle(this.seaColor(y,layout)).fillRect(0,y,width,(height-horizonY)/32+1);
    }
    const motion=frame.reducedMotion ? 0 : frame.elapsed*0.7;
    for (let i=0;i<55;i++) {
      const t=(i*0.137+motion*0.004)%1;
      const y=horizonY+t*(height-horizonY);
      const x=(i*137.19+Math.sin(i+motion*0.1)*7)%(width+60)-30;
      g.fillStyle(0xd9fff0,0.16).fillRect(Math.round(x),Math.round(y),(8+i%5*6)*(0.3+t),2);
    }
  }
}
