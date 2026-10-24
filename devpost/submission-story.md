## Inspiration

I enjoy island-building games and fast runners. I wanted each run to leave useful progress in a place the player could shape. Island Rush connects those interests: collect supplies on a coastal trail, then use them to design a small island settlement. It is for players who enjoy short arcade sessions and creative building choices.

## What it does

Island Rush is an **endless coastal runner and island builder**, playable in the browser without an account: [Play Island Rush](https://island-rush-six.vercel.app).

Choose a building design and preview its location on one of eight clear roadside grass blocks. Flip its facing to suit the street, then confirm. Roads, water, landscaping, and occupied blocks stay clear. Tap any completed building directly on the map to preview a free move to another available block.

Run a three-lane coastal jungle trail with an adult courier, floating timber, stone, and coins, grounded obstacles, and your island on the distant horizon. **There is no countdown:** speed increases gradually and hazards become more frequent. Change lanes and jump using keyboard controls, swipes, or visible buttons. Choose **Head home** whenever you want to build. A collision also ends the run; both endings preserve the loot already collected.

Back on the island, choose to build, exchange coins for eligible materials, or run again. Construction takes five seconds, with foundation/framing/roof stages and an overhead percentage bar before the reveal. The first home unlocks level 2, where the workshop and lookout can be finished in either order. Each of the three buildings has two designs; completing all three finishes the starter settlement.

The game includes a larger connected-road island with pan/zoom, separate mobile Island/Buildings/Run navigation, skippable contextual guidance, focus-aware pause, and same-browser saves for stock, designs, locations, facing, and unfinished construction. Progress belongs to the browser and URL; there is no account or cloud sync.

## How I built it

This is a new project built from scratch with the **Devpost Learn Skill Pack** and **Codex**. The skill-led scope, PRD, technical plan, and build checklist kept the proof of concept within one course, two levels, and three building types. I directed the product decisions, visual revisions, and playtest feedback; Codex assisted implementation and original artwork generation.

The game uses **Phaser 4, TypeScript, Vite, HTML, and CSS**, with static hosting on **Vercel**. Small deterministic rule modules handle running, placement, inventory, and construction. One controller owns progress, reward settlement, and browser persistence. The endless course streams ahead and discards passed entities; acceleration is integrated into contact timing. AI is used during development, not as a runtime game dependency.

The public MIT-licensed repository includes the source, original runtime assets and generation records, setup instructions, scope.md, prd.md, spec.md, a current game guide, and an offline app map.

## Challenges

Making working logic feel visually clear required repeated design revisions. The first island felt too small and basic, and a road revision was too wide and distracting. My feedback led to a larger township layout, cleaner island header, small construction-site cues without floating names, and player-chosen building blocks.

The runner evolved into a continuous stone trail with quieter joints, coastal jungle scenery, separated pickup/hazard depths, and foliage positioned outside the mobile lanes. The final gameplay revision replaced the timer with endless progressive difficulty and added a deliberate return action.

Other challenges were retaining collected loot without duplicate rewards, preventing repeated construction charges, preserving the original build deadline across reload, and keeping confirmed placement separate from a cancelable preview.

## Accomplishments

The current project connects running, collecting, banking, building, unlocking, and relocation in one playable loop. It is deployed publicly without login. All **91 unit/controller/geometry checks**, TypeScript, and the production build pass. Eleven automated browser journeys are prepared; they have not been executed as a full suite for this version. I have playtested earlier builds and approved the coastal runner direction; the final mobile/endless refinements remain subject to further device playtesting.

The image gallery shows actual screenshots of the current deployed game. The project thumbnail is separately generated promotional artwork.

## What I learned

The iterations made the difference between numerical correctness and perceived clarity concrete. Lane-alignment tests can pass while motion still feels wrong. Planning documents kept the scope focused, while playable feedback drove better road width, navigation, placement, and construction feedback. The documents were updated when the agreed behavior changed, including the switch from timed to endless runs.

## What's next

More hands-on phone testing and tuning of difficulty, resource balance, and visual feedback within the current small settlement. Additional courses and buildings are future possibilities, not features claimed by this proof of concept.
