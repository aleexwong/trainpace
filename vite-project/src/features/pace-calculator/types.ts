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
