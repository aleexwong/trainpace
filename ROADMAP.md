# TrainPace — Roadmap, Bug Reports & UX Problems

_Prepared 2026-05-28. Based on a read-through audit of the `main` codebase. Line numbers reference files at the time of writing._

This document has three parts:
1. **Bug reports** — concrete defects, with file/line, repro, and suggested fix. Prioritized P0–P2.
2. **UX problems** — friction and rough edges that aren't strictly bugs.
3. **Feature roadmap** — proposed next features, grouped Now / Next / Later.

Each item is tagged with the feature area so it can be triaged independently.

---

## 1. Bug reports

### P1 — Correctness, should fix soon

#### B1. Fuel planner underfeeds light runners & duplicates fueling logic — ✅ RESOLVED
- **Area:** Fuel Planner
- **Was:** `vite-project/src/pages/FuelPlannerV2.tsx:220-223` — a second, divergent copy of the
  weight-based carb calculation that overrode the race baseline even when lower.
- **Resolution:** That page was dead code (nothing imported it; the live component is
  `src/features/fuel/components/FuelPlannerV2.tsx`) and has been deleted. The single
  source of truth is now `src/features/fuel/hooks/useFuelCalculation.ts`, which uses
  `Math.max(weightBased, raceBaseline)` and caps at `MAX_CARBS_PER_HOUR[raceType]`.
  There is no longer a duplicate calculation to diverge.

#### B2. Gemini fetch has no timeout — UI can hang — ✅ RESOLVED
- **Area:** Fuel Planner / AI
- **Resolution:** `services/gemini.ts` now wraps the request in an `AbortController`
  with a 20s timeout and clears it on completion.

### P2 — Minor / edge cases

#### B3. GPX downsampling can drop the route's final point — ✅ RESOLVED
- **Area:** Elevation
- **Resolution:** `lib/gpxMetaData.ts` force-sets both endpoints after the slice, so
  the first and last points always survive downsampling.

#### B4. Live VDOT badge silently disappears for elite & beginner runners — ✅ RESOLVED
- **Area:** Pace Calculator
- **Resolution:** the guard in `PaceCalculatorV2.tsx` was widened to `vdot < 1 || vdot > 120`,
  matching the VDOT tool's range.

#### B5. Google sign-in failures give no user feedback — ✅ RESOLVED
- **Area:** Auth
- **Resolution:** `LoginButton.tsx` shows a toast on failure and special-cases
  `auth/popup-closed-by-user`, `auth/cancelled-popup-request` and `auth/popup-blocked`.
  The error also reaches PostHog via `reportError`.

#### B6. Pace validation never checks the hours field — ✅ RESOLVED
- **Area:** Pace Calculator
- **Resolution:** `validatePaceInputs` now rejects `h > 24` with
  "Race time must be under 24 hours". Covered by
  `features/pace-calculator/__tests__/utils.test.ts`.

