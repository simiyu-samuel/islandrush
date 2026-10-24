# Island Rush

Run the coast. Bring supplies home. Build an island that feels like yours.

Island Rush combines an endless coastal runner with a small island builder,
created from scratch for **Build With AI: Basics** using Codex and the Devpost
Learn Skill Pack. It is for players who enjoy arcade runs and choosing how a
settlement develops. AI assisted development and original art generation; the
playable game does not call an AI service.

- **[Play Island Rush](https://island-rush-six.vercel.app)** — no account required.
- [Complete game guide](devpost/game-guide.md)
- [Voice-over reading script](devpost/demo-voiceover.md)
- [Screen-recording guide](devpost/demo-recording-guide.md)
- [Shipping and live-link record](devpost/shipping.md)
- [Public source](https://github.com/simiyu-samuel/islandrush)

## Play → collect → return → build

Choose a home design and preview a clear grass block. Gather floating supplies
on the three-lane jungle-coast trail. Use **Head home** whenever you want to
build, or bank the loot when a collision ends your run. Spend supplies only when
you deliberately choose Build, then watch five seconds of staged construction
and its overhead percentage bar reveal your chosen design.

The home unlocks level 2. Complete the workshop and lookout in either order to
finish the starter settlement. Each building has two designs. Coins can buy
materials relevant to the selected unfinished project.

| Building | Level | Timber | Stone | Design choices |
| --- | --- | --- | --- | --- |
| Home | 1 | 30 | 0 | Coast Cottage / Palm Bungalow |
| Workshop | 2 | 40 | 20 | Harbor Forge / Maker Studio |
| Lookout | 2 | 20 | 40 | Coast Lighthouse / Timber Watchtower |

Material bundles grant 5 units; coins grant 1. The shop exchanges 10 coins for
5 timber, or 15 coins for 5 stone when unlocked and relevant. Surplus remains
stored. After settlement completion, runs collect coins only.

## Endless coastal runner

- No countdown or 60-second limit. The HUD shows distance, pace, and this run's loot.
- Speed rises smoothly from 18 to 34 route units/second over 80 active seconds,
  then holds a playable cap. Hazards become more frequent later.
- One deterministic course streams ahead; passed entities are discarded so a
  long run does not retain its entire course in memory.
- An adult courier runs through coastal jungle, with the island on the horizon.
  Floating pickups and grounded blocks have distinct depth and shadow cues.
- A continuous stone trail uses quieter moving joints and softer perspective.
  Desktop road width is bounded; smaller mobile foliage stays outside all lanes.
- Collisions end immediately and preserve already collected loot. **Head home**
  does the same by choice; Pause also offers **End run and return**. Each run
  settles once, regardless of repeated result actions.

## Shape the island

The larger road-network island has eight eligible grass blocks for the same
three buildings. Roads, water, occupied/reserved blocks, and landscaping stay
clear. This is block placement, without arbitrary terrain editing.

Use **Choose location**, select a block on the map or by its button, optionally
**Flip facing**, and confirm **Place here**. Cancel discards the preview.
Tap a completed building directly on the map to move it, or use **Move building**
in its panel. Relocation is free and preserves design, completion, and stock.
Confirmed locations and facing survive reload. Pending construction briefly
locks placement and running.

Drag/zoom the map and use Reset view to explore. A contained island header keeps
name and level readable. Below 960px, **Island / Buildings / Run** bottom
navigation opens a separate scrollable Buildings screen. The runner uses its
own compact HUD and visible touch controls. Short contextual guidance is skippable.

## Controls and saves

| Action | Desktop | Touch |
| --- | --- | --- |
| Change lane | Left / Right arrows or A / D | Horizontal swipe or Left / Right buttons |
| Jump | Space, Up arrow, or W | Upward swipe or Jump button |
| Pause | Escape or P | Pause button |
| Bank and return | Head home | Head home |

Pause/focus loss freezes active time, speed, and motion until explicit Resume.
Browser localStorage saves the island, stored materials/coins, designs,
locations/facing, guide milestones, and construction's original deadline.
An unfinished run is discarded on reload without granting its loot.

Saves belong to this browser and origin: localhost, preview URLs, and production
have separate progress. There is no account or cloud sync. Unreadable saves are
preserved until an explicit fresh start; blocked storage offers session-only
play. Restart requires confirmation. WebGL and JavaScript are required.

## Run locally

Use **Node.js 22.12 or later** and npm. Node 22.x is the deployment baseline.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite, normally http://127.0.0.1:5173/.
No account, API key, backend, or real payment is needed.

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

The production output is `dist/`; the built preview normally uses
http://127.0.0.1:4173/. Serve the game over HTTP rather than opening index.html.

## Vercel deployment

Vercel is the owner-selected production host as of 24 October 2026.
[Deployment instructions and verification](devpost/deployment.md) record the
project, public URL, source revision, and actual result. `vercel.json` sets the
Vite framework, `npm ci`, `npm run build`, and `dist` output. No environment
variables or paid services are required by the game.

`.vercelignore` excludes private/planning context, design archives, local
credentials, dependencies, and generated output from CLI source uploads.
Only the built `dist` is served; the planning documents remain in the public
GitHub repository. `.vercel/` is local project-link metadata and is Git-ignored.

## Verification

At gameplay revision `72275d5`, all **91 unit/controller/geometry checks**,
TypeScript, and the production build pass. Coverage includes accelerating
contact timing, endless chunk boundaries and bounded live data, collision and
voluntary-return settlement, construction reservation/reload, both level-two
orders, purchases, legacy/corrupt saves, placement/occupancy/facing, guidance,
focus pause, and mobile road/scenery geometry.

Eleven Playwright journeys collect but have not been executed for this version
under the recorded browser-tool local-preview restriction. Collect without
launching a browser using `npx playwright test --list`. On an authorized machine,
install Playwright Chromium and run `npm run test:browser`, or set
`PLAYWRIGHT_CHROMIUM_EXECUTABLE` to an existing executable.

The public Vercel page and all emitted bundles/manifest image paths returned
HTTP 200 without credentials on 24 October. The deployed island/runner were
opened in the browser and genuine screenshots are in `design/devpost/`. These
observations do not establish a full browser-suite pass.

The owner playtested earlier versions and approved the coastal runner direction.
That does not prove every device/edge case; the final endless/mobile/direct-move
follow-up still needs a player retry. Historical screenshots in
`design/checkpoints/` predate the current layout. See the
[build checklist](devpost/checklist.md) and [shipping record](devpost/shipping.md)
for current evidence, deployment checks, and remaining video/submission steps.

## Project map and planning

- `src/model/`: pure run pace/simulation, placement, inventory, construction,
  progression, and save validation.
- `src/controller.ts`: progress ownership, commands, settlement, and persistence.
- `src/game/`: Phaser scenes, shared projection, map camera, scenery, and input.
- `src/ui/`: HTML controls, construction panel, HUD, results, and responsive CSS.
- `tests/`: deterministic checks and prepared browser journeys.
- `devpost/`: [scope](devpost/scope.md), [PRD](devpost/prd.md),
  [technical specification](devpost/spec.md), current guides, and revision records.
- [Offline app map](devpost/app-map.html): follows Build through interface,
  controller/model/save, and visible construction; points to pace/streaming too.

## Original art and license

Runtime PNGs were generated for this project with the built-in image tool.
[The asset manifest](public/assets/manifest.json),
[runtime art record](design/runtime-art-prompts.md), and
[coastal experience record](design/coastal-experience-v3.md) record sources,
prompts, dimensions, and runtime framing. Original image bytes are preserved;
transparent padding is trimmed into runtime frames by the loader.
Promotional artwork is labelled as illustration, not a gameplay screenshot.

No existing Zalura code or artwork was reused. Fonts are system fonts; icons
and interface effects use original code. The project is [MIT licensed](LICENSE);
third-party dependencies retain their own licenses. Package versions are pinned
in `package.json` and `package-lock.json`. The Devpost skill pack is retained
under `.agents/skills/`.
