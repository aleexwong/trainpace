/**
 * Training Plan Builder - Core Types & Constants
 */

// Distance types
export const TRAINING_DISTANCES = [
  { name: "5K", distance: 5, label: "5K" },
  { name: "10K", distance: 10, label: "10K" },
  { name: "Half Marathon", distance: 21.1, label: "Half" },
  { name: "Marathon", distance: 42.2, label: "Marathon" },
] as const;

export type TrainingDistance = "5K" | "10K" | "Half" | "Marathon";

// Experience levels
export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

// Training philosophy
export type TrainingPhilosophy = "balanced" | "speed" | "endurance";

// Workout types
export type WorkoutType =
  | "easy"
  | "long"
  | "tempo"
  | "intervals"
  | "hills"
  | "fartlek"
  | "recovery"
  | "race_pace"
  | "rest"
  | "cross_training";

// Form data for each step
export interface Step1Data {
  distance: TrainingDistance;
  goalTimeHours: string;
  goalTimeMinutes: string;
  goalTimeSeconds: string;
  raceDate: string; // ISO date string
}

export interface Step2Data {
  experienceLevel: ExperienceLevel;
  currentWeeklyMileage: number; // in km
  longestRecentRun: number; // in km
  availableWeeks: number;
}

export interface Step3Data {
  trainingDaysPerWeek: number; // 3-6
  longRunDay: "saturday" | "sunday" | "flexible";
  includeCrossTraining: boolean;
  preferredWorkouts: WorkoutType[];
  trainingPhilosophy: TrainingPhilosophy;
}

export interface PlanInputs {
  step1: Step1Data;
  step2: Step2Data;
  step3: Step3Data;
}

// Workout definition
export interface Workout {
  id: string;
  day: number; // 1-7 (Monday-Sunday)
  type: WorkoutType;
  title: string;
  description: string;
  distance?: number; // in km
  pace?: string; // e.g., "5:30/km"
  duration?: number; // in minutes (for time-based workouts)
  intervals?: {
    count: number;
    distance: number;
    pace: string;
    recovery: string;
  };
  notes?: string;
}

// Week definition
export interface TrainingWeek {
  weekNumber: number;
  weeklyMileage: number;
  phaseType: "base" | "build" | "peak" | "taper";
  workouts: Workout[];
  notes?: string;
}

// Complete training plan
export interface TrainingPlan {
  id?: string;
  planName?: string;
  distance: TrainingDistance;
  goalTime: number; // in seconds
  raceDate: string;
  totalWeeks: number;
  experienceLevel: ExperienceLevel;
  weeks: TrainingWeek[];
  createdAt?: Date;
  userId?: string;
}

// Save parameters
export interface SaveTrainingPlanParams {
  plan: TrainingPlan;
  inputs: PlanInputs;
  planName?: string;
  notes?: string;
}

// Phase distribution configuration
export interface PhaseDistribution {
  base: number;
  build: number;
  peak: number;
  taper: number;
}

// Training plan configuration
export interface PlanConfig {
  phaseDistribution: Record<TrainingDistance, Record<ExperienceLevel, PhaseDistribution>>;
  peakMileage: Record<TrainingDistance, Record<ExperienceLevel, { min: number; max: number }>>;
  minWeeks: Record<TrainingDistance, Record<ExperienceLevel, number>>;
  maxWeeks: Record<TrainingDistance, Record<ExperienceLevel, number>>;
}

// Workout templates by phase
export interface WorkoutDistribution {
  easy: number;
  tempo: number;
  intervals: number;
  hills: number;
  recovery: number;
  long: number;
}

export type PhaseWorkoutDistribution = Record<
  TrainingWeek["phaseType"],
  WorkoutDistribution
>;

// Form errors
export interface FormErrors {
  step1?: {
    distance?: string;
    goalTime?: string;
    raceDate?: string;
  };
  step2?: {
    experienceLevel?: string;
    currentWeeklyMileage?: string;
    longestRecentRun?: string;
    availableWeeks?: string;
  };
  step3?: {
    trainingDaysPerWeek?: string;
    preferredWorkouts?: string;
  };
}
