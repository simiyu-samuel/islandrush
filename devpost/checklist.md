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

## Current checkpoint

24 October visual revision: implementation and mechanical checks are complete;
**new player visual review is pending**. The owner requested improvements to all
three areas (overall identity, building experience, and runner), specifically
calling out the small island and round building markers. The revision enlarges
the island, introduces isometric marked sites, consolidates the interface theme,
adds selected-building previews, promotes an affordable Build action, and focuses
the runner HUD on its current task. The approved gameplay scope is unchanged.

All 72 unit/controller checks and the production build pass for this revision.
The local server is running at http://127.0.0.1:5173/. Browser runtime validation
and fresh screenshots remain unperformed under the previously recorded browser
URL-policy block. The 23 October acceptance applies to the earlier build only.

- [x] Implement the requested UI/UX revision and run mechanical verification.
- [ ] Player reviews larger island, site markers, building choices/actions, and
  a run on desktop and mobile; record feedback and revise as needed.

## Slices

- [x] **1. A run earns supplies that build your first home**
  Becomes usable: Open a coastal island, select a home design, run a 60-second three-lane course, collect floating timber and coins, and return with banked loot. A collision immediately ends the run. Build the selected home when you have 30 timber and see it appear on the island.
  Why now: Proves the distinctive play → collect → build loop and the uncertain visual/gameplay quality before investing in all settlement art. Scaffolding belongs inside this working behavior.
  PRD ref: `prd.md > The Core Journey`, `prd.md > Look and Feel`, `prd.md > Timed Running and Collisions`, `prd.md > Material Availability and Run Results`, `prd.md > Construction and Building Designs`
  Spec ref: `spec.md > Stack`, `spec.md > Where It Runs and How Someone Tries It`, `spec.md > Look and Feel`, `spec.md > Components`, `spec.md > Data Model`, `spec.md > File Structure`, `spec.md > Verification and Early Playable Slice`
  Build: Verify and pin compatible dependencies; scaffold Phaser/TypeScript/Vite; implement the initial controller and rules, original adult-courier/route/pickup/obstacle/home art, island and runner scenes, keyboard and basic touch controls, readable HUD, jump/lane movement, pause/resume, result choices, one-time reward settlement, home construction, and ordinary same-browser saves. Indicate that home completion unlocks level 2; its full projects arrive in slice 2.
  Verify (mechanical): Run typecheck, focused run/progress/save tests, and production build. Start the local server and confirm HTTP 200. Exercise actual collection, impact, timer end, Run Again, Return to Island, home build, and reload in the browser. Check desktop/phone composition and image/contact timing at real speed. Test that collision/timeout cannot double-credit and no pickup is awarded beyond impact.
  Learner check: Open the local game, try both home previews, run and collect, deliberately hit an obstacle, then restart or return and build when stocked. Describe how the adult courier, floating loot, obstacle readability, controls, and island spacing feel in motion.
  Commit: `Build playable runner-to-home construction loop`

- [x] **2. Coins and building choices complete a two-level settlement**
  Becomes usable: Spend coins on eligible materials, choose workshop or lookout targets and designs, collect relevant timber/stone, and complete the starter island in either order.
  Why now: Extends the visually reviewed core loop with the approved progression and economy, keeping the same controls, inventory, and construction interaction.
  PRD ref: `prd.md > Coins and Material Purchases`, `prd.md > Construction and Building Designs`, `prd.md > Level Progression`, `prd.md > Material Availability and Run Results`, `prd.md > States and Boundaries`
  Spec ref: `spec.md > Components`, `spec.md > Data Model`, `spec.md > Look and Feel`, `spec.md > Important Failure Modes`
  Build: Add two designs each for workshop and lookout, level-derived material/building gates, target switching, stone pickups, transparent 10-coin/5-timber and 15-coin/5-stone exchanges, stock-aware explicit construction, saved choices/progress, and settlement completion feedback. Keep the one course, fixed plots, and approved recipes.
  Verify (mechanical): Run typecheck, tests, and production build. Verify insufficient funds/stock leave state unchanged, locked content stays gated, each build deducts once, and both project orders derive completion correctly. Exercise purchase → run → build → reload and both final-building orders with focused browser checks.
  Learner check: Finish the home, choose the next project/design, buy a material pack, collect the remaining requirements, and build. Confirm prices, progress, choices, and unlocks are understandable.
  Commit: `Add material shop and two-level settlement progression`

