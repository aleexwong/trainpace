/**
 * Tutorial Feature - State machine
 *
 * Holds the whole tour lifecycle in one place so the invite card, the launcher
 * button and the spotlight overlay all read from the same source of truth.
 *
 *   idle ──(start)──▶ running ──(finish last step)──▶ completed
 *                        │
 *                        └──(close/escape)──▶ exited
 *
 * Analytics fire from the transitions here rather than from the components, so
 * an event can't be missed just because a card unmounted early.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  trackInviteAccepted,
  trackInviteDismissed,
  trackInviteShown,
  trackStepBack,
  trackStepCompleted,
  trackStepTargetMissing,
  trackStepViewed,
  trackTourCompleted,
  trackTourExited,
  trackTourStarted,
} from "./analytics";
import { getTutorialRecord, shouldOfferInvite, updateTutorialRecord } from "./storage";
import type {
  StepAdvanceMethod,
  TutorialExitReason,
  TutorialSource,
  TutorialStatus,
  TutorialStep,
  TutorialTour,
} from "./types";

interface TutorialContextValue {
  tour: TutorialTour;
  status: TutorialStatus;
  stepIndex: number;
  step: TutorialStep | null;
  isRunning: boolean;
  /** True when the invite card is allowed to appear on this device. */
  inviteEligible: boolean;
  start: (source: TutorialSource) => void;
  next: (method: StepAdvanceMethod) => void;
  back: () => void;
  exit: (reason: TutorialExitReason) => void;
  acceptInvite: () => void;
  dismissInvite: (method: "no_thanks" | "close") => void;
  /** Called by the invite card once it is genuinely on screen. */
  markInviteShown: () => void;
  /** Called by the overlay when a step's selector never resolves. */
  reportTargetMissing: (selector: string) => void;
}

const TutorialContext = createContext<TutorialContextValue | null>(null);

export function useTutorial(): TutorialContextValue {
  const ctx = useContext(TutorialContext);
  if (!ctx) {
    throw new Error("useTutorial must be used inside a <TutorialProvider>");
  }
  return ctx;
}

interface TutorialProviderProps {
  tour: TutorialTour;
  /** Where the invite is being offered — recorded on invite events. */
  surface: string;
  /** Start immediately on mount, e.g. when the URL carries ?tour=1. */
  autoStart?: boolean;
  children: ReactNode;
}

