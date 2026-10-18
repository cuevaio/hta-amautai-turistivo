# The Market Route

A second Phaser game for second-grade addition and subtraction. Open Game rooms, choose The Market Route, select a region and Practice or Classroom challenge, create the room, add named participants, and start an attempt. Existing multiplication rooms retain their original game and rules.

## Play

Region themes use generated four-frame pixel-art vehicles: a delivery tricycle on the coast, a pack llama in the highlands, and a peque-peque in the jungle. Foods are fish, corn, and bananas. These are editable product examples, not claims that every community shares one livelihood.

The student taps the warehouse or road to drive to that point. Arrow keys and WASD remain available; an expandable Controls and how to play section contains the held four-direction touchscreen controller, including multitouch diagonals. Taps on the HUD or inventory cannot move the vehicle. The route has bounded ground/water lanes, acceleration, braking, and directional sprite animation. Prepare every load at the warehouse: stop and press E or Space to collect one item for addition or leave one item for subtraction. Shift+E and a proximity-gated button transfer ten at once. Direct clicks on food or the inventory do not bypass travel. Drive the prepared load to the market; stopping there for 200 milliseconds submits the answer automatically, once per visit. Leave and return to submit again. Remaining at the market after feedback or a new task never submits another answer. Undo remains visible for correcting the current task; the redundant load-reset button has been removed. Every numbered crate represents ten objects. A visible food transfer connects the action with the inventory change. Unknown-quantity tasks score the transferred amount; known-change tasks score the remaining inventory.

Numbered warehouse/market labels, arrival markers, and route chevrons make the journey readable. Contextual instructions beneath the scene explain preparation, delivery, and leaving the market. Only the two proximity-gated quantity actions are primary controls. Score, opportunities, and streak appear in a responsive semantic HUD within the game shell. The canvas focuses on the route and countable inventory; a readable load total below it supports narrow screens. There is no answer-submission button. A correct delivery displays a brief victory overlay with the saved point increment; an incorrect delivery displays the deduction and a correction cue. Movement pauses during this feedback. The vehicle is never moved by an automatic delivery tween. Accessible status text mirrors the canvas feedback for screen readers.

Help shows the worked operation, a number line whose marker positions reflect quantities, and a strategy that crosses a ten when appropriate. Help use is saved before assisted points are available. Wrong answers preserve the current task, deduct points, reveal support, and consume one opportunity.

## Scores and saved attempts

- Correct without help on the first attempt: +100.
- Correct after help or an error: +40.
- Each wrong answer: −20 and one opportunity.
- Every five consecutive independent successes: +50. Help or errors break the independent-success streak.
- No speed bonus, random points, fixed round limit, or fixed score ceiling.
- Three wrong answers end the attempt. Scores may be negative.
- Scores, errors, current task, assistance, streak, evidence, and adaptive state survive reloads. Only explicit Retry after loss resets the attempt and its current ranking score.

All score changes are calculated by the server. Strict request schemas reject client scores, tenant/owner checks protect participants, and optimistic versions prevent repeated requests from awarding duplicate points. Cargo endpoints cannot mutate market-game scores.

## Adaptation and comparisons

Four independent skills are tracked: addition, subtraction, missing addends, and missing subtrahends. Skills alternate to revisit earlier concepts after intervening problems. Their practice ranges are 0–10, 0–20, and 0–100.

Practice promotes a skill when at least four of its latest five completed tasks were solved independently. Two assisted completions among its latest three lower its range. Windows reset on a range change. Time alone never lowers difficulty. Practice displays personal points and does not assign comparative ranking positions because students may receive different difficulties.

Classroom challenge uses the same deterministic operation sequence and range schedule for everyone, regardless of individual practice proficiency. Its room ranking sorts scores descending and shares positions for ties. There is no competition across rooms with different modes.

Teacher evidence separates independent successes, assisted completions, and errors by skill. These observations do not diagnose a learning condition or certify mastery of the whole curriculum competence. Progression thresholds and translations require teacher review; no learning-effectiveness evaluation has been performed.

## Implementation and status

Migration 0010 adds room game/mode fields and stored market state. It defaults existing rooms to Cargo/Challenge. Apply it in the target D1 database before deployment.

React owns the responsive HUD, accessible questions, contextual instructions, and controls. A lazy-loaded Phaser scene owns the animated delivery scene, region background, vehicle/vendor sprite loops, interactive inventory, food transfers, and quantity representations. Mathematical rules and persistence stay on the server. The desktop shell places the scene beside the mission/actions; mobile presents the mission before the scene. Participant and mode subtitles are omitted from the game header, while room records retain them. Reduced motion disables decorative sprite loops, flying food, and reward motion while preserving essential player-controlled movement, controls, and quantities. Input listeners and pointer capture are cleaned up; blur/visibility changes clear held inputs.

No LLM is connected to this game. Contextual prompts and hints use localized, deterministic templates. A future LLM may propose narrative variants behind a validated generator adapter; it must never determine mathematical correctness, scores, or run executable game code.

The full root `pnpm run check` passed, including architecture/lint, TypeScript, automated tests, and production builds. Regression coverage includes scoring, adaptation, repeated requests, saved loss/retry, isolation, and automatic arrival gating. Following the user's explicit request for Computer Use, live local play verified automatic addition and subtraction deliveries, saved score increments, incorrect-delivery penalties, loss after three errors, and persistence of the final score after reload with a clearly named test participant. Local migration application is not a remote deployment.

## Asset gallery

[Interactive asset gallery](../apps/web/public/games/market/v2/preview.html) loops the four transport/vendor sheets independently of gameplay. [Asset manifest](../apps/web/public/games/market/v2/manifest.json) records exact prompts, filenames, dimensions, and SHA-256 hashes. The built-in image generation tool created eight PNG assets; originals are preserved and atlas metadata supplies consistent four-frame bounds. [Art direction](MARKET_ART_DIRECTION.md) documents the interaction design.

## Pedagogical references

The design uses concrete quantity representations, explicit strategies, corrective feedback, and revisiting skills. It makes no claim to measure brain activity or produce clinically validated neurological changes.

- [WWC elementary mathematics intervention guide](https://ies.ed.gov/ncee/wwc/practiceguide/26).
- [Qin et al., arithmetic strategy development](https://www.nature.com/articles/nn.3788).
- [Computer-generated mathematics feedback experiment](https://pubmed.ncbi.nlm.nih.gov/27082020/).
