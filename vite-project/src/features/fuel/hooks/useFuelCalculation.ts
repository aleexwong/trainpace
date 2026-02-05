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
  MIN_RACE_TIME_FOR_FUELING,
  FUEL_PRODUCTS,
  SODIUM_PER_HOUR_BASE,
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
 * Strategy: Front-load carbs early (15-20 min intervals) since glucose takes time to absorb,
 * then space out to 25-30 min intervals later in the race
 */
function generateFuelStops(
  finishTimeMin: number,
  distanceKm: number,
  carbsPerHour: number,
  sodiumPerHour: number
): FuelStop[] {
  // Don't generate stops for races under 1 hour
  if (finishTimeMin < MIN_RACE_TIME_FOR_FUELING) {
    return [];
  }

  const stops: FuelStop[] = [];
  const paceMinPerKm = finishTimeMin / distanceKm;
  
  // Define fueling schedule with front-loaded strategy
  // Early stops: 15-20 min (get carbs in early while stomach is fresh)
  // Mid stops: 25-30 min (energy system primed, longer intervals work)
  // Stop fueling ~15 min before finish (nothing will process in time)
  
  const fuelingSchedule: number[] = [];
  let currentTime = 15; // Start first fuel at 15 minutes
  const lastFuelTime = finishTimeMin - 15; // Stop 15 min before finish
  
  // Build dynamic schedule based on race duration
  while (currentTime <= lastFuelTime) {
    fuelingSchedule.push(currentTime);
    
    // Determine next interval based on race progress
    const raceProgress = currentTime / finishTimeMin;
    let interval: number;
    
    if (raceProgress < 0.3) {
      // First 30% of race: 15-20 min intervals (front-load)
      interval = 17;
    } else if (raceProgress < 0.7) {
      // Middle 40% of race: 25 min intervals (steady state)
      interval = 25;
    } else {
      // Final 30% of race: 30 min intervals (less frequent, harder to digest)
      interval = 30;
    }
    
    currentTime += interval;
  }
  
  console.log(`[Fuel Timeline] Generated ${fuelingSchedule.length} stops for ${(finishTimeMin/60).toFixed(2)}hr race:`, fuelingSchedule.map(t => formatTime(t)).join(', '));
  
  // Calculate carbs per stop to hit target carbs/hour
  // Distribute total carbs across stops
  const totalRaceCarbs = (finishTimeMin / 60) * carbsPerHour;
  const carbsPerStop = fuelingSchedule.length > 0
    ? totalRaceCarbs / fuelingSchedule.length
    : 0;

  // Calculate sodium per stop
  const totalRaceSodium = (finishTimeMin / 60) * sodiumPerHour;
  const sodiumPerStop = fuelingSchedule.length > 0
    ? totalRaceSodium / fuelingSchedule.length
    : 0;

  // Generate fuel stops with realistic carb amounts
  fuelingSchedule.forEach((timeMin, index) => {
    const currentDistanceKm = timeMin / paceMinPerKm;
    const isEarlyStop = index < Math.ceil(fuelingSchedule.length * 0.4);

    // Front-load slightly more carbs early (easier to digest)
    const adjustedCarbs = isEarlyStop
      ? Math.round(carbsPerStop * 1.1)
      : Math.round(carbsPerStop * 0.95);

    // Distribute sodium evenly
    const adjustedSodium = Math.round(sodiumPerStop);

    stops.push({
      time: formatTime(timeMin),
      distance: `${currentDistanceKm.toFixed(1)}km`,
      distanceKm: currentDistanceKm,
      carbsNeeded: adjustedCarbs,
      suggestion: getFuelSuggestion(adjustedCarbs),
      sodiumNeeded: adjustedSodium,
    });
  });

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

    // Calculate carbs per hour based on weight + race baseline
    // Logic: weight-based calc provides a floor above race baseline, slider overrides all
    const raceBaseline = RACE_SETTINGS[raceType];
    let carbsPerHour: number;
    
    if (customCarbsPerHour !== undefined) {
      // Manual slider override - use as-is
      carbsPerHour = customCarbsPerHour;
      console.log(`[Fuel Calc] Using custom slider: ${carbsPerHour}g/hr`);
    } else if (!isNaN(weightKg) && weightKg > 0) {
      // Weight-based calculation: max(weight × 0.7, race baseline)
      const weightBased = Math.round(weightKg * CARBS_PER_KG_MULTIPLIER);
      carbsPerHour = Math.max(weightBased, raceBaseline);
      console.log(`[Fuel Calc] Weight-based: ${weightKg}kg × 0.7 = ${weightBased}g, max(${weightBased}, ${raceBaseline}) = ${carbsPerHour}g/hr`);
    } else {
      // No weight provided - use race baseline
      carbsPerHour = raceBaseline;
      console.log(`[Fuel Calc] Using race baseline: ${carbsPerHour}g/hr`);
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

    // Calculate electrolyte needs (sodium in mg)
    const sodiumPerHour = SODIUM_PER_HOUR_BASE; // Base 500mg/hour
    const totalSodium = Math.round(durationHours * sodiumPerHour);

    // Generate fuel stops timeline
    const distanceKm = RACE_DISTANCES[raceType];
    const fuelStops = generateFuelStops(finishTimeMin, distanceKm, carbsPerHour, sodiumPerHour);

    return {
      result: {
        carbsPerHour,
        totalCarbs,
        totalCalories,
        gelsNeeded,
        fuelStops,
        sodiumPerHour,
        totalSodium,
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
