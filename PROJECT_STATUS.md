# Amautai project status

Current delivery: public notifications module and VPS Baileys gateway deployed. WhatsApp sender is linked and reconnects after restart. The coordinated email channel is active. Private GitHub backup target: https://github.com/diegourday/amautai. Latest full gate: 60 backend, 3 web, 4 gateway, 9 architecture tests; lint/types/build passed. Recipient verification and final delivery tests are recorded below.

Snapshot: 2026-10-17. Read this file when resuming; verify runtime and external state again.

## Implemented

- pnpm/Turborepo monorepo: React/Vite, shadcn/Base UI, Motion, Hono on Cloudflare Workers, D1, WorkOS and Zod contracts.
- Local login, signup, email verification, password recovery, dashboard, logout and protected routes. Google and GitHub configured in the isolated Amautai WorkOS Staging environment.
- Tenant-scoped project CRUD with persisted D1 data, optimistic versions and soft deletion; account/settings and theme/loading states.
- Amautai branding, login illustration and SVG favicon.
- Backend domain/application/infrastructure/HTTP boundaries and explicit composition; frontend app/pages/features/shared boundaries.
- Native fetch centralized in browser transport; backend provider calls behind adapters. Both project architecture skills specify native fetch.
- Static dependency gates reject forbidden layer imports, private feature imports, cycles, misplaced SQL and network calls. Root lint/build run the gate.
- Project skills, architecture guide, stack checklist, preserved hackathon rubric and curriculum reference PDFs.

## Latest verification

- Full pnpm run check passed: 7 architecture tests, 41 backend tests, 3 frontend transport tests, lint, types and build. Worker build uses Wrangler dry-run.
- Browser on localhost:5173: existing real WorkOS session resolved; created/read/edited/reloaded/deleted a temporary project; settings reported database available.
- Logout returned to login; direct dashboard access after logout returned to login. The local browser was left signed out.
- The temporary project was soft-deleted. Existing data/secrets were preserved.
- Skills validated and git diff --check passed.

## Local versus public

- Local URL: http://localhost:5173 (Vite), Worker backend on port 8787. Recheck amautai-dev.service and ports before starting another instance.
- Public URL: https://amautai.urday.dev. Deployment predates the architecture migration; latest known deployed version: 7dc1712b-286e-48f6-8ddc-400f4b334933. Public state was not rechecked during this migration.
- Local/public use the same isolated WorkOS Staging environment; local and remote D1 data are separate. Turistivo users were not deleted.
- No deployment, commit or push was performed for the architecture migration. Changes remain local; no remote/upstream was configured at the last check. The owner declined GitHub publishing. Do not infer permission from rubric requirements.
- Secrets stay in ignored local configuration/server bindings; never include them in status notes or commits.

## Next work

1. Choose the first second-grade math demo topic, real teaching session and supported devices/connectivity with Diego and Erik.
2. Implement student profiles and teacher/family roles with server-side authorization and tenant-scoped relationships.
3. Build one complete learning-game slice: context/theme -> AI proposal -> validated configuration -> review/playtest -> playable Phaser template -> assignment/share and observable results.
4. Add AI providers only when implementing that slice; provider choice/integration and generation failure handling remain pending.
5. Verify pedagogy and language adaptations with teachers. A validated multilingual catalog and offline play remain future work.
6. When requested, deploy the local architecture changes and verify public auth/CRUD. Back up to Git only with explicit authorization.

## Resume instructions

Read AGENTS.md, this file, README.md, docs/ARCHITECTURE.md, both .agents/skills/amautai-* skills, docs/HACKATHON_RUBRIC.md and the current product Google Doc/comments before implementation. The product Doc remains Spanish; repository notes remain English.

Run pnpm run check after relevant changes. Keep working locally unless deployment is explicitly requested. Update this file with actual outcomes and remaining work before the next handoff. Do not treat a passing static dependency checker as proof of authorization or product completeness.

## Email channel — October 17, 2026

Prepared locally: independent email API, D1 migration 0003, verification/consent/preferences, scheduled/test messages, history/cancellation UI, and Stalwart JMAP adapter. No mail server or DNS writes and no real email sent. Configuration and sender-domain setup remain pending; see README. Public status must be verified separately after any coordinated deployment.

Email validation: full pnpm run check passed (59 backend tests including 11 email tests, 3 web transport tests, 2 WhatsApp gateway tests, 9 architecture tests, lint/typecheck/build). Email SQL tests use SQLite with actual migrations; JMAP tests use mocked responses. Browser inspection of the built UI verified disabled and enabled/history states with a separate local fixture preview. The real localhost session could not be checked; real sender authentication, receipt, and SPF/DKIM/DMARC alignment remain unverified.

