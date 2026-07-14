/**
 * Training Plan — Firestore write actions (outside of hooks so they're easy
 * to call from optimistic-update flows like usePlanProgress.toggle).
 */

import { doc, updateDoc, deleteField } from "firebase/firestore";
import { db } from "../../lib/firebase";

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
