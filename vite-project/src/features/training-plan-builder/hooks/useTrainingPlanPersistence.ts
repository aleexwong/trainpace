/**
 * Training Plan Persistence Hook (V2)
 * Handles saving/loading/updating training plans via backend API
 */

import { useState, useCallback } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import ReactGA from "react-ga4";
import type { SaveTrainingPlanParams, TrainingPlan } from "../types";
import {
  createTrainingPlan,
  getTrainingPlan,
  updateTrainingPlan,
  deleteTrainingPlan,
} from "../utils/planApiClient";

interface UseTrainingPlanPersistenceReturn {
  // Save operations
  isSaving: boolean;
  isSaved: boolean;
  saveToDashboard: (params: SaveTrainingPlanParams) => Promise<string | null>;
  saveForGuestRedirect: (params: SaveTrainingPlanParams) => void;
  
  // Load operations
  isLoading: boolean;
  loadPlan: (planId: string) => Promise<TrainingPlan | null>;
  
  // Update operations
  isUpdating: boolean;
  updatePlan: (planId: string, updates: {
    planName?: string;
    weeks?: TrainingPlan["weeks"];
    notes?: string;
  }) => Promise<void>;
  
  // Delete operations
  isDeleting: boolean;
  deletePlan: (planId: string) => Promise<void>;
  
  // State management
  resetSaveState: () => void;
}

export function useTrainingPlanPersistence(): UseTrainingPlanPersistenceReturn {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Save plan for guest users - redirects to registration
   */
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

  /**
   * Save plan to backend (authenticated users only)
   * Returns planId on success, null on failure
   */
  const saveToDashboard = useCallback(
    async (params: SaveTrainingPlanParams): Promise<string | null> => {
      if (!user) {
        saveForGuestRedirect(params);
        return null;
      }

      setIsSaving(true);

      try {
        const { plan, inputs, planName, notes } = params;

        const response = await createTrainingPlan({
          plan,
          inputs,
          planName,
          notes,
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

        return response.planId;
      } catch (error) {
        console.error("Failed to save training plan:", error);
        toast({
          title: "Failed to save",
          description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    [user, saveForGuestRedirect, toast]
  );

  /**
   * Load a training plan by ID
   */
  const loadPlan = useCallback(
    async (planId: string): Promise<TrainingPlan | null> => {
      console.log("[loadPlan] Called with planId:", planId, "user:", user?.uid);
      
      if (!user) {
        console.log("[loadPlan] No user, redirecting to login");
        toast({
          title: "Authentication required",
          description: "Please sign in to view your training plan.",
          variant: "destructive",
        });
        navigate("/login");
        return null;
      }

      setIsLoading(true);

      try {
        console.log("[loadPlan] About to call getTrainingPlan API...");
        const response = await getTrainingPlan(planId);
        console.log("[loadPlan] API response:", response);
        
        ReactGA.event({
          category: "Training Plan Builder",
          action: "Loaded Plan",
          label: `${response.plan.distance} - ${response.plan.totalWeeks} weeks`,
        });

        return response.plan as TrainingPlan;
      } catch (error) {
        console.error("Failed to load training plan:", error);
        toast({
          title: "Failed to load plan",
          description: error instanceof Error ? error.message : "Plan not found or access denied.",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user, navigate, toast]
  );

  /**
   * Update an existing training plan
   */
  const updatePlan = useCallback(
    async (
      planId: string,
      updates: {
        planName?: string;
        weeks?: TrainingPlan["weeks"];
        notes?: string;
      }
    ): Promise<void> => {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to save changes.",
          variant: "destructive",
        });
        return;
      }

      setIsUpdating(true);

      try {
        await updateTrainingPlan(planId, updates);

        toast({
          title: "Changes saved",
          description: "Your training plan has been updated.",
        });

        ReactGA.event({
          category: "Training Plan Builder",
          action: "Updated Plan",
          label: planId,
        });
      } catch (error) {
        console.error("Failed to update training plan:", error);
        toast({
          title: "Failed to save changes",
          description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [user, toast]
  );

  /**
   * Delete a training plan
   */
  const deletePlan = useCallback(
    async (planId: string): Promise<void> => {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to delete plans.",
          variant: "destructive",
        });
        return;
      }

      setIsDeleting(true);

      try {
        await deleteTrainingPlan(planId);

        toast({
          title: "Plan deleted",
          description: "Your training plan has been removed.",
        });

        ReactGA.event({
          category: "Training Plan Builder",
          action: "Deleted Plan",
          label: planId,
        });
      } catch (error) {
        console.error("Failed to delete training plan:", error);
        toast({
          title: "Failed to delete plan",
          description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsDeleting(false);
      }
    },
    [user, toast]
  );

  const resetSaveState = useCallback(() => {
    setIsSaved(false);
  }, []);

  return {
    isSaving,
    isSaved,
    saveToDashboard,
    saveForGuestRedirect,
    isLoading,
    loadPlan,
    isUpdating,
    updatePlan,
    isDeleting,
    deletePlan,
    resetSaveState,
  };
}
