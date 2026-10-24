# Island Rush — current game guide

Source: the implemented game at `72275d5`, with deployment/documentation prepared
on 24 October 2026. This describes current behavior, not future expansion.

**Play: https://island-rush-six.vercel.app** — no account required.

## What you play

Island Rush combines an endless three-lane coastal runner with a small island
builder. Runs earn the supplies needed by your chosen construction project.
You choose a building design and clear grass block, gather supplies, return,
and watch construction change the island. No account or payment is needed.

There is one streamed course, two progression levels, three building types,
six designs, and eight eligible grass blocks. The larger connected-road island
includes scenic parks, water, and streets; those are not additional projects.

## First visit

1. Choose one of the two home designs in the construction panel. On a phone,
   open **Buildings** from the bottom bar first.
2. Use **Choose location** to preview an available grass block. Tap a highlighted
   block or its button, optionally **Flip facing**, then **Place here**. Cancel
   discards the preview. Placing a plan does not construct it or spend materials.
3. Choose **Gather supplies**. Short contextual hints explain running; they may
   be skipped without changing inventory or unlocking buildings.
4. Collect floating timber and coins, changing lanes or jumping over hazards.
5. Choose **Head home**, or let a collision end the run. Either banks everything
   already collected once. Choose **Return to island** or **Run again**.
6. With 30 timber, choose **Build your home**. Watch the five-second construction
   and overhead percentage bar. Completion unlocks level 2.

## Endless runner

- The run has no 60-second limit. Distance and pace replace the countdown.
- Speed starts at 18 route units/second and rises by 0.2 each active second to a
  maximum of 34 after 80 seconds, about 1.9 times the starting pace.
- Hazards become more frequent later. Each hazard row leaves two lanes clear;
  pickups and hazards approach at separate depths.
- Floating material bundles add **5** of that material; coins add **1** coin.
  Grounded stone blocks are hazards, not stone supplies.
- Pickups match the selected unfinished project's recipe. Level 1 supplies
  timber; level 2 can supply timber and stone. A completed settlement runs for
  coins only.
- Hitting a block stops the run immediately. There is no continuing through a
  collision; loot collected before impact is kept.
- **Head home** returns with supplies at any point. Pause also offers
  **End run and return**. Repeated result actions cannot award loot again.
- Pause or focus loss freezes active time, distance, speed, and motion. Resume
  is explicit. Reloading discards an unfinished run without granting its loot.

| Action | Keyboard | Touch |
| --- | --- | --- |
| Left / right | Left / Right arrows or A / D | Horizontal swipe or Left / Right buttons |
| Jump | Space, Up arrow, or W | Upward swipe or Jump button |
| Pause | Escape or P | Pause button |
| Return with supplies | Head home button | Head home button |

The runner uses an adult courier, coastal jungle and distant-island scenery,
a continuous stone trail, quieter moving joints, floating pickups, and grounded
hazard cues. Smaller mobile foliage stays beyond the full trail width.

## Build your settlement

| Project | Level | Timber | Stone | Designs |
| --- | --- | --- | --- | --- |
| Home | 1 | 30 | 0 | Coast Cottage / Palm Bungalow |
| Workshop | 2 | 40 | 20 | Harbor Forge / Maker Studio |
| Lookout | 2 | 20 | 40 | Coast Lighthouse / Timber Watchtower |

Complete the home to unlock level 2. Workshop and lookout can be completed in
either order; finishing both completes the starter settlement. Designs of the
same building cost the same. Select a design before construction; completed
buildings retain that chosen design.

Build is deliberate: it reserves the recipe once, shows foundation/framing/roof
stages and a percentage bar, then reveals the finished building. Running,
placement, and design changes are locked during the brief build. Reloading
preserves its original deadline and never charges again. Surplus stays stored.

## Location and movement

Choose among eight clear roadside grass blocks. Occupied blocks and explicitly
reserved plans are unavailable. Roads, water, and landscaping stay clear.
Locations are block-based; there is no arbitrary terrain editing or free dragging.

Tap a completed building directly on the map to open its move preview. Select
another free block, flip its facing if needed, and confirm **Place here**.
**Move building** in its construction panel remains available too. Moves cost
nothing and preserve supplies, design, and completion. Cancel leaves the saved
layout unchanged. Confirmed locations/facing survive reload.

Drag the map to explore. Zoom in/out and Reset view help navigate its larger
layout; the camera also focuses construction and placement previews.

## Coin shop

The selected unfinished project determines available material offers:

- **10 coins → 5 timber**.
- **15 coins → 5 stone**, when level 2 and the project requires stone.

Purchases are explicit and show the price and balance effect. Insufficient
coins and locked or irrelevant materials cannot be purchased. Coins are earned
in-game; there are no real-money purchases.

## Desktop and phone

Desktop keeps the construction panel beside the map. Below 960px, **Island**,
**Buildings**, and **Run** occupy the bottom navigation. Buildings opens a
separate scrollable screen; closing it restores the island view. The run has
its own compact HUD and touch controls. Island name and level sit in a contained
header, without floating building-name labels covering the map.

## Saves and limitations

Completed buildings, chosen designs, confirmed blocks/facing, stored resources,
guide milestones, and pending construction persist in browser localStorage.
Progress is specific to this browser and origin: localhost, preview deployment,
and production URLs have separate saves. There is no account or cloud sync.

Unreadable saves are preserved until an explicit fresh-start choice. If storage
is unavailable, the game explains session-only play. Restart requires confirmation
because it replaces that browser's island. Reduced-motion preferences reduce
nonessential movement. WebGL and JavaScript are required.

## Verification

At `72275d5`, all **91 unit/controller/geometry checks**, TypeScript, and the
production build pass. Eleven browser journeys collect but were not executed
for this version under the recorded tool restriction. Earlier screenshots do
not establish the current layout. The owner approved the coastal runner visual
direction; the final endless/mobile/direct-map-move follow-up awaits a player
retry. See [the build record](checklist.md) for the evidence and history.
