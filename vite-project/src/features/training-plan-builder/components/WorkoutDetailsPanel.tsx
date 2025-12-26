/**
 * Workout Details Panel (Inspector)
 */

import { Check } from "lucide-react";
import { QuickActionsBar } from "./QuickActionsBar";
import type {
  WorkoutWithStatus,
  TrainingWeekWithStatus,
} from "../domain/types";

export interface WorkoutDetailsPanelProps {
  workout: WorkoutWithStatus;
  week: TrainingWeekWithStatus;
  onMarkComplete: () => void;
  onMove: () => void;
  onSwap: () => void;
}

const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function WorkoutDetailsPanel({
  workout,
  week,
  onMarkComplete,
  onMove,
  onSwap,
}: WorkoutDetailsPanelProps) {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="text-sm text-gray-600">
          Week {week.weekNumber} · {DAY_NAMES[workout.day - 1]}
        </div>
        <h3 className="mt-1 text-xl font-bold text-gray-900">
          {workout.title}
        </h3>
      </div>

      {/* Status Badge */}
      {workout.status === "completed" && (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg">
          <Check className="w-4 h-4" />
          <span className="text-sm font-medium">Completed</span>
        </div>
      )}

      {/* Quick Actions */}
      <QuickActionsBar
        workout={workout}
        onMarkComplete={onMarkComplete}
        onMove={onMove}
        onSwap={onSwap}
      />

      {/* Details */}
      <div className="space-y-4">
        {workout.distance && workout.distance > 0 && (
          <div>
            <div className="text-sm font-medium text-gray-600">Distance</div>
            <div className="mt-1 text-lg font-semibold text-gray-900">
              {workout.distance} km
            </div>
          </div>
        )}

        {workout.pace && workout.pace !== "N/A" && (
          <div>
            <div className="text-sm font-medium text-gray-600">Pace</div>
            <div className="mt-1 text-lg font-semibold text-gray-900">
              {workout.pace}
            </div>
          </div>
        )}

        <div>
          <div className="text-sm font-medium text-gray-600">Description</div>
          <div className="mt-1 text-sm text-gray-700">
            {workout.description}
          </div>
        </div>

        {workout.intervals && (
          <div>
            <div className="text-sm font-medium text-gray-600">
              Interval Details
            </div>
            <div className="mt-2 p-3 bg-gray-50 rounded-lg space-y-2 text-sm">
              <div>
                <strong>Reps:</strong> {workout.intervals.count} ×{" "}
                {workout.intervals.distance}km
              </div>
              <div>
                <strong>Pace:</strong> {workout.intervals.pace}
              </div>
              <div>
                <strong>Recovery:</strong> {workout.intervals.recovery}
              </div>
            </div>
          </div>
        )}

        {workout.notes && (
          <div>
            <div className="text-sm font-medium text-gray-600">Notes</div>
            <div className="mt-1 text-sm text-gray-700 italic">
              {workout.notes}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
