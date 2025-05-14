import { useState } from "react";
import "./App.css";
import { HelmetProvider } from "react-helmet-async";
import { Routes, Route } from "react-router-dom";
import TrainingPaceCalculator from "./TrainingPaceCalculator";
import FuelPlanner from "./FuelPlanner";
import { Toaster } from "@/components/ui/toaster";
import GoogleAnalytics from "./lib/GoogleAnalytics";
import { Button } from "./components/ui/button";
import RacePredictorOverlay from "./RacePredictorOverlay";
import SideNav from "./SideNav";
import Landing from "./Landing";

function App() {
  const [showPredictor, setShowPredictor] = useState(false);

  return (
    <>
      <HelmetProvider>
        {/* Side Navigation */}
        <SideNav />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/calculator" element={<TrainingPaceCalculator />} />
          <Route path="/fuel" element={<FuelPlanner />} />
          <Route path="*" element={<Landing />} />
        </Routes>
        <GoogleAnalytics />
      </HelmetProvider>
      {/* <TrainingPaceCalculator /> */}
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
