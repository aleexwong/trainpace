import { describe, it, expect } from "vitest";
import {
  formatFuelTime,
  generateFuelStops,
  resolveCarbsPerHour,
  resolveGelsNeeded,
  calculateFuelPlan,
} from "./fuel-math";
import {
  RACE_SETTINGS,
  MAX_CARBS_PER_HOUR,
  CARBS_PER_KG_MULTIPLIER,
  GELS_PER_HOUR,
  MAX_GELS,
  MIN_10K_TIME_FOR_GEL,
  RACE_DISTANCES,
  CALORIES_PER_GRAM_CARB,
  MIN_RACE_TIME_FOR_FUELING,
  type RaceType,
} from "./types";

const RACE_TYPES: RaceType[] = ["10K", "Half", "Full"];

describe("formatFuelTime", () => {
  it("formats zero minutes", () => {
    expect(formatFuelTime(0)).toBe("0:00");
  });

  it("formats a sub-hour duration with zero padding", () => {
    expect(formatFuelTime(5)).toBe("0:05");
    expect(formatFuelTime(30)).toBe("0:30");
  });

  it("formats exactly one hour", () => {
    expect(formatFuelTime(60)).toBe("1:00");
  });

  it("formats multi-hour durations", () => {
    expect(formatFuelTime(90)).toBe("1:30");
    expect(formatFuelTime(185)).toBe("3:05");
  });

  it("rounds non-integer minutes to the nearest minute", () => {
    // 95.4 min -> 1h, 35.4 min remainder -> rounds to 35
    expect(formatFuelTime(95.4)).toBe("1:35");
    // 95.6 min -> 1h, 35.6 min remainder -> rounds to 36
    expect(formatFuelTime(95.6)).toBe("1:36");
  });

  // Regression guard. formatFuelTime used to compute the hours via
  // Math.floor(minutes/60) and the minutes remainder via
  // Math.round(minutes % 60) *independently*. A remainder within half a
  // minute of 60 rounded up to 60 without carrying, so 59.6 printed "0:60"
  // and 119.7 printed "1:60" — both visible in the fuel planner. Now fixed by
  // rounding to whole minutes before splitting.
  it(
    "rolls a rounded-up 60-minute remainder into the next hour",
    () => {
      expect(formatFuelTime(59.6)).toBe("1:00");
    }
  );
});

