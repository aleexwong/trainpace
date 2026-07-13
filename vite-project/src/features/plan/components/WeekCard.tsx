import { useState } from "react";
import type { RunDay, TrainingWeek } from "../types";
import { WORKOUT_META, PHASE_META } from "../utils/planDisplay";
import { cn } from "@/lib/utils";

export interface WeekCardProgress {
  isComplete: (day: RunDay) => boolean;
  onToggle: (day: RunDay) => void;
  pending?: (day: RunDay) => boolean;
}

interface Props {
  week: TrainingWeek;
  isCurrent?: boolean;
  /** Expanded on first render. Defaults to `isCurrent` when omitted. */
  defaultOpen?: boolean;
  /** Omit for exact current read-only rendering (dashboard back-compat). */
  progress?: WeekCardProgress;
}

export function WeekCard({ week, isCurrent = false, defaultOpen, progress }: Props) {
  const [open, setOpen] = useState(defaultOpen ?? isCurrent);
  const phaseMeta = PHASE_META[week.phase];
  const panelId = `week-panel-${week.weekNumber}`;

  const trackableDays = week.days.filter((d) => d.workout.type !== "rest");
  const completedCount = progress
    ? trackableDays.filter((d) => progress.isComplete(d.day)).length
    : 0;
  const totalCount = trackableDays.length;

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
            {progress ? (
              <div className="text-xs font-semibold text-slate-500 tabular-nums">
                {completedCount}/{totalCount} runs
              </div>
            ) : (
              <div className="text-xs text-slate-400">{week.days.length} runs</div>
            )}
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

        {/* Thin progress bar — only when progress tracking is wired in */}
        {progress && totalCount > 0 && (
          <div className="px-4 sm:px-5 -mt-1 pb-3">
            <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Expanded days — rich day cards only, no duplicated list */}
        {open && (
          <div id={panelId} className="border-t border-slate-100 px-4 sm:px-5 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
              {week.days.map(({ day, workout }) => {
                const meta = WORKOUT_META[workout.type];
                const isRest = workout.type === "rest";
                const done = !isRest && progress ? progress.isComplete(day) : false;
                const pendingToggle = !isRest && progress?.pending ? progress.pending(day) : false;
                return (
                  <div
                    key={day}
                    className={cn(
                      "rounded-xl border border-slate-200 bg-white p-3 flex flex-col",
                      isRest && "bg-slate-50 border-slate-100",
                      done && "border-emerald-200 bg-emerald-50/40"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        {day}
                      </span>
                      <div className="flex items-center gap-2">
                        {/* Workout-type dot is redundant with the toggle once progress
                            tracking is wired in (the label pill below still carries color). */}
                        {!(progress && !isRest) && (
                          <span
                            className="h-2 w-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: meta.bg }}
                          />
                        )}
                        {!isRest && progress && (
                          <button
                            type="button"
                            onClick={() => progress.onToggle(day)}
                            disabled={pendingToggle}
                            aria-pressed={done}
                            aria-label={`Mark ${day} ${workout.label} as ${done ? "not done" : "done"}`}
                            className={cn(
                              "flex-shrink-0 h-5 w-5 p-0 rounded-full border-2 flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500 focus-visible:outline-offset-1",
                              done
                                ? "bg-emerald-600 border-emerald-600 text-white"
                                : "bg-white border-slate-300 text-transparent hover:border-emerald-400",
                              pendingToggle && "opacity-50 cursor-wait"
                            )}
                          >
                            <svg
                              className="h-3 w-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                              aria-hidden="true"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        )}
                      </div>
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
