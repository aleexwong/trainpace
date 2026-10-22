// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import {
  analyzeRace,
  buildEvenEffortPlan,
  buildVerdict,
  gradeCostFactor,
  matchOfficialDistance,
  parseTimedGpx,
} from "../debrief-math";
import { simulateSampleRace } from "../sample-race";
import type { TimedPoint } from "../types";

const START = Date.parse("2026-04-01T08:00:00Z");

/** A straight run due north at a fixed pace, one point per `stepS` seconds. */
function straightRun(km: number, paceSecPerKm: (km: number) => number, stepS = 2): TimedPoint[] {
  const points: TimedPoint[] = [];
  let m = 0;
  let t = START;
  points.push({ lat: 0, lng: 0, ele: 10, time: t });
  while (m < km * 1000) {
    const speed = 1000 / paceSecPerKm(m / 1000);
    const step = Math.min(km * 1000 - m, speed * stepS);
    m += step;
    t += (step / speed) * 1000;
    points.push({ lat: m / 111_195, lng: 0, ele: 10, time: t });
  }
  return points;
}

function toGpx(points: TimedPoint[]): string {
  const pts = points
    .map(
      (p) =>
        `<trkpt lat="${p.lat}" lon="${p.lng}"><ele>${p.ele}</ele><time>${new Date(p.time).toISOString()}</time></trkpt>`
    )
    .join("");
  return `<?xml version="1.0"?><gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1"><trk><trkseg>${pts}</trkseg></trk></gpx>`;
}

describe("gradeCostFactor", () => {
  it("is 1 on flat ground and grows uphill", () => {
    expect(gradeCostFactor(0)).toBe(1);
    expect(gradeCostFactor(0.05)).toBeGreaterThan(1.2);
    expect(gradeCostFactor(-0.05)).toBeLessThan(1);
  });
});

describe("parseTimedGpx", () => {
  it("reads namespaced GPX with times and elevation", () => {
    const points = parseTimedGpx(toGpx(straightRun(2, () => 300)));
    expect(points.length).toBeGreaterThan(100);
    expect(points[0].ele).toBe(10);
  });

  it("explains a planned course with no timestamps", () => {
    const course = `<gpx xmlns="http://www.topografix.com/GPX/1/1"><trk><trkseg>${Array.from(
      { length: 20 },
      (_, i) => `<trkpt lat="${i / 1000}" lon="0"><ele>5</ele></trkpt>`
    ).join("")}</trkseg></trk></gpx>`;
    expect(() => parseTimedGpx(course)).toThrow(/no timestamps/);
  });

  it("rejects files with no track points", () => {
    expect(() => parseTimedGpx("<gpx></gpx>")).toThrow(/No recorded track/);
  });
});

describe("analyzeRace", () => {
  it("reads an even 10K at 5:00/km as even, with 5:00 splits", () => {
    const r = analyzeRace(straightRun(10, () => 300), "km");
    expect(r.gpsDistanceKm).toBeCloseTo(10, 1);
    expect(r.elapsedSec).toBeCloseTo(3000, -1);
    expect(r.shape).toBe("even");
    expect(r.splits).toHaveLength(10);
    for (const s of r.splits) expect(s.paceSecPerKm).toBeCloseTo(300, 0);
    expect(r.slowdownFromKm).toBeNull();
    expect(r.stoppedSec).toBe(0);
  });

  it("detects a positive split and where the pace fell off", () => {
    const r = analyzeRace(straightRun(10, (km) => (km < 6 ? 300 : 345)), "km");
    expect(r.shape).toBe("positive");
    expect(r.finalQuarterFadePct).toBeGreaterThan(10);
    expect(r.slowdownFromKm).toBe(6);
  });

  it("detects a negative split", () => {
    const r = analyzeRace(straightRun(10, (km) => (km < 5 ? 310 : 290)), "km");
    expect(r.shape).toBe("negative");
    expect(r.halfDiffPct).toBeLessThan(-5);
  });

  it("splits in miles with a partial final split", () => {
    const r = analyzeRace(straightRun(5, () => 300), "mi");
    expect(r.splits).toHaveLength(4);
    expect(r.splits[3].partial).toBe(true);
    expect(r.splits[0].seconds).toBeCloseTo(300 * 1.609344, 0);
  });

  it("counts time standing at an aid station as stopped", () => {
    const points = straightRun(5, () => 300);
    const mid = points.findIndex((p) => p.lat * 111_195 >= 2500);
    const stop = points[mid];
    const shift = 40_000;
    const paused = [
      ...points.slice(0, mid + 1),
      ...Array.from({ length: 20 }, (_, i) => ({ ...stop, time: stop.time + (i + 1) * 2000 })),
      ...points.slice(mid + 1).map((p) => ({ ...p, time: p.time + shift })),
    ];
    const r = analyzeRace(paused, "km");
    expect(r.stoppedSec).toBeGreaterThanOrEqual(35);
    expect(r.stoppedSec).toBeLessThanOrEqual(50);
  });

  it("recovers the sample race's story: fast start, fade from ~30 km", () => {
    const r = analyzeRace(simulateSampleRace(), "km");
    expect(matchOfficialDistance(r.gpsDistanceKm)?.name).toBe("Marathon");
    expect(r.shape).toBe("positive");
    expect(r.startVsAvgPct).toBeLessThan(-3);
    expect(r.slowdownFromKm).toBeGreaterThanOrEqual(28);
    expect(r.slowdownFromKm).toBeLessThanOrEqual(32);
    expect(r.stoppedSec).toBeGreaterThanOrEqual(30);
    // Grade adjustment should take most of the hills out of the splits.
    const full = r.splits.filter((s) => !s.partial && s.startKm >= 5 && s.startKm < 27);
    const spread = (xs: number[]) => Math.max(...xs) - Math.min(...xs);
    expect(spread(full.map((s) => s.gapSecPerKm))).toBeLessThan(
      spread(full.map((s) => s.paceSecPerKm))
    );
    expect(r.stops.length).toBe(3);
    expect(r.fadeCostSec).toBeGreaterThan(240);
    expect(buildVerdict(r, "km")).toMatch(/went out too fast, and the race turned at km (29|30|31)/);

  });
});

describe("buildEvenEffortPlan", () => {
  it("adds back up to the same finish time, easing into the start", () => {
    const legs = buildEvenEffortPlan(42195, 14000);
    const total = legs.reduce((sum, l) => sum + (l.toKm - l.fromKm) * l.paceSecPerKm, 0);
    expect(total).toBeCloseTo(14000, 6);
    expect(legs[0].paceSecPerKm).toBeGreaterThan(legs[2].paceSecPerKm);
    expect(legs[2].toKm).toBeCloseTo(42.195, 6);
  });
});

describe("matchOfficialDistance", () => {
  it("matches watch distances that read a little long", () => {
    expect(matchOfficialDistance(21.35)?.name).toBe("Half Marathon");
    expect(matchOfficialDistance(5.02)?.name).toBe("5K");
    expect(matchOfficialDistance(15)).toBeNull();
  });
});
