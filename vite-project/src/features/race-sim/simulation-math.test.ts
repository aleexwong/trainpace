import { describe, expect, it } from "vitest";
import { courseDifficultyFactor, realisticCourseTime, simulate } from "./simulation-math";
import type { CoursePoint } from "./types";

const distanceKm = 42.195;
const goalTime = 12_600;

function course(elevationChange: number): CoursePoint[] {
  return [
    { dist: 0, ele: 1500, lat: 0, lng: 0 },
    { dist: distanceKm, ele: 1500 + elevationChange, lat: 0, lng: 0 },
  ];
}

describe("race simulator course difficulty", () => {
  it.each([
    { elevationChange: 1500, expectedSign: 1 },
    { elevationChange: 0, expectedSign: 0 },
    { elevationChange: -1500, expectedSign: -1 },
  ])("agrees with the course ranking for $elevationChange m of climb", ({ elevationChange, expectedSign }) => {
    const points = course(elevationChange);
    const result = simulate(points, goalTime);
    const sameEffortTime = realisticCourseTime(goalTime, points, distanceKm);

    expect(Math.sign(result.courseDifficultyFactorPercent)).toBe(expectedSign);
    expect(result.courseDifficultyFactorPercent).toBe(courseDifficultyFactor(points));
    expect(result.courseDifficultyFactorPercent).toBeCloseTo(Math.round((sameEffortTime / goalTime - 1) * 100));
    expect(result.checkpoints.at(-1)?.cumulativeTimeSeconds).toBeCloseTo(goalTime);
  });
});
