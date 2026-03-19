/**
 * SampleWorkouts — Zone-integrated workout cards with personalized paces
 */

import { Clock, Repeat, Zap, Wind } from "lucide-react";
import type { TrainingZone, PaceDisplayUnit } from "../types";

interface SampleWorkoutsProps {
  zones: TrainingZone[];
  paceUnit: PaceDisplayUnit;
}

const WORKOUTS = [
  {
    title: "Easy Run",
    description: "30–60 min at conversational pace",
    zoneIndex: 0,
    icon: Wind,
    colors: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      icon: "text-emerald-600",
      pace: "text-emerald-700",
    },
  },
  {
    title: "Tempo Run",
    description: "20 min continuous at threshold pace",
    zoneIndex: 2,
    icon: Clock,
    colors: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      icon: "text-yellow-600",
      pace: "text-yellow-700",
    },
  },
  {
    title: "VO\u2082max Intervals",
    description: "5 \u00d7 1000m with 3 min jog recovery",
    zoneIndex: 3,
    icon: Repeat,
    colors: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      icon: "text-orange-600",
      pace: "text-orange-700",
    },
  },
  {
    title: "Speed Reps",
    description: "8 \u00d7 200m with full recovery between reps",
    zoneIndex: 4,
    icon: Zap,
    colors: {
      bg: "bg-red-50",
      border: "border-red-200",
      icon: "text-red-600",
      pace: "text-red-700",
    },
  },
];

export function SampleWorkouts({ zones, paceUnit }: SampleWorkoutsProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-8">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
        Sample Workouts
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Key sessions at your personalized paces
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {WORKOUTS.map((workout) => {
          const zone = zones[workout.zoneIndex];
          if (!zone) return null;
          const Icon = workout.icon;
          const pace = paceUnit === "km" ? zone.pacePerKm : zone.pacePerMile;
          const unit = paceUnit === "km" ? "/km" : "/mi";

          return (
            <div
              key={workout.title}
              className={`p-4 rounded-xl border ${workout.colors.bg} ${workout.colors.border} hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${workout.colors.bg} ${workout.colors.icon}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {workout.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {workout.description}
                  </p>
                  <p className={`mt-2 text-base font-bold font-mono ${workout.colors.pace}`}>
                    {pace} <span className="text-xs font-normal text-gray-400">{unit}</span>
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
