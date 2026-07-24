/**
 * Training Plan — Schedule Editing (drag-reschedule)
 *
 * Owns applying a workout move/swap and persisting it: unsaved plans write
 * the localStorage draft + guest progress map; saved plans update local
 * state optimistically, then commit the rewritten `weeks` array and the
 * completion-key migration atomically to Firestore, rolling both back on
 * failure (same optimistic pattern as usePlanProgress.toggle).
 */

import { useCallback, useState } from "react";
import type { TrainingPlan } from "../types";
import { applyWorkoutMove, canMoveWorkout, type WorkoutMove } from "../utils/planEdit";
import { saveDraftPlan, writeGuestProgress } from "../utils/planPersistence";
import { updateTrainingPlanSchedule } from "../actions";

interface UsePlanEditorArgs {
  plan: TrainingPlan | null;
  /** Firestore doc id once saved; undefined = unsaved (draft/guest). */
  planId?: string;
  /** Current completion map, from usePlanProgress. */
  completed: Record<string, string>;
  onPlanChange: (next: TrainingPlan) => void;
  onCompletedChange: (next: Record<string, string>) => void;
}

export interface PlanEditor {
  canMove: (move: WorkoutMove) => boolean;
  moveWorkout: (move: WorkoutMove) => void;
  moveError: string | null;
}

export function usePlanEditor({
  plan,
  planId,
  completed,
  onPlanChange,
  onCompletedChange,
}: UsePlanEditorArgs): PlanEditor {
  const [moveError, setMoveError] = useState<string | null>(null);

  const canMove = useCallback(
    (move: WorkoutMove) => (plan ? canMoveWorkout(plan, move) : false),
    [plan]
  );

  const moveWorkout = useCallback(
    (move: WorkoutMove) => {
      if (!plan) return;
      const result = applyWorkoutMove(plan, completed, move);
      if (!result) return;

      const previousPlan = plan;
      const previousCompleted = completed;

      onPlanChange(result.plan);
      onCompletedChange(result.completed);
      setMoveError(null);

      if (planId) {
        updateTrainingPlanSchedule(planId, result.plan.weeks, result.completionDelta).catch(() => {
          onPlanChange(previousPlan);
          onCompletedChange(previousCompleted);
          setMoveError("Couldn't save that change — check your connection and try again.");
        });
      } else {
        try {
          saveDraftPlan(result.plan);
          writeGuestProgress(result.completed);
        } catch {
          // localStorage unavailable — the in-memory move still applies.
        }
      }
    },
    [plan, planId, completed, onPlanChange, onCompletedChange]
  );

  return { canMove, moveWorkout, moveError };
}
