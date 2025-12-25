/**
 * Core Training Plan Generator
 */

import type {
  PlanInputs,
  TrainingPlan,
  TrainingWeek,
  Workout,
  WorkoutType,
  TrainingDistance,
  ExperienceLevel,
} from "../types";
import {
  calculatePeakMileage,
  generateMileageProgression,
  determinePhases,
} from "./progressionCalculator";
import {
  calculateTrainingPaces,
  timeInputsToSeconds,
} from "./paceCalculator";
import {
  WORKOUT_DESCRIPTIONS,
  PHASE_WORKOUT_DISTRIBUTION,
  INTERVAL_WORKOUTS,
  TEMPO_DISTANCE_PERCENTAGE,
  LONG_RUN_PERCENTAGE,
  generateWorkoutDescription,
} from "./workoutTemplates";

/**
 * Main function to generate a complete training plan
 */
export function generateTrainingPlan(inputs: PlanInputs): TrainingPlan {
  const { step1, step2, step3 } = inputs;

  // Calculate goal time in seconds
  const goalTime = timeInputsToSeconds(
    step1.goalTimeHours,
    step1.goalTimeMinutes,
    step1.goalTimeSeconds
  );

  // Calculate training paces
  const paces = calculateTrainingPaces(goalTime, step1.distance);

  // Determine phases for each week
  const phases = determinePhases(step2.availableWeeks, step2.experienceLevel, step1.distance);

  // Calculate peak mileage
  const peakMileage = calculatePeakMileage(
    step2.currentWeeklyMileage,
    step2.experienceLevel,
    step1.distance,
    step2.availableWeeks
  );

  // Generate weekly mileage progression
  const weeklyMileages = generateMileageProgression(
    step2.currentWeeklyMileage,
    peakMileage,
    step2.availableWeeks,
    phases
  );

  // Generate weeks with workouts
  const weeks: TrainingWeek[] = [];
  for (let weekNum = 1; weekNum <= step2.availableWeeks; weekNum++) {
    const phaseType = phases[weekNum - 1];
    const weeklyMileage = weeklyMileages[weekNum - 1];

    const workouts = generateWeeklyWorkouts(
      weekNum,
      weeklyMileage,
      phaseType,
      paces,
      step1.distance,
      step2.experienceLevel,
      step3
    );

    weeks.push({
      weekNumber: weekNum,
      weeklyMileage,
      phaseType,
      workouts,
      notes: generateWeekNotes(weekNum, phaseType, step2.availableWeeks),
    });
  }

  return {
    distance: step1.distance,
    goalTime,
    raceDate: step1.raceDate,
    totalWeeks: step2.availableWeeks,
    experienceLevel: step2.experienceLevel,
    weeks,
  };
}

/**
 * Generate workouts for a single week
 */
function generateWeeklyWorkouts(
  weekNumber: number,
  weeklyMileage: number,
  phaseType: TrainingWeek["phaseType"],
  paces: Record<WorkoutType, string>,
  distance: TrainingDistance,
  experienceLevel: ExperienceLevel,
  preferences: PlanInputs["step3"]
): Workout[] {
  const workouts: Workout[] = [];
  const trainingDays = preferences.trainingDaysPerWeek;
  const workoutDistribution = PHASE_WORKOUT_DISTRIBUTION[phaseType];

  // Determine which days to run based on preferences
  const runDays = selectRunDays(trainingDays, preferences.longRunDay);

  // Calculate mileage allocation
  const longRunDay = preferences.longRunDay === "flexible" ? 7 : preferences.longRunDay === "saturday" ? 6 : 7;
  const longRunDistance = Math.round(weeklyMileage * LONG_RUN_PERCENTAGE[phaseType]);

  // Assign workout types to days
  let assignedMileage = 0;

  // 1. Add long run
  workouts.push(
    createWorkout(
      `long-${weekNumber}-${longRunDay}`,
      longRunDay,
      "long",
      paces.long,
      longRunDistance
    )
  );
  assignedMileage += longRunDistance;

  // 2. Add quality workouts based on phase
  if (phaseType !== "base" && runDays.length > 2) {
    // Add tempo run
    if (workoutDistribution.tempo > 0) {
      const tempoDistance = Math.round(
        weeklyMileage * TEMPO_DISTANCE_PERCENTAGE[experienceLevel]
      );
      const tempoDay = runDays.find((d) => d !== longRunDay && d !== longRunDay - 1) || runDays[1];
      workouts.push(
        createWorkout(
          `tempo-${weekNumber}-${tempoDay}`,
          tempoDay,
          "tempo",
          paces.tempo,
          tempoDistance
        )
      );
      assignedMileage += tempoDistance;
    }

    // Add intervals
    if (workoutDistribution.intervals > 0 && preferences.preferredWorkouts.includes("intervals")) {
      const intervalDay =
        runDays.find((d) => !workouts.some((w) => w.day === d)) || runDays[2];
      const intervalWorkout = selectIntervalWorkout(distance, weekNumber, phaseType);
      workouts.push(
        createIntervalWorkout(
          `intervals-${weekNumber}-${intervalDay}`,
          intervalDay,
          intervalWorkout,
          paces.intervals,
          paces.recovery
        )
      );
      assignedMileage += intervalWorkout.count * intervalWorkout.distance;
    }

    // Add hills if preferred
    if (workoutDistribution.hills > 0 && preferences.preferredWorkouts.includes("hills")) {
      const hillDay = runDays.find((d) => !workouts.some((w) => w.day === d)) || runDays[3];
      const hillDistance = Math.round(weeklyMileage * 0.1);
      workouts.push(
        createWorkout(
          `hills-${weekNumber}-${hillDay}`,
          hillDay,
          "hills",
          "Effort-based",
          hillDistance
        )
      );
      assignedMileage += hillDistance;
    }
  }

  // 3. Fill remaining days with easy/recovery runs
  for (const day of runDays) {
    if (!workouts.some((w) => w.day === day)) {
      const remainingDays = runDays.filter((d) => !workouts.some((w) => w.day === d)).length;
      const easyDistance = Math.max(
        5,
        Math.round((weeklyMileage - assignedMileage) / remainingDays)
      );

      const type: WorkoutType =
        workoutDistribution.recovery > 0 && Math.random() < workoutDistribution.recovery
          ? "recovery"
          : "easy";

      workouts.push(
        createWorkout(
          `${type}-${weekNumber}-${day}`,
          day,
          type,
          type === "recovery" ? paces.recovery : paces.easy,
          easyDistance
        )
      );
      assignedMileage += easyDistance;
    }
  }

  // 4. Add rest days
  for (let day = 1; day <= 7; day++) {
    if (!workouts.some((w) => w.day === day)) {
      workouts.push(
        createWorkout(`rest-${weekNumber}-${day}`, day, "rest", "N/A", 0)
      );
    }
  }

  // Sort by day
  return workouts.sort((a, b) => a.day - b.day);
}

