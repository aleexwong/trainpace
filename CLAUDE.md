# CLAUDE.md

This file provides guidance for Claude Code when working with the TrainPace codebase.

## Project Overview

TrainPace is a React/TypeScript web application for runners that provides:
- **Training Pace Calculator** - Science-backed pace zones from race times
- **VDOT Calculator** - Jack Daniels VDOT scoring with What-If explorer and history
- **Course Elevation Analysis** - GPX file upload and visualization
- **Race Fuel Planner** - Personalized AI-powered nutrition recommendations
- **Personal Dashboard** - User data management with Firebase
- **Race Poster Generator** - Custom race poster creation (premium feature)
- **Blog** - Running content with 10+ articles

**Live site**: https://www.trainpace.com

## Quick Reference

### Commands

All commands run from the `vite-project/` directory:

```bash
cd vite-project
npm install               # Install dependencies
npm run dev               # Start dev server at localhost:5173
npm run build             # TypeScript check + production build
npm run lint              # Run ESLint
npm run preview           # Preview production build
npm run host              # Expose dev server on network
npm run generate-sitemap  # Regenerate sitemap.xml (vite-node)
npm run test:e2e          # Run Playwright E2E tests
npm run seed-boston       # Seed Boston Marathon route data
npm run test-gemini       # Test Gemini API integration
```

### Project Structure

```
trainpace/
├── vite-project/                   # Main application
│   ├── src/
│   │   ├── features/               # Feature modules (9 features)
│   │   │   ├── auth/               # Firebase Auth + Google OAuth
│   │   │   ├── pace-calculator/    # Training pace zones from race time
│   │   │   ├── vdot-calculator/    # Jack Daniels VDOT scoring
│   │   │   ├── elevation/          # GPX analysis
│   │   │   ├── fuel/               # Race fueling planner
│   │   │   ├── dashboard/          # User data management
│   │   │   ├── blog/               # Blog content
│   │   │   ├── poster/             # Race poster generator
│   │   │   └── seo-pages/          # Programmatic SEO page configs
│   │   ├── components/             # Shared UI components
│   │   │   ├── ui/                 # shadcn/ui primitives (copied, not npm)
│   │   │   ├── layout/             # MainLayout, SideNav, Footer, Landing
│   │   │   ├── seo/                # SEO templates and structured data
│   │   │   ├── login/              # Auth UI components
│   │   │   ├── elevationfinder/    # Elevation-specific shared UI
│   │   │   ├── faq/                # FAQ accordion components
│   │   │   └── utils/              # MapboxRoutePreview, LeafletRoutePreview
│   │   ├── pages/                  # Route-level components (18 pages)
│   │   ├── hooks/                  # Global custom hooks
│   │   ├── lib/
│   │   │   ├── seo/                # Scalable SEO system (4,127 lines)
│   │   │   ├── firebase.ts         # Firebase initialization
│   │   │   ├── GoogleAnalytics.tsx # GA4 integration
│   │   │   ├── gpxMetaData.ts      # GPX file parsing
│   │   │   └── utils.ts            # Utility functions (cn for classnames)
│   │   ├── services/
│   │   │   └── gemini.ts           # Google Gemini AI integration
│   │   ├── types/                  # Global TypeScript types
│   │   ├── utils/                  # Shared utilities (geocoding, difficulty)
│   │   ├── config/
│   │   │   └── routes.ts           # Firebase ID migration helpers
│   │   └── data/                   # Static data files
│   │       ├── blog-posts.json     # 82KB - All blog content
│   │       ├── marathon-data.json  # 65KB - Race course data
│   │       └── faq-data.json       # 16KB - FAQ content
│   ├── e2e/                        # Playwright E2E tests
│   │   └── pages/                  # Page object models
│   ├── scripts/
│   │   ├── generateSitemap.ts      # Sitemap generation
│   │   ├── seedBostonMarathon.ts   # Data seeding
│   │   └── testGemini.ts           # Gemini API testing
│   ├── public/                     # Static assets, PWA icons, sitemap.xml
│   ├── vite.config.ts              # Vite + prerender config
│   ├── tailwind.config.js          # Tailwind customization
│   ├── playwright.config.ts
│   └── package.json
├── scripts/                        # Root-level utility scripts
│   └── generate-sitemap.js         # Node.js sitemap generation
├── .github/
│   └── workflows/
│       └── e2e.yml                 # Playwright CI/CD (pushes to main, PRs)
├── README.md
└── vercel.json                     # Vercel deployment config
```

