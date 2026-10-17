---
name: amautai-backend
description: Implement or review Amautai backend features using lightweight Clean Architecture on Hono, Cloudflare Workers, D1, WorkOS, and shared Zod contracts. Use only inside the Amautai repository.
metadata:
  owner: Diego Urday
  origin: Authored by Codex for Amautai at the owner's request on 2026-10-17.
  sources: Project AGENTS.md, current product document and comments, supplied rubric, and inspected code.
---

# Amautai backend

## Scope and prerequisites

Read root AGENTS.md, the current product document and relevant comments, [rubric](../../../docs/HACKATHON_RUBRIC.md), and affected code. For curriculum work also read docs/PRIMARY_MATH_CURRICULUM.md. Flag conflicts before dependent changes.

The current scaffold uses these layer boundaries. Preserve working contracts/authentication when extending a vertical slice; folders alone do not establish compliance.

## Layout and allowed dependencies

Create only files with a real responsibility:

~~~text
apps/worker/src/
  modules/<feature>/
    domain/          entities, value objects, business rules
    application/     use cases, repository/provider ports, application errors
    infrastructure/  D1 repositories and external-service adapters
    http/            Hono routes, validation, request/response mapping
    index.ts         explicit feature entrypoint
  shared/            genuinely shared identity/error primitives
  app.ts             composition, middleware order, feature mounting
  index.ts           Worker entrypoint
packages/contracts/src/  public DTOs and transport schemas
~~~

| Layer | May depend on | Must not contain/import |
| --- | --- | --- |
| domain | Domain code and TypeScript primitives | Hono, Zod, D1, SDKs, fetch, HTTP responses |
| application | Domain and application-owned ports | Hono Context, SQL, D1Database, WorkOS, Wrangler bindings |
| infrastructure | Domain/application contracts and provider libraries | Route orchestration or independent business policies |
| http | Application entrypoints and shared transport contracts | SQL, direct SDK calls, business decisions |
| composition | All layers to wire dependencies | Feature business logic or cached user/tenant identity |

- Dependencies point inward: HTTP -> application -> domain; infrastructure implements inward-owned ports.
- app.ts constructs adapters/use cases and injects them explicitly. No DI framework or service locator.
- Zod belongs at transport/provider boundaries. Map parsed DTOs into application inputs; do not import transport DTOs into domain merely to reuse a type.
- Cross-feature work uses a public application entrypoint/port, not another feature's private SQL or HTTP code.
- Keep application/domain errors independent of HTTP; map them at the HTTP boundary.
- Cache stateless SDK clients if useful; never cache request identity, permissions, or tenant context globally.

## Implement a vertical slice

1. State actor, tenant, input, business outcome, failure cases, and intended rubric evidence.
2. Identify pure rules: ownership, lifecycle transitions, mathematical/game validity, and review requirements.
3. Implement a named application function with an explicit dependency object and trusted execution context.
4. Define narrow behavior-oriented ports. Exclude database rows, SQL syntax, SDK response objects, and Hono Context.
5. Implement adapters, then a thin route. Parse shared request schemas, construct context from verified identity, invoke the use case, and serialize a public DTO.
6. Wire it in app.ts; preserve existing URLs/contracts unless changing them is requested.

Concrete project update boundary:

~~~ts
type Actor = { userId: string; tenantId: string }
interface ProjectRepository {
  findById(tenantId: string, id: string): Promise<Project | null>
  save(tenantId: string, project: Project, expectedVersion: number): Promise<void>
}
~~~

Project is the domain entity. Actor is constructed from verified server identity. The use case loads within that tenant, applies domain changes, and saves with the expected version. D1 enforces the version predicate; its adapter translates a stale write into an application conflict; HTTP returns 409. Never construct Actor from a request-supplied tenant.

## Authentication, permissions, and persistence

- Preserve WorkOS exact application/issuer checks, server-only keys, sealed HttpOnly sessions, PKCE/state, email-verification continuation, refresh, and revocation. When migrating auth, put SDK operations behind adapters; do not invent replacement identity verification.
- Preserve allowed-Origin and X-Amautai-Request mutation checks, body limits, no-store auth responses, and Secure cookies on HTTPS.
- Derive tenant and permissions from verified identity/membership and authorized stored relationships. Check teacher/family permissions server-side.
- Every tenant-owned D1 read/write includes its tenant condition. Use prepared statements, migrations, and atomic constraints/batches when required. Preserve project soft deletion and optimistic versions.
- Authorize relationships involving student, game, generation, assignment, and organization IDs; possession of an ID is insufficient.
- Distinguish validation, unauthenticated, forbidden, missing, conflict, rate-limit, and service errors. Log only sanitized categories/correlation data; never passwords, cookies, pending tokens, credentials, or identifiable child content.

## Future learning-game and AI boundaries

Apply these when those features are requested; they are not currently delivered capabilities.

- Application orchestrates context resolution -> generator port -> schema/domain validation -> reviewable draft -> persistence. Provider calls/prompts are adapters; mathematical/review rules stay inward.
- Preserve curriculum objectives and student context/language; a district does not determine one climate, culture, or language variety.
- Validate output against supported versioned game templates. Persist provenance/review state where required. Generate data/configuration, not arbitrary executable scripts.
- Do not mark unreviewed content as pedagogically validated or claim measured learning gains.
- Model pending/failed/retryable operations explicitly. Use idempotency when retries can repeat saves, assignments, or paid generation; bound retries to transient failures.
- Add queues, vector storage, Durable Objects, or additional providers only for demonstrated requirements. Build useful domain orchestration, not layers solely to inflate complexity.

## Verification and handoff

- Test domain rules/application decisions with fake ports; test D1 adapters against actual SQL and migrations.
- Cover relevant input failures, tenant/role violations, missing resources, stale writes, and provider outages. Auth changes retain password/OAuth/verification/recovery/logout coverage.
- For backend code changes run pnpm run typecheck, pnpm run lint, pnpm --filter @amautai/worker run test, and pnpm run build. Build is a dry run.
- Verify real persistence and failure behavior in the authorized environment. Mocked providers and passing tests do not prove public operation.
- Report implemented, tested, publicly verified, and pending separately, with tradeoffs and concrete rubric evidence. Follow existing deployment/Git authorization; rubric eligibility is not publishing permission.

## Native HTTP and automated enforcement

Use native fetch for first-party HTTP requests; do not add Axios or node-fetch. In the backend it belongs only in infrastructure adapters; in the browser it belongs only in shared/api/client.ts. Keep cancellation, timeouts, status checks, credentials, and safe errors in that transport. SDKs such as WorkOS remain behind backend adapters.

Run pnpm run check:architecture to reject forbidden imports, private cross-feature imports, dependency cycles, unresolved local imports, nonliteral module-loading escape hatches, SQL outside backend infrastructure, and network calls outside the allowed transport/adapter. Imports, exports, import types, dynamic imports, and require are parsed with the TypeScript AST. Root lint and build include this gate. Run pnpm run test:architecture to verify that the checker rejects representative violations. pnpm run check executes the full local gate. The checker enforces static boundaries; it does not prove authorization or business correctness.
