# Amautai project status

October 18 production release: published `/privacy` and `/terms` at https://amautai.turistivo.com. Worker version `30bc1389-aa25-4c4a-8817-1f4aa2514ead`; D1 unchanged at migration `0006`. Both pages were checked in the public browser and show the effective date, Diego Urday as individual operator, and `amautai@turistivo.com` contact. `pnpm run check` passed. Own Google OAuth client credentials are active in WorkOS Andes Staging and the public authorization redirects to Google with email/profile scopes. Google still labels its app Testing; the public consent-screen policy URLs remain unset pending action-time confirmation. WorkOS Production is gated on billing information and remains disabled. The Google chooser still says `workos.com`; Amautai branding there requires a WorkOS custom auth domain. The private GitHub remote description was verified; fetched `origin/master` matches HEAD, but five local files are modified and uncommitted.

October 18 mail update: Stalwart authenticates as `notificaciones@amautai.turistivo.com`; the active sender is `amautai@turistivo.com` (alias on existing domain `turistivo.com`). The support and postmaster aliases remain on `amautai.turistivo.com`. Four running Worker EMAIL_* secrets and protected local/VPS sender settings updated; previous mailbox retained. SMTP authentication passed and a test email arrived in the owner’s Outlook inbox. WorkOS Admin Portal reply-to is `amautai@turistivo.com`; Amautai verification/reset emails use the custom sender. WorkOS Magic Auth and invitations still use WorkOS delivery.

Legal pages `/privacy` and `/terms` are public from October 18, 2026. Diego Urday is identified as the individual operator, with `amautai@turistivo.com` as the contact for privacy and account requests. Legal text is published in Spanish; Quechua and Aymara legal translations still require human review.

Current delivery (October 17, 2026): https://amautai.turistivo.com. Application Worker `acee3d1e-c003-4b50-96ab-9d7839802dd8` (mail-secret update on October 18, 2026; existing code/assets retained), remote D1 migration `0006`, entry Worker `610d9376-2822-41fe-8d2e-e0a1910cab66`. Entry Worker belongs to the Turistivo account and overrides its wildcard router only for Amautai; original Worker, database, secrets and email sender remain in the personal account.

Published features include the localized landing page, static login artwork, light-theme navy text, login theme toggle, teacher onboarding and grade-2 Mathematics session drafts. Full gate passed: 79 backend, 13 web, 4 gateway, 10 architecture and 2 domain proxy tests; lint, types and builds passed.

Live verification: HTTPS root/login/artwork 200; D1 connected; anonymous protected endpoints 401; Google/GitHub authorization use the new callback and secure state cookies. Real Google login reached authenticated onboarding and persisted after reload. Recovery entry keeps its secure encrypted cookie and redirects to the new domain; allowed-origin/CSRF checks remain enforced. Actual password reset and a full GitHub login were not repeated. WorkOS callback, login, signup, sign-out and reset URLs use the new host; localhost and previous callbacks remain allowed for continuity. Google Cloud developer notifications now include `amautai@turistivo.com`. The user-support email remains the Google account because the selector only offers eligible Google accounts or managed groups. Amautai's own Google OAuth client credentials are connected in WorkOS Andes Staging. Google consent-screen audience is still Testing, and WorkOS Production requires billing information; neither has been enabled.

Git audit: origin git@github.com:turistivo/amautai.git is private; current HEAD matches upstream, with uncommitted implementation changes. Commit/push requires the user's answer; deployment is not a remote backup.

Snapshot: 2026-10-17. Read this file when resuming; verify runtime and external state again.

Teacher onboarding and learning-session drafts for second-grade primary Mathematics (cycle III) are now deployed with migration 0006. Only grade 2 is selectable; all six grades remain visible. See [teacher onboarding](docs/TEACHER_ONBOARDING.md). Historical checkpoints below retain their original local/deployment status.

Repository transfer: Amautai moved from diegourday to the Turistivo organization and was set to private. Origin uses git@github.com:turistivo/amautai.git. ErikJhonatan has admin access through active organization membership; the earlier personal collaborator invitation was withdrawn. Historical notes below retain the original repository URL as a record of its creation.

