# Island Rush

A coastal runner and island builder, made as a fresh proof of concept for Build
With AI: Basics. Run the coast, collect floating supplies, and turn them into
visible progress on your island.

## Placement and coastal runner — 24 October

Choose **Choose location** before building, or **Move building** after completion.
Select a highlighted grass block (or its block button), flip the facing, and
confirm with **Place here**. Cancel keeps the previous layout. Eight clear blocks
are available; occupied/reserved blocks, roads, water, and gardens stay clear.
Moves are free and confirmed locations/facing survive reload. Old saves retain
their original defaults. No new building types or levels were added.

The island has a contained status header and visual site cues without floating
names. The runner uses a coastal jungle backdrop, a distant island, masked slow
foliage, a continuous stone trail, softer perspective growth, and encounters at
separate depths. Pickups float; grounded obstacles have a distinct ground cue.

Production build and all **84 unit/controller/geometry checks** pass. Ten browser
journeys collect but remain unexecuted under the recorded local-preview URL-policy
block. The generated assets were inspected; gameplay/gesture review is pending.
Exact scenery prompts and implementation notes are in
[the coastal experience record](design/coastal-experience-v3.md).

## Current playable checkpoint

- One three-lane coastal course with an adult courier, jumping, and 60 seconds of active running.
- Floating timber, stone, and coins, grounded stone obstacles, and keyboard, swipe, or button controls.
- A collision ends the run immediately. Both collision and timeout bank collected loot once.
- Results offer Run again or Return to island; banked supplies survive browser reloads.
- Home, workshop, and lookout, each with two original designs. Home unlocks level 2; the other two projects can be completed in either order. Build reserves its recipe once and shows five seconds of foundation/framing/roof work before the final building reveal, with a percentage bar above the structure. Pending construction survives reload.
- A narrower desktop road with a continuous stone trail and subtle moving joints; mobile road width is preserved.
- Mobile Island/Buildings/Run bottom navigation, a separate Buildings screen, and phone portrait/landscape controls.
- Short contextual first-play guidance: choose a design, gather supplies, then build. Skip at any point; completed actions are remembered.
- Pause/focus handling and same-browser saves, with guarded save recovery and restart controls.

The material shop exchanges 10 coins for 5 timber, or 15 coins for 5 stone after
level 2 unlocks. Only materials relevant to the active unfinished project are
offered. Surplus survives construction. Finishing all three landmarks completes
the starter island; coin-only replays remain available. Full rules are in
[the PRD](devpost/prd.md).

## Run locally

Use Node.js 22.12 or later.

```sh
npm ci
npm run dev
```

Open the Local URL printed by Vite, normally http://127.0.0.1:5173/.
The game uses WebGL and browser localStorage. It needs no API keys, accounts,
backend, or real payments. Progress is saved only in this browser and origin;
an unfinished run is discarded on reload.

Controls: Left/Right or A/D changes lane. Space/Up/W jumps. Escape/P pauses.
Touch players can swipe horizontally/up or use the visible buttons.

## Check and build

```sh
npm test
npm run build
npm run preview
```

Focused browser checks use Playwright. Install its Chromium runtime with
`npx playwright install chromium`, or use an existing Chromium executable:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:browser
```

The production output is `dist/`. Deployment is a later decision; the current
workflow is local-first. The source and PNG assets are committed; dependencies,
build output, test reports, local secrets, and the private learner profile are
ignored.

## Where changes belong

- `src/model/`: pure run, inventory, construction, progression, and save rules.
- `src/controller.ts`: one owner for progress, run transitions, reward settlement, and saving.
- `src/game/`: Phaser scenes, projection, sprite presentation, and game input.
- `src/ui/`: semantic controls, construction panel, HUD, results, and responsive styling.
- `tests/`: deterministic rule checks and focused browser journeys.
- `devpost/`: approved scope, PRD, technical plan, and live build checklist.

## License

This project is licensed under the [MIT License](LICENSE). Third-party packages
retain their respective licenses.

## Original artwork and dependencies

The thirteen runtime PNGs were generated for this project with the built-in
image-generation tool. Their dimensions, frame layouts, sources, and original
prompts are recorded in [the asset manifest](public/assets/manifest.json) and
[the runtime art record](design/runtime-art-prompts.md). Concept studies and their
prompts are in `design/reference/`. PNG originals are preserved; transparent
sprite padding is trimmed into runtime frames by the loader.

No existing Zalura game code or artwork was reused. The interface uses system
fonts and original code-drawn icons/effects. Package versions are pinned in
`package.json` and `package-lock.json`; dependency licenses remain with their
respective projects. The official Devpost skill pack is retained in
`.agents/skills/`.

Build progress, player feedback, and remaining work are tracked in
[the build checklist](devpost/checklist.md).

## Verification

For the 23 October settlement and guidance checkpoint, all 72 unit/controller
checks pass. They cover collision/timeout settlement, exact construction
reservation and timing, both settlement orders, purchases and stone contacts,
reload during and after construction, saved designs, legacy islands, guide
milestones and skipping, focus pause, corrupt-save preservation, session-only
play, and responsive camera geometry. TypeScript and the production build pass.

All ten Playwright journeys collect successfully but remain unexecuted: the
browser tool rejected local-preview access under its URL policy. New layout,
art composition, and motion still require browser/player review. No alternate
browser access was attempted. The five browser journeys and captures in
`design/checkpoints/` belong to the earlier playable snapshot and do not verify
this checkpoint. On 23 October the player reported testing the current game
successfully and accepted it. That confirmation does not mean the ten automated
browser cases or every device/edge case were exercised.

The offline [app map](devpost/app-map.html) explains the Build action and where
to change the road, recipes, and controls. [Shipping status](devpost/shipping.md)
tracks the remaining demo and submission steps.
