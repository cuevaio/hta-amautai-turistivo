# Market Route: art and interaction direction

## Intended player experience

A second-grade learner should recognize the food, the transporter, and the market before reading a long instruction. One primary action changes the visible inventory at the warehouse: collect for addition, leave items for subtraction. A brief transfer animation connects each action to the quantity change. Driving to the market submits the result automatically; the server remains the authority for correctness and scoring.

## Asset list

Generated with the built-in image generation tool, true transparent PNG, polished 16-bit pixel-art palette and dark outlines:

- Four-frame cargo tricycle pedalling loop for the coast.
- Four-frame pack llama walking loop for the highlands.
- Four-frame peque-peque rocking loop for the jungle.
- Four-frame welcoming produce vendor and market stall.
- Single whole fish, single corn cob, and single banana inventory icons.
- Open wooden produce crate for a group of ten.

Each animated asset uses four equally sized cells in a 2×2 sheet. Atlas metadata selects a common local frame rectangle so the visible scale and baseline remain consistent. Raster originals are preserved. Numeric labels are rendered by the game, never generated into the artwork.

## Interaction

- A clearly marked source and destination flank the transporter's cargo.
- On addition, drive to the source station, stop, and press E/Space or the action button to collect an item.
- On subtraction, drive to the warehouse, stop, and press E/Space or the action button to leave an item before taking the remaining load to market.
- A separate accessible control transfers ten at once, represented by a numbered crate.
- Undo reverses the most recent transfer without scoring. Reset restores the current problem's starting inventory.
- For an unknown change, the answer is the quantity collected/left; for a known change, it is the remaining inventory. Cargo is represented inside the game rather than in a separate answer counter.
- Stopping at the market for 200 milliseconds evaluates the load once per visit. Leaving and returning enables another submission. Correct delivery triggers a victory overlay, reward burst, and saved point increment. Wrong delivery shows the deduction, a gentle corrective cue, and the existing hint. Score, opportunities, and streak stay inside the canvas. All transport movement is controlled by the player.
- Reduced motion preserves essential player movement and removes decorative looping sprites, transfer motion, and reward motion.

## Boundaries

Preserve the existing mathematical rules, modes, versioned persistence, scores, three-error limit, translations, and retry semantics. Assets and animation improve readability; they do not constitute evidence of learning gains. Do not automatically run gameplay tests when the user has reserved testing for themselves.
