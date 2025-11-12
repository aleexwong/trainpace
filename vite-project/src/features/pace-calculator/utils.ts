/**
 * Pace Calculator Utilities
 * Pure functions for pace calculations and conversions
 */

import type { PaceResults, PaceResultsBase, DistanceUnit, PaceUnit, HeartRateZones, PaceAdjustments } from "./types";

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
  paceType: PaceUnit,
  options?: {
    age?: number;
    elevation?: "flat" | "hilly";
    temperature?: number;
  }
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
  const results = Object.entries(paces).reduce(
    (acc, [key, [min, max]]) => {
      const unit = key === "yasso" ? "/800m" : `/${paceUnit}`;
      acc[key as keyof PaceResultsBase] = `${secondsToTimeString(
        min
      )}-${secondsToTimeString(max)} min${unit}`;
      return acc;
    },
    {} as PaceResultsBase
  ) as PaceResults;

  // Add heart rate zones if age is provided
  if (options?.age && options.age > 0) {
    results.heartRateZones = calculateHeartRateZones(options.age);
  }

  // Add pace adjustments if elevation or temperature is provided
  const adjustments: PaceAdjustments = {};

  if (options?.elevation) {
    adjustments.elevation = calculateElevationAdjustment(
      results.easy,
      options.elevation,
      paceType
    );
  }

  if (options?.temperature !== undefined && options.temperature > 0) {
    adjustments.weather = calculateWeatherAdjustment(
      results.easy,
      options.temperature,
      paceType
    );
  }

  if (Object.keys(adjustments).length > 0) {
    results.adjustments = adjustments;
  }

  return results;
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

/**
 * Calculate heart rate zones based on age
 * Uses the standard formula: Max HR = 220 - age
 */
export function calculateHeartRateZones(age: number): HeartRateZones {
  const maxHR = 220 - age;

  const calculateZone = (lowerPercent: number, upperPercent: number): string => {
    const lower = Math.round(maxHR * lowerPercent);
    const upper = Math.round(maxHR * upperPercent);
    return `${Math.round(lowerPercent * 100)}-${Math.round(upperPercent * 100)}% (${lower}-${upper} bpm)`;
  };

  return {
    maxHR,
    easyZone: calculateZone(0.60, 0.70), // Easy pace = 60-70% max HR
    tempoZone: calculateZone(0.80, 0.90), // Tempo = 80-90% max HR
    intervalZone: calculateZone(0.90, 0.95), // Intervals = 90-95% max HR
    maximumZone: calculateZone(0.95, 1.00), // Maximum = 95-100% max HR
  };
}

/**
 * Calculate elevation adjustments for pace
 * Adds approximately 30 seconds per mile on hilly terrain for easy pace
 */
export function calculateElevationAdjustment(
  easyPace: string,
  elevation: "flat" | "hilly",
  paceUnit: PaceUnit
): PaceAdjustments["elevation"] {
  if (elevation === "flat") {
    return {
      type: "flat",
      message: "Your flat-ground easy pace is optimal for this terrain.",
    };
  }

  // Parse the easy pace range (e.g., "9:00-9:30 min/mi")
  const paceMatch = easyPace.match(/(\d+):(\d+)-(\d+):(\d+)/);
  if (!paceMatch) {
    return {
      type: "hilly",
      message: "On hills, aim for a slower easy pace (add ~30 seconds per mile).",
    };
  }

  const [, minMin, minSec, maxMin, maxSec] = paceMatch;
  const minPaceSeconds = parseInt(minMin) * 60 + parseInt(minSec);
  const maxPaceSeconds = parseInt(maxMin) * 60 + parseInt(maxSec);

  // Add 30 seconds per mile (or ~19 seconds per km)
  const adjustmentSeconds = paceUnit.toLowerCase() === "miles" ? 30 : 19;
  const adjustedMin = minPaceSeconds + adjustmentSeconds;
  const adjustedMax = maxPaceSeconds + adjustmentSeconds;

  const unit = paceUnit.toLowerCase();
  const adjustedPace = `${secondsToTimeString(adjustedMin)}-${secondsToTimeString(adjustedMax)} min/${unit}`;

  const flatPaceExample = `${minMin}:${minSec}`;
  const hillyPaceExample = secondsToTimeString(adjustedMin);

  return {
    type: "hilly",
    adjustedEasyPace: adjustedPace,
    message: `Your flat-ground easy pace is ${flatPaceExample}/${unit}, but on hills aim for ${hillyPaceExample}/${unit}.`,
  };
}

/**
 * Calculate weather adjustments for pace
 * Slows easy pace by 30 seconds per mile when temperature is 80°F or higher
 */
export function calculateWeatherAdjustment(
  easyPace: string,
  temperature: number,
  paceUnit: PaceUnit
): PaceAdjustments["weather"] {
  if (temperature < 80) {
    return {
      temperature,
      message: `Temperature is comfortable (${temperature}°F). No adjustment needed.`,
    };
  }

  // Parse the easy pace range
  const paceMatch = easyPace.match(/(\d+):(\d+)-(\d+):(\d+)/);
  if (!paceMatch) {
    return {
      temperature,
      message: `In ${temperature}°F+, slow your easy pace by 0:30/${paceUnit.toLowerCase()}.`,
    };
  }

  const [, minMin, minSec, maxMin, maxSec] = paceMatch;
  const minPaceSeconds = parseInt(minMin) * 60 + parseInt(minSec);
  const maxPaceSeconds = parseInt(maxMin) * 60 + parseInt(maxSec);

  // Add 30 seconds per mile (or ~19 seconds per km)
  const adjustmentSeconds = paceUnit.toLowerCase() === "miles" ? 30 : 19;
  const adjustedMin = minPaceSeconds + adjustmentSeconds;
  const adjustedMax = maxPaceSeconds + adjustmentSeconds;

  const unit = paceUnit.toLowerCase();
  const adjustedPace = `${secondsToTimeString(adjustedMin)}-${secondsToTimeString(adjustedMax)} min/${unit}`;

  return {
    temperature,
    adjustedEasyPace: adjustedPace,
    message: `In ${temperature}°F+, slow easy pace by 0:30/${unit}. Adjusted pace: ${adjustedPace}.`,
  };
}
