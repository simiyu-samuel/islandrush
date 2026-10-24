import { availableLots, getLots, getRegionCount, validLot, type Facing } from './model/placement';
import {
  createProgress, getLevel, placeBuilding, chooseStyle, beginConstruction, finishConstruction,
  settleRun, selectTarget, purchaseMaterials, canTarget, completeTutorialStep, skipTutorial,
  advanceSettlement, settlementStats, setPolicy, upgradeTownHall, trade, unloadCargo, assignCitizen, dismantleBuilding,
} from './model/progress';
import { createRun, advanceRun, returnRun, moveRun, jumpRun, pauseRun, resumeRun } from './model/run';
import { loadProgress, saveProgress } from './model/save';
import type { ActiveRun, BuildingType, CategoryId, CommandResult, Progress, StorageAdapter, StyleId, Material, TutorialStep, Policy } from './model/types';
import { BUILDINGS, BUILDING_IDS } from './model/catalog';
import type { Frame, GameBridge } from './game/bridge';

export type SettlementPanel = 'catalog' | 'islanders' | 'production' | 'trade' | 'council';
export class IslandController {
  progress: Progress;
  run: ActiveRun | null = null;
  view: 'island' | 'run' | 'results' = 'island';
  selectedType: BuildingType = 'pioneer-cottage';
  selectedInstance: string | null = null;
  selectedCitizen: string | null = null;
  category: CategoryId = 'expansion';
  panel: SettlementPanel = 'catalog';
  compact = window.matchMedia('(max-width: 959px)').matches;
  settlementOpen = false;
  placement: { type: BuildingType; style: StyleId; lot: string; facing: Facing; instanceId?: string } | null = null;
  ready = false;
  error = '';
  notice = '';
  saveMessage = 'Progress saves in this browser';
  modal: 'none' | 'save-recovery' | 'fresh' | 'restart' | 'help' = 'none';
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private listeners = new Set<(structural: boolean) => void>();
  private writable = true;
  private lastHudUpdate = 0;
  private lastConstructionUpdate = 0;
  private storage: StorageAdapter;
  private noticeTimeout: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.storage = {getItem: key => window.localStorage.getItem(key), setItem: (key,value) => window.localStorage.setItem(key,value)};
    const saved = loadProgress(this.storage);
    this.progress = saved.status === 'ok' ? saved.progress : createProgress();
    if (saved.status === 'corrupt') {
      this.writable = false; this.saveMessage = 'Unreadable save preserved'; this.modal = 'save-recovery';
    } else if (saved.status === 'unavailable') {
      this.writable = false; this.saveMessage = 'Session only · browser storage unavailable';
    } else if (saved.status === 'ok' && saved.migrated) {
      this.persist(); this.notice = 'Your earlier island has been carried into the new settlement.';
    }
    this.selectedType = this.progress.target;
    this.category = BUILDINGS[this.selectedType].category;
    const layout = window.matchMedia('(max-width: 959px)');
    layout.addEventListener('change', event => {this.compact = event.matches; this.emit();});
    window.addEventListener('blur', () => this.pause());
    document.addEventListener('visibilitychange', () => {if (document.hidden) this.pause();});
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', event => {this.reducedMotion = event.matches; this.emit();});
  }
  subscribe(listener: (structural:boolean) => void) {this.listeners.add(listener); return () => this.listeners.delete(listener);}
  emit(structural = true) {this.listeners.forEach(listener => listener(structural));}
  toast(message:string) {
    this.notice = message; this.scheduleNoticeClear(); this.emit();
  }
  private scheduleNoticeClear() {
    clearTimeout(this.noticeTimeout);
    this.noticeTimeout=setTimeout(()=>{this.notice='';this.emit();},4200);
  }
  private persist(overwriteCorrupt = false) {
    if (!this.writable && !overwriteCorrupt) return;
    const result = saveProgress(this.storage,this.progress,{overwriteCorrupt});
    if (!result.ok) {this.writable = false; this.saveMessage = result.reason === 'corrupt' ? 'Previous save preserved · session only' : 'Session only · progress could not be saved';}
    else {this.writable = true; this.saveMessage = 'Saved in this browser';}
  }
  private apply(result:CommandResult) {
    if (result.ok) {this.progress = result.progress; this.persist();}
    this.toast(result.message); return result.ok;
  }
  private recordTutorial(...steps:TutorialStep[]) {
    if (this.progress.tutorial.skipped) return false;
    let changed = false;
    for (const step of steps) {
      if (this.progress.tutorial.completed.includes(step)) continue;
      this.progress = completeTutorialStep(this.progress,step).progress; changed = true;
    }
    if (changed) this.persist(); return changed;
  }
  get stats() {return settlementStats(this.progress);}
  get level() {return getLevel(this.progress);}
  get selected() {return this.progress.buildings.find(b => b.id === this.selectedInstance) ?? null;}
  get definition() {return BUILDINGS[this.selectedType];}
  get guideStep(): 'choose-style' | 'first-run' | 'build' | null {
    if (this.progress.tutorial.skipped || this.progress.tutorial.completed.includes('build') || this.progress.buildings.length > 0) return null;
    if (this.canBuild) return 'build';
    return this.progress.tutorial.completed.includes('choose-style') ? 'first-run' : 'choose-style';
  }
  get canBuild() {return canTarget(this.progress,this.selectedType) && this.progress.wallet.timber >= this.definition.recipe.timber && this.progress.wallet.stone >= this.definition.recipe.stone;}
  skipGuide() {if (this.modal === 'none') this.apply(skipTutorial(this.progress));}
  selectType(type:BuildingType) {
    if (this.view !== 'island' || this.modal !== 'none' || this.placement || !BUILDING_IDS.includes(type)) return;
    this.selectedType = type; this.category = BUILDINGS[type].category; this.selectedInstance = null; this.panel = 'catalog';
    {const result=selectTarget(this.progress,type); if (result.ok) {this.progress=result.progress;this.persist();}}
    this.emit();
  }
  selectCategory(category:CategoryId) {
    const first = BUILDING_IDS.find(id => BUILDINGS[id].category === category);
    if (first) this.selectType(first);
  }
  chooseStyle(style:StyleId) {
    if (this.view !== 'island' || this.modal !== 'none' || this.placement) return;
    if (this.apply(chooseStyle(this.progress,this.selectedType,style))) {this.recordTutorial('welcome','choose-style');this.emit();}
  }
  openSettlement(panel:SettlementPanel = 'catalog') {if (this.view !== 'island' || this.modal !== 'none') return;this.panel = panel;this.settlementOpen = true;this.recordTutorial('welcome');this.emit();}
  closeSettlement() {this.settlementOpen=false;this.emit();}
  openPlacement(instanceId?:string) {
    if (this.view !== 'island' || this.modal !== 'none') return;
    const instance = instanceId ? this.progress.buildings.find(b => b.id === instanceId) : null;
    if (instanceId && (!instance || instance.state !== 'complete')) {this.toast('This building is still taking shape.');return;}
    const type=instance?.type ?? this.selectedType;
    if (!instance && !canTarget(this.progress,type)) {this.toast('Upgrade your Town Hall to unlock this building tier.');return;}
    const lots=availableLots(this.progress,type,instance?.id);
    if (!lots.length) {this.toast('No suitable clear space. Claim ground with an outpost or connect another islet with a bridge.');return;}
    this.selectedType=type;this.selectedInstance=instance?.id ?? null;
    this.placement={type,style:instance?.style ?? this.progress.designs[type],lot:instance?.lot ?? lots[0]!.id,facing:instance?.facing ?? 'left',...(instance ? {instanceId:instance.id} : {})};
    this.settlementOpen=false;this.emit();
  }
  selectPlacementLot(lot:string) {
    if (!this.placement || this.view !== 'island' || this.modal !== 'none') return;
    const error=validLot(this.progress,this.placement.type,lot,this.placement.instanceId);
    if (error) {this.toast(error);return;}
    this.placement={...this.placement,lot};this.emit();
  }
  flipPlacement() {if (this.modal === 'none' && this.view === 'island' && this.placement) {this.placement={...this.placement,facing:this.placement.facing === 'left' ? 'right' : 'left'};this.emit();}}
  cancelPlacement() {this.placement=null;this.emit();}
  confirmPlacement() {
    const draft=this.placement;if (!draft || this.view !== 'island' || this.modal !== 'none') return;
    if (draft.instanceId) {
      const result=placeBuilding(this.progress,draft.instanceId,draft.lot,draft.facing);
      if (result.ok) this.placement=null;
      this.apply(result);return;
    }
    const id=globalThis.crypto?.randomUUID?.() ?? 'building-'+Date.now()+'-'+Math.random().toString(36).slice(2);
    const result=beginConstruction(this.progress,{id,type:draft.type,style:draft.style,lot:draft.lot,facing:draft.facing},Date.now());
    if (result.ok) {this.placement=null;this.selectedInstance=id;}
    if (this.apply(result)) this.recordTutorial('choose-style');
  }
  build() {this.openPlacement();}
  buy(material:Material) {if (this.view === 'island' && this.modal === 'none') this.apply(purchaseMaterials(this.progress,material));}
  changePolicy(policy:Policy) {if (this.view === 'island' && this.modal === 'none') this.apply(setPolicy(this.progress,policy));}
  upgrade(id:string) {if (this.view === 'island' && this.modal === 'none') this.apply(upgradeTownHall(this.progress,id));}
  trade(offerId:string) {if (this.view === 'island' && this.modal === 'none') this.apply(trade(this.progress,offerId));}
  unloadCargo() {if (this.view !== 'island' || this.modal !== 'none') return; const next=unloadCargo(this.progress); const changed=next!==this.progress; if (changed) {this.progress=next;this.persist();} this.toast(changed?'Harbor supplies unloaded where storage has room.':'Storage is full; harbor crates are safe.');}
  assignWorker(citizenId:string,jobId:string|null) {if (this.view === 'island' && this.modal === 'none') this.apply(assignCitizen(this.progress,citizenId,jobId));}
  dismantle(id:string) {
    if (this.view !== 'island' || this.modal !== 'none') return;
    const result=dismantleBuilding(this.progress,id);
    if (result.ok) {if (this.selectedInstance===id) this.selectedInstance=null;if (this.placement?.instanceId===id) this.placement=null;}
    this.apply(result);
  }
  inspectCitizen(id:string) {this.selectedCitizen=id;this.emit();}
  private updateSettlement() {
    const now=Date.now();let changed=false;
    if (this.progress.buildings.some(b => b.state === 'building' && now >= b.completesAt)) {
      const result=finishConstruction(this.progress,now);
      if (result.ok) {this.progress=result.progress;changed=true;this.recordTutorial('build');this.notice=result.message;this.scheduleNoticeClear();}
    }
    const next=advanceSettlement(this.progress,now);
    if (next !== this.progress) {this.progress=next;changed=true;}
    if (changed) {this.persist();this.emit();}
    else if (now-this.lastConstructionUpdate>=100) {this.lastConstructionUpdate=now;this.emit(false);}
  }
  startRun() {
    if (!this.ready || this.error || this.modal !== 'none' || this.view === 'run') return;
    this.placement=null;
    {const result=selectTarget(this.progress,this.selectedType);if (result.ok) {this.progress=result.progress;this.persist();}}
    this.recordTutorial('welcome','choose-style',...(this.view === 'results' ? ['results' as const] : []));
    this.settlementOpen=false;this.run=createRun(this.progress);this.view='run';this.notice='';this.lastHudUpdate=0;this.emit();
  }
  move(direction:-1|1) {if (this.view !== 'run' || !this.run || this.modal !== 'none') return;const before=this.run;this.run=moveRun(this.run,direction);if (before!==this.run && this.recordTutorial('first-run')) this.emit();}
  jump() {if (this.view !== 'run' || !this.run || this.modal !== 'none') return;const before=this.run;this.run=jumpRun(this.run);if (before!==this.run && this.recordTutorial('first-run')) this.emit();}
  tick(dt:number) {
    this.updateSettlement();
    if (this.view !== 'run' || !this.run || this.run.phase !== 'active') return;
    this.run=advanceRun(this.run,dt);
    if (this.run.phase === 'ended') {this.finishRun();return;}
    if (this.run.elapsed-this.lastHudUpdate>.08 || this.run.elapsed<this.lastHudUpdate) {this.lastHudUpdate=this.run.elapsed;this.emit(false);}
  }
  bankRun() {if (this.view !== 'run' || !this.run || this.modal !== 'none') return;this.run=returnRun(this.run);this.finishRun();}
  private finishRun() {
    if (!this.run || this.run.phase !== 'ended') return;
    const result=settleRun(this.progress,this.run);
    if (result.ok) {this.progress=result.progress;this.persist();} else this.notice=result.message;
    this.recordTutorial('first-run');this.run={...this.run,phase:'settled'};this.view='results';this.emit();
  }
  pause() {if (this.view === 'run' && this.run?.phase === 'active') {this.run=pauseRun(this.run);this.emit();}}
  resume() {if (this.modal === 'none' && this.view === 'run' && this.run?.phase === 'paused') {this.run=resumeRun(this.run);this.emit();}}
  island() {if (this.modal !== 'none' || this.view === 'run') return;if (this.view === 'results') this.recordTutorial('results');this.view='island';this.settlementOpen=false;this.run=null;this.emit();}
  openHelp() {this.pause();this.modal='help';this.emit();}
  closeModal() {this.modal='none';this.emit();}
  continueSession() {this.writable=false;this.modal='none';this.saveMessage='Session only · previous save preserved';this.emit();}
  freshStart() {
    this.progress=createProgress();this.placement=null;this.selectedType=this.progress.target;this.category=BUILDINGS[this.selectedType].category;
    this.selectedInstance=null;this.selectedCitizen=null;this.run=null;this.view='island';this.settlementOpen=false;this.modal='none';this.writable=true;this.persist(true);this.toast('A fresh coast, a new beginning.');
  }
  readonly bridge:GameBridge={
    read:():Frame=>({
      view:this.view === 'island' ? 'island' : 'run',phase:this.run?.phase ?? 'settled',elapsed:this.run?.elapsed ?? 0,distance:this.run?.distance ?? 0,lane:this.run?.lane ?? 0,jumpHeight:this.run?.jumpHeight ?? 0,
      entities:this.run?.entities.filter(entity=>!this.run!.collectedIds.includes(entity.id)) ?? [],wallet:this.progress.wallet,loot:this.run?.loot ?? {timber:0,stone:0,coins:0},
      buildings:this.progress.buildings,lots:getLots(this.progress),regions:getRegionCount(this.progress),placement:this.placement,selectedInstance:this.selectedInstance,
      settlementOpen:this.compact && this.settlementOpen,simTime:Date.now(),citizens:this.progress.simulation.citizens,stats:this.stats,ship:this.progress.simulation.ship,reducedMotion:this.reducedMotion,
    }),
    tick:dt=>this.tick(dt),move:direction=>this.move(direction),jump:()=>this.jump(),pause:()=>this.pause(),
    selectBuilding:id=>{if(this.view!=='island'||this.modal!=='none')return;const building=this.progress.buildings.find(b=>b.id===id);if (!building) return;this.selectedType=building.type;this.selectedInstance=id;this.category=BUILDINGS[building.type].category;if (building.state==='complete') this.openPlacement(id);else this.openSettlement('catalog');},
    selectLot:id=>this.selectPlacementLot(id),onReady:()=>{this.ready=true;if(this.notice)this.scheduleNoticeClear();this.emit();},onError:message=>{this.error=message;this.emit();},
  };
}
