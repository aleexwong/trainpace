# TrainPace v3 — Full Rewrite Plan

**Status:** proposal, ready to build
**Audience:** an engineer or coding agent who will build the whole app from an empty directory
**Source of truth for current behaviour:** this repository at `vite-project/`

---

## 0. How to use this document

This plan is written so that one agent can build the app in one pass, without
guessing. It has three kinds of content:

1. **Audit** (§1) — what is wrong with the current app. Every finding has an ID
   (`P-1`, `S-3`, …). Later sections refer back to those IDs so you can check
   that each problem is actually solved.
2. **Specification** (§2–§11) — the target architecture, file layout, module
   contracts, data model, and standards. Build exactly this.
3. **Build order** (§12–§14) — the phases to build in, with a checkpoint after
   each one, and a final acceptance checklist.

**Rules for the building agent:**

- Do not invent new product features. The feature set is fixed in §7. Anything
  not listed there is out of scope.
- Where this plan gives a function signature, a file path, or a schema, use it
  verbatim. Consistency matters more than personal preference.
- Port the *maths* from the old repo unchanged unless a finding says otherwise.
  The formulas in `plan-math.ts`, `vdot-math.ts`, `fuel-math.ts`, and
  `pace-calculator/utils.ts` are correct and tested in production. Copy them,
  then cover them with unit tests (§10.1).
- Port SEO page content and blog content as data, not as code. See §8.
- Every phase ends green: `npm run verify` must pass before moving on.

---

## 1. Audit of the current app

The current app is roughly **49,000 lines across 258 TypeScript files** in a
single Vite SPA. It works and it is not badly written — type safety is good
(only 4 uses of `any`), Firestore rules exist, security headers exist, and the
prerender/SEO system is genuinely sophisticated. The problems are mostly
structural: the app grew feature by feature, and the shared foundations
(data layer, design system, testing, bundling) never caught up.

### 1.1 Performance

| ID | Finding | Evidence | Impact |
|----|---------|----------|--------|
| **P-1** | Firebase (Auth + Firestore + Storage) is loaded eagerly in the main bundle | `src/main.tsx` wraps the app in `AuthProvider`, which imports `@/lib/firebase`, which calls `getAuth`, `getFirestore`, `getStorage` at module scope | ~250–350 KB gzip on the critical path of *every* page, including 80+ static SEO pages where no user is ever signed in |
| **P-2** | No manual chunking strategy | `vite.config.ts` `build` block only sets `minify` | Vendor code is split by Rollup's defaults; React, Firebase, Chart.js and Mapbox end up mixed into route chunks, so a change anywhere busts many caches |
| **P-3** | Chart.js is imported per-component with ad-hoc `register()` calls | `ElevationChart.tsx`, `UnifiedDifficultyView.tsx`, `CumulativeGainChart.tsx` each import and register separately | Chart.js + the React wrapper is ~70 KB gzip, pulled in for a single line chart and a single doughnut |
| **P-4** | Large JSON imported statically | `src/data/blog-posts.json` is 155 KB, `marathon-data.json` is 65 KB | The entire blog corpus ships to anyone who opens `/blog`, and is also pulled into the build graph via `page-docs.ts` |
| **P-5** | Unoptimised images | `public/android-chrome-512x512.png` is 482 KB, `landing-page-2025.png` is 307 KB; no WebP/AVIF anywhere | ~800 KB of avoidable image bytes; the landing hero is the LCP element |
| **P-6** | Fonts come from Google Fonts at runtime | `index.html` links `fonts.googleapis.com` | Two extra connections and a render-blocking stylesheet before any text paints |
| **P-7** | No request caching or deduplication | Every Firestore read is a bespoke `useState` + `useEffect` + `getDocs` hook (`useFuelPlans.ts`, `usePacePlans.ts`, `useRoutes.ts`, `useTrainingPlans.ts`) | The dashboard fires four uncoordinated queries on mount, refetches on every remount, and has no stale-while-revalidate, no retry, no cancellation |
| **P-8** | GPX parsing runs on the main thread | `src/lib/gpxMetaData.ts` `processGPXUpload` parses XML and runs Douglas–Peucker inline | A 10 MB GPX file freezes the tab for seconds |
| **P-9** | PWA is claimed but not configured | `vite-plugin-pwa` is in `devDependencies`, `vercel.json` sets `sw.js` headers, `CLAUDE.md` and the README describe a PWA — but `vite.config.ts` never registers `VitePWA` | Dead dependency, misleading docs, no offline support, and stale-service-worker headers for a worker that does not exist |
| **P-10** | No bundle size budget | CI runs Playwright only | Regressions are invisible until someone complains |
| **P-11** | Route chunks are large because barrels are imported | Several routes import from `@/features/x` barrels, which re-export component trees | Documented as a past mistake in `.claude/LESSONS.md`, still structurally possible everywhere |

### 1.2 User experience

| ID | Finding | Evidence |
|----|---------|----------|
| **U-1** | Loading states are bare text | `AuthGuard.tsx` renders `<div>Loading...</div>`; dashboard hooks expose a `loading` boolean that each card renders differently |
| **U-2** | No recoverable error UI | The only boundary is `PostHogErrorBoundary` in `main.tsx`, which reports but does not offer the user a way back. A lazy route chunk that fails to load (deploy during a session) blanks the page |
| **U-3** | Guest→sign-in hand-off is duplicated and fragile | `usePendingPacePlan.ts` and `usePendingFuelPlan.ts` are near-identical; `usePacePlanPersistence.ts` redirects to `/register?returnTo=/pace-calculator` — a route that **does not exist** (the real route is `/calculator`) |
| **U-4** | Units (km/mi) are chosen per tool | Each calculator has its own unit state; the choice does not follow the user across tools or sessions |
| **U-5** | Errors are logged, not shown | A toast system exists (`use-toast.ts`, `Toaster`) but many failures end in `console.error` — and `console.*` is stripped in production, so the user and the developer both see nothing |
| **U-6** | Layout bug inherited from the Vite template | `src/App.css` still sets `#root { text-align: center }`, so every left-aligned layout needs a defensive `text-left` (documented in `CLAUDE.md` as a gotcha rather than fixed) |
| **U-7** | No dark mode | `tailwindcss` is configured but no theme tokens or `dark:` strategy exist |
| **U-8** | Accessibility gaps | 6 `<img>` tags without `alt`; the shadcn `Slider` needs a `thumbLabel` or the control is announced unnamed; no focus management on route change; no skip link |
| **U-9** | Inconsistent form validation | Zod + React Hook Form is the stated convention, but several forms validate by hand (`validatePaceInputs` in `pace-calculator/utils.ts`) |
| **U-10** | No offline or optimistic behaviour | Saving a plan is a round trip with no optimistic insert and no retry |

### 1.3 Security

Note: the 2026-02 review in `SECURITY_REVIEW.md` has largely been acted on.
Open redirects are validated, Firestore rules are in the repo, security headers
exist, `gemini-auth.ts` is deleted, `AuthGuard` exists, and account deletion
now removes Firestore data. What follows is what is **still** open.

| ID | Finding | Evidence | Severity |
|----|---------|----------|----------|
| **S-1** | `elevation_analysis_cache` lets any signed-in user overwrite or delete any document | `firestore.rules`: `allow update, delete: if request.auth != null;` — no ownership check | High — cache poisoning: an attacker can replace the analysis of any public route. **Fixed in this branch** (creator-only writes, `createdBy` immutable) |
| **S-2** | CSP allows `script-src 'unsafe-inline'` and whitelists `unpkg.com` | `vercel.json` | High — `unsafe-inline` removes most of the XSS protection CSP is there to provide; `unpkg.com` is a broad, unpinned script source |
| **S-3** | CSP is missing `frame-ancestors`, `base-uri`, `form-action`, `object-src` | `vercel.json` | Medium — `X-Frame-Options` covers framing in older browsers only; `base-uri` omission allows `<base>` injection to redirect every relative URL. **Fixed in this branch** |
| **S-4** | No field validation in Firestore rules | Rules check `userId` ownership only; nothing constrains document shape or size | Medium — an authenticated user can write arbitrary fields and multi-MB documents into their own plan collections |
| **S-5** | Upload rate limiting is client-side only | `GpxUploader.tsx` enforces 15/day and 10/hour in the browser | Medium — trivially bypassed by calling the SDK directly |
| **S-6** | Firebase App Check is not enabled | No `initializeAppCheck` anywhere | Medium — the Firebase project accepts traffic from any origin with the (public) web config |
| **S-7** | Storage rules are not in the repo | `firebase.json` references Firestore rules only | Medium — the same class of problem that C2 in the old review flagged for Firestore |
| **S-8** | Account deletion runs client-side, unatomically | `Settings.tsx` `deleteUserData` loops over collections in the browser, then calls `deleteUser` | Medium — closing the tab mid-delete orphans data; a GDPR erasure request can silently half-complete |
| ~~**S-9**~~ | ~~The Gemini proxy call has no timeout~~ — **not a finding.** `gemini.ts` already wraps the fetch in an `AbortController` with a 20 s timeout and handles `AbortError`. `ROADMAP.md` B2 is stale | — | none |
| ~~**S-10**~~ | ~~Backend error text is shown verbatim~~ — **not a finding.** `gemini.ts` already throws a fixed generic message and never surfaces `errorData.details` | — | none |
| **S-11** | The Mapbox token is in the client bundle | `VITE_MAPBOX_TOKEN` | Low if the token is domain-restricted in the Mapbox dashboard; the plan should not rely on a dashboard setting nobody can verify from the repo |
| **S-12** | No dependency scanning in CI | `.github/workflows/e2e.yml` is the only workflow | Low/ongoing |

