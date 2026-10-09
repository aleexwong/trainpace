import { describe, it, expect } from "vitest";
import {
  oxygenCost,
  percentVO2max,
  calculateVdot,
  velocityFromVO2,
  predictRaceTime,
  trainingVelocity,
  velocityToPacePerKm,
  velocityToPacePerMile,
  formatTime,
  formatPace,
  calculateTrainingZones,
} from "./vdot-math";

/**
 * Ground truth: this module claims to implement the Daniels & Gilbert
 * formulas from "Daniels' Running Formula":
 *
 *   VO2      = -4.60 + 0.182258*v + 0.000104*v^2   (v = m/min)
 *   %VO2max  = 0.8 + 0.1894393*e^(-0.012778*t) + 0.2989558*e^(-0.1932605*t)  (t = min)
 *   VDOT     = VO2 / %VO2max
 *
 * These exact coefficients are the published Daniels-Gilbert equations and
 * are reproduced independently below (not copy-pasted from the module) so
 * the tests are a real external check, not a restatement of the code.
 *
 * Anchor points (widely mirrored Daniels VDOT tables):
 *   - 5K in 20:00     ~ VDOT 50
 *   - Marathon in 3:10:00 ~ VDOT 50
 *   - 10K in ~41:38   ~ VDOT 50 (medium confidence recall of published table)
 *   - Half marathon in ~1:32:58 ~ VDOT 50 (medium confidence recall)
 *
 * Independently evaluating the reference formulas above at these race
 * times gives VDOT ≈ 49.8 (5K), 50.2 (marathon), 49.6 (10K), 49.1 (HM) —
 * all within ~1 point of 50, which is the expected spread given the
 * standard table only prints VDOT to the nearest integer/half-point.
 * Tolerances below are chosen to comfortably cover that spread while still
 * catching a sign/unit error, which would be off by many points, not one.
 */

function referenceOxygenCost(v: number): number {
  return -4.6 + 0.182258 * v + 0.000104 * v * v;
}

function referencePercentVO2max(t: number): number {
  return (
    0.8 +
    0.1894393 * Math.exp(-0.012778 * t) +
    0.2989558 * Math.exp(-0.1932605 * t)
  );
}

function referenceVdot(distanceMeters: number, timeSeconds: number): number {
  const timeMinutes = timeSeconds / 60;
  const velocity = distanceMeters / timeMinutes;
  return referenceOxygenCost(velocity) / referencePercentVO2max(timeMinutes);
}

const MILE_IN_METERS = 1609.34;

describe("oxygenCost", () => {
  it("matches the published Daniels-Gilbert VO2 formula across a range of velocities", () => {
    for (const v of [100, 150, 200, 250, 300, 350, 400]) {
      expect(oxygenCost(v)).toBeCloseTo(referenceOxygenCost(v), 6);
    }
  });

  it("is monotonically increasing for realistic running velocities (v > 0)", () => {
    const velocities = [50, 100, 150, 200, 250, 300, 400, 500];
    for (let i = 1; i < velocities.length; i++) {
      expect(oxygenCost(velocities[i])).toBeGreaterThan(
        oxygenCost(velocities[i - 1])
      );
    }
  });

  it("returns the resting/baseline constant at zero velocity", () => {
    // The formula's constant term is the y-intercept; at v=0 only -4.6 remains.
    expect(oxygenCost(0)).toBeCloseTo(-4.6, 6);
  });
});

describe("percentVO2max", () => {
  it("matches the published Daniels-Gilbert %VO2max formula across durations", () => {
    for (const t of [5, 10, 20, 45, 60, 90, 130, 190]) {
      expect(percentVO2max(t)).toBeCloseTo(referencePercentVO2max(t), 6);
    }
  });

  it("is monotonically decreasing as duration increases (can't hold max effort as long)", () => {
    const durations = [1, 5, 10, 20, 40, 60, 90, 130, 190, 300];
    for (let i = 1; i < durations.length; i++) {
      expect(percentVO2max(durations[i])).toBeLessThan(
        percentVO2max(durations[i - 1])
      );
    }
  });

  it("approaches the 0.8 asymptote for very long durations", () => {
    // Both exponential terms decay to ~0 for large t, leaving the 0.8 floor.
    expect(percentVO2max(600)).toBeCloseTo(0.8, 3);
  });

  it("stays within the physiologically valid (0, ~1.3] fraction range for real race durations", () => {
    for (const t of [3, 10, 30, 60, 120, 240]) {
      const pct = percentVO2max(t);
      expect(pct).toBeGreaterThan(0.75);
      expect(pct).toBeLessThanOrEqual(1.3);
    }
  });
});

