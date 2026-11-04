/**
 * Fuel Calculation Hook
 *
 * Thin wrapper over the pure math in `../fuel-math`. Handles form-string
 * parsing and validation; the arithmetic itself lives in the math module so
 * the build-time reference tables stay in sync with what the app shows.
 */

import { useMemo } from "react";
import { type RaceType, type FuelPlanResult } from "../types";
import { calculateFuelPlan } from "../fuel-math";

interface UseFuelCalculationParams {
  raceType: RaceType;
  weight: string;
  timeHours: string;
  timeMinutes: string;
  customCarbsPerHour?: number; // Optional override from slider
}

interface UseFuelCalculationReturn {
  result: FuelPlanResult | null;
  error: string | null;
  isValid: boolean;
}

/**
 * Convert the race-type-aware time inputs into total minutes.
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

/**
 * Calculate fuel needs based on race parameters
 */
export function useFuelCalculation({
  raceType,
  weight,
  timeHours,
  timeMinutes,
  customCarbsPerHour,
}: UseFuelCalculationParams): UseFuelCalculationReturn {
  return useMemo(() => {
    // Parse inputs
    const weightKg = weight ? parseFloat(weight) : NaN;

    // Calculate total time in minutes. The 10K path deliberately keeps NaN for
    // an empty field so the validation below reports it, rather than coercing
    // to 0 the way getFinishTimeInMinutes does for display callers.
    const finishTimeMin =
      raceType === "10K"
        ? parseFloat(timeMinutes)
        : (parseFloat(timeHours) || 0) * 60 + (parseFloat(timeMinutes) || 0);

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

    return {
      result: calculateFuelPlan({
        raceType,
        finishTimeMin,
        weightKg: isNaN(weightKg) ? undefined : weightKg,
        customCarbsPerHour,
      }),
      error: null,
      isValid: true,
    };
  }, [raceType, weight, timeHours, timeMinutes, customCarbsPerHour]);
}
