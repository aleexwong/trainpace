/**
 * Training Plan Generator — Core Math & Plan Construction
 *
 * Periodization follows a proven 4-phase model:
 *   1. Base Building  — aerobic foundation, easy mileage
 *   2. Development    — tempo work, moderate long runs
 *   3. Sharpening     — race-pace intervals, tune-up races
 *   4. Taper          — volume reduction, race prep
 */

import type {
  GoalRace,
  FitnessLevel,
  TrainingPlan,
  TrainingWeek,
  TrainingDay,
  TrainingPhase,
  RunDay,
  Workout,
  WorkoutType,
  PlanGeneratorInputs,
  PlanPaces,
} from "./types";

// ── Plan length by race & fitness ──────────────────────────────────────────

const PLAN_WEEKS: Record<GoalRace, Record<FitnessLevel, number>> = {
  "5K": { beginner: 8, intermediate: 10, advanced: 12 },
  "10K": { beginner: 10, intermediate: 12, advanced: 14 },
  "Half Marathon": { beginner: 12, intermediate: 14, advanced: 16 },
  Marathon: { beginner: 16, intermediate: 18, advanced: 20 },
};

// ── Phase allocation (fractions of total weeks) ───────────────────────────

function buildPhaseMap(
  totalWeeks: number,
  race: GoalRace
): { phase: TrainingPhase; weeks: number }[] {
  // Taper: 1 week (5K/10K) or 2 weeks (HM/M)
  // Race week: always 1 week
  const taperWeeks = race === "Marathon" || race === "Half Marathon" ? 2 : 1;
  const raceWeeks = 1;
  const remaining = totalWeeks - taperWeeks - raceWeeks;

  // Base: ~40%, Development: ~30%, Sharpening: ~30%
  const baseWeeks = Math.round(remaining * 0.4);
  const devWeeks = Math.round(remaining * 0.3);
  const sharpWeeks = remaining - baseWeeks - devWeeks;

  return [
    { phase: "Base Building", weeks: baseWeeks },
    { phase: "Development", weeks: devWeeks },
    { phase: "Sharpening", weeks: sharpWeeks },
    { phase: "Taper", weeks: taperWeeks },
    { phase: "Race Week", weeks: raceWeeks },
  ];
}

// ── Starting weekly volume by fitness level ───────────────────────────────

const BASE_VOLUME_KM: Record<GoalRace, Record<FitnessLevel, number>> = {
  "5K": { beginner: 20, intermediate: 32, advanced: 48 },
  "10K": { beginner: 24, intermediate: 40, advanced: 56 },
  "Half Marathon": { beginner: 32, intermediate: 48, advanced: 64 },
  Marathon: { beginner: 40, intermediate: 56, advanced: 80 },
};

const PEAK_VOLUME_KM: Record<GoalRace, Record<FitnessLevel, number>> = {
  "5K": { beginner: 36, intermediate: 52, advanced: 72 },
  "10K": { beginner: 48, intermediate: 64, advanced: 88 },
  "Half Marathon": { beginner: 56, intermediate: 76, advanced: 100 },
  Marathon: { beginner: 64, intermediate: 90, advanced: 128 },
};

// ── Workout templates per phase ───────────────────────────────────────────

interface WorkoutTemplate {
  type: WorkoutType;
  label: string;
  description: string;
  durationMin: number;
  relativeKm: number; // fraction of weekly volume
  paceZone?: string;
}

function getWorkoutsForPhase(
  phase: TrainingPhase,
  weeklyKm: number,
  availableDays: RunDay[]
): TrainingDay[] {
  const runDays = availableDays.length;

  const templates = phaseTemplates(phase, weeklyKm, runDays);

  return availableDays.map((day, i) => ({
    day,
    workout: resolveWorkout(templates[i % templates.length], weeklyKm),
  }));
}

