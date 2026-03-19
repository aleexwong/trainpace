/**
 * TrainingZonesDisplay — Visual training zone cards with spectrum bar and expandable details
 * Supports compact mode for dashboard grid layout.
 * Uses a table-like structure so pace values align across all zones.
 */

import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";
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

function ZoneSpectrumBar() {
  const segments = [
    { label: "E", color: "bg-emerald-400", width: "w-[25%]" },
    { label: "M", color: "bg-blue-400", width: "w-[18%]" },
    { label: "T", color: "bg-yellow-400", width: "w-[14%]" },
    { label: "I", color: "bg-orange-400", width: "w-[18%]" },
    { label: "R", color: "bg-red-400", width: "w-[25%]" },
  ];

  return (
    <div className="mb-4">
      <div className="flex rounded-full overflow-hidden h-2.5">
        {segments.map((seg) => (
          <div key={seg.label} className={`${seg.color} ${seg.width}`} />
        ))}
      </div>
      <div className="flex mt-0.5">
        {segments.map((seg) => (
          <div key={seg.label} className={`${seg.width} text-center`}>
            <span className="text-[10px] font-semibold text-gray-500">{seg.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TrainingZonesDisplay({
  zones,
  paceUnit,
  vdot,
  onTogglePaceUnit,
  compact,
}: TrainingZonesDisplayProps) {
  const [expandedZone, setExpandedZone] = useState<string | null>(null);

  return (
    <div className={`bg-white rounded-2xl shadow-lg h-full ${compact ? "p-4" : "p-5 sm:p-8"}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
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

      <ZoneSpectrumBar />

      {/* Zone rows — table-like structure for alignment */}
      <div className={compact ? "space-y-2" : "space-y-3"}>
        {zones.map((zone) => {
          const colors = getZoneColorClasses(zone.color);
          const isExpanded = expandedZone === zone.shortName;
          const workouts = ZONE_WORKOUTS[zone.shortName] || [];

          return (
            <div
              key={zone.shortName}
              className={`rounded-xl border-2 transition-all duration-200 ${
                isExpanded ? `${colors.border} shadow-md` : "border-gray-100 hover:border-gray-200"
              }`}
            >
              <button
                onClick={() => setExpandedZone(isExpanded ? null : zone.shortName)}
                className={`w-full text-left ${compact ? "p-3" : "p-4"}`}
              >
                {/* Use CSS grid for consistent column widths */}
                <div className={`grid items-center gap-2 ${compact ? "grid-cols-[2rem_1fr_7rem_1rem]" : "grid-cols-[2.5rem_1fr_8.5rem_1rem]"}`}>
                  {/* Zone badge */}
                  <div
                    className={`${compact ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm"} rounded-full flex items-center justify-center font-bold ${colors.badge}`}
                  >
                    {zone.shortName}
                  </div>

                  {/* Zone name + intensity */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className={`font-semibold text-gray-900 ${compact ? "text-sm" : ""}`}>{zone.name}</h3>
                      <span className="text-[10px] text-gray-400 hidden sm:inline">{zone.intensityRange} VO&#8322;max</span>
                    </div>
                    {!compact && (
                      <p className="text-sm text-gray-500 truncate hidden sm:block">
                        {zone.description}
                      </p>
                    )}
                  </div>

                  {/* Pace — fixed width column for alignment */}
                  <div className="text-right">
                    <p className={`font-bold font-mono tabular-nums ${colors.text} ${compact ? "text-sm" : "text-base sm:text-lg"}`}>
                      {paceUnit === "km" ? zone.pacePerKm : zone.pacePerMile}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {paceUnit === "km" ? "min/km" : "min/mi"}
                    </p>
                  </div>

                  {/* Chevron */}
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 justify-self-center transition-transform duration-200 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className={`px-3 pb-3 border-t ${colors.border}`}>
                  <p className="text-sm text-gray-600 mt-2 mb-2">
                    {zone.description}
                  </p>
                  <div className="space-y-1.5">
                    {workouts.map((w, i) => (
                      <div key={i} className={`flex items-start gap-2 p-2 rounded-lg ${colors.bg}`}>
                        <Info className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${colors.text}`} />
                        <div>
                          <p className="text-xs font-medium text-gray-900">{w.workout}</p>
                          <p className="text-[11px] text-gray-500">{w.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
