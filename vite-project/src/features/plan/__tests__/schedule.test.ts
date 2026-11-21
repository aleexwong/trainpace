import { afterEach, describe, expect, it, vi } from "vitest";
import { generateTrainingPlan, PLAN_WEEKS, weeksUntilRace } from "../plan-math";
import type { PlanGeneratorInputs } from "../types";
import { exportPlanAsIcal } from "../utils/exportIcal";
import { todayNoon, workoutDate } from "../utils/planSchedule";

const inputs: PlanGeneratorInputs = {
  goalRace: "Half Marathon", raceDate: "2026-12-22", currentFitness: "beginner",
  availableDays: ["Tue", "Thu", "Sat", "Sun"],
};
const now = new Date("2026-11-10T18:00:00");

afterEach(() => vi.unstubAllGlobals());

describe("race-anchored training schedules", () => {
  it("fits a six-week lead time without scheduling past workouts", () => {
    const plan = generateTrainingPlan(inputs, now);
    expect(plan.totalWeeks).toBe(6);
    for (const week of plan.weeks) {
      for (const day of week.days) {
        const date = workoutDate(plan, week.weekNumber, day.day);
        expect(date.getTime()).toBeGreaterThanOrEqual(todayNoon(now).getTime());
        expect(date.getTime()).toBeLessThanOrEqual(new Date("2026-12-22T12:00:00").getTime());
        expect(Number.isFinite(day.workout.distanceKm)).toBe(true);
      }
    }
  });

  it.each(["2026-12-21", "2026-12-22", "2026-12-23", "2026-12-24", "2026-12-25", "2026-12-26", "2026-12-27"])(
    "places exactly one race on %s even if it is not a selected day", (raceDate) => {
      const plan = generateTrainingPlan({ ...inputs, raceDate, availableDays: ["Thu", "Tue"] }, now);
      const races = plan.weeks.flatMap((week) => week.days.filter((day) => day.workout.type === "race")
        .map((day) => workoutDate(plan, week.weekNumber, day.day)));
      expect(races).toHaveLength(1);
      expect(races[0]).toEqual(new Date(`${raceDate}T12:00:00`));
      expect(plan.weeks.flatMap((week) => week.days.map((day) => workoutDate(plan, week.weekNumber, day.day).getTime()))
        .every((date) => date <= races[0].getTime())).toBe(true);
    }
  );

  it("retains the standard length when there is enough time", () => {
    expect(generateTrainingPlan({ ...inputs, raceDate: "2027-06-06" }, now).totalWeeks)
      .toBe(PLAN_WEEKS[inputs.goalRace][inputs.currentFitness]);
  });

  it.each(["5K", "10K", "Half Marathon", "Marathon"] as const)("keeps a minimum-length %s plan finite", (goalRace) => {
    const plan = generateTrainingPlan({ ...inputs, goalRace, raceDate: "2026-12-08" }, now);
    expect(plan.weeks).toHaveLength(plan.totalWeeks);
    expect(plan.weeks.every((week) => Number.isFinite(week.totalKm))).toBe(true);
    expect(plan.weeks[plan.weeks.length - 1]?.phase).toBe("Race Week");
  });

  it("rejects too-close and invalid dates", () => {
    for (const raceDate of ["2026-11-11", "invalid"]) {
      expect(() => generateTrainingPlan({ ...inputs, raceDate }, now)).toThrow();
    }
  });

  it("counts calendar weeks across DST without a timezone shift", () => {
    const start = new Date("2027-03-01T23:30:00");
    expect(weeksUntilRace("2027-03-29", start)).toBe(4);
    const plan = generateTrainingPlan({ ...inputs, raceDate: "2027-03-29" }, start);
    expect(workoutDate(plan, 1, plan.weeks[0].days[0].day).getTime()).toBeGreaterThanOrEqual(todayNoon(start).getTime());
  });

  it("exports one all-day race on the chosen date with an exclusive end date", async () => {
    let exported: Blob | undefined;
    vi.stubGlobal("document", { createElement: () => ({ click: vi.fn() }) });
    const create = vi.spyOn(URL, "createObjectURL").mockImplementation((blob) => {
      exported = blob as Blob;
      return "blob:test";
    });
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    try {
      exportPlanAsIcal(generateTrainingPlan(inputs, now));
      const text = await exported!.text();
      expect(text.match(/CATEGORIES:Race,Running/g)).toHaveLength(1);
      expect(text).not.toContain("Race Day! 🎉");
      expect(text).toContain("DTSTART;VALUE=DATE:20261222");
      expect(text).toContain("DTEND;VALUE=DATE:20261223");
    } finally {
      create.mockRestore();
      revoke.mockRestore();
    }
  });
});