### 1.4 Code quality

| ID | Finding | Evidence |
|----|---------|----------|
| **Q-1** | Dead code in the tree | `src/pages/FuelPlannerV2.tsx` (1,398 lines) is not imported by anything — `FuelPlannerPage` and `FuelSeoLanding` both use `@/features/fuel`'s copy. `src/pages/RacePredictorOverlay.tsx` (477 lines) is deliberately unrendered. That is ~1,900 lines of unreachable code |
| **Q-2** | Duplicated, *divergent* business logic | The dead page computes carbs as `weightKg * 0.7` unconditionally while `useFuelCalculation` uses `Math.max(weightBased, raceBaseline)` (B1 in `ROADMAP.md`). Two files named `RaceDetailsForm.tsx` and two named `FuelPlannerV2.tsx` |
| **Q-3** | Unit tests exist but were unrunnable | **Corrected finding.** This originally read "zero unit tests", which was wrong: three files with 50 tests cover `src/utils/difficulty/`, a module six elevation components import. But `package.json` had no `test` script, so nobody could run them and CI never did — and one had rotted on an ICU-dependent `Intl.NumberFormat` assertion. The real gap was the maths: `plan-math.ts` (530 lines), `vdot-math.ts`, `fuel-math.ts`, `pace-calculator/utils.ts` and `gpxMetaData.ts` were uncovered. Addressed in the Stage 1 branch (304 tests), which found five bugs |
| **Q-4** | Very large files | `seoPages.ts` 2,800 lines, `FuelPlannerV2.tsx` 1,398, `Landing.tsx` 1,001, `page-docs.ts` 865, `FeatureShots.tsx` 822, `GpxUploader.tsx` 766 |
| **Q-5** | `seoPages.ts` is a hand-written 2,800-line object literal | 79 page configs written out longhand, with content generators available in `lib/seo/` but only partly used |
| **Q-6** | Mixed import styles | `@/lib/firebase` in some files, `../../../lib/firebase` in `dashboard/hooks/*` |
| **Q-7** | CI does not gate on lint or typecheck | `.github/workflows/e2e.yml` runs Playwright only |
| **Q-8** | No formatter | No Prettier config; formatting drifts file to file |
| **Q-9** | Documentation drift, twice | (a) `CLAUDE.md` and the README describe a PWA that is not wired up (see P-9). (b) `CLAUDE.md` says "Firebase Auth is Google OAuth only; there is no email/password path", but `Register.tsx` calls `createUserWithEmailAndPassword` and `/register` + `/reset-password` are live routes. The second one is security-relevant, not cosmetic — see §7.11 |
| **Q-10** | Business logic still lives in components | The convention says logic belongs in hooks, but `PaceCalculatorV2.tsx` (512 lines) and `TrainingPlanGenerator.tsx` (420 lines) hold substantial logic inline |
| **Q-11** | Two overlapping analytics stacks | `react-ga4` **and** `posthog-js` are both loaded. `ReactGA` is called from 10 files and `GoogleAnalytics.tsx` tracks pageviews, while `PostHogProvider` does the same — two vendors, two costs, two sets of numbers that will disagree |

---

## 2. Target architecture

### 2.1 Stack decision

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **React Router v7 in framework mode** (the former Remix runtime), configured for **pre-rendering + SPA fallback** | The app is already on React Router 7. Framework mode gives file-based routes, automatic per-route code splitting, route `loader`s, and first-class `prerender()` for the 80+ SEO pages — replacing the bespoke `prerender.jsx` + `vite-prerender-plugin` + `page-docs.ts` machinery with one supported mechanism. Fixes P-2, P-11, and much of Q-4/Q-5 |
| Build | Vite 6 | Same tool, newer; RR7 framework mode is a Vite plugin |
| Language | TypeScript 5.7, `strict` | As today, plus `noUncheckedIndexedAccess` |
| Styling | Tailwind 4 + CSS custom-property design tokens | Tailwind 4 removes the JS config and is much faster; tokens give us dark mode (U-7) |
| Components | shadcn/ui (copied source, as today) | Keeps the existing convention; no CLI |
| Server state | **TanStack Query v5** | Fixes P-7, U-1, U-10 in one move |
| Client state | React context for auth + a tiny `zustand` store for user preferences | Fixes U-4 |
| Forms | Zod v4 + React Hook Form | Already the convention; make it universal (U-9) |
| Backend | Firebase Auth + Firestore + Storage, **plus Cloud Functions** | Functions are needed for S-5, S-8, and to keep the Mapbox token off the client (S-11) |
| AI | Gemini via the existing `api.trainpace.com` proxy | Unchanged; the timeout and error sanitisation are already correct — port them as they are (§5.7) |
| Charts | **uPlot** for the elevation profile, hand-rolled SVG for everything else | Fixes P-3; uPlot is ~12 KB vs Chart.js ~70 KB and is faster for thousands of points |
| Maps | The existing `lib/mapbox/` budget + cache design, moved behind an edge function | Keeps the cost control that already works; removes the client token |
| Analytics | **PostHog only** | Drops `react-ga4` (Q-11). PostHog covers pageviews, funnels, and error capture |
| Tests | Vitest (unit) + Playwright (E2E) + `@firebase/rules-unit-testing` (rules) | Fixes Q-3 |
| Hosting | Vercel | Unchanged |

**If the building agent judges React Router framework mode too risky**, the
fallback is: stay on plain Vite SPA + `vite-prerender-plugin` exactly as today,
and implement every other item in this plan. Everything in §4 onwards is
framework-agnostic. Do not substitute Next.js — the Firebase-client-SDK auth
model does not fit its server-component defaults without a large rewrite of the
auth layer.

### 2.2 Architectural principles

1. **The public site and the app are one codebase but two performance tiers.**
   Routes under `routes/(marketing)/` and `routes/(seo)/` must not import
   Firebase, Chart.js, or Mapbox at module scope. They are pre-rendered to
   static HTML and must stay that way. Routes under `routes/(app)/` may.
2. **Pure logic is a separate layer from React.** Every formula lives in
   `src/domain/`, is framework-free, and has unit tests. Components and hooks
   may not contain arithmetic beyond formatting.
3. **One way to read data.** All Firestore access goes through a repository
   module in `src/server/` and is consumed through TanStack Query hooks. No
   component calls `getDocs` (fixes P-7, Q-6).
4. **One way to report a failure.** Every catch either shows a toast or throws
   to an error boundary. `console.error` is not error handling (U-5).
5. **Content is data, not code.** SEO pages, blog posts, race data, and FAQ
   entries are typed data files validated at build time (Q-5).
6. **Barrels export components only.** Pure modules are deep-imported. This is
   already the lesson in `.claude/LESSONS.md`; make it a lint rule (P-11).

---

## 3. Repository layout

