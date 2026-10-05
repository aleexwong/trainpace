# CLAUDE.md

Guidance for Claude Code when working in the TrainPace codebase.

## Project Overview

TrainPace (https://www.trainpace.com) is a React/TypeScript web app for runners: training pace calculator, VDOT calculator, training plan builder, GPX elevation analysis, AI race-fuel planner, goals tracking, personal dashboard, race poster generator, and a blog. Deployed on Vercel with 80+ prerendered SEO pages.

## Commands

All commands run from `vite-project/`:

```bash
npm install               # Install dependencies
npm run dev               # Dev server at localhost:5173
npm run build             # tsc -b + production build + Markdown mirrors
npm run lint              # ESLint
npm run test:e2e          # Playwright E2E tests
npm run test:e2e:ui       # Playwright UI mode
npm run generate-sitemap  # Regenerate sitemap.xml (run when SEO pages change)
npm run generate-markdown # Write dist/**.md mirrors + llms-full.txt (part of `build`)
npm run verify-agent-routing  # Check Accept negotiation + .md path mapping
```

There are no unit tests — verification is `npm run build` + `npm run lint` + Playwright E2E.

## Structure

```
trainpace/
├── vite-project/           # The app (all work happens here)
│   ├── src/
│   │   ├── features/       # 11 self-contained feature modules (see below)
│   │   ├── components/     # Shared UI: ui/ (shadcn), layout/, seo/, login/, faq/, elevationfinder/
│   │   ├── pages/          # Route-level components
│   │   ├── lib/            # firebase.ts (app+auth), firestore.ts, storage.ts, lazyRoute.tsx, seo/ (PSEO system), llm/ (agent-facing content), utils.ts (cn), gpxMetaData.ts
│   │   ├── services/       # gemini.ts (AI nutrition)
│   │   ├── data/           # blog-posts.json, marathon-data.json, faq-data.json
│   │   └── hooks/ types/ utils/ config/
│   ├── e2e/                # Playwright specs + page object models (e2e/pages/)
│   ├── scripts/            # generateSitemap.ts, generateMarkdown.ts, verifyAgentRouting.ts, testGemini.ts
│   ├── middleware.ts       # Vercel edge: Accept negotiation + agent request logging
│   ├── docs/agent-traffic.md   # How to read AI-agent traffic in server logs
│   └── vite.config.ts      # @ alias → ./src; prerender routes come from lib/llm/page-docs
├── .github/workflows/e2e.yml   # CI: Playwright on push to main + PRs
├── firebase.json / firestore.rules
└── vercel.json
```

**Features** (`src/features/`): `auth`, `pace-calculator`, `vdot-calculator`, `plan` (training plan builder, `plan-math.ts`), `goals`, `elevation`, `fuel`, `dashboard`, `blog`, `poster`, `seo-pages` (PSEO configs).

Each feature is self-contained: `components/`, `hooks/`, `types.ts`, optional `utils.ts`, public API via `index.ts` barrel. Import as `@/features/[name]`.

## Tech Stack

React 18 + TypeScript 5.6, Vite 5 (PWA + prerender plugins), React Router 7, Tailwind CSS 3.4, shadcn/ui + Radix, Firebase 11 (Auth/Firestore/Storage), Chart.js, Mapbox (Static Images + GL JS), Zod + React Hook Form, Google Gemini API, PostHog + GA4, Playwright.

## Routes (src/routes.tsx)

```
/calculator, /calculator/:seoSlug     Pace calculator + PSEO landings
/vdot                                 VDOT calculator
/plan, /plan/:seoSlug                 Training plan builder + PSEO landings
/fuel, /fuel/:seoSlug                 Fuel planner + PSEO landings
/race, /race/:raceSlug                Race index + race prep pages
/elevation-finder[/:docId], /elevation-finder/guides/:seoSlug   GPX analysis
/dashboard, /onboarding, /settings    AuthGuard-protected
/blog, /blog/:slug                    Blog
/preview-route/:slug                  Marathon route previews
/login /register /logout /reset-password   Auth
/faq /privacy /terms /about /ethos    Static
*                                     Landing (fallback)
```

## Conventions

- Components `PascalCase`, hooks `useCamelCase`, utilities `camelCase`, types/interfaces `PascalCase`.
- Business logic lives in custom hooks; components stay presentational.
- Forms: Zod schema + React Hook Form.
- Auth state via `useAuth()` from `src/features/auth/AuthContext.tsx` (Google OAuth only).
- Persistence: localStorage for guest/preferences, Firestore for signed-in users.
- shadcn/ui components in `src/components/ui/` are **copied source, not npm packages** — add new ones by pasting from the shadcn docs, never via CLI.
- `cn()` from `src/lib/utils.ts` for conditional classnames.

## Common Tasks

- **New page**: component in `src/pages/` → declare it with `lazyRoute()` in `src/routePages.ts` → route in `src/routes.tsx` → nav in `src/components/layout/SideNav.tsx` + `layout/constants/navLinks.ts` → if it needs static generation, add the path to `getAllDocPaths()` in `src/lib/llm/page-docs.ts` (`vite.config.ts` reads that list) and give it a case in `getContentBlocks()` so it prerenders real content instead of the generic fallback.
- **New feature**: folder in `src/features/[name]/` with barrel `index.ts`.
- **Protect a route**: wrap with `<AuthGuard>` in `src/routes.tsx`.
- **New SEO page**: add config to `src/features/seo-pages/seoPages.ts` (helpers/validators in `src/lib/seo/` — `generatePageId`, `validateAllPages`). Routing and prerendering pick it up automatically; rerun `npm run generate-sitemap`.
- **Blog post**: append to `src/data/blog-posts.json`.
- **Prerendered page copy**: edit `src/lib/llm/page-docs.ts`, not `prerender.jsx`. One block model feeds the static HTML, the `.md` mirror, and `llms-full.txt`.

## Environment

Required in `vite-project/.env` (see `.env.example`): `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_MAPBOX_TOKEN`.

## Subagent Model Selection

When delegating work to subagents (Task tool or `.claude/agents/*.md` definitions), pick the model by task complexity — don't run everything on the most expensive model:

| Model | Alias | Full ID | Use for |
|-------|-------|---------|---------|
| Claude Opus | `opus` | `claude-opus-4-8` | Complex reasoning: architecture decisions, cross-feature refactors, debugging subtle state/async bugs, security review |
| Claude Sonnet | `sonnet` | `claude-sonnet-5` | Default workhorse: feature implementation, component work, test writing, code review |
| Claude Haiku | `haiku` | `claude-haiku-4-5` | Fast/cheap tasks: file search, codebase exploration, lint fixes, simple renames, summarizing files |

Example subagent definition (`.claude/agents/explorer.md`):

```yaml
---
name: explorer
description: Read-only codebase search and summarization
model: haiku
tools: Read, Grep, Glob
---
```

Guidelines:
- Use `haiku` for read-only exploration fanned out in parallel — it's the cheapest way to map unfamiliar code.
- Use `sonnet` for scoped, well-specified implementation subtasks.
- Reserve `opus` for tasks where a wrong answer is expensive (data model changes, Firestore rules, SEO system changes).
- Prefer the alias (`opus`/`sonnet`/`haiku`) in agent frontmatter so definitions track the latest model automatically.

## Typography

Two webfonts, **self-hosted** from `@fontsource-variable/*` via `@font-face` rules in `vite-project/src/fonts.css` (imported first in `main.tsx`): **DM Sans** (body, Tailwind `font-sans`) and **Space Grotesk** (headings, Tailwind `font-display`, plus an `h1`–`h6` rule in `index.css`'s `@layer base`). `fonts.css` keeps the plain family names (Fontsource's own CSS says "… Variable"), so the Tailwind config and font stacks stay unchanged. `preloadFonts()` in `vite.config.ts` preloads the Space Grotesk latin file, and the build fails if that file name stops matching.

**Do not go back to Google Fonts.** The CSP in `vercel.json` (`style-src`, `font-src 'self'`) blocks `fonts.googleapis.com` / `fonts.gstatic.com`, so production silently rendered every page in fallback fonts while that was the source. Any third-party font or stylesheet needs a CSP change too, and must be verified against the deployed headers.

`:root` in `index.css` sets `font-synthesis: none`. That is deliberate — it avoids ugly faux-bold and faux-oblique — but it means **any face missing from `fonts.css` fails silently rather than being faked**. Adding a weight or style to markup is not enough; there has to be an `@font-face` for it too. Known consequences:

- **Space Grotesk stops at 700.** Its variable `wght` axis ends there, so `font-extrabold` or `font-black` on a heading silently renders as 700 — pick `font-bold` instead, or switch the element to a family that goes heavier.
- **Italics need the `font-style: italic` faces** for DM Sans in `fonts.css` (the `*-opsz-italic.woff2` files). Drop them and every `italic` element renders upright, with no error anywhere.
- **Space Grotesk has a `tnum` table; DM Sans does not.** So `font-variant-numeric: tabular-nums` works on Space Grotesk and is a no-op on DM Sans. Any column of numbers, and anything that animates through digits, must use Space Grotesk or it will jitter.
- **Always give a webfont a fallback stack.** A bare `font-family: "Space Grotesk"` falls back to the browser default *serif* when the font fails to load, which looks nothing like the design. In `feature-shots.css` use the `--display` / `--mono` custom properties rather than naming families inline.

Verify font changes by measuring rendered metrics in a browser, not by reading the CSS — see the `verify-in-browser` skill. `document.fonts.check()` in particular does **not** answer "is this face available".

## Gotchas

- `console.*` calls are stripped in production builds (esbuild config in `vite.config.ts`).
- Maps fall back to a tile-free SVG course outline (`RouteSketch`) without a valid `VITE_MAPBOX_TOKEN`.
- **All Mapbox access goes through `src/lib/mapbox/`** — one CDN loader, one rolling request budget, one IndexedDB image cache. Never call `api.mapbox.com` or construct a `mapboxgl.Map` outside it, or that usage is unmetered. Default to `StaticRouteMap` (one cheap, cached API request); use `MapboxRoutePreview` only when the map must pan/zoom or track a marker, since each mount is a billable map load. A call site that replaces its points after mount (bundled thumbnail → Firestore track) must pass `awaitingPoints`, or it buys two images per view. See `vite-project/docs/mapbox.md`.
- The app is a PWA (Workbox) — hard-refresh or unregister the service worker when testing build output.
- Firebase Auth is Google OAuth only; there is no email/password path.
- Legacy `/elevationfinder` routes must keep working (redirect aliases in `src/routes.tsx`).
- **Import `db` from `@/lib/firestore` and `storage` from `@/lib/storage`, never from `@/lib/firebase`.** `firebase.ts` is app + Auth only because it is in the entry chunk; re-exporting Firestore from it puts the whole Firestore SDK back on every page.
- **Declare route pages with `lazyRoute()`, not `React.lazy`.** `main.tsx` preloads the current route's chunk before the first render, so the prerendered HTML stays up until the real page can replace it (no Suspense spinner, no footer jump), and internal links preload their chunk on hover/focus. A page made with plain `lazy()` loses both.
- `vite.config.ts` puts React + React Router in a `react-vendor` chunk on purpose. Without it Rollup bundles React into the chunk shared with `prerender.jsx`, and every visitor downloads all SEO page configs to get React.
- Keep SEO titles under 60 chars and descriptions under 160; run `validateAllPages()` before shipping SEO changes.
- `src/App.css` still carries the Vite template's `#root { text-align: center }`. It cascades into every page, so left-aligned layouts need an explicit `text-left` on their container.
- shadcn `Slider` wraps Radix: the *thumb* is what receives focus and carries `role="slider"`. An `aria-label` on the root leaves it announced as unnamed — pass `thumbLabel` instead.

## Past Mistakes

`.claude/LESSONS.md` records concrete mistakes from previous sessions (false-negative
DOM assertions, barrel-import chunking, mobile stack order, lint suppressions used as
first resort). Worth a skim before non-trivial work; append to it when a new one bites.
