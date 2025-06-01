import { useState } from "react";
import "./App.css";
import { HelmetProvider } from "react-helmet-async";
import { Routes, Route } from "react-router-dom";
import { Button } from "./components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { initAmplitude } from "@/lib/amplitude";
import ScrollToTop from "./lib/ScrollToTop";
import GoogleAnalytics from "./lib/GoogleAnalytics";
import TrainingPaceCalculator from "./TrainingPaceCalculator";
import FuelPlanner from "./FuelPlanner";
import RacePredictorOverlay from "./RacePredictorOverlay";
// import SideNav from "./SideNav";
import Landing from "./Landing";
import MainLayout from "./MainLayout";
import Login from "./Login";
import Footer from "./Footer";
import Ethos from "./Ethos";
import Logout from "./Logout";
import Register from "./Register";
import ResetPassword from "./ResetPassword";
import ResetConfirmed from "./ResetConfirmed";
import SideNavPortal from "./components/layout/SideNavPortal";

function App() {
  const [showPredictor, setShowPredictor] = useState(false);
  initAmplitude();
  // Initialize Amplitude Analytics
  return (
    <>
      <SideNavPortal />
      <ScrollToTop />
      <HelmetProvider>
        {/* Side Navigation */}
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Landing />} />
            <Route path="/calculator" element={<TrainingPaceCalculator />} />
            <Route path="/fuel" element={<FuelPlanner />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Landing />} />
            <Route path="/ethos" element={<Ethos />} />
            {/* <Route path="dashboard" element={<Dashboard />} /> */}
            <Route path="login" element={<Login />} />
            <Route path="logout" element={<Logout />} />
            <Route path="register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/reset-confirmed" element={<ResetConfirmed />} />
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
