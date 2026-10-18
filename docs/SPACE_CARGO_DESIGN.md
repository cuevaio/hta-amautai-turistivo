# Space Cargo: Peru asset and gameplay specification

Status: asset-design phase. This document specifies the requested game; it does not claim that Phaser gameplay, generation, assignments, or ranking persistence are implemented. The existing lesson-draft flow remains unchanged in this phase. No Google Drive product document was used.

## Product decision

Keep the spaceship, falling energy crystals, exact loading, recoverable overload, and successful takeoff. Adapt the landscape and bird companion to the teacher's selected setting. The user confirmed equal groups for multiplication on October 18, 2026.

| Setting | Companion | Visual setting |
| --- | --- | --- |
| Coast | Peruvian pelican | Pacific water, coastal rocks and sand |
| Highlands | Andean condor | Andean slopes, terraces and distant peaks |
| Jungle | Andean cock-of-the-rock | Eastern Andean cloud forest, mist and vegetation |

The jungle scene intentionally represents cloud forest, the bird's setting, rather than claiming it represents every Amazonian environment. These are selectable fictional mission settings, not assumptions about a child's home, culture, language, or livelihood. All three share the same mathematical rules.

## Minimal teacher flow

Show only these curriculum/context fields:

| Field | MVP value or action |
| --- | --- |
| Curricular area | Mathematics, prefilled |
| Level and grade | Primary, second grade, prefilled |
| Competence | Solves quantity problems; multiplication practice, prefilled |
| Meaningful situation / setting | Select Coast, Highlands, or Jungle |

Do not require a title, planning document, performance statement, duration, free-text prompt, or additional teacher question. Reuse the interface language already selected in the application. Generate the mission title internally. Teacher creates, previews and shares a game. Student enters a display name when joining; it is not another curriculum field.

This is a focused multiplication-practice proposal, not a claim that the preserved CNEB establishes the full multiplication table as an official second-grade performance descriptor. See [curriculum reference](PRIMARY_MATH_CURRICULUM.md).

## Equal-group mechanic

Example: `3 × 4` means three groups of four energy units.

1. Display the task as three visibly empty group slots, each holding four units. Show the expression and target `12` using runtime text.
2. A collectible represents one group. Show its value and a countable dot arrangement; do not rely only on a numeral or color.
3. Accept three groups of four to complete the representation. Display the running decomposition `4 + 4 + 4 = 12`.
4. A wrong-size group remains visible as a group that can be removed. Reaching the same total with unrelated group sizes must not pass the multiplication challenge.
5. Excess cargo enters an overload state without subtracting score. An ice comet removes a selected group and reverses that group's exact energy contribution. For the example this may be `−4`; do not hardcode only `−5` and `−2` from the addition-only concept.
6. Launch only when group count, each group's size, and total all match. Provide a confirm/launch action so success is tied to the represented answer.
7. Summarize the equal groups after launch and advance to the next challenge.

Use five challenges per comparable assignment. Initially use small factors and visible groups; keep every product at most 100. Difficulty is a reviewed template setting and can progress using actual attempts. No mandatory response timer or penalty for missed falling objects. Pause, keyboard selection, a static collection alternative, and reduced-motion feedback belong in the playable implementation.

## Scoring and ranking

- Award 100 points per completed, mathematically valid challenge: five challenges yield 0–500 points.
- Correction, hints, and overload recovery do not deduct points. Record them separately as evidence useful to the teacher.
- Sort descending by points. Equal points share rank; avoid introducing speed as an unrequested penalty.
- Compare only the same assignment/configuration version and challenge count. Do not compare unrelated regional game sessions or difficulty levels.
- Keep an internal participant identifier separate from the display name. Identical names must not merge student records.
- Use the best completed attempt per participant for the assignment, preserving attempt history for the teacher.
- Persist attempts and calculate ranking on the server from validated task events. Never accept a client-supplied final score as authoritative.
- Keep ranking within the assigned classroom view. A score measures game performance, not mastery of the full curriculum competence.

## Asset direction and integration

Pixel art adventure art, friendly readable silhouettes, limited palettes, hard stepped edges and a consistent cream/teal spacecraft. This supersedes the initial cut-paper/gouache direction at the user's request. The landscapes reserve open central space for falling objects. Characters, spaceship, crystal and comet use transparency. Do not bake names, digits, arithmetic, language, error states, or HUD into images: Phaser draws localized text, countable units and arithmetic over the textures.

