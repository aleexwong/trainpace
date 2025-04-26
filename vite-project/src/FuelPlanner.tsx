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
import { Info, Download, Copy } from "lucide-react";
import { toast } from "./hooks/use-toast";

const FuelPlanner = () => {
  const [raceType, setRaceType] = useState("10K");
  const [weight, setWeight] = useState("68");
  const [time, setTime] = useState("50");
  const [result, setResult] = useState<null | {
    carbsPerHour: number;
    totalCarbs: number;
    totalCalories: number;
    gelsNeeded: number;
  }>(null);

  const handleCalculate = () => {
    const weightKg = parseFloat(weight);
    const finishTimeMin = parseFloat(time);
    if (isNaN(weightKg) || isNaN(finishTimeMin)) return;

    let carbsPerHour = 30;
    if (raceType === "Half") carbsPerHour = 45;
    if (raceType === "Full") carbsPerHour = 75;

    const durationHours = finishTimeMin / 60;
    const totalCarbs = Math.round(durationHours * carbsPerHour);
    const totalCalories = totalCarbs * 4;
    const gelsNeeded = Math.ceil(totalCarbs / 25);

    setResult({ carbsPerHour, totalCarbs, totalCalories, gelsNeeded });
  };

  const handleCopy = () => {
    if (!result) return;
    const text = `Fuel Plan for ${raceType}\n\nCarbs/hr: ${result.carbsPerHour}g\nTotal Carbs: ${result.totalCarbs}g\nCalories: ${result.totalCalories} kcal\nGels: ${result.gelsNeeded}`;
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Copied to clipboard!" });
    });
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([
      `Fuel Plan for ${raceType}\n\nCarbs/hr: ${result.carbsPerHour}g\nTotal Carbs: ${result.totalCarbs}g\nCalories: ${result.totalCalories} kcal\nGels: ${result.gelsNeeded}`,
    ]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fuel-plan-${raceType.toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "Download started!" });
  };

  return (
    <>
      <Helmet>
        <title>Fuel Planner By TrainPace - Optimize Your Run</title>
        <meta name="description" content="Calculate your fueling needs"></meta>
      </Helmet>
      <TooltipProvider>
        <div className="max-w-xl mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-center">🏃 Fuel Planner</h1>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="ml-2 text-blue-600 hover:bg-blue-50"
                >
                  <Info className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Why Fueling Matters ⚡</DialogTitle>
                  <DialogDescription>
                    Your body needs carbs to perform. This tool estimates how
                    many carbs and gels you’ll need based on your finish time.
                  </DialogDescription>
                </DialogHeader>
                <ul className="list-disc list-inside text-sm text-gray-700">
                  <li>30–60g carbs/hr for efforts over 1 hour</li>
                  <li>Gels usually contain ~25g carbs each</li>
                  <li>Match fueling to avoid energy crashes</li>
                </ul>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="bg-blue-50">
            <CardContent className="p-6 space-y-4">
              <div>
                <Label>Race Type</Label>
                <Select onValueChange={setRaceType} value={raceType}>
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
                <Label>Weight (kg)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 68"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Estimated Finish Time (min)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 50"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="mt-1"
                />
              </div>

              <Button
                onClick={handleCalculate}
                className="w-full mt-2 bg-blue-600 text-white"
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
                          className="ml-2 text-blue-600 hover:bg-blue-50"
                          onClick={handleCopy}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy Plan</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="ml-2 text-blue-600 hover:bg-blue-50"
                          onClick={handleDownload}
                        >
                          <Download className="h-4 w-4" />
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
                  <strong>Recommended gels:</strong> {result.gelsNeeded}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </TooltipProvider>
    </>
  );
};

export default FuelPlanner;
// function useToast(): { toast: any } {
//   throw new Error("Function not implemented.");
// }