// toBeCloseTo's numDigits parameter doesn't map cleanly onto "within 2" or
// "within 3" tolerances, so anchor-point checks use an explicit epsilon
// comparison instead (still a floating point closeness check, just spelled
// out rather than relying on numDigits rounding).
function expectCloseWithin(actual: number, expected: number, tolerance: number) {
  expect(Math.abs(actual - expected)).toBeLessThan(tolerance);
}

describe("calculateVdot - anchor points", () => {
  it("5K in 20:00 is close to VDOT 50 (Daniels table anchor)", () => {
    expectCloseWithin(calculateVdot(5000, 20 * 60), 50, 2);
  });

  it("matches an independently-evaluated reference implementation of the formula for a 20:00 5K", () => {
    expect(calculateVdot(5000, 20 * 60)).toBeCloseTo(
      referenceVdot(5000, 20 * 60),
      6
    );
  });

  it("marathon (42195m) in 3:10:00 is close to VDOT 50 (Daniels table anchor)", () => {
    expectCloseWithin(calculateVdot(42195, 3 * 3600 + 10 * 60), 50, 2);
  });

  it("10K in ~41:38 is close to VDOT 50 (Daniels table anchor, wider tolerance for recall uncertainty)", () => {
    expectCloseWithin(calculateVdot(10000, 41 * 60 + 38), 50, 3);
  });

  it("half marathon (21097.5m) in ~1:32:58 is close to VDOT 50 (Daniels table anchor, wider tolerance)", () => {
    expectCloseWithin(calculateVdot(21097.5, 92 * 60 + 58), 50, 3);
  });

  it("a slower well-known anchor: 5K in 25:00 is meaningfully below VDOT 40", () => {
    // Sanity check at a different part of the curve, not just VDOT ~50.
    const vdot = calculateVdot(5000, 25 * 60);
    expect(vdot).toBeGreaterThan(35);
    expect(vdot).toBeLessThan(42);
  });
});

describe("calculateVdot - monotonicity (strong property tests)", () => {
  it("a faster time at the same distance always yields a higher VDOT", () => {
    const distances = [1500, 5000, 10000, 21097.5, 42195];
    for (const distance of distances) {
      // Sweep times from very fast to very slow at this fixed distance.
      const times = [];
      for (let minutes = distance / 400; minutes < distance / 150; minutes += distance / 5000) {
        times.push(minutes * 60);
      }
      for (let i = 1; i < times.length; i++) {
        const fasterVdot = calculateVdot(distance, times[i - 1]);
        const slowerVdot = calculateVdot(distance, times[i]);
        expect(fasterVdot).toBeGreaterThan(slowerVdot);
      }
    }
  });

  it("a longer distance at the same pace always yields a higher VDOT (aerobic endurance credit)", () => {
    const pacesSecPerMeter = [60 / 200, 60 / 250, 60 / 300]; // seconds per meter at various velocities
    for (const secPerMeter of pacesSecPerMeter) {
      const distances = [1500, 3000, 5000, 10000, 15000, 21097.5, 30000, 42195];
      let prevVdot = -Infinity;
      for (const distance of distances) {
        const time = distance * secPerMeter;
        const vdot = calculateVdot(distance, time);
        expect(vdot).toBeGreaterThan(prevVdot);
        prevVdot = vdot;
      }
    }
  });
});

