# Public web design review

Scope: local landing and login presentation, October 17, 2026. Applied [anti-slop](https://github.com/miqdadbadjuber/anti-slop) in `during` mode at Diego's request, alongside the Amautai frontend and shadcn skills. No permanent skill installation or AGENTS.md change. No deployment, commit or push.

## Direction and reasons

Reading this as a public learning website for primary-school teachers, using Amautai's existing navy, blue, Inter typography and approved mathematical landscape. ENERGY 2 / RHYTHM 3 / MOTION 1.

- Color: retain the owner's navy foreground, grey secondary text and blue action accent; preserve dark theme tokens.
- Typography: preserve Inter for continuity with forms and readable multilingual teaching content.
- Layout: replace the generic numbered process with one explicitly labelled planning example; distinguish context from the teacher's planning decisions.
- Spacing: reduce mobile section spacing and give narrow headers two deliberate rows; retain a distinct tablet composition.
- Surfaces: use one bounded lesson example, with separators between actual planning fields; remove decorative badges and feature icons.
- Illustration: reuse the approved learning landscape; its water scene connects with the clearly labelled water lesson example. No new visual asset.
- Motion: retain hover/focus feedback and omit continuous decoration.

## Delivery gate

These checks cover changed presentation, not a new audit of every application feature.

### Hard gate: PASS

- R-02 PASS: revised UI copy contains no em dash.
- R-03 PASS: all three locales have `scrollWidth <= clientWidth` at 320, 375, 768 and 1280 px; changed primary controls have 44 px touch targets.
- R-17 PASS: no invented usage or learning statistics; grade 2 reflects the implemented scope.
- R-18 PASS: no testimonials or customer identities added.
- R-23 PASS: reused existing approved logo and illustration; generated no asset.
- R-24 PASS: navigation links resolve to existing sections and routes.
- R-25 PASS: measured WCAG contrast with Color.js: navy/white 14.84, secondary/white 4.6145, light CTA 6.26, dark secondary 8.07, dark CTA 8.11. Removed the tinted section background that reduced grey text contrast below 4.5.
- R-26 PASS: changed navigation, CTAs, theme and language controls have working destinations or handlers.
- R-27 PASS: landing is static; existing authentication loading, validation and error handling remain intact. Empty login submission displayed field errors.
- R-28 PASS: no generic FAQ added.
- R-32 PASS: keyboard language selection worked; skip link received visible focus and Enter changed the hash to `#contenido`; email modal closed with Escape.
- R-33 PASS: source edits used direct patches, without a source-rewriting script.
- R-34 PASS: light and dark layouts checked; theme tokens preserved.
- R-35 PASS: full project gate and final web checks passed; browser interaction evidence listed below.
- R-36 PASS: no unsupported security, performance or learning-result claim added.
- R-37 PASS: direction derives from the owner's existing brand, typography, illustration and theme instructions.
- R-38 PASS: lesson content is explicitly a planning example; future AI games are explicitly future work.

### Purpose gate: PASS

- R-01 PASS: existing blue identifies primary actions; no gradient or glow added.
- R-04 PASS: removed decorative feature glyphs; retained sun/moon as theme controls.
- R-06 PASS: existing typeface retained for product continuity and readable forms.
- R-07 PASS: no background pattern added.
- R-08 PASS: no decorative button arrows added.
- R-09 PASS: audience label is plain text; decorative capsule removed.
- R-10 PASS: no glassmorphism added.
- R-12 PASS: no floating surface shadows added.
- R-13 PASS: no glow added.
- R-14 PASS: no identical feature-card grid; one lesson surface organizes related content.
- R-19 PASS: motion remains limited to interaction feedback, matching MOTION 1.
- R-22 PASS: approved illustration depicts learning and mathematical objects; reused rather than generating generic stock art.

### Liveliness: PASS

- Dials PASS: ENERGY 2 / RHYTHM 3 / MOTION 1 declared before editing.
- Consistency PASS: prominent learning headline, divided lesson example and prose-led context section have distinct compositions.
- Focal point PASS: headline, lesson question and context statement lead their respective sections.
- Whitespace PASS: mobile spacing is smaller; field separators group related information.
- Accent PASS: blue is reserved for primary actions rather than decorating every section.
- Identity PASS: approved mathematical landscape and teaching-session vocabulary tie the page to Amautai.
- Design read PASS: recorded above and announced before implementation.

### Craftsmanship and quality locks: PASS

- C-1 PASS: major decisions have written reasons above.
- C-2 PASS: changed controls have working behavior, recorded below.
- C-3 PASS: sections explain the actual audience, planning example and current/future product boundary.
- C-4 PASS: multilingual reflow, themes, focus and modal validation checked.
- C-5 PASS: no fabricated proof or performance claim.
- R-05 PASS: removed the stock three-number process; sections follow actual lesson-planning content.
- R-11 PASS: smaller illustration and lesson radii follow the existing radius scale.
- R-15 PASS: actions name preparing a session, viewing an example or creating a teacher account.
- R-16 PASS: no marketing buzzwords added.
- R-20 PASS: existing mathematical landscape and context-led lesson provide product identity.
- R-21 PASS: working light/dark choice retained.
- R-29 PASS: existing navy/neutral surfaces and blue accent retained.
- R-30 PASS: no imitation of another product introduced.
- R-31 PASS: color, layout, type, spacing, surfaces, illustration and motion reasons recorded above.

## Browser evidence

- Example navigation and hero example link: opened `#una-sesion` and showed the lesson surface.
- Our approach: opened `#nuestro-enfoque`.
- Prepare my first session: opened `/signup`.
- Create my teacher account: opened `/signup`.
- Header and footer login: opened `/login`.
- Header/footer brand and login brand: returned to `/`.
- Login/signup footer links: changed between existing authentication routes.
- Email access: opened the modal; empty submission displayed field validation; Escape closed it.
- Language selector: Spanish, Chanka Quechua and Peruvian Aymara changed visible text; Home/Enter selected Spanish by keyboard.
- Theme: switched light/dark on the landing and login.
- Reflow: landing checked at 320, 375, 768 and 1280 px in all three locales; login checked at 320/375 px and desktop.
- Keyboard: skip link had visible focus and navigated to `#contenido`.

The first live edit produced a transient Vite reload error while the source file was replaced. Final verification used a fresh page load. Existing OAuth/security behavior was not changed. Google own-brand activation and legal pages remain separate pending work. Indigenous-language translations remain drafts requiring human review; this visual check does not establish linguistic or pedagogical validity.
