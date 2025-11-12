/**
 * Practice Schedule Component
 * Suggests when to test fuel plan during training
 */

import { Card, CardContent } from "@/components/ui/card";
import { Calendar, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { useState } from "react";
import type { RaceType } from "../types";

interface PracticeScheduleProps {
  raceType: RaceType;
  gelsNeeded: number;
}

interface TrainingRun {
  week: number;
  runType: string;
  distance: number;
  distanceUnit: string;
  gelsToTest: number;
  focus: string;
  completed?: boolean;
}

export function PracticeSchedule({
  raceType,
  gelsNeeded,
}: PracticeScheduleProps) {
  // Generate practice runs based on race type
  const generatePracticeRuns = (): TrainingRun[] => {
    if (raceType === "10K") {
      return [
        {
          week: 4,
          runType: "Long Run",
          distance: 8,
          distanceUnit: "km",
          gelsToTest: 1,
          focus: "Test gel tolerance at race pace",
        },
      ];
    } else if (raceType === "Half") {
      return [
        {
          week: 6,
          runType: "Long Run",
          distance: 10,
          distanceUnit: "miles",
          gelsToTest: 2,
          focus: "Test gel intake at 45 min and 90 min",
        },
        {
          week: 10,
          runType: "Long Run",
          distance: 13,
          distanceUnit: "miles",
          gelsToTest: 3,
          focus: "Practice full race fueling strategy",
        },
      ];
    } else {
      // Full marathon
      return [
        {
          week: 8,
          runType: "Long Run",
          distance: 14,
          distanceUnit: "miles",
          gelsToTest: 3,
          focus: "Test gel timing at 45, 90, and 135 min",
        },
        {
          week: 12,
          runType: "Long Run",
          distance: 18,
          distanceUnit: "miles",
          gelsToTest: 4,
          focus: "Practice race fueling every 45 min",
        },
        {
          week: 15,
          runType: "Long Run",
          distance: 20,
          distanceUnit: "miles",
          gelsToTest: gelsNeeded,
          focus: "Full dress rehearsal with complete fuel plan",
        },
      ];
    }
  };

  const [practiceRuns, setPracticeRuns] = useState<TrainingRun[]>(
    generatePracticeRuns()
  );

  const toggleCompleted = (week: number) => {
    setPracticeRuns(
      practiceRuns.map((run) =>
        run.week === week ? { ...run, completed: !run.completed } : run
      )
    );
  };

  const completedRuns = practiceRuns.filter((r) => r.completed).length;
  const totalRuns = practiceRuns.length;

  if (gelsNeeded === 0) {
    return (
      <Card className="bg-white shadow-lg border-2 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-6 w-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">
              Practice Schedule
            </h3>
          </div>
          <p className="text-sm text-gray-600">
            For your {raceType} race, fueling is optional. Focus on your pre-race meal and hydration strategy instead.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-lg border-2 border-blue-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">
              Practice Schedule
            </h3>
          </div>
          <div className="text-sm text-blue-600 font-medium">
            {completedRuns}/{totalRuns} completed
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Test your fuel plan on these training runs before race day.
        </p>

        {/* Progress bar */}
        <div className="mb-4 bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-300"
            style={{
              width: `${(completedRuns / totalRuns) * 100}%`,
            }}
          />
        </div>

        {/* Practice runs list */}
        <div className="space-y-3">
          {practiceRuns.map((run) => (
            <button
              key={run.week}
              onClick={() => toggleCompleted(run.week)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                run.completed
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-blue-300 bg-white"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                    run.completed
                      ? "bg-blue-600 border-blue-600"
                      : "bg-white border-gray-300"
                  }`}
                >
                  {run.completed && (
                    <CheckCircle className="h-5 w-5 text-white" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                      Week {run.week}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {run.runType}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5" />
                      <span>
                        {run.distance} {run.distanceUnit}
                      </span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {run.gelsToTest} {run.gelsToTest === 1 ? "gel" : "gels"}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 italic">{run.focus}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Tips section */}
        <div className="mt-4 space-y-2">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              💡 <strong>Pro tip:</strong> Practice your fueling during long runs that match your race intensity. This helps your gut adapt to processing fuel while running.
            </p>
          </div>

          {completedRuns === totalRuns && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-green-800 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>
                  <strong>Great work!</strong> You've tested your entire fuel plan. You're ready for race day!
                </span>
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
