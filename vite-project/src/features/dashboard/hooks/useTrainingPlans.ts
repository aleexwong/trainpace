import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { listTrainingPlans, deleteTrainingPlan } from "@/features/training-plan-builder/utils/planApiClient";

export interface TrainingPlanSummary {
  planId: string;
  planName: string | null;
  distance: string;
  goalTime: number;
  raceDate: string;
  totalWeeks: number;
  experienceLevel: string;
  status: "draft" | "active" | "completed" | "archived";
  createdAt: string | null;
  updatedAt: string | null;
  lastAccessedAt: string | null;
}

export function useTrainingPlans() {
  const { user } = useAuth();
  const [trainingPlans, setTrainingPlans] = useState<TrainingPlanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTrainingPlans = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await listTrainingPlans();
      
      // Sort by race date (upcoming first), then by updated date
      const sortedPlans = response.plans.sort((a, b) => {
        // Active plans first
        if (a.status === "active" && b.status !== "active") return -1;
        if (a.status !== "active" && b.status === "active") return 1;
        
        // Then by race date (upcoming first)
        if (a.raceDate && b.raceDate) {
          return new Date(a.raceDate).getTime() - new Date(b.raceDate).getTime();
        }
        if (a.raceDate && !b.raceDate) return -1;
        if (!a.raceDate && b.raceDate) return 1;
        
        // Then by updated date (newest first)
        const aUpdated = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bUpdated = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return bUpdated - aUpdated;
      });

      setTrainingPlans(sortedPlans);
    } catch (err) {
      console.error("Error loading training plans:", err);
      setError("Failed to load training plans");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadTrainingPlans();
  }, [loadTrainingPlans]);

  const removeTrainingPlan = async (planId: string) => {
    try {
      await deleteTrainingPlan(planId);
      setTrainingPlans((prev) => prev.filter((p) => p.planId !== planId));
      return true;
    } catch (err) {
      console.error("Error deleting training plan:", err);
      throw err;
    }
  };

  return {
    trainingPlans,
    loading,
    error,
    reload: loadTrainingPlans,
    removeTrainingPlan,
  };
}
