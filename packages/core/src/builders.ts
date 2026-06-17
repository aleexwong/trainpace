/**
 * Presentation builders — turn a VDOT into display-ready predictions and zones.
 * Relocated from the TrainPace web app's useVdotCalculator hook (always pure).
 */

import {
  predictRaceTime,
  calculateTrainingZones,
  formatTime,
  formatPace,
} from "./vdot";
import type { PaceOutputUnit, RacePrediction, TrainingZone } from "./types";

/** Standard race distances for equivalency predictions (meters). */
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

/** Build race-time predictions across standard distances for a VDOT. */
export function buildRacePredictions(
  vdot: number,
  unit: PaceOutputUnit = "km"
): RacePrediction[] {
  return RACE_DISTANCES.map((race) => {
    const timeSeconds = predictRaceTime(vdot, race.meters);
    const pacePerKm = (timeSeconds / race.meters) * 1000;
    const pacePerMile = (timeSeconds / race.meters) * 1609.34;
    return {
      name: race.name,
      distance: race.meters,
      time: formatTime(timeSeconds),
      timeSeconds,
      pace:
        unit === "km"
          ? `${formatPace(pacePerKm)}/km`
          : `${formatPace(pacePerMile)}/mi`,
    };
  });
}

/** Build formatted training zones for a VDOT. */
export function buildTrainingZones(vdot: number): TrainingZone[] {
  return calculateTrainingZones(vdot).map((zone) => ({
    name: zone.name,
    shortName: zone.shortName,
    description: zone.description,
    pacePerKm: `${formatPace(zone.pacePerKmSeconds[0])}-${formatPace(
      zone.pacePerKmSeconds[1]
    )}`,
    pacePerMile: `${formatPace(zone.pacePerMileSeconds[0])}-${formatPace(
      zone.pacePerMileSeconds[1]
    )}`,
    intensityRange: `${Math.round(zone.intensityRange[0] * 100)}-${Math.round(
      zone.intensityRange[1] * 100
    )}%`,
    color: zone.color,
  }));
}

/** Coarse fitness label for a VDOT value, for human-friendly summaries. */
export function classifyVdot(vdot: number): string {
  if (vdot < 35) return "Beginner";
  if (vdot < 45) return "Novice";
  if (vdot < 55) return "Intermediate";
  if (vdot < 65) return "Advanced";
  return "Elite";
}
