# TrainPace - Smarter Race Training & Course Analysis

[![Deployed on Vercel](https://img.shields.io/badge/deployed%20on-Vercel-black?logo=vercel)](https://vercel.com/aleexwongs-projects/trainpace)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/171bbd8a94744254a9db632e2650b6e4)](https://app.codacy.com/gh/aleexwong/trainingpacecalculator2/dashboard)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-blue?logo=react)](https://react.dev/)

**Live App**: [www.trainpace.com](https://www.trainpace.com)

TrainPace is a modern, type-safe web application designed to help runners optimize their training through intelligent pace calculation, real-world course analysis, and personalized race fueling strategies. Built with React 18, TypeScript, and Firebase, it demonstrates production-grade architecture patterns and modern web development best practices.

---

## Table of Contents

- [Core Features](#-core-features)
- [Architecture](#-architecture)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Development](#-development)
- [Deployment](#-deployment)
- [Design Philosophy](#-design-philosophy)

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

### 🗺️ Course Elevation Analysis

Upload and analyze any GPX route file:

- **Interactive Elevation Profiles**: Visualize climbs, descents, and grade percentages using Chart.js
- **Mapbox Integration**: See your route on beautiful, interactive maps
- **Detailed Metrics**: Total distance, elevation gain, grade analysis
- **Difficulty Scoring**: Algorithmic terrain difficulty assessment
- **Bookmark & Save**: Store favorite routes for future reference with Firebase Firestore

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
- **Training Plans**: Manage saved pace calculations
- **Fuel Plans**: Access saved nutrition strategies
- **Interactive Previews**: Thumbnail maps and stats for each route
- **Firebase Sync**: Seamless cross-device data access

---

## 🏗 Architecture

TrainPace follows a feature-based architecture pattern with clear separation of concerns, making it maintainable and scalable.

### System Architecture Diagram

```mermaid
graph TB
    subgraph Client["🌐 Client Layer (React 18 + TypeScript)"]
        App[App.tsx<br/>Route Configuration]
        Router[React Router 7<br/>Client-side Routing]

        subgraph Features["📦 Feature Modules"]
            PaceCalc[Pace Calculator<br/>Components + Hooks + Types]
            Elevation[Elevation Analysis<br/>GPX Processing + Maps]
            Fuel[Fuel Planner<br/>AI Integration]
            Dashboard[Dashboard<br/>Data Management]
            Auth[Authentication<br/>Context + Guards]
        end

        subgraph Shared["🔧 Shared Layer"]
            Components[UI Components<br/>shadcn/ui + Radix]
            Hooks[Custom Hooks<br/>Reusable Logic]
            Utils[Utilities<br/>Helpers + Validators]
        end
    end

    subgraph Services["☁️ External Services"]
        Firebase[Firebase<br/>Auth + Firestore + Storage]
        Mapbox[Mapbox API<br/>Map Rendering]
        Gemini[Google Gemini<br/>AI Recommendations]
        Analytics[Analytics<br/>GA4 + PostHog]
    end

    subgraph Infrastructure["🚀 Infrastructure"]
        Vercel[Vercel<br/>Edge Network + CDN]
        PWA[Service Worker<br/>Offline Support]
    end

    App --> Router
    Router --> Features
    Features --> Shared
    Features --> Services
    Client --> Infrastructure

    style Client fill:#e3f2fd
    style Services fill:#fff3e0
    style Infrastructure fill:#f3e5f5
    style Features fill:#e8f5e9
    style Shared fill:#fce4ec
```

### Data Flow Architecture

```mermaid
sequenceDiagram
    participant User
    participant App
    participant Feature
    participant Firebase
    participant AI

    User->>App: Navigate to Feature
    App->>Feature: Load Component

    alt Authenticated User
        Feature->>Firebase: Check Auth State
        Firebase-->>Feature: User Session
        Feature->>Firebase: Fetch User Data
        Firebase-->>Feature: Routes/Plans/Settings
    end

    User->>Feature: Input Data
    Feature->>Feature: Local Validation (Zod)

    alt AI-Powered Feature
        Feature->>AI: Request Recommendation
        AI-->>Feature: AI Response
    end

    Feature->>Feature: Calculate/Process
    Feature-->>User: Display Results

    opt Save Data
        User->>Feature: Click Save
        Feature->>Firebase: Persist to Firestore
        Firebase-->>Feature: Confirmation
        Feature-->>User: Success Toast
    end
```

### Feature Module Structure

Each feature follows a consistent internal structure:

```
features/[feature-name]/
├── components/          # Feature-specific UI components
│   ├── [Feature]Form.tsx
│   ├── [Feature]Results.tsx
│   └── index.ts
├── hooks/              # Feature-specific custom hooks
│   ├── use[Feature]Data.ts
│   ├── use[Feature]Persistence.ts
│   └── index.ts
├── types.ts            # TypeScript interfaces/types
├── utils.ts            # Feature-specific utilities
└── index.ts            # Public API exports
```

**Benefits of this architecture:**
- **Encapsulation**: Each feature is self-contained with its own components, hooks, and types
- **Scalability**: New features can be added without modifying existing code
- **Testability**: Features can be tested in isolation
- **Code Splitting**: Features can be lazy-loaded for optimal performance
- **Developer Experience**: Clear file organization makes navigation intuitive

### Key Architectural Patterns

#### 1. Context + Hooks Pattern
```typescript
// Auth state management
<AuthProvider>
  <App />
</AuthProvider>

// Consumed via custom hook
const { user } = useAuth();
```

#### 2. Compound Components
```typescript
// Pace calculator uses compound component pattern
<PaceCalculator>
  <RaceDetailsForm />
  <PaceResultsDisplay />
  <RunningTips />
</PaceCalculator>
```

#### 3. Custom Hooks for Business Logic
```typescript
// Separation of concerns - UI vs Logic
const {
  results,
  isLoading,
  calculate
} = usePaceCalculation();

const {
  save,
  saved
} = usePacePlanPersistence(user?.uid);
```

#### 4. Type-Safe Form Handling
```typescript
// Zod schema validation + React Hook Form
const schema = z.object({
  distance: z.number().positive(),
  hours: z.number().min(0),
  // ...
});

const form = useForm<FormData>({
  resolver: zodResolver(schema),
});
```

---

## 🚀 Technology Stack

### Frontend Core

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3 | UI library with concurrent features |
| **TypeScript** | 5.6 | Type safety and enhanced DX |
| **Vite** | 5.4 | Fast dev server, optimized builds |
| **React Router** | 7.5 | Client-side routing with data APIs |

### UI & Styling

| Technology | Purpose |
|------------|---------|
| **Tailwind CSS** | Utility-first styling with custom design tokens |
| **shadcn/ui** | Accessible, composable component primitives |
| **Radix UI** | Unstyled, accessible component library |
| **Lucide React** | Modern icon system |
| **class-variance-authority** | Type-safe component variants |

### Data Visualization & Maps

| Technology | Purpose |
|------------|---------|
| **Chart.js** | Elevation profile charts |
| **React Chart.js 2** | React wrapper for Chart.js |
| **Leaflet** | Lightweight map library |
| **Mapbox GL** | Advanced map rendering and tiles |

### Backend & Services

| Technology | Purpose |
|------------|---------|
| **Firebase Auth** | Google OAuth authentication |
| **Firestore** | NoSQL database for user data |
| **Firebase Storage** | GPX file storage |
| **Google Gemini** | AI-powered nutrition recommendations |

### Developer Experience

| Technology | Purpose |
|------------|---------|
| **ESLint** | Code linting and style enforcement |
| **TypeScript ESLint** | TypeScript-specific linting rules |
| **Zod** | Runtime type validation for forms |
| **React Hook Form** | Performant form state management |

### Analytics & Monitoring

| Technology | Purpose |
|------------|---------|
| **Google Analytics 4** | User behavior tracking |
| **PostHog** | Product analytics and feature flags |

### Progressive Web App

| Technology | Purpose |
|------------|---------|
| **vite-plugin-pwa** | PWA manifest generation |
| **Workbox** | Service worker strategies |
| **Web Manifest** | Install prompt and app metadata |

---

## 📁 Project Structure

```
trainpace/
├── vite-project/                 # Main application
│   ├── src/
│   │   ├── features/            # Feature modules (domain-driven)
│   │   │   ├── auth/           # Authentication + guards
│   │   │   │   ├── AuthContext.tsx
│   │   │   │   ├── AuthGuard.tsx
│   │   │   │   └── LoginButton.tsx
│   │   │   ├── pace-calculator/ # Training pace calculator
│   │   │   │   ├── components/
│   │   │   │   ├── hooks/
│   │   │   │   ├── types.ts
│   │   │   │   └── index.ts
│   │   │   ├── elevation/       # GPX analysis & maps
│   │   │   │   ├── components/
│   │   │   │   ├── hooks/
│   │   │   │   └── types.ts
│   │   │   ├── fuel/           # Race nutrition planner
│   │   │   │   ├── components/
│   │   │   │   ├── hooks/
│   │   │   │   └── utils.ts
│   │   │   └── dashboard/       # User data management
│   │   │       ├── components/
│   │   │       ├── hooks/
│   │   │       └── actions.ts
│   │   │
│   │   ├── components/          # Shared UI components
│   │   │   ├── ui/             # shadcn/ui primitives
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   └── ...
│   │   │   ├── layout/         # Layout components
│   │   │   │   ├── MainLayout.tsx
│   │   │   │   ├── SideNav.tsx
│   │   │   │   └── Footer.tsx
│   │   │   └── utils/          # Utility components
│   │   │       ├── MapboxRoutePreview.tsx
│   │   │       └── LeafletRoutePreview.tsx
│   │   │
│   │   ├── pages/              # Route-level components
│   │   │   ├── TrainingPaceCalculator.tsx
│   │   │   ├── ElevationPageV2.tsx
│   │   │   ├── FuelPlannerV2.tsx
│   │   │   ├── DashboardV2.tsx
│   │   │   └── Landing.tsx
│   │   │
│   │   ├── hooks/              # Global custom hooks
│   │   │   ├── use-toast.ts
│   │   │   ├── usePosterGenerator.ts
│   │   │   └── usePending*.ts
│   │   │
│   │   ├── lib/                # Core utilities & config
│   │   │   ├── firebase.ts     # Firebase initialization
│   │   │   ├── utils.ts        # Helper functions
│   │   │   ├── gpxMetaData.ts  # GPX parsing
│   │   │   └── GoogleAnalytics.tsx
│   │   │
│   │   ├── services/           # External API integrations
│   │   │   ├── gemini.ts       # Google AI integration
│   │   │   └── gemini-auth.ts
│   │   │
│   │   ├── types/              # Global TypeScript types
│   │   ├── config/             # App configuration
│   │   │   └── routes.ts
│   │   ├── data/               # Static data & content
│   │   │   ├── marathon-data.json
│   │   │   └── faq-data.json
│   │   │
│   │   ├── App.tsx             # Root component + routing
│   │   ├── main.tsx            # Entry point
│   │   └── vite-env.d.ts       # Vite type declarations
│   │
│   ├── public/                  # Static assets
│   │   ├── pwa-icons/          # PWA app icons
│   │   └── manifest.json       # Web app manifest
│   │
│   ├── index.html              # HTML entry point
│   ├── vite.config.ts          # Vite configuration
│   ├── tailwind.config.js      # Tailwind configuration
│   ├── tsconfig.json           # TypeScript configuration
│   └── package.json            # Dependencies & scripts
│
├── scripts/                     # Utility scripts
│   └── generate-sitemap.js     # SEO sitemap generation
│
├── README.md                    # This file
└── vercel.json                 # Vercel deployment config
```

### Key Directory Explanations

- **`features/`**: Domain-driven feature modules. Each feature is self-contained with its components, hooks, and types. This makes features easy to understand, test, and modify in isolation.

- **`components/ui/`**: shadcn/ui components. These are copied into the project (not imported from npm) allowing customization while maintaining upgrade paths.

- **`components/layout/`**: Application shell components like navigation, headers, and footers that are shared across all pages.

- **`pages/`**: Top-level route components. These are thin wrappers that compose feature modules and shared components.

- **`hooks/`**: Global custom hooks that are used across multiple features.

- **`lib/`**: Core application logic, Firebase setup, and utility functions that don't belong to any specific feature.

- **`services/`**: External API integrations and third-party service wrappers.

---

## 🛠️ Development

### Prerequisites

- **Node.js** 18+ and npm
- **Firebase project** with Firestore and Auth enabled
- **Mapbox API token** (for elevation page maps)
- **Google AI API key** (optional, for Gemini features)

### Local Setup

```bash
# Clone the repository
git clone https://github.com/aleexwong/trainingpacecalculator2.git
cd trainingpacecalculator2/vite-project

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Add your credentials to .env
# VITE_FIREBASE_API_KEY=...
# VITE_FIREBASE_AUTH_DOMAIN=...
# VITE_FIREBASE_PROJECT_ID=...
# VITE_FIREBASE_STORAGE_BUCKET=...
# VITE_FIREBASE_MESSAGING_SENDER_ID=...
# VITE_FIREBASE_APP_ID=...
# VITE_MAPBOX_TOKEN=...

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Available Scripts

```bash
npm run dev              # Start Vite dev server (localhost:5173)
npm run build            # TypeScript check + production build
npm run preview          # Preview production build locally
npm run lint             # Run ESLint checks
npm run host             # Expose dev server on local network
npm run generate-pwa-assets  # Generate PWA icons
npm run seed-boston      # Seed Boston Marathon route data
npm run test-gemini      # Test Gemini API integration
```

### Development Workflow

1. **Feature Development**: Create new features in `src/features/[feature-name]/`
2. **Component Addition**: Add shared components to `src/components/`
3. **Type Safety**: Define TypeScript interfaces in feature-level `types.ts` files
4. **State Management**: Use custom hooks for business logic, Context for global state
5. **Styling**: Use Tailwind utility classes and extend with custom components
6. **Testing**: Test components in isolation with TypeScript type checking

### Code Quality

- **TypeScript**: Strict mode enabled for maximum type safety
- **ESLint**: Enforces consistent code style and catches common errors
- **Prettier**: Code formatting (configure in your editor)
- **Zod**: Runtime validation for forms and external data

---

## 🚢 Deployment

TrainPace is deployed on **Vercel** with automatic deployments on every push to `main`.

### Deployment Features

- **Edge Network**: Global CDN for fast load times worldwide
- **Automatic HTTPS**: SSL certificates managed by Vercel
- **Preview Deployments**: Every PR gets a unique preview URL
- **Environment Variables**: Securely managed in Vercel dashboard
- **Analytics**: Built-in Web Analytics and Speed Insights

### Deploy Your Own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/aleexwong/trainingpacecalculator2)

#### Required Environment Variables

```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_MAPBOX_TOKEN=your_mapbox_token
```

### Build Configuration

The production build:
- Runs TypeScript type checking before build
- Minifies and tree-shakes JavaScript
- Optimizes CSS with PurgeCSS
- Generates service worker for offline support
- Creates optimized chunks with code splitting
- Compresses assets with gzip/brotli

---

## 🎯 Design Philosophy

### Core Principles

1. **Mobile-First Design**
   - Every feature designed for on-the-go runners
   - Touch-friendly interfaces with accessible tap targets
   - Responsive layouts that work on all screen sizes

2. **Zero Friction**
   - No account required for basic calculations
   - Instant results without page reloads
   - Smart defaults and one-click presets

3. **Progressive Enhancement**
   - Core features work offline via service worker
   - Advanced features (save, sync) require authentication
   - Graceful degradation when services are unavailable

4. **Performance First**
   - Optimized bundle size with code splitting
   - Lazy loading of heavy components (maps, charts)
   - Minimal initial page load time

5. **Accessibility**
   - WCAG 2.1 AA compliant
   - Keyboard navigation support
   - Screen reader optimized
   - High contrast mode support

6. **Type Safety**
   - TypeScript throughout the codebase
   - Runtime validation with Zod
   - Type-safe API calls and data fetching

### Technical Decisions

**Why Vite over Create React App?**
- 10x faster dev server startup
- Lightning-fast HMR (Hot Module Replacement)
- Optimized production builds with Rollup
- Better TypeScript support out of the box

**Why Firebase over traditional backend?**
- Zero backend maintenance
- Real-time data synchronization
- Built-in authentication with OAuth providers
- Generous free tier for side projects
- Global CDN for fast data access

**Why shadcn/ui over component libraries?**
- Components live in your codebase (full control)
- Built on Radix UI (accessibility by default)
- Tailwind-based (no CSS conflicts)
- No package lock-in (modify as needed)

**Why feature-based architecture?**
- Scales better than layer-based (components/hooks/utils)
- Features are self-contained and portable
- Easier to understand for new developers
- Natural code splitting boundaries

---

## 📊 Performance Metrics

### Lighthouse Scores (Production)

- **Performance**: 95+
- **Accessibility**: 100
- **Best Practices**: 100
- **SEO**: 100
- **PWA**: ✓ Installable

### Bundle Size

- **Initial JS**: ~180KB (gzipped)
- **Initial CSS**: ~12KB (gzipped)
- **Total Initial Load**: <200KB
- **Time to Interactive**: <2s on 4G

### Real-World Usage (30 Days)

<img width="637" alt="TrainPace Analytics" src="https://github.com/user-attachments/assets/6f881b3f-b53e-4128-8b6b-baa93a466add" />

---

## 🤝 Contributing

This is a personal portfolio project, but feedback and suggestions are welcome!

### How to Contribute

1. **Report Bugs**: Open an issue with detailed reproduction steps
2. **Suggest Features**: Describe your use case and desired outcome
3. **Share Success Stories**: Let me know how TrainPace helped your training!
4. **Improve Documentation**: Submit PRs for README improvements

### Not Accepting

- Major architectural changes
- New dependencies without strong justification
- Features that don't align with the core mission

---

## 📝 License

This project is **open source for educational purposes**.

**You may:**
- Study the code and learn from it
- Fork it for personal use
- Use code snippets in your own projects (with attribution)

**Please don't:**
- Deploy a competing product without significant modifications
- Remove attribution or rebrand as your own work

---

## 🙏 Acknowledgments

### Built With

- [**shadcn/ui**](https://ui.shadcn.com/) - Beautiful, accessible component library
- [**Radix UI**](https://www.radix-ui.com/) - Unstyled, accessible primitives
- [**Mapbox**](https://www.mapbox.com/) - Interactive mapping platform
- [**Firebase**](https://firebase.google.com/) - Backend infrastructure
- [**Vercel**](https://vercel.com/) - Deployment and hosting
- [**Chart.js**](https://www.chartjs.org/) - Data visualization library
- [**Leaflet**](https://leafletjs.com/) - Open-source mapping library

### Inspired By

- Jack Daniels' Running Formula (pace calculation methodology)
- Strava's elevation analysis features
- Modern web app development best practices

---

## 📧 Contact

**Alex Wong**
- Portfolio: [alexwong.dev](https://alexwong.dev)
- GitHub: [@aleexwong](https://github.com/aleexwong)
- Twitter: [@aleexwong](https://twitter.com/aleexwong)

---

**Made with ❤️ for runners who take their training seriously.**

*Last Updated: November 2024*
