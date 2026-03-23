/**
 * TrainingZonesDisplay — Color-coded zone cards showing pace, description, and sample workouts.
 * Supports compact mode for dashboard grid layout.
 */

import { Info } from "lucide-react";
import type { TrainingZone, PaceDisplayUnit } from "../types";
import { getZoneColorClasses } from "../hooks/useVdotCalculator";

const ZONE_WORKOUTS: Record<string, { workout: string; detail: string }[]> = {
  E: [
    { workout: "Easy Run", detail: "30–60 min at conversational pace" },
    { workout: "Long Run", detail: "60–150 min for aerobic endurance" },
  ],
  M: [
    { workout: "Marathon Tempo", detail: "8–15 miles at marathon pace" },
    { workout: "MP Intervals", detail: "3 \u00d7 3 miles with 1 min rest" },
  ],
  T: [
    { workout: "Tempo Run", detail: "20 min continuous at threshold" },
    { workout: "Cruise Intervals", detail: "4 \u00d7 1 mile with 1 min jog" },
  ],
  I: [
    { workout: "VO\u2082max Intervals", detail: "5 \u00d7 1000m with 3 min jog" },
    { workout: "3–5 min Repeats", detail: "4 \u00d7 4 min hard, 3 min easy" },
  ],
  R: [
    { workout: "Speed Reps", detail: "8 \u00d7 200m with full recovery" },
    { workout: "Fast Strides", detail: "10 \u00d7 100m at max speed" },
  ],
};

interface TrainingZonesDisplayProps {
  zones: TrainingZone[];
  paceUnit: PaceDisplayUnit;
  vdot: number;
  onTogglePaceUnit: () => void;
  compact?: boolean;
}

export function TrainingZonesDisplay({
  zones,
  paceUnit,
  vdot,
  onTogglePaceUnit,
  compact,
}: TrainingZonesDisplayProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-lg h-full ${compact ? "p-4" : "p-5 sm:p-8"}`}>
      {/* Header */}
      <div className={`flex items-center justify-between gap-3 ${compact ? "mb-3" : "mb-4"}`}>
        <div>
          <h2 className={`font-bold text-gray-900 ${compact ? "text-lg mb-0.5" : "text-xl sm:text-2xl"}`}>
            Training Paces
          </h2>
          <p className="text-xs text-gray-500">
            Daniels&apos; 5 zones &middot; VDOT {vdot}
          </p>
        </div>
        <div
          className={`relative ${compact ? "w-32 h-8" : "w-36 h-9"} bg-indigo-100 rounded-full cursor-pointer overflow-hidden select-none`}
          onClick={onTogglePaceUnit}
        >
          <div
            className={`absolute top-0.5 left-0.5 w-[calc(50%-0.25rem)] ${compact ? "h-7" : "h-8"} bg-indigo-600 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
              paceUnit === "mi" ? "translate-x-full" : "translate-x-0"
            }`}
          />
          <div className="absolute inset-0 flex items-center">
            <div className={`w-1/2 text-center text-xs font-semibold transition-colors ${paceUnit === "km" ? "text-white" : "text-indigo-700"}`}>min/km</div>
            <div className={`w-1/2 text-center text-xs font-semibold transition-colors ${paceUnit === "mi" ? "text-white" : "text-indigo-700"}`}>min/mi</div>
          </div>
        </div>
      </div>

      {/* Zone cards grid */}
      <div className={`grid ${compact ? "grid-cols-5 gap-2" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5"}`}>
        {zones.map((zone) => {
          const colors = getZoneColorClasses(zone.color);
          const workouts = ZONE_WORKOUTS[zone.shortName] || [];
          const pace = paceUnit === "km" ? zone.pacePerKm : zone.pacePerMile;
          const unit = paceUnit === "km" ? "/km" : "/mi";

          return (
            <div
              key={zone.shortName}
              className={`rounded-lg border ${colors.border} ${colors.bg} overflow-hidden`}
            >
              <div className={compact ? "p-2" : "p-3"}>
                {/* Badge + name inline */}
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div
                    className={`w-6 h-6 text-[10px] rounded-full flex items-center justify-center font-bold ${colors.badge}`}
                  >
                    {zone.shortName}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-xs truncate">
                    {zone.name}
                  </h3>
                </div>

                {/* Pace */}
                <p className={`font-bold font-mono tabular-nums ${colors.text} text-sm leading-tight`}>
                  {pace}
                </p>
                <p className="text-[9px] text-gray-400 mb-1.5">{unit}</p>

                {/* Workouts — compact list */}
                {!compact && workouts.length > 0 && (
                  <div className="border-t border-gray-100 pt-1.5 mt-1 space-y-0.5">
                    {workouts.map((w, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <Info className={`w-2.5 h-2.5 shrink-0 ${colors.text} opacity-50`} />
                        <p className="text-[10px] text-gray-500 truncate">{w.workout}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
