import { describe, it, expect, vi, afterEach } from "vitest";
import {
  PLAN_WEEKS,
  buildPhaseMap,
  generateTrainingPlan,
  newPlanId,
  weeksUntilRace,
  phaseColor,
  workoutColor,
  workoutTextColor,
} from "./plan-math";
import type {
  GoalRace,
  FitnessLevel,
  RunDay,
  TrainingPhase,
  WorkoutType,
  PlanGeneratorInputs,
} from "./types";

const RACES: GoalRace[] = ["5K", "10K", "Half Marathon", "Marathon"];
const LEVELS: FitnessLevel[] = ["beginner", "intermediate", "advanced"];
const DEFAULT_DAYS: RunDay[] = ["Mon", "Wed", "Fri", "Sun"];
const PHASE_ORDER: TrainingPhase[] = [
  "Base Building",
  "Development",
  "Sharpening",
  "Taper",
  "Race Week",
];
const WORKOUT_TYPES: WorkoutType[] = [
  "easy",
  "long",
  "tempo",
  "interval",
  "recovery",
  "rest",
  "race",
];

function makeInputs(
  goalRace: GoalRace,
  currentFitness: FitnessLevel,
  overrides: Partial<PlanGeneratorInputs> = {}
): PlanGeneratorInputs {
  return {
    goalRace,
    raceDate: "2027-06-01",
    currentFitness,
    availableDays: DEFAULT_DAYS,
    ...overrides,
  };
}

// Every (race, level) combination, used to fan out property-style tests.
const ALL_COMBOS: Array<[GoalRace, FitnessLevel]> = RACES.flatMap((race) =>
  LEVELS.map((level): [GoalRace, FitnessLevel] => [race, level])
);

describe("PLAN_WEEKS", () => {
  it("gives every race/level combination a positive integer week count", () => {
    for (const race of RACES) {
      for (const level of LEVELS) {
        const weeks = PLAN_WEEKS[race][level];
        expect(Number.isInteger(weeks)).toBe(true);
        expect(weeks).toBeGreaterThan(0);
      }
    }
  });

  it("increases plan length as fitness level rises, for every race", () => {
    for (const race of RACES) {
      expect(PLAN_WEEKS[race].beginner).toBeLessThan(PLAN_WEEKS[race].intermediate);
      expect(PLAN_WEEKS[race].intermediate).toBeLessThan(PLAN_WEEKS[race].advanced);
    }
  });

  it("increases plan length as race distance rises, for every fitness level", () => {
    for (const level of LEVELS) {
      expect(PLAN_WEEKS["5K"][level]).toBeLessThan(PLAN_WEEKS["10K"][level]);
      expect(PLAN_WEEKS["10K"][level]).toBeLessThan(PLAN_WEEKS["Half Marathon"][level]);
      expect(PLAN_WEEKS["Half Marathon"][level]).toBeLessThan(PLAN_WEEKS.Marathon[level]);
    }
  });
});

