import { describe, it, expect } from "vitest";
import {
  timeToSeconds,
  secondsToTimeString,
  convertPace,
  convertDistance,
  calculateTrainingPaces,
  validatePaceInputs,
  calculateHeartRateZones,
  adjustPaceForTerrain,
  calculateElevationAdjustment,
  calculateWeatherAdjustment,
} from "./utils";

// Small local helper (test-only): parse a "M:SS-M:SS suffix" range string back
// into [minSeconds, maxSeconds]. Used to check ordering/magnitude of results
// returned as formatted strings, without re-implementing production logic.
function parsePaceRange(s: string): [number, number] {
  const m = s.match(/(\d+):(\d+)-(\d+):(\d+)/);
  if (!m) throw new Error(`Could not parse pace range: ${s}`);
  const [, minM, minS, maxM, maxS] = m;
  return [parseInt(minM) * 60 + parseInt(minS), parseInt(maxM) * 60 + parseInt(maxS)];
}

function avgPaceRange(s: string): number {
  const [lo, hi] = parsePaceRange(s);
  return (lo + hi) / 2;
}

const EXACT_MILE_IN_KM = 1.609344; // true exact definition of a mile

describe("timeToSeconds", () => {
  it("converts hours, minutes, seconds to total seconds", () => {
    expect(timeToSeconds("1", "2", "3")).toBe(1 * 3600 + 2 * 60 + 3);
    expect(timeToSeconds("0", "30", "0")).toBe(1800);
    expect(timeToSeconds("2", "0", "0")).toBe(7200);
  });

  it("treats zero input as zero seconds", () => {
    expect(timeToSeconds("0", "0", "0")).toBe(0);
  });

  it("treats empty strings as zero for each field", () => {
    expect(timeToSeconds("", "", "")).toBe(0);
    expect(timeToSeconds("1", "", "")).toBe(3600);
    expect(timeToSeconds("", "5", "")).toBe(300);
  });

  it("does not itself clamp out-of-range minute/second values (e.g. 90 seconds is taken literally)", () => {
    // 90 "seconds" is not a valid time field, but timeToSeconds performs no
    // range validation -- that's validatePaceInputs's job. Document the
    // actual (permissive) behavior here.
    expect(timeToSeconds("0", "0", "90")).toBe(90);
  });

  it("propagates NaN for non-numeric input rather than throwing", () => {
    const result = timeToSeconds("abc", "0", "0");
    expect(Number.isNaN(result)).toBe(true);
  });

  describe("round-trip with secondsToTimeString", () => {
    const cases: Array<[string, string, string]> = [
      ["0", "0", "0"],
      ["0", "0", "1"],
      ["0", "0", "59"],
      ["0", "1", "0"],
      ["0", "9", "5"],
      ["0", "30", "0"],
      ["0", "59", "59"],
      ["1", "0", "0"],
      ["1", "0", "1"],
      ["2", "15", "30"],
      ["3", "30", "0"],
      ["10", "0", "0"],
      ["23", "59", "59"],
    ];

    it.each(cases)("h=%s m=%s s=%s round-trips through seconds", (h, m, s) => {
      const totalSeconds = timeToSeconds(h, m, s);
      const str = secondsToTimeString(totalSeconds);
      // Re-parse the formatted string back into h/m/s and confirm it matches
      // the total-seconds value exactly (round trip), independent of the
      // zero-padding / hour-omission formatting rules.
      const parts = str.split(":").map(Number);
      let rebuiltSeconds: number;
      if (parts.length === 3) {
        rebuiltSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
      } else {
        rebuiltSeconds = parts[0] * 60 + parts[1];
      }
      expect(rebuiltSeconds).toBe(totalSeconds);
    });
  });
});

describe("secondsToTimeString", () => {
  it("formats zero seconds", () => {
    expect(secondsToTimeString(0)).toBe("0:00");
  });

  it("formats sub-minute values without an hours segment", () => {
    expect(secondsToTimeString(5)).toBe("0:05");
    expect(secondsToTimeString(59)).toBe("0:59");
  });

  it("carries seconds into minutes at the 60s boundary", () => {
    expect(secondsToTimeString(60)).toBe("1:00");
    expect(secondsToTimeString(61)).toBe("1:01");
  });

  it("carries minutes into hours at the 3600s boundary", () => {
    expect(secondsToTimeString(3600)).toBe("1:00:00");
    expect(secondsToTimeString(3661)).toBe("1:01:01");
  });

  it("handles values over 24 hours", () => {
    expect(secondsToTimeString(25 * 3600)).toBe("25:00:00");
    expect(secondsToTimeString(90061)).toBe("25:01:01");
  });

  it("truncates (floors) fractional seconds rather than rounding", () => {
    expect(secondsToTimeString(59.9)).toBe("0:59");
  });
});

