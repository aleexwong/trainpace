/**
 * Display helpers for the race day conditions feature.
 */

import { celsiusToFahrenheit, dewPointC } from "./conditions-math";
import type { TempUnit } from "./types";

/** Dew point rendered in whichever unit the user is currently working in. */
export function formatDewPoint(
  tempC: number,
  humidity: number,
  unit: TempUnit
): string {
  const dp = dewPointC(tempC, humidity);
  const value = unit === "C" ? dp : celsiusToFahrenheit(dp);
  return `${Math.round(value)}°${unit}`;
}
