# The Equality Fair

## Playable contract

A fourth room game for second-grade equality, missing addends and missing subtrahends. An articulated two-pan balance represents counts of identical unit objects, never kilograms. The left pan is the fixed reference and the right pan receives or loses the selected quantity. The heavier side drops; equality levels the beam. A matching symbolic equality stays visible. The child chooses one of three numbered packets, walks to collect it, and delivers to the right pan. Pickup/selection is reversible and unscored. Arrival with a selected packet evaluates once per visit. There is no separate confirmation button.

Example: `8 = 3 + ?`. Delivering five produces two orders of eight and an independent reward. Delivering four produces seven against eight, a specific missing-one correction, and one penalty. Remove tasks use an explicit minus sign and a removal destination; the chosen number is the amount removed, not the remainder.

## Assets first

Built-in image_gen creates a four-frame helper walk cycle, an empty woven basket, and three regional market backdrops. Approved Market Route fish/corn/banana sprites are reused with their existing provenance. Original generated PNGs and prompt text are retained; runtime uses lossless WebP. The animation gallery is `/games/fair/v1/preview.html`. Character frame rectangles are defined in an atlas without repainting generated pixels. The original basket gallery is retained as an early asset-production checkpoint. The current game replaces its baskets with a procedural Phaser Graphics/Container balance: rotating beam, upright suspended pans, countable products, and a level indicator. Quantity changes animate for 650 milliseconds; reduced motion updates the physical representation immediately. Scored outcomes keep the submitted quantities on the balance for 1.8 seconds before advancing or restoring the task. Feedback occupies the header so the balance stays visible.

## Assessment and scoring

Four skill histories cover matching, missing addition, missing subtraction and equality between expressions. Initial quantities stay within ten; subsequent bands stay within fifteen and twenty. Shared learning transitions retain +100 independent, +40 assisted, −20 per submitted error, +50 per five independent consecutive successes, three-error loss, explicit retry, and continued tasks without a fixed round cap. Practice adapts independently by skill; challenge uses identical sequences and shared ranks for ties. Movement speed and repeated taps do not earn points.

The teacher creates a room, adds uniquely named students, and starts from the table. Outcomes, support use and per-skill evidence are server-authoritative and atomically saved with optimistic versions. Practice scores are personal rather than comparative. Scores do not certify a whole curricular competency or establish measured learning gains. Language and cultural examples require teacher review.

## Verification

The root check passes architecture, lint, type checks, tests and production/dry-run builds. Tests verify heavier-side direction, exact equality, symmetric arm geometry, station gating and the server-authoritative scoring lifecycle. Local migration 0012 was applied during initial game integration; no remote migration, deployment or push was performed. Computer Use verified the initial room, participant, pickup, keyboard delivery, rewards, persistence after reload and one incorrect subtraction. Final balance-specific visual checks are recorded below as they complete.

### Balance redesign checkpoint

Computer Use confirmed the articulated scale in the real local participant flow: the right pan started lower at 10 units against 9, selecting/removing one earned the assisted +40 reward (180 → 220), and the result retained both pans at 9 before advancing. The feedback banner is above the apparatus, so the balancing animation remains visible. A quiet cream backdrop improves separation from market scenery; outer quantity badges avoid overlap with the delivering character. Spanish, Chanka Quechua and Peruvian Aymara catalog/interpolation checks pass. The final narrow-viewport visual pass was interrupted by repeated browser-control timeouts and is not claimed as complete. Temporary viewport reset was requested through the browser capability. No physical-device certification is claimed.

The final root check reports 103 worker tests, 33 web tests, four UI tests and 11 architecture-fixture tests passing, as well as lint, type checks and production/dry-run builds. No score policy, ownership rule or ranking behavior changed in the balance redesign.
