import { runSpeedAt } from '../model/runPace';
import { getLots, lotOccupant, validLot } from '../model/placement';
import type { IslandController, SettlementPanel } from '../controller';
import { BUILDINGS, BUILDING_IDS, CATEGORIES, MATERIALS, PURCHASES, RUN_SPEED } from '../model/catalog';
import { buildingVisual } from '../game/art';
import { MAP_CAMERA_EVENT } from '../game/islandMap';
import { constructionStage, tradeOffers, canTarget } from '../model/progress';
import type { BuildingType, StyleId, Wallet, Policy, Good, CategoryId, Material } from '../model/types';

type IconName = 'wood' | 'stone' | 'coin' | 'arrow' | 'pause' | 'play' | 'check' | 'jump' | 'help' | 'lock' | 'close' | 'home' | 'island' | 'buildings' | 'run' | 'move' | 'flip' | 'people' | 'heart' | 'water' | 'food' | 'power' | 'ship' | 'leaf' | 'tools';
const paths: Record<IconName, string> = {
  people: '<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m2-17a3 3 0 0 1 0 6m2 11v-3a6 6 0 0 0-2-4"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  water: '<path d="M12 2S4 10 4 15a8 8 0 0 0 16 0C20 10 12 2 12 2Z"/><path d="M8 15c0 2 1 3 3 3"/>',
  food: '<path d="M3 12a9 9 0 0 1 18 0v6a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3Zm4-4 2 4m3-5 2 4m3-3 1 3"/>',
  power: '<path d="m13 2-9 12h7l-1 8 10-13h-7z"/>',
  ship: '<path d="m3 15 9-4 9 4-3 6H6Zm5-2V5h8v8M12 5V2M2 22c3-2 4 2 7 0s4 2 7 0 4 2 6 0"/>',
  leaf: '<path d="M20 3C8 1 2 6 5 15c9 4 15-2 15-12ZM3 21 16 8"/>',
  tools: '<path d="m14 6-8 8m-2-2 8 8m7-17a6 6 0 0 0-7 7l-9 9 2 2 9-9a6 6 0 0 0 7-7l-4 4-3-3z"/>',
  move: '<path d="M12 3v18M3 12h18m-13-5 4-4 4 4m-8 10 4 4 4-4M7 8l-4 4 4 4m10-8 4 4-4 4"/>',
  flip: '<path d="M12 3v18M8 7 3 12l5 5V7Zm8 0 5 5-5 5V7Z"/>',
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
  '<span class="resource ' + kind + '" aria-label="' + value + ' ' + label + '">' + icon(kind) + '<strong>' + (value>=1000?(value/1000).toFixed(1)+'k':value) + '</strong><span class="resource-name">' + label + '</span></span>';

export function mountUI(host:HTMLElement,c:IslandController) {
  host.innerHTML='<main class="game-shell"><div id="world" role="img" aria-label="Your coastal island and running course"></div><div id="interface"></div><div id="live-message" class="sr-only" role="status" aria-live="polite"></div></main>';
  const ui=host.querySelector<HTMLElement>('#interface')!;
  const live=host.querySelector<HTMLElement>('#live-message')!;
  let lastNotice='';
  let deferredRender=false;
  const num=(value:number)=>value>=1_000 ? (value/1_000).toFixed(value<10_000?1:0)+'k' : String(Math.floor(value));
  const button=(action:string,label:string,cls='button primary',attrs='')=>`<button class="${cls}" data-action="${action}" ${attrs}>${label}</button>`;
  const categoryIcon:Record<CategoryId,IconName>={civic:'people',production:'tools',utility:'power',expansion:'home'};
  const art=(type:BuildingType,style:StyleId,cls='')=>{
    const visual=buildingVisual(type,style);
    const cell=visual.cell;
    return `<span class="building-art ${cell===undefined?'single-art':'atlas-art'} ${cls}" role="img" aria-label="${escape(BUILDINGS[type].name)} design"><img src="${visual.path}" alt="" ${cell===undefined?'':`style="left:${-(cell%2)*100}%;top:${-Math.floor(cell/2)*100}%"`}/></span>`;
  };
  const loot=(wallet:Wallet)=>resource('wood',wallet.timber,'timber')+resource('stone',wallet.stone,'stone')+resource('coin',wallet.coins,'coins');
  const terrainText=(type:BuildingType)=>({any:'Any open grass space',forest:'A space beside the forest',coast:'A space along the coast',spring:'A marked hot-spring space',edge:'A space at the territory edge',hill:'A space on the hillside'}[BUILDINGS[type].terrain]);
  const amount=(kind:Material)=>c.progress.wallet[kind];
  const tabs:{id:SettlementPanel;name:string;icon:IconName}[]=[{id:'catalog',name:'Build',icon:'buildings'},{id:'islanders',name:'Islanders',icon:'people'},{id:'production',name:'Supplies',icon:'leaf'},{id:'trade',name:'Trade',icon:'ship'},{id:'council',name:'Council',icon:'island'}];

  function header() {
    const s=c.stats;
    return `<header class="world-header"><div class="header-main"><a href="#" class="settlement-brand" data-action="island">${icon('island')}<span>ISLAND RUSH<span class="brand-dot">.</span><small>PIXEL COAST · TIER ${c.level}</small></span></a><div class="settlement-stock">${(['timber','stone','coins'] as const).map(kind=>`<div class="stock-pill" aria-label="${c.progress.wallet[kind]} ${kind}">${icon(kind==='timber'?'wood':kind==='stone'?'stone':'coin')}<strong>${num(c.progress.wallet[kind])}</strong><small>${kind}</small></div>`).join('')}${button('help',icon('help'),'icon-button','aria-label="How to play"')}</div></div><div class="header-vitals">${button('panel',icon('people')+`<strong>${s.population}/${s.capacity}</strong><span>islanders / homes</span>`,'vital-button','data-panel="islanders"')}${button('panel',icon('heart')+`<strong>${s.happiness}%</strong><span>happiness</span>`,'vital-button','data-panel="islanders"')}${button('panel',icon('water')+`<strong>${s.water}</strong><span>water</span>`,'vital-button '+(s.water<5?'needs-care':''),'data-panel="production"')}${button('panel',icon('food')+`<strong>${s.food}</strong><span>food</span>`,'vital-button '+(s.food<5?'needs-care':''),'data-panel="production"')}</div></header>`;
  }
  function guide() {
    if (!c.guideStep) return '';
    const copy=c.guideStep==='choose-style' ? ['A PLACE TO BEGIN','Two pioneers. A coast of possibilities.','Choose a cottage, gather 30 timber, then choose a building space. Your islanders will need water, food and useful work.'] : c.guideStep==='first-run' ? ['RUN → RETURN → BUILD','Every trip brings your island to life.','Collect floating supplies and use Head home whenever you want. Impacts stop the run; all earlier loot stays yours.'] : ['YOUR FIRST BUILD','Your supplies are ready.','Choose a location and Build here. Watch the foundation, frame and roof become a home.'];
    return `<aside class="settlement-guide"><span class="eyebrow">${copy[0]}</span><strong>${copy[1]}</strong><p>${copy[2]}</p>${button('skip-guide','Skip guide','text-button')}</aside>`;
  }
  function catalog() {
    const definition=c.definition;
    const selected=c.selected;
    const count=c.progress.buildings.filter(b=>b.type===c.selectedType&&b.state==='complete').length;
    const locked=!canTarget(c.progress,c.selectedType);
    const designs=definition.styles;
    const style=selected?.style??c.progress.designs[c.selectedType];
    const pending=selected?.state==='building';
    return `<div class="category-selector" role="group" aria-label="Building categories">${CATEGORIES.map(category=>button('category',icon(categoryIcon[category.id])+`<span>${category.name.split(' & ')[0]}<small>${category.name.split(' & ')[1]??'Buildings'}</small></span>`,'category-button '+(c.category===category.id?'selected':''),`data-category="${category.id}" aria-pressed="${c.category===category.id}"`)).join('')}</div><p class="category-description">${CATEGORIES.find(cat=>cat.id===c.category)!.description}</p><div class="building-catalog">${BUILDING_IDS.filter(id=>BUILDINGS[id].category===c.category).map(type=>{const d=BUILDINGS[type];const total=c.progress.buildings.filter(b=>b.type===type).length;return button('building-type',art(type,c.progress.designs[type])+`<span><strong>${d.name}</strong><small>${d.tier>c.level?'Town Hall tier '+d.tier:total?total+' on your island':'Tier '+d.tier}</small></span>`,'catalog-building '+(type===c.selectedType?'selected':''),`data-type="${type}" aria-pressed="${type===c.selectedType}"`);}).join('')}</div><section class="building-detail" aria-label="Selected building"><div class="detail-heading"><span class="eyebrow">${pending?'CONSTRUCTION IN PROGRESS':selected?'YOUR BUILDING':'YOUR NEXT BUILD'}</span><span class="detail-count">${count} complete · build more</span></div><div class="detail-art">${art(c.selectedType,style)}</div><h2>${definition.name}</h2><p>${definition.description}</p><div class="building-benefit">${icon(categoryIcon[definition.category])}<span>${definition.benefit}</span></div>${pending?`<div class="site-progress" data-build-id="${escape(selected.id)}"><div><strong data-site-stage>Preparing the foundation</strong><span data-site-percent>0%</span></div><progress max="100" value="0" aria-label="Construction progress"></progress></div>`:`<div class="recipe-list">${MATERIALS.filter(kind=>definition.recipe[kind]>0).map(kind=>`<div class="recipe-item ${amount(kind)>=definition.recipe[kind]?'ready':''}">${icon(kind==='timber'?'wood':'stone')}<span>${kind}</span><strong>${amount(kind)} / ${definition.recipe[kind]}</strong></div>`).join('')}</div>`}<p class="terrain-requirement">${icon('island')}${terrainText(c.selectedType)} · 5-second construction</p>${!selected&&designs.length>1?`<fieldset class="settlement-designs"><legend>CHOOSE A DESIGN</legend>${designs.map(design=>button('style',art(c.selectedType,design.id)+`<span>${design.name}</span>`,'design-choice '+(style===design.id?'selected':''),`data-style="${design.id}" aria-pressed="${style===design.id}"`)).join('')}</fieldset>`:''}<details class="build-stages"><summary>How it takes shape</summary><ol>${definition.stages.map(stage=>`<li>${stage}</li>`).join('')}</ol><p>Resources are reserved once when you confirm Build here. Every completed copy contributes to the settlement.</p></details>${locked?`<p class="unlock-note">${icon('lock')}${definition.tier===3?'Upgrade a completed Town Hall to unlock tier 3.':'Complete a Town Hall to unlock tier 2.'} You can gather its supplies in advance.</p>`:''}${selected?.state==='complete'?button('move-building',icon('move')+'Move this building','button secondary',`data-instance="${escape(selected.id)}"`)+button('another','Plan another '+definition.name,'text-button'):''}</section>${guide()}${materialShop()}`;
  }
  function materialShop() {
    return `<section class="settlement-shop" aria-label="Material shop"><span class="eyebrow">A LITTLE EXTRA SUPPLY</span><p>Trade coins for construction materials.</p><div>${MATERIALS.map(kind=>button('buy',`<span>${icon(kind==='timber'?'wood':'stone')}+5 ${kind}</span><strong>${PURCHASES[kind].coins} coins</strong>`,'supply-offer',`data-material="${kind}" ${c.progress.wallet.coins<PURCHASES[kind].coins||amount(kind)+5>c.stats.storageCapacity?'disabled':''}`)).join('')}</div></section>`;
  }
  function islanders() {
    const stats=c.stats;
    const sim=c.progress.simulation;
    const workplaceTypes:BuildingType[]=['rainwater-collector','windmill-bakery','medical-clinic','lumber-yard','archipelago-pier','artisan-workshop','visitor-lodge'];
    const workplaces=c.progress.buildings.filter(b=>b.state==='complete'&&workplaceTypes.includes(b.type));
    return `<section class="village-overview"><span class="eyebrow">PEOPLE MAKE A PLACE</span><h2>Your islanders</h2><p>Individual homes, jobs and daily needs. Water, meals and clinic care keep the settlement well.</p><div class="settlement-metrics"><div><strong>${stats.population}/${stats.capacity}</strong><span>people / housing</span></div><div><strong>${stats.happiness}%</strong><span>happiness</span></div><div><strong>${stats.health}%</strong><span>health</span></div><div><strong>${stats.employed}</strong><span>at work · ${stats.sick} ill</span></div></div>${stats.population>stats.capacity?'<p class="care-note">Your pioneers need homes. Each Cottage houses 4 people; a Terrace Hamlet houses 10.</p>':''}<p class="sim-explanation">Daily life advances every 10 seconds. New islanders arrive every 30 seconds while housing is free. After time away, up to 30 minutes are simulated.</p><div class="citizen-list">${sim.citizens.map(person=>{const home=c.progress.buildings.find(b=>b.id===person.homeId);const job=c.progress.buildings.find(b=>b.id===person.jobId);return `<article class="citizen-card ${person.illness?'needs-care':''}"><div class="citizen-avatar">${icon('people')}</div><div><h3>${escape(person.name)}<small>${person.illness?'Fever · needs care':person.hunger>65?'Hungry':'Settling in'}</small></h3><p>${home?BUILDINGS[home.type].name:'Waiting for a home'} · ${job?BUILDINGS[job.type].name:'Available to work'}</p><div class="citizen-bars"><span>Health <strong>${Math.round(person.health)}%</strong></span><meter min="0" max="100" value="${person.health}" aria-label="${escape(person.name)} health"></meter><span>Hunger <strong>${Math.round(person.hunger)}%</strong></span><meter min="0" max="100" value="${person.hunger}" aria-label="${escape(person.name)} hunger"></meter></div><label class="work-label">Work assignment<select data-citizen="${escape(person.id)}" aria-label="${escape(person.name)} work assignment"><option value="" ${person.jobId?'':'selected'}>Find work automatically</option>${workplaces.map(workplace=>`<option value="${escape(workplace.id)}" ${workplace.id===person.jobId?'selected':''}>${BUILDINGS[workplace.type].name} · ${escape(workplace.id.slice(-4))}</option>`).join('')}</select></label></div></article>`;}).join('')}</div><h3 class="section-subtitle">Visitors</h3>${sim.visitors.length?sim.visitors.map(visitor=>`<div class="visitor-row">${icon('ship')}<span><strong>${escape(visitor.name)}</strong><small>Staying at the lodge · ${visitor.spending} coins spent</small></span><span data-until="${visitor.leavesAt}"></span></div>`).join(''):'<p class="empty-copy">A Visitor Lodge attracts tourists and traveling merchants.</p>'}</section>${events()}`;
  }
  function production() {
    const sim=c.progress.simulation;const stats=c.stats;
    const goodNames:Record<Good,string>={grain:'Grain',flour:'Flour',bread:'Bread',fish:'Fish',water:'Water',planks:'Planks',tools:'Tools'};
    const goodIcons:Record<Good,IconName>={grain:'leaf',flour:'food',bread:'food',fish:'ship',water:'water',planks:'wood',tools:'tools'};
    const working=c.progress.buildings.filter(b=>b.state==='complete'&&['production','utility'].includes(BUILDINGS[b.type].category));
    const overflow=sim.overflow.timber+sim.overflow.stone;
    return `<section class="production-overview"><span class="eyebrow">A LIVING SUPPLY CHAIN</span><h2>Island supplies</h2><p>Workers gather and refine goods while you build or run. Homes grow grain using clean water; the bakery mills flour and bakes bread.</p><div class="goods-grid">${(Object.keys(goodNames) as Good[]).map(good=>`<div>${icon(goodIcons[good])}<strong>${sim.goods[good]}</strong><span>${goodNames[good]}</span></div>`).join('')}</div><div class="settlement-metrics"><div><strong>${stats.power}/${stats.powerDemand}</strong><span>power / demand</span></div><div><strong>${stats.forest}%</strong><span>forest cover</span></div><div><strong>${stats.storageCapacity}</strong><span>capacity per resource</span></div><div><strong>${overflow}</strong><span>harbor overflow</span></div></div><p class="sim-explanation">Storage Depots add 150 capacity each. All runner loot is kept: overflow waits in harbor crates and unloads automatically when there is room.</p>${overflow?button('unload','Unload harbor supplies','button secondary'):''}<h3 class="section-subtitle">Production & infrastructure</h3>${working.length?working.map(b=>`<article class="service-row">${art(b.type,b.style)}<div><strong>${BUILDINGS[b.type].name}</strong><p>${BUILDINGS[b.type].benefit}</p><span class="service-status">${stats.workers[b.id]?stats.workers[b.id]+' worker assigned':['rainwater-collector','lumber-yard','artisan-workshop','windmill-bakery','archipelago-pier'].includes(b.type)?'Needs a worker':'Operational infrastructure'}</span></div></article>`).join(''):'<p class="empty-copy">Begin with a Rainwater Collector, Lumber Yard and Windmill Bakery. Build homes to bring more workers to the island.</p>'}<h3 class="section-subtitle">From raw resources to daily life</h3><ol class="supply-chain"><li>Rainwater is filtered into clean water for people, gardens, bakery and clinic.</li><li>Watered cottage gardens grow grain. The bakery turns grain into flour, then bread.</li><li>Lumber crews log timber and replant. Artisans turn timber into planks, then tools.</li><li>Pier workers catch fish. Cargo ships exchange fish and planks for coins or import stone.</li></ol></section>${events()}`;
  }
  function tradePanel() {
    const sim=c.progress.simulation;const stats=c.stats;
    const hasLodge=c.progress.buildings.some(b=>b.type==='visitor-lodge'&&b.state==='complete');
    return `<section class="trade-overview"><span class="eyebrow">BEYOND YOUR SHORE</span><h2>Harbor & visitors</h2><div class="ship-status">${icon('ship')}<div><strong>${sim.ship.phase==='docked'?'Cargo ship docked':sim.ship.phase==='fogbound'?'Ship waiting in fog':'Cargo boat approaching'}</strong><p>${sim.ship.phase==='docked'?'Trading window ends in ':sim.ship.phase==='fogbound'?'Build a lighthouse or collect navigation charts. Sea fog: '+stats.fog+'%.':'Next scheduled arrival in '}<span data-until="${sim.ship.phase==='docked'?sim.ship.departsAt:sim.ship.arrivesAt}" ${sim.ship.phase==='fogbound'?'hidden':''}></span></p></div></div><p class="sim-explanation">A completed pier receives a ship every 90 seconds, with a 30-second docking window. A lighthouse or enough navigation charts makes the route safe.</p><h3 class="section-subtitle">Cargo & merchant offers</h3><div class="trade-offers">${tradeOffers(c.progress).map(offer=>button('trade',`<strong>${escape(offer.label)}</strong><span>${escape(offer.description)}</span>`,'trade-offer',`data-offer="${escape(offer.id)}" ${offer.available?'':'disabled'}`)).join('')}</div><div class="merchant-note"><strong>Traveling specialists</strong><p>${hasLodge?'The lodge refreshes rare supplies every 2 minutes. Tourists arrive once a minute when the island is welcoming.':'Build a Visitor Lodge to attract tourists and merchants with rare seeds, medicine and navigation charts.'}</p><span>${stats.tourists} visiting · ${sim.rareItems.seeds} rare seeds · ${sim.rareItems.charts} navigation charts</span></div></section>${events()}`;
  }
  function council() {
    const sim=c.progress.simulation;const halls=c.progress.buildings.filter(b=>b.type==='town-hall'&&b.state==='complete');
    const policies:{id:Policy;name:string;text:string}[]=[{id:'balanced',name:'Balanced island',text:'Steady production, ordinary daily needs and forest recovery.'},{id:'harvest',name:'Focused harvest',text:'More timber per crew, with heavier forest use and a happiness cost.'},{id:'wellbeing',name:'Community care',text:'Improved water output, slower hunger and a happiness boost.'},{id:'trade',name:'Open harbor',text:'Better cargo sale prices, more fish and higher visitor spending.'}];
    return `<section class="council-overview"><span class="eyebrow">STEWARD YOUR COAST</span><h2>Island council</h2><p>A Town Hall opens tier 2 and island policies. Upgrade a completed hall to unlock tier 3 and geothermal engineering.</p><div class="tier-summary"><strong>Tier ${c.level}</strong><span>${c.level===1?'Build a Town Hall to open civic services and bridge connections.':c.level===2?'The council is open. Upgrade a Town Hall for advanced power.':'Advanced engineering is unlocked.'}</span></div><div class="policy-list" role="group" aria-label="Island policies">${policies.map(policy=>button('policy',`<strong>${policy.name}${sim.policy===policy.id?icon('check'):''}</strong><span>${policy.text}</span>`,'policy-option '+(sim.policy===policy.id?'selected':''),`data-policy="${policy.id}" aria-pressed="${sim.policy===policy.id}" ${halls.length?'':'disabled'}`)).join('')}</div>${halls.map(hall=>`<div class="hall-upgrade">${art('town-hall',hall.style)}<div><strong>Town Hall · ${hall.level===1?'Tier 2 authority':'Tier 3 authority'}</strong><p>${hall.level===1?'Upgrade: 100 timber + 80 stone. Reserves those resources once.':'Advanced tier unlocked for the whole settlement.'}</p>${hall.level===1?button('upgrade','Upgrade Town Hall','button primary',`data-instance="${escape(hall.id)}" ${c.progress.wallet.timber<100||c.progress.wallet.stone<80?'disabled':''}`):''}</div></div>`).join('')}<h3 class="section-subtitle">Room to keep growing</h3><p class="empty-copy">Each Outpost claims 4 more spaces on its own islet, until all eight grass blocks are open. Every Bridge Link connects a further islet with 16 starter spaces. Build repeated copies whenever you have suitable land and supplies.</p><p class="sim-explanation">${c.progress.buildings.filter(b=>b.state==='complete').length} buildings complete · ${c.progress.buildings.filter(b=>b.state==='building').length} under construction · ${c.bridge.read().regions} connected islets</p></section>${events()}`;
  }
  function events() {
    return `<section class="settlement-events"><h3 class="section-subtitle">Island journal</h3>${c.progress.simulation.events.slice(-6).reverse().map(event=>`<article><span class="journal-dot ${event.kind}"></span><p>${escape(event.text)}</p><time>${new Date(event.at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</time></article>`).join('')}</section>`;
  }
  function panel() {
    const labels={catalog:['YOUR LIVING ISLAND','Build a little more.'],islanders:['PEOPLE & COMMUNITY','A place to belong.'],production:['PRODUCTION & CARE','Keep the island thriving.'],trade:['HARBOR & TRAVELERS','Welcome the wider world.'],council:['ISLAND LEADERSHIP','Shape what comes next.']};
    const copy=labels[c.panel];
    const body=c.panel==='catalog'?catalog():c.panel==='islanders'?islanders():c.panel==='production'?production():c.panel==='trade'?tradePanel():council();
    return `<aside class="settlement-panel ${c.compact?'settlement-screen':''}" aria-label="Settlement"><div class="settlement-panel-header"><div><span class="eyebrow">${copy[0]}</span><h1>${copy[1]}</h1></div>${c.compact?button('close-settlement',icon('close'),'icon-button','aria-label="Close settlement"'):''}</div><nav class="settlement-tabs" aria-label="Settlement sections">${tabs.map(tab=>button('panel',icon(tab.icon)+`<span>${tab.name}</span>`,'settlement-tab '+(tab.id===c.panel?'selected':''),`data-panel="${tab.id}" aria-current="${tab.id===c.panel?'page':'false'}"`)).join('')}</nav><div class="settlement-content">${body}</div><div class="settlement-cta">${c.panel==='catalog'&&!c.selected?button('build',icon('buildings')+(c.canBuild?'Choose a building space':'Preview a location'),'button primary',!canTarget(c.progress,c.selectedType)?'disabled':'')+button('run','Gather supplies'+icon('arrow'),'button secondary'):button('run','Run for supplies'+icon('arrow'),'button primary')}<span>${escape(c.saveMessage)}</span></div></aside>`;
  }
  function navigation() {
    const nav=[['island','island','Island'],['catalog','buildings','Build'],['islanders','people','Village'],['run','run','Run']] as const;
    return `<nav class="village-nav" aria-label="Island navigation">${nav.map(([action,key,label])=>button(action,icon(key)+`<span>${label}</span>`,'village-nav-item '+((action==='island'&&!c.settlementOpen)||(action==='catalog'&&c.settlementOpen&&c.panel==='catalog')||(action==='islanders'&&c.settlementOpen&&c.panel!=='catalog')?'active':''))).join('')}</nav>`;
  }
  function reclaimSpace(id:string) {
    return `<details class="reclaim-space"><summary>Reclaim this building space</summary><p>Dismantling removes this completed building and returns half its timber and stone. Residents keep their identity and can find another home or job. Expansion structures must keep occupied land connected.</p>${button('dismantle','Dismantle and recover supplies','button secondary',`data-instance="${escape(id)}"`)}</details>`;
  }
  function placement() {
    const draft=c.placement!;const d=BUILDINGS[draft.type];const lots=getLots(c.progress).filter(lot=>validLot(c.progress,draft.type,lot.id,draft.instanceId)===null);
    return `<aside class="settlement-placement" aria-label="Building placement"><div class="placement-heading">${art(draft.type,draft.style)}<div><span class="eyebrow">${draft.instanceId?'MOVE YOUR BUILDING':'MAKE IT PART OF YOUR ISLAND'}</span><h2>${d.name}</h2><p>${terrainText(draft.type)}. Tap a highlighted foundation.</p></div></div><div class="lot-select-wrap"><label for="settlement-lot">Available space</label><select id="settlement-lot" aria-label="Available building space"><option value="">Choose on the island</option>${lots.map(lot=>`<option value="${lot.id}" ${lot.id===draft.lot?'selected':''}>Islet ${lot.region+1} · ${lot.name}</option>`).join('')}</select></div><div class="placement-location">${icon('island')}<strong>${escape(getLots(c.progress).find(lot=>lot.id===draft.lot)?.name??'Choose a space')}</strong><span>${draft.instanceId?'Moves cost no supplies':d.recipe.timber+' timber · '+d.recipe.stone+' stone'}</span></div>${button('placement-flip',icon('flip')+'Flip facing','button secondary')}${draft.instanceId?reclaimSpace(draft.instanceId):''}<p class="placement-detail">${draft.instanceId?'The completed building keeps its identity and services.':'Your supplies are reserved only when you choose Build here. Construction takes five seconds.'}</p><div class="placement-actions">${button('placement-cancel','Cancel','button secondary')}${button('placement-confirm',icon('check')+(draft.instanceId?'Place here':'Build here'),'button primary',!draft.instanceId&&!c.canBuild?'disabled':'')}</div>${!draft.instanceId&&!c.canBuild?button('run','Gather missing supplies'+icon('run'),'text-button'):''}</aside>`;
  }
  function islandView() {
    return `${header()}${c.placement?placement():(!c.compact||c.settlementOpen)?panel():`<div class="island-next"><span class="eyebrow">RUN. RETURN. BUILD. THRIVE.</span><p>Run the coast. Build a living island.</p><strong>${c.progress.buildings.length?'Your coast keeps growing.':'Give your pioneers a place to begin.'}</strong>${button('catalog','Explore 16 building types'+icon('arrow'),'button primary')}</div>`}<nav class="map-tools" aria-label="Island map controls">${button('map-out','−','map-tool','aria-label="Zoom island out"')}${button('map-reset',icon('island'),'map-tool','aria-label="Reset island view"')}${button('map-in','+','map-tool','aria-label="Zoom island in"')}<span>Drag to explore</span></nav>${c.compact&&!c.placement?navigation():''}<footer class="settlement-footer"><span>${escape(c.saveMessage)}</span>${button('restart','Start over','text-button')}</footer>`;
  }
  function runHud() {
    const target=c.run?.target??c.progress.target;
    return `<div class="run-info"><span class="eyebrow">JUNGLE COAST / SUPPLY RUN</span><strong>Bringing ${BUILDINGS[target].name.toLowerCase()} to life</strong></div><div class="run-hud" aria-label="Run progress"><div class="timer"><span>DISTANCE</span><strong id="run-distance">0<small>m</small></strong><div class="pace-caption" id="run-pace">1.0× pace</div></div><div class="run-bag"><span>IN YOUR BACKPACK</span><div id="run-loot"></div></div>${button('pause',icon('pause'),'icon-button pause-button','aria-label="Pause run"')}</div><div class="run-objective" aria-label="Current supply goal">${art(target,c.progress.designs[target])}<span>BUILDING YOUR ISLAND<strong id="supply-goal"></strong></span>${button('bank','Head home'+icon('arrow'),'bank-button','aria-label="Return with supplies"')}</div><div class="run-controls" aria-label="Running controls">${button('left','<span class="flip">'+icon('arrow')+'</span><span class="control-name">Left</span><kbd>← A</kbd>','control-button','aria-label="Move left"')}${button('jump',icon('jump')+'<span class="control-name">Jump</span><kbd>SPACE</kbd>','control-button jump-control','aria-label="Jump"')}${button('right',icon('arrow')+'<span class="control-name">Right</span><kbd>D →</kbd>','control-button','aria-label="Move right"')}</div><div class="swipe-tip">Collect what floats · Dodge what stays on the ground</div>${!c.progress.tutorial.skipped&&!c.progress.tutorial.completed.includes('first-run')?`<aside class="run-first-hint" aria-label="First run guidance"><strong>Your first supply run</strong><span>← → / A D to move · Space to jump<br/>On touch: swipe, or use the buttons below.</span>${button('skip-guide','Skip guide','text-button')}</aside>`:''}`;
  }
  function results() {
    if (!c.run) return '';
    const collided=c.run.endReason==='collision';const overflow=c.progress.simulation.overflow;
    return `<section class="modal-card results-card" role="dialog" aria-modal="true" aria-labelledby="result-title"><div class="result-illustration">${icon(collided?'home':'check')}</div><p class="eyebrow">${collided?'THE COAST CAN BE TRICKY':'A RUN WELL SPENT'}</p><h2 id="result-title">${collided?'A bump in the road.':'A run worth bringing home.'}</h2><p>${collided?'The run ends here. Everything you collected is yours to keep.':'You chose your moment. All your collected supplies are stored.'}</p><div class="earned-loot"><span>BROUGHT BACK</span><div>${loot(c.run.loot)}</div></div><div class="banked-loot"><span>STORED ON YOUR ISLAND</span><strong>${c.progress.wallet.timber} timber · ${c.progress.wallet.stone} stone · ${c.progress.wallet.coins} coins</strong></div>${overflow.timber+overflow.stone?`<p class="ready-note">Harbor crates keep ${overflow.timber} extra timber and ${overflow.stone} extra stone safely until storage has room.</p>`:''}<p class="result-guidance">Build another home, support a service, or save for your next island connection.</p><div class="result-actions">${button('island','Return to island'+icon('arrow'))}${button('again','Run again','button secondary')}</div><small class="run-duration">Active running time: ${c.run.elapsed.toFixed(1)}s</small></section>`;
  }
  function modal() {
    if (c.modal==='help') return `<section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="help-title"><p class="eyebrow">A LITTLE ADVENTURE. A LIVING ISLAND.</p><h2 id="help-title">Run. Return. Build. Thrive.</h2><ul class="help-list"><li><strong>Build your way.</strong> Explore four categories and sixteen types. Preview a suitable space, flip facing, and Build here. Copies are repeatable; space and supplies are the limits.</li><li><strong>Run for a purpose.</strong> The endless coast supplies your selected recipe. Speed rises; Head home or a collision banks everything collected. Arrow keys/A/D move; Space/Up/W jumps. Swipe or use the buttons on touch.</li><li><strong>Care for islanders.</strong> Homes, clean water, grain, bread, fish and clinic treatment support individual residents. Use Village to inspect hunger, health and work assignments.</li><li><strong>Grow the community.</strong> A Town Hall opens tier 2 and policies. Its upgrade opens tier 3. Outposts claim ground; bridges connect more islets.</li><li><strong>Welcome the world.</strong> A pier fishes and receives cargo ships. A lighthouse makes docking safe. Lodges bring tourists and rare-item merchants.</li><li><strong>Keep your progress.</strong> The island saves in this browser and URL, including jobs, cargo, construction and services. Up to 30 minutes of settlement time is caught up after absence.</li></ul>${button('close','Back to the coast'+icon('arrow'))}${button('restart','Start over','text-button')}</section>`;
    if (c.modal==='save-recovery') return `<section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="save-title"><h2 id="save-title">A save we couldn’t read.</h2><p>The original data is preserved. Continue for this session or explicitly start a fresh island.</p>${button('session','Play this session')}${button('fresh-confirm','Start a fresh island','button secondary')}</section>`;
    if (c.modal==='restart'||c.modal==='fresh') return `<section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="restart-title"><h2 id="restart-title">Start over?</h2><p>This replaces your saved buildings, islanders, supplies and island progress with a fresh start.</p>${button('reset','Yes, start a fresh island')}${button('close','Keep my island','button secondary')}</section>`;
    if (c.view==='run'&&c.run?.phase==='paused') return `<section class="modal-card pause-card" role="dialog" aria-modal="true" aria-labelledby="pause-title"><div class="result-illustration">${icon('pause')}</div><h2 id="pause-title">The coast can wait.</h2><p>Your courier and backpack are paused. The settlement continues its own daily life.</p>${button('resume','Resume run'+icon('play'))}${button('bank','End run and return','button secondary')}</section>`;
    return '';
  }
  function render(structural=true) {
    if (!structural) {updateHud();return;}
    if(c.modal==='none'&&c.view==='island'&&document.activeElement?.tagName==='SELECT'&&ui.contains(document.activeElement)) {deferredRender=true;updateHud();return;}
    deferredRender=false;
    const focused=document.activeElement as HTMLElement|null;
    const previous=focused?.dataset?{...focused.dataset}:null;
    const scroll=ui.querySelector<HTMLElement>('.settlement-content')?.scrollTop??0;
    const overlay=c.view==='results'?results():modal();
    const world=host.querySelector<HTMLElement>('#world');
    if (world) world.inert=Boolean(overlay||(c.compact&&c.settlementOpen&&c.view==='island'));
    ui.className='interface view-'+c.view+(overlay?' has-overlay':'')+(c.placement?' placing':'');
    ui.innerHTML=(c.view==='island'?islandView():runHud())+(overlay?`<div class="overlay-backdrop">${overlay}</div>`:'')+(!c.ready&&!c.error?`<div class="loading-screen"><span class="loading-island">${icon('island')}</span><p class="eyebrow">ISLAND RUSH</p><h2>Charting your coast…</h2><div class="loading-track"><span></span></div></div>`:'')+(c.error?`<div class="overlay-backdrop"><section class="modal-card" role="alert"><h2>The coast didn’t load.</h2><p>${escape(c.error)}</p><p>Your saved island is preserved.</p>${button('retry','Try again')}</section></div>`:'')+(c.notice?`<div class="toast" role="status">${icon('check')}${escape(c.notice)}</div>`:'');
    const content=ui.querySelector<HTMLElement>('.settlement-content');if (content) content.scrollTop=scroll;
    updateHud();
    if (c.notice!==lastNotice) {live.textContent=c.notice;lastNotice=c.notice;}
    if (overlay) {
      const dialog=ui.querySelector<HTMLElement>('[role="dialog"]');
      const kept=Array.from(dialog?.querySelectorAll<HTMLElement>('button')??[]).find(el=>el.dataset.action===previous?.action);
      (kept??dialog?.querySelector<HTMLElement>('button'))?.focus({preventScroll:true});
    } else if (previous?.action||previous?.citizen) {
      const next=Array.from(ui.querySelectorAll<HTMLElement>('[data-action], [data-citizen]')).find(el=>Object.entries(previous).every(([key,val])=>el.dataset[key]===val));next?.focus({preventScroll:true});
    }
  }
  function updateHud() {
    for (const node of ui.querySelectorAll<HTMLElement>('[data-build-id]')) {
      const building=c.progress.buildings.find(b=>b.id===node.dataset.buildId);if (!building) continue;
      const stage=constructionStage(building,Date.now());
      const label=node.querySelector<HTMLElement>('[data-site-stage]');if (label) label.textContent=stage.stage;
      const percent=node.querySelector<HTMLElement>('[data-site-percent]');if (percent) percent.textContent=stage.percentage+'%';
      const meter=node.querySelector<HTMLProgressElement>('progress');if (meter) meter.value=stage.percentage;
    }
    for (const node of ui.querySelectorAll<HTMLElement>('[data-until]')) node.textContent=Math.max(0,Math.ceil((Number(node.dataset.until)-Date.now())/1000))+'s';
    if (!c.run) return;
    const distance=ui.querySelector<HTMLElement>('#run-distance');if (distance) distance.innerHTML=num(c.run.distance)+'<small>m</small>';
    const pace=ui.querySelector<HTMLElement>('#run-pace');if (pace) pace.textContent=(runSpeedAt(c.run.elapsed)/RUN_SPEED).toFixed(1)+'× pace';
    const bag=ui.querySelector<HTMLElement>('#run-loot');if (bag) bag.innerHTML=loot(c.run.loot);
    const goal=ui.querySelector<HTMLElement>('#supply-goal');const target=c.run.target??c.progress.target;
    if (goal) goal.textContent=MATERIALS.filter(kind=>BUILDINGS[target].recipe[kind]>0).map(kind=>`${Math.min(BUILDINGS[target].recipe[kind],c.progress.wallet[kind]+c.run!.loot[kind])}/${BUILDINGS[target].recipe[kind]} ${kind}`).join(' · ');
  }
  function focusCanvas() {requestAnimationFrame(()=>host.querySelector<HTMLCanvasElement>('canvas')?.focus({preventScroll:true}));}
  function resetPanelScroll() {const el=ui.querySelector<HTMLElement>('.settlement-content');if (el) el.scrollTop=0;}
  ui.addEventListener('click',event=>{
    const target=(event.target as HTMLElement).closest<HTMLElement>('[data-action]');if (!target||target.hasAttribute('disabled')) return;
    event.preventDefault();
    switch(target.dataset.action) {
      case 'category':resetPanelScroll();c.selectCategory(target.dataset.category as CategoryId);break;
      case 'building-type':c.selectType(target.dataset.type as BuildingType);requestAnimationFrame(()=>ui.querySelector<HTMLElement>('.building-detail')?.scrollIntoView({block:'start',behavior:c.reducedMotion?'auto':'smooth'}));break;
      case 'style':c.chooseStyle(target.dataset.style as StyleId);break;
      case 'build':c.build();break;
      case 'move-building':c.openPlacement(target.dataset.instance);break;
      case 'dismantle':c.dismantle(target.dataset.instance!);break;
      case 'another':c.selectType(c.selectedType);break;
      case 'placement-flip':c.flipPlacement();break;
      case 'placement-cancel':c.cancelPlacement();break;
      case 'placement-confirm':c.confirmPlacement();break;
      case 'panel':resetPanelScroll();c.openSettlement(target.dataset.panel as SettlementPanel);break;
      case 'catalog':resetPanelScroll();c.selectedInstance=null;c.openSettlement('catalog');break;
      case 'islanders':resetPanelScroll();c.openSettlement('islanders');break;
      case 'close-settlement':c.closeSettlement();break;
      case 'map-in':case 'map-out':case 'map-reset':window.dispatchEvent(new CustomEvent(MAP_CAMERA_EVENT,{detail:target.dataset.action.slice(4)}));break;
      case 'run':case 'again':c.startRun();focusCanvas();break;
      case 'island':c.island();break;
      case 'buy':c.buy(target.dataset.material as Material);break;
      case 'policy':c.changePolicy(target.dataset.policy as Policy);break;
      case 'upgrade':c.upgrade(target.dataset.instance!);break;
      case 'trade':c.trade(target.dataset.offer!);break;
      case 'unload':c.unloadCargo();break;
      case 'skip-guide':c.skipGuide();break;
      case 'left':c.move(-1);focusCanvas();break;
      case 'right':c.move(1);focusCanvas();break;
      case 'jump':c.jump();focusCanvas();break;
      case 'pause':c.pause();break;
      case 'resume':c.resume();focusCanvas();break;
      case 'bank':c.bankRun();break;
      case 'help':c.openHelp();break;
      case 'close':c.closeModal();break;
      case 'session':c.continueSession();break;
      case 'restart':c.modal='restart';c.emit();break;
      case 'fresh-confirm':c.modal='fresh';c.emit();break;
      case 'reset':c.freshStart();break;
      case 'retry':window.location.reload();break;
    }
  });
  ui.addEventListener('focusout',()=>requestAnimationFrame(()=>{if(deferredRender&&document.activeElement?.tagName!=='SELECT')render();}));
  ui.addEventListener('change',event=>{
    const target=event.target as HTMLSelectElement;
    if (target.id==='settlement-lot'&&target.value) c.selectPlacementLot(target.value);
    if (target.dataset.citizen) c.assignWorker(target.dataset.citizen,target.value||null);
  });
  document.addEventListener('keydown',event=>{
    if (event.key==='Escape') {if (c.modal!=='none') c.closeModal();else if (c.placement) c.cancelPlacement();else if(c.compact&&c.settlementOpen)c.closeSettlement();else c.pause();}
    if (event.key!=='Tab') return;
    const dialog=ui.querySelector<HTMLElement>('[role="dialog"]');if (!dialog) return;
    const all=Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], select'));
    const first=all[0],last=all.at(-1);
    if (event.shiftKey&&document.activeElement===first) {event.preventDefault();last?.focus();}
    else if (!event.shiftKey&&document.activeElement===last) {event.preventDefault();first?.focus();}
  });
  c.subscribe(render);render();return host.querySelector<HTMLElement>('#world')!;
}
