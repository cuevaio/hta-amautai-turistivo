# Amautai architecture

Authentication, projects, architecture boundaries and both notification channels are deployed. Learning-game and Phaser implementation remain pending. See [messaging architecture and handoff](MESSAGING_HANDOFF.md) for the final integrations.

## Backend

- Composition: apps/worker/src/app.ts wires provider/repository adapters and routes.
- Domain: project validation and pure identity/tenant policies.
- Application: project operations, workspace provisioning, auth orchestration, and provider/repository ports.
- Infrastructure: WorkOS SDK/token/session verification and D1 prepared statements.
- HTTP: Hono validation, cookies, encrypted OAuth/verification/recovery continuations, DTO mapping, middleware, and error/status translation.
- Shared runtime bindings are visible only to composition, infrastructure, and the Hono context declaration. Inner layers have no framework/provider imports.

SQL remains tenant-scoped. Project versions and soft deletion are preserved. WorkOS application/issuer verification, PKCE/state, Secure/HttpOnly cookies, CSRF checks, email verification, recovery, and revocation remain in place.

## Frontend

- app/: router and shell.
- pages/: route composition.
- features/auth, projects, settings: typed API modules, model hooks, and UI.
- shared/api/client.ts: the only browser fetch implementation.
- shared/model and shared/ui: theme and reusable app presentation.
- packages/ui: reusable Base UI primitives.
- packages/contracts: Zod request schemas and public DTOs; backend domain/application do not depend on this transport package.

Consumers use a feature's public index. A feature may consume the public auth/session context; private sibling imports and cycles are rejected. Business coordination belongs in pages/app or explicit contracts.

## Native HTTP

Use native fetch; do not install Axios or node-fetch. Browser requests have centralized credentials, CSRF header, timeout/cancellation, HTTP error mapping, and status information. Backend first-party fetch is restricted to infrastructure adapters; provider SDKs remain behind application-owned ports.

## Automated gates

- pnpm run check:architecture parses imports/exports, type imports, dynamic imports and require with the TypeScript AST.
- It rejects inward-layer violations, private cross-feature access, cycles, unresolved local imports, nonliteral module loading, SQL outside repositories, and network calls outside the native transport/adapter.
- Root lint and build include this gate.
- pnpm run test:architecture exercises representative invalid graphs, so a passing repository alone cannot hide a checker that accepts everything.
- pnpm run check runs architecture, lint, checker tests, types, backend tests, frontend transport tests, and a dry-run build.

The static checker does not prove business correctness, complete authorization, or dynamic runtime safety. Domain/application tests, real-SQL adapter tests, HTTP authentication/isolation tests, and local browser validation complement it.

## Scope and rollout

The architecture migration was subsequently published with notifications. See the messaging handoff for D1 migrations, VPS services and real delivery evidence. Preserve WorkOS configuration and secrets.
