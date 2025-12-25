import { useState, Suspense, lazy } from "react";
import "./App.css";
import { HelmetProvider } from "react-helmet-async";
import { Routes, Route } from "react-router-dom";
import { Button } from "./components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import ScrollToTop from "./lib/ScrollToTop";
import GoogleAnalytics from "./lib/GoogleAnalytics";
import ErrorBoundary, { PageLoadingFallback } from "./components/ErrorBoundary";

// Eagerly loaded components (critical path)
import MainLayout from "./components/layout/MainLayout";
import Landing from "./components/layout/Landing";

// Lazy loaded page components for code splitting
const TrainingPaceCalculator = lazy(() => import("./pages/TrainingPaceCalculator"));
const RacePredictorOverlay = lazy(() => import("./pages/RacePredictorOverlay"));
const Login = lazy(() => import("./pages/Login"));
const Logout = lazy(() => import("./components/login/Logout"));
const Register = lazy(() => import("./components/login/Register"));
const ResetPassword = lazy(() => import("./components/login/ResetPassword"));
const ResetConfirmed = lazy(() => import("./components/login/ResetConfirmed"));
const ElevationPage = lazy(() => import("./pages/ElevationPageV2"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Settings = lazy(() => import("./pages/Settings"));
const PreviewRoute = lazy(() => import("./pages/PreviewRoute"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const About = lazy(() => import("./pages/About"));
const DashboardV2 = lazy(() => import("./pages/DashboardV2"));
const RaceGuide = lazy(() => import("./pages/guides/RaceGuide"));

// Lazy loaded feature components
const FuelPlannerV2 = lazy(() =>
  import("./features/fuel").then((module) => ({ default: module.FuelPlannerV2 }))
);

function App() {
  const [showPredictor, setShowPredictor] = useState(false);
  return (
    <ErrorBoundary>
      <ScrollToTop />
      <HelmetProvider>
        <Suspense fallback={<PageLoadingFallback />}>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Landing />} />
              <Route
                path="/calculator"
                element={
                  <ErrorBoundary>
                    <TrainingPaceCalculator />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/fuel"
                element={
                  <ErrorBoundary>
                    <FuelPlannerV2 />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/elevation-finder"
                element={
                  <ErrorBoundary>
                    <ElevationPage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/elevation-finder/:docId"
                element={
                  <ErrorBoundary>
                    <ElevationPage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/elevationfinder/:docId"
                element={
                  <ErrorBoundary>
                    <ElevationPage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/elevationfinder"
                element={
                  <ErrorBoundary>
                    <ElevationPage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ErrorBoundary>
                    <DashboardV2 />
                  </ErrorBoundary>
                }
              />
              <Route path="/ethos" element={<About />} />
              <Route path="login" element={<Login />} />
              <Route path="logout" element={<Logout />} />
              <Route path="register" element={<Register />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/reset-confirmed" element={<ResetConfirmed />} />
              <Route path="/settings" element={<Settings />} />
              <Route
                path="/faq"
                element={
                  <ErrorBoundary>
                    <FAQ />
                  </ErrorBoundary>
                }
              />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/about" element={<About />} />
              <Route
                path="/preview-route/:slug"
                element={
                  <ErrorBoundary>
                    <PreviewRoute />
                  </ErrorBoundary>
                }
              />
              {/* Programmatic SEO: Race distance guides */}
              <Route
                path="/guide/:distance"
                element={
                  <ErrorBoundary>
                    <RaceGuide />
                  </ErrorBoundary>
                }
              />
              {/* Wildcard route should be last */}
              <Route path="*" element={<Landing />} />
            </Route>
          </Routes>
        </Suspense>
        <GoogleAnalytics />
      </HelmetProvider>
      <Button
        onClick={() => setShowPredictor(true)}
        className="fixed bottom-4 right-4 rounded-full p-3 bg-blue-600 text-white shadow-md z-50"
        aria-label="Open race predictor"
      >
        🔮
      </Button>
      <Suspense fallback={null}>
        <RacePredictorOverlay
          isOpen={showPredictor}
          onClose={() => setShowPredictor(false)}
        />
      </Suspense>
      <Toaster />
    </ErrorBoundary>
  );
}

export default App;
