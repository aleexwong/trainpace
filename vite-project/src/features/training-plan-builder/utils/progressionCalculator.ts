/**
 * Weekly Mileage Progression Calculator
 */

import type { ExperienceLevel, TrainingDistance, TrainingWeek } from "../types";

// Peak mileage targets by distance and experience level
export const PEAK_MILEAGE_TARGETS: Record<
  TrainingDistance,
  Record<ExperienceLevel, { min: number; max: number }>
> = {
  "5K": {
    beginner: { min: 25, max: 35 },
    intermediate: { min: 35, max: 45 },
    advanced: { min: 45, max: 55 },
  },
  "10K": {
    beginner: { min: 35, max: 45 },
    intermediate: { min: 45, max: 55 },
    advanced: { min: 55, max: 70 },
  },
  Half: {
    beginner: { min: 45, max: 60 },
    intermediate: { min: 60, max: 75 },
    advanced: { min: 75, max: 90 },
  },
  Marathon: {
    beginner: { min: 60, max: 75 },
    intermediate: { min: 75, max: 90 },
    advanced: { min: 90, max: 110 },
  },
};

// Minimum weeks required by distance and experience level
export const MIN_WEEKS_REQUIRED: Record<
  TrainingDistance,
  Record<ExperienceLevel, number>
> = {
  "5K": {
    beginner: 6,
    intermediate: 8,
    advanced: 10,
  },
  "10K": {
    beginner: 8,
    intermediate: 10,
    advanced: 12,
  },
  Half: {
    beginner: 10,
    intermediate: 12,
    advanced: 14,
  },
  Marathon: {
    beginner: 16,
    intermediate: 16,
    advanced: 18,
  },
};

// Maximum safe weekly increase percentage
const MAX_WEEKLY_INCREASE = 0.1; // 10%

// Recovery week reduction percentage
const RECOVERY_WEEK_REDUCTION = 0.2; // 20%

// Recovery week frequency
const RECOVERY_WEEK_FREQUENCY = 3; // Every 3 weeks

// Taper reduction by week (last 2-3 weeks)
const TAPER_REDUCTIONS = [0.75, 0.6, 0.5]; // Week -3, -2, -1 from race

/**
 * Calculate peak mileage based on current mileage, experience, and distance
 */
export function calculatePeakMileage(
  currentWeeklyMileage: number,
  experienceLevel: ExperienceLevel,
  distance: TrainingDistance,
  availableWeeks: number
): number {
  const targets = PEAK_MILEAGE_TARGETS[distance][experienceLevel];

  // Calculate maximum achievable mileage based on current mileage and available weeks
  // Using conservative 10% weekly increase with recovery weeks
  const weeksForBuilding = Math.floor(availableWeeks * 0.7); // 70% for building, 30% for taper
  const recoveryWeeks = Math.floor(weeksForBuilding / (RECOVERY_WEEK_FREQUENCY + 1));
  const buildingWeeks = weeksForBuilding - recoveryWeeks;

  const maxAchievableMileage =
    currentWeeklyMileage * Math.pow(1 + MAX_WEEKLY_INCREASE, buildingWeeks);

  // Return the minimum of achievable and target max
  return Math.min(maxAchievableMileage, targets.max);
}

/**
 * Generate weekly mileage progression
 */
export function generateMileageProgression(
  startMileage: number,
  peakMileage: number,
  totalWeeks: number,
  phaseTypes: TrainingWeek["phaseType"][]
): number[] {
  const mileages: number[] = [];
  let currentMileage = startMileage;

  for (let week = 0; week < totalWeeks; week++) {
    const phaseType = phaseTypes[week];

    // Handle taper phase
    if (phaseType === "taper") {
      const taperWeeksFromEnd = totalWeeks - week - 1;
      const taperIndex = Math.min(taperWeeksFromEnd, TAPER_REDUCTIONS.length - 1);
      const taperReduction = TAPER_REDUCTIONS[taperIndex];
      currentMileage = Math.round(peakMileage * taperReduction);
      mileages.push(currentMileage);
      continue;
    }

    // Recovery week every 3-4 weeks during base and build phases
    const isRecoveryWeek =
      (week + 1) % (RECOVERY_WEEK_FREQUENCY + 1) === 0 &&
      phaseType !== "peak" &&
      phaseType !== "taper";

    if (isRecoveryWeek) {
      currentMileage = Math.round(currentMileage * (1 - RECOVERY_WEEK_REDUCTION));
      mileages.push(currentMileage);
      continue;
    }

    // Normal progression week
    if (currentMileage < peakMileage) {
      const remainingWeeks = totalWeeks - week;
      const remainingGrowth = peakMileage - currentMileage;
      const weeklyIncrease = Math.min(
        remainingGrowth / remainingWeeks,
        currentMileage * MAX_WEEKLY_INCREASE
      );
      currentMileage = Math.round(currentMileage + weeklyIncrease);
    } else {
      currentMileage = peakMileage;
    }

    mileages.push(currentMileage);
  }

  return mileages;
}

