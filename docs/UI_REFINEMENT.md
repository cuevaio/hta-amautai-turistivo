# Interface refinement

## Direction

The review uses `HACKATHON_RUBRIC.md` and the preserved source PDF, especially Works (25%), Problem and impact (15%) and Clarity (10%). Visual polish supports the live workflow; it does not establish educational efficacy or external traction. The organizer website identifies school education as track 03.

Preserve Amautai's Inter typography, blue actions, white surfaces, navy text (#102650), muted slate text and existing dark theme. Use existing semantic tokens rather than a new preset. Keep the strongest illustration in the public introduction; keep administrative screens quiet. Use 14/16 px body text, 24 px page titles and restrained 4/8/16/24/32 spacing. Left-align task content. The initial idea of additional decorative game cards was discarded: the games themselves carry the visual identity; the surrounding workflow should reduce reading.

Layout: introduction → three actual steps → teacher/family entry points. Inside the product: navigation → page purpose → configuration → action → saved results. Curriculum details remain discoverable through a disclosure. Destructive confirmations and scoring caveats remain explicit.

## Implementation scope

- Public introduction reflects the five implemented games, replacing outdated demo and future-messaging copy.
- Flatten teacher navigation, remove duplicate overview destinations and keep the active room section visible on nested routes.
- Unify dashboard gutters and constrain settings and sign-in forms.
- Simplify family choices, remove repeated instructions, preserve child selection and saved results.
- Move curriculum metadata into a keyboard-accessible disclosure and simplify region wording.
- Increase muted text contrast in the light theme; retain theme and component dimensions.
- Localize new copy in Spanish, Chanka Quechua and Peruvian Aymara. These remain initial translations pending bilingual review.

The shadcn MCP and separate technical shadcn skill were not available. Existing Base UI primitives were retained and official shadcn documentation was consulted through Context7. No dependency installation, component replacement or auth/scoring changes were needed.

## Review limits

The Refactoring UI checklist is a design heuristic, not a measured accessibility certification. Initial inspection found redundant hierarchy, unconstrained explanatory copy and weak light-theme secondary text. No numerical hackathon score or learning outcome is claimed. Deployment and external traction must be verified separately.

## Verification

- `pnpm run check` passed after the final edits (lint, types, tests, architecture gate, production build and Worker dry run). `git diff --check` passed.
- Computer-use review covered the real teacher room list, opening/cancelling room creation, curriculum disclosure, and the real family hub with its existing 100-point result.
- The public introduction was inspected at desktop and 390 px mobile widths, including Spanish, Chanka Quechua and Aymara. Family layouts were inspected in light and dark themes. Viewport overrides were reset and Spanish/dark preferences restored.
- Screenshots: `output/ui-refinement/landing.png`, `teacher.png`, and `family.png`.
- Provisional Refactoring UI diagnostic: 6/10 initially (5/8 checks); 9/10 after revision (7/8). Hierarchy, grayscale differentiation, whitespace, label emphasis, spacing, text measure and restrained elevation pass visual inspection. Complete contrast measurement across every interactive state remains unverified; the light-theme muted text was darkened. This is a design review estimate, not WCAG certification.
- New work is local. No publishing, push, account creation or score mutation was performed in this refinement.

## Subsequent scope changes

At the user's request, the landing experiment was reverted to the prior page. The learning-session and project screens were subsequently removed from active navigation and dashboard composition. Old Spanish and English URLs redirect to `/panel`, and successful sign-in and email verification now open `/panel`. Stored project/session records are retained; this interface removal does not run destructive migrations or remove teacher-profile onboarding needed by the games.
