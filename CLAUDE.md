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
│   │   ├── features/       # 12 self-contained feature modules (see below)
│   │   ├── components/     # Shared UI: ui/ (shadcn), layout/, seo/, login/, faq/, elevationfinder/
│   │   ├── pages/          # Route-level components
│   │   ├── lib/            # firebase.ts, seo/ (PSEO system), llm/ (agent-facing content), utils.ts (cn), gpxMetaData.ts
│   │   ├── services/       # gemini.ts (AI nutrition)
│   │   ├── data/           # blog-posts.json, marathon-data.json, faq-data.json
│   │   └── hooks/ types/ utils/ config/
│   ├── e2e/                # Playwright specs + page object models (e2e/pages/)
│   ├── scripts/            # generateSitemap.ts, generateMarkdown.ts, verifyAgentRouting.ts, testGemini.ts
│   ├── middleware.ts       # Vercel edge: Accept negotiation + agent request logging
│   ├── docs/agent-traffic.md   # How to read AI-agent traffic in server logs
│   ├── docs/apple-health.md    # Apple Health import: zip/XML streaming, format quirks
│   └── vite.config.ts      # @ alias → ./src; prerender routes come from lib/llm/page-docs
├── .github/workflows/e2e.yml   # CI: Playwright on push to main + PRs
├── firebase.json / firestore.rules
└── vercel.json
```

**Features** (`src/features/`): `auth`, `pace-calculator`, `vdot-calculator`, `plan` (training plan builder, `plan-math.ts`), `goals`, `elevation`, `fuel`, `dashboard`, `blog`, `poster`, `seo-pages` (PSEO configs), `health-import` (Apple Health export parsing).

Each feature is self-contained: `components/`, `hooks/`, `types.ts`, optional `utils.ts`, public API via `index.ts` barrel. Import as `@/features/[name]`.

## Tech Stack

React 18 + TypeScript 5.6, Vite 5 (PWA + prerender plugins), React Router 7, Tailwind CSS 3.4, shadcn/ui + Radix, Firebase 11 (Auth/Firestore/Storage), Chart.js, Mapbox (Static Images + GL JS), Zod + React Hook Form, Google Gemini API, PostHog + GA4, Playwright.

## Routes (src/App.tsx)

```
/calculator, /calculator/:seoSlug     Pace calculator + PSEO landings
/vdot                                 VDOT calculator
/plan, /plan/:seoSlug                 Training plan builder + PSEO landings
/fuel, /fuel/:seoSlug                 Fuel planner + PSEO landings
/race, /race/:raceSlug                Race index + race prep pages
/elevation-finder[/:docId], /elevation-finder/guides/:seoSlug   GPX analysis
/import                               Apple Health export import (on-device)
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

- **New page**: component in `src/pages/` → route in `src/App.tsx` → nav in `src/components/layout/SideNav.tsx` + `layout/constants/navLinks.ts` → if it needs static generation, add the path to `getAllDocPaths()` in `src/lib/llm/page-docs.ts` (`vite.config.ts` reads that list) and give it a case in `getContentBlocks()` so it prerenders real content instead of the generic fallback.
- **New feature**: folder in `src/features/[name]/` with barrel `index.ts`.
- **Protect a route**: wrap with `<AuthGuard>` in `App.tsx`.
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

Two webfonts, loaded from Google Fonts in `vite-project/index.html`: **DM Sans** (body, Tailwind `font-sans`) and **Space Grotesk** (headings, Tailwind `font-display`, plus an `h1`–`h6` rule in `index.css`'s `@layer base`).

`:root` in `index.css` sets `font-synthesis: none`. That is deliberate — it avoids ugly faux-bold and faux-oblique — but it means **any face missing from the font URL fails silently rather than being faked**. Adding a weight or style to markup is not enough; it has to be in the request too. Known consequences:

- **Space Grotesk stops at 700.** Google Fonts returns HTTP 400 for a request at 800. `font-extrabold` or `font-black` on a heading silently renders as 700 — pick `font-bold` instead, or switch the element to a family that goes heavier.
- **Italics need the `1,...` axis** on DM Sans (`ital,opsz,wght@0,...;1,...`). Drop it and every `italic` element renders upright, with no error anywhere.
- **Space Grotesk has a `tnum` table; DM Sans does not.** So `font-variant-numeric: tabular-nums` works on Space Grotesk and is a no-op on DM Sans. Any column of numbers, and anything that animates through digits, must use Space Grotesk or it will jitter.
- **Always give a webfont a fallback stack.** A bare `font-family: "Space Grotesk"` falls back to the browser default *serif* when the font fails to load, which looks nothing like the design. In `feature-shots.css` use the `--display` / `--mono` custom properties rather than naming families inline.

Verify font changes by measuring rendered metrics in a browser, not by reading the CSS — see the `verify-in-browser` skill. `document.fonts.check()` in particular does **not** answer "is this face available".

## Gotchas

- `console.*` calls are stripped in production builds (esbuild config in `vite.config.ts`).
- Maps fall back to a tile-free SVG course outline (`RouteSketch`) without a valid `VITE_MAPBOX_TOKEN`.
- **All Mapbox access goes through `src/lib/mapbox/`** — one CDN loader, one rolling request budget, one IndexedDB image cache. Never call `api.mapbox.com` or construct a `mapboxgl.Map` outside it, or that usage is unmetered. Default to `StaticRouteMap` (one cheap, cached API request); use `MapboxRoutePreview` only when the map must pan/zoom or track a marker, since each mount is a billable map load. A call site that replaces its points after mount (bundled thumbnail → Firestore track) must pass `awaitingPoints`, or it buys two images per view. See `vite-project/docs/mapbox.md`.
- The app is a PWA (Workbox) — hard-refresh or unregister the service worker when testing build output.
- Firebase Auth is Google OAuth only; there is no email/password path.
- Legacy `/elevationfinder` routes must keep working (redirect aliases in `App.tsx`).
- Keep SEO titles under 60 chars and descriptions under 160; run `validateAllPages()` before shipping SEO changes.
- `src/App.css` still carries the Vite template's `#root { text-align: center }`. It cascades into every page, so left-aligned layouts need an explicit `text-left` on their container.
- The Apple Health import (`/import`) parses the user's export **entirely in the browser** — no upload, no Firestore, no `localStorage`. Keep it that way: the file is a whole health record, not just runs. See `vite-project/docs/apple-health.md`.
- shadcn `Slider` wraps Radix: the *thumb* is what receives focus and carries `role="slider"`. An `aria-label` on the root leaves it announced as unnamed — pass `thumbLabel` instead.

## Past Mistakes

`.claude/LESSONS.md` records concrete mistakes from previous sessions (false-negative
DOM assertions, barrel-import chunking, mobile stack order, lint suppressions used as
first resort). Worth a skim before non-trivial work; append to it when a new one bites.
