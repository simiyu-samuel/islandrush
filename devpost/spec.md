---
doc: spec
status: approved
---

# Island Rush — Technical Specification

The learner approved this technical plan on 22 October 2026 with “its good lets
proceed.” Scope, PRD, engine, architecture, and local-first delivery are approved.

## How This Works, In Plain Language

Phaser draws and animates the courier, route, island, buildings, and pickups.
TypeScript holds the rules for running, earned loot, purchases, construction,
and unlocks. A small HTML/CSS interface supplies readable controls and panels.
Vite runs the project locally and produces the distributable browser build.

The runner uses 2D sprites positioned with perspective to suggest depth; the
island uses a fixed isometric projection with bounded map pan and zoom. This is a 2D implementation plan,
suited to the approved pixel-art direction, with emphasis on composition,
animation, controls, and feedback.

On collision or voluntary return, the rules credit materials and coins once, save the
updated island in the browser, and display results. Build and Buy validate the
same saved progress before changing the visible island or inventory.

## The Core Journey Through the System

Implements PRD > The Core Journey.

1. Load and validate saved progress, then open the island.
2. Selecting a plot opens its construction panel, design previews, and costs.
3. Starting a run creates a unique ID, empty loot, selected target, route seed,
   and starting pace. The route streams ahead without a time limit.
4. Keyboard/touch input updates movement and jumping. The run model computes
   pickups and contact; Phaser draws the resulting positions.
5. Collision or Head home ends once. The controller settles loot, records the
   settled ID, saves progress, and shows results.
6. Run Again creates a new run. Return to Island shows construction/purchases.
7. Buying checks eligibility and coins before exchanging the displayed amounts.
   Building checks an eligible unfinished plot and available materials before
   deducting the recipe and displaying the selected design.
8. Home completion derives level 2; all three built flags derive settlement
   completion. Save and refresh the UI after successful progress commands.

## Stack

The following stack was accepted in the technical review.

| Tool | Approved baseline | Role |
| --- | --- | --- |
| Phaser | 4.2.1 (pinned) | Scenes, sprites, animation, input, 2D WebGL rendering. |
| TypeScript | 5.9.3 (pinned) | Typed run/progress rules, catalogs, saves, and UI events. |
| Vite | 8.3.5 (pinned) | Fast local iteration and a static production build. |
| HTML/CSS | Browser standards | Readable responsive HUD, construction, guidance, pause, and results. |
| Vitest | 5.0.5 (pinned) | Deterministic checks of loot, purchases, building gates, and saves. |
| Playwright | 1.64.1 (pinned) | Focused real-player-flow and responsive-browser checks. |

Package versions, engines, and peers were checked against npm metadata on
22 October 2026. Exact versions are pinned in package.json and package-lock.json;
Node 22.22.0 is compatible. The current game is implemented, with 91
unit/controller/geometry checks and the production build passing. Historical
checkpoints and remaining player/device review are recorded in checklist.md;
public deployment verification is in deployment.md.

Verified planning references:
- Official TypeScript/Vite template: https://github.com/phaserjs/template-vite-ts
- Phaser 4 changes: https://github.com/phaserjs/phaser/blob/master/changelog/v4/4.0/CHANGELOG-v4.0.0.md
- Phaser 4.2 release: https://editor.phaser.io/news/2026/06/phaser-v4-2-0-released
- Game configuration: https://docs.phaser.io/phaser/concepts/game
- TypeScript: https://www.typescriptlang.org/docs/
- Vite: https://vite.dev/guide/
- Vitest: https://vitest.dev/guide/
- Playwright: https://playwright.dev/docs/intro
- Browser storage: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage

The official template currently declares Phaser 4.0.0 despite its older Phaser 3
description. Follow installed Phaser 4 APIs. The verified 4.2 release is a newer
baseline. The first-build registry check established and pinned 4.2.1.

## Where It Runs and How Someone Tries It

The owner selected Vercel hosting on 24 October 2026. The same static build runs
locally and in production. See `deployment.md` for the verified live URL and
project/source record. The public game requires no account, API key, or backend.

Use Node.js 22.12 or later; the deployment baseline is Node 22.x.

    npm ci
    npm run dev
    npm run typecheck
    npm test
    npm run build
    npm run preview

