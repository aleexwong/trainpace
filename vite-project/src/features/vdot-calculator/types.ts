/**
 * VDOT Calculator - Core Types & Constants
 * Based on Jack Daniels' Running Formula
 */

/** Standard race distances for equivalency predictions (in meters) */
export const RACE_DISTANCES = [
  { name: "800m", meters: 800 },
  { name: "1500m", meters: 1500 },
  { name: "Mile", meters: 1609.34 },
  { name: "3K", meters: 3000 },
  { name: "5K", meters: 5000 },
  { name: "10K", meters: 10000 },
  { name: "15K", meters: 15000 },
  { name: "Half Marathon", meters: 21097.5 },
  { name: "Marathon", meters: 42195 },
] as const;

/** Input race distances for the calculator form */
export const INPUT_DISTANCES = [
  { name: "800m", meters: 800, label: "800m" },
  { name: "1500m", meters: 1500, label: "1500m" },
  { name: "Mile", meters: 1609.34, label: "Mile" },
  { name: "3K", meters: 3000, label: "3K" },
  { name: "5K", meters: 5000, label: "5K" },
  { name: "10K", meters: 10000, label: "10K" },
  { name: "15K", meters: 15000, label: "15K" },
  { name: "Half Marathon", meters: 21097.5, label: "Half Marathon" },
  { name: "Marathon", meters: 42195, label: "Marathon" },
] as const;

export type PaceDisplayUnit = "km" | "mi";

/** Training zone intensity levels per Daniels' system */
export interface TrainingZone {
  name: string;
  shortName: string;
  description: string;
  pacePerKm: string;
  pacePerMile: string;
  intensityRange: string;
  color: string;
}

/** Race equivalency prediction */
export interface RacePrediction {
  name: string;
  distance: number; // meters
  time: string; // formatted time string
  timeSeconds: number;
  pace: string; // pace per km or mile
}

/** VDOT calculation result */
export interface VdotResult {
  vdot: number;
  trainingZones: TrainingZone[];
  racePredictions: RacePrediction[];
  vo2max: number;
}

/** Form inputs for the VDOT calculator */
export interface VdotInputs {
  distanceMeters: number;
  distanceName: string;
  hours: string;
  minutes: string;
  seconds: string;
}

/** Validation errors */
export interface VdotFormErrors {
  distance?: string;
  time?: string;
}

/** Calculation history entry for localStorage persistence */
export interface CalculationHistoryEntry {
  distanceName: string;
  distanceMeters: number;
  timeFormatted: string;
  totalSeconds: number;
  vdot: number;
  date: string;
  hours: string;
  minutes: string;
  seconds: string;
}
