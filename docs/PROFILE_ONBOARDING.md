# Profile onboarding

After sign-in, users choose one role: teacher or parent. Existing teacher profiles are migrated as teachers.

Parents save one learning context per workspace: primary grade (1–6), city, and main language. All three fields are required. Do not collect a child's name, address, or identifying details in this flow. Data is stored in `family_profiles`.

`GET` and `PUT /api/profile/family` require the authenticated user to have the parent role. The server derives the user and workspace from the verified session. Migrations: `0010_account_profiles.sql` and `0011_family_profiles.sql`.

Keep the existing migration filenames when integrating the game migrations. D1 tracks the complete filename, so the shared `0010` and `0011` prefixes do not replay applied profile migrations. Profile tables and game alterations are independent.

The family home uses the shared dashboard sidebar. Profile selection and registration keep their own loading layout.

Parents open `/panel` after signing in, choosing the parent role and saving a family profile. They can add multiple children using names or aliases, select a saved context, and create private practice sessions with the same five active teacher games. Scores and progress are saved. The old `/panel/familia/jugar` entry redirects to this family dashboard; linked sessions play at `/panel/familia/jugar/:roomId/:participantId`. See [Family learning games](FAMILY_GAMES.md) for privacy boundaries, scoring and current scope.

## WhatsApp welcome on registration

New teacher and parent accounts must provide a WhatsApp number with its country code and explicitly consent on `/registro/perfil`. The same step follows password and OAuth sign-in. Numbers are normalized to E.164 using the shared notification contract. The UI and welcome support Spanish, Chanka Quechua, and Peruvian Aymara; translations still need bilingual human review.

`PUT /api/profile` now accepts the strict `{role, phone, consent: true, locale}` contract. Identity and workspace come from the verified server session. Apply **0017_profile_welcomes.sql before deploying this Worker and frontend**. Profile persistence and its registration event commit in a single D1 batch. Existing accounts are not backfilled or forced through onboarding.

The existing minute scheduler transfers pending registration events into the notification outbox and submits them through `apps/whatsapp-gateway`. The stable `account-welcome-v1` request key prevents duplicate jobs if registration or acknowledgement is repeated. Gateway timeouts retain the original job ID. Delivery history distinguishes pending, accepted, sent, delivered, and read. Welcomes expire after 24 hours; queued messages still recheck phone, consent, opt-out, and existing daily limits. A later phone change or opt-out wins over a deferred welcome. Registration does not change activity-specific channel preferences.

The temporary registration event clears its phone after transfer or expiry; the recipient contact remains in the existing notification contact store. The phone and consent metadata are not included in public profile responses. Production uses the existing `WHATSAPP_GATEWAY_URL`, `WHATSAPP_GATEWAY_TOKEN`, and paired sender; no gateway credential enters the browser.

Verification: `pnpm run check` passed (138 worker, 40 web, four gateway, and eleven architecture tests, plus lint, types and builds). Tests include both roles, all locales, strict validation, atomic rollback, idempotency, queue/acknowledgement outages, gateway retries, opt-out, recipient changes, isolation and expiry. Local browser QA uses a fixture session and a failing save endpoint to check validation and draft preservation; it never sends real messages. Production rollout and actual welcome receipt remain unverified.

## Parent-flow recovery check (October 18, 2026)

The local database was missing migration 0017 after pulling the current onboarding code. Because role persistence and the welcome event are atomic, the missing `profile_welcomes` table prevented registration from committing. Migration 0017 was applied locally. The Worker development command now applies pending local migrations before starting; an already-running process must be restarted after pulling schema changes. Production schema state was not changed or verified during this check.

The phone control now accepts pasted spaces, punctuation, `+51`, or `0051` before validating the nine national mobile digits. It preserves overlong/invalid input for an explicit field error instead of silently truncating it into another recipient. Continue remains available after role selection so validation can explain incomplete input. All new help text is present in the three interface locales; button dimensions and the existing layout are preserved.

Profile registration distinguishes a failed write from a failed follow-up family-profile read. A committed role survives a read outage, and the profile gate offers a read retry without repeating registration or its welcome event. Failed writes preserve the selected role and phone draft.

The full `pnpm run check` passed: 138 Worker, 44 web, four gateway, and eleven architecture tests, plus lint, type checks and builds. A translation regression introduced by the pulled evidence-page badge was also repaired without changing its proper name.

Browser verification used two loopback-only fixture APIs with temporary SQLite databases, all migrations, and simulated authenticated identities. It covered role/phone registration → family context → dashboard → child alias → Builders game → one completed challenge worth 100 points → persisted family history. Separate injected outages verified field validation, write-failure draft preservation, successful-write/read-failure recovery, and a single durable welcome event. Registration help and errors were checked in Spanish, Chanka Quechua and Peruvian Aymara, including a 390-pixel viewport with no horizontal overflow. Evidence is in `output/parent-flow-qa/`. No real account, phone recipient, or WhatsApp delivery was used. Public deployment and public welcome delivery remain unverified.
