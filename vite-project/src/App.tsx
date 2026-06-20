import "./App.css";
import { lazy } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import ScrollToTop from "./lib/ScrollToTop";
import GoogleAnalytics from "./lib/GoogleAnalytics";
// NOTE: RacePredictorOverlay (Riegel-formula race-time predictor) is parked for now.
// The component still lives at ./pages/RacePredictorOverlay but is intentionally not
// rendered — revisit during the TrainPace rewrite (e.g. fold into the VDOT calculator).
import MainLayout from "./components/layout/MainLayout";
import AuthGuard from "./features/auth/AuthGuard";

// Route components are lazy-loaded so each page ships its own JS chunk instead of
// bundling the entire app (Mapbox, Chart.js, Firebase, etc.) into one ~2MB blob.
// Safe with prerendering: the static SEO HTML comes from prerender.jsx, not these routes.
const Landing = lazy(() => import("./components/layout/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Logout = lazy(() => import("./components/login/Logout"));
const Register = lazy(() => import("./components/login/Register"));
const ResetPassword = lazy(() => import("./components/login/ResetPassword"));
const ResetConfirmed = lazy(() => import("./components/login/ResetConfirmed"));
const TrainingPaceCalculator = lazy(() => import("./pages/TrainingPaceCalculator"));
const ElevationPage = lazy(() => import("./pages/ElevationPageV2"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Settings = lazy(() => import("./pages/Settings"));
const PreviewRoute = lazy(() => import("./pages/PreviewRoute"));
const FuelPlannerPage = lazy(() => import("./pages/FuelPlannerPage"));
const CalculatorSeoLanding = lazy(() => import("./pages/CalculatorSeoLanding"));
const FuelSeoLanding = lazy(() => import("./pages/FuelSeoLanding"));
const ElevationGuidesSeoLanding = lazy(() => import("./pages/ElevationGuidesSeoLanding"));
const RaceSeoLanding = lazy(() => import("./pages/RaceSeoLanding"));
const PlanSeoLanding = lazy(() => import("./pages/PlanSeoLanding"));
const RaceIndex = lazy(() => import("./pages/RaceIndex"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const About = lazy(() => import("./pages/About"));
const DashboardV2 = lazy(() => import("./pages/DashboardV2"));
const VdotCalculatorPage = lazy(() => import("./pages/VdotCalculatorPage"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const TrainingPlanPage = lazy(() => import("./pages/TrainingPlanPage"));
const RaceSimPage = lazy(() => import("./pages/RaceSimPage"));
const BlogList = lazy(() =>
  import("./features/blog").then((m) => ({ default: m.BlogList }))
);
const BlogPost = lazy(() =>
  import("./features/blog").then((m) => ({ default: m.BlogPost }))
);

function App() {
  return (
    <>
      <ScrollToTop />
      <HelmetProvider>
        {/* Side Navigation */}
        <Routes>
          <Route path="/" element={<MainLayout />}>
          <Route index element={<Landing />} />
          <Route path="/calculator" element={<TrainingPaceCalculator />} />
          <Route
            path="/calculator/:seoSlug"
            element={<CalculatorSeoLanding />}
          />
          <Route path="/fuel" element={<FuelPlannerPage />} />
          <Route path="/fuel/:seoSlug" element={<FuelSeoLanding />} />
          <Route path="/vdot" element={<VdotCalculatorPage />} />
          <Route path="/plan" element={<TrainingPlanPage />} />
          <Route path="/plan/:seoSlug" element={<PlanSeoLanding />} />
          <Route path="/simulate" element={<RaceSimPage />} />
          <Route path="/race" element={<RaceIndex />} />
          <Route path="/race/:raceSlug" element={<RaceSeoLanding />} />
          <Route path="/elevation-finder" element={<ElevationPage />} />
          <Route
            path="/elevation-finder/:docId"
            element={<ElevationPage />}
          />
          <Route
            path="/elevation-finder/guides/:seoSlug"
            element={<ElevationGuidesSeoLanding />}
          />
          <Route path="/elevationfinder/:docId" element={<ElevationPage />} />
          <Route
            path="/elevationfinder/guides/:seoSlug"
            element={<ElevationGuidesSeoLanding />}
          />
          <Route path="/elevationfinder" element={<ElevationPage />} />
          <Route path="/dashboard" element={<AuthGuard><DashboardV2 /></AuthGuard>} />
          <Route path="/onboarding" element={<AuthGuard><Onboarding /></AuthGuard>} />
            <Route path="/ethos" element={<About />} />
            <Route path="login" element={<Login />} />
            <Route path="logout" element={<Logout />} />
            <Route path="register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/reset-confirmed" element={<ResetConfirmed />} />
            <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/about" element={<About />} />
            <Route path="/preview-route/:slug" element={<PreviewRoute />} />
            {/* Blog routes */}
            <Route path="/blog" element={<BlogList />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            {/* Wildcard route should be last */}
            <Route path="*" element={<Landing />} />
          </Route>
        </Routes>
        <GoogleAnalytics />
      </HelmetProvider>
      <Toaster />
    </>
  );
}

export default App;