describe("convertPace", () => {
  it("returns the input unchanged when units already match", () => {
    expect(convertPace(300, "km", "km")).toBe(300);
    expect(convertPace(482, "miles", "Miles")).toBe(482);
  });

  it("km pace converts to a mile pace via the exact 1 mile = 1.609344 km relationship", () => {
    // 5:00 min/km (300s) is roughly an 8:03 min/mile effort.
    const kmPaceSeconds = 300;
    const expectedMilePaceSeconds = kmPaceSeconds * EXACT_MILE_IN_KM; // 482.8032
    const actual = convertPace(kmPaceSeconds, "km", "Miles");
    expect(actual).toBeCloseTo(expectedMilePaceSeconds, 1);
  });

  it("mile pace converts to a km pace via the exact 1 mile = 1.609344 km relationship", () => {
    const milePaceSeconds = 480; // 8:00 min/mile
    const expectedKmPaceSeconds = milePaceSeconds / EXACT_MILE_IN_KM; // ~298.26
    const actual = convertPace(milePaceSeconds, "miles", "km");
    expect(actual).toBeCloseTo(expectedKmPaceSeconds, 1);
  });

  it("DIRECTION: the same effort takes a LARGER number of seconds per mile than per km (mile is the longer distance)", () => {
    const kmPaceSeconds = 300; // 5:00/km
    const milePaceSeconds = convertPace(kmPaceSeconds, "km", "Miles");
    expect(milePaceSeconds).toBeGreaterThan(kmPaceSeconds);
  });

  it("DIRECTION: converting mile pace to km pace produces a SMALLER number of seconds", () => {
    const milePaceSeconds = 480; // 8:00/mile
    const kmPaceSeconds = convertPace(milePaceSeconds, "miles", "km");
    expect(kmPaceSeconds).toBeLessThan(milePaceSeconds);
  });

  it("round-trips km -> miles -> km within tolerance of the rounding-free constant", () => {
    const original = 330; // 5:30/km
    const roundTripped = convertPace(
      convertPace(original, "km", "Miles"),
      "miles",
      "km"
    );
    expect(roundTripped).toBeCloseTo(original, 5);
  });
});

describe("convertDistance", () => {
  it("returns the input unchanged when units already match", () => {
    expect(convertDistance(10, "km", "km")).toBe(10);
    expect(convertDistance(6.2, "miles", "miles")).toBe(6.2);
  });

  it("converts common race distances km -> miles (snapping to standard race markers)", () => {
    expect(convertDistance(5, "km", "miles")).toBeCloseTo(3.1, 5); // 5K
    expect(convertDistance(10, "km", "miles")).toBeCloseTo(6.2, 5); // 10K
    expect(convertDistance(21.1, "km", "miles")).toBeCloseTo(13.1, 5); // half marathon
    expect(convertDistance(42.195, "km", "miles")).toBeCloseTo(26.2, 5); // marathon (exact km distance)
  });

  it("converts common race distances miles -> km (snapping to standard race markers)", () => {
    expect(convertDistance(3.1, "miles", "km")).toBeCloseTo(5, 5);
    expect(convertDistance(6.2, "miles", "km")).toBeCloseTo(10, 5);
    expect(convertDistance(13.1, "miles", "km")).toBeCloseTo(21.1, 5);
    expect(convertDistance(26.2, "miles", "km")).toBeCloseTo(42.2, 5);
  });

  it("converts 1 mile to km close to the exact 1.609344 constant (no nearby race marker to snap to)", () => {
    // 1.60934 rounds to 1.6, which is not within 2% of any COMMON_RACES.km
    // entry, so this exercises the plain rounding path, not the snapping path.
    expect(convertDistance(1, "miles", "km")).toBeCloseTo(1.6, 5);
  });

  it("round-trips a non-standard distance to within one rounding step (~0.1-0.2 units)", () => {
    const original = 7; // km, deliberately not near a common race marker
    const toMiles = convertDistance(original, "km", "miles");
    const backToKm = convertDistance(toMiles, "miles", "km");
    expect(backToKm).toBeCloseTo(original, 0); // within ~0.15 after two roundings
  });
});

