/**
 * Fuel Calculation Hook
 * Extracts all business logic for calculating fuel needs
 */

import { useMemo } from "react";
import {
  type RaceType,
  type FuelPlanResult,
  type FuelStop,
  RACE_SETTINGS,
  RACE_DISTANCES,
  CARBS_PER_KG_MULTIPLIER,
  CALORIES_PER_GRAM_CARB,
  GELS_PER_HOUR,
  MAX_GELS,
  MIN_10K_TIME_FOR_GEL,
  FUEL_INTERVAL_MINUTES,
  MIN_RACE_TIME_FOR_FUELING,
  FUEL_PRODUCTS,
} from "../types";

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
 * Format time in minutes to HH:MM string
 */
function formatTime(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hrs}:${mins.toString().padStart(2, "0")}`;
}

/**
 * Generate fuel suggestion based on carbs needed
 */
function getFuelSuggestion(carbsNeeded: number): string {
  // Find closest matching product(s)
  const gel = FUEL_PRODUCTS.find((p) => p.name.includes("Gel"));
  const gelCarbs = gel?.carbs ?? 22;

  if (carbsNeeded <= gelCarbs + 5) {
    return "1 gel or equivalent";
  } else if (carbsNeeded <= gelCarbs * 2) {
    return "1-2 gels or mixed fuel";
  } else {
    return "2+ gels or sports drink combo";
  }
}

/**
 * Generate fuel stops timeline based on race duration and carb goals
 */
function generateFuelStops(
  finishTimeMin: number,
  distanceKm: number,
  carbsPerHour: number
): FuelStop[] {
  // Don't generate stops for races under 1 hour
  if (finishTimeMin < MIN_RACE_TIME_FOR_FUELING) {
    return [];
  }

  const stops: FuelStop[] = [];
  const paceMinPerKm = finishTimeMin / distanceKm;
  const carbsPerInterval = (carbsPerHour / 60) * FUEL_INTERVAL_MINUTES;

  // Start first fuel at 20 min, then every 20 min until 10 min before finish
  let currentTime = FUEL_INTERVAL_MINUTES;
  const lastFuelTime = finishTimeMin - 10; // Don't fuel in last 10 minutes

  while (currentTime <= lastFuelTime) {
    const currentDistanceKm = currentTime / paceMinPerKm;

    stops.push({
      time: formatTime(currentTime),
      distance: `${currentDistanceKm.toFixed(1)}km`,
      distanceKm: currentDistanceKm,
      carbsNeeded: Math.round(carbsPerInterval),
      suggestion: getFuelSuggestion(Math.round(carbsPerInterval)),
    });

    currentTime += FUEL_INTERVAL_MINUTES;
  }

  return stops;
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

    // Calculate carbs per hour (priority: custom slider > weight-based > race default)
    let carbsPerHour: number;
    if (customCarbsPerHour !== undefined) {
      carbsPerHour = customCarbsPerHour;
    } else if (!isNaN(weightKg) && weightKg > 0) {
      carbsPerHour = Math.round(weightKg * CARBS_PER_KG_MULTIPLIER);
    } else {
      carbsPerHour = RACE_SETTINGS[raceType];
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

    // Generate fuel stops timeline
    const distanceKm = RACE_DISTANCES[raceType];
    const fuelStops = generateFuelStops(finishTimeMin, distanceKm, carbsPerHour);

    return {
      result: {
        carbsPerHour,
        totalCarbs,
        totalCalories,
        gelsNeeded,
        fuelStops,
      },
      error: null,
      isValid: true,
    };
  }, [raceType, weight, timeHours, timeMinutes, customCarbsPerHour]);
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
