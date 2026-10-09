/**
 * Golden vectors — the contract between this repo's math and the API repo's.
 *
 * `gpx/lib/training/{vdot,paces,fuel,plan}.ts` are hand-ports of the modules
 * here, written so "the public API and MCP server serve the same numbers the
 * web app shows" (their words). Nothing enforced that. Measured drift at the
 * time this was added: 12 differing non-comment lines in vdot, 154 in fuel,
 * 183 in plan — and `llms.txt` tells agents the numbers are identical.
 *
 * This script runs the web app's own functions over a fixed set of inputs and
 * records what they return. The API repo replays the same inputs through its
 * copies and asserts it gets the same answers
 * (`gpx/tests/goldenVectors.test.ts`).
 *
 * Contract semantics: each case's `expect` is a SUBSET requirement. Every field
 * recorded here must exist and match on the API side; extra fields there (echoed
 * inputs, for instance) are fine. Presentation-only fields are dropped at
 * generation time — the API has no business carrying a zone's hex colour.
 *
 * Inputs must stay deterministic: no dates, no randomness, no environment.
 *
 *   npm run golden-vectors        regenerate public/golden-vectors.json
 *   npm run golden-vectors:check  fail if the committed file is out of date
 *
 * After regenerating, copy the file into the API repo
 * (`gpx/tests/fixtures/golden-vectors.json`) or run its `npm run sync-vectors`.
 */

/* eslint-disable no-console -- this script's output is the point */

import fs from "node:fs";
import path from "node:path";

import { calculateFuelPlan } from "../src/features/fuel/fuel-math";
import {
  type RaceType,
  CALORIES_PER_GRAM_CARB,
  CARBS_PER_KG_MULTIPLIER,
  GELS_PER_HOUR,
  MAX_CARBS_PER_HOUR,
  MAX_GELS,
  MIN_10K_TIME_FOR_GEL,
  MIN_RACE_TIME_FOR_FUELING,
  RACE_DISTANCES,
  RACE_SETTINGS,
} from "../src/features/fuel/types";
import { generateTrainingPlan } from "../src/features/plan/plan-math";
import type { FitnessLevel, GoalRace, RunDay } from "../src/features/plan/types";
import {
  calculateHeartRateZones,
  calculateTrainingPaces,
  calculateWeatherAdjustment,
  convertPace,
  secondsToTimeString,
} from "../src/features/pace-calculator/utils";
import type { DistanceUnit, PaceUnit } from "../src/features/pace-calculator/types";
import {
  calculateTrainingZones,
  calculateVdot,
  formatPace,
  formatTime,
  oxygenCost,
  percentVO2max,
  predictRaceTime,
  trainingVelocity,
  velocityFromVO2,
  velocityToPacePerKm,
  velocityToPacePerMile,
} from "../src/features/vdot-calculator/vdot-math";

export const SCHEMA_VERSION = 1;

export interface GoldenCase {
  id: string;
  fn: string;
  args: unknown[];
  expect: unknown;
}

const cases: GoldenCase[] = [];
const add = (id: string, fn: string, args: unknown[], expect: unknown) =>
  cases.push({ id, fn, args, expect });

// ── calculateVdot ──────────────────────────────────────────────────────────
// Race performances spanning the ability range, at each supported distance.
const performances: Array<[string, number, number]> = [
  ["5k-15min", 5000, 900],
  ["5k-20min", 5000, 1200],
  ["5k-25min", 5000, 1500],
  ["5k-35min", 5000, 2100],
  ["10k-40min", 10000, 2400],
  ["10k-55min", 10000, 3300],
  ["half-1h30", 21097.5, 5400],
  ["half-2h00", 21097.5, 7200],
  ["marathon-3h00", 42195, 10800],
  ["marathon-4h30", 42195, 16200],
];
for (const [label, distanceMeters, timeSeconds] of performances) {
  add(`vdot/${label}`, "calculateVdot", [distanceMeters, timeSeconds], calculateVdot(distanceMeters, timeSeconds));
}

// ── predictRaceTime ────────────────────────────────────────────────────────
// Bisection solver: the case that matters is that both repos converge alike.
const vdots = [30, 38.5, 45, 52.7, 65];
const distances: Array<[string, number]> = [
  ["5k", 5000],
  ["10k", 10000],
  ["half", 21097.5],
  ["marathon", 42195],
];
for (const vdot of vdots) {
  for (const [label, meters] of distances) {
    add(`predict/${vdot}/${label}`, "predictRaceTime", [vdot, meters], predictRaceTime(vdot, meters));
  }
}

// ── calculateTrainingZones ─────────────────────────────────────────────────
// `color` is presentation; the API deliberately omits it, so it is not part of
// the contract. Everything else is.
for (const vdot of vdots) {
  const zones = calculateTrainingZones(vdot).map(({ color: _color, ...zone }) => zone);
  add(`zones/${vdot}`, "calculateTrainingZones", [vdot], zones);
}

