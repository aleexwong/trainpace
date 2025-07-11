import { useState } from "react";
import "./App.css";
import { HelmetProvider } from "react-helmet-async";
import { Routes, Route } from "react-router-dom";
import { Button } from "./components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { initAmplitude } from "@/lib/amplitude";
import ScrollToTop from "./lib/ScrollToTop";
import GoogleAnalytics from "./lib/GoogleAnalytics";
import TrainingPaceCalculator from "./pages/calculator/TrainingPaceCalculator";
import FuelPlanner from "./pages/FuelPlanner";
import RacePredictorOverlay from "./RacePredictorOverlay";
import Landing from "./components/layout/Landing";
import MainLayout from "./components/layout/MainLayout";
import Login from "./pages/login/Login";
import Footer from "./pages/Footer";
import Ethos from "./pages/Ethos";
import Logout from "./pages/login/Logout";
import Register from "./pages/login/Register";
import ResetPassword from "./pages/login/ResetPassword";
import ResetConfirmed from "./pages/login/ResetConfirmed";
import { ElevationChart } from "./pages/elevation-finder/ElevationChart";
import ElevationPage from "./pages/elevation-finder/ElevationPage";
import Dashboard from "./pages/elevation-finder/Dashboard";
function App() {
  const [showPredictor, setShowPredictor] = useState(false);
  const dummyPoints = [
    { distanceKm: 0, elevation: 10 },
    { distanceKm: 1, elevation: 15 },
    { distanceKm: 2, elevation: 12 },
  ];
  initAmplitude();
  // Initialize Amplitude Analytics
  return (
    <>
      <ScrollToTop />
      <HelmetProvider>
        {/* Side Navigation */}
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Landing />} />
            <Route path="/calculator" element={<TrainingPaceCalculator />} />
            <Route path="/fuel" element={<FuelPlanner />} />
            <Route path="/login" element={<Login />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="*" element={<Landing />} />
            <Route path="/elevation-finder" element={<ElevationPage />} />
            <Route
              path="/elevation-finder/:docId"
              element={<ElevationPage />}
            />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/ethos" element={<Ethos />} />
            <Route path="login" element={<Login />} />
            <Route path="logout" element={<Logout />} />
            <Route path="register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/reset-confirmed" element={<ResetConfirmed />} />
            <Route
              path="/elevation"
              element={<ElevationChart points={dummyPoints} />}
            />
          </Route>
        </Routes>
        <GoogleAnalytics />
      </HelmetProvider>
      <Button
        onClick={() => setShowPredictor(true)}
        className="fixed bottom-4 right-4 rounded-full p-3 bg-blue-600 text-white shadow-md z-50"
      >
        🔮
      </Button>
      <RacePredictorOverlay
        isOpen={showPredictor}
        onClose={() => setShowPredictor(false)}
      />
      <Footer />
      <Toaster />
    </>
  );
}

export default App;
