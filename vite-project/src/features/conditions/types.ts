/**
 * Race Day Conditions — Types & Constants
 */

export type TempUnit = "C" | "F";
export type AltitudeUnit = "m" | "ft";
export type PaceUnit = "km" | "mi";

export type HeatRiskBand =
  | "ideal"
  | "mild"
  | "moderate"
  | "hard"
  | "severe"
  | "dangerous";

/** Everything the engine needs, already normalised to metric. */
export interface ConditionsInput {
  distanceMeters: number;
  goalTimeSeconds: number;
  tempC: number;
  /** Relative humidity, 0–100 */
  humidity: number;
  altitudeMeters: number;
  acclimatised: boolean;
}

/** Raw form state — strings, because these are controlled text inputs. */
export interface ConditionsFormState {
  distanceMeters: number;
  distanceName: string;
  hours: string;
  minutes: string;
  seconds: string;
  temp: string;
  tempUnit: TempUnit;
  humidity: string;
  altitude: string;
  altitudeUnit: AltitudeUnit;
  acclimatised: boolean;
}

export interface ConditionsResult {
  baselineVdot: number;
  effectiveVdot: number;
  vdotDrop: number;

  goalTimeSeconds: number;
  adjustedTimeSeconds: number;
  totalCostSeconds: number;
  heatCostSeconds: number;
  altitudeCostSeconds: number;

  goalPacePerKm: number;
  goalPacePerMile: number;
  adjustedPacePerKm: number;
  adjustedPacePerMile: number;
  paceCostPerKm: number;
  paceCostPerMile: number;

  dewPointC: number;
  heatStressSum: number;
  heatSlowdownFraction: number;
  altitudeVo2Fraction: number;

  riskBand: HeatRiskBand;
  riskLabel: string;
  riskColor: string;
  advice: string;
}

export interface AdjustedZone {
  name: string;
  shortName: string;
  description: string;
  color: string;
  basePacePerKmSeconds: [number, number];
  basePacePerMileSeconds: [number, number];
  adjustedPacePerKmSeconds: [number, number];
  adjustedPacePerMileSeconds: [number, number];
  slowdownFraction: number;
}

/** Race distances offered by the conditions calculator. */
export const CONDITION_DISTANCES = [
  { name: "5K", meters: 5000 },
  { name: "10K", meters: 10000 },
  { name: "15K", meters: 15000 },
  { name: "Half Marathon", meters: 21097.5 },
  { name: "Marathon", meters: 42195 },
] as const;

/**
 * One-tap presets for the conditions most people are actually asking about.
 * `humidity` is relative humidity in %.
 */
export const CONDITION_PRESETS = [
  { label: "Crisp autumn", tempC: 8, humidity: 65 },
  { label: "Mild & dry", tempC: 15, humidity: 45 },
  { label: "Warm & humid", tempC: 24, humidity: 75 },
  { label: "Hot summer", tempC: 30, humidity: 60 },
  { label: "Tropical", tempC: 28, humidity: 90 },
] as const;
