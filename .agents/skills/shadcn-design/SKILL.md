---
name: shadcn-design
description: Refine shadcn interfaces with clear hierarchy, useful density, consistent branding, and accessible states. Use for visual design, layout refinement, and interface polish alongside the technical shadcn skill.
metadata:
  owner: Diego Urday
  origin: Adapted for Amautai from Diego Urday's global shadcn-design skill on 2026-10-17.
  authorship: unverified
  sources: Diego Urday's global shadcn-design skill and explicit Amautai typography preference.
---

# Design applications with shadcn

Preserve the project's existing design decisions unless the user requests a change. Do not turn one application's design into a universal template.

## Context and components

- Inspect the current screen, components.json, installed components, and tokens. Identify the primary task and action.
- Use the technical shadcn skill and MCP for integration and examples. If unavailable, use the CLI and official documentation and report the limitation.
- Use pnpm and preserve the lockfile. Do not reinstall existing components or overwrite local variants when changing presets.
- Preserve typography, colors, radius, and supported themes. Apply a different preset only when requested.

## Visual direction

- Do not use uppercase text transforms, tracking utilities, or custom letter spacing.
- Make context, primary content, and next actions easy to distinguish. Use semantic tokens and reserve primary color for meaningful emphasis.
- Keep cards fitted to their content, spacing consistent, and text readable. Avoid equal heights or empty space added solely for symmetry.
- For compact dashboards, consider Card size=sm, 8-16 px gaps, and 28-40 px figures as starting points, not universal limits.
- Choose rows, tables, lists, sections, or cards according to the task. Avoid decoration without a purpose.
- Use shared component composition and variants; avoid screen-specific color and typography patches.
- Give icons a clear purpose and consistent optical size. Use real brand assets and preserve their provenance.

## Content and interaction

- Present relevant figures and dates directly. Do not replace an available date with a generic status.
- Distinguish occurrence, detection, and consultation times. Do not invent precision or interpret missing data as no activity.
- Preserve loading, empty, error, and stale-data states. Compact layouts must retain necessary information and accessible controls.
- Provide recognizable actions and visible keyboard focus. Do not make read-only content appear clickable.
- When Motion is used or requested, use brief transitions for entry, data changes, or feedback. Respect reduced motion and avoid continuous decorative animation.

## Verification

Check the actual browser view at desktop and mobile widths when layout changes. Review supported themes, contrast, long dates, overflow, keyboard navigation, and relevant states. Run checks appropriate to the change without tests that merely mirror CSS classes. Preserve business logic, authentication, and contracts. Briefly report changes, verification, and material limitations.
