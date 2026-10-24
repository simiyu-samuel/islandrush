# Island Rush — Vercel deployment

Updated 24 October 2026. The owner explicitly requested public Vercel deployment.

## Target and source

- Account scope: `samueldevke` (existing Hobby plan).
- Project: `island-rush`, created through the authenticated Vercel CLI.
- Source: https://github.com/simiyu-samuel/islandrush, branch `codex/island-rush`.
- Gameplay checkpoint: `72275d5`. Deployment configuration/docs are committed
  separately; no gameplay logic is changed by the hosting work.
- Public production URL: pending deployment and anonymous verification.
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

Deployment is being prepared. Replace this paragraph with actual build state,
production URL, source revision, unauthenticated asset checks, and any browser
verification limits after the deployment completes. Do not claim success from
project creation alone.
