import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { PacePlan } from "../types";

export function usePacePlans(userId: string | undefined) {
  const [pacePlans, setPacePlans] = useState<PacePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    loadPacePlans();
  }, [userId]);

  const loadPacePlans = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const pacePlansQuery = query(
        collection(db, "user_pace_plans"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(pacePlansQuery);
      const plans = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PacePlan[];

      // Sort by race date if available, otherwise by created date
      plans.sort((a, b) => {
        // If both have race dates, sort by race date (ascending - upcoming races first)
        if (a.raceDate && b.raceDate) {
          return new Date(a.raceDate).getTime() - new Date(b.raceDate).getTime();
        }
        // Plans with race dates come first
        if (a.raceDate && !b.raceDate) return -1;
        if (!a.raceDate && b.raceDate) return 1;
        // Otherwise sort by creation date (newest first)
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      });

      setPacePlans(plans);
    } catch (err) {
      console.error("Error loading pace plans:", err);
      setError("Failed to load pace plans");
    } finally {
      setLoading(false);
    }
  };

  const removePacePlan = (planId: string) => {
    setPacePlans((prev) => prev.filter((p) => p.id !== planId));
  };

  const updatePacePlan = (
    planId: string,
    updates: Partial<Pick<PacePlan, "planName" | "notes" | "raceDate">>
  ) => {
    setPacePlans((prev) =>
      prev.map((p) => (p.id === planId ? { ...p, ...updates } : p))
    );
  };

  return {
    pacePlans,
    loading,
    error,
    reload: loadPacePlans,
    removePacePlan,
    updatePacePlan,
  };
}
