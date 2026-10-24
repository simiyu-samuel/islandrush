---
doc: prd
status: approved
---

# Island Rush — Product Requirements

An endless runner and island-building game for players who enjoy short arcade
sessions and choosing how a small settlement develops.

Source: `scope.md > The Unique Kernel`, `Who It's For`, and `The Core Loop`.
The learner approved this revised product plan on 22 October 2026. It includes
collision-ended runs that retain collected materials and coins, material
purchases, and the reviewed starting defaults below. Balance values may be
tuned through playtesting without changing the agreed progression or rules.

## The Core Journey

1. On first use, arrive on the island beside an empty home plot. A short welcome
   explains that running earns building materials.
2. Preview the available home designs, select one, and see its material cost.
3. Start an endless supply run. Brief contextual hints introduce movement, collecting a
   floating timber pickup or coin, and avoiding a grounded obstacle. Guidance is
   skippable; skipping does not grant resources or skip construction.
4. Collect materials and coins until choosing Head home or hitting an obstacle. End
   the run, preserve its collected loot, and show the result. Choose Return to
   Island or Run Again.
5. On the island, see the selected building's requirements, available materials,
   and coin balance. Use coins to buy missing eligible materials, build when
   enough materials are available, or return to running.
6. Completing the home unlocks level 2, the workshop, lookout, and relevant new
   materials. Select an unfinished project and repeat the same loop.
7. Completing both level-2 buildings produces a starter-settlement completion
   state. The finished island retains the player's selected building designs.

Source: `scope.md > The Core Loop`, `Agreed Level Progression`, and
`What "Working" Looks Like`.

## Screens and Layout

These are views of the same small game, not separate product modules.

### Island and Construction

The island is the dominant scene, with the adult courier near the dock, clear
paths, and existing buildings placed among clear roadside grass blocks. Level, stored materials, and coins sit
in compact status areas. The current goal and a main Run action remain easy to find.

On desktop, selecting an available plot opens a compact construction panel
while keeping the island visible. On screens narrower than 960px, the island is
unobstructed by default. A bottom icon bar provides Island, Buildings, and Run;
Buildings opens a separate scrollable settlement screen with designs and costs,
and closing it returns to the island. The Run action remains easy to reach.
The construction view previews the building designs, material costs, stored
amounts, and what is still missing. An integrated material-purchase area shows
eligible bundles, coin prices, and the remaining coin balance before purchase.
Build is actionable when affordable and replaces Gather supplies in the fixed
construction action area. A larger selected-design preview and its description
help players compare the two designs. A secondary action still allows running
for more supplies when a build is affordable. Building sites are numbered isometric
footprints with survey stakes and selected/locked states, at a smaller scale
within a large connected road-network island. The map has multiple landscaped
and open blocks, a waterfront, inlet, and footbridge; these are scenery rather
than additional buildable projects. Drag and zoom controls explore the map,
with a reset view and automatic focus when construction begins. Locked level-2 plots explain that finishing
the home unlocks them.

### Endless Run

The route, character, obstacles, and floating pickups dominate. The compact HUD
shows distance, current pace, this run's materials and coins, and Pause. Island inventory
is hidden while running. A supply-goal readout shows saved stock plus the current
run's loot against the selected building recipe; pickup quantity labels explain
what was collected. A clear Head home action banks the run at any moment. Group the loot
counters compactly so they do not crowd the route. The course has
exactly three lanes. A coastal jungle setting and the island on the horizon
connect the run to home. The continuous stone trail, floating collectibles, and
grounded blocks have distinct depth/shadow cues. Encounters are staggered rather
than placing pickups and obstacles at the same depth. Slow roadside parallax and
short scene transitions respect reduced motion. On mobile, smaller foliage sprites
stay fully outside the trail so all three lanes remain readable. Island names/level remain in a
contained header; floating building-name labels are removed from the map.
The two visible dividers, pickups, obstacles, and courier
share the same road perspective; the entire road surface moves, including
both outer lanes. Portrait and landscape layouts keep the HUD and touch
controls clear of the play area. The player runs forward automatically and controls lane changes
and jumps. Controls use the keyboard on desktop and swipes on
touch devices; clear hints explain both where relevant.

