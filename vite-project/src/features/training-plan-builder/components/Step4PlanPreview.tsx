/**
 * Step 4: Plan Preview
 * Show summary of selections before generating plan
 */

import { CheckCircle2, Edit, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PlanInputs } from "../types";
import { formatTime, timeInputsToSeconds } from "../utils/paceCalculator";
import { calculatePeakMileage } from "../utils/progressionCalculator";

interface Step4PlanPreviewProps {
  formData: PlanInputs;
  onEdit: (step: number) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function Step4PlanPreview({
  formData,
  onEdit,
  onGenerate,
  isGenerating,
}: Step4PlanPreviewProps) {
  const { step1, step2, step3 } = formData;

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

  const raceDateFormatted = new Date(step1.raceDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-blue-600">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold">Review Your Plan</h3>
        <p className="text-gray-600">
          Check your selections and generate your personalized training plan
        </p>
      </div>

      {/* Goal Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <h4 className="font-semibold text-lg">Goal</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(1)}
              className="text-blue-600"
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Race Distance:</span>
              <span className="font-semibold">{step1.distance}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Goal Time:</span>
              <span className="font-semibold">{formatTime(goalTimeSeconds)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Race Date:</span>
              <span className="font-semibold">{raceDateFormatted}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Details Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <h4 className="font-semibold text-lg">Your Profile</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(2)}
              className="text-blue-600"
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Experience Level:</span>
              <span className="font-semibold capitalize">{step2.experienceLevel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Current Weekly Mileage:</span>
              <span className="font-semibold">{step2.currentWeeklyMileage} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Longest Recent Run:</span>
              <span className="font-semibold">{step2.longestRecentRun} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Training Duration:</span>
              <span className="font-semibold">{step2.availableWeeks} weeks</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Training Preferences Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <h4 className="font-semibold text-lg">Training Preferences</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(3)}
              className="text-blue-600"
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Training Days:</span>
              <span className="font-semibold">{step3.trainingDaysPerWeek} days/week</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Long Run Day:</span>
              <span className="font-semibold capitalize">{step3.longRunDay}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cross Training:</span>
              <span className="font-semibold">
                {step3.includeCrossTraining ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Philosophy:</span>
              <span className="font-semibold capitalize">
                {step3.trainingPhilosophy}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Overview */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="pt-6">
          <h4 className="font-semibold text-lg mb-4 text-blue-900">
            Your Training Plan Overview
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">
                {step2.availableWeeks}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Weeks</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{peakMileage}</div>
              <div className="text-sm text-gray-600 mt-1">Peak Mileage (km)</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">
                {step3.trainingDaysPerWeek}
              </div>
              <div className="text-sm text-gray-600 mt-1">Days Per Week</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">
                {step1.distance}
              </div>
              <div className="text-sm text-gray-600 mt-1">Race Goal</div>
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
    </div>
  );
}