describe("predictRaceTime - round trip with calculateVdot (best test in this module)", () => {
  it("recovers the original time from the VDOT it produced, across many distances and paces", () => {
    const distances = [800, 1500, 3000, 5000, 10000, 15000, 21097.5, 30000, 42195];
    const paceSecPerKm = [180, 210, 240, 270, 300, 330, 360, 420, 480]; // 3:00/km .. 8:00/km

    for (const distance of distances) {
      for (const pace of paceSecPerKm) {
        const originalTime = (distance / 1000) * pace;
        const vdot = calculateVdot(distance, originalTime);
        if (!Number.isFinite(vdot) || vdot <= 0) continue;
        const predictedTime = predictRaceTime(vdot, distance);
        // Bisection converges to |vdotDiff| < 0.001, so predicted time should
        // match the original to within a fraction of a percent.
        expect(predictedTime / originalTime).toBeCloseTo(1, 2); // within ~0.5%
      }
    }
  });

  it("round-trips exactly at the two published anchor points", () => {
    const fiveKTime = 20 * 60;
    const vdot5k = calculateVdot(5000, fiveKTime);
    expect(predictRaceTime(vdot5k, 5000) / fiveKTime).toBeCloseTo(1, 3);

    const marathonTime = 3 * 3600 + 10 * 60;
    const vdotMarathon = calculateVdot(42195, marathonTime);
    expect(predictRaceTime(vdotMarathon, 42195) / marathonTime).toBeCloseTo(1, 3);
  });
});

describe("race equivalence across distances", () => {
  it("predicting marathon from a 5K VDOT, then 5K back from that marathon time, lands near the original 5K time", () => {
    const original5kTime = 22 * 60; // 22:00 5K
    const vdot = calculateVdot(5000, original5kTime);
    const predictedMarathonTime = predictRaceTime(vdot, 42195);
    const vdotFromMarathon = calculateVdot(42195, predictedMarathonTime);
    const roundTripped5kTime = predictRaceTime(vdotFromMarathon, 5000);

    // Should be self-consistent to a small fraction of a percent since it's
    // the same VDOT model applied both directions.
    expect(roundTripped5kTime / original5kTime).toBeCloseTo(1, 2);
  });

  it("predicted times across distances for one VDOT are internally consistent (all imply ~the same VDOT)", () => {
    const vdot = 55;
    const distances = [1500, 5000, 10000, 21097.5, 42195];
    for (const distance of distances) {
      const time = predictRaceTime(vdot, distance);
      const recoveredVdot = calculateVdot(distance, time);
      expectCloseWithin(recoveredVdot, vdot, 0.05);
    }
  });
});

describe("velocityFromVO2 <-> oxygenCost invertibility", () => {
  it("velocityFromVO2(oxygenCost(v)) recovers v for realistic running velocities", () => {
    for (const v of [100, 150, 200, 250, 300, 350, 400, 450]) {
      const vo2 = oxygenCost(v);
      const recoveredV = velocityFromVO2(vo2);
      expect(recoveredV / v).toBeCloseTo(1, 6);
    }
  });

  it("returns a plausible positive velocity for typical VO2max/training VO2 values", () => {
    for (const vo2 of [30, 40, 50, 60, 70]) {
      const v = velocityFromVO2(vo2);
      expect(v).toBeGreaterThan(0);
      // Human running velocities: roughly 100-450 m/min for these VO2 values.
      expect(v).toBeLessThan(600);
    }
  });

  it("is monotonically increasing in targetVO2 (more oxygen cost => faster pace)", () => {
    const vo2s = [20, 30, 40, 50, 60, 70, 80];
    for (let i = 1; i < vo2s.length; i++) {
      expect(velocityFromVO2(vo2s[i])).toBeGreaterThan(velocityFromVO2(vo2s[i - 1]));
    }
  });
});

describe("trainingVelocity", () => {
  it("is monotonically increasing in intensity fraction for a fixed VDOT", () => {
    const vdot = 50;
    const intensities = [0.6, 0.7, 0.75, 0.8, 0.85, 0.9, 1.0, 1.1];
    for (let i = 1; i < intensities.length; i++) {
      expect(trainingVelocity(vdot, intensities[i])).toBeGreaterThan(
        trainingVelocity(vdot, intensities[i - 1])
      );
    }
  });

  it("is monotonically increasing in VDOT for a fixed intensity", () => {
    const intensity = 0.8;
    const vdots = [35, 40, 45, 50, 55, 60, 65, 70];
    for (let i = 1; i < vdots.length; i++) {
      expect(trainingVelocity(vdots[i], intensity)).toBeGreaterThan(
        trainingVelocity(vdots[i - 1], intensity)
      );
    }
  });
});