Open http://127.0.0.1:5173 for development or http://127.0.0.1:4173 for the built
preview. Serve through HTTP rather than opening index.html directly. Target a
modern WebGL-capable desktop/phone browser and show a renderer initialization
error if startup fails.

`vercel.json` declares Vite, `npm ci`, `npm run build`, and `dist` output. No
runtime environment variables are needed. `.vercelignore` excludes private
context, planning/design archives, dependencies, generated output, and local
credentials from CLI source uploads; `.vercel/` is Git-ignored. Vercel serves
only the compiled static output. The three planning docs remain public in GitHub.

Saves are origin-specific. The production domain and localhost have separate
progress; hosting does not add cloud synchronization. Public hosting supplements,
and does not replace, the required short video and public source repository.

## Look and Feel

Implements PRD > Look and Feel and Screens and Layout.

Carry Pixel Coast consistently through the adult courier, world, buildings,
pickups, and UI accents: turquoise water, warm coastal light, clear silhouettes,
spacious plots/paths, compact cream/wood-accented panels, and readable lettering.
The mature courier proportions and floating pickups are required visual cues.

24 October design revision retains the ocean/cream/amber interface, selected
building preview, catalog description, and fixed affordable Build action. The
owner rejected merely enlarging the three-plot scene and supplied a city-builder
image as a structural reference. The island now uses new original 4:3 terrain
with connected streets, smaller grass blocks, parks, an inlet/bridge, pier, and
promenade. Existing buildings occupy small player-selectable roadside lots within the whole map;
scenery does not introduce extra buildings, unlocks, levels, or currencies.

`model/placement.ts` owns valid grass blocks, default/fallback lots, and occupancy.
`game/islandMap.ts` owns the active art aspect, responsive viewport,
bounded drag offsets, and zoom limits. Optional building lot/facing fields
are validated and saved; previews remain local controller state until confirmed. `IslandScene.ts` applies this transform to
the terrain, sites, sprites, labels, and construction. Map controls dispatch
view-only commands; pointer drags suppress plot selection, and newly started
construction brings its lot into view. This camera state is not persisted.
The three-landmark map strip has been removed. Mobile retains its separate
Buildings screen and bottom navigation. The runner UI from the preceding revision
retains time/backpack/Pause, recipe progress, and reduced-motion-aware pickup
quantities. Road projection, game rules, and saves are unchanged.

The new terrain asset was inspected directly. Mechanical camera tests cover
initial plot bounds, overview, and bounded pan/zoom across seven viewport sizes.
New player visual/gesture review is pending; no fresh browser screenshots or
automated browser execution are claimed.

Archived concept references:
- design/reference/island-rush-visual-study-v1.png
- design/reference/island-rush-visual-study-v2.png
- design/reference/PROMPTS.md

The second board's left column leads the art direction. Concept boards are
reference material, not a static replacement for the playable scene.

Generate fresh matching runtime PNG art: island/route artwork, adult run/jump
frames, six building designs, material/coin pickups, and hazards. Track frame
dimensions/origins, sources, and prompts in an asset manifest/credits. Use
nearest-neighbor sampling and consistent pixel scale. Keep HTML text and
controls readable independently of world scaling; adapt composition/projection
to phone/desktop aspect ratios.

Inspect sprite alignment, proportions, animation, and contacts in motion before
expanding the full content set. Bob/rotate pickups; keep hazards grounded; make
construction and unlocks visibly change the island. Reduced-motion presentation
retains state cues without relying on decorative movement.

## Components

### App Controller

Own the current view, active run, shared progress, commands, notifications, and
save status. Update rules synchronously before rendering. A scene or result
button cannot independently mint rewards or spend stock.

Implements PRD > The Core Journey and Saved Progress and Restart.

### Catalog and Progress Rules

Typed catalogs contain approved recipes, prices, level gates, two style IDs per
building, and tuning values. Pure functions validate active targets, material
eligibility, purchases, construction, and derived progression.

Initial recipes: home 30 timber; workshop 40 timber/20 stone; lookout 20 timber/
40 stone. Material pickups give five units; coins give one. Ten coins buy five
timber; fifteen buy five stone. Keep all tuning settings together.

