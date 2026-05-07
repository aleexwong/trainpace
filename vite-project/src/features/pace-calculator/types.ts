/**
 * Pace Calculator - Core Types & Constants
 */

export const PRESET_DISTANCES = [
  { name: "Marathon", distance: 42.2 },
  { name: "Half Marathon", distance: 21.1 },
  { name: "10K", distance: 10 },
  { name: "5K", distance: 5 },
  { name: "1K", distance: 1 },
  { name: "800m", distance: 0.8 },
] as const;

export type SuggestedTime = {
  label: string;
  hours: string;
  minutes: string;
  seconds: string;
};

/** Common finishing times shown as quick-select chips per distance */
export const SUGGESTED_TIMES: Record<string, SuggestedTime[]> = {
  "Marathon": [
    { label: "Sub 3h", hours: "2", minutes: "59", seconds: "00" },
    { label: "3:15", hours: "3", minutes: "15", seconds: "00" },
    { label: "3:30", hours: "3", minutes: "30", seconds: "00" },
    { label: "4:00", hours: "4", minutes: "00", seconds: "00" },
    { label: "4:30", hours: "4", minutes: "30", seconds: "00" },
    { label: "5:00", hours: "5", minutes: "00", seconds: "00" },
  ],
  "Half Marathon": [
    { label: "Sub 1:30", hours: "1", minutes: "29", seconds: "00" },
    { label: "1:45", hours: "1", minutes: "45", seconds: "00" },
    { label: "2:00", hours: "2", minutes: "00", seconds: "00" },
    { label: "2:15", hours: "2", minutes: "15", seconds: "00" },
    { label: "2:30", hours: "2", minutes: "30", seconds: "00" },
  ],
  "10K": [
    { label: "Sub 40", hours: "0", minutes: "39", seconds: "59" },
    { label: "45:00", hours: "0", minutes: "45", seconds: "00" },
    { label: "50:00", hours: "0", minutes: "50", seconds: "00" },
    { label: "55:00", hours: "0", minutes: "55", seconds: "00" },
    { label: "1:00:00", hours: "1", minutes: "00", seconds: "00" },
  ],
  "5K": [
    { label: "Sub 20", hours: "0", minutes: "19", seconds: "59" },
    { label: "22:00", hours: "0", minutes: "22", seconds: "00" },
    { label: "25:00", hours: "0", minutes: "25", seconds: "00" },
    { label: "28:00", hours: "0", minutes: "28", seconds: "00" },
    { label: "30:00", hours: "0", minutes: "30", seconds: "00" },
  ],
  "1K": [
    { label: "3:30", hours: "0", minutes: "3", seconds: "30" },
    { label: "4:00", hours: "0", minutes: "4", seconds: "00" },
    { label: "4:30", hours: "0", minutes: "4", seconds: "30" },
    { label: "5:00", hours: "0", minutes: "5", seconds: "00" },
  ],
  "800m": [
    { label: "2:30", hours: "0", minutes: "2", seconds: "30" },
    { label: "3:00", hours: "0", minutes: "3", seconds: "00" },
    { label: "3:30", hours: "0", minutes: "3", seconds: "30" },
    { label: "4:00", hours: "0", minutes: "4", seconds: "00" },
  ],
};

/** Slider min/max/step in seconds per distance preset */
export const SLIDER_RANGES: Record<string, { min: number; max: number; step: number }> = {
  "Marathon":      { min: 7200,  max: 25200, step: 30 },  // 2:00:00 – 7:00:00
  "Half Marathon": { min: 3600,  max: 12600, step: 30 },  // 1:00:00 – 3:30:00
  "10K":           { min: 1500,  max: 5400,  step: 15 },  // 25:00 – 1:30:00
  "5K":            { min: 720,   max: 2700,  step: 5  },  // 12:00 – 45:00
  "1K":            { min: 150,   max: 600,   step: 5  },  // 2:30 – 10:00
  "800m":          { min: 120,   max: 480,   step: 5  },  // 2:00 – 8:00
};

export type DistanceUnit = "km" | "miles";
export type PaceUnit = "km" | "Miles";

export interface PaceInputs {
  distance: string;
  units: DistanceUnit;
  hours: string;
  minutes: string;
  seconds: string;
  paceType: PaceUnit;
  age?: string; // For heart rate zone calculations
  elevation?: "flat" | "hilly"; // For elevation adjustments
  temperature?: string; // For weather adjustments (in Fahrenheit)
}

export interface PaceResultsBase {
  race: string;
  easy: string;
  tempo: string;
  interval: string;  // Added to match ResultsWithTooltips expectations
  maximum: string;
  speed: string;
  xlong: string;
  yasso: string;
}

export interface PaceResults extends PaceResultsBase {
  heartRateZones?: HeartRateZones; // Optional HR zones
  adjustments?: PaceAdjustments; // Optional pace adjustments
}

export interface HeartRateZones {
  maxHR: number;
  easyZone: string; // e.g., "60-70% (114-133 bpm)"
  tempoZone: string; // e.g., "80-90% (152-171 bpm)"
  intervalZone: string; // e.g., "90-95% (171-181 bpm)"
  maximumZone: string; // e.g., "95-100% (181-190 bpm)"
}

export interface PaceAdjustments {
  elevation?: {
    type: "flat" | "hilly";
    adjustedEasyPace?: string; // Adjusted easy pace for hills
    message: string;
  };
  weather?: {
    temperature: number;
    adjustedEasyPace?: string; // Adjusted easy pace for heat
    message: string;
  };
}

export interface FormErrors {
  distance?: string;
  time?: string;
}

export interface SavePacePlanParams {
  inputs: PaceInputs;
  results: PaceResults;
  planName?: string;
  notes?: string;
  raceDate?: string; // ISO date string
}
