/**
 * Workout Templates and Descriptions
 */

import type { WorkoutType, PhaseWorkoutDistribution } from "../types";

// Workout type descriptions and titles
export const WORKOUT_DESCRIPTIONS: Record<
  WorkoutType,
  { title: string; description: string }
> = {
  easy: {
    title: "Easy Run",
    description:
      "Comfortable, conversational pace. Focus on building aerobic base and recovery.",
  },
  long: {
    title: "Long Run",
    description:
      "Steady endurance run at easy to moderate pace. Build stamina and mental toughness.",
  },
  tempo: {
    title: "Tempo Run",
    description:
      "Comfortably hard effort. Improves lactate threshold and race pace endurance.",
  },
  intervals: {
    title: "Interval Training",
    description:
      "Hard efforts with recovery periods. Builds speed and VO2 max capacity.",
  },
  hills: {
    title: "Hill Repeats",
    description:
      "Uphill efforts with recovery jogs. Builds strength and power.",
  },
  fartlek: {
    title: "Fartlek Run",
    description:
      "Unstructured speed play. Mix of fast and slow segments for fun and fitness.",
  },
  recovery: {
    title: "Recovery Run",
    description:
      "Very easy pace to promote active recovery. Keep effort minimal.",
  },
  race_pace: {
    title: "Race Pace Run",
    description:
      "Practice running at goal race pace. Build confidence and muscle memory.",
  },
  rest: {
    title: "Rest Day",
    description:
      "Complete rest or light stretching. Allow body to recover and adapt.",
  },
  cross_training: {
    title: "Cross Training",
    description:
      "Low-impact activity like cycling, swimming, or strength training.",
  },
};

// Workout distribution by phase
export const PHASE_WORKOUT_DISTRIBUTION: PhaseWorkoutDistribution = {
  base: {
    easy: 0.6,
    tempo: 0.15,
    intervals: 0,
    hills: 0.05,
    recovery: 0.1,
    long: 0.1,
  },
  build: {
    easy: 0.45,
    tempo: 0.2,
    intervals: 0.15,
    hills: 0.1,
    recovery: 0.05,
    long: 0.05,
  },
  peak: {
    easy: 0.4,
    tempo: 0.2,
    intervals: 0.2,
    hills: 0.1,
    recovery: 0.05,
    long: 0.05,
  },
  taper: {
    easy: 0.5,
    tempo: 0.1,
    intervals: 0.1,
    hills: 0,
    recovery: 0.2,
    long: 0.1,
  },
};

// Pace adjustments relative to race pace (in seconds per km)
export const PACE_ADJUSTMENTS: Record<WorkoutType, number> = {
  easy: 60, // +60 seconds/km slower than race pace
  long: 45, // +45 seconds/km slower than race pace
  tempo: 10, // +10 seconds/km slower than race pace
  intervals: -5, // 5 seconds/km faster than race pace
  hills: 0, // Effort-based, not pace-based
  fartlek: 0, // Variable pace
  recovery: 90, // +90 seconds/km slower than race pace
  race_pace: 0, // At race pace
  rest: 0, // No running
  cross_training: 0, // No running
};

// Workout intensity levels (1-10 scale)
export const WORKOUT_INTENSITY: Record<WorkoutType, number> = {
  easy: 3,
  long: 5,
  tempo: 7,
  intervals: 9,
  hills: 8,
  fartlek: 7,
  recovery: 2,
  race_pace: 8,
  rest: 0,
  cross_training: 4,
};

// Generate workout description based on type and parameters
export function generateWorkoutDescription(
  type: WorkoutType,
  distance?: number,
  pace?: string,
  intervals?: { count: number; distance: number; pace: string; recovery: string }
): string {
  const base = WORKOUT_DESCRIPTIONS[type].description;

  if (type === "intervals" && intervals) {
    return `${intervals.count}x ${intervals.distance}km at ${intervals.pace} with ${intervals.recovery} recovery. ${base}`;
  }

  if (distance && pace && type !== "rest" && type !== "cross_training") {
    return `${distance}km at ${pace}. ${base}`;
  }

  return base;
}

// Common interval workouts by distance
export const INTERVAL_WORKOUTS = {
  "5K": [
    { count: 8, distance: 0.4, recoveryDistance: 0.2 },
    { count: 6, distance: 0.8, recoveryDistance: 0.4 },
    { count: 4, distance: 1, recoveryDistance: 0.4 },
  ],
  "10K": [
    { count: 6, distance: 1, recoveryDistance: 0.4 },
    { count: 4, distance: 1.6, recoveryDistance: 0.8 },
    { count: 3, distance: 2, recoveryDistance: 0.8 },
  ],
  Half: [
    { count: 4, distance: 2, recoveryDistance: 0.8 },
    { count: 3, distance: 3, recoveryDistance: 1 },
    { count: 2, distance: 5, recoveryDistance: 1 },
  ],
  Marathon: [
    { count: 3, distance: 3, recoveryDistance: 1 },
    { count: 2, distance: 5, recoveryDistance: 1 },
    { count: 2, distance: 8, recoveryDistance: 2 },
  ],
};

// Tempo run distances by experience level (as % of weekly mileage)
export const TEMPO_DISTANCE_PERCENTAGE = {
  beginner: 0.15,
  intermediate: 0.2,
  advanced: 0.25,
};

// Long run distances by phase (as % of weekly mileage)
export const LONG_RUN_PERCENTAGE = {
  base: 0.35,
  build: 0.3,
  peak: 0.28,
  taper: 0.25,
};
