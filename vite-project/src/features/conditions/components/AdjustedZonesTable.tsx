/**
 * AdjustedZonesTable — "what pace should I actually run today?"
 *
 * The race prediction is the headline, but this is the part most people will
 * use week to week. Each zone carries its own heat penalty because a 90-minute
 * long run and a set of 400m reps are not equally exposed — showing one blanket
 * adjustment for all five zones is what makes most hot-weather pace charts
 * feel wrong to experienced runners.
 */

import { cn } from "@/lib/utils";
import { formatPace } from "@/features/vdot-calculator/vdot-math";
import type { AdjustedZone, PaceUnit } from "../types";

const ZONE_ACCENT: Record<string, string> = {
  emerald: "bg-emerald-500",
  blue: "bg-blue-500",
  yellow: "bg-yellow-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
};

interface Props {
  zones: AdjustedZone[];
  paceUnit: PaceUnit;
  onTogglePaceUnit: () => void;
}

export function AdjustedZonesTable({
  zones,
  paceUnit,
  onTogglePaceUnit,
}: Props) {
  if (zones.length === 0) return null;
  const perKm = paceUnit === "km";

  return (
    <div className="bg-white rounded-2xl shadow-lg border-0 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Today&rsquo;s training paces
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Your normal zones, re-targeted for these conditions.
          </p>
        </div>
        <button
          type="button"
          onClick={onTogglePaceUnit}
          className="flex-shrink-0 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-full px-2.5 py-1 transition-colors"
        >
          min/{paceUnit}
        </button>
      </div>

      <div className="space-y-1.5">
        {zones.map((zone) => {
          const base = perKm
            ? zone.basePacePerKmSeconds
            : zone.basePacePerMileSeconds;
          const adjusted = perKm
            ? zone.adjustedPacePerKmSeconds
            : zone.adjustedPacePerMileSeconds;
          const changed = Math.round(adjusted[0] - base[0]) >= 1;

          return (
            <div
              key={zone.name}
              className="flex items-center gap-3 rounded-xl border border-gray-100 bg-slate-50/60 px-3 py-2.5"
              title={zone.description}
            >
              <span
                className={cn(
                  "flex-shrink-0 w-7 h-7 rounded-lg grid place-items-center text-xs font-black text-white",
                  ZONE_ACCENT[zone.color] ?? "bg-gray-400"
                )}
              >
                {zone.shortName}
              </span>

              <span className="flex-1 text-sm font-semibold text-gray-800 min-w-0 truncate">
                {zone.name}
              </span>

              {changed && (
                <span className="hidden sm:inline text-xs text-gray-400 tabular-nums line-through decoration-1">
                  {formatPace(base[0])}–{formatPace(base[1])}
                </span>
              )}

              <span
                className={cn(
                  "text-sm font-bold tabular-nums whitespace-nowrap",
                  changed ? "text-emerald-700" : "text-gray-700"
                )}
              >
                {formatPace(adjusted[0])}–{formatPace(adjusted[1])}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
        Easy and long-run paces move the most — they&rsquo;re the sessions where
        heat has time to accumulate. Short reps barely shift, so resist the urge
        to chase interval splits on a hot day; the effort is already higher than
        the watch suggests.
      </p>
    </div>
  );
}
