/**
 * Split Calculator Utilities
 * Pure functions for split calculations
 */

import type {
  SplitRow,
  SplitResults,
  SplitStrategy,
  DistanceUnit,
} from "./types";

/**
 * Convert time inputs to total seconds
 */
export function timeToSeconds(h: string, m: string, s: string): number {
  return (
    parseInt(h || "0") * 3600 + parseInt(m || "0") * 60 + parseInt(s || "0")
  );
}

/**
 * Convert seconds to formatted time string (H:MM:SS or M:SS)
 */
export function secondsToTimeString(totalSeconds: number): string {
  // Round to nearest second first, then decompose
  const rounded = Math.round(totalSeconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Validate split calculator inputs
 */
export function validateSplitInputs(
  distance: string,
  hours: string,
  minutes: string,
  seconds: string
): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!distance) {
    errors.distance = "Distance is required";
  } else if (isNaN(Number(distance)) || parseFloat(distance) <= 0) {
    errors.distance = "Please enter a valid distance";
  }

  const h = parseInt(hours || "0");
  const m = parseInt(minutes || "0");
  const s = parseInt(seconds || "0");

  if (h === 0 && m === 0 && s === 0) {
    errors.time = "Please enter a goal time";
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
 * Calculate pace adjustment factor per split for a given strategy.
 *
 * - even: all splits get factor 1.0
 * - negative: first half ~3% slower, second half ~3% faster
 * - positive: first half ~3% faster, second half ~3% slower
 *
 * Factors are normalised so the total time stays the same as even pacing.
 */
function getStrategyFactors(
  totalSplits: number,
  strategy: SplitStrategy
): number[] {
  if (strategy === "even") {
    return Array(totalSplits).fill(1);
  }

  const factors: number[] = [];
  const midpoint = totalSplits / 2;
  const maxAdjust = 0.03; // 3% swing

  for (let i = 0; i < totalSplits; i++) {
    // Linear interpolation from slow→fast (negative) or fast→slow (positive)
    const t = (i - midpoint + 0.5) / midpoint; // -1 … +1
    const adjust = strategy === "negative" ? -t * maxAdjust : t * maxAdjust;
    factors.push(1 + adjust);
  }

  // Normalise so sum(factors) === totalSplits (keeps total time identical)
  const sum = factors.reduce((a, b) => a + b, 0);
  const scale = totalSplits / sum;
  return factors.map((f) => f * scale);
}

/**
 * Calculate race splits
 */
export function calculateSplits(
  totalTimeSeconds: number,
  distance: number,
  units: DistanceUnit,
  strategy: SplitStrategy
): SplitResults {
  const fullSplits = Math.floor(distance);
  const remainder = distance - fullSplits;
  const totalSplits = remainder > 0.01 ? fullSplits + 1 : fullSplits;

  const basePacePerUnit = totalTimeSeconds / distance;
  const factors = getStrategyFactors(totalSplits, strategy);

  // Distribute time proportionally (partial last split gets proportional time)
  const splitDistances: number[] = [];
  for (let i = 0; i < totalSplits; i++) {
    if (i === totalSplits - 1 && remainder > 0.01) {
      splitDistances.push(remainder);
    } else {
      splitDistances.push(1);
    }
  }

  // Calculate raw times per split (factor × basePace × distance of that split)
  const rawTimes = splitDistances.map(
    (d, i) => factors[i] * basePacePerUnit * d
  );

  // Small correction: ensure the sum equals totalTimeSeconds exactly
  const rawSum = rawTimes.reduce((a, b) => a + b, 0);
  const correction = totalTimeSeconds / rawSum;
  const splitTimes = rawTimes.map((t) => t * correction);

  const unitLabel = units === "km" ? "km" : "mi";
  let cumulative = 0;
  let cumulativeDistance = 0;

  const splits: SplitRow[] = splitTimes.map((time, i) => {
    cumulative += time;
    cumulativeDistance += splitDistances[i];
    const isPartial = i === totalSplits - 1 && remainder > 0.01;
    const pacePerFullUnit = isPartial ? time / splitDistances[i] : time;

    return {
      split: i + 1,
      distanceLabel: isPartial
        ? `${cumulativeDistance.toFixed(2)} ${unitLabel}`
        : `${cumulativeDistance} ${unitLabel}`,
      splitTime: secondsToTimeString(time),
      splitPace: `${secondsToTimeString(pacePerFullUnit)}/${unitLabel}`,
      cumulativeTime: secondsToTimeString(cumulative),
      isPartial,
    };
  });

  return {
    splits,
    totalTime: secondsToTimeString(totalTimeSeconds),
    averagePace: `${secondsToTimeString(basePacePerUnit)}/${unitLabel}`,
    distance,
    units,
    strategy,
  };
}
