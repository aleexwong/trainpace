/**
 * Turn a parsed Apple Health export into the small, readable summary that the
 * import page shows and that gets handed to Claude.
 *
 * Pure functions only — no React, no Firestore, no network. The whole point is
 * that a 400 MB export collapses into ~2 KB of text a chat can actually read.
 */

import { calculateVdot } from "@/features/vdot-calculator/vdot-math";
import type {
  BestEffort,
  HealthExportData,
  HealthMetricSample,
  HealthSummary,
  HealthWorkout,
  WeeklyVolume,
} from "./types";

export type DistanceUnit = "km" | "mi";

const METERS_PER_MILE = 1609.344;
const DAY_MS = 24 * 60 * 60 * 1000;

export const DEFAULT_WINDOW_DAYS = 90;

/** Race distances we look for, in the order they're reported. */
const STANDARD_DISTANCES: Array<{ label: string; meters: number }> = [
  { label: "5K", meters: 5000 },
  { label: "10K", meters: 10000 },
  { label: "Half marathon", meters: 21097.5 },
  { label: "Marathon", meters: 42195 },
];

/**
 * How much longer than the nominal distance a run may be and still count as an
 * effort at it. Runners overshoot (GPS drift, a cool-down jog to the car), so a
 * little slack finds real efforts; too much slack turns a long run into a "5K".
 */
const OVERSHOOT_TOLERANCE = 1.1;
const UNDERSHOOT_TOLERANCE = 0.995;

export function isRun(workout: HealthWorkout): boolean {
  return workout.activityType === "Running";
}

// ── Formatting ─────────────────────────────────────────────────────────────

export function formatDistance(meters: number, unit: DistanceUnit): string {
  const value = unit === "km" ? meters / 1000 : meters / METERS_PER_MILE;
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${unit}`;
}

export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(rest)}`
    : `${minutes}:${pad(rest)}`;
}

export function formatPace(
  meters: number,
  seconds: number,
  unit: DistanceUnit
): string {
  if (meters <= 0 || seconds <= 0) return "—";
  const perUnit = unit === "km" ? 1000 : METERS_PER_MILE;
  const paceSeconds = (seconds / meters) * perUnit;
  return `${formatDuration(paceSeconds)} /${unit}`;
}

/**
 * The calendar date the run happened on, for the runner.
 *
 * `parseAppleDate` keeps the workout's original UTC offset, so the date the
 * athlete experienced is simply the front of the timestamp. Converting through
 * the browser's timezone instead would move runs to the wrong day whenever the
 * athlete travelled, or whenever this page is opened from another timezone.
 */
export function localDate(iso: string): string {
  return iso.slice(0, 10);
}

/** ISO date of the Monday that starts the week containing `iso`. */
function weekStartOf(iso: string): string {
  // Work in UTC so the bucket boundary never depends on the viewer's timezone.
  const date = new Date(`${localDate(iso)}T00:00:00Z`);
  const dayOfWeek = (date.getUTCDay() + 6) % 7; // Monday = 0
  date.setUTCDate(date.getUTCDate() - dayOfWeek);
  return date.toISOString().slice(0, 10);
}

// ── Summary ────────────────────────────────────────────────────────────────

function latestMetric(
  metrics: HealthMetricSample[],
  type: HealthMetricSample["type"]
): HealthMetricSample | null {
  let latest: HealthMetricSample | null = null;
  for (const sample of metrics) {
    if (sample.type !== type) continue;
    if (!latest || sample.date > latest.date) latest = sample;
  }
  return latest;
}

function bestEffortsFrom(runs: HealthWorkout[]): BestEffort[] {
  const efforts: BestEffort[] = [];

  for (const { label, meters: nominal } of STANDARD_DISTANCES) {
    let best: HealthWorkout | null = null;
    let bestPace = Infinity;

    for (const run of runs) {
      // Treadmill distance is only as good as the treadmill's calibration, so
      // indoor runs count toward volume but never toward a best effort.
      if (run.indoor) continue;
      const meters = run.distanceMeters;
      if (
        meters == null ||
        run.durationSeconds <= 0 ||
        meters < nominal * UNDERSHOOT_TOLERANCE ||
        meters > nominal * OVERSHOOT_TOLERANCE
      ) {
        continue;
      }
      const pace = run.durationSeconds / meters;
      if (pace < bestPace) {
        bestPace = pace;
        best = run;
      }
    }

    if (!best || best.distanceMeters == null) continue;
    efforts.push({
      label,
      nominalMeters: nominal,
      meters: Math.round(best.distanceMeters),
      seconds: Math.round(best.durationSeconds),
      date: localDate(best.start),
      vdot:
        Math.round(
          calculateVdot(best.distanceMeters, best.durationSeconds) * 10
        ) / 10,
    });
  }

  return efforts;
}

