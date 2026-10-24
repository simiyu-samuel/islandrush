# Settlement building art v4

Created on 24 October 2026 with the built-in `image_gen` tool, using its real transparent-background output. No API key, fallback CLI, SVG placeholders, image compositing, resampling, or pixel edits were used. Every selected PNG is copied byte-for-byte into this repository, and the generated original remains at its recorded source path.

The user requested sixteen functional building types across four categories, with repeat construction and an expanded settlement simulation. Four original category atlases provide all sixteen visibly distinct building sprites. Each square atlas has equal 2×2 cells in reading order. Architectural accents share the existing coastal palette and elevated isometric viewpoint; these are new structures rather than copies of a reference game.

Reference images inspected before generation:

- `public/assets/buildings/home-cottage-v1.png`: artistic texture, palette and trim reference only.
- `public/assets/world/island-township-v2.png`: island camera and road orientation reference only.

## Saved originals and frames

The prompt requested 1536×1536; the built-in tool returned 1254×1254 RGBA PNGs, retained at their original returned dimensions. Each runtime cell is therefore 627×627. The manifest records dimensions, alpha range, per-cell solid bounds and SHA-256 hashes.

### Civic

- Asset: `/assets/buildings/settlement-civic-v4.png`
- Source: `/home/simiyusamuel/.codex/generated_images/01a16d4b-f874-7512-b972-38c77a8bcd88/exec-ed6c3bb9-b676-43dc-8305-02ee4cc9f1cb.png`
- SHA-256: `0c7a19660da7430c690292af398a19009d523b4a5b092b490332edee56c8e218`
- Frames: `town-hall`, `community-plaza`, `medical-clinic`, `visitor-lodge`

### Production

- Asset: `/assets/buildings/settlement-production-v4.png`
- Source: `/home/simiyusamuel/.codex/generated_images/01a16d4b-f874-7512-b972-38c77a8bcd88/exec-968c2e2d-b0dc-46ff-9589-b6f6db3779fc.png`
- SHA-256: `68a034c0ed2e9eb4709d003f46677266944bd5682b876e6487a2322fe664d4de`
- Frames: `lumber-yard`, `artisan-workshop`, `windmill-bakery`, `archipelago-pier`

### Utility

- Asset: `/assets/buildings/settlement-utility-v4.png`
- Source: `/home/simiyusamuel/.codex/generated_images/01a16d4b-f874-7512-b972-38c77a8bcd88/exec-56b27fe9-5ccc-4d79-8712-75413c6f5f38.png`
- SHA-256: `7b90837c90e8effcf13a5de477b3309fc316fd00dfcb04bb425eb1aab7cc5806`
- Frames: `rainwater-collector`, `coastal-lighthouse`, `storage-depot`, `geothermal-generator`

### Expansion

- Asset: `/assets/buildings/settlement-expansion-v4.png`
- Source: `/home/simiyusamuel/.codex/generated_images/01a16d4b-f874-7512-b972-38c77a8bcd88/exec-fe4bdaee-d842-4027-b30a-b16f87a9a931.png`
- SHA-256: `554e05fc6bb2f6a01a9a1c15df7255db2c446cd87400f45615e6dece106d1a1a`
- Frames: `pioneer-cottage`, `border-outpost`, `terrace-hamlet`, `bridge-link`

## Runtime consumption and validation

`src/game/art.ts` exports `SETTLEMENT_ATLASES` and `buildingVisual(type, style)`. The latter supplies the same atlas path and cell index to the HTML catalogue and the named Phaser texture frame to the island renderer. Original six style assets remain available for migrated saved buildings.

`BootScene` reads original PNG alpha once and trims **each cell independently** with an alpha threshold of 25. The four courier animation frames keep their existing shared trim behavior. No generated source files are altered. Towers and other tall silhouettes cannot change a neighboring building's frame bounds.

Source inspection confirmed all sixteen cells contain visible pixels strictly inside their cell bounds, transparent canvas outside the sprites, and alpha range 0–255. All selected files have byte-identical generated originals. A conservative `.020` to `.032` map-width footprint fits the new smaller settlement cells; actual selection and camera behavior are handled by the island renderer.

