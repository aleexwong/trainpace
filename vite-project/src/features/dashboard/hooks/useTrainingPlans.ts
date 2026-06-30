import { useState, useEffect, useCallback, useRef } from "react";
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { TrainingPlan } from "../../plan/types";

export function useTrainingPlans(userId: string | undefined) {
  const [trainingPlans, setTrainingPlans] = useState<TrainingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Used to discard stale Firestore responses when userId changes mid-flight.
  const currentUserIdRef = useRef(userId);

  useEffect(() => { currentUserIdRef.current = userId; }, [userId]);

  const loadPlans = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    const requestUserId = userId;
    try {
      setLoading(true);
      setError(null);
      const q = query(
        collection(db, "user_training_plans"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      if (currentUserIdRef.current !== requestUserId) return;
      const plans = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as TrainingPlan[];
      setTrainingPlans(plans);
    } catch (_e) {
      if (currentUserIdRef.current === requestUserId) {
        setError("Failed to load training plans.");
      }
    } finally {
      if (currentUserIdRef.current === requestUserId) {
        setLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => { loadPlans(); }, [loadPlans]);

  const removePlan = useCallback(async (planId: string) => {
    try {
      await deleteDoc(doc(db, "user_training_plans", planId));
      setTrainingPlans((prev) => prev.filter((p) => p.id !== planId));
    } catch (_e) {
      setError("Failed to delete training plan. Please try again.");
    }
  }, []);

  return { trainingPlans, loading, error, removePlan };
}
