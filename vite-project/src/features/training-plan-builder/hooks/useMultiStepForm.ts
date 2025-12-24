/**
 * Multi-Step Form State Management Hook
 */

import { useState, useCallback } from "react";
import type { PlanInputs, Step1Data, Step2Data, Step3Data, FormErrors } from "../types";
import { validateStep1, validateStep2, validateStep3, canProceedFromStep } from "../utils/validation";
import { calculateRecommendedWeeks } from "../utils/progressionCalculator";

const DEFAULT_STEP1: Step1Data = {
  distance: "5K",
  goalTimeHours: "0",
  goalTimeMinutes: "25",
  goalTimeSeconds: "00",
  raceDate: "",
};

const DEFAULT_STEP2: Step2Data = {
  experienceLevel: "intermediate",
  currentWeeklyMileage: 20,
  longestRecentRun: 8,
  availableWeeks: 8,
};

const DEFAULT_STEP3: Step3Data = {
  trainingDaysPerWeek: 4,
  longRunDay: "sunday",
  includeCrossTraining: false,
  preferredWorkouts: ["tempo", "intervals"],
  trainingPhilosophy: "balanced",
};

export function useMultiStepForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<PlanInputs>({
    step1: DEFAULT_STEP1,
    step2: DEFAULT_STEP2,
    step3: DEFAULT_STEP3,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  /**
   * Update data for a specific step
   */
  const updateStepData = useCallback(
    <T extends keyof PlanInputs>(step: T, data: Partial<PlanInputs[T]>) => {
      setFormData((prev) => ({
        ...prev,
        [step]: { ...prev[step], ...data },
      }));

      // Clear errors for this step when data is updated
      setErrors((prev) => ({
        ...prev,
        [step]: undefined,
      }));
    },
    []
  );

  /**
   * Validate current step
   */
  const validateCurrentStep = useCallback((): boolean => {
    let stepErrors: FormErrors = {};

    switch (currentStep) {
      case 1:
        stepErrors.step1 = validateStep1(formData.step1);
        break;
      case 2:
        stepErrors.step2 = validateStep2(formData.step2, formData.step1.distance);
        break;
      case 3:
        stepErrors.step3 = validateStep3(formData.step3);
        break;
      default:
        return true;
    }

    setErrors(stepErrors);
    return !stepErrors.step1 && !stepErrors.step2 && !stepErrors.step3;
  }, [currentStep, formData]);

  /**
   * Move to next step
   */
  const nextStep = useCallback(() => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    }
  }, [validateCurrentStep]);

  /**
   * Move to previous step
   */
  const previousStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  /**
   * Jump to a specific step
   */
  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= 5) {
      setCurrentStep(step);
    }
  }, []);

  /**
   * Check if can proceed from current step
   */
  const canProceed = useCallback((): boolean => {
    return canProceedFromStep(currentStep, errors);
  }, [currentStep, errors]);

  /**
   * Reset form to initial state
   */
  const resetForm = useCallback(() => {
    setCurrentStep(1);
    setFormData({
      step1: DEFAULT_STEP1,
      step2: DEFAULT_STEP2,
      step3: DEFAULT_STEP3,
    });
    setErrors({});
  }, []);

  /**
   * Auto-calculate available weeks when race date changes
   */
  const updateRaceDateAndWeeks = useCallback(
    (raceDate: string) => {
      updateStepData("step1", { raceDate });

      if (raceDate) {
        const recommendedWeeks = calculateRecommendedWeeks(
          formData.step2.experienceLevel,
          formData.step1.distance,
          raceDate
        );
        updateStepData("step2", { availableWeeks: recommendedWeeks });
      }
    },
    [formData.step1.distance, formData.step2.experienceLevel, updateStepData]
  );

  return {
    currentStep,
    formData,
    errors,
    updateStepData,
    nextStep,
    previousStep,
    goToStep,
    canProceed,
    resetForm,
    validateCurrentStep,
    updateRaceDateAndWeeks,
  };
}
