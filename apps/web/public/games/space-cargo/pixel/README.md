# Animated pixel art pack

Current visual direction for Space Cargo. Generated using the built-in `image_gen` tool, replacing the earlier painted illustration direction at the user's request.

| Asset | Animation | Cycle duration |
| --- | --- | --- |
| `pelican-sheet.png` | Wing flap | 800 ms |
| `condor-sheet.png` | Wing flap | 1000 ms |
| `cock-of-the-rock-sheet.png` | Wing flap | 640 ms |
| `spaceship-sheet.png` | Engine ignition / exhaust | 480 ms |
| `energy-crystal-sheet.png` | Facet sparkle | 960 ms |
| `ice-comet-sheet.png` | Icy tail flicker | 560 ms |

Each sheet contains four distinct raster frames in a two-column, two-row layout. Read left to right, then top to bottom: frames 0, 1, 2, 3. Generated sheets have irregular gutters, so use the explicit `frames` rectangles in [manifest.json](manifest.json), not equal-width cell slicing. Each sheet also has a TexturePacker-style `*-atlas.json` with frame bounds, common source size and placement offsets. This metadata prevents clipping and preserves a common scale across each cycle. Frame padding is transparent. These are short generated animation cycles, not a comprehensive character animation library. Source PNGs were copied without pixel modifications; scripts inspected alpha bounds to write metadata only.

Backgrounds: `coast.png`, `highlands.png` and `cloud-forest.png`. Backgrounds remain static so the arithmetic can remain readable.

The [animated review board](../../../../../../docs/SPACE_CARGO_ASSETS.html) plays atlas frames in a small Canvas renderer, offers a Pause animations checkbox, and disables playback when the system requests reduced motion. It is an English-language design document, not the product's game interface. Sprite previews use `image-rendering: pixelated`, disable Canvas image smoothing and never interpolate between animation frames.

Use the manifest as the source for texture URLs, actual frame dimensions, animation names, frame order, durations, transparency status, file hashes and exact generation prompts. Load only the selected region's background and bird plus the three shared sheets. Preserve transparent margins and disable smoothing in the future Phaser renderer. Keep localized text and mathematical group representations separate from artwork.

The pack and review board do not implement the learning game, ranking or LLM connection. The [game design](../../../../../../docs/SPACE_CARGO_DESIGN.md) describes that remaining work.