```
trainpace/
├── app/                                  # the web app (replaces vite-project/)
│   ├── src/
│   │   ├── root.tsx                      # <html> shell, theme script, error boundary
│   │   ├── routes.ts                     # route table (RR7 config)
│   │   ├── entry.client.tsx
│   │   ├── entry.server.tsx
│   │   │
│   │   ├── routes/                       # one file per route; thin
│   │   │   ├── (marketing)/
│   │   │   │   ├── home.tsx              # /
│   │   │   │   ├── about.tsx             # /about, /ethos
│   │   │   │   ├── faq.tsx
│   │   │   │   ├── privacy.tsx
│   │   │   │   ├── terms.tsx
│   │   │   │   └── mcp.tsx
│   │   │   ├── (seo)/
│   │   │   │   ├── calculator.$slug.tsx
│   │   │   │   ├── fuel.$slug.tsx
│   │   │   │   ├── plan.$slug.tsx
│   │   │   │   ├── race._index.tsx
│   │   │   │   ├── race.$slug.tsx
│   │   │   │   ├── elevation.guides.$slug.tsx
│   │   │   │   ├── blog._index.tsx
│   │   │   │   ├── blog.$slug.tsx
│   │   │   │   └── preview-route.$slug.tsx
│   │   │   ├── (tools)/                  # public, interactive, pre-rendered shells
│   │   │   │   ├── calculator.tsx
│   │   │   │   ├── vdot.tsx
│   │   │   │   ├── plan.tsx
│   │   │   │   ├── fuel.tsx
│   │   │   │   └── elevation.tsx         # + elevation.$docId.tsx
│   │   │   ├── (app)/                    # auth-gated, never pre-rendered
│   │   │   │   ├── dashboard.tsx
│   │   │   │   ├── onboarding.tsx
│   │   │   │   ├── settings.tsx
│   │   │   │   └── poster.tsx
│   │   │   └── (auth)/
│   │   │       ├── login.tsx
│   │   │       ├── logout.tsx
│   │   │       └── reset-password.tsx
│   │   │
│   │   ├── domain/                       # PURE. no react, no firebase, no dom
│   │   │   ├── units.ts                  # the single km/mi/time conversion module
│   │   │   ├── pace.ts
│   │   │   ├── vdot.ts
│   │   │   ├── fuel.ts
│   │   │   ├── plan.ts
│   │   │   ├── elevation.ts
│   │   │   ├── gpx.ts                    # parse + simplify, DOM-free (takes a string)
│   │   │   └── index.ts
│   │   │
│   │   ├── features/                     # UI + hooks per feature
│   │   │   ├── auth/
│   │   │   ├── pace/
│   │   │   ├── vdot/
│   │   │   ├── plan/
│   │   │   ├── fuel/
│   │   │   ├── elevation/
│   │   │   ├── goals/
│   │   │   ├── dashboard/
│   │   │   ├── poster/
│   │   │   └── blog/
│   │   │
│   │   ├── server/                       # all I/O
│   │   │   ├── firebase/
│   │   │   │   ├── app.ts                # lazy init, see §5.1
│   │   │   │   ├── auth.ts
│   │   │   │   ├── db.ts
│   │   │   │   └── storage.ts
│   │   │   ├── repositories/             # one per collection
│   │   │   │   ├── pacePlans.ts
│   │   │   │   ├── fuelPlans.ts
│   │   │   │   ├── trainingPlans.ts
│   │   │   │   ├── routes.ts
│   │   │   │   ├── bookmarks.ts
│   │   │   │   └── goals.ts
│   │   │   ├── queries.ts                # TanStack query keys + hooks
│   │   │   └── ai.ts                     # Gemini proxy client
│   │   │
│   │   ├── ui/                           # design system
│   │   │   ├── primitives/               # shadcn-derived: button, input, dialog…
│   │   │   ├── patterns/                 # Skeleton, EmptyState, ErrorState, Field…
│   │   │   ├── charts/                   # LineChart (uPlot), DonutChart (svg)
│   │   │   └── tokens.css
│   │   │
│   │   ├── layout/                       # AppShell, SideNav, Footer, SeoLayout
│   │   ├── content/                      # typed content loaders (§8)
│   │   ├── lib/                          # cn(), analytics, logger, prefs store
│   │   └── workers/
│   │       └── gpx.worker.ts
│   │
│   ├── content/                          # DATA, not code
│   │   ├── seo/                          # one YAML/JSON file per SEO page group
│   │   ├── blog/                         # one .md file per post
│   │   ├── races/
│   │   └── faq.json
│   │
│   ├── public/
│   ├── e2e/
│   ├── scripts/
│   │   ├── generate-sitemap.ts
│   │   ├── generate-agent-docs.ts        # .md mirrors + llms.txt + llms-full.txt
│   │   └── check-bundle-budget.ts
│   ├── middleware.ts                     # Vercel edge: Accept negotiation + agent log
│   └── vite.config.ts
│
├── functions/                            # Firebase Cloud Functions (new)
│   ├── src/
│   │   ├── onUserDeleted.ts
│   │   ├── rateLimitUpload.ts
│   │   └── mapboxProxy.ts
│   └── package.json
│
├── firestore.rules
├── storage.rules
├── firebase.json
├── vercel.json
├── .github/workflows/ci.yml
├── CLAUDE.md
└── REWRITE_PLAN.md                       # this file
```

Directory names in parentheses — `(marketing)`, `(app)` — are route groups: they
organise files without adding a URL segment.

---

## 4. Cross-cutting foundations

Build these first (Phase 1). Everything else depends on them.

### 4.1 Design tokens and theming (fixes U-6, U-7)

`app/src/ui/tokens.css` defines the full palette as CSS custom properties on
`:root`, then redefines only the colour tokens under `[data-theme="dark"]` and
under `@media (prefers-color-scheme: dark)` guarded by
`:root:not([data-theme="light"])`. Tailwind 4 consumes them through `@theme`.

Required tokens: `--bg`, `--bg-subtle`, `--surface`, `--border`, `--text`,
`--text-muted`, `--accent`, `--accent-fg`, `--success`, `--warning`, `--danger`,
plus `--radius`, `--shadow-sm/md`, and the font stacks `--font-sans`,
`--font-display`.

Theme is applied by a tiny inline script in `root.tsx` **before** first paint,
reading `localStorage.theme` inside a `try/catch`, so there is no flash.

**Do not carry `App.css` over.** The `#root { text-align: center }` rule dies
with the old app (U-6).

### 4.2 Typography (carries forward a hard-won lesson)

Self-host DM Sans and Space Grotesk as subset `woff2` files in
`public/fonts/`, `preload` the two most-used faces, and declare `@font-face`
with `font-display: swap`. This removes the Google Fonts round trip (P-6).

Everything in the "Typography" section of the current `CLAUDE.md` still
applies and must be carried into the new `CLAUDE.md`:

- `font-synthesis: none` stays. A missing face fails silently rather than
  being faked, so **every weight and style you use must be in the subset you
  ship.**
- Space Grotesk stops at **700**. `font-extrabold`/`font-black` on a heading
  silently renders as 700.
- DM Sans italic needs the real italic face; without it `italic` renders
  upright with no error.
- Space Grotesk has a `tnum` table and DM Sans does not. **Any column of
  numbers, and anything that animates through digits, must use Space Grotesk**
  or it jitters. This affects the pace tables, the VDOT table, the plan
  calendar, and the fuel schedule.
- Always give a webfont a fallback stack.

Verify font work by measuring in a real browser, not by reading CSS. See the
`verify-in-browser` skill.

### 4.3 Error handling and logging (fixes U-2, U-5)

Three layers:

1. `root.tsx` exports an `ErrorBoundary` that renders a branded error page with
   a "Reload" and a "Go home" action. It distinguishes a 404 from a crash.
2. Every route group has its own `ErrorBoundary` so a failure in one tool does
   not blank the shell.
3. A `<ChunkErrorBoundary>` wraps the router outlet and, on a dynamic-import
   failure (the classic "user's tab was open across a deploy" case), reloads
   the page once, guarded by a `sessionStorage` flag to prevent a loop.

`app/src/lib/logger.ts` is the only logging entry point:

```ts
export const log = {
  debug(msg: string, ctx?: Record<string, unknown>): void,  // dev only
  warn(msg: string, ctx?: Record<string, unknown>): void,   // dev + PostHog
  error(err: unknown, ctx?: Record<string, unknown>): void, // always PostHog
};
```

Lint rule: `no-console` is an error outside `scripts/`, `middleware.ts`, and
`logger.ts`.

**Rule for the agent:** a `catch` block must do one of three things — show a
toast, set error state that renders an `<ErrorState>`, or rethrow. Swallowing
is a review failure.

### 4.4 User preferences store (fixes U-4)

`app/src/lib/prefs.ts` — a `zustand` store persisted to `localStorage` under
the key `trainpace.prefs.v1`:

