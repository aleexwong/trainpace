/**
 * Pace Calculations Utilities
 *
 * Pure functions for race pace math including:
 * - Pace conversions and formatting
 * - Split generation
 * - Elevation-adjusted pacing
 * - Training zone calculations
 */

import type { PaceSplit, PaceStrategy } from "../types";
import type { Segment } from "@/features/elevation/types";

// ============================================================================
// Time & Pace Conversions
// ============================================================================

/**
 * Convert minutes to formatted time string (HH:MM:SS or MM:SS)
 */
export function formatTimeFromMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.floor(totalMinutes % 60);
  const seconds = Math.round((totalMinutes % 1) * 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Convert total minutes to seconds
 */
export function minutesToSeconds(minutes: number): number {
  return Math.round(minutes * 60);
}

/**
 * Convert seconds to minutes
 */
export function secondsToMinutes(seconds: number): number {
  return seconds / 60;
}

/**
 * Parse pace string (e.g., "5:30/km") to seconds per km
 */
export function parsePaceString(paceString: string): number {
  const match = paceString.match(/(\d+):(\d+)/);
  if (!match) return 0;

  const [, minutes, seconds] = match;
  return parseInt(minutes) * 60 + parseInt(seconds);
}

/**
 * Format pace in seconds to string (e.g., 330 -> "5:30/km")
 */
export function formatPace(
  paceSeconds: number,
  unit: "km" | "mile" = "km"
): string {
  const minutes = Math.floor(paceSeconds / 60);
  const seconds = Math.round(paceSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}/${unit}`;
}

/**
 * Calculate pace from distance and time
 */
export function calculatePace(distanceKm: number, timeMinutes: number): number {
  return (timeMinutes * 60) / distanceKm; // seconds per km
}

/**
 * Calculate time from distance and pace
 */
export function calculateTime(
  distanceKm: number,
  paceSecondsPerKm: number
): number {
  return (distanceKm * paceSecondsPerKm) / 60; // minutes
}

// ============================================================================
// Pace Strategy Calculations
// ============================================================================

/**
 * Calculate training paces from race pace
 * Based on Jack Daniels' Running Formula percentages
 */
export function calculateTrainingPaces(
  racePaceSecondsPerKm: number
): PaceStrategy {
  const racePace = formatPace(racePaceSecondsPerKm);

  // Easy: 65-78% of race pace (slower)
  const easyPace = formatPace(racePaceSecondsPerKm * 1.35);

  // Tempo: 88-92% of race pace
  const tempoPace = formatPace(racePaceSecondsPerKm * 1.08);

  return {
    racePace,
    easyPace,
    tempoPace,
  };
}

/**
 * Calculate target race pace from goal time and distance
 */
export function calculateTargetPace(
  distanceKm: number,
  targetTimeMinutes: number
): number {
  return (targetTimeMinutes * 60) / distanceKm; // seconds per km
}

// ============================================================================
// Split Generation
// ============================================================================

/**
 * Generate even splits for a race
 */
export function generateEvenSplits(
  distanceKm: number,
  targetPaceSecondsPerKm: number,
  intervalKm: number = 1
): PaceSplit[] {
  const splits: PaceSplit[] = [];
  const numSplits = Math.ceil(distanceKm / intervalKm);

  for (let i = 1; i <= numSplits; i++) {
    const km = Math.min(i * intervalKm, distanceKm);

    splits.push({
      km,
      targetPace: formatPace(targetPaceSecondsPerKm),
      terrainType: "flat",
      advice: "Maintain steady effort",
    });
  }

  return splits;
}

/**
 * Generate negative splits (faster second half)
 */
export function generateNegativeSplits(
  distanceKm: number,
  targetPaceSecondsPerKm: number,
  intervalKm: number = 1
): PaceSplit[] {
  const splits: PaceSplit[] = [];
  const numSplits = Math.ceil(distanceKm / intervalKm);
  const halfwayPoint = Math.floor(numSplits / 2);

  for (let i = 1; i <= numSplits; i++) {
    const km = Math.min(i * intervalKm, distanceKm);

    // First half: slightly slower
    // Second half: slightly faster
    const paceAdjustment = i <= halfwayPoint ? 1.02 : 0.98;
    const adjustedPace = targetPaceSecondsPerKm * paceAdjustment;

    splits.push({
      km,
      targetPace: formatPace(adjustedPace),
      terrainType: "flat",
      advice: i <= halfwayPoint ? "Start controlled" : "Pick up the pace",
    });
  }

  return splits;
}

// ============================================================================
// Elevation-Adjusted Pacing
// ============================================================================

/**
 * Adjust pace based on grade (elevation change)
 * Based on Minetti formula for energy cost
 *
 * Positive grade (uphill): slow down
 * Negative grade (downhill): speed up (but not as much)
 */
export function adjustPaceForGrade(
  basePaceSecondsPerKm: number,
  gradePercent: number
): number {
  // Minetti formula coefficients
  const i = gradePercent / 100;
  const energyCost =
    155.4 * Math.pow(i, 5) -
    30.4 * Math.pow(i, 4) -
    43.3 * Math.pow(i, 3) +
    46.3 * Math.pow(i, 2) +
    19.5 * i +
    3.6;

  // Flat ground energy cost (at 0% grade)
  const flatEnergyCost = 3.6;

  // Time multiplier (more energy = more time)
  const timeMultiplier = energyCost / flatEnergyCost;

  return basePaceSecondsPerKm * timeMultiplier;
}

/**
 * Generate elevation-adjusted splits from GPX segments
 */
export function generateElevationAdjustedSplits(
  segments: Segment[],
  basePaceSecondsPerKm: number,
  intervalKm: number = 1
): PaceSplit[] {
  const splits: PaceSplit[] = [];
  const totalDistance = segments[segments.length - 1]?.endDistance || 0;
  const numSplits = Math.ceil(totalDistance / intervalKm);

  for (let i = 1; i <= numSplits; i++) {
    const splitDistanceKm = i * intervalKm;

    // Find segment that contains this split distance
    const segment =
      segments.find(
        (seg) =>
          splitDistanceKm >= seg.startDistance &&
          splitDistanceKm <= seg.endDistance
      ) || segments[segments.length - 1];

    if (!segment) continue;

    // Adjust pace based on segment grade
    const adjustedPace = adjustPaceForGrade(
      basePaceSecondsPerKm,
      segment.grade
    );

    // Generate advice based on terrain
    const advice = generateTerrainAdvice(segment);

    splits.push({
      km: Math.min(splitDistanceKm, totalDistance),
      targetPace: formatPace(adjustedPace),
      terrainType: segment.type,
      advice,
    });
  }

  return splits;
}

/**
 * Generate pacing advice based on terrain segment
 */
function generateTerrainAdvice(segment: Segment): string {
  const { type, grade, challengeRating, racePosition } = segment;

  // Uphill advice
  if (type === "uphill") {
    if (challengeRating === "brutal" || challengeRating === "hard") {
      return racePosition === "early"
        ? "Ease into the climb, save energy"
        : "Dig deep, maintain effort";
    }
    return "Shorten stride, maintain cadence";
  }

  // Downhill advice
  if (type === "downhill") {
    if (Math.abs(grade) > 4) {
      return "Control descent, don't overstride";
    }
    return "Let gravity help, quick turnover";
  }

  // Flat advice
  return "Maintain steady effort";
}

// ============================================================================
// Effort-Based Pacing (Constant Effort vs Constant Pace)
// ============================================================================

/**
 * Calculate time to complete a segment at constant effort
 * (adjusting pace based on elevation)
 */
export function calculateSegmentTime(
  segment: Segment,
  basePaceSecondsPerKm: number
): number {
  const adjustedPace = adjustPaceForGrade(basePaceSecondsPerKm, segment.grade);
  return calculateTime(segment.length, adjustedPace);
}

/**
 * Calculate total race time with elevation adjustments
 */
export function calculateElevationAdjustedTime(
  segments: Segment[],
  basePaceSecondsPerKm: number
): number {
  return segments.reduce((total, segment) => {
    return total + calculateSegmentTime(segment, basePaceSecondsPerKm);
  }, 0);
}

/**
 * Calculate average pace needed to hit target time with elevation
 */
export function calculateRequiredBasePace(
  segments: Segment[],
  targetTimeMinutes: number,
  maxIterations: number = 10
): number {
  // Start with flat pace as initial guess
  const totalDistance = segments[segments.length - 1]?.endDistance || 0;
  let basePace = calculatePace(totalDistance, targetTimeMinutes);

  // Iterate to find the right base pace
  for (let i = 0; i < maxIterations; i++) {
    const projectedTime = calculateElevationAdjustedTime(segments, basePace);
    const error = projectedTime - targetTimeMinutes;

    // Close enough
    if (Math.abs(error) < 0.1) break;

    // Adjust base pace (if too slow, speed up base pace)
    const adjustment = error / targetTimeMinutes;
    basePace = basePace * (1 - adjustment * 0.5);
  }

  return basePace;
}

// ============================================================================
// Pace Zones (for training plans)
// ============================================================================

export interface PaceZone {
  name: string;
  minPace: number; // seconds per km
  maxPace: number;
  description: string;
}

/**
 * Calculate training pace zones from threshold pace
 */
export function calculatePaceZones(
  thresholdPaceSecondsPerKm: number
): PaceZone[] {
  return [
    {
      name: "Easy/Recovery",
      minPace: thresholdPaceSecondsPerKm * 1.25,
      maxPace: thresholdPaceSecondsPerKm * 1.4,
      description: "Conversational pace, build aerobic base",
    },
    {
      name: "Tempo/Threshold",
      minPace: thresholdPaceSecondsPerKm * 0.95,
      maxPace: thresholdPaceSecondsPerKm * 1.05,
      description: "Comfortably hard, lactate threshold",
    },
    {
      name: "Interval/VO2max",
      minPace: thresholdPaceSecondsPerKm * 0.85,
      maxPace: thresholdPaceSecondsPerKm * 0.95,
      description: "Hard effort, improve max oxygen uptake",
    },
    {
      name: "Race Pace",
      minPace: thresholdPaceSecondsPerKm,
      maxPace: thresholdPaceSecondsPerKm,
      description: "Target race pace",
    },
  ];
}

// ============================================================================
// Utility Helpers
// ============================================================================

/**
 * Calculate average pace from splits
 */
export function calculateAveragePace(splits: PaceSplit[]): number {
  const totalPace = splits.reduce((sum, split) => {
    return sum + parsePaceString(split.targetPace);
  }, 0);

  return totalPace / splits.length;
}

/**
 * Calculate time from start to specific distance
 */
export function calculateCumulativeTime(
  splits: PaceSplit[],
  targetKm: number
): number {
  let totalTime = 0;
  let lastKm = 0;

  for (const split of splits) {
    if (split.km > targetKm) {
      // Interpolate for partial split
      const partialDistance = targetKm - lastKm;
      const splitPace = parsePaceString(split.targetPace);
      totalTime += calculateTime(partialDistance, splitPace);
      break;
    }

    const segmentDistance = split.km - lastKm;
    const splitPace = parsePaceString(split.targetPace);
    totalTime += calculateTime(segmentDistance, splitPace);
    lastKm = split.km;
  }

  return totalTime;
}
/**
 * Parse time components to total minutes
 */
export function parseTimeToMinutes(
  hours: number,
  minutes: number,
  seconds: number
): number {
  return hours * 60 + minutes + seconds / 60;
}

/**
 * Calculate pace strategy from distance and target time
 */
export function calculatePaceStrategy(params: {
  distance: number;
  targetTime: number;
}): PaceStrategy {
  const { distance, targetTime } = params;

  // Calculate target race pace (seconds per km)
  const racePaceSecondsPerKm = (targetTime * 60) / distance;

  // Use existing function to calculate training paces
  return calculateTrainingPaces(racePaceSecondsPerKm);
}
