# Lessons from past Claude Code sessions

A running record of mistakes made while working in this repo, written so a
future session doesn't repeat them. Each entry says what was done, what it
cost, and the rule that follows. Vague advice ("be careful") is useless here —
keep entries concrete.

---

## Session: `/conditions` heat & altitude calculator (PR #80)

### Verification

**Trusted a smoke test that was silently lying.**
The test matched substrings against `document.body.innerText`, but several
headings use Tailwind's `uppercase` class. `innerText` applies CSS
`text-transform`, so `"Realistic"` never matched `"REALISTIC HALF MARATHON
FINISH"`. Every assertion reported MISS while the page was rendering
perfectly. This nearly got misread as "the feature is broken."
→ **Rule:** when a DOM assertion fails, confirm the failure is real before
acting on it. Match case-insensitively, or assert against `textContent`
(which ignores `text-transform`) rather than `innerText`.

**Reached for `pkill -f "vite preview"` and killed the shell running it.**
The pattern matched the wrapper process too. Exit code 144, twice, plus a
spurious background-task failure notification.
→ **Rule:** don't `pkill -f` on a pattern that matches your own command line.
Use the background task ID, or `pkill -f` a pattern anchored to the binary.

**Put the first math-verification script in the scratchpad** with import paths
like `../../../../home/user/trainpace/vite-project/src/...`, then had to `sed`
it into the project anyway so the `@/` alias and `node_modules` would resolve.
→ **Rule:** scripts that import project code belong in the project (e.g.
`vite-project/scripts/_scratch.ts`, run with `vite-node`, deleted afterward).
Only put provider-agnostic scratch work in the scratchpad dir.

**Re-derived a browser-launch recipe that was already written down.** Burned two
failed runs rediscovering the `executablePath` workaround for the pinned-version
mismatch — which `.claude/skills/verify-in-browser/SKILL.md` already documents,
along with two more traps this session never hit (the forced-loopback proxy
setting, and routing Google Fonts through `curl`). The half-remembered version
recorded here was also *worse*: a version-pinned
`/opt/pw-browsers/chromium-1194/chrome-linux/chrome` that breaks on the next
browser bump, where the skill uses the stable `/opt/pw-browsers/chromium`.
→ **Rule:** check `.claude/skills/` before solving an environment or workflow
problem from scratch. For anything browser-driven, start from
`verify-in-browser` — do not reinvent the launch recipe.
→ **Note:** that skill postdated this branch's base commit, so it was absent
from the working tree. Worth a `git log origin/main -- .claude/` when a branch
has been open a while.

### Code quality

**Wrote a nonsense artifact into a file and shipped it to disk:**
`{Math.round(points.length > 0 ? 0 : 0) === 0 && "your"}` inside JSX copy — a
half-finished thought that would have rendered a stray conditional word. Caught
on self-review a moment later, but it should never have been written.
→ **Rule:** when drafting long files in one pass, don't leave placeholder
expressions in. If a value isn't resolved yet, write the literal text.

**Added `// eslint-disable-next-line react-hooks/exhaustive-deps` as a first
move**, when the actual fix — moving a helper function inside the `useMemo`
that used it — was two lines and strictly better.
→ **Rule:** a lint suppression is a last resort, never an opening move. Fix the
dependency, don't silence the rule.

**Exported a plain helper (`formatDewPoint`) from a component file**, tripping
`react-refresh/only-export-components`. The feature convention in CLAUDE.md
already calls for a per-feature `utils.ts`.
→ **Rule:** component files export components. Helpers go in the feature's
`utils.ts` from the start.

**Edited `features/vdot-calculator/index.ts` to add exports, then reverted it
entirely.** The barrel re-exports the `VdotCalculator` component, so importing
from it in a new lazy-loaded route risks pulling the whole component tree into
that chunk. The right call — deep-import the pure `vdot-math` module — was
knowable before touching the file.
→ **Rule:** think through the chunking implication before editing a barrel. For
pure-math or pure-util modules, deep-import; reserve barrel imports for
components. Don't touch unrelated files speculatively.

### Design & layout

