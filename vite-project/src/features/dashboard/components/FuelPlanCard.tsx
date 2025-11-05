import { useState } from "react";
import { Trash2, Copy, Flame, ChevronDown, ChevronUp } from "lucide-react";
import { FuelPlan } from "../types";

interface FuelPlanCardProps {
  plan: FuelPlan;
  onDelete: (planId: string) => void;
  onCopy: (plan: FuelPlan) => void;
}

export function FuelPlanCard({ plan, onDelete, onCopy }: FuelPlanCardProps) {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown";
    try {
      return timestamp.toDate().toLocaleDateString();
    } catch {
      return "Unknown";
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-800">
              {plan.raceType} {plan.raceType !== "10K" && "Marathon"}
            </h3>
            {plan.aiRecommendations && plan.aiRecommendations.length > 0 && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded flex items-center gap-1">
                <Flame className="w-3 h-3" />
                AI Enhanced
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {formatDate(plan.createdAt)} • {formatTime(plan.finishTime)}
          </p>
        </div>
        <button
          onClick={() => onDelete(plan.id)}
          className="text-gray-400 hover:text-red-500 transition-colors ml-2 bg-transparent rounded-full p-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          title="Delete fuel plan"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-3 gap-2 text-sm mb-3 bg-orange-50 p-3 rounded-lg">
        <div className="text-center">
          <div className="text-xs text-gray-600 mb-1">Carbs/hr</div>
          <div className="font-bold text-orange-600">
            {plan.carbsPerHour}g
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-600 mb-1">Gels</div>
          <div className="font-bold text-orange-600">{plan.gelsNeeded}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-600 mb-1">Calories</div>
          <div className="font-bold text-orange-600">
            {plan.totalCalories}
          </div>
        </div>
      </div>

      {/* AI Recommendations (Expandable) */}
      {plan.aiRecommendations && plan.aiRecommendations.length > 0 && (
        <div className="mb-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full text-sm text-purple-600 hover:text-purple-700 flex items-center justify-between bg-purple-50 p-2 rounded-lg"
          >
            <span className="font-medium">
              {plan.aiRecommendations.length} AI Recommendation
              {plan.aiRecommendations.length > 1 ? "s" : ""}
            </span>
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {expanded && (
            <div className="mt-2 space-y-2 bg-purple-50 p-3 rounded-lg border border-purple-100">
              {plan.aiRecommendations.map((rec, idx) => (
                <div key={idx} className="text-sm">
                  <p className="font-semibold text-gray-800 mb-1">
                    {idx + 1}. {rec.headline}
                  </p>
                  {rec.detail && (
                    <p className="text-gray-600 text-xs leading-relaxed pl-4">
                      {rec.detail}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onCopy(plan)}
          className="flex-1 bg-orange-500 text-white py-2 px-3 rounded-md text-sm hover:bg-orange-600 transition-colors flex items-center justify-center gap-1"
        >
          <Copy className="w-4 h-4" />
          Copy Plan
        </button>
      </div>
    </div>
  );
}
