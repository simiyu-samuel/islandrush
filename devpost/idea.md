> Historical discovery record. Current owner-approved behavior is in [scope.md](scope.md), [prd.md](prd.md), [spec.md](spec.md) and [game-guide.md](game-guide.md). The 24 October settlement expansion supersedes earlier three-building and two-level limits.

# Island Rush — chosen concept

An endless coastal runner where collected building materials grow a player-shaped
island settlement. The initial discovery notes below are historical; current
rules and full functionality are in [the game guide](game-guide.md),
[scope](scope.md), [PRD](prd.md), and [spec](spec.md).

## Core loop

1. Play a short course, dodging obstacles and collecting building materials.
2. Use the collected materials to construct buildings on the island.
3. Play again to keep growing the island.

## Initial proof of concept

One short course and three buildings to unlock. The end-to-end demonstration is:
**play → collect → build**. A run should produce visible progress on the island.

## Discovery and approval history

This records the chosen idea and subsequent feedback. The complete scope was approved on 22 October 2026. Product requirements are approved. The technical plan and build checklist are approved; implementation is complete and accepted in the 23 October player playtest; shipping preparation is next.

## Visual feedback from the first study

- Pixel Coast is the leading reference; Painted Adventure also appeals.
- Give the island more usable space while keeping the initial three-building scope.
- Use an adult character with mature proportions, rather than a childlike figure.
- Animate building-material pickups floating above the route; do not leave them
  sitting on the ground where they could be mistaken for obstacles.
- Keep hazards grounded and visibly distinct from collectibles.

These preferences guide the next visual study. The complete scope is approved; the PRD now confirms a coherent Pixel Coast treatment with the painted study's
warm coastal atmosphere.

## Progression and run rules from the learner

- Players can choose among different building styles/designs.
- The current level governs available buildings and materials.
- Show the materials for available, unfinished construction until it is completed.
- Runs were initially timed; the owner replaced this with endless runs and
  progressive speed/difficulty on 24 October.
- After each run, collected materials can be used on the island immediately.
- Players may instead run again and accumulate more materials before building.
- Completing the first home unlocks level 2; completing its workshop and lookout
  finishes the starter settlement. This progression was accepted on 22 October 2026.

These requirements are captured in the approved `scope.md`.

## Agreed progression

The learner accepted the proposed first-version rule on 22 October 2026:
complete a chosen home design at level 1 to unlock level 2, then complete a
workshop and lookout tower to finish the small settlement. Materials are timber
for level 1 and timber/stone for level 2 as required by construction. See the
approved scope for the full plan. The complete scope was approved on 22 October 2026.

## Current delivery — 24 October

The implementation now includes endless pace progression, Head home banking,
a larger connected-road island, eight selectable grass blocks, mirrored facing,
free direct-map relocation, mobile bottom navigation, five-second construction,
coin purchases, browser saves, and six designs across three building types.
The owner requested Vercel deployment, a fully updated Devpost entry, a spoken
demo script, and a matching recording guide. See [shipping](shipping.md) for
verified delivery state; the required video link remains pending recording.