### Run Result

Show why the run ended: the player chose to return or hit an obstacle. Show collected
materials and coins and the resulting stored totals. Offer Return to Island
and Run Again clearly. Both end reasons preserve the loot. Credit happens once,
independent of which action the player chooses or how often they press it.
Run Again starts a new run at the starting pace with the stored inventory intact;
it does not resume beyond the collision.

### Guidance, Pause, and Completion

First-use guidance appears in the relevant scene and clears after the player
performs the action. Pause freezes motion and active time, with Resume and
End run and return actions. Returning focus to the game does not unexpectedly
resume a paused run. Settlement completion celebrates the visible island and
offers viewing it or restarting with a clear confirmation.

Source: `scope.md > The Core Loop` and `Inspiration & Identity`. The layouts and inputs were accepted with this product plan.

## Look and Feel

Established direction: Pixel Coast leads, Painted Adventure also appeals, the
character must look adult, the island needs usable space and clear paths, and
materials must float and animate separately from grounded hazards.

Art direction: coherent pixel art for the world, courier,
buildings, pickups, and interface accents, using the warm coastal atmosphere of
the painted study as inspiration. Use readable lettering, restrained interface
panels, clear silhouettes, and sufficiently strong separation between action
and scenery. Preserve the mature character proportions from the revised study.

Pickup animation should gently bob/rotate, then give a short collection cue.
Construction shows five seconds of foundation, framing, and roof work on the
plot before revealing the chosen building; it must not merely swap an image. Level
unlocks should clearly reveal the new projects and resource type. Keep motion
brief and purposeful; reduced-motion presentation should retain the same cues
without relying on effects. Concept art is a visual reference, not a substitute
for verifying readability in actual gameplay.

Source: `scope.md > Inspiration & Identity` and the learner's visual-study
feedback. The coherent pixel-art treatment was accepted with this product plan.

## Features and Behavior

### Guided First Play

Keep onboarding within the normal island, construction, run, and result views.
Running starts after the player starts the run; contextual run hints do
not block movement. Start with a readable, forgiving opening so the first
collectible and obstacle are not immediately on top of the character.

Remember completed guidance with saved progress. Returning players resume their
island without repeating onboarding. A skip control dismisses guidance while
leaving normal project selection, running, and construction available.

### Endless Running and Collisions

Runs have no time limit. Pace increases gradually from 18 to 34 route units per
second over 80 active seconds, then holds a playable cap. Later encounter rows
include hazards more often. Pausing or losing focus freezes motion, pace, and
active time until explicit Resume. Inputs change lanes or jump; obstacles and
pickups have separate depths and usable reaction time. Head home ends the run
and banks its supplies; the pause panel offers the same return choice.

Learner-specified collision rule: hitting an obstacle immediately ends the
current run. Stop route motion, controls, further pickups, and active time;
show brief readable impact feedback, then the result with Run Again and Return
to Island. Preserve all materials collected before impact. Collected coins are preserved as well. Voluntary return and
collision share one end-of-run credit operation; overlapping end triggers or
repeated inputs cannot credit the same loot twice. There is no continuation of
the same run after a collision.

### Material Availability and Run Results

At level 1, the unfinished home requires timber. At level 2, the selected
unfinished building's requirements determine the resource types available.
Completed or locked projects do not introduce irrelevant pickups. Picking up a
material updates the run's yield. Coins are an additional floating collectible
available during runs at both levels. A run ending through voluntary return or collision
transfers its materials and coins to stored balances exactly once. Previously
stored surplus is retained.