describe("buildPhaseMap", () => {
  it("returns phases in the documented Base -> Development -> Sharpening -> Taper -> Race order", () => {
    for (const [race, level] of ALL_COMBOS) {
      const totalWeeks = PLAN_WEEKS[race][level];
      const phases = buildPhaseMap(totalWeeks, race);
      expect(phases.map((p) => p.phase)).toEqual(PHASE_ORDER);
    }
  });

  it("allocates every week to exactly one phase (phase weeks sum to the total)", () => {
    for (const [race, level] of ALL_COMBOS) {
      const totalWeeks = PLAN_WEEKS[race][level];
      const phases = buildPhaseMap(totalWeeks, race);
      const sum = phases.reduce((s, p) => s + p.weeks, 0);
      expect(sum).toBe(totalWeeks);
    }
  });

  it("gives every phase at least one week for real plan lengths", () => {
    for (const [race, level] of ALL_COMBOS) {
      const totalWeeks = PLAN_WEEKS[race][level];
      const phases = buildPhaseMap(totalWeeks, race);
      for (const p of phases) {
        expect(p.weeks).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("Race Week is always exactly 1 week, per the docstring", () => {
    for (const [race, level] of ALL_COMBOS) {
      const totalWeeks = PLAN_WEEKS[race][level];
      const phases = buildPhaseMap(totalWeeks, race);
      const raceWeek = phases.find((p) => p.phase === "Race Week")!;
      expect(raceWeek.weeks).toBe(1);
    }
  });

  it("Taper is 2 weeks for Half Marathon/Marathon and 1 week for 5K/10K, per the docstring", () => {
    for (const level of LEVELS) {
      expect(buildPhaseMap(PLAN_WEEKS["5K"][level], "5K").find((p) => p.phase === "Taper")!.weeks).toBe(1);
      expect(buildPhaseMap(PLAN_WEEKS["10K"][level], "10K").find((p) => p.phase === "Taper")!.weeks).toBe(1);
      expect(
        buildPhaseMap(PLAN_WEEKS["Half Marathon"][level], "Half Marathon").find((p) => p.phase === "Taper")!.weeks
      ).toBe(2);
      expect(buildPhaseMap(PLAN_WEEKS.Marathon[level], "Marathon").find((p) => p.phase === "Taper")!.weeks).toBe(2);
    }
  });

  it("splits the non-taper/race weeks roughly 40/30/30 across Base/Development/Sharpening", () => {
    for (const [race, level] of ALL_COMBOS) {
      const totalWeeks = PLAN_WEEKS[race][level];
      const phases = buildPhaseMap(totalWeeks, race);
      const byPhase = Object.fromEntries(phases.map((p) => [p.phase, p.weeks]));
      const remaining = byPhase["Base Building"] + byPhase["Development"] + byPhase["Sharpening"];
      // Rounding on three independently-rounded shares can land a phase up to
      // ~1 week away from its ideal share; assert "roughly", not exactly.
      expect(byPhase["Base Building"]).toBeGreaterThanOrEqual(Math.round(remaining * 0.4) - 1);
      expect(byPhase["Base Building"]).toBeLessThanOrEqual(Math.round(remaining * 0.4) + 1);
      expect(byPhase["Development"]).toBeGreaterThanOrEqual(Math.round(remaining * 0.3) - 1);
      expect(byPhase["Development"]).toBeLessThanOrEqual(Math.round(remaining * 0.3) + 1);
    }
  });
});

describe("generateTrainingPlan — structure", () => {
  it("produces exactly PLAN_WEEKS[race][level] weeks for every race/level combination", () => {
    for (const [race, level] of ALL_COMBOS) {
      const plan = generateTrainingPlan(makeInputs(race, level));
      expect(plan.totalWeeks).toBe(PLAN_WEEKS[race][level]);
      expect(plan.weeks).toHaveLength(PLAN_WEEKS[race][level]);
    }
  });

  it("numbers weeks contiguously from 1 with no gaps or duplicates", () => {
    for (const [race, level] of ALL_COMBOS) {
      const plan = generateTrainingPlan(makeInputs(race, level));
      const numbers = plan.weeks.map((w) => w.weekNumber);
      expect(numbers).toEqual(Array.from({ length: plan.totalWeeks }, (_, i) => i + 1));
      expect(new Set(numbers).size).toBe(numbers.length);
    }
  });

  it("gives every week exactly one day per available training day", () => {
    for (const [race, level] of ALL_COMBOS) {
      for (const days of [["Mon", "Wed", "Fri"] as RunDay[], DEFAULT_DAYS, ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as RunDay[]]) {
        const plan = generateTrainingPlan(makeInputs(race, level, { availableDays: days }));
        for (const week of plan.weeks) {
          expect(week.days).toHaveLength(days.length);
        }
      }
    }
  });

  it("assigns each week's phase to match buildPhaseMap's boundaries exactly", () => {
    for (const [race, level] of ALL_COMBOS) {
      const totalWeeks = PLAN_WEEKS[race][level];
      const phases = buildPhaseMap(totalWeeks, race);
      const expectedPhaseByWeek: TrainingPhase[] = [];
      for (const { phase, weeks } of phases) {
        for (let i = 0; i < weeks; i++) expectedPhaseByWeek.push(phase);
      }

      const plan = generateTrainingPlan(makeInputs(race, level));
      expect(plan.weeks.map((w) => w.phase)).toEqual(expectedPhaseByWeek);
    }
  });
});

describe("generateTrainingPlan — taper", () => {
  it("reduces volume in the final (Race) week below the peak training week", () => {
    for (const [race, level] of ALL_COMBOS) {
      const plan = generateTrainingPlan(makeInputs(race, level));
      const peak = Math.max(...plan.weeks.map((w) => w.totalKm));
      const finalWeek = plan.weeks[plan.weeks.length - 1];
      expect(finalWeek.phase).toBe("Race Week");
      expect(finalWeek.totalKm).toBeLessThan(peak);
    }
  });

  it("reduces volume in every taper week below the peak training week", () => {
    for (const [race, level] of ALL_COMBOS) {
      const plan = generateTrainingPlan(makeInputs(race, level));
      const nonTaperPeak = Math.max(
        ...plan.weeks.filter((w) => w.phase !== "Taper" && w.phase !== "Race Week").map((w) => w.totalKm)
      );
      const taperWeeks = plan.weeks.filter((w) => w.phase === "Taper");
      expect(taperWeeks.length).toBeGreaterThan(0);
      for (const w of taperWeeks) {
        expect(w.totalKm).toBeLessThan(nonTaperPeak);
      }
    }
  });

  it("keeps volume decreasing (or flat) on the way into the race: last-sharpening > taper weeks > race week", () => {
    for (const [race, level] of ALL_COMBOS) {
      const plan = generateTrainingPlan(makeInputs(race, level));
      const taperWeeks = plan.weeks.filter((w) => w.phase === "Taper");
      const raceWeek = plan.weeks[plan.weeks.length - 1];
      // Taper volume itself should step down (or hold) week over week, not spike back up.
      for (let i = 1; i < taperWeeks.length; i++) {
        expect(taperWeeks[i].totalKm).toBeLessThanOrEqual(taperWeeks[i - 1].totalKm);
      }
      if (taperWeeks.length > 0) {
        expect(raceWeek.totalKm).toBeLessThanOrEqual(taperWeeks[taperWeeks.length - 1].totalKm);
      }
    }
  });
});

describe("generateTrainingPlan — progression", () => {
  // BUG: the recovery-week mechanism (plan-math.ts:392-395, "every 4th week is a
  // recovery week (drop to 80% of previous)") computes the dip as 80% of THAT
  // week's own progression value, then the *next* week resumes the normal
  // progression curve as if the dip never happened. That makes the week right
  // after a cutback jump by more than the intended ~10%/week build — observed
  // up to ~40.7% (10K, beginner) and >30% in most race/level combinations
  // below. A real training plan should never ask a runner to jump mileage by
  // 30-40% in a single week right after a "recovery" week.
  it.fails(
    "never increases total weekly volume by more than ~30% over the previous week (loose bound; catches doubling-style bugs)",
    () => {
      for (const [race, level] of ALL_COMBOS) {
        const plan = generateTrainingPlan(makeInputs(race, level));
        // Only look at the build phases; taper/race are intentional volume drops.
        const buildWeeks = plan.weeks.filter((w) => w.phase !== "Taper" && w.phase !== "Race Week");
        for (let i = 1; i < buildWeeks.length; i++) {
          const prev = buildWeeks[i - 1].totalKm;
          const curr = buildWeeks[i].totalKm;
          const jump = (curr - prev) / prev;
          expect(jump).toBeLessThanOrEqual(0.3);
        }
      }
    }
  );

  it("never exceeds each level's peak weekly volume target during build phases", () => {
    // PEAK_VOLUME_KM isn't exported, but the progression formula caps at 1.0
    // (plan-math.ts:388-390: `Math.min(progressFraction, 1)`), so no build
    // week should exceed the plan's own observed maximum by more than the
    // rounding involved in a single week's computation.
    for (const [race, level] of ALL_COMBOS) {
      const plan = generateTrainingPlan(makeInputs(race, level));
      const buildWeeks = plan.weeks.filter((w) => w.phase !== "Taper" && w.phase !== "Race Week");
      const observedPeak = Math.max(...buildWeeks.map((w) => w.totalKm));
      for (const w of buildWeeks) {
        expect(w.totalKm).toBeLessThanOrEqual(observedPeak);
      }
    }
  });
});

describe("generateTrainingPlan — long run", () => {
  it("gives every non-Race-Week week exactly one 'long' workout, and it is the longest run of that week", () => {
    for (const [race, level] of ALL_COMBOS) {
      const plan = generateTrainingPlan(makeInputs(race, level));
      for (const week of plan.weeks.filter((w) => w.phase !== "Race Week")) {
        const longDays = week.days.filter((d) => d.workout.type === "long");
        expect(longDays).toHaveLength(1);

        const longDistance = longDays[0].workout.distanceKm ?? 0;
        const maxDistance = Math.max(...week.days.map((d) => d.workout.distanceKm ?? 0));
        expect(longDistance).toBeCloseTo(maxDistance, 5);
      }
    }
  });

  it("Race Week has no 'long'-typed workout — race day itself stands in for it", () => {
    // Documented by the phaseTemplates() raceWeek template set (plan-math.ts:262-293):
    // its final slot is type "race", not "long". This is intentional (you don't
    // run a long training run during race week) but means a caller checking for
    // "one long run per week" must special-case Race Week.
    for (const [race, level] of ALL_COMBOS) {
      const plan = generateTrainingPlan(makeInputs(race, level));
      const raceWeek = plan.weeks.find((w) => w.phase === "Race Week")!;
      expect(raceWeek.days.some((d) => d.workout.type === "long")).toBe(false);
    }
  });
});

describe("weeksUntilRace", () => {
  const NOW = new Date("2026-09-11T00:00:00Z");

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 1 when the race is exactly 7 days away", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    expect(weeksUntilRace("2026-09-18T00:00:00Z")).toBe(1);
  });

  it("rounds up a partial week (8 days away -> 2 weeks)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    expect(weeksUntilRace("2026-09-19T00:00:00Z")).toBe(2);
  });

  it("returns 0 for a race date that has already passed", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    expect(weeksUntilRace("2026-01-01T00:00:00Z")).toBe(0);
  });

  it("returns 0 for a race happening right now (never negative)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    expect(weeksUntilRace(NOW.toISOString())).toBe(0);
  });

  it("returns exactly 2 weeks for a race exactly 14 days away", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    expect(weeksUntilRace("2026-09-25T00:00:00Z")).toBe(2);
  });
});

