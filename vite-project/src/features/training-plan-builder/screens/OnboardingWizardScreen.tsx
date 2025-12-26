/**
 * Onboarding Wizard Screen
 * Multi-step form flow that navigates to PlanScreen after generation
 */

import { useMemo } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StepIndicator } from "../components/StepIndicator";
import { Step1GoalSelection } from "../forms/Step1GoalSelection";
import { Step2PersonalDetails } from "../forms/Step2PersonalDetails";
import { Step3PreferencesForm } from "../forms/Step3PreferencesForm";
import { ReviewAndGenerateStep } from "../forms/ReviewAndGenerateStep";
import { PlanScreen } from "./PlanScreen";
import { useMultiStepForm } from "../hooks/useMultiStepForm";
import { usePlanGeneration } from "../hooks/usePlanGeneration";
import type { TrainingPlanWithStatus } from "../domain/types";

export function OnboardingWizardScreen() {
  const {
    currentStep,
    formData,
    errors,
    updateStepData,
    nextStep,
    previousStep,
    goToStep,
    validateCurrentStep,
    updateRaceDateAndWeeks,
  } = useMultiStepForm();

  const { generatedPlan, isGenerating, generatePlan, clearPlan } =
    usePlanGeneration();

  // Convert generated plan to TrainingPlanWithStatus
  const planWithStatus = useMemo<TrainingPlanWithStatus | null>(() => {
    if (!generatedPlan) return null;

    return {
      ...generatedPlan,
      currentWeek: 1, // Default to week 1
      weeks: generatedPlan.weeks.map((week) => ({
        ...week,
        completedCount: 0,
        totalWorkouts: week.workouts.filter((w) => w.type !== "rest").length,
        workouts: week.workouts.map((workout) => ({
          ...workout,
          status: "pending" as const,
        })),
      })),
    };
  }, [generatedPlan]);

  // Handle form navigation
  const handleNext = () => {
    if (validateCurrentStep()) {
      nextStep();
    }
  };

  const handlePrevious = () => {
    previousStep();
  };

  // Handle plan generation
  const handleGeneratePlan = async () => {
    await generatePlan(formData);
  };

  // Handle back from plan screen
  const handleBackToWizard = () => {
    clearPlan();
    goToStep(4);
  };

  // If plan is generated, show PlanScreen
  if (planWithStatus) {
    return <PlanScreen plan={planWithStatus} onExit={handleBackToWizard} />;
  }

  // Show multi-step form wizard
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6">
            <h1 className="text-3xl font-extrabold text-white text-center flex items-center justify-center">
              <span className="text-4xl mr-2">🏃</span>
              Training Plan Builder
            </h1>
            <p className="text-blue-100 text-center mt-2">
              Create your personalized 5K to Marathon training plan
            </p>
          </div>

          {/* Step Indicator */}
          <div className="border-b border-gray-200">
            <StepIndicator
              currentStep={currentStep}
              onStepClick={goToStep}
              completedSteps={[]}
            />
          </div>

          {/* Form Content */}
          <CardContent className="p-6 md:p-8">
            {currentStep === 1 && (
              <Step1GoalSelection
                data={formData.step1}
                errors={errors.step1}
                onChange={(updates) => {
                  updateStepData("step1", updates);
                  // Auto-calculate weeks when race date changes
                  if (updates.raceDate) {
                    updateRaceDateAndWeeks(updates.raceDate);
                  }
                }}
              />
            )}

            {currentStep === 2 && (
              <Step2PersonalDetails
                data={formData.step2}
                distance={formData.step1.distance}
                errors={errors.step2}
                onChange={(updates) => updateStepData("step2", updates)}
              />
            )}

            {currentStep === 3 && (
              <Step3PreferencesForm
                data={formData.step3}
                errors={errors.step3}
                onChange={(updates) => updateStepData("step3", updates)}
              />
            )}

            {currentStep === 4 && (
              <ReviewAndGenerateStep
                formData={formData}
                onGenerate={handleGeneratePlan}
                isGenerating={isGenerating}
              />
            )}
          </CardContent>

          {/* Navigation Footer */}
          {currentStep < 4 && (
            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <div className="flex justify-between gap-4">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className="flex-1 md:flex-none"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700"
                >
                  {currentStep === 3 ? "Review Plan" : "Continue"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Additional Info */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Your training plan will be personalized based on your goals and
            experience level.
          </p>
        </div>
      </div>
    </div>
  );
}