export function TutorialProvider({
  tour,
  surface,
  autoStart = false,
  children,
}: TutorialProviderProps) {
  const [status, setStatus] = useState<TutorialStatus>("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const [inviteEligible, setInviteEligible] = useState(false);

  // Timing + counters live in refs: they feed analytics, never the render.
  const tourStartedAt = useRef(0);
  const stepEnteredAt = useRef(0);
  const inviteShownAt = useRef(0);
  const interactions = useRef(0);
  /** Guards against StrictMode's double-invoked effects duplicating events. */
  const lastViewedKey = useRef<string | null>(null);

  const totalSteps = tour.steps.length;
  const step = status === "running" ? tour.steps[stepIndex] ?? null : null;

  const stepProps = useCallback(
    (index: number) => ({
      tour_id: tour.id,
      step_id: tour.steps[index]?.id ?? "unknown",
      step_index: index,
      total_steps: totalSteps,
    }),
    [tour.id, tour.steps, totalSteps]
  );

  // ── Invite eligibility ──────────────────────────────────────────────────────
  // Read once on mount so a returning visitor never sees a flash of the card.
  useEffect(() => {
    if (autoStart) return;
    setInviteEligible(shouldOfferInvite(tour.id));
  }, [tour.id, autoStart]);

  // ── Start ───────────────────────────────────────────────────────────────────

  const start = useCallback(
    (source: TutorialSource) => {
      const record = getTutorialRecord(tour.id);
      const timesStarted = (record.timesStarted ?? 0) + 1;
      updateTutorialRecord(tour.id, {
        lastStartedAt: new Date().toISOString(),
        timesStarted,
      });

      tourStartedAt.current = Date.now();
      stepEnteredAt.current = Date.now();
      interactions.current = 0;
      lastViewedKey.current = null;

      setInviteEligible(false);
      setStepIndex(0);
      setStatus("running");

      trackTourStarted({
        tour_id: tour.id,
        source,
        total_steps: totalSteps,
        times_started: timesStarted,
      });
    },
    [tour.id, totalSteps]
  );

  useEffect(() => {
    if (autoStart) start("url");
    // Deliberately mount-only: ?tour=1 should fire exactly once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Step views ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (status !== "running") return;
    const key = `${stepIndex}`;
    if (lastViewedKey.current === key) return;
    lastViewedKey.current = key;
    stepEnteredAt.current = Date.now();
    trackStepViewed(stepProps(stepIndex));
  }, [status, stepIndex, stepProps]);

  // ── Advance / rewind / finish ───────────────────────────────────────────────

  const finish = useCallback(() => {
    updateTutorialRecord(tour.id, {
      completedAt: new Date().toISOString(),
      lastStepId: undefined,
    });
    setStatus("completed");
    trackTourCompleted({
      tour_id: tour.id,
      total_ms: Date.now() - tourStartedAt.current,
      total_steps: totalSteps,
      interactions: interactions.current,
    });
  }, [tour.id, totalSteps]);

  const next = useCallback(
    (method: StepAdvanceMethod) => {
      if (status !== "running") return;

      if (method === "click") interactions.current += 1;
      trackStepCompleted({
        ...stepProps(stepIndex),
        method,
        ms_on_step: Date.now() - stepEnteredAt.current,
      });

      if (stepIndex >= totalSteps - 1) {
        finish();
        return;
      }
      setStepIndex((i) => i + 1);
    },
    [status, stepIndex, totalSteps, stepProps, finish]
  );

  const back = useCallback(() => {
    if (status !== "running" || stepIndex === 0) return;
    trackStepBack(stepProps(stepIndex));
    // Re-viewing a step should re-fire step_viewed, so clear the dedupe key.
    lastViewedKey.current = null;
    setStepIndex((i) => Math.max(0, i - 1));
  }, [status, stepIndex, stepProps]);

  const exit = useCallback(
    (reason: TutorialExitReason) => {
      if (status !== "running") return;
      updateTutorialRecord(tour.id, {
        dismissedAt: new Date().toISOString(),
        lastStepId: tour.steps[stepIndex]?.id,
      });
      setStatus("exited");
      trackTourExited({
        ...stepProps(stepIndex),
        reason,
        total_ms: Date.now() - tourStartedAt.current,
        progress_pct: Math.round((stepIndex / Math.max(1, totalSteps - 1)) * 100),
      });
    },
    [status, stepIndex, totalSteps, tour.id, tour.steps, stepProps]
  );

  const reportTargetMissing = useCallback(
    (selector: string) => {
      trackStepTargetMissing({ ...stepProps(stepIndex), selector });
    },
    [stepIndex, stepProps]
  );

  // ── Invite ──────────────────────────────────────────────────────────────────

  const acceptInvite = useCallback(() => {
    trackInviteAccepted({
      tour_id: tour.id,
      surface,
      ms_to_decision: inviteShownAt.current ? Date.now() - inviteShownAt.current : 0,
    });
    start("invite");
  }, [tour.id, surface, start]);

  const dismissInvite = useCallback(
    (method: "no_thanks" | "close") => {
      updateTutorialRecord(tour.id, { dismissedAt: new Date().toISOString() });
      setInviteEligible(false);
      trackInviteDismissed({
        tour_id: tour.id,
        surface,
        method,
        ms_to_decision: inviteShownAt.current ? Date.now() - inviteShownAt.current : 0,
      });
    },
    [tour.id, surface]
  );

  /**
   * Called by the invite card once it is genuinely on screen — after its entry
   * delay, not when it merely became eligible. Idempotent, so StrictMode's
   * double-mount can't double-count the top of the funnel.
   */
  const markInviteShown = useCallback(() => {
    if (inviteShownAt.current) return;
    inviteShownAt.current = Date.now();
    trackInviteShown({ tour_id: tour.id, surface });
  }, [tour.id, surface]);

  const value = useMemo<TutorialContextValue>(
    () => ({
      tour,
      status,
      stepIndex,
      step,
      isRunning: status === "running",
      inviteEligible,
      start,
      next,
      back,
      exit,
      acceptInvite,
      dismissInvite,
      markInviteShown,
      reportTargetMissing,
    }),
    [
      tour,
      status,
      stepIndex,
      step,
      inviteEligible,
      start,
      next,
      back,
      exit,
      acceptInvite,
      dismissInvite,
      markInviteShown,
      reportTargetMissing,
    ]
  );

  return (
    <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>
  );
}
