/**
 * Pace Results Display Component
 * Shows calculated training paces in a clean card layout
 */

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Download, Save } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { PaceResults, PaceUnit } from "../types";
import { calculateElevationAdjustment } from "../utils";

interface PaceResultsDisplayProps {
  results: PaceResults;
  raceDistance: string;
  raceTime: string;
  paceType: PaceUnit;
  onEdit: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onPaceTypeChange: (paceType: PaceUnit) => void;
  onSave?: () => void;
  isSaving?: boolean;
  isSaved?: boolean;
}

const PACE_DESCRIPTIONS: Record<string, string> = {
  race: "Your target race pace",
  easy: "Easy/Recovery runs",
  tempo: "Threshold training",
  interval: "High-intensity intervals",
  maximum: "Near-maximal effort",
  speed: "Speed work",
  xlong: "Long runs",
  yasso: "Marathon-specific workout",
};

export function PaceResultsDisplay({
  results,
  raceDistance,
  raceTime,
  paceType,
  onEdit,
  onCopy,
  onDownload,
  onPaceTypeChange,
  onSave,
  isSaving = false,
  isSaved = false,
}: PaceResultsDisplayProps) {
  const isPaceKm = paceType === "km";
  const [terrainMode, setTerrainMode] = useState<"flat" | "hilly">("flat");

  const handlePaceToggle = () => {
    onPaceTypeChange(isPaceKm ? "Miles" : "km");
  };

  const handleTerrainToggle = () => {
    setTerrainMode((prev) => (prev === "flat" ? "hilly" : "flat"));
  };

  // Calculate elevation adjustment dynamically
  const elevationAdjustment = calculateElevationAdjustment(
    results.easy,
    terrainMode,
    paceType
  );

  return (
    <Card className="bg-white shadow-lg">
      <CardContent className="p-4 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
            Your Training Paces 🎯
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {/* Pace Toggle */}
            <div
              className="relative w-36 sm:w-40 h-9 sm:h-10 bg-purple-100 rounded-full cursor-pointer overflow-hidden"
              onClick={handlePaceToggle}
              title="Toggle pace display unit"
            >
              <div
                className={`absolute top-0.5 sm:top-1 left-0.5 sm:left-1 w-[calc(50%-0.25rem)] h-8 sm:h-8 bg-purple-600 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
                  !isPaceKm ? "translate-x-full" : "translate-x-0"
                }`}
              />
              <div className="absolute inset-0 flex items-center">
                <div
                  className={`w-1/2 text-center text-xs font-medium transition-colors ${
                    isPaceKm ? "text-white" : "text-purple-700"
                  }`}
                >
                  min/km
                </div>
                <div
                  className={`w-1/2 text-center text-xs font-medium transition-colors ${
                    !isPaceKm ? "text-white" : "text-purple-700"
                  }`}
                >
                  min/mi
                </div>
              </div>
            </div>

            {/* Terrain Toggle */}
            <div
              className="relative w-32 sm:w-36 h-9 sm:h-10 bg-orange-100 rounded-full cursor-pointer overflow-hidden"
              onClick={handleTerrainToggle}
              title="Toggle terrain adjustment"
            >
              <div
                className={`absolute top-0.5 sm:top-1 left-0.5 sm:left-1 w-[calc(50%-0.25rem)] h-8 sm:h-8 bg-orange-600 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
                  terrainMode === "hilly" ? "translate-x-full" : "translate-x-0"
                }`}
              />
              <div className="absolute inset-0 flex items-center">
                <div
                  className={`w-1/2 text-center text-xs font-medium transition-colors ${
                    terrainMode === "flat" ? "text-white" : "text-orange-700"
                  }`}
                >
                  Flat
                </div>
                <div
                  className={`w-1/2 text-center text-xs font-medium transition-colors ${
                    terrainMode === "hilly" ? "text-white" : "text-orange-700"
                  }`}
                >
                  Hilly
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <button
              onClick={onEdit}
              className="px-3 sm:px- py-1.5 sm:py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              ← Edit
            </button>
            <button
              onClick={onCopy}
              className="p-1.5 sm:p-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
              title="Copy Plan"
            >
              <Copy className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </button>
            <button
              onClick={onDownload}
              className="p-1.5 sm:p-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
              title="Download Plan"
            >
              <Download className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </button>
            {onSave && (
              <button
                onClick={onSave}
                disabled={isSaving || isSaved}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                  isSaved
                    ? "bg-green-100 text-green-700 cursor-not-allowed"
                    : isSaving
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-md hover:shadow-lg"
                }`}
                title={isSaved ? "Saved!" : "Save to Dashboard"}
              >
                <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">
                  {isSaved ? "Saved!" : isSaving ? "Saving..." : "Save"}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Race Summary */}
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 rounded-xl">
          <p className="text-xs sm:text-sm text-blue-800">
            <strong>Race:</strong> {raceDistance} in {raceTime}
          </p>
        </div>

        {/* Pace Cards Grid - Responsive Layout */}
        <div className="space-y-2 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
          {Object.entries(results)
            .filter(([key]) => key !== "heartRateZones" && key !== "adjustments")
            .map(([key, value]) => {
              const displayName = key === "xlong" ? "Long Run" : key;
              return (
                <div
                  key={key}
                  className="flex md:block items-center justify-between p-3 md:p-5 bg-gradient-to-r md:bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg md:rounded-xl border border-blue-100 hover:border-blue-200 md:hover:shadow-md transition-all"
                >
                  <div className="flex-1 md:flex-none min-w-0 md:min-w-full">
                    <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 capitalize truncate md:whitespace-normal md:mb-2">
                      {displayName}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-600 truncate md:whitespace-normal md:mb-3">
                      {PACE_DESCRIPTIONS[key]}
                    </p>
                  </div>
                  <div className="text-base sm:text-lg md:text-2xl font-bold text-blue-700 ml-3 md:ml-0 whitespace-nowrap">
                    {value as string}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Heart Rate Zones Section */}
        {results.heartRateZones && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              ❤️ Heart Rate Zones
              <span className="text-sm font-normal text-gray-600">
                (Max HR: {results.heartRateZones.maxHR} bpm)
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-gray-400 cursor-help text-base">ⓘ</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Calculated using the formula: Max HR = 220 - age</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-lg">
                <p className="text-sm font-medium text-gray-700">Easy Pace</p>
                <p className="text-base font-semibold text-green-700">
                  {results.heartRateZones.easyZone}
                </p>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <p className="text-sm font-medium text-gray-700">Tempo Pace</p>
                <p className="text-base font-semibold text-yellow-700">
                  {results.heartRateZones.tempoZone}
                </p>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <p className="text-sm font-medium text-gray-700">Intervals</p>
                <p className="text-base font-semibold text-orange-700">
                  {results.heartRateZones.intervalZone}
                </p>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <p className="text-sm font-medium text-gray-700">Maximum Effort</p>
                <p className="text-base font-semibold text-red-700">
                  {results.heartRateZones.maximumZone}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pace Adjustments Section */}
        <div className="mt-6 space-y-3">
          {/* Terrain Adjustment - Always shown based on toggle */}
          {terrainMode === "hilly" && elevationAdjustment && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                ⛰️ Elevation Adjustment
              </h3>
              <p className="text-sm text-gray-700">
                {elevationAdjustment.message}
              </p>
              {elevationAdjustment.adjustedEasyPace && (
                <div className="mt-2 p-2 bg-white rounded-lg">
                  <p className="text-xs text-gray-600">Adjusted Easy Pace:</p>
                  <p className="text-base font-semibold text-orange-700">
                    {elevationAdjustment.adjustedEasyPace}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Weather Adjustment */}
          {results.adjustments?.weather && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                🌡️ Weather Adjustment
              </h3>
              <p className="text-sm text-gray-700">
                {results.adjustments.weather.message}
              </p>
              {results.adjustments.weather.adjustedEasyPace && (
                <div className="mt-2 p-2 bg-white rounded-lg">
                  <p className="text-xs text-gray-600">Adjusted Easy Pace:</p>
                  <p className="text-base font-semibold text-red-700">
                    {results.adjustments.weather.adjustedEasyPace}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs sm:text-sm text-yellow-800">
            💡 <strong>Training Tip:</strong> These paces are guidelines based
            on your race performance. Adjust based on how you feel, weather
            conditions, and terrain. Toggle between min/km and min/mile above!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