describe("velocityToPacePerKm vs velocityToPacePerMile", () => {
  it("the mile-pace to km-pace ratio equals the mile/km conversion factor", () => {
    for (const v of [100, 150, 200, 250, 300, 400, 500]) {
      const paceKm = velocityToPacePerKm(v);
      const paceMile = velocityToPacePerMile(v);
      expect(paceMile / paceKm).toBeCloseTo(MILE_IN_METERS / 1000, 4);
    }
  });

  it("returns 0 for non-positive velocity (documented guard clause)", () => {
    expect(velocityToPacePerKm(0)).toBe(0);
    expect(velocityToPacePerKm(-10)).toBe(0);
    expect(velocityToPacePerMile(0)).toBe(0);
    expect(velocityToPacePerMile(-10)).toBe(0);
  });

  it("produces plausible human paces for realistic running velocities", () => {
    // 200 m/min = 12 km/h, a moderate training pace.
    const paceKm = velocityToPacePerKm(200);
    expect(paceKm).toBeCloseTo(300, 0); // 5:00/km
  });
});

describe("formatTime", () => {
  it("formats zero seconds", () => {
    expect(formatTime(0)).toBe("0:00");
  });

  it("formats sub-minute durations with zero-padded seconds", () => {
    expect(formatTime(5)).toBe("0:05");
    expect(formatTime(45)).toBe("0:45");
  });

  it("formats exactly one hour", () => {
    expect(formatTime(3600)).toBe("1:00:00");
  });

  it("formats over an hour with zero-padded minutes and seconds", () => {
    expect(formatTime(3661)).toBe("1:01:01");
  });

  it("formats just under an hour without an hours segment", () => {
    expect(formatTime(3599)).toBe("59:59");
  });

  it("rounds non-integer seconds to the nearest whole second", () => {
    // 59.6 rounds to 60, which should roll over into 1:00, not display "0:60".
    expect(formatTime(59.6)).toBe("1:00");
    expect(formatTime(3599.6)).toBe("1:00:00");
  });

  // Regression guard: formatTime used to return "-1:-5" for a negative input,
  // because JS keeps the dividend's sign through % so Math.floor and % do not
  // split a negative number into a magnitude. Now clamped at zero.
  it(
    "normalizes a negative duration to zero rather than emitting a malformed string. " +
      "Expressing the correct expectation here: a negative duration should format as if it were zero, or throw.",
    () => {
      expect(formatTime(-5)).toBe("0:00");
    }
  );
});

describe("formatPace", () => {
  it("formats zero", () => {
    expect(formatPace(0)).toBe("0:00");
  });

  it("formats sub-minute paces with zero-padded seconds", () => {
    expect(formatPace(45)).toBe("0:45");
  });

  it("formats exactly one minute", () => {
    expect(formatPace(60)).toBe("1:00");
  });

  it("formats over a minute", () => {
    expect(formatPace(272)).toBe("4:32"); // 272s = 4:32
  });

  it("rounds non-integer seconds to the nearest whole second", () => {
    expect(formatPace(90.6)).toBe("1:31"); // rounds to 91 -> 1:31
    expect(formatPace(90.4)).toBe("1:30"); // rounds to 90 -> 1:30
  });

  // Regression guard: same sign problem as formatTime.
  it(
    "normalizes a negative pace to zero rather than emitting a malformed string",
    () => {
      expect(formatPace(-5)).toBe("0:00");
    }
  );
});

