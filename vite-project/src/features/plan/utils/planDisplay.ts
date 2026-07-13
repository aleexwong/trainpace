/**
 * Training Plan Generator — Display Constants
 *
 * Single source of truth for the color system used across the plan UI
 * (hero overview, volume chart, phase legend, week list, day cards).
 * Pure presentational helpers only — no plan-generation logic lives here.
 * Kept separate from plan-math.ts, which owns the actual plan algorithm.
 */

import type { TrainingPhase, TrainingWeek, WorkoutType, PlanPaces } from "../types";

interface WorkoutStyle {
  /** Display name for the workout type */
  name: string;
  /** Saturated background — used for pills / dots / rails */
  bg: string;
  /** Text color for use on `bg` */
  text: string;
}

// ── Workout type color system — one hue per type, used everywhere a
//    workout shows up (day cards, pills, rails). ─────────────────────────
export const WORKOUT_META: Record<WorkoutType, WorkoutStyle> = {
  easy: { name: "Easy", bg: "#059669", text: "#ffffff" }, // emerald-600
  long: { name: "Long", bg: "#0284c7", text: "#ffffff" }, // sky-600
  tempo: { name: "Tempo", bg: "#d97706", text: "#ffffff" }, // amber-600
  interval: { name: "Interval", bg: "#e11d48", text: "#ffffff" }, // rose-600
  recovery: { name: "Recovery", bg: "#0d9488", text: "#ffffff" }, // teal-600
  rest: { name: "Rest", bg: "#e2e8f0", text: "#64748b" }, // slate-200 / slate-500 (muted on purpose)
  race: { name: "Race Day", bg: "#0f172a", text: "#ffffff" }, // slate-900 (ties to Race Week phase)
};

interface PhaseStyle {
  /** Short label for tight spaces (mobile phase bar, chips) */
  short: string;
  /** Saturated background for bar segments / rails */
  bg: string;
  /** Text color for use on `bg` (badges) */
  text: string;
}

// ── Phase color ramp — Base → Development → Sharpening → Taper → Race,
//    so periodization progress reads at a glance. ────────────────────────
export const PHASE_META: Record<TrainingPhase, PhaseStyle> = {
  "Base Building": { short: "Base", bg: "#6ee7b7", text: "#064e3b" }, // emerald-300
  Development: { short: "Development", bg: "#10b981", text: "#ffffff" }, // emerald-500
  Sharpening: { short: "Sharpening", bg: "#047857", text: "#ffffff" }, // emerald-700
  Taper: { short: "Taper", bg: "#94a3b8", text: "#0f172a" }, // slate-400 (muted — deliberately breaks the emerald ramp)
  "Race Week": { short: "Race Week", bg: "#0f172a", text: "#ffffff" }, // slate-900
};

// ── Pace zone ramp — mirrors the pace-ladder landing shot: a single hue,
//    lightness steps, easy end lightest, interval end darkest. The `text`
//    color is calibrated for the zone card's own left-edge rail (`bg`),
//    not for a tinted card background — see PlanOverview's pace cards. ──
export const PACE_ZONE_ORDER: {
  key: keyof PlanPaces;
  label: string;
  bg: string;
  text: string;
}[] = [
  { key: "recovery", label: "Recovery", bg: "#a7f3d0", text: "#065f46" },
  { key: "easy", label: "Easy", bg: "#6ee7b7", text: "#065f46" },
  { key: "long", label: "Long", bg: "#34d399", text: "#022c22" },
  { key: "tempo", label: "Tempo", bg: "#059669", text: "#022c22" },
  { key: "interval", label: "Interval", bg: "#065f46", text: "#022c22" },
];

export interface PhaseSegment {
  phase: TrainingPhase;
  count: number;
  startWeek: number;
  endWeek: number;
}

/** Collapse a plan's weeks into contiguous phase runs (phases are always contiguous). */
export function phaseSegments(weeks: TrainingWeek[]): PhaseSegment[] {
  const segments: PhaseSegment[] = [];
  for (const w of weeks) {
    const last = segments[segments.length - 1];
    if (last && last.phase === w.phase) {
      last.count += 1;
      last.endWeek = w.weekNumber;
    } else {
      segments.push({ phase: w.phase, count: 1, startWeek: w.weekNumber, endWeek: w.weekNumber });
    }
  }
  return segments;
}

/** Extract a "Goal 1:45:00" style time from a generated plan name, if present. */
export function parsePlanGoalTime(planName: string): string | null {
  const m = planName.match(/Goal\s+([\d:]+)/i);
  return m ? m[1] : null;
}
