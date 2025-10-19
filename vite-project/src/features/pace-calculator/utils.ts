/**
 * Pace Calculator Utilities
 * Pure functions for pace calculations and conversions
 */

import type { PaceResults, DistanceUnit, PaceUnit } from "./types";

/**
 * Convert time inputs to total seconds
 */
export function timeToSeconds(h: string, m: string, s: string): number {
  return (
    parseInt(h || "0") * 3600 + parseInt(m || "0") * 60 + parseInt(s || "0")
  );
}

/**
 * Convert seconds to formatted time string (HH:MM:SS or MM:SS)
 */
export function secondsToTimeString(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Convert pace between miles and kilometers
 */
export function convertPace(
  paceInSeconds: number,
  fromUnit: DistanceUnit,
  toUnit: PaceUnit
): number {
  const targetUnit = toUnit.toLowerCase();
  if (fromUnit === targetUnit) return paceInSeconds;

  return fromUnit === "miles"
    ? paceInSeconds * 0.621371 // km to mile
    : paceInSeconds / 0.621371; // mile to km
}

/**
 * Common race distances in both units
 */
const COMMON_RACES = {
  km: [0.8, 1, 5, 10, 21.1, 42.2],
  miles: [0.5, 1, 3.1, 6.2, 13.1, 26.2],
};

/**
 * Convert distance between km and miles with smart snapping
 * Snaps to nearest common race distance if close, otherwise rounds to 1 decimal
 */
export function convertDistance(
  distance: number,
  fromUnit: DistanceUnit,
  toUnit: DistanceUnit
): number {
  if (fromUnit === toUnit) return distance;

  // Convert the distance
  const conversionFactor = fromUnit === "km" ? 0.621371 : 1.60934;
  const converted = distance * conversionFactor;

  // Get common races for target unit
  const commonRaces = toUnit === "km" ? COMMON_RACES.km : COMMON_RACES.miles;

  // Check if converted value is close to a common race distance (within 2%)
  for (const raceDistance of commonRaces) {
    const difference = Math.abs(converted - raceDistance);
    const percentDiff = (difference / raceDistance) * 100;

    if (percentDiff < 2) {
      return raceDistance; // Snap to common race distance
    }
  }

  // Otherwise, round to 1 decimal place
  return Math.round(converted * 10) / 10;
}

/**
 * Calculate training paces based on race time and distance
 */
export function calculateTrainingPaces(
  raceTimeSeconds: number,
  raceDistance: number,
  units: DistanceUnit,
  paceType: PaceUnit
): PaceResults {
  // Calculate base pace per mile/km
  const basePaceSeconds = raceTimeSeconds / raceDistance;

  // Convert to selected unit if necessary
  const convertedBasePace = convertPace(basePaceSeconds, units, paceType);

  // Calculate different training paces (multipliers based on common training principles)
  const paces: Record<string, [number, number]> = {
    race: [convertedBasePace, convertedBasePace],
    easy: [convertedBasePace * 1.2, convertedBasePace * 1.3],
    tempo: [convertedBasePace * 0.95, convertedBasePace * 1.05],
    interval: [convertedBasePace * 0.9, convertedBasePace * 1.0],
    maximum: [convertedBasePace * 0.85, convertedBasePace * 0.95],
    speed: [convertedBasePace * 0.8, convertedBasePace * 0.9],
    xlong: [convertedBasePace * 1.2, convertedBasePace * 1.4],
  };

  // Calculate Yasso 800s
  const raceTimeMinutes = raceTimeSeconds / 60;
  const pacePerKm = raceTimeMinutes / raceDistance;
  const marathonDistance = 42.195;
  const projectedMarathonTime = pacePerKm * marathonDistance;

  // Yasso 800 pace with range
  const yassoLowerBound = projectedMarathonTime;
  const yassoUpperBound = projectedMarathonTime + 30;
  paces.yasso = [yassoLowerBound, yassoUpperBound];

  // Convert all paces to time strings
  const paceUnit = paceType.toLowerCase();
  return Object.entries(paces).reduce(
    (acc, [key, [min, max]]) => {
      const unit = key === "yasso" ? "/800m" : `/${paceUnit}`;
      acc[key as keyof PaceResults] = `${secondsToTimeString(
        min
      )}-${secondsToTimeString(max)} min${unit}`;
      return acc;
    },
    {} as PaceResults
  );
}

/**
 * Validate pace calculator inputs
 */
export function validatePaceInputs(
  distance: string,
  hours: string,
  minutes: string,
  seconds: string
): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // Distance validation
  if (!distance) {
    errors.distance = "Distance is required";
  } else if (isNaN(Number(distance)) || parseFloat(distance) <= 0) {
    errors.distance = "Please enter a valid distance";
  }

  // Time validation
  const h = parseInt(hours || "0");
  const m = parseInt(minutes || "0");
  const s = parseInt(seconds || "0");

  if (h === 0 && m === 0 && s === 0) {
    errors.time = "Please enter a valid time";
  }

  if (m >= 60 || s >= 60) {
    errors.time = "Invalid time format";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