Represent stone pickups as floating, animated collectible forms distinct from
large, solid road boulders. Position, silhouette, and movement should distinguish
collectibles and obstacles, rather than color alone.

Run Again retains stored materials, coins, and the current unfinished target
and starts a fresh run. Returning to the island lets the player construct or select another
unlocked unfinished project before the next run.

### Coins and Material Purchases

The learner requested coins collected during running that can buy materials.
Keep purchases within the existing construction panel, near the material
shortfall. Show the quantity received, full coin price, and resulting balance.
The player explicitly chooses a purchase; coins are not automatically spent.

Starting exchange values:

| Collectible or purchase | Value |
| --- | --- |
| One collected coin | 1 coin in the run's yield |
| Timber bundle | 10 coins buys 5 timber |
| Stone bundle | 15 coins buys 5 stone |

These starting settings were accepted during review. Tune them alongside drop
frequency so both direct collection and purchases are useful.

Apply the same level/project eligibility as material pickups: level 1 offers
only timber; stone becomes available with level 2 and relevant unfinished
construction. Coins do not unlock buildings or levels directly. A purchase
with enough coins deducts its price and adds the stated material quantity once.
Insufficient coins leave both balances unchanged and show the shortfall. Keep
surplus materials after construction. The initial coin balance is zero.

### Construction and Building Designs

Initial design set: two visual designs for each of the home, workshop, and
lookout. Previewing/selecting a design changes its appearance, with the same cost
for both designs of a building. Players may choose among eight inspected clear
grass blocks and relocate a completed building for free. Choose location / Move
building opens a ghost preview; select a block by map tap or accessible block
button, flip facing to align with the road, then confirm or cancel. Occupied or
explicitly reserved blocks are unavailable; roads, water, and gardens are excluded.
Moves preserve completion and stock. Pending construction temporarily locks
placement. Save confirmed location/facing; cancel never mutates the saved island.
Fully unconstrained terrain placement and terrain editing remain deferred.

Initial balance values:

| Building | Level | Timber | Stone |
| --- | --- | --- | --- |
| Home | 1 | 30 | 0 |
| Workshop | 2 | 40 | 20 |
| Lookout | 2 | 20 | 40 |

Each material pickup initially contributes five units of its material. These
are accepted starting balance settings to tune through playtesting.

Construction occurs when the player deliberately chooses Build with sufficient
stock. Reserve/deduct the recipe once, persist a five-second construction
deadline, and show the plot being built with a percentage progress bar above
the structure. Reveal the completed chosen design and
unlock progression only when construction finishes. Repeated presses cannot
charge again; reload resumes the original deadline. Run and design changes are
unavailable during the brief build. Insufficient stock leaves materials intact and shows the exact
shortfall. Resources are never silently spent after a run. Design changes before
construction do not consume materials.

### Level Progression

Completing the home unlocks level 2 and its projects/materials. Both the workshop
and lookout become available; the player can choose their construction order.
Completing both marks the first settlement complete. There are two levels and
three building types, matching the approved scope.

### Saved Progress and Restart

Retain island progress in the same browser, including materials,
coins, completed buildings, selected styles, level, active target, and finished
guidance.
Refresh/reopen returns to the island. An unfinished run is not resumed or credited;
previously stored materials, coins, and completed construction remain.

If progress cannot be saved, state that clearly and let the current session
remain playable. Never silently overwrite unreadable saved progress; offer a
clear fresh-start choice. Restarting an existing settlement requires confirmation
because it resets that browser's saved island. Cross-device synchronization and
player accounts are outside this first version.

Sources for these behavior groups: `scope.md > The Core Loop`,
`Agreed Level Progression`, and `The POC Boundary`. The timing, inputs, recipes, exchange prices, layouts, grass-block placement and relocation (24 October revision), style
count, and persistence behavior were approved with this product plan. Terminal
collisions, retaining collected materials, and coin-to-material purchasing were
explicit revisions supplied by the learner.