```ts
type Prefs = {
  units: "metric" | "imperial";
  theme: "light" | "dark" | "system";
  weightKg?: number;      // reused by the fuel planner
  defaultRace?: RaceKey;
};
```

Every calculator reads `units` from here. There is no per-tool unit toggle
state. The toggle in the header writes to the store.

All `localStorage` and `sessionStorage` access goes through
`app/src/lib/storage.ts`, which wraps every read and write in `try/catch` and
returns a typed default. Private-mode browsers and blocked site data must not
crash the app.

### 4.5 Data layer (fixes P-7, U-1, U-10, Q-6)

**Repositories** (`app/src/server/repositories/*.ts`) are the only files that
import `firebase/firestore`. Each exports plain async functions and validates
what comes back with Zod:

```ts
// pacePlans.ts
export async function listPacePlans(userId: string): Promise<PacePlan[]>
export async function getPacePlan(id: string): Promise<PacePlan | null>
export async function createPacePlan(input: NewPacePlan): Promise<string>
export async function updatePacePlan(id: string, patch: Partial<PacePlan>): Promise<void>
export async function deletePacePlan(id: string): Promise<void>
```

Validating reads with Zod matters: Firestore documents are effectively
untrusted input, and older documents will have older shapes.

**Query keys** are centralised so invalidation is never guessed:

```ts
export const qk = {
  pacePlans: (uid: string) => ["pacePlans", uid] as const,
  fuelPlans: (uid: string) => ["fuelPlans", uid] as const,
  trainingPlans: (uid: string) => ["trainingPlans", uid] as const,
  routes: (uid: string) => ["routes", uid] as const,
  route: (id: string) => ["route", id] as const,
  goals: (uid: string) => ["goals", uid] as const,
};
```

**Standards:**
- `staleTime: 60_000` for user-owned lists; `Infinity` for static content.
- Every mutation does an optimistic update and rolls back on error (U-10).
- Every list view renders `<Skeleton>` while pending, `<ErrorState onRetry>` on
  error, and `<EmptyState>` when the result is empty (U-1).

### 4.6 Auth (fixes P-1)

`AuthProvider` must **not** pull Firebase into the main bundle. Implementation:

```
app/src/features/auth/AuthContext.tsx
  - state: { user: User | null, status: "loading" | "authed" | "anon" }
  - on mount: const { watchAuth } = await import("@/server/firebase/auth")
  - calls watchAuth(cb) and stores the unsubscribe
```

Because the import is dynamic, the Firebase Auth SDK loads *after* first paint
and only in the browser. Pre-rendered SEO pages resolve `status: "anon"`
immediately and never download it.

Keep the PostHog identify/reset logic from the current `AuthContext` — the
`prevUidRef` guard that only resets on a real logout transition is correct and
non-obvious. Port it as written.

`<AuthGuard>` keeps today's shape but renders a proper skeleton instead of
`Loading...`, and preserves `returnTo` with the same `isValidRedirect`
allowlist check that exists today. **Port `isValidRedirect` unchanged** — it is
the fix for the original open-redirect finding.

### 4.7 Pending-intent module (fixes U-3)

One module replaces `usePendingPacePlan` and `usePendingFuelPlan`:

```ts
// app/src/features/auth/pendingIntent.ts
type PendingIntent =
  | { kind: "savePacePlan"; payload: PacePlanDraft }
  | { kind: "saveFuelPlan"; payload: FuelPlanDraft }
  | { kind: "saveTrainingPlan"; payload: TrainingPlanDraft };

export function stashIntent(i: PendingIntent): void
export function takeIntent(): PendingIntent | null   // reads and clears
```

Flow: a signed-out user clicks Save → `stashIntent` → navigate to
`/login?returnTo=<current path>` → after sign-in the route runs `takeIntent()`
and completes the save. **Verify every `returnTo` string points at a real
route** — `/pace-calculator` in the current code does not exist.

### 4.8 Analytics (fixes Q-11)

PostHog only. `react-ga4` is not installed. One `usePageview()` hook in the
root layout. Analytics is loaded lazily and never blocks paint. If
`VITE_PUBLIC_POSTHOG_KEY` is unset, every call is a silent no-op so local dev
and E2E runs stay clean.

---

## 5. Firebase, data model, and security

### 5.1 Lazy Firebase initialisation (P-1)

```ts
// app/src/server/firebase/app.ts
let appPromise: Promise<FirebaseApp> | null = null;

export function getFirebaseApp() {
  appPromise ??= (async () => {
    const { initializeApp, getApps } = await import("firebase/app");
    const app = getApps()[0] ?? initializeApp(config);
    if (import.meta.env.PROD) {
      const { initializeAppCheck, ReCaptchaEnterpriseProvider } =
        await import("firebase/app-check");
      initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
        isTokenAutoRefreshEnabled: true,
      });
    }
    return app;
  })();
  return appPromise;
}
```

`auth.ts`, `db.ts`, and `storage.ts` follow the same lazy pattern. App Check
(S-6) is enabled here and enforced in the Firebase console for Firestore and
Storage.

### 5.2 Collections

Keep the existing collection names — data must migrate without a rewrite.

| Collection | Doc id | Owner field | Read | Write |
|---|---|---|---|---|
| `user_pace_plans` | auto | `userId` | owner | owner |
| `user_fuel_plans` | auto | `userId` | owner | owner |
| `user_training_plans` | auto | `userId` | owner | owner |
| `user_race_plans` | auto | `userId` | owner | owner |
| `user_bookmarks` | auto | `userId` | owner | owner |
| `user_training_goals` | **= uid** | `userId` | owner | owner |
| `gpx_uploads` | auto | `userId` | public | owner |
| `elevation_analysis_cache` | content hash | `userId` | public | **creator only** (changed) |

Every document gains `schemaVersion: number`, `createdAt`, and `updatedAt`
(server timestamps). Repositories set these; rules enforce them.

### 5.3 Firestore rules (fixes S-1, S-4)

Write `firestore.rules` with shared helper functions and real field validation:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function signedIn()      { return request.auth != null; }
    function isOwner(uid)    { return signedIn() && request.auth.uid == uid; }
    function ownsExisting()  { return isOwner(resource.data.userId); }
    function ownsIncoming()  { return isOwner(request.resource.data.userId); }
    function smallDoc()      { return request.resource.size() < 256 * 1024; }
    function immutableOwner() {
      return request.resource.data.userId == resource.data.userId;
    }

    function validPlan(fields) {
      return request.resource.data.keys().hasAll(['userId','schemaVersion','createdAt'])
        && request.resource.data.keys().hasOnly(fields)
        && request.resource.data.schemaVersion is int
        && smallDoc();
    }

    match /user_pace_plans/{id} {
      allow read, delete: if ownsExisting();
      allow create: if ownsIncoming()
        && validPlan(['userId','schemaVersion','createdAt','updatedAt','name',
                      'distanceKm','goalTimeSec','paces','notes']);
      allow update: if ownsExisting() && immutableOwner()
        && validPlan([...same fields...]);
    }

    // …the same shape for user_fuel_plans, user_training_plans,
    //    user_race_plans, user_bookmarks…

    match /user_training_goals/{docId} {
      // read/delete keyed on the DOC ID, not resource.data, so a brand-new
      // user can getDoc a not-yet-existing doc without permission-denied.
      allow read, delete: if isOwner(docId);
      allow create, update: if isOwner(docId) && ownsIncoming() && smallDoc();
    }

    match /gpx_uploads/{id} {
      allow read: if true;                       // routes are shareable by design
      allow create: if ownsIncoming() && smallDoc();
      allow update, delete: if ownsExisting() && immutableOwner();
    }

    // FIX for S-1: the creator owns the cache entry. No more
    // "any authenticated user may update or delete any document".
    match /elevation_analysis_cache/{id} {
      allow read: if true;
      allow create: if ownsIncoming() && smallDoc();
      allow update, delete: if ownsExisting() && immutableOwner();
    }

    match /{document=**} { allow read, write: if false; }
  }
}
```

The comment on `user_training_goals` is load-bearing — it records why those
rules are keyed on the doc id. Keep it.

### 5.4 Storage rules (fixes S-7)

Add `storage.rules` and register it in `firebase.json`:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /gpx/{userId}/{file} {
      allow read: if true;
      allow write: if request.auth != null
        && request.auth.uid == userId
        && request.resource.size < 10 * 1024 * 1024
        && request.resource.contentType.matches('application/(gpx\\+xml|xml)|text/xml');
    }
    match /{allPaths=**} { allow read, write: if false; }
  }
}
```