## Tech Stack

- **React 18.3** + **TypeScript 5.6** - UI framework
- **Vite 5.4** - Build tool + PWA plugin + prerender plugin
- **React Router 7.5** - Client-side routing
- **Tailwind CSS 3.4** + **tailwindcss-animate** - Utility-first styling
- **shadcn/ui** + **Radix UI** - Accessible component library
- **Firebase 11.6** - Auth (Google OAuth) + Firestore + Storage
- **Chart.js 4.4** - Elevation profile charts
- **Leaflet 1.9** + **Mapbox GL** - Interactive maps
- **Zod 3.25** + **React Hook Form 7.56** - Form validation
- **Google Gemini API** - AI nutrition recommendations
- **PostHog 1.288** + **GA4** - Product analytics
- **Playwright** - E2E testing

## Architecture Patterns

### Feature-Based Structure
Each feature in `src/features/` is self-contained:
```
features/[feature-name]/
├── components/     # Feature-specific UI
├── hooks/          # Feature-specific hooks
├── types.ts        # TypeScript interfaces
├── utils.ts        # Feature utilities (when needed)
└── index.ts        # Public exports (barrel file)
```

### Key Patterns
- **Context + Hooks**: Auth state via React Context, consumed through `useAuth()` hook
- **Compound Components**: Complex UIs built with composable sub-components
- **Type-Safe Forms**: Zod schemas + React Hook Form for validation
- **Custom Hooks**: Business logic separated from UI components
- **State Persistence**: localStorage for user preferences + Firestore for authenticated user data

### Naming Conventions
- Components: PascalCase (`VdotCalculator`, `FuelPlannerV2`)
- Hooks: camelCase starting with `use` (`useVdotCalculator`)
- Utilities: camelCase (`gpxMetaData.ts`, `geocoding.ts`)
- Types/Interfaces: PascalCase (`VdotResult`, `PaceInputs`)
- Barrel exports: Always via `index.ts` per directory

## Key Files

- `src/App.tsx` - Root component with all route configuration
- `src/features/auth/AuthContext.tsx` - Authentication context (Google OAuth)
- `src/lib/firebase.ts` - Firebase initialization (exports: `auth`, `db`, `storage`, `app`)
- `src/lib/utils.ts` - Utility functions (`cn` for classnames)
- `src/components/layout/SideNav.tsx` - Navigation (update when adding routes)
- `src/components/layout/constants/navLinks.ts` - Nav link definitions
- `vite.config.ts` - Vite + prerender config (add new prerender routes here)
- `tailwind.config.js` - Tailwind CSS configuration

## Route Map (src/App.tsx)

```
/                          → Landing page (hero)
/calculator                → PaceCalculatorV2 (training pace zones)
/calculator/:seoSlug       → CalculatorSeoLanding (PSEO dynamic)
/vdot                      → VdotCalculatorPage
/fuel                      → FuelPlannerV2
/fuel/:seoSlug             → FuelSeoLanding (PSEO dynamic)
/race                      → RaceIndex
/race/:raceSlug            → RaceSeoLanding (PSEO dynamic)
/elevation-finder          → ElevationPageV2
/elevation-finder/guides/:seoSlug → ElevationGuidesSeoLanding (PSEO dynamic)
/elevationfinder           → ElevationPageV2 (legacy redirect)
/dashboard                 → DashboardV2 [AuthGuard protected]
/blog                      → BlogList
/blog/:slug                → BlogPost
/preview-route/:slug       → PreviewRoute (Boston, NYC, Chicago, Berlin, London, Tokyo, Sydney, Oslo)
/login, /register, /logout → Auth pages
/settings                  → Settings [AuthGuard protected]
/ethos, /about             → About
/faq, /privacy, /terms     → Static pages
*                          → Landing (fallback)
```

## Environment Variables

