/**
 * Fuel Schedule Utilities
 *
 * Generate fuel timing recommendations based on race distance and target time
 */

import type { FuelPlanSummary, FuelScheduleItem } from "../types";
import { formatTimeFromMinutes } from "./paceCalculations";

// Fuel plan constants (from fuel feature)
const CALORIES_PER_GRAM_CARB = 4;
const GELS_PER_HOUR = 1.5;

/**
 * Calculate fuel plan for a race
 */
export function calculateFuelPlan(params: {
  distance: number; // km
  targetTime: number; // minutes
  raceType: "5K" | "10K" | "Half" | "Full" | "Custom";
}): FuelPlanSummary {
  const { distance, targetTime, raceType } = params;

  // Carbs per hour based on race type
  const carbsPerHourMap = {
    "5K": 30,
    "10K": 30,
    Half: 45,
    Full: 75,
    Custom: 60,
  };

  const carbsPerHour = carbsPerHourMap[raceType];
  const timeInHours = targetTime / 60;

  // Calculate totals
  const totalCarbs = Math.round(carbsPerHour * timeInHours);
  const totalCalories = totalCarbs * CALORIES_PER_GRAM_CARB;

  // Calculate gels needed (only if race is long enough)
  const minTimeForGels = raceType === "10K" ? 45 : 30; // minutes
  const gelsNeeded =
    targetTime >= minTimeForGels ? Math.ceil(timeInHours * GELS_PER_HOUR) : 0;

  // Generate schedule
  const schedule = generateFuelSchedule({
    targetTime,
    distance,
    gelsNeeded,
    raceType,
  });

  return {
    carbsPerHour,
    totalCarbs,
    totalCalories,
    gelsNeeded,
    schedule,
  };
}

/**
 * Generate fuel timing schedule
 */
function generateFuelSchedule(params: {
  targetTime: number;
  distance: number;
  gelsNeeded: number;
  raceType: string;
}): FuelScheduleItem[] {
  const { targetTime, distance, gelsNeeded, raceType } = params;

  if (gelsNeeded === 0) return [];

  const schedule: FuelScheduleItem[] = [];
  const paceMinPerKm = targetTime / distance;

  // First gel timing (in minutes)
  let firstGelTime = 30; // Default: 30 minutes in
  if (raceType === "10K") firstGelTime = 25;
  if (raceType === "Full") firstGelTime = 45;

  // Interval between gels (in minutes)
  const gelInterval = raceType === "Full" ? 45 : 30;

  let currentTime = firstGelTime;
  let gelCount = 1;

  while (gelCount <= gelsNeeded && currentTime < targetTime) {
    const km = currentTime / paceMinPerKm;

    schedule.push({
      km: Math.round(km * 10) / 10,
      time: formatTimeFromMinutes(currentTime),
      action: `Take gel ${gelCount} + water`,
      note: gelCount === 1 ? "Start fueling early" : undefined,
    });

    currentTime += gelInterval;
    gelCount++;
  }

  return schedule;
}

/**
 * Get recommended carbs per hour for race type
 */
export function getRecommendedCarbsPerHour(raceType: string): number {
  const recommendations: Record<string, number> = {
    "5K": 30,
    "10K": 30,
    Half: 45,
    Full: 75,
    Custom: 60,
  };

  return recommendations[raceType] || 60;
}
