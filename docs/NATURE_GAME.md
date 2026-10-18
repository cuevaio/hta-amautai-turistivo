# Regional multiplication game

The integrated game supersedes the original space-cargo concept. Teachers create a room for second-grade mathematics and select Coast, Highlands, or Jungle. Participant names are unique within a room after Unicode normalization, case folding, and whitespace cleanup.

## Play and scoring

- Coast: an animated pixel pelican collects groups of fish.
- Highlands: an animated pixel condor collects groups of food morsels.
- Jungle: an animated pixel cock-of-the-rock collects groups of fruits.
- Tap or drag in the sky to move the bird in two dimensions. Arrow keys and WASD remain available; directional buttons are in an expandable Controls and how to play section.
- A brief mission above the scene names both the number of groups and the food count in each. The mission panel separates group progress from the symbolic multiplication.
- Each saved capture gives specific correct/wrong feedback. An incorrect group explains the required size and the −15-point penalty; scenery and movement pause briefly for incorrect captures so that feedback can be read. Correct captures use a smaller nonblocking notice. Saving and explicit pause states are visible in the scene.
- A responsive semantic HUD shows score, level, and remaining opportunities. The mission panel contains the multiplication, collected group count, total food, and an accessible progress bar. Desktop places it beside the scene; mobile places the mission first and actions below the scene.
- Each correct group earns 20 points. A group of the wrong size costs 15 points and one opportunity. Negative scores are allowed.
- Completing the requested number of equal groups awards 100 points and a deterministic speed bonus of 0–20 points. The bonus is `max(0, 20 - floor(activeMilliseconds / (groupCount * 1000)))`. Server time determines the bonus; explicit pauses are excluded.
- Each completed goal automatically displays a victory message before the next round. Rounds continue without a fixed score ceiling. Challenges follow the same sequence for all participants. Every five rounds the group counts increase, cycling through three difficulty bands to keep arithmetic appropriate for second grade.
- Three mistakes end the attempt. The final score persists in the room and survives reloads until the teacher/student explicitly chooses Retry. Retry resets that participant's current attempt and ranking score to zero.
- Rankings sort by score descending. Equal scores share rank; speed can differentiate otherwise equal mathematical performance without arbitrary randomness.

Each capture is saved through the authenticated room API. The server calculates scores and rejects client-supplied scores. Optimistic versions prevent duplicate requests from awarding points twice. Room access is scoped to the teacher and tenant.

## Assets and validation

Food illustrations were generated with the built-in image generation tool. Original PNGs are preserved; atlas metadata selects their transparent image bounds without resampling the raster. Existing four-frame bird atlases provide animation. The Phaser runtime remains lazy-loaded behind the React game canvas.

Local D1 migrations 0007–0009 add rooms, scoring, and continuous progression. Apply them to the target database before deploying. The root check runs architecture, lint, types, tests, frontend build, and a Worker deployment dry run. No remote deployment is implied by local validation.

Interface strings are provided in Spanish, Chanka Quechua, and Peruvian Aymara. Educator review of the two Indigenous-language translations remains pending.
