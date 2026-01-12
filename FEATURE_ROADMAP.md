# TrainPace Feature Roadmap

## Executive Summary
Based on comprehensive codebase analysis, this roadmap identifies high-impact features to enhance TrainPace's value proposition as a complete training companion for runners.

---

## Priority 1: Critical Features (Immediate Impact)

### 1.1 Training Plan Builder
**Problem:** Users get pace zones but no structured workout plans to follow
**Solution:** Pre-built training plans with week-by-week schedules

**Features:**
- Template library (5K, 10K, Half Marathon, Marathon)
- Experience levels (Beginner, Intermediate, Advanced)
- Weekly calendar view with scheduled workouts
- Progress tracking with completion checkboxes
- Automatic pace zone integration from calculator
- Plan customization (start date, weekly mileage, recovery preferences)
- Rest day reminders

**Tech Stack:**
- New feature module: `/features/training-plans/`
- Firebase collection: `user_training_plans`
- Calendar component using existing shadcn/ui
- Integration with existing pace calculator

**User Stories:**
- "As a runner, I want a 16-week marathon plan that tells me exactly what to run each day"
- "As a beginner, I want a Couch-to-5K plan with built-in pace guidance"

---

### 1.2 Workout Logger & Progress Tracking
**Problem:** No way to track actual runs vs planned workouts
**Solution:** Workout logging with analytics dashboard

**Features:**
- Quick log entry (date, distance, time, effort level, notes)
- Manual pace entry or auto-calculate from distance/time
- Link to training plan workouts
- Weekly/monthly mileage summaries
- Visual progress charts (Chart.js integration)
- Pace progression over time
- Personal records (PR) tracking per distance
- Training consistency metrics (runs per week, longest run, etc.)
- Export workout history (CSV, JSON)

**Tech Stack:**
- New feature module: `/features/workout-log/`
- Firebase collection: `user_workouts`
- Reuse Chart.js from elevation feature
- Dashboard integration

**User Stories:**
- "As a runner, I want to log my runs and see my progress over time"
- "As a coach, I want to see if I'm meeting my weekly mileage goals"

---

### 1.3 Race Calendar & Registration Integration
**Problem:** Users find paces/routes but need to discover races
**Solution:** Integrated race calendar with direct registration

**Features:**
- Searchable race database (location, distance, date)
- Filter by distance, month, state/city
- Race detail pages with registration links
- Add races to personal calendar
- Countdown to race day
- Pre-race checklist (gear, nutrition, travel)
- Race day weather forecast integration
- Link saved routes to upcoming races
- Post-race report template

**Tech Stack:**
- Backend API integration (running.COACH, RunSignup, or custom scraper)
- New page: `/races` and `/races/:raceId`
- Firebase collection: `user_race_calendar`
- Weather API integration (OpenWeatherMap)

**User Stories:**
- "As a runner, I want to find marathons near me in the fall"
- "As a race planner, I want countdown and checklist for my goal race"

---

## Priority 2: High-Value Enhancements

### 2.1 Social Features & Route Sharing
**Problem:** Routes and plans are siloed to individual users
**Solution:** Community-driven route discovery and sharing

**Features:**
- Public route gallery (opt-in sharing)
- Route ratings and reviews
- Comments on routes
- "Copy to my routes" button
- User profiles with shared routes/achievements
- Follow other runners
- Activity feed of community uploads
- Route collections/categories (trail running, city routes, beginner-friendly)
- Like/favorite routes

**Tech Stack:**
- Firebase collection updates: `public_routes`, `route_comments`, `user_follows`
- New page: `/community`, `/routes/explore`, `/profile/:userId`
- Moderation tools for inappropriate content
- Privacy settings in user dashboard

**User Stories:**
- "As a runner, I want to discover popular training routes in my city"
- "As a route creator, I want to share my favorite loops with the community"

---

### 2.2 Strava/Garmin Integration
**Problem:** Manual data entry is tedious
**Solution:** Sync workouts from popular fitness platforms

**Features:**
- OAuth integration with Strava and Garmin Connect
- Auto-import completed workouts
- Sync routes from Strava as GPX files
- Two-way sync: log in TrainPace → post to Strava
- Activity deduplication
- Sync cadence, heart rate, power data if available
- Retroactive import of historical workouts

