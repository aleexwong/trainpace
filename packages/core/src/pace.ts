/**
 * Training paces from a race result.
 * Normalized on meters in; `paceUnit` controls only the formatted output unit.
 */

import type {
  PaceResults,
  PaceResultsBase,
  HeartRateZones,
  PaceAdjustments,
  PaceOutputUnit,
} from "./types";

const METERS_PER_MILE = 1609.34;

/** Convert H/M/S strings to total seconds. */
export function timeToSeconds(h: string, m: string, s: string): number {
  return (
    parseInt(h || "0") * 3600 + parseInt(m || "0") * 60 + parseInt(s || "0")
  );
}

/** Format seconds as HH:MM:SS or MM:SS. */
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
 * Calculate training pace ranges from a race time and distance.
 * @param raceTimeSeconds finishing time in seconds
 * @param raceDistanceMeters race distance in meters
 * @param paceUnit output unit for the formatted paces ("km" | "miles")
 * @param options optional age (HR zones) and temperature in °F (heat adjustment)
 */
export function calculateTrainingPaces(
  raceTimeSeconds: number,
  raceDistanceMeters: number,
  paceUnit: PaceOutputUnit = "km",
  options?: { age?: number; temperature?: number }
): PaceResults {
  const distanceInUnit =
    paceUnit === "km"
      ? raceDistanceMeters / 1000
      : raceDistanceMeters / METERS_PER_MILE;

  // Base pace in seconds per output unit.
  const basePaceSeconds = raceTimeSeconds / distanceInUnit;

  const paces: Record<string, [number, number]> = {
    race: [basePaceSeconds, basePaceSeconds],
    easy: [basePaceSeconds * 1.2, basePaceSeconds * 1.3],
    tempo: [basePaceSeconds * 0.95, basePaceSeconds * 1.05],
    interval: [basePaceSeconds * 0.9, basePaceSeconds * 1.0],
    maximum: [basePaceSeconds * 0.85, basePaceSeconds * 0.95],
    speed: [basePaceSeconds * 0.8, basePaceSeconds * 0.9],
    xlong: [basePaceSeconds * 1.2, basePaceSeconds * 1.4],
  };

  // Yasso 800s: projected marathon time (minutes) maps to an 800m rep time (m:ss).
  const distanceKm = raceDistanceMeters / 1000;
  const raceTimeMinutes = raceTimeSeconds / 60;
  const pacePerKm = raceTimeMinutes / distanceKm;
  const projectedMarathonTime = pacePerKm * 42.195;
  paces.yasso = [projectedMarathonTime, projectedMarathonTime + 30];

  const unitLabel = paceUnit.toLowerCase();
  const results = Object.entries(paces).reduce((acc, [key, [min, max]]) => {
    const unit = key === "yasso" ? "/800m" : `/${unitLabel}`;
    acc[key as keyof PaceResultsBase] = `${secondsToTimeString(
      min
    )}-${secondsToTimeString(max)} min${unit}`;
    return acc;
  }, {} as PaceResultsBase) as PaceResults;

  if (options?.age && options.age > 0) {
    results.heartRateZones = calculateHeartRateZones(options.age);
  }

  const adjustments: PaceAdjustments = {};
  if (options?.temperature !== undefined && options.temperature > 0) {
    adjustments.weather = calculateWeatherAdjustment(
      results.easy,
      options.temperature,
      paceUnit
    );
  }
  if (Object.keys(adjustments).length > 0) {
    results.adjustments = adjustments;
  }

  return results;
}

/** Heart-rate zones from age using Max HR = 220 - age. */
export function calculateHeartRateZones(age: number): HeartRateZones {
  const maxHR = 220 - age;
  const zone = (lo: number, hi: number): string => {
    const low = Math.round(maxHR * lo);
    const high = Math.round(maxHR * hi);
    return `${Math.round(lo * 100)}-${Math.round(hi * 100)}% (${low}-${high} bpm)`;
  };
  return {
    maxHR,
    easyZone: zone(0.6, 0.7),
    tempoZone: zone(0.8, 0.9),
    intervalZone: zone(0.9, 0.95),
    maximumZone: zone(0.95, 1.0),
  };
}

/** Slow easy pace by ~30s/mi (~19s/km) when temperature is 80°F or higher. */
export function calculateWeatherAdjustment(
  easyPace: string,
  temperature: number,
  paceUnit: PaceOutputUnit
): NonNullable<PaceAdjustments["weather"]> {
  const unit = paceUnit.toLowerCase();
  if (temperature < 80) {
    return {
      temperature,
      message: `Temperature is comfortable (${temperature}°F). No adjustment needed.`,
    };
  }

  const paceMatch = easyPace.match(/(\d+):(\d+)-(\d+):(\d+)/);
  if (!paceMatch) {
    return {
      temperature,
      message: `In ${temperature}°F+, slow your easy pace by ~0:30/${unit}.`,
    };
  }

  const [, minMin, minSec, maxMin, maxSec] = paceMatch;
  const minPaceSeconds = parseInt(minMin) * 60 + parseInt(minSec);
  const maxPaceSeconds = parseInt(maxMin) * 60 + parseInt(maxSec);
  const adjustmentSeconds = paceUnit === "miles" ? 30 : 19;
  const adjustedMin = minPaceSeconds + adjustmentSeconds;
  const adjustedMax = maxPaceSeconds + adjustmentSeconds;
  const adjustedPace = `${secondsToTimeString(adjustedMin)}-${secondsToTimeString(
    adjustedMax
  )} min/${unit}`;

  return {
    temperature,
    adjustedEasyPace: adjustedPace,
    message: `In ${temperature}°F+, slow easy pace by 0:30/${unit}. Adjusted pace: ${adjustedPace}.`,
  };
}
