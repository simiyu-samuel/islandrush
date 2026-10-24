## Inspiration

I enjoy city builders and arcade runners, and I wanted the excitement of a run to create lasting progress. Island Rush connects those two experiences: supplies collected on a coastal trail become homes, services and new island connections. It is for players who enjoy quick action and the creativity of shaping a settlement.

My earlier game, Zalura, worked logically, but I was unhappy with its visual identity and player experience. This project gave me a chance to improve those skills through a deliberate coastal style, readable motion and repeated playtesting.

## What it does

**Run. Return. Build. Thrive.** Island Rush is an endless coastal runner connected to a living island settlement. Players can open the game and start playing without an account.

On the coastal jungle trail, an adult courier collects floating timber, stone and coins while changing lanes and jumping grounded obstacles. Speed increases and hazards become more frequent as the run continues. Players can choose **Head home** whenever they are ready to build. A collision ends the run too, while preserving everything collected before impact.

The island offers **16 building types across four categories**: civic and community, resource production, utilities and settlement expansion. Each project explains its purpose, recipe, tier and suitable terrain. Players choose a clear space, adjust its facing and confirm **Build here**. Construction takes five seconds, with visible stages and a percentage bar before the reveal. Buildings can be constructed repeatedly and moved for free. Larger architectural sprites and close map zoom make the settlement easier to inspect.

Buildings support individual islanders with homes, work assignments, hunger and health. Water collectors, cottage gardens, bakeries, lumber yards, workshops and fishing piers create connected supply chains. Clinics treat illness, plazas host festivals, and lodges attract tourists and merchants selling rare supplies. Piers receive scheduled cargo ships, while lighthouses guide them safely through sea fog.

Town Halls unlock policies and higher building tiers. Storage Depots expand inventory, and geothermal generators supply advanced services. Outposts claim more land, while repeatable bridges connect further islets. Growth depends on suitable space and supplies, with no fixed building-count limit.

The game includes mobile bottom navigation, keyboard and touch controls, construction previews, safe harbor storage for excess run loot, and browser saves that restore the settlement and unfinished construction.

## How I built it

I built Island Rush from scratch with **Codex and the Devpost Learn Skill Pack**. The scope, product requirements, technical specification and build checklist helped turn the combined idea into a working game. I directed the product decisions, visual identity, playtest revisions and settlement expansion; AI assisted with implementation and original artwork.

The game uses **Phaser, TypeScript, Vite, HTML and CSS**, with deployment on **Vercel**. Separate model modules manage running, construction, placement, simulation and saved progress. The public **MIT-licensed** repository includes source code, original assets, setup instructions and the planning documents. AI supported development and artwork creation; the game runs without a runtime AI service.

## Challenges

The main challenge was making the runner and builder feel like one experience. I refined the island layout, road width, foliage placement, pickup spacing, mobile navigation and construction feedback through playtesting. I also enlarged the buildings, spread their foundations and extended close zoom so the architecture reads clearly against the island.

The expanded settlement required repeatable building identities, production and daily needs, scheduled visitors and ships, safe resource banking, and migration of older saves without losing progress.

## Accomplishments

I have playtested the complete game end to end, including the runner, retained loot, construction, placement, settlement systems and progression. The implemented flows work as intended, supported by automated model, controller and geometry checks and a successful production build.

Island Rush brings action, creative building and community management together in a playable game that is publicly accessible without sign-in.

## What I learned

Working logic is only one part of a good game. Scale, spacing, motion and feedback determine whether players understand and enjoy it. The project taught me to use planning documents as living guides and to turn hands-on feedback into concrete improvements in both the interface and the underlying systems.

## What's next

I want to develop more island themes, richer building customization and additional community events while continuing to refine the game through player feedback.
