# Island Rush UI/UX revision — 24 October

## Player direction

The player requested improvements across visual identity, island building, and
the runner, specifically a larger island and better building markers that are
not round. Keep the Pixel Coast world, adult courier, floating supplies, stable
road, short runs, construction, and mobile screen navigation.

## Applied design decisions

- Hierarchy: bold headings and a direct loop explanation; cream is for decisions,
  dark ocean is for game status, amber marks selection and available building.
- World: enlarge the island composition, bring mobile plots inward, use survey
  stakes around an isometric footprint, number sites, and label their state.
- Building: show a larger selected-design preview and the real catalog description.
  Keep recipes and shortfalls visible in the scroll area; put the next valid
  action in a fixed footer. Once affordable, Build replaces Gather supplies.
- Runner: remove island inventory from the running screen. Group timer, backpack,
  and Pause; show recipe progress from saved stock plus this run's collections.
  Add brief pickup quantities without changing rewards or road motion.
- Adaptation: retain the mobile Buildings screen and bottom bar, safe-area padding,
  scrollable choices, 44px controls, landscape layout, and reduced-motion handling.
- Consistency: consolidate the accumulated CSS overrides into one organized
  stylesheet so future visual revisions have one place to change each component.

## Verification and review

TypeScript/production build and 72 existing unit/controller checks pass. Assets,
recipes, currency, progression, storage format, and route geometry are unchanged.
Browser runtime validation remains unavailable under the recorded local-preview
URL-policy block. No generated mockup or old capture represents this revision.

Player review: open http://127.0.0.1:5173/, inspect the island and its three sites,
open Buildings and compare designs, collect enough supplies to see the fixed Build
action, watch construction, then play a run. Review phone and desktop readability,
site/building placement, and whether controls or hints obscure gameplay.
This is the next review checkpoint, not a claim of final visual acceptance.
