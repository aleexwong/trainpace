---
name: verify-in-browser
description: Drive TrainPace in a real browser to verify a visual change — fonts, layout, animations, tooltips, anything you cannot confirm by reading CSS. Use when a change is visual, when a claim needs a screenshot or a measurement to back it, or when a bug report is vague ("the font is bad", "it looks off") and you need to find out what is actually rendering. Covers the sandbox-specific Playwright setup and the measurement traps that produce confident wrong answers.
---

# Verifying visual changes in a browser

There are no unit tests here. For anything visual, the browser *is* the test. Reading the CSS is not verification — several defects in this codebase were invisible in source and obvious in a screenshot.

## Working launch recipe

Three things in this sandbox will each silently give you a wrong answer. All three are already handled below; copy this.

```js
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";

const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const curlBytes = (url) =>
  execFileSync("curl", ["-sS", "--compressed", "-A", UA, "-H", "Accept: */*", url],
    { maxBuffer: 64 * 1024 * 1024, encoding: "buffer" });

// 1. The project pins a newer Playwright than the installed browsers.
//    Without executablePath you get "Executable doesn't exist at .../chromium_headless_shell-1208".
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });

const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });

// 2. Chromium cannot reach fonts.googleapis.com through the agent proxy
//    (ERR_CONNECTION_RESET). Node's curl can. Without this the page renders
//    entirely in fallback fonts and you measure the sandbox, not the app.
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, async (route) => {
  const url = route.request().url();
  await route.fulfill({
    status: 200,
    contentType: url.includes("googleapis.com") ? "text/css; charset=utf-8" : "font/woff2",
    body: curlBytes(url),
  });
});

const page = await ctx.newPage();
await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
```

Run it from the scratchpad with the project's modules reachable:

```bash
ln -sfn /home/user/trainpace/vite-project/node_modules node_modules
# 3. Playwright forces --proxy-bypass-list=<-loopback>, so localhost:5173 gets
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
