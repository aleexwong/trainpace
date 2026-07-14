/**
 * Training Plan — Workout Completion Tracking
 *
 * Owns the `completedWorkouts` map for a single plan (guest localStorage or
 * a signed-in user's saved Firestore doc) and exposes read/toggle helpers
 * that consumers (WeekCard, ThisWeekCard, PlanOverview, PlanCalendar) use to
 * render and flip done-state. Consumes an already-loaded `plan` — never
 * fetches its own copy.
 *
 * Guest mode: `planId` is undefined → toggles write straight to
 * `trainpace_plan_progress` in localStorage.
 * Signed-in + saved: `planId` is set → toggles optimistically flip local
 * state, then persist via a dot-path Firestore update
 * (`updateTrainingPlanProgress`), rolling back just that one key on failure.
 */

import { useCallback, useMemo, useState } from "react";
import type { RunDay, TrainingPlan, TrainingWeek } from "../types";
import {
  currentWeekNumber as computeCurrentWeekNumber,
  isTrackableWorkout,
  nextWorkout as computeNextWorkout,
  workoutKey,
  type ScheduledWorkout,
} from "../utils/planSchedule";
import { readGuestProgress, writeGuestProgress } from "../utils/planPersistence";
import { updateTrainingPlanProgress } from "../actions";

export interface ProgressSummary {
  completedCount: number;
  totalCount: number;
  pct: number;
}

interface UsePlanProgressArgs {
  plan: TrainingPlan | null;
  planId?: string;
  userId?: string;
}

function summarize(days: { day: RunDay; trackable: boolean; done: boolean }[]): ProgressSummary {
  const trackableDays = days.filter((d) => d.trackable);
  const completedCount = trackableDays.filter((d) => d.done).length;
  const totalCount = trackableDays.length;
  return {
    completedCount,
    totalCount,
    pct: totalCount ? Math.round((completedCount / totalCount) * 100) : 0,
  };
}

export function usePlanProgress({ plan, planId }: UsePlanProgressArgs) {
  const [completed, setCompleted] = useState<Record<string, string>>(() => {
    if (planId) return plan?.completedWorkouts ?? {};
    return readGuestProgress() ?? {};
  });
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const isComplete = useCallback(
    (weekNumber: number, day: RunDay) => Boolean(completed[workoutKey(weekNumber, day)]),
    [completed]
  );

  const isPending = useCallback(
    (weekNumber: number, day: RunDay) => Boolean(pending[workoutKey(weekNumber, day)]),
    [pending]
  );

  const toggle = useCallback(
    (weekNumber: number, day: RunDay) => {
      if (!plan) return;
      const week = plan.weeks.find((w) => w.weekNumber === weekNumber);
      const trainingDay = week?.days.find((d) => d.day === day);
      if (!trainingDay || !isTrackableWorkout(trainingDay.workout)) return;

      const key = workoutKey(weekNumber, day);
      const previousValue = completed[key];
      const wasComplete = Boolean(previousValue);
      const nextValue = wasComplete ? undefined : new Date().toISOString();

      const nextMap = { ...completed };
      if (nextValue) nextMap[key] = nextValue;
      else delete nextMap[key];

      setCompleted(nextMap);
      setError(null);

      if (planId) {
        setPending((p) => ({ ...p, [key]: true }));
        updateTrainingPlanProgress(planId, key, nextValue ?? null)
          .catch(() => {
            setCompleted((curr) => {
              const rolledBack = { ...curr };
              if (wasComplete) rolledBack[key] = previousValue;
              else delete rolledBack[key];
              return rolledBack;
            });
            setError("Couldn't save that — check your connection and try again.");
          })
          .finally(() => {
            setPending((p) => {
              const next = { ...p };
              delete next[key];
              return next;
            });
          });
      } else {
        try {
          writeGuestProgress(nextMap);
        } catch {
          setError("Couldn't save progress locally.");
        }
      }
    },
    [plan, planId, completed]
  );

  const weekProgress = useCallback(
    (week: TrainingWeek): ProgressSummary =>
      summarize(
        week.days.map(({ day, workout }) => ({
          day,
          trackable: isTrackableWorkout(workout),
          done: Boolean(completed[workoutKey(week.weekNumber, day)]),
        }))
      ),
    [completed]
  );

  const planProgress = useMemo<ProgressSummary>(() => {
    if (!plan) return { completedCount: 0, totalCount: 0, pct: 0 };
    const days = plan.weeks.flatMap((week) =>
      week.days.map(({ day, workout }) => ({
        day,
        trackable: isTrackableWorkout(workout),
        done: Boolean(completed[workoutKey(week.weekNumber, day)]),
      }))
    );
    return summarize(days);
  }, [plan, completed]);

  const nextWorkoutValue = useMemo<ScheduledWorkout | null>(
    () => (plan ? computeNextWorkout(plan, completed) : null),
    [plan, completed]
  );

  const currentWeekNumberValue = useMemo<number | null>(
    () => (plan ? computeCurrentWeekNumber(plan) : null),
    [plan]
  );

  return {
    isComplete,
    toggle,
    isPending,
    weekProgress,
    planProgress,
    nextWorkout: nextWorkoutValue,
    currentWeekNumber: currentWeekNumberValue,
    error,
  };
}

export type PlanProgress = ReturnType<typeof usePlanProgress>;
