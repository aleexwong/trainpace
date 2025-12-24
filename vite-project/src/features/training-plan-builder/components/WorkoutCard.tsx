/**
 * Workout Card Component
 * Displays individual workout details
 */

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Workout } from "../types";
import { WORKOUT_INTENSITY } from "../utils/workoutTemplates";

interface WorkoutCardProps {
  workout: Workout;
  compact?: boolean;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const WORKOUT_COLORS: Record<string, string> = {
  easy: "bg-green-100 text-green-800 border-green-200",
  long: "bg-blue-100 text-blue-800 border-blue-200",
  tempo: "bg-orange-100 text-orange-800 border-orange-200",
  intervals: "bg-red-100 text-red-800 border-red-200",
  hills: "bg-purple-100 text-purple-800 border-purple-200",
  fartlek: "bg-yellow-100 text-yellow-800 border-yellow-200",
  recovery: "bg-teal-100 text-teal-800 border-teal-200",
  race_pace: "bg-pink-100 text-pink-800 border-pink-200",
  rest: "bg-gray-100 text-gray-600 border-gray-200",
  cross_training: "bg-indigo-100 text-indigo-800 border-indigo-200",
};

export function WorkoutCard({ workout, compact = false }: WorkoutCardProps) {
  const intensity = WORKOUT_INTENSITY[workout.type];
  const colorClass = WORKOUT_COLORS[workout.type] || "bg-gray-100 text-gray-800";

  if (workout.type === "rest") {
    return (
      <Card className="border-2 border-dashed border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold">
                {DAY_NAMES[workout.day - 1]}
              </div>
              <div>
                <div className="font-semibold text-gray-600">Rest Day</div>
                <div className="text-xs text-gray-500">Recovery</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-2 ${compact ? "" : "hover:shadow-md transition-shadow"}`}>
      <CardContent className={compact ? "p-3" : "p-4"}>
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${colorClass} flex items-center justify-center font-semibold text-sm`}>
                {DAY_NAMES[workout.day - 1]}
              </div>
              <div>
                <div className="font-semibold">{workout.title}</div>
                <div className="text-xs text-gray-600">
                  {workout.distance && workout.distance > 0
                    ? `${workout.distance} km`
                    : workout.duration
                    ? `${workout.duration} min`
                    : ""}
                  {workout.pace && workout.pace !== "N/A" && ` @ ${workout.pace}`}
                </div>
              </div>
            </div>
            <Badge variant="outline" className={`${colorClass} text-xs`}>
              Intensity: {intensity}/10
            </Badge>
          </div>

          {/* Description */}
          {!compact && (
            <p className="text-sm text-gray-600">{workout.description}</p>
          )}

          {/* Intervals Details */}
          {workout.intervals && !compact && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
              <div className="font-semibold text-gray-700">Workout Details:</div>
              <div className="text-gray-600">
                • {workout.intervals.count} × {workout.intervals.distance}km at{" "}
                {workout.intervals.pace}
              </div>
              <div className="text-gray-600">
                • Recovery: {workout.intervals.recovery}
              </div>
            </div>
          )}

          {/* Notes */}
          {workout.notes && !compact && (
            <div className="text-xs text-gray-500 italic">Note: {workout.notes}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
