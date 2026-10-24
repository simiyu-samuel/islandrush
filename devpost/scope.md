---
doc: scope
status: approved
---

# Island Rush — scope

Approved by the owner on **24 October 2026**: expand the working runner/island game to sixteen building types, repeat construction and detailed settlement simulations, updating the app flow, documentation and demo materials. The earlier three-building/two-level boundary is superseded.

## Unique kernel and audience

An endless coastal supply run has a visible purpose: bring materials home, choose where to construct, and support a community that lives and works on the island. For players who enjoy responsive arcade running and the creative planning of a settlement builder.

## Core journey

1. Choose a building type, see benefits, recipe, terrain, tier and construction stages.
2. Run for the selected recipe's timber/stone and coins. Speed and obstacle frequency rise with progress.
3. Return voluntarily or hit an obstacle; keep collected loot once, then build or run again.
4. Preview an eligible clear foundation and facing; confirm a resource-funded five-second construction.
5. Inspect residents and services, assign work, maintain food/water, manage policies and trade.
6. Repeat any building type while suitable space and supplies remain; claim additional blocks and connect additional islets.

## Included content

| Category | Types |
| --- | --- |
| Civic & Community | Town Hall, Community Plaza, Medical Clinic, Visitor Lodge |
| Resource & Production | Lumber Yard, Artisan Workshop, Windmill Bakery, Archipelago Pier |
| Utility & Infrastructure | Rainwater Collector, Coastal Lighthouse, Storage Depot, Geothermal Generator |
| Settlement Expansion | Pioneer Cottage, Border Outpost, Terrace Hamlet, Bridge Link |

The [player guide](game-guide.md#all-building-types) and [PRD](prd.md#building-catalogue) list all sixteen costs, tiers and terrain requirements. These values come from `src/model/catalog.ts`.

- Repeatable instance-based buildings, concurrent five-second construction, free relocation and facing, half-recipe dismantle salvage, and safeguards against stranding occupied expansion land.
- Three technology tiers: a completed Town Hall opens tier 2; a 100-timber/80-stone Town Hall upgrade opens tier 3.
- Individual residents with homes, jobs, hunger, health and shortage-related fever. Automatic essential staffing with manual reassignment, treatment and recovery.
- Working water, forest/timber, grain/flour/bread, fish and plank/tool production; per-resource storage, safe runner overflow, power demand and generation.
- Happiness, festivals, four island policies, tourists, rare-item merchants, fog clearance and scheduled cargo ships with explicit trades.
- Eight four-space blocks per islet: 16 initially open, outposts add four up to 32, each completed bridge adds another islet. No arbitrary copy limit or fixed last island.
- Original sixteen-building art in four category atlases, existing connected-road terrain, adult courier and coastal jungle runner; responsive HTML controls and compact mobile screens.
- Browser-local version-2 saves, safe migration/backups of valid version-1 saves, retained invalid data, truthful session-only fallback and bounded offline simulation.

## Boundaries

This is a local single-player simulation with discrete ten-second life ticks and at most thirty minutes of catch-up. Islanders and ships are game state with visual representations; it does not simulate a full pathfinding economy, real-time infectious disease spread, or a real external marketplace. Fever is a shortage-related game condition. No resident death, multiplayer, accounts, cloud saves, runtime AI service or paid transaction is included.

The island remains structured: free choice among suitable open foundations, with terrain requirements, rather than arbitrary placement on roads/water. Technology tiers gate construction; gathering for locked recipes is allowed. Upgrades are implemented for Town Halls, not every building type.

## Working outcome

Players can enter without registration, understand the run/build/care loop, construct and move multiple copies, see individual needs and production change over time, expand territory and use a real dock/merchant schedule. Costs, shortage messages, timers, pause behavior, save status and recovery should be clear.

Owner authorization is not a claim of a successful new playtest. Current check results, player review and deployment evidence are tracked separately in [checklist.md](checklist.md) and [deployment.md](deployment.md). Demo/submission materials must describe only the version actually recorded and published.