Required in `vite-project/.env` (see `.env.example`):
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_MAPBOX_TOKEN
```

## Development Notes

- The app uses **shadcn/ui** components in `src/components/ui/` — these are copied into the project, not npm packages. To add new ones, copy from the shadcn/ui docs.
- Maps require a Mapbox token to render properly
- Firebase Auth uses Google OAuth only (no email/password)
- The app is a PWA with offline support via Workbox
- ESLint is configured with TypeScript-specific rules
- `console.*` calls are dropped in production builds (esbuild config in `vite.config.ts`)
- The `@` alias resolves to `./src` (configured in `vite.config.ts`)

## Common Tasks

### Adding a new page
1. Create page component in `src/pages/`
2. Add route in `src/App.tsx`
3. Update navigation in `src/components/layout/SideNav.tsx` + `navLinks.ts`
4. Add to prerender routes in `vite.config.ts` if it needs static generation

### Adding a new feature
1. Create feature folder in `src/features/[feature-name]/`
2. Add `components/`, `hooks/`, `types.ts` as needed
3. Export public API from `index.ts` barrel file
4. Import in page component via `@/features/[name]`

### Adding a shadcn/ui component
Copy the component source from shadcn/ui docs into `src/components/ui/`. Do not install via CLI — the setup is already configured.

### Adding blog posts
Add entries to `src/data/blog-posts.json`. Posts include: `slug`, `title`, `excerpt`, `content` (markdown), `author`, `category`, `tags`, `readingTime`, `featured`, `coverImage`, `publishedAt`.

### Protecting a route (auth required)
Wrap the page component with `<AuthGuard>` in `src/App.tsx`.

## Feature Details

### Auth (`src/features/auth/`)
- `AuthContext.tsx` — React Context for user state (`useAuth()` hook)
- `AuthGuard.tsx` — Protected route wrapper, redirects to `/login`
- Firebase Auth with `onAuthStateChanged` listener
- Google OAuth only

### Pace Calculator (`src/features/pace-calculator/`)
- Calculates 7 training pace zones from any race time + distance
- `usePaceCalculation.ts` — core computation hook
- `usePacePlanPersistence.ts` — localStorage + Firestore persistence
- Types: `PaceInputs`, `PaceResults`, `DistanceUnit` (`'km' | 'miles'`), `PaceUnit`

### VDOT Calculator (`src/features/vdot-calculator/`)
Jack Daniels VDOT scoring tool. Refactored March 2026 from 998-line monolith into 12 focused components with dashboard layout.

```
features/vdot-calculator/
├── components/
│   ├── VdotCalculator.tsx         # Main orchestrator — 2-col dashboard grid
│   ├── VdotScoreWithExplorer.tsx  # Score gauge + "What If" time slider
│   ├── DistanceSelector.tsx       # Card-based distance picker
│   ├── TimeInput.tsx              # H/M/S fields with auto-advance on fill
│   ├── VdotScoreDisplay.tsx       # Animated SVG gauge + percentile
│   ├── TrainingZonesDisplay.tsx   # Visual spectrum bars, 5 zones
│   ├── RacePredictionsTable.tsx   # Desktop table + mobile card layout
│   ├── VdotComparison.tsx         # "What If" VDOT comparison slider
│   ├── SampleWorkouts.tsx         # Zone-specific example workouts
│   ├── VdotHero.tsx               # Header with breadcrumbs
│   ├── VdotFaq.tsx                # FAQ accordion
│   └── VdotSeoHead.tsx            # SEO meta tags
├── hooks/
│   └── useVdotCalculator.ts       # State, history (localStorage), helpers
├── vdot-math.ts                   # Pure math: calculateVdot, predictRaceTime, formatTime, formatPace
├── types.ts                       # VdotInputs, VdotResult, TrainingZone, RacePrediction, etc.
└── index.ts
```

**Key architecture decisions:**
- **Lifted What-If state**: Slider state lives in `VdotCalculator` (parent) so all child panels react to it
- **Exported helpers**: `buildTrainingZones()` and `buildRacePredictions()` exported from `useVdotCalculator.ts` for parent recomputation
- **`vdot-math.ts`**: Daniels' oxygen cost model. `formatTime`/`formatPace` round total seconds first to prevent `:60` display bugs

### Elevation Analysis (`src/features/elevation/`)
- GPX file upload → parsing → Chart.js visualization
- Hooks: `useRouteLoader`, `useGpxAnalysis`, `useFileUpload`
- Firebase Storage for GPX uploads, Firestore for route metadata
- Map rendering via Mapbox GL (3D) or Leaflet (2D fallback)
- Types: `GPXAnalysisResponse`, `OptimizedRouteMetadata`, `Segment`, `ProfilePoint`

### Fuel Planner (`src/features/fuel/`)
- Personalized race nutrition recommendations
- `FuelPlannerV2.tsx` is the main component (55KB)
- Gemini AI integration for contextual advice (`src/services/gemini.ts`)
- Types: `RaceType`, `FuelStop`, `FuelProduct`, `AIRecommendation`
- Product database in `types.ts` as `FUEL_PRODUCTS`

### Dashboard (`src/features/dashboard/`)
- Displays all saved user data (routes, fuel plans, pace plans)
- Hooks: `useRoutes`, `useFuelPlans`, `usePacePlans`, `useSearch`
- Real-time Firestore queries scoped to authenticated user
- `SearchBar` component filters across all data types

### Blog (`src/features/blog/`)
- Static data-driven from `src/data/blog-posts.json` (82KB)
- Components: `BlogList`, `BlogPost`, `BlogCard`
- 7 categories: `training`, `nutrition`, `race-strategy`, `gear`, `recovery`, `beginner`, `advanced`
- Types: `BlogPost`, `BlogAuthor`, `BlogCategory`

### Poster Generator (`src/features/poster/`)
- Premium feature for custom race poster creation
- Uses Mapbox GL + HTML Canvas for route visualization + export
- Hooks: `usePosterData`, `useMapbox`, `usePosterGenerator`, `usePosterDialog`
- Utilities: `mapbox.ts` (map rendering), `canvas.ts` (image generation)

## VDOT Calculator (`src/features/vdot-calculator/`)

See [Feature Details > VDOT Calculator](#vdot-calculator-srcfeaturesvdot-calculator) above.

## Programmatic SEO Architecture

The codebase includes a scalable SEO system designed for 100,000+ programmatic pages.

### SEO Module Structure (`src/lib/seo/`)

```
lib/seo/
├── index.ts              # Central exports (50+ functions/types)
├── types.ts              # SeoPageConfig, SeoToolType, schemas, etc.
├── schema-generators.ts  # JSON-LD schema generation
├── meta-generators.ts    # Meta tag generation (title, OG, Twitter)
├── internal-linking.ts   # Hub-spoke linking engine
├── content-generators.ts # Content variation system
├── build-utils.ts        # Sitemap, chunking, caching
└── validation.ts         # Quality checks and CI integration
```

### Key Types

```typescript
import type { SeoPageConfig, SeoToolType } from '@/lib/seo';

