/**
 * Right Column: Workout Inspector
 */

import { WorkoutDetailsPanel } from "../components/WorkoutDetailsPanel";
import type {
  WorkoutWithStatus,
  TrainingWeekWithStatus,
} from "../domain/types";

export interface InspectorColumnProps {
  selectedWorkout: WorkoutWithStatus | null;
  selectedWeek: TrainingWeekWithStatus | null;
  onMarkComplete: (workoutId: string) => void;
  onMoveWorkout: (workoutId: string) => void;
  onSwapWorkout: (workoutId: string) => void;
  onReduceWeek: (weekNumber: number) => void;
}

export function InspectorColumn({
  selectedWorkout,
  selectedWeek,
  onMarkComplete,
  onMoveWorkout,
  onSwapWorkout,
}: InspectorColumnProps) {
  if (!selectedWorkout || !selectedWeek) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <p className="text-sm">Select a workout to view details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
      <WorkoutDetailsPanel
        workout={selectedWorkout}
        week={selectedWeek}
        onMarkComplete={() => onMarkComplete(selectedWorkout.id)}
        onMove={() => onMoveWorkout(selectedWorkout.id)}
        onSwap={() => onSwapWorkout(selectedWorkout.id)}
      />
    </div>
  );
}
