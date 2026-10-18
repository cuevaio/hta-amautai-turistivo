# Family learning games

## User flow

Parents complete account selection and the existing family onboarding, then open `/panel`. The family dashboard replaces the temporary three-round, unsaved multiplication sample with the five active teacher games: Market Route, Nursery, Builders of Peru, Equality Fair and Feed Your Community. Existing art, Phaser runtimes, interaction rules, opportunities, support and server scoring are reused. The retired Data Fair remains excluded.

1. Add a child using a name or alias and an explicit coast/highlands/jungle context. Surnames and child authentication are not required. These games are explicitly for second-grade primary learners; no adaptation to other grades is claimed.
2. Choose a child. Their saved context is reused automatically. The existing family city and main-language text is shown as reference; city does not determine region, and free-text family language does not silently change the explicit UI locale.
3. Choose a mathematical topic, with the actual game title and a concrete activity description visible. Select **Create and play**. The server creates a private practice room and its single linked participant atomically, then opens the existing game.
4. Return through **My games** to the child's current scores, completed tasks, dated sessions and resume/result actions. Each newly created session starts independently. Explicit in-game Retry retains each game's existing policy: reset the current attempt, including score. It does not create an archived attempt snapshot.
5. Edit an alias/context for future games without rewriting historical session snapshots. Deleting a child requires explicit confirmation that the profile and all its sessions/results are removed.

The family sidebar exposes My games, Account and Settings. Teacher room management and next-student controls stay in the teacher flow. Scores from different games or adaptive trajectories are not turned into a sibling ranking. Each child's personal sessions remain separate.

## Architecture and data

- Shared strict schemas: `packages/contracts/src/family-games.ts`.
- Parent-only endpoints: `GET/POST /api/family-games`, `POST /api/family-games/children`, and `PUT/DELETE /api/family-games/children/:id`.
- Family use cases and D1 repository live inside the existing rooms module. The server derives tenant and parent from the authenticated session; requests cannot select an owner, score, context override or challenge mode.
- `0015_family_games.sql` adds normalized unique aliases per parent, optimistic child-profile versions and a nullable `game_rooms.family_child_id`. Existing teacher rooms retain a null link. Foreign-key deletion cascades to the selected child's rooms and participants. The migration was applied locally only.
- Child creation is limited atomically to twenty profiles per parent. Alias normalization follows the existing participant-name domain rules, including Unicode normalization, collapsed whitespace, case-insensitive keys and rejection of control characters.
- Session creation accepts a UUID request ID. A single D1 batch creates both room and participant under that stable ID, using owned child data. Repeating the request returns the same session without resetting progress or creating another room. Reusing the ID with another child/game conflicts. A UUID does not confer ownership.
- Gameplay uses the existing owned `/api/game-rooms/:room/participants/:id/...` endpoints. Scores and state versions remain server-authoritative. Generic participant-add/remove actions reject linked family rooms. Teacher room lists exclude family sessions.
- React coordinates configuration, abortable reads, mutation locking and navigation. Phaser remains lazy-loaded through the original player/canvas boundary. Family sessions do not import or duplicate an engine.

The shadcn MCP and separate technical shadcn skill were unavailable in this session. Existing installed Base UI primitives were preserved, with official shadcn documentation retrieved through Context7; no components were reinstalled.

This is configuration of existing supported game templates. No LLM or generated executable code is involved. Regional art and product adaptation do not establish measured learning gains. Initial Chanka Quechua and Peruvian Aymara UI translations require bilingual educator review.

## Verification

Seven new tests exercise the actual HTTP application and repositories with all SQL migrations in SQLite: parent-role/authentication/CSRF requirements; aliases and tenant/parent isolation; starting all five real engines; idempotent creation and rejected score/configuration injection; saved scoring, stale answers and persistent loss; versioned edits and historical snapshots; deletion isolation/cascades; and profile limits.

The full root `pnpm run check` passed after the final navigation and mobile-layout changes: 121 Worker tests, 40 web tests, four gateway tests and eleven architecture fixtures, plus lint, type checks and production/dry-run builds. Two new frontend regressions cover encoded links, selected-child restoration and the five-game localized catalogue.

Computer Use signed into a newly created WorkOS account named **Familia Prueba Amautai** in the separate in-app browser, leaving the teacher Chrome session unchanged. It completed parent onboarding, added **Prueba Sol** (coast) and **Prueba Luna** (highlands), verified automatic selection of the new child, created Builders of Peru for Luna, placed all three shapes, observed automatic completion and one hundred points, returned to the saved history, resumed and returned again with Luna still selected. The return-link issue discovered during this check was fixed using the child UUID query parameter; names are not placed in URLs.

The family catalogue was inspected at desktop and mobile widths and in Spanish, Chanka Quechua and Peruvian Aymara. The mobile child selector and results row were adjusted after inspection. Light and dark themes were checked, and temporary locale/viewport/theme changes were restored. Saved visual evidence is under `output/family-qa/`. The live browser playthrough used Builders; all five engines are covered by the integration start tests and reuse the teacher implementations. Actual mobile directional play in the other four games was not repeated for this integration. No measured learning-effectiveness or translation-validation claim is made.

No remote D1 migration, deployment, commit or push is part of this change. The WorkOS test account was created as explicitly requested; its private credentials are kept outside the repository, never in source, logs or screenshots.
