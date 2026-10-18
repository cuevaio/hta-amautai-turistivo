# Interface internationalization

Published to https://amautai.turistivo.com with the authorized domain migration on October 17, 2026. Commit and push remain subject to user approval. Earlier validation notes below retain their historical deployment status.

The React application uses i18next/react-i18next with bundled message catalogs in `apps/web/src/shared/i18n/`. Supported UI locales are Spanish (`es-PE`), Chanka Quechua (`quy-PE`) and Peruvian Aymara (`ay-PE`), selected explicitly by the user. Chanka Quechua and Aymara translations are initial AI-authored drafts, with no recorded bilingual human review or pedagogical validation.

## Interaction

- A compact shadcn Select backed by the installed Base UI primitives shows the current language beside the theme button in the existing dashboard header. It preserves the previous control dimensions and position, with no page-wide bar or new layout row; breadcrumbs truncate when space is limited. Registry guidance was checked through the shadcn MCP.
- Login and onboarding place the same select beside the logo. Workspace settings provides the full labeled select with persistence/context explanatory text. Options are Español, Quechua chanka and Aimara; the selector displays no translation-review notice.
- Selection updates subscribed components and the document `lang` without remounting routes or discarding form state.
- The `amautai-ui-language` local-storage key persists the preference in this browser and synchronizes other tabs. Restricted storage still permits an in-memory selection. Unknown or malformed saved values fall back to Spanish. No browser or location-based language inference is performed.
- UI locale is independent of the teacher group's free-text `context.language`. No account preference or server schema was added.

## Translation boundaries

The catalogs cover interface labels and explanatory text for access, navigation, onboarding, learning-session editing, projects, notifications and settings. Message keys use the original Spanish interface text; preserve existing keys when revising wording. `useMessages` provides interpolation and locale-aware dates. Catalog resources are bundled, so translation loading adds no external request or HTTP client.

Curriculum labels and source-link titles are localized for display; the original Spanish catalog, IDs, source PDFs and references remain unchanged. Copyable summaries localize headings, predefined choices and missing-field labels while preserving teacher-authored text. Known API errors, client validation, loading and accessibility messages are translated at presentation time. Unknown errors use a localized generic message. Outgoing email/WhatsApp templates retain their existing language. Translation-review status is documented here rather than displayed in the selector, as requested by the user. Removing that notice does not establish linguistic or pedagogical validation. The selected locale is used for dates when supported; unsupported indigenous locales use numeric dates and 24-hour times to avoid Spanish month names and day periods.

Bilingual reviewers still need to verify vocabulary, varieties and curriculum-label translations before treating them as linguistically validated. Interface translation alone does not provide EIB adaptation, translated games or offline play.

## Verification

Run `pnpm run check`. Web tests cover supported-variety selection, invalid preferences, restricted storage, real i18next switching, fallback, Spanish singular/plural forms, static-message coverage, interpolation variables and limited Intl support. These checks verify software behavior, not linguistic accuracy.

Browser checks used the local application with a real existing session: Spanish/Chanka Quechua/Aymara switching, preference after reload, preservation of an unsaved session title and the compact menu at the current 550 px viewport. The temporary form was left without saving. The application was not deployed, and a physical phone was not tested.

The shadcn Select migration additionally checked 1280 px desktop and 375 px mobile layouts, keyboard selection, both themes, and synchronization between the header and settings controls. The mobile trigger retained its previous position and 150 × 32 px dimensions, with a 64 px header and no horizontal overflow. Typecheck, lint, all nine web tests and build passed; no deployment was performed.

## Other form selects

Appearance, project status, curriculum competence, geographical region, urban/rural setting, and the three notification channels also use the shared shadcn/Base UI Select. No `NativeSelect` imports or native `<select>` elements remain in application screens. The unused library primitive is retained.

The migration preserves controlled values, empty options, disabled channels, pending-state disabling, and clearing capacities when the competence changes. Translated labels update with the UI locale; localized curriculum labels wrap inside the popup. Existing form geometry was compared at 1280 px and 375 px: settings, session and project controls retain their dimensions and positions; notification controls remain full-width on mobile and approximately 208 px on desktop, within one pixel of the former native controls.

Browser checks covered theme selection, clearing optional context, competence/capacity dependencies, selecting project status, Escape within the project dialog, and unavailable notification channels. Temporary profile/session/project edits were not saved, and notification preferences were not changed. Typecheck, lint, all nine web tests and build passed. No deployment was performed.

## Interface translation audit

The audit added 120 messages covering API errors, validation, curricular labels, source titles, summary boilerplate and accessibility. The early HTML loading screen follows the saved locale before React loads. Forms use localized client validation instead of browser-native validation bubbles. User names, titles, descriptions and teacher inputs are preserved. AGENTS.md rule 12 requires localization of future UI additions in all three locales and verification without layout regressions.

The expanded web suite has 13 tests, including curriculum coverage, untranslated JSX detection, summary data preservation, early loading with restricted storage, and numeric date fallback. Run the full `pnpm run check` before delivery.
