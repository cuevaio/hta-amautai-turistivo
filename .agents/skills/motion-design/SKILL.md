---
name: motion-design
description: Implement or review Amautai UI motion using Diego Urday's approved staggered fade-up entrance while preserving the established interface.
metadata:
  owner: Diego Urday
  author: OpenAI Codex
  origin: Project adaptation of Diego Urday's personal motion-design skill, requested in this chat.
  sources: Personal motion-design skill; approved apps/web/src/features/auth/ui/login-form.tsx and apps/web/src/shared/ui/boot-loading.tsx.
---

# Amautai motion

Read the current product document and apply the Amautai frontend and shadcn-design skills. Limit edits to the requested animation; preserve control sizes, spacing, typography, colors, layout, authentication, and contracts.

- Reference: `apps/web/src/features/auth/ui/login-form.tsx`. Use `motion/react`, hidden `{ opacity: 0, y: 12 }`, visible `{ opacity: 1, y: 0 }`, duration `0.32`, ease `easeOut`, and `delayChildren: stagger(0.075)`.
- Reveal content in reading order: introductory text, heading, description, Google, GitHub, email, then the supporting link. Adapt the sequence to other screens without copying login-specific actions.
- Keep the main loader through route/session/data readiness; reveal real controls directly, without an intermediate authentication skeleton or artificial loading delay. Preserve the dashboard's own loading behavior.
- Animate content elements, not the entire screen, background, or artwork. Do not replay entrances on language changes, typing, validation, or unrelated rerenders.
- Define `motion.create(Component)` outside render and verify ref/style forwarding. Avoid wrappers that change layout.
- Keep forms mounted and preserve values, selection, focus, and scroll. Do not use locale keys to force remounts.
- Respect `MotionConfig reducedMotion="user"`; use `useReducedMotion()` and `initial={reducedMotion ? false : "hidden"}` for the entrance.
- Clean up imperative animations/listeners and handle rapid changes without stale or hidden content.
- Verify the sequence, final visibility, existing dimensions, email dialog, keyboard focus, slow loading, desktop/mobile, both themes, and Spanish, Chanka Quechua, and Peruvian Aymara. Run required frontend checks and report local versus deployed status accurately.
