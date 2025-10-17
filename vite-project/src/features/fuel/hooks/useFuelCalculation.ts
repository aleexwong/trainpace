/**
 * Fuel Calculation Hook
 * Extracts all business logic for calculating fuel needs
 */

import { useMemo } from "react";
import {
  type RaceType,
  type FuelPlanResult,
  RACE_SETTINGS,
  CARBS_PER_KG_MULTIPLIER,
  CALORIES_PER_GRAM_CARB,
  GELS_PER_HOUR,
  MAX_GELS,
  MIN_10K_TIME_FOR_GEL,
} from "../types";

interface UseFuelCalculationParams {
  raceType: RaceType;
  weight: string;
  timeHours: string;
  timeMinutes: string;
}

interface UseFuelCalculationReturn {
  result: FuelPlanResult | null;
  error: string | null;
  isValid: boolean;
}

/**
 * Calculate fuel needs based on race parameters
 */
export function useFuelCalculation({
  raceType,
  weight,
  timeHours,
  timeMinutes,
}: UseFuelCalculationParams): UseFuelCalculationReturn {
  return useMemo(() => {
    // Parse inputs
    const weightKg = weight ? parseFloat(weight) : NaN;

    // Calculate total time in minutes
    let finishTimeMin: number;
    if (raceType === "10K") {
      finishTimeMin = parseFloat(timeMinutes);
    } else {
      const hours = parseFloat(timeHours) || 0;
      const mins = parseFloat(timeMinutes) || 0;
      finishTimeMin = hours * 60 + mins;
    }

    // Validate inputs
    if (isNaN(finishTimeMin) || finishTimeMin <= 0) {
      return {
        result: null,
        error: "Please enter a valid finish time.",
        isValid: false,
      };
    }

    if (!isNaN(weightKg) && (weightKg < 1 || weightKg > 1000)) {
      return {
        result: null,
        error: "Weight must be between 1kg and 1000kg.",
        isValid: false,
      };
    }

    // Calculate carbs per hour
    let carbsPerHour: number = RACE_SETTINGS[raceType];
    if (!isNaN(weightKg) && weightKg > 0) {
      carbsPerHour = Math.round(weightKg * CARBS_PER_KG_MULTIPLIER);
    }

    // Calculate totals
    const durationHours = finishTimeMin / 60;
    const totalCarbs = Math.round(durationHours * carbsPerHour);
    const totalCalories = totalCarbs * CALORIES_PER_GRAM_CARB;

    // Calculate gels needed
    let gelsNeeded = 0;
    if (raceType === "10K") {
      gelsNeeded = durationHours >= MIN_10K_TIME_FOR_GEL ? 1 : 0;
    } else {
      gelsNeeded = Math.ceil(durationHours * GELS_PER_HOUR);
      gelsNeeded = Math.min(gelsNeeded, MAX_GELS);
    }

    return {
      result: {
        carbsPerHour,
        totalCarbs,
        totalCalories,
        gelsNeeded,
      },
      error: null,
      isValid: true,
    };
  }, [raceType, weight, timeHours, timeMinutes]);
}

/**
 * Get finish time in minutes from inputs (utility for persistence)
 */
export function getFinishTimeInMinutes(
  raceType: RaceType,
  timeHours: string,
  timeMinutes: string
): number {
  if (raceType === "10K") {
    return parseFloat(timeMinutes) || 0;
  }
  const hours = parseFloat(timeHours) || 0;
  const mins = parseFloat(timeMinutes) || 0;
  return hours * 60 + mins;
}
