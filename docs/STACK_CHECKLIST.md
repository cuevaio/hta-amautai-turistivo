# Amautai — Stack checklist

Updated: October 17, 2026.

## Implemented

- [x] Frontend: React, Vite, TypeScript, React Router.
- [x] UI: shadcn/ui, Base UI, Tailwind CSS.
- [x] Animation: Motion.
- [x] Theme: dark, light, and system.
- [x] Backend: Hono on Cloudflare Workers.
- [x] Database: Cloudflare D1 with migrations.
- [x] Tenants: user/organization isolation.
- [x] Projects: create, list, view, edit, and soft delete.
- [x] Validation: Zod with shared frontend/backend contracts.
- [x] Native fetch transport; no Axios dependency.
- [x] Backend Clean Architecture and frontend feature boundaries migrated locally.
- [x] AST dependency checks and negative regression tests, enforced by root lint/build.
- [x] Auth: WorkOS Staging.
- [x] Login: email/password, Google, and GitHub.
- [x] Signup, email verification, password recovery, and logout.
- [x] Workspace: pnpm and Turborepo.
- [x] Public deployment: https://amautai.urday.dev.
- [x] Checks: types, lint, build, and 41 backend tests, 3 transport tests, and 7 architecture tests passed in the local migration run.

Local and public login share WorkOS. Local and remote D1 store separate data.

## Pending

- [ ] GitHub code delivery required by the supplied judging rubric; pending because upload was declined. Requires explicit authorization.

- [ ] Finish reviewing and deploy the new loading states; local source exists.
- [ ] Rotate the WorkOS API key before October 24, 2026.
- [ ] Define and build the actual product beyond the CRUD scaffold.
- [ ] Configure WorkOS Production and owned OAuth credentials before production launch.

## Optional — only if needed

- [ ] AI: Workers AI / MiniMax.
- [ ] Vector database: select a service, potentially Cloudflare Vectorize.
- [ ] Real time: Durable Objects / WebSockets.
- [ ] Containers.
- [ ] File storage: R2.
- [ ] Team invitations and organization management.
- [ ] Account editing and project search/pagination.
- [ ] Automated browser tests, CI/CD, and monitoring.

gRPC is not required by the current HTTP/JSON API.

Verification details and setup: [README](../README.md).

Architecture guidance: [backend skill](../.agents/skills/amautai-backend/SKILL.md), [frontend skill](../.agents/skills/amautai-frontend/SKILL.md), and [judging rubric](HACKATHON_RUBRIC.md). The existing scaffold is migrated locally; architecture checks run in root lint/build. Future learning-game features must use the same boundaries.
