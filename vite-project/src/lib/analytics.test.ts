import { describe, it, expect } from "vitest";
import { toPostHogEventName } from "./analytics";

describe("toPostHogEventName", () => {
  it("joins category and action into a snake_case name", () => {
    expect(toPostHogEventName("Pace Calculator", "Saved Plan to Dashboard")).toBe(
      "pace_calculator_saved_plan_to_dashboard"
    );
    expect(toPostHogEventName("Fuel Planner", "Copied Plan")).toBe(
      "fuel_planner_copied_plan"
    );
  });

  it("collapses punctuation rather than emitting it", () => {
    // This action really exists: "AI Feedback - Helpful". A naive replace
    // would leave a double underscore around the dash.
    expect(toPostHogEventName("Fuel Planner", "AI Feedback - Helpful")).toBe(
      "fuel_planner_ai_feedback_helpful"
    );
  });

  it("never leaves a leading or trailing underscore", () => {
    expect(toPostHogEventName("  Spaced  ", "  Out  ")).toBe("spaced_out");
  });

  it("is stable for the same input", () => {
    const a = toPostHogEventName("VDOT Calculator", "Calculated VDOT");
    const b = toPostHogEventName("VDOT Calculator", "Calculated VDOT");
    expect(a).toBe(b);
    expect(a).toBe("vdot_calculator_calculated_vdot");
  });
});