### 5.5 Cloud Functions (fixes S-5, S-8, S-11)

| Function | Trigger | Job |
|---|---|---|
| `onUserDeleted` | Auth `user().onDelete` | Batch-delete every document owned by the uid across all collections, and the user's Storage prefix. Replaces the client-side loop in `Settings.tsx` — deletion now completes even if the tab closes |
| `reserveUploadSlot` | Callable | Server-enforced rate limit: 15 uploads/day, 10/hour per uid, counted in a `rate_limits/{uid}` document. The client calls it *before* uploading and refuses to proceed without a token |
| `mapboxStaticImage` | HTTP (Vercel edge function is also acceptable) | Proxies Mapbox Static Images so `VITE_MAPBOX_TOKEN` never ships to the browser. Keeps the existing budget and cache logic in front of it |

Client-side rate-limit checks stay as a *UX* affordance (instant feedback), but
they are no longer the enforcement point.

### 5.6 CSP and headers (fixes S-2, S-3)

The new CSP drops `'unsafe-inline'` for scripts and drops `unpkg.com`
entirely. React Router framework mode emits a small number of inline scripts;
give each a build-time **hash** and list the hashes, or use a nonce injected by
`middleware.ts`. Add the missing directives:

```
default-src 'self';
script-src 'self' 'sha256-…' https://apis.google.com https://us-assets.i.posthog.com;
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https://api.mapbox.com https://*.googleapis.com;
font-src 'self';
connect-src 'self' https://*.googleapis.com https://firestore.googleapis.com
  https://identitytoolkit.googleapis.com https://securetoken.googleapis.com
  https://api.trainpace.com https://us.i.posthog.com https://us-assets.i.posthog.com;
frame-src 'self' https://accounts.google.com https://*.firebaseapp.com;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
object-src 'none';
worker-src 'self' blob:;
upgrade-insecure-requests
```

`style-src 'unsafe-inline'` stays — Tailwind and Radix inject inline styles and
removing it is not realistic. Everything else tightens.

Keep the rest of today's `vercel.json` headers as they are: the cache policy
(immutable hashed assets, `no-store` HTML), the `.md` and `llms*.txt` content
types. Those are correct.

### 5.7 AI proxy — port, do not redesign

**The current implementation is already correct — port it, do not redesign it.**
`services/gemini.ts` already has the `AbortController` (20 s), already handles
`AbortError` with a friendly message, and already throws a fixed generic error
rather than surfacing backend details. Carry all of that over as written.

`app/src/server/ai.ts` changes only two things:

- Route the caught error through `log.error` (§4.3) instead of `console.error`,
  which production strips.
- Keep the existing 2,000-character input cap and the `getFuelPlanPrompt`
  prompt text — the prompt has been tuned and the constraints in it
  ("no gels means no packaged products", "do not suggest dates") are
  deliberate. Port it verbatim.

---

## 6. Performance plan

### 6.1 Budgets (enforced in CI — fixes P-10)

| Metric | Budget | Measured on |
|---|---|---|
| Initial JS, marketing/SEO routes | **≤ 90 KB gzip** | `/`, `/calculator/5k-pace-calculator` |
| Initial JS, tool routes | ≤ 140 KB gzip | `/calculator`, `/fuel` |
| Initial JS, app routes | ≤ 240 KB gzip | `/dashboard` |
| Largest single chunk | ≤ 180 KB gzip | any |
| LCP (mobile, throttled) | ≤ 2.0 s | `/` |
| CLS | ≤ 0.05 | all |
| Total image bytes on `/` | ≤ 200 KB | `/` |

`scripts/check-bundle-budget.ts` reads the Vite build manifest, sums the
entry + shared chunks per route, and exits non-zero over budget. It runs in CI.

### 6.2 Techniques

- **P-1** Lazy Firebase (§5.1). Verify by loading `/calculator/5k-pace-calculator`
  with the network tab open: no `firebase` chunk may be requested.
- **P-2** Explicit `build.rollupOptions.output.manualChunks`:
  `react` (react, react-dom, react-router), `firebase`, `charts` (uplot),
  `forms` (react-hook-form, zod). Everything else splits per route.
- **P-3** Replace Chart.js with **uPlot** for the elevation profile and the
  cumulative-gain chart, and a ~40-line hand-written SVG donut for the terrain
  breakdown. Both live in `app/src/ui/charts/` and are lazy-loaded.
- **P-4** Blog posts become one `.md` file per post in `content/blog/`, compiled
  at build time into (a) a small index (`slug`, `title`, `date`, `excerpt`,
  `tags` — a few KB) and (b) one JSON chunk per post, fetched on demand.
  `marathon-data.json` splits per race under `content/races/`.
- **P-5** Convert every raster asset to AVIF with a WebP fallback and a PNG last
  resort. Regenerate the PWA icons at the right sizes (the 512×512 icon must be
  under 30 KB). Every `<img>` gets explicit `width`/`height` (CLS) and
  `loading="lazy"` + `decoding="async"` below the fold. The landing hero is
  `fetchpriority="high"` and `preload`ed.
- **P-6** Self-hosted subset fonts (§4.2).
- **P-7** TanStack Query (§4.5).
- **P-8** GPX parsing moves into `app/src/workers/gpx.worker.ts`. `domain/gpx.ts`
  stays DOM-free: it takes a *string* and returns parsed data, so it can run in
  the worker and be unit-tested in Node. Use a streaming/lightweight XML parser
  rather than `DOMParser` so the same code runs both places.
- **P-9** **Decide and document.** Either wire `VitePWA` properly (precache the
  app shell and the static SEO HTML, `NetworkFirst` for Firestore-backed pages,
  an update prompt) *or* remove the dependency, the `sw.js`/`registerSW.js`
  headers from `vercel.json`, and every PWA claim from the docs. Do not ship the
  current half-state. **Recommended: wire it up** — a training app that works at
  the start line with no signal is genuinely useful.
- **P-11** ESLint rule `no-restricted-imports` forbidding `@/features/*` barrel
  imports from inside `routes/`; routes deep-import the exact component.

### 6.3 Rendering strategy

- All of `(marketing)`, `(seo)`, and the *shells* of `(tools)` are
  **pre-rendered at build time**. The route list is generated from
  `content/`, so adding an SEO page or a blog post cannot desynchronise the
  build, the sitemap, and the Markdown mirrors (this is what `getAllDocPaths()`
  does today — keep the single-source idea, drop the hand-maintained array).
- `(app)` routes are client-rendered behind `AuthGuard` and are excluded from
  pre-rendering and from the sitemap.
- Each tool's *interactive* part is a lazily-hydrated island: the pre-rendered
  HTML shows the heading, the intro copy, the FAQ, and a static form skeleton,
  so the page is useful and indexable before any JS runs.

---

## 7. Feature specifications

Each feature keeps its current behaviour. Port the maths exactly; rebuild the
UI on the new foundations. Every feature must ship: a pure `domain/` module
with unit tests, a `features/<name>/` UI folder, a route, an empty state, an
error state, and a skeleton.

### 7.1 Pace calculator — `/calculator`, `/calculator/:slug`

- **Domain:** `domain/pace.ts`. Port `timeToSeconds`, `secondsToTimeString`,
  `convertPace`, `convertDistance`, `calculateTrainingPaces`,
  `calculateHeartRateZones`, `adjustPaceForTerrain`,
  `calculateElevationAdjustment`, `calculateWeatherAdjustment` from
  `features/pace-calculator/utils.ts`.
- Replace the hand-written `validatePaceInputs` with a Zod schema (U-9).
- Units come from the prefs store, not local state (U-4).
- **Fix B4 from `ROADMAP.md`:** the live VDOT badge currently hides itself
  outside `10 < vdot < 100`, which silently drops elite and beginner runners.
  Widen to `1 < vdot < 120` to match the VDOT tool.
- Saving a plan when signed out uses `pendingIntent` (§4.7) — and the
  `returnTo` must be `/calculator`, not the non-existent `/pace-calculator`.
- Results table uses Space Grotesk for the numeric columns (§4.2).

### 7.2 VDOT calculator — `/vdot`

- **Domain:** `domain/vdot.ts`. Port every export from `vdot-math.ts`:
  `oxygenCost`, `percentVO2max`, `calculateVdot`, `velocityFromVO2`,
  `predictRaceTime`, `trainingVelocity`, `velocityToPacePerKm`,
  `velocityToPacePerMile`, `formatTime`, `formatPace`, `calculateTrainingZones`.
