# Primary mathematics: curriculum and game-design reference

Scope: Peruvian primary school, grades 1-6. This is a source-backed product reference for Amautai, not an official Minedu lesson plan or proof of curricular compliance. The original catalog and source terminology remain in Spanish; interface labels and summary headings are localized for the selected UI language. These translations are not official Minedu translations. Product proposals below are explicitly distinguished from source requirements.

Local implementation checkpoint: the first teacher onboarding/session-draft slice enables only second-grade primary Mathematics (cycle III). Other grades are visible but disabled. It uses the four CNEB competencies and their capacities, optional teacher-provided performance text and editable session timing; it does not generate a game or claim official per-grade performance alignment. The broader primary scope below remains the roadmap. See [implementation and API](TEACHER_ONBOARDING.md).

## Sources and how to locate evidence

Downloaded originals and SHA-256 hashes are recorded in [sources.json](references/sources.json). Page references below use the PDF page number, counting the cover as page 1; printed page numbers are supplied for CNEB.

| Reference | Local original | Relevant pages | Status |
| --- | --- | --- | --- |
| CNEB | [National curriculum](references/national-basic-education-curriculum.pdf) | PDF 31-40, 135-149, 161, 167, 173-175, 180-185, 189-191 | National curriculum framework |
| PNEIB 2040 measure | [Proposed measure](references/eib-consultation-proposed-measure.pdf) | PDF 3-9, 13 | Proposal submitted to consultation |
| PNEIB consultation | [Consultation plan](references/eib-consultation-plan.pdf) | PDF 8, 10 | Describes consultation; does not establish final approval |

The supplied EIB documents concern a proposed national POLICY to 2040 and its consultation, rather than an already approved national education plan. Verify any subsequent approval independently before making a legal or current-policy claim.

## Curriculum concepts the generator must preserve

CNEB III, PDF 31-40 (printed 29-38), distinguishes the following:

| Concept | Meaning for primary mathematics | Proposed Amautai use |
| --- | --- | --- |
| Competencia | Combining capabilities to address a meaningful situation | Select the official mathematical competence, not only an operation |
| Capacidad | Knowledge, skills and attitudes mobilized together | Specify which mathematical actions the game elicits |
| Estándar de aprendizaje | Expected progression and end-of-cycle reference | Keep challenge complexity appropriate to the cycle |
| Desempeño | Observable student action; grade-level detail belongs to curricular programmes | Store a verified source reference; do not fabricate an official descriptor |
| Situación significativa | A relevant, achievable challenge connected to prior knowledge and context | Make the mathematics necessary to solve the mission |
| Evidencia y criterios | Observable work interpreted against the learning goal | Record decisions, representations and explanations, not just score or speed |

CNEB VI, PDF 173-175 (printed 171-173), and VII, PDF 181 (printed 179), ground meaningful situations, prior knowledge, learning through activity, constructive use of errors, scaffolding and cooperation. A character or regional background alone does not make an activity meaningful.

## Planning hierarchy: unit, session and game

CNEB PDF 167 (printed 165) explicitly places primary units and sessions within flexible time organization. It does not prescribe a complete unit/session authoring form in this passage. The structure below is a product model derived from these principles, not a verbatim official template:

Annual planning -> learning unit -> learning session -> game activity -> evidence and feedback.

- Unidad de aprendizaje: connects a meaningful situation, learning purposes, a sequence of sessions and anticipated evidence.
- Sesión de aprendizaje: identifies the purpose, learner group, planned activities, resources and assessment criteria for a specific teaching encounter.
- Situación significativa: specifies the local situation, an actual challenge, relevant knowledge and the intended mathematical decisions.
- Game: complements the session and can be its central activity when appropriate. The teacher retains introduction, mediation, reflection and evaluation; a game score does not certify a whole competence.

Suggested teacher inputs: unit/session text or file; grade and cycle; competence and capabilities; purpose; source-verified descriptor where available; prior knowledge; meaningful situation; evidence and criteria; duration; individual/group/homework mode; language; local context; device and connectivity. AI may extract these from planning and ask only for gaps. The teacher reviews the interpretation before publication.

The supplied CNEB is not a replacement for the Programa Curricular de Educación Primaria. Obtain and verify that programme before presenting per-grade performances as official. Do not invent normative definitions of session phases or per-grade requirements.

## Primary cycles and mathematical progression

CNEB PDF 161 (printed 159), with standard tables at PDF 137, 141, 145 and 149:

| Cycle | Grades | Expected standard level at cycle end |
| --- | --- | --- |
| III | 1-2 | 3 |
| IV | 3-4 | 4 |
| V | 5-6 | 5 |

These are end-of-cycle references, not identical requirements for both grades or fixed difficulty for every learner. The following is a concise paraphrase limited to primary levels; do not import secondary algebra or statistics from the same tables.

