---
name: verify-in-browser
description: Drive TrainPace in a real browser to verify a visual change — fonts, layout, animations, tooltips, anything you cannot confirm by reading CSS. Use when a change is visual, when a claim needs a screenshot or a measurement to back it, or when a bug report is vague ("the font is bad", "it looks off") and you need to find out what is actually rendering. Covers the sandbox-specific Playwright setup and the measurement traps that produce confident wrong answers.
---

# Verifying visual changes in a browser

There are no unit tests here. For anything visual, the browser *is* the test. Reading the CSS is not verification — several defects in this codebase were invisible in source and obvious in a screenshot.

## Working launch recipe

Two things in this sandbox will each silently give you a wrong answer. Both are handled below; copy this.

```js
import { chromium } from "playwright";

// 1. The project pins a newer Playwright than the installed browsers.
//    Without executablePath you get "Executable doesn't exist at .../chromium_headless_shell-1208".
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });

const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });

// Fonts are self-hosted (src/fonts.css), so they load from localhost with no
// proxy workaround. Chromium still cannot reach most third-party hosts through
// the agent proxy (ERR_CERT_AUTHORITY_INVALID); if a check needs one, fetch it
// with Node's curl and route.fulfill() it.

const page = await ctx.newPage();
await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
```

Run it from the scratchpad with the project's modules reachable:

```bash
ln -sfn /home/user/trainpace/vite-project/node_modules node_modules
# 2. Playwright forces --proxy-bypass-list=<-loopback>, so localhost:5173 gets
#    routed through the agent proxy, which only accepts CONNECT. The page then
#    "loads" as a proxy error page. This env var restores the loopback bypass.
PLAYWRIGHT_DISABLE_FORCED_CHROMIUM_PROXIED_LOOPBACK=1 node script.mjs
```

The dev server needs `vite-project/.env` to exist. Dummy Firebase values are fine for anything that is not auth or maps; `.env` is gitignored.

## Traps that produce confident wrong answers

**`document.fonts.check()` does not tell you a face is available.** It reports whether the string *can be rendered*, and fallback counts as yes. It returned `true` for `800 16px 'Space Grotesk'` (a weight that does not exist) and for `italic 400 16px 'DM Sans'` (a face that was not loaded) — and kept returning `true` on a page that had failed to load entirely. It is not a probe. Measure metrics instead:

```js
const m = (font, text = "Handgloves 2:06") => {
  const c = document.createElement("canvas").getContext("2d");
  c.font = font;
  return c.measureText(text).width;
};
// A family that is not applied measures identically to a bogus family.
const isFallback = Math.abs(m("400 40px 'DM Sans'") - m("400 40px 'NoSuchFontXYZ'")) < 0.01;
// An italic that is not real measures identically to its upright.
const italicIsFake = Math.abs(m("italic 400 40px 'DM Sans'") - m("400 40px 'DM Sans'")) < 0.01;
// tabular-nums only holds if the family has a tnum table.
const isTabular = Math.abs(widthOf("1111111111", { tnum: true }) - widthOf("0888888888", { tnum: true })) < 0.5;
```

**Print a content fingerprint next to every measurement.** Dump the element's text alongside its computed styles. This is what caught the proxy error page — the "body" being measured had text `"agent-proxy relay: this proxy only accepts…"` in Times New Roman. Without the text in the output, those computed styles look like a plausible finding about the app.

**Assert the webfonts actually loaded before judging typography.** `[...document.fonts]` empty means nothing loaded and every conclusion about type is about the fallback stack. Check it explicitly rather than assuming the route worked.

**Anchor request-blocking patterns to external hosts.** Blocking analytics with `page.route(/posthog|googletagmanager|firebase/, …)` looked harmless, but on the dev server it also matched Vite's local `/node_modules/.vite/deps/firebase_auth.js`. The app never rendered, and it looked like a real "page is blank in dev" bug. Production chunk names happened not to match, so the same pattern passed there. Use `/^https:\/\/[^/]*(posthog|googletagmanager|…)/`.

**To test against production headers, inject them; `vite preview` does not send `vercel.json` headers.** The Google Fonts outage was a CSP block that only existed on the deployed site. Read the CSP from `vite-project/vercel.json` and add it to document responses with `ctx.route()` + `route.fetch()` + `route.fulfill({ response, headers })`, then log any `Content Security Policy` console messages. `CSS.getPlatformFontsForNode` (CDP) tells you which font actually drew an element's glyphs.

**Check your selector matches the element you think it does, and that separate cases are separate elements.** `section .italic` was meant to grab a testimonial and grabbed the founder quote instead, because `#story` is a `<section>` — so two "different" before/after screenshots were the same element, and a claim of covering both cases rested on one. Log `await locator.count()` and the matched text, and if two shots should differ, diff them.

## Measure the defect, do not eyeball it

Screenshots show you *that* something is wrong; a sweep tells you *where* and *how much*, and gives you a pass condition afterwards. For the elevation tooltip, stepping the cursor across the profile and recording the tooltip box against the stage on all four edges turned up a second clipped edge that was never visible in a static screenshot, and confirmed vertical placement needed no change at all:

```js
for (let i = 0; i <= STEPS; i++) {
  await page.mouse.move(box.x + (box.width * i) / STEPS, box.y + box.height / 2);
  const m = await page.evaluate(() => {
    const t = document.querySelector(".el-tip").getBoundingClientRect();
    const s = document.querySelector(".stage").getBoundingClientRect();
    return { left: s.left - t.left, right: t.right - s.right, top: s.top - t.top, bottom: t.bottom - s.bottom };
  });
  // >0 on any edge means clipped
}
```

Re-run the same sweep after the fix and report the numbers. Test at more than one viewport — 1440 and 900 exercised different clamp behaviour.

## Before claiming it works

- `npm run build` and `npm run lint` from `vite-project/` (lint has ~96 pre-existing warnings; the bar is 0 **errors** and nothing new in the files you touched).
- Confirm prerendered output where relevant — `<head>` changes need to survive into `dist/**/index.html`, all ~245 of them, not just `dist/index.html`.
- Only claim what you measured. If a screenshot did not capture a case, say so rather than letting it stand in.

## Cleanup

Kill the dev server by task ID rather than `pkill -f vite` — that pattern matches the shell running it and returns exit 143/144 while looking like a failure.
