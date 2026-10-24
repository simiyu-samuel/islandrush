# Township island terrain — 24 October 2026

The owner supplied a city-builder screenshot as a structural reference and asked
for a large, well-structured island, without copying it or adding functional
buildings. The prior enlarged three-plot composition was explicitly rejected.

## New project asset

- `public/assets/world/island-township-v2.png`
- Built-in image_gen, one generation call, transparent background requested.
- Actual output: 1448 × 1086 RGBA, 4:3. Alpha spans 0–255.
- Original: `/home/simiyusamuel/.codex/generated_images/01a15ea3-bfb6-7010-aa25-4f78f0d53296/exec-9a8954b9-40cb-4dd1-9724-a2054a25c57d.png`.
- Copied byte-for-byte into the project; no image editing or resampling.
- References: owner-supplied city-builder screenshot (structure only) and the
  project's original `public/assets/world/island-v1.png` (art direction only).
  The external screenshot is not redistributed in the repository.
- Inspected generated terrain: connected roads, several smaller grass blocks,
  landscaped pond/plaza, footbridge, coastal inlet, promenade, ridge, and pier.
  There are no baked-in buildings or user-interface elements.

## Runtime composition

The three existing building sprites overlay clear grass lots selected by
inspection of the generated terrain: home (0.442, 0.653), workshop (0.402, 0.452),
lookout (0.746, 0.309). The prompt's requested anchors were approximate guidance;
actual runtime anchors match the chosen generated lots. Buildings occupy roughly
5.5–10.5% of map width, so the broader terrain establishes the scale.

`src/game/islandMap.ts` owns aspect, anchors, responsive viewport, bounded pan,
and zoom limits. `IslandScene.ts` binds pointer dragging and UI camera commands.
The scene removes these listeners on shutdown. A drag does not select a plot;
new construction brings its lot into view. The map resets when reentering the
scene. Map navigation is presentation state and is not written to the game save.
The three-step map strip was removed; settlement tabs retain the real projects.
New empty blocks and landscaping are scenery, not new locked buildings or levels.

## Validation

The generated PNG was inspected directly. Game build and 75 unit/controller/map
checks pass. Three map-camera checks cover initial lot/label bounds, overview
zoom, and extreme pan/zoom at seven viewport sizes. These are geometry checks,
not browser screenshot validation. Browser runtime/gesture verification remains
unperformed under the recorded local-preview URL-policy block. The owner approved the generated terrain direction ("Thats okay"). Player review
of the playable map remains pending; the previous composition was not accepted.

## Final generation prompt

```text
Use case: stylized-concept. Asset type: production terrain map for the browser game Island Rush, 2048x1536 landscape, elevated isometric strategy-game view, genuinely transparent outside the island.
Input image 1 is a STRUCTURE reference only: connected roads, legible small districts, broad developed land. Do not copy its skyline, buildings, exact road layout, UI or objects. Input image 2 is the existing game's ART STYLE reference only: crisp coastal pixel artwork, lush greens, sand, timber and turquoise shallow water.
Create an entirely new LARGE SPRAWLING COASTAL ISLAND MAP. It should feel like an entire buildable township with approximately sixteen varied rectangular/isometric neighborhood blocks connected by a coherent network of narrow slate-blue paved roads, pale sand-colored pavements, intersections, curb corners, and a coastal promenade. The road network extends over most of the island, providing real structure rather than three clearings connected by a Y path. Island spans 92 percent of image width and 85 percent height, roughly broad horizontal irregular diamond shape with an upper wooded ridge, a shallow inlet on the left, a curved sandy beach lower right, small timber pier lower left. Grass blocks contain varied open meadows, terraced lawns, groups of palms, shrub gardens, boulders, walking paths, a small landscaped public square, a pond crossed by a low footbridge, and planted waterfront areas. Roads lead naturally to the pier and each district. Show an inviting partly landscaped undeveloped town, with numerous open blocks, not a completed city.
CRITICAL runtime overlay zones: leave three small unobstructed flat grass blocks without any trees, road, water or props centered at normalized coordinates (0.38,0.64), (0.57,0.51), (0.70,0.36). Each clear zone roughly 0.12 of image width by 0.10 of image height, surrounded by ordinary pavement. These are merely grass lots blended into the larger network, never outlined special targets. The game overlays its existing home, workshop and lookout here. Do not make these three zones dominant; there are many more small blocks and richer terrain across the map.
Style: high quality original isometric pixel game environment, crisp pixel clusters, small-scale scenery, consistent parallel isometric projection matching the reference style, warm daylight upper left, detailed natural coastline with low rocky terraces. Retain readable quiet interiors for gameplay overlays. Entire island and its immediate shallow surf visible. No buildings, skyscrapers, houses, towers, industrial structures, cars, people, vehicles, extra islands, text, numbers, labels, markers, circles, construction icons, UI or watermark. Outside the coastline and narrow surf is truly transparent; no opaque ocean rectangle. Do not recreate the original three-plot island.

```
