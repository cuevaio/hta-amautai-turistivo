# Student game assignments through guardian WhatsApp

The teacher chooses a game room, enters the student's name and the **father, mother, or guardian's phone number**, then selects **Registrar y asignar juego**. This creates the room participation and its assignment together. Existing participants can use **Asignar por WhatsApp** without losing their saved score. The legacy name-only classroom API remains available for existing clients.

Peruvian nine-digit mobile numbers are normalized to `+51`; international numbers retain their country code. A guardian can receive separate assignments for multiple children. Contacts are scoped to the teacher's room participation; there is no public phone directory.

The assignment enters a durable D1 outbox. The existing minute cron submits its personal activity link to the configured Amautai WhatsApp gateway. The message addresses the student's family. Teacher rows show the guardian phone and actual delivery state; **Actualizar** reloads status and results. Queue acceptance is distinct from sent, delivered, or read acknowledgments. A disconnected gateway never produces a fake success. Definitively failed deliveries can be retried; ambiguous submissions are reconciled using the original gateway job ID to avoid duplicates.

The recipient opens `/actividad#<token>` and selects **Comenzar actividad** or **Continuar actividad**. No teacher account is needed. All five active games reuse the existing server-authoritative scoring and persistence. The teacher sees the student's resulting progress in the original room. The student cannot list classmates, read guardian contacts, choose another participant, manage rooms, or access authenticated teacher endpoints.

## Implementation boundaries

- Migration: `apps/worker/migrations/0016_student_assignments.sql`.
- Shared transport: `studentAssignmentInput`, `StudentAssignment`, and optional participant assignment metadata.
- Teacher endpoints: `POST /api/game-rooms/:room/assignments`, `POST /api/game-rooms/:room/participants/:id/assignment`, and `POST /api/game-rooms/:room/participants/:id/assignment/retry`.
- Student endpoints: `GET /api/assigned-games` and allowlisted game actions under `/api/assigned-games/:room/participants/:id/...`, authorized with an assignment bearer token.
- Public handlers are registered after shared origin/body-size protections and before account authentication. Account routes retain their existing authentication. Gameplay handlers are shared between teacher and student routes.
- Tokens contain 256 random bits, expire after 30 days, and are looked up by SHA-256 hash. The token is carried in the link fragment and Authorization header, not an API query string. The private outbox necessarily retains the message containing the link. Anyone holding the personal link can play that one assignment; it does not verify the guardian's identity.
- Deleting the participation or room cascades to the assignment and revokes future access. Messages already accepted by a provider cannot be recalled. Expired invitations can be renewed for the same participant without resetting progress; the previous token becomes invalid.
- Native fetch remains in the existing shared browser transport and WhatsApp infrastructure adapter. No provider SDK, SQL, or network request was added to UI or domain code.
- New UI messages are included in Spanish, Chanka Quechua, and Peruvian Aymara catalogs. Existing notes about pending human linguistic review continue to apply. Student names and teacher-authored room names are preserved.

## Validation and release

Automated coverage exercises normalization, idempotency, atomic registration, room capacity, teacher ownership, CSRF, private contact data, scoped student access, server-persisted answers, all five game starts, expiration/renewal, cascade revocation, delivery reconciliation, and safe retries. Existing notification integration fixtures apply all migrations before exercising the scheduled handler.

Local browser QA uses a visibly named test room and a reserved fictional phone number. Its delivery was cancelled in the local outbox before exercising the student link; no WhatsApp message was sent to a real recipient. The production database, gateway sender, and public deployment were not changed. Apply migration 0016 before releasing this Worker; production receipt remains a separate verification step.

The rubric evidence is the connected teacher assignment → guardian link → student gameplay → teacher result flow, including persistence and failure handling. Local tests and fixture use are not evidence of outside-team traction or measured learning gains.