## WhatsApp deployment on 2026-10-17

- Implemented phone ownership verification, explicit consent, personal reminder scheduling, opt-out/cancellation, test sends, and per-user history at /dashboard/notifications.
- Added a D1 outbox and minute-based scheduled dispatch/delivery reconciliation. Existing educational assignment flows remain unimplemented.
- Deployed the Worker and migrations 0002/0003; current WhatsApp publication 62bc27f6-7cf7-41c0-9950-463f1da2e2e3. Email secrets may create a newer version in the coordinated email chat.
- Installed amautai-whatsapp in Docker at /opt/amautai-whatsapp on the VPS. Persistent SQLite auth uses AES-256-GCM; keys/tokens live outside the checkout. Public gateway API requires its own bearer credential.
- Verified HTTPS gateway authentication, unauthorized rejection, container health, public D1 health, and the real public notifications screen using Diego's existing WorkOS session.
- Worker requests use redirect: manual; redirect: error caused a production TypeError despite Node tests passing. The live UI now resolves the gateway's actual connection state.
- Admin access uses the transient SSH tunnel amautai-whatsapp-admin.service from WSL localhost:8790 to VPS loopback:8791. Browser form Origin validation works with Referrer-Policy same-origin.
- Pairing supports QR or an eight-character code, uses a recognized Chrome identity, and invalidates cached codes after socket replacement/disconnection. Required LID mapping sync remains enabled.
- Full gate passed: 9 architecture tests, 59 backend tests, 3 frontend transport tests and 4 gateway tests, plus lint/types/build. Gateway tests include auth encryption, persistence, request deduplication, admin Origin checks and pairing lifecycle with a fake socket.
- Sender pairing and real WhatsApp delivery are still pending user interaction at this snapshot. Do not claim a successful message until the sender is linked and receipt evidence exists.
- Git remains uncommitted with no remote/upstream configured. Deployment is not a remote backup; ask before committing or publishing.

### WhatsApp sender linked

Diego confirmed successful code pairing. The HTTPS gateway reports connected, including after an actual container restart without re-pairing. The public UI resolves the gateway state. Real recipient verification and notification delivery remain separate checks.

Diego authorized a private GitHub repository, commit and push. Created https://github.com/diegourday/amautai, verified private visibility and a non-empty project description, and configured origin. Known local secrets were checked against candidate files without printing their values; no matches were found. Final commit/push verification follows the coordinated email chat's last documentation changes.

## Email activation in production — October 17, 2026

- Created notificaciones@amautai.urday.dev as a regular Stalwart user under the new amautai.urday.dev domain; no existing account credentials were changed.
- Published MX (mail.urday.dev, priority 10), SPF (v=spf1 mx -all), RSA DKIM (v1-rsa-20261017) and DMARC (p=reject, existing postmaster@urday.dev report address). Public DNS resolves and DKIM matches the server-generated key.
- Provisioned all four EMAIL_* Worker secrets and ignored local configuration. Credentials are kept in protected files outside Git and never logged.
- Fixed the production Workers redirect-mode incompatibility in the JMAP adapter using manual redirect handling and rejecting non-success responses; added regression coverage.
- Full gate passed: 60 backend tests, 3 frontend transport tests, 4 gateway tests and 9 architecture tests, plus lint/typecheck/build.
- Published Worker d0d73c98-098c-47a2-8a30-3abab825b925. Existing WorkOS/WhatsApp secrets remain present.
- A real signed-in request queued a verification email to Diego; production cron recorded accepted (provider submission b), Stalwart reports final/SMTP 250, and the connected Outlook mailbox confirms receipt from notificaciones@amautai.urday.dev at 15:56 Lima time.
- Diego's personal notification opt-in is awaiting his code entry; the code was not exposed or bypassed. Sender activation and real receipt are already verified. Outlook message-source headers independently confirm SPF=pass, DKIM=pass and DMARC=pass for amautai.urday.dev.
- A local Node CLI probe reached authenticated discovery but timed out connecting to the JMAP API; it submitted no test email. The production Worker path is independently verified.
- GitHub private origin is now configured by the coordinated WhatsApp chat with Diego's explicit backup authorization. That chat owns the final commit/push; no parallel commit is performed here.

### Public WhatsApp verification request

Diego authorized testing against the linked sender number itself. The real signed-in public UI requested a phone verification code with explicit consent; production cron accepted the outbox item and the VPS gateway recorded sent with a provider message ID. Recipient code entry remains user-controlled and is pending at this snapshot. Sending to the sender's own number appears in the user's self-chat; sent alone is not a delivery/read confirmation.

The private GitHub repository contains the application snapshot. Subsequent evidence-only notes are synchronized separately. Never include live pairing codes, phone verification codes or credentials in Git.
