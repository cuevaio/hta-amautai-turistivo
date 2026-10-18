# Hack the Andes rubric

Source: [preserved PDF](references/hack-the-andes-rubric-sponsors.pdf), page 1. Supplied by Diego Urday and reviewed on October 17, 2026. This document translates its requirements into implementation guidance. Source hash and provenance: [sources.json](references/sources.json). Check organizer corrections when new evidence is supplied.

## Eligibility

All are required by Sunday, October 18, 2026, 09:00 Lima time:

- A deployed public URL; localhost does not count.
- A working live demo; slides or recorded video do not count.
- Code on GitHub, delivered with the URL. The PDF does not specify repository visibility.

Missing any entry requirement disqualifies the team from scoring. This constraint does not authorize creating a repository, committing, pushing, deploying, or submitting.

## Scoring

Five judges score each criterion from 1 to 5. Multiply by the weights, sum, and average the five judges' totals.

| Criterion | Weight | Evidence to build and demonstrate |
| --- | --- | --- |
| Technical complexity | 30% | Own domain logic with real data and useful service/model orchestration. A simple CRUD or API wrapper is the lowest anchor. |
| Works | 25% | Complete public flow with real data; handles questions outside the rehearsed script. |
| Technical quality | 20% | Reviewable code, no exposed credentials, and deliberate error and edge-case handling. |
| Problem and impact | 15% | A specific real user, a track-relevant problem, and evidence of that problem. |
| Clarity | 10% | Explain what was built, why, tradeoffs, and what remains outside scope. |

Base maximum: 5.0. Optional traction adds up to 0.5, for a maximum of 5.5. Ties favor technical complexity, then Works.

Traction: 0 without evidence of outside-team users; +0.25 for visible external usage; +0.5 for repeated usage, visible volume, a real waiting list, or a payment. Evidence must be visible from the product. Screenshots alone, team accounts, and automated traffic do not count.

## Amautai guidance

This section is our interpretation, not an additional organizer requirement.

- Prioritize one authentic learning-game flow over a large unfinished catalog.
- Teacher: lesson context -> AI proposal -> customization -> review/playtest -> assignment or group play -> observable evidence.
- Family: Theme -> reuse student profile -> review -> child plays. Grade, location, and language belong in the profile.
- Preserve mathematical objectives and curriculum linkage during contextual/language adaptation. Consult the current product document and curriculum sources; do not invent grade-level standards.
- Validate generated game configurations before persistence or Phaser execution. Use supported templates and data, not arbitrary generated executable code.
- Demonstrate persistence, tenant authorization, recoverable failures, and explicit pending/failed generation states.
- Record genuine usage only when implemented and authorized. Separate team tests from outside-team traction; never fabricate learning gains.
- Architecture supports quality and explainable decisions; layers alone do not earn complexity points.

## Status at review

- Public scaffold exists at https://amautai.urday.dev; authentication and project CRUD were verified.
- Learning-game flows, validated multilingual catalog, and offline play remain goals until implemented and verified.
- The code is backed up at https://github.com/turistivo/amautai, a private organization repository. Judge access and submission of its URL have not been verified. The local teacher-onboarding/session-draft changes have not been committed, pushed or deployed.

Architecture: [backend skill](../.agents/skills/amautai-backend/SKILL.md), [frontend skill](../.agents/skills/amautai-frontend/SKILL.md).
