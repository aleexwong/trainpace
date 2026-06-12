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
