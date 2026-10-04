import { lazyRoute } from "./lib/lazyRoute";

// Route components are lazy-loaded so each page ships its own JS chunk instead of
// bundling the entire app (Mapbox, Chart.js, Firebase, etc.) into one ~2MB blob.
// Safe with prerendering: the static SEO HTML comes from prerender.jsx, not these routes.
// lazyRoute (not React.lazy) so main.tsx and link hovers can preload a route's chunk.
export const Landing = lazyRoute(() => import("./components/layout/Landing"));
export const Login = lazyRoute(() => import("./pages/Login"));
export const Logout = lazyRoute(() => import("./components/login/Logout"));
export const Register = lazyRoute(() => import("./components/login/Register"));
export const ResetPassword = lazyRoute(() => import("./components/login/ResetPassword"));
export const ResetConfirmed = lazyRoute(() => import("./components/login/ResetConfirmed"));
export const TrainingPaceCalculator = lazyRoute(() => import("./pages/TrainingPaceCalculator"));
export const ElevationPage = lazyRoute(() => import("./pages/ElevationPageV2"));
export const FAQ = lazyRoute(() => import("./pages/FAQ"));
export const Settings = lazyRoute(() => import("./pages/Settings"));
export const PreviewRoute = lazyRoute(() => import("./pages/PreviewRoute"));
export const FuelPlannerPage = lazyRoute(() => import("./pages/FuelPlannerPage"));
export const CalculatorSeoLanding = lazyRoute(() => import("./pages/CalculatorSeoLanding"));
export const FuelSeoLanding = lazyRoute(() => import("./pages/FuelSeoLanding"));
export const ElevationGuidesSeoLanding = lazyRoute(() => import("./pages/ElevationGuidesSeoLanding"));
export const RaceSeoLanding = lazyRoute(() => import("./pages/RaceSeoLanding"));
export const PlanSeoLanding = lazyRoute(() => import("./pages/PlanSeoLanding"));
export const RaceIndex = lazyRoute(() => import("./pages/RaceIndex"));
export const Privacy = lazyRoute(() => import("./pages/Privacy"));
export const Terms = lazyRoute(() => import("./pages/Terms"));
export const About = lazyRoute(() => import("./pages/About"));
export const McpDocs = lazyRoute(() => import("./pages/McpDocs"));
export const DashboardV2 = lazyRoute(() => import("./pages/DashboardV2"));
export const VdotCalculatorPage = lazyRoute(() => import("./pages/VdotCalculatorPage"));
export const Onboarding = lazyRoute(() => import("./pages/Onboarding"));
export const TrainingPlanPage = lazyRoute(() => import("./pages/TrainingPlanPage"));
export const BlogList = lazyRoute(() =>
  import("./features/blog").then((m) => ({ default: m.BlogList }))
);
export const BlogPost = lazyRoute(() =>
  import("./features/blog").then((m) => ({ default: m.BlogPost }))
);
