# Island Rush — design records

The current source revision expands the game into a sixteen-type, repeatable living settlement, approved by the owner on 24 October 2026. It keeps the reviewed coastal runner and warm Pixel Coast identity. [Player guide](../devpost/game-guide.md), [PRD](../devpost/prd.md) and [specification](../devpost/spec.md) describe current behavior. Production publication and actual checks are recorded separately; older screenshots are not evidence of the new simulation revision.

- [Settlement building art v4](settlement-art-v4.md): sixteen distinct original buildings in four transparent category atlases; independent frame trimming, exact prompts, corrected packing variants, sources and hashes.
- [Coastal experience v3](coastal-experience-v3.md): active coastal jungle art, distant island, foliage exclusion, softened projection and endless pace. Its eight-anchor/three-instance placement descriptions are historical; current foundations, repeat copies and expansion follow the guide/spec.
- [Township terrain v2](township-island-v2.md): active connected-road terrain asset and original prompt. Current renderer subdivides its eight clearings into four smaller foundations each and repeats the terrain for connected islets.
- [UI/UX revision v2](ui-ux-revision-v2.md): intermediate iteration, superseded by later placement, runner and settlement revisions.
- [Original runtime art prompts](runtime-art-prompts.md): original courier, legacy six building styles, pickups and earlier world assets. Archived world images remain in the manifest and are not all loaded.
- [Earlier production captures](devpost/production-captures.md): real deployed game screenshots taken before the sixteen-building revision; historical evidence until replaced with new verified captures.
- [Promotional thumbnail](devpost/thumbnail-provenance.md): generated promotional art, separate from actual gameplay captures.
- `reference/`: exploratory concept studies.
- `checkpoints/`: historical first-playable captures.

Current presentation uses a contained identity/vitals header, four building categories and Build/Islanders/Supplies/Trade/Council management sections. Phone screens keep the island clear by opening a separate management view with Island/Build/Village/Run navigation. New construction has a preview, explicit resource charge, stage explanation and five-second percentage reveal. Completed buildings move by direct map tap; typography stays in the interface rather than floating names over the island.

The source adds individual islander markers, construction instances, maritime state, expandable map bounds and the four original building atlases. Mechanical state changes and simulation depth do not substitute for testing actual readability, motion, touch controls and sprite alignment on devices. New visual/player review remains a separate checkpoint.

Original prompts are preserved as written; later source records explain changes without rewriting old intent.