describe("resolveCarbsPerHour", () => {
  // --- Regression guard for the historical underfeeding bug ---
  // A previous implementation computed carbs/hour as `weightKg * 0.7`
  // unconditionally, which OVERRODE the race-type baseline even when that
  // produced a lower number than the baseline. A 50kg runner racing a half
  // marathon got 50 * 0.7 = 35 g/h, well below the half-marathon baseline of
  // 45 g/h — a light runner would have been meaningfully underfed on race
  // day. The fix is `Math.max(weightBased, raceBaseline)`. This test pins
  // that fix so it can never silently regress.
  it("REGRESSION GUARD: a 50kg runner racing a half marathon must receive the race baseline, not weight * 0.7", () => {
    const weightKg = 50;
    const naiveWeightBased = weightKg * CARBS_PER_KG_MULTIPLIER; // the old, buggy value (35)
    const result = resolveCarbsPerHour({ raceType: "Half", weightKg });

    expect(result).toBeGreaterThanOrEqual(RACE_SETTINGS.Half);
    expect(result).not.toBeCloseTo(naiveWeightBased, 5);
    expect(result).toBeGreaterThan(naiveWeightBased);
  });

  it("sweeps a range of body weights and never returns below the race baseline, or above the max", () => {
    const weights = [30, 40, 45, 50, 55, 60, 70, 80, 90, 100, 120, 150, 200];

    for (const raceType of RACE_TYPES) {
      for (const weightKg of weights) {
        const result = resolveCarbsPerHour({ raceType, weightKg });
        expect(result).toBeGreaterThanOrEqual(RACE_SETTINGS[raceType]);
        expect(result).toBeLessThanOrEqual(MAX_CARBS_PER_HOUR[raceType]);
      }
    }
  });

  it("uses the weight-based value when it exceeds the race baseline", () => {
    // 150kg * 0.7 = 105, which is above the Half baseline (45) but the Half
    // max (90) should still clamp it.
    const result = resolveCarbsPerHour({ raceType: "Half", weightKg: 150 });
    expect(result).toBe(MAX_CARBS_PER_HOUR.Half);
  });

  it("uses a moderate weight-based value that sits between baseline and max", () => {
    // 100kg * 0.7 = 70, above Half baseline (45), below Half max (90)
    const weightKg = 100;
    const expected = Math.round(weightKg * CARBS_PER_KG_MULTIPLIER);
    expect(expected).toBeGreaterThan(RACE_SETTINGS.Half);
    expect(expected).toBeLessThan(MAX_CARBS_PER_HOUR.Half);

    const result = resolveCarbsPerHour({ raceType: "Half", weightKg });
    expect(result).toBe(expected);
  });

  it("falls back to the race baseline when no weight is provided", () => {
    for (const raceType of RACE_TYPES) {
      expect(resolveCarbsPerHour({ raceType })).toBe(RACE_SETTINGS[raceType]);
    }
  });

  describe("custom slider override", () => {
    it("uses the custom value as-is when within range", () => {
      expect(
        resolveCarbsPerHour({ raceType: "Full", customCarbsPerHour: 80 })
      ).toBe(80);
    });

    it("does NOT apply the race baseline floor to a custom value below baseline", () => {
      // A deliberately low custom value should be respected, not bumped up.
      const custom = 20;
      expect(custom).toBeLessThan(RACE_SETTINGS.Half);
      expect(
        resolveCarbsPerHour({ raceType: "Half", customCarbsPerHour: custom })
      ).toBe(custom);
    });

    it("clamps a custom value above the race max down to the max", () => {
      for (const raceType of RACE_TYPES) {
        const result = resolveCarbsPerHour({
          raceType,
          customCarbsPerHour: 9999,
        });
        expect(result).toBe(MAX_CARBS_PER_HOUR[raceType]);
      }
    });

    it("takes priority over weightKg when both are provided", () => {
      const result = resolveCarbsPerHour({
        raceType: "Full",
        weightKg: 200, // would otherwise push toward the max via weight-based calc
        customCarbsPerHour: 50,
      });
      expect(result).toBe(50);
    });

    // Regression guard. A custom value used to be clamped only at the upper
    // bound, so a negative slider reading passed straight through as a
    // negative carbs/hour target. Now floored at zero.
    it(
      "does not allow a negative custom carbs/hour to pass through",
      () => {
        const result = resolveCarbsPerHour({
          raceType: "Full",
          customCarbsPerHour: -20,
        });
        expect(result).toBeGreaterThanOrEqual(0);
      }
    );
  });

  describe("bad weight inputs fall back to the race baseline", () => {
    it("zero weight", () => {
      expect(resolveCarbsPerHour({ raceType: "Full", weightKg: 0 })).toBe(
        RACE_SETTINGS.Full
      );
    });

    it("negative weight", () => {
      expect(resolveCarbsPerHour({ raceType: "Full", weightKg: -70 })).toBe(
        RACE_SETTINGS.Full
      );
    });

    it("NaN weight", () => {
      expect(resolveCarbsPerHour({ raceType: "Full", weightKg: NaN })).toBe(
        RACE_SETTINGS.Full
      );
    });

    it("undefined weight", () => {
      expect(
        resolveCarbsPerHour({ raceType: "Full", weightKg: undefined })
      ).toBe(RACE_SETTINGS.Full);
    });

    it("never produces NaN for any bad weight input", () => {
      const badInputs = [0, -1, -100, NaN, undefined];
      for (const raceType of RACE_TYPES) {
        for (const weightKg of badInputs) {
          const result = resolveCarbsPerHour({ raceType, weightKg });
          expect(Number.isNaN(result)).toBe(false);
        }
      }
    });
  });
});

