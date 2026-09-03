/**
 * Apple Health import — shared types.
 *
 * Everything here is derived on-device from the user's `export.zip`. None of it
 * is uploaded anywhere; see `parseHealthExport.ts` for the parsing contract.
 */

/** One workout element from `export.xml`, normalised to metric + ISO dates. */
export interface HealthWorkout {
  /** Activity with the `HKWorkoutActivityType` prefix stripped, e.g. "Running". */
  activityType: string;
  /** ISO 8601 start timestamp with offset. */
  start: string;
  end: string;
  durationSeconds: number;
  distanceMeters: number | null;
  energyKcal: number | null;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  indoor: boolean;
  /** e.g. "Apple Watch", "Strava", "Nike Run Club". */
  source: string | null;
  /** Path of this workout's GPX inside the zip, when the watch recorded a route. */
  routeFile: string | null;
}

/** A scalar Health record we care about (VO2 max, resting HR, body mass). */
export interface HealthMetricSample {
  type: "vo2Max" | "restingHeartRate" | "bodyMass";
  value: number;
  unit: string;
  date: string;
}

/** Raw result of scanning an export. */
export interface HealthExportData {
  workouts: HealthWorkout[];
  metrics: HealthMetricSample[];
  /** `workout-routes/*.gpx` entries present in the archive. */
  routeFiles: string[];
  /** Uncompressed bytes of export.xml that were scanned. */
  bytesScanned: number;
}

export interface ParseProgress {
  bytesScanned: number;
  /** Uncompressed size of export.xml, when the archive told us. 0 if unknown. */
  totalBytes: number;
  workoutsFound: number;
}

/** Weekly running volume, weeks starting Monday. */
export interface WeeklyVolume {
  /** ISO date (YYYY-MM-DD) of the Monday that starts the week. */
  weekStart: string;
  runs: number;
  meters: number;
  seconds: number;
}

/** The fastest run found at or just over a standard race distance. */
export interface BestEffort {
  label: string;
  /** The nominal distance this effort is being read as, in metres. */
  nominalMeters: number;
  /** What the workout actually measured. */
  meters: number;
  seconds: number;
  /** ISO date of the run. */
  date: string;
  vdot: number;
}

/** Everything the import page shows, and everything it hands to Claude. */
export interface HealthSummary {
  generatedAt: string;
  windowDays: number;
  /** ISO date of the earliest run inside the window. */
  windowStart: string | null;
  windowEnd: string | null;
  totalRuns: number;
  totalMeters: number;
  totalSeconds: number;
  /** Active energy across the window, when Health recorded it. */
  totalEnergyKcal: number;
  /** Mean distance per week across the weeks that had at least one run. */
  weeklyMeanMeters: number;
  runsPerWeek: number;
  weekly: WeeklyVolume[];
  bests: BestEffort[];
  longestRunMeters: number;
  longestRunDate: string | null;
  /** Best VDOT across the qualifying efforts, if any run reached 5 km. */
  vdot: number | null;
  vdotSource: BestEffort | null;
  latestVo2Max: HealthMetricSample | null;
  latestRestingHeartRate: HealthMetricSample | null;
  latestBodyMass: HealthMetricSample | null;
  /** Non-running activity counts inside the window, for cross-training context. */
  otherActivities: Array<{ activityType: string; count: number }>;
  /** How many runs in the window have a GPX route in the archive. */
  runsWithRoutes: number;
  /** Runs excluded because they were logged indoors (treadmill). */
  indoorRuns: number;
}
