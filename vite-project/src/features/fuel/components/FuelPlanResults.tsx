/**
 * Fuel Plan Results Component
 * Displays calculated fuel plan with actions
 */

import { Card, CardContent } from "@/components/ui/card";
import { Copy, Download } from "lucide-react";
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
    <Card className="bg-white shadow-lg">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            Your Plan 🔋
          </h2>
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              ← Edit
            </button>
            <button
              onClick={onCopy}
              className="p-3 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors"
              title="Copy Plan"
            >
              <Copy className="h-5 w-5 text-blue-600" />
            </button>
            <button
              onClick={onDownload}
              className="p-3 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors"
              title="Download Plan"
            >
              <Download className="h-5 w-5 text-blue-600" />
            </button>
          </div>
        </div>

        {/* Grid of metrics - 4 columns on desktop, 2 on mobile */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-6 bg-blue-50 rounded-xl">
            <div className="text-3xl font-bold text-blue-700">
              {result.carbsPerHour}g
            </div>
            <div className="text-sm text-gray-600 mt-1">Carbs/hour</div>
          </div>

          <div className="p-6 bg-blue-50 rounded-xl">
            <div className="text-3xl font-bold text-blue-700">
              {result.totalCarbs}g
            </div>
            <div className="text-sm text-gray-600 mt-1">Total carbs</div>
          </div>

          <div className="p-6 bg-blue-50 rounded-xl">
            <div className="text-3xl font-bold text-blue-700">
              {result.totalCalories}
            </div>
            <div className="text-sm text-gray-600 mt-1">Calories</div>
          </div>

          <div className="p-6 bg-blue-50 rounded-xl">
            <div className="text-3xl font-bold text-blue-700">
              {result.gelsNeeded}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {result.gelsNeeded === 0 ? "Gels (optional)" : "Gels"}
            </div>
          </div>
        </div>

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
