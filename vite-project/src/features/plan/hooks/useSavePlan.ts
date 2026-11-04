/**
 * Training Plan — Save to the signed-in user's account.
 *
 * Writes to `user_training_plans/{plan.id}` using the id minted at generation
 * time (see `newPlanId` in plan-math.ts) rather than letting Firestore assign
 * one. That makes saving idempotent: a second Save click, or the post-sign-in
 * auto-save racing a manual one, updates the same doc instead of littering the
 * dashboard with duplicates of the same plan.
 *
 * The doc is pinned to the account via `userId`, which firestore.rules
 * requires to equal the requester's uid on create.
 *
 * Note there is deliberately no read-before-write here: the read rule for this
 * collection is `resource.data.userId == request.auth.uid`, which denies a get
 * on a not-yet-existing doc, so a `getDoc` probe would fail on every first
 * save. First-vs-repeat save is decided from the in-memory plan instead.
 */

import { useState, useCallback } from "react";
import { FirebaseError } from "firebase/app";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { newPlanId } from "../plan-math";
import type { TrainingPlan } from "../types";
import { readGuestProgress, clearGuestProgress } from "../utils/planPersistence";

export function useSavePlan() {
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(async (plan: TrainingPlan, userId: string) => {
    setSaving(true);
    setError(null);

    // Strip the fields this hook owns out of the spread: `id` is set from the
    // resolved doc id, and `createdAt` on a dashboard-loaded plan is a plain
    // `{seconds}` shape that must not be written back over a real Timestamp.
    const { id: _id, createdAt, userId: _userId, ...planFields } = plan;

    // A plan that already carries a createdAt came back from Firestore, so
    // this is a re-save; leave the original timestamp alone rather than
    // reshuffling the plan to the top of the dashboard's createdAt ordering.
    const alreadyPersisted = createdAt != null || savedId != null;

    async function write(planId: string) {
      await setDoc(
        doc(db, "user_training_plans", planId),
        {
          ...planFields,
          id: planId,
          userId,
          // Carry over any guest-mode ticks (from before sign-in, or from a
          // signed-in user viewing an unsaved plan) into the saved doc.
          completedWorkouts: readGuestProgress() ?? {},
          ...(alreadyPersisted
            ? { updatedAt: serverTimestamp() }
            : { createdAt: serverTimestamp() }),
        },
        // Merge so a re-save layers onto the doc rather than replacing it —
        // completion ticks already in Firestore survive an empty guest map.
        { merge: true }
      );
    }

    try {
      // Drafts generated before plans carried ids (and the fallback path) get
      // one here, so every save still lands on a known document.
      const planId = plan.id ?? newPlanId();
      try {
        await write(planId);
        setSavedId(planId);
      } catch (e) {
        // A draft restored from localStorage can carry an id owned by another
        // account (shared device, switched login). Rules reject that write —
        // save it as this user's own copy under a fresh id instead.
        if (e instanceof FirebaseError && e.code === "permission-denied") {
          const freshId = newPlanId();
          await write(freshId);
          setSavedId(freshId);
        } else {
          throw e;
        }
      }
      // Safe to clear even though TrainingPlanGenerator also clears this
      // once savedId lands — belt-and-suspenders for other save callers.
      clearGuestProgress();
    } catch (_e) {
      setError("Failed to save plan. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [savedId]);

  return { save, saving, savedId, error };
}
