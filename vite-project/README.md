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
- **Hourly Breakdown**: Know exactly when to fuel during your race
- **Multiple Fuel Sources**: Track gels, chews, drinks, and solid foods
- **Export Support**: Take your nutrition plan anywhere

### 📈 Personal Dashboard
Track and manage your training data:
- **Route Library**: All your uploaded GPX files in one place
- **Bookmarked Courses**: Quick access to saved marathon routes
- **Interactive Previews**: Thumbnail maps and stats for each route
- **Firebase Sync**: Access your data across devices

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
- **Firestore** - Real-time database for user data and routes
- **Vercel Hosting** - Global CDN with automatic deployments

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
- **Nutrition Confidence**: Never bonk again with personalized fuel planning

### For Data Nerds
- **Your Data, Your Control**: All routes stored securely in your Firebase account
- **Detailed Analytics**: Grade percentages, cumulative elevation, distance splits
- **GPX Export Ready**: Work with any GPS watch or training platform

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
│   │   ├── calculator/   # Pace calculator components
│   │   ├── ui/           # shadcn/ui components
│   │   └── utils/        # Map, charts, utilities
│   ├── features/         # Feature-specific modules
│   │   └── auth/         # Authentication context & logic
│   ├── pages/            # Route-level page components
│   │   ├── TrainingPaceCalculator.tsx
│   │   ├── ElevationPage.tsx
│   │   ├── FuelPlanner.tsx
│   │   └── Dashboard.tsx
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Firebase config, utilities
│   └── types/            # TypeScript definitions
├── public/               # Static assets, PWA icons
└── vercel.json          # Deployment config
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
npm run dev          # Start Vite dev server
npm run build        # Production build with TypeScript check
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
npm run host         # Expose dev server on local network
```

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
