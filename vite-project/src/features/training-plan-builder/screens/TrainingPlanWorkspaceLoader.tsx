/**
 * Training Plan Workspace Loader
 * Loads plan from backend and displays workspace, or shows loading/error states
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlanScreen } from "./PlanScreen";
import { useTrainingPlanPersistence } from "../hooks/useTrainingPlanPersistence";
import { useAuth } from "@/features/auth/AuthContext";
import type { TrainingPlanWithStatus } from "../domain/types";

interface TrainingPlanWorkspaceLoaderProps {
  planId: string;
}

export function TrainingPlanWorkspaceLoader({ planId }: TrainingPlanWorkspaceLoaderProps) {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { loadPlan, isLoading } = useTrainingPlanPersistence();
  const [plan, setPlan] = useState<TrainingPlanWithStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth to finish loading before attempting to fetch
    if (authLoading) {
      console.log("[WorkspaceLoader] Auth still loading, waiting...");
      return;
    }

    // If auth is done and no user, redirect to login
    if (!user) {
      console.log("[WorkspaceLoader] No user after auth loaded, redirecting to login");
      navigate("/login");
      return;
    }

    async function fetchPlan() {
      console.log("[WorkspaceLoader] fetchPlan() called with planId:", planId);
      setError(null);
      try {
        const loadedPlan = await loadPlan(planId);
        console.log("[WorkspaceLoader] loadPlan returned:", loadedPlan);
        
        if (!loadedPlan) {
          setError("Plan not found or you don't have permission to view it.");
          return;
        }

        // Convert to TrainingPlanWithStatus - preserve status from backend
        const planWithStatus: TrainingPlanWithStatus = {
          ...loadedPlan,
          currentWeek: 1,
          weeks: loadedPlan.weeks.map((week) => {
            const completedCount = week.completedCount ?? week.workouts.filter((w: any) => w.status === "completed").length;
            const totalWorkouts = week.totalWorkouts ?? week.workouts.filter((w: any) => w.type !== "rest").length;
            
            return {
              ...week,
              completedCount,
              totalWorkouts,
              workouts: week.workouts.map((workout: any) => ({
                ...workout,
                status: workout.status || "pending",
              })),
            };
          }),
        };

        setPlan(planWithStatus);
      } catch (err) {
        console.error("Failed to load plan:", err);
        setError(err instanceof Error ? err.message : "Failed to load training plan");
      }
    }

    fetchPlan();
  }, [planId, loadPlan, authLoading, user, navigate]);

  // Auth loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your training plan...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-1">
                    Unable to load training plan
                  </h3>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="mt-4 flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/training-plan-builder")}
              className="flex-1"
            >
              Create New Plan
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="flex-1"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Loaded state
  if (!plan) {
    return null;
  }

  return (
    <PlanScreen
      plan={plan}
      planId={planId}
      onExit={() => navigate("/training-plan-builder")}
    />
  );
}
