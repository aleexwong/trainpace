import { describe, it, expect, vi, beforeEach } from "vitest";
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

// ---------------------------------------------------------------------------
// trackEvent — vendor isolation
//
// This is the part of the module with real logic: analytics now sits on core
// paths like saving a plan, so one vendor throwing (an ad blocker, a missing
// PostHog key, a network failure) must not take a user flow down with it, and
// must not stop the other vendor from receiving the event.
// ---------------------------------------------------------------------------

vi.mock("react-ga4", () => ({ default: { event: vi.fn() } }));
vi.mock("posthog-js", () => ({ default: { capture: vi.fn() } }));

describe("trackEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("sends the event to both vendors", async () => {
    const { trackEvent } = await import("./analytics");
    const ReactGA = (await import("react-ga4")).default;
    const posthog = (await import("posthog-js")).default;

    trackEvent({ category: "Fuel Planner", action: "Copied Plan", label: "Half" });

    expect(ReactGA.event).toHaveBeenCalledWith({
      category: "Fuel Planner",
      action: "Copied Plan",
      label: "Half",
    });
    expect(posthog.capture).toHaveBeenCalledWith("fuel_planner_copied_plan", {
      category: "Fuel Planner",
      action: "Copied Plan",
      label: "Half",
    });
  });

  it("omits label and value when they are not supplied", async () => {
    const { trackEvent } = await import("./analytics");
    const posthog = (await import("posthog-js")).default;

    trackEvent({ category: "Pace Calculator", action: "Copied Plan" });

    const props = vi.mocked(posthog.capture).mock.calls[0][1];
    expect(props).not.toHaveProperty("label");
    expect(props).not.toHaveProperty("value");
  });

  it("still reaches PostHog when GA throws", async () => {
    const { trackEvent } = await import("./analytics");
    const ReactGA = (await import("react-ga4")).default;
    const posthog = (await import("posthog-js")).default;
    vi.mocked(ReactGA.event).mockImplementation(() => {
      throw new Error("blocked by an extension");
    });

    expect(() =>
      trackEvent({ category: "VDOT Calculator", action: "Calculated VDOT" })
    ).not.toThrow();
    expect(posthog.capture).toHaveBeenCalledTimes(1);
  });

  it("still reaches GA when PostHog throws", async () => {
    const { trackEvent } = await import("./analytics");
    const ReactGA = (await import("react-ga4")).default;
    const posthog = (await import("posthog-js")).default;
    vi.mocked(posthog.capture).mockImplementation(() => {
      throw new Error("posthog not initialised");
    });

    expect(() =>
      trackEvent({ category: "VDOT Calculator", action: "Calculated VDOT" })
    ).not.toThrow();
    expect(ReactGA.event).toHaveBeenCalledTimes(1);
  });

  it("does not throw when both vendors fail", async () => {
    const { trackEvent } = await import("./analytics");
    const ReactGA = (await import("react-ga4")).default;
    const posthog = (await import("posthog-js")).default;
    vi.mocked(ReactGA.event).mockImplementation(() => {
      throw new Error("ga down");
    });
    vi.mocked(posthog.capture).mockImplementation(() => {
      throw new Error("posthog down");
    });

    expect(() =>
      trackEvent({ category: "Fuel Planner", action: "Saved Plan to Dashboard" })
    ).not.toThrow();
  });
});
