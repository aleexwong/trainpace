import { useState, useEffect, useCallback } from "react";
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { TrainingPlan } from "../../plan/types";

export function useTrainingPlans(userId: string | undefined) {
  const [trainingPlans, setTrainingPlans] = useState<TrainingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const q = query(
        collection(db, "user_training_plans"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const plans = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as TrainingPlan[];
      setTrainingPlans(plans);
    } catch (_e) {
      setError("Failed to load training plans.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadPlans(); }, [loadPlans]);

  const removePlan = useCallback(async (planId: string) => {
    await deleteDoc(doc(db, "user_training_plans", planId));
    setTrainingPlans((prev) => prev.filter((p) => p.id !== planId));
  }, []);

  return { trainingPlans, loading, error, removePlan };
}