- Fold in the parked **Riegel race-time predictor** from
  `pages/RacePredictorOverlay.tsx` as a "Predict other distances" panel. The
  old file's comment says this is the intended home for it. This retires 477
  lines of dead code (Q-1) without losing the feature.
- Race-prediction and training-zone tables are tabular-numerals (§4.2).

### 7.3 Training plan builder — `/plan`, `/plan/:slug`

- **Domain:** `domain/plan.ts`. Port `PLAN_WEEKS`, `buildPhaseMap`,
  `generateTrainingPlan`, `weeksUntilRace`, and the colour helpers.
  `newPlanId()` should use `crypto.randomUUID()`.
- Keep: plan calendar grid, week cards, this-week card, progress tracking,
  inline editing, and **iCal export** (`utils/exportIcal.ts` — port as is).
- `generateTrainingPlan` is the single highest-value unit-test target in the
  app: 530 lines of scheduling logic with zero coverage today. Cover phase
  boundaries, taper weeks, every `GoalRace` × `FitnessLevel` combination, and
  the short-runway case (race closer than the minimum plan length).

### 7.4 Fuel planner — `/fuel`, `/fuel/:slug`

- **Domain:** `domain/fuel.ts`. Port `formatFuelTime`, `generateFuelStops`,
  `resolveCarbsPerHour`, `resolveGelsNeeded`, `calculateFuelPlan`.
- **Fix B1 (Q-2):** there is exactly one carbs-per-hour rule, and it is
  `Math.max(Math.round(weightKg * 0.7), raceBaseline[raceType])`. The dead
  page's unconditional `weightKg * 0.7` underfed light runners. Delete that
  path; write a unit test that pins a 50 kg half-marathon runner to the
  baseline, not to 35 g/hr.
- AI personalisation calls `server/ai.ts` with the hardened client (§5.7).
  While it runs, show a streaming-style skeleton; on abort, a retry affordance.
- Body weight is read from and written to the prefs store (§4.4).

### 7.5 Elevation / GPX analysis — `/elevation`, `/elevation/:docId`, `/elevation/guides/:slug`

- **Domain:** `domain/gpx.ts` (DOM-free parse + Douglas–Peucker simplify) and
  `domain/elevation.ts` (`downsampleProfile`, `computeCumulativeGain`, terrain
  breakdown, splits, difficulty score, race comparison).
- **B3 is a false positive — do not "fix" it.** `ROADMAP.md` B3 claims the
  fallback step-filter path drops the route's final point via
  `push(last)` then `slice(0, maxPoints)`. The current code does not do that:
  it slices first and *then* forces both endpoints by direct index assignment,
  with a comment saying exactly why. Two independent passes confirmed the last
  output point equals the last input point in every case. The ROADMAP entry is
  stale.
- **There is a real defect next to it.** `step = Math.floor(points.length /
  maxPoints)` underestimates the stride, so the filter keeps more than
  `maxPoints` samples and `slice` discards them *from the end of the route*.
  The forced endpoint overwrite then hides this as a long straight-line jump:
  at n=149 / maxPoints=50 the last ~35% of the route renders as one straight
  segment. `Math.ceil`, or an even index resample, fixes it. Only reachable
  when Douglas–Peucker at its tolerance ceiling still exceeds the cap —
  plausible for the 50-point thumbnail on a long, convoluted route.
- Parsing runs in `workers/gpx.worker.ts` with progress reporting (P-8).
- **Validation before parsing:** extension check, 10 MB cap, a hard cap on
  track-point count, and a rejection if the document contains
  `script`, `object`, `embed`, or `iframe` elements (the M2 hardening from the
  old review, applied in the worker).
- Upload flow: call `reserveUploadSlot` (§5.5) → upload to Storage → write the
  `gpx_uploads` document → analysis cached in `elevation_analysis_cache` keyed
  by content hash.
- Charts use uPlot (P-3). Maps use `StaticRouteMap` through the proxy (§5.5);
  `MapboxRoutePreview` (a billable map load per mount) only where pan/zoom is
  genuinely needed. Carry over the `awaitingPoints` rule from
  `docs/mapbox.md`: a call site that swaps points after mount must pass it, or
  it buys two images per view.
- **Legacy `/elevationfinder` and `/elevationfinder/:docId` URLs must keep
  working** — permanent redirects to `/elevation…`.

### 7.6 Goals & onboarding — `/onboarding`

Port `useTrainingGoals` and the onboarding flow. Goals live in
`user_training_goals` with doc id = uid. Onboarding is 3 steps, skippable,
resumable, with progress saved after each step.

### 7.7 Dashboard — `/dashboard`

One page, four data sources (pace plans, fuel plans, training plans, saved
routes), all through TanStack Query with a shared `<Skeleton>` grid. Delete is
optimistic with an undo toast. Each card links to its tool with the plan
pre-loaded.

### 7.8 Poster generator — dialog, not a route

The poster generator has **no route today**. It is a dialog launched by
`<PosterButton>` from the elevation page (`ElevationPageV2.tsx:282`). Keep that
entry point, and additionally expose it at `/poster` under `(app)` so it is
linkable and can be pre-loaded — but the dialog stays the primary flow.

Port the canvas render pipeline (`features/poster/utils/canvas.ts`) unchanged.
Move the export render into an `OffscreenCanvas` where supported. The whole
feature, Mapbox included, is lazy-loaded on first open — it must never be in
the elevation route's initial chunk.

### 7.9 Blog — `/blog`, `/blog/:slug`

Markdown files in `content/blog/`, compiled at build time (P-4). Render with
`react-markdown` + `remark-gfm`, but **only on the post route** so the parser
is not in the index chunk. Posts are pre-rendered to static HTML — the reader
never needs the Markdown renderer at all unless they navigate client-side.

### 7.10 Race pages — `/race`, `/race/:slug`, `/preview-route/:slug`

Race data as one file per race in `content/races/`. Preview routes keep their
eight cities. Pre-rendered; each carries `Event`/`SportsEvent` structured data.

### 7.11 Auth — `/login`, `/logout`, `/reset-password`

**Resolve a documented contradiction first.** `CLAUDE.md` states "Firebase Auth
is Google OAuth only; there is no email/password path" — but
`components/login/Register.tsx` calls `createUserWithEmailAndPassword`, and
`/register` and `/reset-password` are both live routes in `App.tsx`. One of the
two is wrong, and it is a security-relevant question (password policy, reset
flow, enumeration) rather than a cosmetic one.

Decide explicitly, then build exactly one of:

- **Google OAuth only** (recommended — it matches the stated intent and removes
  a whole class of credential risk): delete the register and reset-password
  routes, redirect both to `/login`, and keep only `signInWithPopup`.
- **Both methods:** keep email/password, but raise the minimum password length
  from the current 6 to **12** characters, check it against a breached-password
  list, and keep the reset flow.

Either way, keep the anti-enumeration grouped error messages from the current
`Login.tsx`, and port `isValidRedirect` unchanged.

---

## 8. Content, SEO, and agent-facing output

This system is the app's competitive moat — 80+ pre-rendered pages, `.md`
mirrors, `llms.txt`, and Accept-header negotiation at the edge. **Preserve the
behaviour exactly; replace the hand-written data.**

### 8.1 Content as data (fixes Q-5)

Replace the 2,800-line `seoPages.ts` literal with per-group data files under
`content/seo/`, each validated by a Zod schema at build time:

```ts
const SeoPage = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  tool: z.enum(["pace", "fuel", "plan", "elevation", "race"]),
  title: z.string().max(60),          // hard SEO limit
  description: z.string().max(160),   // hard SEO limit
  h1: z.string(),
  intro: z.string(),
  bullets: z.array(z.string()).min(2).max(6),
  cta: z.object({ href: z.string(), label: z.string() }),
  initialInputs: z.record(z.string()).optional(),
  faq: z.array(z.object({ question: z.string(), answer: z.string() })).min(2),
});
```

The build **fails** on a title over 60 characters or a description over 160.
Today that is a manual `validateAllPages()` call someone has to remember
(`CLAUDE.md` lists it as a gotcha); make it impossible to forget.

Keep the generators in `lib/seo/` (`content-generators.ts`,
`internal-linking.ts`, `schema-generators.ts`, `meta-generators.ts`) — they are
good. They now read from `content/` instead of from a code literal.

### 8.2 One list, four consumers

A single `getContentRoutes()` function derives, from `content/`:

1. the pre-render route list,
2. `sitemap.xml`,
3. the `.md` mirrors + `llms-full.txt` + `llms-index.json`,
4. internal-link suggestions.

