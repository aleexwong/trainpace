/**
 * Race Details Form Component
 * Input form for race type, finish time, weight, and carbs per hour
 */

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { RACE_SETTINGS, LBS_TO_KG, type RaceType } from "../types";

interface RaceDetailsFormProps {
  raceType: RaceType;
  setRaceType: (type: RaceType) => void;
  weight: string;
  setWeight: (weight: string) => void;
  timeHours: string;
  setTimeHours: (hours: string) => void;
  timeMinutes: string;
  setTimeMinutes: (minutes: string) => void;
  carbsPerHour: number;
  setCarbsPerHour: (carbs: number) => void;
  onCalculate: () => void;
}

export function RaceDetailsForm({
  raceType,
  setRaceType,
  weight,
  setWeight,
  timeHours,
  setTimeHours,
  timeMinutes,
  setTimeMinutes,
  carbsPerHour,
  setCarbsPerHour,
  onCalculate,
}: RaceDetailsFormProps) {
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");
  const [displayValue, setDisplayValue] = useState("");
  
  // Handle weight input changes
  const handleWeightChange = (value: string) => {
    // Allow empty, numbers, and one decimal point
    if (value && !/^\d*\.?\d*$/.test(value)) {
      return; // Reject invalid input
    }
    
    setDisplayValue(value);
    
    if (!value) {
      setWeight("");
      console.log("[Weight Input] Cleared");
      return;
    }
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    
    // Always store weight in kg internally
    if (weightUnit === "lbs") {
      const kg = numValue * LBS_TO_KG;
      setWeight(kg.toString());
      console.log(`[Weight Input] ${numValue} lbs → ${kg.toFixed(2)} kg`);
    } else {
      setWeight(value);
      console.log(`[Weight Input] ${value} kg`);
    }
  };
  
  // Handle unit toggle
  const handleUnitChange = (newUnit: "kg" | "lbs") => {
    setWeightUnit(newUnit);
    
    if (!weight) {
      setDisplayValue("");
      return;
    }
    
    const weightKg = parseFloat(weight);
    if (isNaN(weightKg)) return;
    
    if (newUnit === "lbs") {
      const lbs = weightKg / LBS_TO_KG;
      // Format to reasonable precision for display
      const displayLbs = Math.round(lbs * 10) / 10; // 1 decimal place
      setDisplayValue(displayLbs.toString());
      console.log(`[Weight Unit] Switched to lbs: ${weightKg.toFixed(2)} kg → ${displayLbs} lbs`);
    } else {
      // Format kg to reasonable precision
      const displayKg = Math.round(weightKg * 10) / 10; // 1 decimal place
      setDisplayValue(displayKg.toString());
      console.log(`[Weight Unit] Switched to kg: ${displayKg} kg`);
    }
  };
  return (
    <Card className="bg-white shadow-lg h-full">
      <CardContent className="p-6 md:p-8 space-y-5">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
          Race Details
        </h2>

        {/* Race Type - Button Pills */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Race Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 min-[400px]:grid-cols-3 gap-3">
            {(Object.keys(RACE_SETTINGS) as RaceType[]).map((type) => (
              <button
                key={type}
                onClick={() => setRaceType(type)}
                className={`py-3 md:py-4 px-2 text-sm sm:text-base font-semibold rounded-xl transition-all ${
                  raceType === type
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {type === "10K"
                  ? "10K"
                  : type === "Half"
                    ? "Half Marathon"
                    : "Full Marathon"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Finish Time - Conditional based on race type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Finish Time <span className="text-red-500">*</span>
            </label>
            {raceType === "10K" ? (
              <div>
                <input
                  type="number"
                  placeholder="Minutes (e.g. 45)"
                  value={timeMinutes}
                  onChange={(e) => setTimeMinutes(e.target.value)}
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min={1}
                />
                <span className="text-xs text-gray-500 mt-1 block">Minutes</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="number"
                    placeholder="HH"
                    value={timeHours}
                    onChange={(e) => setTimeHours(e.target.value)}
                    className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min={0}
                    max={12}
                  />
                  <span className="text-xs text-gray-500 mt-1 block">Hours</span>
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="MM"
                    value={timeMinutes}
                    onChange={(e) => setTimeMinutes(e.target.value)}
                    className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min={0}
                    max={59}
                  />
                  <span className="text-xs text-gray-500 mt-1 block">Minutes</span>
                </div>
              </div>
            )}
          </div>

          {/* Weight with inline kg/lbs toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weight{" "}
              <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                placeholder={weightUnit === "kg" ? "e.g. 68.5" : "e.g. 150"}
                value={displayValue}
                onChange={(e) => handleWeightChange(e.target.value)}
                className="w-full px-4 py-3 pr-20 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <button
                  type="button"
                  onClick={() => handleUnitChange("kg")}
                  className={`px-3 py-1 text-sm font-medium rounded-lg transition-all ${
                    weightUnit === "kg"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  kg
                </button>
                <button
                  type="button"
                  onClick={() => handleUnitChange("lbs")}
                  className={`px-3 py-1 text-sm font-medium rounded-lg transition-all ${
                    weightUnit === "lbs"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  lbs
                </button>
              </div>
            </div>
            <span className="text-xs text-gray-500 mt-1 block">
              Increases carb needs for heavier athletes
            </span>
          </div>
        </div>

        {/* Carbs per Hour Slider */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Carbs per Hour
            </label>
            <span className="text-sm font-semibold text-blue-600">
              {carbsPerHour}g
            </span>
          </div>
          <Slider
            value={[carbsPerHour]}
            onValueChange={(value) => setCarbsPerHour(value[0])}
            min={30}
            max={90}
            step={5}
            className="mt-2"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Low (30g)</span>
            <span>Moderate (60g)</span>
            <span>High (90g)</span>
          </div>
        </div>

        <button
          onClick={onCalculate}
          className="w-full py-4 text-lg font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-md mt-2"
        >
          Generate Fuel Plan
        </button>
      </CardContent>
    </Card>
  );
}
