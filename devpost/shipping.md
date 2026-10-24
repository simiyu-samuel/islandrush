# Island Rush — technical shipping record

Checked 24 October 2026. This is a preparation record, not a claim that an
entry has been submitted.

## Ready

- [x] Working proof of concept: one course, two levels, three buildings, six designs, relevant floating materials, retained loot, explicit coin exchanges, and saved construction.
- [x] Player reported testing successfully and accepted the current build on 23 October.
- [x] 72 unit/controller checks and production build pass at source commit cf9590f.
- [x] Required scope, PRD, and spec are tracked in the public repository.
- [x] Offline app map created and statically checked against actual paths and symbols.
- [x] Public repository accessible without credentials: https://github.com/simiyu-samuel/islandrush (default branch codex/island-rush).
- [x] History through cf9590f reviewed: six reachable commits and 124 distinct blobs scanned; no credential-pattern findings or private learner-profile/credential file paths found. This is a targeted audit, not a guarantee against every kind of sensitive data.

Ten automated browser journeys are prepared/collected but have not been run
for this checkpoint due to the tool's URL-policy rejection. The player's report
is the actual recent runtime evidence; no unreported device matrix or specific
edge-case coverage is claimed.

- [x] MIT license approved by the owner on 23 October and added as root LICENSE; package metadata identifies MIT. Third-party packages retain their own licenses.

## Saved Devpost draft

- Draft: https://devpost.com/software/island-rush
- Manage: https://devpost.com/submit-to/30447-build-with-ai-basics/manage/submissions/1253025-island-rush/project-overview
- The owner explicitly delegated filling the draft, generating the thumbnail,
  and describing their contribution. Factual AI-assisted draft text was saved
  under that instruction; the owner should review it before submission.
- Verified saved: Island Rush name, coastal run/build tagline, project story,
  Built With tags, public repository link, and Created by contribution.
- Generated promotional thumbnail uploaded and verified in the overview.
  Source and prompt: `design/devpost/thumbnail-provenance.md`.
- Additional info is now populated in the signed-in form. Personal survey
  responses are intentionally excluded from this public record.
- Current form status: **DRAFT, 3/5 steps done**. Project details is incomplete
  because the required video-demo URL is blank. Final submission is incomplete.
- The agent has not accepted the final terms or clicked Submit project.

## Remaining

- [ ] Record the working game, upload a publicly accessible YouTube/Vimeo demo,
  and add its real URL. The owner said they planned to record it; no URL has
  been supplied or saved yet.
- [ ] Owner reviews the saved story, contribution, survey answers, and eligibility
  declarations for accuracy, then personally completes final terms/submission.
- [ ] Verify the entry shows a submitted state after that final action.

Deployment and peer feedback are optional. Neither replaces the demo video.
No live game URL is currently recorded; the draft's Try it out link is GitHub.

## Review against the organizer email

The owner supplied the Will It Ship recap on 24 October. This audit uses the
pasted recap; it does not claim the recording was watched.

| Email check | Island Rush evidence / next action |
| --- | --- |
| Easy access without account creation | The game needs no account or API key. A live playable link would make access quicker; currently judges have the repo and the video is pending. Hosting remains an optional owner decision. |
| Clear opening screen and audience | The approved scope identifies fans of short arcade runs and island building. Devpost's tagline explains the loop. The game intro is poetic ("A home on the horizon" / "A little adventure"); consider a direct run/collect/build sentence. No game code was changed during this review. |
| Working app shown early in video | Start with design choice, a real run, banked loot, and the construction reveal; briefly show planning documents after gameplay. Capture the actual app rather than a simulated demo. |
| Planning documents match implementation | Approved scope, PRD, and spec are in `devpost/`. They describe one course, two levels, three buildings, design choices, retained loot, coin exchanges, and five-second construction. |
| Deliberately directed design | Original coastal pixel assets and the owner's documented revisions cover character proportions, floating supplies, mobile navigation, road width/motion, and construction progress. |

## Requirements checked against the organizer

- [Overview](https://learn-ai-basics.devpost.com/): a 1–3 minute working demo, a public code-repository URL, the generated scope/PRD/spec, and a short description covering the project, audience, and learning.
- [Official rules](https://learn-ai-basics.devpost.com/rules): keep the video under three minutes and publicly visible on YouTube/Vimeo. The repository should include an open-source license; the project must include source, assets, and run instructions. Submission materials must be in English or accompanied by an English translation.
- Deadline: 26 October 2026 at 5:00 pm EDT = **27 October 2026 at 00:00 in Nairobi**. Plan to finish on Monday 26 October, before midnight.
- The overview lists Design, Innovation/Idea, and Presentation. The official rules additionally list Potential Impact. Use the rules when checking coverage; the learner should explain the actual audience and value in their own words.

## Mechanical demo preparation

Use the existing local game (`npm run dev`) and record the actual playable
window. Keep the video below three minutes; a live deployment is not necessary.
The core behavior to capture is design choice → run and collect → end-of-run
banking → explicit construction and its visible result. A later-stage island
can show stone, the shop, level-two choices, and the completed settlement.
Choose which actions to show before recording so the result is easy to follow.
This is a technical capture checklist, not narration or pitch wording.

Demo URL: not supplied.
Devpost draft URL: https://devpost.com/software/island-rush
Final submission confirmation: not supplied; draft remains unsubmitted.
