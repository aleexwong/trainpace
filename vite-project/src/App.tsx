import "./App.css";
import Footer from "./Footer";
import TrainingPaceCalculator from "./TrainingPaceCalculator";
import { Toaster } from "@/components/ui/toaster";
import RunningTips from "./RunningTips";

function App() {
  // const [count, setCount] = useState(0);

  return (
    <>
      <TrainingPaceCalculator />
      <Toaster />
      <RunningTips />
      <Footer />
    </>
  );
}

export default App;