/**
 * Select which days to run based on training days per week
 */
function selectRunDays(trainingDays: number, longRunDay: string): number[] {
  const longRunDayNum = longRunDay === "saturday" ? 6 : 7;

  // Standard patterns for different training frequencies
  const patterns: Record<number, number[]> = {
    3: longRunDayNum === 6 ? [2, 4, 6] : [2, 4, 7],
    4: longRunDayNum === 6 ? [2, 4, 5, 6] : [2, 4, 6, 7],
    5: longRunDayNum === 6 ? [1, 3, 4, 5, 6] : [1, 3, 5, 6, 7],
    6: longRunDayNum === 6 ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 5, 6, 7],
    7: [1, 2, 3, 4, 5, 6, 7],
  };

  return patterns[trainingDays] || patterns[4];
}

/**
 * Create a standard workout
 */
function createWorkout(
  id: string,
  day: number,
  type: WorkoutType,
  pace: string,
  distance: number
): Workout {
  const template = WORKOUT_DESCRIPTIONS[type];

  return {
    id,
    day,
    type,
    title: template.title,
    description: generateWorkoutDescription(type, distance, pace),
    distance,
    pace,
  };
}

/**
 * Create an interval workout
 */
function createIntervalWorkout(
  id: string,
  day: number,
  intervalConfig: { count: number; distance: number; recoveryDistance: number },
  intervalPace: string,
  recoveryPace: string
): Workout {
  const intervals = {
    count: intervalConfig.count,
    distance: intervalConfig.distance,
    pace: intervalPace,
    recovery: `${intervalConfig.recoveryDistance}km easy @ ${recoveryPace}`,
  };

  return {
    id,
    day,
    type: "intervals",
    title: WORKOUT_DESCRIPTIONS.intervals.title,
    description: generateWorkoutDescription("intervals", undefined, undefined, intervals),
    distance: intervalConfig.count * intervalConfig.distance,
    pace: intervalPace,
    intervals,
  };
}

/**
 * Select appropriate interval workout for the distance and week
 */
function selectIntervalWorkout(
  distance: TrainingDistance,
  weekNumber: number,
  phaseType: TrainingWeek["phaseType"]
): { count: number; distance: number; recoveryDistance: number } {
  const workouts = INTERVAL_WORKOUTS[distance];

  // Start with easier intervals, progress to harder
  if (phaseType === "build") {
    return workouts[0];
  } else if (phaseType === "peak") {
    return weekNumber % 2 === 0 ? workouts[1] : workouts[2];
  }

  return workouts[0];
}

/**
 * Generate notes for the week
 */
function generateWeekNotes(
  weekNumber: number,
  phaseType: TrainingWeek["phaseType"],
  totalWeeks: number
): string {
  const weeksRemaining = totalWeeks - weekNumber;

  if (phaseType === "base") {
    return "Focus on building your aerobic base. Keep efforts comfortable and conversational.";
  } else if (phaseType === "build") {
    return "Introducing quality workouts. Balance intensity with adequate recovery.";
  } else if (phaseType === "peak") {
    return "Peak training phase. Push yourself but listen to your body.";
  } else if (phaseType === "taper") {
    if (weeksRemaining === 0) {
      return "Race week! Trust your training. Stay relaxed and focused.";
    } else if (weeksRemaining === 1) {
      return "Final taper week. Reduce volume, maintain some intensity. Rest well.";
    }
    return "Taper phase. Reduce volume while maintaining fitness. Prioritize rest and recovery.";
  }

  return "";
}