// SeoPageConfig includes: id, slug, path, tool, title, description,
// h1, intro, bullets, cta, faq, howTo, initialInputs, relatedPageIds, etc.

// SeoToolType: 'pace' | 'fuel' | 'elevation' | 'race' | 'blog'
```

### SEO Page Templates (`src/components/seo/`)

```tsx
import { SeoPageTemplate } from '@/components/seo';
import { RacePageTemplate } from '@/components/seo';

// SeoPageTemplate - Base template for all SEO landing pages
// RacePageTemplate - Specialized template for race prep pages
// StructuredData - JSON-LD injection component
```

### Adding New SEO Pages

1. **Add page config** in `src/features/seo-pages/seoPages.ts`:
```typescript
{
  id: generatePageId('pace', 'my-new-page'),
  slug: 'my-new-page',
  tool: 'pace',
  path: '/calculator/my-new-page',
  title: 'Page Title | TrainPace',
  description: 'Meta description...',
  h1: 'Page Heading',
  intro: 'Introduction paragraph...',
  bullets: ['Bullet 1', 'Bullet 2'],
  cta: { href: '/calculator', label: 'Open Calculator' },
  faq: [{ question: '...', answer: '...' }],
  howTo: { name: '...', description: '...', steps: [...] },
}
```

2. **Route is automatic** - SEO pages use dynamic routes (`/calculator/:seoSlug`)

3. **Prerendering** - Pages are auto-added via `getAllSeoPaths()` in `vite.config.ts`

### Generating Content at Scale

```typescript
import { generateDistancePageConfig, generateRacePageConfig } from '@/lib/seo';

// Generate pace calculator pages for distances
const page = generateDistancePageConfig(
  { name: '5K', slug: '5k', km: 5, displayDistance: '5 km' },
  'pace'
);

