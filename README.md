# Island Rush

A coastal runner and island builder, made as a fresh proof of concept for Build
With AI: Basics. Run the coast, collect floating supplies, and turn them into
visible progress on your island.

## Current playable checkpoint

- One three-lane coastal course with an adult courier, jumping, and 60 seconds of active running.
- Floating timber and coins, grounded stone obstacles, and keyboard, swipe, or button controls.
- A collision ends the run immediately. Both collision and timeout bank collected loot once.
- Results offer Run again or Return to island; banked supplies survive browser reloads.
- Two home designs. Build reserves 30 timber once and shows five seconds of foundation/framing/roof work before the final home reveal. Pending construction survives reload.
- Mobile Island/Buildings/Run bottom navigation, a separate Buildings screen, and phone portrait/landscape controls.
- Pause/focus handling and same-browser saves, with guarded save recovery and restart controls.

The workshop, lookout, material shop, complete onboarding, and remaining
settlement art are subsequent approved checkpoints. Their full rules are
described in [the PRD](devpost/prd.md); they are not yet complete in this first
playable version. After home completion this checkpoint permits coin-only
replays while the next projects are being added.

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

## Original artwork and dependencies

The eight runtime PNGs were generated for this project with the built-in
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

For the 23 October responsive/construction revision, all 56 unit tests pass,
covering run settlement, construction timing and reservation, save recovery,
legacy saves, and camera geometry. TypeScript and the production build pass.
The six updated Playwright journeys collect successfully, but were not executed:
the browser tool rejected local-preview access under its URL policy. New mobile
composition, construction motion, and boardwalk rendering still need visual
review. No alternate browser access was attempted.

The five browser journeys and captures in `design/checkpoints/` belong to the
previous playable checkpoint. They do not verify this revision. Early player
feedback has been implemented; the affected screens await a player retry.
The full settlement remains in progress.
