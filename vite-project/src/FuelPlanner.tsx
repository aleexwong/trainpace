import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Info, Download, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "@/hooks/use-toast"; // make sure this path is correct

const raceSettings = {
  "10K": 30,
  Half: 45,
  Full: 75,
};

const FuelPlanner = () => {
  const [raceType, setRaceType] = useState<keyof typeof raceSettings>("10K");
  const [weight, setWeight] = useState("");
  const [time, setTime] = useState("");
  const [result, setResult] = useState<null | {
    carbsPerHour: number;
    totalCarbs: number;
    totalCalories: number;
    gelsNeeded: number;
  }>(null);
  const [showInfo, setShowInfo] = useState(false);

  const handleCalculate = () => {
    const weightKg = parseFloat(weight);
    const finishTimeMin = parseFloat(time);

    if (isNaN(finishTimeMin) || finishTimeMin <= 0) {
      toast({ title: "Please enter valid numbers." });
      return;
    }

    if (!isNaN(weightKg) && (weightKg < 1 || weightKg > 1000)) {
      toast({ title: "Weight must be between 1kg and 1000kg." });
      return;
    }

    let carbsPerHour = raceSettings[raceType];

    if (!isNaN(weightKg) && weightKg > 0) {
      carbsPerHour = Math.round(weightKg * 0.7);
    }

    const durationHours = finishTimeMin / 60;
    const totalCarbs = Math.round(durationHours * carbsPerHour);
    const totalCalories = totalCarbs * 4;

    let gelsNeeded = 0;

    if (raceType === "10K") {
      gelsNeeded = durationHours >= 0.75 ? 1 : 0; // 1 gel only if >45min 10K
    } else {
      const gelsPerHour = 1.5;
      gelsNeeded = Math.ceil(durationHours * gelsPerHour);
      gelsNeeded = Math.min(gelsNeeded, 7); // cap at 7
    }

    setResult({ carbsPerHour, totalCarbs, totalCalories, gelsNeeded });
  };

  const handleCopy = async () => {
    if (!result) return;
    const text = buildResultText(raceType, result);
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied to clipboard!" });
    } catch {
      toast({ title: "Failed to copy.", variant: "destructive" });
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([buildResultText(raceType, result)], {
      type: "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fuel-plan-${raceType.toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Download started!" });
  };

  const buildResultText = (
    raceType: string,
    result: {
      carbsPerHour: number;
      totalCarbs: number;
      totalCalories: number;
      gelsNeeded: number;
    }
  ) => {
    return `Fuel Plan for ${raceType}\n\nCarbs/hr: ${result.carbsPerHour}g\nTotal Carbs: ${result.totalCarbs}g\nCalories: ${result.totalCalories} kcal\nGels: ${result.gelsNeeded}`;
  };

  return (
    <>
      <Helmet>
        <title>Fuel Planner by TrainPace</title>
        <meta
          name="description"
          content="Optimize your running fuel strategy."
        />
      </Helmet>

      <TooltipProvider>
        <div className="max-w-xl mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-center">🏃 Fuel Planner</h1>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Info className="h-5 w-5 text-blue-600" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Why Fueling Matters ⚡</DialogTitle>
                  <DialogDescription>
                    Your body needs carbs to perform. This tool estimates how
                    many carbs and gels you'll need.
                  </DialogDescription>
                </DialogHeader>
                <ul className="list-disc list-inside text-sm text-gray-700 mt-2">
                  <li>30–60g carbs/hr for efforts over 1 hour</li>
                  <li>Gels usually contain ~25g carbs each</li>
                  <li>Proper fueling avoids energy crashes</li>
                </ul>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="bg-blue-50">
            <CardContent className="p-6 space-y-4">
              <div>
                <Label>
                  Race Type<span className="text-red-500">*</span>
                </Label>
                <Select
                  value={raceType}
                  onValueChange={(val) =>
                    setRaceType(val as keyof typeof raceSettings)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select race type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10K">10K</SelectItem>
                    <SelectItem value="Half">Half Marathon (21.1K)</SelectItem>
                    <SelectItem value="Full">Full Marathon (42.2K)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>
                  Weight (kg)
                  <span className="text-gray-500 text-xs ml-1">(Optional)</span>
                </Label>
                <Input
                  type="number"
                  placeholder="e.g. 68"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  min={1}
                  max={1000}
                  className="mt-1"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Filling your weight personalizes your fueling plan.
                </p>
              </div>

              <div>
                <Label>
                  Estimated Finish Time (min)
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  placeholder="e.g. 50"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  min={1}
                  className="mt-1"
                />
              </div>

              <Button
                onClick={handleCalculate}
                className="w-full mt-4 bg-blue-600 text-white"
              >
                Calculate Fuel Plan
              </Button>
            </CardContent>
          </Card>

          {result && (
            <Card className="bg-white shadow-sm border">
              <CardContent className="p-6 space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Your Plan 🔋</h2>
                  <div className="flex gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleCopy}
                        >
                          <Copy className="h-4 w-4 text-blue-600" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy Plan</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleDownload}
                        >
                          <Download className="h-4 w-4 text-blue-600" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Download Plan</TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                <p>
                  <strong>Carbs/hr:</strong> {result.carbsPerHour}g
                </p>
                <p>
                  <strong>Total carbs needed:</strong> {result.totalCarbs}g
                </p>
                <p>
                  <strong>Total calories:</strong> {result.totalCalories} kcal
                </p>
                <p>
                  <strong>Recommended gels:</strong>{" "}
                  {raceType === "10K" && result.gelsNeeded === 0
                    ? "Optional: No gels needed for short races."
                    : `${result.gelsNeeded} gel${
                        result.gelsNeeded > 1 ? "s" : ""
                      }`}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Expandable Fueling Philosophy Section */}
          <div className="mt-6">
            <Button
              variant="outline"
              className="w-full flex items-center justify-between"
              onClick={() => setShowInfo((prev) => !prev)}
            >
              <span>Fueling Philosophy</span>
              {showInfo ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </Button>
            {showInfo && (
              <Card className="mt-2 bg-gray-50">
                <CardContent className="p-4 text-sm text-gray-700 space-y-2">
                  <p>
                    Fuel needs depend on race distance, duration, and personal
                    tolerance.
                  </p>
                  <ul className="list-disc list-inside ml-2">
                    <li>
                      <strong>10K races:</strong> Most runners can complete
                      without fueling. For races over ~45 min, 1 gel may help,
                      but fueling is optional.
                    </li>
                    <li>
                      <strong>Half & Full Marathons:</strong> We suggest up to
                      1.5 gels per hour, with a maximum of 7 gels total.
                    </li>
                  </ul>
                  <p>
                    This approach balances energy needs without overloading
                    digestion — based on real-world marathon fueling strategies.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </TooltipProvider>
    </>
  );
};

export default FuelPlanner;
