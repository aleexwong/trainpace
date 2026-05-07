import { Suspense, lazy, useState } from "react";
import "./App.css";
import { HelmetProvider } from "react-helmet-async";
import { Routes, Route } from "react-router-dom";
import { Button } from "./components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import ScrollToTop from "./lib/ScrollToTop";
import GoogleAnalytics from "./lib/GoogleAnalytics";
import Landing from "./components/layout/Landing";
import MainLayout from "./components/layout/MainLayout";
import AuthGuard from "./features/auth/AuthGuard";

const TrainingPaceCalculator = lazy(() => import("./pages/TrainingPaceCalculator"));
const RacePredictorOverlay = lazy(() => import("./pages/RacePredictorOverlay"));
const ElevationPage = lazy(() => import("./pages/ElevationPageV2"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Settings = lazy(() => import("./pages/Settings"));
const PreviewRoute = lazy(() => import("./pages/PreviewRoute"));
const CalculatorSeoLanding = lazy(() => import("./pages/CalculatorSeoLanding"));
const FuelSeoLanding = lazy(() => import("./pages/FuelSeoLanding"));
const ElevationGuidesSeoLanding = lazy(
  () => import("./pages/ElevationGuidesSeoLanding")
);
const RaceSeoLanding = lazy(() => import("./pages/RaceSeoLanding"));
const RaceIndex = lazy(() => import("./pages/RaceIndex"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const About = lazy(() => import("./pages/About"));
const DashboardV2 = lazy(() => import("./pages/DashboardV2"));
const VdotCalculatorPage = lazy(() => import("./pages/VdotCalculatorPage"));
const Login = lazy(() => import("./pages/Login"));
const Logout = lazy(() => import("./components/login/Logout"));
const Register = lazy(() => import("./components/login/Register"));
const ResetPassword = lazy(() => import("./components/login/ResetPassword"));
const ResetConfirmed = lazy(() => import("./components/login/ResetConfirmed"));
const FuelPlannerV2 = lazy(() =>
  import("./features/fuel").then((module) => ({ default: module.FuelPlannerV2 }))
);
const BlogList = lazy(() =>
  import("./features/blog").then((module) => ({ default: module.BlogList }))
);
const BlogPost = lazy(() =>
  import("./features/blog").then((module) => ({ default: module.BlogPost }))
);

function App() {
  const [showPredictor, setShowPredictor] = useState(false);
  return (
    <>
      <ScrollToTop />
      <HelmetProvider>
        {/* Side Navigation */}
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Landing />} />
              <Route path="/calculator" element={<TrainingPaceCalculator />} />
              <Route
                path="/calculator/:seoSlug"
                element={<CalculatorSeoLanding />}
              />
              <Route path="/fuel" element={<FuelPlannerV2 />} />
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
              <Route
                path="/dashboard"
                element={
                  <AuthGuard>
                    <DashboardV2 />
                  </AuthGuard>
                }
              />
              <Route path="/ethos" element={<About />} />
              <Route path="login" element={<Login />} />
              <Route path="logout" element={<Logout />} />
              <Route path="register" element={<Register />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/reset-confirmed" element={<ResetConfirmed />} />
              <Route
                path="/settings"
                element={
                  <AuthGuard>
                    <Settings />
                  </AuthGuard>
                }
              />
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
    </>
  );
}

export default App;
