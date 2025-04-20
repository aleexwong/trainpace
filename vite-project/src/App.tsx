import { useState } from "react";
import "./App.css";
import { HelmetProvider } from "react-helmet-async";
import Footer from "./Footer";
import { Routes, Route, Link } from "react-router-dom";
import TrainingPaceCalculator from "./TrainingPaceCalculator";
import FuelPlanner from "./FuelPlanner";
import { Toaster } from "@/components/ui/toaster";
import GoogleAnalytics from "./lib/GoogleAnalytics";
import { Button } from "./components/ui/button";
import RacePredictorOverlay from "./RacePredictorOverlay";

function App() {
  const [showPredictor, setShowPredictor] = useState(false);

  return (
    <>
      <Routes>
        <Route path="/" element={<TrainingPaceCalculator />} />
        <Route path="/fuel" element={<FuelPlanner />} />
      </Routes>
      <HelmetProvider>
        <GoogleAnalytics />
      </HelmetProvider>
      {/* <TrainingPaceCalculator /> */}
      <Link to="/fuel" className="text-blue-500 underline">
        Go to Fuel Planner
      </Link>
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
      <Footer />
    </>
  );
}

export default App;
