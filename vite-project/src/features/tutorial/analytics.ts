/**
 * Tutorial Feature - PostHog analytics
 *
 * The whole point of instrumenting this is to answer "does anyone actually use
 * the tour, and does it help?", so the taxonomy is built around a funnel:
 *
 *   tutorial_invite_shown
 *     → tutorial_invite_accepted        (vs tutorial_invite_dismissed)
 *     → tutorial_started
 *     → tutorial_step_viewed  ×N        (per-step drop-off)
 *     → tutorial_completed              (vs tutorial_exited)
 *
 * Every event carries `tour_id` so a second tour can be added without
 * rewriting any insight. Step events carry `step_id` + `step_index` so the
 * funnel survives copy edits and step reordering.
 *
 * Completion also writes person properties (`trainpace_tutorial_completed`,
 * `trainpace_tutorial_completed_at`) so downstream behaviour — plans saved,
 * return visits — can be split by whether someone took the tour. That
 * comparison is the actual question behind "do people use this thing".
 *
 * See TUTORIAL_ANALYTICS.md at the repo root for the full property reference
 * and the insights worth building from it. (Docs live there because
 * vite-project/.gitignore ignores *.md.)
 */

import posthog from "posthog-js";
import type { StepAdvanceMethod, TutorialExitReason, TutorialSource } from "./types";

// Type aliases rather than interfaces on purpose: only aliases get an implicit
// index signature, which is what lets them satisfy PostHog's Properties bag.

/** Shared shape carried by every tutorial event. */
type BaseProps = {
  tour_id: string;
};

type StepProps = BaseProps & {
  step_id: string;
  step_index: number;
  total_steps: number;
};

/**
 * PostHog is optional in local/preview builds — the provider is mounted with an
 * empty key when the env var is missing, and calling capture() on an
 * uninitialised client logs noise on every step. Bail out quietly instead.
 */
function isEnabled(): boolean {
  if (!import.meta.env.VITE_PUBLIC_POSTHOG_KEY) return false;
  return typeof posthog?.capture === "function" && posthog.__loaded;
}

function capture(event: string, props: Record<string, unknown>): void {
  if (!isEnabled()) return;
  try {
    posthog.capture(event, props);
  } catch {
    // Analytics must never break the tour.
  }
}

/** Person properties, so tour-takers can be compared against everyone else. */
function setPerson(
  set: Record<string, unknown>,
  setOnce?: Record<string, unknown>
): void {
  if (!isEnabled()) return;
  try {
    posthog.setPersonProperties(set, setOnce);
  } catch {
    // no-op
  }
}

// ─── Invite ──────────────────────────────────────────────────────────────────

export function trackInviteShown(p: BaseProps & { surface: string }): void {
  capture("tutorial_invite_shown", p);
  // First-touch timestamp, useful as a cohort anchor.
  setPerson({}, { trainpace_tutorial_first_seen_at: new Date().toISOString() });
}

export function trackInviteAccepted(
  p: BaseProps & { surface: string; ms_to_decision: number }
): void {
  capture("tutorial_invite_accepted", p);
}

export function trackInviteDismissed(
  p: BaseProps & {
    surface: string;
    /** Which control they used — "no_thanks" reads very differently from "close". */
    method: "no_thanks" | "close";
    ms_to_decision: number;
  }
): void {
  capture("tutorial_invite_dismissed", p);
}

// ─── Tour lifecycle ──────────────────────────────────────────────────────────

export function trackTourStarted(
  p: BaseProps & { source: TutorialSource; total_steps: number; times_started: number }
): void {
  capture("tutorial_started", p);
}

export function trackStepViewed(p: StepProps): void {
  capture("tutorial_step_viewed", p);
}

export function trackStepCompleted(
  p: StepProps & { method: StepAdvanceMethod; ms_on_step: number }
): void {
  capture("tutorial_step_completed", p);
}

export function trackStepBack(p: StepProps): void {
  capture("tutorial_step_back", p);
}

/**
 * The spotlight target never showed up — either the user went off-script or the
 * page changed and a selector rotted. Worth an alert if it ever spikes.
 */
export function trackStepTargetMissing(p: StepProps & { selector: string }): void {
  capture("tutorial_step_target_missing", p);
}

export function trackTourCompleted(
  p: BaseProps & {
    total_ms: number;
    total_steps: number;
    /** How many steps were satisfied by a real click rather than the Next button. */
    interactions: number;
  }
): void {
  capture("tutorial_completed", p);
  setPerson({
    trainpace_tutorial_completed: true,
    trainpace_tutorial_completed_at: new Date().toISOString(),
  });
}

export function trackTourExited(
  p: StepProps & {
    reason: TutorialExitReason;
    total_ms: number;
    /** 0–100, rounded. Makes "where do people quit" a one-line insight. */
    progress_pct: number;
  }
): void {
  capture("tutorial_exited", p);
}
