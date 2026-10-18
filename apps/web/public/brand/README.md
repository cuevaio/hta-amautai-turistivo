# Amautai brand assets

The mark forms one connected Andean range with softly rounded summits, feet and valley corners. The smaller sky-blue peak sits closer to the main summit and behind the continuous foreground ridge. The color seam follows the same slope as the main summit, so it never narrows or cuts across the foreground stroke. The blue icon tile has an 18-unit corner radius. The icon uses white and sky blue on royal blue. The horizontal logo contains only the Amautai name.

| Asset | Use |
| --- | --- |
| `amautai-logo.svg` | Primary horizontal logo with the blue icon tile |
| `amautai-logo-inverse.svg` | Horizontal logo with a white wordmark for dark backgrounds |
| `amautai-logo-plain.svg` | Horizontal logo with the transparent mountain symbol |
| `amautai-symbol.svg` | Standalone transparent blue and sky-blue mountain range |
| `amautai-icon.svg` | Blue tile for the app icon and favicon |

Palette: royal blue `#155DFC`, sky blue `#BEDBFF`, wordmark navy `#102650`, white `#FFFFFF`. Royal blue and sky blue preserve the original favicon colors.

All SVGs use vector paths; they contain no embedded raster images, external resources or font dependencies. Wordmark: Inter, weight 640, converted to outlines. See `Inter-LICENSE.txt` for the font license.

Use the icon at 16 px or larger. Keep clear space of at least one quarter of the symbol width. Preserve the aspect ratio. Use the inverse logo on dark backgrounds. Do not add shadows or gradients.

The frontend references `/favicon.svg`, which matches `amautai-icon.svg` and also appears in the existing login, sidebar and loading screens. Local asset changes require deployment before they appear on the public site.

The shared `BrandLogo` UI renders these exact SVG wordmarks in the login, sidebar and loading layouts, with light/dark variants and an icon-only presentation for collapsed sidebars. The browser favicon and initial boot screen use the same corrected icon.

The default avatar placeholder also uses the corrected icon; actual user profile pictures remain unchanged.
