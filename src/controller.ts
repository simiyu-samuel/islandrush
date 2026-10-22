import { createProgress, getLevel, chooseStyle, buildBuilding, settleRun, selectTarget } from './model/progress';
import { createRun, advanceRun, moveRun, jumpRun, pauseRun, resumeRun } from './model/run';
import { loadProgress, saveProgress } from './model/save';
import type { ActiveRun, BuildingId, CommandResult, Progress, StorageAdapter, StyleId } from './model/types';
import type { Frame, GameBridge } from './game/bridge';

export class IslandController {
  progress: Progress;
  run: ActiveRun | null = null;
  view: 'island' | 'run' | 'results' = 'island';
  selectedPlot: BuildingId = 'home';
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
  chooseStyle(style: StyleId) { this.apply(chooseStyle(this.progress, 'home', style)); }
  selectPlot(id: BuildingId) {
    if (id !== 'home') {
      this.toast(this.progress.buildings.home.built
        ? 'Level 2 unlocked. Your workshop and lookout are the next projects.'
        : 'Build your coastal home to unlock this level 2 project.');
      return;
    }
    this.selectedPlot = id;
    if (!this.progress.buildings[id].built) this.apply(selectTarget(this.progress, id));
    else this.emit();
  }
  build() {
    if (this.apply(buildBuilding(this.progress, 'home'))) {
      this.toast('Welcome home! Level 2 is now unlocked.');
    }
  }
  startRun() {
    if (!this.ready || this.error || this.modal !== 'none') return;
    // First checkpoint proves home construction; after home, replay remains coin-only.
    const routeProgress = this.progress.buildings.home.built ? { ...this.progress, target: null } : this.progress;
    this.run = createRun(routeProgress);
    this.view = 'run';
    this.notice = '';
    this.emit();
  }
  move(direction: -1 | 1) {
    if (this.view !== 'run' || !this.run || this.modal !== 'none') return;
    this.run = moveRun(this.run, direction);
  }
  jump() {
    if (this.view !== 'run' || !this.run || this.modal !== 'none') return;
    this.run = jumpRun(this.run);
  }
  tick(dt: number) {
    if (this.view !== 'run' || !this.run || this.run.phase !== 'active') return;
    this.run = advanceRun(this.run, dt);
    if (this.run.phase === 'ended') {
      const result = settleRun(this.progress, this.run);
      if (result.ok) {
        this.progress = result.progress;
        this.persist();
      } else this.notice = result.message;
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
    this.view = 'island';
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
      homeBuilt: this.progress.buildings.home.built,
      homeStyle: this.progress.buildings.home.style as 'cottage' | 'bungalow',
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
