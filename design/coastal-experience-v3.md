# Coastal experience revision — 24 October 2026

## Player decisions

The owner requested choosing and moving building locations, better isometric
alignment, no floating building-name labels, contained island status, a coastal
jungle runner with the island far away, and less crowded approaching entities.
They explicitly confirmed placement among clear grass blocks, leaving roads,
water, and landscaping clear. This supersedes the earlier fixed-plot decision.

## Island behavior

- Eight inspected grass-block anchors in `src/model/placement.ts`; no additional
  building types, levels, roads, or currencies. A plan or completed building can
  choose any unoccupied valid block. Explicit plans reserve their chosen block.
- Choose location / Move building opens a ghost preview. Map taps and the named
  block buttons both select a location; Flip facing mirrors the sprite to either
  road-facing direction. Confirm saves; Cancel leaves the original unchanged.
- Movement costs no materials and preserves completion. Construction locks moves
  until finished. Later projects find a free site if an earlier building used
  their former default. Building positions/facing persist in optional v1 fields;
  old saves are read unchanged, and invalid/colliding metadata is rejected.
- Floating building names are removed. Small tool signs and selected foundations
  identify sites; project names/designs remain in the construction interface.
- Island title, level, and loop explanation live inside a contained header, with
  map space below. Camera focus eases toward a preview/new build and cancels on
  manual drag. Reduced motion removes easing/fades.

## Runner behavior

The backdrop shows coastal jungle and a distant island. Foliage is a separate
transparent sprite layer, masked outside the trail and moving at 48% of route
speed. A continuous weathered-stone trail uses quiet joints and mossy edges.
The three lane centers, trail, hazards, pickups, and courier share one projection.
Desktop road width and mobile contact-line width are retained. Projection depth
uses exponent 1.6 rather than 2 for gentler near-player growth.

The first material/coin chain is spaced at z=16,30,44,58,72, with the first
grounded obstacle at 100 (about 5.6 seconds at the unchanged run speed). Later
material, coin, and hazard encounters have distinct depths, at least 14 units
apart. They move at the same world speed; clarity comes from spacing, perspective,
silhouette, lift, and ground shadows. Coins are smaller and lower than material
bundles; grounded stones have an amber ground cue. The current project thumbnail
in the run objective connects collected supplies to the player's island design.
Scene fades, pickup feedback, and restrained parallax share the coastal palette.

## New original assets

Both generated with the built-in image_gen tool using the approved township
terrain only as an art-style reference. Original PNG bytes copied unchanged.
No source-image editing, resampling, or downloaded third-party assets.

| Runtime file | Actual output | Generated source filename |
| --- | --- | --- |
| `public/assets/world/coastal-jungle-backdrop-v3.png` | 1536 × 1024 RGB | `exec-8903cd85-c396-421f-95d6-4f0bdd37d586.png` |
| `public/assets/world/jungle-foliage-v3.png` | 1254 × 1254 RGBA | `exec-603247da-908f-4cf4-9d6a-7c8b709ea904.png` |

Originals are under `/home/simiyusamuel/.codex/generated_images/01a15ea3-bfb6-7010-aa25-4f78f0d53296/`.
The old route panorama is archived and no longer loaded. Backdrop framing/crop,
foliage alpha trimming, masking, and scene composition happen only at runtime.

## Verification and remaining review

Production build and all 84 unit/controller/geometry checks pass. New checks cover
placement/facing through construction/reload, free relocation, occupied/reserved
blocks, invalid metadata, legacy defaults, canceled previews, command guards,
staggered encounters, and readable projection spacing. Ten browser journeys
collect; their first-obstacle helper now uses the actual course constant.
They remain unexecuted under the recorded browser local-preview URL-policy block.
The generated art has been inspected directly; no fresh gameplay screenshot or
successful runtime gesture/device test is claimed. Player playtest is pending.

Try: choose a location, change block and facing, cancel once, confirm once, build,
move the finished building, reload, and play a run. Check header separation,
building grounding, clear road edges, and approaching-object readability.

## Generation prompts

### coastalRunnerBackdrop

Transparent background: false.

```text
Use case: stylized-concept. Asset type: original runtime backdrop for Island Rush runner, 1536x1024 landscape 3:2, opaque image. Reference is the game's approved isometric island, use ONLY its pixel clusters, vegetation, sunlight and coastal palette; this new backdrop is an EYE LEVEL FORWARD VIEW, never isometric. Scene: a beautiful tropical coastal jungle lagoon seen from a low running camera at the edge of the sea. Soft blue sky with warm cream clouds in upper 25 percent. Place a small distant inhabited island silhouette centered on the horizon at y=26 percent, with terraced greenery, a modest warm roof and tiny lookout hint, clearly very far away. Its shoreline spans about 20 percent of image width. Turquoise open water fills the middle and lower area. On the distant left and right outer margins, lush palm jungle slopes descend to weathered stone shore terraces, ferns, vines and sand. Make this a real coastal adventure environment with depth and layered atmosphere, quiet visual space in the central 65 percent from top to bottom for the game's road and actors to be drawn over it. Do not draw any road, walkway, boardwalk, lane dividers, rope fence, characters, pickups or obstacles. Do not draw a second runner road in the background. No UI, labels, lettering or watermark. Crisp original pixel art with visible deliberate square clusters, mature warm art direction, consistent teal water, lush warm green plants and sand/grey stone. Not cartoon vectors, not photoreal, not blurry. Entire foreground center is water, with coast decoration limited to outer margins. Sky top edge pale cyan #8bd5de.
```

### coastalJungleFoliage

Transparent background: true.

```text
Use case: stylized-concept. Asset type: single original transparent foreground scenery sprite for Island Rush runner. 1024x1024, genuinely transparent background. Use the supplied Island Rush map as an ART STYLE AND COLOR reference only. One compact coastal jungle vegetation cluster viewed at eye level slightly from above, intended to sit beyond the side edge of a running trail: a mature curved palm with full fronds above a group of dense tropical broadleaf ferns, a few creeping vines and a small warm grey stone rock at its roots. Flat grounded base near the bottom, whole silhouette visible with transparent padding around the leaves. Rich detailed but crisp square pixel clusters, warm upper-left sunlight, deep emerald shade, yellow-green leaf edges, teal ambient shadow, the same original warm coastal pixel adventure identity. Organic readable silhouette, restrained detail at small size, no buildings, houses, roads, water backgrounds, labels, text, people, props, pickups, UI or watermark. Just one isolated foliage cluster, no collage or sprite sheet.
```
