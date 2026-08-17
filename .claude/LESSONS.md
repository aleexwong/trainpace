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

## Session: Mapbox course maps + request budget (branch `claude/mapbox-integration-rate-limit`)

### Verification

**Blanked the app with a Playwright route pattern and spent three runs
reading the wreckage as a component bug.** Aborting analytics traffic with
`/posthog/` also matches the app's own
`/node_modules/.vite/deps/posthog-js.js`, so React never mounted. Every probe
dutifully reported `img=no sketch=no note=-` across fifteen pages — a
completely consistent, completely false picture of the feature.
→ **Rule:** anchor Playwright abort/route patterns to the host
(`/^https:\/\/([a-z-]+\.)*posthog\.com\//`), never a bare product name. A
dependency's filename contains the vendor's name too.
→ **Corollary:** "nothing rendered anywhere" is a harness failure until
proven otherwise. Print `#root.innerHTML.length` and the `h1` before
concluding anything about the component under test.

**`waitUntil: "networkidle"` never fires on any page that touches Firestore.**
With no reachable backend the SDK retries for ~10s and then keeps a channel
open, so `goto` times out at 30s. Use `domcontentloaded` plus an explicit
`waitForSelector` on the thing being measured.

**Wrote `.env` to the repo root instead of `vite-project/`** because the Bash
tool resets cwd between calls ("Shell cwd was reset to /home/user/trainpace").
Vite silently served an env with one variable in it, Firebase threw
`auth/invalid-api-key`, and the page rendered empty — which looked exactly
like the previous failure.
→ **Rule:** absolute paths for file writes in this repo; the shell cwd does not
persist. Confirm env changes landed with
`curl -s localhost:5173/src/lib/firebase.ts | head -1` rather than assuming.

### Code quality

**Projected Web Mercator with mixed units and it looked plausible.** Longitude
in *degrees* on x against Mercator latitude in *radians* on y — a factor of
57 — flattened every course into a horizontal line. Boston is genuinely a
near-straight east–west line, so the first screenshot looked *correct*. Only
NYC, which runs south-to-north through five boroughs, exposed it.
→ **Rule:** when checking a projection, pick the input whose expected shape is
least ambiguous. A route that "looks about right" proves nothing if its true
shape is close to the failure mode's.

**Overlaid a caption on a full-bleed SVG with `absolute inset-x-0 bottom-0`**
and it landed on the start marker. A sibling row in a flex column costs the
same and cannot collide.

### Process

**Nearly shipped a doc that git would have discarded.** `vite-project/.gitignore`
ignores `*.md`, so `docs/mapbox.md` needed `git add -f`. The already-referenced
`docs/agent-traffic.md` is *not* in the repo for exactly this reason.
→ **Rule:** after writing docs under `vite-project/`, check `git status` shows
them. `git check-ignore -v <path>` explains why when it doesn't.

### What worked, and is worth repeating

- **Checking the polyline encoder against Google's published reference vector**
  (`_p~iF~ps|U_ulLnnqC_mqNvxq`@`) rather than eyeballing a map. Instant,
  unambiguous pass/fail on the one piece of pure math in the change.
- **Pre-seeding `localStorage` with 12 timestamps to test the rate limiter**
  instead of trying to trigger it by hammering. Deterministic, and it also
  proved the recovery path by aging the stamps out.
- **Stubbing `window.mapboxgl` via `addInitScript`** to verify the interactive
  path — which options the map is constructed with, how many budget slots it
  spends — without a real token. Also caught that a failed GL load correctly
  charges nothing.

### Caught in review, not by me

Nine real findings on the Mapbox branch after it was already pushed. The three
worth internalising:

**Put a ref on one render branch and the other branch silently disables the
effect.** `MapboxRoutePreview` swapped its map container for the fallback
sketch when the budget cap hit, so `mapContainer.current` was null on every
later effect run — a map that hit the cap once stayed a sketch for the rest of
the session, with no retry affordance. It read as correct because the *first*
render always worked.
→ **Rule:** if an effect guards on `ref.current`, the ref'd element must be
unconditionally mounted. Overlay the fallback; do not substitute it.

**Treated a recoverable event as fatal and leaked the thing that caused it.**
`map.on("error", …)` fires for a single 404 tile. Marking the whole map failed
was wrong, and not calling `.remove()` left a live WebGL context on a hidden
node still fetching billable tiles — the exact cost the branch existed to stop.
→ **Rule:** before handling a library's error event, find out what routinely
fires it. And any teardown path for a resource that holds a socket, a context,
or a request loop must actually dispose of it.

**Asserted an invariant in docs without grepping for violations.** Wrote "all
Mapbox access goes through `src/lib/mapbox/`" into CLAUDE.md while
`utils/geocoding.ts` was still calling `api.mapbox.com` directly, on every
poster open.
→ **Rule:** an invariant added to CLAUDE.md is a claim about the whole
repo. `grep` for counter-examples before writing it down, and either fix them
or scope the claim.

Also: two static images per race-page view, because the page renders bundled
points and then swaps in the Firestore track — a changed fingerprint misses the
cache. Cost-saving work needs its cost *measured on the real render sequence*,
not on the first paint.
