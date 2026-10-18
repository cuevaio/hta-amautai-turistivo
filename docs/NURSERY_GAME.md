# The Tens Nursery

A third room-based Phaser game for second-grade place value, decomposition, and exchanges between units and tens. This is a proposed educational activity, not a certification of curriculum mastery or demonstrated learning gains.

## Teacher and student flow

Open Game rooms, choose The Tens Nursery, choose coast/highlands/jungle and adaptive practice/classroom challenge, create a room, add named participants, and start from the participant table. Existing duplicate-name checks, removal authorization, room ownership, and shared-position ranking remain in effect. Practice displays personal scores rather than comparative ranks.

The student moves the caretaker with arrows/WASD or the mobile directional controller. Five labeled stations live inside the scene: one pot (+1), a ten-pot tray (+10), group ten, open a tray, and plant. Stop at a station for 260 milliseconds to perform one action per visit. Tapping a station makes the caretaker walk there and act on arrival; it does not fill the target automatically. An explicit repeat tap while already at a pickup/exchange station performs one further action, with a short debounce. Repeated taps at the garden never resubmit while the same visit is latched. Leave and return to evaluate another preparation.

The six separate action buttons and their E/Q/G/U shortcuts were removed. Undo (also Z) and help remain inside the board. Undo conserves the already saved score and prevents an immediate automatic pickup/evaluation at the current location. The current preparation is transient; reload restores the task's starting load, while score/task/evidence/loss persist.

Teacher controls are separate from play: View results opens the room table, and Next student opens the next pending participant directly, preserving already saved results. The evidence summary shows independent completions, assisted completions, and errors without expanding the panel. Passing to another student does not mark an active continuous attempt as lost or completed. Three errors still end the run; retry remains explicit.

## Three mission types

- **Form quantities:** start empty and prepare the target. Any equivalent decomposition is valid: 3 trays + 7 singles and 2 trays + 17 singles both represent 37.
- **Group units:** start with the target as single pots. Prepare it with the maximum possible number of complete trays, leaving fewer than ten singles. This constraint is stated before evaluation.
- **Open tens:** start with the canonical tens/units representation. Prepare the same total with at least ten single pots, requiring at least one tray to be opened. This constraint is stated before evaluation.

Targets are 10–19, 10–49, or 10–99 according to the skill's practice band or the room's shared challenge schedule. Intermediate loads are bounded at 99 and cannot be negative. A tray represents exactly ten plants; the engine composes ten copies of the single-plant asset over the empty tray. Grouping and opening preserve total quantity. Regions change scenery, not mathematical rules, route distance, controls, or scoring.

## Points, persistence, and adaptation

The server awards +100 for an independent first success, +40 after help or an error, −20 and one opportunity per incorrect submission, and +50 for each fifth consecutive independent success. Three errors end the attempt. Negative scores are allowed. There is no fixed round cap or score ceiling in ordinary play; safe-integer bounds reject overflow. Loss and final score remain until explicit retry resets the current attempt.

A shared pure learning transition implements the existing Market Route score/adaptation policy. Nursery and market tasks, validation, endpoints, and saved state are separate. Optimistic participant versions and atomic D1 updates prevent duplicate changes. Unauthorized, stale-future, invalid, and cross-game requests cannot award points.

Practice records three independent skill histories: promotion after four independent successes among five, demotion after two assisted completions among three, with window reset after a band change. These are product heuristics requiring teacher evaluation. Classroom challenge uses the same deterministic sequence and range schedule for every participant; equal scores share rank. Help and error history remain available in learning evidence.

## Art and language

The [original animation gallery](../apps/web/public/games/nursery/v1/preview.html) preserves the four-frame caretaker, one potted seedling, and empty ten-cell tray. Version 2 adds three generated regional pixel-art backdrops: [coast](../apps/web/public/games/nursery/v2/coast.png), [highlands](../apps/web/public/games/nursery/v2/highlands.png), and [jungle](../apps/web/public/games/nursery/v2/jungle.png). All original PNGs are retained. The runtime serves lossless WebP encodings, verified byte-for-byte equal after RGBA decoding, and loads only the selected regional backdrop plus shared sprites. The [v2 manifest](../apps/web/public/games/nursery/v2/manifest.json) records original and delivery filenames, dimensions, exact prompts, hashes, and sizes. The built-in image_gen tool created the art; format conversion did not edit pixels.

Desktop and mobile have dedicated scene geometry. The portrait layout increases the relative size of mission text, stations, and quantities and keeps directional controls inside the board. Inter matches the application typography; forest green, sage, nursery wood, and sand ground the game in its subject. Scenery uses cover scaling with a mask rather than stretching. The visible garden accepts arrivals along its outer edge, matching its interaction bounds.

Movement, transfers, exchanges, planting, and reward animations explain player actions. Reduced motion preserves essential movement and removes decorative animation. HUD, preparation, and outcome stay inside the game. Screen-reader status announcements distinguish quantity changes from scored outcomes. Resize/loading/error states cannot leave stale interactive controls over an unready scene. Interface text exists in Spanish, Chanka Quechua, and Peruvian Aymara; AI-authored translations still require educator review. Tasks and hints remain deterministic; no LLM provider is connected.

## Storage and deployment

Migration 0011 expands the room-kind constraint while preserving IDs, ownership, child relationships, and existing game types, and adds `nursery_state` to participants. It has been applied to local D1 only. Apply pending migrations to a deployment target before serving the new game there. Local implementation and test participants do not establish public deployment or external traction.

## Verification checkpoint

The final root `pnpm run check` passes architecture boundaries, lint, type checks, automated tests, and production/dry-run builds. This includes 96 worker tests, 29 web tests, and four UI-package tests. Five station/inventory regressions cover one action per visit, pending/disabled/movement gating, intentional pickup taps, layout separation, and visible garden-edge arrivals. Nursery domain and API tests cover equivalent decompositions, explicit exchange constraints, quantity conservation, scoring, assistance, loss, independent skill progression, continued challenge generation, invalid loads, duplicate scoring, authorization, saved loss/retry, and migration preservation.

The design review initially estimated usability at 6/10 as an informal heuristic assessment, not a user-study result. The redesign removes the separate action panel, enlarges the portrait scene, improves instruction contrast, separates goal/world/inventory/evidence, and fixes keyboard focus after tapping stations. It also corrects missed garden-edge deliveries, unready resize controls, and repeated screen-reader victory announcements. A final Quechua mobile inspection exposed instruction text approaching the toolbar; the footer text was moved upward and resized to preserve separation.

Computer Use exercised the actual local app and API with explicitly named test participants. In v2, desktop grouping and keyboard delivery saved rewards; a wrong delivery deducted 20 once without repeating while stationary. The teacher's Next student action preserved that score and opened another pending participant. A fresh mobile attempt collected one tray and seven singles, automatically delivered 17 plants for 100 points, then switched to desktop, grouped 14 singles, and automatically saved another 100 points. Victory and teacher evidence were visibly updated. Earlier full-flow checks also verified three-error loss, persistence on reload, and explicit retry.

The portrait layout was inspected at 390×844 in Spanish, Chanka Quechua, and Peruvian Aymara. Browser-size testing does not certify a physical device or multitouch hardware. Temporary viewport settings were reset. Current screenshot evidence is in `output/nursery-v2-qa/`; earlier checks remain in `output/nursery-qa/`. Translations still require educator review. No remote migration, deployment, commit, or push was performed for this redesign.
