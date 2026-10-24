---
doc: prd
status: approved
---

# Island Rush — product requirements

The owner approved the sixteen-type repeatable settlement expansion and **detailed simulations** on 24 October 2026. This revision replaces the former three-building/two-level completion journey. [Scope](scope.md) defines the agreed boundary; current source and the catalogue supply the values below.

## Core journey

Begin on Pixel Coast with two named pioneers, an empty construction wallet, twenty grain, twenty bread and forty water. Short, skippable guidance explains that supply runs fund homes and services. Choose a type and any available design, inspect benefits, cost, terrain and stages, then run or plan a suitable foundation.

A run has no time limit. It supplies the selected recipe's materials and coins, accelerates gradually and becomes more demanding. Collision or Head home ends the run and banks earlier loot once. Results offer Return to island and Run again. A material shop supplies 5 timber/10 coins or 5 stone/15 coins when storage permits.

On the island, preview a free eligible foundation, flip facing and confirm Build here. Charge once, show five seconds of staged construction and percentage progress, then activate the building's service. Permit multiple simultaneous sites and repeated copies without a per-type cap. A completed map building opens its move preview directly; moving is free and preserves identity. An explicit reclaim-space action explains half-recipe salvage and refuses actions that would strand occupied expansion ground.

The goal remains open-ended: grow, care, produce, trade and expand. There is no all-three-buildings finish screen.

## Screens and interaction

The map is dominant, with a contained header for identity/tier, stored resources and population/happiness/water/food. Desktop keeps a settlement side panel; below 960px, use a separate scrollable screen and Island/Build/Village/Run bottom navigation. Keep world controls clear of the mobile screen, safe areas and runner outer lanes.

Settlement sections:

- **Build:** four categories, sixteen visible types, count, design previews, recipe, tier/terrain, benefits, stages, placement and material purchases.
- **Islanders:** named residents, housing, hunger, health, illness and workplace assignments.
- **Supplies:** produced goods, forest, capacity, power and harbor overflow.
- **Trade:** current cargo status/countdown and available ship/merchant transactions.
- **Council:** policies, Town Hall upgrade, expansion status and the settlement journal.

Construction previews highlight only eligible free foundations and offer an equivalent HTML space menu. Cancel leaves persistent state unchanged. Completed structures have no floating name labels over the world. Drag/zoom explores the archipelago; new regions extend map bounds. Important changes have readable notices, not animation alone. Preserve keyboard focus and dialog focus containment.

## Building catalogue

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

Town Hall completion opens tier 2; upgrade one completed level-1 hall for **100 timber + 80 stone** to open tier 3. This upgrade is immediate. Multiple halls and all other types remain repeatable. No other type has an upgrade command in this revision.

Every type has original matching art. Retained Cottage/Bungalow, Forge/Studio, Lighthouse and Watchtower variants remain selectable on their corresponding types and compatible with migrated saves. Design choice does not change mechanics.

## Land and construction rules

Eight four-foundation grass blocks form each islet. The first four blocks provide sixteen open spaces; every completed local outpost opens another block, up to thirty-two spaces. Each completed bridge creates one additional islet with the same starter capacity. Bridges can repeat for further expansion. Construction requires an unlocked tier, matching terrain, unoccupied foundation and sufficient materials. The complete cost is deducted only at confirmation, with persisted start/deadline exactly five seconds apart.

Moving a completed building must obey current terrain and occupancy and cannot close ground occupied by another building. Dismantling returns floor-half of its base timber/stone recipe, frees the space and updates services/resident references. Outpost/bridge removal is rejected if any remaining occupied location would become inaccessible. Construction in progress cannot move or dismantle.

## Detailed settlement behavior

Use fixed **ten-second** simulation ticks. At most 180 ticks (thirty minutes) catch up after absence; excess time is skipped. Runner pause freezes courier time only. Each resident has a stable ID/name, home/job reference, hunger, health and fever state. Homes allocate automatically; one worker staffs each supported workplace, with essentials filled first and manual assignments retained. Low-health workers operate on alternate ticks. New residents arrive every third tick while housing has room.

Production is real inventory mutation, not descriptive benefits: staffed collectors produce water; lumber crews consume/replant forest; workshops convert timber to planks and tools; bakeries mill grain and bake with water; piers fish; occupied cottage gardens grow grain using water. See [the player guide](game-guide.md#village-and-supply-chains) for exact rates and processing priority.

Residents consume water each tick and bread/fish when hungry. Shortages lower health and can create individual shortage-related fever; staffed watered clinics prevent new outbreaks and treat patients. Medicine can treat all current fever. Health has a floor of ten; illness does not kill or permanently delete residents. Clinics with enough power treat more patients and restore more health. Each generator supplies twelve power; each clinic, hamlet and upgraded hall demands two. A deficit affects happiness and care efficiency.

Plazas increase happiness and can host a festival every 120 seconds when three food and three water are available. The festival adds a forty-second happiness boost. Policies require a Town Hall: Balanced is the baseline, Harvest favors timber at a forest/happiness cost, Wellbeing favors water and slower hunger, Trade favors fishing and commerce.

Each lodge supports three concurrent visitors. With happiness at least twenty, one visitor arrives per sixty seconds if space remains, stays ninety seconds and spends coins on arrival. Staff and Trade increase that spending. Lodges refresh finite seed/medicine/chart merchant offers every 120 seconds.

Cargo arrival cycles repeat every ninety seconds with a thirty-second dock period. A pier and fog at or below twenty-five allow safe docking; a lighthouse clears fog, while each chart removes twenty-five. Docked trades exchange fish/planks for coins or coins for stone. Arrival/departure/merchant times and transactions remain visible and use the same persistent state.

Base capacity is 150 of each construction material and produced good; every depot adds 150 to each. Coins use a safe integer balance rather than this material cap. Preserve excess banked runner materials in harbor overflow, unloading when space opens. Routine production caps at storage.

## Runner requirements

Keep the reviewed coastal jungle direction, distant island, adult courier, floating pickups and grounded hazards. Three lanes must remain visible on phone and desktop, with foliage entirely outside trail bounds. Use shared perspective/depth ordering and smooth continuous trail joints.

Start at 18 route units/second, add 0.2 per active second and cap at 34 after eighty seconds. Later rows include more frequent obstacles, while leaving alternatives. Controls: arrows/A/D for lanes; Space/Up/W to jump; touch swipe/buttons. Pickups give five material units or one coin. Respect exact lane/jump contact time, event order and no collection after impact. Store rewards once for collision and voluntary return, including return from pause. Focus loss pauses, and Resume is explicit. Reload never resumes or credits an unfinished run.

## Persistence, safety and review

Version-2 saves hold instance buildings, chosen designs, residents, goods, policies, visitors, cargo, rare items, events, tutorial and settled-run ledger. Validate before loading/writing. Valid version-1 buildings/balances/pending deadlines/styles/loot ledger migrate; write a recoverable original backup before replacing the old save. Reject invalid saves without silently deleting them. Storage failure permits truthful session-only play; fresh start is explicit and confirmed. Saves are browser/origin-local.

The owner completed full-game manual playtesting and confirmed the implemented systems work on 24 October 2026. The follow-up increases building scale, spreads foundations within their existing blocks and extends zoom to 4×. This preserves all 32 spaces per islet and saved lot IDs. Current mechanical and release evidence is in [the checklist](checklist.md) and [deployment record](deployment.md).
