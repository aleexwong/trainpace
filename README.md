# TrainPace - Smarter Race Training & Course Analysis

[![Deployed on Vercel](https://img.shields.io/badge/deployed%20on-Vercel-black?logo=vercel)](https://vercel.com/aleexwongs-projects/trainpace)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/171bbd8a94744254a9db632e2650b6e4)](https://app.codacy.com/gh/aleexwong/trainingpacecalculator2/dashboard)

**Live App**: [www.trainpace.com](https://www.trainpace.com)

TrainPace is a modern web application designed to help runners optimize their training through intelligent pace calculation, real-world course analysis, and AI-powered personalized race fueling strategies.

---

## 🏃 Core Features

### 📊 Training Pace Calculator

Calculate science-backed training paces from any race result:

- **Instant Pace Zones**: Get Easy, Tempo, Maximum, Speed, and Extra Long run paces
- **Flexible Units**: Switch between kilometers and miles seamlessly
- **Yasso 800s**: Automatically calculate interval training paces
- **Race Predictor Modal**: Project performance across different distances with floating predictor button
- **One-Click Presets**: Quick access to common race distances (5K, 10K, Half, Marathon)
- **Smart Architecture**: Refactored into feature-based modules with separation of concerns

### 🗺️ Course Elevation Analysis

Upload and analyze any GPX route file:

- **Interactive Elevation Profiles**: Visualize climbs, descents, and grade percentages
- **Mapbox Integration**: See your route on beautiful, interactive maps
- **Detailed Metrics**: Total distance, elevation gain, grade analysis
- **Course Intelligence**: Understand terrain difficulty before race day
- **Bookmark & Save**: Store favorite routes for future reference
- **Backend GPX Processing**: Powered by gpx-insight-api with caching for performance

### 🥤 AI-Powered Race Fuel Planner

Science-based nutrition calculator with AI personalization:

#### Base Plan Calculation
- **Personalized Recommendations**: Carb and calorie targets based on your pace and weight
- **Hourly Breakdown**: Know exactly when to fuel during your race
- **Race-Specific Defaults**: Smart defaults for 10K, Half, and Full marathons
- **Multiple Fuel Sources**: Track gels, chews, drinks, and solid foods

#### AI Personalization (Google Gemini)
- **Context Presets**: Quick-select common scenarios (bonking late, GI issues, hot weather, first-timer, real food preference, no appetite, caffeine sensitivity, fasted training)
- **Custom Situations**: Describe your specific race-day challenges
- **Smart Recommendations**: 3-5 actionable recommendations with headline + detailed explanation
- **Prompt Transparency**: View and download the exact prompt sent to Gemini
- **Flashcard UI**: Swipe through recommendations or view as a list
- **Copy & Download**: Export your complete fuel plan with AI recommendations
- **Dashboard Persistence**: Save plans to your dashboard (with guest redirect to signup)
- **Feedback Loop**: Rate AI recommendations to improve future responses
- **Rate Limiting**: Redis-backed rate limiting (stricter for AI calls)
- **Input Sanitization**: Protection against prompt injection attacks

### 📈 Personal Dashboard

Track and manage your training data:

- **Route Library**: All your uploaded GPX files in one place
- **Bookmarked Courses**: Quick access to saved marathon routes
- **Saved Fuel Plans**: Access all your AI-personalized fuel strategies
- **Interactive Previews**: Thumbnail maps and stats for each route
- **Firebase Sync**: Access your data across devices
- **Auto-Save Support**: Pending plans saved automatically after signup

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
- **GPX Parsing** - Client-side route file processing

### Backend & Auth

- **Firebase Auth** - Secure Google OAuth authentication
- **Firestore** - Real-time database for user data, routes, and fuel plans
- **Vercel Hosting** - Global CDN with automatic deployments
- **gpx-insight-api** - Node.js backend for GPX analysis, elevation data, and AI fuel recommendations

### AI Integration

- **Google Gemini 2.5 Flash Lite** - Free AI model for personalized fuel recommendations
- **Redis** - Rate limiting and caching for API calls
- **Prompt Engineering** - Structured prompts with context presets and sanitization

### Progressive Web App

- **Vite PWA Plugin** - Installable app with offline support
- **Service Worker** - Background sync and caching strategies
- **Web Manifest** - Native app-like experience on mobile

---

## 🎯 Key Benefits

### For Training

- **No More Guesswork**: Science-backed pace zones eliminate training confusion
- **Avoid Overtraining**: Easy pace guidelines prevent injury from running too hard
- **Structured Workouts**: Clear tempo and interval targets for quality sessions

### For Race Prep

- **Course Knowledge**: Understand every hill before you race
- **Strategic Pacing**: Plan race splits based on actual elevation profile
- **Nutrition Confidence**: Never bonk again with AI-powered, personalized fuel planning
- **Real-World Context**: Get recommendations based on YOUR specific challenges (GI issues, weather, experience level)

### For Data Nerds

- **Your Data, Your Control**: All routes and plans stored securely in your Firebase account
- **Detailed Analytics**: Grade percentages, cumulative elevation, distance splits
- **GPX Export Ready**: Work with any GPS watch or training platform
- **Transparent AI**: See exactly what prompts are sent to Gemini

---

## 💡 Use Cases

### Pre-Race Reconnaissance

1. Upload the official race GPX from the organizer's website
2. Study the elevation profile and identify key climbs
3. Plan pacing strategy and fuel timing based on terrain
4. Use AI to personalize your fuel plan for race conditions
5. Bookmark the route for race-week review

### Training Plan Design

1. Input your recent race time (any distance)
2. Get instant pace targets for the week's workouts
3. Follow Easy pace for recovery runs
4. Hit Tempo/Maximum paces for quality sessions
5. Use the floating Race Predictor to project other distances

### Nutrition Optimization

1. Enter your goal race time and body weight
2. Calculate total carb needs for the distance
3. Select context presets (hot weather, GI issues, etc.) or describe your situation
4. Get 3-5 AI recommendations with specific products and timing
5. Save to dashboard and copy/download for race day
6. Rate recommendations to improve future suggestions

---

## 🏗️ Project Structure

```
vitetrainingpacecalculator/
├── vite-project/
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── calculator/   # Legacy pace calculator components
│   │   │   ├── ui/           # shadcn/ui components
│   │   │   └── utils/        # Map, charts, utilities
│   │   ├── features/         # Feature-specific modules (NEW!)
│   │   │   ├── auth/         # Authentication context & logic
│   │   │   ├── fuel/         # Fuel planner feature
│   │   │   │   ├── components/
│   │   │   │   │   └── FuelPlannerV2.tsx  # AI-powered fuel planner
│   │   │   │   ├── hooks/
│   │   │   │   └── types.ts
│   │   │   └── pace-calculator/  # NEW: Refactored pace calculator
│   │   │       ├── components/
│   │   │       │   ├── PaceCalculatorV2.tsx
│   │   │       │   └── RaceInputForm.tsx
│   │   │       ├── hooks/
│   │   │       │   └── usePaceCalculation.ts
│   │   │       ├── types.ts
│   │   │       ├── utils.ts  # Pure functions for testing
│   │   │       └── README.md
│   │   ├── pages/            # Route-level page components
│   │   │   ├── TrainingPaceCalculator.tsx  # Thin wrapper (10 lines)
│   │   │   ├── ElevationPage.tsx
│   │   │   ├── FuelPlannerV2.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   └── RacePredictorOverlay.tsx  # Floating modal
│   │   ├── hooks/            # Custom React hooks
│   │   │   ├── usePendingFuelPlan.ts  # Auto-save after signup
│   │   │   └── use-toast.ts
│   │   ├── services/         # External API integrations
│   │   │   └── gemini.ts     # Gemini API client
│   │   ├── lib/              # Firebase config, utilities
│   │   └── types/            # TypeScript definitions
│   └── public/               # Static assets, PWA icons

gpx-insight-api/
├── api/
│   ├── analyze-gpx.ts        # GPX parsing and analysis
│   ├── analyze-gpx-cache.ts  # Cached GPX analysis
│   └── refine-fuel-plan.ts   # AI fuel recommendations (NEW!)
├── lib/
│   └── firestore.ts          # Firestore admin SDK
├── utils/
│   └── applyRateLimitsRedis.ts  # Redis rate limiting
└── vercel.json               # Deployment config
```

---

## 🛠️ Development

### Prerequisites

- Node.js 18+ and npm
- Firebase project with Firestore and Auth enabled
- Mapbox API token (for elevation page maps)
- Google Gemini API key (for AI fuel recommendations)
- Redis instance (for rate limiting - optional for local dev)

### Local Setup

```bash
# Frontend
cd vite-project
npm install

# Copy environment template
cp .env.example .env

# Add your Firebase config to .env
# VITE_FIREBASE_API_KEY=...
# VITE_MAPBOX_TOKEN=...

# Start dev server
npm run dev

# Backend
cd ../gpx-insight-api
npm install

# Copy environment template
cp .env.example .env

# Add your API keys to .env
# GEMINI_API_KEY=...
# REDIS_URL=... (optional for local)

# Test locally (requires Vercel CLI)
vercel dev
```

### Available Scripts

**Frontend:**
```bash
npm run dev          # Start Vite dev server
npm run build        # Production build with TypeScript check
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
npm run host         # Expose dev server on local network
```

**Backend:**
```bash
npm test             # Run Jest tests
vercel dev           # Test API routes locally
```

---

## 🚢 Deployment

### Frontend (Vercel)

TrainPace is deployed on Vercel with automatic deployments on every push to main.

Environment variables required:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_MAPBOX_TOKEN`

### Backend (Vercel Serverless Functions)

The gpx-insight-api is deployed as Vercel serverless functions.

Environment variables required:
- `GEMINI_API_KEY` - Google Gemini API key
- `REDIS_URL` - Redis connection string (upstash.com recommended)
- `FIREBASE_SERVICE_ACCOUNT` - Base64 encoded Firebase service account JSON

**Important:** The backend includes:
- CORS configuration for trainpace.com + localhost
- Redis-backed rate limiting (stricter for AI calls)
- Input sanitization to prevent prompt injection
- Firestore logging of all AI responses (auto-delete after 90 days)

---

## 🎨 Design Philosophy

- **Mobile-First**: Every feature designed for on-the-go runners
- **Zero Friction**: No account required for basic calculations
- **Progressive Enhancement**: Core features work offline, advanced features require auth
- **Fast & Lightweight**: Optimized bundle size, lazy loading, code splitting
- **Accessible**: WCAG 2.1 compliant with keyboard navigation and screen reader support
- **Feature-Based Architecture**: Clean separation of concerns, testable pure functions

---

## 📊 Metrics After 30 Days

<img width="637" alt="TrainPace Analytics" src="https://github.com/user-attachments/assets/6f881b3f-b53e-4128-8b6b-baa93a466add" />

---

## 🆕 Recent Features (V2)

### AI-Powered Fuel Planner
- Google Gemini integration for personalized race nutrition advice
- Context preset buttons (8 common scenarios)
- Custom situation descriptions
- Flashcard-style recommendations UI
- Dashboard persistence with auto-save
- Rate limiting and prompt injection protection
- Complete transparency (view/copy/download prompts)

### Pace Calculator Refactor
- Extracted into feature-based architecture
- Pure utility functions for easy testing
- Custom `usePaceCalculation` hook
- Separated presentational components
- Reduced main file from 450+ to 10 lines
- Improved maintainability and reusability

### Backend Infrastructure
- Node.js API deployed on Vercel
- Redis-based rate limiting
- GPX analysis with caching
- Firestore for data persistence
- Domain-restricted authentication flows

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
- [Google Gemini](https://ai.google.dev/) - AI-powered personalization
- [Redis](https://redis.io/) - Rate limiting and caching

---

**Made with ❤️ for runners who take their training seriously.**
