---
doc: checklist
status: approved
---

# Island Rush — Build Checklist

Build mode: fast, confirmed by the learner on 22 October 2026. Perform early
visual feedback after slice 1 and the final hands-on review after slice 3.
Verify and commit every slice; keep code discussion concise.

Git: local initialization and project commits authorized on 22 October 2026.
Remote: https://github.com/simiyu-samuel/islandrush.git (provided by the learner).
Save each verified slice as a local commit; keep private context and secrets ignored.

## Slices

- [ ] **1. A run earns supplies that build your first home**
  Becomes usable: Open a coastal island, select a home design, run a 60-second three-lane course, collect floating timber and coins, and return with banked loot. A collision immediately ends the run. Build the selected home when you have 30 timber and see it appear on the island.
  Why now: Proves the distinctive play → collect → build loop and the uncertain visual/gameplay quality before investing in all settlement art. Scaffolding belongs inside this working behavior.
  PRD ref: `prd.md > The Core Journey`, `prd.md > Look and Feel`, `prd.md > Timed Running and Collisions`, `prd.md > Material Availability and Run Results`, `prd.md > Construction and Building Designs`
  Spec ref: `spec.md > Stack`, `spec.md > Where It Runs and How Someone Tries It`, `spec.md > Look and Feel`, `spec.md > Components`, `spec.md > Data Model`, `spec.md > File Structure`, `spec.md > Verification and Early Playable Slice`
  Build: Verify and pin compatible dependencies; scaffold Phaser/TypeScript/Vite; implement the initial controller and rules, original adult-courier/route/pickup/obstacle/home art, island and runner scenes, keyboard and basic touch controls, readable HUD, jump/lane movement, pause/resume, result choices, one-time reward settlement, home construction, and ordinary same-browser saves. Indicate that home completion unlocks level 2; its full projects arrive in slice 2.
  Verify (mechanical): Run typecheck, focused run/progress/save tests, and production build. Start the local server and confirm HTTP 200. Exercise actual collection, impact, timer end, Run Again, Return to Island, home build, and reload in the browser. Check desktop/phone composition and image/contact timing at real speed. Test that collision/timeout cannot double-credit and no pickup is awarded beyond impact.
  Learner check: Open the local game, try both home previews, run and collect, deliberately hit an obstacle, then restart or return and build when stocked. Describe how the adult courier, floating loot, obstacle readability, controls, and island spacing feel in motion.
  Commit: `Build playable runner-to-home construction loop`

- [ ] **2. Coins and building choices complete a two-level settlement**
  Becomes usable: Spend coins on eligible materials, choose workshop or lookout targets and designs, collect relevant timber/stone, and complete the starter island in either order.
  Why now: Extends the visually reviewed core loop with the approved progression and economy, keeping the same controls, inventory, and construction interaction.
  PRD ref: `prd.md > Coins and Material Purchases`, `prd.md > Construction and Building Designs`, `prd.md > Level Progression`, `prd.md > Material Availability and Run Results`, `prd.md > States and Boundaries`
  Spec ref: `spec.md > Components`, `spec.md > Data Model`, `spec.md > Look and Feel`, `spec.md > Important Failure Modes`
  Build: Add two designs each for workshop and lookout, level-derived material/building gates, target switching, stone pickups, transparent 10-coin/5-timber and 15-coin/5-stone exchanges, stock-aware explicit construction, saved choices/progress, and settlement completion feedback. Keep the one course, fixed plots, and approved recipes.
  Verify (mechanical): Run typecheck, tests, and production build. Verify insufficient funds/stock leave state unchanged, locked content stays gated, each build deducts once, and both project orders derive completion correctly. Exercise purchase → run → build → reload and both final-building orders with focused browser checks.
  Learner check: Finish the home, choose the next project/design, buy a material pack, collect the remaining requirements, and build. Confirm prices, progress, choices, and unlocks are understandable.
  Commit: `Add material shop and two-level settlement progression`

- [ ] **3. A new player can learn, recover, and finish comfortably**
  Becomes usable: First-time players learn through a short playable journey; returning players resume their island. The complete experience handles phone input, focus changes, save failures, and confirmed restarts clearly.
  Why now: Refines the full working journey after the visual and progression choices have been exercised; final verification can now cover every agreed behavior together.
  PRD ref: `prd.md > Guided First Play`, `prd.md > Guidance, Pause, and Completion`, `prd.md > Saved Progress and Restart`, `prd.md > Screens and Layout`, `prd.md > Acceptance Criteria`
  Spec ref: `spec.md > Components`, `spec.md > Look and Feel`, `spec.md > Verification and Early Playable Slice`, `spec.md > Important Failure Modes`, `spec.md > Where It Runs and How Someone Tries It`
  Build: Integrate skippable playable onboarding, returning-player routing, clear contextual hints/results/completion, responsive touch and keyboard affordances, reduced-motion feedback, invalid/unavailable save recovery preserving old data until confirmation, restart confirmation, load/retry states, original-asset provenance, and local run/build instructions. Refine the existing art and feedback using reported observations.
  Verify (mechanical): Run typecheck, complete rule tests, focused browser core-journey/responsive checks, and production build. Verify onboarding → design → run → result → buy/build/unlock, reload, focus pause/explicit resume, corrupt/unavailable saves, restart cancel/confirm, and no progress loss from result actions. Inspect the production preview at desktop and phone sizes and record any browser/runtime limits honestly.
  Learner check: Explore as a new player and a returning player. Try the complete journey on a phone-sized view, switch tabs during a run, reload after banking loot, and cancel a restart. Report anything confusing, visually weak, or broken before the final revision round.
  Commit: `Finish guided onboarding and resilient responsive gameplay`

## Hands-on Checkpoints

- [ ] Early usable behavior explored — after slice 1, before expanding the settlement art/content; collect feedback on motion, readability, adult character, controls, and island space.
- [ ] Final kick-the-tires exploration and feedback completed — after slice 3 and before recording readiness.
- In learn mode, also perform the slice 2 learner check before committing that slice.
- Record actual feedback and verification here as checkpoints happen; do not infer a player review from automated checks.

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — one focused visual-design investigation using an actual before/after and the relevant rendering/input/UI code.
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate.
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse.

Activity and evidence: Pending the real build and player feedback.
Route and stops: Populate with actual code paths and symbols after implementation.
Edit outcome: Pending; optional, not a quiz.
Reflection: Not yet offered; personal responses belong only in the ignored profile.
Activity mode: Planned focused alternative for an experienced developer, centered on visual/gameplay judgment.

## Revisions
