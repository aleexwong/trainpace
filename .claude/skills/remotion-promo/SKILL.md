---
name: remotion-promo
description: Make a short (15–30s) Remotion promo video for TrainPace or any SaaS/web product — title card, 2–4 feature scenes (animated bars, line chart, counting stat), and a URL call-to-action, rendered to 1080p MP4. Use when asked for a promo, launch video, product teaser, social clip, or "a video of the app" and Remotion is the tool (or no video tool is specified and the project is React/TypeScript).
---

# Remotion promo video

A data-driven template: edit one `BRAND` object and one `SCENES` array, render. No per-scene React code for a new product unless the kit genuinely lacks a scene type.

## Steps

1. **Scaffold** a standalone package (never inside the app — Remotion's deps don't belong in the app bundle):
   ```bash
   mkdir -p <repo>/video/src
   cp .claude/skills/remotion-promo/template/{package.json,tsconfig.json,.gitignore} <repo>/video/
   cp .claude/skills/remotion-promo/template/{index.ts,Root.tsx,Promo.tsx} <repo>/video/src/
   cd <repo>/video && npm install
   ```
   TrainPace already has one at `video/` (`video/src/TrainPace.tsx`) — edit that instead of scaffolding a second.

2. **Pull the brand from the product, don't invent it.** Read the app's Tailwind config / CSS tokens for colours, `index.html` (or font imports) for families, and the landing page for tagline and CTA copy. Fill `BRAND`. Swap the `@remotion/google-fonts/*` imports to match the product's fonts.

3. **Write `SCENES`** — one per headline feature, 3–5 total, 20–30s overall. Kit types:

   | type    | shows                                   | good for                               |
   |---------|-----------------------------------------|----------------------------------------|
   | `title` | logo wordmark + tagline                 | always first                           |
   | `bars`  | labelled rows filling to `w` (0–1)      | tiers, comparisons, calculated outputs |
   | `chart` | line drawing across `points` (0–1) + optional counting stat | growth, trends, profiles |
   | `stat`  | one big number counting up              | the single most impressive metric      |
   | `cta`   | URL + one line                          | always last                            |

   Use **real numbers the product actually produces** (run the calculator, read the fixtures). Fake "10x faster" stats read as fake.

   Need something else (screenshot pan, phone mockup)? Add one variant to the `Scene` union and one `case` in `render()` — keep `useIn`/`Rise`/`Counter` for motion so it matches.

4. **Check stills before rendering the whole thing** — much faster, and it's how you catch overflow:
   ```bash
   npm run still -- --frame=45
   ```
   Pick a frame ~2/3 through each scene (start offsets = running sum of `frames`). Open the PNG and look. Long titles over ~32 chars at 80px wrap; shorten the copy rather than shrinking type.

5. **Render**: `npm run render` → `out/promo.mp4`. `npm run studio` for scrubbing.

## Gotchas

- **Everything must derive from `useCurrentFrame()`.** No `Date.now()`, `Math.random()`, CSS transitions or `setTimeout` — the renderer seeks frames out of order and those will flicker or freeze.
- **Numbers that animate need tabular figures** (`fontVariantNumeric: "tabular-nums"`) *and* a font that has a `tnum` table, or they jitter. Space Grotesk does; DM Sans does not.
- **Always keep a fallback stack** after the loaded font family; a bare family name falls back to serif if loading fails.
- Layout is tuned for 1920×1080. Square/vertical need their own padding/sizes (the chart width is fixed at 1640px) — add a composition in `Root.tsx` and use `useVideoConfig().width` to scale when asked, not before.
- `out/` and `node_modules/` are git-ignored; don't commit the MP4.
