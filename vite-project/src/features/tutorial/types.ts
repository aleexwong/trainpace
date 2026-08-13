/**
 * Tutorial Feature - Types
 *
 * A tour is an ordered list of steps. Each step optionally spotlights a real
 * element on the page (found by `target`, a CSS selector) and can require the
 * user to actually perform the action before advancing — that is the
 * "click-along" part, as opposed to a passive slideshow.
 */

/** Where the coach card sits relative to the spotlit element (desktop only). */
export type StepPlacement = "top" | "bottom" | "left" | "right" | "auto";

/** How a step was left behind — recorded on every step-completed event. */
export type StepAdvanceMethod = "click" | "next" | "skip" | "auto";

/**
 * Why a tour ended early. Backdrop clicks are deliberately not an exit — a
 * mis-click shouldn't throw away someone's progress mid-tour.
 */
export type TutorialExitReason = "close" | "escape" | "unmount";

/** What kicked the tour off — the key dimension for the "does anyone use it" question. */
export type TutorialSource = "invite" | "launcher" | "url";

export interface TutorialStepAction {
  /**
   * The DOM event that satisfies this step. The tour listens on the document
   * in the capture phase and advances when the event originates inside the
   * spotlit element, so the app's own handler still runs normally.
   */
  on: "click" | "input";
  /** Short imperative nudge shown on the card, e.g. "Tap a distance". */
  hint: string;
}

export interface TutorialStep {
  /** Stable across copy edits — this is what lands in PostHog. */
  id: string;
  title: string;
  body: string;
  /** CSS selector. Omit for a centered card with no spotlight (intro/outro). */
  target?: string;
  placement?: StepPlacement;
  /**
   * Require the user to do the thing before advancing. Steps without an action
   * advance on the Next button.
   */
  action?: TutorialStepAction;
  /**
   * The target only exists after an earlier step's action (e.g. the results
   * screen). The tour waits for it to appear, then falls back to an unanchored
   * card if it never does.
   */
  awaitTarget?: boolean;
  /** Extra breathing room around the cutout, in px. Default 8. */
  padding?: number;
}

export interface TutorialTour {
  /** Namespaces analytics + localStorage, so a second tour can be added later. */
  id: string;
  /** Human label used in the invite and launcher. */
  name: string;
  /** Rough duration promised in the invite, e.g. "60 seconds". */
  duration: string;
  steps: TutorialStep[];
}

export type TutorialStatus = "idle" | "running" | "completed" | "exited";

/** Persisted per tour, so a finished or declined tour never nags again. */
export interface TutorialRecord {
  completedAt?: string;
  dismissedAt?: string;
  lastStartedAt?: string;
  timesStarted?: number;
  /** Step the user bailed on, so we can offer to resume. */
  lastStepId?: string;
}
