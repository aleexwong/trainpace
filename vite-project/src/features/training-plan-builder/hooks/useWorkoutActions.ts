/**
 * Workout manipulation actions
 */

import { useCallback } from "react";

export interface UseWorkoutActionsReturn {
  moveWorkout: (workoutId: string, targetDay: number) => void;
  swapWorkouts: (workout1Id: string, workout2Id: string) => void;
  reduceWeek: (weekNumber: number, percentage: number) => void;
}

export function useWorkoutActions(): UseWorkoutActionsReturn {
  const moveWorkout = useCallback(
    (workoutId: string, targetDay: number) => {
      // TODO: Implement workout move logic
      console.log("Move workout", workoutId, "to day", targetDay);
    },
    []
  );

  const swapWorkouts = useCallback(
    (workout1Id: string, workout2Id: string) => {
      // TODO: Implement workout swap logic
      console.log("Swap workouts", workout1Id, workout2Id);
    },
    []
  );

  const reduceWeek = useCallback((weekNumber: number, percentage: number) => {
    // TODO: Implement week reduction logic
    console.log("Reduce week", weekNumber, "by", percentage, "%");
  }, []);

  return {
    moveWorkout,
    swapWorkouts,
    reduceWeek,
  };
}
