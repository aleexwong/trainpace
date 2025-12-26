/**
 * Workspace state management
 */

import { useState, useCallback } from "react";
import type { WorkspaceState, TrainingPlanWithStatus } from "../domain/types";

export interface UsePlanWorkspaceReturn {
  workspaceState: WorkspaceState;
  selectWorkout: (workoutId: string | null) => void;
  selectWeek: (weekNumber: number | null) => void;
  markWorkoutComplete: (workoutId: string) => void;
  updatePlan: (plan: TrainingPlanWithStatus) => void;
}

export function usePlanWorkspace(
  initialPlan: TrainingPlanWithStatus | null
): UsePlanWorkspaceReturn {
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>({
    plan: initialPlan,
    selectedWorkoutId: null,
    selectedWeekNumber: initialPlan?.currentWeek || null,
  });

  const selectWorkout = useCallback((workoutId: string | null) => {
    setWorkspaceState((prev) => ({ ...prev, selectedWorkoutId: workoutId }));
  }, []);

  const selectWeek = useCallback((weekNumber: number | null) => {
    setWorkspaceState((prev) => ({
      ...prev,
      selectedWeekNumber: weekNumber,
      selectedWorkoutId: null, // Clear workout selection
    }));
  }, []);

  const markWorkoutComplete = useCallback((workoutId: string) => {
    setWorkspaceState((prev) => {
      if (!prev.plan) return prev;

      const updatedWeeks = prev.plan.weeks.map((week) => ({
        ...week,
        workouts: week.workouts.map((workout) =>
          workout.id === workoutId
            ? { ...workout, status: "completed" as const }
            : workout
        ),
        completedCount: week.workouts.filter(
          (w) => w.id === workoutId || w.status === "completed"
        ).length,
      }));

      return {
        ...prev,
        plan: {
          ...prev.plan,
          weeks: updatedWeeks,
        },
      };
    });
  }, []);

  const updatePlan = useCallback((plan: TrainingPlanWithStatus) => {
    setWorkspaceState((prev) => ({ ...prev, plan }));
  }, []);

  return {
    workspaceState,
    selectWorkout,
    selectWeek,
    markWorkoutComplete,
    updatePlan,
  };
}