**Tech Stack:**
- Backend API proxies for OAuth
- Strava API v3 and Garmin Connect API
- Firebase collection: `user_integrations`
- Webhook listeners for real-time sync
- Settings page integration for connection management

**User Stories:**
- "As a Strava user, I want my runs automatically logged in TrainPace"
- "As a Garmin user, I want to import my watch data without manual entry"

---

### 2.3 Gear Tracking (Shoe Mileage)
**Problem:** Runners forget to replace worn-out shoes
**Solution:** Track mileage per pair of shoes

**Features:**
- Add multiple shoes/gear items
- Associate workouts with specific shoes
- Automatic mileage accumulation
- Replacement alerts at 300-500 miles
- Gear retirement tracking
- Notes per shoe (model, purchase date, injury correlation)
- Visual timeline of shoe usage

**Tech Stack:**
- New feature module: `/features/gear/`
- Firebase collection: `user_gear`
- Dashboard widget showing active shoes
- Integration with workout logger

**User Stories:**
- "As a runner, I want to know when my shoes have 50 miles left"
- "As an injury-prone runner, I want to track which shoes cause issues"

---

### 2.4 More Pre-Loaded Famous Race Routes
**Problem:** Only Boston Marathon is pre-loaded
**Solution:** Expand route library with iconic races

**Routes to Add:**
- NYC Marathon
- Chicago Marathon
- Berlin Marathon
- London Marathon
- Tokyo Marathon (complete World Marathon Majors)
- Comrades Marathon (ultra)
- Western States 100 (ultra)
- Popular half marathons (Rock 'n' Roll series)

**Features:**
- Course record times
- Elevation profiles with strategic advice
- Historical weather data
- Past winner information
- Spectator-friendly sections
- Aid station locations

**Tech Stack:**
- Expand `/data/marathon-data.json`
- Dedicated `/routes/:slug` pages
- SEO-optimized route pages for organic traffic

---

## Priority 3: Advanced Features

### 3.1 Live Workout Mode
**Problem:** No in-run guidance during workouts
**Solution:** Live tracking with audio cues

**Features:**
- GPS tracking during runs (using browser geolocation or native app)
- Real-time pace vs target pace
- Audio announcements every mile/km
- Vibration alerts for pace deviations
- Lap splits
- Auto-pause detection
- Live elevation gain tracking
- Heart rate monitor integration (Bluetooth)

**Tech Stack:**
- PWA enhancements with background geolocation
- Web Bluetooth API for HR monitors
- IndexedDB for offline workout storage
- Audio API for voice cues
- Consider React Native for native app

**User Stories:**
- "As a runner, I want audio cues to keep me on pace during tempo runs"
- "As a trail runner, I want to see my elevation gain during the run"

---

### 3.2 AI Training Coach
**Problem:** Users don't know what workouts to do next
**Solution:** Personalized AI recommendations

**Features:**
- Analyze training history and suggest next workout
- Injury risk assessment based on training load
- Recovery recommendations (rest vs easy run)
- Race readiness score
- Adaptive plan adjustments based on performance
- Chat interface for training questions
- Integration with existing Gemini API

**Tech Stack:**
- Extend `/services/gemini.ts` with new prompts
- New endpoint: `/api/coach/recommend`
- Dashboard widget: "Coach Recommendation"
- Training load calculations (acute vs chronic workload ratio)

**User Stories:**
- "As a runner, I want AI to tell me if I'm overtraining"
- "As a beginner, I want coaching advice without hiring a coach"

---

### 3.3 Weather-Adjusted Recommendations
**Problem:** Static pace advice doesn't account for race day weather
**Solution:** Real-time weather integration with dynamic pacing

**Features:**
- Race day weather forecast
- Automatic pace adjustments for temperature/humidity/wind
- Hydration recommendations based on conditions
- Clothing suggestions
- Historical weather data for past races
- Alert notifications for extreme conditions

**Tech Stack:**
- OpenWeatherMap API or Weather.gov API
- Extend existing `calculateWeatherAdjustment()` in pace calculator
- Integration with race calendar for race-day forecasts

