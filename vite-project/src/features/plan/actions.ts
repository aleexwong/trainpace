/**
 * Training Plan — Firestore write actions (outside of hooks so they're easy
 * to call from optimistic-update flows like usePlanProgress.toggle).
 */

import { doc, updateDoc, deleteField, type FieldValue } from "firebase/firestore";
import { db } from "../../lib/firebase";
import type { TrainingWeek } from "./types";

/**
 * Toggle a single workout's completion state via a dot-path partial update
 * (`completedWorkouts.${key}`), so concurrent devices toggling different
 * workouts merge instead of clobbering each other's writes.
 *
 * Pass an ISO timestamp to mark complete, or `null` to clear it.
 */
export async function updateTrainingPlanProgress(
  planId: string,
  key: string,
  value: string | null
): Promise<void> {
  await updateDoc(doc(db, "user_training_plans", planId), {
    [`completedWorkouts.${key}`]: value ?? deleteField(),
  });
}

/**
 * Persist a schedule edit (workout moved/swapped to another day): rewrite the
 * `weeks` array and migrate the affected completion keys in one atomic
 * update. Firestore can't address array indices via field paths, so the
 * whole (small, ≤20-entry) array is replaced; completion keys stay dot-path
 * partial updates so other devices' concurrent toggles on other keys merge.
 */
export async function updateTrainingPlanSchedule(
  planId: string,
  weeks: TrainingWeek[],
  completionDelta: Record<string, string | null>
): Promise<void> {
  const update: Record<string, TrainingWeek[] | string | FieldValue> = { weeks };
  for (const [key, value] of Object.entries(completionDelta)) {
    update[`completedWorkouts.${key}`] = value ?? deleteField();
  }
  await updateDoc(doc(db, "user_training_plans", planId), update);
}