describe("resolveGelsNeeded", () => {
  describe("10K special case around MIN_10K_TIME_FOR_GEL", () => {
    it("needs 0 gels just below the threshold", () => {
      expect(
        resolveGelsNeeded("10K", MIN_10K_TIME_FOR_GEL - 0.01)
      ).toBe(0);
    });

    it("needs 1 gel exactly at the threshold", () => {
      expect(resolveGelsNeeded("10K", MIN_10K_TIME_FOR_GEL)).toBe(1);
    });

    it("needs 1 gel just above the threshold", () => {
      expect(
        resolveGelsNeeded("10K", MIN_10K_TIME_FOR_GEL + 0.01)
      ).toBe(1);
    });

    it("never exceeds 1 gel for a 10K regardless of how slow", () => {
      expect(resolveGelsNeeded("10K", 3)).toBe(1);
    });
  });

  describe("non-10K races", () => {
    it("scales with GELS_PER_HOUR, rounding up", () => {
      // 2 hours * 1.5 gels/hr = 3 exactly
      expect(resolveGelsNeeded("Half", 2)).toBe(
        Math.ceil(2 * GELS_PER_HOUR)
      );
      // 2.1 hours should round UP past 3
      expect(resolveGelsNeeded("Half", 2.1)).toBe(
        Math.ceil(2.1 * GELS_PER_HOUR)
      );
    });

    it("clamps to MAX_GELS for a very long race", () => {
      expect(resolveGelsNeeded("Full", 10)).toBe(MAX_GELS);
      expect(resolveGelsNeeded("Full", 100)).toBe(MAX_GELS);
    });

    it("returns 0 for a zero-duration race", () => {
      expect(resolveGelsNeeded("Half", 0)).toBe(0);
      expect(resolveGelsNeeded("Full", 0)).toBe(0);
    });
  });

  // Regression guard. For non-10K races a negative duration used to yield a
  // negative gel count: Math.ceil(-1 * GELS_PER_HOUR) is negative and
  // Math.min(negative, MAX_GELS) keeps it negative. Now floored at zero.
  it(
    "does not return a negative gel count for a negative duration",
    () => {
      const result = resolveGelsNeeded("Full", -1);
      expect(result).toBeGreaterThanOrEqual(0);
    }
  );
});

