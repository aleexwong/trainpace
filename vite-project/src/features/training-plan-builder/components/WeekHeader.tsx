/**
 * Week Header Component
 */

import { MoreVertical } from "lucide-react";
import type { TrainingWeekWithStatus } from "../domain/types";

export interface WeekHeaderProps {
  week: TrainingWeekWithStatus;
  onReduceWeek: () => void;
  isCurrentWeek: boolean;
}

const PHASE_LABELS = {
  base: { label: "Base Building", color: "text-green-700 bg-green-50" },
  build: { label: "Build Phase", color: "text-blue-700 bg-blue-50" },
  peak: { label: "Peak Phase", color: "text-orange-700 bg-orange-50" },
  taper: { label: "Taper", color: "text-purple-700 bg-purple-50" },
};

export function WeekHeader({
  week,
  onReduceWeek,
  isCurrentWeek,
}: WeekHeaderProps) {
  const phaseInfo = PHASE_LABELS[week.phaseType];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">
              Week {week.weekNumber}
            </h2>
            {isCurrentWeek && (
              <span className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-50 rounded">
                Current
              </span>
            )}
            <span
              className={`px-2 py-1 text-xs font-semibold rounded ${phaseInfo.color}`}
            >
              {phaseInfo.label}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-6 text-sm text-gray-600">
            <span>{week.weeklyMileage} km total</span>
            <span>
              {week.completedCount} / {week.totalWorkouts} completed
            </span>
          </div>
        </div>
        <button
          onClick={onReduceWeek}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 transition-all"
          style={{
            width: `${(week.completedCount / week.totalWorkouts) * 100}%`,
          }}
        />
      </div>

      {week.notes && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
          <span className="font-semibold">Week Focus: </span>
          {week.notes}
        </div>
      )}
    </div>
  );
}
