import { useState } from "react";
import type { TrainingWeek } from "../types";
import { WORKOUT_META, PHASE_META } from "../utils/planDisplay";
import { cn } from "@/lib/utils";

interface Props {
  week: TrainingWeek;
  isCurrent?: boolean;
  /** Expanded on first render. Defaults to `isCurrent` when omitted. */
  defaultOpen?: boolean;
}

export function WeekCard({ week, isCurrent = false, defaultOpen }: Props) {
  const [open, setOpen] = useState(defaultOpen ?? isCurrent);
  const phaseMeta = PHASE_META[week.phase];
  const panelId = `week-panel-${week.weekNumber}`;

  return (
    <div
      className={cn(
        "flex bg-white rounded-2xl border shadow-sm overflow-hidden",
        isCurrent ? "border-emerald-400 ring-2 ring-emerald-200" : "border-slate-200"
      )}
    >
      {/* Phase-colored rail */}
      <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: phaseMeta.bg }} />

      <div className="flex-1 min-w-0">
        {/* Week header */}
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={panelId}
          className="w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 text-left hover:bg-slate-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500 focus-visible:-outline-offset-2"
        >
          {/* Week number */}
          <div className="flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-slate-100 flex items-center justify-center">
            <span className="font-display text-sm font-bold text-slate-700">
              W{week.weekNumber}
            </span>
          </div>

          {/* Phase + focus */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                style={{ backgroundColor: phaseMeta.bg, color: phaseMeta.text }}
              >
                {phaseMeta.short}
              </span>
              {isCurrent && (
                <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white whitespace-nowrap">
                  THIS WEEK
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600 line-clamp-2 sm:line-clamp-1">
              {week.weeklyFocus}
            </p>
          </div>

          {/* Volume */}
          <div className="flex-shrink-0 text-right">
            <div className="font-display text-base font-bold text-emerald-600 tabular-nums">
              {week.totalKm} km
            </div>
            <div className="text-xs text-slate-400">{week.days.length} runs</div>
          </div>

          {/* Chevron */}
          <svg
            className={cn(
              "flex-shrink-0 w-4 h-4 text-slate-400 transition-transform",
              open && "rotate-180"
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Expanded days — rich day cards only, no duplicated list */}
        {open && (
          <div id={panelId} className="border-t border-slate-100 px-4 sm:px-5 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
              {week.days.map(({ day, workout }) => {
                const meta = WORKOUT_META[workout.type];
                const isRest = workout.type === "rest";
                return (
                  <div
                    key={day}
                    className={cn(
                      "rounded-xl border border-slate-200 bg-white p-3 flex flex-col",
                      isRest && "bg-slate-50 border-slate-100"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        {day}
                      </span>
                      <span
                        className="h-2 w-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: meta.bg }}
                      />
                    </div>

                    <span
                      className={cn(
                        "self-start inline-block text-[11px] font-bold px-2 py-0.5 rounded-full mb-2",
                        isRest && "opacity-80"
                      )}
                      style={{ backgroundColor: meta.bg, color: meta.text }}
                    >
                      {workout.label}
                    </span>

                    {!isRest && (
                      <div className="flex items-baseline gap-1.5 mb-1 font-display tabular-nums">
                        {workout.distanceKm !== undefined && workout.distanceKm > 0 && (
                          <span className="text-sm font-bold text-slate-800">
                            {workout.distanceKm} km
                          </span>
                        )}
                        {workout.paceZone && (
                          <span className="text-xs font-semibold text-emerald-600">
                            @ {workout.paceZone} pace
                          </span>
                        )}
                      </div>
                    )}

                    {!isRest && (
                      <p className="text-xs text-slate-500 leading-snug mt-auto">
                        {workout.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
