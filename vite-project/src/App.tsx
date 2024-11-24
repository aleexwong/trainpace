import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import TrainingPaceCalculator from "./TrainingPaceCalculator";
import { Toaster } from "@/components/ui/toaster";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <TrainingPaceCalculator />
      <Toaster />
    </>
  );
}

export default App;
