import type { SplitUnit } from "./types";

export const KM_PER_MILE = 1.609344;

/** Seconds → "3:52:10" or "5:07". Sign is dropped; callers word the direction. */
export function formatClock(seconds: number): string {
  const s = Math.round(Math.abs(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

/** Seconds per km → seconds per display unit. */
export function paceInUnit(secPerKm: number, unit: SplitUnit): number {
  return unit === "km" ? secPerKm : secPerKm * KM_PER_MILE;
}

/** Distance in km → display units. */
export function distanceInUnit(km: number, unit: SplitUnit): number {
  return unit === "km" ? km : km / KM_PER_MILE;
}

/** Seconds per km → "5:07 /km" or "8:14 /mi". */
export function formatPaceIn(secPerKm: number, unit: SplitUnit): string {
  return `${formatClock(paceInUnit(secPerKm, unit))} /${unit}`;
}
