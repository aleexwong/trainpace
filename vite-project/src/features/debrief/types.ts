/**
 * Race Debrief — Types
 *
 * A debrief reads a finished race from a GPX file that carries timestamps
 * (a Garmin, Coros, Apple Watch or Strava export) and explains how the race
 * was paced. Everything is computed in the browser; the file is never uploaded.
 */

/** One recorded track point. `time` is epoch milliseconds. */
export interface TimedPoint {
  lat: number;
  lng: number;
  ele: number | null;
  time: number;
}

export type SplitUnit = "km" | "mi";

export interface Split {
  /** 1-based split number. */
  index: number;
  /** Distance at the start of the split, in km. */
  startKm: number;
  /** Length of the split in km (shorter than one unit for the final partial split). */
  lengthKm: number;
  /** Time taken for the split, in seconds. */
  seconds: number;
  /** Actual pace, seconds per km. */
  paceSecPerKm: number;
  /** Grade-adjusted pace (equivalent flat-ground pace), seconds per km. */
  gapSecPerKm: number;
  /** Net elevation change across the split, in metres (smoothed). */
  netElevationM: number;
  /** True for the final split when it is shorter than a full unit. */
  partial: boolean;
}

export type SplitShape = "negative" | "even" | "positive";

export type ConsistencyLabel = "Very even" | "Steady" | "Uneven" | "Very uneven";

export interface DebriefResult {
  gpsDistanceKm: number;
  /** First to last timestamp, in seconds — the race result. */
  elapsedSec: number;
  /** Time spent standing still (aid stations, toilet stops, traffic lights). */
  stoppedSec: number;
  hasElevation: boolean;
  splits: Split[];
  avgPaceSecPerKm: number;
  /** Overall grade-adjusted pace, seconds per km. */
  avgGapSecPerKm: number;
  firstHalfSec: number;
  secondHalfSec: number;
  /** (second half − first half) / first half × 100, from clock time. */
  halfDiffPct: number;
  /** The same comparison on grade-adjusted effort, so a downhill first half doesn't flatter it. */
  gapHalfDiffPct: number;
  shape: SplitShape;
  /**
   * Grade-adjusted pace over the first 10% of the race versus the whole race,
   * in percent. Negative means the start was faster than the race average.
   */
  startVsAvgPct: number;
  /** Grade-adjusted pace over the final 25% versus the first 50%, in percent. Positive = slowed. */
  finalQuarterFadePct: number;
  /** Distance (km) from which the pace dropped and never came back, or null. */
  slowdownFromKm: number | null;
  consistency: {
    /** Coefficient of variation of grade-adjusted split paces, in percent. */
    cvPct: number;
    /** 0–100. 100 means every full split was run at the same effort. */
    score: number;
    label: ConsistencyLabel;
  };
}

/** A standard race distance a GPS distance can be matched to. */
export interface OfficialDistance {
  name: string;
  meters: number;
}
