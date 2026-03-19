/**
 * SampleWorkouts — Zone-integrated workout cards with personalized paces
 * Supports compact mode for dashboard grid layout.
 */

import { Clock, Repeat, Zap, Wind } from "lucide-react";
import type { TrainingZone, PaceDisplayUnit } from "../types";

interface SampleWorkoutsProps {
  zones: TrainingZone[];
  paceUnit: PaceDisplayUnit;
  compact?: boolean;
}

const WORKOUTS = [
  {
    title: "Easy Run",
    description: "30–60 min conversational",
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
    description: "20 min at threshold",
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
    description: "5 \u00d7 1000m, 3 min jog",
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
    description: "8 \u00d7 200m, full recovery",
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

export function SampleWorkouts({ zones, paceUnit, compact }: SampleWorkoutsProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-lg h-full ${compact ? "p-4" : "p-5 sm:p-8"}`}>
      <h2 className={`font-bold text-gray-900 ${compact ? "text-lg mb-0.5" : "text-xl sm:text-2xl mb-1"}`}>
        Sample Workouts
      </h2>
      <p className={`text-gray-500 ${compact ? "text-xs mb-3" : "text-sm mb-6"}`}>
        Key sessions at your personalized paces
      </p>

      <div className={`grid gap-2 ${compact ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2 gap-3"}`}>
        {WORKOUTS.map((workout) => {
          const zone = zones[workout.zoneIndex];
          if (!zone) return null;
          const Icon = workout.icon;
          const pace = paceUnit === "km" ? zone.pacePerKm : zone.pacePerMile;
          const unit = paceUnit === "km" ? "/km" : "/mi";

          return (
            <div
              key={workout.title}
              className={`rounded-xl border ${workout.colors.bg} ${workout.colors.border} hover:shadow-sm transition-shadow ${compact ? "p-2.5" : "p-4"}`}
            >
              <div className={compact ? "" : "flex items-start gap-3"}>
                {!compact && (
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${workout.colors.bg} ${workout.colors.icon}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className={compact ? "flex items-center gap-1.5 mb-0.5" : ""}>
                    {compact && <Icon className={`w-3.5 h-3.5 ${workout.colors.icon}`} />}
                    <h3 className={`font-semibold text-gray-900 ${compact ? "text-xs" : "text-sm"}`}>
                      {workout.title}
                    </h3>
                  </div>
                  {!compact && (
                    <p className="text-xs text-gray-500 mt-0.5">{workout.description}</p>
                  )}
                  <p className={`font-bold font-mono ${workout.colors.pace} ${compact ? "text-sm mt-0.5" : "text-base mt-2"}`}>
                    {pace} <span className={`font-normal text-gray-400 ${compact ? "text-[10px]" : "text-xs"}`}>{unit}</span>
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
