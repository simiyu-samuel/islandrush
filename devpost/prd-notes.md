# Island Rush — product interview notes

These are discovery notes, not an approved PRD. The approved scope remains the
boundary. Read these notes before drafting `prd.md`.

## First-use experience

Learner input: after being asked what the first screen should show, the learner
was unsure. They then suggested a short onboarding journey. They have not yet
specified whether this means guided play, introductory story screens, or another
format.

Agent recommendation for discussion: a short introduction embedded in the
actual first-use flow:

1. Arrive on the island and highlight the first home plot with the immediate goal.
2. Choose a home design and see the required materials.
3. Guide the first few actions of the first timed run: move, collect a floating
   timber pickup, and avoid a grounded obstacle, with brief contextual hints.
4. At the run's result, show earned materials and the option to return to the
   island or run again. On returning, show how resources relate to construction;
   if materials are insufficient, make the remaining requirement and another run
   clear. Do not assume a free building or a scripted reward amount.

A skip control could dismiss guidance and leave the normal island/play loop
available. The learner has not yet approved this exact onboarding proposal.

## Product decisions still to discuss

Run length, controls and collision consequences; building style selection and
placement; progress across sessions; final art treatment. Existing resource,
level, and adult-character decisions should carry forward without repetition.

## Direction after the onboarding proposal

The learner said “proceed.” Carry the short guided opening forward into a PRD
for review. No collision preference was supplied; the draft proposes forgiving
collisions and clearly identifies all new defaults. These are not approved
merely because a draft has been written. Continue from the draft review rather
than restarting the first-screen interview.

## Learner revision: terminal collisions and collectible coins

The learner replaced the slowdown proposal: an obstacle impact should end the
run, offer restart or return to the island, and preserve collected materials.
They also requested collected coins that can purchase materials. The revised
PRD carries those requirements, proposes keeping coins on collision as well,
and adds a small material-buying area inside construction. Initial exchange
prices are recommendations, not learner-specified values. Other proposed PRD
defaults remain awaiting the complete product review.

## Product plan approved

The learner replied “yes” to the revised product plan on 22 October 2026.
`prd.md` is now approved, including terminal collisions with retained materials
and coins, integrated material purchasing, and the previously reviewed defaults.
Earlier proposal labels in these interview notes are historical; use the
approved PRD as the current source of truth. Continue with `4-spec`.
