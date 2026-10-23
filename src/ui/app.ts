import type { IslandController } from '../controller';
import { BUILDINGS, RUN_DURATION } from '../model/catalog';
import type { StyleId, Wallet } from '../model/types';

type IconName = 'wood' | 'stone' | 'coin' | 'arrow' | 'pause' | 'play' | 'check' | 'jump' | 'help' | 'lock' | 'close' | 'home' | 'island' | 'buildings' | 'run';
const paths: Record<IconName, string> = {
  island: '<path d="M3 20c4-2 14-2 18 0M4 16c3-2 13-2 16 0m-9-1 3-12m-1 4c-4-4-8-1-8 1 4-1 6 1 8 2m1-3c3-4 7-2 7 0-3-1-5 0-8 3"/>',
  buildings: '<path d="m3 10 6-6 6 6M5 8v12h8V8m0 4 4-4 4 4m-6-2v10h5V10M8 20v-6h3v6"/>',
  run: '<circle cx="15" cy="4" r="2"/><path d="m11 8 4 3 4-1M6 10l5-2-2 6 5 3 1 5m-6-8-3 5H2"/>',
  wood: '<path d="m4 10 10-6 7 5-10 6z"/><path d="m4 10 0 6 7 5V15m0 6 10-6V9M9 7l7 5"/>',
  stone: '<path d="m4 16 2-9 9-4 6 7-3 10-10 1z"/><path d="m6 7 7 6 8-3M13 13l-5 8m5-8 5 7"/>',
  coin: '<ellipse cx="12" cy="12" rx="8" ry="9"/><path d="m12 7 1.4 3 3.1.5-2.3 2.2.6 3.1-2.8-1.5-2.8 1.5.6-3.1-2.3-2.2 3.1-.5z"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  play: '<path d="m8 5 11 7-11 7z"/>',
  check: '<path d="m5 12 5 5L20 6"/>',
  jump: '<path d="M12 20V4m-6 6 6-6 6 6"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3v.2"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v2"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  home: '<path d="m3 11 9-8 9 8M6 9v12h12V9m-9 12v-7h6v7"/>',
};
export const icon = (name: IconName, className = '') =>
  '<svg class="icon ' + className + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths[name] + '</svg>';
const escape = (text: string) => text.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
const resource = (kind: 'wood' | 'stone' | 'coin', value: number, label: string) =>
  '<span class="resource ' + kind + '" aria-label="' + value + ' ' + label + '">' + icon(kind) + '<strong>' + value + '</strong><span class="resource-name">' + label + '</span></span>';

