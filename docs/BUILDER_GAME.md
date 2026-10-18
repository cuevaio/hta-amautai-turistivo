# Builders of Peru

A Phaser 3.90 geometry game for second-grade primary learners. It replaces The Data Fair in the active room catalogue and targets a subset of “Resuelve problemas de forma, movimiento y localización”. It does not certify the entire competence or establish measured learning gains.

## Learning and interaction contract

The child assembles one toy house with three large pieces: a rectangular wall, triangular roof and square window; a circular window is introduced later. A single space is highlighted at a time. Tap a piece and then the highlighted space, or drag the piece to that space. Placement automatically evaluates. There is no character travel, inventory, delivery trip or Check button. Keyboard users can focus and activate the same native controls.

A correct piece snaps into place and saves immediately. Dropping outside the active target does not submit or deduct points. Deliberately placing the wrong offered shape or orientation deducts twenty points and one opportunity, keeps the active space, and exposes a corrective hint. Selecting a different piece is free. The mathematical shape is evaluated independently of pointer accuracy.

The first tasks have no rotation. Three evidence histories cover shape recognition, side/corner descriptions, and orientation. Practice uses the existing independent-evidence bands. Rotation is available only in the orientation skill after its introductory band. The visible house remains upright: the palette triangle starts turned, and the learner turns the selected piece in quarter turns to fit. Square and circle symmetries accept every quarter turn; rectangles accept half turns; the roof triangle requires its upright orientation. Rectangles and squares remain distinct.

The mathematical pieces, silhouettes and highlights use exact native Phaser geometry. The child always has three offered shapes and a single active destination. Symbol and control text uses the localized HTML layer inside the game, keeping it sharp and independent of sprite depth.

## Assets first

The built-in OpenAI image_gen tool produced a transparent four-frame carpenter guide and an opaque workshop tabletop before full implementation. Originals, exact lossless WebP files, atlas, full prompts, image sizes and hashes are in `apps/web/public/games/builder/v1/`. The guide has distinct encouragement/celebration poses and the runtime plays them after confirmed placement. Reduced motion omits these decorative cues and snap scaling.

The asset gallery is `/games/builder/v1/preview.html`. It shows the four actual guide frames, the tabletop and an illustrative roof snap animation, with coast/highlands/jungle scenery and Spanish, Chanka Quechua and Peruvian Aymara controls. Existing regional Fair backgrounds retain their provenance. They contextualize a shared toy-building workshop rather than claim that one house style represents every Peruvian community.

## Points, saved state and teachers

Three confirmed pieces complete one construction and award +100 independently, or +40 after help or a learning error. Individual piece placement saves progress but does not award repeated points. The fifth consecutive independent construction adds fifty points. Three errors end the attempt. Final score and loss persist until explicit Retry resets the attempt. There is no fixed construction cap or speed bonus.

Room creation defaults to Builders of Peru. Teachers choose a context and practice/challenge mode, add uniquely named participants and start from each table row. Existing ownership, next-student, removal and normalized-name constraints remain. Points, placed-piece cursor, help, errors, task, streak and evidence are server-authoritative. Temporary selection, drag position and locally chosen rotation are not restored after a reload; confirmed placements are restored.

Challenge participants get the same task and difficulty sequence in every region. Equal scores share rank. Adaptive practice uses personal points rather than comparing different difficulty paths. Strict input schemas reject extra client score fields, unknown shapes and unsupported angles. Optimistic versions prevent duplicate placement or reward, and authorization isolates tenants, owners and games.

## Replacement and history

The Data Fair is removed from new-room choices and its kind is rejected by the public creation schema. Existing data rooms and participants retain their scores and data state. Their player route displays a replacement notice; the room becomes read-only for adding/starting participants, with results retained. Its backend contracts remain for historical compatibility and existing integrity tests. Geometry scores live in new builder rooms with a separate state column; they never inherit statistical-game points.

Migration `0014_builder_game.sql` expands the kind constraint and adds `builder_state` without changing historic attempts. It was applied locally only. No remote migration, deployment, commit or push was performed.

## Verification

The complete root `pnpm run check` passed after integration and test additions: 114 worker tests, 38 web tests, four gateway tests and eleven architecture fixtures, plus lint, type checks and production/dry-run builds. Added regressions cover 1,800 generated tasks, actual rotational symmetries, three-pieces/one-reward accounting, partial progress, loss/help/retry, input validation, cross-game/owner isolation, stale requests, comparable sequences and responsive drag-coordinate conversion. The complete check passed again after refining in-game help/rotate contrast and removing duplicate completion feedback. `git diff --check` also passed.

Computer Use created local room “Prueba Constructores · Diseño” and participant “Prueba Constructor Uno”. Actual UI play placed wall, roof and window, displayed automatic completion and saved one hundred points. A deliberate wrong triangle in the next wall space deducted twenty once, kept that space, displayed the rectangular-shape hint and left two opportunities. The saved screenshot is `output/builder-qa/desktop.png`. The asset gallery was also visually inspected. Actual mobile dragging, all three locale layouts and advanced rotation were not verified interactively; their relevant contracts/geometry are covered automatically. Bilingual educator review of AI-authored translations remains pending.

There is no LLM connected. Task generation and scoring are deterministic. Classroom observation and teacher feedback are required before making learning-effectiveness claims.
