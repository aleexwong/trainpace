/**
 * Plan Results Display Component
 * Shows the full generated training plan with weekly breakdowns
 */

import { useState } from "react";
import { Download, Save, ChevronLeft, ChevronRight, Calendar, Target } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { TrainingPlan } from "../types";
import { WeeklyBreakdown } from "./WeeklyBreakdown";
import { formatTime } from "../utils/paceCalculator";

interface PlanResultsDisplayProps {
  plan: TrainingPlan;
  onSave: () => void;
  isSaving: boolean;
  onBack: () => void;
}

export function PlanResultsDisplay({
  plan,
  onSave,
  isSaving,
  onBack,
}: PlanResultsDisplayProps) {
  const [expandedWeek, setExpandedWeek] = useState<number | null>(1);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);

  const currentWeek = plan.weeks[currentWeekIndex];
  const hasNext = currentWeekIndex < plan.weeks.length - 1;
  const hasPrev = currentWeekIndex > 0;

  const totalDistance = plan.weeks.reduce(
    (sum, week) => sum + week.weeklyMileage,
    0
  );

  const raceDateFormatted = new Date(plan.raceDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const handleExpandWeek = (weekNumber: number) => {
    setExpandedWeek(expandedWeek === weekNumber ? null : weekNumber);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">Your Training Plan</h2>
              <div className="flex flex-wrap gap-4 text-blue-100">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  <span>
                    {plan.distance} - {formatTime(plan.goalTime)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>{raceDateFormatted}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-blue-100 text-xs">Total Weeks</div>
              <div className="text-2xl font-bold">{plan.totalWeeks}</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-blue-100 text-xs">Total Distance</div>
              <div className="text-2xl font-bold">{totalDistance.toFixed(0)} km</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-blue-100 text-xs">Experience</div>
              <div className="text-2xl font-bold capitalize">
                {plan.experienceLevel}
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-blue-100 text-xs">Race Goal</div>
              <div className="text-2xl font-bold">{plan.distance}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={onSave} disabled={isSaving} className="flex-1 md:flex-none">
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save to Dashboard
            </>
          )}
        </Button>
        <Button variant="outline" className="flex-1 md:flex-none">
          <Download className="w-4 h-4 mr-2" />
          Download PDF
        </Button>
        <Button variant="outline" onClick={onBack} className="flex-1 md:flex-none">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Form
        </Button>
      </div>

      {/* Desktop: All Weeks View */}
      <div className="hidden md:block space-y-4">
        <h3 className="text-xl font-bold">Weekly Breakdown</h3>
        {plan.weeks.map((week) => (
          <div key={week.weekNumber} onClick={() => handleExpandWeek(week.weekNumber)}>
            <WeeklyBreakdown
              week={week}
              isExpanded={expandedWeek === week.weekNumber}
            />
          </div>
        ))}
      </div>

      {/* Mobile: Week by Week Navigation */}
      <div className="md:hidden space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">Weekly Breakdown</h3>
          <div className="text-sm text-gray-600">
            Week {currentWeekIndex + 1} of {plan.totalWeeks}
          </div>
        </div>

        <WeeklyBreakdown week={currentWeek} isExpanded={true} />

        {/* Navigation */}
        <div className="flex justify-between gap-3">
          <Button
            variant="outline"
            onClick={() => setCurrentWeekIndex((prev) => prev - 1)}
            disabled={!hasPrev}
            className="flex-1"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous Week
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentWeekIndex((prev) => prev + 1)}
            disabled={!hasNext}
            className="flex-1"
          >
            Next Week
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Training Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <h4 className="font-semibold text-blue-900">Training Tips</h4>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>
            • Listen to your body and adjust the plan if needed. It's better to miss a
            workout than to risk injury.
          </p>
          <p>
            • Stay hydrated and fuel properly, especially for long runs over 90 minutes.
          </p>
          <p>• Include strength training and mobility work to prevent injuries.</p>
          <p>
            • Trust the taper! Reducing volume in the final weeks allows your body to
            recover and be fresh for race day.
          </p>
          <p>• Track your progress and celebrate small victories along the way!</p>
        </CardContent>
      </Card>
    </div>
  );
}
