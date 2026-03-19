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
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className={`font-bold text-gray-900 ${compact ? "text-lg" : "text-xl sm:text-2xl"}`}>
            Training Paces
          </h2>
          <p className="text-xs text-gray-500">
            Daniels&apos; 5 zones &middot; VDOT {vdot}
          </p>
        </div>
        {!compact && (
          <div
            className="relative w-36 h-9 bg-indigo-100 rounded-full cursor-pointer overflow-hidden select-none"
            onClick={onTogglePaceUnit}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-[calc(50%-0.25rem)] h-8 bg-indigo-600 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
                paceUnit === "mi" ? "translate-x-full" : "translate-x-0"
              }`}
            />
            <div className="absolute inset-0 flex items-center">
              <div className={`w-1/2 text-center text-xs font-semibold transition-colors ${paceUnit === "km" ? "text-white" : "text-indigo-700"}`}>min/km</div>
              <div className={`w-1/2 text-center text-xs font-semibold transition-colors ${paceUnit === "mi" ? "text-white" : "text-indigo-700"}`}>min/mi</div>
            </div>
          </div>
        )}
      </div>

      {/* Zone cards grid */}
      <div className={`grid gap-3 ${compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"}`}>
        {zones.map((zone) => {
          const colors = getZoneColorClasses(zone.color);
          const workouts = ZONE_WORKOUTS[zone.shortName] || [];
          const pace = paceUnit === "km" ? zone.pacePerKm : zone.pacePerMile;
          const unit = paceUnit === "km" ? "min/km" : "min/mi";

          return (
            <div
              key={zone.shortName}
              className={`rounded-xl border ${colors.border} ${colors.bg} overflow-hidden transition-shadow hover:shadow-md`}
            >
              {/* Card header — colored top bar */}
              <div className={`h-1.5 ${colors.badge.split(" ")[0]}`} />

              <div className={compact ? "p-3" : "p-4"}>
                {/* Badge + zone name */}
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`${compact ? "w-8 h-8 text-xs" : "w-9 h-9 text-sm"} rounded-full flex items-center justify-center font-bold ${colors.badge}`}
                  >
                    {zone.shortName}
                  </div>
                  <div className="min-w-0">
                    <h3 className={`font-semibold text-gray-900 ${compact ? "text-sm" : ""}`}>
                      {zone.name}
                    </h3>
                    <span className="text-[10px] text-gray-400">
                      {zone.intensityRange} VO&#8322;max
                    </span>
                  </div>
                </div>

                {/* Pace — prominent display */}
                <div className={compact ? "mb-2" : "mb-3"}>
                  <p className={`font-bold font-mono tabular-nums ${colors.text} ${compact ? "text-base" : "text-lg"}`}>
                    {pace}
                  </p>
                  <p className="text-[10px] text-gray-400">{unit}</p>
                </div>

                {/* Description */}
                {!compact && (
                  <p className="text-xs text-gray-500 leading-relaxed mb-3">
                    {zone.description}
                  </p>
                )}

                {/* Sample workouts */}
                <div className={compact ? "space-y-1" : "space-y-1.5"}>
                  {workouts.map((w, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <Info className={`w-3 h-3 mt-0.5 shrink-0 ${colors.text} opacity-60`} />
                      <div>
                        <p className={`font-medium text-gray-700 ${compact ? "text-[10px]" : "text-xs"}`}>
                          {w.workout}
                        </p>
                        {!compact && (
                          <p className="text-[10px] text-gray-400">{w.detail}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