describe("convertPace vs convertDistance: inverse relationship", () => {
  it("DIRECTION: a pace that is faster per km is a LARGER number per mile, matching that miles > km in length", () => {
    // If you run every km in 4:00 (240s), your pace per mile is a bigger
    // number of seconds (since a mile is longer than a km) even though the
    // km pace itself is a "faster" (smaller) number than an easier runner's
    // km pace. This test pins the direction explicitly using two different
    // efforts so a sign-flip bug in either convertPace or convertDistance
    // cannot pass by accident.
    const fastKmPace = 240; // 4:00/km
    const slowKmPace = 360; // 6:00/km
    const fastMilePace = convertPace(fastKmPace, "km", "Miles");
    const slowMilePace = convertPace(slowKmPace, "km", "Miles");
    // Ordering is preserved: faster km pace -> faster (smaller) mile pace.
    expect(fastMilePace).toBeLessThan(slowMilePace);
    // But the mile-pace number is inflated relative to the km-pace number
    // in both cases, because a mile is the longer distance.
    expect(fastMilePace).toBeGreaterThan(fastKmPace);
    expect(slowMilePace).toBeGreaterThan(slowKmPace);
  });
});

describe("calculateTrainingPaces", () => {
  // Multipliers are simple constants applied to the base pace, so the
  // ordering is invariant across all positive inputs -- but we sweep a wide
  // range of paces anyway as a regression guard against a future change
  // that makes them input-dependent (e.g. a non-linear fade model).
  const raceTimesSeconds = [
    2 * 3600 + 3 * 60, // ~2:03:00 elite marathon
    3 * 3600, // 3:00:00
    3 * 3600 + 45 * 60, // 3:45:00
    4 * 3600 + 30 * 60, // 4:30:00
    6 * 3600, // 6:00:00 very slow beginner
  ];

  it.each(raceTimesSeconds)(
    "zones never invert in speed order for a %i-second marathon",
    (raceTimeSeconds) => {
      const results = calculateTrainingPaces(
        raceTimeSeconds,
        42.195,
        "km",
        "km"
      );
      const speed = avgPaceRange(results.speed);
      const maximum = avgPaceRange(results.maximum);
      const interval = avgPaceRange(results.interval);
      const tempo = avgPaceRange(results.tempo);
      const easy = avgPaceRange(results.easy);
      const xlong = avgPaceRange(results.xlong);

      // Ascending average pace-in-seconds == descending speed.
      expect(speed).toBeLessThanOrEqual(maximum);
      expect(maximum).toBeLessThanOrEqual(interval);
      expect(interval).toBeLessThanOrEqual(tempo);
      expect(tempo).toBeLessThanOrEqual(easy);
      expect(easy).toBeLessThanOrEqual(xlong);
    }
  );

  it("all training zones stay within a plausible multiple of race pace (0.7x-1.5x)", () => {
    const results = calculateTrainingPaces(3 * 3600, 42.195, "km", "km");
    const race = avgPaceRange(results.race);
    for (const key of ["easy", "tempo", "interval", "maximum", "speed", "xlong"] as const) {
      const avg = avgPaceRange(results[key]);
      const ratio = avg / race;
      expect(ratio).toBeGreaterThan(0.7);
      expect(ratio).toBeLessThan(1.5);
    }
  });

  it("attaches heart rate zones when age is provided", () => {
    const results = calculateTrainingPaces(3 * 3600, 42.195, "km", "km", { age: 40 });
    expect(results.heartRateZones).toBeDefined();
    expect(results.heartRateZones?.maxHR).toBe(180);
  });

  it("omits heart rate zones when age is not provided", () => {
    const results = calculateTrainingPaces(3 * 3600, 42.195, "km", "km");
    expect(results.heartRateZones).toBeUndefined();
  });

  it("attaches a weather adjustment when temperature is provided", () => {
    const results = calculateTrainingPaces(3 * 3600, 42.195, "km", "km", {
      temperature: 90,
    });
    expect(results.adjustments?.weather).toBeDefined();
  });

  // --- Regression guard: Yasso 800 projection used to ignore `units` ------
  //
  // The projection divided raceTimeMinutes by raceDistance and multiplied by
  // the marathon constant 42.195. That constant is in km, but raceDistance
  // arrives in whatever `units` the caller passed. With units === "km" the
  // maths was self-consistent, and the resulting value fed through
  // secondsToTimeString happens to reproduce the classic Yasso mnemonic
  // (marathon H:MM ~= 800m M:SS). With units === "miles" it divided by a
  // mile count and multiplied by a km distance, inflating the projection by
  // the 1.609 mile/km factor.
  //
  // The same physical 10K in 40:00 gave a Yasso target of 2:48 entered as
  // 10 km and 4:32 entered as 6.2 miles. raceDistance is now normalised to
  // km first. The two readings stay a second apart because 6.2 miles is
  // 9.978 km, not exactly 10 — that residue is correct, not a rounding fudge.
  it(
    "Yasso 800 projection is unit-independent: the same physical race entered in km or miles gives the same target",
    () => {
      const kmResults = calculateTrainingPaces(2400, 10, "km", "km");
      const milesResults = calculateTrainingPaces(2400, 6.2, "miles", "Miles");

      const kmYassoSeconds = parsePaceRange(kmResults.yasso)[0];
      const milesYassoSeconds = parsePaceRange(milesResults.yasso)[0];

      // Correct expectation: within a few seconds of each other (10km and
      // 6.2mi are the same distance to within rounding).
      expect(Math.abs(kmYassoSeconds - milesYassoSeconds)).toBeLessThan(5);
    }
  );
});

