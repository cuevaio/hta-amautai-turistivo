# Messaging architecture and handoff

Snapshot: October 17, 2026. Verify runtime and Git state again when resuming.

## Current update: automatic preferences and authentication email

Worker b438d08f-2d46-4063-967c-d9f3608fc5bd supersedes the earlier manual notification UI described below. Migration 0005 is applied locally/remotely. Dashboard settings list task_assigned, task_due and new_message, each with email/whatsapp/both/none. GET/PUT /api/notifications/settings persists one strict preference at a time, scoped to trusted identity. Pending automatic deliveries recheck their event preference. Both /test APIs return 410; public test/manual reminder controls are removed. Legacy schedule APIs remain for compatibility.

Diego explicitly chose to connect producers when task and messaging modules exist. The public notifications index exports the internal event entrypoint; producers must authorize recipient relationships before invoking it. No public event injection or synthetic producer exists.

AUTH_EMAIL_MODE=custom sends login verification and password recovery through Stalwart. WorkOS continues issuing/validating credentials; only WorkOS delivery for Email verification and Password reset is disabled in the isolated Andes Staging environment. Other default email categories remain enabled. Local protected .dev.vars includes the mail configuration. Verification/reset mail bypass activity opt-out and never enters the notification outbox. The real public recovery request reached Outlook Inbox at 16:41:02 Lima; no password was changed. New real signup verification remains untested in this deployment; password/signup/OAuth challenge handling has automated coverage.

Full gate: 72 backend, 10 architecture, 3 web and 4 gateway tests, lint/types/build. A signed-in public UI selection of both channels persisted after reload. The remaining sections preserve the previous integration snapshot and evidence.

## Architecture

React dashboard -> authenticated Hono API on Cloudflare Workers -> D1 outbox -> minute cron -> channel adapter.

- WhatsApp: HTTPS bearer API -> VPS Docker Baileys gateway -> shared Amautai sender.
- Email: HTTPS JMAP -> existing VPS Stalwart -> recipient mailbox.
- Cloudflare hosts the web/API, authentication integration and D1; Baileys runs on the VPS.
- Backend: apps/worker/src/modules/notifications/{domain,application,infrastructure,http}. Composition: app.ts; cron: index.ts. Providers and SQL stay in infrastructure behind application ports.
- Frontend: feature boundaries and shared/api/client.ts native fetch. Public DTOs: packages/contracts.

## Current user flow

WhatsApp: save an international phone number with consent to activate immediately. No recipient OTP or QR; only the shared sender is linked once by an administrator. Country-code digits are accepted without a leading plus.

Email: recipient and emailVerified come from the trusted WorkOS identity. No duplicate notification OTP or activation step. Explicit opt-outs persist. Callers cannot select arbitrary email recipients.

The public page supports per-event channel preferences and delivery history. Legacy scheduling endpoints remain for existing clients, while both test-send endpoints return 410 and manual reminder controls are removed. Educational assignment and messaging event producers remain pending.

## Delivery rules

D1 stores the durable outbox. The minute cron checks preferences, leases due rows and retries transient failures with stable IDs. Recipient changes and opt-out cancel pending messages; accepted/in-flight messages cannot be recalled. Uncertain submissions are not automatically replayed.

WhatsApp reconciles accepted/sent/delivered/read through gateway polling; UI updates may lag. Gateway SQLite persists jobs and encrypted authentication state. Email accepted means submission accepted by Stalwart; there is no automatic email delivery/bounce reconciliation.

## Services and configuration

| Component | Location |
| --- | --- |
| App / Worker | https://amautai.urday.dev / amautai |
| D1 | andes-app-db, binding DB; migrations 0001-0005 applied locally/remotely |
| WhatsApp source / deployment | apps/whatsapp-gateway / VPS /opt/amautai-whatsapp |
| Docker container | amautai-whatsapp |
| Gateway API | https://notify.urday.dev/amautai-whatsapp |
| Private admin | WSL localhost:8790 -> SSH -> VPS loopback:8791 |
| Email JMAP | https://mail.urday.dev/jmap/session |
| Email sender | notificaciones@amautai.urday.dev |

Worker configuration: AUTH_EMAIL_MODE=custom, WHATSAPP_GATEWAY_URL and secret WHATSAPP_GATEWAY_TOKEN; email EMAIL_JMAP_SESSION_URL, EMAIL_JMAP_USERNAME, EMAIL_JMAP_PASSWORD, EMAIL_FROM. Gateway uses GATEWAY_TOKEN and AUTH_ENCRYPTION_KEY; VPS protected env is /opt/amautai-whatsapp-secrets/gateway.env. Credentials stay outside Git/browser code.

Run infrastructure commands from WSL using ssh vps and Wrangler. Admin tunnel command: ssh -N -L 127.0.0.1:8790:127.0.0.1:8791 vps. Pairing supports QR or an eight-character code. Preserve recognized Chrome identity and initial LID synchronization. Session recovery survived a real container restart.

Both HTTP adapters use native fetch with manual redirect handling and reject redirects. Workers failed with redirect mode error despite passing Node tests. Gateway probes need a meaningful User-Agent; default Python urllib was blocked.

## API

- Automatic settings: GET/PUT /api/notifications/settings for task_assigned, task_due and new_message channel choices.
- WhatsApp base /api/notifications: GET overview, legacy POST schedule, POST /phone, PUT /preferences, DELETE /:id. POST /test returns 410; former WhatsApp /verify route is removed.
- Email base /api/notifications/email: GET overview, legacy POST schedule, PUT /preferences, DELETE /:id. POST /test and legacy notification verification return 410; WorkOS sign-in verification remains.
- Gateway: authenticated GET /connection, POST /notifications, GET /notifications/:id.

## Earlier delivery evidence

Worker 34ccf34a-4f96-44ba-9a6c-3685ebeaece2 included direct registration and email without duplicate OTP. The later Worker b438d08f-2d46-4063-967c-d9f3608fc5bd and its current release checks are recorded at the top of this document.

Full gate passed: 64 backend, 3 web transport, 4 gateway and 9 architecture tests; lint/types/build.

Actual public UI registered a phone without OTP and sent a real test. The repeat test around 16:20 Lima received a read acknowledgment from the gateway, job 771abbb2-920b-4133-9f82-466cf297f50b. Recipient numbers and credentials are omitted.

Email test received in Outlook at 16:16:19 Lima. Inspected production mail headers passed SPF, DKIM and DMARC. Latest test was classified as junk: receipt is confirmed; inbox placement needs attention.

Private repository: https://github.com/diegourday/amautai. Check Git status and the upstream commit to determine what is backed up.

## Continue

Read AGENTS.md, current product Google Doc/comments, PROJECT_STATUS.md and relevant project skills. Extend application entrypoints/ports when real learning events exist. Preserve tenant/user authorization, consent, trusted email identity, idempotency, limits and uncertain-send handling.

Run pnpm run check for implementation changes; external delivery is a separate check. Follow README review and Git authorization rules before deployment/push. Do not reset the linked sender merely to test connectivity.

Pending: educational events, email bounce/delivery tracking, inbox placement, and a retention policy for gateway recipient/job metadata. Baileys is unofficial.

Related: [architecture](ARCHITECTURE.md), [project status](../PROJECT_STATUS.md), [configuration](../README.md), [gateway operations](../apps/whatsapp-gateway/README.md).
