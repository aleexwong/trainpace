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
}

export interface PaceResults {
  race: string;
  easy: string;
  tempo: string;
  interval: string;  // Added to match ResultsWithTooltips expectations
  maximum: string;
  speed: string;
  xlong: string;
  yasso: string;
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