- [x] **3. A new player can learn, recover, and finish comfortably**
  Becomes usable: First-time players learn through a short playable journey; returning players resume their island. The complete experience handles phone input, focus changes, save failures, and confirmed restarts clearly.
  Why now: Refines the full working journey after the visual and progression choices have been exercised; final verification can now cover every agreed behavior together.
  PRD ref: `prd.md > Guided First Play`, `prd.md > Guidance, Pause, and Completion`, `prd.md > Saved Progress and Restart`, `prd.md > Screens and Layout`, `prd.md > Acceptance Criteria`
  Spec ref: `spec.md > Components`, `spec.md > Look and Feel`, `spec.md > Verification and Early Playable Slice`, `spec.md > Important Failure Modes`, `spec.md > Where It Runs and How Someone Tries It`
  Build: Integrate skippable playable onboarding, returning-player routing, clear contextual hints/results/completion, responsive touch and keyboard affordances, reduced-motion feedback, invalid/unavailable save recovery preserving old data until confirmation, restart confirmation, load/retry states, original-asset provenance, and local run/build instructions. Refine the existing art and feedback using reported observations.
  Verify (mechanical): Run typecheck, complete rule tests, focused browser core-journey/responsive checks, and production build. Verify onboarding → design → run → result → buy/build/unlock, reload, focus pause/explicit resume, corrupt/unavailable saves, restart cancel/confirm, and no progress loss from result actions. Inspect the production preview at desktop and phone sizes and record any browser/runtime limits honestly.
  Learner check: Explore as a new player and a returning player. Try the complete journey on a phone-sized view, switch tabs during a run, reload after banking loot, and cancel a restart. Report anything confusing, visually weak, or broken before the final revision round.
  Commit: `Finish guided onboarding and resilient responsive gameplay`

## Hands-on Checkpoints

- [x] Early usable behavior explored — after slice 1, before expanding the settlement art/content; collect feedback on motion, readability, adult character, controls, and island space.
- [x] Final kick-the-tires exploration and feedback completed — after slice 3 and before recording readiness.
Previous slice 1 snapshot verification: 26 rule tests and all 5 browser journeys passed,
including replay/deduplication, build/save, pause/resume, slowed-frame timing,
and phone controls/layout. Typecheck and production build pass. Reviewed captures
are in design/checkpoints/. These checks and images predate the early-feedback
revision and do not verify its new layout or renderer. Player feedback has now
been received; implemented refinements were accepted in the player’s 23 October playtest. The device matrix and every individual edge case were not separately reported.

- In learn mode, also perform the slice 2 learner check before committing that slice.
- Record actual feedback and verification here as checkpoints happen; do not infer a player review from automated checks.

## Final Review

- [x] Early-feedback revision: mobile Island/Buildings/Run navigation and separate Buildings screen, accepted in the overall reported playtest; device-specific coverage was not reported.
- [x] Early-feedback revision: five-second visible construction and final reveal, with one charge, reload-safe progress, and a percentage progress bar above the structure.
- [x] Early-feedback revision: responsive runner and one coherent moving road with exactly three lanes; preserve mobile width, narrow desktop width, and simplify plank movement; accepted in the overall reported playtest.

- [x] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [x] Learning activity complete — one focused visual-design investigation using an actual before/after and the relevant rendering/input/UI code.
- [x] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate.
- [x] `devpost/app-map.html` generated from finished code, source-checked, and delivered as a file link, including a project-grounded practice to reuse.

Activity and evidence: Focused alternative completed through the actual road investigation: player feedback rejected desktop width and disruptive texture motion, then clarified that mobile width should remain. The retained `83451f9` revision narrowed desktop only and simplified movement. A source-based recap connected this to the camera tests and later player acceptance. This is not a claim of an interactive guided code tour.
Route and stops: Reference route in `devpost/app-map.html`: `src/ui/app.ts > construction()/case build` → `src/controller.ts > build()/updateConstruction()` and model reservation/save → `src/game/scenes/IslandScene.ts > paintConstructionMeter()` and visible reveal.
Edit outcome: The user-directed road revision was kept and committed; an additional incidental edit is not applicable to this focused alternative.
Reflection: Optional prompt offered in the app map, unanswered and non-blocking. No personal learning claim is made.
Activity mode: Actual feedback/revision investigation plus brief evidence-based recap. The app map has 18 checked local links and 14 checked source anchors, no scripts or external resources. Opening in Codex returned queued; a direct file link is provided, and browser-render verification was not performed.

