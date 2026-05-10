/**
 * generateSyntheticTelemetry.ts
 *
 * Generates a large-scale synthetic dataset (10,000+ entries) of GPS and
 * heart-rate telemetry for a marathon runner executing a negative split
 * (conservative first half → faster second half).
 *
 * Intentional anomalies are injected to exercise error-handling and
 * data-normalization pipelines:
 *   - null timestamps
 *   - null heart-rate readings
 *   - null GPS coordinates
 *   - duplicate entries
 *   - timestamp offsets (backward jumps / forward drift)
 *
 * Usage:
 *   cd vite-project
 *   npm run generate-telemetry
 *
 * Output: scripts/output/synthetic-run-telemetry.json
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TelemetryEntry {
  /** Sequential position in the base dataset (preserved through anomaly injection) */
  index: number;
  /** ISO-8601 wall-clock timestamp; null when the null_timestamp anomaly is applied */
  timestamp: string | null;
  /** WGS-84 latitude; null when the null_gps anomaly is applied */
  latitude: number | null;
  /** WGS-84 longitude; null when the null_gps anomaly is applied */
  longitude: number | null;
  /** Elevation above sea level in metres */
  altitude: number;
  /** Heart rate in beats per minute; null when the null_heart_rate anomaly is applied */
  heartRate: number | null;
  /** Instantaneous pace in seconds per kilometre */
  pace: number;
  /** Instantaneous speed in metres per second */
  speed: number;
  /** Running cadence in steps per minute */
  cadence: number;
  /** Cumulative distance from the start in metres */
  distanceMeters: number;
  /** List of anomaly labels applied to this entry */
  anomalyFlags: string[];
}

interface AnomalyCounts {
  nullTimestamp: number;
  nullHeartRate: number;
  nullGps: number;
  duplicate: number;
  timestampOffset: number;
}

interface DatasetMetadata {
  generated: string;
  description: string;
  totalEntries: number;
  raceDistanceKm: number;
  durationMinutes: number;
  avgHeartRateFirstHalf: number;
  avgHeartRateSecondHalf: number;
  avgPaceFirstHalfSecPerKm: number;
  avgPaceSecondHalfSecPerKm: number;
  anomalyCounts: AnomalyCounts;
  outputPath: string;
}

interface Dataset {
  metadata: DatasetMetadata;
  data: TelemetryEntry[];
}

// ─── Configuration ────────────────────────────────────────────────────────────

/** Total base data points before duplicate injection */
const TOTAL_DATA_POINTS = 10_500;

/** Full marathon distance in metres */
const RACE_DISTANCE_M = 42_195;

/** Race start wall clock (UTC) */
const START_TIME = new Date("2026-03-15T08:00:00Z");

// Route: Hopkinton, MA → Boston Finish (Boylston St.)
const START_LAT = 42.2285;
const START_LON = -71.5228;
const FINISH_LAT = 42.3481;
const FINISH_LON = -71.0839;

/**
 * Altitude profile as [cumulativeDistanceM, altitudeM] key-points.
 * Approximates the Boston Marathon course, including Heartbreak Hill.
 */
const ALTITUDE_PROFILE: [number, number][] = [
  [0, 133],
  [5_000, 112],
  [10_000, 93],
  [14_000, 55],
  [17_000, 60],
  [20_000, 72],
  [21_500, 84], // Heartbreak Hill peak
  [24_000, 55],
  [30_000, 28],
  [36_000, 12],
  [42_195, 8],
];

// Negative-split heart rate targets (bpm)
const FIRST_HALF_HR_MEAN = 148;
const FIRST_HALF_HR_STD = 4;
const SECOND_HALF_HR_MEAN = 162;
const SECOND_HALF_HR_STD = 5;

// Pace targets (seconds per km). Negative split = faster second half.
const FIRST_HALF_PACE_S = 370; // ~6:10 /km
const SECOND_HALF_PACE_S = 315; // ~5:15 /km
const PACE_STD_S = 8;

// Cadence (steps per minute)
const FIRST_HALF_CADENCE = 170;
const SECOND_HALF_CADENCE = 178;
const CADENCE_STD = 3;

/** GPS white-noise (degrees) — roughly 1–3 m of device jitter */
const GPS_JITTER_DEG = 0.000015;