Current handoff: [Messaging architecture and integrations](docs/MESSAGING_HANDOFF.md). Sections below the latest release update preserve earlier checkpoints; their pending deployment, GitHub creation, recipient OTP, manual-send, and test-send statements describe historical states. A repeat WhatsApp test was read; an earlier notification email reached Outlook junk. The later authentication recovery email reached Inbox.

## Implemented

- pnpm/Turborepo monorepo: React/Vite, shadcn/Base UI, Motion, Hono on Cloudflare Workers, D1, WorkOS and Zod contracts.
- Local login, signup, email verification, password recovery, dashboard, logout and protected routes. Google and GitHub configured in the isolated Amautai WorkOS Staging environment.
- Tenant-scoped project CRUD with persisted D1 data, optimistic versions and soft deletion; account/settings and theme/loading states.
- Amautai branding, login illustration and SVG favicon.
- Backend domain/application/infrastructure/HTTP boundaries and explicit composition; frontend app/pages/features/shared boundaries.
- Native fetch centralized in browser transport; backend provider calls behind adapters. Both project architecture skills specify native fetch.
- Static dependency gates reject forbidden layer imports, private feature imports, cycles, misplaced SQL and network calls. Root lint/build run the gate.
- Project skills, architecture guide, stack checklist, preserved hackathon rubric and curriculum reference PDFs.

## Earlier architecture verification

- Full pnpm run check passed: 7 architecture tests, 41 backend tests, 3 frontend transport tests, lint, types and build. Worker build uses Wrangler dry-run.
- Browser on localhost:5173: existing real WorkOS session resolved; created/read/edited/reloaded/deleted a temporary project; settings reported database available.
- Logout returned to login; direct dashboard access after logout returned to login. The local browser was left signed out.
- The temporary project was soft-deleted. Existing data/secrets were preserved.
- Skills validated and git diff --check passed.

## Earlier local versus public snapshot

- Local URL: http://localhost:5173 (Vite), Worker backend on port 8787. Recheck amautai-dev.service and ports before starting another instance.
- Public URL: https://amautai.urday.dev. Deployment predates the architecture migration; latest known deployed version: 7dc1712b-286e-48f6-8ddc-400f4b334933. Public state was not rechecked during this migration.
- Local/public use the same isolated WorkOS Staging environment; local and remote D1 data are separate. Turistivo users were not deleted.
- At this earlier checkpoint, no deployment, commit or push had been performed for the architecture migration, and no remote/upstream was configured. Later sections record deployment and the private GitHub repository.
- Secrets stay in ignored local configuration/server bindings; never include them in status notes or commits.

## Earlier product roadmap

1. Choose the first second-grade math demo topic, real teaching session and supported devices/connectivity with Diego and Erik.
2. Implement student profiles and teacher/family roles with server-side authorization and tenant-scoped relationships.
3. Build one complete learning-game slice: context/theme -> AI proposal -> validated configuration -> review/playtest -> playable Phaser template -> assignment/share and observable results.
4. Add AI providers only when implementing that slice; provider choice/integration and generation failure handling remain pending.
5. Verify pedagogy and language adaptations with teachers. A validated multilingual catalog and offline play remain future work.
6. Architecture deployment and public auth/CRUD verification were completed in later checkpoints below.

## Resume instructions

Read AGENTS.md, this file, README.md, docs/ARCHITECTURE.md, both .agents/skills/amautai-* skills, docs/HACKATHON_RUBRIC.md and the current product Google Doc/comments before implementation. The product Doc remains Spanish; repository notes remain English.

Run pnpm run check after relevant changes. Keep working locally unless deployment is explicitly requested. Update this file with actual outcomes and remaining work before the next handoff. Do not treat a passing static dependency checker as proof of authorization or product completeness.

## Earlier email preparation — October 17, 2026

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

### Separate-recipient WhatsApp delivery verified