| Official competence | CNEB evidence | Primary progression | Example game mechanic, proposed |
| --- | --- | --- | --- |
| Resuelve problemas de cantidad | PDF 135-137, printed 133-135 | III: quantities, addition/subtraction, double/half and place value. IV: additive/multiplicative situations, basic fractions and measurement. V: natural numbers, fractions, decimals, usual percentages and measurement | Collect, compare, distribute or exchange objects; choose and explain the operation |
| Resuelve problemas de regularidad, equivalencia y cambio | PDF 138-141, printed 136-139 | III: repetition, additive patterns and simple equality. IV: combined patterns, equivalent expressions and changing quantities. V: patterns, inequalities and direct proportionality | Continue a pattern or balance quantities with visible reasoning |
| Resuelve problemas de gestión de datos e incertidumbre | PDF 143-145, printed 141-143 | III: simple counts, pictograms and possible/impossible events. IV: frequencies, charts, mode and likelihood. V: appropriate graphs, discrete variables and probability | Collect observations, build a chart and justify a decision |
| Resuelve problemas de forma, movimiento y localización | PDF 146-149, printed 144-147 | III: objects, shapes, position and routes. IV: geometric features, grids, symmetry and measurement. V: transformations, plans and suitable measurement units | Follow a route, compose shapes or measure objects |

Across these competences, preserve representation, communication, strategic procedures and justification. Do not turn every topic into an arithmetic quiz or equate fast clicking with mathematical understanding.

## Contextualization and EIB

CNEB PDF 189-191 (printed 187-189) supports adapting to geographical, economic, sociocultural and linguistic realities while preserving the national competence framework. PDF 167 (printed 165) explicitly distinguishes an Indigenous mother tongue and Spanish as a second language in bilingual primary education. The proposed PNEIB measure, PDF 6-9 and 13, highlights cultural and linguistic relevance and community knowledge; PDF 8 also identifies connectivity barriers.

Product implications, not automatic facts about a region:

- Store department/region, province and district as one administrative hierarchy; also ask or reuse community, daily activities, local setting, climate/season and available resources. A district can contain multiple environments; geography must not fix one biome, livelihood or language.
- Teacher games derive from session purpose and the everyday context of the class. Parent games derive from the topic, child interests and learning needs, with curriculum mapping handled by AI and reviewed where necessary.
- Candidate contexts include counting trout in an appropriate Andean setting, observing/counting monkeys in an appropriate Amazonian setting, or harvesting grapes/mangoes where locally relevant. These are editable examples, never coast/highlands/jungle lookup rules.
- Plan for Spanish, Quechua and Aimara, with selectable language variety and actual learner language proficiency. Do not assume that a second-grade child already understands Spanish or that all Quechua varieties are interchangeable.
- Localize instructions, hints, feedback and assets; plan optional reviewed audio for children who need oral support. Native-language educators should validate language and cultural content before claiming support. Do not silently fall back to Spanish.
- EIB is more than translation: incorporate community practices and knowledge, with adult confirmation. Pedagogy guides the activity; neuroscience/neuroeducation may inform future reviewed design, but these PDFs do not establish a neuroscientific efficacy claim for Amautai.

## Product context and future implementation

These are requested product directions, not claims of implementation:

- Two adult profiles: teacher and parent. The parent generation form exposes only Tema; grade, language, location and optional interests belong to saved learner/context settings, not curricular forms. Interests may also be expressed naturally inside Tema.
- Teachers can assign individual homework and lead classroom games with healthy competition, cooperation, participation and interaction. CNEB PDF 175 (printed 173) supports cooperation; competitive mechanics are a product choice, not a curricular mandate.
- Build a configurable catalogue of 10-15 reusable Phaser game templates as a roadmap target. AI adapts content, mathematical parameters, language and context; catalogue size and content must come from stored data, not hardcoded demo branches.
- Happy path, teacher: planning -> AI interpretation -> contextualized game -> teacher preview/review -> class or individual assignment -> gameplay -> evidence. Parent: Tema -> AI uses saved child context -> adult preview -> child plays.
- Real SaaS foundations: persist tenants, memberships, learners/classes, plans, template versions, generated games, assignments and attempts. Authorize every resource server-side. Derive tenant context from authenticated membership; do not accept a client-supplied tenant ID as authorization. A parent's access to a child's assignment requires explicit linkage/permission. Treat AI output as untrusted input and validate it before rendering/execution.
- Happy path means a focused complete journey with real generation and persistence, not fake success, fixed responses, missing authorization or placeholder analytics.
- Future offline mode: explore an installable application or downloadable game package with all required assets/localization included, local progress and later synchronization. Creation with a remote AI can require a connection; downloaded gameplay should not. Group play without internet needs its own device/local-network design.
- No verified national 27% internet figure was found. Do not publish it as a national statistic. The inspected INEI first-quarter 2026 bulletin reports 62.7% of households nationally and 25.0% rurally with internet access, with provisional figures. This measures households with access, not all people using internet. The product rationale remains intermittent/rural connectivity.

Connectivity source: https://www.inei.gob.pe/media/MenuRecursivo/boletines/boletin_tic_itrim2026.pdf (Graph 1.6, first quarter 2026; a cited snapshot, not a claim that no newer bulletin exists).

## Review checklist before a game is shared

Confirm the primary grade/cycle and learning purpose, source-backed curricular mapping, locally meaningful challenge, correct mathematical answers, reviewed language/variety, useful feedback and evidence, teacher/family permissions and a genuinely playable link. For offline claims, test without a network after download. Validate with Diego and Erik's parents as primary teachers and document their corrections; do not claim measured learning gains before evaluation.