The current animated asset pack is in `apps/web/public/games/space-cargo/pixel/`. Each foreground asset has four raster animation frames in a two-by-two sheet: bird flapping, spaceship thruster ignition, crystal sparkle and comet tail flicker. The manifest and individual texture atlases record actual frame rectangles, placement offsets, frame order and playback durations. Use these rectangles instead of assuming regular cells. The review board plays atlas frames in a Canvas renderer with smoothing disabled and supports manual pause and system reduced motion. These animations demonstrate the assets, not implemented Phaser gameplay. Earlier static illustrated PNGs remain available as superseded source variants.

The project is React/Vite, so retain that stack. The supplied example's Next.js/Vercel wrapper is not a reason to replace the existing application. Keep Phaser in a lazy-loaded `game-runtime/` adapter with create/destroy cleanup and typed configuration/events. Load only the chosen region's background and companion plus shared objects. Use Phaser 3 for the user's requested prototype; the installed skill's default Phaser 4 advice does not override the explicit Phaser 3 request.

## How the LLM fits

The teacher supplies the fixed curriculum fields and one region. The server adds the supported template/version, selected locale, reviewed vocabulary, operand limits and prior aggregate evidence. A model proposes mission wording and a sequence of multiplication challenges as structured data. The teacher previews the result before sharing.

The LLM must not generate executable Phaser/JavaScript, pick arbitrary asset URLs, score students, decide authorization, or calculate trusted answers. Application code calculates products, checks equal-group solutions, determines score, and selects assets from an allowlist. Student names are not necessary model input.

Proposed provider-independent request:

```json
{
  "template": "space-cargo-multiplication",
  "templateVersion": 1,
  "area": "mathematics",
  "level": "primary",
  "grade": 2,
  "competence": "quantity",
  "operation": "multiplication",
  "region": "coast",
  "locale": "es-PE",
  "challengeCount": 5,
  "constraints": {
    "factorMin": 1,
    "factorMax": 5,
    "productMax": 100,
    "representation": "equal-groups"
  }
}
```

Proposed system instruction:

```text
Prepare short classroom game content for the supported space-cargo template.
Return JSON only, matching the supplied schema. Use the requested locale.
Preserve the selected curriculum objective and equal-groups representation.
Use only the supplied region, template and vocabulary. Do not infer the
learner's identity, culture or language from geography. Return exactly five
challenges with integer groupCount and unitsPerGroup within the provided
limits. Do not return code, asset URLs, student names, scores or claims of
learning improvement. Use short concrete instructions and supportive hints.
```

Proposed model output shape:

```json
{
  "title": "Misión de carga en la costa",
  "instruction": "Carga grupos iguales para ayudar al pelícano a despegar.",
  "challenges": [
    { "groupCount": 3, "unitsPerGroup": 4, "hint": "Forma tres grupos de cuatro." }
  ]
}
```

The single challenge above illustrates the shape; production validation requires all five. Derive the target as `groupCount * unitsPerGroup` in trusted code rather than requesting an answer from the model.

Validate unknown JSON against a strict shared Zod contract, exact challenge count, integer ranges, product limits, locale, copy length and supported template/version. Bound generation time and retries. Persist pending/ready/failed state and retain the teacher's region on failure; never label static fallback content as successfully AI-generated. Cache reviewed configurations where appropriate so gameplay requires no per-click LLM request.

For later personalization, send only aggregate evidence such as completed equal-group tasks, wrong-size groups and successful corrections. Propose the next factor range within the template limits; keep the teacher in control. Spanish, Chanka Quechua (`quy-PE`) and Peruvian Aymara (`ay-PE`) require complete UI/game messages and review by competent speakers before claiming validated translations.

Provider credentials belong in server secrets and a backend infrastructure adapter. No model is connected by this asset-only change; provider selection, credentials, server generation and persistence remain implementation work.

## Hackathon demonstration target

The [official event page](https://hacktheandes.com/) lists School Education as track 03. Follow the [preserved scoring rubric](HACKATHON_RUBRIC.md) and its source PDF for scoring details. Demonstrate one complete teacher-to-student journey, working regional adaptation, equal-group validation, recovery, and a real persisted classroom ranking. Asset previews alone are not a working live demo, external traction, or evidence of improved learning.

## Remaining implementation

1. Shared validated game configuration and event contracts.
2. Minimal teacher creator, preview and assignment persistence.
3. Lazy-loaded Phaser 3 runtime with equal-group validation and accessible controls.
4. Student join, attempt events, server scoring and assignment ranking.
5. Server LLM adapter and reviewed multilingual content.
6. End-to-end checks in all three locales, mobile/desktop layouts, real classroom feedback and deployment within separately authorized scope.