// ── calculateTrainingPaces ─────────────────────────────────────────────────
const paceCases: Array<[string, number, number, DistanceUnit, PaceUnit, { age?: number; temperature?: number } | undefined]> = [
  ["5k-km", 1200, 5, "km", "km", undefined],
  ["5k-mile-from-km", 1200, 5, "km", "Miles", undefined],
  ["10k-miles", 2700, 6.2, "miles", "Miles", undefined],
  ["marathon-km", 12600, 42.2, "km", "km", undefined],
  ["with-age", 1500, 5, "km", "km", { age: 35 }],
  ["hot-day", 1500, 5, "km", "km", { temperature: 85 }],
  ["cool-day", 1500, 5, "km", "km", { temperature: 55 }],
  ["age-and-heat", 5400, 21.1, "km", "km", { age: 42, temperature: 90 }],
];
for (const [label, seconds, distance, units, paceUnit, options] of paceCases) {
  add(
    `paces/${label}`,
    "calculateTrainingPaces",
    [seconds, distance, units, paceUnit, options],
    calculateTrainingPaces(seconds, distance, units, paceUnit, options)
  );
}

// ── calculateHeartRateZones ────────────────────────────────────────────────
for (const age of [18, 30, 45, 62]) {
  add(`hr/${age}`, "calculateHeartRateZones", [age], calculateHeartRateZones(age));
}

// ── calculateFuelPlan ──────────────────────────────────────────────────────
// Covers each race type, the weight-based floor, the per-race ceiling, the
// custom override, and the 10K gel threshold on both sides.
const fuelCases: Array<[string, { raceType: RaceType; finishTimeMin: number; weightKg?: number; customCarbsPerHour?: number }]> = [
  ["10k-baseline", { raceType: "10K", finishTimeMin: 50 }],
  ["10k-under-gel-threshold", { raceType: "10K", finishTimeMin: 40 }],
  ["10k-at-gel-threshold", { raceType: "10K", finishTimeMin: 45 }],
  ["half-baseline", { raceType: "Half", finishTimeMin: 105 }],
  ["half-heavy-runner", { raceType: "Half", finishTimeMin: 120, weightKg: 95 }],
  ["half-light-runner", { raceType: "Half", finishTimeMin: 120, weightKg: 52 }],
  ["half-over-ceiling", { raceType: "Half", finishTimeMin: 120, customCarbsPerHour: 140 }],
  ["full-baseline", { raceType: "Full", finishTimeMin: 240 }],
  ["full-weight-based", { raceType: "Full", finishTimeMin: 210, weightKg: 78 }],
  ["full-at-ceiling", { raceType: "Full", finishTimeMin: 240, customCarbsPerHour: 100 }],
  ["full-over-ceiling", { raceType: "Full", finishTimeMin: 240, customCarbsPerHour: 130 }],
  ["full-slow", { raceType: "Full", finishTimeMin: 330 }],
];
for (const [label, params] of fuelCases) {
  add(`fuel/${label}`, "calculateFuelPlan", [params], calculateFuelPlan(params));
}

// ── generateTrainingPlan ───────────────────────────────────────────────────
// raceDate is a fixed literal: the generator must not depend on today.
const planDays: RunDay[] = ["Mon", "Tue", "Wed", "Thu", "Sat"];
const planCases: Array<[GoalRace, FitnessLevel]> = [
  ["5K", "beginner"],
  ["10K", "intermediate"],
  ["Half Marathon", "intermediate"],
  ["Marathon", "beginner"],
  ["Marathon", "advanced"],
];
for (const [goalRace, currentFitness] of planCases) {
  const inputs = {
    goalRace,
    raceDate: "2027-04-19",
    currentFitness,
    availableDays: planDays,
    goalTime: "03:30:00",
    paceResults: {
      easy: "5:45",
      tempo: "4:45",
      interval: "4:20",
      race: "4:58",
    },
  };
  // id / userId / createdAt / completedWorkouts are persistence concerns the
  // generator never sets; the shared plan shape is what has to agree.
  const plan = generateTrainingPlan(inputs);
  add(`plan/${goalRace}-${currentFitness}`.replace(/\s+/g, "-").toLowerCase(), "generateTrainingPlan", [inputs], {
    name: plan.name,
    goalRace: plan.goalRace,
    raceDate: plan.raceDate,
    fitnessLevel: plan.fitnessLevel,
    totalWeeks: plan.totalWeeks,
    paces: plan.paces,
    weeks: plan.weeks,
  });
}