## Revisions

- Added a settled-run ID ledger alongside the last settled ID: an old result arriving after a newer run needs deduplication too; the player-facing reward rule is unchanged.
- Pinned compatible first-build versions after registry verification: Phaser 4.2.1, TypeScript 5.9.3, Vite 8.3.5, Vitest 5.0.5, and Playwright 1.64.1. Vite 8 requires a chunk callback rather than the older object form.
- Reinstalled dependencies cleanly after the full-disk interruption produced a truncated native build-tool binary. Dependencies are back in the ordinary project-local node_modules after the learner freed space.
- Compact-layout visual QA exposed a clipped Gather supplies action. Reduced redundant compact-panel content so the action remains visible and strengthened the readable text sizes.
- Browser QA found Phaser delta smoothing stretched active run time on slow rendering. Disabled smoothing so the existing model receives real elapsed time, and aligned obstacle artwork height with physical jump clearance.
- Added the matching Node 22 type declarations for the browser-test screenshot helpers; application/runtime dependencies are unchanged.
- Desktop screenshot review also exposed a clipped run CTA and a compositor artifact from the heavy panel shadow. Compacted spacing, removed the diffuse shadow, and cleared intro text from foliage; browser viewport checks and fresh captures verify the result.

- Early player feedback requested a clear mobile island with bottom icon navigation and a separate Buildings screen, five seconds of visible construction, and a responsive runner whose three playable lanes occupy the whole moving boardwalk. Implemented these refinements before expanding settlement content: mobile screen navigation, durable five-second construction with staged geometry, and a shared full-width moving boardwalk projection.

- Verification on 23 October: all 56 unit tests pass, including six camera checks and construction/reload/legacy-save coverage. TypeScript and production build pass. Six browser journeys collect with `playwright test --list`; runtime execution and new screenshots were not performed because browser local-preview access was rejected under the tool URL policy. No alternate browser workaround was attempted. The new composition and motion require a player retry; the three feedback items above remain unchecked for that reason.

- Follow-up player feedback rejected the wide desktop road and disruptive texture motion. Replaced the moving road mesh with a continuous painted deck, quiet moving plank joins, and fixed edge strips. Narrowed desktop only; mobile retains its previously reviewed width. Added a percentage progress bar above the construction roofline, including 100% during the final reveal. Browser visual verification remains blocked by the previously reported tool URL policy.

- Follow-up verification: 62 unit tests pass, including desktop road bounds at three sizes and unchanged mobile width at three sizes. Production build and TypeScript pass. No new browser run or screenshot is claimed.

- The learner said “proceed” after the road correction. Continued into slice 2: six building designs, stone pickups, target selection, explicit material purchases, both level-two project orders, and settlement completion are implemented. All 66 unit/controller checks and the production build pass. Eight browser journeys collect but remain unexecuted under the existing URL-policy block. Slice/player verification boxes stay open until hands-on retry; no readiness claim is made.

- Slice 3 implementation: integrated skippable contextual design/run/build guidance, persistent actual-action milestones, a first-run control hint that clears after input, returning-island compatibility, completion actions, and recovery coverage. All 72 unit/controller checks and production build pass; ten browser journeys collect only. Final hands-on review and visual QA are pending under the recorded browser access limitation.

- On 23 October the player explicitly reported: “Perfect its working have tested lets proceed.” Marked implementation, hands-on acceptance, and feedback resolution complete on that evidence; no specific device/edge-case coverage is inferred. Created the offline app map from `cf9590f`, statically checked its links/anchors, and queued it to open. Continued into shipping preparation; no deployment or submission was performed.

- The owner approved MIT on 23 October. Added the exact reviewed license text as root LICENSE, set matching package metadata, and updated sharing records. The hackathon requirements were checked again while answering whether the game fits the brief; no runtime AI feature is stated as a project requirement. Demo/form/submission remain pending.

- 24 October UI/UX feedback reopened visual review after shipping preparation.
  The owner named all three areas and specifically requested a larger island
  and better, non-round building markers. Implemented larger map composition,
  inward mobile plot anchors, numbered isometric construction sites, consistent
  ocean/cream/amber controls, larger design previews, a fixed affordable Build
  action, and focused runner HUD with recipe progress and pickup quantities.
  Preserved road width/motion, game rules, existing art, and save compatibility.
  Production build and all 72 unit/controller checks pass. New hands-on review
  remains pending; no fresh browser execution or screenshot is claimed.