describe("calculateVdot - edge cases", () => {
  it("zero race time is non-finite (division collapses toward infinite velocity)", () => {
    expect(Number.isFinite(calculateVdot(5000, 0))).toBe(false);
  });

  // Regression guard: a negative time used to return a finite ~-2.85 rather
  // than anything obviously invalid, and a negative VDOT silently poisons
  // every pace and prediction derived from it.
  it(
    "rejects a negative race time instead of returning a plausible negative VDOT. " +
      "domain check. A negative VDOT is never a real physiological value.",
    () => {
      const vdot = calculateVdot(5000, -1200);
      const isThrownOrNonFinite = !Number.isFinite(vdot);
      expect(isThrownOrNonFinite).toBe(true);
    }
  );

  // Regression guard: zero distance used to return a finite ~-4.83 via the
  // -4.60 constant term in oxygenCost.
  it(
    "rejects a zero distance instead of returning a plausible negative VDOT",
    () => {
      const vdot = calculateVdot(0, 1200);
      const isThrownOrNonFinite = !Number.isFinite(vdot);
      expect(isThrownOrNonFinite).toBe(true);
    }
  );

  it("absurdly large distance/short time produces an implausibly huge (but finite) VDOT rather than throwing", () => {
    // Not marked as a bug: the formula is a polynomial in velocity, so it is
    // mathematically well-defined (if physiologically meaningless) for any
    // positive velocity. This documents current behavior as a property
    // (huge input -> huge output), not a correctness claim.
    const vdot = calculateVdot(1e9, 1);
    expect(Number.isFinite(vdot)).toBe(true);
    expect(vdot).toBeGreaterThan(1000);
  });
});

describe("calculateTrainingZones", () => {
  it("returns all five Daniels training zones", () => {
    const zones = calculateTrainingZones(50);
    expect(zones.map((z) => z.name)).toEqual([
      "Easy",
      "Marathon",
      "Threshold",
      "Interval",
      "Repetition",
    ]);
  });

  it("each zone's pace range is internally ordered fast-then-slow (ascending seconds)", () => {
    const zones = calculateTrainingZones(50);
    for (const zone of zones) {
      expect(zone.pacePerKmSeconds[0]).toBeLessThanOrEqual(zone.pacePerKmSeconds[1]);
      expect(zone.pacePerMileSeconds[0]).toBeLessThanOrEqual(zone.pacePerMileSeconds[1]);
    }
  });

  it("zones are ordered from slowest (Easy) to fastest (Repetition) by average pace, across a wide VDOT sweep", () => {
    // Use the midpoint (average of fast/slow) per zone as the comparison
    // statistic, since Easy/Marathon/Threshold/Interval/Repetition
    // intensity ranges deliberately overlap at their edges in the published
    // Daniels table (e.g. Marathon tops out at 0.84 while Threshold starts
    // at 0.83) - comparing single fast/slow bounds directly would produce
    // false failures on that intentional overlap, not a real bug.
    for (let vdot = 30; vdot <= 85; vdot += 5) {
      const zones = calculateTrainingZones(vdot);
      const avgPaces = zones.map(
        (z) => (z.pacePerKmSeconds[0] + z.pacePerKmSeconds[1]) / 2
      );
      for (let i = 1; i < avgPaces.length; i++) {
        // Faster zones have LOWER seconds-per-km.
        expect(avgPaces[i]).toBeLessThan(avgPaces[i - 1]);
      }
    }
  });

  it("produces plausible human paces across a wide VDOT sweep (no inversion into nonsense at extremes)", () => {
    for (let vdot = 25; vdot <= 85; vdot += 5) {
      const zones = calculateTrainingZones(vdot);
      for (const zone of zones) {
        for (const paceSeconds of zone.pacePerKmSeconds) {
          expect(paceSeconds).toBeGreaterThan(120); // faster than 2:00/km is not realistic
          expect(paceSeconds).toBeLessThan(900); // slower than 15:00/km is not a training pace
        }
      }
    }
  });

  it("pacePerMileSeconds is consistent with pacePerKmSeconds by the mile/km ratio", () => {
    const zones = calculateTrainingZones(50);
    for (const zone of zones) {
      expect(zone.pacePerMileSeconds[0] / zone.pacePerKmSeconds[0]).toBeCloseTo(
        MILE_IN_METERS / 1000,
        4
      );
      expect(zone.pacePerMileSeconds[1] / zone.pacePerKmSeconds[1]).toBeCloseTo(
        MILE_IN_METERS / 1000,
        4
      );
    }
  });
});