// Anomaly injection probabilities (per-entry, independent)
const NULL_TIMESTAMP_RATE = 0.008;  // ~84 entries in base set
const NULL_HEART_RATE_RATE = 0.015; // ~158 entries
const NULL_GPS_RATE = 0.005;        // ~53 entries
const DUPLICATE_RATE = 0.012;       // ~126 entries
const TIMESTAMP_OFFSET_RATE = 0.008; // ~84 entries

// ─── Math Helpers ─────────────────────────────────────────────────────────────

/** Box–Muller transform: returns a single standard-normal sample. */
function randn(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/** Logistic sigmoid — used for the smooth first→second half transition. */
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Linear interpolation through the altitude key-point table.
 * Returns altitude in metres for a given cumulative distance.
 */
function interpolateAltitude(distanceM: number): number {
  for (let i = 1; i < ALTITUDE_PROFILE.length; i++) {
    const [d0, a0] = ALTITUDE_PROFILE[i - 1];
    const [d1, a1] = ALTITUDE_PROFILE[i];
    if (distanceM <= d1) {
      const t = (distanceM - d0) / (d1 - d0);
      return a0 + t * (a1 - a0);
    }
  }
  return ALTITUDE_PROFILE[ALTITUDE_PROFILE.length - 1][1];
}

/**
 * Returns a blend factor in [0, 1] that equals 0 at the start and 1 at the
 * finish, with an S-curve transition centred on the marathon midpoint.
 * This drives the negative-split: metrics are interpolated between their
 * first-half and second-half target values.
 */
function halfBlend(distanceM: number): number {
  const mid = RACE_DISTANCE_M / 2;
  const sharpness = 0.0003; // controls transition width (~5 km)
  return sigmoid((distanceM - mid) * sharpness);
}

// ─── Base Entry Generation ────────────────────────────────────────────────────

function generateBaseEntries(): TelemetryEntry[] {
  const entries: TelemetryEntry[] = [];
  let elapsedSeconds = 0;
  /** metres per data point (constant spacing along the course) */
  const meterStep = RACE_DISTANCE_M / (TOTAL_DATA_POINTS - 1);

  for (let i = 0; i < TOTAL_DATA_POINTS; i++) {
    const distanceM = i * meterStep;
    const blend = halfBlend(distanceM);

    // ── Pace & speed ──────────────────────────────────────────────────────
    const targetPace =
      FIRST_HALF_PACE_S + blend * (SECOND_HALF_PACE_S - FIRST_HALF_PACE_S);
    const pace = Math.round(clamp(targetPace + randn() * PACE_STD_S, 270, 450));
    const speed = Math.round((1000 / pace) * 1000) / 1000; // m/s, 3 d.p.

    // ── Elapsed time ──────────────────────────────────────────────────────
    if (i > 0) {
      // time to cover meterStep at this pace
      elapsedSeconds += (meterStep / 1000) * pace;
    }
    const timestamp = new Date(
      START_TIME.getTime() + elapsedSeconds * 1000
    ).toISOString();

    // ── GPS coordinates ───────────────────────────────────────────────────
    const t = distanceM / RACE_DISTANCE_M;
    const latitude =
      Math.round((START_LAT + t * (FINISH_LAT - START_LAT) + randn() * GPS_JITTER_DEG) * 1e6) / 1e6;
    const longitude =
      Math.round((START_LON + t * (FINISH_LON - START_LON) + randn() * GPS_JITTER_DEG) * 1e6) / 1e6;

    // ── Altitude ──────────────────────────────────────────────────────────
    const altitude =
      Math.round((interpolateAltitude(distanceM) + randn() * 0.5) * 10) / 10;

    // ── Heart rate ────────────────────────────────────────────────────────
    const hrMean =
      FIRST_HALF_HR_MEAN + blend * (SECOND_HALF_HR_MEAN - FIRST_HALF_HR_MEAN);
    const hrStd =
      FIRST_HALF_HR_STD + blend * (SECOND_HALF_HR_STD - FIRST_HALF_HR_STD);
    const heartRate = Math.round(clamp(hrMean + randn() * hrStd, 120, 195));

    // ── Cadence ───────────────────────────────────────────────────────────
    const cadenceMean =
      FIRST_HALF_CADENCE + blend * (SECOND_HALF_CADENCE - FIRST_HALF_CADENCE);
    const cadence = Math.round(
      clamp(cadenceMean + randn() * CADENCE_STD, 155, 200)
    );

    entries.push({
      index: i,
      timestamp,
      latitude,
      longitude,
      altitude,
      heartRate,
      pace,
      speed,
      cadence,
      distanceMeters: Math.round(distanceM),
      anomalyFlags: [],
    });
  }

  return entries;
}

// ─── Anomaly Injection ────────────────────────────────────────────────────────

function injectAnomalies(entries: TelemetryEntry[]): TelemetryEntry[] {
  const result = [...entries];

  /**
   * Duplicate entries are collected during the main pass, then spliced in
   * reverse-index order so that earlier insertions do not shift later indices.
   */
  const duplicatesToInsert: Array<{
    afterIndex: number;
    entry: TelemetryEntry;
  }> = [];

  for (let i = 0; i < result.length; i++) {
    const entry = result[i];

    // Null timestamp
    if (Math.random() < NULL_TIMESTAMP_RATE) {
      entry.timestamp = null;
      entry.anomalyFlags.push("null_timestamp");
    }

    // Null heart rate (independent roll)
    if (Math.random() < NULL_HEART_RATE_RATE) {
      entry.heartRate = null;
      entry.anomalyFlags.push("null_heart_rate");
    }

    // Null GPS coordinates
    if (Math.random() < NULL_GPS_RATE) {
      entry.latitude = null;
      entry.longitude = null;
      entry.anomalyFlags.push("null_gps");
    }

    // Timestamp offset — random backward jump or forward drift
    if (entry.timestamp !== null && Math.random() < TIMESTAMP_OFFSET_RATE) {
      const ts = new Date(entry.timestamp);
      // 50 % chance backward (−1 to −10 s), 50 % chance forward (+5 to +30 s)
      const offsetSec =
        Math.random() < 0.5
          ? -(1 + Math.floor(Math.random() * 10))
          : 5 + Math.floor(Math.random() * 26);
      ts.setTime(ts.getTime() + offsetSec * 1000);
      entry.timestamp = ts.toISOString();
      const sign = offsetSec > 0 ? "+" : "";
      entry.anomalyFlags.push(`timestamp_offset_${sign}${offsetSec}s`);
    }

    // Duplicate entry (shallow copy inserted immediately after current entry)
    if (Math.random() < DUPLICATE_RATE) {
      const dup: TelemetryEntry = {
        ...entry,
        anomalyFlags: [...entry.anomalyFlags, "duplicate"],
      };
      duplicatesToInsert.push({ afterIndex: i, entry: dup });
    }
  }

  // Insert duplicates in reverse order to preserve correct indices
  for (let j = duplicatesToInsert.length - 1; j >= 0; j--) {
    const { afterIndex, entry } = duplicatesToInsert[j];
    result.splice(afterIndex + 1, 0, entry);
  }

  return result;
}

// ─── Summary Computation ──────────────────────────────────────────────────────

function computeSummary(entries: TelemetryEntry[], outputPath: string): DatasetMetadata {
  const halfDist = RACE_DISTANCE_M / 2;
  const avg = (nums: number[]) =>
    nums.length > 0 ? nums.reduce((s, v) => s + v, 0) / nums.length : 0;

  const hrFirst = avg(
    entries
      .filter((e) => e.distanceMeters <= halfDist && e.heartRate !== null)
      .map((e) => e.heartRate as number)
  );
  const hrSecond = avg(
    entries
      .filter((e) => e.distanceMeters > halfDist && e.heartRate !== null)
      .map((e) => e.heartRate as number)
  );
  const paceFirst = avg(
    entries.filter((e) => e.distanceMeters <= halfDist).map((e) => e.pace)
  );
  const paceSecond = avg(
    entries.filter((e) => e.distanceMeters > halfDist).map((e) => e.pace)
  );

  // Duration from valid (non-null, non-offset-anomaly) timestamps
  const validTs = entries
    .filter(
      (e) =>
        e.timestamp !== null &&
        !e.anomalyFlags.includes("null_timestamp") &&
        !e.anomalyFlags.some((f) => f.startsWith("timestamp_offset"))
    )
    .map((e) => new Date(e.timestamp as string).getTime());

  let totalSeconds = 0;
  if (validTs.length >= 2) {
    const minTs = validTs.reduce((a, b) => Math.min(a, b));
    const maxTs = validTs.reduce((a, b) => Math.max(a, b));
    totalSeconds = (maxTs - minTs) / 1000;
  }

  const anomalyCounts: AnomalyCounts = {
    nullTimestamp: entries.filter((e) =>
      e.anomalyFlags.includes("null_timestamp")
    ).length,
    nullHeartRate: entries.filter((e) =>
      e.anomalyFlags.includes("null_heart_rate")
    ).length,
    nullGps: entries.filter((e) => e.anomalyFlags.includes("null_gps")).length,
    duplicate: entries.filter((e) => e.anomalyFlags.includes("duplicate"))
      .length,
    timestampOffset: entries.filter((e) =>
      e.anomalyFlags.some((f) => f.startsWith("timestamp_offset"))
    ).length,
  };

  return {
    generated: new Date().toISOString(),
    description:
      "Synthetic marathon telemetry — negative-split pacing with intentional data anomalies",
    totalEntries: entries.length,
    raceDistanceKm: RACE_DISTANCE_M / 1000,
    durationMinutes: Math.round(totalSeconds / 60),
    avgHeartRateFirstHalf: Math.round(hrFirst * 10) / 10,
    avgHeartRateSecondHalf: Math.round(hrSecond * 10) / 10,
    avgPaceFirstHalfSecPerKm: Math.round(paceFirst),
    avgPaceSecondHalfSecPerKm: Math.round(paceSecond),
    anomalyCounts,
    outputPath,
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputDir = path.join(__dirname, "output");
const outputPath = path.join(outputDir, "synthetic-run-telemetry.json");

console.log("🏃 Generating synthetic marathon telemetry dataset…");
console.log(`   Target base entries : ${TOTAL_DATA_POINTS.toLocaleString()}`);
console.log(`   Race distance       : ${(RACE_DISTANCE_M / 1000).toFixed(3)} km`);
console.log(
  `   Negative split      : ${FIRST_HALF_PACE_S}s/km → ${SECOND_HALF_PACE_S}s/km\n`
);

const baseEntries = generateBaseEntries();
console.log(`✓ Generated ${baseEntries.length.toLocaleString()} base entries`);

const entries = injectAnomalies(baseEntries);
console.log(`✓ Injected anomalies  → ${entries.length.toLocaleString()} total entries`);

const metadata = computeSummary(entries, outputPath);

const dataset: Dataset = { metadata, data: entries };

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(dataset, null, 2));

// ── Human-readable summary ────────────────────────────────────────────────────

const fmtPace = (s: number) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

console.log(`\n✓ Dataset written to: ${outputPath}`);
console.log("\n📊 Dataset summary:");
console.log(`   Total entries              : ${metadata.totalEntries.toLocaleString()}`);
console.log(`   Race duration              : ~${metadata.durationMinutes} min`);
console.log(`   Avg HR  — first  half      : ${metadata.avgHeartRateFirstHalf} bpm`);
console.log(`   Avg HR  — second half      : ${metadata.avgHeartRateSecondHalf} bpm`);
console.log(`   Avg pace — first  half     : ${fmtPace(metadata.avgPaceFirstHalfSecPerKm)}/km`);
console.log(`   Avg pace — second half     : ${fmtPace(metadata.avgPaceSecondHalfSecPerKm)}/km`);
console.log("\n🔴 Anomalies injected:");
console.log(`   Null timestamps            : ${metadata.anomalyCounts.nullTimestamp}`);
console.log(`   Null heart-rate readings   : ${metadata.anomalyCounts.nullHeartRate}`);
console.log(`   Null GPS coordinates       : ${metadata.anomalyCounts.nullGps}`);
console.log(`   Duplicate entries          : ${metadata.anomalyCounts.duplicate}`);
console.log(`   Timestamp offsets          : ${metadata.anomalyCounts.timestampOffset}`);
