/**
 * Static Reference Tables
 *
 * TrainPace's calculators are client-side React widgets: without JavaScript
 * they render an empty shell, so a crawler (or an LLM fetching the page) sees
 * a heading and a call to action but none of the actual numbers.
 *
 * These tables are computed at build time from the same math modules the app
 * uses at runtime, and embedded into the prerendered HTML and Markdown mirrors.
 * A no-JS reader gets real, citable answers; the interactive tool still owns
 * the personalized case.
 *
 * Everything here is derived, never hand-typed — if the math changes, so do
 * the tables.
 */

import {
  calculateVdot,
  calculateTrainingZones,
  predictRaceTime,
  formatTime,
  formatPace,
} from "../../features/vdot-calculator/vdot-math";
import { calculateFuelPlan } from "../../features/fuel/fuel-math";
import type { RaceType } from "../../features/fuel/types";
import { PLAN_WEEKS, buildPhaseMap } from "../../features/plan/plan-math";
import type { GoalRace, FitnessLevel } from "../../features/plan/types";
import type { DocTable } from "./types";

// ── Distances ──────────────────────────────────────────────────────────────

const M_5K = 5000;
const M_10K = 10000;
const M_HALF = 21097.5;
const M_MARATHON = 42195;

/** Representative 5K finish times, spanning club runner to first-timer. */
const SAMPLE_5K_SECONDS = [
  15 * 60,
  17 * 60 + 30,
  20 * 60,
  22 * 60 + 30,
  25 * 60,
  27 * 60 + 30,
  30 * 60,
  32 * 60 + 30,
  35 * 60,
];

// ── Training paces ─────────────────────────────────────────────────────────

type PaceUnit = "km" | "mile";

/**
 * Training paces by recent 5K time.
 *
 * Each row is a 5K result converted to VDOT, then to the five Daniels training
 * zones. Ranges are rendered fast–slow, matching the app's zone cards.
 */
export function trainingPaceTable(unit: PaceUnit): DocTable {
  const unitLabel = unit === "km" ? "min/km" : "min/mi";

  const rows = SAMPLE_5K_SECONDS.map((seconds) => {
    const vdot = calculateVdot(M_5K, seconds);
    const zones = calculateTrainingZones(vdot);

    const paceCell = (zoneName: string) => {
      const zone = zones.find((z) => z.name === zoneName);
      if (!zone) return "—";
      const [fast, slow] =
        unit === "km" ? zone.pacePerKmSeconds : zone.pacePerMileSeconds;
      // Easy and Marathon are genuinely ranges; the sharper zones read better
      // as a single target, which is how the app presents them too.
      if (zoneName === "Easy" || zoneName === "Marathon") {
        return `${formatPace(fast)}–${formatPace(slow)}`;
      }
      return formatPace(fast);
    };

    return [
      formatTime(seconds),
      vdot.toFixed(1),
      paceCell("Easy"),
      paceCell("Marathon"),
      paceCell("Threshold"),
      paceCell("Interval"),
      paceCell("Repetition"),
    ];
  });

  return {
    type: "table",
    caption: `Training paces by recent 5K time (${unitLabel})`,
    headers: [
      "5K time",
      "VDOT",
      "Easy",
      "Marathon",
      "Threshold",
      "Interval",
      "Rep",
    ],
    rows,
  };
}

/**
 * Equivalent race times across distances for the same VDOT — the classic
 * "if you can run X, you should be able to run Y" table.
 */
export function equivalentRaceTimeTable(): DocTable {
  const rows = SAMPLE_5K_SECONDS.map((seconds) => {
    const vdot = calculateVdot(M_5K, seconds);
    return [
      vdot.toFixed(1),
      formatTime(seconds),
      formatTime(predictRaceTime(vdot, M_10K)),
      formatTime(predictRaceTime(vdot, M_HALF)),
      formatTime(predictRaceTime(vdot, M_MARATHON)),
    ];
  });

  return {
    type: "table",
    caption: "Equivalent race times at the same VDOT",
    headers: ["VDOT", "5K", "10K", "Half marathon", "Marathon"],
    rows,
  };
}

// ── Fueling ────────────────────────────────────────────────────────────────

/** Representative finish times per race distance, in minutes. */
const FUEL_SAMPLES: { raceType: RaceType; label: string; minutes: number[] }[] =
  [
    { raceType: "Half", label: "Half marathon", minutes: [80, 95, 110, 125, 140] },
    {
      raceType: "Full",
      label: "Marathon",
      minutes: [170, 195, 225, 255, 285, 315],
    },
  ];

/**
 * Carb and gel targets by race distance and finish time.
 *
 * Uses the no-weight path (race baseline carbs/hour), which is what the app
 * shows before a runner enters body weight.
 */
export function fuelReferenceTable(): DocTable {
  const rows: string[][] = [];

  for (const sample of FUEL_SAMPLES) {
    for (const minutes of sample.minutes) {
      const plan = calculateFuelPlan({
        raceType: sample.raceType,
        finishTimeMin: minutes,
      });
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;

      rows.push([
        sample.label,
        `${hours}:${mins.toString().padStart(2, "0")}`,
        `${plan.carbsPerHour} g/hr`,
        `${plan.totalCarbs} g`,
        `${plan.totalCalories} kcal`,
        `${plan.gelsNeeded}`,
      ]);
    }
  }

  return {
    type: "table",
    caption:
      "Race-day carb targets and gel counts by finish time (baseline, no body weight entered)",
    headers: [
      "Race",
      "Finish time",
      "Carbs/hour",
      "Total carbs",
      "Calories",
      "Gels",
    ],
    rows,
  };
}

/**
 * A worked fuel-stop timeline for a representative marathon, so the shape of
 * the output is visible without running the tool.
 */
export function fuelTimelineTable(): DocTable {
  const plan = calculateFuelPlan({ raceType: "Full", finishTimeMin: 240 });

  return {
    type: "table",
    caption: "Example fuel-stop timeline — 4:00 marathon",
    headers: ["Elapsed", "Approx. distance", "Carbs", "Suggestion"],
    rows: plan.fuelStops.map((stop) => [
      stop.time,
      stop.distance,
      `${stop.carbsNeeded} g`,
      stop.suggestion,
    ]),
  };
}

// ── Training plan structure ────────────────────────────────────────────────

/**
 * Plan length and phase structure by race and fitness level. Mirrors the
 * periodization constants in `features/plan/plan-math.ts`.
 */
export function planStructureTable(): DocTable {
  const rows: string[][] = [];

  for (const race of Object.keys(PLAN_WEEKS) as GoalRace[]) {
    const levels = PLAN_WEEKS[race];
    for (const level of Object.keys(levels) as FitnessLevel[]) {
      const weeks = levels[level];
      const phases = buildPhaseMap(weeks, race);
      const weeksIn = (phase: string) =>
        `${phases.find((p) => p.phase === phase)?.weeks ?? 0}`;

      rows.push([
        race,
        level.charAt(0).toUpperCase() + level.slice(1),
        `${weeks}`,
        weeksIn("Base Building"),
        weeksIn("Development"),
        weeksIn("Sharpening"),
        weeksIn("Taper"),
      ]);
    }
  }

  return {
    type: "table",
    caption: "Plan length and phase split by race and fitness level (weeks)",
    headers: [
      "Race",
      "Level",
      "Total",
      "Base",
      "Development",
      "Sharpening",
      "Taper",
    ],
    rows,
  };
}
