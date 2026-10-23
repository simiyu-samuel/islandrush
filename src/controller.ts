import { createProgress, getLevel, chooseStyle, beginConstruction, finishConstruction, settleRun, selectTarget, purchaseMaterials, canTarget, isSettlementComplete, completeTutorialStep, skipTutorial } from './model/progress';
import { createRun, advanceRun, moveRun, jumpRun, pauseRun, resumeRun } from './model/run';
import { loadProgress, saveProgress } from './model/save';
import type { ActiveRun, BuildingId, CommandResult, Progress, StorageAdapter, StyleId, Material, TutorialStep } from './model/types';
import { BUILDINGS } from './model/catalog';
import type { Frame, GameBridge } from './game/bridge';

export class IslandController {
  progress: Progress;
  run: ActiveRun | null = null;
  view: 'island' | 'run' | 'results' = 'island';
  selectedPlot: BuildingId = 'home';
  compact = window.matchMedia('(max-width: 959px)').matches;
  settlementOpen = false;
  private lastConstructionUpdate = 0;
  ready = false;
  error = '';
  notice = '';
  saveMessage = 'Progress saves in this browser';
  modal: 'none' | 'save-recovery' | 'fresh' | 'restart' | 'help' = 'none';
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private listeners = new Set<(structural: boolean) => void>();
  private writable = true;
  private lastHudUpdate = 0;
  private storage: StorageAdapter;
  private noticeTimeout: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.storage = {
      getItem: key => window.localStorage.getItem(key),
      setItem: (key, value) => window.localStorage.setItem(key, value),
    };
    const saved = loadProgress(this.storage);
    this.progress = saved.status === 'ok' ? saved.progress : createProgress();
    if (saved.status === 'corrupt') {
      this.writable = false;
      this.saveMessage = 'Unreadable save preserved';
      this.modal = 'save-recovery';
    } else if (saved.status === 'unavailable') {
      this.writable = false;
      this.saveMessage = 'Session only · browser storage unavailable';
    }
    const layout = window.matchMedia('(max-width: 959px)');
    layout.addEventListener('change', event => {
      this.compact = event.matches;
      this.settlementOpen = false;
      this.emit();
    });
    if (this.progress.pendingConstruction && Date.now() >= this.progress.pendingConstruction.completesAt) {
      const finished = finishConstruction(this.progress);
      if (finished.ok) {
        this.progress = finished.progress;
        if (this.progress.buildings.home.built) this.recordTutorial('build');
        this.persist();
      }
    }
    // Existing islands from before guidance was introduced remain returning-player saves.
    if (saved.status === 'ok' && !this.progress.tutorial.skipped && this.progress.tutorial.completed.length === 0 &&
      (this.progress.buildings.home.built || this.progress.settledRunIds.length > 0 || Object.values(this.progress.wallet).some(value => value > 0))) {
      this.progress = skipTutorial(this.progress).progress;
      this.persist();
    }
    this.selectedPlot = this.progress.pendingConstruction?.buildingId ?? this.progress.target ?? 'home';
    window.addEventListener('blur', () => this.pause());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.pause(); });
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    media.addEventListener('change', event => { this.reducedMotion = event.matches; this.emit(); });
  }

  subscribe(listener: (structural: boolean) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  emit(structural = true) { this.listeners.forEach(listener => listener(structural)); }
  toast(message: string) {
    this.notice = message;
    clearTimeout(this.noticeTimeout);
    this.noticeTimeout = setTimeout(() => { this.notice = ''; this.emit(); }, 4200);
    this.emit();
  }
  private persist(overwriteCorrupt = false) {
    if (!this.writable && !overwriteCorrupt) return;
    const result = saveProgress(this.storage, this.progress, { overwriteCorrupt });
    if (!result.ok) {
      this.writable = false;
      this.saveMessage = result.reason === 'corrupt'
        ? 'Previous save preserved · session only'
        : 'Session only · progress could not be saved';
    } else {
      this.writable = true;
      this.saveMessage = 'Saved in this browser';
    }
  }
  private apply(result: CommandResult) {
    if (result.ok) {
      this.progress = result.progress;
      this.persist();
    }
    this.toast(result.message);
    return result.ok;
  }
  private recordTutorial(...steps: TutorialStep[]) {
    if (this.progress.tutorial.skipped) return false;
    let changed = false;
    for (const step of steps) {
      if (this.progress.tutorial.completed.includes(step)) continue;
      this.progress = completeTutorialStep(this.progress, step).progress;
      changed = true;
    }
    if (changed) this.persist();
    return changed;
  }
  get guideStep(): 'choose-style' | 'first-run' | 'build' | null {
    if (this.progress.tutorial.skipped || this.progress.buildings.home.built || this.progress.pendingConstruction) return null;
    if (this.progress.wallet.timber >= BUILDINGS.home.recipe.timber) return 'build';
    return this.progress.tutorial.completed.includes('choose-style') ? 'first-run' : 'choose-style';
  }
  skipGuide() { this.apply(skipTutorial(this.progress)); }
  chooseStyle(style: StyleId) {
    if (this.apply(chooseStyle(this.progress, this.selectedPlot, style))) {
      this.recordTutorial('welcome', 'choose-style');
      this.emit();
    }
  }
  selectPlot(id: BuildingId) {
    if (this.view !== 'island') return;
    if (this.progress.pendingConstruction) {
      this.toast('Wait for the current building to finish.');
      return;
    }
    this.selectedPlot = id;
    if (this.compact) this.settlementOpen = true;
    if (canTarget(this.progress, id)) this.apply(selectTarget(this.progress, id));
    else if (!this.progress.buildings[id].built) this.toast('Build your coastal home to unlock this level 2 project.');
    else this.emit();
  }
  build() {
    if (this.apply(beginConstruction(this.progress, this.selectedPlot))) {
      this.settlementOpen = false;
      this.toast('Construction started. Watch your island come to life.');
    }
  }
  buy(material: Material) {
    if (this.view !== 'island' || this.modal !== 'none') return;
    this.apply(purchaseMaterials(this.progress, material));
  }
  get complete() { return isSettlementComplete(this.progress); }
  get canBuild() {
    if (this.progress.pendingConstruction || !canTarget(this.progress, this.selectedPlot)) return false;
    const recipe = BUILDINGS[this.selectedPlot].recipe;
    return this.progress.wallet.timber >= recipe.timber && this.progress.wallet.stone >= recipe.stone;
  }
  openSettlement() {
    if (this.view !== 'island') return;
    this.recordTutorial('welcome');
    if (this.progress.pendingConstruction) this.selectedPlot = this.progress.pendingConstruction.buildingId;
    else if (this.progress.target && this.progress.buildings[this.selectedPlot].built) this.selectedPlot = this.progress.target;
    this.settlementOpen = true;
    this.emit();
  }
  closeSettlement() { this.settlementOpen = false; this.emit(); }
  get constructionProgress(): number | null {
    const job = this.progress.pendingConstruction;
    return job ? Math.max(0, Math.min(1, (Date.now() - job.startedAt) / (job.completesAt - job.startedAt))) : null;
  }
  get constructionRemaining(): number {
    return Math.max(0, Math.ceil(((this.progress.pendingConstruction?.completesAt ?? Date.now()) - Date.now()) / 1000));
  }
  private updateConstruction() {
    const job = this.progress.pendingConstruction;
    if (!job) return;
    if (Date.now() >= job.completesAt) {
      const home = job.buildingId === 'home';
      if (this.apply(finishConstruction(this.progress)) && home) { this.recordTutorial('build'); this.emit(); }
      return;
    }
    if (Date.now() - this.lastConstructionUpdate >= 100) {
      this.lastConstructionUpdate = Date.now();
      this.emit(false);
    }
  }
  startRun() {
    if (!this.ready || this.error || this.modal !== 'none') return;
    if (this.progress.pendingConstruction) { this.toast('Construction will be finished in a moment.'); return; }
    this.recordTutorial('welcome', 'choose-style', ...(this.view === 'results' ? ['results' as const] : []));
    this.settlementOpen = false;
    this.run = createRun(this.progress);
    this.view = 'run';
    this.notice = '';
    this.emit();
  }
  move(direction: -1 | 1) {
    if (this.view !== 'run' || !this.run || this.modal !== 'none') return;
    const previous = this.run;
    this.run = moveRun(this.run, direction);
    if (this.run !== previous && this.recordTutorial('first-run')) this.emit();
  }
  jump() {
    if (this.view !== 'run' || !this.run || this.modal !== 'none') return;
    const previous = this.run;
    this.run = jumpRun(this.run);
    if (this.run !== previous && this.recordTutorial('first-run')) this.emit();
  }
  tick(dt: number) {
    this.updateConstruction();
    if (this.view !== 'run' || !this.run || this.run.phase !== 'active') return;
    this.run = advanceRun(this.run, dt);
    if (this.run.phase === 'ended') {
      const result = settleRun(this.progress, this.run);
      if (result.ok) {
        this.progress = result.progress;
        this.persist();
      } else this.notice = result.message;
      this.recordTutorial('first-run');
      this.run = { ...this.run, phase: 'settled' };
      this.view = 'results';
      this.emit();
      return;
    }
    if (this.run.elapsed - this.lastHudUpdate > 0.08 || this.run.elapsed < this.lastHudUpdate) {
      this.lastHudUpdate = this.run.elapsed;
      this.emit(false);
    }
  }
  pause() {
    if (this.view === 'run' && this.run?.phase === 'active') {
      this.run = pauseRun(this.run);
      this.emit();
    }
  }
  resume() {
    if (this.view === 'run' && this.run?.phase === 'paused') {
      this.run = resumeRun(this.run);
      this.emit();
    }
  }
  island() {
    if (this.view === 'run' && this.run?.phase === 'active') return;
    if (this.view === 'results') this.recordTutorial('results');
    this.view = 'island';
    this.settlementOpen = false;
    this.run = null;
    this.emit();
  }
  openHelp() { this.pause(); this.modal = 'help'; this.emit(); }
  closeModal() { this.modal = 'none'; this.emit(); }
  continueSession() {
    this.writable = false;
    this.modal = 'none';
    this.saveMessage = 'Session only · previous save preserved';
    this.emit();
  }
  freshStart() {
    this.progress = createProgress();
    this.run = null;
    this.view = 'island';
    this.selectedPlot = 'home';
    this.settlementOpen = false;
    this.modal = 'none';
    this.writable = true;
    this.persist(true);
    this.toast('A fresh coast, a new beginning.');
  }
  readonly bridge: GameBridge = {
    read: (): Frame => ({
      view: this.view === 'island' ? 'island' : 'run',
      phase: this.run?.phase ?? 'settled',
      elapsed: this.run?.elapsed ?? 0,
      distance: this.run?.distance ?? 0,
      lane: this.run?.lane ?? 0,
      jumpHeight: this.run?.jumpHeight ?? 0,
      entities: this.run?.entities.filter(entity => !this.run!.collectedIds.includes(entity.id)) ?? [],
      wallet: this.progress.wallet,
      loot: this.run?.loot ?? { timber: 0, stone: 0, coins: 0 },
      buildings: this.progress.buildings,
      constructionBuilding: this.progress.pendingConstruction?.buildingId ?? null,
      constructionProgress: this.constructionProgress,
      settlementOpen: this.compact && this.settlementOpen,
      selectedPlot: this.selectedPlot,
      reducedMotion: this.reducedMotion,
    }),
    tick: dt => this.tick(dt),
    move: direction => this.move(direction),
    jump: () => this.jump(),
    pause: () => this.pause(),
    selectPlot: id => this.selectPlot(id),
    onReady: () => { this.ready = true; this.emit(); },
    onError: message => { this.error = message; this.emit(); },
  };
  get level() { return getLevel(this.progress); }
}