**Designed left-aligned UI without checking global styles.** The Vite template's
`#root { text-align: center }` in `App.css` is still present and centers
everything by default. Only caught it from a screenshot, after the whole
feature was built.
→ **Rule:** grep `App.css` / `index.css` for global resets before writing page
layout. See the Gotchas entry in CLAUDE.md.

**Built two nested flex columns, which stacked wrong on mobile** — the
training-paces table landed between the input and the answer, burying the
headline result. Also only caught from a screenshot.
→ **Rule:** when choosing between nested columns and an ordered grid, reason
about the single-column stack order first. Nested columns concatenate
(`col1-all`, then `col2-all`); explicit `order-*` utilities control it.

### Process

**Opened with "I'll pick up where I left off"** before verifying there was any
prior work. The branch was at exact parity with `main` — there was nothing to
continue. Corrected later, but the first claim was asserted, not checked.
→ **Rule:** verify the premise of a continuation request before restating it as
fact. `git log`/`git diff` against the base branch takes one call.

### What worked, and is worth repeating

- **Verifying the math against known external values**, not just that it
  compiled — Magnus dew points (30°C/50% → 18.4°C) and published altitude
  VO₂max figures. A throwaway `vite-node` harness printing scenarios caught
  nothing broken but made the numbers defensible in review.
- **Driving the real page in a browser at two breakpoints.** Both layout bugs
  above were invisible to `tsc`, ESLint, and the production build.
- **Checking lint warning counts before and after** to prove the new code added
  zero, rather than eyeballing a 96-line warning list.

---

## Session: World Majors globe (`/majors`)

### Verification

**A stubbed Mapbox style is enough to test map code without a token.** The
sandbox has no `VITE_MAPBOX_TOKEN`, so the map appeared untestable. Fulfilling
`api.mapbox.com/styles/v1/**` with a minimal source-less style JSON (one
background layer) gets mapbox-gl all the way to `load`, so markers, sources,
layers, and `fitBounds` all run and can be asserted. Verified the camera landed
on Berlin (lng 13.4) at the zoom cap, and that reset cleared the route source.
→ **Rule:** don't skip browser verification of map/canvas features for want of
an API key. Stub the network at the style level and read state off the map
object; expose it in dev only (`if (import.meta.env.DEV) window.__globeMap = map`).

**Playwright matches `ctx.route` handlers in reverse registration order.** A
catch-all `/(events|api)\.mapbox\.com\//` registered last swallowed the
`mapbox-gl.js` request and returned 204, so `window.mapboxgl` was undefined and
the page showed "Cannot set properties of undefined (setting 'accessToken')".
Spent a run blaming the app for a bug in the harness. Fulfilled responses also
need `access-control-allow-origin` when the tag is `crossOrigin="anonymous"`.
→ **Rule:** register the catch-all route FIRST and specific ones after. When a
stubbed page fails, check the stub before the app.

**Measured marker geometry instead of trusting the classes.** `h-3.5 w-3.5`
was in the class list and the dots still measured 32.8×18.4px — `index.css`'s
global `button { padding: 0.6em 1.2em }` wins under `box-sizing: border-box`.
Nothing in the source hinted at it. The same sweep measured nearest-neighbour
distances between markers: Amsterdam and Rotterdam were **1.8px** apart at globe
zoom, which is why a click on Berlin selected Rotterdam.
→ **Rule:** for anything positioned or sized, print computed styles and
rectangles from the browser. "The class is there" is not evidence it applied.
→ **Rule:** hidden elements return a 0×0 rect at 0,0 — filter `display: none`
out of a proximity sweep or it reports a fake 0px cluster.

### Data

**Checked the source data before building on it.** `marathon-data.json`'s
`thumbnailPoints` are schematic: measured polyline lengths run 11.7 km
(Rotterdam) to 49.6 km (NYC) against a 42.195 km course. Two minutes of
haversine up front changed the design — GPX files are the geometry source and
are drop-in replaceable, displayed stats come from the registry rather than
being measured off the line, the camera stops at zoom 11.5, and the UI calls the
line a "simplified course outline".
→ **Rule:** before presenting stored data as fact, measure it against something
known. Then design so the weak part is labelled and replaceable.