Diego selected a different personal recipient. The public application queued its verification request, production cron submitted it, and the gateway recorded a WhatsApp delivery acknowledgment (delivered). The actual phone number and code are omitted here. D1/UI reconciliation occurs on the next minute cycle. Recipient opt-in still requires the user's code entry; no verification was bypassed.

### WhatsApp end-to-end test completed

Diego entered the received code in the public application. The verified recipient shows active notifications. The public Enviar prueba action queued a new test notification; production cron dispatched it to Baileys, and the gateway recorded delivered with a WhatsApp message ID. This verifies the real application -> D1 outbox -> scheduled Worker -> VPS gateway -> distinct WhatsApp recipient flow. No code, recipient number or credentials are included in this note. The sender session was separately verified to reconnect after a container restart.

All WhatsApp implementation, deployment and delivery verification work is complete. Educational task integration remains future work because that product module does not yet exist. The code and final evidence notes are backed up in the private GitHub repository.

## Direct WhatsApp recipient registration

Diego requested removing the recipient verification step. Saving a phone now records consent and immediately enables notifications, including when the sender is temporarily offline. The UI uses one phone field and Save/activate; the recipient OTP form/API is removed. Phone changes cancel pending messages to the previous number, while saving the same number preserves reminders. Historical verification evidence is retained without marking new phone registrations as verified. Limits apply per account and recipient phone.

Automated tests exercise direct registration without historical verification or gateway connectivity, changed recipients, strict consent/input checks, isolation, idempotency, opt-out and delivery dispatch. Public deployment and the real separate-recipient test are verified after the coordinated email simplification.

## Email verification moved to sign-in — October 17, 2026

Removed the duplicate notification OTP and activation step at Diego's request. The backend uses WorkOS emailVerified from the trusted session; verified accounts have email notifications enabled by default, with persistent explicit opt-out. Migration 0004 retires pending OTPs and preserves known legacy opt-outs. Verified email changes cancel pending deliveries to the previous address. Old notification verification endpoints return 410. Login/signup/OAuth verification stays in the existing auth flow. Changes passed 64 backend tests; joint publication and real UI test follow the coordinated WhatsApp deployment.

### Direct registration publicly verified

Published Worker 34ccf34a-4f96-44ba-9a6c-3685ebeaece2; migration 0004 applied locally and remotely. Full gate passed: 64 backend, 3 web, 4 gateway and 9 architecture tests, lint/types/build.

Automated interaction with the actual signed-in public UI saved the authorized recipient using digits plus country code (without a leading +). The UI reported immediate activation and exposed zero WhatsApp OTP fields. Enviar prueba created a real outbox item; production cron forwarded it and the Baileys gateway returned a delivery acknowledgment (delivered). Sender session/credentials were preserved. No recipient number, OTP or credential is included in these notes.

### Email without duplicate verification publicly verified

Published Worker 34ccf34a-4f96-44ba-9a6c-3685ebeaece2 recognizes the existing verified WorkOS session. The actual signed-in public UI shows email notifications active with no notification OTP or activation form. Clicking Enviar email de prueba queued one test; production accepted it on the first attempt (provider submission c). Connected Outlook confirms receipt from notificaciones@amautai.urday.dev at 16:16:19 Lima on October 17, 2026, with subject Mensaje de prueba de Amautai. A folder-scoped mailbox read confirms Outlook classified this test as junk; delivery is verified, inbox placement is not. No mailbox rule or safe-sender change was made.

## Automatic notification preferences and own authentication sender — October 17, 2026

At Diego's request, removed notification test-send buttons and manual reminder forms; both test APIs return 410. Added persistent per-type email/WhatsApp/both/none settings for task assignment, deadlines and new messages. Migration 0005 retires pending legacy manual sends and adds event metadata. Settings are scoped to the trusted tenant/user and cancellation/dispatch honor current type preferences.

Diego explicitly chose to connect task/messaging event producers when those modules exist. The internal event entrypoint is prepared and covered with actual SQL/idempotency/dispatch tests; no live task or messaging automation is claimed.

Custom authentication email uses Stalwart with the existing protected sender. WorkOS remains responsible for issuing and validating verification/reset credentials. The application retrieves verification details server-side for password/signup/OAuth challenges and sends recovery links only to the WorkOS-returned recipient. Publication and live recovery delivery verification follow the full gate.

