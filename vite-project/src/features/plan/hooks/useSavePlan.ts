import { useState, useCallback } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { TrainingPlan } from "../types";
import { readGuestProgress, clearGuestProgress } from "../utils/planPersistence";

export function useSavePlan() {
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(async (plan: TrainingPlan, userId: string) => {
    setSaving(true);
    setError(null);
    try {
      // Carry over any guest-mode ticks (from before sign-in, or from a
      // signed-in user viewing an unsaved plan) into the saved doc.
      const docRef = await addDoc(collection(db, "user_training_plans"), {
        ...plan,
        userId,
        completedWorkouts: readGuestProgress() ?? {},
        createdAt: serverTimestamp(),
      });
      setSavedId(docRef.id);
      // Safe to clear even though TrainingPlanGenerator also clears this
      // once savedId lands — belt-and-suspenders for other save callers.
      clearGuestProgress();
    } catch (_e) {
      setError("Failed to save plan. Please try again.");
    } finally {
      setSaving(false);
    }
  }, []);

  return { save, saving, savedId, error };
}
