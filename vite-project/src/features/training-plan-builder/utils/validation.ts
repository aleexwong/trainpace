/**
 * Form Validation Utilities
 */

import type {
  Step1Data,
  Step2Data,
  Step3Data,
  FormErrors,
  ExperienceLevel,
  TrainingDistance,
} from "../types";
import { validateGoalTime } from "./paceCalculator";
import { validateAvailableWeeks, MIN_WEEKS_REQUIRED } from "./progressionCalculator";
import { timeInputsToSeconds } from "./paceCalculator";

/**
 * Validate Step 1: Goal Selection
 */
export function validateStep1(data: Step1Data): FormErrors["step1"] {
  const errors: FormErrors["step1"] = {};

  // Validate distance selection
  if (!data.distance) {
    errors.distance = "Please select a race distance";
  }

  // Validate goal time
  const goalTimeSeconds = timeInputsToSeconds(
    data.goalTimeHours,
    data.goalTimeMinutes,
    data.goalTimeSeconds
  );

  if (goalTimeSeconds === 0) {
    errors.goalTime = "Please enter a goal time";
  } else {
    const validation = validateGoalTime(goalTimeSeconds, data.distance, "intermediate");
    if (!validation.isValid) {
      errors.goalTime = validation.message;
    }
  }

  // Validate race date
  if (!data.raceDate) {
    errors.raceDate = "Please select a race date";
  } else {
    const raceDate = new Date(data.raceDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (raceDate < today) {
      errors.raceDate = "Race date must be in the future";
    }

    // Check if race is too soon (less than 4 weeks away)
    const weeksUntilRace = Math.floor(
      (raceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 7)
    );

    if (weeksUntilRace < 4) {
      errors.raceDate = "Race date should be at least 4 weeks away for a proper training plan";
    }
  }

  return Object.keys(errors).length > 0 ? errors : undefined;
}

/**
 * Validate Step 2: Personal Details
 */
export function validateStep2(
  data: Step2Data,
  distance: TrainingDistance
): FormErrors["step2"] {
  const errors: FormErrors["step2"] = {};

  // Validate experience level
  if (!data.experienceLevel) {
    errors.experienceLevel = "Please select your experience level";
  }

  // Validate current weekly mileage
  if (data.currentWeeklyMileage < 0) {
    errors.currentWeeklyMileage = "Weekly mileage cannot be negative";
  }

  if (data.currentWeeklyMileage > 200) {
    errors.currentWeeklyMileage = "Weekly mileage seems too high. Please verify.";
  }

  // Validate longest recent run
  if (data.longestRecentRun < 0) {
    errors.longestRecentRun = "Distance cannot be negative";
  }

  if (data.longestRecentRun > data.currentWeeklyMileage) {
    errors.longestRecentRun = "Longest run cannot exceed your weekly mileage";
  }

  // Validate available weeks
  if (data.availableWeeks < 1) {
    errors.availableWeeks = "Training plan requires at least 1 week";
  }

  const weeksValidation = validateAvailableWeeks(
    data.availableWeeks,
    data.experienceLevel,
    distance
  );

  if (!weeksValidation.isValid) {
    errors.availableWeeks = weeksValidation.message;
  }

  return Object.keys(errors).length > 0 ? errors : undefined;
}

/**
 * Validate Step 3: Training Preferences
 */
export function validateStep3(data: Step3Data): FormErrors["step3"] {
  const errors: FormErrors["step3"] = {};

  // Validate training days per week
  if (data.trainingDaysPerWeek < 3 || data.trainingDaysPerWeek > 7) {
    errors.trainingDaysPerWeek = "Training days must be between 3 and 7";
  }

  // Validate preferred workouts
  if (data.preferredWorkouts.length === 0) {
    errors.preferredWorkouts = "Please select at least one workout type";
  }

  return Object.keys(errors).length > 0 ? errors : undefined;
}

/**
 * Check if step can proceed (no blocking errors)
 */
export function canProceedFromStep(stepNumber: number, errors: FormErrors): boolean {
  switch (stepNumber) {
    case 1:
      return !errors.step1;
    case 2:
      return !errors.step2;
    case 3:
      return !errors.step3;
    default:
      return true;
  }
}

/**
 * Get minimum weeks required for a plan
 */
export function getMinWeeksRequired(
  experienceLevel: ExperienceLevel,
  distance: TrainingDistance
): number {
  return MIN_WEEKS_REQUIRED[distance][experienceLevel];
}