Implements PRD > Coins and Material Purchases, Construction and Building Designs,
and Level Progression.

### Run Model and Perspective Scene

Store run ID/seed, status/end reason, active time, distance, lane/jump position,
entities, generated-ahead distance, collected IDs, and run loot. Advance with active time and input, then
project model coordinates to the screen.

Evaluate contacts in route/lane space, accounting for current interpolated lane
position and jump clearance. Transparent sprite padding is not a hitbox. Process
events in travel order so an obstacle ends collection at impact even across a
larger frame step. Collision and voluntary return use one terminal transition.
Paused/unfocused runs freeze simulation and active time until explicit Resume. Phaser
uses fps.smoothStep: false so the model receives actual active elapsed time
rather than a frame-smoothed value that stretches runs on slower renderers.

RunScene renders route layers, the adult courier, grounded obstacles, and floating
pickups with correct depth/shadow cues. One camera spans three weathered-stone
trail lanes. A separate coastal panorama shows the distant island; foliage
moves at 48% route speed outside the road. Smaller phone sprites are positioned
with their full bounding boxes outside the trail using routeSceneryX(), keeping
both outer lanes unobstructed without relying on a graphics mask. The deck remains continuous, with quiet
joints and mossy edges, avoiding animated meshes or overlapping road images.
Depth exponent 1.6 softens near-player growth. Later material, coin, and obstacle
positions are staggered at least 14 route units apart. The first obstacle is at
100 units; jump/contact rules and retained loot remain. The desktop road
leaves ocean visible on both sides (bottom width at most 58% of the viewport,
capped at 780px); preserve the reviewed mobile width. Scenery preserves its aspect ratio on narrow screens. Readable spacing must leave achievable
choices. Recalculate projection after resizing without resetting the run.

Pace increases linearly from 18 to 34 units/second over 80 active seconds, then
holds the cap. runPace.ts integrates distance analytically and inverts travel
time for exact contact ordering, keeping lane/jump rules in active-time space.
run.ts streams deterministic per-row chunks with stable entity IDs. Later rows
include a hazard every row rather than two out of three; each hazard row leaves
two clear lanes. Passed entities and collected IDs are pruned to bound the live
window. generatedUntil is runtime-only; active runs still do not survive reload.
Head home calls returnRun() and shares the existing once-only settlement ledger,
including while paused. The HUD displays distance and current pace.

Implements PRD > Endless Run, Endless Running and Collisions, and Material Availability
and Run Results.

### Island Scene and Construction Interface

Draw the island and saved building positions. Eight approved grass-block anchors
exclude streets/water/gardens. A view-only placement draft controls the translucent
preview, facing flip, and highlighted free lots. Map taps or HTML block buttons
select a candidate; confirm calls placeBuilding() and persists, cancel drops the
draft. Disallow other builds/runs while previewing, and disallow moves during
construction. Resolve a free fallback if an unbuilt default lot was occupied.
Use tool signs/selected foundations instead of floating building-name labels.
Place island title, level, and loop description inside a contained header. Desktop keeps an HTML side panel;
below 960px, keep the map free and use an Island/Buildings/Run bottom bar.
Buildings opens a separate scrollable screen; plot taps open the same screen.
Use safe-area-aware layouts for phone portrait and landscape. The panel previews styles/costs, shows
shortfalls and eligible purchases, and sends explicit Buy/Build commands.
Revalidate against latest progress, explain failures, and animate confirmed
successes. A persisted pendingConstruction record reserves cost once and stores
startedAt/completesAt (5,000ms apart). The scene shows foundation, framing, roof
work, and final reveal, with a percentage progress bar above the roofline;
completion alone marks the building built and unlocks
the next level. Existing v1 saves without this optional field remain valid.
Locked plots show their home-completion unlock condition.

Implements PRD > Island and Construction, Construction and Building Designs,
and Coins and Material Purchases.

### HUD, Guidance, Results, and Completion

Semantic HTML supplies the HUD, tutorial, Pause/Resume, construction/purchase
panel, results, save notices, completion, and confirmed restart. Manage keyboard
focus as panels change. Announce important state changes, not animation frames.

