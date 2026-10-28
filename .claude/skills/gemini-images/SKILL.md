---
name: gemini-images
description: Generate photo/illustration assets for TrainPace pages with Gemini (the user's paid subscription) through Claude in Chrome, then compress them into public/ and wire them into the page. Use when asked to "make images", "generate photos/backgrounds/hero art", replace stock/Unsplash images, or add imagery to the landing page or any other page.
---

# Gemini images → TrainPace page

No API key needed: drive gemini.google.com in the user's own Chrome (already signed in, Pro). Output is full-res JPEG via Gemini's download button.

## Steps

1. **Pick the slots first.** Read the target page and list each slot with its job: aspect ratio, whether text sits on top (light or dark), and whether it's above the fold. On `Landing.tsx` the current slots are hero backdrop, founder-story photo, and CTA backdrop. Don't add images to the feature sections, which already have animated `feature-shots`.

2. **Open Gemini.** Load the Chrome tools in one ToolSearch call (see the `chrome-browser` skill), call `tabs_context_mcp`, then navigate to `https://gemini.google.com/app`. Use one chat for the whole set so the style stays consistent.

3. **Prompt each image** by clicking the prompt box, typing, pressing Return, then waiting about 20s and taking a screenshot. Prompt template:
   > Generate an image: `<subject>`, `<angle/lighting>`, `<palette — say "light/pale so dark text can sit on top" or "dark enough that white text reads clearly">`, `<empty area if text overlays it>`, `<16:9 landscape | 4:5 portrait>`, no text, no logos, no brand marks, photorealistic.

   Emerald green accents match the brand (`emerald-600`). Never depict a real person. If a slot implies one (for example "Alex running"), fix the alt text to describe the generated image.

4. **Download.** Hover the image, then click the download icon at its top-right corner (the rightmost of three). Files land in `~/Downloads/Gemini_Generated_Image_*.jpeg`. The `<img>` in the page is a `blob:` URL, so download through the button instead of fetching the image. Check the downloads with `ls -t ~/Downloads | head` and confirm with `sips -g pixelWidth -g pixelHeight` (16:9 comes back as 2752×1536, 4:5 as 1856×2304).

5. **Compress into `vite-project/public/images/<page>/`** with kebab-case names. `cwebp` isn't installed, so use `sips`:
   ```bash
   sips -Z 1920 -s format jpeg -s formatOptions 72 IN.jpeg --out vite-project/public/images/landing/NAME.jpg
   ```
   Use 1920 for full-bleed backgrounds and 1100 for card photos. Target under 400 KB.

6. **Wire in** using plain `<img>` (no import, served from `/`):
   - Decorative backdrop: `alt="" aria-hidden="true"`, `absolute inset-0 w-full h-full object-cover`, plus an overlay `div` for contrast (a gradient from `slate-50` for light sections, `bg-emerald-900/70` for dark). The parent needs `relative overflow-hidden` and the content wrapper needs `relative`.
   - Content photo: descriptive `alt`.
   - Everything below the fold gets `loading="lazy"`. Don't use `fetchPriority`, because React 18 warns on it.

7. **Verify.** Run `npx tsc -b` from `vite-project/`, then start `preview_start {name: "vite-project"}`. Vite binds **5173** even if the tool reports another port, so check `preview_logs`. The in-app browser may refuse localhost; if so, use the Chrome tab. Scroll each image into view (lazy ones report `naturalWidth 0` until then), screenshot it, and check that text over it is readable.

8. **Clean up.** Close the Chrome tab and stop the preview server. Leave the originals in `~/Downloads`.
