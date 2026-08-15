# Changelog

TrainPace has been continuously deployed since November 2024 and was never tagged, so
these versions are **retroactive groupings, not releases that happened**. Boundaries were
cut at feature arcs — where the work moved from one area of the app to another — and
dates are the first and last commit in each arc. Gaps between arcs are real; this was a
side project with dormant stretches of up to 39 days.

Generated from 471 commits spanning 2024-11-24 to 2026-08-13. Cleanup, formatting, merge
and reverted commits (160 of the 471) are not listed.

---

## 0.11 — Plan builder and agent legibility · 2026-07-01 → 2026-08-13

### Added
- Drag-and-drop workout rescheduling on a calendar view of the generated plan.
- Workout completion tracking, with a "This Week" view that surfaces only what's next.
- Generated plans now persist for signed-out visitors and survive signing in.
- Grade-adjusted pace on uploaded routes, plus comparison against reference race courses.
- Human-readable, editable URLs for uploaded elevation routes, replacing opaque document IDs.
- Competitor comparison landing pages, cross-linked into the existing SEO set.
- `/mcp` — setup documentation for the public TrainPace MCP server, with copy-paste
  configuration for Claude Code and other agent harnesses.
- `llms.txt`, an AI-crawler-explicit `robots.txt`, and Markdown mirrors of every page,
  served to agents that send `Accept: text/markdown`.

### Changed
- Training plan page rebuilt: two-column desktop layout, segmented mobile view that
  halves scroll length.
- Marathon fuel plans now allow up to 100 g of carbohydrate per hour, up from the
  previous ceiling.

### Fixed
- "Upload New Route" was inert when viewing a route shared by someone else.
- Landing page italics rendered upright and feature-shot numerals fell back to a generic
  monospace face — both caused by webfont requests that omitted the faces the markup used.
- Elevation tooltip escaped its card on narrow viewports.

## 0.10 — Goals and training plans · 2026-05-01 → 2026-06-11

### Added
- Training Plan Generator: periodized plans built from a goal race and current fitness,
  cross-linked with the VDOT and pace calculators.
- Training goals with an onboarding flow and settings, feeding pre-filled values into the
  plan generator and dashboard.
- Shareable pace calculator URLs (`/calculator?d=km&t=secs`).
- Training plan SEO landing pages, including 16-week marathon, 20-week marathon, and
  beginner half variants.
- Calendar export for generated plans.

### Changed
- Pace calculator reworked toward a Runna/Strava-style flow: suggested times, a VDOT
  badge, and a time slider replacing raw numeric entry.
- Colour scheme moved from blue to emerald across the app.
- Route components now load lazily, with a loading state in the main layout.
- Elevation profiles are downsampled before charting, cutting render cost on large GPX files.

### Fixed
- Deleting an account left saved training plans behind.
- VDOT page pointed its canonical URL at a path that no longer existed.
- GPX validation rejected valid GPX 1.1 elements while trying to block executable tags.

## 0.9 — VDOT calculator and test infrastructure · 2026-03-01 → 2026-04-30

### Added
- VDOT calculator implementing Daniels' Running Formula, with its own landing page,
  FAQ schema, and breadcrumbs.
- Playwright end-to-end tests covering the core user flows, running in GitHub Actions on
  every push and pull request.
- Four fuel-planner SEO pages targeting calculator and product-specific queries.
- Eleven blog posts, including a running cadence explainer.

### Changed
- E2E workflow caches Playwright browsers and Vite prebundle artifacts.

### Fixed
- Content Security Policy blocked PostHog, Leaflet, Unsplash, Google Analytics, and the
  TinyLaunch badge.

## 0.8 — Programmatic SEO and blog · 2026-01-01 → 2026-02-28

### Added
- Configuration-driven SEO page system: typed page configs with build-time validation,
  generating landing pages for calculators, elevation guides, and race prep from a single
  source. 79 page configs currently feed it.