### Things checked that are NOT bugs (so they don't get re-reported)
- `convertPace` (`utils.ts:44-46`) — the inline comments ("km to mile") are **backwards**, but the math is correct. Fix the comment, not the code.
- `extractGPXMetadata` elevation **gain** (`gpxMetaData.ts:71-73`) is correct — gain should only accumulate on ascent. The real gap is that **loss is never computed at all** (see F-? below — that's a feature, not a bug).
- Firestore dashboard queries (`useRoutes`/`useFuelPlans`/`usePacePlans`) correctly scope by `userId` and verify ownership before delete. AuthGuard has a proper loading state (no flash of unauthenticated content). Listeners use one-shot `getDocs`, no subscription leaks.
- Gemini API key is **not** exposed to the browser — calls go through a backend proxy.
- GPX upload validation (commit `239bd24`) correctly blocks `<script>/<object>/<embed>/<iframe>` while allowing valid GPX 1.1 elements.

---

## 2. UX problems

| # | Area | Problem | Suggested improvement |
|---|------|---------|----------------------|
| U1 | Elevation | No loading state during GPX analysis — user uploads and sees nothing until results/error appear (`features/elevation/hooks/useFileUpload.ts` sets `loading` but no spinner consumes it). | Show an "Analyzing route…" skeleton/spinner driven by the existing `loading` flag. |
| U2 | Dashboard | Plan/route sections have empty + loading states but **no error state** (`FuelPlansSection`, `PacePlansSection`). A Firestore failure shows nothing. | Thread an `error` prop through and render a message + retry. |
| U3 | Fuel / AI | No visible progress beyond the button label during AI refinement; pair with B2 (timeout). | Add a progress message or skeleton in the AI card. |
| U4 | Elevation | Single-point GPX passes the `pointCount === 0` guard but yields all-zero metrics with no guidance (`gpxMetaData.ts:30`). | Reject `< 2` points with a clear "this file has no usable track" message. |
| U5 | Poster | Missing/invalid Mapbox token fails silently — map tiles just don't load and the exported poster has no map (`features/poster/hooks/useMapbox.ts:40-67`). | Block export + show an explicit "map unavailable" state when the token is missing. |
| U6 | Accessibility | Time inputs in `RaceDetailsForm` lack `aria-label`s (the VDOT `TimeInput` has them — inconsistent). Several icon-only buttons use `title` but not `aria-label`. | Accessibility pass across calculator/fuel inputs and icon buttons. |
| U7 | Pace Calculator | Calculate button is never disabled when distance/time are empty — user clicks, gets a toast, but no inline "this field is required" feedback. | Disable the button on invalid form + show inline field errors. |
| U8 | Routing | `/elevation-finder` and legacy `/elevationfinder` both render the same page; the Footer links to the legacy one while the nav uses the hyphenated one. Potential duplicate-content SEO signal + inconsistent links. | Pick the canonical path, 301 the other, make all internal links match. |

---

## 3. Feature roadmap

### Now (high value, builds on existing code)
- **Race-day pacing plan / split table** — the pace calculator already computes a base pace; extend it to per-km/per-mile splits with even / negative-split options and a downloadable/printable race-day card. Natural next step from the April 2026 redesign.
- **Elevation loss + net elevation** — `gpxMetaData.ts` computes gain only. Add loss and net, surface both in the elevation analysis and on poster/preview pages. Small change, frequently expected by runners.
- **Unit tests for core math** — `vdot-math.ts`, pace `utils.ts`, and the fuel calculation currently have **no** unit tests (only `src/utils/difficulty` is covered, plus Playwright E2E). These are pure functions and would catch regressions like B1/B4/B6 cheaply. High ROI.
- **Save & share AI fuel plans** — fuel plans persist to the dashboard, but AI refinements aren't saved/shareable. Persist the refined advice with the plan and add a share link.

### Next
- **Strava / Garmin import** — let users import recent activities/PRs to auto-fill the calculators (race time, GPX route) instead of manual entry. Biggest single UX unlock for a running app; aligns with existing GPX + Firebase infrastructure.
- **VDOT-driven training plan generator** — the VDOT tool already derives zones and predictions; generate a weekly workout plan (the `SampleWorkouts` component is a seed) and save it to the dashboard.
- **Dashboard error/empty-state polish + offline** — combine U2 with PWA offline support so the calculators work without a connection (the app is already a Workbox PWA).
- **Goal tracking** — let users set a goal race (date + target time) and show countdown, required paces, and progress on the dashboard/landing "Next Long Run" card that already exists.

### Later
- **Course-aware pacing** — combine elevation analysis + pace calculator to adjust target splits for a specific GPX route's hills (the terrain-adjustment helpers in `utils.ts` are a starting point).
- **Heat/weather-adjusted race-day paces** — `calculateWeatherAdjustment` exists for easy pace; extend to live forecast for the race date/location.
- **Poster generator templates & non-premium teaser** — more layouts, social-size exports, and a watermarked free preview to drive conversion.
- **Internationalization / metric-first defaults by locale** — unit handling is solid; persist unit preference per user and default by locale.

---

## Suggested triage order
1. B1 (fuel correctness) + B2 (AI timeout) — user-facing correctness/reliability.
2. U1, U2, U3 (loading/error states) — cheap, high perceived-quality wins.
3. Unit tests for core math — locks in the above and prevents regressions.
4. B3–B6, U4–U8 cleanups.
5. "Now" features, then "Next".
