import { useState, useCallback } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { TrainingPlan } from "../types";

export function useSavePlan() {
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(async (plan: TrainingPlan, userId: string) => {
    setSaving(true);
    setError(null);
    try {
      const docRef = await addDoc(collection(db, "user_training_plans"), {
        ...plan,
        userId,
        createdAt: serverTimestamp(),
      });
      setSavedId(docRef.id);
    } catch (_e) {
      setError("Failed to save plan. Please try again.");
    } finally {
      setSaving(false);
    }
  }, []);

  return { save, saving, savedId, error };
}
