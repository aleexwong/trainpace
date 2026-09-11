/**
 * Fuel Planner — Core Math
 *
 * Pure, React-free fueling math. Extracted from `useFuelCalculation` so the
 * same numbers can be produced at build time (static reference tables in the
 * prerendered HTML and the Markdown page mirrors) as at runtime in the app.
 *
 * The hook is now a thin `useMemo` wrapper around `calculateFuelPlan`.
 */

import {
  type RaceType,
  type FuelPlanResult,
  type FuelStop,
  RACE_SETTINGS,
  RACE_DISTANCES,
  MAX_CARBS_PER_HOUR,
  CARBS_PER_KG_MULTIPLIER,
  CALORIES_PER_GRAM_CARB,
  GELS_PER_HOUR,
  MAX_GELS,
  MIN_10K_TIME_FOR_GEL,
  MIN_RACE_TIME_FOR_FUELING,
  FUEL_PRODUCTS,
} from "./types";

/**
 * Format time in minutes to H:MM string
 */
export function formatFuelTime(minutes: number): string {
  // Round to whole minutes FIRST, then split. Rounding the remainder
  // independently of the hours lets a value like 59.6 round its remainder up
  // to 60 without carrying, printing "0:60" (and 119.7 printing "1:60").
  const total = Math.max(0, Math.round(minutes));
  const hrs = Math.floor(total / 60);
  const mins = total % 60;
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
export function generateFuelStops(
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

  // Calculate carbs per stop to hit target carbs/hour
  // Distribute total carbs across stops
  const totalRaceCarbs = (finishTimeMin / 60) * carbsPerHour;
  const carbsPerStop =
    fuelingSchedule.length > 0 ? totalRaceCarbs / fuelingSchedule.length : 0;

  // Generate fuel stops with realistic carb amounts
  fuelingSchedule.forEach((timeMin, index) => {
    const currentDistanceKm = timeMin / paceMinPerKm;
    const isEarlyStop = index < Math.ceil(fuelingSchedule.length * 0.4);

    // Front-load slightly more carbs early (easier to digest)
    const adjustedCarbs = isEarlyStop
      ? Math.round(carbsPerStop * 1.1)
      : Math.round(carbsPerStop * 0.95);

    stops.push({
      time: formatFuelTime(timeMin),
      distance: `${currentDistanceKm.toFixed(1)}km`,
      distanceKm: currentDistanceKm,
      carbsNeeded: adjustedCarbs,
      suggestion: getFuelSuggestion(adjustedCarbs),
    });
  });

  return stops;
}

/**
 * Resolve the carbs/hour target for a race.
 *
 * Logic: the weight-based calc provides a floor above the race baseline, and an
 * explicit slider value overrides both. All paths are capped at the race's upper
 * limit (100g/hr for marathon, 90g/hr otherwise).
 */
export function resolveCarbsPerHour(params: {
  raceType: RaceType;
  weightKg?: number;
  customCarbsPerHour?: number;
}): number {
  const { raceType, weightKg, customCarbsPerHour } = params;
  const raceBaseline = RACE_SETTINGS[raceType];
  const raceMax = MAX_CARBS_PER_HOUR[raceType];

  let carbsPerHour: number;
  if (customCarbsPerHour !== undefined) {
    // Manual slider override - use as-is
    carbsPerHour = customCarbsPerHour;
  } else if (
    weightKg !== undefined &&
    !Number.isNaN(weightKg) &&
    weightKg > 0
  ) {
    // Weight-based calculation: max(weight × 0.7, race baseline)
    const weightBased = Math.round(weightKg * CARBS_PER_KG_MULTIPLIER);
    carbsPerHour = Math.max(weightBased, raceBaseline);
  } else {
    // No weight provided - use race baseline
    carbsPerHour = raceBaseline;
  }

  // Clamp both ends. The upper bound keeps a weight-based or custom target
  // inside what a gut can absorb; the lower bound stops a nonsensical custom
  // value (a negative slider reading) becoming a negative carbs/hour target.
  return Math.min(Math.max(carbsPerHour, 0), raceMax);
}

/**
 * Number of gels needed for a race of the given duration.
 */
export function resolveGelsNeeded(
  raceType: RaceType,
  durationHours: number
): number {
  if (raceType === "10K") {
    return durationHours >= MIN_10K_TIME_FOR_GEL ? 1 : 0;
  }
  // Math.ceil on a negative duration yields a negative gel count, which then
  // propagates into calculateFuelPlan's totals. Floor at zero.
  return Math.min(Math.max(Math.ceil(durationHours * GELS_PER_HOUR), 0), MAX_GELS);
}

/**
 * Full race-day fuel plan: carbs/hour target, totals, gel count, and a
 * fuel-stop timeline.
 */
export function calculateFuelPlan(params: {
  raceType: RaceType;
  finishTimeMin: number;
  weightKg?: number;
  customCarbsPerHour?: number;
}): FuelPlanResult {
  const { raceType, finishTimeMin, weightKg, customCarbsPerHour } = params;

  const carbsPerHour = resolveCarbsPerHour({
    raceType,
    weightKg,
    customCarbsPerHour,
  });

  // A negative finish time is nonsense input, but left unguarded it flowed
  // straight through into negative totals and a negative gel count. Floor the
  // duration so every downstream number stays physically meaningful;
  // generateFuelStops already rejects it separately and returns no stops.
  const durationHours = Math.max(0, finishTimeMin) / 60;
  const totalCarbs = Math.round(durationHours * carbsPerHour);
  const totalCalories = totalCarbs * CALORIES_PER_GRAM_CARB;
  const gelsNeeded = resolveGelsNeeded(raceType, durationHours);

  const distanceKm = RACE_DISTANCES[raceType];
  const fuelStops = generateFuelStops(finishTimeMin, distanceKm, carbsPerHour);

  return {
    carbsPerHour,
    totalCarbs,
    totalCalories,
    gelsNeeded,
    fuelStops,
  };
}