// Generate race pages
const racePage = generateRacePageConfig({
  name: 'Boston Marathon',
  slug: 'boston-marathon',
  city: 'Boston',
  country: 'USA',
  previewRouteKey: 'boston',
});
```

### Schema Generation

```typescript
import { generateSchemaGraph, generateMetaTags } from '@/lib/seo';

// Generate JSON-LD schema for a page
const schema = generateSchemaGraph(page, {
  raceData: { name: '...', city: '...', ... }, // For race pages
  includeSoftwareApplication: true,
});

// Generate meta tags
const meta = generateMetaTags(page);
```

### Internal Linking

```typescript
import { findRelatedPages, generateBreadcrumbs, HUB_CONFIG } from '@/lib/seo';

// Find related pages
const related = findRelatedPages(page, allPages, { limit: 5 });

// Generate breadcrumbs
const breadcrumbs = generateBreadcrumbs(page);

// Hub pages for each tool
const paceHub = HUB_CONFIG.pace; // /calculator
```

### SEO Validation

```typescript
import { validatePage, validateAllPages, runPrePublishChecks } from '@/lib/seo';

// Validate single page
const result = validatePage(page);
// { isValid: boolean, score: number, errors: [], warnings: [] }

// Validate all pages
const batchResult = validateAllPages(allPages);

// Pre-publish checks
const checks = runPrePublishChecks(allPages);
// { canPublish: boolean, blockers: [], warnings: [] }
```

### Build Utilities

```typescript
import { generateSitemaps, chunkPages, calculateBuildStats } from '@/lib/seo';

// Generate sitemaps (handles 50k URL limit per file)
const sitemaps = generateSitemaps(allPages);

// Chunk pages for memory-efficient builds
const chunks = chunkPages(allPages, { maxPagesPerChunk: 5000 });

// Get build statistics
const stats = calculateBuildStats(allPages);
```

### SEO Data Files

- `src/features/seo-pages/seoPages.ts` - All SEO page configurations (2,302 lines, 80+ pages)
- `src/data/marathon-data.json` - Race course data (elevation, tips, FAQs)
- `src/data/blog-posts.json` - Blog content

### SEO Best Practices

- Every page needs unique `title`, `description`, and `h1`
- Add `faq` items for rich snippet eligibility
- Add `howTo` for featured snippet eligibility
- Use `generatePageId()` for consistent page IDs
- Run `validateAllPages()` before deploying to catch issues
- Keep titles under 60 chars, descriptions under 160 chars

## Testing

### E2E Tests (Playwright)
- Config: `vite-project/playwright.config.ts`
- Tests: `vite-project/e2e/` with page object models in `e2e/pages/`
- CI: `.github/workflows/e2e.yml` runs on push to main and all PRs
- CI caches: npm deps, Vite `.vite/` prebundle folder, Playwright browsers

```bash
cd vite-project
npm run test:e2e
```

## CI/CD

### GitHub Actions (`.github/workflows/e2e.yml`)
- Trigger: Push to `main`, pull requests
- Node 20 with npm caching
- Caches Vite prebundle artifacts for faster CI builds
- Caches Playwright browser by version
- Uploads test report (30-day retention)

### Deployment
- Platform: **Vercel** (config in `vercel.json`)
- Prerender: 80+ routes statically generated at build time via `vite-plugin-prerender`
- Sitemap: Generated via `npm run generate-sitemap` (run before deploy if SEO pages change)

## External Integrations

| Service | Purpose | Config |
|---------|---------|--------|
| Firebase Auth | User authentication (Google OAuth) | `src/lib/firebase.ts` |
| Firestore | Real-time user database | `src/lib/firebase.ts` |
| Firebase Storage | GPX file uploads | `src/lib/firebase.ts` |
| Google Gemini API | AI nutrition recommendations | `src/services/gemini.ts` |
| Mapbox GL | Interactive 3D map rendering | `VITE_MAPBOX_TOKEN` |
| Leaflet | Lightweight 2D map alternative | — |
| Google Analytics 4 | User analytics | `src/lib/GoogleAnalytics.tsx` |
| PostHog | Product analytics & feature flags | `main.tsx` |
| Chart.js | Elevation profile visualization | `src/components/elevationfinder/` |
| Vercel | Hosting & edge network | `vercel.json` |
