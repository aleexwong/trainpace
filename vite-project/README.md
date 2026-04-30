# TrainPace - Smarter Race Training & Course Analysis

[![Deployed on Vercel](https://img.shields.io/badge/deployed%20on-Vercel-black?logo=vercel)](https://vercel.com/aleexwongs-projects/trainpace)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/171bbd8a94744254a9db632e2650b6e4)](https://app.codacy.com/gh/aleexwong/trainingpacecalculator2/dashboard)

**Live App**: [www.trainpace.com](https://www.trainpace.com)

TrainPace is a modern web application designed to help runners optimize their training through intelligent pace calculation, real-world course analysis, and personalized race fueling strategies.

---

## 🏃 Core Features

### 📊 Training Pace Calculator

Calculate science-backed training paces from any race result:

- **Instant Pace Zones**: Get Easy, Tempo, Maximum, Speed, and Extra Long run paces
- **Flexible Units**: Switch between kilometers and miles seamlessly
- **Yasso 800s**: Automatically calculate interval training paces
- **Race Predictor**: Project performance across different distances
- **One-Click Presets**: Quick access to common race distances (5K, 10K, Half, Marathon)
- **Plan Persistence**: Save and manage multiple training plans in your dashboard

### 🎯 VDOT Calculator

Jack Daniels' VDOT scoring with an interactive dashboard layout:

- **Animated Score Gauge**: SVG gauge with percentile feedback
- **"What If" Explorer**: Drag a slider to see how a faster (or slower) time changes your VDOT, training paces, and predicted race times in real time
- **Smart Time Input**: H/M/S fields auto-advance as you type
- **Training Zones Spectrum**: Five color-coded pace zones with visual range bars
- **Race Predictions**: Project times across every standard distance, with a mobile-friendly card layout
- **Sample Workouts**: Zone-specific example sessions tied to your current VDOT
- **History**: Recent calculations persisted in localStorage

### 🗺️ Course Elevation Analysis

Upload and analyze any GPX route file:

- **Interactive Elevation Profiles**: Visualize climbs, descents, and grade percentages
- **Mapbox Integration**: See your route on beautiful, interactive maps
- **Detailed Metrics**: Total distance, elevation gain, grade analysis
- **Course Intelligence**: Understand terrain difficulty before race day
- **Bookmark & Save**: Store favorite routes for future reference

### 🥤 Race Fuel Planner

Science-based nutrition calculator for race day:

- **Personalized Recommendations**: Carb and calorie targets based on your pace and weight
- **AI-Powered Suggestions**: Google Gemini integration for contextual nutrition advice
- **Hourly Breakdown**: Know exactly when to fuel during your race
- **Multiple Fuel Sources**: Track gels, chews, drinks, and solid foods
- **Export Support**: Take your nutrition plan anywhere

### 📈 Personal Dashboard

Track and manage your training data:

- **Route Library**: All your uploaded GPX files in one place
- **Training & Fuel Plans**: Manage saved pace calculations and nutrition strategies
- **Bookmarked Courses**: Quick access to saved marathon routes
- **Interactive Previews**: Thumbnail maps and stats for each route
- **Unified Search**: Filter across routes, fuel plans, and pace plans from a single bar
- **Firebase Sync**: Access your data across devices

### 🎨 Race Poster Generator (Premium)

Turn any uploaded route into a frame-worthy print:

- **Mapbox-Powered Renders**: Stylized route artwork generated with Mapbox GL
- **Custom Layouts**: Title, distance, elevation, and date metadata baked into the design
- **Canvas Export**: Download high-resolution PNGs ready for printing

### 🏁 World Major Race Previews

Hand-curated previews for 8 iconic marathons — Boston, NYC, Chicago, Berlin, London, Tokyo, Sydney, and Oslo — with elevation profiles, tactical tips, interactive 3D maps, and race-specific FAQs.

### 📝 Running Blog

A growing library of long-form running content:

- **10+ Articles**: Training, nutrition, race strategy, gear, recovery, and beginner/advanced topics
- **Markdown-Powered**: Posts authored in markdown with cover images and reading-time estimates
- **Featured Posts & Categories**: Curated picks plus filtering across seven categories

---

## 🚀 Technology Stack

### Frontend

- **React 18** + **TypeScript** - Type-safe component development
- **Vite** - Lightning-fast dev server and optimized builds
- **React Router 7** - Client-side routing with nested layouts
- **shadcn/ui** + **Radix UI** - Accessible, composable component library
- **Tailwind CSS** - Utility-first styling with custom design system

### Data & Mapping

- **Chart.js** - Elevation profile visualizations
- **Leaflet + Mapbox GL** - Interactive map rendering
- **GPX Parsing** - Route file processing, returning elevation data + training insights

### Backend & Auth

- **Firebase Auth** - Google OAuth authentication
- **Firestore** - Real-time database for user data and routes
- **Firebase Storage** - GPX file uploads
- **Google Gemini** - AI-powered nutrition recommendations
- **Vercel Hosting** - Global CDN with automatic deployments

### Progressive Web App

- **Vite PWA Plugin** - Installable app with offline support
- **Service Worker** - Background sync and caching strategies
- **Web Manifest** - Native app-like experience on mobile

### SEO & Testing

- **Programmatic SEO**: 80+ generated landing pages with JSON-LD schemas, internal linking, and validation (`src/lib/seo/`)
- **Static Prerendering**: Routes baked to HTML at build time via `vite-plugin-prerender`
- **Sitemaps**: Chunked sitemap generation with `npm run generate-sitemap`
- **Playwright E2E**: End-to-end coverage with page object models, run locally and on every PR via GitHub Actions

---

## 🎯 Key Benefits

### For Training

- **No More Guesswork**: Science-backed pace zones eliminate training confusion
- **Avoid Overtraining**: Easy pace guidelines prevent injury from running too hard
- **Structured Workouts**: Clear tempo and interval targets for quality sessions

### For Race Prep

- **Course Knowledge**: Understand every hill before you race
- **Strategic Pacing**: Plan race splits based on actual elevation profile
- **Nutrition Confidence**: Never bonk again with personalized fuel planning

### For Data Nerds

- **Your Data, Your Control**: All routes stored securely in your Firebase account
- **Detailed Analytics**: Grade percentages, cumulative elevation, distance splits

---

## 💡 Use Cases

### Pre-Race Reconnaissance

1. Upload the official race GPX from the organizer's website
2. Study the elevation profile and identify key climbs
3. Plan pacing strategy and fuel timing based on terrain
4. Bookmark the route for race-week review

### Training Plan Design

1. Input your recent race time (any distance)
2. Get instant pace targets for the week's workouts
3. Follow Easy pace for recovery runs
4. Hit Tempo/Maximum paces for quality sessions

### Nutrition Optimization

1. Enter your goal race time and body weight
2. Calculate total carb needs for the distance
3. Map out when to consume each gel/chew
4. Adjust strategy based on aid station locations

---

## 🏗️ Project Structure

```
vite-project/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # shadcn/ui primitives
│   │   ├── layout/       # MainLayout, SideNav, Footer, Landing
│   │   ├── seo/          # SEO templates and structured data
│   │   └── utils/        # Map, charts, utilities
│   ├── features/         # Feature-specific modules
│   │   ├── auth/                 # Authentication context & guards
│   │   ├── pace-calculator/      # Training pace zones
│   │   ├── vdot-calculator/      # VDOT scoring + What-If explorer
│   │   ├── elevation/            # GPX analysis + maps
│   │   ├── fuel/                 # Race nutrition planner
│   │   ├── dashboard/            # User data management
│   │   ├── poster/               # Race poster generator (premium)
│   │   ├── blog/                 # Blog list + post components
│   │   └── seo-pages/            # Programmatic SEO page configs
│   ├── pages/            # Route-level page components (18 pages)
│   │   ├── TrainingPaceCalculator.tsx
│   │   ├── VdotCalculatorPage.tsx
│   │   ├── ElevationPageV2.tsx
│   │   ├── FuelPlannerV2.tsx
│   │   ├── DashboardV2.tsx
│   │   ├── BlogList.tsx, BlogPost.tsx
│   │   └── PreviewRoute.tsx      # World major race previews
│   ├── hooks/            # Global custom hooks
│   ├── lib/              # Firebase config, utilities
│   │   └── seo/          # Scalable SEO system (4,000+ lines)
│   ├── services/         # Gemini AI integration
│   ├── data/             # Static content (blog posts, marathon data, FAQs)
│   └── types/            # TypeScript definitions
├── e2e/                  # Playwright E2E tests + page object models
├── scripts/              # generateSitemap, seedBostonMarathon, testGemini
├── public/               # Static assets, PWA icons, sitemap.xml
└── vercel.json           # Deployment config
```

---

## 🛠️ Development

### Prerequisites

- Node.js 18+ and npm
- Firebase project with Firestore and Auth enabled
- Mapbox API token (for elevation page maps)

### Local Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Add your Firebase config to .env
# VITE_FIREBASE_API_KEY=...
# VITE_MAPBOX_TOKEN=...

# Start dev server
npm run dev
```

### Available Scripts

```bash
npm run dev               # Start Vite dev server
npm run build             # Production build with TypeScript check
npm run preview           # Preview production build locally
npm run lint              # Run ESLint
npm run host              # Expose dev server on local network
npm run generate-sitemap  # Regenerate sitemap.xml from SEO page configs
npm run test:e2e          # Run Playwright end-to-end test suite
npm run seed-boston       # Seed Boston Marathon route data
npm run test-gemini       # Test Gemini API integration
```

### Testing

Playwright drives the E2E suite (config in `playwright.config.ts`, page object models in `e2e/pages/`). The same suite runs in CI on every push to `main` and on PRs via `.github/workflows/e2e.yml`, which caches npm deps, the Vite prebundle directory, and the matching Playwright browser version.

---

## 🚢 Deployment

TrainPace is deployed on Vercel with automatic deployments on every push to main.

### Deploy Your Own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/aleexwong/trainingpacecalculator2)

Environment variables required:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_MAPBOX_TOKEN`

---

## 🎨 Design Philosophy

- **Mobile-First**: Every feature designed for on-the-go runners
- **Zero Friction**: No account required for basic calculations
- **Progressive Enhancement**: Core features work offline, advanced features require auth
- **Fast & Lightweight**: Optimized bundle size, lazy loading, code splitting
- **Accessible**: WCAG 2.1 compliant with keyboard navigation and screen reader support

---

## 📊 Metrics After 30 Days

<img width="637" alt="TrainPace Analytics" src="https://github.com/user-attachments/assets/6f881b3f-b53e-4128-8b6b-baa93a466add" />

---

## 🤝 Contributing

This is a personal project, but feedback and suggestions are welcome! Feel free to:

- Open an issue for bugs or feature requests
- Share your race success stories using TrainPace
- Suggest improvements to pace calculations or UI/UX

---

## 📝 License

This project is open source for educational purposes. Feel free to learn from the code, but please don't deploy a competing product without significant modifications.

---

## 🙏 Acknowledgments

Built with:

- [shadcn/ui](https://ui.shadcn.com/) - Beautiful component library
- [Mapbox](https://www.mapbox.com/) - Interactive mapping platform
- [Firebase](https://firebase.google.com/) - Backend infrastructure
- [Vercel](https://vercel.com/) - Deployment platform

---

**Made with ❤️ for runners who take their training seriously.**
