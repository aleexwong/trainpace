/**
 * Race Details Form Component - Updated Modern UI
 * Clean, spacious form for race inputs similar to fuel planner
 */

import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PRESET_DISTANCES } from "../types";
import { convertDistance } from "../utils";
import type { PaceInputs, FormErrors } from "../types";

interface RaceDetailsFormProps {
  inputs: PaceInputs;
  errors: FormErrors;
  onInputChange: (e: { target: { name: string; value: string } }) => void;
  onPresetClick: (distance: number) => void;
  onCalculate: () => void;
  isCalculating: boolean;
}

export function RaceDetailsForm({
  inputs,
  errors,
  onInputChange,
  onPresetClick,
  onCalculate,
  isCalculating,
}: RaceDetailsFormProps) {
  const isKm = inputs.units === "km";

  const handleUnitToggle = () => {
    const newUnit = isKm ? "miles" : "km";

    // Convert existing distance if there is one
    if (inputs.distance && !isNaN(parseFloat(inputs.distance))) {
      const currentDistance = parseFloat(inputs.distance);
      const convertedDistance = convertDistance(
        currentDistance,
        inputs.units,
        newUnit
      );

      // Update both unit and converted distance
      onInputChange({
        target: {
          name: "distance",
          value: convertedDistance.toString(),
        },
      });
    }

    // Update the unit
    onInputChange({
      target: {
        name: "units",
        value: newUnit,
      },
    });
  };

  return (
    <Card className="bg-white shadow-lg">
      <CardContent className="p-8 space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Race Details
        </h2>

        {/* Preset Distances - Button Pills */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Quick Select{" "}
            <span className="text-gray-400 text-xs">(Optional)</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {PRESET_DISTANCES.map((preset) => (
              <TooltipProvider key={preset.name}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onPresetClick(preset.distance)}
                      className={`py-4 px-2 text-sm sm:text-base font-semibold rounded-xl transition-all hover:scale-105 ${
                        inputs.distance === preset.distance.toString()
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {preset.name}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{preset.distance} km</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Distance Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Race Distance <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="decimal"
                placeholder="Distance"
                name="distance"
                min="0"
                max="250"
                step="0.1"
                value={inputs.distance}
                onChange={onInputChange}
                className={`flex-1 px-4 py-3 text-lg border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.distance ? "border-red-500" : "border-gray-300"
                }`}
              />
              <div
                className="relative w-32 h-10 bg-blue-100 rounded-full cursor-pointer overflow-hidden"
                onClick={handleUnitToggle}
              >
                <div
                  className={`absolute top-1 left-1 w-[calc(50%-0.25rem)] h-8 bg-blue-600 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
                    !isKm ? "translate-x-full" : "translate-x-0"
                  }`}
                />
                <div className="absolute inset-0 flex items-center">
                  <div
                    className={`w-1/2 text-center text-sm font-medium transition-colors ${
                      isKm ? "text-white" : "text-blue-700"
                    }`}
                  >
                    KM
                  </div>
                  <div
                    className={`w-1/2 text-center text-sm font-medium transition-colors ${
                      !isKm ? "text-white" : "text-blue-700"
                    }`}
                  >
                    MI
                  </div>
                </div>
              </div>
            </div>
            {errors.distance && (
              <p className="text-red-500 text-sm mt-1">{errors.distance}</p>
            )}
          </div>

          {/* Time Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Finish Time <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="tel"
                placeholder="HH"
                name="hours"
                min="0"
                max="99"
                value={inputs.hours}
                onChange={onInputChange}
                className={`flex-1 px-4 py-3 text-lg border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center ${
                  errors.time ? "border-red-500" : "border-gray-300"
                }`}
              />
              <span className="text-gray-400 font-medium">:</span>
              <input
                type="number"
                inputMode="tel"
                placeholder="MM"
                name="minutes"
                min="0"
                max="59"
                value={inputs.minutes}
                onChange={onInputChange}
                className={`flex-1 px-4 py-3 text-lg border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center ${
                  errors.time ? "border-red-500" : "border-gray-300"
                }`}
              />
              <span className="text-gray-400 font-medium">:</span>
              <input
                type="number"
                inputMode="tel"
                placeholder="SS"
                name="seconds"
                min="0"
                max="59"
                value={inputs.seconds}
                onChange={onInputChange}
                className={`flex-1 px-4 py-3 text-lg border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center ${
                  errors.time ? "border-red-500" : "border-gray-300"
                }`}
              />
            </div>
            {errors.time && (
              <p className="text-red-500 text-sm mt-1">{errors.time}</p>
            )}
          </div>
        </div>

        {/* Optional Fields Section */}
        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Optional Adjustments{" "}
            <span className="text-gray-400 text-xs font-normal">
              (for more personalized results)
            </span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Age Input for Heart Rate Zones */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age{" "}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-gray-400 cursor-help">ⓘ</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>For heart rate zone calculations</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </label>
              <input
                type="number"
                inputMode="tel"
                placeholder="e.g., 30"
                name="age"
                min="10"
                max="100"
                value={inputs.age}
                onChange={onInputChange}
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Temperature Input for Weather Adjustments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temperature (°F){" "}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-gray-400 cursor-help">ⓘ</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Adjusts pace for hot weather (80°F+)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="e.g., 75"
                name="temperature"
                min="0"
                max="130"
                value={inputs.temperature}
                onChange={onInputChange}
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <button
          onClick={onCalculate}
          disabled={isCalculating}
          className="w-full py-4 text-lg font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCalculating ? "Calculating..." : "Calculate Training Paces"}
        </button>
      </CardContent>
    </Card>
  );
}
