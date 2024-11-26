import { useState } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, RotateCcw, Calculator } from "lucide-react";
import { toast } from "./hooks/use-toast";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import RunningTips from "./RunningTips";

// const PRESET_DISTANCES = [
//   { name: "Half Marathon", distance: 13.1 },
//   { name: "Marathon", distance: 26.2 },
//   { name: "10K", distance: 6.2 },
//   { name: "5K", distance: 3.1 },
//   { name: "1 Mile", distance: 1 },
//   { name: "800m", distance: 0.5 },
// ];

const PRESET_DISTANCES_IN_KM = [
  { name: "Half Marathon", distance: 21.1 },
  { name: "Marathon", distance: 42.2 },
  { name: "10K", distance: 10 },
  { name: "5K", distance: 5 },
  { name: "1 KM", distance: 1 },
  { name: "800m", distance: 0.8 },
];

const initialFormState = {
  distance: "",
  units: "km",
  hours: "",
  minutes: "",
  seconds: "",
  paceType: "Km",
};

const TrainingPaceCalculator = () => {
  const [formData, setFormData] = useState(initialFormState);
  const [results, setResults] = useState<Record<string, string> | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCalculating, setIsCalculating] = useState(false);

  // Convert time to seconds
  const timeToSeconds = (h: any, m: any, s: any) => {
    return (
      parseInt(h || "0") * 3600 + parseInt(m || "0") * 60 + parseInt(s || "0")
    );
  };

  // Convert seconds to time string
  const secondsToTimeString = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Convert pace between miles and kilometers
  const convertPace = (
    paceInSeconds: number,
    fromUnit: string,
    toUnit: string
  ) => {
    if (fromUnit === toUnit) return paceInSeconds;
    return fromUnit === "miles"
      ? paceInSeconds * 0.621371 // km to mile
      : paceInSeconds / 0.621371; // mile to km
  };

  // Calculate training paces
  const calculateTrainingPaces = (
    raceTimeSeconds: number,
    raceDistance: number,
    units: string
  ) => {
    // Calculate base pace per mile/km
    const basePaceSeconds = raceTimeSeconds / raceDistance;

    // Convert to selected unit if necessary
    const convertedBasePace = convertPace(
      basePaceSeconds,
      units,
      formData.paceType.toLowerCase()
    );

    // Calculate different training paces (multipliers based on common training principles)
    const paces: Record<string, [number, number]> = {
      easy: [convertedBasePace * 1.2, convertedBasePace * 1.3],
      tempo: [convertedBasePace * 0.95, convertedBasePace * 1.05],
      maximum: [convertedBasePace * 0.85, convertedBasePace * 0.95],
      speed: [convertedBasePace * 0.8, convertedBasePace * 0.9],
      xlong: [convertedBasePace * 1.3, convertedBasePace * 1.4],
    };

    // Calculate Yasso 800s (special case)
    const marathonTimeHours = raceTimeSeconds / 3600;
    const yassoSeconds = marathonTimeHours * 60;
    paces.yasso = [yassoSeconds - 30, yassoSeconds + 30];

    // Convert all paces to time strings
    return Object.entries(paces).reduce(
      (acc: Record<string, string>, [key, [min, max]]) => {
        const unit =
          key === "yasso" ? "/800m" : `/${formData.paceType.toLowerCase()}`;
        acc[key] = `${secondsToTimeString(min)}-${secondsToTimeString(
          max
        )} min${unit}`;
        return acc;
      },
      {}
    );
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Distance validation
    if (!formData.distance) {
      newErrors.distance = "Distance is required";
    } else if (
      isNaN(Number(formData.distance)) ||
      parseFloat(formData.distance) <= 0
    ) {
      newErrors.distance = "Please enter a valid distance";
    }

    // Time validation
    const hours = parseInt(formData.hours || "0");
    const minutes = parseInt(formData.minutes || "0");
    const seconds = parseInt(formData.seconds || "0");

    if (hours === 0 && minutes === 0 && seconds === 0) {
      newErrors.time = "Please enter a valid time";
    }

    if (minutes >= 60 || seconds >= 60) {
      newErrors.time = "Invalid time format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePreset = (distance: number) => {
    setFormData((prev) => ({
      ...prev,
      distance: distance.toString(),
    }));
    setErrors({});
  };

  const handleInputChange = (e: { target: { name: any; value: any } }) => {
    const { name, value } = e.target;
    // Log the entire event object
    console.log("Full event:", e);

    // Log the name and value specifically
    console.log("Input name:", e.target.name);
    console.log("Input value:", e.target.value);
    // Time input validation
    if (["hours", "minutes", "seconds"].includes(name)) {
      const numValue = value.replace(/\D/g, "");
      setFormData((prev) => ({
        ...prev,
        [name]: numValue.slice(0, 2),
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setResults(null);
    setErrors({});
    toast({
      title: "Calculator Reset",
      description: "All values have been cleared.",
      duration: 3000,
    });
  };

  const calculatePaces = () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please check the form for errors.",
        variant: "destructive",
      });
      return;
    }

    setIsCalculating(true);

    try {
      const totalSeconds = timeToSeconds(
        formData.hours,
        formData.minutes,
        formData.seconds
      );

      const distance = parseFloat(formData.distance);
      const calculatedPaces = calculateTrainingPaces(
        totalSeconds,
        distance,
        formData.units
      );

      setResults(calculatedPaces);
      toast({
        title: "Calculation Complete",
        description: "Your training paces have been calculated.",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Calculation Error",
        description: "An error occurred while calculating paces.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const isEmptyForm = () => {
    return (
      !formData.distance &&
      !formData.hours &&
      !formData.minutes &&
      !formData.seconds
    );
  };

  const isKm = formData.units === "km";

  return (
    <div className="max-w-4xl mx-auto px-0 sm:px-4">
      <Card className="shadow-lg w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Training Pace Calculator
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Preset Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-6">
            {PRESET_DISTANCES_IN_KM.map((preset) => (
              <TooltipProvider key={preset.name}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={
                        formData.distance === preset.distance.toString()
                          ? "default"
                          : "outline"
                      }
                      onClick={() => handlePreset(preset.distance)}
                      className="w-full transition-all hover:scale-105"
                    >
                      {preset.name}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{preset.distance} km</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>

          {/* Input Form */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Distance Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Race Distance</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Enter distance"
                    name="distance"
                    value={formData.distance}
                    onChange={handleInputChange}
                    className={`w-2/3 ${
                      errors.distance ? "border-red-500" : ""
                    }`}
                  />
                  <div
                    className="relative w-40 h-10 bg-blue-100 rounded-full cursor-pointer overflow-hidden"
                    onClick={() =>
                      handleInputChange({
                        target: {
                          name: "units",
                          value: isKm ? "miles" : "km",
                        },
                      })
                    }
                  >
                    {/* Sliding Indicator */}
                    <div
                      className={`absolute top-1 left-1 w-[calc(50%-0.25rem)] h-8 bg-blue-600 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
                        !isKm ? "translate-x-full" : "translate-x-0"
                      }`}
                    />

                    {/* Labels */}
                    <div className="absolute inset-0 flex items-center">
                      <div
                        className={`w-1/2 text-center font-medium transition-colors ${
                          isKm ? "text-white" : "text-blue-700"
                        }`}
                      >
                        KM
                      </div>
                      <div
                        className={`w-1/2 text-center font-medium transition-colors ${
                          !isKm ? "text-white" : "text-blue-700"
                        }`}
                      >
                        MI
                      </div>
                    </div>
                  </div>
                </div>
                {errors.distance && (
                  <p className="text-red-500 text-sm">{errors.distance}</p>
                )}
              </div>

              {/* Time Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Race Time</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      placeholder="HH"
                      name="hours"
                      value={formData.hours}
                      onChange={handleInputChange}
                      className={`${errors.time ? "border-red-500" : ""}`}
                    />
                    <Clock className="absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                  <span>:</span>
                  <Input
                    type="number"
                    placeholder="MM"
                    name="minutes"
                    value={formData.minutes}
                    onChange={handleInputChange}
                    className={`flex-1 ${errors.time ? "border-red-500" : ""}`}
                  />
                  <span>:</span>
                  <Input
                    type="number"
                    placeholder="SS"
                    name="seconds"
                    value={formData.seconds}
                    onChange={handleInputChange}
                    className={`flex-1 ${errors.time ? "border-red-500" : ""}`}
                  />
                </div>
                {errors.time && (
                  <p className="text-red-500 text-sm">{errors.time}</p>
                )}
              </div>
            </div>

            {/* Pace Type Selection */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium w-1/2">
                Display paces in:
              </label>
              <select
                value={formData.paceType}
                onChange={handleInputChange}
                name="paceType"
                className="w-1/2 border rounded-md p-2 bg-white"
              >
                <option value="km">min/km</option>
                <option value="Miles">min/mile</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={calculatePaces}
                className="flex-1"
                disabled={isCalculating}
              >
                <Calculator className="w-4 h-4 mr-2" />
                Calculate
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                disabled={isEmptyForm()}
                className="w-fit"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            {/* Results */}
            {results && (
              <div className="space-y-2 animate-fadeIn">
                {Object.entries(results).map(([key, value]) => (
                  <div
                    key={key}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <label className="font-medium capitalize text-center sm:text-right flex items-center sm:justify-end justify-center">
                      {key === "xlong" ? "Long Run" : key} Pace:
                    </label>
                    <Input
                      type="text"
                      value={value}
                      readOnly
                      className="bg-white w-full"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          <RunningTips />
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainingPaceCalculator;