describe("calculateFuelPlan", () => {
  it("totalCarbs equals carbsPerHour * duration in hours, within rounding", () => {
    const cases: Array<{ raceType: RaceType; finishTimeMin: number }> = [
      { raceType: "10K", finishTimeMin: 45 },
      { raceType: "Half", finishTimeMin: 110 },
      { raceType: "Full", finishTimeMin: 240 },
    ];

    for (const { raceType, finishTimeMin } of cases) {
      const plan = calculateFuelPlan({ raceType, finishTimeMin });
      const expectedTotalCarbs =
        (finishTimeMin / 60) * plan.carbsPerHour;
      // totalCarbs is Math.round()-ed, so it can differ from the raw
      // product by up to 0.5g.
      expect(Math.abs(plan.totalCarbs - expectedTotalCarbs)).toBeLessThanOrEqual(
        0.5
      );
    }
  });

  it("totalCalories is totalCarbs converted at CALORIES_PER_GRAM_CARB kcal/g", () => {
    const plan = calculateFuelPlan({ raceType: "Full", finishTimeMin: 240 });
    expect(plan.totalCalories).toBeCloseTo(
      plan.totalCarbs * CALORIES_PER_GRAM_CARB,
      5
    );
  });

  it("is internally consistent across a sweep of durations and weights", () => {
    const durations = [40, 65, 90, 130, 180, 240, 300];
    const weights = [undefined, 50, 70, 90, 120];

    for (const raceType of RACE_TYPES) {
      for (const finishTimeMin of durations) {
        for (const weightKg of weights) {
          const plan = calculateFuelPlan({
            raceType,
            finishTimeMin,
            weightKg,
          });
          const durationHours = finishTimeMin / 60;

          expect(
            Math.abs(plan.totalCarbs - durationHours * plan.carbsPerHour)
          ).toBeLessThanOrEqual(0.5);
          expect(plan.totalCalories).toBeCloseTo(
            plan.totalCarbs * CALORIES_PER_GRAM_CARB,
            5
          );
          expect(plan.carbsPerHour).toBeGreaterThanOrEqual(
            RACE_SETTINGS[raceType]
          );
          expect(plan.carbsPerHour).toBeLessThanOrEqual(
            MAX_CARBS_PER_HOUR[raceType]
          );
          expect(plan.gelsNeeded).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it("respects a custom carbs/hour override end-to-end", () => {
    const plan = calculateFuelPlan({
      raceType: "Half",
      finishTimeMin: 120,
      customCarbsPerHour: 60,
    });
    expect(plan.carbsPerHour).toBe(60);
    expect(plan.totalCarbs).toBeCloseTo(2 * 60, 0);
  });

  it("handles a zero-minute race without NaN and with no fuel stops", () => {
    const plan = calculateFuelPlan({ raceType: "10K", finishTimeMin: 0 });
    expect(plan.totalCarbs).toBe(0);
    expect(plan.totalCalories).toBe(0);
    expect(plan.gelsNeeded).toBe(0);
    expect(plan.fuelStops).toEqual([]);
    expect(Number.isNaN(plan.carbsPerHour)).toBe(false);
  });

  it("handles an absurdly long race without NaN and with gels clamped to MAX_GELS", () => {
    const plan = calculateFuelPlan({ raceType: "Full", finishTimeMin: 24 * 60 });
    expect(Number.isNaN(plan.totalCarbs)).toBe(false);
    expect(plan.gelsNeeded).toBe(MAX_GELS);
    expect(plan.fuelStops.length).toBeGreaterThan(0);
  });

  // FINDING: a negative finish time is not guarded anywhere in
  // calculateFuelPlan (fuel-math.ts:183-212). durationHours goes negative,
  // totalCarbs and totalCalories go negative, and resolveGelsNeeded (for
  // non-10K race types) also returns a negative gel count. None of these are
  // physiologically meaningful. generateFuelStops at least degrades safely
  // (a negative finish time is caught by `finishTimeMin < MIN_RACE_TIME_FOR_FUELING`
  // and returns []).
  it(
    "does not produce negative totals or gel counts for a negative finish time",
    () => {
      const plan = calculateFuelPlan({ raceType: "Full", finishTimeMin: -60 });
      expect(plan.totalCarbs).toBeGreaterThanOrEqual(0);
      expect(plan.totalCalories).toBeGreaterThanOrEqual(0);
      expect(plan.gelsNeeded).toBeGreaterThanOrEqual(0);
    }
  );

  it("fuel stops are empty for a negative finish time (the one part of the pipeline that IS guarded)", () => {
    const plan = calculateFuelPlan({ raceType: "Full", finishTimeMin: -60 });
    expect(plan.fuelStops).toEqual([]);
  });
});

describe("generateFuelStops", () => {
  it("returns no stops for a race under MIN_RACE_TIME_FOR_FUELING", () => {
    expect(
      generateFuelStops(MIN_RACE_TIME_FOR_FUELING - 1, RACE_DISTANCES["10K"], 30)
    ).toEqual([]);
    expect(generateFuelStops(30, RACE_DISTANCES["10K"], 30)).toEqual([]);
  });

  it("returns no stops for a zero or negative duration", () => {
    expect(generateFuelStops(0, RACE_DISTANCES["10K"], 30)).toEqual([]);
    expect(generateFuelStops(-30, RACE_DISTANCES["10K"], 30)).toEqual([]);
  });

  it("produces at least one stop for a race right at the fueling threshold", () => {
    const stops = generateFuelStops(
      MIN_RACE_TIME_FOR_FUELING,
      RACE_DISTANCES["10K"],
      RACE_SETTINGS["10K"]
    );
    expect(stops.length).toBeGreaterThan(0);
  });

  function timeToMinutes(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  }

  it("keeps stops in strictly increasing time order", () => {
    const stops = generateFuelStops(180, RACE_DISTANCES.Half, RACE_SETTINGS.Half);
    const times = stops.map((s) => timeToMinutes(s.time));
    for (let i = 1; i < times.length; i++) {
      expect(times[i]).toBeGreaterThan(times[i - 1]);
    }
  });

  it("never places a stop at or after the finish, and never before the start", () => {
    const finishTimeMin = 240;
    const stops = generateFuelStops(finishTimeMin, RACE_DISTANCES.Full, RACE_SETTINGS.Full);
    for (const stop of stops) {
      const t = timeToMinutes(stop.time);
      expect(t).toBeGreaterThan(0);
      expect(t).toBeLessThan(finishTimeMin);
    }
  });

  it("keeps stop distances within the race distance", () => {
    const distanceKm = RACE_DISTANCES.Half;
    const stops = generateFuelStops(150, distanceKm, RACE_SETTINGS.Half);
    for (const stop of stops) {
      expect(stop.distanceKm).toBeGreaterThan(0);
      expect(stop.distanceKm).toBeLessThan(distanceKm);
    }
  });

  it("uses sensible spacing between stops (front-loaded, 15-30 min intervals)", () => {
    const stops = generateFuelStops(240, RACE_DISTANCES.Full, RACE_SETTINGS.Full);
    const times = stops.map((s) => timeToMinutes(s.time));
    for (let i = 1; i < times.length; i++) {
      const gap = times[i] - times[i - 1];
      expect(gap).toBeGreaterThanOrEqual(15);
      expect(gap).toBeLessThanOrEqual(30);
    }
  });

  it("delivers total carbs across all stops approximately matching the hourly target", () => {
    const finishTimeMin = 240;
    const carbsPerHour = RACE_SETTINGS.Full;
    const stops = generateFuelStops(finishTimeMin, RACE_DISTANCES.Full, carbsPerHour);

    const totalDelivered = stops.reduce((sum, s) => sum + s.carbsNeeded, 0);
    const targetTotal = (finishTimeMin / 60) * carbsPerHour;

    // The front-load/back-off adjustment (1.1x early, 0.95x late) plus
    // per-stop rounding means this won't match exactly; allow a generous
    // tolerance while still catching a badly broken distribution.
    expect(totalDelivered).toBeGreaterThan(targetTotal * 0.85);
    expect(totalDelivered).toBeLessThan(targetTotal * 1.15);
  });

  it("produces zero or very few stops for a very short (just-over-threshold) race", () => {
    const stops = generateFuelStops(61, RACE_DISTANCES["10K"], RACE_SETTINGS["10K"]);
    expect(stops.length).toBeLessThanOrEqual(2);
  });

  it("produces many stops for a very long ultra-style race without erroring", () => {
    const finishTimeMin = 600; // 10 hours
    const stops = generateFuelStops(finishTimeMin, RACE_DISTANCES.Full, RACE_SETTINGS.Full);
    expect(stops.length).toBeGreaterThan(5);
    const times = stops.map((s) => timeToMinutes(s.time));
    for (let i = 1; i < times.length; i++) {
      expect(times[i]).toBeGreaterThan(times[i - 1]);
    }
    expect(times[times.length - 1]).toBeLessThan(finishTimeMin);
  });

  it("assigns each stop a non-empty fuel suggestion", () => {
    const stops = generateFuelStops(180, RACE_DISTANCES.Half, RACE_SETTINGS.Half);
    for (const stop of stops) {
      expect(typeof stop.suggestion).toBe("string");
      expect(stop.suggestion.length).toBeGreaterThan(0);
    }
  });
});

describe("physiological sanity of the tuning constants (documentation, not just assertions)", () => {
  // Sports-nutrition guidance is roughly:
  //   ~30-60 g/h for efforts around an hour
  //   ~60-90 g/h for longer races
  //   up to ~120 g/h only for trained-gut athletes using multiple
  //   transportable carbohydrates
  it("10K baseline sits in the ~30-60 g/h range for an ~1hr effort", () => {
    expect(RACE_SETTINGS["10K"]).toBeGreaterThanOrEqual(30);
    expect(RACE_SETTINGS["10K"]).toBeLessThanOrEqual(60);
  });

  it("Half baseline sits in a reasonable range for a longer effort", () => {
    expect(RACE_SETTINGS.Half).toBeGreaterThanOrEqual(30);
    expect(RACE_SETTINGS.Half).toBeLessThanOrEqual(90);
  });

  it("Full baseline sits in the ~60-90 g/h range for a long race", () => {
    expect(RACE_SETTINGS.Full).toBeGreaterThanOrEqual(60);
    expect(RACE_SETTINGS.Full).toBeLessThanOrEqual(90);
  });

  // FINDING: MAX_CARBS_PER_HOUR["10K"] is 90 g/h (fuel-math's types.ts:17).
  // A 10K is typically a ~40-70 minute effort. Guidance puts ~90 g/h in the
  // "longer races" tier and reserves >90-120 g/h for trained-gut athletes on
  // multi-transportable-carb blends over multi-hour efforts — not a ~1 hour
  // race. Even as a ceiling (not a default), 90 g/h for a 10K looks too
  // permissive; something closer to 60 g/h would better match real-world
  // guidance for an effort this short.
  it.fails(
    "10K max carbs/hour should not reach the long-race ceiling of 90 g/h (finding, expected tighter cap)",
    () => {
      expect(MAX_CARBS_PER_HOUR["10K"]).toBeLessThanOrEqual(60);
    }
  );
});
