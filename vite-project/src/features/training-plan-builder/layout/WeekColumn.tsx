/**
 * Center Column: Week List
 */

import { WeekHeader } from "../components/WeekHeader";
import { WorkoutCard } from "../components/WorkoutCard";
import type { TrainingWeekWithStatus } from "../domain/types";

export interface WeekColumnProps {
  weeks: TrainingWeekWithStatus[];
  selectedWeekNumber: number | null;
  selectedWorkoutId: string | null;
  onWeekSelect: (weekNumber: number) => void;
  onWorkoutSelect: (workoutId: string) => void;
  currentWeek: number;
}

export function WeekColumn({
  weeks,
  selectedWeekNumber,
  selectedWorkoutId,
  onWeekSelect,
  onWorkoutSelect,
  currentWeek,
}: WeekColumnProps) {
  const displayWeek =
    weeks.find((w) => w.weekNumber === selectedWeekNumber) ||
    weeks.find((w) => w.weekNumber === currentWeek) ||
    weeks[0];

  if (!displayWeek) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">No weeks available</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Week Header */}
        <WeekHeader
          week={displayWeek}
          onReduceWeek={() => console.log("Reduce week", displayWeek.weekNumber)}
          isCurrentWeek={displayWeek.weekNumber === currentWeek}
        />

        {/* Workouts */}
        <div className="space-y-3">
          {displayWeek.workouts.map((workout) => (
            <div
              key={workout.id}
              onClick={() => onWorkoutSelect(workout.id)}
              className={`cursor-pointer transition-all ${
                selectedWorkoutId === workout.id
                  ? "ring-2 ring-blue-500 rounded-lg"
                  : ""
              }`}
            >
              <WorkoutCard workout={workout} compact={false} />
            </div>
          ))}
        </div>

        {/* Week Navigation */}
        <div className="flex justify-between pt-6">
          <button
            onClick={() =>
              displayWeek.weekNumber > 1 &&
              onWeekSelect(displayWeek.weekNumber - 1)
            }
            disabled={displayWeek.weekNumber === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous Week
          </button>
          <span className="text-sm text-gray-600">
            Week {displayWeek.weekNumber} of {weeks.length}
          </span>
          <button
            onClick={() =>
              displayWeek.weekNumber < weeks.length &&
              onWeekSelect(displayWeek.weekNumber + 1)
            }
            disabled={displayWeek.weekNumber === weeks.length}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next Week →
          </button>
        </div>
      </div>
    </div>
  );
}