/**
 * Determine phase for each week
 */
export function determinePhases(
  totalWeeks: number,
  experienceLevel: ExperienceLevel,
  distance: TrainingDistance
): TrainingWeek["phaseType"][] {
  // Phase distribution percentages
  const distributions = {
    "5K": {
      beginner: { base: 0.4, build: 0.4, peak: 0.1, taper: 0.1 },
      intermediate: { base: 0.3, build: 0.4, peak: 0.2, taper: 0.1 },
      advanced: { base: 0.25, build: 0.4, peak: 0.25, taper: 0.1 },
    },
    "10K": {
      beginner: { base: 0.4, build: 0.35, peak: 0.15, taper: 0.1 },
      intermediate: { base: 0.35, build: 0.35, peak: 0.2, taper: 0.1 },
      advanced: { base: 0.3, build: 0.35, peak: 0.25, taper: 0.1 },
    },
    Half: {
      beginner: { base: 0.45, build: 0.3, peak: 0.15, taper: 0.1 },
      intermediate: { base: 0.35, build: 0.35, peak: 0.2, taper: 0.1 },
      advanced: { base: 0.3, build: 0.4, peak: 0.2, taper: 0.1 },
    },
    Marathon: {
      beginner: { base: 0.4, build: 0.35, peak: 0.15, taper: 0.1 },
      intermediate: { base: 0.35, build: 0.35, peak: 0.2, taper: 0.1 },
      advanced: { base: 0.3, build: 0.35, peak: 0.25, taper: 0.1 },
    },
  };

  const dist = distributions[distance][experienceLevel];

  const baseWeeks = Math.round(totalWeeks * dist.base);
  const buildWeeks = Math.round(totalWeeks * dist.build);
  const peakWeeks = Math.round(totalWeeks * dist.peak);
  const taperWeeks = totalWeeks - baseWeeks - buildWeeks - peakWeeks;

  const phases: TrainingWeek["phaseType"][] = [];

  for (let i = 0; i < baseWeeks; i++) phases.push("base");
  for (let i = 0; i < buildWeeks; i++) phases.push("build");
  for (let i = 0; i < peakWeeks; i++) phases.push("peak");
  for (let i = 0; i < taperWeeks; i++) phases.push("taper");

  return phases;
}

/**
 * Validate if available weeks is sufficient for the plan
 */
export function validateAvailableWeeks(
  availableWeeks: number,
  experienceLevel: ExperienceLevel,
  distance: TrainingDistance
): { isValid: boolean; minRequired: number; message?: string } {
  const minRequired = MIN_WEEKS_REQUIRED[distance][experienceLevel];

  if (availableWeeks < minRequired) {
    return {
      isValid: false,
      minRequired,
      message: `Minimum ${minRequired} weeks required for a ${experienceLevel} ${distance} plan. You have ${availableWeeks} weeks available.`,
    };
  }

  return { isValid: true, minRequired };
}

/**
 * Calculate recommended weeks based on distance and experience
 */
export function calculateRecommendedWeeks(
  experienceLevel: ExperienceLevel,
  distance: TrainingDistance,
  raceDate: string
): number {
  const recommendedWeeks = {
    "5K": { beginner: 8, intermediate: 10, advanced: 12 },
    "10K": { beginner: 10, intermediate: 12, advanced: 14 },
    Half: { beginner: 12, intermediate: 14, advanced: 16 },
    Marathon: { beginner: 18, intermediate: 18, advanced: 20 },
  };

  // Calculate weeks from today to race date
  const today = new Date();
  const race = new Date(raceDate);
  const weeksAvailable = Math.floor(
    (race.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 7)
  );

  // Return the minimum of recommended and available
  return Math.min(
    Math.max(weeksAvailable, MIN_WEEKS_REQUIRED[distance][experienceLevel]),
    recommendedWeeks[distance][experienceLevel]
  );
}
