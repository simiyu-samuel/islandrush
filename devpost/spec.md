---
doc: spec
status: approved
---

# Island Rush — technical specification

Owner-authorized revision, **24 October 2026**: sixteen repeatable building types and detailed settlement simulation. This replaces the old fixed three-building model. [PRD](prd.md) describes the interface and complete building table; [game guide](game-guide.md) records exact rates.

## Stack and ownership

Phaser 4.2.1 handles scenes, texture frames, input and 2D rendering. TypeScript 5.9.3 implements rules and controller state. HTML/CSS supplies semantic controls and management panels. Vite 8.3.5 produces static `dist/`; Vitest 5.0.5 and Playwright 1.64.1 provide deterministic and prepared browser verification. Node >=22.12 is required. Exact versions are pinned in package metadata.

`controller.ts` is the command boundary for shared persistent progress, local view/panel/preview state and the active run. Scenes consume `GameBridge` snapshots and dispatch intent. Neither a sprite nor result button independently grants rewards. `ui/app.ts` renders Build, Islanders, Supplies, Trade and Council, responsive navigation, dialogs, progress and notices.

## Persistent model

`Progress.version` is **2**, stored under the retained key `island-rush:progress:v1` so existing installations can be discovered. It contains:

- wallet: timber, stone and coins;
- `BuildingInstance[]`: unique instance ID, type, style, lot, facing, state, start/deadline and level; narrowly defined legacy marker for migrated structures;
- all sixteen design preferences, selected supply target, tutorial flags and settled-run ledger;
- simulation clock/tick, named citizens, goods, forest, overflow, policy, tourists, offers, rare items, ship, bounded journal and festival state.

A building type is catalogue content; an instance is a separately occupied, funded and functioning copy. No type-level built boolean or all-three-buildings completion authority remains. Technology tier derives from completed halls: none →1; any hall →2; any level-2 hall →3.

