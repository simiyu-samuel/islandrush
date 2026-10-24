# Island Rush — production deployment

Verified **24 October 2026**. Owner-authorized public release of the expanded settlement.

| Item | Result |
| --- | --- |
| Public game | https://island-rush-six.vercel.app |
| Target / status | Production · **READY** |
| Source | **dde6c4d**, branch codex/island-rush; main expansion 9e4177e |
| Immutable build | https://island-rush-hs77e933g-samueldevke.vercel.app |
| Deployment ID | dpl_6FWwCJASDyQrvpZjuyn4s56F4SnK |
| Dashboard | https://vercel.com/samueldevke/island-rush/6FWwCJASDyQrvpZjuyn4s56F4SnK |
| Account/project | samueldevke / island-rush, existing Hobby account |
| Build | Vite · Node 22.x · npm ci · npm run build · dist |
| Game credentials/environment | No account, API key, backend or runtime environment variables required |

The sixteen-type game, detailed simulation, repeat instances and original atlases
are deployed. Public review then corrected header spacing, notice duration and
fair migration of newly introduced resident needs. Later documentation/media
commits do not change this deployed game bundle.

## Verification

All **99 model/controller/geometry checks**, TypeScript and production build pass.
Eleven updated Playwright journeys collect; they were **not executed as a full
browser suite**. The existing Phaser bundle size warning remains informational.

Anonymous HTTP requests, carrying no Vercel credentials or bypass link, verified
the production HTML, **three emitted JS/CSS paths and twenty manifest PNG paths**:
all returned 200 and expected content types. Final bundles include
index-CkG_mJH8.js, index-yT4_rmSy.css and phaser-B_vcVLyb.js. Some manifest images
are retained archives; they are not all active runtime textures.

The supported public browser was used for real desktop/phone observations:
category catalog, a coin-for-stone exchange, five-second Rainwater Collector
construction and material deduction, saved completion on reload, direct map
selection/free movement/facing, resident/job screens, a collision banking
5 timber/10 stone/2 coins, and a voluntary return banking 5 timber. Harbor crates
preserved excess stock. These were normal UI actions, without inventory injection. The captured client
error log returned no entries after these observations.

Layout observations cover 1366×768, 390×844, 320×640 and 844×390. The narrow layouts
showed no document overflow and kept primary actions visible. This is responsive
browser evidence, not testing on a physical device or exhaustive simulation/balance
validation. See design/devpost/production-captures.md for genuine images.

The production alias is public even though immutable deployment URLs advertise
Vercel Authentication protection. Judge access was verified against the stable
alias. The earlier local-preview browser restriction was not retried or bypassed.

## Reproduce an authorized update

Use the existing CLI login from this project, after tests and build pass:

```sh
npx vercel@65.2.0 deploy --prod --yes --scope samueldevke
```

The local .vercel/project.json links the intended project. The Vercel connector
previously failed to create/find it; CLI 65.2.0 was the working fallback. Git pushes
are not assumed to deploy automatically. No paid services, custom-domain purchase
or new security permissions were introduced.

For a staged production workflow, use --prod --skip-domain, verify that build,
then promote its URL. A protected preview is not a public judge-access link.

.vercelignore excludes .git, .agents, .codex, .vercel, node_modules, dist, design,
devpost, environment files, logs and browser reports from CLI uploads. Only built
dist is served. Git also excludes private learner context, .env files and local
link metadata. Credentials are never part of the public source or captures.

Saves belong to the browser and origin. Localhost, previews and production have
separate progress; deployment does not create cloud sync. Version 1 originals
are backed up before conversion to v2, and original construction deadlines remain.

## Historical release

The preceding three-building version was deployed from a1d2583 as
 dpl_E3ghDZ94vjandJeHY4bYKpqeqHwk. Expansion 9e4177e was first deployed as
 dpl_EJbB2d48nL5LcuPJ9w6yH2HJjfpy before the public-review corrections above.
Neither is the current production bundle.
