/**
 * useTrainingGoals — load & save the athlete's goal profile.
 *
 * Single Firestore doc per user (doc id === userId) in `user_training_goals`.
 * Mirrors the shape of the dashboard data hooks: { goals, loading, error, ... }.
 */

import { useCallback, useEffect, useState } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { RaceGoalProfile, RaceGoalProfileInput } from "../types";

const COLLECTION = "user_training_goals";

export function useTrainingGoals(userId: string | undefined) {
  const [goals, setGoals] = useState<RaceGoalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGoals = useCallback(async () => {
    if (!userId) {
      setGoals(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const snap = await getDoc(doc(db, COLLECTION, userId));
      setGoals(snap.exists() ? (snap.data() as RaceGoalProfile) : null);
    } catch (err) {
      console.error("Failed to load training goals:", err);
      setError("Failed to load training goals");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const saveGoals = useCallback(
    async (data: RaceGoalProfileInput) => {
      if (!userId) return;

      const isFirstSave = goals === null;
      const payload = {
        ...data,
        userId,
        updatedAt: serverTimestamp(),
        ...(isFirstSave ? { createdAt: serverTimestamp() } : {}),
      };

      await setDoc(doc(db, COLLECTION, userId), payload, { merge: true });
      setGoals((prev) => ({ ...(prev ?? {}), ...payload } as RaceGoalProfile));
    },
    [userId, goals]
  );

  return { goals, loading, error, saveGoals, reload: loadGoals };
}
