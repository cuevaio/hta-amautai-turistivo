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
