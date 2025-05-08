import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import ReactGA from "react-ga4";

interface RacePredictorOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const RACE_DISTANCES = [
  { label: "5K", value: 5 },
  { label: "10K", value: 10 },
  { label: "Half Marathon", value: 21.0975 },
  { label: "Marathon", value: 42.195 },
];

const predictRaceTime = (
  knownDistance: number,
  knownTime: number,
  targetDistance: number
): string => {
  const exponent = 1.06;
  const predictedTime =
    knownTime * Math.pow(targetDistance / knownDistance, exponent);
  const hours = Math.floor(predictedTime / 60);
  const minutes = Math.floor(predictedTime % 60);
  const seconds = Math.round((predictedTime * 60) % 60);
  return `${hours}h ${minutes}m ${seconds}s`;
};

const RacePredictorOverlay: React.FC<RacePredictorOverlayProps> = ({
  isOpen,
  onClose,
}) => {
  const [step, setStep] = useState<number>(1);
  const [knownDistance, setKnownDistance] = useState<string>("");
  const [knownTime, setKnownTime] = useState<string>("");
  const [targetDistance, setTargetDistance] = useState<string>("");
  const [result, setResult] = useState<string | null>(null);

  const nextStep = () => setStep(2);
  const prevStep = () => setStep(1);

  const handlePrediction = () => {
    const d = parseFloat(knownDistance);
    const t = parseFloat(knownTime);
    const target = parseFloat(targetDistance);

    if (isNaN(d) || isNaN(t) || isNaN(target) || d === 0) {
      setResult("❌ Invalid input");
      return;
    }

    const prediction = predictRaceTime(d, t, target);
    setResult(prediction);
    //Track usage in Google Analytics
    ReactGA.event({
      category: "Race Predictor",
      action: "Predicted Race Time",
      label: `From ${d}km in ${t}min → to ${target}km`,
    });
  };

  const resetForm = () => {
    setKnownDistance("");
    setKnownTime("");
    setTargetDistance("");
    setResult(null);
    setStep(1);
    onClose();
  };

  const selectedLabel = RACE_DISTANCES.find(
    (r) => r.value.toString() === targetDistance
  )?.label;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-t-2xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">🔮 Race Time Predictor</h2>
          <Button
            aria-label="Close"
            variant="ghost"
            onClick={resetForm}
            className="p-1 bg-transparent hover:bg-transparent focus:bg-transparent"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                What distance did you race?
              </label>
              <Input
                type="number"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]+" // Allow decimal numbers
                placeholder="Distance in km"
                value={knownDistance}
                onChange={(e) => setKnownDistance(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                What was your time?
              </label>
              <Input
                type="number"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]+" // Allow decimal numbers
                placeholder="Time in minutes"
                value={knownTime}
                onChange={(e) => setKnownTime(e.target.value)}
              />
            </div>

            <Button
              onClick={nextStep}
              disabled={!knownDistance || !knownTime}
              className="w-full"
            >
              Next
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <label className="block text-sm font-medium mb-1">
              What distance do you want to predict?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {RACE_DISTANCES.map((race) => (
                <Button
                  key={race.value}
                  variant={
                    targetDistance === race.value.toString()
                      ? "default"
                      : "outline"
                  }
                  onClick={() => {
                    setTargetDistance(race.value.toString());
                    setResult(null); // 🧼 reset prediction when switching races
                  }}
                >
                  {race.label}
                </Button>
              ))}
            </div>

            <Button
              onClick={handlePrediction}
              disabled={!targetDistance}
              className="w-full mt-2"
            >
              🧠 Predict My Time
            </Button>

            {result && (
              <div className="text-center mt-4 text-lg font-semibold">
                Predicted Time for {selectedLabel}:<br />
                {result}
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={prevStep}>
                Back
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RacePredictorOverlay;
