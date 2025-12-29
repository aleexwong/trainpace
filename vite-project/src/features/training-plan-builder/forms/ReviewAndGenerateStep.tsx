/**
 * Replaces Step4PlanPreview
 * Compact review + generate button → navigates to PlanScreen
 */

import { Sparkles, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { PlanInputs } from "../types";
import { formatTime, timeInputsToSeconds } from "../utils/paceCalculator";
import { calculatePeakMileage } from "../utils/progressionCalculator";

export interface ReviewAndGenerateStepProps {
  formData: PlanInputs;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function ReviewAndGenerateStep({
  formData,
  onGenerate,
  isGenerating,
}: ReviewAndGenerateStepProps) {
  const { step1, step2 } = formData;

  const goalTimeSeconds = timeInputsToSeconds(
    step1.goalTimeHours,
    step1.goalTimeMinutes,
    step1.goalTimeSeconds
  );

  const peakMileage = calculatePeakMileage(
    step2.currentWeeklyMileage,
    step2.experienceLevel,
    step1.distance,
    step2.availableWeeks
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-blue-600">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold">Review Your Plan</h3>
        <p className="text-gray-600">
          Check your details and generate your personalized training plan
        </p>
      </div>

      {/* Compact Summary */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-700">
                {step1.distance}
              </div>
              <div className="text-sm text-blue-600 mt-1">Race Goal</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-700">
                {formatTime(goalTimeSeconds)}
              </div>
              <div className="text-sm text-blue-600 mt-1">Goal Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-700">
                {step2.availableWeeks}
              </div>
              <div className="text-sm text-blue-600 mt-1">Weeks</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-700">
                {peakMileage}
              </div>
              <div className="text-sm text-blue-600 mt-1">Peak km</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <Button
        onClick={onGenerate}
        disabled={isGenerating}
        className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
      >
        {isGenerating ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
            Generating Your Plan...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5 mr-2" />
            Generate My Training Plan
          </>
        )}
      </Button>

      <p className="text-center text-sm text-gray-500">
        You'll be able to adjust your plan after it's generated
      </p>
    </div>
  );
}