## Authentication email sender verification — October 18, 2026

Corrected the production Worker JMAP secrets from the protected Stalwart sender configuration after identifying literal quote characters in the prior values. The public forgot-password flow now returns its generic confirmation and Outlook confirms receipt of `Recupera tu contraseña de Amautai` from `amautai@turistivo.com`. The WorkOS challenge verification and recovery mailer tests pass (3/3); both use the same custom Stalwart sender while WorkOS issues and validates the credentials. The reset link was left unused and no password was changed. A live verification challenge was not generated for the existing verified account.

Published Worker b438d08f-2d46-4063-967c-d9f3608fc5bd after migration 0005 locally/remotely. Full gate passed: 72 backend, 10 architecture, 3 web transport and 4 gateway tests, lint/types/build. The real signed-in public UI exposed the three automatic settings with all four channel options and no test/manual forms; selecting both for deadlines persisted through a full reload. A later optional selector check was blocked by Edge because another extension UI was open.

In the isolated WorkOS Andes Staging environment, disabled only WorkOS delivery for Email verification and Password reset after deploying custom delivery. Other email categories remain enabled. A request through the real public forgot-password page returned success; connected Outlook confirms Recupera tu contraseña de Amautai from notificaciones@amautai.urday.dev at 16:41:02 Lima, specifically in Inbox. No password was changed and reset credentials were not exposed. Custom verification for password/signup/OAuth is covered by automated challenge/continuation tests; a new real signup verification has not been exercised in this deployment.

GitHub origin exists and its PRIVATE visibility/description were verified. Existing commits have no divergence from upstream, but this release and concurrent work remain uncommitted. Diego explicitly declined commit/push for this turn; do not treat deployment as a remote backup.

After Diego dismissed the extension UI, the final public screen was visually verified. The temporary deadline selection was restored to the original email default; all three selectors show email. Screenshot: ignored .artifacts/automatic-notifications.png. No commit or push was performed.

## Teacher onboarding and learning-session drafts — local review

- Implemented a two-step teacher onboarding, optional independent location/region/setting/language context, and profile editing in Settings. Existing signed-in accounts without a profile are redirected to onboarding.
- Added a versioned CNEB catalogue with four Mathematics competencies, associated capacities, seven transversal approaches, primary grade/cycle mappings and sources. This release enables only second grade; the API rejects other grades, levels, areas and invalid curriculum combinations. Pasted performances remain unverified teacher input.
- Sessions support incomplete drafts with a title, listing, reopening, editing, completeness hints, a copyable summary and explicit resolution of optimistic-version conflicts. Data is scoped to both tenant and user. Each draft persists its own context snapshot.
- Local migration 0006 succeeded. Full check passed: 79 backend, 10 architecture, 5 web and 4 gateway tests, lint/typecheck/build. Backend tests execute the actual migrations and repository SQL against SQLite. Worker build is a dry run.
- Real WorkOS local browser session: selected grade 2, completed onboarding with optional context blank, reloaded without repeating onboarding, created an incomplete draft, edited/reloaded it, copied the summary, and triggered/resolved a real 409 from a second tab without losing unsaved input. Profile-context changes persisted and appeared in a new session while the older draft retained its original context. Temporary context was restored to blank; one clearly named local test draft remains for inspection.
- Checked narrow 550 px and desktop 1280 px layouts without horizontal overflow, light/dark themes and keyboard focus between fields. These are browser viewport checks, not a physical-phone test. Ignored evidence: .artifacts/education-narrow.png and .artifacts/education-desktop-light.png.
- WorkOS authentication remains in place. Teacher profile is a usage/context record, not a new privileged role. Family onboarding, student records, AI, Phaser, official per-grade performance descriptors, assignment/messaging producers and measured learning outcomes remain future work.
- Development runs through filtered Turbo web/Worker tasks; the earlier transient amautai-dev service no longer existed. No real WhatsApp gateway was started for this feature. Changes remain local for review, without commit, push or deployment.