// ── Single-purpose helpers ─────────────────────────────────────────────────
// The top-level functions above exercise these indirectly, but a port error in
// a helper can cancel out at the top level. Pin them directly — they are cheap.
for (const velocity of [150, 200, 250.5, 300, 380]) {
  add(`helper/oxygenCost/${velocity}`, "oxygenCost", [velocity], oxygenCost(velocity));
  add(`helper/velocityToPacePerKm/${velocity}`, "velocityToPacePerKm", [velocity], velocityToPacePerKm(velocity));
  add(`helper/velocityToPacePerMile/${velocity}`, "velocityToPacePerMile", [velocity], velocityToPacePerMile(velocity));
}
for (const minutes of [8, 15.5, 30, 60, 90, 180, 300]) {
  add(`helper/percentVO2max/${minutes}`, "percentVO2max", [minutes], percentVO2max(minutes));
}
for (const vo2 of [30, 42.5, 55, 70]) {
  add(`helper/velocityFromVO2/${vo2}`, "velocityFromVO2", [vo2], velocityFromVO2(vo2));
}
for (const [vdot, fraction] of [[45, 0.7], [45, 0.88], [52.7, 0.98], [65, 1.0]] as Array<[number, number]>) {
  add(`helper/trainingVelocity/${vdot}-${fraction}`, "trainingVelocity", [vdot, fraction], trainingVelocity(vdot, fraction));
}
for (const seconds of [0, 59, 60, 599.6, 3599, 3600, 12345, 45296]) {
  add(`helper/formatTime/${seconds}`, "formatTime", [seconds], formatTime(seconds));
  add(`helper/secondsToTimeString/${seconds}`, "secondsToTimeString", [seconds], secondsToTimeString(seconds));
}
for (const paceSeconds of [180, 245.4, 300, 425.9, 600]) {
  add(`helper/formatPace/${paceSeconds}`, "formatPace", [paceSeconds], formatPace(paceSeconds));
}

// convertPace: the web's PaceUnit is `"km" | "Miles"` (capital M) while the API
// types the same argument as `"km" | "miles"`. The capitalised cases are the
// ones that would silently disagree, so they are pinned explicitly.
const convertCases: Array<[number, DistanceUnit, PaceUnit]> = [
  [300, "km", "km"],
  [300, "km", "Miles"],
  [480, "miles", "Miles"],
  [480, "miles", "km"],
  [275.5, "km", "Miles"],
];
for (const [seconds, from, to] of convertCases) {
  add(`helper/convertPace/${seconds}-${from}-${to}`, "convertPace", [seconds, from, to], convertPace(seconds, from, to));
}

for (const [pace, temp, unit] of [
  ["9:00-9:30", 85, "km"],
  ["9:00-9:30", 75, "km"],
  ["7:30-8:00", 95, "Miles"],
  ["unparseable", 88, "Miles"],
] as Array<[string, number, PaceUnit]>) {
  add(
    `helper/weather/${temp}-${unit}`,
    "calculateWeatherAdjustment",
    [pace, temp, unit],
    calculateWeatherAdjustment(pace, temp, unit)
  );
}

// ── Shared constants ───────────────────────────────────────────────────────
// Where drift actually bit before: the marathon carb ceiling was raised by hand
// in both repos, in two separate commits.
add("constants/fuel", "constants", ["fuel"], {
  RACE_SETTINGS,
  RACE_DISTANCES,
  MAX_CARBS_PER_HOUR,
  CALORIES_PER_GRAM_CARB,
  CARBS_PER_KG_MULTIPLIER,
  GELS_PER_HOUR,
  MAX_GELS,
  MIN_10K_TIME_FOR_GEL,
  MIN_RACE_TIME_FOR_FUELING,
});

// ── Write ──────────────────────────────────────────────────────────────────
const payload = {
  schemaVersion: SCHEMA_VERSION,
  generator: "trainpace vite-project/scripts/generateGoldenVectors.ts",
  note: "Each case's `expect` is a subset requirement: every field here must match in the consuming implementation. Extra fields there are allowed.",
  caseCount: cases.length,
  cases,
};

const OUT_PATH = path.resolve(process.cwd(), "public", "golden-vectors.json");
const serialized = `${JSON.stringify(payload, null, 2)}\n`;

if (process.argv.includes("--check")) {
  const existing = fs.existsSync(OUT_PATH) ? fs.readFileSync(OUT_PATH, "utf8") : "";
  if (existing !== serialized) {
    console.error(
      "golden-vectors.json is out of date.\n" +
        "The math in src/ produces different numbers than the committed vectors.\n" +
        "If that change is intended: run `npm run golden-vectors`, commit the result,\n" +
        "and sync it into the API repo (gpx/tests/fixtures/golden-vectors.json) —\n" +
        "its test will then tell you whether the API still agrees."
    );
    process.exit(1);
  }
  console.log(`golden-vectors.json is current (${cases.length} cases)`);
} else {
  fs.writeFileSync(OUT_PATH, serialized, "utf8");
  console.log(`Wrote ${OUT_PATH} (${cases.length} cases)`);
}
