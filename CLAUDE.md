# CLAUDE.md

This file provides guidance for Claude Code when working with the TrainPace codebase.

## Project Overview

TrainPace is a React/TypeScript web application for runners that provides:
- **Training Pace Calculator** - Science-backed pace zones from race times
- **Course Elevation Analysis** - GPX file upload and visualization
- **Race Fuel Planner** - Personalized nutrition recommendations
- **Personal Dashboard** - User data management with Firebase

**Live site**: https://www.trainpace.com

## Quick Reference

### Commands

```bash
# Development (run from vite-project directory)
cd vite-project
npm install          # Install dependencies
npm run dev          # Start dev server at localhost:5173
npm run build        # TypeScript check + production build
npm run lint         # Run ESLint
npm run preview      # Preview production build

# Utility scripts
npm run host         # Expose dev server on network
npm run seed-boston  # Seed Boston Marathon route data
npm run test-gemini  # Test Gemini API integration
```

### Project Structure

```
trainpace/
├── vite-project/           # Main application
│   ├── src/
│   │   ├── features/       # Feature modules (auth, pace-calculator, elevation, fuel, dashboard)
│   │   ├── components/     # Shared UI components
│   │   │   ├── ui/         # shadcn/ui primitives
│   │   │   ├── layout/     # MainLayout, SideNav, Footer
│   │   │   └── utils/      # MapboxRoutePreview, LeafletRoutePreview
│   │   ├── pages/          # Route-level components
│   │   ├── hooks/          # Global custom hooks
│   │   ├── lib/            # Firebase config, utilities
│   │   ├── services/       # External API integrations (Gemini)
│   │   ├── types/          # Global TypeScript types
│   │   └── data/           # Static data (marathon-data.json, faq-data.json)
│   ├── public/             # Static assets, PWA icons
│   └── index.html          # Entry HTML
├── scripts/                # Utility scripts
├── README.md               # Project documentation
└── vercel.json             # Vercel deployment config
```

## Tech Stack

- **React 18** + **TypeScript 5.6** - UI framework
- **Vite 5.4** - Build tool and dev server
- **React Router 7** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** + **Radix UI** - Accessible component library
- **Firebase** - Auth (Google OAuth) + Firestore + Storage
- **Chart.js** - Elevation profile charts
- **Leaflet** + **Mapbox GL** - Interactive maps
- **Zod** + **React Hook Form** - Form validation

## Architecture Patterns

### Feature-Based Structure
Each feature in `src/features/` is self-contained:
```
features/[feature-name]/
├── components/     # Feature-specific UI
├── hooks/          # Feature-specific hooks
├── types.ts        # TypeScript interfaces
├── utils.ts        # Feature utilities
└── index.ts        # Public exports
```

### Key Patterns
- **Context + Hooks**: Auth state via React Context, consumed through hooks
- **Compound Components**: Complex UIs built with composable sub-components
- **Type-Safe Forms**: Zod schemas + React Hook Form for validation
- **Custom Hooks**: Business logic separated from UI components

## Key Files

- `src/App.tsx` - Root component with route configuration
- `src/features/auth/AuthContext.tsx` - Authentication context
- `src/lib/firebase.ts` - Firebase initialization
- `src/lib/utils.ts` - Utility functions (cn for classnames)
- `vite.config.ts` - Vite configuration with PWA plugin
- `tailwind.config.js` - Tailwind CSS configuration

## Environment Variables

Required in `.env` (see `.env.example`):
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

- The app uses **shadcn/ui** components in `src/components/ui/` - these are copied into the project, not npm packages
- Maps require a Mapbox token to render properly
- Firebase Auth uses Google OAuth only
- The app is a PWA with offline support via Workbox
- ESLint is configured with TypeScript-specific rules

## Common Tasks

### Adding a new page
1. Create page component in `src/pages/`
2. Add route in `src/App.tsx`
3. Update navigation in `src/components/layout/SideNav.tsx`

### Adding a new feature
1. Create feature folder in `src/features/[feature-name]/`
2. Add components, hooks, types as needed
3. Export public API from `index.ts`

### Adding a shadcn/ui component
Components are already set up. Copy new components from shadcn/ui docs into `src/components/ui/`.

## Programmatic SEO Architecture

The codebase includes a scalable SEO system designed for 100,000+ programmatic pages.

### SEO Module Structure (`src/lib/seo/`)

```
lib/seo/
├── index.ts              # Central exports
├── types.ts              # Type definitions (SeoPageConfig, schemas, etc.)
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

3. **Prerendering** - Pages are auto-added via `getAllSeoPaths()` in vite.config.ts

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

- `src/features/seo-pages/seoPages.ts` - All SEO page configurations
- `src/data/marathon-data.json` - Race course data (elevation, tips, FAQs)
- `src/data/blog-posts.json` - Blog content

### SEO Best Practices

- Every page needs unique `title`, `description`, and `h1`
- Add `faq` items for rich snippet eligibility
- Add `howTo` for featured snippet eligibility
- Use `generatePageId()` for consistent page IDs
- Run `validateAllPages()` before deploying to catch issues
- Keep titles under 60 chars, descriptions under 160 chars
