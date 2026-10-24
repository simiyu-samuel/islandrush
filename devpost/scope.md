---
doc: scope
status: approved
---

# Island Rush

A game where endless supply runs supply the materials to build and personalize a growing
island, with building choices and resources introduced through progression.

## The Unique Kernel

Running has a concrete purpose on the island: collect the materials needed for
available construction, choose a building design, and see that project become
part of the island. Collectible materials should remain relevant to unfinished
buildings at the player's current level.

## Who It's For

Players who enjoy short arcade runs and choosing how a small island develops.
The concept combines the learner's interest in City Island's building with the
action of Subway Surfers and Temple Run.

## The Core Loop

1. See the buildings and design choices available at the current level, including
   what materials unfinished construction needs.
2. Play a endless supply run, avoiding grounded hazards and collecting animated materials
   and coins floating above the route. Show materials relevant to the current
   progression and available, unfinished buildings.
3. End the run by choosing Head home or hitting an obstacle. Show the collected loot
   and retain it for use on the island.
4. Choose to return to the island and use materials immediately, spend collected
   coins on eligible materials, or run again and collect more before building.
5. Complete construction and see a visible change on the island. Completing the
   first home unlocks level 2; completing the workshop and lookout finishes the
   first version's starter settlement.

## Agreed Level Progression

The learner accepted the construction-based progression and the complete scope
on 22 October 2026, then explicitly added collision-ended runs with retained
materials and coins that buy materials during product review. These additions
preserve the one-course, two-level, three-building boundary.

Advance levels by completing the current level's required construction. This
connects each endless supply run to visible island progress and keeps the next goal easy
to explain.

| Level | Available construction | Materials | Completion and unlock |
| --- | --- | --- | --- |
| 1 — First home | One home with a choice of visual designs | Timber | Completing the home unlocks level 2 and its building/material choices. |
| 2 — Small settlement | A workshop and lookout tower, with visual design choices | Timber and stone, according to the selected unfinished building's requirements | Completing both finishes the first playable version's settlement. |

This preserves the initial three-building boundary while proving a level change,
new material availability, and building-style choices. The exact style count and
resource amounts remain product-design decisions. Collected resources remain
available between endless supply runs, and the player may build or run again.

The interface can show the current construction goal and remaining materials,
then clearly announce new buildings and resources when the home is completed.
The first home should provide an early satisfying milestone; the number of runs
needed must be tuned through play rather than assumed here.

## Inspiration & Identity

Pixel Coast is the approved leading visual direction, with the warm coastal
atmosphere of Painted Adventure as inspiration. Use a clearly adult character,
more usable island space, and clear paths between building sites. Materials
should hover and animate so they invite collection; obstacles remain visibly
grounded. The approved PRD defines the consistent pixel-art treatment.

Relevant exploratory studies were shown in the conversation. They demonstrate
appearance and intended motion, rather than working gameplay or animation.
References named by the learner include City Island, chess, Call of Duty,
eFootball, Subway Surfers, and Temple Run. One official runner reference is
[Temple Run](https://imangistudios.com/thegames/temple-run/); the other titles
remain learner-named inspirations rather than copied assets or mechanics.

## Why This Matters to the Learner

The learner's previous Zalura game worked logically, but they disliked its visual
identity and player experience. They want to practise imagining, designing, and
refining attractive game interfaces and gameplay experiences through this build.

## What "Working" Looks Like

Demonstration: choose an available building design, play a
complete endless supply run, collect the needed materials, return to the island, and
complete construction with a visible result. Another run should retain useful
progress and respect which buildings and resources are available. Also show
that the player can run again directly instead of building after each run.

The core proof is that the runner and island work together as one game. The
submission must demonstrate this in a short video and include the public repo
with the completed scope, PRD, and spec.

## The POC Boundary

The initial concept was one course and three buildings. Preserve a small
end-to-end game while accommodating the learner's added requirements:

- Endless runs with gradually increasing pace, ending on obstacle impact or
  voluntary return while retaining collected materials.
- Collected coins can buy eligible materials within the island's construction flow.
- A choice of building styles/designs, locations among clear grass blocks, and
  free relocation of finished buildings with either road-facing orientation.
- Level-gated buildings and appropriate material pickups.
- Material requirements shown for unfinished construction.
- A choice to build after a run or continue collecting through another run.
- Adult character, readable floating pickups, and a coherent island identity.

The agreed first-version progression has two levels and three buildings on one
streamed course. A small set of visual building designs will demonstrate player
choice. Exact style counts, pace tuning, and resource amounts will be specified
in the PRD; the scope does not promise a large content library.

24 October revision: the owner explicitly requested player-chosen locations and
confirmed using clear grass blocks while keeping roads/water/landscaping clear.
This adds a small placement/move interface within the existing three-building
scope. The runner adopts a coastal jungle presentation and spaced encounters;
the one-course loop, collision/loot rules, recipes, and levels are retained.

24 October follow-up: the owner approved the coastal runner direction and
explicitly replaced the 60-second limit with endless running, increasing speed,
and increasing difficulty. Head home lets players return with supplies whenever
they choose. They also requested clear mobile outer lanes and direct map-tap
relocation for completed buildings. No buildings or levels were added.

## Later

Additional courses, buildings, and design variants beyond the small first
version can extend the same loop. No specific expansion is committed yet.

## Explicitly Cut

The first version stays within one course, two levels, and three building types.
Additional content belongs to later expansion. No other named feature has been
explicitly cut.

## Details for the PRD

The scope is approved. Define the first-use journey, building-style counts,
placement controls, exact resource recipes, run pace and failure behavior,
and screen/animation design in the product requirements. Carry forward the
agreed loop and progression without reopening them.

## Delivery revision — 24 October

The owner explicitly selected Vercel hosting and requested complete documentation,
Devpost updates, a voice-over reading script, and a screen-recording guide.
These share the same proof of concept without adding gameplay content. Public
hosting supplements the required public repository and recorded demo. The video
and final submission remain incomplete until their actual steps are performed.