No hand-maintained arrays. `npm run build` regenerates all four; a check script
fails CI if the committed `sitemap.xml` is stale.

### 8.3 Edge middleware

Port `middleware.ts` as it stands. Both of its jobs are correct and hard-won:
Accept/`?format=md` negotiation serving the Markdown mirror, and the structured
`trainpace_agent_request` stdout log (crawlers do not run JS, so client
analytics cannot see them). Keep the `eslint-disable no-console` with its
comment — Vercel bundles middleware separately, so esbuild's `drop: ["console"]`
does not reach it, and stdout *is* the transport. Keep `docs/agent-traffic.md`.

### 8.4 Structured data

Every SEO page emits JSON-LD: `WebApplication` for tools, `FAQPage` where there
is an FAQ, `BreadcrumbList` everywhere, `Article` for blog posts,
`SportsEvent` for races. Validate against schema.org types in a unit test.

---

## 9. Accessibility and UX standards (fixes U-1, U-2, U-5, U-8, U-9)

Non-negotiable for every screen:

1. **Landmarks:** one `<h1>`, correct heading order, `<main>`, `<nav>`,
   `<footer>`, and a skip-to-content link.
2. **Focus:** visible focus ring on every interactive element; focus moves to
   the `<h1>` on route change; dialogs trap focus and restore it on close.
3. **Labels:** every input has a real `<label>`. Every `<img>` has `alt` (or
   `alt=""` if decorative). **The shadcn `Slider` needs `thumbLabel`** — an
   `aria-label` on the root leaves the thumb, which carries `role="slider"`,
   announced as unnamed. This bites every time; put it in the `Slider`
   primitive's prop types as required.
4. **Colour:** 4.5:1 contrast minimum in both themes. Never colour alone —
   workout types in the plan calendar need a label or icon too.
5. **Motion:** honour `prefers-reduced-motion`.
6. **Touch targets:** 44×44 px minimum on mobile.
7. **States:** every async surface has all four of loading (skeleton matching
   final layout, not a spinner), empty (explains what to do next), error
   (explains what happened, offers retry), and success.
8. **Forms:** Zod + React Hook Form everywhere, errors announced with
   `aria-live`, inline and specific.
9. **Mobile:** test every page at 360 px. The stack order on mobile must put
   results above the fold after submit — a past session got this wrong.

Run `axe-core` in the Playwright suite on every top-level route; zero
serious/critical violations is a CI gate.

---

## 10. Testing

### 10.1 Unit tests — Vitest (fixes Q-3)

This is the biggest quality gap today and the cheapest to close, because
`domain/` is pure by construction.

**Required coverage (≥ 90% of `domain/`):**

| Module | Must cover |
|---|---|
| `domain/units.ts` | km↔mi, pace↔speed, time parsing round-trips, boundary values |
| `domain/pace.ts` | training paces at known VDOTs, HR zones, terrain/weather/elevation adjustments, invalid input |
| `domain/vdot.ts` | published Daniels reference values, race prediction against known equivalences, monotonicity (faster time ⇒ higher VDOT) |
| `domain/plan.ts` | every `GoalRace` × `FitnessLevel`, phase boundaries, taper, short runway, week count = `PLAN_WEEKS` |
| `domain/fuel.ts` | **the B1 regression:** 50 kg half-marathon runner gets the baseline, not 35 g/hr; stop spacing; total carbs |
| `domain/gpx.ts` | **the B3 regression:** last point preserved on both simplify paths; malformed XML rejected; point cap enforced |
| `domain/elevation.ts` | gain/loss, splits, terrain buckets, difficulty score |
| `content/` schemas | every SEO page parses; title ≤ 60; description ≤ 160; slugs unique |

Add a **golden-file test**: run the current production app's calculators over a
fixed set of inputs, store the outputs in `test/golden/*.json`, and assert the
new implementation matches. This is the safety net that makes a rewrite safe.
Generate the goldens from the *old* code before deleting it.

### 10.2 Rules tests — `@firebase/rules-unit-testing`

Against the emulator, assert for every collection: owner can read/write own;
**another authenticated user cannot** read, update, or delete; anonymous is
denied; oversized documents are rejected; `userId` cannot be changed on update.
Include an explicit test for S-1: user B cannot overwrite user A's
`elevation_analysis_cache` entry.

### 10.3 E2E — Playwright

Port the existing specs (`auth`, `fuel-planner`, `race-plan`, `training-plan`)
and the page-object pattern in `e2e/pages/` — that structure is good. Add:
pace calculator, VDOT, GPX upload (fixture file), dashboard CRUD, an SEO page
(assert title, meta description, JSON-LD, and `h1`), theme toggle persistence,
and the `?format=md` negotiation.

Run on Chromium desktop **and** a mobile viewport project.

**Assertion discipline** — from `.claude/LESSONS.md`, and it has already cost
one session a day: assert against `textContent`, not `innerText`. `innerText`
applies CSS `text-transform`, so a heading with Tailwind's `uppercase` will
never match a mixed-case expectation, and the test lies about a page that is
rendering perfectly. When an assertion fails, confirm the failure is real
before acting on it.

### 10.4 Visual and performance checks

- Lighthouse CI on `/`, `/calculator`, `/fuel`, and one SEO page; fail under
  95 performance / 100 accessibility / 100 SEO on mobile.
- `scripts/check-bundle-budget.ts` (§6.1).
- Font metrics are verified in a real browser (the `verify-in-browser` skill),
  never by reading CSS. `document.fonts.check()` does **not** answer "is this
  face available" — it returns true for a fallback.

---

## 11. Tooling and CI

### 11.1 Scripts

```jsonc
{
  "dev": "react-router dev",
  "build": "react-router build && npm run generate:all",
  "generate:all": "npm run generate:sitemap && npm run generate:agent-docs",
  "generate:sitemap": "tsx scripts/generate-sitemap.ts",
  "generate:agent-docs": "tsx scripts/generate-agent-docs.ts",
  "typecheck": "react-router typegen && tsc --noEmit",
  "lint": "eslint . --max-warnings 0",
  "format": "prettier --write .",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:rules": "firebase emulators:exec --only firestore 'vitest run --dir test/rules'",
  "test:e2e": "playwright test",
  "budget": "tsx scripts/check-bundle-budget.ts",
  "verify": "npm run lint && npm run typecheck && npm run test && npm run build && npm run budget"
}
```

`npm run verify` is the gate. Every phase in §13 ends with it passing.

### 11.2 Lint rules that matter

- `no-console` (error) outside `scripts/`, `middleware.ts`, `lib/logger.ts`.
- `no-restricted-imports`: no `@/features/*` barrel imports from `routes/`;
  no `firebase/*` imports outside `server/firebase/` and `server/repositories/`;
  no `react` import inside `domain/`.
- `react-hooks/exhaustive-deps` as an **error**. A suppression is a last
  resort, never an opening move — the fix is usually to move a helper inside
  the hook.
- `react-refresh/only-export-components`: component files export components;
  helpers go in the feature's `utils.ts` from the start.
- `jsx-a11y` recommended set.
- Prettier for formatting (Q-8); `import/order` enforced.

### 11.3 CI (`.github/workflows/ci.yml`) — fixes Q-7, S-12

Jobs, all on push to `main` and on every PR:

1. `verify` — lint, typecheck, unit tests, build, bundle budget.
2. `rules` — Firestore rules tests on the emulator.
3. `e2e` — Playwright, desktop + mobile projects, artifacts on failure.
4. `lighthouse` — Lighthouse CI against the built preview.
5. `audit` — `npm audit --audit-level=high` plus Dependabot/Renovate weekly.

Branch protection requires 1–4 green.

---

## 12. Migration and cutover

1. **Freeze features** on `main` for the build window.
2. **Generate goldens** from the current code (§10.1) *before* deleting it.
3. **No data migration is needed** — collection names and document shapes are
   preserved. A one-off backfill script adds `schemaVersion: 1`, `createdAt`,
   and `updatedAt` to existing documents so the new rules accept updates.
   Run it *before* deploying the stricter rules, and make the `create` rules
   tolerant of legacy docs on `update` for one release.
4. **URL parity is mandatory.** Every URL in the current `sitemap.xml` (46 KB
   of them) must resolve with a 200 in the new app or 301 to a new canonical.
   Write `scripts/check-url-parity.ts` that diffs old sitemap vs new routes and
   fails on any drop. SEO traffic is the business; a broken URL is a real loss.
