/**
 * Fuel Plan Persistence Hook
 * Handles saving/loading from Firebase and session storage
 */

import { useState, useCallback } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/features/auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import ReactGA from "react-ga4";
import type {
  RaceType,
  FuelPlanResult,
  AIRecommendation,
} from "../types";

interface SavePlanParams {
  raceType: RaceType;
  weight: string;
  timeHours: string;
  timeMinutes: string;
  finishTimeMin: number;
  result: FuelPlanResult;
  userContext: string;
  selectedPresets: string[];
  recommendations: AIRecommendation[];
}

interface UseFuelPlanPersistenceReturn {
  isSaving: boolean;
  isSaved: boolean;
  saveToDashboard: (params: SavePlanParams) => Promise<void>;
  saveForGuestRedirect: (params: SavePlanParams) => void;
  resetSaveState: () => void;
}

export function useFuelPlanPersistence(): UseFuelPlanPersistenceReturn {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const saveForGuestRedirect = useCallback(
    (params: SavePlanParams) => {
      const planData = {
        raceType: params.raceType,
        weight: params.weight,
        timeHours: params.timeHours,
        timeMinutes: params.timeMinutes,
        result: params.result,
        aiAdvice: params.recommendations,
        userContext: params.userContext,
        selectedPresets: params.selectedPresets,
      };

      sessionStorage.setItem("pending_fuel_plan", JSON.stringify(planData));

      ReactGA.event({
        category: "Fuel Planner",
        action: "Guest Save Redirect",
        label: params.raceType,
      });

      navigate("/register?returnTo=/fuel&savePlan=true");
    },
    [navigate]
  );

  const saveToDashboard = useCallback(
    async (params: SavePlanParams) => {
      if (!user) {
        saveForGuestRedirect(params);
        return;
      }

      setIsSaving(true);

      try {
        await addDoc(collection(db, "user_fuel_plans"), {
          userId: user.uid,
          raceType: params.raceType,
          weight: params.weight ? parseFloat(params.weight) : null,
          finishTime: params.finishTimeMin,
          carbsPerHour: params.result.carbsPerHour,
          totalCarbs: params.result.totalCarbs,
          totalCalories: params.result.totalCalories,
          gelsNeeded: params.result.gelsNeeded,
          userContext: params.userContext || null,
          selectedPresets: params.selectedPresets,
          aiRecommendations:
            params.recommendations.length > 0 ? params.recommendations : null,
          createdAt: serverTimestamp(),
        });

        setIsSaved(true);

        toast({
          title: "Saved to Dashboard! 🎉",
          description: "Your fuel plan is now in your dashboard.",
        });

        ReactGA.event({
          category: "Fuel Planner",
          action: "Saved Plan to Dashboard",
          label: params.raceType,
        });
      } catch (error) {
        console.error("Failed to save fuel plan:", error);
        toast({
          title: "Failed to save",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    },
    [user, saveForGuestRedirect, toast]
  );

  const resetSaveState = useCallback(() => {
    setIsSaved(false);
  }, []);

  return {
    isSaving,
    isSaved,
    saveToDashboard,
    saveForGuestRedirect,
    resetSaveState,
  };
}
