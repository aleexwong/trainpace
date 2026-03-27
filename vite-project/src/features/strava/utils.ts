import type { StravaActivity, StravaActivitySummary } from "./types";

/**
 * Convert Strava average_speed (m/s) to pace in seconds per kilometre.
 */
export function speedToPaceSecPerKm(speedMs: number): number {
  if (speedMs <= 0) return 0;
  return 1000 / speedMs;
}

/**
 * Format a pace in seconds per km as "mm:ss /km".
 */
export function formatPacePerKm(secPerKm: number): string {
  const mins = Math.floor(secPerKm / 60);
  const secs = Math.round(secPerKm % 60);
  return `${mins}:${String(secs).padStart(2, "0")} /km`;
}

/**
 * Convert a Strava moving time in seconds to "h:mm:ss" or "m:ss".
 */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Build a concise summary object from a raw StravaActivity.
 */
export function toActivitySummary(activity: StravaActivity): StravaActivitySummary {
  const isRun = activity.sport_type === "Run" || activity.sport_type === "VirtualRun";
  const paceSecPerKm =
    isRun && activity.average_speed > 0
      ? speedToPaceSecPerKm(activity.average_speed)
      : undefined;

  return {
    id: activity.id,
    name: activity.name,
    sport_type: activity.sport_type,
    start_date_local: activity.start_date_local,
    distance_km: Math.round((activity.distance / 1000) * 100) / 100,
    pace_per_km: paceSecPerKm !== undefined ? formatPacePerKm(paceSecPerKm) : undefined,
    moving_time_s: activity.moving_time,
    elevation_gain_m: activity.total_elevation_gain,
    is_race: activity.workout_type === 1,
    average_heartrate: activity.average_heartrate,
  };
}

/**
 * Derive a VDOT-compatible input (distance metres + time seconds) from a
 * Strava race activity so it can be passed to calculateVdot() from vdot-math.ts.
 *
 * Returns null if the activity is not a run or lacks sufficient data.
 */
export function activityToVdotInput(
  activity: StravaActivity
): { distanceMetres: number; timeSeconds: number } | null {
  const isRun = activity.sport_type === "Run" || activity.sport_type === "VirtualRun";
  if (!isRun || !activity.distance || !activity.moving_time) return null;
  return {
    distanceMetres: activity.distance,
    timeSeconds: activity.moving_time,
  };
}