5. **Deploy order:** backfill script → Cloud Functions → Storage rules →
   Firestore rules → App Check (monitor mode first, then enforce) → the app.
6. **Roll back** by reverting the Vercel deployment; the rules and functions are
   backward-compatible with the old client for one release.

---

## 13. Build order

Each phase ends with `npm run verify` green and a commit. Do not start a phase
before the previous one is green.

| Phase | Deliverable | Checkpoint |
|---|---|---|
| **1. Skeleton** | Repo, Vite + RR7, TS strict, Tailwind 4 + tokens, ESLint/Prettier, Vitest, CI pipeline, `root.tsx` with theme script and error boundary, empty route table | `npm run verify` passes on an app with one page |
| **2. Design system** | `ui/primitives` (button, input, select, slider *with required `thumbLabel`*, dialog, toast, card, accordion, tooltip), `ui/patterns` (Skeleton, EmptyState, ErrorState, Field), layout shell + SideNav + Footer, dark mode | A kitchen-sink page renders every primitive in both themes; axe clean |
| **3. Domain layer** | All of `domain/` ported with **full unit tests and the golden-file suite** | ≥ 90% coverage of `domain/`; goldens match the old app |
| **4. Content system** | `content/` data files, Zod validation, `getContentRoutes()`, sitemap + agent-docs generators, `middleware.ts` | All 80+ routes pre-render; `/x.md` negotiation works; URL parity check passes |
| **5. Public tools** | Pace, VDOT, plan, fuel, elevation — **signed-out paths only**, no Firebase | Every tool works with JS-only state; marketing/SEO bundle budget met with no Firebase chunk requested |
| **6. Auth + data** | Lazy Firebase, App Check, AuthContext, AuthGuard, repositories, TanStack Query, pendingIntent | Rules tests green; sign in, save a plan, reload, see it |
| **7. App surfaces** | Dashboard, settings, onboarding, goals, poster | Dashboard CRUD E2E green, optimistic updates with undo |
| **8. Backend** | Cloud Functions (`onUserDeleted`, `reserveUploadSlot`, `mapboxStaticImage`), storage rules | Delete-account removes everything; upload limit enforced server-side; no Mapbox token in the client bundle |
| **9. Polish** | PWA decision (§6.2 P-9), image pipeline, self-hosted fonts, Lighthouse pass, a11y sweep | All §6.1 budgets and §10.4 thresholds met |
| **10. Cutover** | Parity check, backfill, staged deploy, docs rewrite (`CLAUDE.md`, README, `docs/`) | Old `vite-project/` deleted; docs describe what actually exists (Q-9) |

---

## 14. Acceptance checklist

The rewrite is done when every line is true.

**Performance**
- [ ] No `firebase` chunk is requested on any marketing or SEO route (P-1)
- [ ] `manualChunks` configured; no chunk over 180 KB gzip (P-2)
- [ ] Chart.js is not a dependency (P-3)
- [ ] No JSON file over 20 KB is statically imported (P-4)
- [ ] Total image bytes on `/` under 200 KB; all images AVIF/WebP with dimensions (P-5)
- [ ] Fonts self-hosted, subset, preloaded (P-6)
- [ ] Every Firestore read goes through TanStack Query (P-7)
- [ ] GPX parsing runs in a worker (P-8)
- [ ] PWA either fully wired or fully removed, with docs to match (P-9)
- [ ] Bundle budget enforced in CI (P-10)
- [ ] Lint forbids barrel imports from routes (P-11)

**User experience**
- [ ] Every async surface has skeleton / empty / error / success states (U-1)
- [ ] Route-level error boundaries plus chunk-reload recovery (U-2)
- [ ] One `pendingIntent` module; every `returnTo` points at a real route (U-3)
- [ ] Units are a global preference (U-4)
- [ ] No user-visible failure ends in a stripped `console.error` (U-5)
- [ ] No `text-align: center` leaking from a template (U-6)
- [ ] Dark mode across every page, no flash (U-7)
- [ ] axe: zero serious/critical on every route; `Slider` always has `thumbLabel` (U-8)
- [ ] Every form is Zod + React Hook Form (U-9)
- [ ] Mutations are optimistic with rollback (U-10)

**Security**
- [ ] `elevation_analysis_cache` writes are creator-only, proven by a rules test (S-1)
- [ ] CSP has no `script-src 'unsafe-inline'` and no `unpkg.com` (S-2)
- [ ] CSP sets `frame-ancestors`, `base-uri`, `form-action`, `object-src` (S-3)
- [ ] Rules validate field sets, types, and document size (S-4)
- [ ] Upload rate limit enforced server-side (S-5)
- [ ] App Check enabled and enforced (S-6)
- [ ] `storage.rules` in the repo and deployed (S-7)
- [ ] Account deletion runs in a Cloud Function (S-8)
- [x] AI proxy call has a timeout — already true in `services/gemini.ts`; preserve it through the port (S-9)
- [x] Backend error details never reach the UI — already true; preserve it (S-10)
- [ ] No Mapbox token in the client bundle (S-11)
- [ ] `npm audit` gate in CI (S-12)

**Code quality**
- [ ] No unreachable files; `FuelPlannerV2` and `RacePredictorOverlay` are gone, the latter folded into VDOT (Q-1)
- [ ] One implementation of every formula; the B1 carbs rule is unit-tested (Q-2)
- [ ] `domain/` ≥ 90% unit-tested; golden-file suite passes (Q-3)
- [ ] Every finding inherited from `SECURITY_REVIEW.md`, `ROADMAP.md` or an
      earlier draft of this plan has been re-checked against the code before
      being acted on. Five were already stale when this plan was written
      (S-9, S-10, B3, "zero unit tests", the 6-character password minimum).
      Assume the rest may be too.
- [ ] No file over 400 lines (Q-4)
- [ ] SEO pages are validated data, not a code literal (Q-5)
- [ ] Only `@/` imports (Q-6)
- [ ] CI gates on lint, typecheck, unit, rules, E2E, budget, audit (Q-7)
- [ ] Prettier enforced (Q-8)
- [ ] `CLAUDE.md`, README, and `docs/` describe only what exists — including the PWA state and the real set of sign-in methods (Q-9)
- [ ] The auth-method contradiction in §7.11 is resolved and the code matches the docs (Q-9)
- [ ] No arithmetic in components (Q-10)
- [ ] PostHog only; `react-ga4` not installed (Q-11)

**Parity**
- [ ] Every URL in the old `sitemap.xml` returns 200 or 301
- [ ] `.md` mirrors, `llms.txt`, `llms-full.txt`, `llms-index.json` all present
- [ ] Legacy `/elevationfinder*` URLs still resolve
- [ ] Golden-file outputs match the old app for every calculator

---

## 15. Things the next agent will get wrong unless it reads this

Collected from `.claude/LESSONS.md`, `CLAUDE.md`, and this audit. Carry all of
it into the new `CLAUDE.md`.

1. **`innerText` vs `textContent` in tests.** `innerText` applies CSS
   `text-transform`. A `uppercase` heading will never match a mixed-case
   assertion, and the test will confidently report a broken page that is fine.
2. **`font-synthesis: none` means missing faces fail silently.** Adding
   `font-bold` to markup is not enough — the face has to be in the subset you
   ship. Space Grotesk stops at 700.
3. **Tabular numerals only work on Space Grotesk.** DM Sans has no `tnum`
   table, so any animating or column-aligned number in DM Sans will jitter.
4. **Verify visual changes in a browser, not in the CSS.**
   `document.fonts.check()` returns true for a fallback and answers the wrong
   question.
5. **Do not `pkill -f` a pattern that matches your own command line.**
6. **Scripts that import project code belong in the project**, run with the
   project's resolver — not in a scratch directory with `../../..` paths.
7. **A lint suppression is a last resort, never an opening move.**
8. **Think about chunking before editing a barrel.** Deep-import pure modules;
   reserve barrels for components.
9. **Mapbox is billable per map load.** `StaticRouteMap` is one cached request;
   `MapboxRoutePreview` is a billable load per mount. A call site that replaces
   its points after mount must pass `awaitingPoints` or it buys two images per
   view.
10. **`console.*` is stripped in production.** It is not error handling, and it
    is not a debugging channel for anything a user might hit.
11. **The service worker caches aggressively.** Hard-refresh or unregister when
    testing build output.
12. **SEO limits are hard limits.** Title ≤ 60, description ≤ 160 — now enforced
    at build time instead of by a function someone remembers to call.