## Exact generation prompts

The following four initial calls each used both reference paths listed above and `transparent_background: true`.

### Civic initial prompt

```text
Use case: stylized-concept
Asset type: one production-ready four-frame game sprite atlas for Island Rush.
Primary request: a single coherent square 2-by-2 sprite atlas, 1536 by 1536 pixels, with FOUR DIFFERENT BUILDINGS, each a separately isolated sprite in its own 768 by 768 cell. This is not a scene or a poster.
Input images: image 1 is a style reference only for warm terracotta tiles, pale stone, teal trim, artisanal pixel-edged game illustration; image 2 is a camera/orientation reference only for matching the island's roads. Do not copy the cottage or island.
Style/medium: premium richly detailed hand-painted pixel game art, crisp edges, warm coastal settlement architecture. Same elevated orthographic isometric camera in every cell, ground edges slope roughly 30 degrees each side, front entrance faces lower left, roof and two facades visible. Light from upper left.
Composition/framing: top left cell 0, top right cell 1, bottom left cell 2, bottom right cell 3. Each whole building with its modest diamond ground footprint fully contained inside its own cell with at least 70 pixels of TRANSPARENT margin to all cell boundaries. Center each sprite. Equal artistic scale, no neighbors, no objects crossing cell boundaries. Genuine transparent background and transparent gaps between all four sprites. Four silhouettes are readily distinct even viewed small.
Color palette: honey stone, whitewashed plaster, warm terracotta roofs, teal doors and shutters, natural brown timber, tropical green planters.
Constraints: no text, names, letters, labels, grid lines, border, UI, people, vehicles, watermark, background scene, colored sheet or fake checkerboard. Keep footprint compact. Actual transparent alpha across empty canvas.
Subjects by exact cell position:
TOP LEFT: Town Hall, broad dignified civic hall with columned entry, arched windows, terracotta hipped roof, small central clock-free civic cupola and teal banner with no symbols.
TOP RIGHT: Community Plaza, an open-air compact diamond paved square with a central fountain, low semicircular benches, two festive plain-color bunting strings and planters; no roof covering the plaza.
BOTTOM LEFT: Medical Clinic, low clean whitewashed building with teal awning, clear red medical cross mounted over the entrance, small herb garden and terracotta roof.
BOTTOM RIGHT: Visitor Lodge, welcoming two-storey seaside inn with a long timber balcony, striped teal-and-cream canopy, luggage-free covered porch and flower planters, complex terracotta gable roof.
```

### Production initial prompt

```text
Use case: stylized-concept
Asset type: one production-ready four-frame game sprite atlas for Island Rush.
Primary request: a single coherent square 2-by-2 sprite atlas, 1536 by 1536 pixels, with FOUR DIFFERENT BUILDINGS, each a separately isolated sprite in its own 768 by 768 cell. This is not a scene or a poster.
Input images: image 1 is a style reference only for warm terracotta tiles, pale stone, teal trim, artisanal pixel-edged game illustration; image 2 is a camera/orientation reference only for matching the island's roads. Do not copy the cottage or island.
Style/medium: premium richly detailed hand-painted pixel game art, crisp edges, warm coastal settlement architecture. Same elevated orthographic isometric camera in every cell, ground edges slope roughly 30 degrees each side, front entrance faces lower left, roof and two facades visible. Light from upper left.
Composition/framing: top left cell 0, top right cell 1, bottom left cell 2, bottom right cell 3. Each whole building with its modest diamond ground footprint fully contained inside its own cell with at least 70 pixels of TRANSPARENT margin to all cell boundaries. Center each sprite. Equal artistic scale, no neighbors, no objects crossing cell boundaries. Genuine transparent background and transparent gaps between all four sprites. Four silhouettes are readily distinct even viewed small.
Color palette: honey stone, whitewashed plaster, warm terracotta roofs, teal doors and shutters, natural brown timber, tropical green planters.
Constraints: no text, names, letters, labels, grid lines, border, UI, people, vehicles, watermark, background scene, colored sheet or fake checkerboard. Keep footprint compact. Actual transparent alpha across empty canvas.
Subjects by exact cell position:
TOP LEFT: Lumber Yard, timber harvesting workshop with open-sided sawing shed, neat stacked log racks, a small saw rig and several replanted saplings on its compact diamond footprint.
TOP RIGHT: Artisan Workshop, stone-and-timber craft studio with tall terracotta chimney, large teal double doors, outdoor workbench holding pots and simple carpentry tools.
BOTTOM LEFT: Windmill Bakery, round stone windmill bakery with four unmistakable wooden sail blades above a low bread-shop annex, bread oven chimney and wheat sheaves; all blades within its cell.
BOTTOM RIGHT: Archipelago Pier, compact diamond timber dock on short pilings, a little teal-roofed harbor storehouse, fish baskets, mooring rope, small crane; no boat and no water plane, transparent beneath dock.
```