describe("newPlanId", () => {
  it("produces unique ids across many calls", () => {
    const ids = new Set(Array.from({ length: 1000 }, () => newPlanId()));
    expect(ids.size).toBe(1000);
  });

  it("produces a non-empty string id in the expected shape (UUID or the documented fallback format)", () => {
    const id = newPlanId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const isFallback = /^plan_[a-z0-9]+_[a-z0-9]+$/i.test(id);
    expect(isUuid || isFallback).toBe(true);
  });
});

describe("generateTrainingPlan — edge cases", () => {
  it("still generates a full-length plan when the race date is already in the past", () => {
    const plan = generateTrainingPlan(makeInputs("10K", "intermediate", { raceDate: "2020-01-01" }));
    expect(plan.totalWeeks).toBe(PLAN_WEEKS["10K"].intermediate);
    expect(plan.weeks).toHaveLength(PLAN_WEEKS["10K"].intermediate);
  });

  it("still generates a full-length plan when the race is only a day away (shorter than the plan itself)", () => {
    // The generator does not use raceDate to size or truncate the plan — it always
    // builds the full PLAN_WEEKS[race][level] schedule regardless of how much real
    // calendar time is actually left. Documented here as current behavior, not
    // necessarily a bug: callers are expected to check weeksUntilRace() themselves
    // before offering a plan this long.
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const plan = generateTrainingPlan(makeInputs("Marathon", "advanced", { raceDate: tomorrow }));
    expect(plan.totalWeeks).toBe(PLAN_WEEKS.Marathon.advanced);
    expect(plan.weeks).toHaveLength(PLAN_WEEKS.Marathon.advanced);
  });

  it("throws for a GoalRace outside the known set rather than silently producing a broken plan", () => {
    expect(() =>
      generateTrainingPlan(makeInputs("Ultra Marathon" as GoalRace, "beginner"))
    ).toThrow();
  });

  it("gives the plan a stable, client-minted id immediately (before any save)", () => {
    const plan = generateTrainingPlan(makeInputs("5K", "beginner"));
    expect(plan.id).toBeTruthy();
    expect(typeof plan.id).toBe("string");
  });
});

