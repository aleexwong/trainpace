/**
 * Enhanced types for plan workspace
 */

import type { Workout, TrainingWeek, TrainingPlan } from "../types";

export type WorkoutStatus = "pending" | "completed" | "skipped";

export interface WorkoutWithStatus extends Workout {
  status: WorkoutStatus;
}

export interface TrainingWeekWithStatus extends Omit<TrainingWeek, "workouts"> {
  workouts: WorkoutWithStatus[];
  completedCount: number;
  totalWorkouts: number;
}

export interface TrainingPlanWithStatus extends Omit<TrainingPlan, "weeks"> {
  weeks: TrainingWeekWithStatus[];
  currentWeek: number; // 1-based index
}

export interface WorkspaceState {
  plan: TrainingPlanWithStatus | null;
  selectedWorkoutId: string | null;
  selectedWeekNumber: number | null;
}

export type NavSection = "plan" | "today" | "progress" | "coach" | "settings";
