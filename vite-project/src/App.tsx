import "./App.css";
import { HelmetProvider } from "react-helmet-async";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import ScrollToTop from "./lib/ScrollToTop";
import GoogleAnalytics from "./lib/GoogleAnalytics";
import TrainingPaceCalculator from "./pages/TrainingPaceCalculator";
// NOTE: RacePredictorOverlay (Riegel-formula race-time predictor) is parked for now.
// The component still lives at ./pages/RacePredictorOverlay but is intentionally not
// rendered — revisit during the TrainPace rewrite (e.g. fold into the VDOT calculator).
import Landing from "./components/layout/Landing";
import MainLayout from "./components/layout/MainLayout";
import Login from "./pages/Login";
import Logout from "./components/login/Logout";
import Register from "./components/login/Register";
import ResetPassword from "./components/login/ResetPassword";
import ResetConfirmed from "./components/login/ResetConfirmed";
import ElevationPage from "./pages/ElevationPageV2";
import FAQ from "./pages/FAQ";
import Settings from "./pages/Settings";
import PreviewRoute from "./pages/PreviewRoute";
import FuelPlannerPage from "./pages/FuelPlannerPage";
import CalculatorSeoLanding from "./pages/CalculatorSeoLanding";
import FuelSeoLanding from "./pages/FuelSeoLanding";
import ElevationGuidesSeoLanding from "./pages/ElevationGuidesSeoLanding";
import RaceSeoLanding from "./pages/RaceSeoLanding";
import RaceIndex from "./pages/RaceIndex";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import About from "./pages/About";
import DashboardV2 from "./pages/DashboardV2";
import VdotCalculatorPage from "./pages/VdotCalculatorPage";
import Onboarding from "./pages/Onboarding";
import { BlogList, BlogPost } from "./features/blog";
import AuthGuard from "./features/auth/AuthGuard";

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