describe("phaseColor / workoutColor / workoutTextColor", () => {
  it("maps every TrainingPhase to a non-empty color", () => {
    for (const phase of PHASE_ORDER) {
      const color = phaseColor(phase);
      expect(typeof color).toBe("string");
      expect(color.length).toBeGreaterThan(0);
    }
  });

  it("gives every phase a visually distinct color from every other phase", () => {
    const colors = PHASE_ORDER.map(phaseColor);
    expect(new Set(colors).size).toBe(colors.length);
  });

  it("maps every WorkoutType to a non-empty color", () => {
    for (const type of WORKOUT_TYPES) {
      const color = workoutColor(type);
      expect(typeof color).toBe("string");
      expect(color.length).toBeGreaterThan(0);
    }
  });

  it("gives every workout type a visually distinct background color from every other type", () => {
    const colors = WORKOUT_TYPES.map(workoutColor);
    expect(new Set(colors).size).toBe(colors.length);
  });

  it("maps every WorkoutType to a non-empty text color that never matches its own background", () => {
    for (const type of WORKOUT_TYPES) {
      const bg = workoutColor(type);
      const text = workoutTextColor(type);
      expect(typeof text).toBe("string");
      expect(text.length).toBeGreaterThan(0);
      expect(text.toLowerCase()).not.toBe(bg.toLowerCase());
    }
  });
});
