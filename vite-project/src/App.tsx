import { useState } from "react";
import "./App.css";
import { HelmetProvider } from "react-helmet-async";
import { Routes, Route } from "react-router-dom";
import { Button } from "./components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import ScrollToTop from "./lib/ScrollToTop";
import GoogleAnalytics from "./lib/GoogleAnalytics";
import TrainingPaceCalculator from "./pages/TrainingPaceCalculator";
import RacePredictorOverlay from "./pages/RacePredictorOverlay";
import Landing from "./components/layout/Landing";
import { AuthAwareHome } from "./components/layout/AuthAwareHome";
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
import { FuelPlannerV2 } from "./features/fuel";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import About from "./pages/About";
import DashboardV2 from "./pages/DashboardV2";
import TrainingPlanBuilder from "./pages/TrainingPlanBuilder";
import { featureFlags } from "./config/featureFlags";

function App() {
  const [showPredictor, setShowPredictor] = useState(false);
  return (
    <>
      <ScrollToTop />
      <HelmetProvider>
        {/* Side Navigation */}
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<AuthAwareHome />} />
            <Route path="/calculator" element={<TrainingPaceCalculator />} />
            <Route path="/fuel" element={<FuelPlannerV2 />} />
            {featureFlags.trainingPlans && (
              <>
                <Route path="/training-plan-builder" element={<TrainingPlanBuilder />} />
                <Route path="/training-plan-builder/:planId" element={<TrainingPlanBuilder />} />
              </>
            )}
            <Route path="/elevation-finder" element={<ElevationPage />} />
            <Route
              path="/elevation-finder/:docId"
              element={<ElevationPage />}
            />
            <Route path="/elevationfinder/:docId" element={<ElevationPage />} />
            <Route path="/elevationfinder" element={<ElevationPage />} />
            <Route path="/dashboard" element={<DashboardV2 />} />
            <Route path="/ethos" element={<About />} />
            <Route path="login" element={<Login />} />
            <Route path="logout" element={<Logout />} />
            <Route path="register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/reset-confirmed" element={<ResetConfirmed />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/about" element={<About />} />
            <Route path="/preview-route/:slug" element={<PreviewRoute />} />
            {/* Wildcard route should be last */}
            <Route path="*" element={<Landing />} />
          </Route>
        </Routes>
        <GoogleAnalytics />
      </HelmetProvider>
      <Button
        onClick={() => setShowPredictor(true)}
        className="fixed bottom-4 right-4 rounded-full p-3 bg-blue-600 text-white shadow-md z-50"
        aria-label="Open race predictor"
      >
        🔮
      </Button>
      <RacePredictorOverlay
        isOpen={showPredictor}
        onClose={() => setShowPredictor(false)}
      />
      <Toaster />
    </>
  );
}

export default App;
