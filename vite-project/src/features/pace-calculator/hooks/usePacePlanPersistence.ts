/**
 * Pace Plan Persistence Hook
 * Handles saving/loading from Firebase and session storage
 */

import { useState, useCallback } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/features/auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import ReactGA from "react-ga4";
import type { PaceInputs, PaceResults } from "../types";

interface SavePlanParams {
  inputs: PaceInputs;
  results: PaceResults;
  planName?: string;
  notes?: string;
  raceDate?: string;
}

interface UsePacePlanPersistenceReturn {
  isSaving: boolean;
  isSaved: boolean;
  saveToDashboard: (params: SavePlanParams) => Promise<void>;
  saveForGuestRedirect: (params: SavePlanParams) => void;
  resetSaveState: () => void;
}

export function usePacePlanPersistence(): UsePacePlanPersistenceReturn {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const saveForGuestRedirect = useCallback(
    (params: SavePlanParams) => {
      const planData = {
        inputs: params.inputs,
        results: params.results,
        planName: params.planName,
        notes: params.notes,
        raceDate: params.raceDate,
      };

      sessionStorage.setItem("pending_pace_plan", JSON.stringify(planData));

      ReactGA.event({
        category: "Pace Calculator",
        action: "Guest Save Redirect",
        label: `${params.inputs.distance}${params.inputs.units}`,
      });

      navigate("/register?returnTo=/pace-calculator&savePlan=true");
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
        const { inputs, results } = params;

        // Convert time inputs to numbers for storage
        const hours = inputs.hours ? parseInt(inputs.hours, 10) : 0;
        const minutes = inputs.minutes ? parseInt(inputs.minutes, 10) : 0;
        const seconds = inputs.seconds ? parseInt(inputs.seconds, 10) : 0;
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;

        await addDoc(collection(db, "user_pace_plans"), {
          userId: user.uid,
          distance: parseFloat(inputs.distance),
          units: inputs.units,
          hours,
          minutes,
          seconds,
          totalSeconds,
          paceType: inputs.paceType,
          planName: params.planName || null,
          notes: params.notes || null,
          raceDate: params.raceDate || null,
          paces: {
            race: results.race,
            easy: results.easy,
            tempo: results.tempo,
            interval: results.interval,
            maximum: results.maximum,
            speed: results.speed,
            xlong: results.xlong,
            yasso: results.yasso,
          },
          createdAt: serverTimestamp(),
        });

        setIsSaved(true);

        toast({
          title: "Saved to Dashboard! 🎉",
          description: "Your pace plan is now in your dashboard.",
        });

        ReactGA.event({
          category: "Pace Calculator",
          action: "Saved Plan to Dashboard",
          label: `${inputs.distance}${inputs.units}`,
        });
      } catch (error) {
        console.error("Failed to save pace plan:", error);
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
