# TrainPace

**Live:** [www.trainpace.com](https://www.trainpace.com)

[![E2E](https://github.com/aleexwong/trainpace/actions/workflows/e2e.yml/badge.svg)](https://github.com/aleexwong/trainpace/actions/workflows/e2e.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-blue?logo=react)](https://react.dev/)
[![Vercel](https://img.shields.io/badge/deployed%20on-Vercel-black?logo=vercel)](https://vercel.com)

A training platform for self-coached runners. Work out your paces, analyse the course you are actually racing, and plan what to eat on race day. Built and shipped solo: React 18 + TypeScript on the front end, Firebase for auth and data, Vercel for hosting.

---

## What it does

| Feature | What it gives the runner |
|---|---|
| **Pace calculator** | Easy / tempo / speed zones and race predictions from one recent result, in km or miles |
| **VDOT calculator** | Fitness score and equivalent times across distances |
| **Training plan builder** | Week-by-week plans you can edit, save and reload |
| **Course analysis** | Upload a GPX file for elevation profiles, grade-adjusted pace, a difficulty score, and a side-by-side comparison against real race courses |
| **Fuel planner** | Carb and fluid targets by hour, with contextual advice from the Google Gemini API |
| **Goals & dashboard** | Saved routes, plans and fuel strategies, synced across devices |
| **Race poster** | A shareable finish-time graphic |
| **Blog** | 31 training articles, written at CEFR B2 so non-native English speakers can read them |

Every calculator works without an account. Signing in (Google OAuth) adds saving and sync.

---

## Engineering notes

These are the parts worth reading if you are judging the code, not the running advice.

**Feature-scoped modules.** `src/features/` holds 11 self-contained modules (`pace-calculator`, `elevation`, `plan`, `fuel`, `goals`, `vdot-calculator`, `dashboard`, `blog`, `poster`, `auth`, `seo-pages`). Each owns its components, hooks and types, and exposes a public API through a barrel `index.ts`. Business logic lives in hooks; components stay presentational.

**Mapbox on a budget.** Maps are billed per load, so all Mapbox access goes through one module (`src/lib/mapbox/`) with a single CDN loader, a rolling request budget and an IndexedDB image cache. The default is a static cached image; the interactive GL map is only mounted when panning or marker tracking is genuinely needed. Without a token the app degrades to a tile-free SVG course outline instead of breaking. Details in [`docs/mapbox.md`](vite-project/docs/mapbox.md).

**Programmatic SEO.** 77 landing-page configs in `src/features/seo-pages/` generate routes, metadata and a sitemap from one source. Validators enforce title and description limits before anything ships.

**Readable by AI agents.** A Vercel edge middleware negotiates on `Accept`, so an agent asking for Markdown gets a `.md` mirror of the page instead of a JS shell. The build emits those mirrors and an `llms-full.txt` from the same content blocks that render the HTML, so the two cannot drift. `npm run verify-agent-routing` checks the mapping.

**Testing and CI.** Playwright end-to-end specs with page-object models cover auth, the fuel planner, the training plan and race plan flows. GitHub Actions runs them on every push to `main` and every PR. Verification is `npm run build` (which includes `tsc -b`) + `npm run lint` + Playwright.

**Type safety throughout.** TypeScript strict mode, Zod schemas behind React Hook Form, and runtime validation on anything parsed from a GPX file or an external API.

---

## Stack

React 18 · TypeScript 5.6 · Vite 5 (PWA + prerender plugins) · React Router 7 · Tailwind CSS · shadcn/ui + Radix · Firebase 11 (Auth / Firestore / Storage) · Chart.js · Mapbox (Static Images + GL JS) · Zod + React Hook Form · Google Gemini · PostHog + GA4 · Playwright · Vercel

---

## Running it locally

```bash
git clone https://github.com/aleexwong/trainpace.git
cd trainpace/vite-project
npm install
cp .env.example .env   # fill in the values below
npm run dev            # http://localhost:5173
```

Set in `vite-project/.env`:

```
VITE_FIREBASE_API_KEY            # auth + Firestore
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_MAPBOX_TOKEN                # public token - restrict it by hostname
VITE_GPX_API_URL                 # backend API for GPX + Gemini calls
```

The Gemini key is deliberately **not** here. AI fuel suggestions go through the backend API so the key never ships in the client bundle. The Mapbox token has to ship, so it is a public token that should be locked to your own hostnames in the Mapbox dashboard - the in-app request budget caps ordinary browsers, but only the URL restriction stops a copied token.

### Scripts

```bash
npm run build                 # tsc -b + production build + Markdown mirrors
npm run lint                  # ESLint
npm run test:e2e              # Playwright
npm run test:e2e:ui           # Playwright UI mode
npm run generate-sitemap      # regenerate sitemap.xml after SEO changes
npm run verify-agent-routing  # check Accept negotiation + .md path mapping
```

---

## Layout

```
vite-project/
├── src/
│   ├── features/     11 feature modules, each with a barrel index.ts
│   ├── components/   shared UI: ui/ (shadcn), layout/, seo/
│   ├── pages/        route-level components
│   ├── lib/          firebase, seo/, mapbox/, llm/ (agent-facing content)
│   ├── services/     gemini.ts
│   └── data/         blog posts, marathon data, FAQ
├── e2e/              Playwright specs + page object models
├── scripts/          sitemap, Markdown mirrors, agent-routing checks
├── docs/             mapbox.md, agent-traffic.md
└── middleware.ts     Vercel edge: Accept negotiation + agent logging
```

---

## License

Open source for educational use. Learn from it, borrow snippets with attribution.

Pace maths follows Jack Daniels' *Running Formula*. Built with [shadcn/ui](https://ui.shadcn.com/), [Mapbox](https://www.mapbox.com/), [Firebase](https://firebase.google.com/) and [Vercel](https://vercel.com/).
