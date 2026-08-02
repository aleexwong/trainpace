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
npm run lint              # ESLint — warnings are errors, CI fails on any
npm test                  # Vitest unit tests (src/**/*.test.ts)
npm run test:watch        # Vitest in watch mode
npm run check:seo-routes  # Assert sitemap ↔ prerender ↔ robots.txt agree
npm run verify            # build + lint + test + check:seo-routes (what CI runs)
npm run test:e2e          # Playwright E2E tests
npm run test:e2e:ui       # Playwright UI mode
npm run generate-sitemap  # Regenerate sitemap.xml (run when routes change)
```

**Verification is `npm run verify`.** That is exactly what the `verify` job in
`.github/workflows/e2e.yml` runs, gating the Playwright job behind it. Unit tests live
next to the code they cover in `__tests__/` directories and run under Vitest; `e2e/` is
Playwright's alone (`vitest.config.ts` excludes it — the two runners' `test.describe`
are not interchangeable).

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
- Auth state via `useAuth()` from `src/features/auth/AuthContext.tsx`.
- Persistence: localStorage for guest/preferences, Firestore for signed-in users.
- shadcn/ui components in `src/components/ui/` are **copied source, not npm packages** — add new ones by pasting from the shadcn docs, never via CLI.
- `cn()` from `src/lib/utils.ts` for conditional classnames.

## Common Tasks

- **New page**: component in `src/pages/` → route in `src/App.tsx` → nav in the `links` array in `src/components/layout/SideNav.tsx` → if it should be crawlable, add it to `STATIC_ROUTES` in `src/lib/seo/routes.ts` (that one list drives both prerendering and the sitemap).
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

## Typography

Two webfonts, loaded from Google Fonts in `vite-project/index.html`: **DM Sans** (body, Tailwind `font-sans`) and **Space Grotesk** (headings, Tailwind `font-display`, plus an `h1`–`h6` rule in `index.css`'s `@layer base`).

`:root` in `index.css` sets `font-synthesis: none`. That is deliberate — it avoids ugly faux-bold and faux-oblique — but it means **any face missing from the font URL fails silently rather than being faked**. Adding a weight or style to markup is not enough; it has to be in the request too. Known consequences:

- **Space Grotesk stops at 700.** Google Fonts returns HTTP 400 for a request at 800. `font-extrabold` or `font-black` on a heading silently renders as 700 — pick `font-bold` instead, or switch the element to a family that goes heavier.
- **Italics need the `1,...` axis** on DM Sans (`ital,opsz,wght@0,...;1,...`). Drop it and every `italic` element renders upright, with no error anywhere.
- **Space Grotesk has a `tnum` table; DM Sans does not.** So `font-variant-numeric: tabular-nums` works on Space Grotesk and is a no-op on DM Sans. Any column of numbers, and anything that animates through digits, must use Space Grotesk or it will jitter.
- **Always give a webfont a fallback stack.** A bare `font-family: "Space Grotesk"` falls back to the browser default *serif* when the font fails to load, which looks nothing like the design. In `feature-shots.css` use the `--display` / `--mono` custom properties rather than naming families inline.

Verify font changes by measuring rendered metrics in a browser, not by reading the CSS — see the `verify-in-browser` skill. `document.fonts.check()` in particular does **not** answer "is this face available".

## Gotchas

- **`console.*` is stripped from production builds** (`esbuild.drop` in `vite.config.ts`), so
  a `catch` that only calls `console.error` becomes an empty block in the deployed app —
  the failure is invisible to the user, the logs, and you. `no-console` is therefore an
  ESLint **error**. Use one of:
  - `reportError(err, { scope: "feature.operation" })` from `@/lib/reportError` — captures
    to PostHog and survives the production build. Use it in every catch that swallows a
    failure. It is not user feedback: still show a toast if the user is blocked.
  - `debug(...)` / `debugWarn(...)` from `@/lib/debug` — dev-only traces, compiled out.
  Never pass GPX contents, tokens, or emails as `reportError` context — ids and counts only.
- Maps render blank without a valid `VITE_MAPBOX_TOKEN`.
- **Crawlable routes have one source of truth**: `src/lib/seo/routes.ts`. It feeds the
  prerender list in `vite.config.ts` *and* `scripts/generateSitemap.ts`, so the two cannot
  drift the way they used to. Never add a URL to only one. Auth-gated paths must not be
  listed — they are `Disallow`ed in `robots.txt`, and `npm run check:seo-routes` fails on
  a sitemap URL that robots blocks, that routes.ts doesn't declare, or that has no
  prerendered HTML in `dist/`.
- **`gpx_uploads` docs hold the full GPX trace and are gated on an `isPublic` flag.**
  Reads resolve for the owner, or for anyone when `isPublic` is true; docs predating the
  flag default to public so old share links keep working (`firestore.rules` uses
  `.get('isPublic', true)`). Flipping that default requires a backfill first.
- The app is a PWA (Workbox) — hard-refresh or unregister the service worker when testing build output.
- Firebase Auth supports **both** Google OAuth and email/password. Google is the
  primary path (`LoginButton.tsx`, `signInWithPopup`), but the email/password path is
  live and routed: `Login.tsx` (`signInWithEmailAndPassword`), `Register.tsx`
  (`createUserWithEmailAndPassword`), `ResetPassword.tsx` and `Settings.tsx`
  (`sendPasswordResetEmail`), plus `/register`, `/reset-password`, `/reset-confirmed`.
  `e2e/auth.spec.ts` covers it. Changes to auth must account for both.
- Legacy `/elevationfinder` routes must keep working (redirect aliases in `App.tsx`).
- Keep SEO titles under 60 chars and descriptions under 160; run `validateAllPages()` before shipping SEO changes.
