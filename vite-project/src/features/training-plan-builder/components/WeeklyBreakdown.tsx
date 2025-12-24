/**
 * Weekly Breakdown Component
 * Displays a single week's training plan
 */

import { useState } from "react";
import { ChevronDown, ChevronUp, TrendingUp, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TrainingWeek } from "../types";
import { WorkoutCard } from "./WorkoutCard";

interface WeeklyBreakdownProps {
  week: TrainingWeek;
  isExpanded?: boolean;
}

const PHASE_LABELS = {
  base: { label: "Base Building", color: "bg-green-100 text-green-800" },
  build: { label: "Build Phase", color: "bg-blue-100 text-blue-800" },
  peak: { label: "Peak Phase", color: "bg-orange-100 text-orange-800" },
  taper: { label: "Taper", color: "bg-purple-100 text-purple-800" },
};

export function WeeklyBreakdown({ week, isExpanded: initialExpanded = false }: WeeklyBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  const phaseInfo = PHASE_LABELS[week.phaseType];
  const runWorkouts = week.workouts.filter((w) => w.type !== "rest");
  const totalDistance = week.workouts.reduce((sum, w) => sum + (w.distance || 0), 0);

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h4 className="text-lg font-bold">Week {week.weekNumber}</h4>
              <Badge className={phaseInfo.color}>{phaseInfo.label}</Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                {totalDistance.toFixed(1)} km total
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {runWorkouts.length} runs
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Collapse
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Expand
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 space-y-3">
          {/* Week Notes */}
          {week.notes && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
              <span className="font-semibold">Week Focus: </span>
              {week.notes}
            </div>
          )}

          {/* Workouts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {week.workouts.map((workout) => (
              <WorkoutCard key={workout.id} workout={workout} />
            ))}
          </div>

          {/* Week Summary */}
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <div className="text-gray-600 text-xs">Total Distance</div>
                <div className="font-semibold">{totalDistance.toFixed(1)} km</div>
              </div>
              <div>
                <div className="text-gray-600 text-xs">Running Days</div>
                <div className="font-semibold">{runWorkouts.length}</div>
              </div>
              <div>
                <div className="text-gray-600 text-xs">Avg Per Run</div>
                <div className="font-semibold">
                  {runWorkouts.length > 0
                    ? (totalDistance / runWorkouts.length).toFixed(1)
                    : 0}{" "}
                  km
                </div>
              </div>
              <div>
                <div className="text-gray-600 text-xs">Phase</div>
                <div className="font-semibold capitalize">{week.phaseType}</div>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
