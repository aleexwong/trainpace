/**
 * Training Plan Persistence Hook
 * Handles saving/loading from Firebase and session storage
 */

import { useState, useCallback } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/features/auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import ReactGA from "react-ga4";
import type { SaveTrainingPlanParams } from "../types";

interface UseTrainingPlanPersistenceReturn {
  isSaving: boolean;
  isSaved: boolean;
  saveToDashboard: (params: SaveTrainingPlanParams) => Promise<void>;
  saveForGuestRedirect: (params: SaveTrainingPlanParams) => void;
  resetSaveState: () => void;
}

export function useTrainingPlanPersistence(): UseTrainingPlanPersistenceReturn {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const saveForGuestRedirect = useCallback(
    (params: SaveTrainingPlanParams) => {
      const planData = {
        plan: params.plan,
        inputs: params.inputs,
        planName: params.planName,
        notes: params.notes,
      };

      sessionStorage.setItem("pending_training_plan", JSON.stringify(planData));

      ReactGA.event({
        category: "Training Plan Builder",
        action: "Guest Save Redirect",
        label: `${params.plan.distance} - ${params.plan.totalWeeks} weeks`,
      });

      navigate("/register?returnTo=/training-plan-builder&savePlan=true");
    },
    [navigate]
  );

  const saveToDashboard = useCallback(
    async (params: SaveTrainingPlanParams) => {
      if (!user) {
        saveForGuestRedirect(params);
        return;
      }

      setIsSaving(true);

      try {
        const { plan, inputs, planName, notes } = params;

        await addDoc(collection(db, "user_training_plans"), {
          userId: user.uid,
          planName: planName || null,
          distance: plan.distance,
          goalTime: plan.goalTime,
          raceDate: plan.raceDate,
          totalWeeks: plan.totalWeeks,
          experienceLevel: plan.experienceLevel,
          // Store inputs for editing
          inputs: {
            step1: inputs.step1,
            step2: inputs.step2,
            step3: inputs.step3,
          },
          // Store full plan
          weeks: plan.weeks.map((week) => ({
            weekNumber: week.weekNumber,
            weeklyMileage: week.weeklyMileage,
            phaseType: week.phaseType,
            notes: week.notes || null,
            workouts: week.workouts.map((workout) => ({
              id: workout.id,
              day: workout.day,
              type: workout.type,
              title: workout.title,
              description: workout.description,
              distance: workout.distance || null,
              pace: workout.pace || null,
              duration: workout.duration || null,
              intervals: workout.intervals || null,
              notes: workout.notes || null,
            })),
          })),
          notes: notes || null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        setIsSaved(true);

        toast({
          title: "Training Plan Saved! 🎉",
          description: "Your training plan is now in your dashboard.",
        });

        ReactGA.event({
          category: "Training Plan Builder",
          action: "Saved Plan to Dashboard",
          label: `${plan.distance} - ${plan.totalWeeks} weeks`,
        });
      } catch (error) {
        console.error("Failed to save training plan:", error);
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
