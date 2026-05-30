/**
 * Training Goals - Pure converters
 *
 * Thin wrappers that turn a canonical RaceEntry into each feature's input shape.
 * No new running math lives here — VDOT/pace math is reused from their features.
 */

import type { PaceInputs, PaceUnit } from "@/features/pace-calculator/types";
import type { VdotInputs } from "@/features/vdot-calculator/types";
import type { RaceType } from "@/features/fuel/types";
import { secondsToTimeString } from "@/features/pace-calculator/utils";
import type { RaceEntry } from "./types";

/** Decompose total seconds into HH / MM / SS field strings. */
export function secondsToFields(totalSeconds: number): {
  hours: string;
  minutes: string;
  seconds: string;
} {
  const safe = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return {
    hours: hours > 0 ? String(hours) : "",
    minutes: String(minutes),
    seconds: String(seconds),
  };
}

const KM_PER_MILE = 0.621371;

/**
 * Convert a saved race into Pace Calculator inputs. `units` is kept consistent
 * with the distance value (and with the user's pace preference): a miles user
 * gets the distance in miles + units "miles", so any consumer that derives
 * meters from `distance`/`units` reads a coherent pair.
 */
export function goalToPaceInputs(
  entry: RaceEntry,
  paceUnit: PaceUnit
): Partial<PaceInputs> {
  const { hours, minutes, seconds } = secondsToFields(entry.totalSeconds);
  const distanceKm = entry.distanceMeters / 1000;
  const useMiles = paceUnit === "Miles";
  return {
    distance: (useMiles ? distanceKm * KM_PER_MILE : distanceKm).toString(),
    units: useMiles ? "miles" : "km",
    hours,
    minutes,
    seconds,
    paceType: paceUnit,
  };
}

/** Convert a saved race into VDOT Calculator inputs. */
export function goalToVdotInputs(entry: RaceEntry): VdotInputs {
  const { hours, minutes, seconds } = secondsToFields(entry.totalSeconds);
  return {
    distanceMeters: entry.distanceMeters,
    distanceName: entry.distanceName,
    hours,
    minutes,
    seconds,
  };
}

/**
 * Map an arbitrary race distance to the Fuel Planner's fixed race types.
 * <= 12 km → "10K", <= 25 km → "Half", otherwise → "Full".
 */
export function mapDistanceToFuelType(distanceMeters: number): RaceType {
  if (distanceMeters <= 12000) return "10K";
  if (distanceMeters <= 25000) return "Half";
  return "Full";
}

/** Convert a saved race into Fuel Planner inputs (hours + minutes only). */
export function goalToFuelInputs(entry: RaceEntry): {
  raceType: RaceType;
  timeHours: string;
  timeMinutes: string;
} {
  // Fuel uses whole minutes; fold seconds into minutes.
  const totalMinutes = Math.round(entry.totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return {
    raceType: mapDistanceToFuelType(entry.distanceMeters),
    timeHours: hours > 0 ? String(hours) : "",
    timeMinutes: String(minutes),
  };
}

/** Short display label, e.g. "Marathon · 3:30:00". */
export function formatRaceLabel(entry: RaceEntry): string {
  return `${entry.distanceName} · ${secondsToTimeString(entry.totalSeconds)}`;
}
