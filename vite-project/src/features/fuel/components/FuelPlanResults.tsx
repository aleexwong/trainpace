/**
 * Fuel Plan Results Component
 * Displays calculated fuel plan with fueling timeline and actions
 */

import { Card, CardContent } from "@/components/ui/card";
import { Copy, Download, Clock, Utensils } from "lucide-react";
import type { FuelPlanResult, AIRecommendation, RaceType } from "../types";

interface FuelPlanResultsProps {
  result: FuelPlanResult;
  raceType: RaceType;
  aiRecommendations: AIRecommendation[];
  onEdit: () => void;
  onCopy: () => void;
  onDownload: () => void;
}

export function FuelPlanResults({
  result,
  onEdit,
  onCopy,
  onDownload,
}: FuelPlanResultsProps) {
  return (
    <Card className="bg-white shadow-lg h-full">
      <CardContent className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
            Your Fuel Plan 🔋
          </h2>
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              ← Edit
            </button>
            <button
              onClick={onCopy}
              className="p-2 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors"
              title="Copy Plan"
            >
              <Copy className="h-4 w-4 text-blue-600" />
            </button>
            <button
              onClick={onDownload}
              className="p-2 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors"
              title="Download Plan"
            >
              <Download className="h-4 w-4 text-blue-600" />
            </button>
          </div>
        </div>

        {/* Total Carbs Hero */}
        {result.totalCarbs > 0 && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-center mb-6">
            <div className="text-sm text-blue-100 mb-1">Total Carbs Needed</div>
            <div className="text-4xl font-bold text-white">{result.totalCarbs}g</div>
          </div>
        )}

        {/* Grid of metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="p-4 bg-blue-50 rounded-xl text-center">
            <div className="text-2xl font-bold text-blue-700">
              {result.carbsPerHour}g
            </div>
            <div className="text-xs text-gray-600 mt-1">Carbs/hour</div>
          </div>

          <div className="p-4 bg-blue-50 rounded-xl text-center">
            <div className="text-2xl font-bold text-blue-700">
              {result.totalCarbs}g
            </div>
            <div className="text-xs text-gray-600 mt-1">Total carbs</div>
          </div>

          <div className="p-4 bg-blue-50 rounded-xl text-center">
            <div className="text-2xl font-bold text-blue-700">
              {result.totalCalories}
            </div>
            <div className="text-xs text-gray-600 mt-1">Calories</div>
          </div>

          <div className="p-4 bg-blue-50 rounded-xl text-center">
            <div className="text-2xl font-bold text-blue-700">
              {result.gelsNeeded}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {result.gelsNeeded === 0 ? "Gels (optional)" : "Gels"}
            </div>
          </div>
        </div>

        {/* Fueling Timeline */}
        {result.fuelStops.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              Fueling Timeline
            </h3>
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {result.fuelStops.map((stop, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-semibold shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      <Clock className="h-3.5 w-3.5 text-gray-500" />
                      {stop.time} • {stop.distance}
                    </div>
                    <div className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                      <Utensils className="h-3.5 w-3.5" />
                      {stop.carbsNeeded}g — {stop.suggestion}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center">
            <p className="text-sm text-amber-800">
              ⚡ For races under 1 hour, minimal fueling is typically needed. 
              Focus on pre-race nutrition instead.
            </p>
          </div>
        )}

        {/* Baseline disclaimer */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            💡 <strong>Baseline estimate:</strong> You may need additional fuel
            sources (sports drinks, chews, etc.) to meet your total carb needs.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
