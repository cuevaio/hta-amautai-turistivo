---
name: amautai-frontend
description: Implement or review Amautai React/Vite frontend features with feature-based boundaries, shadcn/Base UI, accessible async states, shared contracts, and a separated future Phaser runtime. Use only inside the Amautai repository.
metadata:
  owner: Diego Urday
  origin: Authored by Codex for Amautai at the owner's request on 2026-10-17.
  sources: Project AGENTS.md, current product document and comments, supplied rubric, and inspected code.
---

# Amautai frontend

## Scope and prerequisites

Read root AGENTS.md, the current product document and relevant comments, [rubric](../../../docs/HACKATHON_RUBRIC.md), and affected routes/components. For curriculum-dependent UI also read docs/PRIMARY_MATH_CURRICULUM.md.

Use feature-based architecture; do not replicate backend layers around every React component. The scaffold now uses app/, pages/, features/, and shared/. Preserve working URLs and these boundaries when extending a vertical slice.

## Target layout

~~~text
apps/web/src/
  app/                   router, providers, bootstrap, application shell
  pages/                 thin route composition and route-level loading
  features/<feature>/
    api/                 typed endpoint calls and DTO mapping
    model/               feature hooks, state, pure client-side rules
    ui/                  feature-specific forms and components
    index.ts             explicit public exports
  shared/
    api/                 transport, safe errors, session-expiry handling
    ui/                  reusable app-specific compositions
    lib/                 domain-independent utilities
  game-runtime/          future Phaser adapter and supported templates
packages/ui/             reusable shadcn/Base UI primitives and theme
packages/contracts/src/  shared Zod schemas and public DTOs
~~~

Use auth, projects, and settings for existing slices. Add student profiles, learning sessions, generation, and assignments only when implementing those product features.

## Allowed dependencies and ownership

- app/pages compose feature public exports. Pages do not own requests, persistence, or business workflows.
- Features import their own internals, shared modules, @workspace/ui, and @amautai/contracts. Never import a sibling feature's private files or import app/pages from a feature.
- Coordinate features through a page/app boundary or an explicitly shared contract; avoid circular imports and catch-all shared modules.
- packages/ui contains presentation primitives, never API calls, WorkOS logic, or tenant policies.
- shared transport owns fetch configuration, cookie credentials, X-Amautai-Request, cancellation, and safe error mapping. Feature API modules own endpoint paths and typed calls.
- Components render and emit events. Feature hooks orchestrate requests/state; pure transformations belong in model/, not JSX/effects.
- Keep state local until multiple consumers need it. Separate server state from temporary form/UI state. Do not duplicate API entities in a global store or add a query/state framework without a concrete need.

## Implement a vertical slice

1. Define actor, route, task, API contract, and loading/empty/error/success behavior.
2. Reuse shared Zod request schemas and public DTOs. Server validation/authorization remain authoritative.
3. Add typed feature API calls, hook-based coordination, and focused UI components.
4. Compose the route through the feature entrypoint. Preserve theme, session handling, and existing callers.
5. Verify keyboard/mobile behavior and the actual happy path; do not substitute fixtures when an API fails.

Concrete project update boundary: the edit dialog emits validated values to useProjects; that hook calls projectsApi.update with the current version. On 409, keep the user's draft and offer refresh/reconciliation. Do not overwrite newer server state or send a tenant selected from browser state.

## UI, accessibility, and async states

- For shadcn work use both the shadcn skill and MCP, inspect installed components, and read matching Base UI docs. Use render, not Radix asChild.
- Reuse Field/FieldGroup, titled Dialogs, Empty, Skeleton, and existing primitives. Preserve semantic tokens, dark/light/system themes, and reduced-motion support.
- Keep user-facing copy in Spanish unless requested otherwise. Respect configured language/variety; do not infer it solely from district.
- Preserve responsive geometry during route/session/data loading; announce status accessibly and hide decorative placeholders. No fake percentages or forced loading delays.
- Distinguish initial loading, background refresh, empty content, invalid input, expired access, provider failure, and success. Keep useful content during refresh.
- Disable conflicting actions while pending; prevent duplicate mutations, cancel obsolete reads, and ignore stale/unmounted responses.
- Place field errors by their controls. Keep valid input/drafts after network failures; offer bounded retries. Do not mark valid fields invalid for a service outage.
- Close an editor only after successful persistence. Keep success/error feedback visible and respect server version conflicts.
- Keep WorkOS server-mediated through HttpOnly cookies. Never expose API keys, refresh tokens, or pending authentication tokens in React state, URLs, storage, or bundles.
- Account/tenant UI reflects verified session data but is not authorization. Different WorkOS users may have separate personal workspaces.

## Product-specific flows

These are future product requirements, not a claim that the scaffold implements them.

- Teacher: lesson context -> AI proposal -> personalization -> review/playtest -> assignment or group play -> observable evidence. Expose curriculum linkage and generation/review state.
- Family: the game-creation form has one field, Theme. Reuse grade, location, and language from the student profile; do not add curriculum-planning fields.
- Keep mathematical goals visible while adapting characters, environment, difficulty, and language. Present editable choices without claiming validated cultural/pedagogical adaptation.
- Use actual server generation state and error messages. Never replace a failed generation with a hardcoded successful game.
- Do not advertise a complete catalog, validated translations, offline play, or learning improvements before implementation and verification.

## Future Phaser boundary

- React owns navigation, accessible forms, session, and surrounding UI. game-runtime owns Phaser instances, scenes, assets, and lifecycle.
- Define typed, versioned configuration and typed events/results. Accept only supported templates and validated data; never execute AI-generated scripts.
- Create/destroy the runtime through an effect with cleanup for listeners, timers, and resources. Do not rebuild a scene on every render or put frame-by-frame game state into React.
- Lazy-load the runtime only for playable routes; exclude Phaser from login/administrative bundles.
- Send meaningful attempts/results through the authorized API. Client scores and user IDs are not trusted authority.
- Offline download/play/sync requires explicit implementation and connectivity testing; cached UI does not prove offline gameplay.

## Verification and handoff

- For frontend changes run pnpm run typecheck, pnpm run lint, and pnpm run build.
- Test meaningful regressions such as validation, request races, draft preservation, concurrency handling, or runtime cleanup; avoid tests that just mirror markup.
- Check affected routes, keyboard focus, narrow/wide layouts, themes, and loading/empty/error/retry/success in the browser. State when mocks/previews were used.
- For auth, verify provider return, optional email verification, dashboard session persistence, and logout separately. Keep user credentials/codes with the user.
- Explain observable rubric value, tradeoffs, and remaining scope. A polished mock does not prove a live public flow or external traction. Default to local work; publish/push only within the user's authorization.

## Native HTTP and automated enforcement

Use native fetch for first-party HTTP requests; do not add Axios or node-fetch. In the backend it belongs only in infrastructure adapters; in the browser it belongs only in shared/api/client.ts. Keep cancellation, timeouts, status checks, credentials, and safe errors in that transport. SDKs such as WorkOS remain behind backend adapters.

Run pnpm run check:architecture to reject forbidden imports, private cross-feature imports, dependency cycles, unresolved local imports, nonliteral module-loading escape hatches, SQL outside backend infrastructure, and network calls outside the allowed transport/adapter. Imports, exports, import types, dynamic imports, and require are parsed with the TypeScript AST. Root lint and build include this gate. Run pnpm run test:architecture to verify that the checker rejects representative violations. pnpm run check executes the full local gate. The checker enforces static boundaries; it does not prove authorization or business correctness.
