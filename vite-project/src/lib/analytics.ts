/**
 * One entry point for product analytics.
 *
 * Events currently go to BOTH Google Analytics and PostHog. That is
 * deliberate and temporary: GA has carried every funnel event in this app for
 * a long time, and PostHog had almost no custom instrumentation, so switching
 * in one step would have thrown the history away. Sending to both lets the two
 * be compared over a real window before GA is retired.
 *
 * When GA is retired, delete the ReactGA line below and the `react-ga4`
 * dependency. No call site has to change.
 */
import ReactGA from "react-ga4";
import posthog from "posthog-js";

export interface TrackedEvent {
  /** Broad area, e.g. "Pace Calculator". Maps to GA's event category. */
  category: string;
  /** What happened, e.g. "Saved Plan to Dashboard". Maps to GA's action. */
  action: string;
  /** Free-form detail, e.g. the race type or distance. */
  label?: string;
  /** Numeric detail, e.g. a finish time in minutes. */
  value?: number;
}

/**
 * GA keys events on category + action; PostHog keys on a single name and
 * prefers snake_case. "Pace Calculator" + "Saved Plan to Dashboard" becomes
 * "pace_calculator_saved_plan_to_dashboard".
 *
 * Category and action are also sent as properties, so a PostHog query can
 * still group by area without parsing the name.
 */
export function toPostHogEventName(category: string, action: string): string {
  return `${category} ${action}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function trackEvent(event: TrackedEvent): void {
  const { category, action, label, value } = event;

  // Analytics sits on core paths now — saving a plan, calculating paces. A
  // throw here (an ad blocker, a missing PostHog key, a network failure) must
  // never take a user flow down with it. Each vendor is isolated so one
  // failing does not stop the other.
  try {
    ReactGA.event(event);
  } catch (error) {
    console.warn("GA event failed", error);
  }

  try {
    posthog.capture(toPostHogEventName(category, action), {
      category,
      action,
      ...(label !== undefined ? { label } : {}),
      ...(value !== undefined ? { value } : {}),
    });
  } catch (error) {
    console.warn("PostHog event failed", error);
  }
}
