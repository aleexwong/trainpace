import "./App.css";
import { Helmet, HelmetProvider } from "react-helmet-async";
import Footer from "./Footer";
import TrainingPaceCalculator from "./TrainingPaceCalculator";
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <>
      <HelmetProvider>
        <Helmet>
          <script
            async
            src="https://www.googletagmanager.com/gtag/js?id=G-VCYJ0P12DG"
          ></script>
          <script>
            {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-VCYJ0P12DG');
          `}
          </script>
        </Helmet>
      </HelmetProvider>
      <TrainingPaceCalculator />
      <Toaster />
      <Footer />
    </>
  );
}

export default App;