describe("validatePaceInputs", () => {
  it("accepts a plausible, complete input", () => {
    const result = validatePaceInputs("10", "0", "45", "0");
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it("rejects an empty distance", () => {
    const result = validatePaceInputs("", "0", "45", "0");
    expect(result.isValid).toBe(false);
    expect(result.errors.distance).toBeTruthy();
  });

  it("rejects a non-numeric distance", () => {
    const result = validatePaceInputs("abc", "0", "45", "0");
    expect(result.isValid).toBe(false);
    expect(result.errors.distance).toBeTruthy();
  });

  it("rejects a zero distance", () => {
    const result = validatePaceInputs("0", "0", "45", "0");
    expect(result.isValid).toBe(false);
    expect(result.errors.distance).toBeTruthy();
  });

  it("rejects a negative distance", () => {
    const result = validatePaceInputs("-5", "0", "45", "0");
    expect(result.isValid).toBe(false);
    expect(result.errors.distance).toBeTruthy();
  });

  it("accepts an absurdly large distance (no upper bound is enforced)", () => {
    // Documenting current behavior: there is no sanity ceiling on distance.
    const result = validatePaceInputs("999999", "0", "45", "0");
    expect(result.isValid).toBe(true);
  });

  it("rejects an all-zero time", () => {
    const result = validatePaceInputs("10", "0", "0", "0");
    expect(result.isValid).toBe(false);
    expect(result.errors.time).toBeTruthy();
  });

  it("rejects minutes >= 60", () => {
    const result = validatePaceInputs("10", "0", "60", "0");
    expect(result.isValid).toBe(false);
    expect(result.errors.time).toBeTruthy();
  });

  it("rejects seconds >= 60", () => {
    const result = validatePaceInputs("10", "0", "45", "60");
    expect(result.isValid).toBe(false);
    expect(result.errors.time).toBeTruthy();
  });
});

describe("calculateHeartRateZones", () => {
  // The code comment and implementation both use the classic (Fox) formula:
  // Max HR = 220 - age. (Not Tanaka's 208 - 0.7*age, and not HRR/Karvonen.)

  it("uses the 220-minus-age max heart rate formula", () => {
    expect(calculateHeartRateZones(30).maxHR).toBe(190);
    expect(calculateHeartRateZones(45).maxHR).toBe(175);
  });

  it("produces ordered, non-overlapping zone boundaries within max HR for a young runner", () => {
    const z = calculateHeartRateZones(20);
    expect(z.maxHR).toBe(200);
    const easy = z.easyZone.match(/\((\d+)-(\d+) bpm\)/)!.slice(1, 3).map(Number);
    const tempo = z.tempoZone.match(/\((\d+)-(\d+) bpm\)/)!.slice(1, 3).map(Number);
    const interval = z.intervalZone.match(/\((\d+)-(\d+) bpm\)/)!.slice(1, 3).map(Number);
    const maximum = z.maximumZone.match(/\((\d+)-(\d+) bpm\)/)!.slice(1, 3).map(Number);

    expect(easy[0]).toBeLessThan(easy[1]);
    expect(easy[1]).toBeLessThanOrEqual(tempo[0]);
    expect(tempo[1]).toBeLessThanOrEqual(interval[0]);
    expect(interval[1]).toBeLessThanOrEqual(maximum[0]);
    expect(maximum[1]).toBeLessThanOrEqual(z.maxHR);
    expect(easy[0]).toBeGreaterThan(0);
  });

  it("produces plausible, lower zones for a masters runner than a young runner", () => {
    const young = calculateHeartRateZones(20);
    const masters = calculateHeartRateZones(55);
    expect(masters.maxHR).toBeLessThan(young.maxHR);
  });

  it("FINDING: does not validate age -- age 0 silently yields a 220 bpm max HR", () => {
    // No age validation exists in calculateHeartRateZones. An age of 0
    // (invalid for this calculator) produces maxHR = 220, presented as if
    // legitimate. This is not a thrown error or a rejected input -- just a
    // plausible-looking wrong number. Documenting current (buggy-by-omission)
    // behavior rather than asserting it is correct.
    const z = calculateHeartRateZones(0);
    expect(z.maxHR).toBe(220);
  });

  it("FINDING: does not validate age -- an implausible age of 120 yields maxHR=100 with no rejection", () => {
    const z = calculateHeartRateZones(120);
    expect(z.maxHR).toBe(100);
    // Zones are still internally ordered even though the whole premise
    // (a 120-year-old runner) is not realistic -- the function has no
    // concept of a plausible age range.
    expect(z.easyZone).toContain("60-70%");
  });

  it("FINDING: an age at/above 220 produces a non-positive max HR (nonsense output, not rejected)", () => {
    const z = calculateHeartRateZones(230);
    expect(z.maxHR).toBeLessThanOrEqual(0);
  });
});

describe("adjustPaceForTerrain", () => {
  it("returns the pace unchanged for flat terrain", () => {
    const input = "9:00-9:30 min/mi";
    expect(adjustPaceForTerrain(input, "flat", "Miles")).toBe(input);
  });

  it("DIRECTION: hilly terrain is always slower than flat, never faster", () => {
    const flat = "9:00-9:30 min/mi";
    const hilly = adjustPaceForTerrain(flat, "hilly", "Miles");
    const [flatMin] = parsePaceRange(flat);
    const [hillyMin] = parsePaceRange(hilly);
    expect(hillyMin).toBeGreaterThan(flatMin);
  });

  it("MAGNITUDE: adds exactly 30 seconds per mile for hilly terrain (a plausible rolling-hills adjustment)", () => {
    const adjusted = adjustPaceForTerrain("9:00-9:30 min/mi", "hilly", "Miles");
    expect(adjusted).toBe("9:30-10:00 min/mi");
  });

  it("MAGNITUDE: adds exactly 19 seconds per km for hilly terrain (~30s/mile converted to km)", () => {
    const adjusted = adjustPaceForTerrain("5:00-5:20/km", "hilly", "km");
    expect(adjusted).toBe("5:19-5:39/km");
  });

  it("returns the original string unchanged when it cannot be parsed", () => {
    const input = "not a pace";
    expect(adjustPaceForTerrain(input, "hilly", "Miles")).toBe(input);
  });
});

describe("calculateElevationAdjustment", () => {
  it("reports flat terrain as optimal with no adjusted pace", () => {
    const result = calculateElevationAdjustment("9:00-9:30 min/mi", "flat", "Miles");
    expect(result?.type).toBe("flat");
    expect(result?.adjustedEasyPace).toBeUndefined();
  });

  it("DIRECTION: hilly elevation adjustment slows the easy pace, never speeds it up", () => {
    const result = calculateElevationAdjustment("9:00-9:30 min/mi", "hilly", "Miles");
    expect(result?.type).toBe("hilly");
    const [origMin] = parsePaceRange("9:00-9:30 min/mi");
    const [adjMin] = parsePaceRange(result!.adjustedEasyPace!);
    expect(adjMin).toBeGreaterThan(origMin);
  });

  it("MAGNITUDE: hilly adjustment is +30s/mile, a physiologically sane rolling-terrain penalty", () => {
    const result = calculateElevationAdjustment("9:00-9:30 min/mi", "hilly", "Miles");
    // Note: the output suffix is built from paceUnit.toLowerCase() ("miles"),
    // not the "mi" abbreviation used in the input string.
    expect(result?.adjustedEasyPace).toBe("9:30-10:00 min/miles");
  });

  it("MAGNITUDE: hilly adjustment is +19s/km", () => {
    const result = calculateElevationAdjustment("5:00-5:20/km", "hilly", "km");
    expect(result?.adjustedEasyPace).toBe("5:19-5:39 min/km");
  });

  it("falls back to a generic message when the pace string cannot be parsed", () => {
    const result = calculateElevationAdjustment("N/A", "hilly", "Miles");
    expect(result?.type).toBe("hilly");
    expect(result?.adjustedEasyPace).toBeUndefined();
    expect(result?.message).toBeTruthy();
  });

  it("NOTE: models terrain only as a flat/hilly flag, with no elevation-gain (meters) input at all", () => {
    // The function signature takes no elevation-gain magnitude (e.g. meters
    // of climb), so a claim like "1000m of climb over a marathon" cannot be
    // tested here -- the model only distinguishes two fixed states and
    // applies the same flat +30s/mile penalty regardless of how hilly the
    // course actually is. This is a modeling limitation, not a unit bug.
    const gentle = calculateElevationAdjustment("9:00-9:30 min/mi", "hilly", "Miles");
    const extreme = calculateElevationAdjustment("9:00-9:30 min/mi", "hilly", "Miles");
    expect(gentle?.adjustedEasyPace).toBe(extreme?.adjustedEasyPace);
  });
});

describe("calculateWeatherAdjustment", () => {
  it("makes no adjustment below 80F", () => {
    const result = calculateWeatherAdjustment("9:00-9:30 min/mi", 60, "Miles");
    expect(result?.adjustedEasyPace).toBeUndefined();
    expect(result?.message).toContain("60");
  });

  it("triggers an adjustment at exactly 80F (boundary is inclusive of 80)", () => {
    const result = calculateWeatherAdjustment("9:00-9:30 min/mi", 80, "Miles");
    expect(result?.adjustedEasyPace).toBeDefined();
  });

  it("DIRECTION: heat adjustment slows the easy pace, never speeds it up", () => {
    const result = calculateWeatherAdjustment("9:00-9:30 min/mi", 90, "Miles");
    const [origMin] = parsePaceRange("9:00-9:30 min/mi");
    const [adjMin] = parsePaceRange(result!.adjustedEasyPace!);
    expect(adjMin).toBeGreaterThan(origMin);
  });

  it("MAGNITUDE: heat adjustment is +30s/mile, a plausible heat-slowdown guideline", () => {
    const result = calculateWeatherAdjustment("9:00-9:30 min/mi", 90, "Miles");
    // Note: the output suffix is built from paceUnit.toLowerCase() ("miles"),
    // not the "mi" abbreviation used in the input string.
    expect(result?.adjustedEasyPace).toBe("9:30-10:00 min/miles");
  });

  it("MAGNITUDE: heat adjustment is +19s/km", () => {
    const result = calculateWeatherAdjustment("5:00-5:20/km", 90, "km");
    expect(result?.adjustedEasyPace).toBe("5:19-5:39 min/km");
  });

  it("FINDING: the heat penalty does not scale with how hot it is -- 80F and 110F get the identical adjustment", () => {
    // Real heat-slowdown guidance generally recommends progressively more
    // slowdown as temperature climbs; this model applies one fixed step
    // once the 80F threshold is crossed, with no further gradation.
    const moderate = calculateWeatherAdjustment("9:00-9:30 min/mi", 80, "Miles");
    const extreme = calculateWeatherAdjustment("9:00-9:30 min/mi", 110, "Miles");
    expect(moderate?.adjustedEasyPace).toBe(extreme?.adjustedEasyPace);
  });

  it("falls back to a generic message when the pace string cannot be parsed", () => {
    const result = calculateWeatherAdjustment("N/A", 90, "Miles");
    expect(result?.adjustedEasyPace).toBeUndefined();
    expect(result?.message).toBeTruthy();
  });
});