Results show end reason, earned loot, and stored totals. Result actions cannot
settle the run again. Tutorial flags persist when steps complete or are skipped.
Reset only after the player's explicit restart confirmation.

Implements PRD > Guided First Play, Run Result, Guidance, Pause, and Completion,
and States and Boundaries.

### Save Adapter

One versioned localStorage record stores progress. Validate schema version,
finite non-negative integer balances, known IDs, and consistent unlock/building
states. Catch reads/writes and parsing failures. Keep a truthful save-status
message and preserve unreadable data until the player chooses a fresh start.

Load returns to the island. Never resume or credit an unfinished run on reload.
Save after settlement, purchase, building, style/target choice, and tutorial steps.
One terminal/settlement guard plus settled-run IDs prevents duplicate rewards,
including a delayed result event from an older run.

Implements PRD > Saved Progress and Restart.

## Data Model

Persistent ProgressV1:
- version and updated timestamp;
- wallet with timber, stone, coins;
- home/workshop/lookout records: selected style ID, built flag, optional valid
  grass-block lot ID, and optional left/right facing (absent fields retain legacy defaults);
- active unfinished target, or none at completion;
- optional pending construction with building ID, start time, and deadline;
- completed/skipped guidance steps;
- last settled run ID and a settled-run ID ledger to reject delayed stale results.

Derive level from home completion and settlement completion from all three
buildings. Validate rather than maintaining conflicting progression authorities.

Runtime ActiveRun:
- unique ID, route seed, status (active/paused/ended/settled), end reason;
- target/permitted materials, elapsed active seconds, distance;
- lane/jump position, live route entities, generated-ahead distance, collected
  IDs, and current loot.

An active run is discarded on reload. Ended runs settle before result actions
become available. Save all progress changes through one record.

## File Structure

Selected implemented files (generated output and private local files are excluded):

    build-with-ai-basics/
    ├── .agents/skills/            # Devpost skill pack
    ├── devpost/                  # Planning docs and learning context
    ├── design/reference/         # Concept boards and prompts
    ├── public/assets/
    │   ├── manifest.json         # Origins/frame layout/source credits
    │   ├── world/                # Route/island art
    │   ├── courier/              # Mature run/jump frames
    │   ├── buildings/            # Three types, two designs each
    │   └── pickups/              # Timber/stone/coins/hazards
    ├── src/
    │   ├── main.ts               # Bootstrap
    │   ├── controller.ts         # Shared progress and view/run coordination
    │   ├── model/
    │   │   ├── types.ts
    │   │   ├── catalog.ts
    │   │   ├── progress.ts       # Settle/buy/build/unlock
    │   │   ├── run.ts            # Endless deterministic simulation
    │   │   ├── runPace.ts        # Acceleration and contact timing
    │   │   ├── placement.ts      # Blocks, occupancy, legacy defaults
    │   │   └── save.ts           # Validation and storage
    │   ├── game/
    │   │   ├── config.ts
    │   │   ├── projection.ts
    │   │   ├── input.ts
    │   │   └── scenes/
    │   │       ├── BootScene.ts
    │   │       ├── IslandScene.ts
    │   │       └── RunScene.ts
    │   └── ui/
    │       ├── app.ts
    │       ├── tutorial.ts
    │       └── styles.css
    ├── tests/
    │   ├── progress.test.ts
    │   ├── run.test.ts
    │   ├── save.test.ts
    │   └── browser/game.spec.ts
    ├── index.html
    ├── package.json
    ├── package-lock.json
    ├── tsconfig.json
    ├── vercel.json             # Static production build settings
    ├── .vercelignore           # Keep private/local context out of uploads
    ├── vite.config.ts
    ├── playwright.config.ts
    ├── .gitignore
    └── README.md

## Verification and Early Playable Slice

The known learning uncertainty is how to turn the attractive concept board into
readable, animated gameplay. Zalura's logical implementation did not deliver the
visual identity/player experience the learner wanted.

First implement a small real scene with the adult courier, one material, a coin,
an obstacle, and the intended HUD. Check at normal speed on desktop and phone
sizes. Verify visual contact/collection timing, lane/jump response, collision-
ended runs, and preserved loot. Obtain player feedback on this scene before
expanding the complete island art/content.

