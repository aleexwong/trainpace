/**
 * Training Plan Generation Hook
 */

import { useState, useCallback } from "react";
import type { PlanInputs, TrainingPlan } from "../types";
import { generateTrainingPlan } from "../utils/planGenerator";

export function usePlanGeneration() {
  const [generatedPlan, setGeneratedPlan] = useState<TrainingPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Generate a training plan from inputs
   */
  const generatePlan = useCallback(async (inputs: PlanInputs): Promise<TrainingPlan | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      // Simulate async operation for better UX (shows loading state)
      await new Promise((resolve) => setTimeout(resolve, 500));

      const plan = generateTrainingPlan(inputs);
      setGeneratedPlan(plan);
      return plan;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate training plan";
      setError(errorMessage);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  /**
   * Clear the generated plan
   */
  const clearPlan = useCallback(() => {
    setGeneratedPlan(null);
    setError(null);
  }, []);

  /**
   * Update plan details (name, etc.)
   */
  const updatePlanDetails = useCallback((updates: Partial<TrainingPlan>) => {
    setGeneratedPlan((prev) => {
      if (!prev) return null;
      return { ...prev, ...updates };
    });
  }, []);

  return {
    generatedPlan,
    isGenerating,
    error,
    generatePlan,
    clearPlan,
    updatePlanDetails,
  };
}