function resolveWorkout(t: WorkoutTemplate, weeklyKm: number): Workout {
  const distanceKm = +(t.relativeKm * weeklyKm).toFixed(1);
  return {
    type: t.type,
    label: t.label,
    description: t.description,
    durationMin: Math.round(distanceKm > 0 ? (distanceKm / 10) * 60 : t.durationMin),
    distanceKm,
    paceZone: t.paceZone,
  };
}

function phaseTemplates(
  phase: TrainingPhase,
  _weeklyKm: number,
  runDays: number
): WorkoutTemplate[] {
  // Templates are ordered so index 0 = first run day, last = weekend long run
  // Distribute across however many days runner has

  const base: WorkoutTemplate[] = [
    {
      type: "easy",
      label: "Easy Run",
      description: "Conversational effort. Build aerobic base.",
      durationMin: 40,
      relativeKm: 0.18,
      paceZone: "Easy",
    },
    {
      type: "easy",
      label: "Easy Run",
      description: "Keep it comfortable. RPE 3–4 out of 10.",
      durationMin: 35,
      relativeKm: 0.14,
      paceZone: "Easy",
    },
    {
      type: "easy",
      label: "Easy Run",
      description: "Easy aerobic. Focus on form and cadence.",
      durationMin: 40,
      relativeKm: 0.16,
      paceZone: "Easy",
    },
    {
      type: "long",
      label: "Long Run",
      description: "Your weekly long run. Stay at easy effort throughout.",
      durationMin: 90,
      relativeKm: 0.35,
      paceZone: "Long",
    },
  ];

  const development: WorkoutTemplate[] = [
    {
      type: "easy",
      label: "Easy Run",
      description: "Aerobic base. Relaxed effort.",
      durationMin: 40,
      relativeKm: 0.16,
      paceZone: "Easy",
    },
    {
      type: "tempo",
      label: "Tempo Run",
      description: "20–30 min at comfortably-hard effort (threshold pace). Warm up 10 min, cool down 10 min.",
      durationMin: 55,
      relativeKm: 0.2,
      paceZone: "Tempo",
    },
    {
      type: "easy",
      label: "Easy Run",
      description: "Recovery easy run between harder sessions.",
      durationMin: 35,
      relativeKm: 0.14,
      paceZone: "Easy",
    },
    {
      type: "long",
      label: "Long Run",
      description: "Long run with last 20% at marathon pace effort.",
      durationMin: 100,
      relativeKm: 0.36,
      paceZone: "Long",
    },
  ];

  const sharpening: WorkoutTemplate[] = [
    {
      type: "easy",
      label: "Easy Run",
      description: "Easy aerobic. Keep legs fresh for the key sessions.",
      durationMin: 35,
      relativeKm: 0.14,
      paceZone: "Easy",
    },
    {
      type: "interval",
      label: "Interval Session",
      description: "6–8 × 800m at interval pace. 90 sec jog recovery. Warm up 15 min.",
      durationMin: 60,
      relativeKm: 0.18,
      paceZone: "Interval",
    },
    {
      type: "tempo",
      label: "Tempo Run",
      description: "3 × 10 min at threshold pace, 2 min jog between. Warm up and cool down.",
      durationMin: 55,
      relativeKm: 0.16,
      paceZone: "Tempo",
    },
    {
      type: "long",
      label: "Long Run",
      description: "Long run. Last 30% at goal race pace effort.",
      durationMin: 100,
      relativeKm: 0.34,
      paceZone: "Long",
    },
  ];

  const taper: WorkoutTemplate[] = [
    {
      type: "easy",
      label: "Easy Run",
      description: "Easy run. Volume drops — trust your fitness.",
      durationMin: 30,
      relativeKm: 0.2,
      paceZone: "Easy",
    },
    {
      type: "tempo",
      label: "Short Tempo",
      description: "2 × 8 min at tempo pace. Stay sharp, not tired.",
      durationMin: 40,
      relativeKm: 0.18,
      paceZone: "Tempo",
    },
    {
      type: "easy",
      label: "Easy Shake-Out",
      description: "Light easy run. Legs fresh, mind calm.",
      durationMin: 25,
      relativeKm: 0.15,
      paceZone: "Easy",
    },
    {
      type: "long",
      label: "Moderate Long Run",
      description: "Shorter long run. 60–70% of peak long run.",
      durationMin: 60,
      relativeKm: 0.24,
      paceZone: "Long",
    },
  ];

  const raceWeek: WorkoutTemplate[] = [
    {
      type: "easy",
      label: "Easy Run",
      description: "Short easy run. Stay loose.",
      durationMin: 25,
      relativeKm: 0.18,
      paceZone: "Easy",
    },
    {
      type: "easy",
      label: "Race-Pace Strides",
      description: "20 min easy + 4 × 20 sec at race pace. Activate without fatiguing.",
      durationMin: 30,
      relativeKm: 0.12,
      paceZone: "Easy",
    },
    {
      type: "rest",
      label: "Rest or Walk",
      description: "Full rest or 20 min easy walk. Stay off your feet.",
      durationMin: 0,
      relativeKm: 0,
    },
    {
      type: "race",
      label: "Race Day! 🎉",
      description: "Execute your plan. Run your own race. Trust your training.",
      durationMin: 0,
      relativeKm: 0,
    },
  ];

  const templatesByPhase: Record<TrainingPhase, WorkoutTemplate[]> = {
    "Base Building": base,
    "Development": development,
    "Sharpening": sharpening,
    "Taper": taper,
    "Race Week": raceWeek,
  };

  const pool = templatesByPhase[phase];

  // Insert rest days around the template set to fill remaining days
  // The last pool entry is always the "long run" or race; keep it at end
  const result: WorkoutTemplate[] = [];
  const longOrRace = pool[pool.length - 1];
  const weekdays = pool.slice(0, -1);

  // Fill up to runDays - 1 slots with weekday templates, cycling
  for (let i = 0; i < runDays - 1; i++) {
    result.push(weekdays[i % weekdays.length]);
  }
  result.push(longOrRace);
  return result;
}

