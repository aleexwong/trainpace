/**
 * Step Indicator Component
 * Shows progress through the multi-step form
 */

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  number: number;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  { number: 1, title: "Goal", description: "Race details" },
  { number: 2, title: "Profile", description: "Your details" },
  { number: 3, title: "Preferences", description: "Training style" },
  { number: 4, title: "Review", description: "Preview plan" },
];

interface StepIndicatorProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
  completedSteps?: number[];
}

export function StepIndicator({
  currentStep,
  onStepClick,
  completedSteps = [],
}: StepIndicatorProps) {
  return (
    <div className="w-full py-6 px-4">
      {/* Desktop view */}
      <div className="hidden md:flex items-center justify-center max-w-4xl mx-auto">
        {STEPS.map((step, index) => {
          const isCompleted = completedSteps.includes(step.number);
          const isCurrent = currentStep === step.number;
          const isClickable = isCompleted || onStepClick;

          return (
            <div key={step.number} className="flex items-center">
              {/* Step circle */}
              <div className="flex flex-col items-center relative">
                <button
                  onClick={() => isClickable && onStepClick?.(step.number)}
                  disabled={!isClickable}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all",
                    isCurrent &&
                      "bg-blue-600 text-white ring-4 ring-blue-200 scale-110",
                    isCompleted && !isCurrent && "bg-green-600 text-white",
                    !isCurrent && !isCompleted && "bg-gray-200 text-gray-600",
                    isClickable && "cursor-pointer hover:scale-105"
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                  aria-label={`Step ${step.number}: ${step.title}`}
                >
                  {isCompleted && !isCurrent ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    step.number
                  )}
                </button>
                <div className="mt-2 text-center">
                  <div
                    className={cn(
                      "text-sm font-medium",
                      isCurrent && "text-blue-600",
                      isCompleted && !isCurrent && "text-green-600",
                      !isCurrent && !isCompleted && "text-gray-600"
                    )}
                  >
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500">{step.description}</div>
                </div>
              </div>

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-1 flex-1 mx-4 transition-all",
                    isCompleted ? "bg-green-600" : "bg-gray-200"
                  )}
                  style={{ marginTop: "-2.5rem" }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile view - Simplified dots */}
      <div className="flex md:hidden items-center justify-center gap-2">
        {STEPS.map((step) => {
          const isCompleted = completedSteps.includes(step.number);
          const isCurrent = currentStep === step.number;

          return (
            <div key={step.number} className="flex flex-col items-center">
              <div
                className={cn(
                  "w-3 h-3 rounded-full transition-all",
                  isCurrent && "bg-blue-600 scale-150 ring-2 ring-blue-200",
                  isCompleted && !isCurrent && "bg-green-600",
                  !isCurrent && !isCompleted && "bg-gray-300"
                )}
              />
            </div>
          );
        })}
        <div className="ml-4 text-sm font-medium text-gray-600">
          Step {currentStep} of {STEPS.length}
        </div>
      </div>
    </div>
  );
}
