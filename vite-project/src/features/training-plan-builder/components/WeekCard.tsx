/**
 * Week Summary Card (for list view)
 */

import { ChevronRight } from "lucide-react";
import type { TrainingWeekWithStatus } from "../domain/types";

export interface WeekCardProps {
  week: TrainingWeekWithStatus;
  isSelected: boolean;
  isCurrent: boolean;
  onClick: () => void;
}

const PHASE_COLORS = {
  base: "bg-green-50 border-green-200",
  build: "bg-blue-50 border-blue-200",
  peak: "bg-orange-50 border-orange-200",
  taper: "bg-purple-50 border-purple-200",
};

export function WeekCard({
  week,
  isSelected,
  isCurrent,
  onClick,
}: WeekCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
        isSelected
          ? "border-blue-500 bg-blue-50"
          : `${PHASE_COLORS[week.phaseType]} hover:border-gray-300`
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">
              Week {week.weekNumber}
            </span>
            {isCurrent && (
              <span className="px-2 py-0.5 text-xs font-semibold text-blue-700 bg-blue-100 rounded">
                Current
              </span>
            )}
          </div>
          <div className="mt-1 text-sm text-gray-600">
            {week.weeklyMileage} km · {week.completedCount}/{week.totalWorkouts}{" "}
            done
          </div>
          <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500"
              style={{
                width: `${(week.completedCount / week.totalWorkouts) * 100}%`,
              }}
            />
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </button>
  );
}