export function mountUI(host: HTMLElement, c: IslandController) {
  host.innerHTML = '<main class="game-shell"><div id="world" role="img" aria-label="Your coastal island and running course"></div><div id="interface"></div><div id="live-message" class="sr-only" role="status" aria-live="polite"></div></main>';
  const ui = host.querySelector<HTMLElement>('#interface')!;
  const live = host.querySelector<HTMLElement>('#live-message')!;
  let lastNotice = '';
  const loot = (wallet: Wallet) => resource('wood', wallet.timber, 'timber') + resource('coin', wallet.coins, 'coins');
  const button = (action: string, label: string, className = 'button primary', extra = '') =>
    '<button class="' + className + '" data-action="' + action + '" ' + extra + '>' + label + '</button>';

  function construction() {
    const built = c.progress.buildings.home.built;
    const chosen = c.progress.buildings.home.style;
    const amount = c.progress.wallet.timber;
    const pct = Math.min(100, amount / 30 * 100);
    const building = c.constructionProgress !== null;
    return '<aside class="construction-panel" aria-label="Home construction">' +
      '<div class="panel-top"><span class="eyebrow">YOUR SETTLEMENT</span><span class="plot-number">01 / 03</span></div>' +
      '<div class="project-tabs" aria-label="Settlement projects">' +
      button('home', icon('home') + 'Home', 'project-tab selected', 'aria-current="true"') +
      button('workshop', icon(built ? 'check' : 'lock') + 'Workshop', 'project-tab') +
      button('lookout', icon(built ? 'check' : 'lock') + 'Lookout', 'project-tab') + '</div>' +
      (built
        ? '<div class="home-complete"><span class="complete-seal">' + icon('check') + '</span><p class="eyebrow">A PLACE OF YOUR OWN</p><h2>Welcome home.</h2><p>Your chosen home is part of the island now. Level 2 is unlocked.</p><img src="/assets/buildings/home-' + chosen + '-v1.png" alt="Your completed ' + (chosen === 'cottage' ? 'coast cottage' : 'palm bungalow') + '" /><div class="unlock-note">' + icon('lock') + '<span>Next landmarks<br/><strong>Workshop &amp; Lookout</strong></span></div></div>'
        : building
          ? '<div class="construction-status"><span class="construction-symbol">' + icon('buildings') + '</span><p class="eyebrow">YOUR HOME IS TAKING SHAPE</p><h2>Building in progress</h2><p data-construction-stage>Laying the foundation</p><div class="construction-meter" role="progressbar" aria-label="Construction progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span data-construction-fill></span></div><strong><span data-construction-seconds>5</span>s remaining</strong><p class="construction-paid">' + icon('check') + 'Materials reserved · paid once</p></div>'
          : '<div class="project-copy"><h2>Coastal home</h2><p>Every island starts somewhere.<br/>Choose a little place to call yours.</p></div><fieldset class="style-picker"><legend>CHOOSE YOUR DESIGN</legend><div class="style-options">' +
          BUILDINGS.home.styles.map(style => '<button data-action="style" data-style="' + style.id + '" class="style-option ' + (chosen === style.id ? 'chosen' : '') + '" aria-pressed="' + (chosen === style.id) + '"><span class="style-image"><img src="/assets/buildings/home-' + style.id + '-v1.png" alt="" />' + (chosen === style.id ? '<span class="chosen-tick">' + icon('check') + '</span>' : '') + '</span><strong>' + style.name + '</strong></button>').join('') +
          '</div></fieldset><div class="material-goal"><div><span>' + icon('wood') + 'Timber needed</span><strong>' + Math.min(amount,30) + '<small> / 30</small></strong></div><div class="progress-track" role="progressbar" aria-label="Home timber" aria-valuemin="0" aria-valuemax="30" aria-valuenow="' + Math.min(amount,30) + '"><span style="width:' + pct + '%"></span></div><p>' + (amount >= 30 ? 'All supplies ready. Let’s build.' : (30-amount) + ' more timber to bring it to life.') + '</p></div>' +
          button('build', icon('home') + 'Build your home' + (amount < 30 ? icon('lock') : icon('arrow')), 'button build-button', amount < 30 ? 'disabled' : '') +
          '<p class="unlock-caption">Finish this home to unlock level 2</p>') +
      '<div class="panel-run">' + button('run', (built ? 'Run for coins' : 'Gather supplies') + icon('arrow'), 'button primary', building ? 'disabled' : '') + '<span>' + icon('play') + '60-second coastal run</span></div></aside>';
  }


  function mobileNavigation() {
    const pending = Boolean(c.progress.pendingConstruction);
    return '<nav class="bottom-nav" aria-label="Island navigation">' +
      button('island-nav', icon('island') + '<span>Island</span>', 'nav-item ' + (!c.settlementOpen ? 'active' : ''), !c.settlementOpen ? 'aria-current="page"' : '') +
      button('buildings-nav', icon('buildings') + '<span>Buildings</span>' + (!c.progress.buildings.home.built && c.progress.wallet.timber >= 30 && !pending ? '<i class="nav-ready" aria-label="Ready to build"></i>' : ''), 'nav-item ' + (c.settlementOpen ? 'active' : ''), c.settlementOpen ? 'aria-current="page"' : '') +
      button('run-nav', icon('run') + '<span>Run</span>', 'nav-item nav-run', pending ? 'disabled' : '') + '</nav>';
  }

  function buildingsScreen() {
    return '<section id="buildings-screen" class="buildings-screen" role="region" aria-label="Buildings">' +
      '<header class="sheet-header"><div><p class="eyebrow">MAKE IT YOUR OWN</p><h2>Your settlement</h2></div>' + button('close-buildings', icon('close'), 'icon-button', 'aria-label="Close buildings"') + '</header>' +
      '<div class="sheet-wallet">' + resource('wood',c.progress.wallet.timber,'timber') + resource('coin',c.progress.wallet.coins,'coins') + '<span>Level ' + c.level + '</span></div>' +
      '<div class="sheet-scroll">' + construction() + '<div class="sheet-settings"><span>' + icon('check') + escape(c.saveMessage) + '</span>' + button('restart','Start over','text-button') + '</div></div>' +
      '<div class="sheet-cta">' + button('run', (c.progress.buildings.home.built ? 'Run for coins' : 'Gather supplies') + icon('arrow'), 'button primary', c.progress.pendingConstruction ? 'disabled' : '') + '</div></section>';
  }

  function islandGoal() {
    const pending = c.constructionProgress !== null;
    const built = c.progress.buildings.home.built;
    return '<div class="island-goal-wrap">' + button('buildings-nav',
      '<span class="goal-icon">' + icon(pending ? 'buildings' : built ? 'check' : 'home') + '</span><span class="goal-copy"><small>' + (pending ? 'BUILDING YOUR HOME' : built ? 'YOUR SETTLEMENT' : 'YOUR NEXT BUILD') + '</small><strong>' + (pending ? '<span data-construction-stage>Laying the foundation</span>' : built ? 'Home complete · Level 2 unlocked' : 'Coastal home · ' + Math.min(30,c.progress.wallet.timber) + ' / 30 timber') + '</strong></span>' + (pending ? '<span class="goal-clock"><span data-construction-seconds>5</span>s</span>' : icon('arrow')),
      'island-goal') + '<span class="mobile-save-note">' + escape(c.saveMessage) + '</span></div>';
  }

  function islandView() {
    return '<div class="island-intro"><span class="eyebrow">' + (c.progress.buildings.home.built ? 'YOUR FIRST CHAPTER' : 'YOUR FIRST LANDING') + '</span><h1>' + (c.progress.buildings.home.built ? 'Look what you<br/>brought home.' : 'A home on<br/>the horizon.') + '</h1><p>' + (c.progress.buildings.home.built ? 'One journey, a handful of supplies,<br/>and a little more of your own world.' : 'A little adventure.<br/>An island that grows with you.') + '</p></div>' +
      (c.compact ? (c.settlementOpen ? buildingsScreen() : islandGoal()) + mobileNavigation() : construction()) +
      '<footer class="island-footer"><span class="coast-label"><span></span>PIXEL COAST · STARTER ISLAND</span><span class="save-status">' + icon('check') + escape(c.saveMessage) + '</span>' + button('restart','Start over','text-button') + '</footer>';
  }

  function runHud() {
    return '<div class="run-info"><span class="eyebrow">COASTAL SUPPLY RUN</span><h2>' + (c.progress.buildings.home.built ? 'A little further.' : 'Bring something home.') + '</h2><p>Collect floating supplies. Dodge or jump over stone blocks.</p></div>' +
      '<div class="run-hud" aria-label="Run progress"><div class="timer"><span>TIME LEFT</span><strong id="time-left">60<small>s</small></strong><div class="time-track"><span id="time-bar"></span></div></div><div class="run-bag"><span>THIS RUN</span><div id="run-loot"></div></div>' + button('pause', icon('pause'), 'icon-button pause-button', 'aria-label="Pause run"') + '</div>' +
      '<div class="run-controls" aria-label="Running controls">' +
      button('left', '<span class="flip">' + icon('arrow') + '</span><span class="control-name">Left</span><kbd>← A</kbd>', 'control-button', 'aria-label="Move left"') +
      button('jump', icon('jump') + '<span class="control-name">Jump</span><kbd>SPACE</kbd>', 'control-button jump-control', 'aria-label="Jump"') +
      button('right', icon('arrow') + '<span class="control-name">Right</span><kbd>D →</kbd>', 'control-button', 'aria-label="Move right"') +
      '</div><div class="swipe-tip">Swipe left / right to move · swipe up to jump</div>';
  }

  function results() {
    if (!c.run) return '';
    const collided = c.run.endReason === 'collision';
    const timber = c.run.loot.timber;
    return '<section class="modal-card results-card" role="dialog" aria-modal="true" aria-labelledby="result-title"><div class="result-illustration">' + icon(collided ? 'home' : 'check') + '</div><p class="eyebrow">' + (collided ? 'THE COAST CAN BE TRICKY' : 'A RUN WELL SPENT') + '</p><h2 id="result-title">' + (collided ? 'A bump in the road.' : 'Time to head home.') + '</h2><p>' + (collided ? 'The run ends here. Everything you collected is yours to keep.' : 'Your minute is up. Your supplies are safely stored.') + '</p><div class="earned-loot"><span>BROUGHT BACK</span><div>' + loot(c.run.loot) + '</div></div><div class="banked-loot"><span>STORED ON YOUR ISLAND</span><strong>' + c.progress.wallet.timber + ' timber · ' + c.progress.wallet.coins + ' coins</strong></div>' +
      (c.progress.wallet.timber >= 30 && !c.progress.buildings.home.built ? '<p class="ready-note">' + icon('check') + 'Your home is ready to build.</p>' : timber > 0 ? '<p class="ready-note">A little closer to your next building.</p>' : '') +
      '<div class="result-actions">' + button('island', 'Return to island' + icon('arrow')) + button('again', 'Run again', 'button secondary') + '</div><small class="run-duration">Active running time: ' + c.run.elapsed.toFixed(1) + 's</small></section>';
  }

  function modal() {
    const paused = c.view === 'run' && c.run?.phase === 'paused';
    if (c.modal === 'help') return '<section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="help-title"><p class="eyebrow">A LITTLE ADVENTURE</p><h2 id="help-title">Run. Return. Build.</h2><ul class="help-list"><li><strong>Choose your home.</strong> Both designs need 30 timber.</li><li><strong>Run the coast for 60 seconds.</strong> Use ← → or A / D to change lanes. Space or ↑ jumps. On touch, swipe or use the buttons.</li><li><strong>Collect what floats.</strong> Each timber bundle gives 5 timber. Each coin gives 1 coin. Stone blocks stay on the ground.</li><li><strong>A collision ends the run.</strong> Your collected loot is banked immediately. Run again or return to build.</li></ul>' + button('close', 'Back to the coast' + icon('arrow')) + '</section>';
    if (c.modal === 'save-recovery') return '<section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="save-title"><p class="eyebrow">YOUR SAVE IS STILL HERE</p><h2 id="save-title">A save we couldn’t read.</h2><p>We’ve left the original data untouched. Play this session without saving, or confirm a fresh island.</p>' + button('session', 'Play this session') + button('fresh-confirm', 'Start a fresh island', 'button secondary') + '</section>';
    if (c.modal === 'restart' || c.modal === 'fresh') return '<section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="restart-title"><p class="eyebrow">A FRESH BEGINNING</p><h2 id="restart-title">Start over?</h2><p>This replaces your saved island, buildings, materials, and coins with a fresh start.</p>' + button('reset', 'Yes, start a fresh island') + button('close', 'Keep my island', 'button secondary') + '</section>';
    if (paused) return '<section class="modal-card pause-card" role="dialog" aria-modal="true" aria-labelledby="pause-title"><div class="result-illustration">' + icon('pause') + '</div><p class="eyebrow">TAKE YOUR TIME</p><h2 id="pause-title">The coast can wait.</h2><p>Your timer and supplies are paused.<br/>Continue whenever you’re ready.</p>' + button('resume', 'Resume run' + icon('play')) + '</section>';
    return '';
  }

  function render(structural = true) {
    if (!structural) { updateHud(); return; }
    const focused = document.activeElement as HTMLElement | null;
    const action = focused?.dataset.action;
    const style = focused?.dataset.style;
    const overlay = c.view === 'results' ? results() : modal();
    const world = host.querySelector<HTMLElement>('#world');
    if (world) world.inert = Boolean(overlay || (c.compact && c.settlementOpen && c.view === 'island'));
    ui.className = 'interface view-' + c.view + (c.compact && c.settlementOpen && c.view === 'island' ? ' sheet-open' : '') + (overlay ? ' has-overlay' : '');
    ui.innerHTML = '<header class="topbar"><a class="brand" href="#" data-action="island" aria-label="Island Rush, return to island"><span class="brand-symbol"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M8 28c5-5 19-5 24 0M5 32c8-4 22-4 30 0" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><path d="m17 25 5-18m-1 5c-5-5-10-1-11 2 6-1 9 1 11 1m1-3c4-5 10-3 11 0-5-1-8 1-12 3" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg></span><span><strong>Island Rush<span class="brand-dot">.</span></strong><small>THE COAST IS YOURS</small></span></a><span class="level-badge"><span class="level-orbit">' + c.level + '</span><span><small>YOUR ISLAND</small><strong>Level ' + c.level + '</strong></span></span><div class="top-resources">' + resource('coin',c.progress.wallet.coins,'coins') + resource('wood',c.progress.wallet.timber,'timber') + button('help',icon('help'),'icon-button','aria-label="How to play"') + '</div></header>' +
      (c.view === 'island' ? islandView() : runHud()) +
      (overlay ? '<div class="overlay-backdrop">' + overlay + '</div>' : '') +
      (!c.ready && !c.error ? '<div class="loading-screen"><span class="loading-island">' + icon('home') + '</span><p class="eyebrow">ISLAND RUSH</p><h2>Charting your coast…</h2><div class="loading-track"><span></span></div></div>' : '') +
      (c.error ? '<div class="overlay-backdrop"><section class="modal-card" role="alert"><h2>The coast didn’t load.</h2><p>' + escape(c.error) + '</p><p>Your saved island is preserved.</p>' + button('retry','Try again') + '</section></div>' : '') +
      (c.notice ? '<div class="toast" role="status">' + icon('check') + escape(c.notice) + '</div>' : '');
    updateHud();
    if (c.notice !== lastNotice) { live.textContent = c.notice; lastNotice = c.notice; }
    if (overlay) {
      const dialog = ui.querySelector<HTMLElement>('[role="dialog"]');
      const previous = action ? dialog?.querySelector<HTMLElement>('[data-action="' + action + '"]') : null;
      (previous ?? dialog?.querySelector<HTMLElement>('button'))?.focus({preventScroll:true});
    } else if (action) {
      ui.querySelector<HTMLElement>('[data-action="' + action + '"]' + (style ? '[data-style="' + style + '"]' : ''))?.focus({preventScroll:true});
    }
  }
  function updateHud() {
    const ratio = c.constructionProgress;
    if (ratio !== null) {
      for (const fill of ui.querySelectorAll<HTMLElement>('[data-construction-fill]')) fill.style.width = (ratio * 100) + '%';
      for (const meter of ui.querySelectorAll<HTMLElement>('[aria-label="Construction progress"]')) meter.setAttribute('aria-valuenow', String(Math.round(ratio*100)));
      for (const seconds of ui.querySelectorAll<HTMLElement>('[data-construction-seconds]')) seconds.textContent = String(c.constructionRemaining);
      const stage = ratio < .25 ? 'Laying the foundation' : ratio < .6 ? 'Raising the frame' : ratio < .9 ? 'Setting the roof' : 'Finishing touches';
      for (const label of ui.querySelectorAll<HTMLElement>('[data-construction-stage]')) label.textContent = stage;
    }
    if (!c.run) return;
    const time = ui.querySelector<HTMLElement>('#time-left');
    if (time) time.innerHTML = Math.max(0,Math.ceil(RUN_DURATION-c.run.elapsed)) + '<small>s</small>';
    const bar = ui.querySelector<HTMLElement>('#time-bar');
    if (bar) bar.style.width = Math.max(0,(RUN_DURATION-c.run.elapsed)/RUN_DURATION*100)+'%';
    const bag = ui.querySelector<HTMLElement>('#run-loot');
    if (bag) bag.innerHTML = loot(c.run.loot);
  }
  ui.addEventListener('click', event => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!target || target.hasAttribute('disabled')) return;
    event.preventDefault();
    switch (target.dataset.action) {
      case 'buildings-nav': c.openSettlement(); requestAnimationFrame(() => ui.querySelector<HTMLButtonElement>('[data-action="close-buildings"]')?.focus({preventScroll:true})); break;
      case 'close-buildings': c.closeSettlement(); requestAnimationFrame(() => ui.querySelector<HTMLButtonElement>('[data-action="buildings-nav"]')?.focus({preventScroll:true})); break;
      case 'island-nav': c.island(); break;
      case 'run-nav': c.startRun(); requestAnimationFrame(() => host.querySelector<HTMLCanvasElement>('canvas')?.focus({preventScroll:true})); break;
      case 'style': c.chooseStyle(target.dataset.style as StyleId); break;
      case 'home': c.selectPlot('home'); break;
      case 'workshop': c.selectPlot('workshop'); break;
      case 'lookout': c.selectPlot('lookout'); break;
      case 'build': c.build(); break;
      case 'run': case 'again': c.startRun(); requestAnimationFrame(() => host.querySelector<HTMLCanvasElement>('canvas')?.focus({preventScroll:true})); break;
      case 'island': c.island(); break;
      case 'left': c.move(-1); host.querySelector<HTMLCanvasElement>('canvas')?.focus({preventScroll:true}); break;
      case 'right': c.move(1); host.querySelector<HTMLCanvasElement>('canvas')?.focus({preventScroll:true}); break;
      case 'jump': c.jump(); host.querySelector<HTMLCanvasElement>('canvas')?.focus({preventScroll:true}); break;
      case 'pause': c.pause(); break;
      case 'resume': c.resume(); requestAnimationFrame(() => host.querySelector<HTMLCanvasElement>('canvas')?.focus({preventScroll:true})); break;
      case 'help': c.openHelp(); break;
      case 'close': c.closeModal(); break;
      case 'session': c.continueSession(); break;
      case 'fresh-confirm': c.modal='fresh'; c.emit(); break;
      case 'restart': c.modal='restart'; c.emit(); break;
      case 'reset': c.freshStart(); break;
      case 'retry': window.location.reload(); break;
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') { if (c.modal !== 'none') c.closeModal(); else if (c.compact && c.settlementOpen) c.closeSettlement(); else c.pause(); }
    if (event.key !== 'Tab') return;
    const dialog = ui.querySelector<HTMLElement>('[role="dialog"]');
    if (!dialog) return;
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]'));
    const first=focusable[0],last=focusable[focusable.length-1];
    if (event.shiftKey && document.activeElement===first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement===last) { event.preventDefault(); first?.focus(); }
  });
  c.subscribe(render);
  render();
  return host.querySelector<HTMLElement>('#world')!;
}
