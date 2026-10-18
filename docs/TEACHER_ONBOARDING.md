# Teacher onboarding and learning-session drafts

Published with the authorized domain migration to https://amautai.turistivo.com on October 17, 2026. Migration `0006_education.sql` is applied locally and remotely. Google login reached authenticated onboarding and survived reload; completing onboarding and creating a session were not repeated publicly during this migration.

## Supported workflow

After WorkOS authentication, an account without a teacher profile enters `/onboarding`. Two steps collect the teaching group and optional context. Teacher, Primary and Mathematics are fixed; grades 1–6 remain visible with only grade 2 enabled. Its cycle is III. Grade availability is a product restriction enforced by both contracts and domain rules.

Context includes free-text location/community, geographical region (Costa/Sierra/Selva), urban/rural setting, and the group's language. Each is optional and independent; location does not determine language or environment. Context does not include student identity records. Settings can edit the profile later.

The dashboard opens the learning-session list. `/panel/sesiones/new` creates a draft; `/panel/sesiones/:id` opens its summary and editor. `/panel/proyectos` retains the existing project workspace.

A draft contains:

- A title (3–120 characters); incomplete drafts may be saved.
- One mathematical competence and its selected capacities, purpose, and optional teacher-provided performance/precision text.
- A meaningful situation, optional transversal approaches, and a context snapshot copied from the profile but editable for that draft.
- Start/development/closing moment and optional integer duration of 1–240 minutes. Suggestions of 10/20/10 minutes are product defaults, not mandatory CNEB timing. A previously entered duration is preserved when changing moment.

Missing-field hints cover competence, capacities, purpose, situation, moment and duration. “Datos completos” means those fields are populated, not pedagogical approval. Performance text is marked as unverified teacher input. No descriptors, learning evidence, activities, AI responses or games are fabricated. Copying uses only the entered data and curriculum labels; it can also copy unsaved edits. If clipboard access fails, the summary remains selectable.

## Curriculum sources

`cneb-2016-v1` is the versioned local catalogue transcription. It includes grade/cycle mappings, four competencies, their capacities and seven transversal approaches. The API serves this catalogue; browser forms do not maintain a separate competence list. Domain validation rejects unknown versions, IDs, duplicate selections and capacities outside their competence.

- [CNEB](https://www.minedu.gob.pe/curriculo/pdf/curriculo-nacional-de-la-educacion-basica.pdf), preserved in `docs/references/`: PDF pages 135, 138, 143 and 146 for competence/capacity labels; page 161 for primary cycles.
- [Planning cartilla](https://www.minedu.gob.pe/curriculo/pdf/cartilla-planificacion-curricular.pdf), a 2017 working document marked as undergoing validation: session elements and moments on PDF pages 17–22. It supports the organizational reference, not a claim that Amautai produces an officially approved template.

Grade-specific official performance descriptors are not prefilled. They require a separately verified primary curricular-programme source before inclusion.

## API and persistence

All endpoints require the existing verified identity. Mutations retain body limits, allowed-Origin and `X-Amautai-Request` checks. The server derives tenant and user; caller-supplied identity/tenant fields are rejected.

| Endpoint                         | Behavior                                                                  |
| -------------------------------- | ------------------------------------------------------------------------- |
| `GET /api/education/catalog`     | Versioned curriculum catalogue and references                             |
| `GET /api/education/profile`     | `{profile}`, null before onboarding                                       |
| `PUT /api/education/profile`     | Save strict teacher/primary/mathematics/grade-2 values and context        |
| `GET /api/learning-sessions`     | All drafts belonging to the current tenant and user, newest updated first |
| `POST /api/learning-sessions`    | Create a draft after profile completion; returns 201                      |
| `GET /api/learning-sessions/:id` | Read an owned draft and its missing-field hints                           |
| `PUT /api/learning-sessions/:id` | Update with its current positive `version`; returns the new version       |

Contracts are in `packages/contracts/src/education.ts`. `teacher_profiles` is keyed by tenant/user; `learning_sessions` has owner-scoped queries and an optimistic version predicate. Changes to a profile never rewrite old session contexts. Drafts are not shared with other members of the same tenant in this slice. A self-selected teacher profile grants no elevated permissions.

Invalid scope/catalogue/input returns 400; an inaccessible or absent draft returns 404; missing onboarding or a stale version returns 409; storage/service failures return 503. On conflict, the editor preserves local input, allows copying/comparing the stored version, and replaces local input only after an explicit user action. There is no automatic retry that overwrites a newer version.

Backend ownership remains domain/application/infrastructure/HTTP in the education module. Browser ownership remains feature API/model/UI, with native fetch only in the existing shared transport. WorkOS and the previous project/notification flows are preserved. Session saves do not emit notification events.

## Local run and verification

```bash
pnpm --filter @amautai/worker exec wrangler d1 migrations apply andes-app-db --local
pnpm exec turbo dev --filter=web --filter=@amautai/worker --ui=stream
pnpm run check
```

The web app is at `http://localhost:5173`, and the Worker is at port 8787. The filtered command does not start the separately configured WhatsApp gateway.

Automated coverage executes all migrations against SQLite and checks persistence, same-tenant user isolation, cross-tenant denial, incomplete drafts, scope/catalogue validation and stale-write rejection. Browser verification used a real local WorkOS session and actual local D1: onboarding/reload, create/edit/reload/copy, context snapshot preservation and a conflict between two tabs. Narrow 550 px and desktop 1280 px, light/dark themes and keyboard focus were checked. Physical-phone behavior has not been tested.

See [Profile onboarding](PROFILE_ONBOARDING.md) for the teacher/parent role choice and family learning context. No AI/provider integration, Phaser runtime, named student records, assignments, export files or family game-generation flow is included. Deployment was completed with the domain migration; commit and push remain subject to user approval.
