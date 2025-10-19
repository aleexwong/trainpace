/**
 * Race Details Form Component
 * Input form for race type, finish time, and weight
 */

import { Card, CardContent } from "@/components/ui/card";
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
  onCalculate,
}: RaceDetailsFormProps) {
  return (
    <Card className="bg-white shadow-lg">
      <CardContent className="p-8 space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
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
                className={`py-4 px-2 text-sm sm:text-base font-semibold rounded-xl transition-all ${
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Finish Time - Conditional based on race type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Finish Time <span className="text-red-500">*</span>
            </label>
            {raceType === "10K" ? (
              <input
                type="number"
                placeholder="Minutes (e.g. 45)"
                value={timeMinutes}
                onChange={(e) => setTimeMinutes(e.target.value)}
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min={1}
              />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Hours"
                  value={timeHours}
                  onChange={(e) => setTimeHours(e.target.value)}
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min={0}
                  max={12}
                />
                <input
                  type="number"
                  placeholder="Minutes"
                  value={timeMinutes}
                  onChange={(e) => setTimeMinutes(e.target.value)}
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min={0}
                  max={59}
                />
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
          </div>
        </div>

        <button
          onClick={onCalculate}
          className="w-full py-4 text-lg font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-md"
        >
          Calculate Fuel Plan
        </button>
      </CardContent>
    </Card>
  );
}