function weeklyFocus(phase: TrainingPhase, weekNum: number): string {
  const focuses: Record<TrainingPhase, string[]> = {
    "Base Building": [
      "Build your aerobic engine. Consistency over intensity.",
      "Establish the habit. Every easy mile counts.",
      "Add a little mileage. Keep effort conversational.",
      "Aerobic base week. Protect your long run.",
    ],
    "Development": [
      "Introduce tempo work. Raise your lactate threshold.",
      "Quality over quantity. Nail the tempo session.",
      "Build endurance at pace. Your body is adapting.",
      "Peak development week. You're getting stronger.",
    ],
    "Sharpening": [
      "Race-specific work begins. Intervals teach your legs race pace.",
      "Sharpen with intervals. Your fitness is peaking.",
      "Tune-up week. Run a local race or time trial if available.",
      "Final quality sessions. You're ready.",
    ],
    "Taper": [
      "Trust the taper. Volume drops but fitness stays.",
      "Final taper. Sleep, hydrate, stay calm.",
    ],
    "Race Week": [
      "Race week. Stick to your plan. You've done the work.",
    ],
  };

  const pool = focuses[phase];
  return pool[weekNum % pool.length];
}

// ── Main plan generator ────────────────────────────────────────────────────

export function generateTrainingPlan(inputs: PlanGeneratorInputs): TrainingPlan {
  const {
    goalRace,
    raceDate,
    currentFitness,
    availableDays,
    goalTime,
    paceResults,
  } = inputs;

  const totalWeeks = PLAN_WEEKS[goalRace][currentFitness];
  const phases = buildPhaseMap(totalWeeks, goalRace);

  const baseKm = BASE_VOLUME_KM[goalRace][currentFitness];
  const peakKm = PEAK_VOLUME_KM[goalRace][currentFitness];

  const weeks: TrainingWeek[] = [];
  let globalWeek = 0;
  let _phaseWeek = 0;

  for (const { phase, weeks: phaseLen } of phases) {
    for (let pw = 0; pw < phaseLen; pw++) {
      globalWeek++;
      _phaseWeek++;

      // Volume: ramp up during base/dev/sharp, drop during taper/race
      let weeklyKm: number;
      if (phase === "Taper") {
        const taperFraction = pw === 0 ? 0.65 : 0.45;
        weeklyKm = Math.round(peakKm * taperFraction);
      } else if (phase === "Race Week") {
        weeklyKm = Math.round(peakKm * 0.3);
      } else {
        // 10% rule progression, capped at peak
        const progressFraction =
          (globalWeek - 1) / (totalWeeks - phases.filter((p) => p.phase === "Taper" || p.phase === "Race Week").reduce((s, p) => s + p.weeks, 0) - 1);
        weeklyKm = Math.round(baseKm + (peakKm - baseKm) * Math.min(progressFraction, 1));

        // Every 4th week is a recovery week (drop to 80% of previous)
        if (globalWeek % 4 === 0) {
          weeklyKm = Math.round(weeklyKm * 0.8);
        }
      }

      const days = getWorkoutsForPhase(phase, weeklyKm, availableDays);

      weeks.push({
        weekNumber: globalWeek,
        phase,
        totalKm: weeklyKm,
        days,
        weeklyFocus: weeklyFocus(phase, pw),
      });
    }
    _phaseWeek = 0;
  }

  // Derive plan paces from calculator results or estimate from fitness level
  const paces: PlanPaces = paceResults
    ? {
        easy: paceResults.easy,
        tempo: paceResults.tempo,
        interval: paceResults.interval,
        long: paceResults.easy, // long = easy pace
        recovery: slowenPace(paceResults.easy, 30),
      }
    : defaultPaces(currentFitness);

  const raceName = goalRace;
  const name = goalTime
    ? `${raceName} Plan — Goal ${goalTime}`
    : `${raceName} Plan — ${capitalize(currentFitness)}`;

  return {
    name,
    goalRace,
    raceDate,
    fitnessLevel: currentFitness,
    totalWeeks,
    weeks,
    paces,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Add N seconds per km to a pace string like "5:30" → "6:00" */
function slowenPace(paceStr: string, extraSeconds: number): string {
  const [min, sec] = paceStr.split(":").map(Number);
  if (isNaN(min)) return paceStr;
  const total = min * 60 + (sec || 0) + extraSeconds;
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function defaultPaces(level: FitnessLevel): PlanPaces {
  const defaults: Record<FitnessLevel, PlanPaces> = {
    beginner: {
      easy: "7:00",
      long: "7:30",
      tempo: "6:00",
      interval: "5:30",
      recovery: "7:30",
    },
    intermediate: {
      easy: "5:45",
      long: "6:00",
      tempo: "4:55",
      interval: "4:30",
      recovery: "6:15",
    },
    advanced: {
      easy: "4:50",
      long: "5:05",
      tempo: "4:05",
      interval: "3:45",
      recovery: "5:20",
    },
  };
  return defaults[level];
}

export function weeksUntilRace(raceDate: string): number {
  const now = new Date();
  const race = new Date(raceDate);
  const diff = race.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (7 * 24 * 60 * 60 * 1000)));
}

export function phaseColor(phase: TrainingPhase): string {
  const colors: Record<TrainingPhase, string> = {
    "Base Building": "#6ee7b7",
    "Development": "#34d399",
    "Sharpening": "#059669",
    "Taper": "#d1fae5",
    "Race Week": "#065f46",
  };
  return colors[phase];
}

export function workoutColor(type: WorkoutType): string {
  const colors: Record<WorkoutType, string> = {
    easy: "#d1fae5",
    long: "#6ee7b7",
    tempo: "#34d399",
    interval: "#059669",
    recovery: "#f1f5f9",
    rest: "#f8fafc",
    race: "#065f46",
  };
  return colors[type];
}

export function workoutTextColor(type: WorkoutType): string {
  return type === "interval" || type === "race" ? "#ffffff" : "#0f172a";
}
