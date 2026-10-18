# The Data Fair

Retired from the active catalogue in favor of [Builders of Peru](BUILDER_GAME.md). Existing rooms retain historical results; the public interface no longer launches this game or creates new Data Fair rooms. The following describes its preserved implementation history.

## Playable contract

A fifth room-based Phaser 3.90 game for second-grade organization and interpretation of categorical data. It targets a subset of “Resuelve problemas de gestión de datos e incertidumbre”. The simulated survey asks about food preferences; it does not collect real children's preferences or claim to assess the entire competence.

Each dataset supports four consecutive missions: classify the survey tokens, read a category count, identify the most frequent category, and compare two frequencies. All four missions retain the same counts and symbol key. Counts remain between one and fourteen. At the first band, a symbol represents one vote and categories have one to four votes; the next band expands counts; at the third band a symbol explicitly represents two votes. The symbol key remains visible throughout.

The student walks with arrows/WASD or a held mobile directional controller. Tapping a destination starts actual character travel. In classification, visit the survey booth to collect the next token, then stop at the desired category to register it. In interpretation, pick one of three answer cards and deliver it to the booth. Arrival automatically evaluates after a short stationary dwell, once per visit. Pickup and undo are free; submitted errors cost points. A wrong classification retains the same token in the saved survey rather than silently skipping it.

Example: a banana token delivered to the banana column adds one plotted symbol and saves progress. With a one-vote key, the count increases by one; with a two-vote key it increases by two. Delivering it to the maize column costs twenty points and one opportunity, and the hint identifies its category. Completing the full classification mission earns a single reward, rather than rewarding repeated pickup clicks.

## Assets first

New assets were produced with the built-in OpenAI image_gen tool before the complete game implementation: a transparent four-frame guide sheet and a transparent survey booth. Source PNGs, lossless exact-RGBA WebP files, atlas rectangles, full prompts, and hashes are retained in `apps/web/public/games/data/v1/`. The guide uses four real poses at two frames per second. Existing regional Fair backgrounds, the walking helper and Market fish/maize/banana sprites are reused with their original provenance.

The animation gallery is `/games/data/v1/preview.html`, with regional and Spanish, Chanka Quechua and Peruvian Aymara controls. Its example graph is an asset preview, not a saved student result. The real graph uses Phaser geometry and countable product symbols from authoritative task data. No numbers or localized labels are painted into the generated assets.

## Teacher flow and assessment

Choose The Data Fair in Game rooms, select the context and practice/challenge mode, create a room, add uniquely named participants, and start from the table. Existing ownership, normalized-name uniqueness, participation removal and next-student flows are reused. The room displays the data competence rather than quantity.

The backend saves each accepted token, the dataset cursor, task, score, errors, help, streak and four evidence histories. Temporary carried tokens and walking positions are not persisted. Reload restores the recorded survey, with no unregistered token in hand. Writes are optimistic and scoped to the verified teacher/tenant. Stale duplicate requests do not advance another token or award another score. Strict schemas reject client-supplied scores and nonoffered choices. Other game endpoints cannot mutate a Data Fair attempt.

Rewards follow the shared policy: +100 independent mission completion; +40 after help or a mistake; -20 per submitted error; +50 for every five consecutive independent missions. Three errors end the attempt. Loss and score persist until explicit retry. No speed bonus or fixed task cap. Practice selects the next dataset band using the least advanced of its four skill bands after each complete dataset, preserving the dataset within the four missions. Promotion requires four independent completions among five; repeated assisted outcomes lower the applicable skill band. These are product heuristics requiring educator review.

Challenge rooms use the same deterministic data, vote order, questions, numeric schedule and points for every participant across regions. Equal scores share positions. Adaptive practice scores remain personal, since learners may receive different datasets.

## Usability review and correction

Source-level heuristic assessment: 8/10, provisional rather than a measured usability outcome. The highest observed defect was severity 3: the category names were partially covered by the registration rectangles. A second issue was severity 2: oversized registration controls repeated their icon and action on separate rows. The correction separates names, controls and character stopping zones; uses compact one-line controls (46 logical pixels high, 150/180 wide); keeps larger semantic touch targets; reduces excess mission-panel height; and renders text at higher resolution.

Regression checks enforce a gap below the category labels, keep the character's head below those labels at destination, separate source and category touch overlays, and preserve reachable, nonoverlapping activation zones in both layouts. Remaining steps to reach a confirmed 10/10 are visual inspection in mobile and all locales plus first-use observation with teachers/children. Search is not applicable inside the active math task. The production runtime includes accessible controls, state announcements, undo, contextual help, reduced-motion behavior and recoverable loading/network errors.

## Verification and limits

The complete root check passed after the initial integration, including 108 worker tests and 35 web tests. Tests cover 900 generated datasets across all bands, correct symbol equivalences, per-token persistence, assisted/independent scoring, retained loss and retry, duplicate requests, strict input, ownership, cross-game isolation, comparable challenge paths and continued progression.

Computer Use created local room “Prueba Datos · Validación” and participant “Prueba Datos Uno”. Real UI play verified automatic booth pickup and banana-column registration, with one saved banana vote and no premature mission reward. Browser screenshots exposed the label/control overlap, which was corrected in source and given geometry regression coverage. Browser control intermittently timed out or followed user tab changes; a complete final desktop/mobile visual pass is not claimed. The final full root `pnpm run check` also passed after the compact-control correction: 108 worker tests, 36 web tests, four gateway tests, 11 architecture fixtures, lint, type checking and production/dry-run builds. The browser reported a user control change during the final reload, so the final mobile visual view remains unverified.

Migration `0013_data_game.sql` was applied successfully to local D1 only. No remote database migration, deployment, commit or push was performed. AI-authored Quechua and Aymara translations require bilingual educator review. No LLM is connected and no learning-effectiveness study has been performed.

Curriculum reference: [Minedu primary programme, second-grade data descriptors, PDF page 157](https://www.minedu.gob.pe/curriculo/pdf/31052016-programa-nivel-primaria-ebr-religion-2.pdf). The game covers organization, pictograms and reading/comparison of frequencies; uncertainty events and oral justification remain outside this game.

### Category-label rendering correction

The initial canvas-only spacing fix was insufficient in the observed browser. Category names now render once in the in-game HTML layer, using a dedicated layout strip, responsive font sizing, no wrapping and a foreground layer independent of sprite depth. The Phaser copy was removed. A runtime revision recreates the existing scene during local hot updates so a stale scene cannot hide the correction. The local desktop screenshot `output/data-labels-qa/desktop.png` confirms Pescado, Maíz and Plátano are complete, sharp and separated from the compact registration controls. The saved survey still contains the same one banana vote and zero points. Full root checks passed; final mobile inspection was blocked by browser-control timeouts.
