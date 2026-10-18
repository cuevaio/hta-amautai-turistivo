# Landing social preview

Canonical URL: https://amautai.turistivo.com/

- Title: `Amautai · Matemáticas de primaria`.
- Description: `Matemáticas de primaria con sesiones contextualizadas y un juego de multiplicación para segundo grado.`
- Image: `apps/web/public/images/social/amautai-og-v1.jpg`, an opaque 1200 × 630 JPEG.
- Metadata: `apps/web/index.html` contains the Spanish SEO, Open Graph and large-image Twitter card defaults. Crawlers can read them without JavaScript.
- Browser localization: `LandingMetadata` reuses existing Spanish, Chanka Quechua and Peruvian Aymara title/description translations and localizes the image description. Social crawlers receive Spanish because the UI preference is stored locally, not in a shareable URL. The artwork contains only the shared brand name.
- `robots.txt` references the homepage sitemap and excludes API, callback and panel paths. This is crawl guidance, not access control.

## Image provenance

Generated with the built-in `image_gen` tool on October 18, 2026, using the landing hero, community-learning and teacher illustrations as character and style references. Source PNG: `/Users/erikjhonatan/.codex/generated_images/01a14efc-7e9f-7772-bd31-ad129885271b/exec-f375fca7-c1e6-46ed-9550-c9546eb78ed2.png`. The JPEG was resized and encoded at quality 88 with macOS `sips`.

### Final generation prompt

```text
Use case: ads-marketing.
Asset type: final Open Graph social sharing cover for Amautai. Wide horizontal 1200 x 630 pixels, aspect ratio 1.90476:1. Opaque background.
Primary request: Create a polished new brand cover based on the supplied landing illustration references. Reference 1 is the hero's Andean pixel-art adventure world; references 2 and 3 establish recognizable children and teacher, blue clothing and warm faces. These are style/character references, not images to collage.
Composition: A confident, spacious royal-blue/navy left area (about 45%) with the single very large white word "Amautai", exact spelling, friendly clean bold sans-serif. Beneath it only a small simple pixel-art cluster of a blue geometric cube and golden counting pieces. Right area (55%) becomes a rich bright Andean game world: terraced mountains, tiny cream village, turquoise river, warm light, blue geometric shapes; in the foreground the friendly primary teacher with round glasses, short dark wavy hair with a gray streak and sage cardigan supporting a curly dark-haired boy in a blue hoodie and a ponytail girl in blue overalls as they happily learn with one tablet. Children and teacher should be the focus, not tiny figures. Blend the blue brand area elegantly into the scenery using clean pixel steps, no hard divider. Faithful crisp retro pixel edges, warm expressive brown-skinned Peruvian characters, premium editorial composition. Keep all important faces and all brand text at least 65px from edges, legible at thumbnail scale.
Text (verbatim): "Amautai". No other text, no slogans, no letters on devices, no URL, no extra logos, no badges, no buttons or webpage chrome, no watermark. Use shared brand name only so artwork works unchanged with Spanish, Chanka Quechua and Peruvian Aymara metadata.
```

## Verification

Published on October 18, 2026 to `https://amautai.turistivo.com/` as Worker version `ae955b7c-386c-42be-a1fd-6cffd9236b7f`. Deployment used a clean worktree at commit `1a8c40e` plus only the social-preview changes, preserving concurrent edits in the primary checkout. No database migrations were required.

Typecheck, lint (including the architecture gate), frontend tests and production build passed in the isolated worktree. Browser checks covered the title, description, image alt and OG locale in all three interface languages; the landing has one title element and other page titles remain intact. A public request with the WhatsApp user agent confirmed unique Open Graph and Twitter tags in the initial HTML. The public JPEG returned HTTP 200 with `Content-Type: image/jpeg`; robots and sitemap also returned their expected contents. No third-party app preview or cache refresh was performed.

Check that the public homepage returns the tags in raw HTML and that the exact `og:image` URL returns `image/jpeg` with 1200 × 630 pixels. Check title, description, image alt and OG locale when switching each UI language. The image filename is versioned so future artwork can use a new URL.

Third-party services control their own preview layout and caching. Previously shared URLs may require a fresh scrape before their previews update.

References: [Open Graph protocol](https://ogp.me/), [Vite public assets](https://vite.dev/guide/assets.html#the-public-directory).
