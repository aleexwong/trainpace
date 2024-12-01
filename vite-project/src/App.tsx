import "./App.css";
import { HelmetProvider } from "react-helmet-async";
import Footer from "./Footer";
import TrainingPaceCalculator from "./TrainingPaceCalculator";
import { Toaster } from "@/components/ui/toaster";
import GoogleAnalytics from "./lib/GoogleAnalytics";

function App() {
  return (
    <>
      <HelmetProvider>
        <GoogleAnalytics />
      </HelmetProvider>
      <TrainingPaceCalculator />
      <Toaster />
      <Footer />
    </>
  );
}

export default App;