## States and Boundaries

- First use: empty home plot, level 1, zero stored materials/coins, short guidance.
- Locked content: workshop/lookout identify the home-completion unlock.
- Insufficient materials: show exact remaining amounts and a clear way to run.
- Paused or unfocused: character, hazards, collections, and pace progression stop.
- Voluntary return or collision: stop once, preserve and credit the loot, show the
  end reason, and offer Run Again or Return to Island.
- Insufficient coins: show the bundle price and shortfall without changing stock.
- Locked material: keep it unavailable until the corresponding level/project unlock.
- Construction success: deduct once, show the chosen building, update progression.
- Returning visit: restore the saved island; avoid duplicate run rewards.
- Storage unavailable/unreadable: explain the state and provide a playable path
  without presenting unsaved progress as saved.
- Settlement complete: show all three selected designs and the completion state;
  further construction targets are not invented beyond the approved scope.

## Acceptance Criteria

- A fresh player can follow or skip guidance and select an available home design.
- A run continues beyond 60 seconds, with a gradual pace increase and denser later
  hazards. Pause/focus loss freezes progression; Head home banks a run at will.
- Pickups visibly float and add only their own material to the run yield.
- A collision stops the run and active time, prevents further collection, and preserves
  previously collected materials/coins before showing the two result actions.
- Repeated result actions or overlapping return/collision cannot grant the
  same run yield twice.
- An eligible material purchase exchanges the exact displayed coin price for its
  stated quantity; insufficient coins and locked materials leave balances unchanged.
- Build works only with the required stock and cannot consume a recipe twice.
- Completing the home unlocks exactly the two level-2 projects and appropriate
  pickups; completing both finishes the settlement.
- Run Again preserves banked materials/coins and the selected unfinished target,
  resetting the pace, distance, and course for a genuinely new run.
- Selected designs appear in the actual completed island, not only in previews.
- A normal reload restores saved progress, while a partly played run adds no reward.
- The playable scene, HUD, and construction panel remain legible on desktop and
  phone-sized browser views; artwork does not obscure the route or essential actions.

## Product Decisions

Initially confirmed by the learner: timed runs (superseded by their 24 October endless-run request); building styles/designs; level-appropriate
materials; construction requirements until completion; immediate island use or
another run; construction-based two-level progression; three buildings; adult
character; additional island space; floating pickups; Pixel Coast as the leading
reference; Markdown review. The learner suggested short onboarding and asked
to proceed after the contextual guided-first-play recommendation. They then
specified that collisions end a run with collected materials retained, and
added collectible coins that purchase materials.

The learner approved the revised product plan, including the guided opening,
60-second runs (superseded on 24 October), three lanes plus jumping, desktop/touch controls, two styles per
building, initially fixed plots (superseded by the 24 October placement request), starting recipes and exchange prices, retained coins on
collision, same-browser saving/restart, and coherent pixel-art treatment.

24 October follow-up: after approving the coastal runner direction, the owner
requested endless runs, progressive pace/difficulty, unobstructed mobile outer
lanes, and tapping a completed map building to open its move preview directly.
The Buildings panel remains another way to relocate a completed building.

## What We're Building and Deferred Work

Build the complete first-use → select design → endless run → collect → result →
build/unlock loop within one course, two levels, and three buildings, with
collision-ended runs, collectible coins, and material purchases integrated into
construction. Prioritize readability, coherent identity, responsive controls,
and purposeful feedback. Coin purchases do not add more levels or building types.

Additional courses, levels, and a larger building/design library are deferred by
the approved scope. Fully unconstrained terrain editing, accounts, and cross-device saving
remain deferrals to keep this first version focused. No architecture
or service selection is implied by this product draft.

## Handoff to the Technical Plan

The revised PRD is approved. Select an implementation approach in `4-spec`
without reopening the product rules. Balance tuning can continue during
playtesting; product-defining changes should return to the learner.
