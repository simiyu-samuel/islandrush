# Island Rush — player guide

Current source: sixteen-type settlement revision, owner-requested 24 October 2026. The [published game](https://island-rush-six.vercel.app) receives this behavior only when that revision is deployed. See [deployment evidence](deployment.md).

## Your first settlement

Two pioneers arrive with 20 grain, 20 bread and 40 water. Your construction wallet begins empty. Choose a Pioneer Cottage, inspect a design, and run for its 30 timber. The cottage houses four people. Next, support water and food with a Rainwater Collector and Windmill Bakery; build more homes and workplaces as people arrive.

In Build, switch between four categories. Selecting a type explains its purpose, required terrain, resource cost and three construction stages. A locked type can still be selected as a supply-run goal, but cannot be constructed before its tier unlock.

Choose a location, tap a highlighted clear foundation or use the available-space menu, and flip facing if wanted. Previewing costs nothing. **Build here** deducts the recipe once and starts five seconds of foundation, framing and finishing, with a percentage indicator. Different sites can build concurrently. Every copy is its own building and contributes its own supported effect.

Complete a Town Hall to unlock tier 2 and policies. Upgrade a completed level-1 Town Hall for **100 timber + 80 stone** to unlock tier 3. The upgrade is an immediate resource transaction; ordinary new construction still takes five seconds.

## All building types

| Category | Building | Tier | Timber | Stone | Terrain | Function |
| --- | --- | ---: | ---: | ---: | --- | --- |
| Civic & Community | Town Hall | 1 | 45 | 25 | Any open grass | Unlocks tier 2 and policies; upgrade for tier 3. |
| Civic & Community | Community Plaza | 1 | 25 | 15 | Any open grass | Happiness and food/water-funded festivals. |
| Civic & Community | Medical Clinic | 2 | 45 | 40 | Any open grass | Worker and water provide treatment; power improves care. |
| Civic & Community | Visitor Lodge | 2 | 55 | 25 | Any open grass | Tourists, coin spending and rare-item merchant. |
| Resource & Production | Lumber Yard | 1 | 20 | 5 | Forest | Worker harvests timber against regenerating forest. |
| Resource & Production | Artisan Workshop | 1 | 40 | 20 | Any open grass | Worker converts timber into planks, then tools. |
| Resource & Production | Windmill Bakery | 1 | 35 | 15 | Any open grass | Worker mills grain and bakes bread using water. |
| Resource & Production | Archipelago Pier | 2 | 50 | 30 | Coast | Worker catches fish; cargo trading when safely docked. |
| Utility & Infrastructure | Rainwater Collector | 1 | 20 | 10 | Any open grass | Worker produces filtered water. |
| Utility & Infrastructure | Coastal Lighthouse | 2 | 25 | 45 | Coast | Clears fog for safe cargo docking. |
| Utility & Infrastructure | Storage Depot | 1 | 30 | 15 | Any open grass | Adds 150 storage to each material and produced good. |
| Utility & Infrastructure | Geothermal Generator | 3 | 80 | 70 | Spring | Adds 12 power; powered clinics treat more effectively. |
| Settlement Expansion | Pioneer Cottage | 1 | 30 | 0 | Any open grass | Houses 4; occupied watered gardens grow grain. |
| Settlement Expansion | Border Outpost | 1 | 25 | 10 | Edge | Unlocks 4 more spaces on its own islet, up to 32. |
| Settlement Expansion | Terrace Hamlet | 2 | 60 | 45 | Hill | Houses 10 and adds 2 power demand. |
| Settlement Expansion | Bridge Link | 2 | 65 | 40 | Coast | Adds another islet with 16 initially open spaces. |

Every type has an Island original visual design. Additional retained variants are Coast Cottage/Palm Bungalow, Harbor Forge/Maker Studio, Classic Lighthouse and Timber Watchtower for their corresponding types. A visual design does not change the recipe or service.

## Supply runs

Runs have no timer. Speed rises from 18 to 34 route units/second over 80 active seconds, then stays capped. Later course rows contain more frequent hazards, with clear alternatives. Collect floating material bundles (+5 units) and coins (+1); avoid grounded obstacles or jump them. Materials match the selected recipe, including a locked recipe you are preparing for.

- Move: ←/→ or A/D. Jump: Space, ↑ or W. Touch: swipe or use the visible buttons.
- **Head home** ends and banks a run at any moment; collision also banks everything already collected.
- Choose **Return to island** to build or **Run again** for another trip.
- Pause, changing tabs or focus loss freezes the runner; Resume is explicit. Settlement time continues separately.
- Reload discards an unfinished run. Previously banked supplies stay saved.

The material shop sells **5 timber for 10 coins** or **5 stone for 15 coins**, subject to storage space.

## Land, repeat construction and moving

Each islet contains eight landscaped grass blocks with four foundations each: **32 spaces**, with the first **16 open**. A completed Border Outpost opens one additional block (four spaces) on its own islet, up to all eight blocks. A completed Bridge Link adds another islet with 16 open spaces. More bridges keep expanding the archipelago; there is no fixed number of copies or final settlement-completion state.

Terrain tags matter: Lumber Yards need forest, piers/lighthouses/bridges need coast, generators need spring, outposts need edge, and hamlets need hill. Other types use any open grass foundation. Roads, water and landscape are kept clear. Both unfinished construction sites and completed structures occupy their spaces.

Tap a finished building to enter its move preview directly. Select another suitable free space, flip facing if desired, then **Place here**. Moving costs no resources and keeps the building's identity and service. Cancel preserves its original position. Moving an outpost is refused if it would close occupied ground.

Dismantle completed structures through the explicit reclaim-space action to reclaim the foundation and salvage half the timber/stone recipe, rounded down. Removing an outpost or bridge is refused if its removal would strand occupied land. Plan expansion before filling every suitable coastal or edge space.

## Village and supply chains

Open Village/Islanders to inspect each named resident's home, job, hunger, health and fever state. Each workplace takes one worker. Essential jobs fill automatically, retaining manual assignments; use the work menu to reassign citizens. A resident with health at or below 25 works only on alternate simulation ticks.

Settlement life advances every **10 seconds**, including while running or pausing the courier. A newcomer arrives every **30 seconds** while housing has room. After absence, at most **180 ticks / 30 minutes** are simulated. Housing alone does not provide clean water or meals.

Per staffed building per tick, before resident consumption:

| Source | Production or use |
| --- | --- |
| Rainwater Collector | +8 water, or +10 under Wellbeing. |
| Lumber Yard | +3 timber, or +4 when tools are held; Harvest gives +5. Needs forest ≥3. Normal harvest consumes 2 forest; Harvest consumes 5. |
| Artisan Workshop | Normally 2 timber → 2 planks. On every third tick, 2 held planks → 1 tool takes priority. |
| Windmill Bakery | 1 flour + 1 water → 4 bread takes priority; otherwise 2 grain → 3 flour. |
| Archipelago Pier | +3 fish, or +4 under Trade. |
| Occupied Pioneer Cottage garden | Uses 1 water → 2 grain, or 3 with purchased rare seeds. No separate gardener required. |

Forest recovers 2 points per tick, or 0.25 under Harvest, up to 100. Tools are held as a lumber productivity benefit; construction time remains five seconds. Production stops at capacity; supplies already banked from a run are protected by harbor overflow.

Residents gain 3 hunger per tick (2 under Wellbeing), eat one bread or fish at hunger ≥15 to reduce hunger by 20, and each consumes one water when available. Hunger above 65 or missing water damages health. Shortages can cause fever when health reaches 65 or lower without staffed, watered clinic access. Healthy, supplied residents recover health; fever needs attention. Islanders do not die or permanently disappear from illness.

A staffed clinic spends one water per patient, prioritizing the least healthy. With sufficient power, it treats up to four patients by +16 health; without sufficient power, up to two by +10. Fever clears at health ≥65 after treatment. Medicine treats all current fevers and restores 30 health.

Each generator adds **12 power**. Each Hamlet, Clinic and upgraded Town Hall demands **2**. A deficit reduces happiness and clinic efficiency. A Plaza contributes happiness; after 120 seconds, a festival can consume 3 food + 3 water and grant a 40-second happiness boost.

## Policies, visitors and trade

Council policies require a completed Town Hall:

| Policy | Effect |
| --- | --- |
| Balanced | Standard production, forest recovery and needs. |
| Harvest | More timber, slower forest recovery and lower happiness. |
| Wellbeing | More filtered water, slower hunger gain and higher happiness. |
| Trade | More fish, greater tourist spending and 1.5× cargo sale payouts. |

With a lodge, happiness ≥20 and visitor space available, one tourist arrives every **60 seconds**, stays **90 seconds** and spends 6 coins on arrival, plus 3 if a lodge is staffed; Trade changes the base to 9. Tourist capacity is three per lodge.

Every **120 seconds**, lodges refresh merchant stock: rare seeds (20 coins, one), medicine (15 coins, two), and a navigation chart (25 coins, one). Seeds improve cottage gardens and add 10 grain. A chart permanently clears 25 fog; three charts permit safe docking. A lighthouse clears all fog.

Cargo ships use a **90-second arrival cycle** with a **30-second dock window**. A pier and fog ≤25 are needed; otherwise the ship waits offshore. While docked, sell 5 fish for 10 coins or 5 planks for 15 coins (15/22 coins under Trade), or buy 10 stone for 12 coins. Ships rotate among existing piers. The first arrival is 90 seconds after a fresh settlement starts.

## Storage and saving

Base capacity is **150 of each material and each produced good**. Every completed depot adds another 150 to each. Coins do not use this material limit. Banked runner timber/stone exceeding capacity waits in safe harbor crates; spending stock or expanding storage makes room to unload it. Routine production caps at storage instead of accumulating unlimited goods.

Progress is saved in the same browser and origin, including individuals, jobs, services, cargo, construction deadlines and designs. Earlier valid version-1 islands migrate into version 2 with balances, completed/pending structures, appearance and reward ledger preserved; the original record is backed up before replacement. Unreadable data remains untouched until a confirmed fresh start. When saving is blocked, the interface reports session-only play.

The developer completed a full manual playtest and confirmed the game works on 24 October 2026. Automated and deployment evidence is recorded in [the checklist](checklist.md).

Migration starts newly introduced resident needs at the time of conversion; the old game’s absence does not retroactively cause hunger or illness. Original in-flight construction deadlines are retained.

Buildings use enlarged architecture and wider-spaced foundations. Use Zoom in for up to 4× close inspection, Zoom out for an overview, and drag to explore. Existing placements and the number of available spaces are preserved.
