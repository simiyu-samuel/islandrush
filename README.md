# Island Rush

Run. Return. Build. Thrive.

An endless coastal runner connected to a growing island settlement. Supply runs fund repeatable construction; homes, workplaces, water, food, healthcare, festivals and maritime trade support individual islanders.

[Play the published game](https://island-rush-six.vercel.app) · [Public repository](https://github.com/simiyu-samuel/islandrush) · [Player guide](devpost/game-guide.md)

The complete expanded game has been manually playtested end to end by its
developer, who confirmed on 24 October 2026 that the implemented flows and
settlement systems work. All **100 model/controller/geometry checks**, TypeScript
and the production build pass. [Playtest and release record](devpost/shipping.md).


## Play

1. Choose a type in Build and inspect its benefits, recipe, tier and terrain.
2. Run for that recipe's timber/stone and coins. Move between three lanes, jump grounded obstacles, then choose **Head home** whenever ready. A collision ends the run and preserves everything already collected.
3. Choose an available suitable foundation, flip facing if desired, then **Build here**. Supplies are deducted once. Watch the five-second staged construction and percentage reveal.
4. Build more copies, inspect individual islanders, assign work and maintain water/food. Complete a Town Hall for tier 2 and policies; upgrade it for tier 3.
5. Claim more grounds with outposts and connect more islets with bridges. There is no three-building finish screen or arbitrary copy limit; available terrain, supplies and tier gates govern construction.

Use ←/→ or A/D to move and Space/↑/W to jump. Touch supports swipes and visible buttons. Pausing or losing focus freezes the runner; settlement life uses its separate wall clock. Active runs are not restored after reload.

## Settlement revision

- Four categories and sixteen building types, with distinct original transparent sprite artwork, enlarged architecture and close inspection zoom.
- Instance-based repeat construction, free movement and facing, concurrent five-second construction sites, and dismantling with half-recipe salvage. Expansion structures cannot be removed when that would strand occupied ground.
- Sixteen open foundations per islet initially; outposts open four more each, up to 32. Every completed bridge adds another expandable islet.
- Named islanders with homes, jobs, hunger, health and shortage-related fever; automatic essential staffing and manual reassignment.
- Grain → flour → bread, fishing, rainwater, timber → planks → tools, forest recovery, storage and safe harbor overflow.
- Happiness, festivals, four policies, visitor stays, rare-item merchants, power and scheduled cargo shipping.
- Browser-local version 2 saves with validated version 1 migration and an original-save backup before the first replacement write.

See [the complete building table and timings](devpost/game-guide.md), [scope](devpost/scope.md), [PRD](devpost/prd.md) and [technical specification](devpost/spec.md).

## Run locally

Node **22.12+** is required. Versions are pinned in `package-lock.json`.

```sh
npm ci
npm run dev
```

Open <http://127.0.0.1:5173/>. Production commands:

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

`npm run test:browser` runs the Playwright suite when browser access is available. Test collection is separate from browser execution. No fixed pass count here substitutes for the current recorded check results.

## Architecture and assets

Phaser 4 renders the isometric archipelago and perspective runner. TypeScript model modules own construction, placement, deterministic runner contacts, simulation and save validation. The HTML/CSS interface supplies accessible controls, catalogue, village management, results and save recovery. Vite produces a static `dist/` build. No sign-in, server database or runtime AI key is required.

- [Source guide](devpost/app-map.html)
- [Design index](design/README.md)
- [Sixteen-building art prompts and provenance](design/settlement-art-v4.md)
- [Asset manifest](public/assets/manifest.json)
- [Voice-over script](devpost/demo-voiceover.md) and [recording guide](devpost/demo-recording-guide.md)
- [Submission preparation](devpost/shipping.md)

Progress belongs to the current browser and origin; localhost and the public site have separate saves. Unreadable data is preserved until an explicit fresh start. Storage failures switch to session-only play. Up to 30 minutes of settlement time catches up after absence.

MIT licensed; dependency licenses remain their own. Private learner context and local credentials are excluded from Git and deployment uploads.
