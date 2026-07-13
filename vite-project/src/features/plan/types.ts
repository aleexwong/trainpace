/**
 * Training Plan Generator — Types
 */

export type GoalRace = "5K" | "10K" | "Half Marathon" | "Marathon";
export type FitnessLevel = "beginner" | "intermediate" | "advanced";
export type RunDay = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
export type WorkoutType =
  | "easy"
  | "long"
  | "tempo"
  | "interval"
  | "recovery"
  | "rest"
  | "race";

export interface PlanInputs {
  goalRace: GoalRace;
  raceDate: string; // ISO date
  currentFitness: FitnessLevel;
  availableDays: RunDay[];
  goalTime?: string; // optional HH:MM:SS
  currentWeeklyKm?: number;
}

export interface Workout {
  type: WorkoutType;
  label: string;
  description: string;
  durationMin: number;
  distanceKm?: number;
  paceZone?: string;
}

export interface TrainingDay {
  day: RunDay;
  workout: Workout;
}

export interface TrainingWeek {
  weekNumber: number;
  phase: TrainingPhase;
  totalKm: number;
  days: TrainingDay[];
  weeklyFocus: string;
}

export type TrainingPhase =
  | "Base Building"
  | "Development"
  | "Sharpening"
  | "Taper"
  | "Race Week";

export interface TrainingPlan {
  id?: string;
  userId?: string;
  name: string;
  goalRace: GoalRace;
  raceDate: string;
  fitnessLevel: FitnessLevel;
  totalWeeks: number;
  weeks: TrainingWeek[];
  paces: PlanPaces;
  createdAt?: { seconds: number };
  /**
   * Workout completion tracking. Key = `${weekNumber}:${day}` (e.g. "3:Tue"),
   * value = ISO completion timestamp. A Map-shape (not an array) so toggling
   * is idempotent (set/delete a key) and dot-path partial Firestore updates
   * let concurrent devices merge without clobbering each other. Bounded to
   * roughly the plan's own (weekNumber, day) grid size (≤140 entries for the
   * longest plans). Always iterate `plan.weeks` and look up keys here —
   * never iterate this map directly, since regenerating a plan can leave
   * orphaned keys behind that should be treated as inert.
   */
  completedWorkouts?: Record<string, string>;
}

export interface PlanPaces {
  easy: string;
  tempo: string;
  interval: string;
  long: string;
  recovery: string;
}

export interface PlanGeneratorInputs extends PlanInputs {
  vdot?: number;
  paceResults?: {
    easy: string;
    tempo: string;
    interval: string;
    race: string;
  };
}
