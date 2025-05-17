import { useState } from "react";
import "./App.css";
import { HelmetProvider } from "react-helmet-async";
import { Routes, Route } from "react-router-dom";
import { Button } from "./components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import TrainingPaceCalculator from "./TrainingPaceCalculator";
import FuelPlanner from "./FuelPlanner";
import GoogleAnalytics from "./lib/GoogleAnalytics";
import RacePredictorOverlay from "./RacePredictorOverlay";
import SideNav from "./SideNav";
import Landing from "./Landing";
import MainLayout from "./MainLayout";
import Login from "./Login";

function App() {
  const [showPredictor, setShowPredictor] = useState(false);

  return (
    <>
      <HelmetProvider>
        {/* Side Navigation */}
        <SideNav />
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Landing />} />
            <Route path="calculator" element={<TrainingPaceCalculator />} />
            <Route path="fuel" element={<FuelPlanner />} />
            <Route path="login" element={<Login />} />
            <Route path="*" element={<Landing />} />
            {/* <Route path="dashboard" element={<Dashboard />} /> */}
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
      <Toaster />
    </>
  );
}

export default App;
