# CLAUDE.md

Guidance for Claude Code when working in the TrainPace codebase.

## Project Overview

TrainPace (https://www.trainpace.com) is a React/TypeScript web app for runners: training pace calculator, VDOT calculator, training plan builder, GPX elevation analysis, AI race-fuel planner, goals tracking, personal dashboard, race poster generator, and a blog. Deployed on Vercel with 80+ prerendered SEO pages.

## Commands

All commands run from `vite-project/`:

```bash
npm install               # Install dependencies
npm run dev               # Dev server at localhost:5173
npm run build             # TypeScript check (tsc -b) + production build
npm run lint              # ESLint
npm run test               # Vitest unit tests (pure-function/math logic)
npm run test:watch        # Vitest in watch mode
npm run test:e2e          # Playwright E2E tests
npm run test:e2e:ui       # Playwright UI mode
npm run generate-sitemap  # Regenerate sitemap.xml (run when SEO pages change)
```

Verification is `npm run build` + `npm run lint` + `npm run test` + Playwright E2E. Unit tests (Vitest, `vitest.config.ts`) cover pure calculation logic — colocated in `__tests__/` folders next to the module under test (e.g. `vdot-math.ts`, pace-calculator `utils.ts`, `useFuelCalculation.ts`). Hooks with side effects beyond `useMemo`/pure logic aren't unit-tested this way; rely on Playwright E2E for those.

## Structure

```
trainpace/
├── vite-project/           # The app (all work happens here)
│   ├── src/
│   │   ├── features/       # 11 self-contained feature modules (see below)
│   │   ├── components/     # Shared UI: ui/ (shadcn), layout/, seo/, login/, faq/, elevationfinder/
│   │   ├── pages/          # Route-level components
│   │   ├── lib/            # firebase.ts, seo/ (PSEO system), utils.ts (cn), gpxMetaData.ts
│   │   ├── services/       # gemini.ts (AI nutrition)
│   │   ├── data/           # blog-posts.json, marathon-data.json, faq-data.json
│   │   └── hooks/ types/ utils/ config/
│   ├── e2e/                # Playwright specs + page object models (e2e/pages/)
│   ├── scripts/            # generateSitemap.ts, seedBostonMarathon.ts, testGemini.ts
│   └── vite.config.ts      # @ alias → ./src; prerender route list lives here
├── .github/workflows/e2e.yml   # CI: Playwright on push to main + PRs
├── firebase.json / firestore.rules
└── vercel.json
```

**Features** (`src/features/`): `auth`, `pace-calculator`, `vdot-calculator`, `plan` (training plan builder, `plan-math.ts`), `goals`, `elevation`, `fuel`, `dashboard`, `blog`, `poster`, `seo-pages` (PSEO configs).

Each feature is self-contained: `components/`, `hooks/`, `types.ts`, optional `utils.ts`, public API via `index.ts` barrel. Import as `@/features/[name]`.

## Tech Stack

React 18 + TypeScript 5.6, Vite 5 (PWA + prerender plugins), React Router 7, Tailwind CSS 3.4, shadcn/ui + Radix, Firebase 11 (Auth/Firestore/Storage), Chart.js, Leaflet + Mapbox GL, Zod + React Hook Form, Google Gemini API, PostHog + GA4, Playwright.

## Routes (src/App.tsx)

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

- **New page**: component in `src/pages/` → route in `src/App.tsx` → nav in `src/components/layout/SideNav.tsx` + `layout/constants/navLinks.ts` → prerender route in `vite.config.ts` if it needs static generation.
- **New feature**: folder in `src/features/[name]/` with barrel `index.ts`.
- **Protect a route**: wrap with `<AuthGuard>` in `App.tsx`.
- **New SEO page**: add config to `src/features/seo-pages/seoPages.ts` (helpers/validators in `src/lib/seo/` — `generatePageId`, `validateAllPages`). Routing and prerendering pick it up automatically; rerun `npm run generate-sitemap`.
- **Blog post**: append to `src/data/blog-posts.json`.

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

## Gotchas

- `console.*` calls are stripped in production builds (esbuild config in `vite.config.ts`).
- Maps render blank without a valid `VITE_MAPBOX_TOKEN`.
- The app is a PWA (Workbox) — hard-refresh or unregister the service worker when testing build output.
- Firebase Auth is Google OAuth only; there is no email/password path.
- Legacy `/elevationfinder` routes must keep working (redirect aliases in `App.tsx`).
- Keep SEO titles under 60 chars and descriptions under 160; run `validateAllPages()` before shipping SEO changes.
