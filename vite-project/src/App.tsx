import { useState } from "react";
import "./App.css";
import { HelmetProvider } from "react-helmet-async";
import Footer from "./Footer";
import TrainingPaceCalculator from "./TrainingPaceCalculator";
import { Toaster } from "@/components/ui/toaster";
import GoogleAnalytics from "./lib/GoogleAnalytics";
import { Button } from "./components/ui/button";
import RacePredictorOverlay from "./RacePredictorOverlay";
import { AuthProvider } from "./features/auth/AuthContext";
import { LoginButton } from "./features/auth/LoginButton";
import { LogoutButton } from "./features/auth/LogoutButton";
import Landing from "./Landing";

function App() {
  const [showPredictor, setShowPredictor] = useState(false);

  return (
    <>
      <AuthProvider>
        <HelmetProvider>
          <GoogleAnalytics />
        </HelmetProvider>
        <Landing />
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
      </AuthProvider>
    </>
  );
}

export default App;