### Utility initial prompt

```text
Use case: stylized-concept
Asset type: one production-ready four-frame game sprite atlas for Island Rush.
Primary request: a single coherent square 2-by-2 sprite atlas, 1536 by 1536 pixels, with FOUR DIFFERENT BUILDINGS, each a separately isolated sprite in its own 768 by 768 cell. This is not a scene or a poster.
Input images: image 1 is a style reference only for warm terracotta tiles, pale stone, teal trim, artisanal pixel-edged game illustration; image 2 is a camera/orientation reference only for matching the island's roads. Do not copy the cottage or island.
Style/medium: premium richly detailed hand-painted pixel game art, crisp edges, warm coastal settlement architecture. Same elevated orthographic isometric camera in every cell, ground edges slope roughly 30 degrees each side, front entrance faces lower left, roof and two facades visible. Light from upper left.
Composition/framing: top left cell 0, top right cell 1, bottom left cell 2, bottom right cell 3. Each whole building with its modest diamond ground footprint fully contained inside its own cell with at least 70 pixels of TRANSPARENT margin to all cell boundaries. Center each sprite. Equal artistic scale, no neighbors, no objects crossing cell boundaries. Genuine transparent background and transparent gaps between all four sprites. Four silhouettes are readily distinct even viewed small.
Color palette: honey stone, whitewashed plaster, warm terracotta roofs, teal doors and shutters, natural brown timber, tropical green planters.
Constraints: no text, names, letters, labels, grid lines, border, UI, people, vehicles, watermark, background scene, colored sheet or fake checkerboard. Keep footprint compact. Actual transparent alpha across empty canvas.
Subjects by exact cell position:
TOP LEFT: Rainwater Collector, compact rain-harvesting station with broad sloped teal catchment roof, gutters feeding two round stone water cisterns and visible brass pipes, small plant filtration bed.
TOP RIGHT: Coastal Lighthouse, tall slender white-stone lighthouse with teal bands, warm glowing enclosed lantern and terracotta cap, attached tiny keeper hut; include full tower within cell.
BOTTOM LEFT: Storage Depot, wide secure warehouse with terracotta gambrel roof, teal sliding double doors, tidy crates and resource barrels beside covered loading bay.
BOTTOM RIGHT: Geothermal Generator, coastal eco-power station with rounded stone hot-spring well, copper piping, compact teal turbine housing, one warm mist plume and slim power pylon, no modern smokestack.
```

### Expansion initial prompt

