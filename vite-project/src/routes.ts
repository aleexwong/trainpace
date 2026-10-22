import { matchRoutes } from "react-router-dom";
import { lazyRoute, type LazyRoute } from "./lib/lazyRoute";

// Route components are lazy-loaded so each page ships its own JS chunk instead of
// bundling the entire app (Mapbox, Chart.js, Firebase, etc.) into one ~2MB blob.
// Safe with prerendering: the static SEO HTML comes from prerender.jsx, not these routes.
// main.tsx preloads the current URL's chunk before the first render (preloadRoute).
export const Landing = lazyRoute(() => import("./components/layout/Landing"));
const Login = lazyRoute(() => import("./pages/Login"));
const Logout = lazyRoute(() => import("./components/login/Logout"));
const Register = lazyRoute(() => import("./components/login/Register"));
const ResetPassword = lazyRoute(() => import("./components/login/ResetPassword"));
const ResetConfirmed = lazyRoute(() => import("./components/login/ResetConfirmed"));
const TrainingPaceCalculator = lazyRoute(() => import("./pages/TrainingPaceCalculator"));
const ElevationPage = lazyRoute(() => import("./pages/ElevationPageV2"));
const FAQ = lazyRoute(() => import("./pages/FAQ"));
const Settings = lazyRoute(() => import("./pages/Settings"));
const PreviewRoute = lazyRoute(() => import("./pages/PreviewRoute"));
const FuelPlannerPage = lazyRoute(() => import("./pages/FuelPlannerPage"));
const CalculatorSeoLanding = lazyRoute(() => import("./pages/CalculatorSeoLanding"));
const FuelSeoLanding = lazyRoute(() => import("./pages/FuelSeoLanding"));
const ElevationGuidesSeoLanding = lazyRoute(() => import("./pages/ElevationGuidesSeoLanding"));
const RaceSeoLanding = lazyRoute(() => import("./pages/RaceSeoLanding"));
const PlanSeoLanding = lazyRoute(() => import("./pages/PlanSeoLanding"));
const RaceIndex = lazyRoute(() => import("./pages/RaceIndex"));
const Privacy = lazyRoute(() => import("./pages/Privacy"));
const Terms = lazyRoute(() => import("./pages/Terms"));
const About = lazyRoute(() => import("./pages/About"));
const McpDocs = lazyRoute(() => import("./pages/McpDocs"));
const DashboardV2 = lazyRoute(() => import("./pages/DashboardV2"));
const VdotCalculatorPage = lazyRoute(() => import("./pages/VdotCalculatorPage"));
const Onboarding = lazyRoute(() => import("./pages/Onboarding"));
const TrainingPlanPage = lazyRoute(() => import("./pages/TrainingPlanPage"));
const BlogList = lazyRoute(() =>
  import("./features/blog").then((m) => ({ default: m.BlogList }))
);
const BlogPost = lazyRoute(() =>
  import("./features/blog").then((m) => ({ default: m.BlogPost }))
);

export interface PageRoute {
  path: string;
  Page: LazyRoute;
  guarded?: boolean;
}

// One table drives both <Routes> and preloadRoute(), so they can't disagree.
export const pageRoutes: PageRoute[] = [
  { path: "/calculator", Page: TrainingPaceCalculator },
  { path: "/calculator/:seoSlug", Page: CalculatorSeoLanding },
  { path: "/fuel", Page: FuelPlannerPage },
  { path: "/fuel/:seoSlug", Page: FuelSeoLanding },
  { path: "/vdot", Page: VdotCalculatorPage },
  { path: "/plan", Page: TrainingPlanPage },
  { path: "/plan/:seoSlug", Page: PlanSeoLanding },
  { path: "/race", Page: RaceIndex },
  { path: "/race/:raceSlug", Page: RaceSeoLanding },
  { path: "/elevation-finder", Page: ElevationPage },
  { path: "/elevation-finder/:docId", Page: ElevationPage },
  { path: "/elevation-finder/guides/:seoSlug", Page: ElevationGuidesSeoLanding },
  { path: "/elevationfinder/:docId", Page: ElevationPage },
  { path: "/elevationfinder/guides/:seoSlug", Page: ElevationGuidesSeoLanding },
  { path: "/elevationfinder", Page: ElevationPage },
  { path: "/dashboard", Page: DashboardV2, guarded: true },
  { path: "/onboarding", Page: Onboarding, guarded: true },
  { path: "/ethos", Page: About },
  { path: "/login", Page: Login },
  { path: "/logout", Page: Logout },
  { path: "/register", Page: Register },
  { path: "/reset-password", Page: ResetPassword },
  { path: "/reset-confirmed", Page: ResetConfirmed },
  { path: "/settings", Page: Settings, guarded: true },
  { path: "/faq", Page: FAQ },
  { path: "/privacy", Page: Privacy },
  { path: "/terms", Page: Terms },
  { path: "/about", Page: About },
  { path: "/mcp", Page: McpDocs },
  { path: "/preview-route/:slug", Page: PreviewRoute },
  { path: "/blog", Page: BlogList },
  { path: "/blog/:slug", Page: BlogPost },
  // Wildcard route should be last
  { path: "*", Page: Landing },
];

/** Downloads the JS chunk for the page at `pathname`. */
export function preloadRoute(pathname: string): Promise<void> {
  const match = matchRoutes(
    [{ path: "/", Page: Landing }, ...pageRoutes],
    pathname
  )?.[0];
  return match ? match.route.Page.preload() : Promise.resolve();
}