- Markdown-based blog with related-article surfacing.
- Structured data schemas across the app for search rich snippets.
- Race pages carrying pace strategy, fuelling notes, and FAQ schema.
- Time-goal race pages, and Oslo Marathon route data.
- Race poster generator with customisable templates and map integration.

### Changed
- Terms of Service rewritten for readability.

### Fixed
- Security review findings addressed across the codebase, including Firestore access rules.

## 0.7 — Fuel and poster polish · 2025-12-01 → 2025-12-31

### Added
- Fuelling timeline and product reference in the fuel planner.
- Custom carbohydrate input and a weight unit toggle.
- Unsaved-changes confirmation and collapsible sections in the poster generator.

### Changed
- Page titles and meta descriptions rewritten for clarity.

## 0.6 — Dashboard and landing rebuild · 2025-11-01 → 2025-11-30

### Added
- Saved fuel plans and pace plans on the dashboard, with pagination.
- Heart rate zones, elevation, and weather adjustments in the pace calculator.
- Site search.
- Poster generator v3: automatic city detection by reverse geocoding, with request
  caching and throttling.
- Animated marquee of real marathon routes on the landing page, each one clickable.

### Changed
- Landing page redesigned.
- Placeholder testimonials replaced with real features and routes.
- Analytics moved from Amplitude to PostHog.
- Registration, password reset, and login now return readable error messages.

### Fixed
- Prerendered pages emitted duplicate meta tags, conflicting with the runtime SEO layer.
- Mobile menu left the body scrollable underneath it.

## 0.5 — AI fuel planner · 2025-09-30 → 2025-10-31

### Added
- Fuel Planner v2 with AI-generated recommendations, gated behind sign-in.
- Auto-save for fuel plans created before signing in.
- About page and an expanded FAQ with dropdown navigation.
- Structured data on the landing page.

### Changed
- Pace calculator and elevation analysis reorganised into self-contained feature modules.
- Vercel configuration reworked for caching.

## 0.4 — Race posters and prerendering · 2025-08-20 → 2025-09-29

### Added
- Preview Routes: browsable pages for major marathon courses, backed by route data
  rather than hardcoded markup. 18 courses currently.
- Race poster generator built on Mapbox, with custom map styles and marker toggles.
- Static prerendering for SEO, with a fallback component for crawlers.
- Open Graph and Twitter Card metadata.

### Fixed
- `www.trainpace.com` redirect handling.
- `robots.txt` blocked PWA files and assets.

## 0.3 — Elevation Finder · 2025-06-15 → 2025-08-19

### Added
- GPX upload with drag-and-drop, producing an interactive elevation profile and grade
  analysis.
- Route visualisation on Mapbox.
- Dashboard listing saved routes.
- Share links for analysed routes.
- Account settings page, behind an auth guard.

### Changed
- Analysis results are cached client-side; repeated views no longer re-request.
- Upload endpoint rate-limited.

### Fixed
- Large GPX files were mishandled at the size threshold.

## 0.2 — Accounts · 2025-05-14 → 2025-06-14

### Added
- Firebase authentication: login, registration, logout, and password reset.
- Ethos page.
- Per-page metadata via Helmet.

### Changed
- Navigation lifted out of the landing page into a shared layout.
- Scroll position resets on route change.

## 0.1 — Pace calculator · 2024-11-24 → 2025-05-13

### Added
- Training pace calculator producing Easy, Tempo, Maximum, Speed, and Extra Long paces
  from a single race result.
- Yasso 800s interval paces.
- Kilometre and mile units.
- Explanatory tooltips on every pace zone.
- FAQ modal.
- Installable as a PWA.

### Fixed
- Yasso 800 calculations were wrong.
- Extra-long pace didn't match the reference table it claimed to follow.
- Mobile inputs accepted text and rejected decimals; numeric keyboards weren't requested.
