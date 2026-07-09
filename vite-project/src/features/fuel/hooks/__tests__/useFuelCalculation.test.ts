import { describe, it, expect } from "vitest";
import { calculateFuelPlan, getFinishTimeInMinutes } from "../useFuelCalculation";

describe("calculateFuelPlan", () => {
  it("is invalid when the finish time is missing", () => {
    const { isValid, error, result } = calculateFuelPlan({
      raceType: "Half",
      weight: "",
      timeHours: "",
      timeMinutes: "",
    });
    expect(isValid).toBe(false);
    expect(error).toBeTruthy();
    expect(result).toBeNull();
  });

  it("rejects an out-of-range weight", () => {
    const { isValid, error } = calculateFuelPlan({
      raceType: "Half",
      weight: "1500",
      timeHours: "1",
      timeMinutes: "45",
    });
    expect(isValid).toBe(false);
    expect(error).toMatch(/weight/i);
  });

  it("uses the race baseline when no weight is provided (B1 regression)", () => {
    // Half marathon baseline is 45g/hr per RACE_SETTINGS
    const { result } = calculateFuelPlan({
      raceType: "Half",
      weight: "",
      timeHours: "1",
      timeMinutes: "45",
    });
    expect(result?.carbsPerHour).toBe(45);
  });

  it("never lets a light runner's weight-based carbs undercut the race baseline (B1 regression)", () => {
    // 50kg * 0.7 = 35g/hr, below the 45g/hr half-marathon baseline -- must clamp up
    const { result } = calculateFuelPlan({
      raceType: "Half",
      weight: "50",
      timeHours: "1",
      timeMinutes: "45",
    });
    expect(result?.carbsPerHour).toBe(45);
  });

  it("lets a heavier runner's weight-based carbs exceed the race baseline", () => {
    // 100kg * 0.7 = 70g/hr, above the 45g/hr half-marathon baseline
    const { result } = calculateFuelPlan({
      raceType: "Half",
      weight: "100",
      timeHours: "1",
      timeMinutes: "45",
    });
    expect(result?.carbsPerHour).toBe(70);
  });

  it("respects an explicit custom carbs/hour override regardless of weight", () => {
    const { result } = calculateFuelPlan({
      raceType: "Half",
      weight: "100",
      timeHours: "1",
      timeMinutes: "45",
      customCarbsPerHour: 60,
    });
    expect(result?.carbsPerHour).toBe(60);
  });

  it("computes total carbs and calories from duration and carbs/hour", () => {
    const { result } = calculateFuelPlan({
      raceType: "Half",
      weight: "",
      timeHours: "2",
      timeMinutes: "0",
    });
    // 2 hours * 45g/hr = 90g carbs, 90 * 4 kcal/g = 360 kcal
    expect(result?.totalCarbs).toBe(90);
    expect(result?.totalCalories).toBe(360);
  });

  it("reads 10K finish time directly from minutes, not hours+minutes", () => {
    const { result, isValid } = calculateFuelPlan({
      raceType: "10K",
      weight: "",
      timeHours: "1", // should be ignored for 10K
      timeMinutes: "50",
    });
    expect(isValid).toBe(true);
    // 50 minutes = 0.8333 hours * 30g/hr baseline = 25g
    expect(result?.totalCarbs).toBe(25);
  });

  it("generates no fuel stops for races under an hour", () => {
    const { result } = calculateFuelPlan({
      raceType: "10K",
      weight: "",
      timeHours: "",
      timeMinutes: "45",
    });
    expect(result?.fuelStops).toEqual([]);
  });

  it("generates fuel stops for races over an hour", () => {
    const { result } = calculateFuelPlan({
      raceType: "Full",
      weight: "",
      timeHours: "4",
      timeMinutes: "0",
    });
    expect(result?.fuelStops.length).toBeGreaterThan(0);
  });

  it("caps gels needed at the configured maximum", () => {
    const { result } = calculateFuelPlan({
      raceType: "Full",
      weight: "",
      timeHours: "8",
      timeMinutes: "0",
    });
    expect(result?.gelsNeeded).toBeLessThanOrEqual(7);
  });
});

describe("getFinishTimeInMinutes", () => {
  it("reads minutes only for a 10K", () => {
    expect(getFinishTimeInMinutes("10K", "1", "50")).toBe(50);
  });

  it("combines hours and minutes for non-10K races", () => {
    expect(getFinishTimeInMinutes("Full", "3", "45")).toBe(3 * 60 + 45);
  });
});
