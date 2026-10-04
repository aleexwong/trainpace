import "./App.css";
import { HelmetProvider } from "react-helmet-async";
import { Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import ScrollToTop from "./lib/ScrollToTop";
import GoogleAnalytics from "./lib/GoogleAnalytics";
// NOTE: RacePredictorOverlay (Riegel-formula race-time predictor) is parked for now.
// The component still lives at ./pages/RacePredictorOverlay but is intentionally not
// rendered — revisit during the TrainPace rewrite (e.g. fold into the VDOT calculator).
import { appRoutes } from "./routes";

function App() {
  return (
    <>
      <ScrollToTop />
      <HelmetProvider>
        {/* Side Navigation */}
        <Routes>{appRoutes}</Routes>
        <GoogleAnalytics />
      </HelmetProvider>
      <Toaster />
    </>
  );
}

export default App;
