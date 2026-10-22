import "./App.css";
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
import { Landing, pageRoutes } from "./routes";

function App() {
  return (
    <>
      <ScrollToTop />
      <HelmetProvider>
        {/* Side Navigation */}
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Landing />} />
            {pageRoutes.map(({ path, Page, guarded }) => (
              <Route
                key={path}
                path={path}
                element={
                  guarded ? (
                    <AuthGuard>
                      <Page />
                    </AuthGuard>
                  ) : (
                    <Page />
                  )
                }
              />
            ))}
          </Route>
        </Routes>
        <GoogleAnalytics />
      </HelmetProvider>
      <Toaster />
    </>
  );
}

export default App;