**User Stories:**
- "As a marathon runner, I want to know how heat will affect my pace"
- "As a race planner, I want to know what to wear on race day"

---

### 3.4 Group Training & Coach Mode
**Problem:** Coaches can't share plans with athletes
**Solution:** Team management features

**Features:**
- Create training groups/teams
- Assign training plans to athletes
- View athlete progress dashboard
- Comment on athlete workouts
- Group leaderboards
- Team challenges
- Broadcast messages to group
- Coach accounts with multi-athlete view

**Tech Stack:**
- Firebase collection: `teams`, `team_members`, `coach_assignments`
- Role-based access control
- New pages: `/teams/:teamId`, `/coach/dashboard`
- Email notifications for new assignments

**User Stories:**
- "As a coach, I want to assign workouts to 20 athletes at once"
- "As a team member, I want to see how my training compares to teammates"

---

## Priority 4: UX Improvements

### 4.1 Mobile App (React Native)
**Problem:** PWA has limited native capabilities
**Solution:** Full native iOS/Android apps

**Features:**
- All existing web features
- Background GPS tracking
- Push notifications for workouts
- Apple Watch/Wear OS companion app
- Offline-first architecture
- HealthKit/Google Fit integration
- Siri/Google Assistant shortcuts

---

### 4.2 Enhanced Onboarding
**Problem:** New users may not understand all features
**Solution:** Interactive tutorial and guided setup

**Features:**
- Welcome wizard on first login
- Feature spotlight modals
- Sample training plan pre-populated
- Video tutorials
- Tooltips on first use
- Progressive disclosure of advanced features

---

### 4.3 Dark Mode
**Problem:** Not mentioned in current codebase
**Solution:** System-aware theme switching

**Features:**
- Light/dark/system preference
- Persistent theme choice
- Smooth transitions
- Optimized chart colors for dark mode

---

## Implementation Priorities

### Q1 2026 (MVP Completeness)
1. Training Plan Builder
2. Workout Logger & Progress Tracking
3. Dark Mode
4. More Pre-Loaded Routes (World Marathon Majors)

### Q2 2026 (Community Growth)
1. Social Features & Route Sharing
2. Race Calendar Integration
3. Enhanced Onboarding
4. Gear Tracking

### Q3 2026 (Platform Integration)
1. Strava/Garmin Integration
2. Weather-Adjusted Recommendations
3. Mobile App (React Native) - Phase 1

### Q4 2026 (Advanced Features)
1. AI Training Coach
2. Live Workout Mode
3. Group Training & Coach Mode
4. Mobile App - Phase 2 (wearables)

---

## Success Metrics

**Engagement:**
- Daily Active Users (DAU)
- Workouts logged per user per week
- Training plan completion rate

**Growth:**
- User sign-ups per month
- Route shares per user
- Community route downloads

**Retention:**
- 30-day retention rate
- Feature adoption rates
- Time spent in app per session

**Revenue (if applicable):**
- Premium subscription conversions
- Coach mode adoption
- API partnership revenue (Strava, race registration affiliates)

---

## Technical Debt & Infrastructure

### Database Optimization
- Add indexes for frequently queried fields
- Implement pagination for large collections
- Consider read replicas for analytics queries

### Performance
- Lazy load non-critical features
- Implement virtual scrolling for long lists
- Optimize GPX parsing for large files
- Add CDN for static assets (route maps, images)

### Testing
- Add E2E tests with Playwright
- Unit tests for calculation functions
- Integration tests for Firebase operations
- Load testing for AI endpoints

### Security
- Rate limiting on AI endpoints
- Input sanitization for user-generated content
- CSRF protection
- Regular dependency audits

---

## Conclusion

TrainPace has a solid foundation with three core features (pace, elevation, fuel). The roadmap prioritizes:
1. **Training Plan Builder** - completes the core training cycle
2. **Workout Logger** - enables progress tracking and retention
3. **Social/Community** - drives organic growth through sharing
4. **Platform Integration** - reduces friction via auto-import
5. **Advanced Features** - differentiates from competitors

Estimated timeline: 12-18 months for full roadmap execution with a 2-3 person team.
