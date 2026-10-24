# Island Rush — Vercel deployment

Updated 24 October 2026. The owner explicitly requested public Vercel deployment.

## Target and source

- Account scope: `samueldevke` (existing Hobby plan).
- Project: `island-rush`, created through the authenticated Vercel CLI.
- Source: https://github.com/simiyu-samuel/islandrush, branch `codex/island-rush`.
- Deployed source: `a1d2583` (gameplay checkpoint `72275d5` plus reviewed
  documentation/hosting configuration). Later documentation-only records do
  not change that deployed game bundle.
- Deployment ID: `dpl_E3ghDZ94vjandJeHY4bYKpqeqHwk`.
- Immutable deployment: https://island-rush-cvnj4acg8-samueldevke.vercel.app
- Dashboard: https://vercel.com/samueldevke/island-rush/E3ghDZ94vjandJeHY4bYKpqeqHwk
- Public production URL: **https://island-rush-six.vercel.app**.
- No paid add-on, custom domain purchase, backend, or runtime AI service is required.

## Build settings

| Setting | Value |
| --- | --- |
| Framework | Vite |
| Install | npm ci |
| Build | npm run build |
| Output | dist |
| Node baseline | 22.x |
| Environment variables | None required |

`vercel.json` records the framework and commands. The project compiles TypeScript
and bundles the game/assets as static output. JavaScript and WebGL are required
in the player's browser.

## Publish and update

From the project root, with your existing Vercel CLI login:

```sh
npx vercel@65.2.0 link --yes --project island-rush --scope samueldevke
npx vercel@65.2.0 deploy --prod --yes --scope samueldevke
```

The link command creates ignored local `.vercel/` metadata. CLI deployment is the
verified delivery path; do not assume Git pushes automatically update production
unless a Git integration and its production branch are separately confirmed.
Run the existing build/tests before publishing a gameplay change. Record the
actual source and new deployment result after it finishes.

## What is uploaded and public

`.vercelignore` excludes `.git`, `.agents`, `.codex`, `.vercel`, `node_modules`,
`dist`, `design`, `devpost`, local environment files/logs, and browser reports
from CLI source upload. In particular, the private learner profile is not part
of the uploaded bundle. `.gitignore` also excludes it and `.vercel/` metadata.
Only the compiled `dist` is publicly served. Safe planning docs and source remain
available in the public GitHub repo; no credential or user save belongs there.

## Access and save behavior

The production app should open without signing in and without a test account.
Check the production URL with a request carrying no credentials; a protected
preview or temporary authenticated link is not sufficient judging access.
Verify HTML, emitted JavaScript/CSS, and original runtime PNG paths return the
expected file types. A ready deployment and HTTP checks alone do not establish
responsive gameplay or touch usability.

The browser stores progress per origin. Localhost and the public production
URL have separate saves; deploying does not transfer a local island or create
cloud sync. Reloading restores the production browser's stored settlement and
pending construction, but discards an unfinished run.

## Verification record

Production deployment completed **READY** on 24 October through Vercel CLI
65.2.0, on the existing Hobby account and basic build machine. Project settings
were confirmed as Node 22.x, Vite, npm ci, npm run build, and dist output.

Anonymous standard HTTP requests (without Vercel credentials or bypass links)
verified the production HTML, **three emitted JS/CSS bundle paths**, and all
**16 PNG paths in the asset manifest**, including retained archive assets.
Every request returned HTTP 200 with the expected content type. The production
alias is publicly reachable even though the deployment result also advertises
Vercel Authentication protection on deployment URLs; judge access was checked
against the stable production alias rather than an authenticated share link.

The public island and runner were opened through the supported browser UI.
Screenshots show actual deployed game states, including phone-sized UI and a
later runner state with 1.9× pace. They are not generated mockups, a full device
matrix, or execution of the eleven prepared Playwright journeys. The local
preview restriction was not retried; this is a separately requested public
production deployment. Image provenance is in design/devpost/production-captures.md.

The Vercel connector could list the account but failed to create/find this
project. Its documented CLI fallback succeeded with the existing CLI login;
no new access permissions or paid services were enabled. The link command
created a local .env.local OIDC credential automatically; Git and deployment
ignore rules exclude it. Its contents are not part of the repo or public build.
