import { useState } from "react";
import "./App.css";
import { HelmetProvider } from "react-helmet-async";
import Footer from "./Footer";
import TrainingPaceCalculator from "./TrainingPaceCalculator";
import { Toaster } from "@/components/ui/toaster";
import GoogleAnalytics from "./lib/GoogleAnalytics";
import { Button } from "./components/ui/button";
import RacePredictorOverlay from "./RacePredictorOverlay";

function App() {
  const [showPredictor, setShowPredictor] = useState(false);

  return (
    <>
      <HelmetProvider>
        <GoogleAnalytics />
      </HelmetProvider>
      <TrainingPaceCalculator />
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
