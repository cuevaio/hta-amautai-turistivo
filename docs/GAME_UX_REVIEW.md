# Game interface review

Scope: local Market Route and Feed Your Community, October 18, 2026. Applied the educational-game-workflow and ux-heuristics skills, plus the project frontend, design, and motion rules. Existing artwork, typography, theme tokens, scoring, persistence, and room contracts are preserved. No deployment, commit, or push was performed.

## Heuristic findings and changes

Initial expert assessment: 5/10. Current scoped assessment: 9/10. These are design-review judgments, not measured learning or usability outcomes. Search is not applicable to the active game task.

| Finding | Initial severity | Implemented response |
| --- | --- | --- |
| Small canvas text becomes difficult to read on mobile | 3 | Semantic responsive HUD; readable mission and load/progress outside the raster scene |
| Movement controls compete with the mathematical action | 2 | Tap-to-travel in the market, direct sky movement in the community game, expandable directional alternatives |
| Market instructions mix manual preparation and automatic delivery | 3 | Contextual warehouse/road/market instructions; numbered stations and route markers |
| Large stages push actions below the desktop viewport | 2 | Unified scene and mission/action columns, stacking in task order on mobile |
| Mistake feedback does not explain the group-size mismatch | 2 | Required group size and saved penalty in visible feedback |
| Redundant market reset and participant/mode subtitles distract | 1 | Retained Undo; removed reset and game-header subtitles without changing room records |

The remaining uncertainty is novice discovery of the expandable controls and regional vocabulary (severity 1, provisionally). Reaching 10/10 requires a short observed first-use walkthrough with intended learners, followed by adjusting terms or the disclosure label if they hesitate. No child usability study was conducted. Indigenous-language educational review remains pending; populated catalogs do not prove translation quality.

## Playable contract examples

- Market success: start with 3 fish, collect 5 at the warehouse, drive to market, stop, and save one correct answer with 8. The next task appears without another submission while remaining at market.
- Market mistake: deliver 7 for the same task; retain the task, consume the server-defined penalty/opportunity, and correct through Undo or the warehouse. Keyboard and tap travel use the same delivery gate.
- Community success: collect three groups of four, increment group/food progress after confirmed captures, save rewards, and advance the challenge.
- Community mistake: contact a group with a different size; the server applies the existing penalty, and feedback names the size to seek. Correct-capture notices avoid blocking movement; incorrect feedback pauses the scene briefly.

## Computer Use verification

Used the real authenticated localhost UI with named test participants. Existing learner results were not reset.

- Market: tapped the warehouse, rapidly collected five single items, tapped market, observed a saved score of 100 and transition from `3 + 5` to `8 − 6`. The new task retained the per-visit gate.
- Community: observed correct captures, progress updates, round completion, saved score 177, and transition to level 2. Pause/resume and the persisted paused state after reload were checked.
- Inspected Spanish, Chanka Quechua, and Peruvian Aymara across the affected games. Market checked at 390 and 320 px; community checked at 390 px. Measured document content width equalled viewport width in the recorded narrow-screen checks.
- Inspected dark and light presentation. Expanded alternative controls remain labeled and respect paused/disabled state. Restored Spanish, dark theme, and normal browser viewport after testing.
- Added automated tap-travel tests for station targeting, frame bounds, arrival stopping, and exactly one delivery per visit. Existing scoring, persistence, loss/retry, movement, localization, and architecture tests remain in the full project gate.
- Final `pnpm run check` passed (architecture, lint, types, tests, production build, Worker dry run). Browser walkthrough did not repeat every pre-existing loss/retry case or every regional asset variation.

Screenshots: `output/game-ux-qa/market-desktop.jpg`, `market-mobile-aymara.jpg`, `community-desktop.jpg`, and `community-mobile-quechua.jpg`.

## Tool and asset notes

Reused the installed Base UI Button variants; changed no global button dimensions or navigation geometry. The technical shadcn skill/MCP was not available in this session; current official shadcn and Phaser 3.90 documentation was consulted through Context7. No new primitive or dependency was installed. Existing generated sprites and their manifests retain their provenance.
