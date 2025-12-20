/**
 * Race Details Form Component
 * Input form for race type, finish time, weight, and carbs per hour
 */

import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { RACE_SETTINGS, type RaceType } from "../types";

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

          {/* Weight */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weight (kg){" "}
              <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <input
              type="number"
              placeholder="e.g. 68"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min={1}
              max={1000}
            />
            <span className="text-xs text-gray-500 mt-1 block">
              Used for personalized carb calculation
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
