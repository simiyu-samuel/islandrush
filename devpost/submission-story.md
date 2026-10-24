## Inspiration

I enjoy both city builders and arcade runners. I wanted each run to leave something behind: the timber and stone I collect should become a home, a working service, or a connection to another island. Island Rush is for players who enjoy quick action alongside the slower satisfaction of growing a settlement.

My earlier game, Zalura, worked logically, but I was unhappy with its visual identity and experience. This project became a chance to direct that part more deliberately: a structured coastal township, an adult courier, floating supplies, readable hazards, and construction that visibly takes shape.

## What it does

**Run. Return. Build. Thrive.** Island Rush combines an endless coastal jungle runner with a living island settlement. It opens directly in the game, without an account.

Choose a project from **16 building types across four categories**: civic and community, resource production, utilities, and expansion. Read its purpose, recipe, terrain requirement, and construction stages. Preview a suitable clear space, flip its facing, and confirm **Build here**. Resources are deducted once; a five-second foundation/frame/roof sequence and overhead percentage bar lead to the completed building. Build repeated copies whenever suitable land and supplies remain. Tap a finished building directly to move it for free.

The supply trail has three lanes, floating timber, stone and coins, grounded hazards, and the island on the horizon. Change lanes and jump using keyboard controls, touch buttons or swipes. There is no countdown: speed rises and hazards become more frequent. **Head home** banks supplies whenever you choose. A collision also ends the run while preserving everything already collected. Coins buy missing construction materials; storage overflow keeps runner loot safely in harbor crates.

Buildings change the settlement rather than serving only as decorations. Individual islanders have homes, jobs, hunger, health and shortage-related illness. Water collectors, cottage gardens, bakeries, lumber crews, artisans and fishing piers form supply chains. Clinics treat residents; plazas hold festivals. Lodges attract tourists and merchants with seeds, medicine and navigation charts. Piers receive scheduled cargo boats, while lighthouses clear the route. Town Halls unlock policies and higher tiers, depots expand storage, and geothermal plants supply advanced services.

Outposts open more ground on each islet. Repeatable bridges connect further islets; there is no three-building ending or fixed building-count cap. The map supports pan and zoom. Mobile bottom navigation opens separate Build and Village screens; desktop keeps management alongside the island.

Progress saves in the same browser and URL, including residents, goods, jobs, locations and unfinished construction. Older islands migrate with a backup of the original save. Settlement simulation advances every ten seconds, with up to thirty minutes of catch-up after absence. There is no cloud sync or multiplayer.

## How I built it

This is a new project built with **Codex and the Devpost Learn Skill Pack**. The scope, PRD, specification and build checklist made the combined loop concrete. I directed the concept, visual choices, playtest revisions and later expansion; AI assisted implementation and original artwork generation. The planning documents were updated as those decisions changed.

The game uses **Phaser 4, TypeScript, Vite, HTML and CSS**, hosted on **Vercel**. Pure model modules handle the runner, settlement, placement, construction and save validation. A controller owns commands and persistence; Phaser renders the world while HTML provides management screens and accessible controls. The endless course streams ahead and discards passed entities. AI is used during development, without a runtime AI service.

The public **MIT-licensed** repository includes source, original assets and provenance, setup instructions, scope.md, prd.md, spec.md, the game guide and an app map.

## Challenges

The hardest part was making the two activities feel connected and readable. My feedback rejected a basic island, overly wide road and disruptive motion. Those iterations led to connected streets, smaller building footprints, a clear header, calmer trail movement and foliage outside the mobile lanes. The expanded settlement also needed individual building identities, safe placement, repeat construction, understandable management screens and migration from the older save format.

Resource safety matters: collisions must stop collection at impact, results must not pay twice, construction must reserve supplies only once, and reload must preserve the original deadline. Focus loss pauses the courier until explicit resume, while settlement life follows its own clock.

## Accomplishments

The project connects actual running, collection, return, construction and settlement consequences in one playable loop. Its visual direction reflects repeated product decisions rather than a single prompt. Deterministic model, controller and geometry tests accompany the production build. Prepared browser journeys are distinguished from actual public-page observations in the repository verification record; a complete device-matrix pass is not claimed.

## What I learned

The development process showed me how different working logic can feel after changes to layout, motion and feedback. It also made planning useful as a living description: when the idea grew from three landmarks into repeatable civic and production systems, the data model, player journey and documents had to change together.

## What's next

Playtest the expanded settlement on more phones, tune resource production against running rewards, and refine how needs and expansion opportunities are explained. Balance and performance at very large population and island counts remain areas for further testing.