```text
Use case: stylized-concept
Asset type: one production-ready four-frame game sprite atlas for Island Rush.
Primary request: a single coherent square 2-by-2 sprite atlas, 1536 by 1536 pixels, with FOUR DIFFERENT BUILDINGS, each a separately isolated sprite in its own 768 by 768 cell. This is not a scene or a poster.
Input images: image 1 is a style reference only for warm terracotta tiles, pale stone, teal trim, artisanal pixel-edged game illustration; image 2 is a camera/orientation reference only for matching the island's roads. Do not copy the cottage or island.
Style/medium: premium richly detailed hand-painted pixel game art, crisp edges, warm coastal settlement architecture. Same elevated orthographic isometric camera in every cell, ground edges slope roughly 30 degrees each side, front entrance faces lower left, roof and two facades visible. Light from upper left.
Composition/framing: top left cell 0, top right cell 1, bottom left cell 2, bottom right cell 3. Each whole building with its modest diamond ground footprint fully contained inside its own cell with at least 70 pixels of TRANSPARENT margin to all cell boundaries. Center each sprite. Equal artistic scale, no neighbors, no objects crossing cell boundaries. Genuine transparent background and transparent gaps between all four sprites. Four silhouettes are readily distinct even viewed small.
Color palette: honey stone, whitewashed plaster, warm terracotta roofs, teal doors and shutters, natural brown timber, tropical green planters.
Constraints: no text, names, letters, labels, grid lines, border, UI, people, vehicles, watermark, background scene, colored sheet or fake checkerboard. Keep footprint compact. Actual transparent alpha across empty canvas.
Subjects by exact cell position:
TOP LEFT: Pioneer Cottage, compact one-storey new-settler home with terracotta gabled roof, teal front door, stone foundation, small porch and vegetable planter.
TOP RIGHT: Border Outpost, sturdy timber-and-stone frontier watch shelter with a small raised lookout platform, teal canopy, open gate and plain flag, compact diamond foundation.
BOTTOM LEFT: Terrace Hamlet, a charming stepped group of three attached compact homes rising over stone terraces, terracotta roofs at different heights, teal shutters and connecting stairs; one coherent sprite.
BOTTOM RIGHT: Bridge Link, standalone low stone arch footbridge with wooden railings and small terracotta-capped entry posts, spanning transparent space diagonally from lower left to upper right; no river plane and no landscape.
```

## Targeted packing corrections

The first production atlas placed windmill blades across its equal-cell boundary. The initial utility and expansion sheets also had sprites reaching cell edges. Those three versions were rejected for runtime use. The civic sheet already kept all four sprites wholly inside their cells.

The following same correction prompt was sent in three **separate built-in image_gen calls**, each with its category's initial atlas as the sole edit target and `transparent_background: true`. It changed atlas spacing while retaining the four architectural designs. The corrected three originals listed above are the accepted runtime assets. No local pixel editing was used.

Initial rejected source files (not copied into the project):

- production: `/home/simiyusamuel/.codex/generated_images/01a16d4b-f874-7512-b972-38c77a8bcd88/exec-7e4aab8f-ee4f-417a-9231-43ed55c4e8f5.png`
- utility: `/home/simiyusamuel/.codex/generated_images/01a16d4b-f874-7512-b972-38c77a8bcd88/exec-0a285931-824d-4bc1-a9a3-d8f2e2f52176.png`
- expansion: `/home/simiyusamuel/.codex/generated_images/01a16d4b-f874-7512-b972-38c77a8bcd88/exec-030d9345-4df1-4f9e-8f17-e85078964ff5.png`

```text
Use case: precise-object-edit
Asset type: corrected 2-by-2 transparent game sprite atlas.
Edit target: the attached original four-building atlas.
Change ONLY the atlas packing and spacing: make each of the FOUR sprites substantially SMALLER, about 65 percent of its current size, and center each complete sprite within its own equal quadrant. Keep the four exact building designs, arrangement, isometric camera, palette and visual style unchanged.
A square canvas has four equal square cells, with centers at (25%,25%), (75%,25%), (25%,75%), (75%,75%). Every entire sprite, including windmill blades, flags, chimneys, railings, plants and footprints, must fit inside a 34%-by-34% rectangle of the whole canvas centered at its own cell center. Thus every cell gets very generous transparent padding on all FOUR sides. Nothing may touch or cross the central horizontal or vertical line. Add at least 12 percent canvas-width clear transparent gap along the middle horizontal and vertical separators. Leave generous transparency along the outside edges too.
Actual transparent background alpha, not a checkerboard. No text, no guides, no frames, no added objects. Do not add landscape or combine sprites. This packing is needed for equal 2x2 runtime cropping; complete unclipped isolated sprites matter more than filling the canvas. Retain square atlas proportions.
```
