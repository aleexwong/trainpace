/**
 * Pace Results Display Component
 * Shows calculated training paces in a clean card layout
 */

import { Card, CardContent } from "@/components/ui/card";
import { Copy, Download } from "lucide-react";
import type { PaceResults, PaceUnit } from "../types";

interface PaceResultsDisplayProps {
  results: PaceResults;
  raceDistance: string;
  raceTime: string;
  paceType: PaceUnit;
  onEdit: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onPaceTypeChange: (paceType: PaceUnit) => void;
}

const PACE_DESCRIPTIONS: Record<keyof PaceResults, string> = {
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
}: PaceResultsDisplayProps) {
  const isPaceKm = paceType === "km";

  const handlePaceToggle = () => {
    onPaceTypeChange(isPaceKm ? "Miles" : "km");
  };

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
          {Object.entries(results).map(([key, value]) => {
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
                    {PACE_DESCRIPTIONS[key as keyof PaceResults]}
                  </p>
                </div>
                <div className="text-base sm:text-lg md:text-2xl font-bold text-blue-700 ml-3 md:ml-0 whitespace-nowrap">
                  {value}
                </div>
              </div>
            );
          })}
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