`catalog.ts` is the single source for sixteen recipes, three tiers, terrain, stages, variants and run/shop tuning. [The PRD table](prd.md#building-catalogue) mirrors it. Ordinary recipes cost timber/stone only; Town Hall upgrading separately charges 100/80 and immediately raises that hall's level to two.

## Placement and expansion

`placement.ts` defines eight painted macroblocks per region, each split into four small isometric cells. Canonical lot IDs are `region:block:cell`. A region begins with the first four blocks unlocked (sixteen foundations); each completed outpost in that region adds one block, capped at eight blocks/thirty-two cells. The global count of completed bridges adds regions with no fixed region cap.

`getLots`, `validLot`, `lotOccupant` and `availableLots` derive unlocks, tag compatibility and occupancy. Tags are forest, coast, spring, edge and hill; `any` accepts clear open ground. Unfinished and finished instances both reserve a cell. Migrated legacy structures retain their approved prior block and may keep its access; new construction must satisfy ordinary terrain rules.

Controller placement is a local draft `{type,style,lot,facing,instanceId?}`. Selection/flip/cancel does not save or charge. Confirmation revalidates current progress. New building confirmation creates a unique instance, deducts once and persists five-second start/deadline; multiple sites may coexist. Completed movement keeps its ID and costs nothing, checks terrain/occupancy and refuses to close occupied expansion ground. Dismantle removes a completed instance through the explicit reclaim-space action, salvages floor-half its base recipe and rejects outpost/bridge removal that would strand occupied sites.

`islandMap.ts` positions region tiles in connected serpentine rows and bounds drag/zoom across the growing world. `IslandScene` draws repeated terrain regions, micro-foundations, instance sprites, construction stages/percentages, individual resident markers and ship state. The map has no floating building-name labels. Tapping a completed structure enters its move preview; tapping an active site opens its construction information.

## Simulation clock and people

`simulation.ts` uses **10,000ms ticks**, at most **180 catch-up ticks**. `advanceSettlement` ignores invalid/backward/no-full-tick times, clones progress, skips excess offline time, executes a bounded thirty-minute window and unloads safe cargo. Controller updates construction deadlines before settlement ticks and persists resulting state. Runner pause does not stop wall-clock settlement advancement.

Fresh simulation: two named citizens; 20 grain, 20 bread, 40 water; zero other goods, zero construction wallet; forest 100; Balanced policy. Goods are grain, flour, bread, fish, water, planks and tools.

Homes assign 4 slots per cottage and 10 per hamlet. Jobs allow one citizen per completed workplace, preserve valid assignments, then fill collectors, bakeries, clinics, lumber yards, piers, workshops and lodges in that priority. Explicit reassignment can swap a displaced worker. Citizens with health <=25 work only on alternate ticks. One newcomer arrives every third tick while housing capacity remains.

Hunger rises 3 each tick (2 under Wellbeing). At >=15, one bread or fish reduces hunger by 20; each citizen uses one water if available. Hunger >65 or no water is a shortage: health falls by 5, otherwise healthy citizens gain 2 and fevered citizens lose 2. Health is clamped 10–100. Deterministic shortage checks may set fever at health <=65 when no staffed watered clinic prevents it. A staffed clinic treats the least healthy: 2 patients/+10 health without enough power or 4/+16 with enough, one water each. Treated fever clears at >=65; medicine clears current fevers and adds 30 health. No mortality or person-to-person contagion model is implemented.

## Production, power and community

Each working building processes once per tick; resource use is explicit and capacities are checked. Collectors add 8 water (10 Wellbeing). Forest regrows 2 (0.25 Harvest), up to 100. A yard with forest >=3 adds 3 timber, or 4 with tools, or 5 under Harvest, consuming 2 or 5 forest respectively. Workshops prioritize 2 planks →1 tool on every third tick; otherwise 2 timber →2 planks. Bakeries prioritize flour+water →4 bread; otherwise 2 grain →3 flour. Piers add 3 fish (4 Trade). Occupied cottages use one water to grow two grain (three with seeds).

Storage is 150 plus 150 per completed depot for **each** material/good. Produced stock caps at capacity. Coins are outside this per-material cap. Runner overflow is retained in `simulation.overflow`; `unloadCargo` transfers it into room opened by spending/depots. This does not create a second construction wallet.

Each generator provides 12 power. Each hamlet, clinic and upgraded hall demands 2. A deficit affects happiness and clinic treatment rather than imposing an invented universal power gate. Happiness derives from hunger, homelessness, plazas (capped contribution), policy, power deficit and recent festival. Plazas can spend 3 food +3 water every 120 seconds to produce a forty-second boost. Policies require a completed Town Hall; production effects are implemented directly, not by changing catalogue descriptions.

## Tourists, merchants and cargo

Every sixth tick, lodge capacity (3 tourists/lodge), happiness >=20 and available room permit one tourist arrival. The stay lasts ninety seconds. Spend on arrival is 6 coins, or 9 under Trade, plus 3 when a lodge is staffed. Every twelfth tick with a lodge refreshes seed/medicine/chart offers with finite quantities. Seed crates cost 20, add ten grain and improve gardens; medicine costs 15; charts cost 25 and remove 25 fog each. A lighthouse removes 100 fog; fog clamps at zero.

A persisted ship records phase, progress, arrival/departure deadlines, target region and visit count. The first arrival is now+90 seconds; subsequent cycles repeat every ninety seconds with a thirty-second docking window. With a pier and fog <=25 it docks; unsafe fog produces `fogbound`. Visits rotate piers. Trades validate current docking/stock/capacity: sell 5 fish for 10 coins, 5 planks for 15 coins (floor 1.5× under Trade), or import 10 stone for 12 coins. Merchant purchases validate live stock/coins and lodge presence. Journal retains the latest thirty events.

## Endless runner

`run.ts` snapshots target/materials and creates a unique run ID/seed. `runPace.ts` analytically integrates speed 18+0.2×active-seconds, capped at 34 after eighty seconds, and inverts distance to contact time. Lane interpolation, jump clearance and contact ordering remain in active-time space. Pickups grant five material units or one coin; collision processes before a pickup at the same contact distance and prevents later collection.

Course generation is deterministic by row/range with stable entity IDs. Rows stream ahead; passed entities/collected IDs are pruned to bound active memory. Later hazards occur every row instead of two out of three, leaving clear lanes. Active runs are runtime-only and never restored after reload.

`returnRun` handles active/paused voluntary return. The controller uses the same once-only `settleRun` ledger for return and collision before displaying results. Materials above current storage capacity become safe harbor overflow. Paused/focus-lost courier time freezes until explicit Resume; the separate settlement clock continues.

`Boardwalk`/`RunScene` preserve the coastal jungle panorama and distant island, continuous narrow desktop trail, full phone lane visibility, floating collectibles, grounded obstacles and depth exponent 1.6. Foliage moves at 48% route speed with full bounding boxes outside trail edges. Projection recalculates on resize without resetting run state.

## Original artwork and accessibility

Four original transparent 2×2 atlases supply all sixteen type frames. `art.ts` shares path/cell metadata between Phaser and HTML catalogue previews. Boot independently alpha-trims each cell; original generated PNGs remain byte-exact and retain real alpha. Legacy six style assets are still loaded. Prompts, sources, hashes and cell bounds are recorded in [the v4 art record](../design/settlement-art-v4.md) and [manifest](../public/assets/manifest.json).

HTML provides semantic buttons, labels, space/job menus, result and fresh-start confirmation dialogs, keyboard focus containment, notices and polite announcements. Motion respects reduced-motion preference. Desktop shows a side panel; compact screens use separate management views and bottom navigation. Browser accessibility and responsive playtesting are verification tasks, not established by source alone.

## Save validation and migration

`save.ts` validates exact version-2 keys, finite safe integer balances/timestamps, known types/styles, unique instance/lot/citizen/job IDs, matching construction duration, unlocked terrain, valid home/job references, goods, policies, ship phase/timing/region and bounded journal. Commands validate latest state before applying resource changes.

A valid version-1 save migrates in memory: home →Pioneer Cottage, workshop →Artisan Workshop, lighthouse lookout →Coastal Lighthouse, watchtower lookout →Border Outpost. Preserve balances, style/facing/block, completed or pending five-second deadlines, tutorial and settled-run IDs. Legacy records occupy cell zero of the corresponding old block. The first version-2 write must successfully copy the untouched old JSON to `island-rush:progress:v1:backup:v1` (or a timestamped backup if distinct prior data exists) **before** replacing it. Backup failure leaves the original untouched and the migrated island playable in-session. Unreadable saves remain preserved until explicit fresh-start confirmation.

Save reads/writes are caught; failures show truthful session-only status. Reset replaces progress only after explicit confirmation. Localhost/public origins are separate stores; no cross-device sync is promised.

## Verification and delivery

Run `npm run typecheck`, meaningful model/controller/geometry tests and `npm run build`; collect or execute prepared browser journeys only through allowed browser access. Cover repeat/concurrent construction, tier/terrain/occupancy, move/dismantle expansion safety, production/needs/health, scheduled trade, once-only run credit, overflow and valid/invalid migration including failed backups.

Current results, remaining player/device review, publication and submission status are recorded in [checklist.md](checklist.md), [deployment.md](deployment.md) and [shipping.md](shipping.md). This specification does not claim a fixed test count, completed browser execution, fresh player approval or publication of the new revision.
