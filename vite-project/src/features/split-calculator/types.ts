/**
 * Split Calculator - Core Types & Constants
 */

export type DistanceUnit = "km" | "miles";

export type SplitStrategy = "even" | "negative" | "positive";

export const PRESET_RACES = [
  { name: "Marathon", distanceKm: 42.195, distanceMi: 26.2 },
  { name: "Half Marathon", distanceKm: 21.0975, distanceMi: 13.1 },
  { name: "10K", distanceKm: 10, distanceMi: 6.2 },
  { name: "5K", distanceKm: 5, distanceMi: 3.1 },
] as const;

export const STRATEGY_INFO: Record<SplitStrategy, { label: string; description: string }> = {
  even: {
    label: "Even Splits",
    description: "Same pace throughout — the gold standard for experienced runners.",
  },
  negative: {
    label: "Negative Splits",
    description: "Start conservatively, finish strong — recommended for PRs.",
  },
  positive: {
    label: "Positive Splits",
    description: "Start fast, slow down later — common for beginners, plan for it.",
  },
};

export interface SplitInputs {
  distance: string;
  units: DistanceUnit;
  hours: string;
  minutes: string;
  seconds: string;
  strategy: SplitStrategy;
}

export interface SplitRow {
  split: number;
  distanceLabel: string;
  splitTime: string;
  splitPace: string;
  cumulativeTime: string;
  isPartial: boolean;
}

export interface SplitResults {
  splits: SplitRow[];
  totalTime: string;
  averagePace: string;
  distance: number;
  units: DistanceUnit;
  strategy: SplitStrategy;
}

export interface FormErrors {
  distance?: string;
  time?: string;
}