Meaningful unit checks: collision/return credit once, endless streaming and
chunk boundaries, bounded live data, pace integration/contact timing, no pickup after impact,
paused time frozen, purchases/insufficiency, locked stone/buildings, one recipe
charge, derived progression, and invalid/unavailable saves.

Browser checks: guidance → design → run → collision/result → saved loot,
purchase/build/unlock, Run Again, reload, focus pause, and compact layouts.
Use the supported browser workflow for hands-on QA and read the local preview
instructions before starting it. Run focused automated browser tests when the
runtime/browser is available; report verification limits honestly.

## External Services and Dependencies

Bundled code/assets and browser storage support the approved behavior without
runtime AI APIs, payment services, remote databases, or credentials. Coins
exchange through game rules. Development package installation needs registry
access. Original runtime images use the built-in image tool and are saved under
public/assets. Record any deliberately introduced third-party font/asset license.
Do not copy existing Zalura code/art into the new hackathon project.

Vercel is selected for production. The static dist build remains portable.
Record the public production URL and actual access checks in deployment.md;
never treat an authenticated deployment fetch as proof that judges can enter.

## Important Failure Modes

- Asset/renderer failure: visible load/error state and Retry, preserving saved
  progress; no static image masquerading as a playable game.
- Invalid/unavailable saves: truthful notice, preserve old data, and an explicit
  session-play or confirmed fresh-start path.
- Overlapping terminal/result actions: one transition and settlement; validate
  latest balances and built flags before any purchase/construction.
- Stutter, aspect changes, or input loss: preserve active-time/pause semantics and
  contact order; test actual speed rather than relying only on stills.

## What Was Kept Small

The approved one-course, two-level, three-building model uses two designs each,
eight selectable grass blocks for the same three buildings, local browser progress,
and an integrated materials purchase panel.
These have direct homes in the engine, UI, and small rule modules. Additional
content, accounts, cross-device sync, and fully unconstrained terrain placement
remain deferred. Block placement/relocation was explicitly added by the owner.
Local development remains available; Vercel production hosting was authorized
on 24 October. No paid add-on or new gameplay feature is part of deployment.

## Decisions and Open Issues

Confirmed by product approval: the player journey, pixel direction, adult
character, terminal collisions with retained loot, recipes/prices, progression,
and small content boundary.

Approved in the technical review: Phaser 4, TypeScript, Vite, HTML/CSS controls,
fixed-view 2D perspective/isometric scenes, deterministic game-rule modules,
localStorage, fresh asset generation, and local-first delivery.

Compatible versions are pinned in package.json/package-lock.json. The complete
one-course/two-level settlement, original art, purchases, construction, and
short guidance are implemented. At source commit cf9590f, 72 unit/controller
checks and the production build pass. The player reported a successful hands-on
test and accepted the game on 23 October 2026. Automated browser journeys remain
unexecuted under the recorded tool URL-policy limitation. The checklist and
app map record the actual revisions and reference code route.

24 October follow-up: the owner approved the coastal runner direction but
requested endless runs with progressive speed/difficulty, clearer mobile outer
lanes, and direct map-tap relocation. These changes pass all 91 checks and the
production build. Eleven browser journeys collect without execution under the
existing tool restriction; this follow-up still awaits player review.

## Sharing and Submission

- Public repository: https://github.com/simiyu-samuel/islandrush
- Default branch: codex/island-rush. Public readability verified without credentials through the GitHub repository API on 23 October 2026.
- Technical setup: README.md. Planning artifacts: devpost/scope.md, prd.md, and spec.md. Offline code guide: devpost/app-map.html.
- Demo video: not yet supplied or verified. Official rules require a publicly visible YouTube/Vimeo video under three minutes showing the working project.
- Live deployment: https://island-rush-six.vercel.app, Vercel production READY on 24 October from a1d2583. See deployment.md for anonymous access/asset checks and browser evidence.
- License: MIT, explicitly approved by the owner on 23 October 2026; root LICENSE and package metadata added. Third-party dependencies retain their own licenses.
- Submission status and confirmed requirements: devpost/shipping.md. Submission text and exit-survey answers belong to the learner. No Devpost form has been submitted by the agent.