function weeklyVolume(runs: HealthWorkout[]): WeeklyVolume[] {
  const buckets = new Map<string, WeeklyVolume>();

  for (const run of runs) {
    const weekStart = weekStartOf(run.start);
    const bucket = buckets.get(weekStart) ?? {
      weekStart,
      runs: 0,
      meters: 0,
      seconds: 0,
    };
    bucket.runs += 1;
    bucket.meters += run.distanceMeters ?? 0;
    bucket.seconds += run.durationSeconds;
    buckets.set(weekStart, bucket);
  }

  return [...buckets.values()].sort((a, b) =>
    a.weekStart < b.weekStart ? -1 : 1
  );
}

export interface SummarizeOptions {
  windowDays?: number;
  /** Injectable for tests; defaults to the current time. */
  now?: Date;
}

export function summarize(
  data: HealthExportData,
  options: SummarizeOptions = {}
): HealthSummary {
  const windowDays = options.windowDays ?? DEFAULT_WINDOW_DAYS;
  const now = options.now ?? new Date();

  const sorted = [...data.workouts].sort((a, b) => (a.start < b.start ? -1 : 1));
  const latestStart = sorted.length ? sorted[sorted.length - 1].start : null;

  // Anchor the window on today, unless the export is stale enough that today's
  // window would be empty — then anchor on the last recorded workout instead,
  // so an old export still says something useful.
  let anchor = now.getTime();
  const cutoffFromNow = anchor - windowDays * DAY_MS;
  const hasRecent = sorted.some((w) => Date.parse(w.start) >= cutoffFromNow);
  if (!hasRecent && latestStart) anchor = Date.parse(latestStart);
  const cutoff = anchor - windowDays * DAY_MS;

  const inWindow = sorted.filter((w) => {
    const time = Date.parse(w.start);
    return time >= cutoff && time <= anchor + DAY_MS;
  });

  const runs = inWindow.filter(isRun);
  const totalMeters = runs.reduce((sum, r) => sum + (r.distanceMeters ?? 0), 0);
  const totalSeconds = runs.reduce((sum, r) => sum + r.durationSeconds, 0);
  const totalEnergyKcal = runs.reduce((sum, r) => sum + (r.energyKcal ?? 0), 0);
  const weekly = weeklyVolume(runs);
  const bests = bestEffortsFrom(runs);

  let longest: HealthWorkout | null = null;
  for (const run of runs) {
    if ((run.distanceMeters ?? 0) > (longest?.distanceMeters ?? 0)) longest = run;
  }

  const otherCounts = new Map<string, number>();
  for (const workout of inWindow) {
    if (isRun(workout)) continue;
    otherCounts.set(
      workout.activityType,
      (otherCounts.get(workout.activityType) ?? 0) + 1
    );
  }

  const bestVdotEffort = bests.reduce<BestEffort | null>(
    (best, effort) => (!best || effort.vdot > best.vdot ? effort : best),
    null
  );

  // Average per week over the weeks the data actually covers, not over the
  // whole window. A 90-day window on an athlete with three weeks of runs would
  // otherwise report a weekly average four times lower than they really run.
  const spanDays =
    runs.length > 1
      ? (Date.parse(runs[runs.length - 1].start) - Date.parse(runs[0].start)) /
        DAY_MS
      : 0;
  const weeksCovered = Math.max(1, Math.min(windowDays, spanDays + 1) / 7);

  return {
    generatedAt: new Date(anchor).toISOString(),
    windowDays,
    windowStart: runs.length ? localDate(runs[0].start) : null,
    windowEnd: runs.length ? localDate(runs[runs.length - 1].start) : null,
    totalRuns: runs.length,
    totalMeters: Math.round(totalMeters),
    totalSeconds: Math.round(totalSeconds),
    totalEnergyKcal: Math.round(totalEnergyKcal),
    weeklyMeanMeters: Math.round(totalMeters / weeksCovered),
    runsPerWeek: Math.round((runs.length / weeksCovered) * 10) / 10,
    weekly,
    bests,
    longestRunMeters: Math.round(longest?.distanceMeters ?? 0),
    longestRunDate: longest ? localDate(longest.start) : null,
    vdot: bestVdotEffort?.vdot ?? null,
    vdotSource: bestVdotEffort,
    latestVo2Max: latestMetric(data.metrics, "vo2Max"),
    latestRestingHeartRate: latestMetric(data.metrics, "restingHeartRate"),
    latestBodyMass: latestMetric(data.metrics, "bodyMass"),
    otherActivities: [...otherCounts.entries()]
      .map(([activityType, count]) => ({ activityType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6),
    runsWithRoutes: runs.filter((r) => r.routeFile).length,
    indoorRuns: runs.filter((r) => r.indoor).length,
  };
}

// ── Handoff formats ────────────────────────────────────────────────────────

const MCP_URL = "https://api.trainpace.com/api/mcp";

/**
 * The text the "Copy for Claude" button puts on the clipboard: the athlete's
 * numbers, plus a pointer at TrainPace's MCP server so the assistant does the
 * pace maths with real tools instead of guessing.
 */
export function toClaudeMarkdown(
  summary: HealthSummary,
  unit: DistanceUnit = "km"
): string {
  const lines: string[] = [];
  const distance = (meters: number) => formatDistance(meters, unit);

  lines.push("# My running data (from Apple Health)");
  lines.push("");
  lines.push(
    `Exported ${summary.generatedAt.slice(0, 10)} · last ${summary.windowDays} days` +
      (summary.windowStart
        ? ` · runs from ${summary.windowStart} to ${summary.windowEnd}`
        : "")
  );
  lines.push("");

  lines.push("## Volume");
  lines.push(`- Runs: ${summary.totalRuns}`);
  lines.push(`- Total distance: ${distance(summary.totalMeters)}`);
  lines.push(`- Total time: ${formatDuration(summary.totalSeconds)}`);
  if (summary.totalEnergyKcal > 0) {
    lines.push(
      `- Active energy: ${summary.totalEnergyKcal.toLocaleString("en-US")} kcal`
    );
  }
  lines.push(
    `- Average week: ${distance(summary.weeklyMeanMeters)} over ${summary.runsPerWeek} runs`
  );
  if (summary.longestRunMeters > 0) {
    lines.push(
      `- Longest run: ${distance(summary.longestRunMeters)} on ${summary.longestRunDate}`
    );
  }
  if (summary.indoorRuns > 0) {
    lines.push(
      `- Of those, ${summary.indoorRuns} ${
        summary.indoorRuns === 1 ? "was an indoor/treadmill run" : "were indoor/treadmill runs"
      }`
    );
  }
  lines.push("");

  if (summary.bests.length > 0) {
    lines.push("## Fastest efforts in this window");
    lines.push("");
    lines.push(`| Distance | Actual | Time | Pace | Date | VDOT |`);
    lines.push(`| --- | --- | --- | --- | --- | --- |`);
    for (const effort of summary.bests) {
      lines.push(
        `| ${effort.label} | ${distance(effort.meters)} | ${formatDuration(
          effort.seconds
        )} | ${formatPace(effort.meters, effort.seconds, unit)} | ${
          effort.date
        } | ${effort.vdot} |`
      );
    }
    lines.push("");
    lines.push(
      "These are training runs, not necessarily races — treat them as a floor on fitness, not a ceiling."
    );
    lines.push("");
  }

  if (summary.weekly.length > 0) {
    lines.push("## Week by week");
    lines.push("");
    lines.push(`| Week of | Runs | Distance | Time |`);
    lines.push(`| --- | --- | --- | --- |`);
    for (const week of summary.weekly) {
      lines.push(
        `| ${week.weekStart} | ${week.runs} | ${distance(week.meters)} | ${formatDuration(
          week.seconds
        )} |`
      );
    }
    lines.push("");
  }

  const physiology: string[] = [];
  if (summary.latestVo2Max) {
    physiology.push(
      `- VO2 max (Apple estimate): ${summary.latestVo2Max.value.toFixed(1)} ${
        summary.latestVo2Max.unit
      } on ${summary.latestVo2Max.date.slice(0, 10)}`
    );
  }
  if (summary.latestRestingHeartRate) {
    physiology.push(
      `- Resting heart rate: ${Math.round(
        summary.latestRestingHeartRate.value
      )} bpm on ${summary.latestRestingHeartRate.date.slice(0, 10)}`
    );
  }
  if (summary.latestBodyMass) {
    physiology.push(
      `- Body mass: ${summary.latestBodyMass.value.toFixed(1)} ${
        summary.latestBodyMass.unit
      } on ${summary.latestBodyMass.date.slice(0, 10)}`
    );
  }
  if (physiology.length > 0) {
    lines.push("## Physiology");
    lines.push(...physiology);
    lines.push("");
  }

  if (summary.otherActivities.length > 0) {
    lines.push("## Cross-training");
    lines.push(
      summary.otherActivities
        .map((a) => `${a.activityType} ×${a.count}`)
        .join(", ")
    );
    lines.push("");
  }

  lines.push("## How to use this");
  lines.push(
    `Do the running maths with TrainPace's free MCP server (${MCP_URL}) rather than estimating: it has tools for training paces, VDOT, plan generation, fuelling, and GPX route analysis. If you can add MCP servers, add it as "trainpace". Then help me read the data above — where my training is now, and what to change.`
  );

  return lines.join("\n");
}

/** Machine-readable version of the same summary, for anything that wants JSON. */
export function toJson(summary: HealthSummary): string {
  return JSON.stringify(summary, null, 2);
}
